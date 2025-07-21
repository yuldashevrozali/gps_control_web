'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../globals.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import toast from 'react-hot-toast';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

// Types

type StaticLocation = {
  lat: number;
  lon: number;
};

type Contract = {
  id: number;
  contract_number: string;
  total_debt_1c: number;
  client: {
    full_name: string;
    phone_number: string;
    static_locations: StaticLocation[];
  };
  company: {
    name: string;
  };
  due_date?: string;
  end_date?: string;
  total_paid?: string;
};

type AgentLocation = {
  latitude: number;
  longitude: number;
  is_stop: boolean;
};

type Agent = {
  full_name: string;
  phone_number: string;
  is_working: boolean;
  location_history: AgentLocation[];
  contracts?: Contract[];
  date_joined: string;
};

type ClientPopupData = {
  name: string;
  phone: string;
  debt: number;
  company: string;
  contract_number: string;
  due_date: string;
  end_date?: string;
  total_paid: string;
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(2);
}

function totalDistance(points: AgentLocation[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += calculateDistanceKm(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude
    );
  }
  return +total.toFixed(2);
}

const MapHistory = () => {
  const mapRef = useRef<L.Map | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientPopupData | null>(null);

  const polylineRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const stopMarkersRef = useRef<L.Marker[]>([]);
  const clientMarkersRef = useRef<L.Marker[]>([]);

  const greenIcon = useRef(L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    iconSize: [60, 60],
    iconAnchor: [36, 60],
  })).current;

  const redIcon = useRef(L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })).current;

  const yellowIcon = useRef(L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })).current;

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    console.log(accessToken,127);
    
    if (!accessToken) {
      toast.error('❌ Token topilmadi. Iltimos, qayta login qiling.');
      return;
    }

    const socket = new WebSocket(`wss://gps.mxsoft.uz/ws/location/?token=${accessToken}`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setAgents(data.agents_data);
        console.log(data,138);
        
      } catch (err) {
        console.error('WebSocket JSON parse error', err);
      }
    };

    socket.onerror = (err) => {
      toast.error('WebSocket ulanishida xatolik!');
      console.error('WebSocket Error:', err);
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([41.3111, 69.2797], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (selectedIndex === null || !mapRef.current || !agents[selectedIndex]) return;

    const agent = agents[selectedIndex];

    if (!agent.location_history || agent.location_history.length === 0) {
      toast.error(`${agent.full_name} uchun location_history mavjud emas!`);
      return;
    }

    [polylineRef, startMarkerRef, endMarkerRef].forEach((ref) => {
      if (ref.current) mapRef.current!.removeLayer(ref.current);
    });
    stopMarkersRef.current.forEach((marker) => mapRef.current!.removeLayer(marker));
    stopMarkersRef.current = [];
    clientMarkersRef.current.forEach((marker) => mapRef.current!.removeLayer(marker));
    clientMarkersRef.current = [];

    const latLngPath: L.LatLngTuple[] = agent.location_history.map((loc) => [loc.latitude, loc.longitude]);

    polylineRef.current = L.polyline(latLngPath, { color: 'blue' }).addTo(mapRef.current);

    const formattedDate = new Date(agent.date_joined).toLocaleString();

    startMarkerRef.current = L.marker(latLngPath[0], { icon: greenIcon })
      .addTo(mapRef.current)
      .bindPopup(`
        <div style="padding: 10px; font-family: sans-serif; font-size: 14px;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px; color: #2c3e50;">
            👤 ${agent.full_name}
          </div>
          <div style="margin-bottom: 4px;">
            📞 <span style="color: #2980b9;">${agent.phone_number}</span>
          </div>
          <div>
            🕓 <span style="color: #27ae60;">${formattedDate}</span>
          </div>
        </div>
      `);

    const totalKm = totalDistance(agent.location_history);
    endMarkerRef.current = L.marker(latLngPath[latLngPath.length - 1], { icon: redIcon })
      .addTo(mapRef.current)
      .bindPopup(`<strong>Tugash nuqtasi</strong><br/>📞 ${agent.phone_number}<br/>📏Umumiy masofa:${totalKm} km`);

    agent.location_history.forEach((loc, idx) => {
      if (loc.is_stop) {
        const distanceUntilNow = totalDistance(agent.location_history.slice(0, idx + 1));
        const marker = L.marker([loc.latitude, loc.longitude], { icon: yellowIcon })
          .addTo(mapRef.current!)
          .bindPopup(`<strong>To'xtash nuqtasi</strong><br/>🧭 ${distanceUntilNow} km yurilgan`);
        stopMarkersRef.current.push(marker);
      }
    });

    agent.contracts?.forEach((contract) => {
      contract.client.static_locations.forEach((loc) => {
        const marker = L.marker([loc.lat, loc.lon], {
          icon: L.icon({
            iconUrl: '/img/user-svgrepo-com.svg',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          }),
        })
          .addTo(mapRef.current!)
          .bindPopup(`
            <div style="font-family: sans-serif; max-width: 320px;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <div style="background: linear-gradient(to right, #5b4df7, #8f4dfc); padding: 10px; border-radius: 50%;">
                  <img src="/img/user-svgrepo-com.svg" width="24" height="24" style="filter: invert(1);" />
                </div>
                <div>
                  <div style="font-size: 16px; font-weight: bold;">${contract.client.full_name}</div>
                </div>
              </div>
              <div style="margin-bottom: 8px;"><strong>📄 Contract:</strong> ${contract.contract_number}</div>
              <div style="margin-bottom: 8px;"><strong>🏢 Company:</strong> ${contract.company.name}</div>
              <div style="margin-bottom: 12px;"><strong>💰 Total Debt:</strong> <span style="color: green; font-weight: bold;"> ${contract.total_debt_1c.toLocaleString()} so'm</span></div>
              <button class="view-details-btn"
                style="background: linear-gradient(to right, #4f46e5, #9333ea); color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%;"
                data-client='${JSON.stringify({
                  name: contract.client.full_name,
                  phone: contract.client.phone_number,
                  debt: contract.total_debt_1c,
                  company: contract.company.name,
                  contract_number: contract.contract_number,
                  due_date: contract.due_date || 'Mavjud emas',
                  end_date: contract.end_date || 'Mavjud emas',
                  total_paid: contract.total_paid || 'Mavjud emas',
                })}'>👁 View Details →</button>
            </div>
          `);
        clientMarkersRef.current.push(marker);
      });
    });

    mapRef.current.fitBounds(polylineRef.current.getBounds());
  }, [selectedIndex, agents]);

  useEffect(() => {
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('view-details-btn')) {
        const data = target.getAttribute('data-client');
        if (data) setSelectedClient(JSON.parse(data));
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div>
      <div className="agents-head">
        <h2>Agentlar Haritasi</h2>
        <select className="select-style" onChange={(e) => setSelectedIndex(Number(e.target.value))} defaultValue="">
          <option value="" disabled>
            Agentni tanlang
          </option>
          {agents.map((agent, index) => (
            <option key={index} value={index}>
              {agent.full_name}
            </option>
          ))}
        </select>
      </div>

      <div id="map" style={{ height: '500px', width: '100%', marginTop: '1rem' }}></div>

      {selectedClient && (
        <div className="modal-overlay" onClick={() => setSelectedClient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedClient(null)}>
              ✖
            </button>
            <h2>Mijoz Tafsilotlari</h2>
            <p>
              <strong>Ism:</strong> {selectedClient.name}
            </p>
            <p>
              <strong>Telefon:</strong> {selectedClient.phone}
            </p>
            <p>
              <strong>Kompaniya:</strong> {selectedClient.company}
            </p>
            <p>
              <strong>Umumiy Qarzdorlik:</strong> {selectedClient.debt.toLocaleString()} som
            </p>
            <p>
              <strong>To‘lov muddati:</strong> {selectedClient.due_date}
            </p>
            <p>
              <strong>Tugash muddati:</strong> {selectedClient.end_date}
            </p>
            <p>
              <strong>To‘langan summa:</strong> {selectedClient.total_paid}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapHistory;
