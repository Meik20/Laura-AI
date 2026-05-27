import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Guard to restrict access to authenticated users with specific roles.
 */
export function RoleGuard({ children, allowedRoles }) {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If the profile is not yet loaded, we can show a loader
  if (!userProfile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--srf-base)' }}>
        <div className="laura-typing" style={{ color: 'var(--clr-brand)' }}>Chargement du profil...</div>
      </div>
    );
  }

  const userRole = userProfile.role || 'student';

  if (!allowedRoles.includes(userRole)) {
    // If learner (student), redirect to learn dashboard. If tutor, redirect to tutor dashboard.
    if (userRole === 'teacher' || userRole === 'tutor') {
      return <Navigate to="/tutor/dashboard" replace />;
    } else if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/learn/dashboard" replace />;
  }

  return children;
}
