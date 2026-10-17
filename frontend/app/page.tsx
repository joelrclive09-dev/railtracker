"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { RouteFinderTab } from "@/components/RouteFinderTab";
import { LiveTrackerTab } from "@/components/LiveTrackerTab";
import { StationLensTab } from "@/components/StationLensTab";
import { Station3DVisualizerTab } from "@/components/Station3DVisualizerTab";

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "routes" | "tracker" | "lens" | "visualizer3d"
  >("routes");

  // Cross-tab interaction states
  const [selectedTrainForTracking, setSelectedTrainForTracking] = useState("16128");
  const [selected3DHub, setSelected3DHub] = useState("TPJ");
  const [selected3DArrivalPlat, setSelected3DArrivalPlat] = useState(1);
  const [selected3DDeparturePlat, setSelected3DDeparturePlat] = useState(2);

  // Jump to Live Tracker with specific train preloaded
  const handleTrackLive = (trainNumber: string) => {
    setSelectedTrainForTracking(trainNumber);
    setActiveTab("tracker");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Jump to 3D Station Visualizer with hub and platforms preloaded
  const handleView3D = (
    hubCode: string,
    arrivalPlat: number,
    departurePlat: number
  ) => {
    setSelected3DHub(hubCode);
    setSelected3DArrivalPlat(arrivalPlat);
    setSelected3DDeparturePlat(departurePlat);
    setActiveTab("visualizer3d");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100">
      {/* Sticky Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tab Content */}
      <main className="flex-1 pb-16">
        {activeTab === "routes" && (
          <RouteFinderTab
            onTrackLive={handleTrackLive}
            onView3D={handleView3D}
          />
        )}

        {activeTab === "tracker" && (
          <LiveTrackerTab initialTrainNumber={selectedTrainForTracking} />
        )}

        {activeTab === "lens" && (
          <StationLensTab onTrackTrain={handleTrackLive} />
        )}

        {activeTab === "visualizer3d" && (
          <Station3DVisualizerTab
            initialHub={selected3DHub}
            initialArrivalPlat={selected3DArrivalPlat}
            initialDeparturePlat={selected3DDeparturePlat}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center space-x-2 text-slate-400 font-medium">
          <span className="text-amber-400 font-bold font-mono">RAILTRACKER</span>
          <span>•</span>
          <span>Indian Railways Multi-Hop Pathfinding &amp; 3D Digital Twin Platform</span>
        </div>
        <p>
          Powered by Go Time-Expanded Railway In-Memory Graph, PostgreSQL, Next.js App Router, and Three.js.
        </p>
      </footer>
    </div>
  );
}
