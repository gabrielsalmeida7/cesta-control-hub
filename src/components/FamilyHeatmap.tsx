
import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';

// Mock family locations with heatmap data
const familyLocations = [
  { id: 1, lat: -23.550520, lng: -46.633308, density: 8, name: "Centro" }, // São Paulo
  { id: 2, lat: -23.627, lng: -46.635, density: 5, name: "Santo Amaro" },
  { id: 3, lat: -23.559, lng: -46.589, density: 10, name: "Tatuapé" }, 
  { id: 4, lat: -23.503, lng: -46.613, density: 7, name: "Santana" },
  { id: 5, lat: -23.592, lng: -46.673, density: 6, name: "Morumbi" },
  { id: 6, lat: -23.526, lng: -46.662, density: 9, name: "Pinheiros" },
  { id: 7, lat: -23.571, lng: -46.701, density: 4, name: "Butantã" },
  { id: 8, lat: -23.616, lng: -46.599, density: 7, name: "Saúde" },
];

interface FamilyHeatmapProps {
  institution?: string;
  period?: string;
}

const FamilyHeatmap: React.FC<FamilyHeatmapProps> = ({ institution, period }) => {
  const [filteredLocations, setFilteredLocations] = useState(familyLocations);
  const mapCenter: LatLngExpression = [-23.55, -46.63]; // São Paulo coordinates

  // Filter locations based on props (in a real app, this would use actual filters)
  useEffect(() => {
    // This is a mock implementation - in a real app you'd filter based on actual data
    if (institution || period) {
      // Simple random filter for demonstration
      const filtered = familyLocations.filter(() => Math.random() > 0.3);
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(familyLocations);
    }
  }, [institution, period]);

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer 
        className="h-full w-full"
        center={mapCenter}
        zoom={11} 
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {filteredLocations.map((location) => (
          <CircleMarker 
            key={location.id}
            center={[location.lat, location.lng] as LatLngExpression}
            pathOptions={{
              fillColor: "#ef4444",
              fillOpacity: 0.6,
              color: "#b91c1c",
              weight: 1,
            }}
            radius={location.density * 2}
          >
            <Tooltip>
              <div className="p-1">
                <strong>{location.name}</strong>
                <div>{location.density} famílias</div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default FamilyHeatmap;
