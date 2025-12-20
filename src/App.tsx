import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SearchProvider } from './contexts/SearchContext';
import { MainLayout } from './components/Layout/MainLayout';
import { LogDetail } from './components/LogView/LogDetail';
import { EmptyState } from './components/LogView/EmptyState';
import { SettingsPage } from './pages/SettingsPage';

import { AndroidExitHandler } from './components/AndroidExitHandler';

function App() {
  return (
    <ThemeProvider>
      <SearchProvider>
        <HashRouter>
          <AndroidExitHandler />
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<EmptyState />} />
              <Route path="new" element={<LogDetail />} />
              <Route path="log/:id" element={<LogDetail />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </SearchProvider>
    </ThemeProvider>
  );
}

export default App;
