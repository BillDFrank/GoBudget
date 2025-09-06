import AdminLayout from '../layout/AdminLayout';

export default function Investments() {
  return (
    <AdminLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Investments</h1>
          <p className="page-subtitle">
            Monitor your investment portfolio and performance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Portfolio
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  $45,678.90
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Today's Gain/Loss
                </p>
                <p className="text-2xl font-bold text-green-600">
                  +$234.56
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
                  Total Return
                </p>
                <p className="text-2xl font-bold text-green-600">
                  +12.45%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Dividend Income
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  $182.10
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Portfolio Holdings</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Add Investment
              </button>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">SPY</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">SPDR S&P 500 ETF</p>
                      <p className="text-sm text-gray-500">50 shares • $445.67/share</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-900 dark:text-white font-medium">$22,283.50</span>
                    <p className="text-green-600 text-sm">+2.4%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">AAPL</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Apple Inc.</p>
                      <p className="text-sm text-gray-500">25 shares • $175.43/share</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-900 dark:text-white font-medium">$4,385.75</span>
                    <p className="text-green-600 text-sm">+1.8%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">MSFT</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Microsoft Corporation</p>
                      <p className="text-sm text-gray-500">15 shares • $378.85/share</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-900 dark:text-white font-medium">$5,682.75</span>
                    <p className="text-red-600 text-sm">-0.5%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-600 font-bold text-sm">VTI</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Vanguard Total Stock Market ETF</p>
                      <p className="text-sm text-gray-500">60 shares • $218.88/share</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-900 dark:text-white font-medium">$13,132.80</span>
                    <p className="text-green-600 text-sm">+1.2%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Asset Allocation</h2>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <span className="text-gray-900 dark:text-white">US Stocks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 dark:text-white font-medium">65%</span>
                    <span className="text-gray-500">$29,691.29</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-600 rounded"></div>
                    <span className="text-gray-900 dark:text-white">International Stocks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 dark:text-white font-medium">20%</span>
                    <span className="text-gray-500">$9,135.78</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-purple-600 rounded"></div>
                    <span className="text-gray-900 dark:text-white">Bonds</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 dark:text-white font-medium">10%</span>
                    <span className="text-gray-500">$4,567.89</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                    <span className="text-gray-900 dark:text-white">Cash & Equivalents</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 dark:text-white font-medium">5%</span>
                    <span className="text-gray-500">$2,283.95</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '5%' }}></div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">Investment Tip</h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Your portfolio is well-diversified! Consider rebalancing quarterly to maintain your target allocation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
