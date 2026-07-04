/* ============================================================================
   silhouettes.js — Vector product renderers.

   No static product photos. Each product is drawn as a resolution-independent
   SVG that reacts to the selected body colour, so the live preview stays crisp
   at any zoom and can later be swapped for a Three.js mesh without touching the
   editor. Returns an SVG string sized to a unit 1000×1000 viewBox.
   ========================================================================== */
(function (root) {
  "use strict";

  // Choose a legible line colour against the body colour.
  function stroke(hex) {
    const c = hex.replace("#", "");
    const r = parseInt(c.substr(0, 2), 16),
      g = parseInt(c.substr(2, 2), 16),
      b = parseInt(c.substr(4, 2), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.22)";
  }
  function shade(hex, amt) {
    const c = hex.replace("#", "");
    let r = parseInt(c.substr(0, 2), 16),
      g = parseInt(c.substr(2, 2), 16),
      b = parseInt(c.substr(4, 2), 16);
    r = Math.max(0, Math.min(255, r + amt));
    g = Math.max(0, Math.min(255, g + amt));
    b = Math.max(0, Math.min(255, b + amt));
    return `rgb(${r},${g},${b})`;
  }

  const S = 1000;
  const wrap = (inner) =>
    `<svg viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg" role="img">${inner}</svg>`;

  const renderers = {
    mug(hex) {
      const s = stroke(hex), hi = shade(hex, 26), lo = shade(hex, -22);
      return wrap(`
        <defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${lo}"/><stop offset="0.2" stop-color="${hex}"/>
          <stop offset="0.8" stop-color="${hi}"/><stop offset="1" stop-color="${lo}"/>
        </linearGradient></defs>
        <path d="M260 320 h360 a24 24 0 0 1 24 24 v300 a90 90 0 0 1 -90 90 H326 a90 90 0 0 1 -90 -90 V344 a24 24 0 0 1 24 -24 Z" fill="url(#mg)" stroke="${s}" stroke-width="3"/>
        <path d="M644 380 a120 110 0 0 1 0 220" fill="none" stroke="${hex}" stroke-width="46"/>
        <path d="M644 380 a120 110 0 0 1 0 220" fill="none" stroke="${s}" stroke-width="4"/>
        <ellipse cx="440" cy="330" rx="200" ry="34" fill="${lo}" stroke="${s}" stroke-width="3"/>
        <ellipse cx="440" cy="326" rx="176" ry="24" fill="${shade(hex,-40)}"/>
      `);
    },
    tshirt(hex) {
      const s = stroke(hex);
      return wrap(`
        <path d="M370 210 q70 60 130 60 q60 0 130 -60 l120 60 l70 150 l-110 70 l-40 -50 v320 q0 30 -30 30 H360 q-30 0 -30 -30 V440 l-40 50 l-110 -70 l70 -150 Z"
          fill="${hex}" stroke="${s}" stroke-width="4"/>
        <path d="M370 210 q70 90 140 90 q70 0 120 -90" fill="none" stroke="${s}" stroke-width="4"/>`);
    },
    hoodie(hex) {
      const s = stroke(hex), lo = shade(hex, -18);
      return wrap(`
        <path d="M360 250 q80 -40 280 0 l130 70 l70 160 l-120 66 v300 q0 30 -30 30 H340 q-30 0 -30 -30 V546 l-120 -66 l70 -160 Z"
          fill="${hex}" stroke="${s}" stroke-width="4"/>
        <path d="M360 250 q140 120 280 0 q20 80 -140 120 q-160 -40 -140 -120 Z" fill="${lo}" stroke="${s}" stroke-width="3"/>
        <path d="M470 300 v250 M530 300 v250" stroke="${s}" stroke-width="4"/>
        <rect x="380" y="620" width="240" height="120" rx="16" fill="none" stroke="${s}" stroke-width="4"/>`);
    },
    hat(hex) {
      const s = stroke(hex), lo = shade(hex, -20);
      return wrap(`
        <path d="M250 560 q0 -230 250 -230 q250 0 250 230 q-250 -70 -500 0 Z" fill="${hex}" stroke="${s}" stroke-width="4"/>
        <path d="M245 560 q255 -70 510 0 q40 12 40 44 q0 40 -60 40 q-235 -60 -470 0 q-60 0 -60 -40 q0 -32 40 -44 Z" fill="${lo}" stroke="${s}" stroke-width="4"/>
        <path d="M500 330 v220" stroke="${s}" stroke-width="3"/>`);
    },
    tumbler(hex) {
      const s = stroke(hex), hi = shade(hex, 28), lo = shade(hex, -24);
      return wrap(`
        <defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="${lo}"/><stop offset="0.5" stop-color="${hi}"/><stop offset="1" stop-color="${lo}"/></linearGradient></defs>
        <path d="M360 260 h280 l-20 480 a40 40 0 0 1 -40 36 H420 a40 40 0 0 1 -40 -36 Z" fill="url(#tg)" stroke="${s}" stroke-width="3"/>
        <rect x="352" y="212" width="296" height="60" rx="18" fill="${shade(hex,-10)}" stroke="${s}" stroke-width="3"/>
        <rect x="372" y="176" width="256" height="44" rx="16" fill="${lo}" stroke="${s}" stroke-width="3"/>`);
    },
    notebook(hex) {
      const s = stroke(hex), lo = shade(hex, -22);
      return wrap(`
        <rect x="300" y="180" width="400" height="640" rx="20" fill="${lo}"/>
        <rect x="316" y="180" width="384" height="640" rx="18" fill="${hex}" stroke="${s}" stroke-width="3"/>
        <rect x="316" y="180" width="46" height="640" fill="${shade(hex,-14)}"/>
        <line x1="640" y1="180" x2="640" y2="820" stroke="${s}" stroke-width="4"/>`);
    },
    giftbox(hex) {
      const s = stroke(hex), lo = shade(hex, -22), hi = shade(hex, 18);
      return wrap(`
        <rect x="280" y="420" width="440" height="340" rx="12" fill="${hex}" stroke="${s}" stroke-width="3"/>
        <rect x="255" y="330" width="490" height="130" rx="12" fill="${hi}" stroke="${s}" stroke-width="3"/>
        <rect x="470" y="330" width="60" height="430" fill="${lo}"/>
        <path d="M500 330 q-80 -110 -150 -70 q-30 40 30 70 Z M500 330 q80 -110 150 -70 q30 40 -30 70 Z" fill="${lo}" stroke="${s}" stroke-width="3"/>`);
    },
    tote(hex) {
      const s = stroke(hex);
      return wrap(`
        <path d="M320 360 h360 l30 420 a20 20 0 0 1 -20 22 H310 a20 20 0 0 1 -20 -22 Z" fill="${hex}" stroke="${s}" stroke-width="4"/>
        <path d="M390 360 v-40 a110 110 0 0 1 220 0 v40" fill="none" stroke="${s}" stroke-width="14"/>`);
    },
    phonecase(hex) {
      const s = stroke(hex), lo = shade(hex, -18);
      return wrap(`
        <rect x="350" y="150" width="300" height="700" rx="60" fill="${hex}" stroke="${s}" stroke-width="4"/>
        <rect x="372" y="190" width="150" height="120" rx="30" fill="${lo}" stroke="${s}" stroke-width="3"/>
        <circle cx="410" cy="240" r="26" fill="${shade(hex,-40)}"/><circle cx="484" cy="240" r="26" fill="${shade(hex,-40)}"/>
        <circle cx="447" cy="290" r="20" fill="${shade(hex,-30)}"/>`);
    },
    canvas(hex) {
      const s = stroke(hex), lo = shade(hex, -30);
      return wrap(`
        <rect x="200" y="200" width="600" height="600" rx="6" fill="#fbfbfd" stroke="${lo}" stroke-width="26"/>
        <rect x="200" y="200" width="600" height="600" rx="6" fill="none" stroke="${hex}" stroke-width="20"/>
        <rect x="222" y="222" width="556" height="556" fill="#ffffff" stroke="${s}" stroke-width="2"/>`);
    },
  };

  root.Dynamic = root.Dynamic || {};
  root.Dynamic.renderSilhouette = function (productId, hex) {
    const fn = renderers[productId] || renderers.mug;
    return fn(hex);
  };
})(window);
