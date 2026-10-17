"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AlertCircle, CheckCircle2, Users, Send, TrendingUp, Navigation, ArrowRight, Activity, MapPin } from "lucide-react";
import { api } from "@/api";
import { LiveTrainResponse } from "@/types";

// ================= ICON COMPONENTS =================
const RadioIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
    <circle cx="12" cy="12" r="2"/>
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
    <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>
  </svg>
);

// High-fidelity Indian Railways Locomotive (WAP-7 / Electric Engine)
const IndianRailwaysLocomotive: React.FC<{
  size?: "sm" | "md" | "lg";
  isMoving?: boolean;
  speedKmph?: number;
}> = ({ size = "md", isMoving = true, speedKmph = 65 }) => {
  const width = size === "sm" ? 44 : size === "lg" ? 88 : 64;
  const height = size === "sm" ? 28 : size === "lg" ? 54 : 40;

  return (
    <div className={`relative flex items-center ${isMoving ? "animate-pulse" : ""}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 120 75"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-[0_4px_12px_rgba(16,185,129,0.35)]"
      >
        <defs>
          <linearGradient id="locoBody" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="35%" stopColor="#7c3aed" />
            <stop offset="70%" stopColor="#059669" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="headlightBeam" x1="120" y1="42" x2="160" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="stripe" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>

        {/* Headlight beam */}
        {isMoving && (
          <polygon points="112,40 145,28 145,56" fill="url(#headlightBeam)" opacity="0.85" />
        )}

        {/* Pantograph (Roof current collector) */}
        <path d="M45 16 L55 6 L65 16" stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50 6 L60 6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <path d="M72 16 L80 9 L88 16" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" />
        <circle cx="55" cy="5" r="1.5" fill="#34d399" />

        {/* Main Locomotive Body */}
        <path
          d="M 10 18 Q 12 16 16 16 L 98 16 Q 106 16 112 28 L 116 44 Q 116 48 112 50 L 8 50 Q 6 48 6 44 L 6 22 Q 6 18 10 18 Z"
          fill="url(#locoBody)"
          stroke="#34d399"
          strokeWidth="1.8"
        />

        {/* Aerodynamic Windshield Cab */}
        <path d="M 88 20 L 104 28 L 104 36 L 88 36 Z" fill="#0f172a" stroke="#6ee7b7" strokeWidth="1.2" />
        <line x1="96" y1="24" x2="96" y2="36" stroke="#34d399" strokeWidth="1" />

        {/* Side Windows / Ventilation Louvers */}
        <rect x="22" y="24" width="10" height="8" rx="1.5" fill="#0f172a" stroke="#a78bfa" strokeWidth="1" />
        <rect x="38" y="24" width="10" height="8" rx="1.5" fill="#0f172a" stroke="#a78bfa" strokeWidth="1" />
        <rect x="54" y="24" width="10" height="8" rx="1.5" fill="#0f172a" stroke="#a78bfa" strokeWidth="1" />
        <rect x="70" y="24" width="10" height="8" rx="1.5" fill="#0f172a" stroke="#a78bfa" strokeWidth="1" />

        {/* Indian Railways Liveried Central Stripe */}
        <rect x="6" y="38" width="108" height="4" fill="url(#stripe)" rx="1" />

        {/* Indian Railways Text / Emblem */}
        <text x="32" y="47" fill="#ffffff" fontSize="6.5" fontFamily="monospace" fontWeight="900" letterSpacing="0.8">
          IR • WAP-7
        </text>

        {/* Twin Front Headlights */}
        <circle cx="112" cy="42" r="3.2" fill="#fef08a" stroke="#ffffff" strokeWidth="1" />
        <circle cx="112" cy="42" r="1.5" fill="#ffffff" />
        <circle cx="106" cy="42" r="2.2" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />

        {/* Cowcatcher / Cattle Guard at Front */}
        <path d="M 112 50 L 118 58 L 106 58 Z" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
        <line x1="108" y1="54" x2="116" y2="54" stroke="#64748b" strokeWidth="1" />

        {/* Heavy Underframe Chassis */}
        <rect x="8" y="50" width="102" height="6" fill="#090d16" stroke="#1e293b" strokeWidth="1" />

        {/* 6 Steel Bogie Wheels with Rotation Effect */}
        <g className={isMoving ? "animate-spin-slow origin-center" : ""}>
          <circle cx="20" cy="62" r="7.5" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
          <circle cx="20" cy="62" r="2.5" fill="#a78bfa" />
          <line x1="13" y1="62" x2="27" y2="62" stroke="#64748b" strokeWidth="1" />

          <circle cx="38" cy="62" r="7.5" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
          <circle cx="38" cy="62" r="2.5" fill="#a78bfa" />
          <line x1="31" y1="62" x2="45" y2="62" stroke="#64748b" strokeWidth="1" />

          <circle cx="56" cy="62" r="7.5" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
          <circle cx="56" cy="62" r="2.5" fill="#a78bfa" />
          <line x1="49" y1="62" x2="63" y2="62" stroke="#64748b" strokeWidth="1" />

          <circle cx="78" cy="62" r="7.5" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
          <circle cx="78" cy="62" r="2.5" fill="#a78bfa" />
          <line x1="71" y1="62" x2="85" y2="62" stroke="#64748b" strokeWidth="1" />

          <circle cx="96" cy="62" r="7.5" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
          <circle cx="96" cy="62" r="2.5" fill="#a78bfa" />
          <line x1="89" y1="62" x2="103" y2="62" stroke="#64748b" strokeWidth="1" />
        </g>

        {/* Rail Track beneath */}
        <line x1="0" y1="70" x2="120" y2="70" stroke="#475569" strokeWidth="2.5" strokeDasharray="6 3" />
      </svg>
    </div>
  );
};

interface LiveTrackerTabProps {
  initialTrainNumber?: string;
}

export const LiveTrackerTab: React.FC<LiveTrackerTabProps> = ({ initialTrainNumber = "" }) => {
  const [trainQuery, setTrainQuery] = useState(initialTrainNumber);
  const [trainData, setTrainData] = useState<LiveTrainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPingModal, setShowPingModal] = useState(false);
  const [pingStation, setPingStation] = useState("");
  const [pingDelay, setPingDelay] = useState(15);
  const [pingSpeed, setPingSpeed] = useState(72);
  const [pingSubmitting, setPingSubmitting] = useState(false);
  const [pingSuccess, setPingSuccess] = useState<string | null>(null);

  const loadTrain = async (num: string) => {
    if (!num.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTrainLive(num.trim());
      setTrainData(data);
      if (data.current_station?.code) setPingStation(data.current_station.code);
    } catch {
      setError("Train not found in timetable. Try searching another number (e.g. 16128, 12625, 16302).");
      setTrainData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTrainNumber && initialTrainNumber.trim()) {
      setTrainQuery(initialTrainNumber.trim());
      loadTrain(initialTrainNumber.trim());
    }
  }, [initialTrainNumber]);

  const handlePing = async () => {
    if (!trainData) return;
    setPingSubmitting(true);
    try {
      await api.pingTrain({
        trainNumber: trainData.train_number,
        currentStation: pingStation,
        delayMin: pingDelay,
        speedKmph: pingSpeed,
      });
      setPingSuccess("Live report submitted! Timetable updated for all passengers.");
      setTimeout(() => setPingSuccess(null), 4000);
      setShowPingModal(false);
      loadTrain(trainData.train_number);
    } catch {
    } finally {
      setPingSubmitting(false);
    }
  };

  const quickTrains = [
    { num: "16128", name: "Guruvayur Exp" },
    { num: "12625", name: "Kerala Express" },
    { num: "16302", name: "Venad Express" },
    { num: "16724", name: "Anantapuri Exp" },
    { num: "12951", name: "Mumbai Rajdhani" },
  ];

  // ================= WHERE'S MY TRAIN DISTANCE CALCULATIONS =================
  const trackingMetrics = useMemo(() => {
    if (!trainData || !trainData.timeline || trainData.timeline.length === 0) return null;

    const timeline = trainData.timeline;
    let lastDepartedIdx = -1;
    let currentHaltedIdx = -1;

    for (let i = 0; i < timeline.length; i++) {
      if (timeline[i].status === "CURRENT") {
        currentHaltedIdx = i;
        break;
      }
      if (timeline[i].status === "DEPARTED") {
        lastDepartedIdx = i;
      }
    }

    // Determine the active segment
    const fromIdx = currentHaltedIdx !== -1 ? currentHaltedIdx : Math.max(0, lastDepartedIdx);
    const nextIdx = currentHaltedIdx !== -1 ? currentHaltedIdx + 1 : Math.min(timeline.length - 1, fromIdx + 1);

    const fromStop = timeline[fromIdx];
    const nextStop = timeline[nextIdx] || timeline[timeline.length - 1];

    const fromKm = fromStop?.distance_km ?? 0;
    const nextKm = nextStop?.distance_km ?? (fromKm + 45);
    const segmentSpanKm = Math.max(8, nextKm - fromKm);

    // Percentage progressed within this segment (10% to 92%)
    const rawProgress = trainData.progress_percent || 35;
    const boundedProgress = Math.min(94, Math.max(8, rawProgress));

    const kmCoveredInSegment = Math.round((boundedProgress / 100) * segmentSpanKm);
    const currentTrainPosKm = fromKm + kmCoveredInSegment;
    const kmLeftBeforeNext = Math.max(1, Math.round(nextKm - currentTrainPosKm));

    // Approximate travel time remaining (based on live speed or 60 km/h)
    const effectiveSpeed = Math.max(30, trainData.estimated_speed_kmph || 60);
    const minsLeft = Math.round((kmLeftBeforeNext / effectiveSpeed) * 60);

    return {
      lastDepartedIdx,
      currentHaltedIdx,
      fromStop,
      nextStop,
      fromKm,
      nextKm,
      boundedProgress,
      kmCoveredInSegment,
      currentTrainPosKm,
      kmLeftBeforeNext,
      minsLeft,
    };
  }, [trainData]);

  const purple = { background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" };
  const emerald = { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
      {/* Header Banner */}
      <div
        className="rounded-2xl p-6 md:p-8 space-y-5"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(0,0,0,0.95), rgba(124,58,237,0.08))",
          border: "1px solid rgba(16,185,129,0.25)",
          boxShadow: "0 0 60px rgba(16,185,129,0.08)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div
              className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }}
            >
              <RadioIcon />
              <span className="ml-1">Where's My Train Live Radar • Real-Time Engine Movement</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Live Train Tracker</h1>
            <p className="text-sm text-slate-400 mt-1">
              Track live engine position, remaining kilometers before each halt, current speed, and crowd updates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickTrains.map((qt) => (
              <button
                key={qt.num}
                onClick={() => {
                  setTrainQuery(qt.num);
                  loadTrain(qt.num);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                style={
                  trainData?.train_number === qt.num
                    ? { background: "linear-gradient(135deg,#7c3aed,#10b981)", color: "white", border: "none" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid #1a1a2e", color: "#64748b" }
                }
              >
                {qt.num} ({qt.name})
              </button>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center space-x-2 p-2 rounded-xl" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #1a1a2e" }}>
          <input
            type="text"
            value={trainQuery}
            onChange={(e) => setTrainQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadTrain(trainQuery)}
            placeholder="Enter Train Number (e.g. 16128, 12625, 16302)..."
            className="flex-1 px-4 py-3 rounded-lg text-white font-mono font-bold text-base focus:outline-none"
            style={{ background: "#0a0a16", border: "1px solid #1a1a2e" }}
          />
          <button
            onClick={() => loadTrain(trainQuery)}
            disabled={loading}
            className="px-6 py-3 font-bold text-sm rounded-lg flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7c3aed, #10b981)", color: "white", boxShadow: "0 0 20px rgba(16,185,129,0.2)" }}
          >
            {loading ? <span className="animate-spin">⌛</span> : <><RadioIcon /><span>Track Train</span></>}
          </button>
        </div>
      </div>

      {pingSuccess && (
        <div className="p-4 rounded-xl flex items-center space-x-3" style={emerald}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#34d399" }} />
          <span className="text-sm font-semibold">{pingSuccess}</span>
        </div>
      )}

      {error && (
        <div
          className="p-4 rounded-xl flex items-center space-x-3"
          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {trainData && trackingMetrics && (
        <div className="space-y-6">
          {/* Main Status & Locomotive Summary Card */}
          <div
            className="rounded-2xl p-6 shadow-2xl space-y-5"
            style={{
              background: "linear-gradient(180deg, rgba(15,15,30,0.98), rgba(10,10,22,0.98))",
              border: "1px solid rgba(124,58,237,0.3)",
              boxShadow: "0 0 40px rgba(124,58,237,0.15)",
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-start space-x-4">
                {/* Moving Locomotive Banner */}
                <div className="hidden sm:block p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <IndianRailwaysLocomotive
                    size="md"
                    isMoving={trainData.status === "IN_TRANSIT"}
                    speedKmph={trainData.estimated_speed_kmph}
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl sm:text-3xl font-black font-mono" style={{ color: "#a78bfa" }}>
                      {trainData.train_number}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-white">{trainData.train_name}</span>
                  </div>
                  <div className="text-xs sm:text-sm mt-1.5 flex flex-wrap items-center gap-2 text-slate-400">
                    <span>
                      Last Station:{" "}
                      <strong className="text-white font-mono">
                        {trainData.current_station.name} ({trainData.current_station.code})
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <ArrowRight className="w-3.5 h-3.5" />
                      Next: {trainData.next_station.name} ({trainData.next_station.code})
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPingModal(true)}
                className="px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-lg transition-transform hover:scale-105"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#10b981)",
                  color: "white",
                  boxShadow: "0 0 20px rgba(124,58,237,0.3)",
                }}
              >
                <Users className="w-4 h-4" />
                <span>I am on this Train (Check-in)</span>
              </button>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "LIVE STATUS", value: trainData.status.replace(/_/g, " "), color: "#34d399" },
                { label: "CURRENT SPEED", value: `${trainData.estimated_speed_kmph} km/h`, color: "#a78bfa" },
                {
                  label: "DELAY",
                  value: trainData.delay_min > 0 ? `+${trainData.delay_min} mins` : "On Time",
                  color: trainData.delay_min > 0 ? "#fb923c" : "#34d399",
                },
                {
                  label: "NEXT HALT DISTANCE",
                  value: `${trackingMetrics.kmLeftBeforeNext} km left`,
                  color: "#34d399",
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-3.5 rounded-xl" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid #1a1a2e" }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
                  <div className="text-base font-extrabold mt-1 font-mono" style={{ color }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Prominent Where's My Train In-Transit Alert Strip */}
            <div
              className="p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3"
              style={{
                background: "linear-gradient(90deg, rgba(16,185,129,0.15), rgba(124,58,237,0.15))",
                border: "1px solid rgba(16,185,129,0.35)",
              }}
            >
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
                  <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <span className="text-emerald-400">
                      {trackingMetrics.kmLeftBeforeNext} km left
                    </span>
                    <span>before</span>
                    <span className="underline decoration-emerald-500 underline-offset-4">
                      {trackingMetrics.nextStop.station_name} ({trackingMetrics.nextStop.station_code})
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Expected Arrival at Platform {trackingMetrics.nextStop.platform}:{" "}
                    <strong className="text-white font-mono">{trackingMetrics.nextStop.expected_arrival}</strong> •{" "}
                    Approx ~{trackingMetrics.minsLeft} mins left
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-48 text-right">
                <div className="text-[10px] text-slate-400 font-mono uppercase font-bold mb-1">
                  Segment Progress: {trackingMetrics.boundedProgress}%
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-md shadow-emerald-500/50"
                    style={{
                      width: `${trackingMetrics.boundedProgress}%`,
                      background: "linear-gradient(90deg, #7c3aed, #10b981)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Passenger Ping Crowdsource Modal */}
          {showPingModal && (
            <div
              className="p-5 rounded-2xl space-y-4"
              style={{
                background: "rgba(10,10,22,0.98)",
                border: "1px solid rgba(124,58,237,0.4)",
                boxShadow: "0 0 40px rgba(124,58,237,0.2)",
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">Passenger Crowdsource Report — {trainData.train_number}</h3>
                </div>
                <button
                  onClick={() => setShowPingModal(false)}
                  className="text-xs font-bold px-2 py-1 rounded cursor-pointer bg-slate-900 border border-slate-800 text-slate-400"
                >
                  ✕ Close
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">CURRENT / LAST STATION</label>
                  <select
                    value={pingStation}
                    onChange={(e) => setPingStation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-xs focus:outline-none font-mono bg-slate-950 border border-slate-800"
                  >
                    {trainData.timeline.map((s) => (
                      <option key={s.station_code} value={s.station_code}>
                        {s.station_code} - {s.station_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">DELAY ESTIMATE</label>
                  <div className="flex items-center space-x-1">
                    {[0, 10, 20, 35, 60].map((d) => (
                      <button
                        key={d}
                        onClick={() => setPingDelay(d)}
                        className="flex-1 py-2 rounded text-xs font-bold transition-all cursor-pointer"
                        style={
                          pingDelay === d
                            ? { background: "linear-gradient(135deg,#7c3aed,#10b981)", color: "white" }
                            : { background: "#0a0a16", border: "1px solid #1a1a2e", color: "#64748b" }
                        }
                      >
                        {d === 0 ? "0m" : `+${d}m`}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-400">SPEED (KM/H)</label>
                  <input
                    type="number"
                    value={pingSpeed}
                    onChange={(e) => setPingSpeed(Number(e.target.value))}
                    min={0}
                    max={160}
                    className="w-full px-3 py-2 rounded-lg text-white text-xs font-mono focus:outline-none bg-slate-950 border border-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handlePing}
                  disabled={pingSubmitting}
                  className="px-5 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 cursor-pointer"
                  style={{ background: "linear-gradient(135deg,#10b981,#7c3aed)", color: "white" }}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{pingSubmitting ? "Submitting..." : "Broadcast Live Ping"}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= WHERE'S MY TRAIN STATION TIMELINE ================= */}
          <div
            className="rounded-2xl p-6 shadow-xl space-y-4"
            style={{ background: "rgba(10,10,22,0.95)", border: "1px solid #1a1a2e" }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>Station-by-Station Live Track & Remaining Kilometers</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">{trainData.timeline.length} halts scheduled</span>
            </div>

            {/* Vertical Railway Track Timeline */}
            <div className="relative pl-16 sm:pl-20 space-y-6 pt-4 pb-4">
              {/* Vertical Track Rail */}
              <div
                className="absolute left-10 sm:left-12 top-6 bottom-6 w-1 rounded-full"
                style={{
                  background: "linear-gradient(180deg, #10b981 0%, #10b981 35%, #7c3aed 70%, #1e1b4b 100%)",
                }}
              />

              {trainData.timeline.map((stop, i) => {
                const isCurrent = stop.status === "CURRENT";
                const isDeparted = stop.status === "DEPARTED";
                const isUpcoming = stop.status === "UPCOMING";

                // Calculate kilometers left for upcoming stations
                const kmsRemaining = isUpcoming
                  ? Math.max(1, Math.round(stop.distance_km - trackingMetrics.currentTrainPosKm))
                  : 0;

                const isImmediateNext =
                  isUpcoming &&
                  (stop.station_code === trackingMetrics.nextStop.station_code ||
                    i === (trackingMetrics.currentHaltedIdx !== -1 ? trackingMetrics.currentHaltedIdx + 1 : trackingMetrics.lastDepartedIdx + 1));

                // Check if we should insert the In-Transit Moving Engine directly before this stop
                const shouldRenderMovingEngineBeforeThis =
                  trainData.status === "IN_TRANSIT" &&
                  isImmediateNext;

                return (
                  <React.Fragment key={stop.station_code + i}>
                    {/* IN-TRANSIT LIVE ENGINE BLOCK BETWEEN STATIONS */}
                    {shouldRenderMovingEngineBeforeThis && (
                      <div className="relative my-4 -ml-16 sm:-ml-20">
                        <div
                          className="p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
                          style={{
                            background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(124,58,237,0.18), rgba(0,0,0,0.9))",
                            border: "2px solid #10b981",
                            boxShadow: "0 0 30px rgba(16,185,129,0.3)",
                          }}
                        >
                          <div className="flex items-center space-x-4">
                            {/* Moving Indian Railways Locomotive Engine */}
                            <div className="p-2 rounded-xl bg-black/60 border border-emerald-500/40 shadow-inner">
                              <IndianRailwaysLocomotive
                                size="md"
                                isMoving={true}
                                speedKmph={trainData.estimated_speed_kmph}
                              />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                                <span className="text-sm sm:text-base font-black text-emerald-300">
                                  {trackingMetrics.kmLeftBeforeNext} km left before {stop.station_name}
                                </span>
                              </div>
                              <div className="text-xs text-slate-300 mt-1 flex items-center space-x-3">
                                <span>
                                  Speed: <strong className="text-white font-mono">{trainData.estimated_speed_kmph} km/h</strong>
                                </span>
                                <span>•</span>
                                <span>
                                  ETA: <strong className="text-emerald-400 font-mono">{stop.expected_arrival}</strong>
                                </span>
                                <span>•</span>
                                <span>Platform {stop.platform}</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress indicator */}
                          <div className="w-full sm:w-44 text-right">
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">
                              {trackingMetrics.kmCoveredInSegment} km covered • {trackingMetrics.kmLeftBeforeNext} km remaining
                            </span>
                            <div className="w-full bg-slate-950 rounded-full h-2 mt-1 overflow-hidden border border-emerald-500/30">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full"
                                style={{ width: `${trackingMetrics.boundedProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* REGULAR STATION HALT ROW */}
                    <div className="relative flex items-start space-x-4">
                      {/* Left Side: Kilometer Milestone (Where's My Train style) */}
                      <div className="absolute -left-16 sm:-left-20 w-12 text-right">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {stop.distance_km} km
                        </span>
                      </div>

                      {/* Center Node on Railway Track */}
                      <div className="absolute -left-8 sm:-left-10 mt-1 z-10">
                        {isCurrent ? (
                          /* Halted at Station with Small Locomotive */
                          <div className="relative -ml-4 -mt-2">
                            <IndianRailwaysLocomotive size="sm" isMoving={false} />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
                            </span>
                          </div>
                        ) : isDeparted ? (
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                            style={{ borderColor: "#10b981", background: "rgba(16,185,129,0.2)" }}
                          >
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          </div>
                        ) : (
                          <div
                            className="w-4 h-4 rounded-full border-2"
                            style={{
                              borderColor: isImmediateNext ? "#10b981" : "#334155",
                              background: isImmediateNext ? "#064e3b" : "#0a0a16",
                            }}
                          />
                        )}
                      </div>

                      {/* Right Side: Station Info Card */}
                      <div
                        className="flex-1 p-3.5 rounded-xl transition-all"
                        style={
                          isCurrent
                            ? {
                                background: "rgba(124,58,237,0.15)",
                                border: "1px solid rgba(124,58,237,0.45)",
                                boxShadow: "0 0 20px rgba(124,58,237,0.15)",
                              }
                            : isImmediateNext
                            ? {
                                background: "rgba(16,185,129,0.12)",
                                border: "1px solid rgba(16,185,129,0.4)",
                                boxShadow: "0 0 25px rgba(16,185,129,0.15)",
                              }
                            : isDeparted
                            ? {
                                background: "rgba(0,0,0,0.3)",
                                border: "1px solid #0d0d18",
                                opacity: 0.75,
                              }
                            : {
                                background: "rgba(10,10,22,0.85)",
                                border: "1px solid #1a1a2e",
                              }
                        }
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="font-mono font-bold text-sm"
                                style={{ color: isCurrent ? "#a78bfa" : isImmediateNext ? "#34d399" : "#c4b5fd" }}
                              >
                                {stop.station_code}
                              </span>
                              <span className="font-bold text-sm text-white">{stop.station_name}</span>

                              {isCurrent && (
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-black animate-pulse"
                                  style={{ background: "linear-gradient(135deg,#7c3aed,#10b981)", color: "white" }}
                                >
                                  HALTED AT PLATFORM
                                </span>
                              )}

                              {isImmediateNext && !isCurrent && (
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                                  style={{
                                    background: "rgba(16,185,129,0.25)",
                                    border: "1px solid #10b981",
                                    color: "#34d399",
                                  }}
                                >
                                  NEXT STOP • {kmsRemaining} KM LEFT
                                </span>
                              )}

                              {isUpcoming && !isImmediateNext && (
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold"
                                  style={{
                                    background: "rgba(124,58,237,0.15)",
                                    border: "1px solid rgba(124,58,237,0.3)",
                                    color: "#a78bfa",
                                  }}
                                >
                                  {kmsRemaining} km left
                                </span>
                              )}
                            </div>

                            <div className="text-xs mt-1 flex items-center space-x-3 text-slate-400">
                              <span>
                                Platform <strong className="text-white">P-{stop.platform}</strong>
                              </span>
                              <span>•</span>
                              <span>Halt: {stop.halt_duration_minutes}m</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-white">
                              {stop.expected_arrival} → {stop.expected_departure}
                            </div>
                            {stop.delay_minutes > 0 ? (
                              <div className="text-[11px] font-semibold text-orange-400">
                                +{stop.delay_minutes}m delay
                              </div>
                            ) : (
                              <div className="text-[10px] text-emerald-400 font-mono">On Time</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!trainData && !loading && !error && (
        <div
          className="text-center py-20 rounded-2xl space-y-4"
          style={{ background: "rgba(10,10,22,0.85)", border: "1px solid #1a1a2e" }}
        >
          <div className="mx-auto flex items-center justify-center">
            <IndianRailwaysLocomotive size="lg" isMoving={true} />
          </div>
          <h3 className="text-2xl font-bold text-white">Live Train Status & Engine Tracker</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Enter any Indian Railways train number above (e.g. 12625, 16128, 16302, 12951) to track its real-time locomotive movement, kilometers remaining before every station, and live delay offsets.
          </p>
        </div>
      )}
    </div>
  );
};
