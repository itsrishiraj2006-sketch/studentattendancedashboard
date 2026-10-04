import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfigProvider } from './context/ConfigContext';

import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManageStudents from './pages/ManageStudents';
import ManageSubjects from './pages/ManageSubjects';
import MarkAttendance from './pages/MarkAttendance';
import AttendanceRecords from './pages/AttendanceRecords';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import StudentProfile from './pages/StudentProfile';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RoleBasedHome() {
  const { user } = useAuth();
  if (user?.role === 'STUDENT') {
    return <StudentDashboard />;
  }
  return <AdminDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfigProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Protected Routes inside DashboardLayout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <RoleBasedHome />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/students"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                    <DashboardLayout>
                      <ManageStudents />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/subjects"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ManageSubjects />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <StudentDashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/mark-attendance"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                    <DashboardLayout>
                      <MarkAttendance />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/records"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                    <DashboardLayout>
                      <AttendanceRecords />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                    <DashboardLayout>
                      <AnalyticsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                    <DashboardLayout>
                      <ReportsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                    <DashboardLayout>
                      <SettingsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <StudentProfile />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ConfigProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
