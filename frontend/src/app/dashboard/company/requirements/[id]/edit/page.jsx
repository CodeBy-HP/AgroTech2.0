'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import RequirementForm from '@/components/requirements/RequirementForm';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function EditRequirementPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, token, loading: authLoading } = useAuth();
  
  const [requirement, setRequirement] = useState(null);
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !token) {
      router.push('/login');
      return;
    }

    if (!authLoading && token && user) {
      if (user.user_type !== 'company') {
        router.push('/unauthorized');
        return;
      }
      fetchRequirementData();
      fetchCommodities();
    }
  }, [authLoading, token, user, id, router]);

  const fetchRequirementData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/requirements/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Format dates to match the format expected by the form
      const requirement = response.data;
      
      // Map API fields to form field names if needed
      const formattedRequirement = {
        id: requirement.id,
        commodity_type: requirement.commodity_type,
        quantity_required: requirement.quantity_required,
        unit: 'MT', // Assuming MT is always the unit
        expected_price_min: requirement.expected_price_min,
        expected_price_max: requirement.expected_price_max,
        quality_requirements: requirement.quality_requirements,
        delivery_location: requirement.delivery_location,
        description: requirement.description,
        requirement_type: requirement.requirement_type || 'current',
      };

      // Handle date formatting
      if (requirement.delivery_window_start) {
        formattedRequirement.delivery_window_start = new Date(requirement.delivery_window_start).toISOString().split('T')[0];
      }
      
      if (requirement.delivery_window_end) {
        formattedRequirement.delivery_window_end = new Date(requirement.delivery_window_end).toISOString().split('T')[0];
      }
      
      setRequirement(formattedRequirement);
    } catch (err) {
      console.error('Error fetching requirement:', err);
      setError('Failed to load requirement data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommodities = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/commodities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCommodities(response.data);
    } catch (err) {
      console.error('Error fetching commodities:', err);
      // Continue without commodities list
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError(null);
      
      // Prepare data for API
      const apiData = {
        commodity_type: formData.commodity_type,
        quantity_required: formData.quantity_required,
        expected_price_min: formData.expected_price_min,
        expected_price_max: formData.expected_price_max,
        quality_requirements: formData.quality_requirements,
        delivery_location: formData.delivery_location,
        delivery_window_start: formData.delivery_window_start,
        delivery_window_end: formData.delivery_window_end,
        description: formData.description,
        requirement_type: formData.requirement_type
      };
      
      // Use PATCH instead of PUT to match other API calls in the application
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/requirements/${id}`, 
        apiData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      router.push(`/dashboard/company/requirements/${id}`);
    } catch (err) {
      console.error('Error updating requirement:', err);
      setError(err.response?.data?.detail || 'Failed to update requirement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !requirement) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <Link href="/dashboard/company/requirements" className="inline-flex items-center text-sm font-medium text-red-700 hover:text-red-600">
                    <FiArrowLeft className="mr-2 h-5 w-5" />
                    Back to Requirements
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href={`/dashboard/company/requirements/${id}`} className="text-sm text-gray-600 flex items-center hover:text-gray-900">
            <FiArrowLeft className="mr-2" /> Back to Requirement
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Requirement</h1>
          <p className="mt-1 text-sm text-gray-500">Update the details of your commodity requirement.</p>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {requirement && (
          <RequirementForm
            initialData={requirement}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isSubmitting={submitting}
            commodities={commodities}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 