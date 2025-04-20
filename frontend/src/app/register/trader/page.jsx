'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RegisterTrader() {
  const router = useRouter();
  const { registerTrader } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    mobile_number: '',
    address: '',
    gst_number: '',
    government_id: '',
    logistics_capability: false,
    storage_capacity_tons: '',
    commodities_dealt: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const commodityOptions = [
    "grains", 
    "pulses", 
    "spices", 
    "oil & oil seeds",
    "fruits & vegetables", 
    "beverage & dry fruit", 
    "forest produce", 
    "others"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerTrader({
        ...formData,
        user_type: 'trader',
      });
      router.push('/login');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCommodityChange = (commodity) => {
    setFormData(prev => {
      const currentCommodities = [...prev.commodities_dealt];
      
      if (currentCommodities.includes(commodity)) {
        return {
          ...prev,
          commodities_dealt: currentCommodities.filter(item => item !== commodity)
        };
      } else {
        return {
          ...prev,
          commodities_dealt: [...currentCommodities, commodity]
        };
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Register as a Trader
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
              Sign in
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Basic User Information */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="mobile_number" className="block text-sm font-medium text-gray-700">
                Mobile Number
              </label>
              <input
                id="mobile_number"
                name="mobile_number"
                type="tel"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                value={formData.mobile_number}
                onChange={handleChange}
              />
            </div>

            {/* Trader-specific Information */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="gst_number" className="block text-sm font-medium text-gray-700">
                GST Number (Optional)
              </label>
              <input
                id="gst_number"
                name="gst_number"
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                value={formData.gst_number}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="government_id" className="block text-sm font-medium text-gray-700">
                Government ID (Optional)
              </label>
              <input
                id="government_id"
                name="government_id"
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                value={formData.government_id}
                onChange={handleChange}
              />
            </div>
            <div className="flex items-center">
              <input
                id="logistics_capability"
                name="logistics_capability"
                type="checkbox"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                checked={formData.logistics_capability}
                onChange={handleChange}
              />
              <label htmlFor="logistics_capability" className="ml-2 block text-sm font-medium text-gray-700">
                Has Logistics Capability
              </label>
            </div>
            <div>
              <label htmlFor="storage_capacity_tons" className="block text-sm font-medium text-gray-700">
                Storage Capacity (Tons, Optional)
              </label>
              <input
                id="storage_capacity_tons"
                name="storage_capacity_tons"
                type="number"
                step="0.01"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                value={formData.storage_capacity_tons}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commodities Dealt (Select at least one)
              </label>
              <div className="space-y-2">
                {commodityOptions.map((commodity) => (
                  <div key={commodity} className="flex items-center">
                    <input
                      id={`commodity-${commodity}`}
                      type="checkbox"
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      checked={formData.commodities_dealt.includes(commodity)}
                      onChange={() => handleCommodityChange(commodity)}
                    />
                    <label htmlFor={`commodity-${commodity}`} className="ml-2 block text-sm text-gray-700 capitalize">
                      {commodity}
                    </label>
                  </div>
                ))}
              </div>
              {formData.commodities_dealt.length === 0 && (
                <p className="text-red-500 text-xs mt-1">Please select at least one commodity</p>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || formData.commodities_dealt.length === 0}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 