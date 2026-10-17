"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Layers,
  Compass,
  Footprints,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Maximize2,
  Sparkles,
} from "lucide-react";

// Dynamic import with ssr: false for Three.js Canvas
const Station3DScene = dynamic(
  () => import("./Station3DScene").then((mod) => mod.Station3DScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#070b14] rounded-2xl text-slate-400 space-y-3">
        <span className="inline-block animate-spin text-3xl">⚙️</span>
        <span className="text-sm font-semibold">Initializing 3D Platform Engine...</span>
      </div>
    ),
  }
);

interface Station3DVisualizerTabProps {
  initialHub?: string;
  initialArrivalPlat?: number;
  initialDeparturePlat?: number;
}

export const Station3DVisualizerTab: React.FC<Station3DVisualizerTabProps> = ({
  initialHub = "TPJ",
  initialArrivalPlat = 1,
  initialDeparturePlat = 3,
}) => {
  const [hubCode, setHubCode] = useState(initialHub);
  const [arrivalPlat, setArrivalPlat] = useState(initialArrivalPlat);
  const [departurePlat, setDeparturePlat] = useState(initialDeparturePlat);

  const hubs = [
    { code: "TPJ", name: "Tiruchirappalli Junction", state: "Tamil Nadu", platforms: 4 },
    { code: "ED", name: "Erode Junction", state: "Tamil Nadu", platforms: 4 },
    { code: "CBE", name: "Coimbatore Junction", state: "Tamil Nadu", platforms: 4 },
    { code: "QLN", name: "Kollam Junction", state: "Kerala", platforms: 4 },
    { code: "MAS", name: "Chennai Central", state: "Tamil Nadu", platforms: 4 },
  ];

  const currentHub = hubs.find((h) => h.code === hubCode) || hubs[0];

  // Calculated distance & walking buffer
  const isSamePlatform = arrivalPlat === departurePlat;
  const platformDistanceMeters = isSamePlatform ? 15 : Math.abs(arrivalPlat - departurePlat) * 35 + 25;
  const estimatedWalkMinutes = isSamePlatform ? 2 : Math.round(platformDistanceMeters / 10);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 border border-slate-700/60 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Three.js Spatial Digital Twin</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              3D Junction &amp; Foot Overbridge Visualizer
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl">
              Inspect multi-level platform layouts in full 3D. Follow the animated glowing
              transfer beam from your incoming train to your connecting platform via the Foot Overbridge (FOB).
            </p>
          </div>

          {/* Quick Hub Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Select Hub:
            </span>
            {hubs.map((h) => (
              <button
                key={h.code}
                onClick={() => setHubCode(h.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  hubCode === h.code
                    ? "bg-amber-500 text-black border-amber-400 font-bold"
                    : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
              >
                {h.code} - {h.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Platform Selectors Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          {/* Arrival Platform */}
          <div>
            <label className="block text-xs font-semibold text-emerald-400 mb-2 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ARRIVAL PLATFORM (LEG 1)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((pf) => (
                <button
                  key={pf}
                  onClick={() => setArrivalPlat(pf)}
                  className={`py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    arrivalPlat === pf
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25 scale-105"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  PF {pf}
                </button>
              ))}
            </div>
          </div>

          {/* Departure Platform */}
          <div>
            <label className="block text-xs font-semibold text-amber-400 mb-2 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>DEPARTURE PLATFORM (LEG 2)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((pf) => (
                <button
                  key={pf}
                  onClick={() => setDeparturePlat(pf)}
                  className={`py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    departurePlat === pf
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25 scale-105"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  PF {pf}
                </button>
              ))}
            </div>
          </div>

          {/* Transfer Distance */}
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col justify-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">
              WALK DISTANCE VIA FOB
            </div>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              ~{platformDistanceMeters} meters
            </div>
            <div className="text-[11px] text-slate-500">
              {isSamePlatform ? "Same Platform Transfer" : "Cross-Bridge Interchange"}
            </div>
          </div>

          {/* Estimated Walk Time */}
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col justify-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">
              ESTIMATED WALK TIME
            </div>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
              ~{estimatedWalkMinutes} mins
            </div>
            <div className="text-[11px] text-emerald-400">
              Luggage buffer: 15-25m recommended
            </div>
          </div>
        </div>
      </div>

      {/* 3D Scene Viewport */}
      <div className="relative w-full h-[520px] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <Station3DScene
          arrivalPlatform={arrivalPlat}
          departurePlatform={departurePlat}
        />

        {/* 3D Viewport Controls Overlay */}
        <div className="absolute top-4 left-4 z-10 px-3.5 py-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs text-slate-300 space-y-1">
          <div className="font-bold text-white flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive 3D Navigation</span>
          </div>
          <div className="text-[11px] text-slate-400">
            • Left-click + drag: Rotate camera
            <br />
            • Scroll: Zoom in/out
            <br />
            • Right-click + drag: Pan across platforms
          </div>
        </div>

        {/* Transfer Path Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 px-3.5 py-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50" />
            <span className="text-slate-300 font-semibold">
              Arrive: Platform {arrivalPlat}
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-md shadow-amber-500/50" />
            <span className="text-slate-300 font-semibold">
              Depart: Platform {departurePlat}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="text-amber-400 font-mono font-bold text-[11px]">
            Glowing Line = FOB Path
          </div>
        </div>
      </div>

      {/* Step-by-Step Pedestrian Turn-by-Turn Card */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Footprints className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">
            Pedestrian Interchange Route: Platform {arrivalPlat} → Platform {departurePlat} at {currentHub.name}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-[10px] font-mono font-bold text-emerald-400">
              STEP 1
            </div>
            <div className="text-xs font-bold text-white">Alight from Leg 1</div>
            <p className="text-[11px] text-slate-400">
              Step out at Platform {arrivalPlat}. Look for FOB overhead staircase signs near Pillar P-06.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-[10px] font-mono font-bold text-amber-400">
              STEP 2
            </div>
            <div className="text-xs font-bold text-white">Climb FOB Stairs</div>
            <p className="text-[11px] text-slate-400">
              Take the pedestrian staircase/ramp to the elevated Foot Overbridge deck (+6.2m elevation).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-[10px] font-mono font-bold text-amber-400">
              STEP 3
            </div>
            <div className="text-xs font-bold text-white">Traverse Bridge Span</div>
            <p className="text-[11px] text-slate-400">
              Walk ~{platformDistanceMeters - 15}m across the central walkway spanning railway tracks.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-[10px] font-mono font-bold text-orange-400">
              STEP 4
            </div>
            <div className="text-xs font-bold text-white">Descend to Platform {departurePlat}</div>
            <p className="text-[11px] text-slate-400">
              Follow signs down the staircase marked &ldquo;Platform {departurePlat} Connecting Trains&rdquo;.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-[10px] font-mono font-bold text-cyan-400">
              STEP 5
            </div>
            <div className="text-xs font-bold text-white">Board Connecting Train</div>
            <p className="text-[11px] text-slate-400">
              Locate your assigned coach pillar position and board your Leg 2 train.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
