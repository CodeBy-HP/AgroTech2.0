'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CommodityForm from '@/components/commodity/CommodityForm';

export default function EditCommodityPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [commodity, setCommodity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session && params.id && params.commodityId) {
      fetchCommodity();
    }
  }, [session, params.id, params.commodityId]);

  const fetchCommodity = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/inventories/${params.id}/commodities/${params.commodityId}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      setCommodity(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching commodity details:', err);
      setError('Failed to load commodity details. Please try again.');
      setLoading(false);
    }
  };

  // Handle loading state
  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen-minus-nav">
          <div className="loader" />
        </div>
      </DashboardLayout>
    );
  }

  // Handle unauthenticated state
  if (!session || session.user.userType !== 'trader') {
    router.push('/unauthorized');
    return null;
  }

  const handleSuccess = () => {
    router.push(`/dashboard/trader/inventories/${params.id}`);
  };

  const handleCancel = () => {
    router.push(`/dashboard/trader/inventories/${params.id}`);
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={() => router.push(`/dashboard/trader/inventories/${params.id}`)}
            className="text-indigo-600 hover:text-indigo-900 mb-2 inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Inventory
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Commodity</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update the details of this commodity.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          {commodity && (
            <CommodityForm 
              inventoryId={params.id}
              commodity={commodity}
              isEdit={true}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              setError={setError}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 