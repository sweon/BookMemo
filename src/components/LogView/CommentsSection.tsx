import React, { useState } from 'react';
import styled from 'styled-components';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { Comment } from '../../db';
import { MarkdownEditor } from '../Editor/MarkdownEditor';
import { MarkdownView } from '../Editor/MarkdownView';
import { FiEdit2, FiTrash2, FiPlus, FiSave, FiX } from 'react-icons/fi';
import { format } from 'date-fns';
import { useTheme } from '../../contexts/ThemeContext';

const Section = styled.div`
  margin-top: 3rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: 2rem;
`;

const SectionHeader = styled.h3`
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const CommentItem = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.surface};
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionIcon = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const AddButton = styled.button`
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  cursor: pointer;
`;

const CancelButton = styled.button`
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => theme.colors.surface};
  }
`;

export const CommentsSection: React.FC<{ logId: number }> = ({ logId }) => {
    const { theme } = useTheme(); // Access the current theme object
    const comments = useLiveQuery(
        () => db.comments.where('logId').equals(logId).sortBy('createdAt'),
        [logId]
    );

    const [isAdding, setIsAdding] = useState(false);
    const [newContent, setNewContent] = useState('');

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');

    const handleAdd = async () => {
        if (!newContent.trim()) return;
        await db.comments.add({
            logId,
            content: newContent,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        setNewContent('');
        setIsAdding(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Delete this comment?')) {
            await db.comments.delete(id);
        }
    };

    const startEdit = (c: Comment) => {
        setEditingId(c.id!);
        setEditContent(c.content);
    };

    const saveEdit = async () => {
        if (editingId && editContent.trim()) {
            await db.comments.update(editingId, {
                content: editContent,
                updatedAt: new Date()
            });
            setEditingId(null);
        }
    };

    return (
        <Section>
            <SectionHeader>Comments</SectionHeader>

            <CommentList>
                {comments?.map(c => (
                    <CommentItem key={c.id}>
                        <CommentHeader>
                            <span>{format(c.createdAt, 'MMM d, yyyy HH:mm')}</span>
                            <Actions>
                                {editingId === c.id ? (
                                    <>
                                        <ActionIcon onClick={saveEdit}><FiSave /></ActionIcon>
                                        <ActionIcon onClick={() => setEditingId(null)}><FiX /></ActionIcon>
                                    </>
                                ) : (
                                    <>
                                        <ActionIcon onClick={() => startEdit(c)}><FiEdit2 /></ActionIcon>
                                        <ActionIcon onClick={() => handleDelete(c.id!)}><FiTrash2 /></ActionIcon>
                                    </>
                                )}
                            </Actions>
                        </CommentHeader>

                        {editingId === c.id ? (
                            <MarkdownEditor value={editContent} onChange={setEditContent} />
                        ) : (
                            <MarkdownView content={c.content} tableHeaderBg={theme.colors.border} />
                        )}
                    </CommentItem>
                ))}
            </CommentList>

            {isAdding ? (
                <div style={{ marginTop: '1rem' }}>
                    <MarkdownEditor value={newContent} onChange={setNewContent} />
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <AddButton onClick={handleAdd}>Save Comment</AddButton>
                        <CancelButton onClick={() => setIsAdding(false)}>Cancel</CancelButton>
                    </div>
                </div>
            ) : (
                <AddButton onClick={() => setIsAdding(true)}>
                    <FiPlus /> Add Comment
                </AddButton>
            )}
        </Section>
    );
};
