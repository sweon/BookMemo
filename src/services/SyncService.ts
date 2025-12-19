import Peer, { type DataConnection } from 'peerjs';
import { getBackupData, mergeBackupData } from '../utils/backup';

export type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'completed' | 'error';

export interface SyncServiceOptions {
    onStatusChange: (status: SyncStatus, message?: string) => void;
    onDataReceived: () => void;
}

export class SyncService {
    private peer: Peer | null = null;
    private conn: DataConnection | null = null;
    private options: SyncServiceOptions;
    private heartbeatInterval: any = null;

    constructor(options: SyncServiceOptions) {
        this.options = options;
    }

    public async initialize(roomId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.peer) {
                this.peer.destroy();
            }

            // Clean the ID to be safe for PeerJS
            const cleanId = roomId.replace(/[^a-zA-Z0-9_-]/g, '-');
            this.peer = new Peer(cleanId);

            this.peer.on('open', (id) => {
                this.options.onStatusChange('connected', `Host ID: ${id}`);
                resolve(id);
            });

            this.peer.on('connection', (conn) => {
                this.handleConnection(conn);
            });

            this.peer.on('error', (err) => {
                this.options.onStatusChange('error', `Peer Error: ${err.message}`);
                reject(err);
            });
        });
    }

    public connect(targetPeerId: string) {
        if (!this.peer) {
            // If connecting as client without hosting, we need a random ID
            this.peer = new Peer();
            this.peer.on('open', () => {
                this._connect(targetPeerId);
            });
            this.peer.on('error', (err) => {
                this.options.onStatusChange('error', `Peer Error: ${err.message}`);
            });
        } else {
            this._connect(targetPeerId);
        }
    }

    private _connect(targetPeerId: string) {
        this.options.onStatusChange('connecting', `Connecting to ${targetPeerId}...`);
        if (!this.peer) return;

        const conn = this.peer.connect(targetPeerId);
        this.handleConnection(conn);
    }

    private handleConnection(conn: DataConnection) {
        this.conn = conn;

        conn.on('open', async () => {
            this.options.onStatusChange('connected', 'Peer Connected!');

            // Start Heartbeat
            this.startHeartbeat();

            // Auto sync on connect?
            // Let's send our data immediately
            await this.syncData();
        });

        conn.on('data', async (data: any) => {
            // Handle Heartbeat
            if (data && data.type === 'ping') {
                return;
            }

            this.options.onStatusChange('syncing', 'Receiving data...');
            try {
                await mergeBackupData(data);
                this.options.onStatusChange('completed', 'Sync Completed Successfully!');
                this.options.onDataReceived();
            } catch (err: any) {
                this.options.onStatusChange('error', `Sync Failed: ${err.message}`);
            }
        });

        conn.on('close', () => {
            this.stopHeartbeat();
            this.options.onStatusChange('disconnected', 'Connection Closed');
            this.conn = null;
        });

        conn.on('error', (err) => {
            this.stopHeartbeat();
            this.options.onStatusChange('error', `Connection Error: ${err.message}`);
        });
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.conn && this.conn.open) {
                this.conn.send({ type: 'ping' });
            }
        }, 5000); // Send ping every 5 seconds
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    public async syncData() {
        if (!this.conn) return;

        this.options.onStatusChange('syncing', 'Sending data...');
        try {
            const data = await getBackupData();
            this.conn.send(data);
            // We don't say complete here, we wait for their data? 
            // The requirement says "Bidirectional".
            // If we send, they receive. They also send?
            // This loop might be infinite if we are not careful.
            // But usually we just trigger "Send" once on connect. 
            // If both sides send on connect, we are good.
        } catch (err: any) {
            this.options.onStatusChange('error', `Send Failed: ${err.message}`);
        }
    }

    public destroy() {
        this.stopHeartbeat();
        if (this.conn) {
            this.conn.close();
        }
        if (this.peer) {
            this.peer.destroy();
        }
    }
}
