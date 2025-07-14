'use client';

import React, { useEffect, useRef, useState } from 'react';
import L, {
  Map as LeafletMap,
  Polyline as LeafletPolyline,
  Marker as LeafletMarker,
} from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LatLon {
  lat: number;
  lon: number;
}

interface Agent {
  id: number;
  full_name: string;
  last_location: {
    latitude: number;
    longitude: number;
  } | null;
}

type AgentPathMap = Record<number, [number, number][]>;

function calculateDistance(path: [number, number][]) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  let total = 0;

  for (let i = 1; i < path.length; i++) {
    const [lat1, lon1] = path[i - 1];
    const [lat2, lon2] = path[i];

    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += R * c;
  }

  return total.toFixed(2);
}

const RealTimeMap: React.FC = () => {
  const mapRef = useRef<LeafletMap | null>(null);
  const polylineRef = useRef<LeafletPolyline | null>(null);
  const startMarkersMap = useRef<Record<number, LeafletMarker>>({});
  const stopMarkersRef = useRef<LeafletMarker[]>([]);

  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentPaths, setAgentPaths] = useState<AgentPathMap>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('agentPaths');
      if (stored) {
        setAgentPaths(JSON.parse(stored));
      }
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map').setView([39.65, 66.95], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      mapRef.current = map;
    }
  }, []);

  const updateMap = (path: [number, number][], agentId: number) => {
    if (!mapRef.current || path.length === 0) return;

    polylineRef.current?.remove();
    polylineRef.current = L.polyline(path, { color: 'blue' }).addTo(mapRef.current);
    mapRef.current.setView(path[path.length - 1], 13);

    // Boshlanish nuqtasi (agar hali qo‘yilmagan bo‘lsa)
    if (!startMarkersMap.current[agentId] && path.length >= 1) {
      const startMarker = L.marker(path[0])
        .addTo(mapRef.current)
        .bindPopup('Boshlanish nuqtasi')
        .openPopup();
      startMarkersMap.current[agentId] = startMarker;
    }

    // To‘xtash joylarini aniqlash
    stopMarkersRef.current.forEach(marker => marker.remove());
    stopMarkersRef.current = [];

    const counts: Record<string, number> = {};
    for (const [lat, lon] of path) {
      const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
      counts[key] = (counts[key] || 0) + 1;

      if (counts[key] === 3) {
        const stopMarker = L.marker([lat, lon])
          .addTo(mapRef.current)
          .bindPopup(`To‘xtash joyi<br/>Jami masofa: ${calculateDistance(path)} km`);
        stopMarkersRef.current.push(stopMarker);
      }
    }
  };

  useEffect(() => {
    if (selectedAgentId && agentPaths[selectedAgentId]) {
      updateMap(agentPaths[selectedAgentId], selectedAgentId);
    }
  }, [selectedAgentId, agentPaths]);

  useEffect(() => {
    const socket = new WebSocket('wss://gps.mxsoft.uz/ws/location/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc1Mjg5OTA2NiwiaWF0IjoxNzUyNDY3MDY2LCJqdGkiOiJjZWVkNGZjZGU2Y2I0MTZiYTgyNjgxM2ViNzRjN2I4OCIsInVzZXJfaWQiOjF9.w26E7DbV9F9RxUZKRYPYNWnF65fsd6xtvChIa0Hq4oE');

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.agents_data) {
          setAgents(data.agents_data);

          const updatedPaths: AgentPathMap = { ...agentPaths };

          for (const agent of data.agents_data) {
            const { id, last_location } = agent;
            if (!last_location) continue;

            const newPoint: [number, number] = [last_location.latitude, last_location.longitude];
            const prevPath = updatedPaths[id] || [];
            const lastPoint = prevPath[prevPath.length - 1];

            if (!lastPoint || lastPoint[0] !== newPoint[0] || lastPoint[1] !== newPoint[1]) {
              updatedPaths[id] = [...prevPath, newPoint];
            }
          }

          setAgentPaths(updatedPaths);
          localStorage.setItem('agentPaths', JSON.stringify(updatedPaths));
        }
      } catch (err) {
        console.error('❌ JSON parsing error:', err);
      }
    };

    return () => socket.close();
  }, [agentPaths]);

  const handleClear = () => {
    localStorage.removeItem('agentPaths');
    setAgentPaths({});
    polylineRef.current?.remove();
    Object.values(startMarkersMap.current).forEach(marker => marker.remove());
    startMarkersMap.current = {};
    stopMarkersRef.current.forEach(marker => marker.remove());
    stopMarkersRef.current = [];
  };

  return (
    <div>
      <select
        value={selectedAgentId ?? ''}
        onChange={(e) => setSelectedAgentId(Number(e.target.value))}
        style={{ margin: '10px', padding: '5px' }}
      >
        <option value="">Agent tanlang</option>
        {agents.map(agent => (
          <option key={agent.id} value={agent.id}>{agent.full_name}</option>
        ))}
      </select>

      <button
        onClick={handleClear}
        style={{
          margin: '10px',
          padding: '5px 10px',
          backgroundColor: 'red',
          color: 'white',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Ishni tugatish
      </button>

      <div id="map" style={{ height: '500px', width: '100%' }} suppressHydrationWarning />
    </div>
  );
};

export default RealTimeMap;
