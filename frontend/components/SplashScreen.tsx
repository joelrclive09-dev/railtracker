"use client";

import React, { useEffect, useState } from "react";

export const SplashScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  // Animation phases:
  // 1. "track" — Track lines draw across the screen (0 - 1000ms)
  // 2. "train" — High-speed train speeds through from left to right (1000 - 2400ms)
  // 3. "logo"  — Train passes, shockwave, and the official Logo is revealed (2400 - 4500ms)
  // 4. "leaving" — Smooth transition out (4500 - 5000ms)
  const [phase, setPhase] = useState<"track" | "train" | "logo" | "leaving">("track");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // If user already viewed splash in this session, skip unless freshly opened
    if (typeof window !== "undefined" && sessionStorage.getItem("rt_splash_done")) {
      onDone();
      return;
    }

    const t1 = setTimeout(() => {
      setPhase("train");
    }, 900);

    const t2 = setTimeout(() => {
      setPhase("logo");
    }, 2200);

    const t3 = setTimeout(() => {
      setPhase("leaving");
    }, 4300);

    const t4 = setTimeout(() => {
      sessionStorage.setItem("rt_splash_done", "1");
      onDone();
    }, 4900);

    // Progress bar ticker
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return Math.min(100, prev + 2.5);
      });
    }, 80);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearInterval(interval);
    };
  }, [onDone]);

  const handleSkip = () => {
    sessionStorage.setItem("rt_splash_done", "1");
    onDone();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden transition-opacity duration-700 ${
        phase === "leaving" ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
      }`}
      style={{ background: "#000000" }}
    >
      {/* Subtle background ambient glow */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none opacity-20 blur-[140px]"
        style={{
          background: "radial-gradient(circle, #7c3aed 0%, #10b981 70%, transparent 100%)",
        }}
      />

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-50 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider cursor-pointer transition-all hover:scale-105"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          color: "#94a3b8",
        }}
      >
        Skip ➔
      </button>

      {/* ================= STAGE 1 & 2: TRACK & SPEEDING TRAIN ================= */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          phase === "logo" || phase === "leaving" ? "opacity-30" : "opacity-100"
        }`}
      >
        <div className="relative w-full flex items-center justify-center h-48">
          {/* Railway Tracks SVG */}
          <svg className="w-full h-32" preserveAspectRatio="none" viewBox="0 0 1200 120">
            <defs>
              <linearGradient id="railGradPurple" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#a78bfa" stopOpacity="1" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="railGradEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.8" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Sleepers / Cross-ties that draw in during track phase */}
            {Array.from({ length: 48 }).map((_, i) => (
              <rect
                key={i}
                x={i * 26 + 10}
                y="38"
                width="8"
                height="44"
                rx="2"
                fill="#18182f"
                stroke="#252545"
                strokeWidth="1"
                className="transition-all duration-500"
                style={{
                  opacity: phase !== "track" ? 0.8 : 0,
                  transform: phase !== "track" ? "scaleY(1)" : "scaleY(0.1)",
                  transformOrigin: "center",
                  transitionDelay: `${i * 15}ms`,
                }}
              />
            ))}

            {/* Top Rail Line */}
            <line
              x1="0"
              y1="44"
              x2="1200"
              y2="44"
              stroke="url(#railGradPurple)"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#neonGlow)"
              className="transition-all duration-1000 ease-out"
              style={{
                strokeDasharray: 1200,
                strokeDashoffset: phase === "track" ? 1200 : 0,
              }}
            />

            {/* Bottom Rail Line */}
            <line
              x1="0"
              y1="76"
              x2="1200"
              y2="76"
              stroke="url(#railGradEmerald)"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#neonGlow)"
              className="transition-all duration-1000 ease-out delay-150"
              style={{
                strokeDasharray: 1200,
                strokeDashoffset: phase === "track" ? 1200 : 0,
              }}
            />
          </svg>

          {/* Speeding Train Model (Appears in 'train' phase and speeds across screen) */}
          {phase === "train" && (
            <div
              className="absolute left-0 flex items-center pointer-events-none"
              style={{
                top: "50%",
                transform: "translateY(-50%)",
                animation: "train-speed-cross 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
              }}
            >
              {/* Headlight beam shining forward */}
              <div
                className="absolute left-[380px] w-[500px] h-[90px] pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at left, rgba(254, 240, 138, 0.7) 0%, rgba(52, 211, 153, 0.3) 35%, transparent 75%)",
                  clipPath: "polygon(0% 40%, 100% 0%, 100% 100%, 0% 60%)",
                  filter: "blur(4px)",
                }}
              />

              {/* Aerodynamic High Speed Train Engine SVG */}
              <svg width="390" height="74" viewBox="0 0 390 74" fill="none">
                {/* Motion blur trail lines behind train */}
                <line x1="0" y1="20" x2="60" y2="20" stroke="#7c3aed" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
                <line x1="10" y1="36" x2="80" y2="36" stroke="#10b981" strokeWidth="2.5" strokeDasharray="8 6" opacity="0.8" />
                <line x1="0" y1="52" x2="65" y2="52" stroke="#a78bfa" strokeWidth="2" strokeDasharray="5 5" opacity="0.6" />

                {/* Train Body / aerodynamic bullet nose */}
                <path
                  d="M 60 14 L 270 14 Q 350 14 380 44 Q 385 54 365 58 L 60 58 Z"
                  fill="url(#trainBodyGradient)"
                  stroke="#34d399"
                  strokeWidth="1.5"
                />

                {/* Train Roof line */}
                <path d="M 70 14 L 280 14 Q 320 16 345 28" stroke="#ffffff" strokeWidth="2" opacity="0.8" />

                {/* Cockpit Windshield (Gradient Aerodynamic visor) */}
                <path
                  d="M 305 18 L 340 32 Q 352 38 358 44 L 325 44 Q 308 32 300 24 Z"
                  fill="#030712"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                />

                {/* Passenger Windows row */}
                {[80, 120, 160, 200, 240].map((x) => (
                  <rect
                    key={x}
                    x={x}
                    y="24"
                    width="26"
                    height="12"
                    rx="3"
                    fill="#10b981"
                    opacity="0.9"
                    style={{
                      boxShadow: "0 0 10px #10b981",
                    }}
                  />
                ))}

                {/* Aerodynamic side speed stripe */}
                <path
                  d="M 60 40 L 290 40 Q 330 42 360 49 L 60 49 Z"
                  fill="url(#stripeGrad)"
                  opacity="0.9"
                />

                {/* Front LED Headlights */}
                <circle cx="372" cy="46" r="4.5" fill="#fef08a" filter="url(#neonGlow)" />
                <circle cx="372" cy="46" r="2" fill="#ffffff" />

                {/* Rail bogies / wheels */}
                <circle cx="100" cy="58" r="6" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="2" />
                <circle cx="140" cy="58" r="6" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="2" />
                <circle cx="230" cy="58" r="6" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
                <circle cx="270" cy="58" r="6" fill="#064e3b" stroke="#10b981" strokeWidth="2" />

                <defs>
                  <linearGradient id="trainBodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="50%" stopColor="#1e1b4b" />
                    <stop offset="85%" stopColor="#064e3b" />
                    <stop offset="100%" stopColor="#022c22" />
                  </linearGradient>
                  <linearGradient id="stripeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="60%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* ================= STAGE 3: LOGO REVEAL ================= */}
      <div
        className={`relative z-20 flex flex-col items-center justify-center space-y-6 transition-all duration-1000 ${
          phase === "logo" || phase === "leaving"
            ? "opacity-100 scale-100 blur-0 translate-y-0"
            : "opacity-0 scale-75 blur-md translate-y-8 pointer-events-none"
        }`}
      >
        {/* Glow halo behind logo */}
        <div className="relative flex items-center justify-center">
          <div
            className="absolute w-56 h-56 rounded-full pointer-events-none animate-pulse"
            style={{
              background: "radial-gradient(circle, rgba(124, 58, 237, 0.45) 0%, rgba(16, 185, 129, 0.25) 50%, transparent 75%)",
              filter: "blur(25px)",
            }}
          />

          {/* Logo Image uploaded by user */}
          <div
            className="relative p-2 rounded-3xl transition-transform duration-700 hover:scale-105"
            style={{
              background: "rgba(10, 10, 22, 0.75)",
              border: "1px solid rgba(124, 58, 237, 0.35)",
              boxShadow: "0 0 50px rgba(124, 58, 237, 0.3), 0 0 80px rgba(16, 185, 129, 0.2)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Railtracker Logo"
              className="w-48 sm:w-64 h-auto object-contain rounded-2xl drop-shadow-[0_0_25px_rgba(16,185,129,0.35)]"
            />
          </div>
        </div>

        {/* Subtitle tag */}
        <div className="text-center space-y-1">
          <p
            className="text-xs sm:text-sm font-mono tracking-[0.25em] uppercase font-bold"
            style={{
              background: "linear-gradient(90deg, #a78bfa, #34d399)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Next-Gen Transit Intelligence
          </p>
          <p className="text-[11px] font-sans text-slate-500">
            Multi-Hop Transfers • Live Tracking • Station Radar
          </p>
        </div>

        {/* High-tech Loading Progress Bar */}
        <div className="w-56 sm:w-72 h-1.5 rounded-full overflow-hidden bg-slate-900 border border-slate-800 shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-100 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #7c3aed, #10b981)",
              boxShadow: "0 0 10px rgba(16, 185, 129, 0.8)",
            }}
          />
        </div>
      </div>

      {/* Train Speed Keyframe Animation */}
      <style jsx global>{`
        @keyframes train-speed-cross {
          0% {
            left: -450px;
            opacity: 0.2;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            left: calc(100% + 450px);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};
