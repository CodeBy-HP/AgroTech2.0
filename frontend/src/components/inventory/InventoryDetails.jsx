'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Image from 'next/image';
import { FiEdit, FiTrash, FiPlus, FiMapPin, FiPackage } from 'react-icons/fi';
import CommodityList from './CommodityList';
import CommodityForm from './CommodityForm';

export default function InventoryDetails({ inventory, onUpdate, token }) {
  const router = useRouter();
  const inventoryId = inventory?.id;
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddCommodity, setShowAddCommodity] = useState(false);
  
  const handleDeleteInventory = async () => {
    if (!confirm('Are you sure you want to delete this inventory? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/inventories/${inventoryId}`,
        { 
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      toast.success('Inventory deleted successfully');
      router.push('/dashboard/trader/inventories');
      router.refresh();
      
    } catch (error) {
      console.error('Error deleting inventory:', error);
      toast.error('Failed to delete inventory. Please try again.');
      setIsDeleting(false);
    }
  };
  
  const handleCommodityAdded = () => {
    if (onUpdate) onUpdate();
    setShowAddCommodity(false);
    toast.success('Commodity added to inventory');
  };
  
  if (!inventory) {
    return (
      <div className="bg-gray-50 p-4 rounded-md text-center">
        <p className="text-gray-600">Inventory not found</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{inventory.location_name}</h1>
        
        <div className="flex space-x-3">
          <button
            onClick={() => router.push(`/dashboard/trader/inventories/${inventoryId}/edit`)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <FiEdit className="mr-2" />
            Edit
          </button>
          
          <button
            onClick={handleDeleteInventory}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className="flex items-center">
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                Deleting...
              </span>
            ) : (
              <>
                <FiTrash className="mr-2" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Inventory details */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Image section */}
          <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-gray-200">
            <div className="h-64 lg:h-full relative">
              {inventory.image_url ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}${inventory.image_url}`}
                  alt={inventory.location_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <FiPackage size={48} className="text-gray-400" />
                </div>
              )}
            </div>
          </div>
          
          {/* Details section */}
          <div className="lg:col-span-2 p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 flex items-start">
                  {inventory.latitude && inventory.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${inventory.latitude},${inventory.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-green-600 hover:text-green-800"
                    >
                      <FiMapPin className="mr-1" />
                      View on Map
                    </a>
                  ) : (
                    <span className="text-gray-700">Location not specified</span>
                  )}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Storage Capacity</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{inventory.capacity} MT</dd>
              </div>
              
              {inventory.govt_documentation && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Government Documentation</dt>
                  <dd className="mt-1 text-gray-900">{inventory.govt_documentation}</dd>
                </div>
              )}
              
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  {inventory.commodities && inventory.commodities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {inventory.commodities.length} Commodities
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {inventory.commodities.reduce((sum, c) => sum + c.quantity_available, 0).toFixed(2)} MT in stock
                      </span>
                    </div>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      Empty
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      
      {/* Commodities section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Commodities</h2>
          
          <button
            onClick={() => setShowAddCommodity(!showAddCommodity)}
            className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            {showAddCommodity ? (
              'Cancel'
            ) : (
              <>
                <FiPlus className="mr-1" />
                Add Commodity
              </>
            )}
          </button>
        </div>
        
        {/* Add commodity form */}
        {showAddCommodity && (
          <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-md">
            <h3 className="text-lg font-medium mb-4">Add New Commodity</h3>
            <CommodityForm
              inventoryId={inventoryId}
              onSuccess={handleCommodityAdded}
              token={token}
            />
          </div>
        )}
        
        {/* Commodities list */}
        <CommodityList
          inventoryId={inventoryId}
          commodities={inventory.commodities || []}
          onUpdate={onUpdate}
          token={token}
        />
      </div>
      
      {/* Additional images gallery */}
      {inventory.images && inventory.images.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Gallery</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {inventory.images.map((image) => (
              <div key={image.id} className="relative h-32 rounded-md overflow-hidden">
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}${image.image_url}`}
                  alt={`Inventory image ${image.id}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 