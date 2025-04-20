'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CompanyProfile() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    company_name: '',
    company_type: '',
    company_location: '',
    contact_person_designation: '',
    company_gst_tax_id: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user && user.user_type !== 'company') {
      router.push('/unauthorized');
    }
    
    if (!loading && user) {
      // Fetch complete profile data directly from API
      fetchCompanyProfileData();
    }
  }, [user, loading, router]);

  const fetchCompanyProfileData = async () => {
    try {
      setDataLoading(true);
      
      // Get the token from AuthContext
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('http://localhost:8000/users/me/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const profileData = await response.json();
      console.log('Fetched profile data:', profileData);
      
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        mobile_number: user.mobile_number || '',
        company_name: profileData.company_name || '',
        company_type: profileData.company_type || '',
        company_location: profileData.company_location || '',
        contact_person_designation: profileData.contact_person_designation || '',
        company_gst_tax_id: profileData.company_gst_id || '' // Note: API might use company_gst_id instead of company_gst_tax_id
      });
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data. Please refresh the page.');
      
      // Still try to set data from the user object if available
      if (user) {
        setFormData({
          full_name: user.full_name || '',
          email: user.email || '',
          mobile_number: user.mobile_number || '',
          company_name: user.company_name || '',
          company_type: user.company_type || '',
          company_location: user.company_location || '',
          contact_person_designation: user.contact_person_designation || '',
          company_gst_tax_id: user.company_gst_id || user.company_gst_tax_id || '',
        });
      }
    } finally {
      setDataLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Create properly formatted data for the API
      const profileUpdateData = {
        full_name: formData.full_name,
        email: formData.email,
        mobile_number: formData.mobile_number,
        profile: {
          company_name: formData.company_name,
          company_type: formData.company_type,
          company_location: formData.company_location,
          contact_person_designation: formData.contact_person_designation,
          company_gst_id: formData.company_gst_tax_id,
        }
      };

      const response = await fetch('http://localhost:8000/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileUpdateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccess('Profile updated successfully');
      setIsEditing(false);
      
      // Refresh the data
      fetchCompanyProfileData();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">Company Profile</h1>
                <p className="text-green-100 mt-1">Manage your company information</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 md:mt-0 px-4 py-2 bg-white text-green-600 rounded-lg shadow-sm hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-600 transition-colors font-medium text-sm"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Success/Error Messages */}
          {error && (
            <div className="mx-6 mt-6 bg-red-50 border-l-4 border-red-400 p-4">
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

          {success && (
            <div className="mx-6 mt-6 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Info Section */}
                <div className="md:col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Company Information</h2>
                </div>
                
                <div>
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    id="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="company_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Type
                  </label>
                  <select
                    name="company_type"
                    id="company_type"
                    value={formData.company_type}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">Select a type</option>
                    <option value="wholesaler">Wholesaler</option>
                    <option value="retailer">Retailer</option>
                    <option value="processor">Processor</option>
                    <option value="exporter">Exporter</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="company_location" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Location
                  </label>
                  <input
                    type="text"
                    name="company_location"
                    id="company_location"
                    value={formData.company_location}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="company_gst_tax_id" className="block text-sm font-medium text-gray-700 mb-1">
                    GST/Tax ID
                  </label>
                  <input
                    type="text"
                    name="company_gst_tax_id"
                    id="company_gst_tax_id"
                    value={formData.company_gst_tax_id}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                {/* Contact Person Section */}
                <div className="md:col-span-2 pt-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Contact Person</h2>
                </div>
                
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="contact_person_designation" className="block text-sm font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    name="contact_person_designation"
                    id="contact_person_designation"
                    value={formData.contact_person_designation}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="mobile_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile_number"
                    id="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* Form Actions */}
              {isEditing && (
                <div className="flex justify-end pt-4 space-x-3 mt-8 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 