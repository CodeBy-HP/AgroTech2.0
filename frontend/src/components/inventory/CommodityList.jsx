'use client';

import { useState } from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function CommodityList({ 
  inventoryId, 
  commodities = [], 
  onUpdate,
  token
}) {
  const [expandedRows, setExpandedRows] = useState({});
  const [isDeleting, setIsDeleting] = useState(null);
  
  const toggleRowExpand = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const handleDelete = async (commodityId) => {
    setIsDeleting(commodityId);
    
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/commodities/${commodityId}`,
        { 
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      toast.success('Commodity deleted successfully');
      
      // Call the update callback to refresh the list
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting commodity:', error);
      toast.error('Failed to delete commodity. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };
  
  if (commodities.length === 0) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <p className="text-gray-500">No commodities added to this inventory yet.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price (₹)
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Harvested Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quality
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {commodities.map((commodity) => (
            <tr 
              key={commodity.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => toggleRowExpand(commodity.id)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">{commodity.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-gray-900">{commodity.quantity_available} MT</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-gray-900">₹{commodity.price_per_unit.toFixed(2)}/MT</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-gray-900">{formatDate(commodity.harvested_date)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {commodity.testing_score && (
                    <span className="mr-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {commodity.testing_score.toFixed(1)}%
                    </span>
                  )}
                  
                  {commodity.tested_by_platform && (
                    <span className="flex items-center text-xs text-green-600">
                      <FiCheck className="mr-1" /> Verified
                    </span>
                  )}
                  
                  {!commodity.testing_score && !commodity.tested_by_platform && (
                    <span className="text-gray-500">-</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                  <a 
                    href={`/dashboard/trader/inventories/${inventoryId}/commodities/${commodity.id}/edit`}
                    className="text-green-600 hover:text-green-900 p-1"
                  >
                    <FiEdit2 />
                  </a>
                  <button
                    className="text-red-600 hover:text-red-900 p-1"
                    onClick={() => handleDelete(commodity.id)}
                    disabled={isDeleting === commodity.id}
                  >
                    {isDeleting === commodity.id ? (
                      <span className="inline-block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <FiTrash2 />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Expanded row details */}
      {commodities.map((commodity) => 
        expandedRows[commodity.id] && (
          <div key={`details-${commodity.id}`} className="bg-gray-50 p-4 border-t border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">{commodity.name} Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Created: {formatDate(commodity.created_at)}</p>
                    {commodity.additional_info && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-900">Additional Information:</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{commodity.additional_info}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRowExpand(commodity.id);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX />
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
} 