'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Create a client-only Map component
const Map = ({ position, setPosition, defaultCenter }) => {
  // Import Leaflet components only on the client side
  const { MapContainer, TileLayer, Marker, useMapEvents, LayersControl, LayerGroup } = require('react-leaflet');
  require('leaflet/dist/leaflet.css');
  const L = require('leaflet');

  const { BaseLayer } = LayersControl;

  // Fix for default marker icons in Leaflet with Next.js
  // Define icon inside the component so it only runs on client
  const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // This component handles map clicks and marker positioning
  function LocationMarker({ position, setPosition }) {
    const map = useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      }
    });

    // Center the map on the marker when position changes
    useEffect(() => {
      if (position) {
        map.flyTo(position, map.getZoom());
      }
    }, [position, map]);

    return position ? <Marker position={position} icon={icon} /> : null;
  }

  // Fix Leaflet's default icon path - only run once
  useEffect(() => {
    // This fixes the missing icon issue
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer
      center={position || defaultCenter}
      zoom={position ? 13 : 5}
      style={{ height: '100%', width: '100%' }}
    >
      <LayersControl position="topright">
        <BaseLayer checked name="Street Map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </BaseLayer>
        <BaseLayer name="Satellite">
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> | Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </BaseLayer>
        <BaseLayer name="Hybrid">
          <LayerGroup>
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> | Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}{r}.png"
              opacity={0.7}
            />
          </LayerGroup>
        </BaseLayer>
      </LayersControl>
      <LocationMarker position={position} setPosition={setPosition} />
    </MapContainer>
  );
};

// Use dynamic import with no SSR for the Map component
const MapWithNoSSR = dynamic(() => Promise.resolve(Map), {
  ssr: false
});

export default function MapPicker({ onLocationSelect, initialLat, initialLng }) {
  // Default center (India)
  const defaultCenter = [20.5937, 78.9629];
  
  // Parse initial coordinates safely
  const getInitialPosition = () => {
    if (initialLat && initialLng) {
      const lat = parseFloat(initialLat);
      const lng = parseFloat(initialLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }
    return null;
  };
  
  const [position, setPosition] = useState(getInitialPosition());
  const [searchQuery, setSearchQuery] = useState('');
  const positionReported = useRef(false);

  // Use memoized callback for position updates to prevent unnecessary re-renders
  const updatePosition = useCallback((newPosition) => {
    setPosition(newPosition);
  }, []);

  // Report position changes back to parent without causing infinite loops
  useEffect(() => {
    if (position && onLocationSelect) {
      if (!positionReported.current || 
          (positionReported.current && position[0] !== parseFloat(initialLat) && position[1] !== parseFloat(initialLng))) {
        onLocationSelect(position[0], position[1]);
        positionReported.current = true;
      }
    }
  }, [position, onLocationSelect, initialLat, initialLng]);

  // Handle the location search
  const handleSearch = async (e) => {
    // Prevent default only if called from a form event
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!searchQuery.trim()) return;
    
    try {
      // Use Nominatim API for geocoding (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        updatePosition([parseFloat(lat), parseFloat(lon)]);
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      alert('Failed to search for location. Please try again.');
    }
  };

  // Handle keyboard event to search on Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      handleSearch();
    }
  };

  // Clear position and reset the flag
  const handleClearPosition = () => {
    updatePosition(null);
    positionReported.current = false;
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a location (e.g. Nagpur, Maharashtra)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-green-500 focus:border-green-500"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-sm">
        <p className="text-gray-700 mb-1">
          <strong>Instructions:</strong>
        </p>
        <ol className="list-decimal pl-5 space-y-1 text-gray-600">
          <li>Search for your inventory's location using the search box</li>
          <li>Click on the map to place a marker at your exact inventory location</li>
          <li>The latitude and longitude will update automatically</li>
          <li>Use the layers control <span className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">⊞</span> in the top-right corner to switch between street, satellite, and hybrid views</li>
        </ol>
      </div>
      
      <div className="h-96 rounded-lg overflow-hidden border border-gray-300">
        <MapWithNoSSR
          position={position}
          setPosition={updatePosition}
          defaultCenter={defaultCenter}
        />
      </div>
      
      {position && (
        <div className="flex justify-between items-center bg-green-50 p-3 rounded-md border border-green-200">
          <div>
            <p className="text-sm text-gray-700">Selected coordinates:</p>
            <p className="font-medium">
              Latitude: {position[0].toFixed(6)}, Longitude: {position[1].toFixed(6)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearPosition}
            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
} 