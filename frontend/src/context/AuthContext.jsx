import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);

let memoryToken = null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    memoryToken = data.token;
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    memoryToken = null;
    setUser(null);
  }, []);

  const getToken = useCallback(() => memoryToken, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function getMemoryToken() {
  return memoryToken;
}