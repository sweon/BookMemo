import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { exportData, importData } from '../utils/backup';
import { FiTrash2, FiPlus, FiDownload, FiUpload } from 'react-icons/fi';

const Container = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Section = styled.div`
  margin-bottom: 3rem;
`;

const Title = styled.h2`
  margin-bottom: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding-bottom: 0.5rem;
`;

const ModelList = styled.ul`
  list-style: none;
  padding: 0;
`;

const ModelItem = styled.li`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 6px;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
  &:hover { color: ${({ theme }) => theme.colors.danger}; }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const SettingsPage: React.FC = () => {
    const models = useLiveQuery(() => db.models.toArray());
    const [newModel, setNewModel] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddModel = async () => {
        if (newModel.trim()) {
            await db.models.add({ name: newModel.trim() });
            setNewModel('');
        }
    };

    const handleDeleteModel = async (id: number) => {
        if (confirm('Delete this model? Existing logs linked to this model will lose the reference.')) {
            await db.models.delete(id);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (confirm('Import data? This will merge with existing data.')) {
                try {
                    await importData(file);
                    alert('Import successful!');
                } catch (err) {
                    alert('Import failed: ' + err);
                }
            }
        }
    };

    return (
        <Container>
            <Section>
                <Title>Manage LLM Models</Title>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <Input
                        value={newModel}
                        onChange={e => setNewModel(e.target.value)}
                        placeholder="Add new model name..."
                    />
                    <Button onClick={handleAddModel} disabled={!newModel.trim()}><FiPlus /> Add</Button>
                </div>

                <ModelList>
                    {models?.map(m => (
                        <ModelItem key={m.id}>
                            <span style={{ flex: 1 }}>{m.name}</span>
                            <IconButton onClick={() => handleDeleteModel(m.id!)}><FiTrash2 /></IconButton>
                        </ModelItem>
                    ))}
                </ModelList>
            </Section>

            <Section>
                <Title>Data Management</Title>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button onClick={exportData}><FiDownload /> Export / Backup</Button>

                    <Button onClick={() => fileInputRef.current?.click()} style={{ background: '#10b981' }}>
                        <FiUpload /> Import / Restore
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".json"
                        onChange={handleImport}
                    />
                </div>
                <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
                    Note: Importing merges data. Duplicate items (by ID) are treated as new entries with mapped relationships.
                </p>
            </Section>
        </Container>
    );
};
