import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsApi } from '../lib/api';
import { useAuthStore } from '../store/auth';

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

// Safe version of useSettings that can be used anywhere
export const useSettingsSafe = () => {
  const context = useContext(SettingsContext);
  return context; // Returns undefined if not within SettingsProvider
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Only load settings if user is authenticated
    if (isAuthenticated) {
      loadSettings();
    } else {
      // Reset to defaults when not authenticated
      setSettings(defaultSettings);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    // Don't try to load settings if not authenticated
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    try {
      const response = await settingsApi.get();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use defaults if loading fails
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    // Don't try to update settings if not authenticated
    if (!isAuthenticated) {
      console.warn('Cannot update settings: user not authenticated');
      return;
    }

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