import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from 'react-leaflet';
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

  // Get radius in meters for Circle (scales with zoom, maintains constant geographic area)
  function getRadiusInMetersForAQI(aqi) {
    if (aqi <= 50) return 500; // 0.5 km radius
    if (aqi <= 100) return 1000; // 1 km radius
    if (aqi <= 150) return 2000; // 2 km radius
    if (aqi <= 200) return 3500; // 3.5 km radius
    if (aqi <= 300) return 6000; // 6 km radius
    return 10000; // 10 km radius
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

        {/* Render markers for each air quality station */}
        {airData.map((point, index) => {
          const radiusInMeters = getRadiusInMetersForAQI(point.value);
          const fillColor = getAQIColor(point.value);

          return (
            <React.Fragment key={`marker-${point.id || index}`}>
              {/* Center point marker (fixed pixel size) */}
              <CircleMarker
                center={point.coordinates}
                radius={5}
                pathOptions={{
                  color: 'white',
                  weight: 1,
                  fillColor: fillColor,
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
              {/* Outer circle with constant geographic radius (scales with zoom) */}
              <Circle
                center={point.coordinates}
                radius={radiusInMeters}
                pathOptions={{
                  color: fillColor,
                  fillColor: fillColor,
                  fillOpacity: 0.18,
                  weight: 1
                }}
              >
                <Popup>
                  <div style={{ textAlign: 'center', minWidth: '150px' }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: fillColor,
                      marginBottom: '8px'
                    }}>
                      AQI: {point.value}
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>{point.location}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Last Updated: {new Date(point.lastUpdated).toLocaleString()}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#888',
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid #eee'
                    }}>
                      Radius: {(radiusInMeters / 1000).toFixed(1)} km
                    </div>
                  </div>
                </Popup>
              </Circle>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}