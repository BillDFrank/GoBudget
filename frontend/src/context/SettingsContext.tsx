import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsApi } from '../lib/api';

interface UserSettings {
  currency: string;
  date_format: string;
  timezone: string;
  dark_mode: boolean;
  email_notifications: boolean;
  budget_alerts: boolean;
  transaction_alerts: boolean;
  weekly_reports: boolean;
}

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  loading: boolean;
  formatCurrency: (amount: number) => string;
}

const defaultSettings: UserSettings = {
  currency: 'USD',
  date_format: 'MM/DD/YYYY',
  timezone: 'Eastern Time (ET)',
  dark_mode: false,
  email_notifications: true,
  budget_alerts: true,
  transaction_alerts: false,
  weekly_reports: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.get();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use defaults if loading fails
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      const response = await settingsApi.update(updates);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  const formatCurrency = (amount: number): string => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
    };

    const symbol = currencySymbols[settings.currency] || '$';
    return `${symbol}${amount.toFixed(2)}`;
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
    loading,
    formatCurrency,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};