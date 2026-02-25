import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ServerDetail } from './pages/ServerDetail';
import { ServerEdit } from './pages/ServerEdit';
import { Settings } from './pages/Settings';
import { UserManagement } from './pages/UserManagement';
import { Incidents } from './pages/Incidents';
import { StatusPage } from './pages/StatusPage';

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/status" element={<StatusPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/servers/:id"
              element={
                <ProtectedRoute>
                  <Layout><ServerDetail /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/servers/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout><ServerEdit /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout><Settings /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/incidents"
              element={
                <ProtectedRoute>
                  <Layout><Incidents /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Layout><UserManagement /></Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
