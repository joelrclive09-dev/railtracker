"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeftRight, Calendar, Filter, CheckCircle2, Layers, Radio,
  Sparkles, Clock, RotateCcw, ChevronRight, ShieldCheck,
} from "lucide-react";
import { api } from "@/api";
import { Station, RouteOption, RouteSearchResponse } from "@/types";

// Custom SVG Icons (train-themed)
const RouteMapIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/>
    <path d="M5 8v3a2 2 0 002 2h4"/><path d="M19 16v-3a2 2 0 00-2-2h-4"/>
    <path d="M11 13l2-2 2 2"/>
  </svg>
);

const TrainIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="11" rx="2"/>
    <path d="M3 9h18"/><path d="M8 6V4"/><path d="M16 6V4"/>
    <circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/>
    <path d="M3 17h18"/>
  </svg>
);

const RECENT_KEY = "rt_recent_searches";

function loadRecent(): Array<{ from: Station; to: Station }> {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveRecent(from: Station, to: Station) {
  try {
    const list = loadRecent();
    const newEntry = { from, to };
    // Remove duplicate if same pair exists
    const filtered = list.filter(
      (r) => !(r.from.code === from.code && r.to.code === to.code)
    );
    const updated = [newEntry, ...filtered].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

interface RouteFinderTabProps {
  onTrackLive: (trainNumber: string) => void;
}

export const RouteFinderTab: React.FC<RouteFinderTabProps> = ({ onTrackLive }) => {
  const [fromQuery, setFromQuery] = useState("");
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toQuery, setToQuery] = useState("");
  const [toStation, setToStation] = useState<Station | null>(null);
  const [date, setDate] = useState("2026-10-17");

  const [fromSuggestions, setFromSuggestions] = useState<Station[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Station[]>([]);
  const [showFromMenu, setShowFromMenu] = useState(false);
  const [showToMenu, setShowToMenu] = useState(false);

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchResponse, setSearchResponse] = useState<RouteSearchResponse | null>(null);
  const [recentSearches, setRecentSearches] = useState<Array<{ from: Station; to: Station }>>([]);

  const [routeTypeFilter, setRouteTypeFilter] = useState<"all" | "direct" | "transfers">("all");
  const [sortBy, setSortBy] = useState<"duration" | "departure" | "reliability">("duration");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
    setRecentSearches(loadRecent());
  }, []);

  useEffect(() => {
    if (!fromQuery || fromQuery.length < 2) { setFromSuggestions([]); return; }
    const t = setTimeout(() => api.searchStations(fromQuery).then(setFromSuggestions), 150);
    return () => clearTimeout(t);
  }, [fromQuery]);

  useEffect(() => {
    if (!toQuery || toQuery.length < 2) { setToSuggestions([]); return; }
    const t = setTimeout(() => api.searchStations(toQuery).then(setToSuggestions), 150);
    return () => clearTimeout(t);
  }, [toQuery]);

  const executeSearch = useCallback(async (
    fCode = fromStation?.code || fromQuery.trim().split(" ")[0].toUpperCase(),
    tCode = toStation?.code || toQuery.trim().split(" ")[0].toUpperCase(),
    fSt = fromStation,
    tSt = toStation
  ) => {
    if (!fCode || !tCode) return;
    setLoading(true);
    setSearched(true);
    setPage(1);
    try {
      const data = await api.searchRoutes(fCode, tCode, date, 0);
      setSearchResponse(data);
      setRouteTypeFilter("all");
      if (fSt && tSt) {
        saveRecent(fSt, tSt);
        setRecentSearches(loadRecent());
      }
    } catch (err) {
      console.error(err);
      setSearchResponse(null);
    } finally {
      setLoading(false);
    }
  }, [fromStation, toStation, fromQuery, toQuery, date]);

  const handleSwap = () => {
    const tQ = fromQuery, tS = fromStation;
    setFromQuery(toQuery); setFromStation(toStation);
    setToQuery(tQ); setToStation(tS);
    if (toStation && tS) {
      executeSearch(toStation.code, tS.code, toStation, tS);
    }
  };

  const applyRecent = (r: { from: Station; to: Station }) => {
    setFromStation(r.from); setFromQuery(`${r.from.code} - ${r.from.name}`);
    setToStation(r.to); setToQuery(`${r.to.code} - ${r.to.name}`);
    executeSearch(r.from.code, r.to.code, r.from, r.to);
  };

  // Filter & sort
  const allRoutes = searchResponse?.routes || [];
  const directRoutes = allRoutes.filter((r) => r.transfers === 0);
  const transferRoutes = allRoutes.filter((r) => r.transfers > 0);

  let filteredRoutes = allRoutes.filter((r) => {
    if (routeTypeFilter === "direct") return r.transfers === 0;
    if (routeTypeFilter === "transfers") return r.transfers > 0;
    return true;
  });

  filteredRoutes.sort((a, b) => {
    if (sortBy === "duration") return a.total_duration_minutes - b.total_duration_minutes;
    if (sortBy === "departure") return a.departure_time.localeCompare(b.departure_time);
    return b.reliability_score - a.reliability_score;
  });

  const displayed = filteredRoutes.slice(0, page * PAGE_SIZE);

  const inputStyle = {
    background: "#0a0a16",
    border: "1px solid #1a1a2e",
    color: "white",
  };

  const focusStyle = "focus:outline-none focus:border-violet-500";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">

      {/* Hero Search Banner */}
      <div
        className="relative rounded-2xl p-6 md:p-8 space-y-6 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(0,0,0,0.9) 40%, rgba(16,185,129,0.08) 100%)",
          border: "1px solid rgba(124,58,237,0.25)",
          boxShadow: "0 0 60px rgba(124,58,237,0.1)"
        }}
      >
        {/* Background glow blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(124,58,237,0.08)" }} />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(16,185,129,0.06)" }} />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <div
                className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unlimited Graph Pathfinding Engine</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Smart Route &amp; Multi-Hop Finder
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Find every direct train and optimal 2-leg hub connections across 8,151 Indian Railway stations.
              </p>
            </div>

            {/* Recent Searches pills */}
            {recentSearches.length > 0 && (
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-1.5 mb-2">
                  <RotateCcw className="w-3 h-3" style={{ color: "#475569" }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#475569" }}>Recent Searches</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => applyRecent(r)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer hover:scale-105"
                      style={{
                        background: "rgba(124,58,237,0.1)",
                        border: "1px solid rgba(124,58,237,0.25)",
                        color: "#c4b5fd"
                      }}
                    >
                      {r.from.code} → {r.to.code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Inputs */}
          <div
            className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-4 rounded-xl"
            style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #1a1a2e" }}
          >
            {/* From */}
            <div className="relative md:col-span-4">
              <label className="block text-[11px] font-bold mb-1.5 flex items-center justify-between" style={{ color: "#64748b" }}>
                <span>ORIGIN STATION</span>
                {fromStation && <span className="font-mono" style={{ color: "#7c3aed" }}>{fromStation.code}</span>}
              </label>
              <input
                type="text" value={fromQuery}
                onChange={(e) => { setFromQuery(e.target.value); setShowFromMenu(true); }}
                onFocus={() => setShowFromMenu(true)}
                placeholder="Enter origin station (e.g. NDLS, QLN, SBC)..."
                className={`w-full px-4 py-3 rounded-lg text-white text-sm font-medium ${focusStyle}`}
                style={inputStyle}
              />
              {showFromMenu && fromSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg shadow-2xl z-50"
                  style={{ background: "#0a0a16", border: "1px solid #1a1a2e" }}>
                  {fromSuggestions.map((st) => (
                    <div key={st.code} onClick={() => { setFromStation(st); setFromQuery(`${st.code} - ${st.name}`); setShowFromMenu(false); }}
                      className="px-4 py-2.5 cursor-pointer flex items-center justify-between hover:bg-purple-900/20 border-b"
                      style={{ borderColor: "#0d0d18" }}>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm" style={{ color: "#a78bfa" }}>{st.code}</span>
                        <span className="text-sm text-white">{st.name}</span>
                      </div>
                      {st.is_hub && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>HUB</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Swap */}
            <div className="flex justify-center md:col-span-1">
              <button onClick={handleSwap}
                className="p-3 rounded-full transition-all cursor-pointer group"
                style={{ background: "#0a0a16", border: "1px solid #1a1a2e" }}
                title="Swap stations"
              >
                <ArrowLeftRight className="w-4 h-4 transition-transform group-hover:rotate-180" style={{ color: "#7c3aed" }} />
              </button>
            </div>

            {/* To */}
            <div className="relative md:col-span-4">
              <label className="block text-[11px] font-bold mb-1.5 flex items-center justify-between" style={{ color: "#64748b" }}>
                <span>DESTINATION STATION</span>
                {toStation && <span className="font-mono" style={{ color: "#10b981" }}>{toStation.code}</span>}
              </label>
              <input
                type="text" value={toQuery}
                onChange={(e) => { setToQuery(e.target.value); setShowToMenu(true); }}
                onFocus={() => setShowToMenu(true)}
                placeholder="Enter destination station (e.g. MAS, CSMT, HWH)..."
                className={`w-full px-4 py-3 rounded-lg text-white text-sm font-medium ${focusStyle}`}
                style={inputStyle}
              />
              {showToMenu && toSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg shadow-2xl z-50"
                  style={{ background: "#0a0a16", border: "1px solid #1a1a2e" }}>
                  {toSuggestions.map((st) => (
                    <div key={st.code} onClick={() => { setToStation(st); setToQuery(`${st.code} - ${st.name}`); setShowToMenu(false); }}
                      className="px-4 py-2.5 cursor-pointer flex items-center justify-between hover:bg-emerald-900/20 border-b"
                      style={{ borderColor: "#0d0d18" }}>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm" style={{ color: "#34d399" }}>{st.code}</span>
                        <span className="text-sm text-white">{st.name}</span>
                      </div>
                      {st.is_hub && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.2)", color: "#34d399" }}>HUB</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date + Search */}
            <div className="md:col-span-3 flex flex-col space-y-1.5">
              <label className="flex items-center space-x-1 text-[11px] font-bold" style={{ color: "#64748b" }}>
                <Calendar className="w-3.5 h-3.5" /><span>DATE</span>
              </label>
              <div className="flex items-center space-x-2">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-2.5 rounded-lg text-white text-xs font-mono focus:outline-none"
                  style={{ ...inputStyle, border: "1px solid #252540" }} />
                <button onClick={() => executeSearch()} disabled={loading}
                  className="flex-1 px-4 py-2.5 font-bold text-sm rounded-lg shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  style={{
                    background: loading ? "#1a1a2e" : "linear-gradient(135deg, #7c3aed, #10b981)",
                    color: "white",
                    boxShadow: "0 0 20px rgba(124,58,237,0.3)"
                  }}>
                  {loading ? <span className="animate-spin">⌛</span> : <><RouteMapIcon /><span>Search</span></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      {searchResponse && (
        <div className="space-y-4">
          <div
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl"
            style={{ background: "rgba(10,10,22,0.9)", border: "1px solid #1a1a2e" }}
          >
            {/* Route type tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0">
              {[
                { key: "all", label: "All Options", count: allRoutes.length },
                { key: "direct", label: "Direct Only", count: directRoutes.length },
                { key: "transfers", label: "2-Leg Transfers", count: transferRoutes.length },
              ].map(({ key, label, count }) => (
                <button key={key} onClick={() => setRouteTypeFilter(key as any)}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 flex-shrink-0 cursor-pointer"
                  style={{
                    background: routeTypeFilter === key
                      ? "linear-gradient(135deg, #7c3aed, #10b981)"
                      : "rgba(255,255,255,0.05)",
                    color: routeTypeFilter === key ? "white" : "#64748b",
                    border: routeTypeFilter === key ? "none" : "1px solid #1a1a2e"
                  }}>
                  <span>{label}</span>
                  <span className="px-1.5 py-0 rounded-full text-[10px]" style={{ background: "rgba(0,0,0,0.3)" }}>{count}</span>
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1" style={{ color: "#475569" }}>
                <Filter className="w-3.5 h-3.5" /><span className="font-semibold">Sort by:</span>
              </span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg text-white font-medium focus:outline-none text-xs"
                style={{ background: "#0a0a16", border: "1px solid #1a1a2e" }}>
                <option value="duration">Fastest Duration</option>
                <option value="departure">Earliest Departure</option>
                <option value="reliability">Highest Reliability</option>
              </select>
            </div>
          </div>

          {/* Summary bar */}
          <div className="flex items-center justify-between text-xs px-1" style={{ color: "#475569" }}>
            <span>
              Showing <strong className="text-white">{filteredRoutes.length}</strong> itineraries for{" "}
              <span className="font-mono" style={{ color: "#a78bfa" }}>{searchResponse.from.code}</span> →{" "}
              <span className="font-mono" style={{ color: "#34d399" }}>{searchResponse.to.code}</span>
            </span>
            <span className="flex items-center space-x-1" style={{ color: "#10b981" }}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full Graph — No result limit</span>
            </span>
          </div>

          {/* Route Cards */}
          <div className="space-y-4">
            {displayed.map((route, idx) => (
              <RouteCard key={route.id || idx} route={route} index={idx + 1}
                onTrackLive={onTrackLive} />
            ))}
          </div>

          {displayed.length < filteredRoutes.length && (
            <div className="flex justify-center pt-4">
              <button onClick={() => setPage((p) => p + 1)}
                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer"
                style={{ background: "#0a0a16", border: "1px solid #252540", color: "#94a3b8" }}>
                Load {Math.min(PAGE_SIZE, filteredRoutes.length - displayed.length)} more results
              </button>
            </div>
          )}
        </div>
      )}

      {!searched && !loading && (
        <div
          className="text-center py-20 rounded-2xl space-y-4"
          style={{ background: "rgba(10,10,22,0.85)", border: "1px solid #1a1a2e" }}
        >
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <RouteMapIcon />
          </div>
          <h3 className="text-xl font-bold text-white">Find Your Train Journey</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Enter any origin and destination station above to discover all direct trains and 2-leg transfer routes with connection reliability scores across 8,151 stations.
          </p>
        </div>
      )}

      {searched && searchResponse && filteredRoutes.length === 0 && !loading && (
        <div className="text-center py-16 rounded-2xl space-y-4"
          style={{ background: "rgba(10,10,22,0.8)", border: "1px solid #1a1a2e" }}>
          <p className="text-slate-400 text-sm">No itineraries match your filters.</p>
        </div>
      )}
    </div>
  );
};

// Route Card
interface RouteCardProps {
  route: RouteOption;
  index: number;
  onTrackLive: (n: string) => void;
}

const RouteCard: React.FC<RouteCardProps> = ({ route, index, onTrackLive }) => {
  const isDirect = route.transfers === 0;

  const scoreColor = (s: number) =>
    s >= 90 ? "#34d399" : s >= 75 ? "#a78bfa" : s >= 55 ? "#fb923c" : "#f87171";

  const cardStyle = {
    background: "rgba(10,10,22,0.95)",
    border: "1px solid #1a1a2e",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <div className="rounded-xl shadow-xl overflow-hidden card-hover-purple" style={cardStyle}>
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
        style={{ background: "rgba(0,0,0,0.6)", borderBottom: "1px solid #1a1a2e" }}>
        <div className="flex items-center space-x-3">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold"
            style={{ background: "#0d0d18", color: "#64748b" }}>#{index}</span>
          {isDirect ? (
            <span className="px-2.5 py-1 rounded-md text-xs font-bold flex items-center space-x-1.5"
              style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>
              <CheckCircle2 className="w-3.5 h-3.5" /><span>DIRECT — 0 TRANSFERS</span>
            </span>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold flex items-center space-x-1.5"
                style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}>
                <Layers className="w-3.5 h-3.5" /><span>2-LEG TRANSFER via {route.layover?.hub_code}</span>
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold flex items-center space-x-1"
                style={{
                  background: `rgba(${scoreColor(route.reliability_score).slice(1).match(/../g)!.map(h=>parseInt(h,16)).join(',')}, 0.1)`,
                  color: scoreColor(route.reliability_score),
                  border: `1px solid rgba(${scoreColor(route.reliability_score).slice(1).match(/../g)!.map(h=>parseInt(h,16)).join(',')}, 0.3)`
                }}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{route.reliability_score.toFixed(1)}% {route.reliability_rating}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs" style={{ color: "#475569" }}>Total Duration</div>
            <div className="text-base font-extrabold font-mono" style={{ color: "#a78bfa" }}>{route.total_duration_formatted}</div>
          </div>
          <div className="h-8 w-px" style={{ background: "#1a1a2e" }} />
          <div className="text-right">
            <div className="text-xs" style={{ color: "#475569" }}>Time Window</div>
            <div className="text-sm font-bold font-mono text-white">{route.departure_time} → {route.arrival_time}</div>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 space-y-3">
        {isDirect && route.legs[0] && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl"
            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="6" width="18" height="11" rx="2"/><path d="M3 9h18"/>
                  <circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/><path d="M3 17h18"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold font-mono" style={{ color: "#34d399" }}>{route.legs[0].train_number}</span>
                  <span className="text-sm font-semibold text-white">{route.legs[0].train_name}</span>
                </div>
                <div className="text-xs flex flex-wrap items-center gap-2 mt-1" style={{ color: "#64748b" }}>
                  <span>Platform <strong style={{ color: "#a78bfa" }}>P-{route.legs[0].departure_platform}</strong></span>
                  <span>•</span><span>{route.legs[0].stops_count} halts</span>
                  <span>•</span><span>{route.legs[0].departure_time} → {route.legs[0].arrival_time}</span>
                  <span>•</span><span>{route.legs[0].duration_formatted}</span>
                </div>
              </div>
            </div>
            <button onClick={() => onTrackLive(route.legs[0].train_number)}
              className="px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-all"
              style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>
              <Radio className="w-3.5 h-3.5" /><span>Track Live</span>
            </button>
          </div>
        )}

        {!isDirect && (
          <div className="space-y-3">
            {/* Leg 1 */}
            {route.legs[0] && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold font-mono"
                    style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>L1</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm" style={{ color: "#a78bfa" }}>{route.legs[0].train_number}</span>
                      <span className="text-sm text-white">{route.legs[0].train_name}</span>
                    </div>
                    <div className="text-xs flex flex-wrap items-center gap-2 mt-0.5" style={{ color: "#64748b" }}>
                      <span>{route.legs[0].from_code} ({route.legs[0].departure_time}) → {route.legs[0].to_code} ({route.legs[0].arrival_time})</span>
                      <span>•</span><span>{route.legs[0].duration_formatted}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => onTrackLive(route.legs[0].train_number)}
                  className="px-3 py-1.5 rounded-lg font-medium text-xs flex items-center space-x-1 cursor-pointer"
                  style={{ background: "#0a0a16", border: "1px solid #252540", color: "#94a3b8" }}>
                  <Radio className="w-3 h-3" style={{ color: "#a78bfa" }} /><span>Track</span>
                </button>
              </div>
            )}

            {/* Interchange Box */}
            {route.layover && (
              <div
                className="p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                style={{
                  background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(16,185,129,0.08))",
                  border: "1px solid rgba(124,58,237,0.3)"
                }}>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-xs font-black"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#10b981)", color: "white" }}>
                      TRANSFER AT {route.layover.hub_code}
                    </span>
                    <span className="text-sm font-bold" style={{ color: "#c4b5fd" }}>{route.layover.hub_name}</span>
                  </div>
                  <p className="text-xs max-w-xl" style={{ color: "#94a3b8" }}>{route.interchange_guidance}</p>
                  <div className="text-[11px] flex items-center space-x-4 font-mono" style={{ color: "#64748b" }}>
                    <span>Layover: <strong className="text-white">{route.layover.layover_formatted}</strong></span>
                    <span>Arr: <strong>P-{route.layover.arrival_platform}</strong></span>
                    <span>Dep: <strong>P-{route.layover.departure_platform}</strong></span>
                  </div>
                </div>
                <div
                  className="px-4 py-2.5 rounded-lg text-xs font-bold flex items-center space-x-2 flex-shrink-0"
                  style={{
                    background: "rgba(124, 58, 237, 0.15)",
                    border: "1px solid rgba(124, 58, 237, 0.35)",
                    color: "#c4b5fd"
                  }}
                >
                  <Layers className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
                  <span>Platform Switch:</span>
                  <span className="font-mono" style={{ color: "#34d399" }}>
                    P-{route.layover.arrival_platform} ➔ P-{route.layover.departure_platform}
                  </span>
                </div>
              </div>
            )}

            {/* Leg 2 */}
            {route.legs[1] && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl"
                style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold font-mono"
                    style={{ background: "rgba(16,185,129,0.2)", color: "#34d399" }}>L2</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm" style={{ color: "#34d399" }}>{route.legs[1].train_number}</span>
                      <span className="text-sm text-white">{route.legs[1].train_name}</span>
                    </div>
                    <div className="text-xs flex flex-wrap items-center gap-2 mt-0.5" style={{ color: "#64748b" }}>
                      <span>{route.legs[1].from_code} ({route.legs[1].departure_time}) → {route.legs[1].to_code} ({route.legs[1].arrival_time})</span>
                      <span>•</span><span>{route.legs[1].duration_formatted}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => onTrackLive(route.legs[1].train_number)}
                  className="px-3 py-1.5 rounded-lg font-medium text-xs flex items-center space-x-1 cursor-pointer"
                  style={{ background: "#0a0a16", border: "1px solid #252540", color: "#94a3b8" }}>
                  <Radio className="w-3 h-3" style={{ color: "#34d399" }} /><span>Track</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
