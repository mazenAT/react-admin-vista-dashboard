import { useAuth } from '@/contexts/AuthContext';

// Helper function to get school_id for normal admins
export const getSchoolIdForAdmin = (): number | undefined => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.school_id || undefined;
};

// Helper function to add school_id to params for normal admins
export const addSchoolIdToParams = (params: any = {}): any => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // If user is not super_admin and has a school_id, add it to params
  if (user.role !== 'super_admin' && user.school_id) {
    return { ...params, school_id: user.school_id };
  }
  
  return params;
};

// Helper function to check if user is super admin
export const isSuperAdmin = (): boolean => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === 'super_admin';
};

// Helper function to get user role
export const getUserRole = (): string => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role || '';
}; 