import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { PostFX } from "./PostFX";
import { prefersReducedMotion } from "@/lib/utils";

/**
 * AI Court 3D tribunal: Prosecutor (malicious), Defender (benign), Judge (verdict),
 * with the alert "evidence" centered and energy lines pulsing during the debate.
 */
function Node({
  position,
  color,
  label,
  flare = 0,
}: {
  position: [number, number, number];
  color: string;
  label: string;
  flare?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const reduced = prefersReducedMotion();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const pulse = reduced ? 1 : 1 + Math.sin(t * 2 + position[0]) * 0.08 + flare * 0.2;
    ref.current.scale.setScalar(pulse);
  });
  return (
    <group position={position}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5 + flare}
          roughness={0.3}
          metalness={0.5}
          wireframe
        />
      </mesh>
      <Text
        position={[0, -1.15, 0]}
        fontSize={0.32}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

function Evidence() {
  const ref = useRef<THREE.Mesh>(null);
  const reduced = prefersReducedMotion();
  useFrame((_, delta) => {
    if (ref.current && !reduced) {
      ref.current.rotation.y += delta * 0.6;
      ref.current.rotation.x += delta * 0.2;
    }
  });
  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.55, 0]} />
      <meshStandardMaterial
        color="#F59E0B"
        emissive="#F59E0B"
        emissiveIntensity={1.8}
        roughness={0.2}
        metalness={0.7}
      />
    </mesh>
  );
}

function EnergyLine({
  from,
  to,
  color,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const reduced = prefersReducedMotion();
  const { mid, length, quat } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = new THREE.Vector3().subVectors(b, a);
    const length = dir.length();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    return { mid, length, quat };
  }, [from, to]);
  useFrame((state) => {
    if (ref.current && !reduced) {
      const m = ref.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.25 + Math.abs(Math.sin(state.clock.elapsedTime * 3)) * 0.5;
    }
  });
  return (
    <mesh ref={ref} position={mid} quaternion={quat}>
      <cylinderGeometry args={[0.02, 0.02, length, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} />
    </mesh>
  );
}

function Scene() {
  const prosecutor: [number, number, number] = [-3, 0.5, 0];
  const defender: [number, number, number] = [3, 0.5, 0];
  const judge: [number, number, number] = [0, 2.4, -0.5];
  const evidence: [number, number, number] = [0, 0, 0];

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 3, 4]} intensity={2} color="#ffffff" />
      <group position={evidence}>
        <Evidence />
      </group>
      <Node position={prosecutor} color="#EF4444" label="PROSECUTOR" />
      <Node position={defender} color="#3B82F6" label="DEFENDER" />
      <Node position={judge} color="#8B5CF6" label="JUDGE" flare={0.6} />
      <EnergyLine from={evidence} to={prosecutor} color="#EF4444" />
      <EnergyLine from={evidence} to={defender} color="#3B82F6" />
      <EnergyLine from={prosecutor} to={judge} color="#EF4444" />
      <EnergyLine from={defender} to={judge} color="#3B82F6" />
      <PostFX />
    </>
  );
}

export function Tribunal() {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 8.5], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Scene />
    </Canvas>
  );
}
