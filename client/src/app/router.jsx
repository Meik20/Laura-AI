import { createBrowserRouter, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import LearnLayout from '../layouts/LearnLayout';
import TutorLayout from '../layouts/TutorLayout';
import AdminLayout from '../layouts/AdminLayout';

// Public Pages
import HomePage from '../pages/public/HomePage';
import LoginPage from '../pages/public/LoginPage';
import SignupPage from '../pages/public/SignupPage';
import BecomeTutorPage from '../pages/public/BecomeTutorPage';
import TutorApplyPage from '../pages/public/TutorApplyPage';
import HowItWorksPage from '../pages/public/HowItWorksPage';
import TutorStatusPage from '../pages/tutor/TutorStatusPage';

// Learn Pages
import LearnDashboardPage from '../pages/learn/LearnDashboardPage';
import LearnChatPage from '../pages/learn/LearnChatPage';
import LearnRevisionPage from '../pages/learn/LearnRevisionPage';
import LearnExamsPage from '../pages/learn/LearnExamsPage';
import LearnResourcesPage from '../pages/learn/LearnResourcesPage';
import LearnProgressPage from '../pages/learn/LearnProgressPage';
import LearnProfilePage from '../pages/learn/LearnProfilePage';
import LearnHistoryPage from '../pages/learn/LearnHistoryPage';
import LearnSettingsPage from '../pages/learn/LearnSettingsPage';

// Tutor Pages
import TutorDashboardPage from '../pages/tutor/TutorDashboardPage';
import TutorChatPage from '../pages/tutor/TutorChatPage';
import TutorSubmissionsPage from '../pages/tutor/TutorSubmissionsPage';
import TutorProfilePage from '../pages/tutor/TutorProfilePage';
import TutorHistoryPage from '../pages/tutor/TutorHistoryPage';
import TutorSettingsPage from '../pages/tutor/TutorSettingsPage';
import TutorResourcesPage from '../pages/tutor/TutorResourcesPage';

// Admin Pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminTutorsPage from '../pages/admin/AdminTutorsPage';
import AdminTutorApplicationsPage from '../pages/admin/AdminTutorApplicationsPage';
import AdminResourcesPage from '../pages/admin/AdminResourcesPage';
import AdminContributionsPage from '../pages/admin/AdminContributionsPage';
import AdminSubmissionsPage from '../pages/admin/AdminSubmissionsPage';
import AdminAccessRulesPage from '../pages/admin/AdminAccessRulesPage';
import AdminAuditPage from '../pages/admin/AdminAuditPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminCommunityPage from '../pages/admin/AdminCommunityPage';
import AdminSupportPage from '../pages/admin/AdminSupportPage';
import LearnCommunityPage from '../pages/learn/LearnCommunityPage';

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
    ],
  },
  {
    path: '/learn',
    element: <LearnLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <LearnDashboardPage /> },
      { path: 'chat', element: <LearnChatPage /> },
      { path: 'revision', element: <LearnRevisionPage /> },
      { path: 'exams', element: <LearnExamsPage /> },
      { path: 'resources', element: <LearnResourcesPage /> },
      { path: 'progress', element: <LearnProgressPage /> },
      { path: 'profile', element: <LearnProfilePage /> },
      { path: 'history', element: <LearnHistoryPage /> },
      { path: 'settings', element: <LearnSettingsPage /> },
      { path: 'community', element: <LearnCommunityPage /> },
    ],
  },
  {
    path: '/tutor',
    element: <TutorLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <TutorDashboardPage /> },
      { path: 'chat', element: <TutorChatPage /> },
      { path: 'submissions', element: <TutorSubmissionsPage /> },
      { path: 'profile', element: <TutorProfilePage /> },
      { path: 'history', element: <TutorHistoryPage /> },
      { path: 'settings', element: <TutorSettingsPage /> },
      { path: 'resources', element: <TutorResourcesPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'tutor-applications', element: <AdminTutorApplicationsPage /> },
      { path: 'tutors', element: <AdminTutorsPage /> },
      { path: 'resources', element: <AdminResourcesPage /> },
      { path: 'contributions', element: <AdminContributionsPage /> },
      { path: 'submissions', element: <AdminSubmissionsPage /> },
      { path: 'access-rules', element: <AdminAccessRulesPage /> },
      { path: 'audit', element: <AdminAuditPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      { path: 'community', element: <AdminCommunityPage /> },
      { path: 'support', element: <AdminSupportPage /> },
    ],
  },
  {
    path: '*',
    element: <div>Page introuvable (404)</div>,
  }
]);
