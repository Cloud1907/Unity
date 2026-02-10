import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    // Check for stale Test User data and clear it
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.fullName === 'Test User' || u.username === 'test' || u.email === 'test@example.com') {
          // Force clearing stale Test User data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          return;
        }
      } catch (e) {
        console.error('Error checking stored user:', e);
      }
    }

    if (token) {
      try {
        const response = await authAPI.getMe();
        const normalizedUser = {
          ...response.data,
          id: response.data.id || response.data.Id,
          fullName: response.data.fullName || response.data.FullName,
          email: response.data.email || response.data.Email,
          avatar: response.data.avatar || response.data.Avatar,
          color: response.data.color || response.data.Color,
          role: response.data.role || response.data.Role
        };
        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    setLoading(false);
  };

  /**
   * Refetches user profile from backend to sync permissions/data
   */
  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      const normalizedUser = {
        ...response.data,
        id: response.data.id || response.data.Id,
        fullName: response.data.fullName || response.data.FullName,
        email: response.data.email || response.data.Email,
        avatar: response.data.avatar || response.data.Avatar,
        color: response.data.color || response.data.Color,
        role: response.data.role || response.data.Role
      };
      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      return { success: true, data: normalizedUser };
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return { success: false, error };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { access_token, accessToken, refresh_token, user: userData } = response.data;
      const finalToken = accessToken || access_token;

      if (finalToken) {
        localStorage.setItem('token', finalToken);
      }
      if (refresh_token) {
        localStorage.setItem('refreshToken', refresh_token);
      }

      const normalizedUser = {
        ...userData,
        id: userData.id || userData.Id,
        fullName: userData.fullName || userData.FullName,
        email: userData.email || userData.Email,
        avatar: userData.avatar || userData.Avatar,
        color: userData.color || userData.Color,
        role: userData.role || userData.Role
      };

      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      let errorMessage = 'Giriş başarısız';

      if (error.response) {
        // Check for backend-provided detail message first
        if (error.response.data && error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.status === 401) {
          // Fallback for 401 without detail
          errorMessage = 'E-posta veya şifre hatalı';
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      const { access_token, refresh_token, user: userData } = response.data;

      localStorage.setItem('token', access_token);
      if (refresh_token) {
        localStorage.setItem('refreshToken', refresh_token);
      }
      const normalizedUser = {
        ...userData,
        id: userData.id || userData.Id,
        fullName: userData.fullName || userData.FullName,
        email: userData.email || userData.Email,
        avatar: userData.avatar || userData.Avatar,
        color: userData.color || userData.Color,
        role: userData.role || userData.Role
      };

      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);

      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Kayıt başarısız'
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      await authAPI.forgotPassword(email);
      return { success: true };
    } catch (error) {
      console.error('Forgot password failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Şifre sıfırlama işlemi başarısız.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const updateUser = (userData) => {
    const normalizedUser = {
      ...userData,
      id: userData.id || userData.Id,
      fullName: userData.fullName || userData.FullName,
      email: userData.email || userData.Email,
      avatar: userData.avatar || userData.Avatar,
      color: userData.color || userData.Color,
      role: userData.role || userData.Role
    };
    setUser(normalizedUser);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
  };

  // Update user preferences (column visibility, etc.) to backend
  const updatePreferences = async (preferencesData) => {
    try {
      const response = await authAPI.updatePreferences(preferencesData);
      // Update local user state with new preferences
      const updatedUser = { ...user };
      if (response.data?.columnPreferences) {
        updatedUser.columnPreferences = response.data.columnPreferences;
      }
      if (response.data?.sidebarPreferences) {
        updatedUser.sidebarPreferences = response.data.sidebarPreferences;
      }
      if (response.data?.workspacePreferences) {
        updatedUser.workspacePreferences = response.data.workspacePreferences;
      }

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      console.error('Failed to update preferences:', error);
      return { success: false, error: error.response?.data?.message || 'Tercih güncellenemedi' };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    forgotPassword,
    logout,
    updateUser,
    refreshUser,
    updatePreferences,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
