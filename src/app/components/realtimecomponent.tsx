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
import { MapPin, Users, Activity } from "lucide-react";
import toast from "react-hot-toast";


// Fix for default markers in Leaflet
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
  first_name:string;
  current_location?: {
    latitude: number;
    longitude: number;
  };
}

// Demo agents for testing when API is not available

export default function Index() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedAgentData, setSelectedAgentData] = useState<Agent | null>(
    null
  );


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [demoMode, setDemoMode] = useState(false);

  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [41.2995, 69.2401],
        12
      ); // Default to Tashkent

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);

      // Xarita o'lchamini to'g'ri render qilish uchun
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 300);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Fetch agents
  const fetchAgents = async () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    try {
      setLoading(true);
      const response = await axios.get(
        "https://gps.mxsoft.uz/account/agent-list/",
        {
          timeout: 10000,
          headers: {
            Accept: "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      const agentList = response.data.results;

      // Filter agents with valid current_location
      const validAgents = agentList.filter(
        (agent: Agent) =>
          agent.current_location &&
          agent.current_location.latitude &&
          agent.current_location.longitude
      );

      setAgents(validAgents);
      setError("");
      setDemoMode(false);
    } catch (err: unknown) {
  const axiosError = err as AxiosError;

  if (axiosError.code === "ECONNABORTED") {
    setError("Request timeout. Please check your connection and try again.");
  } else if (axiosError.response?.status === 404) {
    setError("API endpoint not found. Please verify the URL.");
  } else if (axiosError.response?.status && axiosError.response.status >= 500) {
    setError("Server error. Please try again later.");
  } else {
    setError(
      "Failed to fetch agents. This might be a CORS issue or the API is unavailable."
    );
  }

  console.error("Error fetching agents:", axiosError);
} finally {
  setLoading(false);
}
  };

  // Load demo agents
  const loadDemoAgents = () => {
    setError("");
    setDemoMode(true);
    setLoading(false);
  };

  // Update agent location on map
  const locationHistoryRef = useRef<Record<string, string[]>>({});
const warnedAgentsRef = useRef<Set<string>>(new Set());

const updateAgentOnMap = (agent: Agent) => {
  const { current_location } = agent;
  if (!current_location || !current_location.latitude || !current_location.longitude) return;

  const lat = typeof current_location.latitude === "string"
    ? parseFloat(current_location.latitude)
    : current_location.latitude;

  const lng = typeof current_location.longitude === "string"
    ? parseFloat(current_location.longitude)
    : current_location.longitude;

  if (!mapRef.current) return;

  // 🔵 LocalStorage'dan avvalgi pathni olish
  const storedPaths = localStorage.getItem("agentPaths");
  const parsedPaths: Record<string, [number, number][]> = storedPaths
    ? JSON.parse(storedPaths)
    : {};

  // 🔵 Agent uchun yangilangan path
  const newPoint: [number, number] = [lat, lng];
  const updatedAgentPath = [...(parsedPaths[agent.id] || []), newPoint];
  parsedPaths[agent.id] = updatedAgentPath;

  // 🔵 LocalStorage'ga saqlash
  localStorage.setItem("agentPaths", JSON.stringify(parsedPaths));

  // 🔵 Path chizish
  drawPath(updatedAgentPath);

  // 🔵 Marker joylashuvi
  if (!markerRefs.current[agent.id]) {
    const newMarker = L.marker([lat, lng]).addTo(mapRef.current);
    markerRefs.current[agent.id] = newMarker;
  } else {
    markerRefs.current[agent.id].setLatLng([lat, lng]);
  }

  // 🔵 Xarita markazga olib kelinadi
  mapRef.current.setView([lat, lng], 15);

  // 🧠 Location history'ni tekshirish
  const coordStr = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const history = locationHistoryRef.current[agent.id] || [];
  history.push(coordStr);
  if (history.length > 1200) history.shift(); // faqat oxirgi 5 ta

  locationHistoryRef.current[agent.id] = history;

  const allSame = history.length === 1200 && history.every((loc) => loc === history[0]);

  if (allSame && !warnedAgentsRef.current.has(agent.id)) {
    toast("Agent 10 soniyadan beri bir joyda turibdi", {
  icon: "⚠️",
  style: {
    background: "#fff7e6",
    border: "1px solid #ffc107",
    color: "#333",
  },
});

    warnedAgentsRef.current.add(agent.id);
  }

  if (!allSame && warnedAgentsRef.current.has(agent.id)) {
    warnedAgentsRef.current.delete(agent.id);
  }

  // 🔵 Console log (ixtiyoriy)
};



const pathRef = useRef<L.Polyline | null>(null);

const drawPath = (coords: [number, number][]) => {
  if (!mapRef.current) return;

  // Eski chiziqni o‘chirish
  if (pathRef.current) {
    mapRef.current.removeLayer(pathRef.current);
  }

  // Yangi yo‘lni chizish
  pathRef.current = L.polyline(coords, {
    color: "blue",
    weight: 4,
    opacity: 0.7,
  }).addTo(mapRef.current);
};


  // Track selected agent
  const startTracking = async () => {
    const agent = agents.find((a) => a.id === selectedAgent);
    if (!agent) return;

    setSelectedAgentData(agent);
    setIsTracking(true);
    updateAgentOnMap(agent);

    // Start polling for updates every 3 seconds
    trackingIntervalRef.current = setInterval(async () => {
      try {
        if (demoMode) {
          // Simulate movement for demo mode
          const currentAgent = { ...agent };
          if (currentAgent.current_location) {
            // Add small random movement
            currentAgent.current_location.latitude +=
              (Math.random() - 0.5) * 0.001;
            currentAgent.current_location.longitude +=
              (Math.random() - 0.5) * 0.001;
            setSelectedAgentData(currentAgent);
            updateAgentOnMap(currentAgent);
            setLastUpdate(new Date());
          }
        } else {
          const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
          const response = await axios.get(
            "https://gps.mxsoft.uz/account/agent-list/",
            {
              timeout: 10000,
              headers: {
                Accept: "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            }
          );
          const updatedAgents = response.data.results || [];
          const updatedAgent = updatedAgents.find(
            (a: Agent) => a.id === selectedAgent
          );

          if (updatedAgent && updatedAgent.current_location) {
            setSelectedAgentData(updatedAgent);
            updateAgentOnMap(updatedAgent);
            setLastUpdate(new Date());
          }
        }
      } catch (err) {
        console.error("Error updating agent location:", err);
      }
    }, 3000);
  };

  // Stop tracking
  const stopTracking = () => {
  setIsTracking(false);
  setSelectedAgentData(null);

  if (trackingIntervalRef.current) {
    clearInterval(trackingIntervalRef.current);
    trackingIntervalRef.current = null;
  }

  if (markerRef.current && mapRef.current) {
    mapRef.current.removeLayer(markerRef.current);
    markerRef.current = null;
  }

  // 👉 localStorage dan path'ni o'chiramiz
  localStorage.removeItem("agentPaths");
};


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);
  const markerRefs = useRef<Record<string, L.Marker>>({});


  useEffect(() => {
  if (!selectedAgent) return;

  const storedPaths = localStorage.getItem("agentPaths");
  if (storedPaths) {
    const parsedPaths: Record<string, [number, number][]> = JSON.parse(storedPaths);
    const agentPath = parsedPaths[selectedAgent] || [];
    drawPath(agentPath);
  } else {
  }
}, [selectedAgent]);




  // Initial fetch
  useEffect(() => {
    fetchAgents();
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  GPS Tracker
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time agent location monitoring
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{agents.length} agents available</span>
              </div>
              {isTracking && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <Activity className="h-4 w-4" />
                  <span>Live tracking</span>
                </div>
              )}
              {demoMode && (
                <div className="flex items-center space-x-2 text-sm text-orange-600">
                  <Activity className="h-4 w-4" />
                  <span>Demo Mode</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Agentlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div>
                    <p className="text-red-500 text-sm mb-4">{error}</p>
                    <div className="space-y-2">
                      <Button
                        onClick={fetchAgents}
                        variant="outline"
                        className="w-full"
                      >
                        Retry
                      </Button>
                      <Button
                        onClick={loadDemoAgents}
                        variant="secondary"
                        className="w-full"
                      >
                        Try Demo Mode
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Select
                      value={selectedAgent}
                      onValueChange={setSelectedAgent}
                      disabled={isTracking}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="agent tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.first_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                      {!isTracking ? (
                        <Button
                          onClick={startTracking}
                          disabled={!selectedAgent}
                          className="flex-1"
                        >
                          Boshlash
                        </Button>
                      ) : (
                        <Button
                          onClick={stopTracking}
                          variant="destructive"
                          className="flex-1"
                        >
                          Toxtatish
                        </Button>
                      )}
                      <Button
                        onClick={fetchAgents}
                        variant="outline"
                        size="icon"
                      >
                        <Activity className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Agent Info */}
            {selectedAgentData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Agent Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Name</p>
                      <p className="text-sm text-gray-900">
                        {selectedAgentData.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Coordinates
                      </p>
                      <p className="text-xs text-gray-600 font-mono">
                        {selectedAgentData.current_location
                          ? `${Number(selectedAgentData.current_location.latitude).toFixed(6)}, ${Number(selectedAgentData.current_location.longitude).toFixed(6)}`
                          : "No coordinates"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Last Update
                      </p>
                      <p className="text-xs text-gray-600">
                        {lastUpdate.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <div style={{ height: "70vh", minHeight: 400, maxHeight: "80vh" }} className="w-full rounded-lg overflow-hidden">
              <div
                id="map_error"
                ref={mapContainerRef}
                style={{ height: "100%", width: "100%" }}
                className="leaflet-map-container"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
