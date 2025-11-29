// WindLayer.jsx

// 1. We now only need TileLayer from react-leaflet
import { TileLayer } from 'react-leaflet'; 

// 2. Import the OWM wind tile URL from your service file
// Adjust the relative path (../../) if your file structure is different.
import { windyLayers } from '../../services/windyService'; 

// All code related to leaflet, leaflet-velocity, GFS_WIND_DATA_URL, 
// WIND_COLOR_SCALE, getParticleMultiplier, useMap, and useEffect is removed.

const WindLayer = ({ show }) => {
  // If the 'show' prop is false, render nothing (hiding the layer)
  if (!show) {
    return null;
  }
  
  // Retrieve the OWM Wind Tile Layer URL
  const OWM_WIND_URL = windyLayers.wind; 
  
  return (
    // Render a React-Leaflet TileLayer component
    <TileLayer
      // Use the OWM wind tile URL
      url={OWM_WIND_URL}
      
      // Standard layer options
      attribution="Wind data &copy; OpenWeatherMap"
      maxZoom={19}
      
      // Optional styling for better map integration
      opacity={0.65} 
      zIndex={501} // Ensure it sits above the base map
    />
  );
};

export default WindLayer;