import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyFiles from './pages/MyFiles';
import Upload from './pages/Upload';
import AnalysisResult from './pages/AnalysisResult';
import AnalysisHistory from './pages/AnalysisHistory';
import BugReports from './pages/BugReports';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Initializing TraceFlow...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const location = useLocation();
  const hideGlobalNav =
    ['/login', '/register', '/dashboard', '/files', '/history', '/reports', '/upload'].includes(location.pathname) ||
    location.pathname.startsWith('/analysis');

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5fd] text-slate-900 selection:bg-blue-500 selection:text-white font-sans">
      {!hideGlobalNav && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <MyFiles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AnalysisHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <BugReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis/:id"
            element={
              <ProtectedRoute>
                <AnalysisResult />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
