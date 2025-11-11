import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { userRole, bdmId, isAdmin, isManager, isUser, loading } = useAuth();

  const canAccessRoute = (route: string): boolean => {
    if (loading) return false;
    
    // Admin routes
    if (route === '/admin') {
      return isAdmin;
    }
    
    // All authenticated users can access other routes
    return true;
  };

  const canPerformAction = (action: string): boolean => {
    if (loading) return false;

    switch (action) {
      case 'manage-users':
        return isAdmin;
      case 'view-all-bdms':
        return isAdmin || (isManager && bdmId === null);
      case 'edit-filters':
        return isAdmin || isManager;
      default:
        return false;
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
