import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

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

interface Receipt {
  id: number;
  market: string;
  branch: string;
  invoice?: string;
  date: string;
  total: number;
  user_id: number;
  products: ReceiptProduct[];
}

export default function ReceiptDetails() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { id } = router.query;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !user) {
      router.push('/login');
    }
  }, [isClient, user, router]);

  const { data: receipt, isLoading, error } = useQuery<Receipt>({
    queryKey: ['receipt', id],
    queryFn: async () => {
      const response = await api.get(`/receipts/${id}`);
      return response.data;
    },
    enabled: !!id && !!user,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">Receipt Details</h1>
              <Link
                href="/spending-overview"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                ← Back to Spending Overview
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading receipt details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">Receipt Details</h1>
              <Link
                href="/spending-overview"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                ← Back to Spending Overview
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">Error loading receipt details. The receipt may not exist or you may not have permission to view it.</p>
            <Link
              href="/spending-overview"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              ← Back to Spending Overview
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">Receipt Details</h1>
              <Link
                href="/spending-overview"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                ← Back to Spending Overview
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Receipt not found.</p>
            <Link
              href="/spending-overview"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              ← Back to Spending Overview
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Receipt Details</h1>
            <div className="flex space-x-4">
              <Link
                href="/receipt-upload"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Upload Another Receipt
              </Link>
              <Link
                href="/spending-overview"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                ← Back to Spending Overview
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Receipt Header */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{receipt.market}</h2>
                <p className="text-gray-600">{receipt.branch}</p>
                {receipt.invoice && (
                  <p className="text-sm text-gray-500">Invoice: {receipt.invoice}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(receipt.total)}</p>
                <p className="text-sm text-gray-600">{formatDate(receipt.date)}</p>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Products</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discounts
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receipt.products.map((product) => {
                    const subtotal = product.quantity * product.price;
                    const totalDiscount = product.discount + product.discount2;
                    const finalTotal = subtotal - totalDiscount;

                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.product}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.product_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(subtotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {totalDiscount > 0 ? formatCurrency(totalDiscount) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                      Total:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {formatCurrency(receipt.total)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Total Items</p>
                  <p className="text-lg font-semibold text-gray-900">{receipt.products.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Total Savings</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(
                      receipt.products.reduce((total, product) => total + product.discount + product.discount2, 0)
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Purchase Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(receipt.date)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Link
              href="/receipt-upload"
              className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Upload Another Receipt
            </Link>
            <Link
              href="/spending-overview"
              className="bg-gray-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
            >
              ← Back to Spending Overview
            </Link>
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