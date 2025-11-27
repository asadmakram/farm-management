import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import i18n from '../i18n';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Set language from user preference
          if (parsedUser.preferredLanguage) {
            await AsyncStorage.setItem('userLanguage', parsedUser.preferredLanguage);
            i18n.changeLanguage(parsedUser.preferredLanguage);
          }
        }
      } catch (err) {
        // swallow and continue so UI doesn't hang
      } finally {
        setLoading(false);
      }
    };

    // safety fallback: ensure loading doesn't remain true indefinitely
    const timeout = setTimeout(() => setLoading(false), 5000);
    loadUser().finally(() => clearTimeout(timeout));
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      // Set language from user preference
      if (user.preferredLanguage) {
        await AsyncStorage.setItem('userLanguage', user.preferredLanguage);
        i18n.changeLanguage(user.preferredLanguage);
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      // Set language from user preference
      if (user.preferredLanguage) {
        await AsyncStorage.setItem('userLanguage', user.preferredLanguage);
        i18n.changeLanguage(user.preferredLanguage);
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    setUser,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};