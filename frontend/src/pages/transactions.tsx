import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { FilterPanel, SortableHeader, type FilterDef, type SortConfig } from '../components/Filters';
import AdminLayout from '../layout/AdminLayout';
import { transactionApi, categoriesApi, personsApi } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// Transaction types (these remain static)
const DEFAULT_TRANSACTION_TYPES = ['Income', 'Expense', 'Investment', 'Savings'];

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

interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  title: string;
  initialData?: Transaction;
  categories: any[];
  persons: any[];
}

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  categories: any[];
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  initialData,
  categories,
  persons
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSubmitting) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => updateFormData('date', e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => updateFormData('type', value)}
              required
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_TRANSACTION_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="person">Person/Entity</Label>
            <Select
              value={formData.person}
              onValueChange={(value) => updateFormData('person', value)}
              required
            >
              <SelectTrigger id="person">
                <SelectValue placeholder="Select Person" />
              </SelectTrigger>
              <SelectContent>
                {persons.map(person => (
                  <SelectItem key={typeof person === 'string' ? person : person.id} value={typeof person === 'string' ? person : person.name}>
                    {typeof person === 'string' ? person : person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => updateFormData('category', value)}
              required
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={typeof category === 'string' ? category : category.id} value={typeof category === 'string' ? category : category.name}>
                    {typeof category === 'string' ? category : category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Enter description"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => updateFormData('amount', parseFloat(e.target.value) || 0)}
              placeholder="Enter amount (negative for expenses)"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onImportSuccess, categories }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'confirm'>('upload');
  const [previewTransactions, setPreviewTransactions] = useState<any[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setUploadResult(null);
      setStep('upload');
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      const response = await transactionApi.previewCsv(file);
      const previewData = response.data;
      
      if (previewData.errors && previewData.errors.length > 0) {
        setError(`Validation errors found:\n${previewData.errors.join('\n')}`);
        setIsUploading(false);
        return;
      }
      
      // Add temporary IDs for editing
      const transactionsWithIds = previewData.valid_transactions.map((t: any, index: number) => ({
        ...t,
        tempId: Date.now() + index
      }));
      
      setPreviewTransactions(transactionsWithIds);
      setStep('confirm');
    } catch (err: any) {
      console.error('Preview error:', err);
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'object' && err.response.data.detail.errors) {
          setError(`Validation failed:\n${err.response.data.detail.errors.join('\n')}`);
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError('Failed to parse CSV file');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    
    try {
      const response = await transactionApi.importCsv(file);
      setUploadResult(response.data);
      onImportSuccess();
      setStep('upload');
    } catch (err: any) {
      console.error('Upload error:', err);
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'object' && err.response.data.detail.errors) {
          setError(`Validation failed:\n${err.response.data.detail.errors.join('\n')}`);
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError('Failed to upload CSV file');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction({ ...transaction });
  };

  const handleSaveEdit = () => {
    if (!editingTransaction) return;
    
    setPreviewTransactions(prev => 
      prev.map(t => t.tempId === editingTransaction.tempId ? editingTransaction : t)
    );
    setEditingTransaction(null);
  };

  const handleRemoveTransaction = (tempId: number) => {
    setPreviewTransactions(prev => prev.filter(t => t.tempId !== tempId));
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setUploadResult(null);
    setStep('upload');
    setPreviewTransactions([]);
    setEditingTransaction(null);
    onClose();
  };

  const downloadSampleCsv = () => {
    const sampleData = `date,type,person,category,description,amount
2024-01-15,Expense,Family,Food & Dining,Grocery shopping,-85.50
2024-01-16,Income,John,Income,Salary payment,2500.00
2024-01-17,Expense,Mary,Transportation,Gas station,-45.20
2024-01-18,Expense,,Entertainment,Movie tickets,-24.00`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isUploading) handleClose(); }}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' ? 'Import Transactions from CSV' : 'Review Transactions'}
          </DialogTitle>
        </DialogHeader>

        <div>
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>date</strong>: Date in YYYY-MM-DD format (required)</li>
                  <li>• <strong>type</strong>: Income, Expense, Investment, or Savings (required)</li>
                  <li>• <strong>person</strong>: Person/entity name (optional, defaults to &quot;Family&quot;)</li>
                  <li>• <strong>category</strong>: Transaction category (required)</li>
                  <li>• <strong>description</strong>: Transaction description (required)</li>
                  <li>• <strong>amount</strong>: Transaction amount - positive for income, negative for expenses (required)</li>
                </ul>
                <p className="text-sm text-blue-700 mt-2">
                  <strong>Categories and Persons:</strong> You can use any category or person name. New ones will be created automatically for your account.
                </p>
              </div>

              {/* Sample CSV download */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Need a template?</span>
                <Button variant="link" size="sm" onClick={downloadSampleCsv}>
                  Download Sample CSV
                </Button>
              </div>

              {/* File upload */}
              <div className="space-y-1">
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                {file && (
                  <p className="text-sm text-muted-foreground">Selected: {file.name}</p>
                )}
              </div>

              {/* Error display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 whitespace-pre-line">{error}</p>
                </div>
              )}

              {/* Success display */}
              {uploadResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Import Successful!</h4>
                  <p className="text-green-800">{uploadResult.message}</p>
                  {uploadResult.sample_data && uploadResult.sample_data.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-green-800">Sample imported transactions:</p>
                      <div className="mt-2 space-y-1">
                        {uploadResult.sample_data.map((transaction: any, index: number) => (
                          <div key={index} className="text-sm text-green-700 bg-green-100 p-2 rounded">
                            {transaction.date} - {transaction.type} - {transaction.description}: ${Math.abs(transaction.amount).toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                  {uploadResult ? 'Close' : 'Cancel'}
                </Button>
                {!uploadResult && (
                  <Button onClick={handlePreview} disabled={!file || isUploading}>
                    {isUploading ? 'Processing...' : 'Preview Transactions'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">
                  Review {previewTransactions.length} Transaction{previewTransactions.length !== 1 ? 's' : ''}
                </h4>
                <p className="text-green-800 text-sm">
                  Please review the transactions below. You can edit or remove any transaction before importing.
                </p>
              </div>

              {/* Transactions Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Person</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewTransactions.map((transaction) => (
                    <TableRow key={transaction.tempId}>
                      <TableCell className="font-medium">{transaction.date}</TableCell>
                      <TableCell><span className="capitalize">{transaction.type}</span></TableCell>
                      <TableCell>{transaction.person}</TableCell>
                      <TableCell>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          {transaction.category}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={transaction.description}>
                        {transaction.description}
                      </TableCell>
                      <TableCell className={parseFloat(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {parseFloat(transaction.amount) >= 0 ? '+' : ''}${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditTransaction(transaction)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemoveTransaction(transaction.tempId)}>Remove</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {previewTransactions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions to import. Please go back and select a different file.</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep('upload')} disabled={isUploading}>
                  Back to Upload
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleClose} disabled={isUploading}>Cancel</Button>
                  <Button
                    onClick={handleConfirmImport}
                    disabled={previewTransactions.length === 0 || isUploading}
                  >
                    {isUploading ? 'Importing...' : `Import ${previewTransactions.length} Transaction${previewTransactions.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Transaction Modal */}
        <Dialog open={!!editingTransaction} onOpenChange={(open) => { if (!open) setEditingTransaction(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
            </DialogHeader>
            {editingTransaction && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editingTransaction.date}
                    onChange={(e) => setEditingTransaction({...editingTransaction, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select
                    value={editingTransaction.type}
                    onValueChange={(value) => setEditingTransaction({...editingTransaction, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Income">Income</SelectItem>
                      <SelectItem value="Expense">Expense</SelectItem>
                      <SelectItem value="Investment">Investment</SelectItem>
                      <SelectItem value="Savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Person</Label>
                  <Input
                    type="text"
                    value={editingTransaction.person}
                    onChange={(e) => setEditingTransaction({...editingTransaction, person: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select
                    value={editingTransaction.category}
                    onValueChange={(value) => setEditingTransaction({...editingTransaction, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={typeof category === 'string' ? category : category.id} value={typeof category === 'string' ? category : category.name}>
                          {typeof category === 'string' ? category : category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Input
                    type="text"
                    value={editingTransaction.description}
                    onChange={(e) => setEditingTransaction({...editingTransaction, description: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingTransaction.amount}
                    onChange={(e) => setEditingTransaction({...editingTransaction, amount: e.target.value})}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setEditingTransaction(null)}>Cancel</Button>
                  <Button onClick={handleSaveEdit}>Save Changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

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
    'Other': 'bg-gray-100 text-gray-800',
  };
  return colorMap[category] || 'bg-gray-100 text-gray-800';
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [filterConfig, setFilterConfig] = useState<Record<string, string>>({
    dateFrom: '',
    dateTo: '',
    type: '',
    category: '',
    person: '',
    description: '',
    amountMin: '',
    amountMax: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState<PaginatedTransactions | null>(null);
  
  // Dynamic data from API
  const [categories, setCategories] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  
  const pageSize = 25;

  // Dynamic options based on actual data and API categories/persons
  const dynamicOptions = useMemo(() => {
    const types = Array.from(new Set(allTransactions.map(t => t.type))).filter(Boolean);
    const transactionCategories = Array.from(new Set(allTransactions.map(t => t.category))).filter(Boolean);
    const transactionPersons = Array.from(new Set(allTransactions.map(t => t.person))).filter(Boolean);
    
    // Combine API data with transaction data for completeness
    const allCategories = Array.from(new Set([
      ...categories.map(c => c.name),
      ...transactionCategories
    ]));
    const allPersons = Array.from(new Set([
      ...persons.map(p => p.name),
      ...transactionPersons
    ]));

    return {
      types,
      categories: allCategories,
      persons: allPersons,
    };
  }, [allTransactions, categories, persons]);

  const transactionFilterDefs = useMemo<FilterDef[]>(() => [
    { key: 'type', label: 'Type', type: 'select', options: dynamicOptions.types },
    { key: 'category', label: 'Category', type: 'select', options: dynamicOptions.categories },
    { key: 'person', label: 'Person', type: 'select', options: dynamicOptions.persons },
    { key: 'description', label: 'Description', type: 'text', placeholder: 'Search description' },
    { key: 'dateFrom', label: 'Date From', type: 'date' },
    { key: 'dateTo', label: 'Date To', type: 'date' },
    { key: 'amountMin', label: 'Min Amount', type: 'number', placeholder: '0.00' },
    { key: 'amountMax', label: 'Max Amount', type: 'number', placeholder: '9999.99' },
  ], [dynamicOptions]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await transactionApi.getAll();
      setAllTransactions(response.data);
      setFilteredTransactions(response.data);
      
      // Update pagination
      const totalPages = Math.ceil(response.data.length / pageSize);
      const paginatedData = response.data.slice(0, pageSize);
      setTransactions(paginatedData);
      setCurrentPage(1);
      setPaginationData({
        items: paginatedData,
        total: response.data.length,
        page: 1,
        per_page: pageSize,
        pages: totalPages,
        has_next: 1 < totalPages,
        has_prev: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMessage);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchPersons = useCallback(async () => {
    try {
      const response = await personsApi.getAll();
      setPersons(response.data);
    } catch (err) {
      console.error('Error fetching persons:', err);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchPersons();
  }, [fetchTransactions, fetchCategories, fetchPersons]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(async () => {
    const clearedFilters = {
      dateFrom: '',
      dateTo: '',
      type: '',
      category: '',
      person: '',
      description: '',
      amountMin: '',
      amountMax: '',
    };
    setFilterConfig(clearedFilters);
    
    try {
      setLoading(true);
      setError(null);
      
      // Get all data without filters, only with current sort
      const queryParams = new URLSearchParams();
      if (sortConfig.field) {
        queryParams.append('sort_by', sortConfig.field);
        queryParams.append('sort_direction', sortConfig.direction);
      }
      
      const response = await transactionApi.getAll(queryParams.toString());
      setAllTransactions(response.data);
      setFilteredTransactions(response.data);
      
      // Update pagination
      const totalPages = Math.ceil(response.data.length / pageSize);
      setCurrentPage(1);
      const paginatedData = response.data.slice(0, pageSize);
      setTransactions(paginatedData);
      setPaginationData({
        items: paginatedData,
        total: response.data.length,
        page: 1,
        per_page: pageSize,
        pages: totalPages,
        has_next: 1 < totalPages,
        has_prev: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear filters';
      setError(errorMessage);
      console.error('Error clearing filters:', err);
    } finally {
      setLoading(false);
    }
  }, [sortConfig, pageSize]);

  const applyFilters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters from filter config
      const queryParams = new URLSearchParams();
      
      if (filterConfig.dateFrom) queryParams.append('date_from', filterConfig.dateFrom);
      if (filterConfig.dateTo) queryParams.append('date_to', filterConfig.dateTo);
      if (filterConfig.type) queryParams.append('type', filterConfig.type);
      if (filterConfig.category) queryParams.append('category', filterConfig.category);
      if (filterConfig.person) queryParams.append('person', filterConfig.person);
      if (filterConfig.description) queryParams.append('description', filterConfig.description);
      if (filterConfig.amountMin) queryParams.append('amount_min', filterConfig.amountMin);
      if (filterConfig.amountMax) queryParams.append('amount_max', filterConfig.amountMax);
      
      // Add sorting parameters
      if (sortConfig.field) {
        queryParams.append('sort_by', sortConfig.field);
        queryParams.append('sort_direction', sortConfig.direction);
      }
      
      const response = await transactionApi.getAll(queryParams.toString());
      setAllTransactions(response.data);
      setFilteredTransactions(response.data);
      
      // Update pagination
      const totalPages = Math.ceil(response.data.length / pageSize);
      setCurrentPage(1);
      const paginatedData = response.data.slice(0, pageSize);
      setTransactions(paginatedData);
      setPaginationData({
        items: paginatedData,
        total: response.data.length,
        page: 1,
        per_page: pageSize,
        pages: totalPages,
        has_next: 1 < totalPages,
        has_prev: false,
      });
      
      setShowFilters(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply filters';
      setError(errorMessage);
      console.error('Error applying filters:', err);
    } finally {
      setLoading(false);
    }
  }, [filterConfig, sortConfig, pageSize]);

  const handleSort = useCallback(async (field: string) => {
    const newDirection: 'asc' | 'desc' = sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    const newSortConfig = { field, direction: newDirection };
    setSortConfig(newSortConfig);
    
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters with current filters and new sort
      const queryParams = new URLSearchParams();
      
      if (filterConfig.dateFrom) queryParams.append('date_from', filterConfig.dateFrom);
      if (filterConfig.dateTo) queryParams.append('date_to', filterConfig.dateTo);
      if (filterConfig.type) queryParams.append('type', filterConfig.type);
      if (filterConfig.category) queryParams.append('category', filterConfig.category);
      if (filterConfig.person) queryParams.append('person', filterConfig.person);
      if (filterConfig.description) queryParams.append('description', filterConfig.description);
      if (filterConfig.amountMin) queryParams.append('amount_min', filterConfig.amountMin);
      if (filterConfig.amountMax) queryParams.append('amount_max', filterConfig.amountMax);
      
      // Add new sorting parameters
      queryParams.append('sort_by', field);
      queryParams.append('sort_direction', newDirection);
      
      const response = await transactionApi.getAll(queryParams.toString());
      setAllTransactions(response.data);
      setFilteredTransactions(response.data);
      
      // Update pagination
      const totalPages = Math.ceil(response.data.length / pageSize);
      setCurrentPage(1);
      const paginatedData = response.data.slice(0, pageSize);
      setTransactions(paginatedData);
      setPaginationData({
        items: paginatedData,
        total: response.data.length,
        page: 1,
        per_page: pageSize,
        pages: totalPages,
        has_next: 1 < totalPages,
        has_prev: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sort transactions';
      setError(errorMessage);
      console.error('Error sorting transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [filterConfig, sortConfig.field, sortConfig.direction, pageSize]);

  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > (paginationData?.pages || 1)) return;
    setCurrentPage(page);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredTransactions.slice(startIndex, endIndex);
    setTransactions(paginatedData);
    setPaginationData(prev => prev ? {
      ...prev,
      page,
      items: paginatedData,
      has_next: page < prev.pages,
      has_prev: page > 1,
    } : null);
  }, [filteredTransactions, pageSize, paginationData?.pages]);

  const renderPagination = () => {
    if (!paginationData || paginationData.pages <= 1) return null;
    const pages = [];
    const currentPageNum = paginationData.page;
    const totalPages = paginationData.pages;
    if (currentPageNum > 3) {
      pages.push(1);
      if (currentPageNum > 4) pages.push('...');
    }
    for (let i = Math.max(1, currentPageNum - 2); i <= Math.min(totalPages, currentPageNum + 2); i++) {
      pages.push(i);
    }
    if (currentPageNum < totalPages - 2) {
      if (currentPageNum < totalPages - 3) pages.push('...');
      pages.push(totalPages);
    }
    return (
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Showing {Math.min((currentPageNum - 1) * paginationData.per_page + 1, paginationData.total)} to{' '}
            {Math.min(currentPageNum * paginationData.per_page, paginationData.total)} of {paginationData.total} transactions
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPageNum - 1)}
            disabled={!paginationData.has_prev}
            className={`px-3 py-1 text-sm rounded-md ${
              paginationData.has_prev
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            Previous
          </button>
          {pages.map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' ? handlePageChange(page) : undefined}
              disabled={page === '...'}
              className={`px-3 py-1 text-sm rounded-md ${
                page === currentPageNum
                  ? 'bg-green-600 text-white'
                  : page === '...'
                  ? 'text-gray-400 cursor-default'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPageNum + 1)}
            disabled={!paginationData.has_next}
            className={`px-3 py-1 text-sm rounded-md ${
              paginationData.has_next
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const handleDeleteTransaction = useCallback(async (transactionId: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await transactionApi.delete(transactionId);
      fetchTransactions();
    } catch (err) {
      setError('Failed to delete transaction');
      console.error('Error deleting transaction:', err);
    }
  }, [fetchTransactions]);

  const handleCreateTransaction = useCallback(async (transactionData: TransactionFormData) => {
    try {
      await transactionApi.create(transactionData);
      fetchTransactions();
      setShowCreateModal(false);
    } catch (err) {
      setError('Failed to create transaction');
      console.error('Error creating transaction:', err);
      throw err;
    }
  }, [fetchTransactions]);

  const handleUpdateTransaction = useCallback(async (transactionId: number, transactionData: TransactionFormData) => {
    try {
      await transactionApi.update(transactionId, transactionData);
      fetchTransactions();
      setEditingTransaction(null);
    } catch (err) {
      setError('Failed to update transaction');
      console.error('Error updating transaction:', err);
      throw err;
    }
  }, [fetchTransactions]);

  const handleCsvImportSuccess = useCallback(() => {
    fetchTransactions();
    setShowCsvImportModal(false);
  }, [fetchTransactions]);

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
          </div>
          <div className="card-content">
            {/* Action Bar */}
            <div className="flex items-center justify-between p-4 bg-muted/50 border-b">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {filteredTransactions.length} transactions total • {paginationData?.items?.length || 0} on this page
                </div>
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCsvImportModal(true)}>
                  Import CSV
                </Button>
                <Button onClick={() => setShowCreateModal(true)}>
                  Add Transaction
                </Button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <FilterPanel
                filters={transactionFilterDefs}
                filterState={filterConfig}
                onFilterChange={handleFilterChange}
                onClear={clearFilters}
                onApply={applyFilters}
              />
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 text-red-600 hover:text-red-800 p-0 h-auto"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </Button>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-muted-foreground">Loading transactions...</span>
              </div>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <SortableHeader field="date" label="Date" sortConfig={sortConfig} onSort={handleSort} />
                        </TableHead>
                        <TableHead>
                          <SortableHeader field="type" label="Type" sortConfig={sortConfig} onSort={handleSort} />
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">
                          <SortableHeader field="person" label="Person" sortConfig={sortConfig} onSort={handleSort} />
                        </TableHead>
                        <TableHead>
                          <SortableHeader field="category" label="Category" sortConfig={sortConfig} onSort={handleSort} />
                        </TableHead>
                        <TableHead className="max-w-xs">
                          <SortableHeader field="description" label="Description" sortConfig={sortConfig} onSort={handleSort} />
                        </TableHead>
                        <TableHead>
                          <SortableHeader field="amount" label="Amount" sortConfig={sortConfig} onSort={handleSort} />
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginationData?.total === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                            {Object.values(filterConfig).some(v => v !== '') 
                              ? 'No transactions match your filters' 
                              : 'No transactions found'
                            }
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginationData?.items?.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              {new Date(transaction.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <span className="capitalize">{transaction.type}</span>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{transaction.person}</TableCell>
                            <TableCell>
                              <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getCategoryBadgeColor(transaction.category)}`}>
                                {transaction.category}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={transaction.description}>
                              {transaction.description}
                            </TableCell>
                            <TableCell className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingTransaction(transaction)}
                                  aria-label={`Edit transaction ${transaction.description}`}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                  aria-label={`Delete transaction ${transaction.description}`}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {renderPagination()}
              </>
            )}

            {/* Modals */}
            <TransactionModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSubmit={handleCreateTransaction}
              title="Create New Transaction"
              categories={categories}
              persons={persons}
            />

            <CsvImportModal
              isOpen={showCsvImportModal}
              onClose={() => setShowCsvImportModal(false)}
              onImportSuccess={handleCsvImportSuccess}
              categories={categories}
            />

            <TransactionModal
              isOpen={!!editingTransaction}
              onClose={() => setEditingTransaction(null)}
              onSubmit={(data) => handleUpdateTransaction(editingTransaction!.id, data)}
              title="Edit Transaction"
              initialData={editingTransaction ?? undefined}
              categories={categories}
              persons={persons}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
