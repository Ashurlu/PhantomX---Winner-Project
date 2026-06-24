import { useEffect, useState } from "react";

/* ---------- Rotating hero word ---------- */
const WORDS = ["automate.", "investigate.", "adjudicate.", "validate.", "defend.", "hunt."];

export function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % WORDS.length), 2400);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ display: "inline-block", verticalAlign: "bottom", overflow: "hidden" }}>
      {/* key change remounts the span -> text updates instantly + CSS slide-in replays */}
      <span key={i} className="rf-word-anim" style={{ display: "inline-block", color: "var(--sage)" }}>
        {WORDS[i]}
      </span>
    </span>
  );
}

/* ---------- Flowing "X" light background (recreates the PhantomX mark in light) ---------- */
export function HeroXBackground() {
  // Two crossing ribbons, each rendered as a few offset strokes for a light-ribbon feel.
  const ribbonA = "M120,70 C520,250 660,340 730,395 C800,450 950,540 1330,720";
  const ribbonB = "M1330,70 C930,250 800,340 730,395 C660,450 520,540 120,720";

  const offsets = [-26, -12, 0, 12, 26];

  return (
    <svg
      viewBox="0 0 1440 760"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="xa" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b2a6b" />
          <stop offset="0.45" stopColor="#3b8fd1" />
          <stop offset="0.75" stopColor="#7c5cff" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="xb" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="0.4" stopColor="#5b6ee0" />
          <stop offset="0.78" stopColor="#9333ea" />
          <stop offset="1" stopColor="#1b2a6b" />
        </linearGradient>
        <radialGradient id="bloom" cx="0.82" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#cdd2dd" stopOpacity="0.5" />
          <stop offset="1" stopColor="#cdd2dd" stopOpacity="0" />
        </radialGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="big" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>

      {/* base */}
      <rect width="1440" height="760" fill="#07080e" />
      <ellipse cx="1180" cy="380" rx="540" ry="420" fill="url(#bloom)" />

      {/* wide soft glow ribbons */}
      <g filter="url(#big)" opacity="0.55" fill="none" strokeLinecap="round">
        <path d={ribbonA} stroke="url(#xa)" strokeWidth="22" />
        <path d={ribbonB} stroke="url(#xb)" strokeWidth="22" />
      </g>

      {/* mid ribbons (multiple offset strokes) */}
      <g filter="url(#soft)" fill="none" strokeLinecap="round">
        {offsets.map((o) => (
          <path key={`a${o}`} d={ribbonA} stroke="url(#xa)" strokeWidth="2.4" opacity={0.5 - Math.abs(o) / 120} transform={`translate(0 ${o})`} />
        ))}
        {offsets.map((o) => (
          <path key={`b${o}`} d={ribbonB} stroke="url(#xb)" strokeWidth="2.4" opacity={0.5 - Math.abs(o) / 120} transform={`translate(0 ${o})`} />
        ))}
      </g>

      {/* bright cores */}
      <g fill="none" strokeLinecap="round" opacity="0.9">
        <path d={ribbonA} stroke="#aee7ff" strokeWidth="1.3" opacity="0.7" />
        <path d={ribbonB} stroke="#d6c7ff" strokeWidth="1.3" opacity="0.7" />
      </g>

      {/* bokeh particles */}
      <g fill="#bfe6ff">
        {[[420, 470, 3], [360, 520, 2], [300, 300, 2.4], [980, 250, 2], [1030, 470, 3], [560, 150, 1.8], [700, 600, 2.2]].map(([x, y, r], k) => (
          <circle key={k} cx={x} cy={y} r={r} opacity={0.5} filter="url(#soft)" />
        ))}
      </g>
    </svg>
  );
}
