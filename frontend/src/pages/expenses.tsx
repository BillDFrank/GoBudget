import AdminLayout from '../layout/AdminLayout';

export default function Expenses() {
  return (
    <AdminLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">
            Monitor and categorize your spending
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  This Month
                </p>
                <p className="text-2xl font-bold text-red-600">
                  $3,876.45
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
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
                  $4,120.33
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
                  Budget Remaining
                </p>
                <p className="text-2xl font-bold text-green-600">
                  $1,123.55
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Expense Categories</h2>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Add Expense
              </button>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Food & Dining</p>
                      <p className="text-sm text-gray-500">35% of budget</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-red-600 font-medium">$1,356.50</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Housing</p>
                      <p className="text-sm text-gray-500">45% of budget</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-red-600 font-medium">$1,800.00</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Transportation</p>
                      <p className="text-sm text-gray-500">15% of budget</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-red-600 font-medium">$350.75</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Entertainment</p>
                      <p className="text-sm text-gray-500">10% of budget</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-red-600 font-medium">$369.20</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Expenses</h2>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 font-medium">G</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Grocery Store</p>
                      <p className="text-sm text-gray-500">Today, 2:30 PM</p>
                    </div>
                  </div>
                  <span className="text-red-600 font-medium">-$89.45</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 font-medium">R</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Restaurant Dinner</p>
                      <p className="text-sm text-gray-500">Yesterday, 7:15 PM</p>
                    </div>
                  </div>
                  <span className="text-red-600 font-medium">-$45.20</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 font-medium">G</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Gas Station</p>
                      <p className="text-sm text-gray-500">Sept 4, 8:30 AM</p>
                    </div>
                  </div>
                  <span className="text-red-600 font-medium">-$58.20</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 font-medium">S</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Streaming Service</p>
                      <p className="text-sm text-gray-500">Sept 3, 10:00 AM</p>
                    </div>
                  </div>
                  <span className="text-red-600 font-medium">-$14.99</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 font-medium">C</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Coffee Shop</p>
                      <p className="text-sm text-gray-500">Sept 2, 9:15 AM</p>
                    </div>
                  </div>
                  <span className="text-red-600 font-medium">-$5.75</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
