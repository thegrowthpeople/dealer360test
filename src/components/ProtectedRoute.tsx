import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'manager' | 'user';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { canAccessRoute, userRole } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const roleHierarchy = { admin: 3, manager: 2, user: 1 };
    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
