"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { RouteFinderTab } from "@/components/RouteFinderTab";
import { LiveTrackerTab } from "@/components/LiveTrackerTab";
import { StationLensTab } from "@/components/StationLensTab";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"routes" | "tracker" | "lens">("routes");

  // Selected train for live tracking from route finder or station lens
  const [selectedTrainForTracking, setSelectedTrainForTracking] = useState("");

  // Jump to Live Tracker
  const handleTrackLive = (trainNumber: string) => {
    setSelectedTrainForTracking(trainNumber);
    setActiveTab("tracker");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#000000", color: "#e2e8f0" }}>
      {/* Clean subtle dark transit grid background */}
      <AnimatedBackground />

      {/* Main App Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 pb-16">
          {activeTab === "routes" && (
            <RouteFinderTab onTrackLive={handleTrackLive} />
          )}
          {activeTab === "tracker" && (
            <LiveTrackerTab initialTrainNumber={selectedTrainForTracking} />
          )}
          {activeTab === "lens" && (
            <StationLensTab onTrackTrain={handleTrackLive} />
          )}
        </main>

        {/* Footer */}
        <footer
          className="py-8 px-4 sm:px-6 lg:px-8 text-center text-xs space-y-2"
          style={{ borderTop: "1px solid #1a1a2e", background: "rgba(10,10,22,0.92)", color: "#475569" }}
        >
          <div className="flex items-center justify-center space-x-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Railtracker" className="w-5 h-5 object-contain" />
            <span
              className="font-bold font-mono text-sm"
              style={{
                background: "linear-gradient(135deg,#a78bfa,#34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              RAILTRACKER
            </span>
            <span>•</span>
            <span>Indian Railways Multi-Hop Transit & Live Tracking</span>
          </div>
          <p style={{ color: "#64748b" }}>
            High-Performance Go In-Memory Transit Graph • PostgreSQL • Next.js App Router • Live GPS & Crowdsource Radar
          </p>
        </footer>
      </div>
    </div>
  );
}
