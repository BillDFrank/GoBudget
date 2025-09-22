import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { transactionApi } from '../lib/api';

interface Transaction {
  id: number;
  date: string;
  type: string;
  person: string;
  category: string;
  description: string;
  amount: number;
  user_id: number;
}

interface TransactionFormData extends Omit<Transaction, 'id' | 'user_id'> {}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  title: string;
  initialData?: Transaction;
}

const CATEGORIES = [
  'Food & Dining',
  'Transportation', 
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Income',
  'Healthcare',
  'Education',
  'Other'
] as const;

const TRANSACTION_TYPES = ['Income', 'Expense', 'Transfer'] as const;

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  initialData 
}) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    type: initialData?.type || '',
    person: initialData?.person || '',
    category: initialData?.category || '',
    description: initialData?.description || '',
    amount: initialData?.amount || 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = useCallback((field: keyof TransactionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => updateFormData('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => updateFormData('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="">Select Type</option>
              {TRANSACTION_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="person" className="block text-sm font-medium text-gray-700 mb-1">
              Person/Entity
            </label>
            <input
              id="person"
              type="text"
              value={formData.person}
              onChange={(e) => updateFormData('person', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter person or entity"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => updateFormData('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter description"
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => updateFormData('amount', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter amount (negative for expenses)"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Optimized fetch function with error handling
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await transactionApi.getAll();
      setTransactions(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMessage);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time updates with polling (30 seconds interval)
  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  // Optimized transaction operations
  const handleDeleteTransaction = useCallback(async (transactionId: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await transactionApi.delete(transactionId);
      // Optimistic update - remove from local state immediately
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    } catch (err) {
      setError('Failed to delete transaction');
      console.error('Error deleting transaction:', err);
      // Refresh data on error to ensure consistency
      fetchTransactions();
    }
  }, [fetchTransactions]);

  const handleCreateTransaction = useCallback(async (transactionData: TransactionFormData) => {
    try {
      const response = await transactionApi.create(transactionData);
      // Optimistic update - add to local state immediately
      setTransactions(prev => [response.data, ...prev]);
      setShowCreateModal(false);
    } catch (err) {
      setError('Failed to create transaction');
      console.error('Error creating transaction:', err);
      throw err; // Re-throw to handle in modal
    }
  }, []);

  const handleUpdateTransaction = useCallback(async (transactionId: number, transactionData: TransactionFormData) => {
    try {
      const response = await transactionApi.update(transactionId, transactionData);
      // Optimistic update - update in local state immediately
      setTransactions(prev => prev.map(t => t.id === transactionId ? response.data : t));
      setEditingTransaction(null);
    } catch (err) {
      setError('Failed to update transaction');
      console.error('Error updating transaction:', err);
      throw err; // Re-throw to handle in modal
    }
  }, []);

  // Memoized filtered transactions for better performance
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = !searchTerm || 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.person.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || transaction.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [transactions, searchTerm, categoryFilter]);

  const getCategoryBadgeColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'Income': 'bg-green-100 text-green-800',
      'Food & Dining': 'bg-orange-100 text-orange-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Shopping': 'bg-purple-100 text-purple-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Bills & Utilities': 'bg-red-100 text-red-800',
      'Healthcare': 'bg-teal-100 text-teal-800',
      'Education': 'bg-indigo-100 text-indigo-800',
    };
    return colorMap[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">
            Manage and track all your financial transactions
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">All Transactions</h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Add new transaction"
            >
              Add Transaction
            </button>
          </div>

          <div className="card-content">
            {/* Search and Filter Controls */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  aria-label="Search transactions"
                />
              </div>
              <div>
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  aria-label="Filter by category"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Loading transactions...</span>
              </div>
            ) : (
              /* Transactions Table */
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Date</th>
                      <th scope="col" className="px-6 py-3">Type</th>
                      <th scope="col" className="px-6 py-3 hidden sm:table-cell">Person</th>
                      <th scope="col" className="px-6 py-3">Category</th>
                      <th scope="col" className="px-6 py-3">Description</th>
                      <th scope="col" className="px-6 py-3">Amount</th>
                      <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          {searchTerm || categoryFilter ? 'No transactions match your filters' : 'No transactions found'}
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="capitalize">{transaction.type}</span>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell">{transaction.person}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getCategoryBadgeColor(transaction.category)}`}>
                              {transaction.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate" title={transaction.description}>
                            {transaction.description}
                          </td>
                          <td className={`px-6 py-4 font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => setEditingTransaction(transaction)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                aria-label={`Edit transaction ${transaction.description}`}
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                aria-label={`Delete transaction ${transaction.description}`}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showCreateModal && (
          <TransactionModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateTransaction}
            title="Create New Transaction"
          />
        )}

        {editingTransaction && (
          <TransactionModal
            isOpen={!!editingTransaction}
            onClose={() => setEditingTransaction(null)}
            onSubmit={(data) => handleUpdateTransaction(editingTransaction.id, data)}
            title="Edit Transaction"
            initialData={editingTransaction}
          />
        )}
      </div>
    </AdminLayout>
  );
}
