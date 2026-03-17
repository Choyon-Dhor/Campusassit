// ============================================================
// src/context/AuthContext.js
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('campusassist_token'));

  const loadUser = useCallback(async () => {
    const savedToken = localStorage.getItem('campusassist_token');
    if (!savedToken) { setLoading(false); return; }
    try {
      const res = await authService.getMe();
      setUser(res.data.user);
    } catch {
      localStorage.removeItem('campusassist_token');
      localStorage.removeItem('campusassist_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('campusassist_token', newToken);
    localStorage.setItem('campusassist_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('campusassist_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('campusassist_token');
    localStorage.removeItem('campusassist_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated) => setUser(prev => ({ ...prev, ...updated }));

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isTeacherOrAdmin = isTeacher || isAdmin;

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, register, logout, updateUser,
      isAdmin, isTeacher, isStudent, isTeacherOrAdmin,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
