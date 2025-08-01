import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/services/api';
import sessionManager from '@/utils/sessionManager';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'school_admin';
  school_id?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    setupSessionManager();
  }, []);

  const setupSessionManager = () => {
    sessionManager.setLogoutCallback(() => {
      handleSessionExpired();
    });
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      setLoading(false);
      return;
    }

    // Check if session is still valid
    if (!sessionManager.isSessionValid()) {
      handleSessionExpired();
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Update session activity
      sessionManager.updateActivity();
      
      // Optionally, you can still make an API call to validate the token
      // const response = await api.get('/admin/profile');
      // setUser(response.data.data);
    } catch (error) {
      handleSessionExpired();
    } finally {
      setLoading(false);
    }
  };

  const handleSessionExpired = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionManager.clearSession();
    setUser(null);
    navigate('/login');
    toast.error('Session expired. Please log in again.');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionManager.clearSession();
    setUser(null);
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      logout,
      isAuthenticated: !!user,
      setUser,
      isSuperAdmin: user?.role === 'super_admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 