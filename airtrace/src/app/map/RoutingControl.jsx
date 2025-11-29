import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Fix for default marker icons missing in Leaflet
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

const RoutingControl = ({ start, end, onRoutesFound }) => {
  const map = useMap();

  useEffect(() => {
    if (!start || !end) return;

    // Create the Routing Control
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      routeWhileDragging: true,
      showAlternatives: true, // Show multiple paths
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: "#007bff", weight: 6, opacity: 0.7 }] // Default Blue
      },
      // Customize the markers
      createMarker: function (i, waypoint, n) {
        const markerIcon = L.icon({
          iconUrl: markerIconPng,
          shadowUrl: markerShadowPng,
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });
        return L.marker(waypoint.latLng, {
          draggable: true,
          icon: markerIcon
        });
      },
      // Remove the default text panel so we can build our own beautiful UI
      // (Optional: set to false if you want the default ugly white box)
      containerClassName: 'routing-hidden-container' 
    }).addTo(map);

    // Listen for routes found to pass data back to your "AI" panel
    routingControl.on("routesfound", function (e) {
      const routes = e.routes;
      const routeData = routes.map((r, index) => ({
        id: index,
        name: r.name,
        summary: r.summary, // { totalDistance, totalTime }
        coordinates: r.coordinates,
        // Mocking "AI" Reasoning for the Demo
        trafficLevel: index === 0 ? "High" : "Low", 
        pollutionLevel: index === 0 ? 120 : 45, // First route dirty, second clean
        isRecommended: index !== 0
      }));
      
      if (onRoutesFound) {
        onRoutesFound(routeData);
      }
    });

    return () => {
      map.removeControl(routingControl);
    };
  }, [start, end, map]);

  return null;
};

export default RoutingControl;