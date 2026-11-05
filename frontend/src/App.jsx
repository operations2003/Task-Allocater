import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { NeraLayout } from './layouts/NeraLayout.jsx';

// Core Pages Recreated faithfully from Nera Command Hub
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { CommandCentrePage } from './pages/ceo/CommandCentrePage.jsx';
import { TaskLedgerPage } from './pages/tasks/TaskLedgerPage.jsx';
import { TaskDetailPage } from './pages/tasks/TaskDetailPage.jsx';
import { ApprovalsPage } from './pages/ceo/ApprovalsPage.jsx';
import { PeopleLoadPage } from './pages/team/PeopleLoadPage.jsx';
import { AiControlPage } from './pages/ceo/AiControlPage.jsx';
import { MyTasksPage } from './pages/tasks/MyTasksPage.jsx';

// Protected Route Wrapper
const ProtectedRoute = ({ children, ceoOnly = false }) => {
  const { user, isCeo, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-foreground">
        <div className="w-8 h-8 border-2 border-white/20 border-t-signal rounded-full animate-spin" />
        <p className="eyebrow mt-4 text-signal/80">
          Verifying session…
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

// Root Switcher based on role
const RootRoute = () => {
  const { isCeo } = useAuth();
  return isCeo ? <CommandCentrePage /> : <MyTasksPage />;
};

export const App = () => {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Application Shell with NeraLayout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <NeraLayout />
                </ProtectedRoute>
              }
            >
              {/* Root: Command Centre (CEO) or My Workspace (Employee) */}
              <Route index element={<RootRoute />} />

              {/* Task Ledger */}
              <Route path="tasks" element={<TaskLedgerPage />} />

              {/* Task Detail & Audit Trail */}
              <Route path="tasks/:id" element={<TaskDetailPage />} />

              {/* CEO Approvals */}
              <Route
                path="approvals"
                element={
                  <ProtectedRoute ceoOnly>
                    <ApprovalsPage />
                  </ProtectedRoute>
                }
              />

              {/* People & Load */}
              <Route
                path="team"
                element={
                  <ProtectedRoute ceoOnly>
                    <PeopleLoadPage />
                  </ProtectedRoute>
                }
              />

              {/* AI Control */}
              <Route
                path="ai"
                element={
                  <ProtectedRoute ceoOnly>
                    <AiControlPage />
                  </ProtectedRoute>
                }
              />

              {/* Employee Dedicated Tasks View */}
              <Route path="my-tasks" element={<MyTasksPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;
