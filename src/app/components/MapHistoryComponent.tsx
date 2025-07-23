"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../globals.css";
import toast from "react-hot-toast";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { ToyBrick } from "lucide-react";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

// TYPES
type StaticLocation = {
  lat: number;
  lon: number;
};

type Client = {
  full_name: string;
  phone_number: string;
  static_locations: StaticLocation[];
};

type Contract = {
  id: number;
  contract_number: string;
  total_debt_1c: number;
  client: Client;
  company: { name: string };
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
  id: number;
  full_name: string;
  phone_number: string;
  is_working: boolean;
  date_joined: string;
};

type Payment = {
  id: number;
  amount: number;
  contract_id: number;
  contract_number: string;
  client_id: number;
  paid_at: string; // ISO date string
  note_id: number | null; // note_id null bo'lishi mumkinmi tekshiring
  note_comment: string | null; // note_comment null bo'lishi mumkinmi tekshiring
};

type Notes = {
  id: number;
  comment: string;
  contract_id: number;
  contract_number:string;
  client_id:number;
  created_at:string;
}

type Clients = {
  id:number;
  full_name:string;
  longitude:number;
  latitude:number;
  debt_1c:number;
  total_debt_1c:number;
  contract_summary_1c:number;
  mounthly_payment_1c:number;
}

type Call_history = {
  id: number;
  username:string;
  phone_number:string
  call_type:string;
  call_date:string;
  time:number;
}

type AgentDetails = {
  agent: Agent;
  location_history: AgentLocation[];
  contracts?: Contract[];
  date: string;
  payments?: Payment[];
  call_history?: Call_history[];
  notes?: Notes[];
  clients?: Clients[];
};

// DISTANCE CALCULATION
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return +d.toFixed(2);
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
  const polylineRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const stopMarkersRef = useRef<L.Marker[]>([]);
  const clientMarkersRef = useRef<L.Marker[]>([]);
  // Qo'shish kerak bo'lgan qator (yaqin atrofdagi boshqa useState hooklari bilan birga)
const [loading, setLoading] = useState(false);

  const [SelectID, setSelectID] = useState<number | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentData, setselectedAgentData] = useState<AgentDetails | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // MODAL STATE
  const [modalData, setModalData] = useState<{ name: string; phone: string; date:string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const greenIcon = L.icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
    iconSize: [36, 36], // Adjusted size for better visibility
    iconAnchor: [18, 36],
  });
  const redIcon = L.icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
  const yellowIcon = L.icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  // Fetch agent details based on selected ID and date
  useEffect(() => {
    if (!SelectID || !selectedDate) return;

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Token topilmadi. Login qiling.");
      return;
    }

    // Clear previous data and layers
    setselectedAgentData(null);
    [polylineRef, startMarkerRef, endMarkerRef].forEach((ref) => {
      if (ref.current && mapRef.current) {
        mapRef.current.removeLayer(ref.current);
        ref.current = null;
      }
    });
    stopMarkersRef.current.forEach((marker) => mapRef.current?.removeLayer(marker));
    stopMarkersRef.current = [];
    clientMarkersRef.current.forEach((marker) => mapRef.current?.removeLayer(marker));
    clientMarkersRef.current = [];

    const formattedDate = selectedDate.toISOString().split("T")[0];
    console.log("📅 Tanlangan sana:", formattedDate);
    setLoading(true);

    axios
      .get("https://gps.mxsoft.uz/payments/agent/daily-detail/", {
        params: { agent_id: SelectID, date: formattedDate },
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        const data = res.data;

        if (!data.location_history || data.location_history.length === 0) {
          toast.error(
            `${data.agent?.full_name || 'Agent'} uchun ${formattedDate} sanasida location_history mavjud emas!`
          );
          setselectedAgentData(null);
          return;
        }

        setselectedAgentData(data);
        setLoading(false)
      })
      .catch((err) => {
        console.error("API xato:", err);
        // Check if it's an auth error
        if (err.response?.status === 401) {
             toast.error("Avtorizatsiya xatosi. Qayta kiring.");
        } else {
             toast.error("Ma'lumotni olishda xatolik yuz berdi.");
        }
        setselectedAgentData(null);
        setLoading(false);
      });
      
      
  }, [SelectID, selectedDate]);

  // Fetch list of agents via WebSocket
  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) return;

    const socket = new WebSocket(`wss://gps.mxsoft.uz/ws/location/?token=${accessToken}`);

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (Array.isArray(data.agents_data)) setAgents(data.agents_data);
      } catch (err) {
        console.error("WebSocket ma'lumotini parse qilishda xatolik:", err);
      }
    };

    socket.onerror = (e) => {
      console.error("WebSocket xatosi:", e);
      toast.error("WebSocket ulanishida xatolik");
    };

    socket.onclose = (e) => {
      if (e.wasClean) {
        console.log(`WebSocket uzildi: ${e.code} ${e.reason}`);
      } else {
        console.error("WebSocket to'satdan uzildi");
        toast.error("WebSocket ulanishi uzildi");
      }
    };

    return () => {
      socket.close(1000, "Component unmounted");
    };
  }, []);

  // Initialize the map
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView([41.3111, 69.2797], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);
    }

    // Cleanup function to remove map on unmount (optional but good practice)
    return () => {
        if (mapRef.current) {
             mapRef.current.remove();
             mapRef.current = null;
        }
    }
  }, []);

  // Update map layers when selectedAgentData changes
  useEffect(() => {
    if (!selectedAgentData || !mapRef.current) return;

    const { agent, location_history, contracts, date, payments, notes,clients ,call_history } = selectedAgentData;
    console.log("Agent data for map update:", agent);

    if (!location_history?.length) {
        toast.error(`${agent.full_name} uchun location_history mavjud emas!`);
        return;
    }

    // Clear existing layers
    [polylineRef, startMarkerRef, endMarkerRef].forEach((ref) => {
      if (ref.current) mapRef.current!.removeLayer(ref.current);
    });
    [...stopMarkersRef.current, ...clientMarkersRef.current].forEach((marker) =>
      mapRef.current!.removeLayer(marker)
    );
    stopMarkersRef.current = [];
    clientMarkersRef.current = [];

    // Create path and polyline
    const path: L.LatLngTuple[] = location_history.map((l) => [l.latitude, l.longitude]);
    polylineRef.current = L.polyline(path, { color: "blue" }).addTo(mapRef.current);

    // --- START MARKER WITH MODAL BUTTON ---
    const startLatLng: L.LatLngTuple = path[0];

    // Create a DOM element for the popup content
    const startPopupContent = document.createElement('div');
    startPopupContent.innerHTML = `
      <div>
        <strong>👤 ${agent.full_name}</strong><br/>
        📞 ${agent.phone_number}<br/>
        🕓 ${new Date(date).toLocaleString()}<br/>
        <button id="open-modal-btn-${agent.id}" class="leaflet-modal-button" style="margin-top: 5px; padding: 4px 8px; background-color: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
          Batafsil
        </button>
      </div>
    `;

    const start = L.marker(startLatLng, { icon: greenIcon }).addTo(mapRef.current);
    start.bindPopup(startPopupContent); // Bind the DOM element

    // IMPORTANT: Add event listener after the popup opens
    start.on('popupopen', () => {
        // Use a slight delay to ensure the DOM is fully rendered
        setTimeout(() => {
            const button = document.getElementById(`open-modal-btn-${agent.id}`);
            if (button) {
                // Remove any existing event listener to prevent duplicates
                button.replaceWith(button.cloneNode(true));
                const newButton = document.getElementById(`open-modal-btn-${agent.id}`);
                if (newButton) {
                    newButton.addEventListener('click', () => {
                        console.log("Batafsil tugmasi bosildi"); // Debug log
                        setModalData({ name: agent.full_name, phone: agent.phone_number,date: date,payments:payments, notes:notes, clients:clients, call_history:call_history});
                        setIsModalOpen(true);
                        // Optionally close the popup after opening the modal
                        // mapRef.current?.closePopup();
                    });
                }
            } else {
                 console.warn(`Tugma topilmadi: open-modal-btn-${agent.id}`);
            }
        }, 150); // Increased timeout slightly
    });

    startMarkerRef.current = start;
    // --- END START MARKER ---

    // END MARKER
    const endLatLng: L.LatLngTuple = path[path.length - 1];
    const end = L.marker(endLatLng, { icon: redIcon })
      .addTo(mapRef.current)
      .bindPopup(
        `📍 Tugash nuqtasi<br/>📞 ${agent.phone_number}<br/>📏 Masofa: ${totalDistance(
          location_history
        )} km`
      );
    endMarkerRef.current = end;

    // STOP MARKERS
    location_history.forEach((loc, i) => {
      if (loc.is_stop) {
        const dist = totalDistance(location_history.slice(0, i + 1));
        const marker = L.marker([loc.latitude, loc.longitude], { icon: yellowIcon })
          .addTo(mapRef.current!)
          .bindPopup(`To'xtash nuqtasi<br/>🧭 ${dist.toFixed(2)} km`);
        stopMarkersRef.current.push(marker);
      }
    });

    // CLIENT MARKERS
    contracts?.forEach((c) => {
      c.client.static_locations.forEach((loc) => {
        const marker = L.marker([loc.lat, loc.lon], {
          icon: L.icon({
            iconUrl: "/img/user-svgrepo-com.svg",
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          }),
        })
          .addTo(mapRef.current!)
          .bindPopup(
            `<strong>${c.client.full_name}</strong><br/>📄 ${c.contract_number}<br/>💰 ${c.total_debt_1c.toLocaleString()} so'm`
          );
        clientMarkersRef.current.push(marker);
      });
    });

    // Fit map bounds to the polyline
    mapRef.current.fitBounds(polylineRef.current.getBounds());
  }, [selectedAgentData]); // Re-run effect when selectedAgentData changes

  return (
    <div>
      <div className="agents-head space-y-2">
        <h2>Agentlar Haritasi</h2>

        <select
          className="select-style"
          onChange={(e) => {
            const index = Number(e.target.value);
            const agent = agents[index];
            if (agent) setSelectID(agent.id);
          }}
          defaultValue=""
        >
          <option value="" disabled>
            Agentni tanlang
          </option>
          {agents.map((a, i) => (
            <option key={i} value={i}>
              {a.full_name}
            </option>
          ))}
        </select>

        <Button onClick={() => setShowCalendar(!showCalendar)}>📅 Sana tanlash</Button>
        <div className="calendar-navbar">
          {showCalendar && (
          <Calendar
  mode="single"
  selected={selectedDate}
  onSelect={(date) => {
    setSelectedDate(date);
    setShowCalendar(false); // Kalendarni yopish
  }}
  className="rounded-md border shadow-sm"
  captionLayout="dropdown"
/>
        )}
        </div>
        
      </div>

      <div id="map" style={{ height: "500px", width: "100%", marginTop: "1rem" }}></div>

      {/* MODAL */}
       {/* MODAL - Updated to show payments */}
{isModalOpen && modalData && (
  <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" onClick={() => setIsModalOpen(false)}>
        &times;
      </button>
      <h2>Agent Ma'lumotlari</h2>
      <div className="modal-body"> {/* Qo'shimcha: tarkib uchun konteyner */}
        <p><strong>Ism:</strong> {modalData.name}</p>
        <p><strong>Telefon:</strong> {modalData.phone}</p>

        {/* Yangi qo'shilgan: Payments ro'yxati */}
        {modalData.payments && modalData.payments.length > 0 ? (
          <div>
            <h2>To'lovlar:</h2>
            <ul>
              {modalData.payments.map((payment) => (
                <li key={payment.id}>
                  <strong>Contract:</strong> {payment.id} <br />
                  <strong>contract_id:</strong> {payment.contract_id} <br />
                  <strong>contract_number:</strong> {new Date(payment.contract_number).toLocaleString()} <br />
                  <strong>client_id:</strong> {payment.client_id || 'N/A'} <br />
                  <strong>paid_at:</strong> {payment.paid_at || 'N/A'} <br />
                  <strong>note_id:</strong> {payment.note_id || 'N/A'} <br />
                  <strong>note_comment:</strong> {payment.note_comment || 'N/A'} <br />
                  <strong> </strong> {" "} <br />
                  {/* Boshqa kerakli maydonlarni qo'shishingiz mumkin */}
                </li>
              ))}
            </ul>
            <h2>Notelar:</h2>
             <ul>
              {modalData.notes.map((notes) => (
                <li key={notes.id}>
                  <strong>id:</strong> {notes.id} <br />
                  <strong>comment:</strong> {notes.comment} <br />
                  <strong>contract_id:</strong> {notes.contract_id} <br />
                  <strong>contract_number:</strong> {notes.contract_number} <br />
                  <strong>client_id:</strong> {notes.client_id} <br />
                  <strong>created_at:</strong> {notes.created_at} <br />
                  <strong> </strong> {" "} <br />
                  {/* Boshqa kerakli maydonlarni qo'shishingiz mumkin */}
                </li>
              ))}
            </ul>
            <h2>Xaridorlar</h2>

            <ul>
              {modalData.clients.map((clients) => (
                <li key={clients.id}>
                  <strong>id:</strong> {clients.id} <br />
                  <strong>full_name:</strong> {clients.full_name} <br />
                  <strong>debt_1c:</strong> {clients.debt_1c} <br />
                  <strong>total_debt_1c:</strong> {clients.total_debt_1c} <br />
                  <strong>contract_summary_1c:</strong> {clients.contract_summary_1c} <br />
                  <strong>mounthly_payment_1c:</strong> {clients.mounthly_payment_1c} <br />
                  <strong> </strong> {" "} <br />
                  {/* Boshqa kerakli maydonlarni qo'shishingiz mumkin */}
                </li>
              ))}
            </ul>

            <h2>Qongiroqlar</h2>
            <ul>
              {modalData.call_history.map((call_history) => (
                <li key={call_history.id}>
                  <strong>id:</strong> {call_history.id} <br />
                  <strong>username:</strong> {call_history.username} <br />
                  <strong>phone_number:</strong> {call_history.phone_number} <br />
                  <strong>call_type:</strong> {call_history.call_type} <br />
                  <strong>call_date:</strong> {call_history.call_date} <br />
                  <strong>time:</strong> {call_history.time} <br />
                  <strong> </strong> {" "} <br />
                  {/* Boshqa kerakli maydonlarni qo'shishingiz mumkin */}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Tolovlar mavjud emas.</p>
        )}
      </div>
    </div>
  </div>
)}
{/* END MODAL */}
      {/* END MODAL */}
    </div>
  );
};

export default MapHistory;