"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Compass,
  ArrowRight,
  ArrowLeftRight,
  Clock,
  ShieldCheck,
  Calendar,
  Layers,
  Radio,
  Train,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter,
  Sparkles,
  Info,
} from "lucide-react";
import { api } from "@/api";
import { Station, RouteOption, RouteSearchResponse } from "@/types";

interface RouteFinderTabProps {
  onTrackLive: (trainNumber: string) => void;
  onView3D: (hubCode: string, arrivalPlatform: number, departurePlatform: number) => void;
}

export const RouteFinderTab: React.FC<RouteFinderTabProps> = ({
  onTrackLive,
  onView3D,
}) => {
  // Input states
  const [fromQuery, setFromQuery] = useState("QLN");
  const [fromStation, setFromStation] = useState<Station>({
    code: "QLN",
    name: "KOLLAM JN (QUILON)",
    is_hub: true,
  });
  const [toQuery, setToQuery] = useState("RMM");
  const [toStation, setToStation] = useState<Station>({
    code: "RMM",
    name: "RAMESWARAM",
    is_hub: false,
  });

  const [date, setDate] = useState("2026-10-17");

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  // Autocomplete dropdowns
  const [fromSuggestions, setFromSuggestions] = useState<Station[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Station[]>([]);
  const [showFromMenu, setShowFromMenu] = useState(false);
  const [showToMenu, setShowToMenu] = useState(false);

  // Results & Loading
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchResponse, setSearchResponse] = useState<RouteSearchResponse | null>(null);

  // Client-side Filters & Sort
  const [routeTypeFilter, setRouteTypeFilter] = useState<"all" | "direct" | "transfers">("all");
  const [selectedHub, setSelectedHub] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"duration" | "departure" | "reliability">("duration");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Search autocomplete on debounce
  useEffect(() => {
    if (!fromQuery || fromQuery.length < 2) {
      setFromSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      api.searchStations(fromQuery).then((res) => setFromSuggestions(res));
    }, 150);
    return () => clearTimeout(timer);
  }, [fromQuery]);

  useEffect(() => {
    if (!toQuery || toQuery.length < 2) {
      setToSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      api.searchStations(toQuery).then((res) => setToSuggestions(res));
    }, 150);
    return () => clearTimeout(timer);
  }, [toQuery]);

  // Execute Route Search
  const executeSearch = async (fCode = fromStation.code, tCode = toStation.code) => {
    if (!fCode || !tCode) return;
    setLoading(true);
    setSearched(true);
    setPage(1);
    try {
      const data = await api.searchRoutes(fCode, tCode, date, 0); // limit 0 = unlimited!
      setSearchResponse(data);
      setSelectedHub("ALL");
      setRouteTypeFilter("all");
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResponse(null);
    } finally {
      setLoading(false);
    }
  };

  // Run initial search on mount (QLN -> RMM)
  useEffect(() => {
    executeSearch("QLN", "RMM");
  }, []);

  // Quick route chips handler
  const setQuickRoute = (
    fromC: string,
    fromN: string,
    toC: string,
    toN: string
  ) => {
    setFromQuery(fromC);
    setFromStation({ code: fromC, name: fromN, is_hub: true });
    setToQuery(toC);
    setToStation({ code: toC, name: toN, is_hub: true });
    executeSearch(fromC, toC);
  };

  // Swap Stations
  const handleSwap = () => {
    const tempQ = fromQuery;
    const tempS = fromStation;
    setFromQuery(toQuery);
    setFromStation(toStation);
    setToQuery(tempQ);
    setToStation(tempS);
    executeSearch(toStation.code, tempS.code);
  };

  // Filter & Sort Logic
  const allRoutes = searchResponse?.routes || [];

  const directRoutes = allRoutes.filter((r) => r.transfers === 0);
  const transferRoutes = allRoutes.filter((r) => r.transfers > 0);

  // Extract all unique hubs present in transfer routes
  const availableHubs = Array.from(
    new Set(
      transferRoutes
        .map((r) => r.layover?.hub_code)
        .filter((h): h is string => Boolean(h))
    )
  );

  let filteredRoutes = allRoutes.filter((r) => {
    if (routeTypeFilter === "direct") return r.transfers === 0;
    if (routeTypeFilter === "transfers") {
      if (r.transfers === 0) return false;
      if (selectedHub !== "ALL" && r.layover?.hub_code !== selectedHub) return false;
      return true;
    }
    if (selectedHub !== "ALL" && r.transfers > 0 && r.layover?.hub_code !== selectedHub) {
      return false;
    }
    return true;
  });

  filteredRoutes.sort((a, b) => {
    if (sortBy === "duration") {
      return a.total_duration_minutes - b.total_duration_minutes;
    }
    if (sortBy === "departure") {
      return a.departure_time.localeCompare(b.departure_time);
    }
    if (sortBy === "reliability") {
      return b.reliability_score - a.reliability_score;
    }
    return 0;
  });

  const displayedRoutes = filteredRoutes.slice(0, page * pageSize);
  const hasMore = displayedRoutes.length < filteredRoutes.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 p-6 md:p-8 border border-slate-700/60 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unlimited Graph Pathfinding Engine</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Smart Route & Multi-Hop Finder
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl">
                Discover all direct trains and optimal 2-leg hub transfers with
                sub-second routing, layover reliability scoring, and 3D station walk guidance.
              </p>
            </div>

            {/* Quick Test Route Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Popular:
              </span>
              <button
                onClick={() => setQuickRoute("QLN", "KOLLAM JN (QUILON)", "RMM", "RAMESWARAM")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
              >
                QLN → RMM (Multi-Hop)
              </button>
              <button
                onClick={() => setQuickRoute("TVC", "THIRUVANANTHAPURAM", "MAS", "CHENNAI CENTRAL")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              >
                TVC → MAS (Direct)
              </button>
              <button
                onClick={() => setQuickRoute("ERS", "ERNAKULAM JN", "SBC", "KSR BENGALURU")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              >
                ERS → SBC
              </button>
              <button
                onClick={() => setQuickRoute("NDLS", "NEW DELHI", "MMCT", "MUMBAI CENTRAL")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              >
                NDLS → MMCT
              </button>
            </div>
          </div>

          {/* Search Inputs Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            {/* From Input */}
            <div className="relative md:col-span-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>ORIGIN STATION</span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {fromStation.code}
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fromQuery}
                  onChange={(e) => {
                    setFromQuery(e.target.value);
                    setShowFromMenu(true);
                  }}
                  onFocus={() => setShowFromMenu(true)}
                  placeholder="Enter Code or City (e.g. QLN, Kollam)..."
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showFromMenu && fromSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50">
                  {fromSuggestions.map((st) => (
                    <div
                      key={st.code}
                      onClick={() => {
                        setFromStation(st);
                        setFromQuery(`${st.code} - ${st.name}`);
                        setShowFromMenu(false);
                      }}
                      className="px-4 py-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-800/50 last:border-none"
                    >
                      <div>
                        <div className="text-white text-sm font-bold flex items-center space-x-2">
                          <span className="text-amber-400 font-mono">{st.code}</span>
                          <span>{st.name}</span>
                        </div>
                      </div>
                      {st.is_hub && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 font-bold rounded">
                          HUB
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center md:col-span-1">
              <button
                onClick={handleSwap}
                title="Swap Stations"
                className="p-3 rounded-full bg-slate-800 hover:bg-amber-500 hover:text-black text-slate-300 border border-slate-700 transition-all shadow-md group cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>
            </div>

            {/* To Input */}
            <div className="relative md:col-span-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>DESTINATION STATION</span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {toStation.code}
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={toQuery}
                  onChange={(e) => {
                    setToQuery(e.target.value);
                    setShowToMenu(true);
                  }}
                  onFocus={() => setShowToMenu(true)}
                  placeholder="Enter Code or City (e.g. RMM, Rameswaram)..."
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showToMenu && toSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50">
                  {toSuggestions.map((st) => (
                    <div
                      key={st.code}
                      onClick={() => {
                        setToStation(st);
                        setToQuery(`${st.code} - ${st.name}`);
                        setShowToMenu(false);
                      }}
                      className="px-4 py-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-800/50 last:border-none"
                    >
                      <div>
                        <div className="text-white text-sm font-bold flex items-center space-x-2">
                          <span className="text-amber-400 font-mono">{st.code}</span>
                          <span>{st.name}</span>
                        </div>
                      </div>
                      {st.is_hub && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 font-bold rounded">
                          HUB
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date & Search Button */}
            <div className="md:col-span-3 flex flex-col justify-end space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>TRAVEL DATE</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => executeSearch()}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block animate-spin">⌛</span>
                  ) : (
                    <>
                      <Compass className="w-4 h-4" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header, Filters & Sorting */}
      {searchResponse && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            {/* Route category tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <button
                onClick={() => setRouteTypeFilter("all")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                  routeTypeFilter === "all"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>All Options</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                  {allRoutes.length}
                </span>
              </button>

              <button
                onClick={() => setRouteTypeFilter("direct")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                  routeTypeFilter === "direct"
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>Direct Only</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                  {directRoutes.length}
                </span>
              </button>

              <button
                onClick={() => setRouteTypeFilter("transfers")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                  routeTypeFilter === "transfers"
                    ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>2-Leg Transfers</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                  {transferRoutes.length}
                </span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-400 font-semibold flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Sort by:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none focus:border-amber-400 text-xs"
              >
                <option value="duration">Fastest Duration</option>
                <option value="departure">Earliest Departure</option>
                <option value="reliability">Highest Reliability</option>
              </select>
            </div>
          </div>

          {/* Hub Filters Chips (if transfers available) */}
          {availableHubs.length > 0 && routeTypeFilter !== "direct" && (
            <div className="flex items-center space-x-2 overflow-x-auto py-1 scrollbar-thin">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
                Filter by Hub:
              </span>
              <button
                onClick={() => setSelectedHub("ALL")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors flex-shrink-0 ${
                  selectedHub === "ALL"
                    ? "bg-slate-200 text-black"
                    : "bg-slate-800/80 text-slate-400 hover:text-white"
                }`}
              >
                All Hubs ({transferRoutes.length})
              </button>
              {availableHubs.map((hub) => {
                const count = transferRoutes.filter((r) => r.layover?.hub_code === hub).length;
                return (
                  <button
                    key={hub}
                    onClick={() => setSelectedHub(hub)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-colors flex-shrink-0 ${
                      selectedHub === hub
                        ? "bg-amber-400 text-black"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-amber-300"
                    }`}
                  >
                    {hub} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Results Summary Info Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div>
              Showing{" "}
              <strong className="text-white">{filteredRoutes.length}</strong> valid{" "}
              {filteredRoutes.length === 1 ? "itinerary" : "itineraries"} for{" "}
              <span className="text-amber-400 font-mono">{searchResponse.from.code}</span> →{" "}
              <span className="text-amber-400 font-mono">{searchResponse.to.code}</span>
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full Graph Search (No 10-result limit)</span>
            </div>
          </div>

          {/* Route Cards List */}
          <div className="space-y-4">
            {displayedRoutes.map((route, idx) => (
              <RouteCard
                key={route.id || idx}
                route={route}
                index={idx + 1}
                onTrackLive={onTrackLive}
                onView3D={onView3D}
              />
            ))}
          </div>

          {/* Load More Button for smooth display */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 shadow-lg transition-all cursor-pointer"
              >
                Load Next {pageSize} Routes (Remaining: {filteredRoutes.length - displayedRoutes.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {searched && searchResponse && filteredRoutes.length === 0 && !loading && (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-4">
          <Train className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No itineraries match your criteria</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Try adjusting your hub filters or selecting &quot;All Options&quot; to see all available
            train connections.
          </p>
        </div>
      )}
    </div>
  );
};

// Individual Route Option Card
interface RouteCardProps {
  route: RouteOption;
  index: number;
  onTrackLive: (trainNumber: string) => void;
  onView3D: (hubCode: string, arrivalPlatform: number, departurePlatform: number) => void;
}

const RouteCard: React.FC<RouteCardProps> = ({
  route,
  index,
  onTrackLive,
  onView3D,
}) => {
  const isDirect = route.transfers === 0;

  // Reliability badge color
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 75) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    if (score >= 55) return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    return "text-red-400 bg-red-500/10 border-red-500/30";
  };

  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all shadow-xl overflow-hidden group">
      {/* Top Banner Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950/60 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-300">
            #{index}
          </span>
          {isDirect ? (
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>DIRECT ROUTE (0 TRANSFERS)</span>
            </span>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>2-LEG TRANSFER VIA {route.layover?.hub_code}</span>
              </span>
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center space-x-1 ${getScoreColor(
                  route.reliability_score
                )}`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {route.reliability_score.toFixed(1)}% {route.reliability_rating}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Departure -> Arrival and Total Duration */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs text-slate-400">Total Duration</div>
            <div className="text-base font-extrabold text-amber-400 font-mono">
              {route.total_duration_formatted}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-right">
            <div className="text-xs text-slate-400">Time Window</div>
            <div className="text-sm font-bold text-white font-mono">
              {route.departure_time} → {route.arrival_time}
            </div>
          </div>
        </div>
      </div>

      {/* Main Card Content */}
      <div className="p-5 space-y-4">
        {/* Direct Route Leg */}
        {isDirect && route.legs[0] && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                <Train className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold text-white font-mono">
                    {route.legs[0].train_number}
                  </span>
                  <span className="text-sm font-semibold text-slate-300">
                    {route.legs[0].train_name}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                  <span>
                    Platform <strong className="text-amber-400">{route.legs[0].departure_platform}</strong> at {route.legs[0].from_name}
                  </span>
                  <span>•</span>
                  <span>{route.legs[0].stops_count} Halts</span>
                  <span>•</span>
                  <span>Departs {route.legs[0].departure_time}</span>
                  <span>•</span>
                  <span>Arrives {route.legs[0].arrival_time}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onTrackLive(route.legs[0].train_number)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-black text-emerald-400 font-bold text-xs border border-emerald-500/30 transition-all flex items-center justify-center space-x-1.5 cursor-pointer self-end sm:self-center"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Track Live (WIMT)</span>
            </button>
          </div>
        )}

        {/* 2-Leg Transfer Route Layout */}
        {!isDirect && (
          <div className="space-y-3">
            {/* Leg 1 */}
            {route.legs[0] && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold font-mono">
                    L1
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 text-sm font-bold text-white">
                      <span className="text-amber-400 font-mono">
                        {route.legs[0].train_number}
                      </span>
                      <span>{route.legs[0].train_name}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center space-x-2">
                      <span>
                        {route.legs[0].from_code} ({route.legs[0].departure_time}) → {route.legs[0].to_code} ({route.legs[0].arrival_time})
                      </span>
                      <span>•</span>
                      <span>Duration: {route.legs[0].duration_formatted}</span>
                      <span>•</span>
                      <span>Arr Platform: <strong>P-{route.legs[0].arrival_platform}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onTrackLive(route.legs[0].train_number)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-black text-slate-300 font-medium text-xs border border-slate-700 transition-all flex items-center space-x-1 cursor-pointer self-end sm:self-center"
                >
                  <Radio className="w-3 h-3 text-amber-400" />
                  <span>Track Leg 1</span>
                </button>
              </div>
            )}

            {/* Interchange Layover Box */}
            {route.layover && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/5 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-bold text-xs">
                      TRANSFER AT {route.layover.hub_code}
                    </span>
                    <span className="text-sm font-bold text-amber-300">
                      {route.layover.hub_name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl">
                    {route.interchange_guidance}
                  </p>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-4 pt-1 font-mono">
                    <span>Layover: <strong className="text-white">{route.layover.layover_formatted}</strong></span>
                    <span>Buffer: <strong className="text-emerald-400">{route.layover.buffer_minutes}m</strong></span>
                    <span>Arrival: <strong>Platform {route.layover.arrival_platform}</strong></span>
                    <span>Departure: <strong>Platform {route.layover.departure_platform}</strong></span>
                  </div>
                </div>

                {/* 3D Visualizer Trigger Button */}
                <button
                  onClick={() =>
                    onView3D(
                      route.layover!.hub_code,
                      route.layover!.arrival_platform,
                      route.layover!.departure_platform
                    )
                  }
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer flex-shrink-0"
                >
                  <Layers className="w-4 h-4" />
                  <span>3D Station Transfer View</span>
                </button>
              </div>
            )}

            {/* Leg 2 */}
            {route.legs[1] && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-md bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold font-mono">
                    L2
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 text-sm font-bold text-white">
                      <span className="text-orange-400 font-mono">
                        {route.legs[1].train_number}
                      </span>
                      <span>{route.legs[1].train_name}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center space-x-2">
                      <span>
                        {route.legs[1].from_code} ({route.legs[1].departure_time}) → {route.legs[1].to_code} ({route.legs[1].arrival_time})
                      </span>
                      <span>•</span>
                      <span>Duration: {route.legs[1].duration_formatted}</span>
                      <span>•</span>
                      <span>Dep Platform: <strong>P-{route.legs[1].departure_platform}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onTrackLive(route.legs[1].train_number)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-orange-400 hover:text-black text-slate-300 font-medium text-xs border border-slate-700 transition-all flex items-center space-x-1 cursor-pointer self-end sm:self-center"
                >
                  <Radio className="w-3 h-3 text-orange-400" />
                  <span>Track Leg 2</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
