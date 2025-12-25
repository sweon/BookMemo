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
    private connectionTimeout: any = null;

    constructor(options: SyncServiceOptions) {
        this.options = options;
        this.handleConnection = this.handleConnection.bind(this);
    }

    private getPeerConfig() {
        return {
            debug: 2,
            secure: true,
            config: {
                'iceServers': [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        };
    }

    public async initialize(roomId: string): Promise<string> {
        this.destroy();
        this.isHost = true;
        this.isInitiator = false;

        this.options.onStatusChange('connecting', 'Waiting for connection...');

        return new Promise((resolve, reject) => {
            const cleanId = cleanRoomId(roomId);
            this.peer = new Peer(cleanId, this.getPeerConfig());

            this.peer.on('open', (id) => {
                this.options.onStatusChange('ready', `Room ID: ${id}`);
                resolve(id);
            });

            this.peer.on('connection', (conn) => {
                console.log('New peer connection request');
                this.handleConnection(conn);
            });

            this.peer.on('error', (err: any) => {
                console.error('Peer error:', err.type);
                this.options.onStatusChange('error', `Peer Error: ${err.type}`);
                reject(err);
            });
        });
    }

    public connect(targetPeerId: string) {
        this.destroy();
        this.isHost = false;
        this.isInitiator = true;

        this.options.onStatusChange('connecting', 'Initializing client...');

        this.peer = new Peer(this.getPeerConfig());

        this.peer.on('open', (id) => {
            console.log('Client identity ready:', id);
            this.options.onStatusChange('connecting', `Dialing ${targetPeerId}...`);

            // Small delay to ensure the signaling server has registered our new ID
            setTimeout(() => {
                this._connect(cleanRoomId(targetPeerId));
            }, 500);
        });

        this.peer.on('error', (err: any) => {
            console.error('Client Error:', err.type);
            this.options.onStatusChange('error', `Connection failed: ${err.type}`);
        });
    }

    private _connect(targetPeerId: string) {
        if (!this.peer || this.peer.destroyed) return;

        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
        this.connectionTimeout = setTimeout(() => {
            if (this.conn && !this.conn.open) {
                this.options.onStatusChange('error', 'Connection timed out. Please retry.');
            }
        }, 20000); // 20 seconds timeout for mobile networks

        const conn = this.peer.connect(targetPeerId, {
            reliable: true
        });
        this.handleConnection(conn);
    }

    private handleConnection(conn: DataConnection) {
        if (this.conn) {
            this.conn.close();
        }
        this.conn = conn;

        conn.on('open', () => {
            if (this.connectionTimeout) {
                clearTimeout(this.connectionTimeout);
                this.connectionTimeout = null;
            }

            console.log('Stable connection with:', conn.peer);
            this.options.onStatusChange('connected', 'Linked!');
            this.lastPong = Date.now();
            this.startHeartbeat();

            if (this.isInitiator) {
                this.options.onStatusChange('syncing', 'Uploading data...');
                setTimeout(() => this.syncData(), 1000);
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

            if (data && data.logs && data.models) {
                const count = data.logs.length;
                this.options.onStatusChange('syncing', `Syncing ${count} logs...`);

                try {
                    await mergeBackupData(data);

                    if (this.isHost) {
                        this.options.onStatusChange('syncing', 'Updating peer...');
                        setTimeout(() => this.syncData(), 500);
                    } else {
                        this.options.onStatusChange('completed', 'Sync Successful!');
                        this.options.onDataReceived();
                    }
                } catch (err: any) {
                    this.options.onStatusChange('error', `Sync failed: ${err.message}`);
                }
            }
        });

        conn.on('close', () => {
            this.stopHeartbeat();
            if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
            if (this.conn === conn) {
                this.options.onStatusChange('disconnected', 'Disconnected');
                this.conn = null;
            }
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
            this.options.onStatusChange('error', 'Connection failed');
        });
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
        try {
            const data = await getBackupData();
            if (this.conn && this.conn.open) {
                this.conn.send(data);
            }
        } catch (err) {
            this.options.onStatusChange('error', 'Data sync failed');
        }
    }

    public destroy() {
        this.stopHeartbeat();
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
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
