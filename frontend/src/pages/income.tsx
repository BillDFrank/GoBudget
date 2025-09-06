import AdminLayout from '../layout/AdminLayout';

export default function Income() {
  return (
    <AdminLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Income</h1>
          <p className="page-subtitle">
            Track and manage your income sources
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  This Month
                </p>
                <p className="text-2xl font-bold text-green-600">
                  $5,432.10
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  $4,850.00
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
                  Average Monthly
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  $5,141.05
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Income Sources</h2>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Add Income
              </button>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Salary</p>
                      <p className="text-sm text-gray-500">Monthly</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">$4,500.00</span>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Freelancing</p>
                      <p className="text-sm text-gray-500">Variable</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">$750.00</span>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Investments</p>
                      <p className="text-sm text-gray-500">Monthly</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">$182.10</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Income Transactions</h2>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 font-medium">S</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Monthly Salary</p>
                      <p className="text-sm text-gray-500">Sept 1, 2024</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">+$4,500.00</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 font-medium">F</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Freelance Project</p>
                      <p className="text-sm text-gray-500">Aug 28, 2024</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">+$750.00</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 font-medium">I</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Investment Returns</p>
                      <p className="text-sm text-gray-500">Aug 25, 2024</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">+$182.10</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 font-medium">B</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Bonus Payment</p>
                      <p className="text-sm text-gray-500">Aug 15, 2024</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">+$1,000.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
