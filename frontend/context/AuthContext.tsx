'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authAPI } from '@/services/api';
import { User, UserRole, AuthState, AuthResult, RegisterData, Customer } from '@/types';

const AuthContext = createContext<AuthState | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role') as UserRole | null;

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
    }
    setLoading(false);
  }, []);

  const login = async (
    username: string,
    password: string,
    isAdmin: boolean = false
  ): Promise<AuthResult> => {
    try {
      const response = isAdmin
        ? await authAPI.adminLogin({ username, password })
        : await authAPI.customerLogin({ username, password });

      const { token: authToken, customer, admin } = response.data;
      const userData = (customer || admin) as User;
      const userRole: UserRole = isAdmin ? 'admin' : 'customer';

      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userRole);

      setToken(authToken);
      setUser(userData);
      setRole(userRole);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (userData: RegisterData): Promise<AuthResult> => {
    try {
      await authAPI.customerRegister(userData);
      return { success: true, message: 'Registration successful! Please login.' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setToken(null);
    setUser(null);
    setRole(null);
  };

  const value: AuthState = {
    user,
    token,
    role,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isAdmin: role === 'admin',
    isCustomer: role === 'customer',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to get customer-specific data
export function useCustomer(): Customer | null {
  const { user, isCustomer } = useAuth();
  if (isCustomer && user) {
    return user as Customer;
  }
  return null;
}

export default AuthContext;
