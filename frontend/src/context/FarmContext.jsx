'use client';

import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const FarmContext = createContext();

export function useFarm() {
  return useContext(FarmContext);
}

export function FarmProvider({ children }) {
  const { user, token } = useAuth();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Simple function to get auth header
  const getAuthHeader = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Test authentication before making requests
  const testAuth = async () => {
    if (!token) {
      console.error('No token available');
      return false;
    }

    try {
      const response = await axios.get(`${API_URL}/users/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Auth test successful:', response.status);
      return true;
    } catch (err) {
      console.error('Auth test failed:', err.response?.status || err.message);
      return false;
    }
  };

  // Farm functions
  const getFarms = async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          queryParams.append(key, value);
        }
      });
      
      const response = await axios.get(`${API_URL}/api/farms/?${queryParams.toString()}`, {
        headers: getAuthHeader()
      });
      
      setFarms(response.data);
      return response.data;
    } catch (err) {
      console.error('Get farms error:', err);
      setError('Failed to fetch farms');
      return []; // Return empty array instead of throwing
    } finally {
      setLoading(false);
    }
  };

  const getMyFarms = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${API_URL}/api/farms/my-farms/`, {
        headers: getAuthHeader()
      });
      
      setFarms(response.data);
      return response.data;
    } catch (err) {
      console.error('Get my farms error:', err);
      setError('Failed to fetch your farms');
      return []; // Return empty array instead of throwing
    } finally {
      setLoading(false);
    }
  };

  const getFarmById = async (farmId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${API_URL}/api/farms/${farmId}/`, {
        headers: getAuthHeader()
      });
      
      return response.data;
    } catch (err) {
      console.error('Get farm by ID error:', err);
      setError('Failed to fetch farm details');
      return null; // Return null instead of throwing
    } finally {
      setLoading(false);
    }
  };

  const createFarm = async (farmData) => {
    try {
      setLoading(true);
      setError('');
      
      // Check if user is authenticated
      if (!token) {
        setError('Authentication required');
        throw new Error('Authentication required');
      }
      
      // Test authentication before proceeding
      const isAuthenticated = await testAuth();
      if (!isAuthenticated) {
        setError('Authentication failed. Please log out and log in again.');
        throw new Error('Authentication failed');
      }
      
      // Make the API request with token in header
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('Creating farm - Token present:', !!token);
      console.log('Auth header:', `Bearer ${token.substring(0, 10)}...`);
      
      const response = await axios.post(`${API_URL}/api/farms/`, farmData, { headers });
      
      // Add new farm to the list
      setFarms(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error('Create farm error:', err);
      console.error('Token value:', token ? `${token.substring(0, 10)}...` : 'No token');
      console.error('API URL:', API_URL);
      const errorMessage = 'Failed to create farm';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const uploadFarmImages = async (farmId, imageFiles) => {
    try {
      setLoading(true);
      setError('');
      
      // Check if user is authenticated
      if (!token) {
        setError('Authentication required');
        throw new Error('Authentication required');
      }
      
      // Create form data for image upload
      const formData = new FormData();
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
      
      // Make the API request with token in header
      const headers = {
        'Authorization': `Bearer ${token}`
        // NOTE: Do not set Content-Type header for FormData, 
        // axios will set it automatically with the correct boundary
      };
      
      const response = await axios.post(
        `${API_URL}/api/farms/${farmId}/images/`, 
        formData, 
        { headers }
      );
      
      return response.data;
    } catch (err) {
      console.error('Upload farm images error:', err);
      const errorMessage = 'Failed to upload farm images';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getFarmImages = async (farmId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${API_URL}/api/farms/${farmId}/images/`, {
        headers: getAuthHeader()
      });
      
      return response.data;
    } catch (err) {
      console.error('Get farm images error:', err);
      setError('Failed to fetch farm images');
      return []; // Return empty array instead of throwing
    } finally {
      setLoading(false);
    }
  };

  const deleteFarmImage = async (imageId) => {
    try {
      setLoading(true);
      setError('');
      
      await axios.delete(`${API_URL}/api/farms/images/${imageId}`, {
        headers: getAuthHeader()
      });
      
      return true;
    } catch (err) {
      console.error('Delete farm image error:', err);
      setError('Failed to delete farm image');
      return false; // Return false instead of throwing
    } finally {
      setLoading(false);
    }
  };

  const updateFarm = async (farmId, farmData) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.put(`${API_URL}/api/farms/${farmId}/`, farmData, {
        headers: getAuthHeader()
      });
      
      // Update farm in the list
      setFarms(prev => prev.map(farm => 
        farm.id === farmId ? response.data : farm
      ));
      
      return response.data;
    } catch (err) {
      console.error('Update farm error:', err);
      setError('Failed to update farm');
      return null; // Return null instead of throwing
    } finally {
      setLoading(false);
    }
  };

  const deleteFarm = async (farmId) => {
    try {
      setLoading(true);
      setError('');
      
      await axios.delete(`${API_URL}/api/farms/${farmId}/`, {
        headers: getAuthHeader()
      });
      
      // Remove farm from the list
      setFarms(prev => prev.filter(farm => farm.id !== farmId));
      
      return true;
    } catch (err) {
      console.error('Delete farm error:', err);
      setError('Failed to delete farm');
      return false; // Return false instead of throwing
    } finally {
      setLoading(false);
    }
  };

  const value = {
    farms,
    loading,
    error,
    getFarms,
    getMyFarms,
    getFarmById,
    createFarm,
    updateFarm,
    deleteFarm,
    uploadFarmImages,
    getFarmImages,
    deleteFarmImage
  };
  
  return (
    <FarmContext.Provider value={value}>
      {children}
    </FarmContext.Provider>
  );
} 