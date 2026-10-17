"use client";

import React, { useEffect, useState } from "react";
import {
  Train,
  Navigation,
  Layers,
  Compass,
  Radio,
  Clock,
  Sparkles,
} from "lucide-react";
import { api } from "@/api";

interface NavbarProps {
  activeTab: "routes" | "tracker" | "lens" | "visualizer3d";
  setActiveTab: (tab: "routes" | "tracker" | "lens" | "visualizer3d") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [istTime, setIstTime] = useState<string>("");
  const [backendHealth, setBackendHealth] = useState<{
    status: string;
    stations: number;
    trains: number;
  } | null>(null);

  useEffect(() => {
    // Update IST clock every second
    const updateTime = () => {
      const now = new Date();
      // IST is UTC+5:30
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istDate = new Date(utc + 5.5 * 3600000);
      setIstTime(
        istDate.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    // Fetch backend health
    api
      .getHealth()
      .then((data) => setBackendHealth(data))
      .catch(() => setBackendHealth(null));

    return () => clearInterval(timer);
  }, []);

  const navItems = [
    {
      id: "routes" as const,
      label: "Multi-Hop Routes",
      subtitle: "Unlimited Transfers",
      icon: Compass,
      badge: "Fastest",
    },
    {
      id: "tracker" as const,
      label: "Live Train Tracker",
      subtitle: "WIMT + Crowdsource",
      icon: Radio,
      badge: "Real-time",
    },
    {
      id: "lens" as const,
      label: "Live Station Lens",
      subtitle: "Passing & Coaches",
      icon: Navigation,
      badge: "Shazam",
    },
    {
      id: "visualizer3d" as const,
      label: "3D Station Visualizer",
      subtitle: "FOB Platform Walk",
      icon: Layers,
      badge: "Three.js",
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab("routes")}
            className="flex items-center space-x-3.5 cursor-pointer group select-none"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform duration-200">
                <Train className="w-6 h-6 text-black stroke-[2.2]" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-white font-mono">
                  RAIL<span className="text-amber-400">TRACKER</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded uppercase tracking-wider">
                  IR Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Indian Railways Transit Engine
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-4 py-2.5 rounded-xl text-left transition-all duration-200 flex items-center space-x-3 group ${
                    isActive
                      ? "bg-slate-800/90 text-white shadow-inner border border-amber-500/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                        : "bg-slate-800 text-slate-400 group-hover:text-amber-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-semibold leading-tight">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block leading-tight">
                      {item.subtitle}
                    </span>
                  </div>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status & IST Clock */}
          <div className="flex items-center space-x-3">
            {/* Backend Health Badge */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-slate-300 font-medium">
                {backendHealth ? (
                  <span>
                    <strong className="text-emerald-400">
                      {backendHealth.stations.toLocaleString()}
                    </strong>{" "}
                    Stns •{" "}
                    <strong className="text-amber-400">
                      {backendHealth.trains.toLocaleString()}
                    </strong>{" "}
                    Trains
                  </span>
                ) : (
                  <span className="text-amber-400">Connecting...</span>
                )}
              </div>
            </div>

            {/* Live IST Clock */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{istTime || "IST Live"}</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2.5 space-x-2 border-t border-slate-800/80 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-2 ${
                  isActive
                    ? "bg-amber-500 text-black font-semibold"
                    : "bg-slate-900 text-slate-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
