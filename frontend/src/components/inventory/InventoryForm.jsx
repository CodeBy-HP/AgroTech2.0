'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import MapPicker from './MapPicker';
import ImageUploader from './ImageUploader';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function InventoryForm({ inventory = null, onSuccess }) {
  const router = useRouter();
  const { token } = useAuth();
  const isEditing = !!inventory;
  
  const [formData, setFormData] = useState({
    location_name: inventory?.location_name || '',
    latitude: inventory?.latitude || null,
    longitude: inventory?.longitude || null,
    capacity: inventory?.capacity || '',
    govt_documentation: inventory?.govt_documentation || '',
  });
  
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Load existing images if in edit mode
  useEffect(() => {
    if (isEditing && inventory.image_url) {
      // Convert existing images to the format expected by ImageUploader
      const existingPreviews = inventory.images?.map(img => ({
        url: `${process.env.NEXT_PUBLIC_API_URL}${img.image_url}`,
        id: img.id,
        type: 'existing'
      })) || [];
      
      setPreviews(existingPreviews);
    }
  }, [isEditing, inventory]);
  
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
    
    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };
  
  const handleLocationSelect = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    
    // Clear validation errors
    if (validationErrors.latitude || validationErrors.longitude) {
      setValidationErrors((prev) => ({
        ...prev,
        latitude: null,
        longitude: null,
      }));
    }
  };
  
  const handleImagesChange = (newFiles, newPreviews) => {
    setFiles(newFiles);
    setPreviews(newPreviews);
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.location_name.trim()) {
      errors.location_name = 'Location name is required';
    }
    
    if (!formData.capacity || formData.capacity <= 0) {
      errors.capacity = 'Valid capacity is required';
    }
    
    if (!formData.latitude || !formData.longitude) {
      errors.location = 'Please select a location on the map';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create or update inventory
      let inventoryId;
      
      if (isEditing) {
        // Update existing inventory
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/api/inventories/${inventory.id}`,
          formData,
          { 
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        inventoryId = inventory.id;
        toast.success('Inventory updated successfully');
      } else {
        // Create new inventory
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/inventories/`,
          formData,
          { 
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        inventoryId = response.data.id;
        toast.success('Inventory created successfully');
      }
      
      // Upload new images if any
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('images', file);
        });
        
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/inventories/${inventoryId}/images/`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        toast.success('Images uploaded successfully');
      }
      
      // If onSuccess callback is provided, call it with the inventory ID
      if (onSuccess) {
        onSuccess(inventoryId);
      } else {
        // Otherwise, redirect to inventory detail page
        router.push(`/dashboard/trader/inventories/${inventoryId}`);
        router.refresh();
      }
      
    } catch (error) {
      console.error('Error saving inventory:', error);
      toast.error('Failed to save inventory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium mb-4">Basic Information</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="location_name" className="block text-sm font-medium text-gray-700 mb-1">
              Inventory Location Name *
            </label>
            <input
              type="text"
              id="location_name"
              name="location_name"
              value={formData.location_name}
              onChange={handleChange}
              placeholder="e.g., Main Warehouse - Nagpur"
              className={`w-full px-4 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                validationErrors.location_name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.location_name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.location_name}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Provide a descriptive name for this inventory location
            </p>
          </div>
          
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
              Storage Capacity (MT) *
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="0"
              step="0.1"
              placeholder="e.g., 500"
              className={`w-full px-4 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                validationErrors.capacity ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.capacity && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.capacity}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Maximum storage capacity in Metric Tons (MT)
            </p>
          </div>
          
          <div>
            <label htmlFor="govt_documentation" className="block text-sm font-medium text-gray-700 mb-1">
              Government Approval Documentation (Optional)
            </label>
            <input
              type="text"
              id="govt_documentation"
              name="govt_documentation"
              value={formData.govt_documentation}
              onChange={handleChange}
              placeholder="Enter documentation details or reference numbers"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Provide any government approval documentation details or reference numbers
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium mb-4">Inventory Location</h3>
        
        <div className="space-y-2">
          <MapPicker
            onLocationSelect={handleLocationSelect}
            initialLat={formData.latitude}
            initialLng={formData.longitude}
          />
          
          {validationErrors.location && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
          )}
          
          <div className="flex flex-wrap mt-2">
            <div className="w-1/2 pr-2">
              <div className="text-sm text-gray-600">Latitude: {formData.latitude || 'Not set'}</div>
            </div>
            <div className="w-1/2 pl-2">
              <div className="text-sm text-gray-600">Longitude: {formData.longitude || 'Not set'}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium mb-4">Images</h3>
        
        <ImageUploader
          previewImages={previews}
          onImagesChange={handleImagesChange}
        />
        
        <p className="mt-2 text-xs text-gray-500">
          Upload images of your inventory location. Maximum 5 images allowed.
        </p>
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          disabled={isLoading}
        >
          Cancel
        </button>
        
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          disabled={isLoading}
        >
          {isLoading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isEditing ? 'Update Inventory' : 'Create Inventory'}
        </button>
      </div>
    </form>
  );
} 