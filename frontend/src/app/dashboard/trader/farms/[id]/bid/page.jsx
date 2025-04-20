'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import BidForm from '@/components/bid/BidForm';

export default function PlaceBidPage({ params }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const paramValue = use(params);
  const farmId = paramValue.id;

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-green-50">
        <div className="p-8 rounded-full bg-white shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (!user || user.user_type !== 'trader') {
    return null; // Don't render anything until redirect happens
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-green-50 py-12">
      <div className="max-w-3xl mx-auto rounded-xl overflow-hidden shadow-lg bg-white">
        <div className="px-6 py-6 bg-gradient-to-r from-green-400 to-green-600 flex items-center">
          <Link 
            href={`/dashboard/trader/farms/${farmId}`} 
            className="mr-4 flex items-center justify-center"
          >
            <div className="bg-white p-2 rounded-lg shadow-md hover:bg-green-50 transition-colors duration-200">
              <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white drop-shadow">Place a Bid</h1>
        </div>

        <div className="px-8 py-8">
          <div className="bg-green-50 p-4 rounded-lg mb-6 border-l-4 border-green-400">
            <p className="text-green-700">Submit your bid details below. Make sure to review all information before submitting.</p>
          </div>
          
          <div className="mt-6">
            <BidForm farmId={farmId} />
          </div>
        </div>
      </div>
    </div>
  );
} 