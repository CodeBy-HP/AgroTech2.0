'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import FarmList from '@/components/farm/FarmList';

export default function TraderFarmsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.user_type !== 'trader') {
        router.push('/unauthorized');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="p-4 rounded-full bg-white shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (!user || user.user_type !== 'trader') {
    return null; // Don't render anything until redirect happens
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-8 pb-16">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-8 border-b border-green-100">
            <div className="flex items-center space-x-3 mb-2">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <h1 className="text-3xl font-bold text-gray-800">Browse Farms</h1>
            </div>
            <p className="text-gray-600 ml-11">
              Find farms with available produce and place bids on fresh harvests.
            </p>
          </div>

          <div className="p-6">
            <FarmList showFilters={true} />
          </div>
        </div>
      </div>
    </div>
  );
} 