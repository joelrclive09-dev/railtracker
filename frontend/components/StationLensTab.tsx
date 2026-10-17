"use client";

import React, { useState, useEffect } from "react";
import {
  Navigation,
  Clock,
  Train,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  Users,
  Compass,
  Radio,
} from "lucide-react";
import { api } from "@/api";
import { StationLiveBoardResponse, BoardTrain, CoachInfo } from "@/types";

interface StationLensTabProps {
  onTrackTrain: (trainNumber: string) => void;
}

export const StationLensTab: React.FC<StationLensTabProps> = ({ onTrackTrain }) => {
  const [stationCode, setStationCode] = useState("QLN");
  const [timeStr, setTimeStr] = useState("");
  const [boardData, setBoardData] = useState<StationLiveBoardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"passing" | "upcoming">("passing");
  const [selectedCoach, setSelectedCoach] = useState<{
    coach: CoachInfo;
    trainNumber: string;
    trainName: string;
  } | null>(null);

  // Load live board data
  const loadBoard = async (stCode = stationCode, t = timeStr) => {
    setLoading(true);
    try {
      const data = await api.getStationLiveBoard(stCode, t);
      setBoardData(data);
      if (!t && data.query_time) {
        setTimeStr(data.query_time);
      }
      // If no passing trains right now, default to upcoming so user sees results immediately
      if (data.passing_now.length === 0 && data.upcoming.length > 0) {
        setActiveSubTab("upcoming");
      }
    } catch (err) {
      console.error("Board error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoard("QLN");
  }, []);

  const quickStations = [
    { code: "QLN", name: "KOLLAM JN" },
    { code: "TPJ", name: "TIRUCHIRAPPALLI" },
    { code: "TVC", name: "TRIVANDRUM" },
    { code: "ERS", name: "ERNAKULAM JN" },
    { code: "MAS", name: "CHENNAI CENTRAL" },
    { code: "NDLS", name: "NEW DELHI" },
    { code: "SBC", name: "BENGALURU CITY" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 border border-slate-700/60 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Navigation className="w-3.5 h-3.5" />
              <span>&ldquo;Shazam for Trains&rdquo; • Platform Lens</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Live Station Lens &amp; Coach Radar
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl">
              Identify trains passing or stationed at your platform right now, with live
              rake composition, platform pillar markers, and vacant berth counts per coach.
            </p>
          </div>

          {/* Quick Select Station Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {quickStations.map((qs) => (
              <button
                key={qs.code}
                onClick={() => {
                  setStationCode(qs.code);
                  loadBoard(qs.code);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  stationCode === qs.code
                    ? "bg-amber-500 text-black border-amber-400 font-bold"
                    : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
              >
                {qs.code} ({qs.name.split(" ")[0]})
              </button>
            ))}
          </div>
        </div>

        {/* Station Code & Time Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div className="md:col-span-6">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              STATION CODE / JUNCTION
            </label>
            <input
              type="text"
              value={stationCode}
              onChange={(e) => setStationCode(e.target.value.toUpperCase())}
              placeholder="Enter Station Code (e.g. QLN, TPJ, MAS)..."
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>TIME WINDOW (HH:MM IST)</span>
            </label>
            <input
              type="text"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              placeholder="e.g. 14:30 (leave blank for Now)"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              onClick={() => loadBoard()}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block animate-spin">⌛</span>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Scan Platform</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Board Content */}
      {boardData && (
        <div className="space-y-6">
          {/* Station Info & Sub-Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-amber-400 font-mono text-xl font-black">
                  {boardData.station.code}
                </span>
                <span className="text-white text-lg font-bold">
                  {boardData.station.name}
                </span>
                {boardData.station.is_hub && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                    MAJOR JUNCTION HUB
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Scan time reference: <strong className="text-white font-mono">{boardData.query_time} IST</strong>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveSubTab("passing")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  activeSubTab === "passing"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>At Platform / Passing Now</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                  {boardData.passing_now.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab("upcoming")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  activeSubTab === "upcoming"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>Upcoming Next 2 Hours</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                  {boardData.upcoming.length}
                </span>
              </button>
            </div>
          </div>

          {/* Trains List */}
          {activeSubTab === "passing" && (
            <div className="space-y-4">
              {boardData.passing_now.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
                  <Clock className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-slate-300 font-semibold text-sm">
                    No trains currently halted at platform within [-10m, +15m].
                  </p>
                  <p className="text-slate-500 text-xs">
                    Switch to &quot;Upcoming Next 2 Hours&quot; to see approaching arrivals.
                  </p>
                </div>
              ) : (
                boardData.passing_now.map((train) => (
                  <StationTrainCard
                    key={train.train_number}
                    train={train}
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
                <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <p className="text-slate-400 text-sm">
                    No upcoming trains scheduled in the next 120 minutes.
                  </p>
                </div>
              ) : (
                boardData.upcoming.map((train) => (
                  <StationTrainCard
                    key={train.train_number}
                    train={train}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded bg-amber-500 text-black font-black font-mono text-sm">
                    {selectedCoach.coach.id}
                  </span>
                  <span className="text-base font-bold text-white">
                    {selectedCoach.coach.type}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Train {selectedCoach.trainNumber} • {selectedCoach.trainName}
                </div>
              </div>
              <button
                onClick={() => setSelectedCoach(null)}
                className="text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  PLATFORM PILLAR
                </div>
                <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
                  {selectedCoach.coach.pillar}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Stand near this pillar
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  VACANT BERTHS
                </div>
                <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                  {selectedCoach.coach.vacant_berths > 0
                    ? `${selectedCoach.coach.vacant_berths} Seats`
                    : "Crowded / Full"}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {selectedCoach.coach.occupancy}% Occupancy
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="font-semibold text-white flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-amber-400" />
                <span>Coach Amenities &amp; Boarding Guide</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Charging sockets available at window berths</li>
                <li>Biometric door locks &amp; emergency brake pull</li>
                <li>Direct access to onboard catering &amp; pantry car</li>
              </ul>
            </div>

            <button
              onClick={() => setSelectedCoach(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Done Exploring
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Train Live Board Card with Coach Position Strip
interface StationTrainCardProps {
  train: BoardTrain;
  onTrackTrain: (trainNumber: string) => void;
  onSelectCoach: (coach: CoachInfo) => void;
}

const StationTrainCard: React.FC<StationTrainCardProps> = ({
  train,
  onTrackTrain,
  onSelectCoach,
}) => {
  // Class color coding
  const getCoachColor = (id: string) => {
    if (id === "ENG") return "bg-slate-700 text-white border-slate-600";
    if (id.startsWith("GEN") || id === "SLR") return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    if (id.startsWith("S")) return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    if (id.startsWith("B")) return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    if (id.startsWith("A")) return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
      {/* Top Details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex flex-col items-center justify-center text-amber-400 font-mono flex-shrink-0">
            <span className="text-[10px] uppercase font-bold leading-none">PF</span>
            <span className="text-xl font-black leading-tight">{train.platform}</span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black text-amber-400 font-mono">
                {train.train_number}
              </span>
              <span className="text-base font-bold text-white">
                {train.train_name}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>{train.origin} → {train.destination}</span>
              <span>•</span>
              <span className="font-mono">
                Arr: <strong className="text-white">{train.expected_arrival}</strong> • Dep: <strong className="text-white">{train.expected_departure}</strong>
              </span>
              {train.delay_min > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-semibold text-[10px]">
                  +{train.delay_min}m delay
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Pill & Action */}
        <div className="flex items-center space-x-3 self-end sm:self-center">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {train.status.replace(/_/g, " ")}
          </span>
          <button
            onClick={() => onTrackTrain(train.train_number)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-black text-slate-300 font-bold text-xs border border-slate-700 transition-all flex items-center space-x-1 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>Track</span>
          </button>
        </div>
      </div>

      {/* Horizontal Coach Position & Live Vacant Berth Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center space-x-1">
            <Train className="w-3.5 h-3.5 text-amber-400" />
            <span>Coach Layout &amp; Platform Pillar Radar (Click any coach)</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {train.coaches.length} Coaches in Rake
          </span>
        </div>

        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="flex items-center space-x-2 min-w-max">
            {train.coaches.map((c, i) => (
              <div
                key={c.id + i}
                onClick={() => onSelectCoach(c)}
                className={`flex-shrink-0 w-24 p-2.5 rounded-xl border text-center cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${getCoachColor(
                  c.id
                )}`}
              >
                <div className="text-xs font-black font-mono">{c.id}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {c.pillar}
                </div>
                <div className="mt-2 text-[10px] font-bold">
                  {c.vacant_berths > 0 ? (
                    <span className="text-emerald-400">{c.vacant_berths} Open</span>
                  ) : (
                    <span className="text-slate-400">Full</span>
                  )}
                </div>
                {/* Mini Occupancy Bar */}
                <div className="w-full bg-black/40 h-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-amber-400 h-1 rounded-full"
                    style={{ width: `${c.occupancy}%` }}
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
