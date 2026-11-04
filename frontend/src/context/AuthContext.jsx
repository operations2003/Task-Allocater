import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('tasknera_ceo_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('tasknera_ceo_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
          localStorage.setItem('tasknera_ceo_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Session verification failed, resetting auth state.', err);
          setUser(null);
          setToken(null);
          localStorage.removeItem('tasknera_ceo_token');
          localStorage.removeItem('tasknera_ceo_user');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    verifySession();

    const handleExpired = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('tasknera_ceo_token');
      localStorage.removeItem('tasknera_ceo_user');
    };

    window.addEventListener('tasknera:auth:expired', handleExpired);
    return () => window.removeEventListener('tasknera:auth:expired', handleExpired);
  }, [token]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('tasknera_ceo_token', data.token);
    localStorage.setItem('tasknera_ceo_user', JSON.stringify(data.user));
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore API logout error
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('tasknera_ceo_token');
      localStorage.removeItem('tasknera_ceo_user');
    }
  };

  const isCeo = user?.role === 'CEO' || user?.isCeo === true;

  const hasRole = (roles) => {
    if (!user) return false;
    const targetRoles = (Array.isArray(roles) ? roles : [roles]).map((r) =>
      r.toLowerCase()
    );
    return targetRoles.includes((user.role || '').toLowerCase());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isCeo,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
