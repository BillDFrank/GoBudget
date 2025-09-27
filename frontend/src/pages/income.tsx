import { useEffect, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { dashboardApi } from '../lib/api';
import { formatCurrency } from '../utils/formatting';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Info, Calendar } from 'lucide-react';

interface IncomeData {
  cards: {
    this_month: number;
    last_month: number;
    average_monthly: number;
  };
  bar_chart: {
    data: any[];
    keys: string[];
  };
}

export default function Income() {
  const [incomeData, setIncomeData] = useState<IncomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number>(12);

  const monthOptions = [
    { value: 3, label: 'Last 3 months' },
    { value: 6, label: 'Last 6 months' },
    { value: 12, label: 'Last 12 months' },
    { value: 18, label: 'Last 18 months' },
    { value: 24, label: 'Last 24 months' },
    { value: 36, label: 'Last 36 months' },
  ];

  const fetchIncomeData = async (months: number) => {
    try {
      setLoading(true);
      console.log(`Fetching income data for ${months} months`);
      const response = await dashboardApi.getIncomeData(months);
      console.log(`Received data:`, response.data);
      console.log(`Chart data length:`, response.data.bar_chart?.data?.length);
      setIncomeData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching income data:', err);
      setError('Failed to load income data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeData(selectedMonths);
  }, [selectedMonths]);

  const handleMonthRangeChange = (value: string) => {
    const months = parseInt(value);
    setSelectedMonths(months);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="page-container">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading income data...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="page-container">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!incomeData) {
    return (
      <AdminLayout>
        <div className="page-container">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">No income data available</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="page-container">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  This Month
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(incomeData.cards.this_month)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Last Month
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(incomeData.cards.last_month)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Monthly
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="inline-flex items-center justify-center">
                          <Info className="w-3 h-3 text-gray-400 hover:text-gray-600 transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Calculated based on actual months with data in the trailing {selectedMonths} months period</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(incomeData.cards.average_monthly)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {incomeData.bar_chart.data.length > 0 && (
          <div className="card mb-8">
            <div className="card-header">
              <h2 className="card-title">Monthly Income by Source</h2>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <Select value={selectedMonths.toString()} onValueChange={handleMonthRangeChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="card-content">
              <ChartContainer
                config={{
                  ...incomeData.bar_chart.keys.reduce((acc, key, index) => {
                    // Extended green theme colors - enough for many categories
                    const colors = [
                      '#0f5132',  // Very dark green
                      '#198754',  // Bootstrap success dark
                      '#20c997',  // Bootstrap info
                      '#28a745',  // Classic green
                      '#34ce57',  // Medium green
                      '#40d67a',  // Light green
                      '#52de9b',  // Mint green
                      '#6ee7b7',  // Light mint
                      '#065f46',  // Emerald 800
                      '#047857',  // Emerald 700
                      '#059669',  // Emerald 600
                      '#10b981',  // Emerald 500
                      '#34d399',  // Emerald 400
                      '#6ee7b7',  // Emerald 300
                      '#a7f3d0',  // Emerald 200
                      '#064e3b',  // Green 900
                      '#065f46',  // Green 800
                      '#047857',  // Green 700
                      '#059669',  // Green 600
                      '#10b981',  // Green 500
                    ];
                    
                    const color = colors[index % colors.length];
                    console.log(`Assigning color ${color} to category ${key} (index: ${index})`);
                    
                    return {
                      ...acc,
                      [key]: {
                        label: key,
                        color: color,
                      },
                    };
                  }, {}),
                }}
                className="min-h-[400px]"
              >
                <BarChart
                  data={incomeData.bar_chart.data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) {
                        return null;
                      }
                      
                      // Filter out entries with zero values
                      const filteredPayload = payload.filter(entry => Number(entry.value) > 0);
                      
                      if (filteredPayload.length === 0) {
                        return null;
                      }

                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <p className="font-medium">{label}</p>
                          {filteredPayload.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm">
                                {entry.dataKey}: {formatCurrency(Number(entry.value))}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  {incomeData.bar_chart.keys.map((key, index) => {
                    const colors = [
                      '#0f5132',  // Very dark green
                      '#198754',  // Bootstrap success dark
                      '#20c997',  // Bootstrap info
                      '#28a745',  // Classic green
                      '#34ce57',  // Medium green
                      '#40d67a',  // Light green
                      '#52de9b',  // Mint green
                      '#6ee7b7',  // Light mint
                      '#065f46',  // Emerald 800
                      '#047857',  // Emerald 700
                      '#059669',  // Emerald 600
                      '#10b981',  // Emerald 500
                      '#34d399',  // Emerald 400
                      '#6ee7b7',  // Emerald 300
                      '#a7f3d0',  // Emerald 200
                      '#064e3b',  // Green 900
                      '#065f46',  // Green 800
                      '#047857',  // Green 700
                      '#059669',  // Green 600
                      '#10b981',  // Green 500
                    ];
                    
                    return (
                      <Bar
                        key={key}
                        dataKey={key}
                        stackId="income"
                        fill={colors[index % colors.length]}
                      />
                    );
                  })}
                  {/* Add a custom label component for totals on top of bars */}
                  <Bar 
                    dataKey="total" 
                    fill="transparent" 
                    stackId="label"
                    label={{
                      position: 'top',
                      fill: '#000',
                      fontSize: 12,
                      fontWeight: 'bold',
                      formatter: (value: number) => formatCurrency(value)
                    }}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        )}

        {incomeData.bar_chart.data.length === 0 && (
          <div className="card mb-8">
            <div className="card-header">
              <h2 className="card-title">Monthly Income by Source</h2>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <Select value={selectedMonths.toString()} onValueChange={handleMonthRangeChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="card-content">
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-500">No income data available for the chart.</p>
                <p className="text-sm text-gray-400 mt-2">Add some income transactions to see your monthly breakdown.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
