"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { api } from "@/api";

interface NavbarProps {
  activeTab: "routes" | "tracker" | "lens";
  setActiveTab: (tab: "routes" | "tracker" | "lens") => void;
}

// Custom SVG train icon for nav tabs
type IconProps = { className?: string; style?: React.CSSProperties };

const TrainIcon = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="11" rx="2"/>
    <path d="M3 9h18"/>
    <path d="M8 6V4"/>
    <path d="M16 6V4"/>
    <circle cx="7.5" cy="19" r="1.5"/>
    <circle cx="16.5" cy="19" r="1.5"/>
    <path d="M3 17h18"/>
    <rect x="8" y="11" width="3" height="3" rx="0.5" fill="currentColor" stroke="none"/>
    <rect x="13" y="11" width="3" height="3" rx="0.5" fill="currentColor" stroke="none"/>
  </svg>
);

const RouteIcon = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="6" r="2"/>
    <circle cx="19" cy="18" r="2"/>
    <path d="M5 8v3a2 2 0 002 2h4"/>
    <path d="M19 16v-3a2 2 0 00-2-2h-4"/>
    <path d="M11 13l2-2 2 2"/>
  </svg>
);

const SignalIcon = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20"/>
    <path d="M12 4v16"/>
    <circle cx="12" cy="7" r="2" fill="currentColor" stroke="none"/>
    <path d="M8 11c1 0 2-.5 4-1s3-1 4-1"/>
    <path d="M8 15c1 0 2-.5 4-1s3-1 4-1"/>
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [istTime, setIstTime] = useState("");
  const [backendHealth, setBackendHealth] = useState<{
    status: string;
    stations: number;
    trains: number;
  } | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istDate = new Date(utc + 5.5 * 3600000);
      setIstTime(
        istDate.toLocaleTimeString("en-IN", {
          hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    api.getHealth().then(setBackendHealth).catch(() => setBackendHealth(null));
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: "routes" as const,      label: "Route Finder",       subtitle: "Multi-Hop & Direct",   Icon: RouteIcon  },
    { id: "tracker" as const,     label: "Live Train Tracker",  subtitle: "Real-Time & Pings",    Icon: TrainIcon  },
    { id: "lens" as const,        label: "Station Lens",        subtitle: "Platform & Radar",     Icon: SignalIcon },
  ];

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(20px)",
        borderColor: "#1a1a2e",
        boxShadow: "0 1px 40px rgba(124,58,237,0.08)"
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab("routes")}
            className="flex items-center space-x-3.5 cursor-pointer group select-none"
          >
            <div className="relative">
              <div
                className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform duration-200"
                style={{
                  background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(16,185,129,0.3))",
                  border: "1px solid rgba(124,58,237,0.4)",
                  boxShadow: "0 0 20px rgba(124,58,237,0.4)"
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Railtracker" className="w-full h-full object-contain" />
              </div>
              {/* Live pulsing dot */}
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#10b981" }} />
                <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: "#10b981" }} />
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-white font-mono">
                  <span style={{ color: "#a78bfa" }}>RAIL</span>
                  <span style={{ color: "#34d399" }}>TRACKER</span>
                </span>
                <span
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider"
                  style={{
                    background: "rgba(124,58,237,0.15)",
                    color: "#a78bfa",
                    border: "1px solid rgba(124,58,237,0.3)"
                  }}
                >
                  Live IR
                </span>
              </div>
              <p className="text-xs font-medium" style={{ color: "#64748b" }}>
                Indian Railways Transit & Tracking
              </p>
            </div>
          </div>

          {/* Nav Tabs — Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(({ id, label, subtitle, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="relative px-4 py-2.5 rounded-xl text-left transition-all duration-200 flex items-center space-x-3 group cursor-pointer"
                  style={{
                    background: isActive ? "rgba(124,58,237,0.15)" : "transparent",
                    border: isActive
                      ? "1px solid rgba(124,58,237,0.4)"
                      : "1px solid transparent",
                  }}
                >
                  <div
                    className="p-2 rounded-lg transition-colors"
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, #7c3aed, #10b981)"
                        : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: isActive ? "white" : "#64748b" }}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold leading-tight"
                      style={{ color: isActive ? "#e2e8f0" : "#94a3b8" }}>
                      {label}
                    </div>
                    <span className="text-[11px] block leading-tight" style={{ color: "#475569" }}>
                      {subtitle}
                    </span>
                  </div>
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-t-full"
                      style={{ background: "linear-gradient(90deg, #7c3aed, #10b981)" }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Health + IST Clock */}
          <div className="flex items-center space-x-3">
            <div
              className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #1a1a2e" }}
            >
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "#10b981" }} />
              <span style={{ color: "#94a3b8" }}>
                {backendHealth ? (
                  <>
                    <strong style={{ color: "#34d399" }}>{backendHealth.stations.toLocaleString()}</strong>{" "}Stns •{" "}
                    <strong style={{ color: "#a78bfa" }}>{backendHealth.trains.toLocaleString()}</strong>{" "}Trains
                  </>
                ) : (
                  <span style={{ color: "#7c3aed" }}>Connecting...</span>
                )}
              </span>
            </div>
            <div
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.25)",
                color: "#a78bfa"
              }}
            >
              <Clock className="w-3.5 h-3.5" style={{ color: "#7c3aed" }} />
              <span>{istTime || "IST"}</span>
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div
          className="flex md:hidden overflow-x-auto py-2.5 space-x-2 border-t scrollbar-none"
          style={{ borderColor: "#1a1a2e" }}
        >
          {navItems.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-2 cursor-pointer"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, #7c3aed, #10b981)"
                    : "rgba(255,255,255,0.06)",
                  color: isActive ? "white" : "#94a3b8",
                  border: isActive ? "none" : "1px solid #1a1a2e"
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
