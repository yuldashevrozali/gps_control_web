// src/components/realtimecomponent.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import axios, { AxiosError } from "axios";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Locate } from "lucide-react";
import toast from "react-hot-toast";

// Leaflet CSS
import "leaflet/dist/leaflet.css";

// Marker fix
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Agent {
  id: string;
  name: string;
  first_name: string;
  current_location?: {
    latitude: number | string;
    longitude: number | string;
  };
}

export default function RealTimeComponent() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedAgentData, setSelectedAgentData] = useState<Agent | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [followMode, setFollowMode] = useState(true); // Yangi: Follow Mode

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const pathRef = useRef<L.Polyline | null>(null);
  const locationHistoryRef = useRef<Record<string, string[]>>({});
  const warnedAgentsRef = useRef<Set<string>>(new Set());

  // Foydalanuvchi xaritani harakatlantirsa, followMode o'chadi
useEffect(() => {
  if (!mapRef.current) return;

  const handleUserInteraction = () => {
    if (followMode) {
      setFollowMode(false);
      toast("Follow Mode avtomatik o'chirildi", {
        icon: "🛑",
        style: { background: "#fff7e6", border: "1px solid #ffc107", color: "#333" },
      });
    }
  };

  mapRef.current.on("dragstart", handleUserInteraction);
  mapRef.current.on("zoomstart", handleUserInteraction);

  return () => {
    if (mapRef.current) {
      mapRef.current.off("dragstart", handleUserInteraction);
      mapRef.current.off("zoomstart", handleUserInteraction);
    }
  };
}, [followMode]);


  // Theme ni kuzatish
  useEffect(() => {
    const checkTheme = () => {
      const saved = localStorage.getItem("hrms-theme");
      setTheme(saved === "dark" ? "dark" : "light");
    };
    checkTheme();
    const interval = setInterval(checkTheme, 100);
    return () => clearInterval(interval);
  }, []);

  // Xaritani yaratish
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initMap = () => {
      if (!mapContainerRef.current) return;

      mapRef.current = L.map(mapContainerRef.current!, {
        zoomControl: true,
        attributionControl: true,
      }).setView([41.2995, 69.2401], 12);

      const tileUrl =
        theme === "dark"
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      const attribution =
        theme === "dark"
          ? '&copy; <a href="https://carto.com/">CartoDB</a>'
          : '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>';

      L.tileLayer(tileUrl, { attribution }).addTo(mapRef.current!);

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize(true);
        }
      }, 100);
    };

    if (mapContainerRef.current.offsetWidth === 0) {
      const timer = setTimeout(initMap, 300);
      return () => clearTimeout(timer);
    } else {
      initMap();
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
    if (!mapRef.current) return;
    const handleResize = () => {
      requestAnimationFrame(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      });
    };
    window.addEventListener("load", handleResize);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("load", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Agentlarni olish
  const fetchAgents = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Login required: Access token not found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        "https://gps.mxsoft.uz/account/agent-list/",
        {
          timeout: 10000,
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const validAgents = response.data.results.filter((agent: Agent) => {
  const latStr = agent.current_location?.latitude;
  const lngStr = agent.current_location?.longitude;

  // Faqat string yoki number bo'lsa parseFloat qilish
  const lat = typeof latStr === "string" || typeof latStr === "number"
    ? parseFloat(latStr.toString())
    : NaN;

  const lng = typeof lngStr === "string" || typeof lngStr === "number"
    ? parseFloat(lngStr.toString())
    : NaN;

  return !isNaN(lat) && !isNaN(lng);
});

      const agentsWithNumbers = validAgents.map((agent: Agent) => {
  const latStr = agent.current_location?.latitude;
  const lngStr = agent.current_location?.longitude;

  // String yoki number bo'lsa, parseFloat qilish
  const latitude = typeof latStr === "string" || typeof latStr === "number"
    ? parseFloat(latStr.toString())
    : NaN;

  const longitude = typeof lngStr === "string" || typeof lngStr === "number"
    ? parseFloat(lngStr.toString())
    : NaN;

  return {
    ...agent,
    current_location: {
      latitude,
      longitude,
    },
  };
});

      setAgents(agentsWithNumbers);
      setError("");
    } catch (err: unknown) {
      const axiosError = err as AxiosError;
      if (axiosError.code === "ECONNABORTED") {
        setError("Request timeout. Please check your connection.");
      } else if (axiosError.response?.status === 401) {
        setError("Authentication failed. Please login again.");
      } else if (axiosError.response?.status === 404) {
        setError("API endpoint not found.");
      } else if (axiosError.response?.status && axiosError.response.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("Failed to fetch agents. Check API or network.");
      }
      console.error("Error fetching agents:", axiosError);
    } finally {
      setLoading(false);
    }
  };

  const loadDemoAgents = () => {
    const demoAgents: Agent[] = [
      {
        id: "demo-1",
        name: "Demo Agent 1",
        first_name: "Demo 1",
        current_location: { latitude: 41.3112, longitude: 69.2797 },
      },
      {
        id: "demo-2",
        name: "Demo Agent 2",
        first_name: "Demo 2",
        current_location: { latitude: 41.2995, longitude: 69.2401 },
      },
    ];
    setAgents(demoAgents);
    setError("");
    setLoading(false);
    toast("Demo mode ishga tushirildi", { icon: "🌍" });
  };

  // Yo'lni chizish
  const drawPath = (coords: [number, number][]) => {
    if (!mapRef.current || coords.length === 0) return;
    if (pathRef.current) {
      mapRef.current.removeLayer(pathRef.current);
    }
    pathRef.current = L.polyline(coords, {
      color: "blue",
      weight: 4,
      opacity: 0.7,
    }).addTo(mapRef.current);
  };

  // Agentni yangilash (markazga olib kelinmaydi, faqat followMode=true bo'lsa)
 const updateAgentOnMap = (agent: Agent) => {
  const loc = agent.current_location;
  if (!loc) return;

  // Koordinatalarni xavfsiz olish
  const lat = typeof loc.latitude === "string" || typeof loc.latitude === "number"
    ? parseFloat(loc.latitude.toString())
    : NaN;

  const lng = typeof loc.longitude === "string" || typeof loc.longitude === "number"
    ? parseFloat(loc.longitude.toString())
    : NaN;

  if (isNaN(lat) || isNaN(lng) || !mapRef.current) return;

  const point: [number, number] = [lat, lng];

  // Pathni localstorage dan olish
  const stored = localStorage.getItem("agentPaths");
  const paths: Record<string, [number, number][]> = stored ? JSON.parse(stored) : {};
  const newPath = [...(paths[agent.id] || []), point];
  paths[agent.id] = newPath;
  localStorage.setItem("agentPaths", JSON.stringify(paths));

  // Yo'lni chizish
  drawPath(newPath);

  // Marker yangilash
  if (!markerRefs.current[agent.id]) {
    markerRefs.current[agent.id] = L.marker(point).addTo(mapRef.current);
  } else {
    markerRefs.current[agent.id].setLatLng(point);
  }

  // 🔹 FAQAT followMode yoqilganda xaritani markazga olib keling
  if (followMode && mapRef.current) {
  const currentView = mapRef.current.getCenter();
  const currentZoom = mapRef.current.getZoom();

  // Agar xarita allaqachon shu joyda bo‘lsa, setView qilish shart emas
  if (Math.abs(currentView.lat - lat) > 0.0001 || Math.abs(currentView.lng - lng) > 0.0001) {
    mapRef.current.setView(point, currentZoom); // zoomni o'zgartirmay, faqat markazni o'zgartiramiz
  }
}


  // Harakatsizlikni tekshirish
  const coordStr = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const history = locationHistoryRef.current[agent.id] || [];
  history.push(coordStr);
  if (history.length > 1200) history.shift();
  locationHistoryRef.current[agent.id] = history;

  const allSame = history.length === 1200 && history.every((c) => c === history[0]);
  if (allSame && !warnedAgentsRef.current.has(agent.id)) {
    toast("Agent 10 soniyadan beri bir joyda turibdi", {
      icon: "⚠️",
      style: { background: "#fff7e6", border: "1px solid #ffc107", color: "#333" },
    });
    warnedAgentsRef.current.add(agent.id);
  } else if (!allSame && warnedAgentsRef.current.has(agent.id)) {
    warnedAgentsRef.current.delete(agent.id);
  }
}; 

  // Tracking boshlash
const startTracking = async () => {
  const agent = agents.find((a) => a.id === selectedAgent);
  if (!agent) return;

  setSelectedAgentData(agent);
  setIsTracking(true);
  setFollowMode(false); // Boshida follow mode yoqilgan
  updateAgentOnMap(agent);
  setLastUpdate(new Date());

  trackingIntervalRef.current = setInterval(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get("https://gps.mxsoft.uz/account/agent-list/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedAgent = res.data.results.find((a: Agent) => a.id === selectedAgent);
      if (updatedAgent && updatedAgent.current_location) {
        setSelectedAgentData(updatedAgent);
        updateAgentOnMap(updatedAgent); // Bu yerda ham followMode tekshiriladi
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error("Tracking error:", err);
    }
  }, 3000);
};

  // Tracking to'xtatish
  const stopTracking = () => {
    setIsTracking(false);
    setSelectedAgentData(null);
    setFollowMode(false);
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    Object.values(markerRefs.current).forEach((marker) => {
      if (mapRef.current) mapRef.current.removeLayer(marker);
    });
    markerRefs.current = {};
    if (pathRef.current && mapRef.current) {
      mapRef.current.removeLayer(pathRef.current);
      pathRef.current = null;
    }
    localStorage.removeItem("agentPaths");
  };

  // Follow Mode o'zgartirish
  const toggleFollowMode = () => {
  if (!isTracking) return;
  const newMode = !followMode;
  setFollowMode(newMode);

  // Agar yangi rejim yoqilsa, xaritani agentga markazga olib keling
  if (newMode && selectedAgentData) {
    const loc = selectedAgentData.current_location;
    if (loc) {
      const lat = typeof loc.latitude === "string" || typeof loc.latitude === "number"
        ? parseFloat(loc.latitude.toString())
        : NaN;
      const lng = typeof loc.longitude === "string" || typeof loc.longitude === "number"
        ? parseFloat(loc.longitude.toString())
        : NaN;

      if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
        mapRef.current.setView([lat, lng], 15);
      }
    }
  }

  toast.success(`Follow Mode: ${newMode ? "Yoqildi" : "O'chdi"}`);
}; 

  // Agent tanlanganda pathni yuklash
  useEffect(() => {
    if (!selectedAgent) return;
    const stored = localStorage.getItem("agentPaths");
    if (stored) {
      const paths: Record<string, [number, number][]> = JSON.parse(stored);
      drawPath(paths[selectedAgent] || []);
    }
  }, [selectedAgent]);

  // Boshlang'ich yuklash
  useEffect(() => {
    fetchAgents();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-content-center align-items-center">
<div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Agentni tanlang</h3>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin h-6 w-6 border-b-2 border-blue-500 rounded-full"></div>
          </div>
        ) : error ? (
          <div>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={fetchAgents} variant="outline" className="w-full">
                Qayta urinish
              </Button>
              <Button onClick={loadDemoAgents} variant="secondary" className="w-full">
                Demo Mode
              </Button>
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div>
            <p className="text-gray-500 text-sm mb-4">Hech qanday agent topilmadi</p>
            <Button onClick={loadDemoAgents} variant="secondary" className="w-full">
              Demo Mode
            </Button>
          </div>
        ) : (
          <>
            <Select value={selectedAgent} onValueChange={setSelectedAgent} disabled={isTracking}>
              <SelectTrigger>
                <SelectValue placeholder="Agent tanlang" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.first_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 mt-3">
              {!isTracking ? (
                <Button
                  onClick={startTracking}
                  disabled={!selectedAgent}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Boshlash
                </Button>
              ) : (
                <>
                  <Button
                    onClick={stopTracking}
                    variant="destructive"
                    className="flex-1"
                  >
                    Toxtatish
                  </Button>
                  <Button
                    onClick={toggleFollowMode}
                    variant={followMode ? "default" : "outline"}
                    size="icon"
                    title="Follow Mode"
                  >
                    <Locate className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button onClick={fetchAgents} variant="outline" size="icon">
                <Activity className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {selectedAgentData && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Agent Malumotlari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Koordinatalar:</strong>{" "}
                {selectedAgentData.current_location ? (
                  (() => {
                    const lat = parseFloat(selectedAgentData.current_location!.latitude as string);
                    const lng = parseFloat(selectedAgentData.current_location!.longitude as string);
                    return isNaN(lat) || isNaN(lng)
                      ? "Noto'g'ri koordinatalar"
                      : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                  })()
                ) : (
                  "Mavjud emas"
                )}
              </p>
              <p><strong>Yangilangan:</strong> {lastUpdate.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
      

      <div
        style={{ height: "70vh", minHeight: "400px", maxHeight: "80vh" }}
        className="w-full rounded-lg overflow-hidden border"
      >
        <div
          ref={mapContainerRef}
          style={{ height: "100%", width: "100%", minHeight: "400px" }}
          className="leaflet-map-container"
        />
      </div>
    </div>
  );
}