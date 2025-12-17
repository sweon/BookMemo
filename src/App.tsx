import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { MainLayout } from './components/Layout/MainLayout';
import { LogDetail } from './components/LogView/LogDetail';
import { EmptyState } from './components/LogView/EmptyState';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
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
    </ThemeProvider>
  );
}

export default App;
