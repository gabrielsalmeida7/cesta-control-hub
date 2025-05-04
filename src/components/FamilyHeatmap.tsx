
import React from 'react';
import { MapContainer, TileLayer, Tooltip, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
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

// Componente customizado para os marcadores de círculo
const CircleMarkers = ({ families }: FamilyHeatmapProps) => {
  return (
    <>
      {families.map((family) => {
        // Determinamos a cor com base no status
        let color = 'blue';
        if (family.status === 'pendente') color = 'orange';
        if (family.status === 'bloqueada') color = 'red';
        
        // Determinamos o tamanho com base no número de membros
        const radius = Math.max(5, family.members * 2);
        
        // Criamos o marcador
        return L.circle([family.lat, family.lng], {
          radius: radius * 15,
          fillColor: color,
          fillOpacity: 0.6,
          color: color,
          weight: 1
        }).addTo(L.map).bindPopup(`
          <b>${family.name}</b><br>
          Membros: ${family.members}<br>
          Status: ${family.status}
        `);
      })}
    </>
  );
};

const FamilyHeatmap = ({ families }: FamilyHeatmapProps) => {
  // Coordenadas centrais para Araguari-MG
  const araguariCenter: LatLngExpression = [-18.6456, -48.1954];
  
  // Referência para acesso ao mapa
  const mapRef = React.useRef<L.Map | null>(null);
  
  // Efeito para adicionar marcadores após o carregamento do mapa
  React.useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      
      // Remove marcadores antigos
      map.eachLayer((layer) => {
        if (layer instanceof L.Circle) {
          map.removeLayer(layer);
        }
      });
      
      // Adiciona novos marcadores
      families.forEach((family) => {
        const color = family.status === 'ativa' ? 'blue' : 
                     family.status === 'pendente' ? 'orange' : 'red';
        
        const radius = Math.max(5, family.members * 2);
        
        L.circle([family.lat, family.lng], {
          radius: radius * 15,
          fillColor: color,
          fillOpacity: 0.6,
          color: color,
          weight: 1
        }).addTo(map)
         .bindPopup(`
            <b>${family.name}</b><br>
            Membros: ${family.members}<br>
            Status: ${family.status}
          `);
      });
    }
  }, [families]);

  return (
    <div className="w-full h-96">
      <MapContainer 
        whenCreated={(map) => { mapRef.current = map; }}
        className="h-full w-full rounded-md"
        center={araguariCenter}
        zoom={14}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
      </MapContainer>
    </div>
  );
};

export default FamilyHeatmap;
