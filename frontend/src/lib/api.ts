import axios from 'axios';

// Determine API URL based on environment
const getApiBaseUrl = () => {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // If we're running in development (localhost), use localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8001/api';
  }
  // If we're on the production domain, use the same domain with /api prefix
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}/api`;
  }
  // Fallback for server-side rendering
  return 'https://gobudget.duckdns.org/api';
};

const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // For cookies
});

// Request interceptor to add auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const fullUrl = `${config.baseURL}${config.url}`;
  
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

// Transaction API functions
export const transactionApi = {
  getAll: (queryParams?: string) => api.get(`/transactions/${queryParams ? `?${queryParams}` : ''}`),
  create: (data: any) => api.post('/transactions/', data),
  update: (id: number, data: any) => api.put(`/transactions/${id}`, data),
  delete: (id: number) => api.delete(`/transactions/${id}`),
  importCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/transactions/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  previewCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/transactions/preview-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

// Outlook integration API functions
export const outlookApi = {
  getAuthUrl: () => api.get('/outlook/auth-url'),
  getStatus: () => api.get('/outlook/status'),
  pollAuth: () => api.post('/outlook/auth-poll'),
  exchangeCode: (code: string, state: string) => api.post('/outlook/exchange-code', { code, state }),
  sync: () => api.post('/outlook/sync'),
  getSyncProgress: () => api.get('/outlook/sync-progress'),
  disconnect: () => api.post('/outlook/disconnect'),
};

// Categories API functions
export const categoriesApi = {
  getAll: () => api.get('/categories/'),
  create: (data: { name: string }) => api.post('/categories/', data),
  update: (id: number, data: { name: string }) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Persons API functions
export const personsApi = {
  getAll: () => api.get('/persons/'),
  create: (data: { name: string }) => api.post('/persons/', data),
  update: (id: number, data: { name: string }) => api.put(`/persons/${id}`, data),
  delete: (id: number) => api.delete(`/persons/${id}`),
};

// Settings API functions
export const settingsApi = {
  get: () => api.get('/settings/'),
  update: (data: any) => api.put('/settings/', data),
  reset: () => api.post('/settings/reset'),
};

// Dashboard API functions
export const dashboardApi = {
  get: (year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    return api.get(`/dashboard/${params.toString() ? `?${params.toString()}` : ''}`);
  },
  getIncomeData: (startMonths?: number) => api.get('/dashboard/income/', { 
    params: { start_months: startMonths || 12 } 
  }),
  getExpensesData: (startMonths?: number) => api.get('/dashboard/expenses/', { 
    params: { start_months: startMonths || 12 } 
  }),
};