'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { FiChevronLeft } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

import RequirementForm from '@/components/requirements/RequirementForm';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function NewRequirementPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [commodities, setCommodities] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch commodities when component mounts
  useEffect(() => {
    // Don't redirect if still loading auth state
    if (loading) return;
    
    // If no user after loading completes, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Log user info for debugging
    console.log("User type:", user.user_type);
    
    // Only check user type after loading is complete
    if (user.user_type !== 'company') {
      console.log("Redirecting to unauthorized - user type is:", user.user_type);
      router.push('/unauthorized');
      return;
    }
    
    fetchCommodities();
  }, [user, router, token, loading]);

  const fetchCommodities = async () => {
    try {
      // Add token validation check
      if (!token) {
        console.error('No auth token available');
        setError('Authentication error. Please try logging in again.');
        setIsLoading(false);
        return;
      }
      
      console.log('Using token for fetchCommodities (first 10 chars):', token.substring(0, 10));
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/commodities`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setCommodities(response.data);
    } catch (err) {
      console.error('Error fetching commodities:', err);
      setError('Failed to load commodities. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError('');

    try {
      // Add token validation check
      if (!token) {
        console.error('No auth token available for form submission');
        setError('Authentication error. Please try logging in again.');
        setIsSubmitting(false);
        return;
      }

      console.log('Using token for submission (first 10 chars):', token.substring(0, 10));
      console.log('Submitting form data:', formData);
      
      // Ensure there's no Authorization header issue
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('Request headers:', headers);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/requirements/`,
        formData,
        { headers }
      );
      
      console.log('Requirement created successfully:', response.data);
      
      // Navigate back to requirements page after successful creation
      router.push('/dashboard/company/requirements');
    } catch (err) {
      console.error('Error creating requirement:', err);
      if (err.response) {
        console.error('Error response status:', err.response.status);
        console.error('Error response data:', err.response.data);
        
        if (err.response.status === 401) {
          setError('Authentication failed. Please log out and log in again.');
          // Force logout and redirect to login page after a delay
          setTimeout(() => {
            localStorage.removeItem('token');
            router.push('/login');
          }, 3000);
        } else {
          setError(`Failed to create requirement: ${err.response.data.detail || 'Please check your inputs and try again.'}`);
        }
      } else {
        setError('Failed to create requirement. Please check your connection and try again.');
      }
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/company/requirements');
  };

  // Show loading state while auth is loading or while fetching data
  if (loading || (isLoading && user)) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center mb-6">
          <Link href="/dashboard/company/requirements" className="text-green-600 hover:text-green-800 flex items-center">
            <FiChevronLeft className="mr-1" /> Back to Requirements
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Requirement</h1>
        <p className="text-gray-500 mb-6">Add details about your procurement requirement below.</p>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <RequirementForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          commodities={commodities}
        />
      </div>
    </DashboardLayout>
  );
} 