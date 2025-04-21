'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { FiExternalLink, FiCheck, FiX } from 'react-icons/fi';

export default function TraderDashboard() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [dataLoading, setDataLoading] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [activeApplications, setActiveApplications] = useState([]);
  const [applyingTo, setApplyingTo] = useState(null);
  const [applicationData, setApplicationData] = useState({
    proposed_price: '',
    proposed_quantity: '',
    inventory_id: '',
    eta: '',
    message: ''
  });
  const [inventories, setInventories] = useState([]);
  const [stats, setStats] = useState({
    inventories: 0,
    commodities: 0,
    farms: 0,
    bids: 0
  });

  useEffect(() => {
    // Don't redirect if still loading auth state
    if (loading) return;
    
    // If no user after loading completes, redirect to login
      if (!user) {
        router.push('/login');
      return;
    }
    
    // Debug the user type
    console.log("TraderDashboard - User:", user);
    console.log("TraderDashboard - User type:", user.user_type);
    
    // Only check user type after loading is complete
    if (user.user_type !== 'trader') {
      console.log("Redirecting to unauthorized - user type is:", user.user_type);
        router.push('/unauthorized');
      return;
    }

    fetchData();
  }, [user, token, router, loading]);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      
      // Fetch trader stats
      const statsPromise = fetchStats();
      
      // Fetch open requirements from companies
      const requirementsPromise = fetchRequirements();
      
      // Fetch trader's inventories for the application form
      const inventoriesPromise = fetchInventories();
      
      // Fetch trader's active applications
      const applicationsPromise = fetchApplications();
      
      // Wait for all requests to complete
      await Promise.all([statsPromise, requirementsPromise, inventoriesPromise, applicationsPromise]);
      
      setDataLoading(false);
    } catch (err) {
      console.error('Error fetching trader dashboard data:', err);
      setDataLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      // In a real implementation, you would fetch actual stats
      // For now, using dummy data
      setStats({
        inventories: 2,
        commodities: 8,
        farms: 5,
        bids: 3
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };
  
  const fetchRequirements = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/requirements/available/`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('Raw requirements data:', response.data);
      
      // Map database field names to frontend field names
      const mappedRequirements = response.data.map(req => {
        // Simplify: Rely on the company name provided in the requirement data
        let companyName = req.company_name || (req.company ? req.company.name : 'Unknown Company');
        
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
  
  const fetchInventories = async () => {
    try {
      // First get trader's inventories
      const inventoriesResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/inventories/my-inventories/`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Then get commodities for each inventory
      const allInventories = [];
      const inventoriesWithCommodities = await Promise.all(
        inventoriesResponse.data.map(async (inventory) => {
          try {
            const commoditiesResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/api/inventories/${inventory.id}/commodities/`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            commoditiesResponse.data.forEach(commodity => {
              allInventories.push({
                inventory_id: inventory.id,
                inventory_name: inventory.name,
                commodity_id: commodity.id,
                commodity_name: commodity.name,
                available_quantity: commodity.quantity,
                unit: commodity.unit || 'MT'
              });
            });
          } catch (error) {
            console.error(`Error fetching commodities for inventory ${inventory.id}:`, error);
          }
        })
      );
      
      setInventories(allInventories);
    } catch (err) {
      console.error('Error fetching inventories:', err);
    }
  };
  
  const fetchApplications = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/applications/trader/`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('Applications data:', response.data);
      setActiveApplications(response.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };
  
  const handleApplyClick = (requirementId) => {
    setApplyingTo(requirementId);
    // Reset application form
    setApplicationData({
      proposed_price: '',
      proposed_quantity: '',
      inventory_id: '',
      eta: '',
      message: ''
    });
  };
  
  const handleApplicationChange = (e) => {
    const { name, value } = e.target;

    // Handle selection of commodity/inventory
    if (name === 'inventory_commodity_select') {
      const selectedInventoryId = value; // Assuming value is inventory_id
      setApplicationData(prev => ({ ...prev, inventory_id: selectedInventoryId }));
    } else {
      setApplicationData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Ensure ETA is in YYYY-MM-DD format if it's a date object
      let formattedEta = applicationData.eta;
      if (applicationData.eta instanceof Date) {
         formattedEta = applicationData.eta.toISOString().split('T')[0];
      } else if (typeof applicationData.eta === 'string' && applicationData.eta.includes('T')) {
         // Handle potential ISO string format from date picker
         formattedEta = applicationData.eta.split('T')[0];
      }

      const payload = {
        requirement_id: applyingTo,
        inventory_id: applicationData.inventory_id,
        proposed_price: parseFloat(applicationData.proposed_price),
        proposed_quantity: parseFloat(applicationData.proposed_quantity),
        eta: formattedEta,
        message: applicationData.message
      };
      
      console.log('Submitting application:', payload);
      
      // Validate payload before sending
      if (!payload.inventory_id || !payload.proposed_price || !payload.proposed_quantity || !payload.eta) {
        alert('Please fill in all required fields: Inventory, Quantity, Price, and ETA.');
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/applications/`,
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Refresh data after successful application
      fetchRequirements();
      fetchApplications();
      setApplyingTo(null);
      
      // Display success message (you can implement a toast notification here)
      alert('Application submitted successfully!');
    } catch (err) {
      console.error('Error submitting application:', err);
      let errorMessage = 'Failed to submit application. Please try again.';
      if (err.response) {
          console.error('Error response:', err.response.data);
          // Try to extract specific validation errors if available
          if (err.response.data.detail && Array.isArray(err.response.data.detail)) {
            errorMessage = err.response.data.detail.map(d => `${d.loc[1]}: ${d.msg}`).join('\n');
          } else if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          }
      }
      alert(errorMessage);
    }
  };
  
  const cancelApplication = () => {
    setApplyingTo(null);
  };
  
  // Check if user has already applied to a requirement
  const hasApplied = (requirementId) => {
    if (!activeApplications || activeApplications.length === 0) return false;
    return activeApplications.some(app => 
      app.requirement_id === requirementId || 
      app.requirement?.id === requirementId
    );
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Show loading state while auth is loading or while fetching data
  if (loading || (dataLoading && user)) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Trader Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.full_name || 'Trader'}. Manage your inventories, commodities, and farm connections.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Inventory Stats */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Inventories</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.inventories}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/dashboard/trader/inventories" className="font-medium text-indigo-600 hover:text-indigo-500">
                  View all
                </Link>
              </div>
            </div>
          </div>

          {/* Commodities Stats */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Commodities</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.commodities}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/dashboard/trader/inventories" className="font-medium text-green-600 hover:text-green-500">
                  Manage inventories
                </Link>
              </div>
            </div>
          </div>

          {/* Farms Stats */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Farms</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.farms}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/dashboard/trader/farms" className="font-medium text-yellow-600 hover:text-yellow-500">
                  View all
                </Link>
              </div>
            </div>
          </div>

          {/* Bids Stats */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-pink-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Bids</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.bids}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/dashboard/trader/farms" className="font-medium text-pink-600 hover:text-pink-500">
                  Manage bids
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/dashboard/trader/inventories/new" 
                  className="relative block bg-white p-6 rounded-lg border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all">
              <div className="flex items-center">
                <div className="flex-shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-md bg-indigo-500 text-white sm:h-12 sm:w-12">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Create New Inventory</h3>
                  <p className="mt-1 text-sm text-gray-500">Add a new inventory to your portfolio</p>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/trader/farms" 
                  className="relative block bg-white p-6 rounded-lg border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all">
              <div className="flex items-center">
                <div className="flex-shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-md bg-green-500 text-white sm:h-12 sm:w-12">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 1h6m-3-3v6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Browse Farms</h3>
                  <p className="mt-1 text-sm text-gray-500">Connect with farms and make bids</p>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/trader/inventories" 
                  className="relative block bg-white p-6 rounded-lg border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all">
              <div className="flex items-center">
                <div className="flex-shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-md bg-yellow-500 text-white sm:h-12 sm:w-12">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Manage Inventories</h3>
                  <p className="mt-1 text-sm text-gray-500">View and update your inventory information</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Company Requirements Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Open Requirements from Companies</h2>
            <Link 
              href="/dashboard/trader/requirements" 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View All Requirements
            </Link>
          </div>
          
          {requirements.length === 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
              <p className="text-gray-500">No open requirements from companies at the moment.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
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
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requirements.slice(0, 5).map((req) => (
                    <tr key={req.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {req.company?.company_name || 'N/A'}
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <Link
                            href={`/dashboard/trader/requirements/${req.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Details
                          </Link>
                          {hasApplied(req.id) ? (
                            <span className="text-green-600 flex items-center">
                              <FiCheck className="mr-1" /> Applied
                            </span>
                          ) : (
                            <button
                              onClick={() => handleApplyClick(req.id)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            >
                              Apply <FiExternalLink className="ml-1" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {requirements.length > 5 && (
                <div className="bg-gray-50 px-6 py-3 flex justify-center">
                  <Link href="/dashboard/trader/requirements" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    View All {requirements.length} Requirements
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Application Form Modal */}
        {applyingTo && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Apply to Requirement
                      </h3>
                      <div className="mt-2">
                        <form onSubmit={handleApplicationSubmit} className="space-y-6">
                          <div>
                            <label htmlFor="inventory_commodity_select" className="block text-sm font-medium text-gray-700">
                              Select Inventory
                            </label>
                            <select
                              id="inventory_commodity_select"
                              name="inventory_commodity_select"
                              required
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                              value={applicationData.inventory_id}
                              onChange={handleApplicationChange}
                            >
                              <option value="">-- Select an inventory --</option>
                              {inventories.map((item) => (
                                <option key={item.inventory_id + '-' + item.commodity_id} value={item.inventory_id}>
                                  {item.commodity_name} from {item.inventory_name} ({item.available_quantity} {item.unit})
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label htmlFor="proposed_quantity" className="block text-sm font-medium text-gray-700">
                              Quantity (MT)
                            </label>
                            <input
                              type="number"
                              name="proposed_quantity"
                              id="proposed_quantity"
                              required
                              min="0.1"
                              step="0.1"
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              placeholder="Enter quantity"
                              value={applicationData.proposed_quantity}
                              onChange={handleApplicationChange}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="proposed_price" className="block text-sm font-medium text-gray-700">
                              Price per MT (₹)
                            </label>
                            <input
                              type="number"
                              name="proposed_price"
                              id="proposed_price"
                              required
                              min="0.01"
                              step="0.01"
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              placeholder="Enter price per unit"
                              value={applicationData.proposed_price}
                              onChange={handleApplicationChange}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="eta" className="block text-sm font-medium text-gray-700">
                              Estimated Time of Arrival (ETA)
                            </label>
                            <input
                              type="date"
                              name="eta"
                              id="eta"
                              required
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              value={applicationData.eta}
                              onChange={handleApplicationChange}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                              Message (Optional)
                            </label>
                            <textarea
                              id="message"
                              name="message"
                              rows="3"
                              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                              placeholder="Any additional details about your offer"
                              value={applicationData.message}
                              onChange={handleApplicationChange}
                            ></textarea>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleApplicationSubmit}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Submit Application
                  </button>
                  <button
                    type="button"
                    onClick={cancelApplication}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Your Applications Section */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Applications</h2>
          
          {activeApplications.length === 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
              <p className="text-gray-500">You haven't applied to any requirements yet.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
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
                      Your Offer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied On
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeApplications.map((app) => (
                    <tr key={app.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {app.requirement?.company?.company_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {app.requirement?.commodity_type || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{app.proposed_price || 'N/A'}</div>
                        <div className="text-xs text-gray-500">per MT</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{app.proposed_quantity || 'N/A'} MT</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            app.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(app.created_at)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 