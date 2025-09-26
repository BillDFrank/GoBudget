import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { dashboardApi } from '../lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardKPIs {
  income: number;
  expenses: number;
  investments: number;
  savings: number;
}

interface ChartData {
  id: string;
  label: string;
  value: number;
}

interface DashboardData {
  month: number;
  year: number;
  kpis: DashboardKPIs;
  charts: {
    income_by_description: ChartData[];
    expenses_by_category: ChartData[];
  };
}

// Colors for pie charts
const COLORS = {
  income: ['#10B981', '#059669', '#047857', '#065F46', '#064E3B'],
  expenses: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D']
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dashboardApi.get(selectedYear, selectedMonth);
      setDashboardData(response.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Month navigation functions
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

  // Month picker functions
  const toggleMonthPicker = () => {
    setShowMonthPicker(!showMonthPicker);
  };

  const selectMonth = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setShowMonthPicker(false);
  };

  // Generate years for picker (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getMonthName = (month: number, year: number) => {
    return new Date(year, month - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getShortMonthName = (month: number) => {
    return new Date(2024, month - 1).toLocaleDateString('en-US', {
      month: 'short'
    });
  };

  // Custom label component for better text handling
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, label, data }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30; // Position labels further from pie
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Calculate percentage
    const total = data.reduce((sum: number, item: any) => sum + item.value, 0);
    const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
    
    // Truncate long labels
    const truncatedLabel = label.length > 17 ? `${label.substring(0, 17)}...` : label;
    
    return (
      <g>
        <text 
          x={x} 
          y={y - 5} 
          fill="black" 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          fontSize="12"
          fontWeight="500"
        >
          {truncatedLabel}
        </text>
        <text 
          x={x} 
          y={y + 10} 
          fill="gray" 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          fontSize="11"
        >
          {percent}%
        </text>
      </g>
    );
  };

  // Create label functions with data context
  const renderIncomeLabel = (props: any) => {
    return <CustomLabel {...props} data={dashboardData?.charts.income_by_description || []} />;
  };

  const renderExpenseLabel = (props: any) => {
    return <CustomLabel {...props} data={dashboardData?.charts.expenses_by_category || []} />;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="page-container">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="page-container">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Overview of your financial activities and insights
          </p>
        </div>

        {/* Month Selection */}
        <div className="card mb-6">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Financial Overview</h3>
                <p className="text-sm text-gray-600">
                  {dashboardData ? getMonthName(dashboardData.month, dashboardData.year) : 'Loading...'}
                </p>
              </div>
              
              {/* Custom Month/Year Navigator */}
              <div className="flex items-center gap-3 relative">
                <div className="flex items-center bg-gray-50 rounded-lg p-1">
                  {/* Previous Month Button */}
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-white rounded-md transition-colors text-gray-600 hover:text-gray-900"
                    title="Previous Month"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Current Month/Year Display - Clickable */}
                  <button
                    onClick={toggleMonthPicker}
                    className="px-4 py-2 bg-white rounded-md shadow-sm border min-w-[140px] text-center hover:bg-gray-50 transition-colors group"
                    title="Click to select month"
                  >
                    <div className="font-medium text-gray-900 flex items-center justify-center gap-1">
                      {getShortMonthName(selectedMonth)} {selectedYear}
                      <svg 
                        className={`w-3 h-3 text-gray-500 transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {/* Next Month Button */}
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-white rounded-md transition-colors text-gray-600 hover:text-gray-900"
                    title="Next Month"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Month Picker Dropdown */}
                {showMonthPicker && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowMonthPicker(false)}
                    />
                    
                    {/* Dropdown */}
                    <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 min-w-[320px]">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
                        <div className="grid grid-cols-3 gap-2">
                          {monthNames.map((monthName, index) => (
                            <button
                              key={index}
                              onClick={() => selectMonth(index + 1, selectedYear)}
                              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                selectedMonth === index + 1 
                                  ? 'bg-green-100 text-green-800 border border-green-300' 
                                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {monthName.substring(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
                        <button
                          onClick={() => setShowMonthPicker(false)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Current Month Button */}
                <button
                  onClick={goToCurrentMonth}
                  className="px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                  title="Go to Current Month"
                >
                  Today
                </button>
              </div>
            </div>
          </div>
        </div>

        {dashboardData && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Income Card */}
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Income
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(dashboardData.kpis.income)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expenses Card */}
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Expenses
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(dashboardData.kpis.expenses)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Invested Card */}
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Invested
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(dashboardData.kpis.investments)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Saved Card */}
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Saved
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(dashboardData.kpis.savings)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Income by Description Chart */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Income by Description</h2>
                </div>
                <div className="card-content">
                  {dashboardData.charts.income_by_description.length > 0 ? (
                    <div style={{ width: '100%', height: '400px' }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={dashboardData.charts.income_by_description}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            label={renderIncomeLabel}
                            labelLine={false}
                          >
                            {dashboardData.charts.income_by_description.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS.income[index % COLORS.income.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No income data for this month</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Expenses by Category Chart */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Expenses by Category</h2>
                </div>
                <div className="card-content">
                  {dashboardData.charts.expenses_by_category.length > 0 ? (
                    <div style={{ width: '100%', height: '400px' }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={dashboardData.charts.expenses_by_category}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            label={renderExpenseLabel}
                            labelLine={false}
                          >
                            {dashboardData.charts.expenses_by_category.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS.expenses[index % COLORS.expenses.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No expense data for this month</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
