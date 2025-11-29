import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchAirQualityData, getAQIColor } from '../../services/aqicnService'; // <-- UPDATED

export default function MapPage() {
  const [centerPos] = useState([4.2105, 101.9758]); // Center of Malaysia
  const [airData, setAirData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const results = await fetchAirQualityData();
      
      // Strict safety filter to prevent Map crashes
      const safeResults = results.filter(r => 
        r.value !== null &&
        Array.isArray(r.coordinates) && 
        r.coordinates.length === 2 &&
        typeof r.coordinates[0] === 'number' && !isNaN(r.coordinates[0]) &&
        typeof r.coordinates[1] === 'number' && !isNaN(r.coordinates[1])
      );

      console.log(`Map loaded with ${safeResults.length} valid points.`);
      setAirData(safeResults);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading Air Quality Data...</h2>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <MapContainer center={centerPos} zoom={7} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <TileLayer
          attribution='TomTom Traffic'
          url="https://api.tomtom.com/traffic/map/4/tile/flow/absolute/{z}/{x}/{y}.png?key=a6d3383c-e57d-461d-886b-c95a5f4c53a1"
          maxZoom={18}
          minZoom={0}
          zIndex={1000}
        />

        {/* The HeatmapLayer rendering has been removed */}

        {/* Render CircleMarkers for each air quality station */}
        {airData.map((point, index) => (
          <CircleMarker 
            // Use point.id if available, otherwise fallback to index.
            key={point.id || index} 
            center={point.coordinates} 
            radius={5} 
            pathOptions={{ 
              color: 'white', 
              weight: 1,
              fillColor: getAQIColor(point.value), 
              fillOpacity: 0.9 
            }}
          >
            <Popup>
              <div>
                <strong>{point.location}</strong>
                <br />
                AQI: {point.value}
                <br />
                Last Updated: {new Date(point.lastUpdated).toLocaleString()}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}