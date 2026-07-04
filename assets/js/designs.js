/* ============================================================================
   designs.js — Template library + AI artwork generator.

   AI generation runs locally and procedurally so the live demo works with no
   backend or API keys: a prompt is hashed into a deterministic, themed vector
   composition. In production, `generateAI` is the single seam to swap for a
   real image model — return an image URL / SVG and the editor inserts it
   identically. See docs/BACKEND_CONTRACT.md ("AI Design").
   ========================================================================== */
(function (root) {
  "use strict";

  /* ---------------- Ready-made templates (inserted as SVG) ---------------- */
  const templates = [
    {
      id: "monogram",
      name: "Monogram",
      svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="86" fill="none" stroke="#1d1d1f" stroke-width="4"/>
        <text x="100" y="128" font-family="Georgia,serif" font-size="90" text-anchor="middle" fill="#1d1d1f">A</text>
      </svg>`,
    },
    {
      id: "badge",
      name: "Est. Badge",
      svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="90" fill="#1d1d1f"/>
        <circle cx="100" cy="100" r="78" fill="none" stroke="#fff" stroke-width="3"/>
        <text x="100" y="92" font-family="Helvetica,sans-serif" font-size="26" font-weight="700" text-anchor="middle" fill="#fff">GOOD</text>
        <text x="100" y="120" font-family="Helvetica,sans-serif" font-size="26" font-weight="700" text-anchor="middle" fill="#fff">VIBES</text>
        <text x="100" y="150" font-family="Helvetica,sans-serif" font-size="12" letter-spacing="3" text-anchor="middle" fill="#fff">EST 2025</text>
      </svg>`,
    },
    {
      id: "wave",
      name: "Wave",
      svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 80 Q25 40 50 80 T100 80 T150 80 T200 80" fill="none" stroke="#0071e3" stroke-width="6" stroke-linecap="round"/>
        <path d="M0 96 Q25 56 50 96 T100 96 T150 96 T200 96" fill="none" stroke="#1d1d1f" stroke-width="4" stroke-linecap="round"/>
      </svg>`,
    },
    {
      id: "heart",
      name: "Heart",
      svg: `<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 160 C40 110 20 70 40 45 C60 20 95 30 100 55 C105 30 140 20 160 45 C180 70 160 110 100 160 Z" fill="#d70015"/>
      </svg>`,
    },
    {
      id: "arch",
      name: "Sun Arch",
      svg: `<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 140 A60 60 0 0 1 160 140 Z" fill="#e8a13a"/>
        <line x1="30" y1="140" x2="170" y2="140" stroke="#1d1d1f" stroke-width="5"/>
        <text x="100" y="130" font-family="Georgia,serif" font-size="22" text-anchor="middle" fill="#1d1d1f">SUNCHILD</text>
      </svg>`,
    },
    {
      id: "leaf",
      name: "Botanical",
      svg: `<svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M80 190 V40" stroke="#2e4034" stroke-width="4"/>
        <path d="M80 70 q40 -20 44 -50 q-40 4 -44 34 Z" fill="#3f6b4a"/>
        <path d="M80 100 q-40 -20 -44 -50 q40 4 44 34 Z" fill="#3f6b4a"/>
        <path d="M80 130 q40 -20 44 -50 q-40 4 -44 34 Z" fill="#3f6b4a"/>
      </svg>`,
    },
  ];

  /* ---------------- Procedural AI artwork ---------------- */
  const PALETTES = [
    ["#0b3d2e", "#3f6b4a", "#e8d9b5", "#c0392b"],
    ["#1b2a4a", "#3a6ea5", "#c9d6df", "#f0a500"],
    ["#2d1b2e", "#7d3c6a", "#e8a5c0", "#f5d491"],
    ["#1d1d1f", "#6e6e73", "#b8860b", "#f5f5f7"],
    ["#132a13", "#4f772d", "#90a955", "#ecf39e"],
  ];

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function rng(seed) {
    let s = seed || 1;
    return () => {
      s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  // Keyword → motif hints so generated art loosely reflects the prompt.
  const MOTIFS = {
    mountain: "mountain",
    peak: "mountain",
    pine: "tree",
    tree: "tree",
    forest: "tree",
    wave: "wave",
    ocean: "wave",
    sea: "wave",
    sun: "sun",
    sunset: "sun",
    moon: "moon",
    star: "stars",
    night: "stars",
    flower: "bloom",
    floral: "bloom",
    bloom: "bloom",
    heart: "heart",
    love: "heart",
  };

  function detectMotif(prompt) {
    const p = prompt.toLowerCase();
    for (const k in MOTIFS) if (p.includes(k)) return MOTIFS[k];
    return "abstract";
  }

  function drawMotif(motif, r, pal) {
    const [c1, c2, c3, c4] = pal;
    switch (motif) {
      case "mountain":
        return `
          <rect x="0" y="0" width="300" height="300" fill="${c3}"/>
          <circle cx="220" cy="80" r="42" fill="${c4}"/>
          <path d="M0 240 L80 120 L130 190 L190 90 L300 240 Z" fill="${c1}"/>
          <path d="M0 240 L80 120 L110 158 L150 120 L300 240 Z" fill="${c2}" opacity="0.85"/>
          <rect x="0" y="240" width="300" height="60" fill="${c1}"/>`;
      case "tree":
        return `
          <rect x="0" y="0" width="300" height="300" fill="${c3}"/>
          ${[70, 150, 230]
            .map(
              (x, i) =>
                `<path d="M${x} 250 L${x - 34} 250 L${x} ${120 + i * 8} L${x + 34} 250 Z" fill="${c1}"/>
                 <rect x="${x - 6}" y="240" width="12" height="26" fill="${c2}"/>`
            )
            .join("")}
          <rect x="0" y="266" width="300" height="34" fill="${c2}"/>`;
      case "wave":
        return `
          <rect x="0" y="0" width="300" height="300" fill="${c3}"/>
          ${[120, 160, 200]
            .map(
              (y, i) =>
                `<path d="M0 ${y} Q75 ${y - 40} 150 ${y} T300 ${y} V300 H0 Z" fill="${[c1, c2, c4][i]}" opacity="${0.9 - i * 0.15}"/>`
            )
            .join("")}`;
      case "sun":
        return `
          <rect x="0" y="0" width="300" height="300" fill="${c3}"/>
          <circle cx="150" cy="150" r="70" fill="${c4}"/>
          ${Array.from({ length: 12 })
            .map((_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return `<line x1="${150 + Math.cos(a) * 90}" y1="${150 + Math.sin(a) * 90}" x2="${150 + Math.cos(a) * 120}" y2="${150 + Math.sin(a) * 120}" stroke="${c1}" stroke-width="6" stroke-linecap="round"/>`;
            })
            .join("")}`;
      case "stars":
        return `
          <rect x="0" y="0" width="300" height="300" fill="${c1}"/>
          <circle cx="220" cy="80" r="40" fill="${c4}"/>
          ${Array.from({ length: 24 })
            .map(() => `<circle cx="${r() * 300}" cy="${r() * 300}" r="${1 + r() * 2.5}" fill="${c3}"/>`)
            .join("")}`;
      case "bloom":
        return `
          <rect x="0" y="0" width="300" height="300" fill="${c3}"/>
          ${Array.from({ length: 6 })
            .map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return `<ellipse cx="${150 + Math.cos(a) * 46}" cy="${150 + Math.sin(a) * 46}" rx="40" ry="20" fill="${c2}" transform="rotate(${(a * 180) / Math.PI} ${150 + Math.cos(a) * 46} ${150 + Math.sin(a) * 46})"/>`;
            })
            .join("")}
          <circle cx="150" cy="150" r="28" fill="${c4}"/>`;
      case "heart":
        return `
          <rect x="0" y="0" width="300" height="300" fill="${c3}"/>
          <path d="M150 230 C70 170 40 110 75 75 C110 40 148 60 150 95 C152 60 190 40 225 75 C260 110 230 170 150 230 Z" fill="${c4}"/>`;
      default:
        return `
          <rect x="0" y="0" width="300" height="300" fill="${c3}"/>
          ${Array.from({ length: 7 })
            .map(
              () =>
                `<circle cx="${r() * 300}" cy="${r() * 300}" r="${20 + r() * 60}" fill="${[c1, c2, c4][Math.floor(r() * 3)]}" opacity="0.55"/>`
            )
            .join("")}`;
    }
  }

  /**
   * Generate artwork from a prompt.
   * @returns {Promise<{ kind:'svg', svg:string, name:string, motif:string }>}
   */
  function generateAI(prompt) {
    return new Promise((resolve) => {
      const clean = (prompt || "abstract design").trim();
      const seed = hash(clean);
      const r = rng(seed);
      const pal = PALETTES[seed % PALETTES.length];
      const motif = detectMotif(clean);
      const art = drawMotif(motif, r, pal);
      const label = clean.split(/\s+/).slice(0, 3).join(" ");
      const svg = `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
        <defs><clipPath id="rc"><rect width="300" height="300" rx="20"/></clipPath></defs>
        <g clip-path="url(#rc)">${art}</g>
      </svg>`;
      // Simulate model latency for realistic UX; real API replaces this block.
      const delay = root.Dynamic._aiInstant ? 0 : 900;
      setTimeout(() => resolve({ kind: "svg", svg, name: `AI · ${label}`, motif }), delay);
    });
  }

  root.Dynamic = root.Dynamic || {};
  root.Dynamic.templates = templates;
  root.Dynamic.generateAI = generateAI;
})(window);
