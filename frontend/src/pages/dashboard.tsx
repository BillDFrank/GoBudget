import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { dashboardApi } from '../lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, BarChart2, Wallet, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Financial Overview</h3>
                <p className="text-sm text-muted-foreground">
                  {dashboardData ? getMonthName(dashboardData.month, dashboardData.year) : 'Loading...'}
                </p>
              </div>
              
              {/* Month/Year Navigator */}
              <div className="flex items-center gap-3 relative">
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <Button variant="ghost" size="icon" onClick={goToPreviousMonth} title="Previous Month">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={toggleMonthPicker}
                    className="min-w-[140px] bg-background"
                    title="Click to select month"
                  >
                    {getShortMonthName(selectedMonth)} {selectedYear}
                    <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  <Button variant="ghost" size="icon" onClick={goToNextMonth} title="Next Month">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Month Picker Dropdown */}
                {showMonthPicker && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMonthPicker(false)} />
                    <div className="absolute top-full mt-2 right-0 bg-background border rounded-lg shadow-lg z-20 p-4 min-w-[320px]">
                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-2">Select Year</label>
                        <Select
                          value={String(selectedYear)}
                          onValueChange={(v) => setSelectedYear(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableYears.map(year => (
                              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Select Month</label>
                        <div className="grid grid-cols-3 gap-2">
                          {monthNames.map((monthName, index) => (
                            <Button
                              key={index}
                              variant={selectedMonth === index + 1 ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => selectMonth(index + 1, selectedYear)}
                            >
                              {monthName.substring(0, 3)}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setShowMonthPicker(false)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                
                <Button variant="outline" size="sm" onClick={goToCurrentMonth} title="Go to Current Month">
                  Today
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {dashboardData && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(dashboardData.kpis.income)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(dashboardData.kpis.expenses)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Invested</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(dashboardData.kpis.investments)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart2 className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Saved</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(dashboardData.kpis.savings)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Income by Description</CardTitle>
                </CardHeader>
                <CardContent>
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
                      <p className="text-muted-foreground">No income data for this month</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
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
                      <p className="text-muted-foreground">No expense data for this month</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
