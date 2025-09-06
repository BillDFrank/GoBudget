import AdminLayout from '../layout/AdminLayout';

export default function Transactions() {
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
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Add Transaction
            </button>
          </div>
          <div className="card-content">
            <div className="mb-4 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                  <option>All Categories</option>
                  <option>Food & Dining</option>
                  <option>Transportation</option>
                  <option>Shopping</option>
                  <option>Entertainment</option>
                  <option>Bills & Utilities</option>
                </select>
              </div>
              <div>
                <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                  <option>Last 6 months</option>
                  <option>Last year</option>
                  <option>All time</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Date</th>
                    <th scope="col" className="px-6 py-3">Description</th>
                    <th scope="col" className="px-6 py-3">Category</th>
                    <th scope="col" className="px-6 py-3">Amount</th>
                    <th scope="col" className="px-6 py-3">Account</th>
                    <th scope="col" className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-b">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      2024-09-06
                    </td>
                    <td className="px-6 py-4">Grocery Store</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Food & Dining
                      </span>
                    </td>
                    <td className="px-6 py-4 text-red-600 font-medium">-$89.45</td>
                    <td className="px-6 py-4">Checking</td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      2024-09-05
                    </td>
                    <td className="px-6 py-4">Salary Deposit</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Income
                      </span>
                    </td>
                    <td className="px-6 py-4 text-green-600 font-medium">+$2,500.00</td>
                    <td className="px-6 py-4">Checking</td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      2024-09-04
                    </td>
                    <td className="px-6 py-4">Restaurant Dinner</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Food & Dining
                      </span>
                    </td>
                    <td className="px-6 py-4 text-red-600 font-medium">-$45.20</td>
                    <td className="px-6 py-4">Credit Card</td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-700">
                Showing 1 to 3 of 45 transactions
              </span>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm text-gray-500 border border-gray-300 rounded hover:bg-gray-50">
                  Previous
                </button>
                <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                  1
                </button>
                <button className="px-3 py-1 text-sm text-gray-500 border border-gray-300 rounded hover:bg-gray-50">
                  2
                </button>
                <button className="px-3 py-1 text-sm text-gray-500 border border-gray-300 rounded hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
