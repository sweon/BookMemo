import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { exportData, importData } from '../utils/backup';
import { FiTrash2, FiDownload, FiUpload, FiChevronRight, FiArrowLeft, FiDatabase, FiGlobe, FiInfo, FiShare2, FiAlertTriangle } from 'react-icons/fi';
import { useLanguage } from '../contexts/LanguageContext';
import { type Language } from '../translations';

const Container = styled.div`
  padding: 24px 32px;
  margin: 0;
  height: 100%;
  overflow-y: auto;
  width: 100%;
  
  @media (max-width: 600px) {
    padding: 16px;
  }
`;

const Section = styled.div`
  margin-bottom: 2rem;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding-bottom: 1rem;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
`;

const MenuList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  text-align: left;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.background};
  }

  &:active {
    transform: translateY(0);
  }

  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: ${({ theme }) => theme.colors.background};
    border-radius: 10px;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.25rem;
  }

  .label-wrapper {
    flex: 1;
    
    .title {
      display: block;
      font-weight: 600;
      font-size: 1.05rem;
      color: ${({ theme }) => theme.colors.text};
      margin-bottom: 0.2rem;
    }
    
    .desc {
      display: block;
      font-size: 0.85rem;
      color: ${({ theme }) => theme.colors.textSecondary};
      opacity: 0.8;
    }
  }

  .chevron {
    color: ${({ theme }) => theme.colors.textSecondary};
    opacity: 0.5;
  }
`;

const BackButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;


const ActionButton = styled.button<{ $variant?: 'primary' | 'success' | 'secondary' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.75rem 1.25rem;
  background: ${({ theme, $variant }) =>
    $variant === 'success' ? '#10b981' :
      $variant === 'secondary' ? 'transparent' :
        theme.colors.primary};
  color: ${({ $variant }) => $variant === 'secondary' ? 'inherit' : 'white'};
  border: ${({ $variant, theme }) => $variant === 'secondary' ? `1px solid ${theme.colors.border}` : 'none'};
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
    ${({ $variant, theme }) => $variant === 'secondary' && `
      background: ${theme.colors.border};
      border-color: ${theme.colors.textSecondary};
    `}
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.h3`
  margin-top: 0;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  input {
    width: 18px;
    height: 18px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ScrollableList = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background: ${({ theme }) => theme.colors.surface};
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
  
  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }

  input {
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
  width: 100%;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const HelpList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    margin-bottom: 1rem;
    padding-left: 1rem;
    position: relative;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.text};
    
    &::before {
      content: '•';
      position: absolute;
      left: 0;
      color: ${({ theme }) => theme.colors.primary};
      font-weight: bold;
    }
  }
`;

type SubMenu = 'main' | 'data' | 'language' | 'about';

export const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [currentSubMenu, setCurrentSubMenu] = useState<SubMenu>('main');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'all' | 'selected'>('all');
  const [selectedMemos, setSelectedMemos] = useState<Set<number>>(new Set());
  const [exportFileName, setExportFileName] = useState('');
  const allMemos = useLiveQuery(() => db.memos.orderBy('createdAt').reverse().toArray());

  const handleExportClick = () => {
    setShowExportModal(true);
    setExportMode('all');
    setSelectedMemos(new Set());
    setExportFileName(`bookmemo-backup-${new Date().toISOString().slice(0, 10)}`);
  };

  const confirmExport = async () => {
    if (exportMode === 'all') {
      await exportData(undefined, exportFileName);
    } else {
      await exportData(Array.from(selectedMemos), exportFileName);
    }
    setShowExportModal(false);
  };

  const toggleMemoSelection = (id: number) => {
    const next = new Set(selectedMemos);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMemos(next);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (confirm(t.settings.import_confirm)) {
        try {
          await importData(file);
          alert(t.settings.import_success);
        } catch (err) {
          alert(t.settings.import_failed + err);
        }
      }
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'BookMemo',
      text: t.settings.help_desc,
      url: window.location.origin + window.location.pathname
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert(t.settings.share_success);
      }
    } catch (err) {
      console.log('Share failed:', err);
    }
  };

  const handleFactoryReset = async () => {
    if (confirm(t.settings.reset_confirm)) {
      try {
        // Clear IndexedDB
        await db.delete();
        // Clear LocalStorage (including theme, sidebar width, etc)
        localStorage.clear();

        alert(t.settings.reset_success);
        window.location.reload();
      } catch (e) {
        console.error("Reset failed:", e);
        alert("Reset failed: " + e);
      }
    }
  };

  const renderHeader = (title: string) => (
    <Header>
      <BackButton onClick={() => setCurrentSubMenu('main')}>
        <FiArrowLeft size={20} />
      </BackButton>
      <Title>{title}</Title>
    </Header>
  );

  return (
    <Container>
      {currentSubMenu === 'main' && (
        <Section>
          <Title style={{ marginBottom: '1.5rem' }}>{t.settings.title}</Title>
          <MenuList>
            <MenuButton onClick={() => setCurrentSubMenu('data')}>
              <div className="icon-wrapper"><FiDatabase /></div>
              <div className="label-wrapper">
                <span className="title">{t.settings.data_management}</span>
                <span className="desc">Export, import or backup data</span>
              </div>
              <FiChevronRight className="chevron" />
            </MenuButton>

            <MenuButton onClick={() => setCurrentSubMenu('language')}>
              <div className="icon-wrapper"><FiGlobe /></div>
              <div className="label-wrapper">
                <span className="title">{t.settings.language}</span>
                <span className="desc">Change display language</span>
              </div>
              <FiChevronRight className="chevron" />
            </MenuButton>

            <MenuButton onClick={() => setCurrentSubMenu('about')}>
              <div className="icon-wrapper"><FiInfo /></div>
              <div className="label-wrapper">
                <span className="title">{t.settings.help_title}</span>
                <span className="desc">App info and user guide</span>
              </div>
              <FiChevronRight className="chevron" />
            </MenuButton>
          </MenuList>
        </Section>
      )}

      {currentSubMenu === 'data' && (
        <Section>
          {renderHeader(t.settings.data_management)}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <ActionButton onClick={handleExportClick}><FiDownload /> {t.settings.export_backup}</ActionButton>
            <ActionButton onClick={() => fileInputRef.current?.click()} $variant="success"><FiUpload /> {t.settings.import_restore}</ActionButton>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleImport}
            />

            <div style={{ margin: '1rem 0', borderBottom: '1px solid var(--border-color)' }}></div>

            <div style={{
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiAlertTriangle /> {t.settings.factory_reset}
              </h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', opacity: 0.8 }}>
                {t.settings.reset_confirm}
              </p>
              <ActionButton onClick={handleFactoryReset} $variant="secondary" style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)', width: '100%' }}>
                <FiTrash2 /> {t.settings.factory_reset}
              </ActionButton>
            </div>
          </div>
        </Section>
      )}

      {currentSubMenu === 'language' && (
        <Section>
          {renderHeader(t.settings.language)}
          <Select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            <option value="en">{t.settings.english}</option>
            <option value="ko">{t.settings.korean}</option>
          </Select>
        </Section>
      )}

      {currentSubMenu === 'about' && (
        <Section>
          {renderHeader(t.settings.help_title)}
          <p style={{ marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '1.1rem', fontWeight: 500 }}>{t.settings.help_desc}</p>
          <HelpList>
            <li>{t.settings.help_local_db}</li>
            <li>{t.settings.help_offline}</li>
            <li>{t.settings.help_sync}</li>
            <li>{t.settings.help_threads}</li>
            <li>{t.settings.help_share_memo}</li>
            <li>{t.settings.help_backup}</li>
            <li>{t.settings.help_markdown}</li>
            <li>{t.settings.help_tags}</li>
            <li>{t.settings.help_comments}</li>
            <li>{t.settings.help_math}</li>
          </HelpList>

          <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)' }}>{t.settings.share_app}</h4>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.settings.share_desc}</p>
            <ActionButton onClick={handleShare} style={{ width: '100%' }}>
              <FiShare2 /> {t.settings.share_app}
            </ActionButton>
          </div>

          <div style={{ marginTop: '2.5rem', padding: '1.25rem', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)', fontWeight: 600 }}>{t.settings.disclaimer_title}</h5>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5' }}>{t.settings.disclaimer_text}</p>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            BookMemo v1.2.2 • Local-First Reading Tracker & Memo
          </div>
        </Section>
      )}

      {showExportModal && (
        <ModalOverlay onClick={() => setShowExportModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>{t.settings.export_data}</ModalHeader>
            <ModalBody>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>{t.settings.export_mode}</label>
              <RadioLabel>
                <input type="radio" checked={exportMode === 'all'} onChange={() => setExportMode('all')} />
                {t.settings.all_data}
              </RadioLabel>
              <RadioLabel>
                <input type="radio" checked={exportMode === 'selected'} onChange={() => setExportMode('selected')} />
                {t.settings.select_memos}
              </RadioLabel>

              <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t.settings.filename_optional}</label>
                <Input
                  value={exportFileName}
                  onChange={e => setExportFileName(e.target.value)}
                  placeholder={t.settings.enter_filename}
                  style={{ width: '100%' }}
                />
              </div>

              {exportMode === 'selected' && (
                <ScrollableList>
                  {allMemos?.length === 0 ? (
                    <div style={{ padding: '0.5rem', opacity: 0.6 }}>{t.settings.no_memos_found}</div>
                  ) : (
                    allMemos?.map(memo => (
                      <CheckboxLabel key={memo.id}>
                        <input
                          type="checkbox"
                          checked={selectedMemos.has(memo.id!)}
                          onChange={() => toggleMemoSelection(memo.id!)}
                        />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {memo.title || t.sidebar.untitled}
                        </span>
                      </CheckboxLabel>
                    ))
                  )}
                </ScrollableList>
              )}
            </ModalBody>
            <ModalFooter>
              <ActionButton onClick={() => setShowExportModal(false)} $variant="secondary">{t.settings.cancel}</ActionButton>
              <ActionButton onClick={confirmExport} disabled={exportMode === 'selected' && selectedMemos.size === 0}>
                <FiDownload /> {t.settings.export}
              </ActionButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};
