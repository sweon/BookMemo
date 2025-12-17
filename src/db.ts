import Dexie, { type Table } from 'dexie';

export interface Log {
    id?: number;
    title: string;
    content: string; // Markdown content
    modelId?: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Model {
    id?: number;
    name: string;
    isDefault?: boolean;
}

export interface Comment {
    id?: number;
    logId: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export class LLMLogDatabase extends Dexie {
    logs!: Table<Log>;
    models!: Table<Model>;
    comments!: Table<Comment>;

    constructor() {
        super('LLMLogDB');
        this.version(1).stores({
            logs: '++id, title, *tags, modelId, createdAt, updatedAt', // Primary key and indexed props
            models: '++id, name',
            comments: '++id, logId, createdAt'
        });
    }
}

export const db = new LLMLogDatabase();

// Seed default model if not exists
db.on('populate', () => {
    db.models.add({ name: 'GPT-4', isDefault: true });
    db.models.add({ name: 'Claude 3.5 Sonnet' });
    db.models.add({ name: 'Gemini 1.5 Pro' });
});
