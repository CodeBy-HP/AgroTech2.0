'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { format } from 'date-fns';
import { FiPlus, FiEdit2, FiEye, FiTrash2, FiAlertCircle, FiFilter, FiSearch } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const statusColors = {
  'active': 'bg-green-100 text-green-800',
  'fulfilled': 'bg-blue-100 text-blue-800',
  'expired': 'bg-red-100 text-red-800',
  'draft': 'bg-gray-100 text-gray-800',
  'cancelled': 'bg-orange-100 text-orange-800'
};

export default function RequirementsListPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (!user) return;
    
    if (user.user_type !== 'company') {
      router.push('/unauthorized');
      return;
    }
    
    fetchRequirements();
  }, [token, user, router]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        console.error('No auth token available for fetching requirements');
        setError('Authentication error. Please try logging in again.');
        setLoading(false);
        return;
      }

      console.log('Using token for fetchRequirements (first 10 chars):', token.substring(0, 10));
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/requirements/company/`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('Requirements data:', response.data);
      setRequirements(response.data);
    } catch (err) {
      console.error('Error fetching requirements:', err);
      if (err.response) {
        console.error('Error response status:', err.response.status);
        console.error('Error response data:', err.response.data);
        
        if (err.response.status === 401) {
          setError('Authentication failed. Please log out and log in again.');
          setTimeout(() => {
            localStorage.removeItem('token');
            router.push('/login');
          }, 3000);
        } else {
          setError(err.response?.data?.detail || 'Failed to load requirements. Please try again.');
        }
      } else {
        setError('Failed to load requirements. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequirement = async () => {
    if (!requirementToDelete) return;
    
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/requirements/${requirementToDelete.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setRequirements(requirements.filter(req => req.id !== requirementToDelete.id));
      setShowDeleteModal(false);
      setRequirementToDelete(null);
    } catch (err) {
      console.error('Error deleting requirement:', err);
      setError('Failed to delete requirement. Please try again.');
    }
  };

  const confirmDelete = (requirement) => {
    setRequirementToDelete(requirement);
    setShowDeleteModal(true);
  };

  const filteredRequirements = requirements
    .filter(req => {
      const matchesSearch = 
        req.commodity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else {
        return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Requirements</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your commodity requirements and applications
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link 
              href="/dashboard/company/requirements/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FiPlus className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
              New Requirement
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center p-4 text-red-800 border-l-4 border-red-300 bg-red-50">
            <FiAlertCircle className="h-5 w-5 mr-3" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
              <div className="w-full md:w-1/3 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search requirements..."
                />
              </div>
              
              <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
                <div className="flex items-center">
                  <label htmlFor="status-filter" className="mr-2 text-sm font-medium text-gray-700">
                    <FiFilter className="inline-block h-4 w-4 mr-1" /> Status:
                  </label>
                  <select
                    id="status-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="expired">Expired</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <label htmlFor="sort-order" className="mr-2 text-sm font-medium text-gray-700">
                    Sort:
                  </label>
                  <select
                    id="sort-order"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading requirements...</p>
            </div>
          ) : filteredRequirements.length === 0 ? (
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-50">
                <FiAlertCircle className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No requirements found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your filters to see more results'
                  : 'Create your first requirement to start receiving trader applications'}
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/company/requirements/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FiPlus className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
                  Create a Requirement
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commodity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequirements.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{req.commodity_type}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {req.description ? `${req.description.slice(0, 50)}...` : 'No description provided'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{req.quantity_required} MT</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[req.status] || 'bg-gray-100 text-gray-800'}`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link href={`/dashboard/company/requirements/${req.id}`}>
                          <span className="text-green-600 hover:text-green-900">View applications</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {req.delivery_window_end ? format(new Date(req.delivery_window_end), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(req.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/dashboard/company/requirements/${req.id}`}
                            className="text-green-600 hover:text-green-900"
                            title="View details"
                          >
                            <FiEye className="h-5 w-5" />
                          </Link>
                          
                          <Link
                            href={`/dashboard/company/requirements/${req.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit requirement"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </Link>
                          
                          <button
                            onClick={() => confirmDelete(req)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete requirement"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>
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
      {showDeleteModal && (
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
                    <FiAlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Requirement</h3>
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
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteRequirement}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
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