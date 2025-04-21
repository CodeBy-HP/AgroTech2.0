'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import InventoryList from '@/components/inventory/InventoryList';

export default function InventoriesPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [inventories, setInventories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && user && user.user_type === 'trader') {
      fetchInventories();
    }
  }, [authLoading, user]);

  const fetchInventories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/inventories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      setInventories(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventories:', err);
      setError('Failed to load inventories. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle loading state
  if (authLoading || isLoading) {
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
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your product inventories and commodities
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/trader/inventories/new')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Add New Inventory
          </button>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        <InventoryList 
          inventories={inventories} 
          onRefresh={fetchInventories} 
        />
      </div>
    </DashboardLayout>
  );
} 