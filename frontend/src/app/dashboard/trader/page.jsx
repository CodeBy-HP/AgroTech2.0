'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFarm } from '@/context/FarmContext';
import Link from 'next/link';

export default function TraderDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { getFarms, getMyBids, loading: farmLoading } = useFarm();
  const [stats, setStats] = useState({
    availableFarms: 0,
    totalBids: 0,
    acceptedBids: 0,
    pendingBids: 0
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.user_type !== 'trader') {
        router.push('/unauthorized');
      } else {
        loadDashboardData();
      }
    }
  }, [user, authLoading, router]);

  const loadDashboardData = async () => {
    try {
      // Get available farms (harvested or growing)
      const farms = await getFarms();
      const availableFarms = farms.filter(farm => 
        farm.farm_status === 'growing' || farm.farm_status === 'harvested'
      ).length;
      
      // Get all bids placed by the trader
      const bids = await getMyBids();
      
      // Count bids by status
      const acceptedBids = bids.filter(bid => bid.status === 'accepted').length;
      const pendingBids = bids.filter(bid => bid.status === 'pending').length;
      
      setStats({
        availableFarms,
        totalBids: bids.length,
        acceptedBids,
        pendingBids
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user || user.user_type !== 'trader') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6 mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Welcome back, <span className="text-green-700">{user.full_name}</span>
              </h1>
              <p className="mt-2 text-gray-600">
                Here's what's happening with your trading activity today.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                href="/dashboard/trader/farms"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Browse Available Farms
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-green-100 transition-all hover:shadow hover:border-green-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Available Farms
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.availableFarms}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-green-50 px-5 py-2">
              <Link href="/dashboard/trader/farms" className="text-sm text-green-700 font-medium flex items-center">
                View details
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-green-100 transition-all hover:shadow hover:border-green-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Bids
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.totalBids}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 px-5 py-2">
              <Link href="/dashboard/trader/bids" className="text-sm text-blue-700 font-medium flex items-center">
                View details
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-green-100 transition-all hover:shadow hover:border-green-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Bids
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.pendingBids}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 px-5 py-2">
              <Link href="/dashboard/trader/bids?status=pending" className="text-sm text-yellow-700 font-medium flex items-center">
                View details
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-green-100 transition-all hover:shadow hover:border-green-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Accepted Bids
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.acceptedBids}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-green-50 px-5 py-2">
              <Link href="/dashboard/trader/bids?status=accepted" className="text-sm text-green-700 font-medium flex items-center">
                View details
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-green-100 mb-8">
          <div className="px-6 py-5 border-b border-green-100">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/dashboard/trader/farms" className="group block p-6 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 group-hover:bg-white p-3 rounded-lg transition-colors">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Browse Farms</h3>
                  <p className="mt-1 text-sm text-gray-600">Explore available farms and their produce</p>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/trader/bids" className="group block p-6 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 group-hover:bg-white p-3 rounded-lg transition-colors">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">My Bids</h3>
                  <p className="mt-1 text-sm text-gray-600">View and manage your bids</p>
                </div>
              </div>
            </Link>

            <Link href="/profile" className="group block p-6 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 group-hover:bg-white p-3 rounded-lg transition-colors">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Profile</h3>
                  <p className="mt-1 text-sm text-gray-600">Manage your account and settings</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 