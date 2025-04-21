'use client';

import { useState, useEffect } from 'react';
import { FiInfo } from 'react-icons/fi';

export default function RequirementForm({ 
  initialData = {}, 
  onSubmit,
  onCancel,
  isSubmitting,
  commodities = []
}) {
  const [formData, setFormData] = useState({
    commodity_type: '',
    quantity_required: '',
    unit: 'MT',
    expected_price_min: '',
    expected_price_max: '',
    quality_requirements: '',
    delivery_location: '',
    delivery_window_start: '',
    delivery_window_end: '',
    requirement_type: 'current',
    description: '',
    ...initialData
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Format delivery dates for form input if editing
  useEffect(() => {
    if (initialData.delivery_window_start) {
      // Convert to YYYY-MM-DD format for date input
      const startDate = new Date(initialData.delivery_window_start);
      const formattedStartDate = startDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, delivery_window_start: formattedStartDate }));
    }
    if (initialData.delivery_window_end) {
      // Convert to YYYY-MM-DD format for date input
      const endDate = new Date(initialData.delivery_window_end);
      const formattedEndDate = endDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, delivery_window_end: formattedEndDate }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.commodity_type) 
      errors.commodity_type = 'Please enter a commodity type';
    
    if (!formData.quantity_required) 
      errors.quantity_required = 'Quantity is required';
    else if (isNaN(formData.quantity_required) || Number(formData.quantity_required) <= 0) 
      errors.quantity_required = 'Quantity must be a positive number';
    
    if (!formData.expected_price_min) 
      errors.expected_price_min = 'Minimum price is required';
    else if (isNaN(formData.expected_price_min) || Number(formData.expected_price_min) < 0) 
      errors.expected_price_min = 'Minimum price must be a non-negative number';
    
    if (!formData.expected_price_max) 
      errors.expected_price_max = 'Maximum price is required';
    else if (isNaN(formData.expected_price_max) || Number(formData.expected_price_max) <= 0) 
      errors.expected_price_max = 'Maximum price must be a positive number';
    
    if (formData.expected_price_min && formData.expected_price_max && 
        Number(formData.expected_price_min) > Number(formData.expected_price_max)) 
      errors.expected_price_max = 'Maximum price must be greater than minimum price';
    
    if (!formData.delivery_location) 
      errors.delivery_location = 'Delivery location is required';
    
    if (!formData.delivery_window_start) 
      errors.delivery_window_start = 'Delivery start date is required';
    else {
      const startDate = new Date(formData.delivery_window_start);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) 
        errors.delivery_window_start = 'Start date must be in the future';
    }
    
    if (!formData.delivery_window_end) 
      errors.delivery_window_end = 'Delivery end date is required';
    else {
      const endDate = new Date(formData.delivery_window_end);
      const startDate = new Date(formData.delivery_window_start);
      
      if (formData.delivery_window_start && endDate < startDate) 
        errors.delivery_window_end = 'End date must be after start date';
    }
    
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    // Convert numeric strings to numbers for submission
    const submissionData = {
      ...formData,
      quantity_required: Number(formData.quantity_required),
      expected_price_min: Number(formData.expected_price_min),
      expected_price_max: Number(formData.expected_price_max),
      delivery_window_start: formData.delivery_window_start,
      delivery_window_end: formData.delivery_window_end
    };
    
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="commodity_type" className="block text-sm font-medium text-gray-700">
            Commodity Type *
          </label>
          <div className="mt-1">
            <select
              id="commodity_type"
              name="commodity_type"
              value={formData.commodity_type}
              onChange={handleChange}
              className={`shadow-sm ${validationErrors.commodity_type ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} block w-full sm:text-sm rounded-md`}
              required
            >
              <option value="">Select a commodity</option>
              {commodities.map(commodity => (
                <option key={commodity.id} value={commodity.name}>
                  {commodity.name}
                </option>
              ))}
            </select>
            {validationErrors.commodity_type && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.commodity_type}</p>
            )}
          </div>
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="quantity_required" className="block text-sm font-medium text-gray-700">
            Quantity *
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              name="quantity_required"
              id="quantity_required"
              value={formData.quantity_required}
              onChange={handleChange}
              min="0.1"
              step="0.1"
              className={`${validationErrors.quantity_required ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} flex-1 block w-full rounded-none rounded-l-md sm:text-sm`}
              placeholder="e.g. 100"
              required
            />
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
            >
              <option value="MT">MT</option>
              <option value="KG">KG</option>
              <option value="Ton">Ton</option>
            </select>
          </div>
          {validationErrors.quantity_required && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.quantity_required}</p>
          )}
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="expected_price_min" className="block text-sm font-medium text-gray-700">
            Minimum Price (₹ per {formData.unit}) *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input
              type="number"
              name="expected_price_min"
              id="expected_price_min"
              value={formData.expected_price_min}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`${validationErrors.expected_price_min ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} block w-full pl-7 pr-12 sm:text-sm rounded-md`}
              placeholder="0.00"
              required
            />
          </div>
          {validationErrors.expected_price_min && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.expected_price_min}</p>
          )}
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="expected_price_max" className="block text-sm font-medium text-gray-700">
            Maximum Price (₹ per {formData.unit}) *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input
              type="number"
              name="expected_price_max"
              id="expected_price_max"
              value={formData.expected_price_max}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`${validationErrors.expected_price_max ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} block w-full pl-7 pr-12 sm:text-sm rounded-md`}
              placeholder="0.00"
              required
            />
          </div>
          {validationErrors.expected_price_max && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.expected_price_max}</p>
          )}
        </div>
        
        <div className="sm:col-span-6">
          <label htmlFor="quality_requirements" className="block text-sm font-medium text-gray-700">
            Quality Requirements
          </label>
          <div className="mt-1">
            <textarea
              id="quality_requirements"
              name="quality_requirements"
              rows="3"
              value={formData.quality_requirements}
              onChange={handleChange}
              className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Describe the quality standards required (e.g. moisture content, grade, organic certification)"
            ></textarea>
          </div>
          <p className="mt-1 text-xs text-gray-500 flex items-center">
            <FiInfo className="mr-1" /> Detailed quality requirements help traders provide better offers
          </p>
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="delivery_location" className="block text-sm font-medium text-gray-700">
            Delivery Location *
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="delivery_location"
              id="delivery_location"
              value={formData.delivery_location}
              onChange={handleChange}
              className={`${validationErrors.delivery_location ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} shadow-sm block w-full sm:text-sm rounded-md`}
              placeholder="e.g. Mumbai, Maharashtra"
              required
            />
          </div>
          {validationErrors.delivery_location && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.delivery_location}</p>
          )}
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="requirement_type" className="block text-sm font-medium text-gray-700">
            Requirement Type *
          </label>
          <div className="mt-1">
            <select
              id="requirement_type"
              name="requirement_type"
              value={formData.requirement_type}
              onChange={handleChange}
              className="shadow-sm border-gray-300 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm rounded-md"
              required
            >
              <option value="current">Current (Immediate need)</option>
              <option value="future">Future (Planned purchase)</option>
            </select>
          </div>
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="delivery_window_start" className="block text-sm font-medium text-gray-700">
            Delivery Start Date *
          </label>
          <div className="mt-1">
            <input
              type="date"
              name="delivery_window_start"
              id="delivery_window_start"
              value={formData.delivery_window_start}
              onChange={handleChange}
              className={`${validationErrors.delivery_window_start ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} shadow-sm block w-full sm:text-sm rounded-md`}
              required
            />
          </div>
          {validationErrors.delivery_window_start && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.delivery_window_start}</p>
          )}
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="delivery_window_end" className="block text-sm font-medium text-gray-700">
            Delivery End Date *
          </label>
          <div className="mt-1">
            <input
              type="date"
              name="delivery_window_end"
              id="delivery_window_end"
              value={formData.delivery_window_end}
              onChange={handleChange}
              className={`${validationErrors.delivery_window_end ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'} shadow-sm block w-full sm:text-sm rounded-md`}
              required
            />
          </div>
          {validationErrors.delivery_window_end && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.delivery_window_end}</p>
          )}
        </div>
        
        <div className="sm:col-span-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Additional Information
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Any additional details about your requirement"
            ></textarea>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {initialData.id ? (isSubmitting ? 'Saving...' : 'Save Changes') : (isSubmitting ? 'Creating...' : 'Create Requirement')}
        </button>
      </div>
    </form>
  );
} 