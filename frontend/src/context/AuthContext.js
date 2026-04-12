// ============================================================
// src/context/AuthContext.js
// ============================================================
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '../services/api';
import { clearStoredAuth, getStoredToken, getStoredUser, persistAuth } from '../services/authStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(getStoredToken());

  const loadUser = useCallback(async () => {
    const savedToken = getStoredToken();
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await authService.getMe();
      setUser(res.data.user);
    } catch {
      clearStoredAuth();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password, options = {}) => {
    const res = await authService.login({ email, password });
    const { token: newToken, user: newUser } = res.data;
    persistAuth(newToken, newUser, options);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (data, options = {}) => {
    const res = await authService.register(data);
    const { token: newToken, user: newUser } = res.data;
    persistAuth(newToken, newUser, options);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated) => setUser((prev) => ({ ...prev, ...updated }));

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isTeacherOrAdmin = isTeacher || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAdmin,
        isTeacher,
        isStudent,
        isTeacherOrAdmin,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
