import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// COMPONENTS & SERVICES (Ensure these paths are correct in your project)
import RoutingControl from './RoutingControl';
import WindLayer from './WindLayer';
import { fetchAirQualityData, getAQIColor } from '../../services/aqicnService';

// --- ICONS ---
// Fix for custom marker icons using external URLs
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// --- HELPER FUNCTIONS ---

/**
 * Converts seconds to a human-readable time string (e.g., "1h 30m").
 */
const formatTime = (seconds) => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Calculates a radius size (in meters) for the AQI Circle.
 * Makes highly polluted areas look visually larger/more concerning.
 */
const getRadiusInMetersForAQI = (aqi) => {
  if (aqi === null) return 0;
  // Use a logarithmic scale for better visualization on a map
  return 2000 * Math.log(aqi + 1); 
};


// --- MAP CLICK HANDLER COMPONENT ---

/**
 * Component to listen for map clicks and set the start/end points.
 */
const MapClickHandler = ({ setStart, setEnd, mode }) => {
  useMapEvents({
    click: (e) => {
      if (mode === 'start') {
        setStart([e.latlng.lat, e.latlng.lng]);
      } else if (mode === 'end') {
        setEnd([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
};


// ----------------------------------------------------------------------------------
// --- MAIN COMPONENT ---
// ----------------------------------------------------------------------------------

export default function MapPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [centerPos] = useState([3.1473, 101.6991]); 
  const [airData, setAirData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [selectionMode, setSelectionMode] = useState(null); 
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(null);
  
  // TOGGLES & BASE LAYER STATE
  const [showTraffic, setShowTraffic] = useState(false); 
  const [showWind, setShowWind] = useState(false); 
  // NEW: State for switching base map style
  const [baseLayerUrl, setBaseLayerUrl] = useState("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");


  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch (error) { console.error(error); }
  };

  const handleClearAll = () => {
    setStartPoint(null); setEndPoint(null); setRoutes([]);
    setSelectedRouteIdx(null); setSelectionMode(null);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const results = await fetchAirQualityData();
      
      // Basic coordinate validation/fix
      const safeResults = results
        .map(r => {
            let lat = r.coordinates[0];
            let lng = r.coordinates[1];
            // Simple check to swap (lng, lat) to (lat, lng) if the API returns them swapped
            if (Math.abs(lat) > 90) return { ...r, coordinates: [lng, lat] }; 
            return r;
        })
        .filter(r => r.value !== null && Array.isArray(r.coordinates));

      setAirData(safeResults);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleRouteSelect = (idx) => {
    setSelectedRouteIdx(idx);
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative", display: "flex", flexDirection: "row" }}>
      
      {/* --- MAP (Left) --- */}
      <div style={{ flex: 1, height: "100%", position: "relative" }}>
        
        {loading && <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "white", padding: "10px 20px", borderRadius: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>Loading Air Data...</div>}

        <MapContainer center={centerPos} zoom={11} style={{ height: "100%", width: "100%" }}>
          
          {/* Base Layer - NOW DYNAMIC */}
          <TileLayer
            attribution='&copy; OpenStreetMap | CartoDB'
            url={baseLayerUrl}
          />
          
          {/* TRAFFIC LAYER */}
          {showTraffic && (
            <TileLayer
              attribution='Google Maps'
              url="https://mt0.google.com/vt/lyrs=m,traffic&hl=en&x={x}&y={y}&z={z}"
              maxZoom={20}
              zIndex={500}
            />
          )}

          {/* WIND LAYER (New) */}
          <WindLayer show={showWind} />
          
          {/* Pollution Dots */}
          {airData.map((point, index) => {
             const radiusInMeters = getRadiusInMetersForAQI(point.value);
             const fillColor = getAQIColor(point.value);
             
             const PopupContent = (
               <Popup>
                  <div style={{ textAlign: 'center', minWidth: '150px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: fillColor, marginBottom: '8px' }}>
                      AQI: {point.value}
                    </div>
                    <div><strong>{point.location}</strong></div>
                  </div>
                </Popup>
             );

             return (
                <React.Fragment key={`marker-${point.id || index}`}>
                    {/* The marker is small and dense */}
                    <CircleMarker center={point.coordinates} radius={4} pathOptions={{ color: 'transparent', fillColor: fillColor, fillOpacity: 0.9 }}>
                      {PopupContent}
                    </CircleMarker>
                    {/* The circle highlights the influence area */}
                    <Circle center={point.coordinates} radius={radiusInMeters} pathOptions={{ color: fillColor, fillColor: fillColor, fillOpacity: 0.15, weight: 1 }}>
                      {PopupContent}
                    </Circle>
                </React.Fragment>
             );
          })}

          {startPoint && <Marker position={startPoint} icon={startIcon}><Popup>Start Point</Popup></Marker>}
          {endPoint && <Marker position={endPoint} icon={endIcon}><Popup>Destination</Popup></Marker>}

          <MapClickHandler setStart={setStartPoint} setEnd={setEndPoint} mode={selectionMode} />
          {startPoint && endPoint && <RoutingControl start={startPoint} end={endPoint} onRoutesFound={setRoutes} selectedRouteIdx={selectedRouteIdx} />}

        </MapContainer>
      </div>

      {/* --- SIDEBAR (Right) --- */}
      <div style={{ width: "380px", height: "100%", background: "#f4f7f6", padding: "25px", display: "flex", flexDirection: "column", overflowY: "auto", borderLeft: "1px solid #e1e5e8", zIndex: 1000 }}>
        
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ color: "#0C2B4E", margin: 0 }}>Route Planner</h2>
          <button onClick={handleLogout} style={{ background: "white", color: "#d32f2f", border: "1px solid #ffcccb", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}>Log Out</button>
        </div>

        {/* CONTROLS SECTION */}
        <div style={{ background: "white", padding: "12px", borderRadius: "10px", marginBottom: "15px", border: "1px solid #e1e5e8", boxShadow: "0 2px 5px rgba(0,0,0,0.03)" }}>
           
           {/* Base Layer Control */}
           <div style={{ background: "white", padding: "0 0 10px 0", borderRadius: "10px", borderBottom: "1px solid #eee", marginBottom: "10px" }}>
               <div style={{ fontWeight: "600", color: "#0C2B4E", marginBottom: "10px" }}>Map Style 🗺️</div>
               <div style={{ display: "flex", gap: "10px" }}>
                   <button 
                       onClick={() => setBaseLayerUrl("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")} 
                       style={{ flex: 1, padding: "8px", borderRadius: "6px", border: baseLayerUrl.includes("openstreetmap") ? "2px solid #0C2B4E" : "1px solid #ccc", background: "white", cursor: "pointer" }}
                   >
                       Default
                   </button>
                   <button 
                       onClick={() => setBaseLayerUrl("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png")} 
                       style={{ flex: 1, padding: "8px", borderRadius: "6px", border: baseLayerUrl.includes("cartocdn") ? "2px solid #0C2B4E" : "1px solid #ccc", background: "white", cursor: "pointer" }}
                   >
                       Clean/Light
                   </button>
               </div>
           </div>

           {/* Traffic Toggle */}
           <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
             <input type="checkbox" id="trafficToggle" checked={showTraffic} onChange={(e) => setShowTraffic(e.target.checked)} style={{ width: "18px", height: "18px", marginRight: "10px", accentColor: "#0C2B4E" }} />
             <label htmlFor="trafficToggle" style={{ fontWeight: "600", color: "#333", flex: 1 }}>Show Live Traffic 🚦</label>
           </div>

           {/* Wind Toggle */}
           <div style={{ display: "flex", alignItems: "center" }}>
             <input type="checkbox" id="windToggle" checked={showWind} onChange={(e) => setShowWind(e.target.checked)} style={{ width: "18px", height: "18px", marginRight: "10px", accentColor: "#0C2B4E" }} />
             <label htmlFor="windToggle" style={{ fontWeight: "600", color: "#333", flex: 1 }}>Show Wind Flow 🌬️</label>
           </div>

        </div>

        {/* INPUTS SECTION */}
        <div style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "20px" }}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "5px" }}>Start Point</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input value={startPoint ? `${startPoint[0].toFixed(4)}, ${startPoint[1].toFixed(4)}` : ""} placeholder="Click map..." readOnly style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0", backgroundColor: selectionMode === 'start' ? "#e6fffa" : "#fff" }} />
              <button onClick={() => setSelectionMode('start')} style={{ background: "green", color: "white", border: "none", borderRadius: "6px", padding: "0 15px", cursor: "pointer" }}>Set</button>
            </div>
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "5px" }}>Destination</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input value={endPoint ? `${endPoint[0].toFixed(4)}, ${endPoint[1].toFixed(4)}` : ""} placeholder="Click map..." readOnly style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0", backgroundColor: selectionMode === 'end' ? "#fff5f5" : "#fff" }} />
              <button onClick={() => setSelectionMode('end')} style={{ background: "red", color: "white", border: "none", borderRadius: "6px", padding: "0 15px", cursor: "pointer" }}>Set</button>
            </div>
          </div>
          <button onClick={handleClearAll} style={{ width: "100%", background: "#f8f9fa", padding: "10px", borderRadius: "6px", border: "1px solid #ddd", cursor: "pointer" }}>🔄 Clear All</button>
        </div>

        {/* ROUTES DISPLAY */}
        {routes.length > 0 && (
          <div>
            <h3 style={{ color: "#0C2B4E", fontSize: "1.1rem", borderBottom: "2px solid #e1e5e8", paddingBottom: "10px" }}>AI Route Analysis</h3>
            {routes.map((route, i) => (
              <div key={i} onClick={() => handleRouteSelect(i)} style={{ border: selectedRouteIdx === i ? "2px solid #0C2B4E" : "1px solid #ddd", borderRadius: "10px", padding: "15px", marginBottom: "10px", background: "white", cursor: "pointer" }}>
                <h4 style={{ margin: "0 0 5px 0", color: i === 0 ? "#d32f2f" : "#28a745" }}>Route {i + 1}</h4>
                <div style={{ fontSize: "0.9rem", color: "#555" }}>⏳ {formatTime(route.summary.totalTime)} | {(route.summary.totalDistance / 1000).toFixed(1)} km</div>
                <div style={{ fontSize: "0.8rem", marginTop: "5px" }}>Pollution Impact: <b>{route.pollutionLevel} AQI</b></div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}