"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import toast from "react-hot-toast";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-expect-error - _getIconUrl may not exist in the type definition
delete (L.Icon.Default.prototype)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});



// Markerlarni to'g'ri ko'rsatish
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;


L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// TURLAR
type Contract = {
  id: number;
  clientName: string;
  amount: number;
  startDate: string;
  endDate?: string; // optional
};
type AgentLocationUpdate = {
  type: "gps_update";
  agent_id: number;
  username: string;
  full_name: string;
  phone_number: string;
  lat: number;
  lon: number;
  speed: number;
  status: boolean;
  is_working_status: boolean;
  contracts: Contract[];
  timestamp: string;
  device_id: string;
};

// REALMAP KOMPONENTI
const RealMap = () => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Record<number, L.Marker>>({});
  const pathRefs = useRef<Record<number, L.Polyline>>({});
  const locationHistoryRef = useRef<Record<number, [number, number][]>>({});
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [agents, setAgents] = useState<AgentLocationUpdate[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // WebSocket ulanish
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Token topilmadi. Iltimos, tizimga kirishni amalga oshiring.");
      return;
    }

    const socket = new WebSocket(`wss://gps.mxsoft.uz/ws/location/?token=${token}`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket ulandi");
      setIsConnected(true);
      toast.success("WebSocket ulandi");
    };

    socket.onmessage = (event) => {
      try {
        const data: AgentLocationUpdate = JSON.parse(event.data);
        console.log("📩 Kelgan ma'lumot:", data);

        if (data.type === "gps_update") {
          // 1. Agar agent hali ro'yxatda bo'lmasa, qo'shish
          setAgents((prev) => {
            const exists = prev.find((a) => a.agent_id === data.agent_id);
            if (exists) {
              return prev.map((a) => (a.agent_id === data.agent_id ? data : a));
            }
            return [...prev, data];
          });

          // 2. Xaritada yangilash
          updateAgentOnMap(data);
        }
      } catch (err) {
        console.error("❌ Xabarni parsing qilishda xato:", err);
      }
    };

    socket.onerror = (err) => {
      console.error("🚨 WebSocket xatosi:", err);
      toast.error("WebSocketda xatolik yuz berdi");
    };

    socket.onclose = () => {
      console.log("🔌 WebSocket yopildi");
      setIsConnected(false);
      toast("Ulanish uzildi. Qayta ulanish bormaydi.", { icon: "⚠️" });
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Xaritani boshlash
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current!).setView([41.3111, 69.2797], 11);
      const tileUrl =
        theme === "dark"
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      }).addTo(mapRef.current);
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [theme]);

  // Xarita o'lchamini yangilash
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, []);

  // Haqiqiy marshrutni yangilash (OpenRouteService orqali)
  const updateRouteForAgent = (agentId: number, latlngs: L.LatLng[]) => {
  if (latlngs.length < 2) return;

  // Avvalgi marshrutni o'chirish
  if (pathRefs.current[agentId]) {
    mapRef.current!.removeLayer(pathRefs.current[agentId]);
    delete pathRefs.current[agentId];
  }

  const router = L.Routing.control({
  waypoints: [
    L.latLng(41.311081, 69.240562), // Masalan: Toshkent
    L.latLng(40.37767, 71.78864),   // Masalan: Qo‘qon
  ],
  routeWhileDragging: true,
  
})
if (mapRef.current) {
  router.addTo(mapRef.current);
}


  const lastTwo = latlngs.slice(-2); 

  const control = L.Routing.control({
    waypoints: lastTwo,
    router,
    addWaypoints: false,
    draggableWaypoints: false,
    routeWhileDragging: false,
    show: false,
    createMarker: () => null,
  })
    .on("routesfound", (e) => {
      const route = e.routes[0];
      const coordinates = route.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);

      const polyline = L.polyline(coordinates, {
        color: "#1A73E8",
        weight: 5,
        opacity: 0.8,
      }).addTo(mapRef.current!);

      pathRefs.current[agentId] = polyline;
    })
    .on("routingerror", (e) => {
      console.error("🚨 Routing xatosi:", e);
      toast.error("❌ Marshrut topilmadi");
    });

  control.route(); // Muhim: marshrutni hisoblashni boshlaydi
};
 

  // Agentni xaritada yangilash
  const updateAgentOnMap = (data: AgentLocationUpdate) => {
    const { agent_id, full_name, lat, lon } = data;
    const point: [number, number] = [lat, lon];

    if (isNaN(lat) || isNaN(lon)) {
      console.warn(`⚠️ Noto'g'ri koordinatalar: agent_id=${agent_id}, lat=${lat}, lon=${lon}`);
      return;
    }

    if (!mapRef.current) {
      console.warn("Xarita hali tayyor emas");
      return;
    }

    // Marshrut tarixini yangilash
    if (!locationHistoryRef.current[agent_id]) {
      locationHistoryRef.current[agent_id] = [];
    }
    const history = locationHistoryRef.current[agent_id];
    history.push(point);
    if (history.length > 500) history.shift();

    // Marker yangilash
    if (!markerRefs.current[agent_id]) {
      const marker = L.marker(point)
        .addTo(mapRef.current)
        .bindPopup(`
          <b>👤 ${full_name}</b><br>
          📱 ${data.phone_number}<br>
          🚶‍♂️ Tezlik: ${data.speed.toFixed(2)} m/s<br>
          ⏰ ${new Date(data.timestamp).toLocaleTimeString()}
        `);
      markerRefs.current[agent_id] = marker;
    } else {
      markerRefs.current[agent_id]
        .setLatLng(point)
        .setPopupContent(`
          <b>👤 ${full_name}</b><br>
          📱 ${data.phone_number}<br>
          🚶‍♂️ Tezlik: ${data.speed.toFixed(2)} m/s<br>
          ⏰ ${new Date(data.timestamp).toLocaleTimeString()}
        `);
    }

    // MARSHRUTNI YO'LDAN CHIZISH
    if (history.length >= 2) {
  const latlngs = history.map(([lat, lon]) => L.latLng(lat, lon));
  console.log("✅ Marshrut chizish uchun latlngs:", latlngs); // 🔍 Qo‘shing

  updateRouteForAgent(agent_id, latlngs);
}


    // Agar tanlangan bo'lsa, xaritani markazga olib keling
    if (selectedAgentId === agent_id) {
      mapRef.current.setView(point, 16);
    }
  };

  // Agent tanlash
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "none") {
      setSelectedAgentId(null);
    } else {
      const id = Number(value);
      setSelectedAgentId(id);
      const agent = agents.find((a) => a.agent_id === id);
      if (agent && mapRef.current) {
        mapRef.current.setView([agent.lat, agent.lon], 16);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {/* Boshqaruv paneli */}
      <div className="p-4 bg-white dark:bg-gray-800 shadow-md flex flex-wrap gap-3 items-center">
        <h2 className="font-bold text-lg">Jonli Kuzatuv</h2>

        <select
          value={selectedAgentId ?? "none"}
          onChange={handleSelectChange}
          className="p-2 border rounded"
        >
          <option value="none">Agent tanlang</option>
          {agents.map((agent) => (
            <option key={agent.agent_id} value={agent.agent_id}>
              {agent.full_name} ({agent.username})
            </option>
          ))}
        </select>

        <span
          className={`text-sm px-3 py-1 rounded-full ${
            isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {isConnected ? "🟢 Ulangan" : "🔴 Ulanmagan"}
        </span>

        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="ml-auto p-2 bg-gray-200 dark:bg-gray-700 rounded"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>

      {/* Xarita */}
      <div
        ref={mapContainerRef}
        style={{ height: "calc(100vh - 70px)", width: "100%" }}
      ></div>

      {/* Tanlangan agent ma'lumotlari */}
      {selectedAgentId && (
        <div className="p-3 border-t bg-white dark:bg-gray-800">
          {agents
            .filter((a) => a.agent_id === selectedAgentId)
            .map((agent) => (
              <div key={agent.agent_id}>
                <b>{agent.full_name}</b> | 📱 {agent.phone_number} | 🚶‍♂️{" "}
                {agent.speed.toFixed(2)} m/s | ⏰{" "}
                {new Date(agent.timestamp).toLocaleTimeString()}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default RealMap;