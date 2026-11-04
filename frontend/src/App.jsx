import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { CeoLayout } from './layouts/CeoLayout.jsx';
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { CeoCommandCentrePage } from './pages/ceo/CeoCommandCentrePage.jsx';
import { CeoTaskManagementPage } from './pages/ceo/CeoTaskManagementPage.jsx';
import { AiTaskAllocationPage } from './pages/ceo/AiTaskAllocationPage.jsx';
import { PendingTasksPage } from './pages/ceo/PendingTasksPage.jsx';
import { CeoApprovalPage } from './pages/ceo/CeoApprovalPage.jsx';
import { EmployeeDirectoryPage } from './pages/employees/EmployeeDirectoryPage.jsx';
import { EmployeeWorkspacePage } from './pages/tasks/EmployeeWorkspacePage.jsx';
import { LoadingSpinner } from './components/common/LoadingSpinner.jsx';

// Protected Route Wrapper
const ProtectedRoute = ({ children, ceoOnly = false }) => {
  const { user, isCeo, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center text-white">
        <LoadingSpinner />
        <p className="text-xs font-semibold text-slate-400 mt-4 tracking-wide uppercase">
          Verifying Executive Session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (ceoOnly && !isCeo) {
    return <Navigate to="/my-tasks" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Standalone CEO Command Centre Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <CeoLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<CeoCommandCentrePage />} />
              <Route
                path="tasks"
                element={
                  <ProtectedRoute ceoOnly>
                    <CeoTaskManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ai-allocation"
                element={
                  <ProtectedRoute ceoOnly>
                    <AiTaskAllocationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pending-tasks"
                element={
                  <ProtectedRoute ceoOnly>
                    <PendingTasksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="approvals"
                element={
                  <ProtectedRoute ceoOnly>
                    <CeoApprovalPage />
                  </ProtectedRoute>
                }
              />
              <Route path="employees" element={<EmployeeDirectoryPage />} />
              <Route path="my-tasks" element={<EmployeeWorkspacePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;
