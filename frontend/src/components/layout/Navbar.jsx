'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // New state for dropdown

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // Close the dropdown if the user clicks outside of the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest('.dropdown-menu') &&
        !event.target.closest('button')
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();  // Call the logout function
  };

  // Helper function to get the appropriate dashboard link based on user type
  const getDashboardLink = () => {
    if (!user) return '/login';
    
    switch (user.user_type) {
      case 'farmer':
        return '/dashboard/farmer';
      case 'company':
        return '/dashboard/company';
      case 'trader':
        return '/dashboard/trader';
      default:
        return '/login';
    }
  };

  // Helper function to get the appropriate profile link based on user type
  const getProfileLink = () => {
    if (!user) return '/login';
    
    switch (user.user_type) {
      case 'farmer':
        return '/profile/farmer';
      case 'company':
        return '/profile/company';
      case 'trader':
        return '/profile/trader';
      default:
        return '/login';
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-green-600">AgroTech</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600">
              Home
            </Link>
            {!user ? (
              <>
                <Link href="/login" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600">
                  Login
                </Link>
                <div className="relative">
                  <button 
                    onClick={toggleDropdown} 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600"
                  >
                    Register
                  </button>
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 w-48 py-2 mt-2 bg-white rounded-md shadow-xl z-50 dropdown-menu">
                      <Link href="/register/farmer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50">
                        Register as Farmer
                      </Link>
                      <Link href="/register/company" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50">
                        Register as Company
                      </Link>
                      <Link href="/register/trader" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50">
                        Register as Trader
                      </Link>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link 
                  href={getDashboardLink()} 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600"
                >
                  Dashboard
                </Link>
                <Link 
                  href={getProfileLink()} 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}  // Logout handler
                  className="ml-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600"
                >
                  <Link href="/">Logout</Link>  {/* Redirects to home */}
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50"
            >
              Home
            </Link>
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  href="/register/farmer"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50"
                >
                  Register as Farmer
                </Link>
                <Link
                  href="/register/company"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50"
                >
                  Register as Company
                </Link>
                <Link
                  href="/register/trader"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50"
                >
                  Register as Trader
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={getDashboardLink()}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50"
                >
                  Dashboard
                </Link>
                <Link
                  href={getProfileLink()}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout} // Logout handler
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50"
                >
                  <Link href="/">Logout</Link>  {/* Redirect to home after logout */}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
