"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { Clock, Search, MapPin, Navigation, Radio, Info } from "lucide-react";
import { api } from "@/api";
import { StationLiveBoardResponse, BoardTrain, CoachInfo, Station } from "@/types";
import { findNearestStations, getStationCoords } from "@/utils/stationCoords";

// Dynamic import for Leaflet-based Google Satellite Radar
const ChaloSatelliteMap = dynamic(
  () => import("./ChaloSatelliteMap").then((m) => m.ChaloSatelliteMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-[460px] rounded-2xl flex flex-col items-center justify-center space-y-3"
        style={{ background: "#050811", border: "1px solid #1a1a2e" }}
      >
        <span className="inline-block animate-spin text-2xl">🛰️</span>
        <span className="text-xs font-mono text-slate-400">Loading Satellite Radar Engine...</span>
      </div>
    ),
  }
);

// Custom SVG Icons
const SignalIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h.01M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>
  </svg>
);

const TrainIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="11" rx="2"/>
    <path d="M3 9h18"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/>
    <path d="M3 17h18"/>
    <rect x="7" y="11" width="3" height="3" rx="0.5" fill="currentColor" stroke="none"/>
    <rect x="14" y="11" width="3" height="3" rx="0.5" fill="currentColor" stroke="none"/>
  </svg>
);

interface StationLensTabProps {
  onTrackTrain: (trainNumber: string) => void;
}

export const StationLensTab: React.FC<StationLensTabProps> = ({ onTrackTrain }) => {
  const [stationCode, setStationCode] = useState("QLN");
  const [stationName, setStationName] = useState("KOLLAM JN");
  const [timeStr, setTimeStr] = useState("");
  const [boardData, setBoardData] = useState<StationLiveBoardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"passing" | "upcoming">("passing");

  // Geolocation & Nearby Stations
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locStatus, setLocStatus] = useState<string>("Detecting GPS location...");
  const [nearbyStations, setNearbyStations] = useState<Array<{ code: string; name: string; distanceKm: number }>>([]);
  const [isGpsActive, setIsGpsActive] = useState(false);

  // Station Autocomplete (all 8,151 stations)
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Station[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Selected train for map / coach detail
  const [selectedTrainNumber, setSelectedTrainNumber] = useState<string | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<{
    coach: CoachInfo;
    trainNumber: string;
    trainName: string;
  } | null>(null);

  const userSelectedRef = useRef(false);
  const boardDataRef = useRef<StationLiveBoardResponse | null>(null);

  const loadBoard = useCallback(async (stCode = stationCode, t = timeStr) => {
    setLoading(true);
    try {
      const data = await api.getStationLiveBoard(stCode, t);
      setBoardData(data);
      boardDataRef.current = data;
      setStationCode(data.station.code);
      setStationName(data.station.name);
      if (!t && data.query_time) setTimeStr(data.query_time);
      if (data.passing_now.length === 0 && data.upcoming.length > 0) setActiveSubTab("upcoming");

      // Auto-select first train for satellite highlight
      if (data.passing_now.length > 0) {
        setSelectedTrainNumber(data.passing_now[0].train_number);
      } else if (data.upcoming.length > 0) {
        setSelectedTrainNumber(data.upcoming[0].train_number);
      }
    } catch (err) {
      console.error("Board error:", err);
    } finally {
      setLoading(false);
    }
  }, [stationCode, timeStr]);

  const handleSelectStation = (code: string, name?: string) => {
    userSelectedRef.current = true;
    setStationCode(code);
    if (name) setStationName(name);
    loadBoard(code);
  };

  // GPS Device Location Detection (runs on initial mount or manual button click)
  const detectLocation = useCallback(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setLocStatus("Acquiring high-accuracy GPS coordinates...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setUserLocation({ lat, lon });
          setIsGpsActive(true);

          const nearest = findNearestStations(lat, lon, 6);
          setNearbyStations(nearest);

          // ONLY switch station if user has not already picked another station!
          if (!userSelectedRef.current && nearest.length > 0) {
            const closest = nearest[0];
            setStationCode(closest.code);
            setStationName(closest.name);
            setLocStatus(`📍 Nearest Station: ${closest.name} (${closest.distanceKm} km away)`);
            loadBoard(closest.code);
          } else if (nearest.length > 0) {
            setLocStatus(`📍 GPS Active. Nearest Station: ${nearest[0].name} (${nearest[0].distanceKm} km away)`);
          }
        },
        (err) => {
          console.warn("GPS Geolocation error/declined:", err);
          setIsGpsActive(false);
          setLocStatus("Location access blocked. Pick or search any station below.");
          if (!userSelectedRef.current && !boardDataRef.current) {
            loadBoard("QLN");
          }
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      if (!userSelectedRef.current && !boardDataRef.current) {
        loadBoard("QLN");
      }
    }
  }, [loadBoard]);

  useEffect(() => {
    loadBoard("QLN");
    detectLocation();
  }, []); // Run on mount

  // Periodic simultaneous live radar refresh (every 8 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (stationCode) {
        api.getStationLiveBoard(stationCode, timeStr).then((data) => {
          setBoardData(data);
          boardDataRef.current = data;
        }).catch(() => {});
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [stationCode, timeStr]);

  // Autocomplete debounced search for all 8,151 stations
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      api.searchStations(searchQuery.trim()).then(setSuggestions).catch(() => setSuggestions([]));
    }, 180);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Compute active station lat/lon for the satellite map
  const stationCoords = getStationCoords(stationCode, stationName);
  const activeStationWithCoords = {
    code: stationCode,
    name: stationName,
    lat: stationCoords.lat,
    lon: stationCoords.lon,
  };

  // Combine passing now and upcoming for satellite visualization
  const allCurrentTrains = useMemo(() => {
    return boardData
      ? [...boardData.passing_now, ...boardData.upcoming.slice(0, 8)]
      : [];
  }, [boardData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
      {/* Header Banner */}
      <div
        className="rounded-2xl p-6 md:p-8 space-y-6"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(0,0,0,0.92), rgba(124,58,237,0.06))",
          border: "1px solid rgba(16,185,129,0.25)",
          boxShadow: "0 0 60px rgba(16,185,129,0.08)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div
              className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2"
              style={{
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.3)",
                color: "#34d399",
              }}
            >
              <SignalIcon />
              <span className="ml-1">Chalo-Style Live Train Radar • Satellite View</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Live Station Lens & Moving Train Radar
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-2xl">
              Track trains approaching and passing near your GPS location in real time on high-resolution Google Satellite imagery, with platform coach layouts and vacant berths.
            </p>
          </div>

          {/* GPS Auto-Detect Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={detectLocation}
              className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 cursor-pointer shadow-lg transition-transform hover:scale-105"
              style={{
                background: isGpsActive
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #7c3aed, #10b981)",
                color: "white",
                boxShadow: "0 0 25px rgba(16,185,129,0.3)",
              }}
            >
              <Navigation className="w-4 h-4" />
              <span>{isGpsActive ? "📍 Update GPS Location" : "📍 Detect My Location"}</span>
            </button>
          </div>
        </div>

        {/* GPS Proximity Bar */}
        <div
          className="p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
          style={{ background: "rgba(0,0,0,0.6)", border: "1px solid #1a1a2e" }}
        >
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300 font-medium">{locStatus}</span>
          </div>

          {/* Quick Nearby Station Pills */}
          {nearbyStations.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold mr-1">Nearby Stations:</span>
              {nearbyStations.map((st) => (
                <button
                  key={st.code}
                  onClick={() => handleSelectStation(st.code, st.name)}
                  className="px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer"
                  style={
                    stationCode === st.code
                      ? { background: "linear-gradient(135deg,#7c3aed,#10b981)", color: "white" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid #1a1a2e", color: "#94a3b8" }
                  }
                >
                  {st.code} ({st.distanceKm}km)
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Universal Station Search for ALL 8,151 Stations */}
        <div
          className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-4 rounded-xl relative"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #1a1a2e" }}
        >
          <div className="md:col-span-6 relative">
            <label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>
              SEARCH ANY STATION (8,151 STATIONS DATABASE)
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={`Current: ${stationCode} - ${stationName} (type to change)...`}
                className="w-full px-4 py-2.5 rounded-lg text-white font-mono font-bold text-sm focus:outline-none pl-9"
                style={{ background: "#0a0a16", border: "1px solid #1a1a2e" }}
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            </div>

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute z-50 left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto"
                style={{ background: "#0a0a16", border: "1px solid rgba(124,58,237,0.4)" }}
              >
                {suggestions.map((st) => (
                  <div
                    key={st.code}
                    onClick={() => {
                      handleSelectStation(st.code, st.name);
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                    className="px-4 py-2.5 hover:bg-slate-900 cursor-pointer flex items-center justify-between border-b border-slate-800/50"
                  >
                    <div>
                      <span className="font-mono font-bold text-sm text-purple-400 mr-2">{st.code}</span>
                      <span className="text-xs text-white">{st.name}</span>
                    </div>
                    {st.is_hub && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300">
                        HUB
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold mb-1 flex items-center space-x-1" style={{ color: "#64748b" }}>
              <Clock className="w-3.5 h-3.5" />
              <span>TIME WINDOW (HH:MM IST)</span>
            </label>
            <input
              type="text"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              placeholder="e.g. 14:30 (leave blank for Now)"
              className="w-full px-4 py-2.5 rounded-lg text-white font-mono text-sm focus:outline-none"
              style={{ background: "#0a0a16", border: "1px solid #1a1a2e" }}
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              onClick={() => loadBoard()}
              disabled={loading}
              className="w-full py-2.5 font-bold text-sm rounded-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #10b981)",
                color: "white",
                boxShadow: "0 0 20px rgba(16,185,129,0.2)",
              }}
            >
              {loading ? <span className="animate-spin">⌛</span> : <><SignalIcon /><span className="ml-1">Scan Radar</span></>}
            </button>
          </div>
        </div>
      </div>

      {/* ================= CHALO APP STYLE GOOGLE SATELLITE RADAR ================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-base font-bold text-white">🛰️ Live Trains on Satellite Map</span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
              style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}
            >
              CHALO-RADAR
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Centred at <strong className="text-white">{stationCode}</strong> • Click any train marker on map
          </span>
        </div>

        <ChaloSatelliteMap
          userLocation={userLocation}
          station={activeStationWithCoords}
          trains={allCurrentTrains}
          selectedTrainNumber={selectedTrainNumber}
          onSelectTrain={(train) => {
            setSelectedTrainNumber(train.train_number);
          }}
          onTrackTrain={onTrackTrain}
        />
      </div>

      {/* ================= BOARD CONTENT & TABS ================= */}
      {boardData && (
        <div className="space-y-6">
          {/* Station Info & Sub-Tabs */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl"
            style={{ background: "rgba(10,10,22,0.95)", border: "1px solid #1a1a2e" }}
          >
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xl font-black" style={{ color: "#a78bfa" }}>
                  {boardData.station.code}
                </span>
                <span className="text-white text-lg font-bold">{boardData.station.name}</span>
                {boardData.station.is_hub && (
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      background: "rgba(124,58,237,0.15)",
                      border: "1px solid rgba(124,58,237,0.3)",
                      color: "#a78bfa",
                    }}
                  >
                    MAJOR HUB
                  </span>
                )}
              </div>
              <div className="text-xs mt-1" style={{ color: "#475569" }}>
                Live scan time: <strong className="text-white font-mono">{boardData.query_time} IST</strong>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {(["passing", "upcoming"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer"
                  style={
                    activeSubTab === tab
                      ? { background: "linear-gradient(135deg,#7c3aed,#10b981)", color: "white" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid #1a1a2e", color: "#64748b" }
                  }
                >
                  <span>{tab === "passing" ? "At Platform / Passing Now" : "Upcoming Next 2 Hours"}</span>
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-black"
                    style={{ background: "rgba(0,0,0,0.4)", color: "white" }}
                  >
                    {tab === "passing" ? boardData.passing_now.length : boardData.upcoming.length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Trains List */}
          {activeSubTab === "passing" && (
            <div className="space-y-4">
              {boardData.passing_now.length === 0 ? (
                <div
                  className="text-center py-12 rounded-2xl space-y-2"
                  style={{ background: "rgba(10,10,22,0.7)", border: "1px solid #1a1a2e" }}
                >
                  <Clock className="w-10 h-10 mx-auto" style={{ color: "#252540" }} />
                  <p className="font-semibold text-sm text-slate-400">
                    No trains currently halted at platform within [-10m, +15m].
                  </p>
                  <p className="text-xs" style={{ color: "#475569" }}>
                    Switch to &quot;Upcoming Next 2 Hours&quot; to see approaching arrivals.
                  </p>
                </div>
              ) : (
                boardData.passing_now.map((train) => (
                  <StationTrainCard
                    key={train.train_number}
                    train={train}
                    isSelected={selectedTrainNumber === train.train_number}
                    onTrackTrain={onTrackTrain}
                    onSelectCoach={(coach) =>
                      setSelectedCoach({
                        coach,
                        trainNumber: train.train_number,
                        trainName: train.train_name,
                      })
                    }
                  />
                ))
              )}
            </div>
          )}

          {activeSubTab === "upcoming" && (
            <div className="space-y-4">
              {boardData.upcoming.length === 0 ? (
                <div
                  className="text-center py-12 rounded-2xl"
                  style={{ background: "rgba(10,10,22,0.7)", border: "1px solid #1a1a2e" }}
                >
                  <p className="text-slate-400 text-sm">No upcoming trains scheduled in the next 120 minutes.</p>
                </div>
              ) : (
                boardData.upcoming.map((train) => (
                  <StationTrainCard
                    key={train.train_number}
                    train={train}
                    isSelected={selectedTrainNumber === train.train_number}
                    onTrackTrain={onTrackTrain}
                    onSelectCoach={(coach) =>
                      setSelectedCoach({
                        coach,
                        trainNumber: train.train_number,
                        trainName: train.train_name,
                      })
                    }
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Coach Detail Inspection Modal */}
      {selectedCoach && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5"
            style={{
              background: "rgba(10,10,22,0.98)",
              border: "1px solid rgba(124,58,237,0.4)",
              boxShadow: "0 0 60px rgba(124,58,237,0.15)",
            }}
          >
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid #1a1a2e" }}>
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className="px-2.5 py-1 rounded font-black font-mono text-sm"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#10b981)", color: "white" }}
                  >
                    {selectedCoach.coach.id}
                  </span>
                  <span className="text-base font-bold text-white">{selectedCoach.coach.type}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: "#475569" }}>
                  Train {selectedCoach.trainNumber} • {selectedCoach.trainName}
                </div>
              </div>
              <button
                onClick={() => setSelectedCoach(null)}
                className="text-xs font-bold px-2 py-1 rounded cursor-pointer"
                style={{ background: "#0a0a16", border: "1px solid #1a1a2e", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ background: "#0a0a16", border: "1px solid #1a1a2e" }}>
                <div className="text-[10px] font-semibold uppercase" style={{ color: "#475569" }}>
                  PLATFORM PILLAR
                </div>
                <div className="text-lg font-black font-mono mt-0.5" style={{ color: "#a78bfa" }}>
                  {selectedCoach.coach.pillar}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>
                  Stand near this pillar
                </div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: "#0a0a16", border: "1px solid #1a1a2e" }}>
                <div className="text-[10px] font-semibold uppercase" style={{ color: "#475569" }}>
                  VACANT BERTHS
                </div>
                <div className="text-lg font-black font-mono mt-0.5" style={{ color: "#34d399" }}>
                  {selectedCoach.coach.vacant_berths > 0
                    ? `${selectedCoach.coach.vacant_berths} Seats`
                    : "Crowded / Full"}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>
                  {selectedCoach.coach.occupancy}% Occupancy
                </div>
              </div>
            </div>

            <div
              className="p-3 rounded-xl space-y-2 text-xs"
              style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              <div className="font-semibold text-white flex items-center space-x-1.5">
                <Info className="w-4 h-4" style={{ color: "#7c3aed" }} />
                <span>Coach Amenities & Boarding Guide</span>
              </div>
              <ul className="list-disc list-inside space-y-1" style={{ color: "#64748b" }}>
                <li>Charging sockets available at window berths</li>
                <li>Biometric door locks & emergency brake pull</li>
                <li>Direct access to onboard catering & pantry car</li>
              </ul>
            </div>

            <button
              onClick={() => setSelectedCoach(null)}
              className="w-full py-2.5 font-bold text-xs rounded-xl cursor-pointer transition-all"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.2)",
                color: "#a78bfa",
              }}
            >
              Done Exploring
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── StationTrainCard Component ──────────────────────────────────────
interface StationTrainCardProps {
  train: BoardTrain;
  isSelected?: boolean;
  onTrackTrain: (trainNumber: string) => void;
  onSelectCoach: (coach: CoachInfo) => void;
}

const StationTrainCard: React.FC<StationTrainCardProps> = ({
  train,
  isSelected,
  onTrackTrain,
  onSelectCoach,
}) => {
  const getCoachStyle = (id: string): React.CSSProperties => {
    if (id === "ENG") return { background: "rgba(100,116,139,0.2)", border: "1px solid rgba(100,116,139,0.4)", color: "#94a3b8" };
    if (id.startsWith("GEN") || id === "SLR") return { background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.3)", color: "#fb923c" };
    if (id.startsWith("S")) return { background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa" };
    if (id.startsWith("B")) return { background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" };
    if (id.startsWith("A")) return { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" };
    return { background: "rgba(255,255,255,0.04)", border: "1px solid #1a1a2e", color: "#64748b" };
  };

  return (
    <div
      className="rounded-2xl p-5 shadow-xl space-y-4 transition-all"
      style={{
        background: isSelected ? "rgba(124, 58, 237, 0.08)" : "rgba(10,10,22,0.95)",
        border: isSelected ? "1px solid rgba(16,185,129,0.4)" : "1px solid #1a1a2e",
        boxShadow: isSelected ? "0 0 30px rgba(16,185,129,0.1)" : undefined,
      }}
    >
      {/* Top Details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4" style={{ borderBottom: "1px solid #1a1a2e" }}>
        <div className="flex items-start space-x-3.5">
          {/* Platform Badge */}
          <div
            className="w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono flex-shrink-0"
            style={{
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.3)",
              color: "#a78bfa",
            }}
          >
            <span className="text-[10px] uppercase font-bold leading-none">PF</span>
            <span className="text-xl font-black leading-tight">{train.platform}</span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black font-mono" style={{ color: "#a78bfa" }}>
                {train.train_number}
              </span>
              <span className="text-base font-bold text-white">{train.train_name}</span>
            </div>
            <div className="text-xs mt-1 flex flex-wrap items-center gap-2" style={{ color: "#475569" }}>
              <span>
                {train.origin} → {train.destination}
              </span>
              <span>•</span>
              <span className="font-mono">
                Arr: <strong className="text-white">{train.expected_arrival}</strong> • Dep:{" "}
                <strong className="text-white">{train.expected_departure}</strong>
              </span>
              {train.delay_min > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c" }}
                >
                  +{train.delay_min}m delay
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-center">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.3)",
              color: "#34d399",
            }}
          >
            {train.status.replace(/_/g, " ")}
          </span>
          <button
            onClick={() => onTrackTrain(train.train_number)}
            className="px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1 cursor-pointer transition-all"
            style={{
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.3)",
              color: "#a78bfa",
            }}
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>Track Live</span>
          </button>
        </div>
      </div>

      {/* Coach Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs" style={{ color: "#475569" }}>
          <span className="font-semibold text-slate-300 flex items-center space-x-1">
            <TrainIcon />
            <span className="ml-1">Coach Layout & Platform Pillar Radar (Click any coach)</span>
          </span>
          <span className="font-mono">{train.coaches.length} Coaches</span>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex items-center space-x-2 min-w-max">
            {train.coaches.map((c, i) => (
              <div
                key={c.id + i}
                onClick={() => onSelectCoach(c)}
                className="flex-shrink-0 w-24 p-2.5 rounded-xl text-center cursor-pointer transition-all hover:scale-105"
                style={getCoachStyle(c.id)}
              >
                <div className="text-xs font-black font-mono">{c.id}</div>
                <div className="text-[10px] font-mono mt-0.5" style={{ color: "#475569" }}>
                  {c.pillar}
                </div>
                <div className="mt-2 text-[10px] font-bold">
                  {c.vacant_berths > 0 ? (
                    <span style={{ color: "#34d399" }}>{c.vacant_berths} Open</span>
                  ) : (
                    <span style={{ color: "#475569" }}>Full</span>
                  )}
                </div>
                <div className="w-full h-1 rounded-full mt-1 overflow-hidden" style={{ background: "rgba(0,0,0,0.4)" }}>
                  <div
                    className="h-1 rounded-full"
                    style={{ width: `${c.occupancy}%`, background: "linear-gradient(90deg,#7c3aed,#10b981)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
