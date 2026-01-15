import React, { useState } from 'react';
import { NavLink, useParams, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import type { Book, Memo } from '../../db';

import { MemoItemLink, MemoTitle, MemoDate, ThreadToggleBtn } from './itemStyles';
import { format } from 'date-fns';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSearch } from '../../contexts/SearchContext';
import { useTheme } from '../../contexts/ThemeContext';

const GroupContainer = styled.div`
  margin-bottom: 0.5rem;
`;

const ItemContainer = styled(NavLink) <{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme, $isActive }) => $isActive ? theme.colors.surface : 'transparent'};
  border: 1px solid ${({ theme, $isActive }) => $isActive ? theme.colors.border : 'transparent'};
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: ${({ theme }) => theme.colors.surface};
  }

  &.active {
    background: ${({ theme }) => `${theme.colors.primary}20`};
    border-color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }
`;

const Info = styled.div`
  flex: 1;
  overflow: hidden;
`;

const Title = styled.div`
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.15rem;
`;

const Meta = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusDot = styled.div<{ $status: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${({ $status, theme }) =>
    $status === 'completed' ? theme.colors.success :
      $status === 'reading' ? theme.colors.primary : theme.colors.border};
`;

const ThreadList = styled.div`
  margin-left: 0.5rem;
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  padding-left: 0.5rem;
  margin-top: 0.125rem;
`;

interface Props {
  book: Book;
  memos: Memo[];
  onClick?: () => void;
  onSafeNavigate: (action: () => void) => void;
}

export const SidebarBookItem: React.FC<Props> = ({ book, memos, onClick, onSafeNavigate }) => {
  const { id: activeId, memoId: activeMemoId } = useParams();
  const { t, language } = useLanguage();
  const { searchQuery } = useSearch();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const isAtRoot = location.pathname === '/' || location.pathname === '';

  const progressPercent = book.totalPages > 0
    ? Math.round(((book.currentPage || 0) / book.totalPages) * 100)
    : 0;

  const isActive = activeId === String(book.id);

  // Expand automatically if searching and any memo matches
  const q = searchQuery.toLowerCase();
  const matchingMemos = q ? memos.filter(m =>
    m.title.toLowerCase().includes(q) ||
    m.content.toLowerCase().includes(q) ||
    m.tags.some(t => t.toLowerCase().includes(q))
  ) : [];

  const shouldShowMemos = !isCollapsed || (q && matchingMemos.length > 0);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSafeNavigate(() => {
      // If we are already on a detail page, replace history instead of pushing
      navigate(`/book/${book.id}`, { replace: !isAtRoot });
      if (onClick) onClick();
    });
  };

  const handleMemoClick = (memoId: number) => {
    onSafeNavigate(() => {
      // Always use replace for sibling memo navigation to flatten history
      navigate(`/memo/${memoId}`, { replace: !isAtRoot });
      if (onClick) onClick();
    });
  };

  // Sort memos by page number, then date
  const sortedMemos = [...memos].sort((a, b) => {
    if ((a.pageNumber || 0) !== (b.pageNumber || 0)) {
      return (a.pageNumber || 0) - (b.pageNumber || 0);
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <GroupContainer>
      <ItemContainer
        to={`/book/${book.id}`}
        onClick={handleBookClick}
        $isActive={isActive}
        className={isActive ? 'active' : ''}
      >
        <Info>
          <Title>{book.title}</Title>
          <Meta>
            <StatusDot $status={book.status} />
            <span>{progressPercent}%</span>
          </Meta>
        </Info>
      </ItemContainer>

      {memos.length > 0 && (
        <div style={{ paddingLeft: '2.4rem' }}>
          <ThreadToggleBtn onClick={handleToggle}>
            {shouldShowMemos
              ? t.sidebar.collapse
              : t.sidebar.more_memos.replace('{count}', String(memos.length))}
          </ThreadToggleBtn>
        </div>
      )}

      {shouldShowMemos && memos.length > 0 && (
        <ThreadList>
          {sortedMemos.map(memo => {
            const isMatch = q && (
              memo.title.toLowerCase().includes(q) ||
              memo.content.toLowerCase().includes(q) ||
              memo.tags.some(t => t.toLowerCase().includes(q))
            );

            if (q && !isMatch) return null;

            return (
              <MemoItemLink
                key={memo.id}
                to={`/memo/${memo.id}`}
                $isActive={activeMemoId === String(memo.id)}
                $inThread={true}
                onClick={(e) => {
                  e.preventDefault();
                  handleMemoClick(memo.id!);
                }}
                style={isMatch ? { borderRight: `2px solid ${theme.colors.primary}` } : {}}
              >
                <MemoTitle title={memo.title || t.sidebar.untitled}>
                  {memo.title || t.sidebar.untitled}
                </MemoTitle>
                <MemoDate>
                  {memo.pageNumber ? `p.${memo.pageNumber} • ` : ''}
                  {format(memo.createdAt, language === 'ko' ? 'M월 d일 HH:mm' : 'MMM d, HH:mm')}
                </MemoDate>
              </MemoItemLink>
            );
          })}
        </ThreadList>
      )}
    </GroupContainer>
  );
};
