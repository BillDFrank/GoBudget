import AdminLayout from '../layout/AdminLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { outlookApi, categoriesApi, personsApi } from '../lib/api';

export default function Settings() {
  const router = useRouter();
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [outlookStatus, setOutlookStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [authCode, setAuthCode] = useState('');
  
  const [categories, setCategories] = useState([]);
  const [persons, setPersons] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newPerson, setNewPerson] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingPerson, setEditingPerson] = useState(null);

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
  }, [router.query]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
      const response = await outlookApi.getAuthUrl();
      const authUrl = response.data.auth_url;
      
      // Store state for later verification
      sessionStorage.setItem('outlook_oauth_state', response.data.state);
      
      // Open OAuth in a new tab
      window.open(authUrl, '_blank');
      
      // Show instructions to the user
      setMessage('Please complete the OAuth process in the new tab. After authorizing, copy the authorization code from the URL and paste it below.');
      setShowCodeInput(true);
      
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      setMessage('Failed to initiate Outlook connection. Please try again.');
    }
  };

  const handleManualCodeSubmit = async () => {
    try {
      const state = sessionStorage.getItem('outlook_oauth_state');
      if (!state) {
        setMessage('OAuth state not found. Please restart the connection process.');
        return;
      }
      
      if (!authCode.trim()) {
        setMessage('Please enter the authorization code.');
        return;
      }
      
      // Extract code from URL if user pasted the full URL
      let code = authCode.trim();
      if (code.includes('code=')) {
        const urlParams = new URLSearchParams(code.split('?')[1] || code);
        code = urlParams.get('code') || code;
      }
      
      await handleOutlookCallback(code, state);
      setShowCodeInput(false);
      setAuthCode('');
      sessionStorage.removeItem('outlook_oauth_state');
      
    } catch (error) {
      console.error('Failed to submit authorization code:', error);
      setMessage('Failed to process authorization code. Please try again.');
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

  const updateCategory = async (id, newName) => {
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

  const deleteCategory = async (id) => {
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

  const updatePerson = async (id, newName) => {
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

  const deletePerson = async (id) => {
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
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option>USD - US Dollar</option>
                    <option>EUR - Euro</option>
                    <option>GBP - British Pound</option>
                    <option>CAD - Canadian Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Format
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Zone
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option>Eastern Time (ET)</option>
                    <option>Central Time (CT)</option>
                    <option>Mountain Time (MT)</option>
                    <option>Pacific Time (PT)</option>
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
                    <input type="checkbox" className="sr-only peer" />
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
                    <input type="checkbox" className="sr-only peer" defaultChecked />
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
                    <input type="checkbox" className="sr-only peer" defaultChecked />
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
                    <input type="checkbox" className="sr-only peer" />
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
                    <input type="checkbox" className="sr-only peer" defaultChecked />
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
                            onBlur={(e) => updateCategory(category.id, e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && updateCategory(category.id, e.target.value)}
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
                            onBlur={(e) => updatePerson(person.id, e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && updatePerson(person.id, e.target.value)}
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

                {showCodeInput && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Complete Outlook Authorization</h4>
                    <div className="text-sm text-yellow-700 mb-3">
                      <p className="mb-2">After authorizing in the new tab, you'll be redirected to a page that starts with:</p>
                      <code className="bg-yellow-100 px-2 py-1 rounded text-xs">
                        https://login.microsoftonline.com/common/oauth2/nativeclient?code=...
                      </code>
                      <p className="mt-2">Copy the entire URL or just the <strong>code</strong> parameter value and paste it below:</p>
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value)}
                        placeholder="Paste authorization code or full URL here..."
                        className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                      <button
                        onClick={handleManualCodeSubmit}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => {
                          setShowCodeInput(false);
                          setAuthCode('');
                          sessionStorage.removeItem('outlook_oauth_state');
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
            Reset to Defaults
          </button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save All Settings
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
