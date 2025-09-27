import { useEffect, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import { dashboardApi, categoriesApi } from '../lib/api';
import { formatCurrency } from '../utils/formatting';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Info, Calendar, TrendingDown } from 'lucide-react';

interface ExpensesData {
  cards: {
    this_month: number;
    last_month: number;
    average_monthly: number;
  };
  line_chart: {
    data: { month: string; total: number }[];
  };
  bar_chart: {
    data: any[];
    keys: string[];
  };
}

interface Category {
  id: number;
  name: string;
}

export default function Expenses() {
  const [expensesData, setExpensesData] = useState<ExpensesData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number>(12);
  const [selectedCategories1, setSelectedCategories1] = useState<string[]>([]);
  const [selectedCategories2, setSelectedCategories2] = useState<string[]>([]);

  const monthOptions = [
    { value: 3, label: 'Last 3 months' },
    { value: 6, label: 'Last 6 months' },
    { value: 12, label: 'Last 12 months' },
    { value: 18, label: 'Last 18 months' },
    { value: 24, label: 'Last 24 months' },
    { value: 36, label: 'Last 36 months' },
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load both expenses data and categories in parallel
        const [expensesResponse, categoriesResponse] = await Promise.all([
          dashboardApi.getExpensesData(selectedMonths),
          categoriesApi.getAll()
        ]);
        
        console.log('Received expenses data:', expensesResponse.data);
        setExpensesData(expensesResponse.data);
        setCategories(categoriesResponse.data);
        
        // Set default category selections if none are set
        if (categoriesResponse.data.length > 0 && selectedCategories1.length === 0 && selectedCategories2.length === 0) {
          const availableCategories = categoriesResponse.data.map((cat: Category) => cat.name);
          if (availableCategories.length >= 1) {
            setSelectedCategories1([availableCategories[0]]);
          }
          if (availableCategories.length >= 2) {
            setSelectedCategories2([availableCategories[1]]);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedMonths]);

  const handleMonthRangeChange = (value: string) => {
    const months = parseInt(value);
    setSelectedMonths(months);
  };

  const getFilteredChartData = (selectedCats: string[]) => {
    if (!expensesData || selectedCats.length === 0) return [];
    
    return expensesData.bar_chart.data.map(monthData => {
      const filteredMonth: any = { month: monthData.month };
      let total = 0;
      
      selectedCats.forEach(category => {
        if (monthData[category]) {
          filteredMonth[category] = monthData[category];
          total += monthData[category];
        }
      });
      
      filteredMonth.total = total;
      return filteredMonth;
    });
  };

  const categoryOptions: Option[] = categories.map(cat => ({
    label: cat.name,
    value: cat.name
  }));

  if (loading) {
    return (
      <AdminLayout>
        <div className="page-container">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading expenses data...</div>
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

  if (!expensesData) {
    return (
      <AdminLayout>
        <div className="page-container">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">No expenses data available</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const filteredData1 = getFilteredChartData(selectedCategories1);
  const filteredData2 = getFilteredChartData(selectedCategories2);

  return (
    <AdminLayout>
      <div className="page-container">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  This Month
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(expensesData.cards.this_month)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
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
                  {formatCurrency(expensesData.cards.last_month)}
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
                  {formatCurrency(expensesData.cards.average_monthly)}
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

        {/* Line Chart - Total Expenses by Month */}
        {expensesData.line_chart.data.length > 0 && (
          <div className="card mb-8">
            <div className="card-header">
              <h2 className="card-title">Total Expenses by Month</h2>
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
                  total: {
                    label: "Total Expenses",
                    color: "#ef4444",
                  },
                }}
                className="min-h-[300px]"
              >
                <LineChart
                  data={expensesData.line_chart.data}
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
                      if (!active || !payload || !payload.length) return null;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <p className="font-medium">{label}</p>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <span className="text-sm">
                              Total: {formatCurrency(Number(payload[0].value))}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: "#ef4444", strokeWidth: 2 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </div>
        )}

        {/* First Category Chart */}
        {categoryOptions.length > 0 && (
          <div className="card mb-8">
            <div className="card-header">
              <h2 className="card-title">Expenses by Category - Chart 1</h2>
              <div className="flex items-center gap-4">
                <MultiSelect
                  options={categoryOptions}
                  selected={selectedCategories1}
                  onChange={setSelectedCategories1}
                  placeholder="Select categories..."
                  className="w-[300px]"
                />
              </div>
            </div>
            <div className="card-content">
              {filteredData1.length > 0 ? (
                <ChartContainer
                  config={selectedCategories1.reduce((acc, category, index) => {
                    const colors = [
                      '#dc2626', '#7c2d12', '#991b1b', '#b91c1c', '#dc2626',
                      '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'
                    ];
                    return {
                      ...acc,
                      [category]: {
                        label: category,
                        color: colors[index % colors.length],
                      },
                    };
                  }, {})}
                  className="min-h-[400px]"
                >
                  <BarChart
                    data={filteredData1}
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
                        if (!active || !payload || !payload.length) return null;
                        const filteredPayload = payload.filter(entry => 
                          entry.dataKey !== 'total' && Number(entry.value) > 0
                        );
                        if (filteredPayload.length === 0) return null;

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
                    {selectedCategories1.map((category, index) => {
                      const colors = [
                        '#dc2626', '#7c2d12', '#991b1b', '#b91c1c', '#dc2626',
                        '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'
                      ];
                      return (
                        <Bar
                          key={category}
                          dataKey={category}
                          stackId="expenses1"
                          fill={colors[index % colors.length]}
                        />
                      );
                    })}
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Select categories to view chart</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Second Category Chart */}
        {categoryOptions.length > 0 && (
          <div className="card mb-8">
            <div className="card-header">
              <h2 className="card-title">Expenses by Category - Chart 2</h2>
              <div className="flex items-center gap-4">
                <MultiSelect
                  options={categoryOptions}
                  selected={selectedCategories2}
                  onChange={setSelectedCategories2}
                  placeholder="Select categories..."
                  className="w-[300px]"
                />
              </div>
            </div>
            <div className="card-content">
              {filteredData2.length > 0 ? (
                <ChartContainer
                  config={selectedCategories2.reduce((acc, category, index) => {
                    const colors = [
                      '#7c3aed', '#5b21b6', '#6d28d9', '#7c2d12', '#8b5cf6',
                      '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff'
                    ];
                    return {
                      ...acc,
                      [category]: {
                        label: category,
                        color: colors[index % colors.length],
                      },
                    };
                  }, {})}
                  className="min-h-[400px]"
                >
                  <BarChart
                    data={filteredData2}
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
                        if (!active || !payload || !payload.length) return null;
                        const filteredPayload = payload.filter(entry => 
                          entry.dataKey !== 'total' && Number(entry.value) > 0
                        );
                        if (filteredPayload.length === 0) return null;

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
                    {selectedCategories2.map((category, index) => {
                      const colors = [
                        '#7c3aed', '#5b21b6', '#6d28d9', '#7c2d12', '#8b5cf6',
                        '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff'
                      ];
                      return (
                        <Bar
                          key={category}
                          dataKey={category}
                          stackId="expenses2"
                          fill={colors[index % colors.length]}
                        />
                      );
                    })}
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Select categories to view chart</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No data states */}
        {(!expensesData.line_chart.data.length || !expensesData.bar_chart.data.length) && (
          <div className="card mb-8">
            <div className="card-content">
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <TrendingDown className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-500">No expenses data available for the selected time range.</p>
                <p className="text-sm text-gray-400 mt-2">Add some expense transactions to see your spending analysis.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}