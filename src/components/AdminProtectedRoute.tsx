import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  superAdminOnly?: boolean;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children, superAdminOnly }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  // Check if user is logged in and is an admin or super admin
  const isAdmin = user ? (user.role === 'admin' || user.role === 'super_admin') : false;
  const isSuperAdmin = user ? user.role === 'super_admin' : false;

  if (!token || !isAdmin || (superAdminOnly && !isSuperAdmin)) {
    // Redirect to login page but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute; 