import AdminLayout from '../layout/AdminLayout';

export default function Savings() {
  return (
    <AdminLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Savings</h1>
          <p className="page-subtitle">
            Track your savings goals and progress
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Savings
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  $8,901.23
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  This Month
                </p>
                <p className="text-2xl font-bold text-green-600">
                  +$750.00
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
                  Savings Rate
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  18.5%
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Savings Goals</h2>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Add Goal
              </button>
            </div>
            <div className="card-content">
              <div className="space-y-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">Emergency Fund</h3>
                    <span className="text-sm text-gray-500">85% complete</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-purple-600 font-medium">$8,500</span>
                    <span className="text-gray-500">/ $10,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Target: December 2024</p>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">Vacation Fund</h3>
                    <span className="text-sm text-gray-500">12% complete</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-purple-600 font-medium">$401.23</span>
                    <span className="text-gray-500">/ $3,500</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '12%' }}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Target: June 2025</p>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">New Car</h3>
                    <span className="text-sm text-gray-500">0% complete</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-purple-600 font-medium">$0</span>
                    <span className="text-gray-500">/ $25,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Target: December 2025</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Savings Accounts</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Add Account
              </button>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">High Yield Savings</p>
                      <p className="text-sm text-gray-500">4.5% APY</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">$7,250.45</span>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Emergency Fund</p>
                      <p className="text-sm text-gray-500">3.2% APY</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">$1,450.78</span>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Vacation Savings</p>
                      <p className="text-sm text-gray-500">2.8% APY</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">$200.00</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Savings Tip</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Consider automating your savings by setting up weekly transfers. Even $25/week adds up to $1,300 per year!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
