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

    public async initialize(roomId: string): Promise<string> {
        this.isHost = true;
        this.isInitiator = false;

        this.options.onStatusChange('connecting', 'Connecting to global sync network...');

        if (this.peer && !this.peer.destroyed) {
            if (this.peer.id === cleanRoomId(roomId)) {
                return this.peer.id;
            }
            this.peer.destroy();
            await new Promise(r => setTimeout(r, 800));
        }

        return new Promise((resolve, reject) => {
            const cleanId = cleanRoomId(roomId);

            // Explicitly configuring PeerJS Cloud Server for better reliability
            this.peer = new Peer(cleanId, {
                host: '0.peerjs.com',
                port: 443,
                path: '/',
                secure: true,
                debug: 2,
                config: {
                    'iceServers': [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ],
                    iceCandidatePoolSize: 10
                }
            });

            this.peer.on('open', (id) => {
                console.log('Successfully registered with signaling server:', id);
                this.options.onStatusChange('ready', `Room: ${id}`);
                resolve(id);
            });

            this.peer.on('connection', (conn) => {
                this.handleConnection(conn);
            });

            this.peer.on('error', (err: any) => {
                console.error('PeerJS Specific Error:', err.type, err);

                let userFriendlyMsg = `Error: ${err.type}`;
                if (err.type === 'unavailable-id') {
                    userFriendlyMsg = 'Room ID is already taken. Please refresh.';
                } else if (err.type === 'network') {
                    userFriendlyMsg = 'Server unreachable. Check your internet/firewall.';
                } else if (err.type === 'server-error') {
                    userFriendlyMsg = 'Signaling server is busy. Try again later.';
                }

                this.options.onStatusChange('error', userFriendlyMsg);

                // Don't reject if we are just disconnected from server but P2P might work
                if (!this.conn?.open) {
                    reject(err);
                }
            });

            this.peer.on('disconnected', () => {
                console.warn('Disconnected from signaling server.');
                // Only try to reconnect once after a small delay to avoid spamming the server
                if (this.peer && !this.peer.destroyed && !this.conn?.open) {
                    this.options.onStatusChange('connecting', 'Waiting for server reconnect...');
                    setTimeout(() => {
                        if (this.peer && !this.peer.destroyed && this.peer.disconnected) {
                            this.peer.reconnect();
                        }
                    }, 5000);
                }
            });
        });
    }

    public async connect(targetPeerId: string) {
        const cleanTargetId = cleanRoomId(targetPeerId);

        this.isHost = false;
        this.isInitiator = true;

        const initiateP2P = () => {
            this.options.onStatusChange('connecting', `Dialing ${cleanTargetId}...`);
            this._connect(cleanTargetId);
        };

        if (!this.peer || this.peer.destroyed) {
            this.options.onStatusChange('connecting', 'Initializing link...');
            this.peer = new Peer({
                host: '0.peerjs.com',
                port: 443,
                path: '/',
                secure: true,
                debug: 2,
                config: {
                    'iceServers': [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ],
                    iceCandidatePoolSize: 10
                }
            });

            this.peer.on('open', initiateP2P);
            this.peer.on('error', (err: any) => {
                console.error('Client PeerJS Error:', err.type);
                if (!this.conn?.open) {
                    this.options.onStatusChange('error', `Server link failed (${err.type})`);
                }
            });
        } else {
            initiateP2P();
        }
    }

    private _connect(targetPeerId: string) {
        if (!this.peer || this.peer.destroyed || this.peer.disconnected) {
            // If disconnected from server, try to reconnect first
            if (this.peer && this.peer.disconnected) {
                this.peer.reconnect();
                // Wait a bit and try again
                setTimeout(() => this._connect(targetPeerId), 2000);
                return;
            }
            return;
        }

        const conn = this.peer.connect(targetPeerId);

        this.handleConnection(conn);
    }

    private handleConnection(conn: DataConnection) {
        // Prevent duplicate connection handling for the same peer
        if (this.conn && this.conn.peer === conn.peer && this.conn.open) {
            console.log('Ignoring redundant connection from:', conn.peer);
            return;
        }

        if (this.conn) {
            this.conn.close();
        }

        this.conn = conn;

        conn.on('open', async () => {
            console.log('Data channel open with:', conn.peer);
            this.options.onStatusChange('connected', 'Peers linked.');

            this.lastPong = Date.now();
            this.startHeartbeat();

            // Sequential Sync: Initiator (Client) sends first
            if (this.isInitiator) {
                console.log('Initiating data transfer...');
                this.options.onStatusChange('syncing', 'Connected. Preparing data...');
                setTimeout(() => this.syncData(), 1500); // Slightly longer delay for mobile stability
            }
        });

        conn.on('data', async (data: any) => {
            if (data?.type === 'ping') {
                this.conn?.send({ type: 'pong' });
                return;
            }
            if (data?.type === 'pong') {
                this.lastPong = Date.now();
                return;
            }

            // Sync Payload
            if (data && data.logs && data.models) {
                const logCount = data.logs.length;
                this.options.onStatusChange('syncing', `Merging ${logCount} logs...`);

                try {
                    await mergeBackupData(data);
                    console.log('Merge complete.');

                    // Host: Now send our data back to client to complete bilateral sync
                    if (this.isHost) {
                        this.options.onStatusChange('syncing', 'Updating client with merged data...');
                        setTimeout(() => this.syncData(), 500);
                    } else {
                        // Client: We are done
                        this.options.onStatusChange('completed', 'Sync finalized.');
                        this.options.onDataReceived();
                    }
                } catch (err: any) {
                    this.options.onStatusChange('error', `Sync failed: ${err.message}`);
                }
            }
        });

        conn.on('close', () => {
            console.log('Connection closed.');
            this.stopHeartbeat();
            if (this.conn === conn) {
                this.options.onStatusChange('disconnected', 'Disconnected');
                this.conn = null;
            }
        });

        conn.on('error', (err) => {
            console.error('Socket error:', err);
            this.options.onStatusChange('error', 'Socket error occurred.');
        });
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.conn && this.conn.open) {
                if (Date.now() - this.lastPong > 20000) {
                    console.warn('Heartbeat timeout.');
                    this.conn.close();
                    return;
                }
                this.conn.send({ type: 'ping' });
            } else {
                this.stopHeartbeat();
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

        try {
            const data = await getBackupData();
            if (this.conn && this.conn.open) {
                console.log('Sending payload, size:', data.logs.length);
                this.conn.send(data);
            }
        } catch (err: any) {
            this.options.onStatusChange('error', 'Data preparation failed.');
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
