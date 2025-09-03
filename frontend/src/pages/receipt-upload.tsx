import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '../store/auth';
import api from '../lib/api';

interface UploadResponse {
  success: boolean;
  receipt_id?: number;
  message: string;
  extracted_data?: any;
}

export default function ReceiptUpload() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResponses, setUploadResponses] = useState<UploadResponse[]>([]);
  const [error, setError] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !user) {
      router.push('/login');
    }
  }, [isClient, user, router]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      // Validate all files are PDFs
      const invalidFiles = files.filter(file => !file.name.toLowerCase().endsWith('.pdf'));
      if (invalidFiles.length > 0) {
        setError(`Please select only PDF files. Invalid files: ${invalidFiles.map(f => f.name).join(', ')}`);
        setSelectedFiles([]);
        return;
      }
      setSelectedFiles(files);
      setError('');
      setUploadResponses([]);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append('files', file);
      });

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await api.post('/receipts/upload', formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResponses(response.data);

    } catch (err: any) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      let errorMessage = 'Failed to upload receipts';
      if (err.response?.status === 404) {
        errorMessage = 'Upload endpoint not found. Please check if the backend is running.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Upload Receipt</h1>
            <Link
              href="/dashboard"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            {/* File Upload Section */}
            <div>
              <label htmlFor="receipt-file" className="block text-sm font-medium text-gray-700">
                Select PDF Receipt
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="receipt-files"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload PDF files</span>
                      <input
                        id="receipt-files"
                        name="receipt-files"
                        type="file"
                        accept=".pdf"
                        multiple
                        className="sr-only"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop multiple files</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF files only, up to 10MB each</p>
                </div>
              </div>
            </div>

            {/* Selected Files Display */}
            {selectedFiles.length > 0 && (
              <div className="bg-gray-50 rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                  </h4>
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={isUploading}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded p-3 border">
                      <div className="flex items-center">
                        <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newFiles = selectedFiles.filter((_, i) => i !== index);
                          setSelectedFiles(newFiles);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={isUploading}
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex justify-center">
              <button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Receipt${selectedFiles.length > 1 ? 's' : ''}`}
              </button>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Results */}
            {uploadResponses.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Upload Results</h3>
                {uploadResponses.map((response, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    {response.success ? (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-green-800">{response.message}</p>
                            </div>
                          </div>
                        </div>

                        {/* Extracted Receipt Data */}
                        {response.extracted_data && (
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <h4 className="text-md font-medium text-blue-900 mb-4">Extracted Receipt Data</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-blue-800">Market:</span>
                                <p className="text-blue-700">{response.extracted_data.market}</p>
                              </div>
                              <div>
                                <span className="font-medium text-blue-800">Branch:</span>
                                <p className="text-blue-700">{response.extracted_data.branch}</p>
                              </div>
                              <div>
                                <span className="font-medium text-blue-800">Date:</span>
                                <p className="text-blue-700">{response.extracted_data.date}</p>
                              </div>
                              <div>
                                <span className="font-medium text-blue-800">Total:</span>
                                <p className="text-blue-700">{formatCurrency(response.extracted_data.total)}</p>
                              </div>
                            </div>

                            {/* Products */}
                            <div className="mt-4">
                              <h5 className="font-medium text-blue-800 mb-2">Products:</h5>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {response.extracted_data.products.map((product: any, productIndex: number) => (
                                  <div key={productIndex} className="bg-white rounded p-3 border text-xs">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="font-medium">Type:</span> {product.product_type}
                                      </div>
                                      <div>
                                        <span className="font-medium">Product:</span> {product.product}
                                      </div>
                                      <div>
                                        <span className="font-medium">Quantity:</span> {product.quantity}
                                      </div>
                                      <div>
                                        <span className="font-medium">Price:</span> {formatCurrency(product.price)}
                                      </div>
                                      {(product.discount > 0 || product.discount2 > 0) && (
                                        <div className="col-span-2">
                                          <span className="font-medium">Discounts:</span>
                                          {product.discount > 0 && ` ${formatCurrency(product.discount)}`}
                                          {product.discount2 > 0 && ` + ${formatCurrency(product.discount2)}`}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {response.receipt_id && (
                              <div className="mt-4 flex space-x-2">
                                <Link
                                  href={`/receipts/${response.receipt_id}`}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700"
                                >
                                  View Details
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-800">{response.message}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Files:</span> {uploadResponses.length}
                    </div>
                    <div>
                      <span className="font-medium text-green-600">Successful:</span> {uploadResponses.filter(r => r.success).length}
                    </div>
                    <div>
                      <span className="font-medium text-red-600">Failed:</span> {uploadResponses.filter(r => !r.success).length}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                  <Link
                    href="/receipt-upload"
                    className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    onClick={() => {
                      setSelectedFiles([]);
                      setUploadResponses([]);
                    }}
                  >
                    Upload More Files
                  </Link>
                  <Link
                    href="/dashboard"
                    className="bg-gray-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Disable static generation to avoid router issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}