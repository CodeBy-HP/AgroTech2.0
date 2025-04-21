'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { format } from 'date-fns';
import { FiEye, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function TraderApplicationsPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Don't redirect if still loading auth state
    if (loading) return;
    
    // If no user after loading completes, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Debug the user type
    console.log("TraderApplicationsPage - User:", user);
    console.log("TraderApplicationsPage - User type:", user.user_type);
    
    // Only check user type after loading is complete
    if (user.user_type !== 'trader') {
      console.log("Redirecting to unauthorized - user type is:", user.user_type);
      router.push('/unauthorized');
      return;
    }
    
    fetchApplications();
  }, [user, router, token, loading]);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/trader/applications`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setApplications(response.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get status badge color based on application status
  const getStatusBadgeColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <Link
            href="/dashboard/trader/requirements"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Find Requirements
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {applications.length === 0 && !isLoading && !error ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-500 mb-4">You haven't submitted any applications to requirements yet.</p>
            <Link
              href="/dashboard/trader/requirements"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Browse Available Requirements
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {applications.map((application) => (
                <li key={application.id}>
                  <Link
                    href={`/dashboard/trader/applications/${application.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600 truncate">
                            {application.requirement?.commodity?.name || 'Unknown Commodity'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            For {application.requirement?.company?.name || 'Unknown Company'}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(application.status)}`}>
                            {application.status}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            Price: ₹{application.price} per {application.requirement?.unit || 'unit'}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            Quantity: {application.requirement?.quantity || 0} {application.requirement?.unit || 'units'}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Applied: {format(new Date(application.created_at), 'MMM d, yyyy')}
                          </p>
                          <FiEye className="ml-2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
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