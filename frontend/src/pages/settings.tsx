import AdminLayout from '../layout/AdminLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { outlookApi, categoriesApi, personsApi, settingsApi } from '../lib/api';
import { useSettings } from '../context/SettingsContext';


export default function Settings() {
  const router = useRouter();
  const { settings: userSettings, updateSettings: updateUserSettings, loading: settingsLoading } = useSettings();
  
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [outlookStatus, setOutlookStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [deviceCodeInfo, setDeviceCodeInfo] = useState<{
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
    message: string;
  } | null>(null);
  const [polling, setPolling] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [persons, setPersons] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newPerson, setNewPerson] = useState('');
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingPerson, setEditingPerson] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkOutlookStatus();
    loadCategories();
    loadPersons();
    
    // Handle OAuth callback from Microsoft
    if (router.query.code && router.query.state) {
      console.log('OAuth callback detected:', { code: router.query.code, state: router.query.state });
      handleOutlookCallback(router.query.code as string, router.query.state as string);
    } else if (router.query.outlook_connected === 'true') {
      setMessage('Outlook connected successfully!');
      setOutlookConnected(true);
      // Clean up URL
      router.replace('/settings', undefined, { shallow: true });
    } else if (router.query.outlook_error === 'true') {
      setMessage('Failed to connect Outlook. Please try again.');
      // Clean up URL
      router.replace('/settings', undefined, { shallow: true });
    }
  }, [router.query, outlookConnected]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Settings handlers
  const handleSettingsUpdate = async (updates: any) => {
    setSaving(true);
    try {
      await updateUserSettings(updates);
      setMessage('Settings updated successfully!');
    } catch (error) {
      console.error('Failed to update settings:', error);
      setMessage('Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetUserSettings = async () => {
    setSaving(true);
    try {
      await settingsApi.reset();
      setMessage('Settings reset to defaults successfully!');
      // Reload the page to get fresh settings
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset settings:', error);
      setMessage('Failed to reset settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const checkOutlookStatus = async () => {
    try {
      const response = await outlookApi.getStatus();
      setOutlookStatus(response.data);
      setOutlookConnected(response.data.connected);
    } catch (error) {
      console.error('Failed to check Outlook status:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadPersons = async () => {
    try {
      const response = await personsApi.getAll();
      setPersons(response.data);
    } catch (error) {
      console.error('Failed to load persons:', error);
    }
  };

  const connectOutlook = async () => {
    try {
      setMessage('Initiating Outlook authorization...');

      // Get device code for authorization
      const response = await outlookApi.getAuthUrl();

      const deviceInfo = response.data;
      setDeviceCodeInfo(deviceInfo);
      setMessage(`Please visit ${deviceInfo.verification_uri} and enter code: ${deviceInfo.user_code}`);

      // Start polling for authorization completion
      setPolling(true);
      const pollInterval = setInterval(async () => {
        try {
          const pollResponse = await outlookApi.pollAuth();

          if (pollResponse.data.success) {
            // Authorization completed successfully
            clearInterval(pollInterval);
            setPolling(false);
            setDeviceCodeInfo(null);
            setMessage('Outlook connected successfully!');
            setOutlookConnected(true);
            await checkOutlookStatus();
          }
          // If still pending, continue polling
        } catch (pollError: any) {
          if (pollError.response?.status === 400) {
            const errorData = pollError.response.data;
            if (errorData.detail?.includes('declined') ||
                errorData.detail?.includes('expired') ||
                errorData.detail?.includes('failed')) {
              // Authorization failed or was declined
              clearInterval(pollInterval);
              setPolling(false);
              setDeviceCodeInfo(null);
              setMessage('Outlook authorization failed. Please try again.');
            }
            // If still pending, continue polling
          } else {
            // Other error, continue polling
            console.error('Polling error:', pollError);
          }
        }
      }, deviceInfo.interval * 1000); // Poll at the recommended interval

      // Stop polling after 15 minutes (device codes typically expire in 15 minutes)
      setTimeout(() => {
        clearInterval(pollInterval);
        setPolling(false);
        setDeviceCodeInfo(null);
        if (!outlookConnected) {
          setMessage('Authorization timed out. Please try again.');
        }
      }, 15 * 60 * 1000);

    } catch (error) {
      console.error('Failed to initiate device flow:', error);
      setMessage('Failed to initiate Outlook authorization. Please try again.');
      setDeviceCodeInfo(null);
      setPolling(false);
    }
  };

  const handleOutlookCallback = async (code: string, state: string) => {
    try {
      console.log('Handling Outlook callback with code and state');
      
      // Send code and state to backend for token exchange
      const response = await outlookApi.exchangeCode(code, state);
      
      console.log('Outlook callback response:', response.data);
      
      if (response.data.success) {
        setMessage('Outlook connected successfully!');
        setOutlookConnected(true);
        await checkOutlookStatus(); // Refresh status
        // Clean up URL
        router.replace('/settings', undefined, { shallow: true });
      } else {
        throw new Error(response.data.message || 'Failed to complete Outlook authentication');
      }
    } catch (error) {
      console.error('Failed to handle Outlook callback:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect Outlook. Please try again.';
      setMessage(errorMessage);
      // Clean up URL
      router.replace('/settings', undefined, { shallow: true });
    }
  };

  const syncOutlook = async () => {
    setSyncing(true);
    try {
      const response = await outlookApi.sync();
      setMessage(response.data.message);
      // Refresh status after sync
      await checkOutlookStatus();
    } catch (error) {
      console.error('Failed to sync Outlook:', error);
      setMessage('Failed to sync Outlook emails');
    } finally {
      setSyncing(false);
    }
  };

  const disconnectOutlook = async () => {
    try {
      await outlookApi.disconnect();
      setOutlookConnected(false);
      setOutlookStatus(null);
      setMessage('Outlook disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect Outlook:', error);
      setMessage('Failed to disconnect Outlook');
    }
  };

  // Categories management functions
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await categoriesApi.create({ name: newCategory.trim() });
      setNewCategory('');
      await loadCategories();
      setMessage('Category added successfully');
    } catch (error) {
      console.error('Failed to add category:', error);
      setMessage('Failed to add category');
    }
  };

  const updateCategory = async (id: number, newName: string) => {
    try {
      await categoriesApi.update(id, { name: newName });
      setEditingCategory(null);
      await loadCategories();
      setMessage('Category updated successfully');
    } catch (error) {
      console.error('Failed to update category:', error);
      setMessage('Failed to update category');
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      await categoriesApi.delete(id);
      await loadCategories();
      setMessage('Category deleted successfully');
    } catch (error) {
      console.error('Failed to delete category:', error);
      setMessage('Failed to delete category');
    }
  };

  // Persons management functions
  const addPerson = async () => {
    if (!newPerson.trim()) return;
    try {
      await personsApi.create({ name: newPerson.trim() });
      setNewPerson('');
      await loadPersons();
      setMessage('Person added successfully');
    } catch (error) {
      console.error('Failed to add person:', error);
      setMessage('Failed to add person');
    }
  };

  const updatePerson = async (id: number, newName: string) => {
    try {
      await personsApi.update(id, { name: newName });
      setEditingPerson(null);
      await loadPersons();
      setMessage('Person updated successfully');
    } catch (error) {
      console.error('Failed to update person:', error);
      setMessage('Failed to update person');
    }
  };

  const deletePerson = async (id: number) => {
    try {
      await personsApi.delete(id);
      await loadPersons();
      setMessage('Person deleted successfully');
    } catch (error) {
      console.error('Failed to delete person:', error);
      setMessage('Failed to delete person');
    }
  };

  return (
    <AdminLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">
            Configure your application preferences and account settings
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">General Settings</h2>
            </div>
            <div className="card-content">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency
                  </label>
                  <select 
                    value={userSettings.currency}
                    onChange={(e) => handleSettingsUpdate({ currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Format
                  </label>
                  <select 
                    value={userSettings.date_format}
                    onChange={(e) => handleSettingsUpdate({ date_format: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Zone
                  </label>
                  <select 
                    value={userSettings.timezone}
                    onChange={(e) => handleSettingsUpdate({ timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="Eastern Time (ET)">Eastern Time (ET)</option>
                    <option value="Central Time (CT)">Central Time (CT)</option>
                    <option value="Mountain Time (MT)">Mountain Time (MT)</option>
                    <option value="Pacific Time (PT)">Pacific Time (PT)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dark Mode
                    </label>
                    <p className="text-sm text-gray-500">Enable dark theme</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={userSettings.dark_mode}
                      onChange={(e) => handleSettingsUpdate({ dark_mode: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Notification Settings</h2>
            </div>
            <div className="card-content">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Notifications
                    </label>
                    <p className="text-sm text-gray-500">Receive emails about account activity</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={userSettings.email_notifications}
                      onChange={(e) => handleSettingsUpdate({ email_notifications: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Budget Alerts
                    </label>
                    <p className="text-sm text-gray-500">Get notified when approaching budget limits</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={userSettings.budget_alerts}
                      onChange={(e) => handleSettingsUpdate({ budget_alerts: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Transaction Alerts
                    </label>
                    <p className="text-sm text-gray-500">Notifications for new transactions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={userSettings.transaction_alerts}
                      onChange={(e) => handleSettingsUpdate({ transaction_alerts: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Weekly Reports
                    </label>
                    <p className="text-sm text-gray-500">Weekly financial summary emails</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={userSettings.weekly_reports}
                      onChange={(e) => handleSettingsUpdate({ weekly_reports: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Privacy & Security</h2>
            </div>
            <div className="card-content">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Two-Factor Authentication
                    </label>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                    Enable
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Session Timeout
                    </label>
                    <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
                  </div>
                  <select className="px-3 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>Never</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Data Export
                    </label>
                    <p className="text-sm text-gray-500">Download your data</p>
                  </div>
                  <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
                    Export
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Categories Management</h2>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter new category name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <button
                    onClick={addCategory}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto">
                  {categories.map((category: any) => (
                    <div key={category.id} className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
                      {editingCategory === category.id ? (
                        <div className="flex space-x-2 flex-1">
                          <input
                            type="text"
                            defaultValue={category.name}
                            onBlur={(e) => updateCategory(category.id, (e.target as HTMLInputElement).value)}
                            onKeyPress={(e) => e.key === 'Enter' && updateCategory(category.id, (e.target as HTMLInputElement).value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="px-2 py-1 text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1">
                            {category.name}
                            {category.is_default && (
                              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                          </span>
                          <div className="flex space-x-2">
                            {!category.is_default && (
                              <>
                                <button
                                  onClick={() => setEditingCategory(category.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteCategory(category.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Persons Management</h2>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newPerson}
                    onChange={(e) => setNewPerson(e.target.value)}
                    placeholder="Enter new person name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    onKeyPress={(e) => e.key === 'Enter' && addPerson()}
                  />
                  <button
                    onClick={addPerson}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto">
                  {persons.map((person: any) => (
                    <div key={person.id} className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
                      {editingPerson === person.id ? (
                        <div className="flex space-x-2 flex-1">
                          <input
                            type="text"
                            defaultValue={person.name}
                            onBlur={(e) => updatePerson(person.id, (e.target as HTMLInputElement).value)}
                            onKeyPress={(e) => e.key === 'Enter' && updatePerson(person.id, (e.target as HTMLInputElement).value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => setEditingPerson(null)}
                            className="px-2 py-1 text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1">
                            {person.name}
                            {person.is_default && (
                              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                          </span>
                          <div className="flex space-x-2">
                            {!person.is_default && (
                              <>
                                <button
                                  onClick={() => setEditingPerson(person.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deletePerson(person.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Outlook Integration</h2>
            </div>
            <div className="card-content">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Outlook Connection
                    </label>
                    <p className="text-sm text-gray-500">
                      {outlookConnected 
                        ? "Connected to Outlook for automatic receipt processing" 
                        : "Connect your Outlook account to automatically process receipts from emails"
                      }
                    </p>
                  </div>
                  {outlookConnected ? (
                    <div className="flex space-x-2">
                      <button 
                        onClick={syncOutlook}
                        disabled={syncing}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {syncing ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <button 
                        onClick={disconnectOutlook}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={connectOutlook}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Connect Outlook
                    </button>
                  )}
                </div>

                {deviceCodeInfo && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Complete Outlook Authorization</h4>
                    <div className="space-y-3">
                      <p className="text-sm text-blue-700">
                        To connect your Outlook account, please visit:
                      </p>
                      <a
                        href={deviceCodeInfo.verification_uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center w-full"
                      >
                        Open Microsoft Login Page
                      </a>
                      <div className="bg-blue-100 p-3 rounded">
                        <p className="text-sm text-blue-800 mb-1">Enter this code:</p>
                        <code className="text-lg font-mono bg-white px-3 py-2 rounded border block text-center">
                          {deviceCodeInfo.user_code}
                        </code>
                      </div>
                      <p className="text-xs text-blue-600">
                        {polling ? 'Waiting for authorization...' : 'Click the link above and enter the code'}
                      </p>
                      {polling && (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-blue-700">Checking authorization status...</span>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setDeviceCodeInfo(null);
                          setPolling(false);
                          setMessage('');
                        }}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {outlookConnected && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-blue-700 dark:text-blue-400">
                        Outlook connected successfully
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button 
            onClick={resetUserSettings}
            disabled={settingsLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            {settingsLoading ? 'Resetting...' : 'Reset to Defaults'}
          </button>
          <button 
            onClick={() => setMessage('Settings are automatically saved when changed')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Settings Auto-Saved
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
