import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isBiometricEnabled: boolean;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isBiometricEnabled: false,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {},
  setBiometricEnabled: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabledState] = useState(false);

  useEffect(() => {
    // Check if user is already logged in on app start
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      // Migrate token from AsyncStorage to SecureStore if needed
      let storedToken = await SecureStore.getItemAsync('userToken');
      if (!storedToken) {
        storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          await SecureStore.setItemAsync('userToken', storedToken);
          await AsyncStorage.removeItem('userToken');
        }
      }
      
      const storedUser = await AsyncStorage.getItem('userData');
      const biometricPref = await AsyncStorage.getItem('biometricEnabled');
      
      if (biometricPref === 'true') {
        setIsBiometricEnabledState(true);
      }
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load login status', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, userToken: string) => {
    try {
      await SecureStore.setItemAsync('userToken', userToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setToken(userToken);
      setUser(userData);
    } catch (e) {
      console.error('Failed to save login data', e);
    }
  };

  const logout = async () => {
    try {
      if (!isBiometricEnabled) {
        await SecureStore.deleteItemAsync('userToken');
        await AsyncStorage.removeItem('userData');
      }
      setToken(null);
      setUser(null);
      router.replace('/login');
    } catch (e) {
      console.error('Failed to logout', e);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      if (user) {
        const updatedUser = { ...user, ...updates };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (e) {
      console.error('Failed to update user', e);
    }
  };

  const setBiometricEnabled = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('biometricEnabled', enabled ? 'true' : 'false');
      setIsBiometricEnabledState(enabled);
    } catch (e) {
      console.error('Failed to save biometric preference', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isBiometricEnabled, login, logout, updateUser, setBiometricEnabled }}>
      {children}
    </AuthContext.Provider>
  );
};
