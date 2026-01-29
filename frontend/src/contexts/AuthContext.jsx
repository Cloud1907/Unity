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
        // Backend check: if backend returns Test User (which we deleted, but just in case)
        if (response.data.fullName === 'Test User') {
          throw new Error('Invalid Test User returned from backend');
        }
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
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

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

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
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

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
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    loading,
    login,
    register,
    forgotPassword,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
