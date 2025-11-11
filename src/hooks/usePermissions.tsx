import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { userRole, bdmId, isAdmin, isManager, isUser, loading } = useAuth();

  const canAccessRoute = (route: string): boolean => {
    if (loading) return false;
    
    // Admin can access everything
    if (isAdmin) return true;
    
    // Route-specific permissions
    if (route === '/admin') {
      return isAdmin;
    }
    
    // All authenticated users can access other routes
    return true;
  };

  const canPerformAction = (action: string): boolean => {
    if (loading) return false;
    
    // Action-specific permissions
    switch (action) {
      case 'manage-users':
        return isAdmin;
      case 'view-all-bdms':
        return isAdmin || isManager;
      case 'export-data':
        return isAdmin || isManager;
      default:
        return true;
    }
  };

  return {
    isAdmin,
    isManager,
    isUser,
    userRole,
    bdmId,
    canAccessRoute,
    canPerformAction,
    loading,
  };
}
