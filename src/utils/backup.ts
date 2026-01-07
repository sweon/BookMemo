import { db } from '../db';



// Since I didn't install file-saver, I'll implement a simple download function
// Since I didn't install file-saver, I'll implement a simple download function
const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
};


export const getBackupData = async (memoIds?: number[]) => {
    let memos = await db.memos.toArray();
    let comments = await db.comments.toArray();

    if (memoIds && memoIds.length > 0) {
        memos = memos.filter(l => l.id !== undefined && memoIds.includes(l.id));
        comments = comments.filter(c => memoIds.includes(c.memoId));
    }

    return {
        version: 1,
        timestamp: new Date().toISOString(),
        memos,
        comments
    };
};

export const exportData = async (selectedMemoIds?: number[], customFileName?: string) => {
    let data = await getBackupData(selectedMemoIds);

    let fileName = customFileName;
    if (!fileName) {
        fileName = selectedMemoIds && selectedMemoIds.length > 0
            ? `bookmemo-partial-${new Date().toISOString().slice(0, 10)}.json`
            : `bookmemo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    }

    if (!fileName.toLowerCase().endsWith('.json')) {
        fileName += '.json';
    }

    downloadFile(JSON.stringify(data, null, 2), fileName, 'application/json');
};


export const importData = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);
                await mergeBackupData(data);
                resolve();
            } catch (err) {
                reject(err);
            }
        };

        reader.readAsText(file);
    });
};

export const mergeBackupData = async (data: any) => {
    if (!data.memos && !data.logs) {
        throw new Error('Invalid backup file format');
    }

    const memos = data.memos || data.logs; // Support legacy migration if needed, but primarily memos

    await db.transaction('rw', db.memos, db.comments, async () => {
        const memoIdMap = new Map<number, number>();

        for (const l of memos) {
            const oldId = l.id; // Store old ID for mapping comments

            // Check if memo already exists (by some criteria? or just always add?)
            // Requirement says "Merge".
            // Let's check if a memo with same Title and CreatedAt exists? 
            // This prevents duplicate imports of the same backup.
            let existingMemo = null;
            /* 
               Dexie doesn't support multi-key unique constraint easily on object store creation unless specified.
               We will check manually.
           */
            // Hydrate dates first for comparison
            const createdAt = typeof l.createdAt === 'string' ? new Date(l.createdAt) : l.createdAt;

            // Try to find exact match
            const potentialMatches = await db.memos.where('title').equals(l.title).toArray();
            existingMemo = potentialMatches.find(pl => Math.abs(pl.createdAt.getTime() - createdAt.getTime()) < 1000); // 1s tolerance

            if (existingMemo) {
                memoIdMap.set(oldId, existingMemo.id!);
            } else {
                const { id, ...memoData } = l;
                memoData.createdAt = createdAt;
                memoData.updatedAt = typeof l.updatedAt === 'string' ? new Date(l.updatedAt) : l.updatedAt;

                const newId = await db.memos.add(memoData);
                memoIdMap.set(oldId, newId as number);
            }
        }

        if (data.comments) {
            for (const c of data.comments) {
                const { id, ...commentData } = c;
                commentData.createdAt = typeof c.createdAt === 'string' ? new Date(c.createdAt) : c.createdAt;
                commentData.updatedAt = typeof c.updatedAt === 'string' ? new Date(c.updatedAt) : c.updatedAt;

                // Handle legacy logId if present
                const oldOwnerId = c.memoId !== undefined ? c.memoId : c.logId;

                if (oldOwnerId && memoIdMap.has(oldOwnerId)) {
                    commentData.memoId = memoIdMap.get(oldOwnerId);
                    delete commentData.logId; // Clean up legacy

                    // Check for duplicates? Content + Date + MemoId
                    const duplicates = await db.comments.where('memoId').equals(commentData.memoId).toArray();
                    const exists = duplicates.some(d =>
                        d.content === commentData.content &&
                        Math.abs(d.createdAt.getTime() - commentData.createdAt.getTime()) < 1000
                    );

                    if (!exists) {
                        await db.comments.add(commentData);
                    }
                }
            }
        }
    });
};
