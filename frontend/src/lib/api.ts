import axios from 'axios';

// Force local API URL for development
const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // For cookies
});

// Request interceptor to add auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const fullUrl = `${config.baseURL}${config.url}`;
  
  console.log('=== API REQUEST DEBUG ===');
  console.log('Method:', config.method?.toUpperCase());
  console.log('URL:', config.url);
  console.log('Base URL:', config.baseURL);
  console.log('Full URL:', fullUrl);
  console.log('Token available:', !!token);
  console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
  console.log('Headers:', config.headers);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;