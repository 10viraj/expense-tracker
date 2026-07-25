import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsContextType = {
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
};

export const SettingsContext = createContext<SettingsContextType>({
  currency: '₹',
  setCurrency: async () => {},
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrencyState] = useState<string>('₹');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedCurrency = await AsyncStorage.getItem('userCurrency');
      if (storedCurrency) {
        setCurrencyState(storedCurrency);
      }
    } catch (e) {
      console.error('Failed to load currency', e);
    }
  };

  const setCurrency = async (newCurrency: string) => {
    try {
      await AsyncStorage.setItem('userCurrency', newCurrency);
      setCurrencyState(newCurrency);
    } catch (e) {
      console.error('Failed to save currency', e);
    }
  };

  return (
    <SettingsContext.Provider value={{ currency, setCurrency }}>
      {children}
    </SettingsContext.Provider>
  );
};
