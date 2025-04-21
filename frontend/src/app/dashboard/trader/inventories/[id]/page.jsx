'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import InventoryDetails from '@/components/inventory/InventoryDetails';
import CommodityList from '@/components/inventory/CommodityList';
import Link from 'next/link';

export default function InventoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token, loading: authLoading } = useAuth();
  const [inventory, setInventory] = useState(null);
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user && user.user_type === 'trader' && params.id) {
      fetchInventoryDetails();
    }
  }, [authLoading, user, params.id]);

  const fetchInventoryDetails = async () => {
    try {
      setLoading(true);
      // Fetch inventory details
      const inventoryResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/inventories/${params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      setInventory(inventoryResponse.data);
      
      // Fetch commodities in this inventory
      const commoditiesResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/inventories/${params.id}/commodities`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      setCommodities(commoditiesResponse.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch inventory details:', err);
      setError('Failed to load inventory details. Please try again later.');
      setLoading(false);
    }
  };

  // Handle loading state
  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen-minus-nav">
          <div className="loader" />
        </div>
      </DashboardLayout>
    );
  }

  // Handle unauthenticated state
  if (!user || user.user_type !== 'trader') {
    router.push('/unauthorized');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <button 
              onClick={() => router.push('/dashboard/trader/inventories')}
              className="text-green-600 hover:text-green-900 mb-2 inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Inventories
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {inventory?.name || inventory?.location_name || 'Inventory Details'}
            </h1>
          </div>
          <Link 
            href={`/dashboard/trader/inventories/${params.id}/commodities/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Add Commodity
          </Link>
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

        {inventory && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <InventoryDetails 
              inventory={inventory} 
              onUpdate={fetchInventoryDetails} 
              token={token}
            />
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Commodities</h2>
          {commodities.length > 0 ? (
            <CommodityList 
              commodities={commodities} 
              onUpdate={fetchInventoryDetails}
              inventoryId={params.id}
              token={token}
            />
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">No commodities found in this inventory.</p>
              <Link 
                href={`/dashboard/trader/inventories/${params.id}/commodities/new`}
                className="inline-flex items-center mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add Your First Commodity
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 