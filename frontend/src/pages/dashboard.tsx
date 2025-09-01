import { useAuthStore } from '../store/auth';

export default function Dashboard() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.username}!</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Welcome to Your Financial Dashboard
            </h2>
            <p className="text-gray-600 mb-6">
              Your financial tracking features will be implemented here. This includes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-900">Income Tracking</h3>
                <p className="text-sm text-gray-600">Monitor your income sources</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-900">Expense Management</h3>
                <p className="text-sm text-gray-600">Track and categorize expenses</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-900">Savings Goals</h3>
                <p className="text-sm text-gray-600">Set and monitor savings targets</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-900">Investment Tracking</h3>
                <p className="text-sm text-gray-600">Monitor your investments</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                Features coming soon: Interactive charts, data input forms, and detailed analytics.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}