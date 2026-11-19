import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fish_quest_token') || null);
  const [loading, setLoading] = useState(true);

  // Load virtual identity profile when token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.getProfile();
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Failed to load user identity:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (username, password) => {
    const res = await api.login({ username, password });
    if (res.success && res.token) {
      localStorage.setItem('fish_quest_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (username, email, password, avatar) => {
    const res = await api.register({ username, email, password, avatar });
    if (res.success && res.token) {
      localStorage.setItem('fish_quest_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('fish_quest_token');
    setToken(null);
    setUser(null);
  };

  const updateAvatar = async (avatar) => {
    const res = await api.updateAvatar(avatar);
    if (res.success) {
      setUser((prev) => (prev ? { ...prev, avatar } : prev));
    }
    return res;
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const response = await api.getProfile();
      if (response.success && response.user) {
        setUser(response.user);
      }
    } catch (e) {
      console.warn('Failed refreshing user profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateAvatar,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

