'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFarm } from '@/context/FarmContext';
import Link from 'next/link';
import { formatDate, formatCurrency, formatFarmStatus } from '@/utils/formatters';
import ImageGallery from '@/components/farm/ImageGallery';

export default function TraderFarmDetailPage({ params }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { getFarmById, loading: farmLoading } = useFarm();
  const [farm, setFarm] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const paramValue = use(params);
  const farmId = paramValue.id;

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.user_type !== 'trader') {
        router.push('/unauthorized');
      } else {
        // Load farm data
        loadFarm();
      }
    }
  }, [user, authLoading, farmId]);

  const loadFarm = async () => {
    try {
      setIsLoading(true);
      const farmData = await getFarmById(farmId);
      
      // Check if farmData is null (error fetching)
      if (!farmData) {
        setError("Failed to load farm data. Please try again.");
        return;
      }
      
      setFarm(farmData);
    } catch (err) {
      setError("Failed to load farm data. Please try again.");
      console.error("Error loading farm:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="p-8 rounded-full bg-white shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (!user || user.user_type !== 'trader') {
    return null; // Don't render anything until redirect happens
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
        <div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-red-500">
          <div className="text-red-600 mb-6 flex items-center">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
          <Link 
            href="/dashboard/trader/farms" 
            className="inline-flex items-center px-4 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors duration-200"
          >
            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Return to Farms
          </Link>
        </div>
      </div>
    );
  }

  if (!farm) return null;

  // Function to get farm status color classes
  const getStatusClasses = (status) => {
    switch(status) {
      case 'harvested': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'growing': 
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default: 
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white shadow-md rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-5 sm:px-8 flex justify-between items-start relative">
            <div className="flex items-center">
              <Link 
                href="/dashboard/trader/farms" 
                className="mr-4 p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors duration-200"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                  {farm.crop_type || 'Farm Details'}
                  <span className={`ml-4 px-3 py-1 text-xs font-bold rounded-full ${getStatusClasses(farm.farm_status)}`}>
                    {formatFarmStatus(farm.farm_status)}
                  </span>
                </h1>
                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {farm.farm_location}
                </p>
              </div>
            </div>
            
            <Link
              href={`/dashboard/trader/farms/${farm.id}/bid`}
              className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Place Bid
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image gallery */}
            {farm.images && farm.images.length > 0 ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800">Farm Images</h2>
                </div>
                <div className="p-6">
                  <ImageGallery images={farm.images} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800">Farm Images</h2>
                </div>
                <div className="p-12 flex justify-center items-center bg-gray-50">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">No images available for this farm</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right column - Farm details */}
          <div className="space-y-8">
            {/* Farm details card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Farm Details</h2>
              </div>
              <div className="bg-white">
                <dl>
                  <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 hover:bg-green-50 transition-colors duration-200">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Farm Area
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900 sm:mt-0 sm:col-span-2">{farm.farm_area} hectares</dd>
                  </div>
                  
                  {farm.is_organic !== undefined && (
                    <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 bg-green-50 transition-colors duration-200">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Organic Farming
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900 sm:mt-0 sm:col-span-2">
                        {farm.is_organic ? 'Yes' : 'No'}
                      </dd>
                    </div>
                  )}
                  
                  {farm.expected_harvest_date && (
                    <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 hover:bg-green-50 transition-colors duration-200">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Expected Harvest
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900 sm:mt-0 sm:col-span-2">
                        {formatDate(farm.expected_harvest_date)}
                      </dd>
                    </div>
                  )}
                  
                  {farm.expected_quantity && (
                    <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 bg-green-50 transition-colors duration-200">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                        Expected Quantity
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900 sm:mt-0 sm:col-span-2">
                        {farm.expected_quantity} tons
                      </dd>
                    </div>
                  )}
                  
                  {farm.min_asking_price && (
                    <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 hover:bg-green-50 transition-colors duration-200">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Minimum Asking Price
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900 sm:mt-0 sm:col-span-2">
                        {formatCurrency(farm.min_asking_price)}
                      </dd>
                    </div>
                  )}
                  
                  {farm.pesticides_used && (
                    <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-8 bg-green-50 transition-colors duration-200">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Pesticides Used
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900 sm:mt-0 sm:col-span-2">
                        {farm.pesticides_used}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 