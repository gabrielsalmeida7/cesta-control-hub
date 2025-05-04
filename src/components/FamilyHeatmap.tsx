
import React from 'react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Tipos para nossos dados de família
interface Family {
  id: number;
  name: string;
  members: number;
  lat: number;
  lng: number;
  status: string;
}

// Props do componente
interface FamilyHeatmapProps {
  families: Family[];
}

const FamilyHeatmap = ({ families }: FamilyHeatmapProps) => {
  // Coordenadas centrais para Araguari-MG
  const araguariCenter: LatLngExpression = [-18.6456, -48.1954];
  
  return (
    <div className="w-full h-96">
      <MapContainer 
        center={araguariCenter}
        zoom={14}
        className="h-full w-full rounded-md"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
        
        {families.map((family) => {
          // Determinamos a cor com base no status
          let color = 'blue';
          if (family.status === 'pendente') color = 'orange';
          if (family.status === 'bloqueada') color = 'red';
          
          // Determinamos o tamanho com base no número de membros
          const radius = Math.max(5, family.members * 2) * 15;
          
          // Criamos o marcador usando componente Circle do react-leaflet
          return (
            <Circle
              key={family.id}
              center={[family.lat, family.lng]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.6,
                color: color,
                weight: 1
              }}
            >
              <Popup>
                <b>{family.name}</b><br />
                Membros: {family.members}<br />
                Status: {family.status}
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default FamilyHeatmap;
