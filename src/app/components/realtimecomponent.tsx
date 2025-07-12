// components/RealTimeMap.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import L, { Map as LeafletMap, Polyline as LeafletPolyline, Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';

type AgentName = 'agent1' | 'agent2' | 'agent3';

interface LatLon {
  lat: number;
  lon: number;
}

const fakeAgentData: Record<AgentName, LatLon> = {
  agent1: { lat: 39.65, lon: 66.95 },
  agent2: { lat: 40.4, lon: 71.8 },
  agent3: { lat: 41.31, lon: 69.24 },
};

const RealTimeMap: React.FC = () => {
  const mapRef = useRef<LeafletMap | null>(null);
  const polylineRef = useRef<LeafletPolyline | null>(null);
  const startMarkerRef = useRef<LeafletMarker | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentName>('agent1');
  const [agentPaths, setAgentPaths] = useState<Record<AgentName, [number, number][]>>({
    agent1: [],
    agent2: [],
    agent3: [],
  });

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

  useEffect(() => {
    const path = agentPaths[selectedAgent];
    if (mapRef.current && path.length > 0) {
      if (polylineRef.current) mapRef.current.removeLayer(polylineRef.current);
      polylineRef.current = L.polyline(path, { color: 'blue' }).addTo(mapRef.current);
      mapRef.current.setView(path[path.length - 1], 13);

      const startPoint = path[0];
      if (startPoint) {
        if (startMarkerRef.current) mapRef.current.removeLayer(startMarkerRef.current);
        startMarkerRef.current = L.marker(startPoint).addTo(mapRef.current)
          .bindPopup('Boshlanish nuqtasi')
          .openPopup();
      }
    }
  }, [selectedAgent, agentPaths]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentLocation = fakeAgentData[selectedAgent];
      const newPoint: [number, number] = [currentLocation.lat, currentLocation.lon];

      const prevPath = agentPaths[selectedAgent];
      const lastPoint = prevPath[prevPath.length - 1];

      if (!lastPoint || lastPoint[0] !== newPoint[0] || lastPoint[1] !== newPoint[1]) {
        const updatedPath = [...prevPath, newPoint];

        const updatedAgentPaths: Record<AgentName, [number, number][]> = {
          ...agentPaths,
          [selectedAgent]: updatedPath,
        };

        setAgentPaths(updatedAgentPaths);
        localStorage.setItem('agentPaths', JSON.stringify(updatedAgentPaths));

        if (mapRef.current) {
          if (polylineRef.current) mapRef.current.removeLayer(polylineRef.current);
          polylineRef.current = L.polyline(updatedPath, { color: 'blue' }).addTo(mapRef.current);
          mapRef.current.setView(newPoint, 13);

          if (updatedPath.length === 1) {
            if (startMarkerRef.current) mapRef.current.removeLayer(startMarkerRef.current);
            startMarkerRef.current = L.marker(newPoint).addTo(mapRef.current)
              .bindPopup('Boshlanish nuqtasi')
              .openPopup();
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedAgent, agentPaths]);

  return (
    <div>
      <select
        value={selectedAgent}
        onChange={(e) => setSelectedAgent(e.target.value as AgentName)}
        style={{ margin: '10px', padding: '5px' }}
      >
        <option value="agent1">Agent 1</option>
        <option value="agent2">Agent 2</option>
        <option value="agent3">Agent 3</option>
      </select>

      <div id="map" style={{ height: '500px', width: '100%' }} />
    </div>
  );
};

export default RealTimeMap;
