import { createBrowserRouter, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import LearnLayout from '../layouts/LearnLayout';
import TutorLayout from '../layouts/TutorLayout';
import AdminLayout from '../layouts/AdminLayout';

// Public Pages
import HomePage from '../pages/public/HomePage';
import LoginPage from '../pages/public/LoginPage';
import SignupPage from '../pages/public/SignupPage';

// Learn Pages
import LearnDashboardPage from '../pages/learn/LearnDashboardPage';
import LearnChatPage from '../pages/learn/LearnChatPage';
import LearnRevisionPage from '../pages/learn/LearnRevisionPage';
import LearnExamsPage from '../pages/learn/LearnExamsPage';
import LearnResourcesPage from '../pages/learn/LearnResourcesPage';
import LearnProgressPage from '../pages/learn/LearnProgressPage';

// Tutor Pages
import TutorDashboardPage from '../pages/tutor/TutorDashboardPage';
import TutorChatPage from '../pages/tutor/TutorChatPage';
import TutorSubmissionsPage from '../pages/tutor/TutorSubmissionsPage';
import BecomeTutorPage from '../pages/public/BecomeTutorPage';
import TutorApplyPage from '../pages/public/TutorApplyPage';
import HowItWorksPage from '../pages/public/HowItWorksPage';
import TutorStatusPage from '../pages/tutor/TutorStatusPage';

// Admin Pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminTutorApplicationsPage from '../pages/admin/AdminTutorApplicationsPage';
import AdminResourcesPage from '../pages/admin/AdminResourcesPage';
import AdminAccessRulesPage from '../pages/admin/AdminAccessRulesPage';
import AdminAuditPage from '../pages/admin/AdminAuditPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'how-it-works', element: <HowItWorksPage /> },
      { path: 'become-tutor', element: <BecomeTutorPage /> },
      { path: 'tutor/apply', element: <TutorApplyPage /> },
      { path: 'tutor/status', element: <TutorStatusPage /> },
      // Add other public routes here (about, features, etc.)
    ],
  },
  {
    path: '/learn',
    element: <LearnLayout />, // Add ProtectedRoute wrapper here later
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <LearnDashboardPage /> },
      { path: 'chat', element: <LearnChatPage /> },
      { path: 'revision', element: <LearnRevisionPage /> },
      { path: 'exams', element: <LearnExamsPage /> },
      { path: 'resources', element: <LearnResourcesPage /> },
      { path: 'progress', element: <LearnProgressPage /> },
      // Add other learn routes here
    ],
  },
  {
    path: '/tutor',
    element: <TutorLayout />, // Add ProtectedRoute wrapper here later
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <TutorDashboardPage /> },
      { path: 'chat', element: <TutorChatPage /> },
      { path: 'submissions', element: <TutorSubmissionsPage /> },
      // Add other tutor routes here
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />, // Add ProtectedRoute wrapper here later
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'tutor-applications', element: <AdminTutorApplicationsPage /> },
      { path: 'resources', element: <AdminResourcesPage /> },
      { path: 'access-rules', element: <AdminAccessRulesPage /> },
      { path: 'audit', element: <AdminAuditPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      // Add other admin routes here
    ],
  },
  {
    path: '*',
    element: <div>Page introuvable (404)</div>,
  }
]);
