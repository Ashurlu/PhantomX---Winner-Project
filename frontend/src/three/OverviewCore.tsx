import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PostFX } from "./PostFX";
import { prefersReducedMotion } from "@/lib/utils";

/**
 * Overview centerpiece: particle "rivers" of data sources stream into a pulsing
 * core (alerts), which emits incident orbs branching to Resolved / Open.
 */
function ParticleRivers({ count = 1400 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const reduced = prefersReducedMotion();

  const { positions, speeds, radii, angles } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const radii = new Float32Array(count);
    const angles = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 6;
      const a = Math.random() * Math.PI * 2;
      radii[i] = r;
      angles[i] = a;
      speeds[i] = 0.4 + Math.random() * 0.8;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    return { positions, speeds, radii, angles };
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current || reduced) return;
    const pos = ref.current.geometry.attributes.position
      .array as Float32Array;
    for (let i = 0; i < count; i++) {
      radii[i] -= speeds[i] * delta;
      if (radii[i] < 0.3) {
        radii[i] = 4 + Math.random() * 6;
        angles[i] = Math.random() * Math.PI * 2;
      }
      angles[i] += delta * 0.25;
      pos[i * 3] = Math.cos(angles[i]) * radii[i];
      pos[i * 3 + 2] = Math.sin(angles[i]) * radii[i];
      pos[i * 3 + 1] *= 0.995;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y += delta * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#22D3EE"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function Core() {
  const ref = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const s = 1 + Math.sin(t * 2) * 0.06;
    if (ref.current) ref.current.scale.setScalar(s);
    if (glow.current) glow.current.scale.setScalar(s * 1.5);
  });
  return (
    <group>
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.4, 2]} />
        <meshStandardMaterial
          color="#8B5CF6"
          emissive="#8B5CF6"
          emissiveIntensity={1.4}
          roughness={0.2}
          metalness={0.6}
          wireframe
        />
      </mesh>
      <mesh ref={glow}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial
          color="#8B5CF6"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function IncidentOrbs() {
  const group = useRef<THREE.Group>(null);
  const reduced = prefersReducedMotion();
  const orbs = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        angle: (i / 10) * Math.PI * 2,
        radius: 3 + (i % 3),
        resolved: i % 3 !== 0,
        speed: 0.2 + (i % 4) * 0.05,
      })),
    []
  );
  useFrame((state) => {
    if (!group.current || reduced) return;
    group.current.children.forEach((child, i) => {
      const o = orbs[i];
      const t = state.clock.elapsedTime * o.speed + o.angle;
      child.position.set(Math.cos(t) * o.radius, Math.sin(t * 1.3) * 1.2, Math.sin(t) * o.radius);
    });
  });
  return (
    <group ref={group}>
      {orbs.map((o, i) => (
        <mesh key={i} position={[Math.cos(o.angle) * o.radius, 0, Math.sin(o.angle) * o.radius]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial
            color={o.resolved ? "#10B981" : "#F97316"}
            emissive={o.resolved ? "#10B981" : "#F97316"}
            emissiveIntensity={1.6}
          />
        </mesh>
      ))}
    </group>
  );
}

export function OverviewCore() {
  return (
    <Canvas
      camera={{ position: [0, 2.5, 11], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#8B5CF6" />
      <Core />
      <ParticleRivers />
      <IncidentOrbs />
      <PostFX />
    </Canvas>
  );
}
