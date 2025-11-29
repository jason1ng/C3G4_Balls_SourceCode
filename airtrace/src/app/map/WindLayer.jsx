// WindLayer.jsx
import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-velocity/dist/leaflet-velocity.css';
import 'leaflet-velocity';

import { fetchOWMWindForRegion } from '../../services/windyService';

const WindLayer = ({ show }) => {
  const map = useMap();
  const [velocityLayer, setVelocityLayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const layerRef = useRef(null); // Use ref to track current layer for cleanup
  const fetchTimeoutRef = useRef(null); // For debouncing

  // Cleanup function to remove layer
  const removeLayer = () => {
    if (layerRef.current) {
      try {
        if (map.hasLayer(layerRef.current)) {
          map.removeLayer(layerRef.current);
        }
      } catch (error) {
        console.warn('Error removing wind layer:', error);
      }
      layerRef.current = null;
      setVelocityLayer(null);
    }
  };

  useEffect(() => {
    // Clear any pending fetches
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    if (!show) {
      // Remove layer immediately when hidden
      removeLayer();
      setIsLoading(false);
      return;
    }

    // Remove old layer immediately before fetching new data
    // This prevents showing previous markers during zoom/pan
    removeLayer();

    // --- Fetch Data from OpenWeatherMap API for Southeast Asia ---
    const fetchWindData = async () => {
      setIsLoading(true);
      
      try {
        console.log('Fetching wind data for Southeast Asia from OpenWeatherMap API...');
        
        // Use Southeast Asia region by default
        const windData = await fetchOWMWindForRegion('SOUTHEAST_ASIA');
        
        if (!windData || windData.length < 2) {
          console.error('OWM: Invalid wind data received.');
          setIsLoading(false);
          return;
        }

        // Double-check that show is still true (user might have toggled it off)
        // Also ensure we don't have a layer already (race condition prevention)
        if (!show || layerRef.current) {
          setIsLoading(false);
          return;
        }

        // --- Initialize and Add Leaflet-Velocity Layer ---
        const newVelocityLayer = L.velocityLayer({
          displayValues: true,
          displayOptions: {
            velocityType: 'wind',
            position: 'bottomleft',
            emptyString: 'No wind data',
            angleConvention: 'bearingCCW', // Standard for wind data
            speedUnit: 'ms' // meters per second
          },
          data: windData,
          minVelocity: 0,
          maxVelocity: 30, // Adjust based on your region's typical wind speeds
          velocityScale: 0.005, // Adjust for visual appearance
          colorScale: ['#ffffff', '#00aaff', '#0066ff', '#0033ff', '#0000ff'], // Blue gradient
          opacity: 0.65,
          particleMultiplier: 1/200, // Adjust particle density
          lineWidth: 2,
          frameRate: 20
        });

        // Store in ref and state
        layerRef.current = newVelocityLayer;
        setVelocityLayer(newVelocityLayer);

        // Add to map
        map.addLayer(newVelocityLayer);
        
        console.log('Wind layer added successfully for Southeast Asia');
        setIsLoading(false);

      } catch (error) {
        console.error('Error fetching OWM wind data:', error);
        setIsLoading(false);
        // Clean up on error
        removeLayer();
      }
    };

    // Fetch data immediately when show becomes true
    fetchWindData();
    
    // Cleanup function - remove layer when component unmounts or show changes
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      removeLayer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]); // Only depend on 'show', not 'map' to avoid re-fetching on zoom/pan

  // Show loading indicator (optional)
  if (isLoading && show) {
    console.log('Loading wind data...');
  }

  return null;
};

export default WindLayer;
