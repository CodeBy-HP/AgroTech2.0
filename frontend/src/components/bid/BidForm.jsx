'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '@/context/FarmContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatters';

export default function BidForm({ farmId }) {
  const router = useRouter();
  const { getFarmById, createBid, loading } = useFarm();
  const { user, token } = useAuth();
  const [farm, setFarm] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated or not a trader
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.user_type !== 'trader') {
      router.push('/unauthorized');
    } else {
      loadFarm();
    }
  }, [user, farmId, router]);

  const loadFarm = async () => {
    if (!farmId || !token) return;
    
    try {
      setIsLoading(true);
      const farmData = await getFarmById(farmId);
      setFarm(farmData);
      
      // Set min bid amount based on farm's min asking price if available
      if (farmData.min_asking_price) {
        setBidAmount(farmData.min_asking_price);
      }
    } catch (err) {
      setError("Failed to load farm data. Please try again.");
      console.error("Error loading farm:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !token) {
      setError('You must be logged in to place a bid');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      
      if (!bidAmount || bidAmount <= 0) {
        setError('Please enter a valid bid amount');
        return;
      }
      
      // Create bid
      const bidData = {
        farm_id: farmId,
        bid_amount: parseFloat(bidAmount)
      };
      
      await createBid(bidData);
      
      setSuccess('Your bid has been placed successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/dashboard/trader/farms/${farmId}`);
      }, 2000);
      
    } catch (err) {
      if (err.message === 'Not authenticated') {
        setError('Session expired. Please log in again');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        const errorMsg = err.message || 'Failed to place bid. Please try again.';
        setError(errorMsg);
      }
    }
  };

  // If not logged in or not a trader, show a message
  if (!user || user.user_type !== 'trader') {
    return (
      <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-xl shadow-lg border border-green-100">
        <div className="text-red-600 font-medium text-center p-4 bg-red-50 rounded-lg">
          {!user ? 'Not authenticated. Please log in.' : 'You must be a trader to access this feature.'}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-xl shadow-lg">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-xl shadow-lg">
        <div className="text-red-600 font-medium text-center p-4 bg-red-50 rounded-lg">
          Farm not found or you don't have access to view this farm.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-xl shadow-lg border border-green-100">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-green-800">
            Place a Bid
          </h2>
          <div className="py-1 px-3 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            {farm.crop_type}
          </div>
        </div>
        
        <div className="mt-2 pb-4 border-b border-green-100">
          <p className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            {farm.farm_location}
          </p>
        </div>
        
        {farm.min_asking_price && (
          <div className="mt-6 flex items-center justify-between bg-green-50 p-4 rounded-lg">
            <span className="text-gray-700">Minimum asking price</span>
            <div className="text-xl font-bold text-green-700">
              {formatCurrency(farm.min_asking_price)}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-6 p-4 text-red-700 bg-red-50 rounded-lg border-l-4 border-red-600 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 text-green-700 bg-green-50 rounded-lg border-l-4 border-green-600 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <label htmlFor="bid_amount" className="block text-sm font-medium text-gray-700">
            Your Bid Amount (₹)
          </label>
          <div className="mt-2 relative rounded-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-green-600 font-medium">₹</span>
            </div>
            <input
              type="number"
              id="bid_amount"
              min="0"
              step="0.01"
              value={bidAmount}
              onChange={e => setBidAmount(e.target.value)}
              className="pl-8 block w-full py-3 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-lg text-gray-900 font-medium"
              placeholder="0.00"
              required
            />
          </div>
          <p className="mt-2 text-sm text-gray-500 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Enter your bid amount in Indian Rupees (₹)
          </p>
        </div>
        
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/trader/farms/${farmId}`)}
            className="mr-4 px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ${
              loading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Placing Bid...
              </span>
            ) : 'Place Bid'}
          </button>
        </div>
      </form>
    </div>
  );
}