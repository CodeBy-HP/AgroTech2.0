'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { FiFilter, FiArrowLeft, FiExternalLink, FiCheck, FiX } from 'react-icons/fi';
import Spinner from '@/components/common/Spinner';

export default function TraderRequirementsPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [applications, setApplications] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'open',
    commodity_type: '',
    location: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.user_type !== 'trader') {
      router.push('/unauthorized');
      return;
    }

    fetchData();
  }, [user, token, router, loading]);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      
      const requirementsPromise = fetchRequirements();
      const applicationsPromise = fetchApplications();
      
      await Promise.all([requirementsPromise, applicationsPromise]);
      
      setDataLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setDataLoading(false);
    }
  };

  const fetchRequirements = async () => {
    try {
      const queryParams = [];
      
      if (filters.status) {
        queryParams.push(`status=${filters.status}`);
      }
      
      if (filters.commodity_type) {
        queryParams.push(`commodity_type=${filters.commodity_type}`);
      }
      
      if (filters.location) {
        queryParams.push(`location=${filters.location}`);
      }
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/requirements/available/${queryString}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('Raw requirements data:', response.data);
      
      // Map database field names to frontend field names
      const mappedRequirements = response.data.map(req => {
        // Get company name from the nested company object
        let companyName = req.company ? req.company.company_name : 'Unknown Company';

        // Include both the original data and our mapped fields
        return {
          ...req,
          company_name: companyName,
          quantity: req.quantity || req.quantity_required,
          budget_min: req.budget_min || req.expected_price_min,
          budget_max: req.budget_max || req.expected_price_max,
          additional_info: req.additional_info || req.description,
          delivery_deadline: req.delivery_deadline || req.delivery_window_end
        };
      });
      
      console.log('Mapped requirements data:', mappedRequirements);
      setRequirements(mappedRequirements);
    } catch (err) {
      console.error('Error fetching requirements:', err);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/applications/trader/`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setApplications(response.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchRequirements();
  };

  const resetFilters = () => {
    setFilters({
      status: 'open',
      commodity_type: '',
      location: ''
    });
    fetchRequirements();
  };

  // Check if user has already applied to a requirement
  const hasApplied = (requirementId) => {
    if (!applications || applications.length === 0) return false;
    return applications.some(app => 
      app.requirement_id === requirementId || 
      app.requirement?.id === requirementId
    );
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    if (!status) return null;
    
    const statusClasses = {
      'open': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800',
      'fulfilled': 'bg-blue-100 text-blue-800',
      'expired': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading || dataLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard/trader" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <FiArrowLeft className="mr-2" /> Back to Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Company Requirements</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all available procurement requirements from companies and submit applications.
          </p>
        </div>
        
        {/* Filters */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiFilter className="-ml-0.5 mr-2 h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {showFilters && (
            <div className="mt-4 bg-white shadow-sm rounded-md p-4 border border-gray-200">
              <form onSubmit={applyFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="commodity_type" className="block text-sm font-medium text-gray-700">Commodity Type</label>
                  <input
                    type="text"
                    name="commodity_type"
                    id="commodity_type"
                    value={filters.commodity_type}
                    onChange={handleFilterChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g. Wheat, Rice"
                  />
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">Delivery Location</label>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g. Mumbai, Delhi"
                  />
                </div>
                
                <div className="sm:col-span-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Reset
                  </button>
                  
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Apply Filters
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        
        {/* Requirements List */}
        {requirements.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <p className="text-gray-500">No requirements found matching your criteria.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commodity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget Range
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requirements.map((req) => (
                    <tr key={req.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {req.company_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{req.commodity_type || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {req.quantity || req.quantity_required ? 
                            `${req.quantity || req.quantity_required} MT` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(req.budget_min || req.expected_price_min) && 
                         (req.budget_max || req.expected_price_max) ? (
                          <>
                            <div className="text-sm text-gray-900">
                              ₹{req.budget_min || req.expected_price_min} - 
                              ₹{req.budget_max || req.expected_price_max}
                            </div>
                            <div className="text-xs text-gray-500">per MT</div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-900">Price not specified</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {req.delivery_deadline ? formatDate(req.delivery_deadline) : 
                           (req.delivery_window_end ? formatDate(req.delivery_window_end) : 'N/A')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{req.delivery_location || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <Link
                            href={`/dashboard/trader/requirements/${req.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Details
                          </Link>
                          {req.status === 'open' && (
                            hasApplied(req.id) ? (
                              <span className="text-green-600 flex items-center">
                                <FiCheck className="mr-1" /> Applied
                              </span>
                            ) : (
                              <Link
                                href={`/dashboard/trader/requirements/${req.id}/apply`}
                                className="text-indigo-600 hover:text-indigo-900 flex items-center"
                              >
                                Apply <FiExternalLink className="ml-1" />
                              </Link>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 