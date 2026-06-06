import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './routes/LoginPage';
import ConsolePage from './routes/ConsolePage';
import EditorPage from './routes/EditorPage';
import SettingsPage from './routes/SettingsPage';
import { useAuthStore } from './store/auth';
import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from './lib/socket';

export default function App() {
  const user = useAuthStore((s) => s.user);
  const restore = useAuthStore((s) => s.restore);

  useEffect(() => {
    restore();
  }, [restore]);

  useEffect(() => {
    if (user) connectSocket();
    else disconnectSocket();
  }, [user]);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/console" /> : <LoginPage />} />
      <Route path="/console" element={user ? <ConsolePage /> : <Navigate to="/login" />} />
      <Route path="/editor/:projectId" element={user ? <EditorPage /> : <Navigate to="/login" />} />
      <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={user ? '/console' : '/login'} />} />
    </Routes>
  );
}
