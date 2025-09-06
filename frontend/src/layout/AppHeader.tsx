"use client";
import { useSidebar } from "../context/SidebarContext";
import { useAuthStore } from "../store/auth";
import React, { useState } from "react";

const AppHeader: React.FC = () => {
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { user } = useAuthStore();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        
        {/* Left side - Toggle button and mobile logo */}
        <div className="flex items-center gap-4">
          <button
            className="flex items-center justify-center w-10 h-10 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 lg:hidden"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">GB</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Go Budget
              </span>
            </div>
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="hidden lg:flex lg:flex-1 lg:max-w-md lg:mx-6">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="w-4 h-4 text-gray-500"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
            <input
              type="search"
              className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-green-500 focus:border-green-500"
              placeholder="Search transactions, categories..."
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right side - User Menu only */}
        <div className="flex items-center gap-3">
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'B'}
                </span>
              </div>
              <span className="hidden lg:block text-gray-900 font-medium">
                {user?.username || 'BillFrank'}
              </span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  Your Profile
                </a>
                <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  Settings
                </a>
                <hr className="my-1 border-gray-200" />
                <a href="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  Sign out
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
