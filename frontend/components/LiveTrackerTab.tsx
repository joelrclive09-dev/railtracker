"use client";

import React, { useState, useEffect } from "react";
import {
  Radio,
  Train,
  Clock,
  Gauge,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Share2,
  Users,
  Send,
  Sparkles,
  MapPin,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { api } from "@/api";
import { LiveTrainResponse, LiveTimelineStop } from "@/types";

interface LiveTrackerTabProps {
  initialTrainNumber?: string;
}

export const LiveTrackerTab: React.FC<LiveTrackerTabProps> = ({
  initialTrainNumber = "16128",
}) => {
  const [trainQuery, setTrainQuery] = useState(initialTrainNumber);
  const [trainData, setTrainData] = useState<LiveTrainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crowdsource Ping State
  const [showPingModal, setShowPingModal] = useState(false);
  const [pingStation, setPingStation] = useState("");
  const [pingDelay, setPingDelay] = useState(15);
  const [pingSpeed, setPingSpeed] = useState(72);
  const [pingSubmitting, setPingSubmitting] = useState(false);
  const [pingSuccess, setPingSuccess] = useState<string | null>(null);

  // Load train data
  const loadTrain = async (num: string) => {
    if (!num.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTrainLive(num.trim());
      setTrainData(data);
      if (data.current_station?.code) {
        setPingStation(data.current_station.code);
      }
    } catch (err: any) {
      console.error("Live track error:", err);
      setError("Train number not found in timetable.");
      setTrainData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrain(initialTrainNumber);
  }, [initialTrainNumber]);

  // Submit crowdsource ping
  const handleCrowdsourcePing = async () => {
    if (!trainData) return;
    setPingSubmitting(true);
    try {
      await api.pingTrain({
        trainNumber: trainData.train_number,
        currentStation: pingStation || trainData.current_station.code,
        delayMin: pingDelay,
        speedKmph: pingSpeed,
      });
      setPingSuccess("Live GPS report recorded! Timetable updated for all passengers.");
      setTimeout(() => setPingSuccess(null), 4000);
      setShowPingModal(false);
      // Reload live data immediately to reflect updated delay downstream
      loadTrain(trainData.train_number);
    } catch (err) {
      console.error("Ping error:", err);
    } finally {
      setPingSubmitting(false);
    }
  };

  const quickTrains = [
    { num: "16128", name: "Guruvayur Exp (GUV → MS)" },
    { num: "12625", name: "Kerala Express (TVC → NDLS)" },
    { num: "16302", name: "Venad Express (TVC → SRR)" },
    { num: "16724", name: "Anantapuri Exp (QLN → MS)" },
    { num: "16101", name: "Boat Mail Exp (MS → RMM)" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Search Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 border border-slate-700/60 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Real-Time Position & Crowdsource Engine</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Where Is My Train (WIMT) Tracker
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Interpolated live GPS timeline with passenger crowdsourced check-ins and delay offsets.
            </p>
          </div>

          {/* Quick Select Chips */}
          <div className="flex flex-wrap gap-2">
            {quickTrains.map((qt) => (
              <button
                key={qt.num}
                onClick={() => {
                  setTrainQuery(qt.num);
                  loadTrain(qt.num);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  trainData?.train_number === qt.num
                    ? "bg-amber-500 text-black border-amber-400 font-bold"
                    : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
              >
                {qt.num}
              </button>
            ))}
          </div>
        </div>

        {/* Train Search Bar */}
        <div className="flex items-center space-x-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
          <div className="relative flex-1">
            <input
              type="text"
              value={trainQuery}
              onChange={(e) => setTrainQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadTrain(trainQuery)}
              placeholder="Enter Train Number (e.g. 16128, 12625, 16302)..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-base focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            onClick={() => loadTrain(trainQuery)}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin">⌛</span>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                <span>Track Train</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {pingSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center space-x-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{pingSuccess}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-semibold flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Train Information Card */}
      {trainData && (
        <div className="space-y-6">
          {/* Status Header Banner */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                    {trainData.train_number}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-white">
                    {trainData.train_name}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                  <span>
                    Current Halt: <strong className="text-white">{trainData.current_station.name} ({trainData.current_station.code})</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Next: <strong className="text-white">{trainData.next_station.name} ({trainData.next_station.code})</strong>
                  </span>
                </div>
              </div>

              {/* Status & Crowdsource Ping Button */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowPingModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>I am on this Train (Crowdsource)</span>
                </button>
              </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>STATUS</span>
                </div>
                <div className="text-sm font-bold text-emerald-400 mt-1">
                  {trainData.status.replace(/_/g, " ")}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>LIVE SPEED</span>
                </div>
                <div className="text-sm font-bold text-white font-mono mt-1">
                  {trainData.estimated_speed_kmph} km/h
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <span>DELAY OFFSET</span>
                </div>
                <div
                  className={`text-sm font-bold font-mono mt-1 ${
                    trainData.delay_min > 0 ? "text-orange-400" : "text-emerald-400"
                  }`}
                >
                  {trainData.delay_min > 0 ? `+${trainData.delay_min} mins` : "Right on Time"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PROGRESS</span>
                </div>
                <div className="text-sm font-bold text-cyan-400 font-mono mt-1">
                  {trainData.progress_percent}% completed
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 via-amber-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, trainData.progress_percent)}%` }}
              />
            </div>
          </div>

          {/* Crowdsource Reporting Modal */}
          {showPingModal && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    Passenger Crowdsource Report for Train {trainData.train_number}
                  </h3>
                </div>
                <button
                  onClick={() => setShowPingModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Station Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    CURRENT OR LAST PASSED STATION
                  </label>
                  <select
                    value={pingStation}
                    onChange={(e) => setPingStation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                  >
                    {trainData.timeline.map((stop) => (
                      <option key={stop.station_code} value={stop.station_code}>
                        {stop.station_code} - {stop.station_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delay Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    CURRENT ESTIMATED DELAY
                  </label>
                  <div className="flex items-center space-x-1.5">
                    {[0, 10, 20, 35, 60].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setPingDelay(d)}
                        className={`flex-1 py-2 rounded text-xs font-bold transition-all ${
                          pingDelay === d
                            ? "bg-amber-500 text-black"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {d === 0 ? "0m" : `+${d}m`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Speed */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    SPEED ESTIMATE (KM/H)
                  </label>
                  <input
                    type="number"
                    value={pingSpeed}
                    onChange={(e) => setPingSpeed(Number(e.target.value))}
                    min={0}
                    max={160}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCrowdsourcePing}
                  disabled={pingSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs rounded-lg shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{pingSubmitting ? "Submitting..." : "Broadcast Live Ping to Network"}</span>
                </button>
              </div>
            </div>
          )}

          {/* WIMT Vertical Timeline */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-amber-400" />
                <span>Station-by-Station Live Track Timeline</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {trainData.timeline.length} Total Halts
              </span>
            </div>

            <div className="relative pl-6 sm:pl-8 space-y-6 pt-2">
              {/* Continuous vertical track rail line */}
              <div className="absolute left-3.5 sm:left-4 top-4 bottom-4 w-1 bg-slate-800 rounded-full" />

              {trainData.timeline.map((stop, i) => {
                const isDeparted = stop.status === "DEPARTED";
                const isCurrent = stop.status === "CURRENT";
                const isUpcoming = stop.status === "UPCOMING";

                return (
                  <div key={stop.station_code + i} className="relative flex items-start space-x-4">
                    {/* Node Icon on rail track */}
                    <div className="absolute -left-6 sm:-left-8 mt-1 z-10 flex items-center justify-center">
                      {isCurrent ? (
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/50 animate-bounce">
                            <Train className="w-4 h-4 text-black stroke-[2.5]" />
                          </div>
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                          </span>
                        </div>
                      ) : isDeparted ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600" />
                      )}
                    </div>

                    {/* Stop Details Card */}
                    <div
                      className={`flex-1 p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10"
                          : isDeparted
                          ? "bg-slate-950/40 border-slate-800/60 opacity-80"
                          : "bg-slate-950/60 border-slate-800"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-amber-400 font-mono font-bold text-sm">
                              {stop.station_code}
                            </span>
                            <span className="text-white font-bold text-sm sm:text-base">
                              {stop.station_name}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-black uppercase tracking-wider animate-pulse">
                                CURRENT POSITION
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                            <span>Platform: <strong className="text-slate-200">P-{stop.platform}</strong></span>
                            <span>•</span>
                            <span>Halt: <strong>{stop.halt_duration_minutes}m</strong></span>
                            <span>•</span>
                            <span>Distance: ~{stop.distance_km} km</span>
                          </div>
                        </div>

                        {/* Scheduled vs Expected Timings */}
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-white">
                            Arr: {stop.expected_arrival} • Dep: {stop.expected_departure}
                          </div>
                          {stop.delay_minutes > 0 && (
                            <div className="text-[11px] text-orange-400 font-semibold mt-0.5">
                              Sched: {stop.scheduled_arrival} (+{stop.delay_minutes}m delay)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
