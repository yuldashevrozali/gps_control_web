// components/MapContainer.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Agent, ClientLocation, Contract } from '../lib/types'; // Turlarni import qiling

// Default Leaflet marker ikonkalari
// Bu qism muhim, chunki Next.js (Webpack) Leafletning standart ikonka rasmlarini topa olmaydi
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface MapContainerProps {
  selectedAgent?: Agent;
}

const formatTimestampForPopup = (timestamp: string | undefined): string => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "Invalid date";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${mins}`;
};

const MapContainer: React.FC<MapContainerProps> = ({ selectedAgent }) => {
  const mapRef = useRef<L.Map | null>(null);
  const agentMarkerRef = useRef<L.Marker | null>(null);
  const clientMarkersRef = useRef<L.Marker[]>([]);

  // Agent Modal funksiyasi (global emas, komponent ichida)
  const showAgentModal = (agentData: Agent) => {
    // Bu funksiya modal komponentini ochishi yoki uning stateini o'zgartirishi kerak
    // Hozircha faqat console.log qilamiz
    console.log("Show Agent Modal for:", agentData);
    // Siz bu yerda Context API yoki Redux kabi state management kutubxonasidan foydalanib,
    // modal komponentini boshqarishingiz kerak bo'ladi.
    // Oddiy misol:
    // setModalData(agentData);
    // setIsAgentModalOpen(true);
  };

  // Client Modal funksiyasi (global emas, komponent ichida)
  const showClientModal = (data: { client: any; location: ClientLocation }) => {
    console.log("Show Client Modal for:", data);
    // Xuddi agent modal kabi boshqariladi.
    // setClientModalData(data);
    // setIsClientModalOpen(true);
  };

  useEffect(() => {
    if (!mapRef.current) {
      // Xarita mavjud bo'lmasa, uni yaratamiz
      mapRef.current = L.map('map').setView([40.392, 71.78], 6); // O'zbekiston markaziga yaqin
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Harita to'g'ri o'lchamga ega bo'lishini ta'minlash
    map.invalidateSize();

    // Agent markerini boshqarish
    if (selectedAgent && selectedAgent.current_location) {
      const { lat, lon, timestamp } = selectedAgent.current_location;

      if (agentMarkerRef.current) {
        agentMarkerRef.current.setLatLng([lat, lon]);
      } else {
        agentMarkerRef.current = L.marker([lat, lon]).addTo(map);
      }

      const agentPopupHtml = `
        <div class="custom-popup">
          <h6>${selectedAgent.full_name || "Agent"}</h6>
          <div class="info">
            <div class="icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#2563EB" viewBox="0 0 24 24">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1.003 1.003 0 011.06-.21c1.12.45 2.33.69 3.53.69a1 1 0 011 1V20a1 1 0 01-1 1C10.29 21 3 13.71 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.2.24 2.41.69 3.53a1 1 0 01-.21 1.06l-2.36 2.2z"/>
              </svg>
            </div>
            <div>
              <p class="label">Phone</p>
              <p class="text">${selectedAgent.phone_number || "Unknown"}</p>
            </div>
          </div>
          <div class="info">
            <div class="icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" fill="${selectedAgent.is_working_status ? "#10B981" : "#EF4444"}" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8"/>
              </svg>
            </div>
            <div>
              <p class="label">Status</p>
              <p class="text status ${selectedAgent.is_working_status ? "active" : "inactive"}">
                ${selectedAgent.is_working_status ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
          <div class="info">
            <div class="icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#F59E0B" viewBox="0 0 24 24">
                <path d="M12 1.75a10.25 10.25 0 1 0 10.25 10.25A10.263 10.263 0 0 0 12 1.75Zm.75 11h-3a.75.75 0 0 1 0-1.5h2.25V7a.75.75 0 0 1 1.5 0v5.25a.75.75 0 0 1-.75.75Z"/>
              </svg>
            </div>
            <div>
              <p class="label">Last update</p>
              <p class="text">${formatTimestampForPopup(timestamp)}</p>
            </div>
          </div>
          <button class="btn" onclick="document.dispatchEvent(new CustomEvent('showAgentModalEvent', { detail: ${JSON.stringify(selectedAgent)} }));">View Details</button>
        </div>
      `;
      agentMarkerRef.current.bindPopup(agentPopupHtml, { className: "agent-popup" }).openPopup();
      map.setView([lat, lon], 13);
    } else {
      if (agentMarkerRef.current) {
        map.removeLayer(agentMarkerRef.current);
        agentMarkerRef.current = null;
      }
    }

    // Client markerlarini boshqarish
    clientMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    clientMarkersRef.current = [];

    if (selectedAgent?.contracts && Array.isArray(selectedAgent.contracts)) {
      selectedAgent.contracts.forEach((contract: Contract) => {
        const client = contract.client;
        if (client && Array.isArray(client.static_locations)) {
          client.static_locations.forEach((loc: ClientLocation) => {
            if (loc.lat && loc.lon) {
              const marker = L.marker([loc.lat, loc.lon], {
                icon: L.divIcon({ className: "client-icon" }),
              }).addTo(map);

              const photoUrl = loc.photo_url
                ? loc.photo_url.startsWith("http")
                  ? loc.photo_url
                  : `${window.location.origin}${loc.photo_url}`
                : null;

              const popupContent = `
                <div class="custom-popup">
                  <h6>${client.full_name || "Unknown Client"}</h6>
                  <div class="info">
                    <div class="icon-box">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#2563EB" viewBox="0 0 24 24">
                        <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1.003 1.003 0 011.06-.21c1.12.45 2.33.69 3.53.69a1 1 0 011 1V20a1 1 0 01-1 1C10.29 21 3 13.71 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.2.24 2.41.69 3.53a1 1 0 01-.21 1.06l-2.36 2.2z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="label">Phone</p>
                      <p class="text">${client.phone_number || "-"}</p>
                    </div>
                  </div>
                  <div class="info">
                    <div class="icon-box">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#10B981" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="label">Location</p>
                      <p class="text">${loc.address_type || "N/A"}</p>
                    </div>
                  </div>
                  <button class="btn" onclick="document.dispatchEvent(new CustomEvent('showClientModalEvent', { detail: ${JSON.stringify({ client, location: loc })} }));">View Details</button>
                </div>
              `;
              marker.bindPopup(popupContent);
              clientMarkersRef.current.push(marker);
            }
          });
        }
      });
    }

    // Komponentdan chiqilganda xaritani tozalash
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [selectedAgent]); // selectedAgent o'zgarganda qayta renderlash

  return <div id="map" style={{ height: '500px', width: '100%' }}></div>;
};

export default MapContainer;