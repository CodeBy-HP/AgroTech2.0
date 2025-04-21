'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFarm } from '@/context/FarmContext';
import Link from 'next/link';
import { formatDate, formatCurrency, formatFarmStatus } from '@/utils/formatters';
import ImageGallery from '@/components/farm/ImageGallery';

export default function FarmDetailPage({ params }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { getFarmById, deleteFarm, loading: farmLoading } = useFarm();
  const [farm, setFarm] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Use the React.use() to unwrap params
  const paramValue = use(params);
  const farmId = paramValue.id;

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.user_type !== 'farmer') {
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
      
      // Make the farm data available
      setFarm(farmData);
    } catch (err) {
      setError("Failed to load farm data. Please try again.");
      console.error("Error loading farm:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteFarm(farmId);
      router.push('/dashboard/farmer/farms');
    } catch (err) {
      setError("Failed to delete farm. Please try again.");
      console.error("Error deleting farm:", err);
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-50 via-emerald-50 to-green-50">
        <div className="flex flex-col items-center bg-white p-8 rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-600"></div>
          <p className="mt-4 text-emerald-700 font-medium">Loading farm details...</p>
        </div>
      </div>
    );
  }

  if (!user || user.user_type !== 'farmer') {
    return null; // Don't render anything until redirect happens
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-red-100">
            <div className="flex items-center text-red-600 mb-4">
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
            <Link 
              href="/dashboard/farmer/farms" 
              className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors duration-200"
            >
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Return to My Farms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!farm) return null;

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-emerald-100 mb-6">
          <div className="px-6 py-5 sm:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-emerald-100">
            <div className="flex items-center mb-4 sm:mb-0">
              <Link 
                href="/dashboard/farmer/farms" 
                className="mr-4 text-emerald-600 hover:text-emerald-800 transition-colors duration-200 flex items-center group"
              >
                <div className="bg-emerald-50 p-2 rounded-full shadow-sm group-hover:shadow-md transition-all">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
              <div>
                <div className="flex items-center">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {farm.crop_type || 'Farm Details'}
                  </h1>
                  <span className={`ml-3 px-3 py-1 text-xs font-semibold rounded-full ${
                    farm.farm_status === 'harvested' ? 'bg-green-100 text-green-800' :
                    farm.farm_status === 'growing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {formatFarmStatus(farm.farm_status)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 flex items-center">
                  <svg className="h-4 w-4 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {farm.farm_location}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3 w-full sm:w-auto">
              {farm.farmer_username === user.username && (
                <>
                  <Link
                    href={`/dashboard/farmer/farms/${farm.id}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-emerald-300 shadow-sm text-sm font-medium rounded-lg text-emerald-700 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                  >
                    <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                  
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                    >
                      <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2 bg-red-50 p-3 rounded-lg border border-red-100">
                      <svg className="h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-sm text-red-800 font-medium">Are you sure?</span>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Farm Images */}
          {farm.images && farm.images.length > 0 ? (
            <div className="px-6 py-5 sm:px-8 border-b border-emerald-100">
              <div className="flex items-center mb-4">
                <svg className="h-5 w-5 text-emerald-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Farm Images</h3>
              </div>
              <ImageGallery images={farm.images} />
            </div>
          ) : (
            <div className="px-6 py-5 sm:px-8 border-b border-emerald-100">
              <div className="flex items-center mb-4">
                <svg className="h-5 w-5 text-emerald-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Farm Images</h3>
              </div>
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path 
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No images uploaded for this farm</p>
              </div>
            </div>
          )}

          {/* Farm Information Section */}
          <div className="px-6 py-5 sm:px-8">
            <div className="flex items-center mb-4">
              <svg className="h-5 w-5 text-emerald-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">Farm Information</h3>
            </div>
            <p className="mt-1 mb-4 max-w-2xl text-sm text-gray-500">Details and specifications of your farm.</p>
            
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl overflow-hidden shadow-sm border border-emerald-100">
              <dl>
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-emerald-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <svg className="h-4 w-4 text-emerald-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      farm.farm_status === 'harvested' ? 'bg-green-100 text-green-800' :
                      farm.farm_status === 'growing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formatFarmStatus(farm.farm_status)}
                    </span>
                  </dd>
                </div>
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-emerald-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <svg className="h-4 w-4 text-emerald-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Farm Area
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-medium">{farm.farm_area} hectares</dd>
                </div>
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-emerald-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <svg className="h-4 w-4 text-emerald-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2M6 5a2 2 0 11-4 0 2 2 0 014 0zM18 5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Farming Type
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      farm.is_organic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {farm.is_organic ? 'Organic' : 'Conventional'}
                    </span>
                  </dd>
                </div>
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-emerald-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <svg className="h-4 w-4 text-emerald-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Expected Harvest Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-medium">
                    {formatDate(farm.expected_harvest_date)}
                  </dd>
                </div>
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-emerald-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <svg className="h-4 w-4 text-emerald-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2M6 5a2 2 0 11-4 0 2 2 0 014 0zM18 5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Expected Quantity
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-medium">
                    {farm.expected_quantity ? `${farm.expected_quantity} tons` : 'Not specified'}
                  </dd>
                </div>
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-emerald-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <svg className="h-4 w-4 text-emerald-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Minimum Asking Price
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-medium">
                    {farm.min_asking_price ? formatCurrency(farm.min_asking_price) : 'Not specified'}
                  </dd>
                </div>
                {farm.pesticides_used && (
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-emerald-100">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <svg className="h-4 w-4 text-emerald-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      Pesticides/Fertilizers
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{farm.pesticides_used}</dd>
                  </div>
                )}
                {farm.latitude && farm.longitude && (
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <svg className="h-4 w-4 text-emerald-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Geolocation
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="flex flex-wrap items-center">
                        <span className="bg-gray-100 rounded-lg px-3 py-1 mr-2 mb-2">Latitude: {farm.latitude}</span>
                        <span className="bg-gray-100 rounded-lg px-3 py-1 mb-2">Longitude: {farm.longitude}</span>
                      </div>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}