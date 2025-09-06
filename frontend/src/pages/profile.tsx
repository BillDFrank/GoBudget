import AdminLayout from '../layout/AdminLayout';

export default function Profile() {
  return (
    <AdminLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Personal Information</h2>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            <div className="card mt-6">
              <div className="card-header">
                <h2 className="card-title">Change Password</h2>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Profile Photo</h2>
              </div>
              <div className="card-content">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-2xl">U</span>
                  </div>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    Change Photo
                  </button>
                </div>
              </div>
            </div>

            <div className="card mt-6">
              <div className="card-header">
                <h2 className="card-title">Account Statistics</h2>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Member since</span>
                    <span className="text-gray-900 dark:text-white">Jan 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total transactions</span>
                    <span className="text-gray-900 dark:text-white">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Categories used</span>
                    <span className="text-gray-900 dark:text-white">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Budget goals</span>
                    <span className="text-gray-900 dark:text-white">5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
