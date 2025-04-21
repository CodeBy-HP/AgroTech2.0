'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { FiArrowLeft, FiCheckCircle, FiAlertCircle, FiClock, FiMapPin, FiDollarSign, FiPackage } from 'react-icons/fi';
import Spinner from '@/components/common/Spinner';

export default function RequirementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token, loading } = useAuth();
  
  const [requirement, setRequirement] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [application, setApplication] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.user_type !== 'trader') {
      router.push('/unauthorized');
      return;
    }
    
    fetchData();
  }, [user, token, router, loading, params.id]);
  
  const fetchData = async () => {
    try {
      setDataLoading(true);
      setError(null);
      
      // Fetch requirement details (backend now includes company)
      const reqResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/requirements/${params.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('Requirement data fetched:', reqResponse.data);
      
      // Directly set the requirement state with the response data
      // The RequirementResponse schema ensures the necessary fields (including nested company) are present
      setRequirement(reqResponse.data);
      
      // Check if trader has already applied (this part is fine)
      try {
        const appsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/applications/trader/`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        const existingApplication = appsResponse.data.find(app => 
          app.requirement_id === params.id || 
          (app.requirement && app.requirement.id === params.id)
        );
        
        if (existingApplication) {
          setHasApplied(true);
          setApplication(existingApplication);
        }
      } catch (err) {
        console.error('Error checking applications:', err);
        // Continue even if we can't check applications
      }
      
      setDataLoading(false);
    } catch (err) {
      console.error('Error fetching requirement details:', err);
      setError('Failed to load requirement details. Please try again.');
      setDataLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getStatusBadge = (status) => {
    if (!status) return null;
    
    const statusClasses = {
      'open': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800',
      'fulfilled': 'bg-blue-100 text-blue-800',
      'expired': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  if (loading || dataLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }
  
  if (error || !requirement) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/dashboard/trader/requirements" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
              <FiArrowLeft className="mr-2" /> Back to Requirements
            </Link>
          </div>
          
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error || 'Failed to load requirement details. The requirement may have been removed.'}
                </p>
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
        <div className="mb-6">
          <Link href="/dashboard/trader/requirements" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <FiArrowLeft className="mr-2" /> Back to Requirements
          </Link>
          
          <div className="mt-2 flex flex-wrap items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {requirement.commodity_type} Requirement
            </h1>
            <div className="flex items-center mt-2 sm:mt-0">
              {getStatusBadge(requirement.status)}
              <span className="ml-3 text-sm text-gray-500">
                Posted on {formatDate(requirement.created_at)}
              </span>
            </div>
          </div>
          
          <p className="mt-1 text-sm text-gray-500">
            Detailed view of the procurement requirement from {requirement.company ? requirement.company.company_name : 'a company'}
          </p>
        </div>
        
        {/* Requirement Details */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Requirement Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Complete specifications and details of the requirement.
            </p>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiPackage className="mr-2 h-5 w-5 text-gray-400" /> Commodity Type
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {requirement.commodity_type || 'Not specified'}
                </dd>
              </div>
              
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiPackage className="mr-2 h-5 w-5 text-gray-400" /> Company
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {requirement.company ? requirement.company.company_name : 'Not specified'}
                </dd>
              </div>
              
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiPackage className="mr-2 h-5 w-5 text-gray-400" /> Quantity
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {requirement.quantity || requirement.quantity_required ? 
                    `${requirement.quantity || requirement.quantity_required} MT` : 'Not specified'}
                </dd>
              </div>
              
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiDollarSign className="mr-2 h-5 w-5 text-gray-400" /> Budget Range
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {(requirement.budget_min || requirement.expected_price_min) &&
                   (requirement.budget_max || requirement.expected_price_max)
                    ? `₹${requirement.budget_min || requirement.expected_price_min} - 
                       ₹${requirement.budget_max || requirement.expected_price_max} per MT`
                    : 'Not specified'}
                </dd>
              </div>
              
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiMapPin className="mr-2 h-5 w-5 text-gray-400" /> Delivery Location
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {requirement.delivery_location || 'Not specified'}
                </dd>
              </div>
              
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiClock className="mr-2 h-5 w-5 text-gray-400" /> Delivery Window
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {requirement.delivery_window_start 
                    ? `${formatDate(requirement.delivery_window_start)} to ${formatDate(requirement.delivery_window_end || requirement.delivery_deadline)}`
                    : (requirement.delivery_deadline 
                        ? `By ${formatDate(requirement.delivery_deadline)}`
                        : 'Not specified')}
                </dd>
              </div>
              
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Quality Requirements</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {requirement.quality_requirements || 'No specific quality requirements provided'}
                </dd>
              </div>
              
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Additional Information</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {requirement.additional_info || requirement.description || 'No additional information provided'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 