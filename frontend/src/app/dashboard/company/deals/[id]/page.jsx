'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  FiArrowLeft, 
  FiBox, 
  FiCalendar, 
  FiMapPin, 
  FiDollarSign, 
  FiTruck, 
  FiFileText,
  FiCheck,
  FiX,
  FiPhoneCall,
  FiMail
} from 'react-icons/fi';

export default function DealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params.id;
  const { user, token } = useAuth();
  
  const [deal, setDeal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!user || user.user_type !== 'company') {
      router.push('/unauthorized');
      return;
    }
    
    const fetchDealDetails = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/deals/${dealId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        setDeal(response.data);
      } catch (err) {
        console.error('Error fetching deal details:', err);
        setError('Failed to load deal details. Please try again.');
        toast.error('Failed to load deal details');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (dealId) {
      fetchDealDetails();
    }
  }, [dealId, token, user, router]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  const getStatusBadgeClass = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };
  
  const confirmDelivery = async () => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/deals/${dealId}/confirm-delivery`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      toast.success('Delivery confirmed successfully!');
      // Update deal status in the UI
      setDeal({ ...deal, status: 'completed' });
    } catch (err) {
      console.error('Error confirming delivery:', err);
      toast.error('Failed to confirm delivery');
    }
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
  
  if (error || !deal) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="flex items-center mb-6">
              <Link href="/dashboard/company/deals" legacyBehavior>
                <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                  <FiArrowLeft className="mr-2 -ml-1 h-5 w-5" />
                  Back to Deals
                </a>
              </Link>
            </div>
            <div className="text-center py-10">
              <FiX className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
              <p className="mt-1 text-sm text-gray-500">
                {error || "Deal not found. It may have been removed or you don't have access."}
              </p>
              <div className="mt-6">
                <Link href="/dashboard/company/deals" legacyBehavior>
                  <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    Return to Deals
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <Link href="/dashboard/company/deals" legacyBehavior>
            <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              <FiArrowLeft className="mr-2 -ml-1 h-5 w-5" />
              Back to Deals
            </a>
          </Link>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Deal Details
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {deal.commodity_type} - {deal.quantity} MT
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(deal.status)}`}>
              {deal.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiBox className="mr-2 h-5 w-5 text-gray-400" />
                  Commodity Type
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{deal.commodity_type}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiDollarSign className="mr-2 h-5 w-5 text-gray-400" />
                  Price
                </dt>
                <dd className="mt-1 text-sm text-gray-900">₹{deal.price_per_unit} per MT</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiFileText className="mr-2 h-5 w-5 text-gray-400" />
                  Quantity
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{deal.quantity} MT</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiDollarSign className="mr-2 h-5 w-5 text-gray-400" />
                  Total Value
                </dt>
                <dd className="mt-1 text-sm text-gray-900">₹{deal.price_per_unit * deal.quantity}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiMapPin className="mr-2 h-5 w-5 text-gray-400" />
                  Delivery Location
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{deal.delivery_location || 'Not specified'}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiCalendar className="mr-2 h-5 w-5 text-gray-400" />
                  Expected Delivery Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(deal.expected_delivery_date)}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiTruck className="mr-2 h-5 w-5 text-gray-400" />
                  Trader
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{deal.trader_name || 'Not specified'}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiCalendar className="mr-2 h-5 w-5 text-gray-400" />
                  Deal Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(deal.created_at)}</dd>
              </div>
              
              {deal.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">{deal.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        
        {/* Trader Contact Information */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Trader Contact Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Contact details for {deal.trader_name || 'the trader'}
            </p>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiMail className="mr-2 h-5 w-5 text-gray-400" />
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a href={`mailto:${deal.trader_email || ''}`} className="text-green-600 hover:text-green-500">
                    {deal.trader_email || 'Not available'}
                  </a>
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiPhoneCall className="mr-2 h-5 w-5 text-gray-400" />
                  Phone
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {deal.trader_phone ? (
                    <a href={`tel:${deal.trader_phone}`} className="text-green-600 hover:text-green-500">
                      {deal.trader_phone}
                    </a>
                  ) : 'Not available'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6 flex justify-end">
          {deal.status === 'delivered' && (
            <button
              type="button"
              onClick={confirmDelivery}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FiCheck className="mr-2 -ml-1 h-5 w-5" />
              Confirm Delivery
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 