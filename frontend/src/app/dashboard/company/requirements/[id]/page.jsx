'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiAlertCircle, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

export default function RequirementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token } = useAuth();
  const [requirement, setRequirement] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!user || user.user_type !== 'company') {
      router.push('/unauthorized');
      return;
    }

    fetchRequirementData();
  }, [user, token, params.id]);

  const fetchRequirementData = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        console.error('No auth token available for fetching requirement data');
        setError('Authentication error. Please try logging in again.');
        setLoading(false);
        return;
      }

      console.log('Using token for fetchRequirementData (first 10 chars):', token.substring(0, 10));
      console.log('Fetching requirement with ID:', params.id);
      
      const [reqResponse, appsResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/requirements/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/requirement/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      console.log('Requirement data:', reqResponse.data);
      console.log('Applications data:', appsResponse.data);
      
      let requirementData = reqResponse.data;
      
      // If we have a company_id but no company_name, fetch the company details
      if (requirementData.company_id && !requirementData.company_name) {
        try {
          const companyResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/companies/${requirementData.company_id}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          // Update the requirement data with company information
          requirementData = {
            ...requirementData,
            company_name: companyResponse.data.name || 'Unknown Company'
          };
        } catch (companyErr) {
          console.error('Error fetching company details:', companyErr);
          // If we failed to get the company name, still show the requirement with a default name
          requirementData.company_name = requirementData.company_name || 'Unknown Company';
        }
      }
      
      setRequirement(requirementData);
      setApplications(appsResponse.data);
    } catch (err) {
      console.error('Error fetching requirement details:', err);
      if (err.response) {
        console.error('Error response status:', err.response.status);
        console.error('Error response data:', err.response.data);
        
        if (err.response.status === 401) {
          setError('Authentication failed. Please log out and log in again.');
          setTimeout(() => {
            localStorage.removeItem('token');
            router.push('/login');
          }, 3000);
        } else if (err.response.status === 404) {
          setError('Requirement not found or has been deleted.');
        } else {
          setError(err.response?.data?.detail || 'Failed to load requirement details.');
        }
      } else {
        setError('Failed to load requirement details. Please check your connection.');
      }
      toast.error('Failed to load requirement details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequirement = async () => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/requirements/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      toast.success('Requirement deleted successfully');
      router.push('/dashboard/company/requirements');
    } catch (err) {
      console.error('Error deleting requirement:', err);
      toast.error(err.response?.data?.message || 'Failed to delete requirement');
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const handleApplicationStatusChange = async (applicationId, newStatus) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/applications/${applicationId}`, 
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Update application status locally
      setApplications(prevApps => 
        prevApps.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
      toast.success(`Application ${newStatus === 'accepted' ? 'accepted' : 'rejected'}`);
      
      if (newStatus === 'accepted') {
        // If accepting, refresh all applications to see updated statuses
        fetchRequirementData();
      }
    } catch (err) {
      console.error('Error updating application status:', err);
      toast.error('Failed to update application status');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
              <div className="h-40 bg-gray-200 rounded mb-6"></div>
              <div className="h-60 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !requirement) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error || 'Failed to load requirement'}</p>
                </div>
                <div className="mt-4">
                  <Link href="/dashboard/company/requirements" legacyBehavior>
                    <a className="inline-flex items-center text-sm font-medium text-red-700 hover:text-red-600">
                      <FiArrowLeft className="mr-2 h-5 w-5" />
                      Back to Requirements
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid Date';
    }
  };
  
  const getStatusBadge = (status) => {
    const statusClasses = {
      'open': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800',
      'fulfilled': 'bg-blue-100 text-blue-800',
      'expired': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Link href="/dashboard/company/requirements" legacyBehavior>
              <a className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                <FiArrowLeft className="mr-2" /> Back to Requirements
              </a>
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-gray-900">
              {requirement.commodity_type} - {requirement.quantity_required} MT
            </h1>
            <div className="mt-1 flex items-center space-x-3">
              {getStatusBadge(requirement.status)}
              <span className="text-sm text-gray-500">Posted on {formatDate(requirement.created_at)}</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Link href={`/dashboard/company/requirements/${params.id}/edit`} legacyBehavior>
              <a className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <FiEdit2 className="-ml-1 mr-2 h-4 w-4" />
                Edit
              </a>
            </Link>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FiTrash2 className="-ml-1 mr-2 h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
        
        {/* Requirement Details */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Requirement Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Details and specifications of your commodity requirement.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Commodity Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{requirement.commodity_type}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{requirement.company_name || 'Not specified'}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{requirement.quantity_required} MT</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Budget Range</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  ₹{requirement.expected_price_min} - ₹{requirement.expected_price_max} per MT
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Quality Requirements</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {requirement.quality_requirements || 'No specific quality requirements provided'}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Delivery Location</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{requirement.delivery_location}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Delivery Deadline</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(requirement.delivery_deadline)}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Additional Information</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {requirement.additional_info || 'No additional information provided'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        {/* Trader Applications */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Trader Applications ({applications.length})
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Review and manage applications from traders for this requirement.
            </p>
          </div>
          
          {applications.length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <p className="text-sm text-gray-500">No applications received yet for this requirement.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trader
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Offer Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commodity Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied On
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {application.trader_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {application.trader_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{application.price_per_unit} per MT</div>
                        <div className="text-xs text-gray-500">
                          {application.price_per_unit < requirement.expected_price_min ? (
                            <span className="text-red-500">Below your minimum</span>
                          ) : application.price_per_unit > requirement.expected_price_max ? (
                            <span className="text-red-500">Above your maximum</span>
                          ) : (
                            <span className="text-green-500">Within your budget</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {application.quantity} MT
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{application.commodity_name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {application.commodity_details || 'No details provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            application.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(application.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {application.status === 'pending' ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleApplicationStatusChange(application.id, 'accepted')}
                              className="text-green-600 hover:text-green-900 focus:outline-none focus:underline"
                            >
                              <FiCheck className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleApplicationStatusChange(application.id, 'rejected')}
                              className="text-red-600 hover:text-red-900 focus:outline-none focus:underline"
                            >
                              <FiX className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <Link href={`/dashboard/company/applications/${application.id}`} legacyBehavior>
                            <a className="text-green-600 hover:text-green-900">View Details</a>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiAlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Delete Requirement
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this requirement? This action cannot be undone.
                        All applications associated with this requirement will also be deleted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteRequirement}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 