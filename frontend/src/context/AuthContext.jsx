import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, socialLoginUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('traceflow_token');
    const userData = localStorage.getItem('traceflow_user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        localStorage.removeItem('traceflow_token');
        localStorage.removeItem('traceflow_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    const userPayload = {
      id: data.userId,
      username: data.username,
      email: data.email,
      token: data.token,
    };
    localStorage.setItem('traceflow_token', data.token);
    localStorage.setItem('traceflow_user', JSON.stringify(userPayload));
    setUser(userPayload);
    return data;
  };

  const register = async (userData) => {
    const data = await registerUser(userData);
    const userPayload = {
      id: data.userId,
      username: data.username,
      email: data.email,
      token: data.token,
    };
    localStorage.setItem('traceflow_token', data.token);
    localStorage.setItem('traceflow_user', JSON.stringify(userPayload));
    setUser(userPayload);
    return data;
  };

  const socialLogin = async (socialData) => {
    const data = await socialLoginUser(socialData);
    const userPayload = {
      id: data.userId,
      username: data.username,
      email: data.email,
      token: data.token,
    };
    localStorage.setItem('traceflow_token', data.token);
    localStorage.setItem('traceflow_user', JSON.stringify(userPayload));
    setUser(userPayload);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('traceflow_token');
    localStorage.removeItem('traceflow_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, socialLogin, logout, loading, isAuthenticated: !!user }}>
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
