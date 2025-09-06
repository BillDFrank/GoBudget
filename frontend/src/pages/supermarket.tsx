import AdminLayout from '../layout/AdminLayout';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { useRouter } from 'next/router';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Types for the API data
interface Receipt {
  id: number;
  market: string;
  branch: string;
  invoice?: string;
  date: string;
  total: number;
  user_id: number;
  products?: ReceiptProduct[];
}

interface ReceiptProduct {
  id: number;
  product_type: string;
  product: string;
  quantity: number;
  price: number;
  discount: number;
  discount2: number;
  receipt_id: number;
}

interface SpendingSummary {
  period: string;
  start_date: string;
  end_date: string;
  total_spent: number;
  receipt_count: number;
  average_per_receipt: number;
  top_categories: Array<{ category: string; amount: number }>;
}

export default function Supermarket() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [spendingSummary, setSpendingSummary] = useState<SpendingSummary | null>(null);
  const [selectedReceipts, setSelectedReceipts] = useState<number[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    initAuth();
  }, [checkAuth]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, router]);

  // Load receipts and spending summary
  const loadData = async () => {
    if (!isAuthenticated) {
      setError('Please log in to view receipts');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No authentication token found');
        router.push('/login');
        return;
      }

      // Load receipts
      const receiptsResponse = await fetch(`${API_BASE_URL}/receipts/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!receiptsResponse.ok) {
        if (receiptsResponse.status === 401) {
          localStorage.removeItem('access_token');
          router.push('/login');
          return;
        }
        throw new Error(`Failed to load receipts: ${receiptsResponse.statusText}`);
      }

      const receiptsData = await receiptsResponse.json();
      setReceipts(receiptsData);

      // Load spending summary for current month
      const summaryResponse = await fetch(`${API_BASE_URL}/receipts/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSpendingSummary(summaryData);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (!isAuthenticated) {
      setError('Please log in to upload receipts');
      return;
    }
    if (!files.length) return;

    setIsUploading(true);
    setUploadProgress([]);

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/receipts/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const results = await response.json();
      const messages = results.map((r: any) => r.message);
      setUploadProgress(messages);

      // Reload data after successful upload
      await loadData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle receipt selection
  const toggleReceiptSelection = (receiptId: number) => {
    setSelectedReceipts(prev =>
      prev.includes(receiptId)
        ? prev.filter(id => id !== receiptId)
        : [...prev, receiptId]
    );
  };

  const selectAllReceipts = () => {
    setSelectedReceipts(receipts.map(r => r.id));
  };

  const clearSelection = () => {
    setSelectedReceipts([]);
  };

  // Delete receipts
  const deleteSelectedReceipts = async () => {
    if (!selectedReceipts.length) return;

    if (!confirm(`Delete ${selectedReceipts.length} receipt(s)?`)) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Note: You'll need to implement delete endpoint in backend
      for (const receiptId of selectedReceipts) {
        await fetch(`${API_BASE_URL}/receipts/${receiptId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      setSelectedReceipts([]);
      await loadData();
    } catch (err) {
      setError('Failed to delete receipts');
    }
  };

  // View receipt details
  const viewReceiptDetails = async (receiptId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/receipts/${receiptId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load receipt details');
      }

      const receiptData = await response.json();
      setSelectedReceipt(receiptData);
      setShowReceiptDetails(true);
    } catch (err) {
      setError('Failed to load receipt details');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="page-container">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading receipts...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Supermarket</h1>
          <p className="page-subtitle">
            Track grocery spending and manage receipts
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Monthly Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  This Month Total
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {spendingSummary ? formatCurrency(spendingSummary.total_spent) : '$0.00'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Receipts
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {spendingSummary ? spendingSummary.receipt_count : 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Average per Receipt
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {spendingSummary ? formatCurrency(spendingSummary.average_per_receipt) : '$0.00'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="card-title">Upload Receipts</h2>
          </div>
          <div className="card-content">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                id="receipt-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="receipt-upload"
                className={`cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isUploading ? 'Processing...' : 'Upload PDF Receipts'}
                </p>
                <p className="text-sm text-gray-600">
                  Drag and drop PDF files here, or click to select files
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Multiple files supported • PDF format only
                </p>
              </label>
            </div>

            {uploadProgress.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadProgress.map((message, index) => (
                  <div
                    key={index}
                    className={`text-sm p-2 rounded ${
                      message.includes('successfully') || message.includes('success')
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Receipts Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Receipts</h2>
            <div className="flex items-center gap-2">
              {selectedReceipts.length > 0 && (
                <>
                  <span className="text-sm text-gray-600">
                    {selectedReceipts.length} selected
                  </span>
                  <button
                    onClick={deleteSelectedReceipts}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                  >
                    Clear Selection
                  </button>
                </>
              )}
              {receipts.length > 0 && selectedReceipts.length === 0 && (
                <button
                  onClick={selectAllReceipts}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  Select All
                </button>
              )}
            </div>
          </div>
          <div className="card-content">
            {receipts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">No receipts yet</p>
                <p className="text-gray-600">Upload your first PDF receipt to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedReceipts.length === receipts.length}
                          onChange={(e) => e.target.checked ? selectAllReceipts() : clearSelection()}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </th>
                      <th scope="col" className="px-6 py-3">Date</th>
                      <th scope="col" className="px-6 py-3">Market</th>
                      <th scope="col" className="px-6 py-3">Branch</th>
                      <th scope="col" className="px-6 py-3">Total Amount</th>
                      <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((receipt) => (
                      <tr
                        key={receipt.id}
                        className={`bg-white border-b hover:bg-gray-50 ${
                          selectedReceipts.includes(receipt.id) ? 'bg-green-50' : ''
                        }`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedReceipts.includes(receipt.id)}
                            onChange={() => toggleReceiptSelection(receipt.id)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {formatDate(receipt.date)}
                        </td>
                        <td className="px-6 py-4">{receipt.market}</td>
                        <td className="px-6 py-4">{receipt.branch || '-'}</td>
                        <td className="px-6 py-4 font-semibold text-green-600">
                          {formatCurrency(receipt.total)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => viewReceiptDetails(receipt.id)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Receipt Details Modal */}
        {showReceiptDetails && selectedReceipt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Receipt Details</h3>
                <button
                  onClick={() => setShowReceiptDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Receipt Information</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Market:</span>
                        <p className="font-medium">{selectedReceipt.market}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Branch:</span>
                        <p className="font-medium">{selectedReceipt.branch || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Date:</span>
                        <p className="font-medium">{formatDate(selectedReceipt.date)}</p>
                      </div>
                      {selectedReceipt.invoice && (
                        <div>
                          <span className="text-sm text-gray-600">Invoice:</span>
                          <p className="font-medium">{selectedReceipt.invoice}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Summary</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-sm text-green-600 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(selectedReceipt.total)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedReceipt.products && selectedReceipt.products.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Products</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left">Product</th>
                            <th className="px-4 py-3 text-left">Type</th>
                            <th className="px-4 py-3 text-center">Quantity</th>
                            <th className="px-4 py-3 text-right">Price</th>
                            <th className="px-4 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReceipt.products.map((product) => (
                            <tr key={product.id} className="bg-white border-b">
                              <td className="px-4 py-3 font-medium">{product.product}</td>
                              <td className="px-4 py-3">{product.product_type}</td>
                              <td className="px-4 py-3 text-center">{product.quantity}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(product.price)}</td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatCurrency(product.price * product.quantity - product.discount - product.discount2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
