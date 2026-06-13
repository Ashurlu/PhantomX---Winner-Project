import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { prefersReducedMotion } from "@/lib/utils";

/** Shared bloom post-processing. Disabled under reduced-motion for perf. */
export function PostFX() {
  if (prefersReducedMotion()) return null;
  return (
    <EffectComposer>
      <Bloom
        intensity={0.9}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.7}
        mipmapBlur
      />
    </EffectComposer>
  );
}
