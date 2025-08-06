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
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";




// Leaflet markerlarni to'g'ri ko'rsatish
// Leaflet markerlarni to'g'ri ko'rsatish
interface LeafletIconDefault extends L.Icon.Default {
  _getIconUrl?: () => void;
}

delete (L.Icon.Default.prototype as LeafletIconDefault)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});
// TURLAR (TYPES)
type StaticLocation = { lat: number; lon: number };
type Client = { full_name: string; phone_number: string; static_locations: StaticLocation[] };
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

type ClientFromAPI = {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  latitude: string;
  longitude: string;
  address_name: string;
  address_type: string;
  isBlackList: boolean;
  contracts: ContractType[];
};
type AgentLocation = { latitude: number; longitude: number; is_stop: boolean; timestamp:string };
type Agent = {
  id: number;
  full_name: string;
  phone_number: string;
  is_working: boolean;
  date_joined: string;
  first_name: string;
  start_time: string;
  end_time: string;
};
type Payment = {
  id: number;
  amount: number;
  contract_id: number;
  contract_number: string;
  client_id: number;
  paid_at: string;
  note_id: number | null;
  note_comment: string | null;
};
type Notes = {
  id: number;
  comment: string;
  contract_id: number;
  contract_number: string;
  client_id: number;
  created_at: string;
};
type Clients = {
  id: number;
  full_name: string;
  longitude: number;
  latitude: number;
  debt_1c: number;
  total_debt_1c: number;
  contract_summary_1c: number;
  mounthly_payment_1c: number;
};
type ContractType = {
  id: number;
  contract_number: string;
  company_name: string;
  total_debt_1c: string; // "1801258.80" kabi, shuning uchun string
  debt_1c: string;
  contract_summary_1c: string;
  mounthly_payment_1c: string;
  due_date: string; // yoki Date agar parse qilinsa
  end_date: string;
  filial_name: string;
  status: boolean;
};

type Call_history = {
  id: number;
  username: string;
  phone_number: string;
  call_type: string;
  call_date: string;
  contracts:ContractType;
  time: number;
};
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
type ModalData = {
  name: string;
  phone: string;
  date: string;
  payments?: Payment[];
  notes?: Notes[];
  clients?: Clients[];
  call_history?: Call_history[];
};

// Masofa hisoblash
function calculateMovingDistance(history: AgentLocation[]): number {
  let total = 0;
  let currentSegment: AgentLocation[] = [];

  for (let i = 0; i < history.length; i++) {
    const curr = history[i];

    if (i > 0) {
      const prev = history[i - 1];
      const prevTime = new Date(prev.timestamp).getTime();
      const currTime = new Date(curr.timestamp).getTime();
      const diffMinutes = (currTime - prevTime) / (1000 * 60);

      // Agar vaqt farqi 1 daqiqadan katta bo‘lsa, segmentni yakunlaymiz
      if (diffMinutes > 1) {
        // Segment masofasini qo‘shamiz
        total += totalDistance(currentSegment);
        currentSegment = [];
      }
    }

    currentSegment.push(curr);
  }

  // Oxirgi segmentni ham hisobga olamiz
  total += totalDistance(currentSegment);
  return +total.toFixed(2);
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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
 

// Yangi: Vaqtni formatlash
function formatTime(timeString: string | undefined): string {
  if (!timeString) return "Noma'lum";
  const date = new Date(timeString);
  // ISO formatni to'g'ri parse qilish uchun
  if (isNaN(date.getTime())) return "Noto'g'ri sana";
  return date.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const MapHistory = () => {
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const stopMarkersRef = useRef<L.Marker[]>([]);
  const clientMarkersRef = useRef<L.Marker[]>([]);
  const [theme, setTheme] = useState("light");
  const [SelectID, setSelectID] = useState<number | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentData, setSelectedAgentData] = useState<AgentDetails | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [clientsOnMap, setClientsOnMap] = useState<ClientFromAPI[]>([]);
  const allClientMarkersRef = useRef<L.Marker[]>([]);
const agentClientMarkersRef = useRef<L.Marker[]>([]);

  // Temani kuzatish
  useEffect(() => {
    const checkThemeChange = () => {
      const updatedTheme = localStorage.getItem("hrms-theme");
      setTheme(updatedTheme === "dark" ? "dark" : "light");
    };
    checkThemeChange();
    const interval = setInterval(checkThemeChange, 10);
    return () => clearInterval(interval);
  }, []);

  // Mijozlarni API orqali olish
useEffect(() => {
  async function fetchClients() {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) return;
    try {
      const res = await axios.get("https://gps.mxsoft.uz/location/clients-list/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("Token:", accessToken);
console.log("Mijozlar response:", res.data);

      setClientsOnMap(res.data.results || []);
    } catch (error) {
      console.error("Mijozlarni olishda xato:", error);
      toast.error("Mijozlar ro'yxatini olishda xatolik.");
    }
  }
  fetchClients();
}, []);






// Mijozlarni xaritaga joylash
// Mijozlarni xaritaga joylash
useEffect(() => {
  if (!mapRef.current) return;

  allClientMarkersRef.current.forEach((m) => mapRef.current?.removeLayer(m));
  allClientMarkersRef.current = [];

  clientsOnMap.forEach((client) => {
    
    const lat = parseFloat(client.latitude);
    const lon = parseFloat(client.longitude);
const totalDebt = client.contracts?.reduce(
  (sum, c) => sum + parseFloat(c.total_debt_1c || "0"),
  0
);

    if (isNaN(lat) || isNaN(lon)) return;

    const marker = L.marker([lat, lon], {
      icon: L.icon({
        iconUrl: "/icons/user-avatar1.png",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      }),
    })
      .addTo(mapRef.current!)
      .bindPopup(
  `<strong>Mijoz: ${client.first_name} ${client.last_name}</strong><br/>
   📞 <a href="tel:${client.phone_number}">${client.phone_number}</a><br/>
   📍 Umumiy qarzi: ${totalDebt.toLocaleString("uz-UZ")} so'm`
);

    allClientMarkersRef.current.push(marker);
  });
}, [clientsOnMap]);// 👈 selectedAgentData ham qo'shildi // mapRef.current ni qo'shish ham xavfsiz, lekin kerak emas 

  // Agentlar ro'yxatini olish
  useEffect(() => {
    async function fetchAgents() {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) return;
      try {
        const res = await axios.get("https://gps.mxsoft.uz/account/agent-list/", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setAgents(res.data.results || []);
      } catch (error) {
        console.error("Agentlar ro'yxatini olishda xato:", error);
        toast.error("Agentlar ro'yxatini olishda xatolik");
      }
    }
    fetchAgents();
  }, []);

  // Agent ma'lumotlarini olish
// Agent ma'lumotlarini olish
useEffect(() => {
  if (!SelectID || !selectedDate) return;

  const accessToken = localStorage.getItem("access_token");
  if (!accessToken) return;

  // Avvalgi agent ma’lumotlarini tozalash
  setSelectedAgentData(null);

  // Xaritada avvalgi chizilgan marshrut va markerlarni o‘chirish
  [polylineRef, startMarkerRef, endMarkerRef].forEach((ref) => {
    if (ref.current && mapRef.current) {
      mapRef.current.removeLayer(ref.current);
      ref.current = null;
    }
  });

  // To‘xtash markerlarini tozalash
  stopMarkersRef.current.forEach((marker) => {
    mapRef.current?.removeLayer(marker);
  });
  stopMarkersRef.current = [];

  // Tanlangan sanani formatlash (YYYY-MM-DD)
  function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const formattedDate = formatDateToYYYYMMDD(selectedDate);
console.log(formattedDate,358);


  // API orqali agentning kunlik lokatsiya tarixini olish
  axios
    .get("https://gps.mxsoft.uz/payments/agent/daily-detail/", {
      params: {
        agent_id: SelectID,
        date: formattedDate,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      const data = res.data;

      // Lokatsiya mavjud bo‘lmasa xabar berish
      if (!data.location_history || data.location_history.length === 0) {
        toast.error(`${data.agent?.full_name || 'Agent'} uchun lokatsiya mavjud emas!`);
        setSelectedAgentData(null);
        return;
      }

      // Lokatsiya bor, holatni yangilaymiz
      setSelectedAgentData(data);
    })
    .catch((error) => {
      console.error("API xatosi:", error);
      toast.error("Ma'lumot olishda xatolik yuz berdi.");
      setSelectedAgentData(null);
    });
}, [SelectID, selectedDate]);
 

  // Xaritani boshlash
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView([41.3111, 69.2797], 11);
      const tileUrl = theme === "dark"
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      const attribution = theme === "dark"
        ? '&copy; <a href="https://carto.com/">CartoDB</a>'
        : '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>';
      L.tileLayer(tileUrl, { attribution }).addTo(mapRef.current);
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [theme]);

  // Xaritani yangilash
// Xaritani yangilash
useEffect(() => {
  if (!selectedAgentData || !mapRef.current) return;
  const { location_history, contracts } = selectedAgentData;

  // Eski barcha markerlar va chiziqni tozalash
  [polylineRef, startMarkerRef, endMarkerRef].forEach((ref) => {
    if (ref.current) mapRef.current!.removeLayer(ref.current);
  });
  [...stopMarkersRef.current, ...clientMarkersRef.current, ...agentClientMarkersRef.current].forEach((m) =>
    mapRef.current!.removeLayer(m)
  );
  stopMarkersRef.current = [];
  clientMarkersRef.current = [];
  agentClientMarkersRef.current = [];

  if (!location_history || location_history.length === 0) return;

  // Segmentlarga ajratish (1 daqiqadan ko'p turgan joylarda uziladi)
  const segments: L.LatLngTuple[][] = [];
  let currentSegment: L.LatLngTuple[] = [];

  for (let i = 0; i < location_history.length; i++) {
    const point = location_history[i];
    const latlng: L.LatLngTuple = [point.latitude, point.longitude];

    if (i > 0) {
      const prev = location_history[i - 1];
      const prevTime = new Date(prev.timestamp).getTime();
      const currTime = new Date(point.timestamp).getTime();
      const diffMinutes = (currTime - prevTime) / (1000 * 60);

      if (diffMinutes > 1) {
        if (currentSegment.length > 1) segments.push(currentSegment);
        currentSegment = [];
      }
    }
    currentSegment.push(latlng);
  }
  if (currentSegment.length > 1) segments.push(currentSegment);

  // Marshrutni chizish
  const waypoints = segments.flat().map(([lat, lon]) => L.latLng(lat, lon));
  const routingControl = L.Routing.control({
    waypoints,
    lineOptions: {
      styles: [{ color: "#1A73E8", weight: 8, opacity: 0.95 }],
    },
    routeWhileDragging: false,
    show: false,
    addWaypoints: false,
    fitSelectedRoutes: true,
    draggableWaypoints: false,
    createMarker: () => null,
  }).addTo(mapRef.current!);
  polylineRef.current = routingControl as unknown as L.Polyline;

  // Boshlanish va tugash markerlari
  const startLatLng = segments[0][0];
  startMarkerRef.current = L.marker(startLatLng, {
    icon: L.icon({
      iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    }),
  }).addTo(mapRef.current);

  const lastSegment = segments[segments.length - 1];
  const endLatLng = lastSegment[lastSegment.length - 1];
  endMarkerRef.current = L.marker(endLatLng, {
    icon: L.icon({
      iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    }),
  }).addTo(mapRef.current);

  // ✅ FAQAT is_stop == true bo'lgan nuqtalarga rangli doira markerlari
  location_history.forEach((loc, i) => {
    if (loc.is_stop) {
      const prevTime = i > 0 ? new Date(location_history[i - 1].timestamp).getTime() : 0;
      const currTime = new Date(loc.timestamp).getTime();
      const diffMinutes = (currTime - prevTime) / (1000 * 60);

      let iconUrl = "";
      if (diffMinutes >= 60) iconUrl = "/icons/black-circle.png";
      else if (diffMinutes >= 30) iconUrl = "/icons/red-circle.png";
      else if (diffMinutes >= 10) iconUrl = "/icons/yellow-circle.svg";

      if (!iconUrl) return; // 10 daqiqadan kam bo'lsa, hech narsa chiqmaydi

      const offset = 0.0003 * i;
      const dist = totalDistance(location_history.slice(0, i + 1));

      const stopMarker = L.marker([loc.latitude + offset, loc.longitude + offset], {
        icon: L.icon({
          iconUrl,
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        }),
      })
        .addTo(mapRef.current!)
        .bindPopup(`⏱ To'xtash (${diffMinutes.toFixed(1)} daqiqa)<br/>🧭 ${dist.toFixed(2)} km`);

      stopMarkersRef.current.push(stopMarker);
    }
  });

  // Mijoz markerlari (contracts)
  contracts?.forEach((c, contractIdx) => {
    c.client.static_locations.forEach((loc, locIdx) => {
      const offset = 0.0004 * (contractIdx + locIdx);
      const marker = L.marker([loc.lat + offset, loc.lon + offset], {
        icon: L.icon({
          iconUrl: "/img/user-svgrepo-com.svg",
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        }),
      })
        .addTo(mapRef.current!)
        .bindPopup(
          `<strong>${c.client.full_name}</strong><br/>📄 ${c.contract_number}<br/>💰 ${parseFloat(
            String(c.total_debt_1c || "0")
          ).toLocaleString()} so'm`
        );
      clientMarkersRef.current.push(marker);
    });
  });
}, [selectedAgentData]); 
 ;
 
 


  // "Batafsil" tugmasi bosilganda modal ochish
  const openModal = () => {
    if (!selectedAgentData) return;
    const { agent, payments, notes, clients, call_history, date } = selectedAgentData;
    console.log("Barcha to'lovlar:", payments);
    console.log("Barcha to'lovlar:", notes);
    setModalData({
      name: agent.first_name,
      phone: agent.phone_number,
      date,
      payments,
      notes,
      clients,
      call_history,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="flex">
      {/* CHAP TOMON XARITA */}
      <div style={{ width: "100%", height: "100vh", position: "relative" }}>
        <div className={`agents-head space-y-2 p-4 ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
          {/* SELECT */}
          <select
            className={`select-style w-full p-2 rounded ${theme === "dark" ? "bg-gray-700 text-white" : "bg-white text-black"}`}
            onChange={(e) => {
              const index = Number(e.target.value);
              const agent = agents[index];
              if (agent) setSelectID(agent.id);
            }}
            defaultValue=""
          >
            <option value="" disabled>Agentni tanlang</option>
            {agents.map((a, i) => (
              <option key={i} value={i}>{a.first_name}</option>
            ))}
          </select>

          {/* TELEFON, VAQT */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: theme === "dark" ? "#1f2937" : "#f9f9f9",
            borderRadius: '6px',
            fontSize: '14px',
            color: theme === "dark" ? "white" : "black",
            fontWeight: 500
          }}>
            📞 {SelectID ? agents.find(a => a.id === SelectID)?.phone_number || 'Noma\'lum' : 'Tanlang'}
            &nbsp;|&nbsp;
            ⏰ {SelectID ? formatTime(agents.find(a => a.id === SelectID)?.start_time) : 'Boshlanish'}
            &nbsp;|&nbsp;
            ⏰ {SelectID ? formatTime(agents.find(a => a.id === SelectID)?.end_time) : 'Tugash'}
          </div>

          {/* SANA TANLASH */}
          <Button onClick={() => setShowCalendar(!showCalendar)}>📅 Sana tanlash</Button>

          {/* MASOFA, SANA VA BATAFSIL */}
          <Button
              onClick={openModal}
              disabled={!SelectID || !selectedAgentData}
              className="text-xs py-1 px-3"
              style={{
                opacity: SelectID && selectedAgentData ? 1 : 0.5,
                cursor: SelectID && selectedAgentData ? 'pointer' : 'not-allowed'
              }}
            >
              📄 Batafsil
            </Button>

          {/* KALENDAR */}
          {showCalendar && (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setShowCalendar(false);
              }}
              className="rounded-md border shadow-sm mt-2 calendar-navbar"
              captionLayout="dropdown"
            />
          )}
        </div>

        <div id="map" style={{ height: "calc(100vh - 200px)", width: "100%" }}></div>
      </div>

      {/* O'NG TOMON MODAL (to'liq o'ng tomonda) */}
      {isModalOpen && modalData && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '50%',
          height: '100vh',
          backgroundColor: theme === "dark" ? "#1f2937" : "white",
          color: theme === "dark" ? "white" : "black",
          borderLeft: theme === "dark" ? "1px solid #374151" : "1px solid #d1d5db",
          boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
          overflowY: 'auto',
          zIndex: 1000,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="text-xl font-bold">Agent Malumotlari</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: theme === "dark" ? "#d1d5db" : "#374151"
              }}
            >
              &times;
            </button>
          </div>

          <div className="space-y-4">
            <p><strong>Ism:</strong> {modalData.name}</p>
            <p><strong>Telefon:</strong> {modalData.phone}</p>
            <p><strong>Sana:</strong> {new Date(modalData.date).toLocaleDateString()}</p>

            {/* Tolovlar */}
            <div>
              <h3 className="font-semibold text-lg">Tolovlar</h3>
              {modalData.payments && modalData.payments.length > 0 ? (
                <ul className="space-y-2">
                  {modalData?.payments?.map((payment, index) => (
  <div key={index} className="border-b py-2">
    <p><strong>💰 Miqdor:</strong> {payment.amount} som</p>
    <p><strong>📄 Shartnoma raqami:</strong> {payment.contract_number}</p>
    <p><strong>👤 Mijoz ID:</strong> {payment.client_id}</p>
    <p><strong>🕒 To‘langan vaqt:</strong> {new Date(payment.paid_at).toLocaleString()}</p>
    <p><strong>📝 Izoh:</strong> {payment.note_comment || "Izoh yo'q"}</p>
  </div>
))}

                </ul>
              ) : (
                <p>Tolov mavjud emas.</p>
              )}
            </div>

            {/* Eslatmalar */}
            <div>
              <h3 className="font-semibold text-lg">Eslatmalar</h3>
              {modalData.notes && modalData.notes.length > 0 ? (
                <ul className="space-y-2">
                  {modalData.notes.map((n) => (
                    <li key={n.id} className="p-3 border rounded bg-gray-50 dark:bg-gray-700">
                      <strong>ID:</strong> {n.id} | <strong>Izoh:</strong> {n.comment} | <strong>Shartnoma:</strong> {n.contract_number}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Eslatma mavjud emas.</p>
              )}
            </div>
             <div>
        <h3 className="font-semibold text-lg">Yurilgan Masofa</h3>
        <p className="p-3 border rounded bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          📏 <strong>Jami masofa:</strong> {selectedAgentData?.location_history ? calculateMovingDistance(selectedAgentData.location_history) : 0} km
        </p>
      </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default MapHistory;