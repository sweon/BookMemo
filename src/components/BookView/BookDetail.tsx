import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { db } from '../../db';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiEdit3, FiTrash2, FiRotateCcw, FiMaximize, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { format } from 'date-fns';
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  ReferenceArea
} from 'recharts';


const Container = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
`;

const LeftPane = styled.div<{ $isMemoOpen: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  border-right: ${props => props.$isMemoOpen ? `1px solid ${props.theme.colors.border}` : 'none'};
  transition: all 0.2s ease;
  
  @media (max-width: 1350px) {
    display: ${props => props.$isMemoOpen ? 'none' : 'flex'};
  }
`;

const RightPane = styled.div`
  flex: 1;
  height: 100%;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.surface};
  
  @media (max-width: 1350px) {
    flex: 1;
  }
`;

const Header = styled.div`
  padding: 1rem 2rem 2rem 2rem;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 768px) {
    padding: 1rem 0.5rem 1.5rem 0.5rem;
  }
`;

const BookTitle = styled.h1`
  margin: 0 0 0.25rem 0;
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.primary};
`;
const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  white-space: normal;
  flex-wrap: wrap;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ProgressSection = styled.div`
  margin-top: 0.5rem;
`;

const ProgressBar = styled.div<{ $percent: number }>`
  height: 8px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  margin-top: 0.5rem;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.$percent}%;
    background: ${({ theme }) => theme.colors.primary};
    transition: width 0.3s ease;
  }
`;

const GraphContainer = styled.div`
  position: relative;
  height: 360px;
  width: 100%;
  margin-top: 0.5rem;
  padding-right: 20px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  outline: none;
  
  @media (max-width: 768px) {
    height: 300px;
    padding-right: 10px;
    margin-top: 1rem;
  }

  & .recharts-wrapper {
    outline: none;
  }
`;

const MemoListSection = styled.div`
  padding: 2rem;
  flex: 1;
`;

const MemoCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Quote = styled.div`
  font-style: italic;
  color: ${({ theme }) => theme.colors.textSecondary};
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  padding-left: 1rem;
  margin-bottom: 1rem;
  line-height: 1.6;
`;

const MemoContent = styled.div`
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
`;

const PageMeta = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 0.5rem;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
`;

const ActionButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  
  &:hover {
    opacity: 0.9;
  }
`;

const MiniPillButton = styled.button`
  height: 22px;
  padding: 0 0.5rem;
  border-radius: 11px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background}dd;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  font-size: 0.6rem;
  font-weight: 500;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: white;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  svg {
    stroke-width: 2.5px;
  }
`;

const CustomTooltip = ({ active, payload }: any) => {
  const { language } = useLanguage();
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        padding: '8px 12px',
        border: 'none',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        color: '#fff'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.85em' }}>
          {format(new Date(data.x), language === 'ko' ? 'yyyy년 M월 d일 HH:mm' : 'MMM d, yyyy HH:mm')}
        </p>
        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.8em' }}>Page {data.y}</p>
        <p style={{ margin: '2px 0 0 0', fontSize: '0.75em', color: '#60a5fa' }}>
          {data.type === 'start' ? 'Started Reading' : data.type === 'progress' ? 'Progress Record' : (data.title || 'Untitled Memo')}
        </p>
      </div>
    );
  }
  return null;
};

export const BookDetail: React.FC = () => {
  const { bookId, id: memoId } = useParams<{ bookId: string; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();

  const [refAreaLeft, setRefAreaLeft] = React.useState<any>(null);
  const [refAreaRight, setRefAreaRight] = React.useState<any>(null);
  const [zoomDomain, setZoomDomain] = React.useState<[any, any] | null>(null);
  const [zoomHistory, setZoomHistory] = React.useState<[any, any][]>([]);
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const lastMouseIndex = React.useRef<number | null>(null);

  const numericBookId = Number(bookId);
  const book = useLiveQuery(() => isNaN(numericBookId) ? undefined : db.books.get(numericBookId), [numericBookId]);
  const memos = useLiveQuery(() =>
    isNaN(numericBookId) ? Promise.resolve([] as any[]) :
      db.memos
        .where('bookId')
        .equals(numericBookId)
        .reverse()
        .sortBy('createdAt')
    , [numericBookId]) || [];

  if (isNaN(numericBookId)) return null;

  // Filter out progress-only memos for the list view
  const displayMemos = useMemo(() => {
    return memos?.filter(m => m.type !== 'progress')
      .sort((a, b) => {
        if ((a.pageNumber || 0) !== (b.pageNumber || 0)) {
          return (a.pageNumber || 0) - (b.pageNumber || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [memos]);

  const { allChartData } = useMemo(() => {
    if (!memos || !book) return { allChartData: [] };

    const sorted = memos.map(m => ({
      x: m.createdAt.getTime(),
      y: m.pageNumber || 0,
      id: m.id,
      title: m.title,
      type: m.type || 'normal',
    })).sort((a, b) => a.x - b.x);

    const mainLine: typeof sorted = [];
    const backtrack: typeof sorted = [];
    const noPageMemos: typeof sorted = [];
    let maxPageSoFar = 0;

    for (const point of sorted) {
      if (!point.y || point.y === 0) {
        noPageMemos.push(point);
      } else if (point.y >= maxPageSoFar) {
        mainLine.push(point);
        maxPageSoFar = point.y;
      } else {
        backtrack.push({ ...point, type: 'backtrack' as any });
      }
    }

    // Add the start point to mainLine for interpolation
    const fullMainLine = [
      { x: book.startDate.getTime(), y: 0, type: 'start' as any },
      ...mainLine
    ];

    // Interpolate x position for backtrack dots based on their y value
    const interpolatedBacktrack = backtrack.map(point => {
      const targetY = point.y;

      // Find the two points in mainLine that bracket this y value
      let lowerPoint = fullMainLine[0];
      let upperPoint = fullMainLine[fullMainLine.length - 1];

      for (let i = 0; i < fullMainLine.length - 1; i++) {
        if (fullMainLine[i].y <= targetY && fullMainLine[i + 1].y >= targetY) {
          lowerPoint = fullMainLine[i];
          upperPoint = fullMainLine[i + 1];
          break;
        }
      }

      // Linear interpolation to find x for the given y
      let interpolatedX: number;
      if (upperPoint.y === lowerPoint.y) {
        interpolatedX = lowerPoint.x;
      } else {
        const ratio = (targetY - lowerPoint.y) / (upperPoint.y - lowerPoint.y);
        interpolatedX = lowerPoint.x + ratio * (upperPoint.x - lowerPoint.x);
      }

      return { ...point, x: interpolatedX };
    });

    // Process no-page memos: simply place them at y=0 at their creation time
    const noPagePoints = noPageMemos.map((point) => ({
      ...point,
      // x is already set to createdAt in the initial mapping
      y: 0,
      yMain: null,
      yBacktrack: 0 // Use backtrack style (orange/blue dot) at y=0
    }));

    // Merge all data for the unified chart
    const startPoint = {
      x: book.startDate.getTime(),
      y: 0,
      yMain: 0,
      yBacktrack: null,
      type: 'start' as any,
      title: 'Started',
      id: undefined
    };

    const mainLinePoints = mainLine.map(p => ({
      ...p,
      yMain: p.y,
      yBacktrack: null
    }));

    const backtrackPoints = interpolatedBacktrack.map(p => ({
      ...p,
      yMain: null,
      yBacktrack: p.y
    }));

    const allData = [startPoint, ...noPagePoints, ...mainLinePoints, ...backtrackPoints].sort((a, b) => a.x - b.x);

    return { allChartData: allData as any[] };
  }, [memos, book]);

  React.useEffect(() => {
    if (!book) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (allChartData.length === 0) return;

      if (e.key === 'ArrowRight') {
        setFocusedIndex(prev => {
          const current = prev ?? -1;
          if (current + 1 < allChartData.length) return current + 1;
          return current;
        });
      } else if (e.key === 'ArrowLeft') {
        setFocusedIndex(prev => {
          const current = prev ?? allChartData.length;
          if (current - 1 >= 0) return current - 1;
          return current;
        });
      } else if (e.key === 'Enter') {
        if (focusedIndex !== null) {
          const data = allChartData[focusedIndex];
          if (data.id) handlePointClick(data);
        }
      } else if (e.key === 'Escape') {
        setFocusedIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allChartData, focusedIndex, book]);

  if (!book) return <div style={{ padding: '2rem' }}>{t.memo_detail.loading}</div>;

  const progressPercent = Math.round(((book.currentPage || 0) / book.totalPages) * 100);

  const handleDelete = async () => {
    if (confirm(t.book_detail.confirm_delete)) {
      // Delete associated memos first
      const associatedMemos = await db.memos.where('bookId').equals(book.id!).toArray();
      await db.memos.bulkDelete(associatedMemos.map(m => m.id!));
      await db.books.delete(book.id!);
      navigate('/');
    }
  };

  const handlePointClick = (data: any, index?: number) => {
    if (index !== undefined) {
      setFocusedIndex(index);
      lastMouseIndex.current = index;
    }

    if (data.id) {
      // If it's just progress, go to edit mode directly so they can "add" a memo to it.
      const query = data.type === 'progress' ? '?edit=true' : '';
      navigate(`/book/${bookId}/memo/${data.id}${query}`, {
        replace: !!memoId,
        state: { isGuard: true }
      });
    }
  };

  const handleZoom = () => {
    if (refAreaLeft === refAreaRight || !refAreaRight) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    let [l, r] = [refAreaLeft, refAreaRight];
    if (l > r) [l, r] = [r, l];

    if (zoomDomain) {
      setZoomHistory(prev => [...prev, zoomDomain]);
    }
    setZoomDomain([l, r]);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const zoomBack = () => {
    if (zoomHistory.length > 0) {
      const prevZoom = zoomHistory[zoomHistory.length - 1];
      setZoomDomain(prevZoom);
      setZoomHistory(prev => prev.slice(0, -1));
    } else {
      setZoomDomain(null);
    }
  };

  const resetZoom = () => {
    setZoomDomain(null);
    setZoomHistory([]);
  };

  const scrollChart = (direction: 'left' | 'right') => {
    if (!zoomDomain || allChartData.length === 0) return;

    const minX = allChartData[0].x;
    const maxX = allChartData[allChartData.length - 1].x;

    const [left, right] = zoomDomain;
    const range = right - left;
    const step = range * 0.2; // 20% scroll

    if (direction === 'left') {
      let newLeft = left - step;
      let newRight = right - step;

      if (newLeft < minX) {
        newLeft = minX;
        newRight = minX + range;
      }
      setZoomDomain([newLeft, newRight]);
    } else {
      let newLeft = left + step;
      let newRight = right + step;

      if (newRight > maxX) {
        newRight = maxX;
        newLeft = maxX - range;
      }
      setZoomDomain([newLeft, newRight]);
    }
  };

  const isMemoOpen = !!memoId || location.pathname === `/book/${bookId}/new` || location.pathname === `/book/${bookId}/edit`;

  return (
    <Container shadow-root="false">
      <LeftPane $isMemoOpen={isMemoOpen}>
        <Header>
          <BookTitle>{book.title}</BookTitle>
          {book.author && book.author.trim() !== '' && (
            <MetaInfo>
              <span>{book.author}</span>
            </MetaInfo>
          )}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
            <ActionButton onClick={() => navigate(`/book/${book.id}/new`, { state: { isGuard: true } })}>
              <FiEdit3 /> {t.book_detail.write_memo}
            </ActionButton>
            <ActionButton style={{ background: '#64748b' }} onClick={() => navigate(`/book/${book.id}/edit`, { state: { isGuard: true } })}>
              <FiEdit3 /> {t.book_detail.edit_book}
            </ActionButton>
            <ActionButton style={{ background: '#ef4444' }} onClick={handleDelete}>
              <FiTrash2 /> {t.book_detail.delete_book}
            </ActionButton>
          </div>

          <ProgressSection>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
              <span>{t.book_detail.progress}</span>
              <span style={{ color: progressPercent === 100 ? '#22c55e' : 'inherit', fontWeight: progressPercent === 100 ? '600' : '400' }}>
                {book.currentPage || 0} / {book.totalPages} pages ({progressPercent}%)
              </span>
            </div>
            <ProgressBar $percent={progressPercent} />
          </ProgressSection>

          {allChartData.length > 0 && (
            <GraphContainer>
              {zoomDomain && (
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '25px',
                  display: 'flex',
                  gap: '6px',
                  zIndex: 10
                }}>
                  <MiniPillButton onClick={() => scrollChart('left')}>
                    <FiChevronLeft size={11} />
                  </MiniPillButton>
                  <MiniPillButton onClick={() => scrollChart('right')} style={{ marginRight: '8px' }}>
                    <FiChevronRight size={11} />
                  </MiniPillButton>
                  <MiniPillButton onClick={zoomBack}>
                    <FiRotateCcw size={11} /> {t.book_detail.zoom_back}
                  </MiniPillButton>
                  <MiniPillButton onClick={resetZoom}>
                    <FiMaximize size={11} /> {t.book_detail.reset_zoom}
                  </MiniPillButton>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  margin={window.innerWidth <= 768
                    ? { top: 10, right: 5, bottom: 40, left: -25 }
                    : { top: 20, right: 20, bottom: 60, left: 0 }
                  }
                  data={allChartData}
                  {...({ activeTooltipIndex: focusedIndex ?? undefined } as any)}
                  onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                  onMouseMove={(e) => {
                    if (refAreaLeft) setRefAreaRight(e?.activeLabel);
                    if (e && e.activeTooltipIndex !== undefined) {
                      const newIndex = e.activeTooltipIndex as number;
                      if (newIndex !== lastMouseIndex.current) {
                        setFocusedIndex(newIndex);
                        lastMouseIndex.current = newIndex;
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    setFocusedIndex(null);
                    lastMouseIndex.current = null;
                  }}
                  onMouseUp={handleZoom}
                  style={{ cursor: 'crosshair' }}
                >
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Date"
                    domain={zoomDomain || [book.startDate.getTime(), 'dataMax']}
                    allowDataOverflow={true}
                    tickFormatter={(timestamp) => format(new Date(timestamp), language === 'ko' ? 'yy.M.d' : 'yy/M/d')}
                    tick={{ fontSize: 11, fill: '#888' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    type="number"
                    dataKey={(payload) => payload.yMain ?? payload.yBacktrack ?? 0}
                    name="Page"
                    domain={[0, book.totalPages]}
                    tick={{ fontSize: 12, fill: '#888' }}
                  />


                  {!refAreaLeft && (
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ strokeDasharray: '3 3' }}
                      offset={50}
                      active={focusedIndex !== null}
                    />
                  )}

                  {/* Main progress line */}
                  <Line
                    type="monotone"
                    dataKey="yMain"
                    connectNulls={true}
                    stroke="#64748b"
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload, index } = props;
                      if (payload.yMain === null) return null;

                      if (payload.type === 'start') {
                        return <circle cx={cx} cy={cy} r={4} fill="#94a3b8" />;
                      }
                      const isProgress = payload.type === 'progress';
                      const isFocused = focusedIndex === index;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isFocused ? 8 : 5}
                          fill={isProgress ? '#22c55e' : '#2563eb'}
                          stroke={isFocused ? '#fff' : 'none'}
                          strokeWidth={isFocused ? 2 : 0}
                          style={{ cursor: isProgress ? 'default' : 'pointer', zIndex: isFocused ? 20 : 1 }}
                          onClick={() => handlePointClick(payload, index)}
                        />
                      );
                    }}
                    activeDot={(props: any) => {
                      const { cx, cy, payload, index } = props;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={7}
                          fill={payload.type === 'progress' ? '#22c55e' : '#1d4ed8'}
                          stroke="#fff"
                          strokeWidth={2}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handlePointClick(payload, index)}
                        />
                      );
                    }}
                  />

                  {/* Backtrack dots - memos at earlier pages */}
                  <Line
                    type="monotone"
                    dataKey="yBacktrack"
                    stroke="none"
                    dot={(props: any) => {
                      const { cx, cy, payload, index } = props;
                      if (payload.yBacktrack === null) return null;
                      const isFocused = focusedIndex === index;
                      // Distinguish no-page memos (y=0) from actual backtrack memos
                      const isNoPage = payload.y === 0;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isFocused ? 8 : 5}
                          fill={isNoPage ? '#8b5cf6' : '#f59e0b'}
                          stroke={isFocused ? '#fff' : 'none'}
                          strokeWidth={isFocused ? 2 : 0}
                          style={{ cursor: 'pointer', zIndex: isFocused ? 20 : 1 }}
                          onClick={() => handlePointClick(payload, index)}
                        />
                      );
                    }}
                    activeDot={(props: any) => {
                      const { cx, cy, payload, index } = props;
                      const isFocused = focusedIndex === index;
                      const isNoPage = payload.y === 0;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isFocused ? 8 : 7}
                          fill={isNoPage ? '#8b5cf6' : '#f59e0b'}
                          stroke="#fff"
                          strokeWidth={2}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handlePointClick(payload, index)}
                        />
                      );
                    }}
                  />
                  {refAreaLeft && refAreaRight && (
                    <ReferenceArea
                      x1={refAreaLeft}
                      x2={refAreaRight}
                      strokeOpacity={0.3}
                      fill="#3b82f6"
                      fillOpacity={0.1}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </GraphContainer>
          )}
        </Header>

        <MemoListSection>
          {displayMemos && displayMemos.map(memo => (
            <MemoCard key={memo.id} onClick={() => navigate(`/book/${bookId}/memo/${memo.id}`, {
              replace: !!memoId,
              state: { isGuard: true }
            })}>
              <PageMeta>
                <span>{memo.pageNumber ? `${t.book_detail.page} ${memo.pageNumber}` : t.book_detail.whole_book}</span>
                <span>{format(memo.createdAt, language === 'ko' ? 'M월 d일 HH:mm' : 'MMM d, HH:mm')}</span>
              </PageMeta>
              {memo.quote && <Quote>“{memo.quote}”</Quote>}
              <MemoContent>{memo.title}</MemoContent>
            </MemoCard>
          ))}

          {(!displayMemos || displayMemos.length === 0) && (
            <div style={{ textAlign: 'center', color: '#999', marginTop: '2rem' }}>
              {t.book_detail.start_reading}
            </div>
          )}
        </MemoListSection>
      </LeftPane>

      {isMemoOpen && (
        <RightPane>
          <Outlet />
        </RightPane>
      )}
    </Container>
  );
};
