'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function TraderDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [traderData, setTraderData] = useState(null);

  useEffect(() => {
    // Redirect to login if user is not logged in
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.user_type !== 'trader') {
        // Redirect to unauthorized if user is not a trader
        router.push('/unauthorized');
      } else {
        setTraderData(user);
      }
    }
  }, [loading, user, router]);

  if (loading || !traderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-medium text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Trader Dashboard</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome, {traderData.full_name}</h2>
            <p className="text-gray-600">This is your trader dashboard. Here you can manage your commodities and connect with farmers and companies.</p>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Performance Metrics
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Overview of your trading activity
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-5">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800">Total Transactions</p>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Pending Deals</p>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-indigo-800">Volume Traded (Tons)</p>
                <p className="text-2xl font-bold text-indigo-600">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Commodities You Deal In
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Based on your profile information
              </p>
            </div>
            <div className="px-4 py-5">
              <div className="flex flex-wrap gap-2">
                {traderData.profile?.commodities_dealt?.map((commodity) => (
                  <span 
                    key={commodity} 
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 capitalize"
                  >
                    {commodity}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Market Trends
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Updates from agricultural markets
              </p>
            </div>
            <div className="px-4 py-5">
              <p className="text-gray-500 italic">No market data available yet. Check back soon!</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 