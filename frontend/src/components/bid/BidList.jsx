'use client';

import { useState, useEffect } from 'react';
import { useFarm } from '@/context/FarmContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import BidCard from './BidCard';
import { Filter, RefreshCw, Search } from 'lucide-react';

export default function BidList({ 
  farmId = null, 
  showFilters = true,
  onlyMyBids = false,
  title = "Bids"
}) {
  const { loading, error, getBids, getMyBids } = useFarm();
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [filters, setFilters] = useState({
    farm_id: farmId,
    status: ''
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchBids = async () => {
    try {
      let fetchedBids;
      if (onlyMyBids && user?.user_type === 'trader') {
        fetchedBids = await getMyBids(filters.status || null);
      } else {
        fetchedBids = await getBids(filters);
      }
      setBids(fetchedBids);
    } catch (err) {
      console.error("Error fetching bids:", err);
    }
  };

  useEffect(() => {
    fetchBids();
  }, [farmId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    fetchBids();
    if (window.innerWidth < 768) {
      setIsFilterOpen(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      farm_id: farmId,
      status: ''
    });
  };

  const toggleFilters = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      {/* Header with actions */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h2>
          <div className="ml-3 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {bids.length}
          </div>
        </div>
        
        {showFilters && !farmId && (
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={toggleFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 md:hidden"
            >
              <Filter size={16} />
              Filters
            </button>
            <button
              onClick={fetchBids}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              title="Refresh bids"
            >
              <RefreshCw size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Filters section */}
      {showFilters && !farmId && (
        <div className={`bg-gray-50 border-b border-gray-200 transition-all duration-300 ${isFilterOpen || window.innerWidth >= 768 ? 'block' : 'hidden md:block'}`}>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-600" />
                <h3 className="text-lg font-medium text-gray-800">Filter Bids</h3>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="m-6 p-4 text-red-700 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2">
          <div className="rounded-full bg-red-100 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            <p className="mt-4 text-sm text-gray-500">Loading bids...</p>
          </div>
        ) : bids.length === 0 ? (
          <div className="text-center py-12 px-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-gray-500 font-medium">No bids found matching your criteria.</p>
            <p className="mt-1 text-gray-400 text-sm">Try changing your filter options or check back later.</p>
            {!farmId && user?.user_type === 'trader' && (
              <Link href="/dashboard/trader/farms" className="mt-5 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Browse farms to place bids
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {bids.map(bid => (
              <BidCard key={bid.id} bid={bid} onStatusChange={fetchBids} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}