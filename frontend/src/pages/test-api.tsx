import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function TestAPI() {
  const [apiUrl, setApiUrl] = useState('');
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    // Get the API base URL
    setApiUrl(api.defaults.baseURL || 'Unknown');
    
    // Test API connection
    const testAPI = async () => {
      try {
        const response = await api.get('/');
        setTestResult(`Success: ${JSON.stringify(response.data)}`);
      } catch (error: any) {
        setTestResult(`Error: ${error.message} - ${error.response?.status}`);
      }
    };
    
    testAPI();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <strong>API Base URL:</strong> <code>{apiUrl}</code>
          </div>
          <div>
            <strong>Test Result:</strong> <code>{testResult}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
