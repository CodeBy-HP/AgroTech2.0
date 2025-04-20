'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFarm } from '@/context/FarmContext';
import Link from 'next/link';
import { formatDate, formatCurrency, formatBidStatus } from '@/utils/formatters';
import { AlertTriangle, CheckCircle, Clock, MapPin, Trash2, X } from 'lucide-react';

export default function BidCard({ bid, onStatusChange }) {
  const { user } = useAuth();
  const { getFarmById, updateBid, deleteBid } = useFarm();
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const loadFarm = async () => {
      try {
        const farmData = await getFarmById(bid.farm_id);
        setFarm(farmData);
      } catch (error) {
        console.error("Error loading farm details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFarm();
  }, [bid.farm_id]);

  const handleAcceptBid = async () => {
    try {
      await updateBid(bid.id, { status: 'accepted' });
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error("Error accepting bid:", error);
    }
  };

  const handleRejectBid = async () => {
    try {
      await updateBid(bid.id, { status: 'rejected' });
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error("Error rejecting bid:", error);
    }
  };

  const handleDeleteBid = async () => {
    try {
      await deleteBid(bid.id);
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error("Error deleting bid:", error);
    }
  };

  const renderButtons = () => {
    // For farmer: show accept/reject buttons for pending bids
    if (user?.user_type === 'farmer' && bid.status === 'pending') {
      return (
        <div className="mt-4 flex space-x-3">
          <button 
            onClick={handleAcceptBid}
            className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accept
          </button>
          <button 
            onClick={handleRejectBid}
            className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </button>
        </div>
      );
    }
    
    // For trader: show delete option for pending bids
    if (user?.user_type === 'trader' && bid.status === 'pending') {
      if (confirmDelete) {
        return (
          <div className="mt-4 flex flex-col space-y-3">
            <p className="text-sm text-red-600 font-medium">Are you sure you want to delete this bid?</p>
            <div className="flex space-x-3">
              <button 
                onClick={handleDeleteBid}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                Yes, Delete
              </button>
              <button 
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors flex items-center justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => setConfirmDelete(true)}
              className="py-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center text-sm"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete Bid
            </button>
          </div>
        );
      }
    }
    
    return null;
  };

  const getStatusIcon = () => {
    switch(bid.status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="w-full border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-6">
        {farm && (
          <div className="mb-4">
            <Link 
              href={user?.user_type === 'trader' ? `/dashboard/trader/farms/${farm.id}` : 
                    user?.user_type === 'farmer' ? `/dashboard/farmer/farms/${farm.id}` : '#'}
              className="text-lg font-semibold text-green-700 hover:underline flex items-center"
            >
              {farm.crop_type || 'Farm Produce'} 
              <span className="text-green-500 ml-1.5">→</span>
            </Link>
            <div className="flex items-center text-gray-500 mt-1 text-sm">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              {farm.farm_location}
            </div>
          </div>
        )}
        
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium mb-1">Bid Amount</p>
              <p className="text-base font-semibold text-gray-800">{formatCurrency(bid.bid_amount)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium mb-1">Bid Date</p>
              <p className="text-base font-semibold text-gray-800">{formatDate(bid.bid_date)}</p>
            </div>
          </div>
          
          {bid.trader_username && (
            <div className="text-sm text-gray-600 flex items-center">
              <span className="font-medium mr-1">Bidder:</span> {bid.trader_username}
            </div>
          )}
          
          <div className="flex items-center mt-3 space-x-2">
            <div className={`py-1 px-3 rounded-full text-xs font-medium flex items-center 
              ${bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                bid.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                'bg-red-100 text-red-800'}`}
            >
              {getStatusIcon()}
              <span className="ml-1.5">{formatBidStatus(bid.status)}</span>
            </div>
          </div>
        </div>
        
        {renderButtons()}
      </div>
    </div>
  );
}