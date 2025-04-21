'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function InventoryList({ inventories: initialInventories, onRefresh }) {
  const router = useRouter();
  const { token } = useAuth();
  const [inventories, setInventories] = useState(initialInventories || []);
  const [isLoading, setIsLoading] = useState(!initialInventories);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const fetchInventories = async () => {
    if (onRefresh) {
      // If parent component handles fetching, don't fetch again
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/inventories`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      setInventories(response.data);
    } catch (err) {
      console.error('Error fetching inventories:', err);
      setError('Failed to load inventories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (!initialInventories) {
      fetchInventories();
    }
  }, [initialInventories]);
  
  useEffect(() => {
    setInventories(initialInventories || []);
  }, [initialInventories]);
  
  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this inventory? This action cannot be undone.')) {
      return;
    }
    
    setDeletingId(id);
    
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/inventories/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      
      setInventories(inventories.filter(inventory => inventory.id !== id));
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting inventory:', err);
      setError('Failed to delete inventory. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={onRefresh || fetchInventories}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (inventories.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg text-center shadow-sm">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No inventories found</h3>
        <p className="text-gray-500 mb-6">You haven't added any inventory locations yet.</p>
        <Link
          href="/dashboard/trader/inventories/new"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Your First Inventory
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventories.map((inventory) => (
            <div
              key={inventory.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="relative h-40 bg-gray-200">
                {inventory.image_url ? (
                  <Image
                    src={inventory.image_url.startsWith('http') ? inventory.image_url : `${process.env.NEXT_PUBLIC_API_URL}${inventory.image_url}`}
                    alt={inventory.name || 'Inventory image'}
                    layout="fill"
                    objectFit="cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{inventory.name || inventory.location_name}</h3>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {inventory.location || 'No location set'}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium text-gray-900">{inventory.capacity || 'N/A'}</span> capacity
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/trader/inventories/${inventory.id}/edit`}
                      className="p-1 text-indigo-600 hover:text-indigo-900"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Link>
                    
                    <button
                      onClick={(e) => handleDelete(inventory.id, e)}
                      className="p-1 text-red-600 hover:text-red-900"
                      disabled={deletingId === inventory.id}
                    >
                      {deletingId === inventory.id ? (
                        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <Link 
                href={`/dashboard/trader/inventories/${inventory.id}`}
                className="block py-2 px-4 text-center text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 border-t flex items-center justify-center"
              >
                View Details
                <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 