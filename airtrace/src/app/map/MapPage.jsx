import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Services
import { fetchAirQualityData, getAQIColor } from '../../services/aqicnService';
import { windyLayers } from '../../services/windyService';

// Destructure LayersControl for cleaner code
const { BaseLayer, Overlay } = LayersControl;

export default function MapPage() {
  const [centerPos] = useState([3.1319, 101.6841]); // Centered on Kuala Lumpur for better demo
  const [airData, setAirData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const results = await fetchAirQualityData();
      
      const safeResults = results.filter(r =>
        r.value !== null &&
        Array.isArray(r.coordinates) &&
        r.coordinates.length === 2 &&
        typeof r.coordinates[0] === 'number' &&
        typeof r.coordinates[1] === 'number'
      );

      console.log(`Map loaded with ${safeResults.length} valid points.`);
      setAirData(safeResults);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", marginTop: "20%" }}>
        <h2>Loading Intelligent Map Data...</h2>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <MapContainer 
        center={centerPos} 
        zoom={10} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="topright">
          
          {/* Base Maps Group */}
          <BaseLayer checked name="Standard Map">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>

          <BaseLayer name="Dark Mode (CartoDB)">
             <TileLayer
              attribution='&copy; CartoDB'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </BaseLayer>

          {/* Overlays Group (Toggleable) */}
          
          <Overlay checked name="Live Traffic (TomTom)">
            <TileLayer
              attribution="TomTom Traffic"
              url="https://api.tomtom.com/traffic/map/4/tile/flow/absolute/{z}/{x}/{y}.png?key=a6d3383c-e57d-461d-886b-c95a5f4c53a1"
              zIndex={500}
            />
          </Overlay>

          <Overlay name="NO2 Pollution (Car Fumes)">
            <TileLayer
              attribution="OpenWeatherMap"
              url={windyLayers.no2}
              opacity={0.5}
              zIndex={400}
            />
          </Overlay>

          <Overlay name="PM 2.5 (Haze)">
            <TileLayer
              attribution="OpenWeatherMap"
              url={windyLayers.pm25}
              opacity={0.5}
              zIndex={400}
            />
          </Overlay>

          <Overlay checked name="Monitoring Stations">
            <div style={{ display: 'none' }}> 
            {/* This div is a hack to group the markers in the control, 
                Logic below handles actual rendering because Markers aren't layers in the same way */}
            </div>
          </Overlay>

        </LayersControl>

        {/* Render Air Station Points always, or wrap in logic if you want to toggle them */}
        {airData.map((point, index) => (
          <CircleMarker
            key={point.id || index}
            center={point.coordinates}
            radius={8} // Slightly larger for visibility
            pathOptions={{
              color: "white",
              weight: 2,
              fillColor: getAQIColor(point.value),
              fillOpacity: 0.8,
            }}
          >
            <Popup>
              <div style={{textAlign: 'center'}}>
                <strong style={{fontSize: '14px'}}>{point.location}</strong>
                <hr style={{margin: '5px 0'}}/>
                <div style={{fontSize: '16px', fontWeight: 'bold', color: getAQIColor(point.value)}}>
                   AQI: {point.value}
                </div>
                <div style={{fontSize: '10px', color: '#666'}}>
                  Updated: {new Date(point.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

      </MapContainer>
    </div>
  );
}