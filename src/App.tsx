import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SearchProvider } from './contexts/SearchContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ExitGuardProvider } from './contexts/ExitGuardContext';
import { MainLayout } from './components/Layout/MainLayout';
import { BookDetail } from './components/BookView/BookDetail';
import { AddBookPage } from './components/BookView/AddBookPage';
import { EditBookPage } from './components/BookView/EditBookPage';
import { MemoDetail } from './components/LogView/MemoDetail';
import { EmptyState } from './components/LogView/EmptyState';
import { SettingsPage } from './pages/SettingsPage';
import { AndroidExitHandler } from './components/AndroidExitHandler';

function App() {
  return (
    <LanguageProvider>
      <ExitGuardProvider>
        <ThemeProvider>
          <SearchProvider>
            <HashRouter>
              <AndroidExitHandler />
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<EmptyState />} />
                  <Route path="book/new" element={<AddBookPage />} />
                  <Route path="book/:id/edit" element={<EditBookPage />} />
                  <Route path="book/:id" element={<BookDetail />} />
                  <Route path="book/:bookId/new" element={<MemoDetail />} />
                  <Route path="memo/:id" element={<MemoDetail />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </HashRouter>
          </SearchProvider>
        </ThemeProvider>
      </ExitGuardProvider>
    </LanguageProvider>
  );
}

export default App;
