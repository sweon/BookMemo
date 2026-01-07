import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useSearch } from '../../contexts/SearchContext';
import { useLanguage } from '../../contexts/LanguageContext';

import { MarkdownEditor } from '../Editor/MarkdownEditor';
import { MarkdownView } from '../Editor/MarkdownView';
import { FiEdit2, FiTrash2, FiSave, FiX, FiShare2, FiArrowLeft, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import { CommentsSection } from './CommentsSection';
import { ShareModal } from '../Sync/ShareModal';
import { DeleteChoiceModal } from './DeleteChoiceModal';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 24px 32px;
  width: 100%;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding-bottom: 1rem;
`;

const TitleInput = styled.input`
  font-size: 2rem;
  font-weight: 700;
  width: 100%;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
  
  &:focus {
    outline: none;
    border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
  }
`;

const TitleDisplay = styled.h1`
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  color: ${({ theme }) => theme.colors.text};
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.9rem;
  flex-wrap: wrap;
`;

const TagInput = styled.input`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
`;

const MetaInput = styled.input`
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    width: 90px;
`;

const DateInput = styled.input`
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
    padding: 0.25rem 2.2rem 0.25rem 0.5rem;
    border-radius: 4px;
    width: 190px;
`;

const InputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
`;

const CalendarIconButton = styled(FiCalendar)`
    position: absolute;
    right: 8px;
    color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    font-size: 1.1rem;
    stroke-width: 2.5;
`;

const QuoteInput = styled.textarea`
    width: 100%;
    margin-top: 1rem;
    padding: 1rem;
    background: ${({ theme }) => theme.colors.surface};
    border-left: 3px solid ${({ theme }) => theme.colors.primary};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-left-width: 3px;
    border-radius: 4px;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-style: italic;
    resize: vertical;
    min-height: 80px;

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.primary};
    }
`;

const QuoteDisplay = styled.div`
    margin-top: 1rem;
    padding: 1rem;
    background: ${({ theme }) => theme.colors.surface};
    border-left: 3px solid ${({ theme }) => theme.colors.primary};
    font-style: italic;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-bottom: 1rem;
`;

const ActionBar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme, $variant }) =>
        $variant === 'primary' ? theme.colors.primary :
            $variant === 'danger' ? theme.colors.surface : theme.colors.surface};
  color: ${({ theme, $variant }) =>
        $variant === 'primary' ? '#fff' :
            $variant === 'danger' ? theme.colors.danger : theme.colors.text};
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: ${({ theme, $variant }) =>
        $variant === 'primary' ? theme.colors.primaryHover : theme.colors.border};
  }
`;

const formatDateForInput = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const MemoDetail: React.FC = () => {
    const { id, bookId } = useParams<{ id: string, bookId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setSearchQuery } = useSearch();
    const { t, language } = useLanguage();
    const isNew = !id;

    const [isEditing, setIsEditing] = useState(isNew);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [date, setDate] = useState('');

    // New fields
    const [pageNumber, setPageNumber] = useState('');
    const [quote, setQuote] = useState('');

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const memo = useLiveQuery(
        () => (id ? db.memos.get(Number(id)) : undefined),
        [id]
    );

    const book = useLiveQuery(
        () => (bookId ? db.books.get(Number(bookId)) : (memo?.bookId ? db.books.get(memo.bookId) : undefined)),
        [bookId, memo]
    );

    useEffect(() => {
        const shouldEdit = searchParams.get('edit') === 'true';

        if (memo) {
            setTitle(memo.title);
            setContent(memo.content);
            setTags(memo.tags.join(', '));
            setPageNumber(memo.pageNumber?.toString() || '');
            setQuote(memo.quote || '');
            setDate(language === 'ko' ? format(memo.createdAt, 'yyyy. MM. dd.') : formatDateForInput(memo.createdAt));
            setIsEditing(shouldEdit);
        } else if (isNew) {
            setTitle('');
            setContent('');
            setTags('');
            const p = searchParams.get('page');
            setPageNumber(p || '');
            setQuote('');
            setDate(language === 'ko' ? format(new Date(), 'yyyy. MM. dd.') : formatDateForInput(new Date()));
            setIsEditing(true);
        }
    }, [memo, isNew, searchParams]);

    // Auto-fill page number from book progress for new memos
    useEffect(() => {
        if (isNew && book?.currentPage && !searchParams.get('page')) {
            setPageNumber(prev => (prev === '' ? book.currentPage!.toString() : prev));
        }
    }, [isNew, book?.currentPage, searchParams]);

    const handleSave = async () => {
        const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
        const now = new Date();
        const pNum = pageNumber ? parseInt(pageNumber, 10) : undefined;
        const targetBookId = bookId ? Number(bookId) : memo?.bookId;

        // Check if it's a "progress only" update (no title, content, or quote, but has page number)
        // Determine final title and type
        let finalTitle = title.trim();
        let finalType: 'normal' | 'progress' = 'normal';

        // Check emptiness
        const hasTitle = !!finalTitle;
        const hasContent = !!content.trim();
        const hasQuote = !!quote.trim();
        const hasPage = pNum !== undefined;

        // Validation:
        // 1. If nothing at all (no title, content, quote, page), block.
        if (!hasTitle && !hasContent && !hasQuote && !hasPage) return;

        // 2. If quote exists, page is MANDATORY.
        //    (Quote implies it's an excerpt from the book, so it needs location)
        if (hasQuote && !hasPage) return;

        // Logic for auto-title
        if (!hasTitle) {
            if (hasPage && !hasContent) {
                // If only page is present, it's a progress record
                finalTitle = "Progress Record";
                finalType = 'progress';
            } else {
                // Determine title from content or quote
                const contentText = content.trim();
                const quoteText = quote.trim();

                if (contentText) {
                    finalTitle = contentText.slice(0, 30) + (contentText.length > 30 ? '...' : '');
                } else if (quoteText) {
                    finalTitle = quoteText.slice(0, 30) + (quoteText.length > 30 ? '...' : '');
                } else {
                    finalTitle = t.memo_detail.untitled;
                }
                finalType = 'normal';
            }
        } else {
            // User provided title -> normal
            finalType = 'normal';
        }

        // Special check: If user typed "Progress Record" manually? 
        // Let's stick to the prompt rules. The prompt implies logic based on *missing* fields.
        // If user typed title, we just use it.

        // Refined isProgressOnly logic for book update (if strictly page update)
        // Actually, request says "1 and 3 are missing, 2 exists -> Progress Record". 
        // This maps to finalType === 'progress' above.

        // We still need to update book progress regardless of type if pNum > current.
        // We can reuse the book update logic block.

        if (targetBookId && pNum) {
            const b = await db.books.get(targetBookId);
            if (b) {
                const updates: any = {};
                if ((b.currentPage || 0) < pNum) {
                    updates.currentPage = pNum;
                }

                if (pNum >= b.totalPages && b.status !== 'completed') {
                    updates.status = 'completed';
                    updates.completedDate = now;
                }

                if (Object.keys(updates).length > 0) {
                    await db.books.update(targetBookId, updates);
                }
            }
        }

        // Standard Memo Save Logic with finalTitle and finalType
        let memoCreatedAt: Date;
        if (language === 'ko' && /^\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?$/.test(date)) {
            const parts = date.split('.').map(s => s.trim()).filter(Boolean);
            memoCreatedAt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            // Preserve time if possible
            const oldDate = memo?.createdAt || new Date();
            memoCreatedAt.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds());
        } else {
            memoCreatedAt = new Date(date + 'T' + format(memo?.createdAt || new Date(), 'HH:mm:ss'));
        }

        if (isNaN(memoCreatedAt.getTime())) {
            memoCreatedAt = new Date();
        }

        if (id) {
            await db.memos.update(Number(id), {
                title: finalTitle,
                content,
                tags: tagArray,
                pageNumber: pNum,
                quote,
                createdAt: memoCreatedAt,
                updatedAt: now,
                type: finalType
            });

            if (searchParams.get('edit')) {
                navigate(`/memo/${id}`, { replace: true });
            }
            setIsEditing(false);
        } else {
            // Create New Memo
            const newId = await db.memos.add({
                bookId: targetBookId,
                title: finalTitle,
                content,
                tags: tagArray,
                pageNumber: pNum,
                quote,
                createdAt: memoCreatedAt,
                updatedAt: now,
                type: finalType
            });

            navigate(`/memo/${newId}`);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setIsDeleteModalOpen(true);
    };

    const performDeleteMemoOnly = async () => {
        if (!id) return;
        const bookIdToRedirect = memo?.bookId;

        await db.memos.delete(Number(id));
        await db.comments.where('memoId').equals(Number(id)).delete();

        setIsDeleteModalOpen(false);
        if (bookIdToRedirect) {
            navigate(`/book/${bookIdToRedirect}`, { replace: true });
        } else {
            navigate('/', { replace: true });
        }
    };

    if (!isNew && !memo) return <Container>{t.memo_detail.loading}</Container>;

    return (
        <Container>
            <Header>
                {book && (
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer', color: '#666' }}
                        onClick={() => navigate(`/book/${book.id}`)}
                    >
                        <FiArrowLeft /> Back to {book.title}
                    </div>
                )}

                {isEditing ? (
                    <TitleInput
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={t.memo_detail.title_placeholder}
                        autoFocus
                    />
                ) : (
                    <TitleDisplay>{memo?.title}</TitleDisplay>
                )}

                <MetaRow>
                    {isEditing ? (
                        <>
                            <MetaInput
                                type="number"
                                value={pageNumber}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        setPageNumber(val);
                                        return;
                                    }
                                    const num = parseInt(val, 10);
                                    if (book && book.totalPages && num > book.totalPages) {
                                        return;
                                    }
                                    setPageNumber(val);
                                }}
                                placeholder="Page"
                            />

                            <InputWrapper>
                                <DateInput
                                    type={language === 'ko' ? 'text' : 'date'}
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    placeholder={language === 'ko' ? 'YYYY. MM. DD.' : undefined}
                                />
                                <CalendarIconButton
                                    onClick={() => {
                                        const picker = document.getElementById('memo-date-picker');
                                        if (picker) (picker as any).showPicker?.() || picker.click();
                                    }}
                                />
                                <input
                                    id="memo-date-picker"
                                    type="date"
                                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                                    onChange={(e) => {
                                        const d = new Date(e.target.value);
                                        if (!isNaN(d.getTime())) {
                                            setDate(language === 'ko' ? format(d, 'yyyy. MM. dd.') : formatDateForInput(d));
                                        }
                                    }}
                                />
                            </InputWrapper>

                            <TagInput
                                value={tags}
                                style={{ flex: 1 }}
                                onChange={e => setTags(e.target.value)}
                                placeholder={t.memo_detail.tags_placeholder}
                            />
                        </>
                    ) : (
                        <>
                            {memo?.pageNumber && <span>p. {memo.pageNumber}</span>}
                            <span>•</span>
                            <span>{memo && format(memo.createdAt, language === 'ko' ? 'yyyy년 M월 d일' : 'MMM d, yyyy')}</span>
                            {memo?.tags.map(t => (
                                <span
                                    key={t}
                                    onClick={() => setSearchQuery(`tag:${t}`)}
                                    style={{
                                        background: '#eee',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        color: '#333',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {t}
                                </span>
                            ))}
                        </>
                    )}
                </MetaRow>

                {isEditing ? (
                    <QuoteInput
                        placeholder="Quote from book (optional)..."
                        value={quote}
                        onChange={e => setQuote(e.target.value)}
                    />
                ) : (
                    quote && <QuoteDisplay>“{quote}”</QuoteDisplay>
                )}

                <ActionBar>
                    {isEditing ? (
                        <>
                            <ActionButton
                                $variant="primary"
                                onClick={handleSave}
                                disabled={
                                    (!title.trim() && !pageNumber && !content.trim() && !quote.trim()) ||
                                    (!!quote.trim() && !pageNumber)
                                }
                                style={{
                                    opacity: ((!title.trim() && !pageNumber && !content.trim() && !quote.trim()) || (!!quote.trim() && !pageNumber)) ? 0.5 : 1,
                                    cursor: ((!title.trim() && !pageNumber && !content.trim() && !quote.trim()) || (!!quote.trim() && !pageNumber)) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <FiSave /> {t.memo_detail.save}
                            </ActionButton>
                            {!isNew && (
                                <>
                                    <ActionButton $variant="danger" onClick={handleDelete}>
                                        <FiTrash2 /> {t.memo_detail.delete}
                                    </ActionButton>
                                    <ActionButton onClick={() => {
                                        if (searchParams.get('edit')) {
                                            navigate(`/memo/${id}`, { replace: true });
                                        }
                                        setIsEditing(false);
                                    }}>
                                        <FiX /> {t.memo_detail.cancel}
                                    </ActionButton>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <ActionButton onClick={() => setIsEditing(true)}>
                                <FiEdit2 /> {t.memo_detail.edit}
                            </ActionButton>
                            <ActionButton $variant="danger" onClick={handleDelete}>
                                <FiTrash2 /> {t.memo_detail.delete}
                            </ActionButton>
                            <ActionButton onClick={() => setIsShareModalOpen(true)}>
                                <FiShare2 /> {t.memo_detail.share_memo}
                            </ActionButton>
                        </>
                    )}
                </ActionBar>
            </Header>

            {isEditing ? (
                <MarkdownEditor value={content} onChange={setContent} />
            ) : (
                <>
                    <MarkdownView content={content} />
                    {!isNew && memo && <CommentsSection memoId={memo.id!} />}
                </>
            )}

            {!isNew && memo && (
                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    memoId={memo.id!}
                    memoTitle={memo.title}
                />
            )}

            {isDeleteModalOpen && (
                <DeleteChoiceModal
                    onClose={() => setIsDeleteModalOpen(false)}
                    onDeleteMemoOnly={performDeleteMemoOnly}
                    onDeleteThread={() => performDeleteMemoOnly()} // No threads strictly here
                    isThreadHead={false}
                />
            )}
        </Container>
    );
};
