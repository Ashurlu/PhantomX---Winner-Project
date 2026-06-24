import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PostFX } from "./PostFX";
import { prefersReducedMotion } from "@/lib/utils";

/**
 * Overview centerpiece — a directed telemetry pipeline (replaces the old orbit):
 *   source nodes ──▶ convergence field ──▶ pulsing core ──▶ branch streams
 *                                                            (green resolved / orange open)
 */

const SOURCE_COUNT = 8;

/** Glowing source nodes arranged on an outer ring; gentle vertical bob. */
function SourceNodes() {
  const group = useRef<THREE.Group>(null);
  const reduced = prefersReducedMotion();
  const nodes = useMemo(
    () =>
      Array.from({ length: SOURCE_COUNT }, (_, i) => {
        const a = (i / SOURCE_COUNT) * Math.PI * 2;
        return { a, r: 8.5, phase: i * 0.7 };
      }),
    []
  );
  useFrame((state) => {
    if (!group.current || reduced) return;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      const n = nodes[i];
      child.position.y = Math.sin(t * 0.8 + n.phase) * 0.5;
      const s = 1 + Math.sin(t * 1.6 + n.phase) * 0.18;
      child.scale.setScalar(s);
    });
  });
  return (
    <group ref={group}>
      {nodes.map((n, i) => (
        <mesh key={i} position={[Math.cos(n.a) * n.r, 0, Math.sin(n.a) * n.r]}>
          <icosahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={2} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/** Particles streaming inward from the source ring toward the core. */
function ConvergenceField({ count = 1700 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const reduced = prefersReducedMotion();

  const { positions, speeds, radii, angles, tilt } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const radii = new Float32Array(count);
    const angles = new Float32Array(count);
    const tilt = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 2 + Math.random() * 7;
      const a = Math.random() * Math.PI * 2;
      radii[i] = r;
      angles[i] = a;
      speeds[i] = 0.5 + Math.random() * 1.1;
      tilt[i] = (Math.random() - 0.5) * 2.4;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = tilt[i] * (r / 9);
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    return { positions, speeds, radii, angles, tilt };
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current || reduced) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      radii[i] -= speeds[i] * delta;
      if (radii[i] < 0.3) {
        radii[i] = 8 + Math.random() * 1.5; // respawn at the source ring
        angles[i] = Math.random() * Math.PI * 2;
        tilt[i] = (Math.random() - 0.5) * 2.4;
      }
      angles[i] += delta * 0.18;
      pos[i * 3] = Math.cos(angles[i]) * radii[i];
      pos[i * 3 + 1] = tilt[i] * (radii[i] / 9);
      pos[i * 3 + 2] = Math.sin(angles[i]) * radii[i];
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y += delta * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.055} color="#22D3EE" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

/** Layered, pulsing alert core. */
function Core() {
  const shell = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const reduced = prefersReducedMotion();
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const s = 1 + Math.sin(t * 2) * 0.07;
    if (inner.current) inner.current.scale.setScalar(s * 0.75);
    if (glow.current) glow.current.scale.setScalar(s * 1.7);
    if (shell.current && !reduced) {
      shell.current.rotation.y += delta * 0.25;
      shell.current.rotation.x -= delta * 0.1;
    }
  });
  return (
    <group>
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial color="#a78bfa" emissive="#8B5CF6" emissiveIntensity={1.2} roughness={0.2} metalness={0.6} wireframe />
      </mesh>
      <mesh ref={inner}>
        <icosahedronGeometry args={[1.4, 3]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={2.2} roughness={0.1} metalness={0.4} />
      </mesh>
      <mesh ref={glow}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.1} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/** A stream of incident particles emitted from the core in one direction, fading out. */
function BranchStream({ dir, color, count = 240 }: { dir: [number, number, number]; color: string; count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const reduced = prefersReducedMotion();

  const { positions, vel, life } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const life = new Float32Array(count);
    const base = new THREE.Vector3(...dir).normalize();
    for (let i = 0; i < count; i++) {
      life[i] = Math.random();
      const spread = 0.55;
      vel[i * 3] = base.x + (Math.random() - 0.5) * spread;
      vel[i * 3 + 1] = base.y + (Math.random() - 0.5) * spread;
      vel[i * 3 + 2] = base.z + (Math.random() - 0.5) * spread;
    }
    return { positions, vel, life };
  }, [count, dir]);

  useFrame((_, delta) => {
    if (!ref.current || reduced) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    const speed = 3.2;
    for (let i = 0; i < count; i++) {
      life[i] -= delta * 0.6;
      if (life[i] <= 0) {
        life[i] = 1;
        pos[i * 3] = 0;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = 0;
      } else {
        pos[i * 3] += vel[i * 3] * delta * speed;
        pos[i * 3 + 1] += vel[i * 3 + 1] * delta * speed;
        pos[i * 3 + 2] += vel[i * 3 + 2] * delta * speed;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.12} color={color} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

export function OverviewCore() {
  return (
    <Canvas camera={{ position: [0, 2.5, 12], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 0]} intensity={2.4} color="#8B5CF6" />
      <SourceNodes />
      <ConvergenceField />
      <Core />
      {/* incidents branch out: resolved (green) and open (orange) */}
      <BranchStream dir={[-1.1, 0.7, 0.3]} color="#10B981" />
      <BranchStream dir={[1.1, 0.7, -0.3]} color="#F97316" />
      <PostFX />
    </Canvas>
  );
}
