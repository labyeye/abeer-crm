import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'chairman' | 'company_admin' | 'branch_head' | 'staff' | 'client';
  companyId?: string;
  branchId?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to map backend roles to frontend roles
const mapBackendRoleToFrontend = (backendRole: string): User['role'] => {
  switch (backendRole) {
    case 'admin':
      return 'company_admin';
    case 'manager':
      return 'branch_head';
    default:
      return backendRole as User['role'];
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          // Verify token with backend
          const response = await authAPI.getMe();
          const mappedUser = {
            ...response.user,
            role: mapBackendRoleToFrontend(response.user.role)
          };
          setUser(mappedUser);
        } catch (error) {
          // Token is invalid, clear storage
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔐 AuthContext: Starting login process for:', email);
    setLoading(true);
    
    try {
      console.log('📡 AuthContext: Calling authAPI.login...');
      const response = await authAPI.login(email, password);
      console.log('📨 AuthContext: Login response:', response);
      
      // Store token and user data
      localStorage.setItem('token', response.token);
      const mappedUser = {
        ...response.user,
        role: mapBackendRoleToFrontend(response.user.role)
      };
      console.log('👤 AuthContext: Mapped user:', mappedUser);
      localStorage.setItem('user', JSON.stringify(mappedUser));
      
      setUser(mappedUser);
      console.log('✅ AuthContext: User state set successfully');
    } catch (error: unknown) {
      console.error('❌ AuthContext: Login failed:', error);
      const message = error instanceof Error && 'response' in error 
        ? (error as any).response?.data?.message || error.message
        : 'Login failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    
    const rolePermissions = {
      chairman: ['all'],
      company_admin: ['company_manage', 'branch_manage', 'staff_manage', 'reports'],
      branch_head: ['branch_manage', 'staff_manage', 'bookings'],
      staff: ['own_tasks', 'attendance'],
      client: ['own_bookings', 'payments']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};