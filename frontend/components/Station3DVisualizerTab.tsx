"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";

const Station3DScene = dynamic(
  () => import("./Station3DScene").then((mod) => mod.Station3DScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center rounded-2xl text-slate-400 space-y-3"
        style={{ background: "#050811" }}>
        <span className="inline-block animate-spin text-3xl">⚙️</span>
        <span className="text-sm font-semibold" style={{ color: "#7c3aed" }}>Initializing 3D Platform Engine...</span>
      </div>
    ),
  }
);

// Lucide Layers icon as SVG (avoid import for tree-shaking)
const LayersIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);

const FootprintsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/>
    <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/>
    <path d="M16 17h4"/><path d="M4 13h4"/>
  </svg>
);

interface Station3DVisualizerTabProps {
  initialHub?: string;
  initialArrivalPlat?: number;
  initialDeparturePlat?: number;
}

const HUBS = [
  { code: "TPJ",  name: "Tiruchirappalli Junction", state: "Tamil Nadu" },
  { code: "ED",   name: "Erode Junction",           state: "Tamil Nadu" },
  { code: "CBE",  name: "Coimbatore Junction",      state: "Tamil Nadu" },
  { code: "QLN",  name: "Kollam Junction",          state: "Kerala" },
  { code: "MAS",  name: "Chennai Central",          state: "Tamil Nadu" },
  { code: "SBC",  name: "Bengaluru City Jn",        state: "Karnataka" },
];

// Coordinates for Google Maps iframe embed
const HUB_COORDS: Record<string, [number, number]> = {
  TPJ:  [10.8152, 78.6952],
  ED:   [11.3410, 77.7172],
  CBE:  [11.0168, 76.9558],
  QLN:  [ 8.8932, 76.6141],
  MAS:  [13.0827, 80.2707],
  SBC:  [12.9774, 77.5713],
};

export const Station3DVisualizerTab: React.FC<Station3DVisualizerTabProps> = ({
  initialHub = "TPJ",
  initialArrivalPlat = 1,
  initialDeparturePlat = 3,
}) => {
  const [hubCode, setHubCode] = useState(initialHub);
  const [arrivalPlat, setArrivalPlat] = useState(initialArrivalPlat);
  const [departurePlat, setDeparturePlat] = useState(initialDeparturePlat);
  const [showMapPanel, setShowMapPanel] = useState(false);

  const currentHub = HUBS.find((h) => h.code === hubCode) || HUBS[0];
  const coords = HUB_COORDS[hubCode] || HUB_COORDS["TPJ"];
  const isSamePlatform = arrivalPlat === departurePlat;
  const platformDistanceMeters = isSamePlatform ? 15 : Math.abs(arrivalPlat - departurePlat) * 35 + 25;
  const estimatedWalkMinutes = isSamePlatform ? 2 : Math.round(platformDistanceMeters / 10);

  // Google Maps satellite embed (no API key needed)
  const mapsUrl = `https://maps.google.com/maps?q=${coords[0]},${coords[1]}&t=k&z=17&output=embed`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
      {/* Header */}
      <div className="rounded-2xl p-6 md:p-8 space-y-5"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(0,0,0,0.9), rgba(16,185,129,0.06))", border: "1px solid rgba(124,58,237,0.25)", boxShadow: "0 0 60px rgba(124,58,237,0.08)" }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}>
              <LayersIcon /><span className="ml-1">Three.js Spatial Digital Twin + Satellite Imagery</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">3D Junction & Foot Overbridge Visualizer</h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-2xl">
              Inspect multi-level platform layouts in full 3D with real satellite ground imagery. Follow the animated emerald beacon from your arrival platform to your connecting departure platform via the Foot Overbridge.
            </p>
          </div>

          {/* Hub Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider mr-1" style={{ color: "#475569" }}>Junction:</span>
            {HUBS.map((h) => (
              <button key={h.code} onClick={() => setHubCode(h.code)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                style={hubCode === h.code
                  ? { background: "linear-gradient(135deg,#7c3aed,#10b981)", color: "white", border: "none" }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid #1a1a2e", color: "#64748b" }
                }>
                {h.code}
              </button>
            ))}
          </div>
        </div>

        {/* Platform Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #1a1a2e" }}>
          {/* Arrival */}
          <div>
            <label className="block text-xs font-semibold mb-2 flex items-center space-x-1" style={{ color: "#34d399" }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#10b981" }} />
              <span className="ml-1">ARRIVAL PLATFORM (LEG 1)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((pf) => (
                <button key={pf} onClick={() => setArrivalPlat(pf)}
                  className="py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer"
                  style={arrivalPlat === pf
                    ? { background: "#10b981", color: "#000", transform: "scale(1.05)" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid #1a1a2e", color: "#64748b" }
                  }>PF {pf}</button>
              ))}
            </div>
          </div>

          {/* Departure */}
          <div>
            <label className="block text-xs font-semibold mb-2 flex items-center space-x-1" style={{ color: "#a78bfa" }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#7c3aed" }} />
              <span className="ml-1">DEPARTURE PLATFORM (LEG 2)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((pf) => (
                <button key={pf} onClick={() => setDeparturePlat(pf)}
                  className="py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer"
                  style={departurePlat === pf
                    ? { background: "#7c3aed", color: "white", transform: "scale(1.05)" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid #1a1a2e", color: "#64748b" }
                  }>PF {pf}</button>
              ))}
            </div>
          </div>

          {/* Walk Distance */}
          <div className="p-3 rounded-lg flex flex-col justify-center" style={{ background: "rgba(10,10,22,0.8)", border: "1px solid #1a1a2e" }}>
            <div className="text-[10px] font-semibold uppercase" style={{ color: "#475569" }}>WALK DISTANCE VIA FOB</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">~{platformDistanceMeters}m</div>
            <div className="text-[11px] mt-0.5" style={{ color: "#475569" }}>{isSamePlatform ? "Same Platform" : "Cross-Bridge"}</div>
          </div>

          {/* Walk Time */}
          <div className="p-3 rounded-lg flex flex-col justify-center" style={{ background: "rgba(10,10,22,0.8)", border: "1px solid #1a1a2e" }}>
            <div className="text-[10px] font-semibold uppercase" style={{ color: "#475569" }}>ESTIMATED WALK TIME</div>
            <div className="text-xl font-black font-mono mt-0.5" style={{ color: "#a78bfa" }}>~{estimatedWalkMinutes} mins</div>
            <div className="text-[11px] mt-0.5" style={{ color: "#34d399" }}>Buffer: 15–25m recommended</div>
          </div>
        </div>
      </div>

      {/* Toggle Satellite Map button */}
      <div className="flex justify-end">
        <button onClick={() => setShowMapPanel(!showMapPanel)}
          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer transition-all"
          style={showMapPanel
            ? { background: "linear-gradient(135deg,#7c3aed,#10b981)", color: "white" }
            : { background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }
          }>
          🛰️ <span className="ml-1">{showMapPanel ? "Hide" : "Show"} Google Maps Satellite View</span>
        </button>
      </div>

      {/* Google Maps Satellite Embed */}
      {showMapPanel && (
        <div className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: "1px solid rgba(124,58,237,0.3)", height: "360px" }}>
          <div className="p-3 flex items-center space-x-2"
            style={{ background: "rgba(10,10,22,0.95)", borderBottom: "1px solid rgba(124,58,237,0.2)" }}>
            <span className="text-xs font-bold" style={{ color: "#a78bfa" }}>🛰️ Google Maps Satellite — {currentHub.name}, {currentHub.state}</span>
            <span className="text-[10px]" style={{ color: "#475569" }}>Coords: {coords[0].toFixed(4)}°N, {coords[1].toFixed(4)}°E</span>
          </div>
          <iframe
            src={mapsUrl}
            width="100%"
            height="310"
            style={{ border: "none", display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${currentHub.name} Satellite View`}
          />
        </div>
      )}

      {/* 3D Scene Viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{ height: "520px", border: "1px solid rgba(124,58,237,0.3)" }}>
        <Station3DScene arrivalPlatform={arrivalPlat} departurePlatform={departurePlat} stationCode={hubCode} />

        {/* Controls overlay */}
        <div className="absolute top-4 left-4 z-10 px-3.5 py-2 rounded-xl text-xs space-y-1"
          style={{ background: "rgba(10,10,22,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="font-bold text-white flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5" style={{ color: "#7c3aed" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
            </svg>
            <span>Interactive 3D Navigation</span>
          </div>
          <div className="text-[11px]" style={{ color: "#475569" }}>
            • Left-click + drag: Rotate<br />
            • Scroll: Zoom<br />
            • Right-click + drag: Pan
          </div>
        </div>

        {/* Legend overlay */}
        <div className="absolute bottom-4 left-4 z-10 px-3.5 py-2.5 rounded-xl flex items-center space-x-4 text-xs"
          style={{ background: "rgba(10,10,22,0.85)", backdropFilter: "blur(8px)", border: "1px solid #1a1a2e" }}>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.8)" }} />
            <span className="font-semibold text-white">Arrive: PF {arrivalPlat}</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5" style={{ color: "#475569" }} />
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: "#7c3aed", boxShadow: "0 0 6px rgba(124,58,237,0.8)" }} />
            <span className="font-semibold text-white">Depart: PF {departurePlat}</span>
          </div>
          <div className="h-4 w-px" style={{ background: "#1a1a2e" }} />
          <div className="font-mono font-bold text-[11px]" style={{ color: "#34d399" }}>Emerald = FOB Path</div>
        </div>
      </div>

      {/* Step-by-Step Guide */}
      <div className="rounded-2xl p-6 shadow-xl space-y-4"
        style={{ background: "rgba(10,10,22,0.95)", border: "1px solid #1a1a2e" }}>
        <div className="flex items-center space-x-2 pb-3" style={{ borderBottom: "1px solid #1a1a2e" }}>
          <FootprintsIcon />
          <h2 className="text-base font-bold text-white">
            Pedestrian Interchange: Platform {arrivalPlat} → Platform {departurePlat} at {currentHub.name}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
          {[
            { step: "STEP 1", color: "#34d399", title: "Alight from Leg 1", desc: `Step out at Platform ${arrivalPlat}. Look for FOB overhead staircase signs near Pillar P-06.` },
            { step: "STEP 2", color: "#a78bfa", title: "Climb FOB Stairs", desc: "Take the pedestrian staircase/ramp to the elevated Foot Overbridge deck (+6.2m elevation)." },
            { step: "STEP 3", color: "#a78bfa", title: "Traverse Bridge", desc: `Walk ~${platformDistanceMeters - 15}m across the central walkway spanning the railway tracks.` },
            { step: "STEP 4", color: "#fb923c", title: `Descend to PF ${departurePlat}`, desc: `Follow signs down the staircase marked "Platform ${departurePlat} Connecting Trains".` },
            { step: "STEP 5", color: "#34d399", title: "Board Connecting Train", desc: "Locate your assigned coach pillar position and board your Leg 2 train." },
          ].map(({ step, color, title, desc }) => (
            <div key={step} className="p-3.5 rounded-xl space-y-1" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #1a1a2e" }}>
              <div className="text-[10px] font-mono font-bold" style={{ color }}>{step}</div>
              <div className="text-xs font-bold text-white">{title}</div>
              <p className="text-[11px]" style={{ color: "#475569" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
