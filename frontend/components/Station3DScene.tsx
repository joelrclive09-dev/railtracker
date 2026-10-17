"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import * as THREE from "three";

// ── Station coordinates for satellite imagery (lat, lon) ───────────
const STATION_COORDS: Record<string, [number, number]> = {
  TPJ:  [10.8152, 78.6952],
  ED:   [11.3410, 77.7172],
  CBE:  [11.0168, 76.9558],
  QLN:  [ 8.8932, 76.6141],
  MAS:  [13.0827, 80.2707],
  SBC:  [12.9774, 77.5713],
  TVC:  [ 8.4855, 76.9492],
  ERS:  [ 9.9816, 76.2999],
  NDLS: [28.6419, 77.2194],
  MMCT: [18.9402, 72.8354],
};

// ── Slippy tile XYZ from lat/lon ────────────────────────────────────
function latLonToTile(lat: number, lon: number, zoom: number): [number, number] {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return [x, y];
}

// ── Satellite tile loader (Esri World Imagery — free, no key) ───────
const useSatelliteTile = (stationCode: string): string => {
  const [url, setUrl] = useState("/placeholder-sat.png");

  useEffect(() => {
    const coords = STATION_COORDS[stationCode];
    if (!coords) return;
    const [lat, lon] = coords;
    const zoom = 16;
    const [tx, ty] = latLonToTile(lat, lon, zoom);
    // Esri World Imagery tile — freely usable, no API key needed
    const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`;
    setUrl(tileUrl);
  }, [stationCode]);

  return url;
};

// ── Platform z-position helper ────────────────────────────────────
const getPlatformZ = (pf: number) => {
  switch (pf) {
    case 1: return -10.5;
    case 2: return -3.5;
    case 3: return 3.5;
    case 4: return 10.5;
    default: return 0;
  }
};

// ── Animated passenger beacon ─────────────────────────────────────
const AnimatedBeacon: React.FC<{ pathPoints: THREE.Vector3[] }> = ({ pathPoints }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(pathPoints, false, "centripetal", 0.3), [pathPoints]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    progressRef.current = (progressRef.current + delta * 0.25) % 1.0;
    const pos = curve.getPointAt(progressRef.current);
    meshRef.current.position.copy(pos);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.45, 24, 24]} />
      <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={3} toneMapped={false} />
      <pointLight color="#10b981" intensity={4} distance={6} />
    </mesh>
  );
};

// ── Platform mesh ─────────────────────────────────────────────────
const PlatformMesh: React.FC<{
  platformNumber: number;
  z: number;
  isArrival: boolean;
  isDeparture: boolean;
}> = ({ platformNumber, z, isArrival, isDeparture }) => {
  const platLength = 36;
  const platWidth = 3.6;
  const platHeight = 0.8;
  const highlightColor = isArrival ? "#10b981" : isDeparture ? "#7c3aed" : "#1e293b";

  return (
    <group position={[0, 0, z]}>
      {/* Concrete base */}
      <mesh position={[0, platHeight / 2, 0]}>
        <boxGeometry args={[platLength, platHeight, platWidth]} />
        <meshStandardMaterial color="#0d1117" roughness={0.85} />
      </mesh>

      {/* Safety edge lines — emerald instead of yellow */}
      <mesh position={[0, platHeight + 0.01, -platWidth / 2 + 0.15]}>
        <planeGeometry args={[platLength, 0.2]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      <mesh position={[0, platHeight + 0.01, platWidth / 2 - 0.15]}>
        <planeGeometry args={[platLength, 0.2]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>

      {/* Canopy roof */}
      <group position={[0, 4.2, 0]}>
        <mesh>
          <boxGeometry args={[platLength * 0.75, 0.15, platWidth * 1.15]} />
          <meshStandardMaterial color="#0a0a16" metalness={0.7} roughness={0.3} />
        </mesh>
        {[-10, -4, 4, 10].map((x) => (
          <mesh key={x} position={[x, -2, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 4.2]} />
            <meshStandardMaterial color="#7c3aed" metalness={0.8} emissive="#7c3aed" emissiveIntensity={0.2} />
          </mesh>
        ))}
      </group>

      {/* Signboard */}
      <group position={[0, 3.5, 0]}>
        <mesh>
          <boxGeometry args={[2.5, 0.9, 0.15]} />
          <meshStandardMaterial color={isArrival ? "#065f46" : isDeparture ? "#4c1d95" : "#0a0a16"} />
        </mesh>
        <Text position={[0, 0, 0.09]} fontSize={0.45} color="#ffffff" anchorX="center" anchorY="middle">
          {`PLATFORM ${platformNumber}`}
        </Text>
      </group>

      {/* Glow ring */}
      {(isArrival || isDeparture) && (
        <group position={[0, platHeight + 0.05, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.5, 1.8, 32]} />
            <meshBasicMaterial color={highlightColor} side={THREE.DoubleSide} />
          </mesh>
          <pointLight color={highlightColor} intensity={2.5} distance={8} />
        </group>
      )}
    </group>
  );
};

// ── Track mesh ────────────────────────────────────────────────────
const TrackMesh: React.FC<{ z: number }> = ({ z }) => {
  const trackLength = 40;
  const railGauge = 1.676;
  return (
    <group position={[0, 0.05, z]}>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[trackLength, 0.15, 2.8]} />
        <meshStandardMaterial color="#050811" roughness={0.95} />
      </mesh>
      {Array.from({ length: 45 }).map((_, i) => (
        <mesh key={i} position={[-19 + i * 0.86, 0.18, 0]}>
          <boxGeometry args={[0.3, 0.12, 2.5]} />
          <meshStandardMaterial color="#1a0e0a" roughness={0.8} />
        </mesh>
      ))}
      {[-railGauge / 2, railGauge / 2].map((zOff, i) => (
        <mesh key={i} position={[0, 0.28, zOff]}>
          <boxGeometry args={[trackLength, 0.15, 0.08]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
};

// ── Train model ───────────────────────────────────────────────────
const TrainModel: React.FC<{ z: number; color?: string }> = ({ z, color = "#7c3aed" }) => (
  <group position={[-2, 1.5, z]}>
    <mesh>
      <boxGeometry args={[16, 2.4, 2.4]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
    </mesh>
    {/* Window strip */}
    <mesh position={[0, 0.3, 1.21]}>
      <planeGeometry args={[14, 0.6]} />
      <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
    </mesh>
    <mesh position={[0, 0.3, -1.21]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[14, 0.6]} />
      <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
    </mesh>
    {/* Headlight */}
    <mesh position={[8.02, -0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
      <circleGeometry args={[0.35, 16]} />
      <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={4} />
    </mesh>
    <pointLight position={[8.5, 0, 0]} color="#a78bfa" intensity={4} distance={10} />
  </group>
);

// ── FOB structure ──────────────────────────────────────────────────
const FootOverbridge: React.FC = () => {
  const fHeight = 6.2;
  const bridgeZSpan = 26;
  const bridgeWidth = 3.5;
  return (
    <group>
      {/* Deck */}
      <mesh position={[0, fHeight, 0]}>
        <boxGeometry args={[bridgeWidth, 0.4, bridgeZSpan]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, fHeight + 2.4, 0]}>
        <boxGeometry args={[bridgeWidth * 1.1, 0.2, bridgeZSpan]} />
        <meshStandardMaterial color="#0a0a16" metalness={0.8} />
      </mesh>
      {/* Glass railings — purple tint */}
      {[-bridgeWidth / 2, bridgeWidth / 2].map((xOff, i) => (
        <mesh key={i} position={[xOff, fHeight + 1.2, 0]}>
          <boxGeometry args={[0.1, 2.2, bridgeZSpan]} />
          <meshStandardMaterial color="#7c3aed" transparent opacity={0.25} />
        </mesh>
      ))}
      {/* Overhead lights */}
      {[-8, 0, 8].map((z) => (
        <pointLight key={z} position={[0, fHeight + 2, z]} color="#a78bfa" intensity={1.5} distance={7} />
      ))}
      {/* Support columns */}
      {[-10.5, -3.5, 3.5, 10.5].map((z) => (
        <group key={z} position={[0, 0, z]}>
          {[-1.4, 1.4].map((xOff, i) => (
            <mesh key={i} position={[xOff, fHeight / 2, 0]}>
              <cylinderGeometry args={[0.18, 0.22, fHeight]} />
              <meshStandardMaterial color="#7c3aed" metalness={0.8} emissive="#7c3aed" emissiveIntensity={0.1} />
            </mesh>
          ))}
          {/* Staircase */}
          <mesh position={[0, fHeight / 2, 0.9]} rotation={[0.55, 0, 0]}>
            <boxGeometry args={[2.0, 0.25, 7.0]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ── Satellite Ground Plane ─────────────────────────────────────────
const SatelliteGround: React.FC<{ tileUrl: string }> = ({ tileUrl }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      tileUrl,
      (tex) => setTexture(tex),
      undefined,
      () => setTexture(null) // fallback on CORS error — use plain ground
    );
  }, [tileUrl]);

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
      <planeGeometry args={[90, 90]} />
      {texture ? (
        <meshStandardMaterial map={texture} roughness={0.9} />
      ) : (
        <meshStandardMaterial color="#050811" roughness={0.9} />
      )}
    </mesh>
  );
};

// ── Main exported scene ────────────────────────────────────────────
interface Station3DSceneProps {
  arrivalPlatform: number;
  departurePlatform: number;
  stationCode?: string;
}

export const Station3DScene: React.FC<Station3DSceneProps> = ({
  arrivalPlatform,
  departurePlatform,
  stationCode = "TPJ",
}) => {
  const arrZ = getPlatformZ(arrivalPlatform);
  const depZ = getPlatformZ(departurePlatform);
  const tileUrl = useSatelliteTile(stationCode);

  const pathPoints = useMemo(() => [
    new THREE.Vector3(-4, 0.9, arrZ),
    new THREE.Vector3(-0.5, 0.9, arrZ),
    new THREE.Vector3(0, 3.5, arrZ + (arrZ < depZ ? 2 : -2)),
    new THREE.Vector3(0, 6.4, arrZ),
    new THREE.Vector3(0, 6.4, depZ),
    new THREE.Vector3(0, 3.5, depZ + (depZ < arrZ ? 2 : -2)),
    new THREE.Vector3(0.5, 0.9, depZ),
    new THREE.Vector3(4, 0.9, depZ),
  ], [arrZ, depZ]);

  return (
    <Canvas camera={{ position: [18, 22, 28], fov: 42 }} className="w-full h-full rounded-2xl" gl={{ antialias: true }}>
      <color attach="background" args={["#050811"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[20, 30, 20]} intensity={1.4} castShadow />
      <directionalLight position={[-20, 20, -10]} intensity={0.5} />
      {/* Purple ambient glow from above */}
      <pointLight position={[0, 20, 0]} color="#7c3aed" intensity={1.5} distance={50} />

      <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2 - 0.05} minDistance={8} maxDistance={60} />

      {/* Satellite ground tile */}
      <SatelliteGround tileUrl={tileUrl} />

      {/* Platforms */}
      {[1, 2, 3, 4].map((pf) => (
        <PlatformMesh key={pf} platformNumber={pf} z={getPlatformZ(pf)}
          isArrival={arrivalPlatform === pf} isDeparture={departurePlatform === pf} />
      ))}

      {/* Tracks */}
      {[-7, 0, 7].map((z) => <TrackMesh key={z} z={z} />)}

      {/* Trains */}
      <TrainModel z={-7} color="#7c3aed" />
      <TrainModel z={7} color="#10b981" />

      {/* FOB */}
      <FootOverbridge />

      {/* Transfer path line */}
      <Line points={pathPoints} color="#10b981" lineWidth={5} dashed={false} />

      {/* Animated beacon */}
      <AnimatedBeacon pathPoints={pathPoints} />
    </Canvas>
  );
};
