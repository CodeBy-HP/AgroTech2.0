'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';

export default function CommodityForm({ 
  inventoryId, 
  commodity = null,
  onSuccess = null,
  onCancel = null,
  setError = null,
  token = null
}) {
  const router = useRouter();
  const isEditing = !!commodity;
  
  const [formData, setFormData] = useState({
    name: commodity?.name || '',
    quantity_available: commodity?.quantity_available || '',
    price_per_unit: commodity?.price_per_unit || '',
    harvested_date: commodity?.harvested_date ? new Date(commodity.harvested_date).toISOString().split('T')[0] : '',
    testing_score: commodity?.testing_score || '',
    tested_by_platform: commodity?.tested_by_platform || false,
    additional_info: commodity?.additional_info || '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseFloat(value) : 
              value,
    }));
    
    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Commodity name is required';
    }
    
    if (!formData.quantity_available || formData.quantity_available <= 0) {
      errors.quantity_available = 'Valid quantity is required';
    }
    
    if (!formData.price_per_unit || formData.price_per_unit <= 0) {
      errors.price_per_unit = 'Valid price is required';
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
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Create or update commodity
      if (isEditing) {
        // Update existing commodity
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/api/commodities/${commodity.id}`,
          formData,
          { 
            headers 
          }
        );
        toast.success('Commodity updated successfully');
      } else {
        // Create new commodity
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/inventories/${inventoryId}/commodities/`,
          formData,
          { 
            headers
          }
        );
        toast.success('Commodity added successfully');
        
        // Reset form for adding another commodity
        setFormData({
          name: '',
          quantity_available: '',
          price_per_unit: '',
          harvested_date: '',
          testing_score: '',
          tested_by_platform: false,
          additional_info: '',
        });
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // If in edit mode and no callback, go back to inventory
      if (isEditing && !onSuccess) {
        router.push(`/trader/inventories/${inventoryId}`);
        router.refresh();
      }
      
    } catch (error) {
      console.error('Error saving commodity:', error);
      toast.error('Failed to save commodity. Please try again.');
      
      if (setError) {
        setError('Failed to save commodity. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Commodity Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Wheat, Turmeric"
            className={`w-full px-4 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
              validationErrors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="harvested_date" className="block text-sm font-medium text-gray-700 mb-1">
            Harvested Date (Optional)
          </label>
          <input
            type="date"
            id="harvested_date"
            name="harvested_date"
            value={formData.harvested_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          />
        </div>
        
        <div>
          <label htmlFor="quantity_available" className="block text-sm font-medium text-gray-700 mb-1">
            Quantity Available (MT) *
          </label>
          <input
            type="number"
            id="quantity_available"
            name="quantity_available"
            value={formData.quantity_available}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="e.g., 100"
            className={`w-full px-4 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
              validationErrors.quantity_available ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.quantity_available && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.quantity_available}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="price_per_unit" className="block text-sm font-medium text-gray-700 mb-1">
            Price per MT/Unit (₹) *
          </label>
          <input
            type="number"
            id="price_per_unit"
            name="price_per_unit"
            value={formData.price_per_unit}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="e.g., 2500"
            className={`w-full px-4 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
              validationErrors.price_per_unit ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.price_per_unit && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.price_per_unit}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="testing_score" className="block text-sm font-medium text-gray-700 mb-1">
            Testing Score (Optional)
          </label>
          <input
            type="number"
            id="testing_score"
            name="testing_score"
            value={formData.testing_score}
            onChange={handleChange}
            min="0"
            max="100"
            step="0.1"
            placeholder="e.g., 87.5"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Quality score out of 100 (if available)
          </p>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="tested_by_platform"
            name="tested_by_platform"
            checked={formData.tested_by_platform}
            onChange={handleChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="tested_by_platform" className="ml-2 block text-sm text-gray-700">
            Tested and verified by platform
          </label>
        </div>
      </div>
      
      <div>
        <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Information (Optional)
        </label>
        <textarea
          id="additional_info"
          name="additional_info"
          rows="3"
          value={formData.additional_info}
          onChange={handleChange}
          placeholder="Additional details like moisture level, quality details, etc."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
        ></textarea>
      </div>
      
      <div className="flex justify-end space-x-4">
        {isEditing && (
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
        
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isEditing ? 'Updating...' : 'Adding...'}
            </span>
          ) : (
            <span>{isEditing ? 'Update Commodity' : 'Add Commodity'}</span>
          )}
        </button>
      </div>
    </form>
  );
} 