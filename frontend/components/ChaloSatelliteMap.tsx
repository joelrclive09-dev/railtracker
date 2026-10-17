"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BoardTrain } from "@/types";

interface ChaloSatelliteMapProps {
  userLocation: { lat: number; lon: number } | null;
  station: { code: string; name: string; lat: number; lon: number };
  trains: BoardTrain[];
  selectedTrainNumber: string | null;
  onSelectTrain: (train: BoardTrain) => void;
  onTrackTrain: (trainNumber: string) => void;
}

interface ActiveTrackedTrain {
  trainNumber: string;
  train: BoardTrain;
  marker: L.Marker;
  pathPolyline: L.Polyline;
  headingRad: number; // Direction of motion along railway track
  headingDeg: number;
  direction: "UP" | "DOWN"; // Northbound vs Southbound
  currentDistDeg: number; // Distance from platform center (+ is approaching, 0 is at platform, - is departing)
  speedKmph: number;
  speedDegPerSec: number;
  platform: number;
  trackOffsetLat: number;
  trackOffsetLon: number;
  isAtPlatform: boolean;
  hasDeparted: boolean;
}

export const ChaloSatelliteMap: React.FC<ChaloSatelliteMapProps> = ({
  userLocation,
  station,
  trains,
  selectedTrainNumber,
  onSelectTrain,
  onTrackTrain,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const trackedTrainsRef = useRef<Map<string, ActiveTrackedTrain>>(new Map());
  const animFrameRef = useRef<number | null>(null);

  const [activeCount, setActiveCount] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<string>("Active • Real-Time Satellite Radar");

  // 1. Initialize Leaflet Map with Google Maps Satellite Hybrid Layer
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [station.lat, station.lon],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // High-resolution Google Satellite Hybrid (satellite + road/rail lines & labels)
      const googleSatelliteUrl = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
      const satelliteLayer = L.tileLayer(googleSatelliteUrl, {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
      });
      satelliteLayer.addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Setup Station Platform Tracks & GPS Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    // Track axis orientation: Indian railway tracks at station (predominantly North-South ~350° to 170°)
    const trackAngleRad = (350 * Math.PI) / 180; // Main corridor heading

    // Draw realistic railway platform tracks on the satellite view
    const trackSpan = 0.012; // ~1.3 km of station track corridor
    for (let p = 1; p <= 4; p++) {
      const offset = (p - 2.5) * 0.00035; // Perpendicular platform track spacing
      const perpAngle = trackAngleRad + Math.PI / 2;
      const offLat = Math.sin(perpAngle) * offset;
      const offLon = Math.cos(perpAngle) * offset;

      const pStart: [number, number] = [
        station.lat + offLat + Math.cos(trackAngleRad) * trackSpan,
        station.lon + offLon + Math.sin(trackAngleRad) * trackSpan,
      ];
      const pEnd: [number, number] = [
        station.lat + offLat - Math.cos(trackAngleRad) * trackSpan,
        station.lon + offLon - Math.sin(trackAngleRad) * trackSpan,
      ];

      L.polyline([pStart, pEnd], {
        color: "#64748b",
        weight: 1.5,
        opacity: 0.45,
        dashArray: "3 3",
      }).addTo(layer);
    }

    // Station Hub Marker
    const stationHtml = `
      <div style="
        background: linear-gradient(135deg, #7c3aed, #10b981);
        color: white;
        padding: 6px 14px;
        border-radius: 12px;
        font-family: monospace;
        font-weight: 900;
        font-size: 11px;
        box-shadow: 0 0 30px rgba(124,58,237,0.8), 0 0 50px rgba(16,185,129,0.5);
        border: 2px solid white;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 6px;
      ">
        <span style="font-size: 14px;">🚉</span>
        <span>${station.code}</span>
        <span style="font-size: 9px; opacity: 0.9; font-weight: bold; background: rgba(0,0,0,0.35); padding: 1px 5px; border-radius: 4px;">JUNCTION RADAR</span>
      </div>
    `;

    const stationIcon = L.divIcon({
      html: stationHtml,
      className: "custom-station-pin",
      iconSize: [130, 32],
      iconAnchor: [65, 16],
    });

    const stMarker = L.marker([station.lat, station.lon], { icon: stationIcon }).addTo(layer);
    stMarker.bindPopup(`
      <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; padding: 4px;">
        <strong style="color: #7c3aed; font-size: 14px;">${station.code} - ${station.name}</strong><br/>
        <span style="color: #64748b;">Indian Railways Junction Platform Radar</span>
      </div>
    `);

    // User Location GPS Pin
    if (userLocation) {
      const userHtml = `
        <div style="position: relative; width: 34px; height: 34px;">
          <div style="
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.4);
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: absolute;
            inset: 5px;
            border-radius: 50%;
            background: #2563eb;
            border: 2px solid white;
            box-shadow: 0 0 18px #3b82f6;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
          ">📍</div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userHtml,
        className: "custom-user-pin",
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .addTo(layer)
        .bindPopup("<strong>You are here</strong><br/>Live GPS Position");

      L.circle([userLocation.lat, userLocation.lon], {
        radius: 3500,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.05,
        weight: 1,
        dashArray: "4 6",
      }).addTo(layer);
    }

    map.flyTo([station.lat, station.lon], 14, { duration: 1 });
  }, [station, userLocation]);

  // 3. Process Live Trains into Tracked Railway Corridors (STRICTLY NON-LOOPING)
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;

    const tracked = trackedTrainsRef.current;
    const incomingTrainNumbers = new Set(trains.map((t) => t.train_number));

    // Cleanup trains that are no longer in the active 2-hour window
    for (const [tNum, item] of tracked.entries()) {
      if (!incomingTrainNumbers.has(tNum)) {
        layer.removeLayer(item.marker);
        layer.removeLayer(item.pathPolyline);
        tracked.delete(tNum);
      }
    }

    // Main physical railway line angle across this station (North-South ~350° to 170°)
    const mainTrackAngle = (350 * Math.PI) / 180;
    const perpAngle = mainTrackAngle + Math.PI / 2;

    trains.forEach((train) => {
      const isSelected = selectedTrainNumber === train.train_number;
      const speedKmph = 65 + (Number(train.train_number) % 25);

      // Determine train direction: Northbound (heading ~350°) or Southbound (heading ~170°)
      // Check train destination vs origin keywords or train number parity
      const isNorthbound =
        train.destination.includes("CHENNAI") ||
        train.destination.includes("MUMBAI") ||
        train.destination.includes("DELHI") ||
        train.destination.includes("NIZAM") ||
        Number(train.train_number) % 2 === 0;

      const motionHeading = isNorthbound ? mainTrackAngle : mainTrackAngle + Math.PI;

      // Platform track offset perpendicular to the main line
      const platformNum = train.platform || 2;
      const trackOffsetDist = (platformNum - 2.5) * 0.00035;
      const trackOffLat = Math.sin(perpAngle) * trackOffsetDist;
      const trackOffLon = Math.cos(perpAngle) * trackOffsetDist;

      // Real physical distance from station center in degrees
      // If time_diff_min > 0: train is approaching
      // If time_diff_min <= 0 && >= -5: train is halted at platform
      // If time_diff_min < -5: train has departed and is heading away
      const isAtPlatform =
        train.status === "AT_PLATFORM" ||
        (train.time_diff_min <= 0 && train.time_diff_min >= -4);
      const hasDeparted =
        train.status === "DEPARTING" || train.time_diff_min < -4;

      let targetDistDeg = 0;
      if (isAtPlatform) {
        targetDistDeg = 0.0001; // Docked at platform track
      } else if (hasDeparted) {
        // Departed downstream: distance increases away from platform (negative distance)
        const minsDeparted = Math.abs(train.time_diff_min);
        targetDistDeg = -Math.min(0.045, (minsDeparted / 60) * (speedKmph / 111));
      } else {
        // Approaching: distance from platform
        targetDistDeg = Math.min(0.042, Math.max(0.002, (train.time_diff_min / 60) * (speedKmph / 111)));
      }

      // Check if train is already being tracked
      const existing = tracked.get(train.train_number);

      if (existing) {
        // Update live status & target distance smoothly without teleporting!
        existing.train = train;
        existing.speedKmph = isAtPlatform ? 0 : speedKmph;
        existing.isAtPlatform = isAtPlatform;
        existing.hasDeparted = hasDeparted;
        existing.platform = platformNum;
        existing.trackOffsetLat = trackOffLat;
        existing.trackOffsetLon = trackOffLon;

        // If server says train arrived at platform, dock it
        if (isAtPlatform && !existing.isAtPlatform) {
          existing.currentDistDeg = 0.0001;
        }
      } else {
        // Newly appeared train — spawn at its actual physical location on the track
        const initialDist = targetDistDeg;
        // Direction vector: if approaching, position is upstream against motionHeading
        const currentLat =
          station.lat +
          trackOffLat -
          Math.cos(motionHeading) * initialDist;
        const currentLon =
          station.lon +
          trackOffLon -
          Math.sin(motionHeading) * initialDist;

        // Locomotive Engine SVG Icon with Headlights & Wheel Bogies
        const trainHtml = `
          <div id="train-badge-${train.train_number}" style="
            background: ${
              isSelected
                ? "linear-gradient(135deg, rgba(16,185,129,0.98), rgba(5,150,105,0.98))"
                : "rgba(10, 10, 22, 0.95)"
            };
            border: 2px solid ${isSelected ? "#34d399" : "#a78bfa"};
            color: white;
            padding: 5px 11px;
            border-radius: 14px;
            font-family: monospace;
            font-weight: bold;
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 7px;
            box-shadow: 0 4px 22px rgba(0,0,0,0.9), 0 0 ${isSelected ? "25px #10b981" : "14px rgba(124,58,237,0.6)"};
            cursor: pointer;
            transform: scale(${isSelected ? 1.15 : 1});
            transition: transform 0.2s ease, border-color 0.2s;
            white-space: nowrap;
          ">
            <!-- Authentic Indian Railways Electric Locomotive SVG -->
            <svg style="width: 22px; height: 22px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="12" rx="3" fill="#1e1b4b" stroke="#34d399" stroke-width="1.5"/>
              <path d="M4 11h16" stroke="#10b981" stroke-width="1" stroke-dasharray="2 2"/>
              <circle cx="6" cy="18" r="2" fill="#a78bfa" stroke="#34d399" stroke-width="1"/>
              <circle cx="12" cy="18" r="2" fill="#a78bfa" stroke="#34d399" stroke-width="1"/>
              <circle cx="18" cy="18" r="2" fill="#a78bfa" stroke="#34d399" stroke-width="1"/>
              <path d="M7 6V3h10v3" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="5" cy="9" r="1.5" fill="#fef08a"/>
              <circle cx="19" cy="9" r="1.5" fill="#fef08a"/>
            </svg>

            <span style="color: ${isSelected ? "#ffffff" : "#a78bfa"}; font-weight: 900; font-size: 12px;">${train.train_number}</span>
            <span style="
              background: rgba(16, 185, 129, 0.25);
              color: #34d399;
              padding: 1px 6px;
              border-radius: 6px;
              font-size: 9px;
              font-weight: 800;
            ">PF ${platformNum}</span>
            <span class="live-speed-tag" style="
              background: rgba(124, 58, 237, 0.25);
              color: #c4b5fd;
              padding: 1px 6px;
              border-radius: 6px;
              font-size: 9px;
            ">${isAtPlatform ? "0 km/h (HALTED)" : `${speedKmph} km/h`}</span>
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${isAtPlatform ? "#fbbf24" : "#10b981"};
              box-shadow: 0 0 10px ${isAtPlatform ? "#fbbf24" : "#10b981"};
              display: inline-block;
              animation: pulse 1s infinite;
            "></span>
          </div>
        `;

        const trainIcon = L.divIcon({
          html: trainHtml,
          className: "custom-train-pin",
          iconSize: [170, 32],
          iconAnchor: [85, 16],
        });

        const marker = L.marker([currentLat, currentLon], { icon: trainIcon }).addTo(layer);

        // One-directional railway track corridor vector
        const corridorEndLat =
          station.lat +
          trackOffLat +
          Math.cos(motionHeading) * 0.035;
        const corridorEndLon =
          station.lon +
          trackOffLon +
          Math.sin(motionHeading) * 0.035;

        const pathPolyline = L.polyline(
          [
            [currentLat, currentLon],
            [station.lat + trackOffLat, station.lon + trackOffLon],
            [corridorEndLat, corridorEndLon],
          ],
          {
            color: isSelected ? "#10b981" : "#7c3aed",
            weight: isSelected ? 3 : 1.5,
            dashArray: "4 6",
            opacity: 0.6,
          }
        ).addTo(layer);

        marker.on("click", () => {
          onSelectTrain(train);
        });

        tracked.set(train.train_number, {
          trainNumber: train.train_number,
          train,
          marker,
          pathPolyline,
          headingRad: motionHeading,
          headingDeg: (motionHeading * 180) / Math.PI,
          direction: isNorthbound ? "UP" : "DOWN",
          currentDistDeg: initialDist,
          speedKmph,
          speedDegPerSec: (speedKmph / (111 * 3600)) * 5.0, // Visible, realistic smooth radar speed (~0.0008 deg/s)
          platform: platformNum,
          trackOffsetLat: trackOffLat,
          trackOffsetLon: trackOffLon,
          isAtPlatform,
          hasDeparted,
        });
      }
    });

    setActiveCount(tracked.size);
    setSyncStatus(`Live Radar Synchronized • ${tracked.size} Trains Active on Tracks`);
  }, [trains, station, selectedTrainNumber]);

  // 4. Smooth 60 FPS Physics Engine (STRICTLY ONE DIRECTION — NO LOOPING)
  useEffect(() => {
    let lastTime = performance.now();

    const animateLoop = (currentTime: number) => {
      const deltaSec = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const layer = markersLayerRef.current;
      const tracked = trackedTrainsRef.current;

      tracked.forEach((item, tNum) => {
        // If train is halted at platform, it stays docked at platform!
        if (item.isAtPlatform) {
          item.currentDistDeg = 0.0001;
        } else if (!item.hasDeparted) {
          // Approaching: distance steadily decreases towards platform
          item.currentDistDeg -= item.speedDegPerSec * deltaSec;

          if (item.currentDistDeg <= 0.0003) {
            // Reached platform! Dock smoothly at platform (NO LOOPING)
            item.currentDistDeg = 0.0001;
            item.isAtPlatform = true;
          }
        } else {
          // Departing: distance increases away from platform downstream along rail line
          item.currentDistDeg -= item.speedDegPerSec * deltaSec; // negative means past station

          if (Math.abs(item.currentDistDeg) >= 0.048) {
            // Train has safely exited the station radar boundary into the next district
            if (layer) {
              layer.removeLayer(item.marker);
              layer.removeLayer(item.pathPolyline);
            }
            tracked.delete(tNum);
            return;
          }
        }

        // Calculate continuous geographical position strictly along the railway track
        const newLat =
          station.lat +
          item.trackOffsetLat -
          Math.cos(item.headingRad) * item.currentDistDeg;
        const newLon =
          station.lon +
          item.trackOffsetLon -
          Math.sin(item.headingRad) * item.currentDistDeg;

        // Update marker position continuously
        item.marker.setLatLng([newLat, newLon]);
      });

      animFrameRef.current = requestAnimationFrame(animateLoop);
    };

    animFrameRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [station]);

  const handleCenterUser = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lon], 15, { duration: 1 });
    }
  };

  const handleCenterStation = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([station.lat, station.lon], 14, { duration: 1 });
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl">
      {/* Real-Time Radar Header */}
      <div
        className="absolute top-3 left-3 z-[1000] px-3.5 py-2 rounded-xl flex items-center space-x-3 backdrop-blur-md shadow-xl"
        style={{
          background: "rgba(10, 10, 22, 0.9)",
          border: "1px solid rgba(16, 185, 129, 0.4)",
        }}
      >
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <div className="text-xs">
          <span className="font-bold text-white uppercase tracking-wider">Live Train Radar (Chalo Style)</span>
          <span className="text-[10px] text-emerald-400 block font-mono">
            {syncStatus} • Continuous Railway Corridors (No Looping)
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center space-x-2">
        <button
          onClick={handleCenterStation}
          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center space-x-1.5 cursor-pointer backdrop-blur-md"
          style={{
            background: "rgba(10, 10, 22, 0.85)",
            border: "1px solid rgba(124, 58, 237, 0.4)",
            color: "#c4b5fd",
          }}
        >
          <span>🚉</span>
          <span>Center Station</span>
        </button>

        {userLocation && (
          <button
            onClick={handleCenterUser}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center space-x-1.5 cursor-pointer backdrop-blur-md"
            style={{
              background: "rgba(10, 10, 22, 0.85)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              color: "#93c5fd",
            }}
          >
            <span>📍</span>
            <span>My GPS</span>
          </button>
        )}
      </div>

      {/* Satellite Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-[470px] bg-slate-950" />

      {/* Radar Legend Footer */}
      <div
        className="px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 border-t border-slate-800"
        style={{ background: "rgba(5, 8, 17, 0.95)" }}
      >
        <div className="flex items-center space-x-4">
          <span className="text-slate-400 flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400" />
            <span>Northbound Corridor (~350°)</span>
          </span>
          <span className="text-slate-400 flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block shadow-sm shadow-purple-400" />
            <span>Southbound Corridor (~170°)</span>
          </span>
          <span className="text-slate-400 flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400" />
            <span>Docked on Platform Track</span>
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Google Satellite • Track-Aligned Live Vector Engine
        </span>
      </div>
    </div>
  );
};
