'use client';

import React, { useEffect, useRef, useState } from 'react';
import L, { Map as LeafletMap, Polyline as LeafletPolyline, Marker as LeafletMarker, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
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
  const userInteracted = useRef(false);

  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentPaths, setAgentPaths] = useState<AgentPathMap>({});

  const selectedPath = selectedAgentId ? agentPaths[selectedAgentId] : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!selectedAgentId || !selectedPath || selectedPath.length === 0) return;
    updateMap(selectedPath, selectedAgentId);
  }, [selectedAgentId, agentPaths]);

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map').setView([39.65, 66.95], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      mapRef.current = map;

      map.on('movestart', () => {
        userInteracted.current = true;
      });
    }
  }, []);

  const updateMap = (path: LatLngTuple[], agentId: number) => {
    if (!mapRef.current || !path || path.length === 0 || !path[0]) {
      console.warn("Xarita yo'q yoki path noto'g'ri:", path);
      return;
    }

    polylineRef.current?.remove();

    const newPolyline = L.polyline(path, { color: 'blue' }).addTo(mapRef.current);
    polylineRef.current = newPolyline;

    if (!userInteracted.current) {
      mapRef.current.setView(path[path.length - 1], 13);
    }

    if (!startMarkersMap.current[agentId]) {
      const startMarker = L.marker(path[0])
        .addTo(mapRef.current)
        .bindPopup('Boshlanish nuqtasi')
        .openPopup();
      startMarkersMap.current[agentId] = startMarker;
    }

    stopMarkersRef.current.forEach(marker => marker.remove());
    stopMarkersRef.current = [];

    const counts: Record<string, number> = {};
    for (const [lat, lon] of path) {
      const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
      counts[key] = (counts[key] || 0) + 1;

      if (counts[key] === 3) {
        const stopMarker = L.marker([lat, lon])
          .addTo(mapRef.current!)
          .bindPopup(`To‘xtash joyi<br/>Jami masofa: ${calculateDistance(path)} km`);
        stopMarkersRef.current.push(stopMarker);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn("Access token yo'q!");
      return;
    }

    const socket = new WebSocket(`wss://gps.mxsoft.uz/ws/location/?token=${token}`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.agents_data) {
          const filtered = data.agents_data.filter((a: Agent) => {
            return a.last_location && typeof a.last_location.latitude === 'number' && typeof a.last_location.longitude === 'number';
          });
          setAgents(filtered);

          setAgentPaths((prevPaths) => {
            const updatedPaths: AgentPathMap = { ...prevPaths };
            let changed = false;

            for (const agent of filtered) {
              const { id, last_location } = agent;
              if (!last_location) continue;

              const newPoint: [number, number] = [last_location.latitude, last_location.longitude];
              const prevPath = updatedPaths[id] || [];
              const lastPoint = prevPath[prevPath.length - 1];

              if (!lastPoint || lastPoint[0] !== newPoint[0] || lastPoint[1] !== newPoint[1]) {
                updatedPaths[id] = [...prevPath, newPoint];
                changed = true;

                if (id === selectedAgentId) {
                  updateMap(updatedPaths[id], id);
                }
              }
            }

            if (changed) {
              localStorage.setItem('agentPaths', JSON.stringify(updatedPaths));
            }

            return updatedPaths;
          });
        }
      } catch (err) {
        console.error('❌ JSON parsing error:', err);
      }
    };

    return () => socket.close();
  }, []);

  return (
    <div className="p-4">
      <select
        value={selectedAgentId ?? ''}
        onChange={(e) => {
          const id = Number(e.target.value);
          if (id === 0) {
            setSelectedAgentId(null);
            return;
          }
          const selected = agents.find(a => a.id === id);
          if (!selected?.last_location) {
            toast.error('❌ Agentning joylashuvi mavjud emas!');
            return;
          }
          setSelectedAgentId(id);
        }}
        className="border border-gray-300 rounded px-3 py-2 mb-4 w-full max-w-xs"
      >
        <option value="">Agent tanlang</option>
        {agents.map(agent => {
          if (!agent.last_location || typeof agent.last_location.latitude !== 'number' || typeof agent.last_location.longitude !== 'number') {
            return null; // Bu agent render qilinmaydi
          }
          return (
            <option key={agent.id} value={agent.id}>
              {agent.full_name}
            </option>
          );
        })}
      </select>

      <div id="map" style={{ height: '500px', width: '100%' }} suppressHydrationWarning />
      <ToastContainer />
    </div>
  );
};

export default RealTimeMap;