"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  Line,
  Sphere,
  Box,
  Cylinder,
} from "@react-three/drei";
import * as THREE from "three";

interface Station3DSceneProps {
  arrivalPlatform: number;
  departurePlatform: number;
}

// Convert platform number (1..4) to Z coordinate
const getPlatformZ = (pf: number) => {
  switch (pf) {
    case 1:
      return -10.5;
    case 2:
      return -3.5;
    case 3:
      return 3.5;
    case 4:
      return 10.5;
    default:
      return 0;
  }
};

// Animated Passenger Beacon moving along the FOB path
const AnimatedBeacon: React.FC<{
  pathPoints: THREE.Vector3[];
}> = ({ pathPoints }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(pathPoints, false, "centripetal", 0.3);
  }, [pathPoints]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    progressRef.current = (progressRef.current + delta * 0.25) % 1.0;
    const pos = curve.getPointAt(progressRef.current);
    meshRef.current.position.copy(pos);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.45, 24, 24]} />
      <meshStandardMaterial
        color="#f59e0b"
        emissive="#fbbf24"
        emissiveIntensity={2.5}
        toneMapped={false}
      />
      <pointLight color="#f59e0b" intensity={3} distance={5} />
    </mesh>
  );
};

// Complete 3D Railway Platform
const PlatformMesh: React.FC<{
  platformNumber: number;
  z: number;
  isArrival: boolean;
  isDeparture: boolean;
}> = ({ platformNumber, z, isArrival, isDeparture }) => {
  const platWidth = 3.6;
  const platLength = 36;
  const platHeight = 0.8;

  let highlightColor = "#334155";
  if (isArrival) highlightColor = "#10b981"; // Emerald for arrival
  if (isDeparture) highlightColor = "#f59e0b"; // Amber for departure

  return (
    <group position={[0, 0, z]}>
      {/* Platform Concrete Base */}
      <mesh position={[0, platHeight / 2, 0]}>
        <boxGeometry args={[platLength, platHeight, platWidth]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Safety Yellow Edge Lines */}
      <mesh position={[0, platHeight + 0.01, -platWidth / 2 + 0.15]}>
        <planeGeometry args={[platLength, 0.2]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>
      <mesh position={[0, platHeight + 0.01, platWidth / 2 - 0.15]}>
        <planeGeometry args={[platLength, 0.2]} />
        <meshBasicMaterial color="#facc15" />
      </mesh>

      {/* Platform Canopy Roof */}
      <group position={[0, 4.2, 0]}>
        <mesh rotation={[0, 0, 0]}>
          <boxGeometry args={[platLength * 0.75, 0.15, platWidth * 1.15]} />
          <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Canopy Support Pillars */}
        {[-10, -4, 4, 10].map((x) => (
          <mesh key={x} position={[x, -2, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 4.2]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Platform Signboard */}
      <group position={[0, 3.5, 0]}>
        <mesh>
          <boxGeometry args={[2.5, 0.9, 0.15]} />
          <meshStandardMaterial
            color={isArrival ? "#065f46" : isDeparture ? "#78350f" : "#090d16"}
          />
        </mesh>
        <Text
          position={[0, 0, 0.09]}
          fontSize={0.45}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {`PLATFORM ${platformNumber}`}
        </Text>
      </group>

      {/* Selection Glow Marker */}
      {(isArrival || isDeparture) && (
        <group position={[0, platHeight + 0.05, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.5, 1.8, 32]} />
            <meshBasicMaterial color={highlightColor} side={THREE.DoubleSide} />
          </mesh>
          <pointLight color={highlightColor} intensity={2} distance={6} />
        </group>
      )}
    </group>
  );
};

// Tracks between platforms
const TrackMesh: React.FC<{ z: number }> = ({ z }) => {
  const trackLength = 40;
  const railGauge = 1.676; // Indian Railways Broad Gauge

  return (
    <group position={[0, 0.05, z]}>
      {/* Stone Ballast Bed */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[trackLength, 0.15, 2.8]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.95} />
      </mesh>

      {/* Wooden Sleepers */}
      {Array.from({ length: 45 }).map((_, i) => {
        const x = -19 + i * 0.86;
        return (
          <mesh key={i} position={[x, 0.18, 0]}>
            <boxGeometry args={[0.3, 0.12, 2.5]} />
            <meshStandardMaterial color="#2d1e18" roughness={0.8} />
          </mesh>
        );
      })}

      {/* Dual Steel Rails */}
      <mesh position={[0, 0.28, -railGauge / 2]}>
        <boxGeometry args={[trackLength, 0.15, 0.08]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.28, railGauge / 2]}>
        <boxGeometry args={[trackLength, 0.15, 0.08]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
};

// Stationed Train Model
const TrainModel: React.FC<{ z: number; color?: string }> = ({
  z,
  color = "#dc2626",
}) => {
  return (
    <group position={[-2, 1.5, z]}>
      {/* Locomotive / Coach Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[16, 2.4, 2.4]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Train Windows Strip */}
      <mesh position={[0, 0.3, 1.21]}>
        <planeGeometry args={[14, 0.6]} />
        <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.3, -1.21]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[14, 0.6]} />
        <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.6} />
      </mesh>
      {/* Locomotive Headlight */}
      <mesh position={[8.02, -0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.35, 16]} />
        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={3} />
      </mesh>
      <pointLight position={[8.5, 0, 0]} color="#fef08a" intensity={4} distance={10} />
    </group>
  );
};

// Elevated Foot Overbridge (FOB) Spanning Platforms
const FootOverbridge: React.FC = () => {
  const fHeight = 6.2;
  const bridgeZSpan = 26; // Spanning from Platform 1 to Platform 4
  const bridgeWidth = 3.5;

  return (
    <group position={[0, 0, 0]}>
      {/* Main Overhead Walkway Deck */}
      <mesh position={[0, fHeight, 0]}>
        <boxGeometry args={[bridgeWidth, 0.4, bridgeZSpan]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* FOB Enclosure / Roof */}
      <mesh position={[0, fHeight + 2.4, 0]}>
        <boxGeometry args={[bridgeWidth * 1.1, 0.2, bridgeZSpan]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>

      {/* FOB Glass / Railing Panels */}
      <mesh position={[-bridgeWidth / 2, fHeight + 1.2, 0]}>
        <boxGeometry args={[0.1, 2.2, bridgeZSpan]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.3} />
      </mesh>
      <mesh position={[bridgeWidth / 2, fHeight + 1.2, 0]}>
        <boxGeometry args={[0.1, 2.2, bridgeZSpan]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.3} />
      </mesh>

      {/* Overhead Bridge Lighting */}
      {[-8, 0, 8].map((z) => (
        <pointLight key={z} position={[0, fHeight + 2, z]} color="#ffffff" intensity={1.5} distance={7} />
      ))}

      {/* Heavy Steel Support Columns reaching ground */}
      {[-10.5, -3.5, 3.5, 10.5].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh position={[-1.4, fHeight / 2, 0]}>
            <cylinderGeometry args={[0.18, 0.22, fHeight]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
          <mesh position={[1.4, fHeight / 2, 0]}>
            <cylinderGeometry args={[0.18, 0.22, fHeight]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>

          {/* Staircase leading from Platform up to FOB */}
          <mesh position={[0, fHeight / 2, 0.9]} rotation={[0.55, 0, 0]}>
            <boxGeometry args={[2.0, 0.25, 7.0]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const Station3DScene: React.FC<Station3DSceneProps> = ({
  arrivalPlatform,
  departurePlatform,
}) => {
  const arrZ = getPlatformZ(arrivalPlatform);
  const depZ = getPlatformZ(departurePlatform);

  // Path points for pedestrian transfer:
  // 1. Arrival Platform ground -> 2. FOB stairs bottom -> 3. FOB bridge top ->
  // 4. FOB traverse across to departure platform -> 5. FOB stairs down -> 6. Departure Platform
  const pathPoints = useMemo(() => {
    return [
      new THREE.Vector3(-4, 0.9, arrZ),
      new THREE.Vector3(-0.5, 0.9, arrZ),
      new THREE.Vector3(0, 3.5, arrZ + (arrZ < depZ ? 2 : -2)),
      new THREE.Vector3(0, 6.4, arrZ),
      new THREE.Vector3(0, 6.4, depZ),
      new THREE.Vector3(0, 3.5, depZ + (depZ < arrZ ? 2 : -2)),
      new THREE.Vector3(0.5, 0.9, depZ),
      new THREE.Vector3(4, 0.9, depZ),
    ];
  }, [arrZ, depZ]);

  return (
    <Canvas
      camera={{ position: [18, 22, 28], fov: 42 }}
      className="w-full h-full rounded-2xl bg-[#070b14]"
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[20, 30, 20]} intensity={1.5} castShadow />
      <directionalLight position={[-20, 20, -10]} intensity={0.6} />

      {/* OrbitControls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={8}
        maxDistance={60}
      />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#050811" roughness={0.9} />
      </mesh>

      {/* Platforms 1, 2, 3, 4 */}
      <PlatformMesh
        platformNumber={1}
        z={-10.5}
        isArrival={arrivalPlatform === 1}
        isDeparture={departurePlatform === 1}
      />
      <PlatformMesh
        platformNumber={2}
        z={-3.5}
        isArrival={arrivalPlatform === 2}
        isDeparture={departurePlatform === 2}
      />
      <PlatformMesh
        platformNumber={3}
        z={3.5}
        isArrival={arrivalPlatform === 3}
        isDeparture={departurePlatform === 3}
      />
      <PlatformMesh
        platformNumber={4}
        z={10.5}
        isArrival={arrivalPlatform === 4}
        isDeparture={departurePlatform === 4}
      />

      {/* Tracks between Platforms */}
      <TrackMesh z={-7} />
      <TrackMesh z={0} />
      <TrackMesh z={7} />

      {/* Stationed Trains */}
      <TrainModel z={-7} color="#0284c7" /> {/* Blue Shatabdi / Express */}
      <TrainModel z={7} color="#dc2626" />  {/* Red Rajdhani / Tejas */}

      {/* Foot Overbridge (FOB) Structure */}
      <FootOverbridge />

      {/* Glowing Neon Polyline for Pedestrian Transfer */}
      <Line
        points={pathPoints}
        color="#f59e0b"
        lineWidth={5}
        dashed={false}
      />

      {/* Animated Passenger Beacon moving across the bridge */}
      <AnimatedBeacon pathPoints={pathPoints} />
    </Canvas>
  );
};
