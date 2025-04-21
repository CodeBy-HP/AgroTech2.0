'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { FiBox, FiClock, FiCalendar, FiMapPin, FiDollarSign, FiTruck, FiChevronRight } from 'react-icons/fi';

export default function CompanyDealsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!user || user.user_type !== 'company') {
      router.push('/unauthorized');
      return;
    }
    
    const fetchDeals = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/deals`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        setDeals(response.data);
      } catch (err) {
        console.error('Error fetching deals:', err);
        setError('Failed to load deals. Please try again.');
        toast.error('Failed to load deals');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDeals();
  }, [token, user, router]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  const renderDealStatus = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100'}`}>
        {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </span>
    );
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:leading-9 sm:truncate">
              Your Deals
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link href="/dashboard/company/requirements" legacyBehavior>
              <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:border-green-700 focus:shadow-outline-green active:bg-green-700 transition ease-in-out duration-150">
                View Requirements
              </a>
            </Link>
            <Link href="/dashboard/company/requirements/new" legacyBehavior>
              <a className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:border-green-700 focus:shadow-outline-green active:bg-green-700 transition ease-in-out duration-150">
                Post New Requirement
              </a>
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm leading-5 font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm leading-5 text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {deals.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="text-center py-10">
              <FiBox className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No deals yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't made any deals yet. Post requirements to start receiving offers from traders.
              </p>
              <div className="mt-6">
                <Link href="/dashboard/company/requirements/new" legacyBehavior>
                  <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    Post a Requirement
                  </a>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {deals.map((deal) => (
                <li key={deal.id}>
                  <Link href={`/dashboard/company/deals/${deal.id}`} legacyBehavior>
                    <a className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-green-600 truncate">
                              {deal.commodity_type} - {deal.quantity} MT
                            </p>
                            <div className="ml-4">
                              {renderDealStatus(deal.status)}
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <FiChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <div className="flex items-center text-sm text-gray-500 mr-6">
                              <FiDollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <p>₹{deal.price_per_unit} per MT</p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 mr-6">
                              <FiTruck className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <p>{deal.trader_name || 'Trader'}</p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <FiMapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <p>{deal.delivery_location || 'Location not specified'}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <FiCalendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <p>
                              Expected delivery: {formatDate(deal.expected_delivery_date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 