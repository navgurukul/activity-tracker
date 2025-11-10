import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

// Pages
import LoginPage from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Tracker from '@/pages/Tracker';
import CompOff from '@/pages/CompOff';
import Projects from '@/pages/Projects';
import AdminDashboard from '@/pages/Admin/AdminDashboard';
import AccessControl from '@/pages/Admin/AccessControl';
import LeaveApplication from '@/pages/Leaves/LeaveApplication';
import LeaveHistory from '@/pages/Leaves/LeaveHistory';

/**
 * Application Routes
 * Defines all routes for the application with React Router
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes */}
        <Route element={<AuthenticatedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/compoff" element={<CompOff />} />
          <Route path="/projects" element={<Projects />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/access-control" element={<AccessControl />} />
          
          {/* Leave Routes */}
          <Route path="/leaves/application" element={<LeaveApplication />} />
          <Route path="/leaves/history" element={<LeaveHistory />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
