'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import InventoryForm from '@/components/inventory/InventoryForm';

export default function EditInventoryPage({ params }) {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const inventoryId = params.id;
  
  const [inventory, setInventory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/inventories/${inventoryId}`,
          { 
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setInventory(response.data);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setError('Failed to load inventory details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user && user.user_type === 'trader') {
      fetchInventory();
    } else if (!authLoading && (!user || user.user_type !== 'trader')) {
      router.push('/unauthorized');
    }
  }, [inventoryId, user, authLoading, token, router]);

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

  // Handle error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-red-50 p-4 rounded-md text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!inventory) {
    return (
      <DashboardLayout>
        <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-gray-50 p-4 rounded-md text-center">
            <p className="text-gray-600">Inventory not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update information for inventory: {inventory.location_name}
          </p>
        </div>
        
        <InventoryForm inventory={inventory} />
      </div>
    </DashboardLayout>
  );
} 