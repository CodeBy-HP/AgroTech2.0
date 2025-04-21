'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tab } from '@headlessui/react';
import { 
  FiPackage, FiFileText, FiCheckCircle, FiClock, FiX, FiUser, 
  FiPlus, FiEdit, FiBarChart2, FiTrendingUp, FiCreditCard, 
  FiActivity, FiShoppingBag, FiCalendar, FiDollarSign, FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function CompanyDashboard() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [selectedTab, setSelectedTab] = useState(0);
  const [requirements, setRequirements] = useState([]);
  const [deals, setDeals] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState({
    totalRequirements: 0,
    activeRequirements: 0,
    totalDeals: 0,
    pendingDeals: 0,
    completedDeals: 0,
    monthlyCommodityVolume: 0
  });

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.user_type !== 'company') {
      router.push('/unauthorized');
      return;
    }

    fetchData();
  }, [user, token, router, loading]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch requirements
      const reqResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/requirements/company/`, 
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setRequirements(reqResponse.data);

      // Fetch deals
      const dealsResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/deals/company/`, 
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setDeals(dealsResponse.data);
      
      // Calculate statistics
      const activeReqs = reqResponse.data.filter(req => req.status === 'open').length;
      const pendingDeals = dealsResponse.data.filter(deal => deal.status === 'in_discussion' || deal.status === 'confirmed').length;
      const completedDeals = dealsResponse.data.filter(deal => deal.status === 'completed').length;
      
      // Calculate total commodity volume from completed deals
      const commodityVolume = dealsResponse.data
        .filter(deal => deal.status === 'completed')
        .reduce((total, deal) => total + deal.quantity, 0);
      
      setStats({
        totalRequirements: reqResponse.data.length,
        activeRequirements: activeReqs,
        totalDeals: dealsResponse.data.length,
        pendingDeals: pendingDeals,
        completedDeals: completedDeals,
        monthlyCommodityVolume: commodityVolume
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter requirements based on status
  const filteredRequirements = requirements.filter(req => {
    if (filterStatus === "all") return true;
    return req.status === filterStatus;
  });

  // Close a requirement
  const closeRequirement = async (requirementId) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/requirements/${requirementId}`,
        { status: "closed" },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Update local state
      setRequirements(requirements.map(req => 
        req.id === requirementId ? { ...req, status: "closed" } : req
      ));
      
      toast.success('Requirement closed successfully');
    } catch (error) {
      console.error('Error closing requirement:', error);
      toast.error('Failed to close requirement');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">Open</span>;
      case 'closed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Closed</span>;
      case 'in_discussion':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">In Discussion</span>;
      case 'fulfilled':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">Fulfilled</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getDealStatusBadge = (status) => {
    switch (status) {
      case 'in_discussion':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">In Discussion</span>;
      case 'confirmed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">Confirmed</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">Completed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Show loading state while auth is loading or while fetching data
  if (loading || (isLoading && user)) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your commodity requirements and deals from this dashboard
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link 
              href="/dashboard/company/requirements/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
            >
              <FiPlus className="mr-2 h-4 w-4" /> New Requirement
            </Link>
            <button 
              onClick={fetchData}
              className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
            >
              <FiRefreshCw className="mr-2 h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-lg shadow p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-emerald-100 rounded-md p-3">
                <FiFileText className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Active Requirements</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stats.activeRequirements}</p>
                  <p className="ml-2 text-sm text-gray-500">/ {stats.totalRequirements} total</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FiCreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Pending Deals</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stats.pendingDeals}</p>
                  <p className="ml-2 text-sm text-gray-500">/ {stats.totalDeals} total</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <FiCheckCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Completed Deals</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stats.completedDeals}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-100 rounded-md p-3">
                <FiShoppingBag className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Commodity Volume</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stats.monthlyCommodityVolume}</p>
                  <p className="ml-2 text-sm text-gray-500">MT</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow rounded-lg border border-gray-100">
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <Tab.List className="flex border-b border-gray-200">
              <Tab className={({ selected }) => 
                `px-6 py-4 text-sm font-medium leading-5 ${
                  selected 
                    ? 'text-emerald-600 border-b-2 border-emerald-500' 
                    : 'text-gray-500 hover:text-gray-700'
                } focus:outline-none transition-colors duration-200`
              }>
                <div className="flex items-center">
                  <FiFileText className="mr-2" />
                  <span>Requirements</span>
                </div>
              </Tab>
              <Tab className={({ selected }) => 
                `px-6 py-4 text-sm font-medium leading-5 ${
                  selected 
                    ? 'text-emerald-600 border-b-2 border-emerald-500' 
                    : 'text-gray-500 hover:text-gray-700'
                } focus:outline-none transition-colors duration-200`
              }>
                <div className="flex items-center">
                  <FiCheckCircle className="mr-2" />
                  <span>Deals</span>
                </div>
              </Tab>
            </Tab.List>
            <Tab.Panels className="p-6">
              {/* Requirements Panel */}
              <Tab.Panel>
                <div className="mb-6 flex flex-wrap items-center">
                  <label className="block text-sm font-medium text-gray-700 mr-2">Filter by Status:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All</option>
                    <option value="open">Open</option>
                    <option value="in_discussion">In Discussion</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {filteredRequirements.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredRequirements.map((requirement) => (
                      <div 
                        key={requirement.id} 
                        className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                      >
                        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 flex justify-between items-center">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {requirement.commodity_type}
                          </h3>
                          {getStatusBadge(requirement.status)}
                        </div>
                        
                        <div className="p-4">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Quantity</p>
                              <p className="text-sm font-medium text-gray-900 mt-1">{requirement.quantity_required} MT</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Price Range</p>
                              <p className="text-sm font-medium text-gray-900 mt-1">
                                {requirement.expected_price_min && requirement.expected_price_max 
                                  ? `₹${requirement.expected_price_min} - ₹${requirement.expected_price_max}` 
                                  : 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Delivery Window</p>
                              <p className="text-sm font-medium text-gray-900 mt-1">
                                {formatDate(requirement.delivery_window_start)} - {formatDate(requirement.delivery_window_end)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Location</p>
                              <p className="text-sm font-medium text-gray-900 mt-1 truncate">{requirement.delivery_location || 'Not specified'}</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <Link
                              href={`/dashboard/company/requirements/${requirement.id}`}
                              className="text-sm text-emerald-600 hover:text-emerald-800 font-medium flex items-center transition-colors duration-200"
                            >
                              <span>View Details</span>
                            </Link>
                            
                            <div className="flex space-x-2">
                              {requirement.status === 'open' && (
                                <button
                                  onClick={() => closeRequirement(requirement.id)}
                                  className="inline-flex items-center px-2 py-1 border border-transparent rounded-md text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                >
                                  <FiX className="mr-1 h-4 w-4" />
                                  <span>Close</span>
                                </button>
                              )}
                              <Link
                                href={`/dashboard/company/requirements/${requirement.id}/edit`}
                                className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                              >
                                <FiEdit className="mr-1 h-4 w-4" />
                                <span>Edit</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                      <FiFileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="mt-3 text-lg font-medium text-gray-900">No requirements found</h3>
                    <p className="mt-2 text-sm text-gray-500">Get started by creating your first requirement.</p>
                    <div className="mt-6">
                      <Link
                        href="/dashboard/company/requirements/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                      >
                        <FiPlus className="mr-2 h-4 w-4" /> Create First Requirement
                      </Link>
                    </div>
                  </div>
                )}
              </Tab.Panel>

              {/* Deals Panel */}
              <Tab.Panel>
                {deals.length > 0 ? (
                  <div className="space-y-6">
                    {deals.map((deal) => (
                      <div 
                        key={deal.id} 
                        className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                      >
                        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-emerald-100 rounded-full p-2">
                              <FiPackage className="h-5 w-5 text-emerald-600" />
                            </div>
                            <h3 className="ml-3 text-lg font-medium text-gray-900">
                              {deal.commodity_type}
                            </h3>
                          </div>
                          {getDealStatusBadge(deal.status)}
                        </div>
                        
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Trader</p>
                              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center">
                                <FiUser className="mr-1 h-4 w-4 text-gray-400" />
                                {deal.trader_name || 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Location</p>
                              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center">
                                <FiPackage className="mr-1 h-4 w-4 text-gray-400" />
                                {deal.inventory_location || 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">ETA</p>
                              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center">
                                <FiCalendar className="mr-1 h-4 w-4 text-gray-400" />
                                {formatDate(deal.eta)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Quantity</p>
                              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center">
                                <FiBarChart2 className="mr-1 h-4 w-4 text-gray-400" />
                                {deal.quantity} MT
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Price</p>
                              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center">
                                <FiDollarSign className="mr-1 h-4 w-4 text-gray-400" />
                                ₹{deal.price}/MT
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Total Value</p>
                              <p className="text-sm font-medium text-gray-900 mt-1 flex items-center">
                                <FiActivity className="mr-1 h-4 w-4 text-gray-400" />
                                ₹{(deal.price * deal.quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-end items-center pt-3 border-t border-gray-100">
                            {deal.status === 'in_discussion' && (
                              <button
                                onClick={async () => {
                                  try {
                                    await axios.patch(
                                      `${process.env.NEXT_PUBLIC_API_URL}/api/deals/${deal.id}`,
                                      { status: "confirmed" },
                                      { headers: { 'Authorization': `Bearer ${token}` } }
                                    );
                                    
                                    // Update local state
                                    setDeals(deals.map(d => 
                                      d.id === deal.id ? { ...d, status: "confirmed" } : d
                                    ));
                                    
                                    toast.success('Deal confirmed successfully');
                                  } catch (error) {
                                    console.error('Error confirming deal:', error);
                                    toast.error('Failed to confirm deal');
                                  }
                                }}
                                className="ml-3 inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                              >
                                <FiCheckCircle className="mr-2 h-4 w-4" />
                                Confirm Deal
                              </button>
                            )}
                            
                            {deal.status === 'confirmed' && (
                              <button
                                onClick={async () => {
                                  try {
                                    await axios.patch(
                                      `${process.env.NEXT_PUBLIC_API_URL}/api/deals/${deal.id}`,
                                      { status: "completed" },
                                      { headers: { 'Authorization': `Bearer ${token}` } }
                                    );
                                    
                                    // Update local state
                                    setDeals(deals.map(d => 
                                      d.id === deal.id ? { ...d, status: "completed" } : d
                                    ));
                                    
                                    toast.success('Deal marked as completed');
                                  } catch (error) {
                                    console.error('Error completing deal:', error);
                                    toast.error('Failed to complete deal');
                                  }
                                }}
                                className="ml-3 inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                              >
                                <FiCheckCircle className="mr-2 h-4 w-4" />
                                Mark as Completed
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                      <FiCheckCircle className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="mt-3 text-lg font-medium text-gray-900">No deals found</h3>
                    <p className="mt-2 text-sm text-gray-500">Post a requirement or explore traders to create a deal.</p>
                  </div>
                )}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </DashboardLayout>
  );
}