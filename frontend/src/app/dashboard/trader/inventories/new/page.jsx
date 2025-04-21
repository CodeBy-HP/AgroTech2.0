'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import InventoryForm from '@/components/inventory/InventoryForm';

export default function NewInventoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Handle loading state
  if (loading) {
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add a new inventory to your portfolio
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <InventoryForm 
            onSuccess={(inventoryId) => {
              router.push(`/dashboard/trader/inventories/${inventoryId}`);
            }}
            onCancel={() => router.push('/dashboard/trader/inventories')}
          />
        </div>
      </div>
    </DashboardLayout>
  );
} 