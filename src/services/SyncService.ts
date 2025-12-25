import Peer, { type DataConnection } from 'peerjs';
import { getBackupData, mergeBackupData } from '../utils/backup';

export type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'completed' | 'error' | 'ready';

export interface SyncServiceOptions {
    onStatusChange: (status: SyncStatus, message?: string) => void;
    onDataReceived: () => void;
}

export const cleanRoomId = (roomId: string): string => {
    return roomId.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
};

export class SyncService {
    private peer: Peer | null = null;
    private conn: DataConnection | null = null;
    private options: SyncServiceOptions;
    private heartbeatInterval: any = null;
    private lastPong: number = 0;
    private isHost: boolean = false;
    private isInitiator: boolean = false;

    constructor(options: SyncServiceOptions) {
        this.options = options;
        this.handleConnection = this.handleConnection.bind(this);
    }

    private async getOrCreatePeer(requestedId?: string): Promise<Peer> {
        const cleanId = requestedId ? cleanRoomId(requestedId) : undefined;

        // If we already have a peer that matches our needs, reuse it
        if (this.peer && !this.peer.destroyed && this.peer.open) {
            if (!cleanId || this.peer.id === cleanId) {
                console.log('Reusing existing peer:', this.peer.id);
                return this.peer;
            }
            console.log('Peer ID mismatch or new ID requested, destroying old peer...');
            this.destroy();
        }

        // Give a small moment for previous peer to fully disconnect from signaling server
        await new Promise(r => setTimeout(r, 300));

        return new Promise((resolve, reject) => {
            console.log(cleanId ? `Registering peer with ID: ${cleanId}` : 'Registering peer with random ID');

            const peerConfig = {
                debug: 3,
                secure: true,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            };

            this.peer = cleanId ? new Peer(cleanId, peerConfig) : new Peer(peerConfig);

            const timeout = setTimeout(() => {
                if (this.peer && !this.peer.open) {
                    this.options.onStatusChange('error', 'Signaling server timeout. Please refresh.');
                    this.destroy();
                    reject(new Error('Signaling Timeout'));
                }
            }, 10000);

            this.peer.on('open', (id) => {
                clearTimeout(timeout);
                console.log('Peer successfully opened with ID:', id);
                resolve(this.peer!);
            });

            this.peer.on('connection', (conn) => {
                console.log('Incoming connection from:', conn.peer);
                this.handleConnection(conn);
            });

            this.peer.on('error', (err: any) => {
                clearTimeout(timeout);
                console.error('Peer Error State:', err.type, err);

                if (err.type === 'unavailable-id') {
                    this.options.onStatusChange('error', 'Room ID already taken. Try another.');
                } else if (err.type === 'peer-unavailable') {
                    this.options.onStatusChange('error', 'Target device not found. Check the ID.');
                } else {
                    this.options.onStatusChange('error', `Connection error: ${err.type}`);
                }

                this.destroy();
                reject(err);
            });

            this.peer.on('disconnected', () => {
                console.log('Peer disconnected from signaling server, attempting reconnect...');
                this.peer?.reconnect();
            });
        });
    }

    public async initialize(roomId: string): Promise<string> {
        this.isHost = true;
        this.isInitiator = false;
        this.options.onStatusChange('connecting', 'Preparing host...');

        try {
            const peer = await this.getOrCreatePeer(roomId);
            this.options.onStatusChange('ready', `Room ID: ${peer.id}`);
            return peer.id;
        } catch (e) {
            console.error('Failed to initialize host:', e);
            throw e;
        }
    }

    public async connect(targetPeerId: string) {
        this.isHost = false;
        this.isInitiator = true;
        this.options.onStatusChange('connecting', 'Establishing identity...');

        try {
            await this.getOrCreatePeer();
            this.options.onStatusChange('connecting', `Dialing ${targetPeerId}...`);
            this._connect(cleanRoomId(targetPeerId));
        } catch (e) {
            console.error('Failed to initialize client:', e);
        }
    }

    private _connect(targetPeerId: string) {
        if (!this.peer || this.peer.destroyed || !this.peer.open) {
            this.options.onStatusChange('error', 'Link lost. Reconnecting...');
            return;
        }

        console.log(`Connecting to ${targetPeerId} using binary serialization...`);
        const conn = this.peer.connect(targetPeerId, {
            serialization: 'binary'
        });
        this.handleConnection(conn);
    }

    private chunkBuffer: Map<string, string[]> = new Map();

    private handleConnection(conn: any) { // using any because we need to access dataChannel
        if (this.conn) {
            this.conn.close();
        }
        this.conn = conn;

        conn.on('open', () => {
            console.log('Data channel fully open with:', conn.peer);
            this.options.onStatusChange('connected', 'Linked!');
            this.lastPong = Date.now();
            this.startHeartbeat();

            if (this.isInitiator) {
                this.options.onStatusChange('syncing', 'Syncing...');
                setTimeout(() => this.syncData(), 800);
            }
        });

        conn.on('data', async (data: any) => {
            if (data === 'ping') {
                this.conn?.send('pong');
                return;
            }
            if (data === 'pong') {
                this.lastPong = Date.now();
                return;
            }

            // Handle chunked data
            if (data && typeof data === 'object' && data.type === 'chunk') {
                const { id, index, total, data: chunkData } = data;

                if (!this.chunkBuffer.has(id)) {
                    this.chunkBuffer.set(id, new Array(total).fill(null));
                }

                const buffer = this.chunkBuffer.get(id)!;
                buffer[index] = chunkData;

                const receivedCount = buffer.filter(c => c !== null).length;
                const progress = Math.round((receivedCount / total) * 100);
                this.options.onStatusChange('syncing', `Receiving: ${progress}%`);

                if (receivedCount === total) {
                    const fullDataStr = buffer.join('');
                    this.chunkBuffer.delete(id);
                    try {
                        const parsedData = JSON.parse(fullDataStr);
                        await this.processReceivedData(parsedData);
                    } catch (err: any) {
                        this.options.onStatusChange('error', `Parse error: ${err.message}`);
                    }
                }
                return;
            }

            // Handle legacy/un-chunked data
            if (data && data.logs && data.models) {
                await this.processReceivedData(data);
            }
        });

        conn.on('close', () => {
            this.stopHeartbeat();
            if (this.conn === conn) {
                this.options.onStatusChange('disconnected', 'Disconnected');
                this.conn = null;
            }
        });

        conn.on('error', (err: any) => {
            console.error('Data Session Error:', err);
            this.options.onStatusChange('error', 'Connection failed');
        });
    }

    private async processReceivedData(data: any) {
        if (data && data.logs && data.models) {
            const count = data.logs.length;
            this.options.onStatusChange('syncing', `Merging ${count} logs...`);

            try {
                await mergeBackupData(data);

                if (this.isHost) {
                    this.options.onStatusChange('syncing', 'Updating peer...');
                    setTimeout(() => this.syncData(), 500);
                } else {
                    this.options.onStatusChange('completed', 'Sync Completed!');
                    this.options.onDataReceived();
                }
            } catch (err: any) {
                this.options.onStatusChange('error', `Merge error: ${err.message}`);
            }
        }
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.conn && this.conn.open) {
                if (Date.now() - this.lastPong > 30000) {
                    this.conn.close();
                    return;
                }
                this.conn.send('ping');
            }
        }, 5000);
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    public async syncData() {
        if (!this.conn || !this.conn.open) return;

        // Wait up to 2s for internal dataChannel to be initialized if not already
        const connWithChannel = this.conn as any;
        let channel = connWithChannel.dataChannel;
        let attempts = 0;
        while (!channel && attempts < 20) {
            await new Promise(r => setTimeout(r, 100));
            channel = connWithChannel.dataChannel;
            attempts++;
        }

        if (!channel) {
            console.error('Data channel not found after waiting');
            this.options.onStatusChange('error', 'Channel initialization failed');
            return;
        }

        try {
            console.log('Preparing sync packet...');
            const data = await getBackupData();
            const jsonStr = JSON.stringify(data);
            const CHUNK_SIZE = 8192; // 8KB per chunk for better reliability
            const totalChunks = Math.ceil(jsonStr.length / CHUNK_SIZE);
            const syncId = Math.random().toString(36).substring(2, 10);

            console.log(`Sending ${totalChunks} chunks, total size: ${jsonStr.length} bytes`);

            for (let i = 0; i < totalChunks; i++) {
                // Flow control: Wait if buffer is getting full
                // Added safety check to prevent infinite loop
                let waitCount = 0;
                while (channel && channel.bufferedAmount > 128 * 1024 && waitCount < 100) {
                    if (!this.conn || !this.conn.open) break;
                    await new Promise(r => setTimeout(r, 50));
                    waitCount++;
                }

                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, jsonStr.length);
                const chunk = jsonStr.substring(start, end);

                if (this.conn && this.conn.open) {
                    this.conn.send({
                        type: 'chunk',
                        id: syncId,
                        index: i,
                        total: totalChunks,
                        data: chunk
                    });
                }

                // Small yield to UI thread
                if (i % 8 === 0) {
                    await new Promise(r => setTimeout(r, 20));
                }
            }
            console.log('All chunks sent.');
        } catch (err) {
            console.error('Sync data construction failed:', err);
            this.options.onStatusChange('error', 'Sync data failed');
        }
    }

    public destroy() {
        this.stopHeartbeat();
        if (this.conn) {
            this.conn.close();
            this.conn = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
    }
}
