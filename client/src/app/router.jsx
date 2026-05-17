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

// Tutor Pages
import TutorDashboardPage from '../pages/tutor/TutorDashboardPage';

// Admin Pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      // Add other public routes here (about, features, etc.)
    ],
  },
  {
    path: '/learn',
    element: <LearnLayout />, // Add ProtectedRoute wrapper here later
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <LearnDashboardPage /> },
      // Add other learn routes here
    ],
  },
  {
    path: '/tutor',
    element: <TutorLayout />, // Add ProtectedRoute wrapper here later
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <TutorDashboardPage /> },
      // Add other tutor routes here
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />, // Add ProtectedRoute wrapper here later
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      // Add other admin routes here
    ],
  },
  {
    path: '*',
    element: <div>Page introuvable (404)</div>,
  }
]);
