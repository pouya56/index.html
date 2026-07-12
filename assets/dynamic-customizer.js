/* Dynamic Customizer — app JS (theme asset). Do not add Liquid here. */
(function(){
  try {
    var el = document.getElementById('dyn-config');
    if (el) {
      var cfg = JSON.parse(el.textContent || el.innerText || '{}');
      window.DYN_ASSETS = cfg.assets || {};
      window.DYN_SHOPIFY = cfg.shopify || {};
      window.DYN_SETTINGS = cfg.settings || {};
    } else { window.__dynCfgErr = 'dyn-config element not found'; }
  } catch (e) { window.__dynCfgErr = String(e); }
})();

function DYNasset(n){ return (window.DYN_ASSETS && window.DYN_ASSETS[n]) || n; }

(function (root) {
  "use strict";

  const SIZES_APPAREL = ["XS", "S", "M", "L", "XL", "2XL"];

  function makeMethod(id, method, finish, opts) {
    return Object.assign({
      id: id, name: "Product", tagline: "Custom Product", description: "Upload your design.",
      method: method, base: 2000, uploadMode: true, image: DYNasset("airpods-pro-3.png"),
      colors: [{ id: "default", name: "Default", hex: "#ffffff" }], sizes: null,
      areas: [{ id: "design", label: "Design", rect: { x: 0.3, y: 0.3, w: 0.4, h: 0.4 }, surcharge: 0 }],
      finishes: [{ id: "standard", name: finish, surcharge: 0 }], addons: [],
    }, opts || {});
  }
  const catalog = {
    uv: makeMethod("uv", "UV", "UV Print"),
    dtf: makeMethod("dtf", "DTF", "DTF Print", { photoOnly: true }),
    // Sublimation behaves exactly like DTF: upload-only, one design, click the image.
    sublimation: makeMethod("sublimation", "Sublimation", "Sublimation Print", { photoOnly: true }),
    engraving: makeMethod("engraving", "Engraving", "Engraving"),
  };

  root.Dynamic = root.Dynamic || {};
  root.Dynamic.catalog = catalog;
  root.Dynamic.getProduct = function (id) {
    return catalog[id] || catalog.uv;
  };
})(window);

(function (root) {
  "use strict";

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
    pen(hex) {
      const s = stroke(hex), lo = shade(hex, -22), hi = shade(hex, 24);
      return wrap(`
        <rect x="150" y="452" width="600" height="92" rx="46" fill="${hex}" stroke="${s}" stroke-width="3"/>
        <path d="M750 452 l150 46 l-150 46 Z" fill="${lo}" stroke="${s}" stroke-width="3"/>
        <rect x="170" y="452" width="70" height="92" rx="24" fill="${lo}"/>
        <rect x="280" y="474" width="360" height="48" rx="10" fill="${hi}" stroke="${s}" stroke-width="2"/>
      `);
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
  root.Dynamic.renderSilhouette = function (productId, hex, forceSvg) {
    const p = (root.Dynamic.getProduct && root.Dynamic.getProduct(productId)) || null;
    if (!forceSvg && p && p.image) {
      return (
        '<img src="' + p.image + '" alt="' + (p.name || "") +
        '" style="width:100%;height:100%;object-fit:contain;filter:none;">'
      );
    }
    const fn = renderers[productId] || renderers.mug;
    return fn(hex);
  };
})(window);

(function (root) {
  "use strict";

  const money = (cents) =>
    "$" + (cents / 100).toFixed(2).replace(/\.00$/, "");

  function compute(product, state) {
    const items = [];

    items.push({ label: product.name, amount: product.base, kind: "base" });

    const decorated = product.areas.filter(
      (a) => state.areas[a.id] && state.areas[a.id].objectCount > 0
    );
    decorated.forEach((area, i) => {
      if (i === 0) {
        items.push({ label: `${area.label} print`, amount: 0, kind: "free" });
      } else {
        items.push({
          label: `${area.label} print`,
          amount: area.surcharge,
          kind: "area",
        });
      }
    });

    const finish = (product.finishes || []).find((f) => f.id === state.finishId);
    if (finish && finish.surcharge > 0 && decorated.length > 0) {
      items.push({
        label: finish.name,
        amount: finish.surcharge,
        kind: "finish",
      });
    }

    (product.addons || []).forEach((addon) => {
      if (state.addons && state.addons.has(addon.id)) {
        items.push({ label: addon.name, amount: addon.surcharge, kind: "addon" });
      }
    });

    const subtotalUnit = items.reduce((s, it) => s + it.amount, 0);
    const qty = Math.max(1, state.quantity || 1);
    const total = subtotalUnit * qty;

    return {
      items,
      subtotalUnit,
      quantity: qty,
      total,
      currency: "USD",
      format: money,
      decoratedAreas: decorated.length,
    };
  }

  root.Dynamic = root.Dynamic || {};
  root.Dynamic.pricing = { compute, money };
})(window);

(function (root) {
  "use strict";

  function createStore(initial) {
    let state = initial;
    const subs = new Set();

    return {
      get: () => state,
      set(patch) {
        state = typeof patch === "function" ? patch(state) : { ...state, ...patch };
        subs.forEach((fn) => fn(state));
      },
      subscribe(fn) {
        subs.add(fn);
        return () => subs.delete(fn);
      },
    };
  }

  function initState(product) {
    const areas = {};
    product.areas.forEach((a) => {
      areas[a.id] = { json: null, objectCount: 0 };
    });
    return {
      productId: product.id,
      colorId: product.colors[0].id,
      sizeId: product.sizes ? product.sizes[Math.min(2, product.sizes.length - 1)] : null,
      quantity: 1,
      finishId: (product.finishes && product.finishes[0].id) || "standard",
      addons: new Set(),
      activeAreaId: product.areas[0].id,
      areas,
    };
  }

  root.Dynamic = root.Dynamic || {};
  root.Dynamic.createStore = createStore;
  root.Dynamic.initState = initState;
})(window);

(function (root) {
  "use strict";

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
      const delay = root.Dynamic._aiInstant ? 0 : 900;
      setTimeout(() => resolve({ kind: "svg", svg, name: `AI · ${label}`, motif }), delay);
    });
  }

  root.Dynamic = root.Dynamic || {};
  root.Dynamic.templates = templates;
  root.Dynamic.generateAI = generateAI;
})(window);

(function (root) {
  "use strict";

  const BASE = 560; // internal canvas resolution (square print stage)
  const HISTORY_LIMIT = 40;

  function createEditor(opts) {
    const { canvasEl, product } = opts;
    const on = opts.callbacks || {};
    if (typeof root.fabric === "undefined") {
      console.warn("[Dynamic] Fabric.js not loaded — editor disabled.");
      return null;
    }
    const fabric = root.fabric;

    const canvas = new fabric.Canvas(canvasEl, {
      width: BASE,
      height: BASE,
      backgroundColor: "transparent",
      preserveObjectStacking: true,
      selection: true,
      controlsAboveOverlay: true,
    });
    fabric.Object.prototype.cornerStyle = "circle";
    fabric.Object.prototype.cornerColor = "#0071e3";
    fabric.Object.prototype.cornerStrokeColor = "#fff";
    fabric.Object.prototype.borderColor = "#0071e3";
    fabric.Object.prototype.cornerSize = 11;
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.padding = 4;

    let zoom = 1;
    let activeAreaId = product.areas[0].id;
    let boundary = null;
    let guideV = null,
      guideH = null;
    const histories = {};
    product.areas.forEach((a) => (histories[a.id] = { stack: [], index: -1 }));
    let suspend = false; // pause history capture during programmatic loads

    function areaRect(areaId) {
      const a = product.areas.find((x) => x.id === areaId) || product.areas[0];
      return {
        left: a.rect.x * BASE,
        top: a.rect.y * BASE,
        width: a.rect.w * BASE,
        height: a.rect.h * BASE,
      };
    }

    function applyBoundary(areaId) {
      const r = areaRect(areaId);
      if (boundary) canvas.remove(boundary);
      boundary = new fabric.Rect({
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        fill: "transparent",
        stroke: "rgba(0,113,227,0.55)",
        strokeDashArray: [6, 6],
        strokeWidth: 1.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        hoverCursor: "default",
      });
      canvas.add(boundary);
      canvas.sendToBack(boundary);
      canvas.clipPath = new fabric.Rect({
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        absolutePositioned: true,
      });
    }

    function serializeCanvas() {
      return JSON.stringify(
        canvas.toJSON(["selectable", "name", "dynamicKind"])
      );
    }
    function pushHistory() {
      if (suspend) return;
      const h = histories[activeAreaId];
      h.stack = h.stack.slice(0, h.index + 1);
      h.stack.push(serializeCanvas());
      if (h.stack.length > HISTORY_LIMIT) h.stack.shift();
      h.index = h.stack.length - 1;
      emitChange();
    }
    function restore(json, cb) {
      suspend = true;
      canvas.loadFromJSON(json, () => {
        applyBoundary(activeAreaId);
        canvas.renderAll();
        suspend = false;
        if (cb) cb();
        emitChange();
      });
    }
    function undo() {
      const h = histories[activeAreaId];
      if (h.index <= 0) return;
      h.index--;
      restore(h.stack[h.index]);
    }
    function redo() {
      const h = histories[activeAreaId];
      if (h.index >= h.stack.length - 1) return;
      h.index++;
      restore(h.stack[h.index]);
    }
    function canUndo() {
      return histories[activeAreaId].index > 0;
    }
    function canRedo() {
      const h = histories[activeAreaId];
      return h.index < h.stack.length - 1;
    }

    function designObjects() {
      return canvas.getObjects().filter((o) => !o.excludeFromExport);
    }
    function emitChange() {
      if (on.onChange)
        on.onChange({
          areaId: activeAreaId,
          objectCount: designObjects().length,
          canUndo: canUndo(),
          canRedo: canRedo(),
        });
    }

    const SNAP = 8;
    function clearGuides() {
      if (guideV) {
        canvas.remove(guideV);
        guideV = null;
      }
      if (guideH) {
        canvas.remove(guideH);
        guideH = null;
      }
    }
    function showGuide(vertical) {
      const cx = BASE / 2,
        cy = BASE / 2;
      const common = {
        stroke: "#ff375f",
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      };
      if (vertical && !guideV) {
        guideV = new fabric.Line([cx, 0, cx, BASE], common);
        canvas.add(guideV);
      }
      if (!vertical && !guideH) {
        guideH = new fabric.Line([0, cy, BASE, cy], common);
        canvas.add(guideH);
      }
    }

    canvas.on("object:moving", (e) => {
      const o = e.target;
      const c = o.getCenterPoint();
      const cx = BASE / 2,
        cy = BASE / 2;
      clearGuides();
      if (Math.abs(c.x - cx) < SNAP) {
        o.setPositionByOrigin(new fabric.Point(cx, c.y), "center", "center");
        showGuide(true);
      }
      if (Math.abs(c.y - cy) < SNAP) {
        o.setPositionByOrigin(new fabric.Point(o.getCenterPoint().x, cy), "center", "center");
        showGuide(false);
      }
    });
    canvas.on("mouse:up", clearGuides);
    canvas.on("object:modified", () => {
      clearGuides();
      pushHistory();
    });
    canvas.on("selection:created", () => on.onSelection && on.onSelection(active()));
    canvas.on("selection:updated", () => on.onSelection && on.onSelection(active()));
    canvas.on("selection:cleared", () => on.onSelection && on.onSelection(null));

    function active() {
      return canvas.getActiveObject() || null;
    }

    function centreOf(areaId) {
      const r = areaRect(areaId);
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    function addText(text, style) {
      const c = centreOf(activeAreaId);
      const t = new fabric.Textbox(text || "Your text", {
        left: c.x,
        top: c.y,
        originX: "center",
        originY: "center",
        fontFamily: (style && style.fontFamily) || "SF Pro Display, -apple-system, sans-serif",
        fontSize: (style && style.fontSize) || 46,
        fill: (style && style.fill) || "#1d1d1f",
        textAlign: "center",
        width: 260,
        dynamicKind: "text",
        name: (text || "Text").slice(0, 24),
      });
      canvas.add(t).setActiveObject(t);
      canvas.renderAll();
      pushHistory();
      return t;
    }

    function addImageFromURL(url, meta) {
      return new Promise((resolve) => {
        fabric.Image.fromURL(
          url,
          (img) => {
            if (!img) return resolve(null);
            const r = areaRect(activeAreaId);
            const scale = Math.min(
              (r.width * 0.8) / img.width,
              (r.height * 0.8) / img.height,
              1
            );
            const c = centreOf(activeAreaId);
            img.set({
              left: c.x,
              top: c.y,
              originX: "center",
              originY: "center",
              scaleX: scale,
              scaleY: scale,
              dynamicKind: (meta && meta.kind) || "image",
              name: (meta && meta.name) || "Image",
            });
            canvas.add(img).setActiveObject(img);
            canvas.renderAll();
            pushHistory();
            resolve(img);
          },
          { crossOrigin: "anonymous" }
        );
      });
    }

    function addSVG(svgString, name) {
      return new Promise((resolve) => {
        fabric.loadSVGFromString(svgString, (objects, options) => {
          const grp = fabric.util.groupSVGElements(objects, options);
          const r = areaRect(activeAreaId);
          const scale = Math.min(
            (r.width * 0.8) / (grp.width || 100),
            (r.height * 0.8) / (grp.height || 100),
            2
          );
          const c = centreOf(activeAreaId);
          grp.set({
            left: c.x,
            top: c.y,
            originX: "center",
            originY: "center",
            scaleX: scale,
            scaleY: scale,
            dynamicKind: "svg",
            name: name || "Vector",
          });
          canvas.add(grp).setActiveObject(grp);
          canvas.renderAll();
          pushHistory();
          resolve(grp);
        });
      });
    }

    function duplicate() {
      const o = active();
      if (!o) return;
      o.clone((cl) => {
        cl.set({ left: o.left + 24, top: o.top + 24 });
        cl.dynamicKind = o.dynamicKind;
        cl.name = o.name;
        canvas.add(cl).setActiveObject(cl);
        canvas.renderAll();
        pushHistory();
      });
    }
    function removeSelected() {
      const objs = canvas.getActiveObjects();
      if (!objs.length) return;
      objs.forEach((o) => canvas.remove(o));
      canvas.discardActiveObject();
      canvas.renderAll();
      pushHistory();
    }
    function bringForward() {
      const o = active();
      if (o) {
        canvas.bringForward(o);
        pushHistory();
      }
    }
    function sendBackward() {
      const o = active();
      if (o) {
        canvas.sendBackwards(o);
        if (boundary) canvas.sendToBack(boundary);
        pushHistory();
      }
    }
    function rotateSelected(deg) {
      const o = active();
      if (!o) return;
      o.rotate((o.angle || 0) + deg);
      canvas.renderAll();
      pushHistory();
    }

    function align(dir) {
      const o = active();
      if (!o) return;
      const r = areaRect(activeAreaId);
      o.setCoords();
      const b = o.getBoundingRect(true, true);
      let dx = 0,
        dy = 0;
      if (dir === "left") dx = r.left - b.left;
      if (dir === "right") dx = r.left + r.width - (b.left + b.width);
      if (dir === "top") dy = r.top - b.top;
      if (dir === "bottom") dy = r.top + r.height - (b.top + b.height);
      if (dir === "centerH") dx = r.left + r.width / 2 - (b.left + b.width / 2);
      if (dir === "centerV") dy = r.top + r.height / 2 - (b.top + b.height / 2);
      o.left += dx;
      o.top += dy;
      o.setCoords();
      canvas.renderAll();
      pushHistory();
    }
    function snapCenter() {
      const o = active();
      if (!o) return;
      const c = centreOf(activeAreaId);
      o.setPositionByOrigin(new fabric.Point(c.x, c.y), "center", "center");
      o.setCoords();
      canvas.renderAll();
      pushHistory();
    }

    function styleSelected(patch) {
      const o = active();
      if (!o) return;
      Object.keys(patch).forEach((k) => o.set(k, patch[k]));
      if (patch.text && o.name !== undefined) o.name = String(patch.text).slice(0, 24);
      o.setCoords();
      canvas.renderAll();
      pushHistory();
    }

    function applyZoom(z) {
      zoom = Math.max(0.5, Math.min(2, z));
      canvas.setZoom(zoom);
      canvas.setDimensions({ width: BASE * zoom, height: BASE * zoom });
      if (on.onZoom) on.onZoom(zoom);
      canvas.renderAll();
    }
    const zoomIn = () => applyZoom(zoom + 0.15);
    const zoomOut = () => applyZoom(zoom - 0.15);
    const zoomReset = () => applyZoom(1);

    function saveActiveArea() {
      const store = opts.store;
      const s = store.get();
      s.areas[activeAreaId] = {
        json: serializeCanvas(),
        objectCount: designObjects().length,
      };
    }
    function setActiveArea(areaId) {
      if (areaId === activeAreaId) return;
      saveActiveArea();
      activeAreaId = areaId;
      const s = opts.store.get();
      const saved = s.areas[areaId] && s.areas[areaId].json;
      canvas.discardActiveObject();
      if (saved) {
        restore(saved);
      } else {
        suspend = true;
        canvas.clear();
        applyBoundary(areaId);
        suspend = false;
        const h = histories[areaId];
        if (h.index < 0) {
          h.stack = [serializeCanvas()];
          h.index = 0;
        }
        canvas.renderAll();
        emitChange();
      }
      if (on.onSelection) on.onSelection(null);
    }

    function exportAreaPNG(areaId, mult) {
      const target = areaId || activeAreaId;
      if (target !== activeAreaId) saveActiveArea();
      const r = areaRect(target);
      const hadBoundary = boundary && boundary.visible;
      if (boundary) boundary.visible = false;
      canvas.renderAll();
      const data = canvas.toDataURL({
        format: "png",
        left: r.left * zoom,
        top: r.top * zoom,
        width: r.width * zoom,
        height: r.height * zoom,
        multiplier: (mult || 2) / zoom,
      });
      if (boundary) boundary.visible = hadBoundary !== false;
      canvas.renderAll();
      return data;
    }
    function exportCompositePNG() {
      const hadBoundary = boundary && boundary.visible;
      if (boundary) boundary.visible = false;
      canvas.discardActiveObject();
      canvas.renderAll();
      const data = canvas.toDataURL({ format: "png", multiplier: 2 / zoom });
      if (boundary) boundary.visible = hadBoundary !== false;
      canvas.renderAll();
      return data;
    }

    function serializeAllAreas() {
      saveActiveArea();
      const s = opts.store.get();
      const out = {};
      Object.keys(s.areas).forEach((k) => {
        out[k] = {
          objectCount: s.areas[k].objectCount || 0,
          json: s.areas[k].json ? JSON.parse(s.areas[k].json) : null,
        };
      });
      return out;
    }

    function keyHandler(e) {
      const tag = (e.target && e.target.tagName) || "";
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (active()) {
          e.preventDefault();
          removeSelected();
        }
      } else if (e.key === "Escape") {
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    }

    applyBoundary(activeAreaId);
    histories[activeAreaId].stack = [serializeCanvas()];
    histories[activeAreaId].index = 0;
    canvas.renderAll();
    emitChange();

    return {
      canvas,
      addText,
      addImageFromURL,
      addSVG,
      duplicate,
      removeSelected,
      bringForward,
      sendBackward,
      rotateSelected,
      align,
      snapCenter,
      styleSelected,
      undo,
      redo,
      canUndo,
      canRedo,
      zoomIn,
      zoomOut,
      zoomReset,
      getZoom: () => zoom,
      setActiveArea,
      getActiveAreaId: () => activeAreaId,
      getActive: active,
      listObjects: () => designObjects(),
      selectObject: (o) => {
        canvas.setActiveObject(o);
        canvas.renderAll();
      },
      exportAreaPNG,
      exportCompositePNG,
      serializeAllAreas,
      keyHandler,
      dispose: () => {
        document.removeEventListener("keydown", keyHandler);
        canvas.dispose();
      },
    };
  }

  root.Dynamic = root.Dynamic || {};
  root.Dynamic.createEditor = createEditor;
})(window);

(function (root) {
  "use strict";

  function buildDesignBundle(ctx) {
    const { product, state, editor, pricing } = ctx;
    const design = editor ? editor.serializeAllAreas() : {};
    const decorated = Object.keys(design).filter(
      (k) => design[k] && design[k].objectCount > 0
    );
    return {
      schemaVersion: "1.0",
      productId: product.id,
      productName: product.name,
      options: {
        color: colorName(product, state.colorId),
        size: state.sizeId || null,
        finish: finishName(product, state.finishId),
        addons: Array.from(state.addons || []),
        quantity: state.quantity,
      },
      printAreas: decorated,
      design, // per-area Fabric JSON (text, fonts, colours, transforms, artwork)
      pricing: {
        currency: pricing.currency,
        unitCents: pricing.subtotalUnit,
        totalCents: pricing.total,
        breakdown: pricing.items.map((i) => ({ label: i.label, cents: i.amount })),
      },
      previewImage: ctx.previewDataUrl || null,
      areaPreviews: ctx.areaPreviews || {},
      uploadedAssets: ctx.uploadedAssets || [],
    };
  }

  function buildCartRequest(ctx, refs) {
    const { product, state, variantId } = ctx;
    const bundle = buildDesignBundle(ctx);
    const properties = {
      _dynamic_design_id: (refs && refs.designId) || "",
      _dynamic_schema: bundle.schemaVersion,
      Color: bundle.options.color,
      Finish: bundle.options.finish,
      "Print Areas": bundle.printAreas.join(", ") || "None",
      _design_json_url: (refs && refs.designJsonUrl) || "",
      _preview_url: (refs && refs.previewUrl) || "",
    };
    if (bundle.options.size) properties.Size = bundle.options.size;
    if (bundle.options.addons.length)
      properties["Add-ons"] = bundle.options.addons.join(", ");

    return {
      items: [
        {
          id: variantId || null, // Shopify variant id, resolved from color/size
          quantity: state.quantity,
          properties,
        },
      ],
      _bundle: bundle,
    };
  }

  function colorName(product, id) {
    const c = product.colors.find((x) => x.id === id);
    return c ? c.name : id;
  }
  function finishName(product, id) {
    const f = (product.finishes || []).find((x) => x.id === id);
    return f ? f.name : id;
  }

  async function addToCart(cartRequest) {
    const inShopify =
      typeof root.Shopify !== "undefined" ||
      /myshopify\.com$/.test(root.location.hostname);
    if (!inShopify) {
      return { ok: false, simulated: true, request: cartRequest };
    }
    const res = await fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ items: cartRequest.items }),
    });
    const data = await res.json();
    return { ok: res.ok, simulated: false, response: data };
  }

  root.Dynamic = root.Dynamic || {};
  root.Dynamic.cart = { buildDesignBundle, buildCartRequest, addToCart };
})(window);

(function (root) {
  "use strict";
  const D = root.Dynamic;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  const FONTS = [
    { name: "SF Pro", stack: "'SF Pro Display', -apple-system, sans-serif" },
    { name: "Serif", stack: "Georgia, 'Times New Roman', serif" },
    { name: "Rounded", stack: "'SF Pro Rounded', 'Trebuchet MS', sans-serif" },
    { name: "Mono", stack: "'SF Mono', ui-monospace, monospace" },
    { name: "Condensed", stack: "'Arial Narrow', sans-serif" },
    { name: "Script", stack: "'Snell Roundhand', 'Segoe Script', cursive" },
  ];
  const TEXT_COLORS = [
    "#1d1d1f", "#ffffff", "#0071e3", "#d70015", "#1a7f37", "#b8860b",
    "#7d3c6a", "#3a6ea5", "#e8a13a", "#ff375f", "#5c5a3a", "#c0392b",
    "#25324a", "#b7c4b0", "#e8cdc9", "#000000",
  ];
  const EMOJI = ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","🙂","😉","😍","🥰","😘","😜","😛","🤩","🥳","😎","😏","😢","😭","😠","😡","😱","😴","🤤","🤗","🤔","🙄","😬","😮","🤯","🥺","😷","🤒","🤢","🤮","🤠","😈","👻","💀","🤖","👽","👾","🎃","🐶","🐱","🦄","🐻","🐼","🐸","🐵","🐷","🐰","🦊","❤","🧡","💛","💚","💙","💜","🖤","💕","💖","⭐","✨","🔥","⚡","👍","👎","👊","✌","🤟","👌","🙌","🙏","💪"];

  var _kbdFont = "";
  function kbdHtml() {
    return '<div class="ios-kb" id="kbdPop"><div class="ios-keys" id="iosKeys"></div></div>';
  }
  const FONT_SVG = "<svg viewBox=\"0 0 24 24\" class=\"ios-globe-ic\" aria-hidden=\"true\"><path d=\"M5 20 12 4l7 16\"/><path d=\"M8.2 14h7.6\"/></svg>";
  function wireKbd(input, sync, onFont) {
    const kb = document.getElementById("iosKeys");
    if (!kb || !input) return;
    let layer = "abc"; // abc | num | sym | emo
    let caps = true;
    let fontIndex = 0;
    const R = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
    const NUM = ["1234567890", "-/:;()$&@”", ".,?!'"];
    const SYM = ["[]{}#%^*+=", "_\\|~<>€£¥•", ".,?!'"];
    function key(ch, cls, label) {
      return '<button type="button" class="ios-key ' + (cls || "") + '" data-k="' + ch + '">' + (label != null ? label : ch) + '</button>';
    }
    function act(a, cls, label) {
      return '<button type="button" class="ios-key ' + (cls || "") + '" data-act="' + a + '">' + label + '</button>';
    }
    function bottom() {
      return '<div class="ios-row ios-row-b">' +
        act(layer === "abc" ? "num" : "abc", "ios-fn ios-mode", layer === "abc" ? "123" : "ABC") +
        act("font", "ios-fn ios-globe", FONT_SVG) +
        act("emo", "ios-fn ios-emokey", "☺") +
        key(" ", "ios-space", "space") +
        act("ret", "ios-fn ios-return", "return") +
      '</div>';
    }
    function cycleFont() {
      fontIndex = (fontIndex + 1) % UPLOAD_FONTS.length;
      const f = UPLOAD_FONTS[fontIndex];
      setKbdFont(f.stack);
      if (onFont) onFont(f);
      toast(f.name + " font");
    }
    const EMO_PER_PAGE = 32; // 8 columns x 4 rows, Apple-style pages
    function wirePager() {
      const pager = document.getElementById("emoPager");
      if (!pager) return;
      const prev = kb.querySelector(".emo-prev"), next = kb.querySelector(".emo-next");
      const ind = kb.querySelector(".emo-page-ind");
      const n = pager.querySelectorAll(".emo-page").length || 1; // reliable regardless of layout
      function pageNow() { return pager.clientWidth ? Math.round(pager.scrollLeft / pager.clientWidth) : 0; }
      function update() {
        const i = Math.min(pageNow(), n - 1);
        if (prev) prev.disabled = i <= 0;
        if (next) next.disabled = i >= n - 1;
        if (ind) ind.textContent = (i + 1) + " / " + n;
      }
      function go(d) {
        const i = Math.max(0, Math.min(n - 1, pageNow() + d));
        pager.scrollTo({ left: i * pager.clientWidth, behavior: "smooth" });
        setTimeout(update, 60);
      }
      if (prev) prev.onclick = function () { go(-1); };
      if (next) next.onclick = function () { go(1); };
      pager.addEventListener("scroll", update, { passive: true });
      update();
    }
    function render() {
      const pageCount = Math.ceil(EMOJI.length / EMO_PER_PAGE) || 1;
      let pages = "";
      for (let pg = 0; pg < pageCount; pg++) {
        const cells = EMOJI.slice(pg * EMO_PER_PAGE, (pg + 1) * EMO_PER_PAGE)
          .map(function (e) { return key(e, "ios-emokey", e); }).join("");
        pages += '<div class="emo-page">' + cells + '</div>';
      }
      kb.innerHTML =
        '<div class="emo-pager" id="emoPager">' + pages + '</div>' +
        '<div class="emo-foot">' +
          '<button type="button" class="emo-nav emo-prev" aria-label="Previous page">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button>' +
          '<span class="emo-page-ind" aria-hidden="true">1 / ' + pageCount + '</span>' +
          '<button type="button" class="emo-nav emo-next" aria-label="Next page">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>' +
        '</div>';
      wirePager();
    }
    function grow() {
      if (input.tagName === "TEXTAREA") { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 132) + "px"; }
    }
    const MAX_LINES = 1; // one line per text box — add another box with +
    const LINE_UNITS = 20; // ~20 letters OR ~12 emoji per line
    function uUnit(ch) { return /\p{Extended_Pictographic}/u.test(ch) ? (LINE_UNITS / 12) : 1; }
    function reflow(text) {
      const lines = [], paras = String(text).split("\n");
      for (let pi = 0; pi < paras.length && lines.length < MAX_LINES; pi++) {
        const chars = Array.from(paras[pi]);
        let cur = [], units = 0;
        for (let i = 0; i < chars.length; i++) {
          const u = uUnit(chars[i]);
          if (units + u > LINE_UNITS && cur.length) {
            lines.push(cur.join("")); cur = []; units = 0;
            if (lines.length >= MAX_LINES) { cur = null; break; }
          }
          if (cur) { cur.push(chars[i]); units += u; }
        }
        if (cur && cur.length && lines.length < MAX_LINES) lines.push(cur.join(""));
      }
      return lines.slice(0, MAX_LINES).join("\n");
    }
    function insert(ch) {
      const next = reflow(input.value + ch);
      if (next === input.value) { toast(MAX_LINES === 1 ? "One line per box — add another with +" : "Up to " + MAX_LINES + " lines"); return; }
      input.value = next;
      sync(); grow();
      try { input.focus(); const n = input.value.length; input.setSelectionRange(n, n); } catch (e) {}
    }
    function del() {
      const arr = Array.from(input.value);
      const last = arr.pop();
      if (last === "\uFE0F" || last === "\uFE0E") arr.pop();
      input.value = reflow(arr.join(""));
      sync(); grow();
    }
    kb.onclick = function (e) {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.k != null) insert(b.dataset.k); // emoji tap; arrows handled in wirePager
    };
    kb.addEventListener("mousedown", function (e) { if (e.target.closest(".ios-emokey")) e.preventDefault(); });
    render();
    input.addEventListener("input", function () {
      let v = input.value.replace(/\p{L}/gu, function (ch) { return /\p{Script=Latin}/u.test(ch) ? ch : ""; });
      v = reflow(v); // 20 letters / 12 emoji per line, up to 3 lines
      if (v !== input.value) input.value = v;
      sync(); grow();
    });
    grow();

    const kbEl = document.getElementById("kbdPop");
    const arrow = document.getElementById("kbdArrow");
    const scroller = kbEl && kbEl.closest(".modal-root");
    function bringIntoView() {
      if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
      else if (kbEl) kbEl.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    function setKb(open) {
      if (kbEl) kbEl.classList.toggle("show", open);
      if (arrow) { arrow.classList.toggle("open", open); arrow.setAttribute("aria-expanded", String(open)); }
      if (open) { setTimeout(bringIntoView, 60); setTimeout(bringIntoView, 340); }
    }
    if (arrow) arrow.onclick = function () { setKb(!(kbEl && kbEl.classList.contains("show"))); };
  }
  function setKbdFont(stack) {
    _kbdFont = stack || "";
    const fld = document.getElementById("upText") || document.getElementById("engraveInput");
    if (fld) fld.style.fontFamily = "'DynEmoji', " + _kbdFont;
    const kb = document.getElementById("iosKeys");
    if (!kb) return;
    kb.querySelectorAll(".ios-key[data-k]").forEach(function (k) {
      if (!k.classList.contains("ios-emokey") && !k.classList.contains("ios-space")) k.style.fontFamily = _kbdFont;
    });
  }

  const icon = (p) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const ICONS = {
    undo: icon('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-1"/>'),
    redo: icon('<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h1"/>'),
    dup: icon('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
    del: icon('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/>'),
    rotate: icon('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v4h-4"/>'),
    center: icon('<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>'),
    alignL: icon('<path d="M4 4v16"/><rect x="7" y="8" width="10" height="3"/><rect x="7" y="14" width="6" height="3"/>'),
    alignR: icon('<path d="M20 4v16"/><rect x="7" y="8" width="10" height="3"/><rect x="11" y="14" width="6" height="3"/>'),
    alignT: icon('<path d="M4 4h16"/><rect x="8" y="7" width="3" height="10"/><rect x="14" y="7" width="3" height="6"/>'),
    alignB: icon('<path d="M4 20h16"/><rect x="8" y="7" width="3" height="10"/><rect x="14" y="11" width="3" height="6"/>'),
    zoomIn: icon('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4M11 8v6M8 11h6"/>'),
    zoomOut: icon('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4M8 11h6"/>'),
    front: icon('<path d="M4 8l8-4 8 4-8 4-8-4Z"/><path d="M4 12l8 4 8-4"/>'),
    text: icon('<path d="M4 7V5h16v2M12 5v14M9 19h6"/>'),
    upload: icon('<path d="M12 15V4M8 8l4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
    photo: icon('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m3 17 5-4 4 3 3-2 6 5"/>'),
    ai: icon('<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z"/>'),
    tmpl: icon('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    layerText: icon('<path d="M4 7V5h16v2M12 5v14M9 19h6"/>'),
    layerImg: icon('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m3 17 5-4 4 3 3-2 6 5"/>'),
  };

  let product, store, editor, unsubStore;
  let currentPricing;
  const uploadedAssets = [];
  let editingLineKey = null; // set when re-opening a saved cart item to edit its design
  let editingGrp = null;     // the edited item's group token (links it to its back-fee line)
  const MAX_IMG = 3, MAX_TXT = 3;
  let sideLayers = { front: [], back: [] };
  let sideActive = { front: null, back: null };
  let currentSide = "front";
  let curVariantOpts = [];   // option values of the currently-selected variant (for per-variant back image)
  let _sidesResolve = null;  // (hasBack) => variant matching current options with the "sides" option forced; set by the variant picker
  let _giftVariantActive = false;  // true when gift wrapping rides on a product option/variant (so we skip the legacy fee line)
  let layers = sideLayers.front;   // alias to the current side's layer array
  let activeLayerId = null;
  let layerSeq = 0;
  const UPLOAD_FONTS = [
    { name: "Sans", stack: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif" },
  ];

  const GAL_EXTRAS = {
    airpods: [DYNasset("gal-3.png"), DYNasset("gal-1.png"), DYNasset("gal-5.png"), DYNasset("gal-4.png"), DYNasset("gal-2.png")],
  };
  let galIndex = 0;
  function galleryList() {
    return [product.image].concat(GAL_EXTRAS[product.id] || []);
  }
  function renderGallery() {
    const list = galleryList();
    if (galIndex >= list.length) galIndex = 0;
    const stage = $("#galleryStage");
    if (!stage) return;
    stage.innerHTML = "";
    const img = el("img");
    img.src = list[galIndex];
    img.alt = product.name;
    img.style.cssText = "width:100%;height:100%;object-fit:contain;cursor:zoom-in";
    img.onclick = () => openLightbox(list, galIndex);
    stage.appendChild(img);
    const th = $("#galleryThumbs");
    if (th) {
      th.innerHTML = list
        .map(
          (s, i) =>
            '<button class="gal-thumb' + (i === galIndex ? " sel" : "") +
            '" data-i="' + i + '" aria-label="View image ' + (i + 1) +
            '"><img src="' + s + '" alt=""></button>'
        )
        .join("");
      th.querySelectorAll(".gal-thumb").forEach((b) => {
        b.onclick = () => {
          galIndex = +b.dataset.i;
          renderGallery();
        };
      });
    }
  }
  function galMove(d) {
    const n = galleryList().length;
    galIndex = (galIndex + d + n) % n;
    renderGallery();
  }

  let lbList = [], lbIndex = 0, lbEl = null;
  function ensureLightbox() {
    if (lbEl) return lbEl;
    lbEl = el("div", "lightbox");
    lbEl.innerHTML =
      '<button class="lb-close" aria-label="Close">\u2715</button>' +
      '<button class="lb-arrow lb-prev" aria-label="Previous">\u2039</button>' +
      '<img class="lb-img" alt="">' +
      '<button class="lb-arrow lb-next" aria-label="Next">\u203a</button>';
    document.body.appendChild(lbEl);
    lbEl.querySelector(".lb-close").onclick = closeLightbox;
    lbEl.querySelector(".lb-prev").onclick = () => lbMove(-1);
    lbEl.querySelector(".lb-next").onclick = () => lbMove(1);
    lbEl.addEventListener("click", (e) => {
      if (e.target === lbEl) closeLightbox();
    });
    return lbEl;
  }
  function openLightbox(list, i) {
    lbList = list;
    lbIndex = i;
    const lb = ensureLightbox();
    lb.querySelector(".lb-img").src = lbList[lbIndex];
    lb.classList.add("open");
    document.body.classList.add("no-scroll");
  }
  function lbMove(d) {
    if (!lbList.length) return;
    const n = lbList.length;
    lbIndex = (lbIndex + d + n) % n;
    lbEl.querySelector(".lb-img").src = lbList[lbIndex];
  }
  function closeLightbox() {
    if (lbEl) {
      lbEl.classList.remove("open");
      document.body.classList.remove("no-scroll");
    }
  }

  function renderProductPage() {
    const _cv = (product.colors || []).find((c) => c.id === store.get().colorId);
    if (_cv && _cv.image) product.image = _cv.image;
    galIndex = 0;
    renderGallery();
    $("#pName").textContent = product.tagline;
    if (product._descHtml) $("#pDesc").innerHTML = product.description;
    else $("#pDesc").textContent = product.description;
    $("#pEyebrow").textContent = product.name;
    renderSwatches();
    renderSizes();
    updatePagePrice();
    renderShopifyVariants();
    updateCustomizeSummary();
  }

  function renderShopifyVariants() {
    const shop = window.DYN_SHOPIFY || {};
    const host = document.querySelector("#pColors");
    const modelGroup = host ? host.closest(".opt-group") : null;
    const sizeGroup = document.querySelector("#pSizeGroup");
    if (sizeGroup) sizeGroup.style.display = "none";
    if (!modelGroup) return;
    const variants = shop.variants || [];
    const options = (shop.options || []).filter((o) => !(o.values.length === 1 && o.values[0] === "Default Title"));
    if (variants.length <= 1 || !options.length) { modelGroup.style.display = "none"; return; }
    modelGroup.style.display = "";
    const madeToOrder = !!(window.DYN_SETTINGS && window.DYN_SETTINGS.madeToOrder);
    const firstAvail = variants.find((v) => v.available) || variants[0];
    const selected = (firstAvail.options || []).slice();

    // Single-line-item back charge: if the product has a "Print sides" option
    // (front-only vs front+back at a higher price), we drive it automatically
    // from whether the customer adds a back design — no separate fee line.
    const DS = window.DYN_SETTINGS || {};
    const sidesName = String(DS.sidesOption || "").trim().toLowerCase();
    let sidesIdx = -1, sidesFront = "", sidesBoth = "";
    if (sidesName) {
      sidesIdx = options.findIndex((o) => String(o.name || "").trim().toLowerCase() === sidesName);
    } else if (DS.enableBack) {
      // Back side is on but no option name was typed — auto-find a Print-sides option.
      const isSides = (nm) => { const n = String(nm || "").trim().toLowerCase(); return n === "print sides" || n === "print side" || n === "sides" || n === "side" || n.indexOf("print side") >= 0; };
      sidesIdx = options.findIndex((o) => isSides(o.name) && (o.values || []).length >= 2);
    }
    if (sidesIdx >= 0) {
      const vals = options[sidesIdx].values || [];
      const findVal = (want) => vals.find((v) => String(v).trim().toLowerCase() === String(want).trim().toLowerCase()) || "";
      sidesFront = findVal(DS.sidesFrontValue || "Front only");
      sidesBoth = findVal(DS.sidesBothValue || "Front + Back");
      // If the value names don't match, auto-detect by price: the cheapest
      // value is "front only", the priciest is the "front + back" upcharge.
      if (!sidesFront || !sidesBoth) {
        const cents = (str) => { const n = parseFloat(String(str).replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : Math.round(n * 100); };
        const minFor = (val) => { let m = Infinity; variants.forEach((vv) => { if ((vv.options || [])[sidesIdx] === val) { const c = cents(vv.price); if (c && c < m) m = c; } }); return m === Infinity ? 0 : m; };
        const priced = vals.map((v) => ({ v: v, p: minFor(v) })).filter((x) => x.p > 0).sort((a, b) => a.p - b.p);
        if (priced.length >= 2 && priced[0].p !== priced[priced.length - 1].p) {
          if (!sidesFront) sidesFront = priced[0].v;
          if (!sidesBoth) sidesBoth = priced[priced.length - 1].v;
        }
      }
      if (!sidesFront) sidesFront = vals[0] || "";
      if (!sidesBoth) sidesIdx = -1;           // can't map the upcharge value — fall back to the fee line
      else if (sidesFront) selected[sidesIdx] = sidesFront;   // start on the base (front-only) price
    }
    // Single-line-item gift wrapping: if the product has a "Gift wrapping" option
    // (e.g. No / Yes at a higher price), we hide it and drive it from the gift
    // toggle — so wrapping rides on the SAME line item, not a separate charge.
    const giftCfg = DS.gift || {};
    const giftName = String(giftCfg.wrapOption || "").trim().toLowerCase();
    let giftIdx = -1, giftNo = "", giftYes = "";
    if (giftName) {
      giftIdx = options.findIndex((o) => String(o.name || "").trim().toLowerCase() === giftName);
    } else if (giftCfg.enabled) {
      // No option name typed — auto-find a Gift-wrapping option (2+ values).
      const isGift = (nm) => { const n = String(nm || "").trim().toLowerCase(); return n === "gift wrapping" || n === "gift wrap" || n === "gift" || n === "wrapping" || n.indexOf("gift wrap") >= 0; };
      giftIdx = options.findIndex((o) => isGift(o.name) && (o.values || []).length >= 2);
    }
    if (giftIdx >= 0) {
      const gvals = options[giftIdx].values || [];
      const findG = (want) => gvals.find((v) => String(v).trim().toLowerCase() === String(want).trim().toLowerCase()) || "";
      giftYes = findG(giftCfg.wrappedValue || "Yes");
      giftNo = findG(giftCfg.unwrappedValue || "No");
      // If the value names don't match, auto-detect by price (priciest = wrapped).
      if (!giftYes || !giftNo) {
        const cents = (str) => { const n = parseFloat(String(str).replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : Math.round(n * 100); };
        const minFor = (val) => { let m = Infinity; variants.forEach((vv) => { if ((vv.options || [])[giftIdx] === val) { const c = cents(vv.price); if (c && c < m) m = c; } }); return m === Infinity ? 0 : m; };
        const priced = gvals.map((v) => ({ v: v, p: minFor(v) })).filter((x) => x.p > 0).sort((a, b) => a.p - b.p);
        if (priced.length >= 2 && priced[0].p !== priced[priced.length - 1].p) {
          if (!giftNo) giftNo = priced[0].v;
          if (!giftYes) giftYes = priced[priced.length - 1].v;
        }
      }
      if (!giftNo) giftNo = gvals.find((v) => v !== giftYes) || gvals[0] || "";
      if (!giftYes) giftIdx = -1;                 // no wrapped value — fall back to the legacy fee line
      else if (giftNo) selected[giftIdx] = giftNo; // start unwrapped (base price)
    }
    _giftVariantActive = giftIdx >= 0;
    // Resolver picks the variant matching the customer's colour/size with the
    // hidden Print-sides and Gift-wrapping options forced by their choices.
    _sidesResolve = (sidesIdx < 0 && giftIdx < 0) ? null : function (hasBack, giftOn) {
      const want = selected.slice();
      if (sidesIdx >= 0) want[sidesIdx] = hasBack ? sidesBoth : (sidesFront || want[sidesIdx]);
      if (giftIdx >= 0) want[giftIdx] = giftOn ? giftYes : (giftNo || want[giftIdx]);
      return variants.find((vv) => (vv.options || []).join("~~") === want.join("~~")) || null;
    };

    function valueInStock(oi, val) {
      return variants.some((vv) => vv.available && (vv.options || [])[oi] === val &&
        options.every((_, j) => j === oi || (vv.options || [])[j] === selected[j]));
    }
    function refreshAvail() {
      modelGroup.querySelectorAll(".pill, .swatch").forEach((b) => {
        const oi = parseInt(b.dataset.oi, 10);
        if (oi === sidesIdx || oi === giftIdx) return;
        const oos = !madeToOrder && !valueInStock(oi, b.dataset.val);
        b.classList.toggle("soldout", oos);
        b.title = oos ? b.dataset.val + " — Out of stock" : b.dataset.val;
      });
    }

    function resolve() {
      const v = variants.find((vv) => (vv.options || []).join("~~") === selected.join("~~"));
      if (v) {
        shop.variantId = v.id;
        curVariantOpts = v.options || [];   // track colour for per-variant back image
        const pr = document.querySelector("#pPrice"); if (pr && v.price) pr.textContent = v.price;
        const soldOut = !madeToOrder && !v.available;
        const orderable = !soldOut;
        const st = modelGroup.querySelector("#variantStatus");
        if (st) { st.hidden = !soldOut; st.textContent = soldOut ? "Out of stock" : ""; }
        const cta = document.querySelector("#customizeBtn"), add = document.querySelector("#pageAddCart");
        [cta, add].forEach((btn) => { if (btn) { btn.disabled = !orderable; btn.style.opacity = orderable ? "" : "0.5"; } });
        let img = v.image;
        if (!img) { const alt = variants.find((vv) => vv.image && (vv.options || [])[0] === (v.options || [])[0]); if (alt) img = alt.image; }
        if (img && img !== product.image) {
          product.image = img;
          galIndex = 0;
          renderGallery();
          if (modalOpen) {
            const ef = document.querySelector(".engrave-frame > img");
            if (ef) { const fi = sideImage(currentSide || "front"); if (fi) ef.src = fi; }
            const st = document.querySelector("#stageProduct img, .up-stage img");
            if (st) st.src = img;
          }
        }
      }
      return v;
    }

    function swatchFor(o, oi, val) {
      const sw = (o.swatches || []).find((s) => s.value === val) || {};
      if (sw.image) return { image: sw.image };
      if (sw.color) return { color: sw.color };
      const hex = COLOR_NAMES[String(val).toLowerCase().trim()];
      if (hex) return { color: hex };
      const v = variants.find((vv) => (vv.options || [])[oi] === val && vv.image);
      if (v) return { image: v.image };
      return null;
    }
    function colorKnown(o, val) {
      const sw = (o.swatches || []).find((s) => s.value === val) || {};
      return !!(sw.color || sw.image || COLOR_NAMES[String(val).toLowerCase().trim()]);
    }
    function isColorOption(o, oi) {
      if (/colou?r/i.test(o.name)) return true;
      return o.values.length > 1 && o.values.every((val) => colorKnown(o, val));
    }

    modelGroup.innerHTML = options.map((o, oi) => {
      if (oi === sidesIdx || oi === giftIdx) return "";   // auto-managed by the customizer — hidden from the picker
      const label = '<div class="opt-label"' + (oi ? ' style="margin-top:16px"' : '') + '>' + escapeHtml(o.name) +
        ' <span class="opt-val" data-oi="' + oi + '">' + escapeHtml(selected[oi] || "") + '</span></div>';
      if (isColorOption(o, oi)) {
        return label + '<div class="swatches" data-oi="' + oi + '">' +
          o.values.map((val) => {
            const s = swatchFor(o, oi, val) || {};
            const style = s.image
              ? 'background-image:url(' + s.image.replace(/"/g, "") + ');background-size:cover;background-position:center'
              : '--swatch:' + (s.color || "#ccc");
            return '<button class="swatch" data-oi="' + oi + '" data-val="' + escapeHtml(val) + '" title="' + escapeHtml(val) +
              '" aria-label="' + escapeHtml(val) + '" style="' + style + '" aria-pressed="' + (selected[oi] === val) + '"></button>';
          }).join("") +
        '</div>';
      }
      return label + '<div class="pills" data-oi="' + oi + '">' +
        o.values.map((val) => '<button class="pill" data-oi="' + oi + '" data-val="' + escapeHtml(val) + '" aria-pressed="' + (selected[oi] === val) + '">' + escapeHtml(val) + '</button>').join("") +
      '</div>';
    }).join("") + '<div class="variant-status" id="variantStatus" hidden></div>';

    modelGroup.querySelectorAll(".pill, .swatch").forEach((btn) => {
      btn.onclick = () => {
        const oi = parseInt(btn.dataset.oi, 10);
        selected[oi] = btn.dataset.val;
        modelGroup.querySelectorAll('[data-oi="' + oi + '"].pill, [data-oi="' + oi + '"].swatch').forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.val === selected[oi])));
        const valEl = modelGroup.querySelector('.opt-val[data-oi="' + oi + '"]'); if (valEl) valEl.textContent = selected[oi];
        resolve();
        refreshAvail();
      };
    });
    resolve();
    refreshAvail();
  }

  const COLOR_NAMES = {
    white: "#ffffff", black: "#111111", silver: "#c9ccce", gray: "#8e8e93", grey: "#8e8e93",
    "space gray": "#4b4e52", "space grey": "#4b4e52", graphite: "#3b3b3d", charcoal: "#36454f",
    red: "#e0233b", "product red": "#e0233b", crimson: "#b81d24", maroon: "#7b1e28",
    orange: "#f56300", coral: "#ff6f61", peach: "#ffc1a6", gold: "#f3d9a1", "rose gold": "#e8c3b0",
    yellow: "#ffcf1a", cream: "#f5efe0", beige: "#e4d5b7", ivory: "#fffff0", tan: "#d2b48c",
    green: "#1f9e46", "midnight green": "#1c3b34", olive: "#708238", mint: "#a8e6cf", teal: "#009999", sage: "#9caf88",
    blue: "#0a63c9", navy: "#1c2b4a", "sky blue": "#87c5f0", "sierra blue": "#a3c4dc", "pacific blue": "#1a5f8a", turquoise: "#40c4b4", cyan: "#22b8cf",
    purple: "#7b2fbe", violet: "#8f5bd6", lavender: "#c9a7eb", indigo: "#4b3b8f", plum: "#7a3b5d",
    pink: "#ff5c8a", "hot pink": "#ff2d78", magenta: "#d6249f", fuchsia: "#e84393", "rose": "#e8b0c0",
    brown: "#6b4a2b", chocolate: "#4b3320", coffee: "#5c4433", khaki: "#bdb290",
    midnight: "#1a1a2e", starlight: "#f0ead6", natural: "#e8ded0", clear: "#e8f0f2", transparent: "#e8f0f2",
  };

  function renderSwatches() {
    const host = $("#pColors");
    host.innerHTML = "";
    const cur = store.get().colorId;
    product.colors.forEach((c) => {
      const b = el("button", "swatch");
      b.style.setProperty("--swatch", c.hex);
      b.setAttribute("aria-label", c.name);
      b.setAttribute("aria-pressed", String(c.id === cur));
      b.onclick = () => {
        store.set({ colorId: c.id });
        renderProductPage();
        $("#colorName").textContent = c.name;
        if (modalOpen) $("#stageSilhouette").innerHTML = D.renderSilhouette(product.id, c.hex, true);
      };
      host.appendChild(b);
    });
    $("#colorName").textContent = product.colors.find((c) => c.id === cur).name;
  }

  function renderSizes() {
    const grp = $("#pSizeGroup");
    if (!product.sizes) {
      grp.style.display = "none";
      return;
    }
    grp.style.display = "";
    const host = $("#pSizes");
    host.innerHTML = "";
    const cur = store.get().sizeId;
    product.sizes.forEach((s) => {
      const b = el("button", "pill", s);
      b.setAttribute("aria-pressed", String(s === cur));
      b.onclick = () => {
        store.set({ sizeId: s });
        renderSizes();
      };
      host.appendChild(b);
    });
  }

  function updatePagePrice() {
    const p = D.pricing.compute(product, store.get());
    currentPricing = p;
    $("#pPrice").textContent = p.format(p.total);
    const note = (window.DYN_SETTINGS && window.DYN_SETTINGS.priceNote) || "";
    $("#pPriceNote").textContent = store.get().quantity > 1 ? `${p.format(p.subtotalUnit)} each` : note;
    applyVariantPrice();
  }

  // Reflect the Gift-wrapping and Print-sides upcharges in the page price.
  // If a priced "Gift wrapping" option/variant exists, use it (one line item);
  // otherwise add the display fee amount so the toggle still updates the price.
  function applyVariantPrice() {
    const pr = document.querySelector("#pPrice"); if (!pr) return;
    const giftCfg = (window.DYN_SETTINGS && window.DYN_SETTINGS.gift) || {};
    const giftEl = document.querySelector("#giftIsGift");
    const giftOn = !!(giftCfg.enabled && giftEl && giftEl.checked);
    const hasBack = (sideLayers.back || []).some((l) => (l.kind === "img" && l.url) || (l.kind === "text" && l.text));
    const cents = (s) => { const n = parseFloat(String(s).replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : Math.round(n * 100); };
    const fmt = (c, sample) => { const sym = (String(sample).match(/^[^\d.-]*/) || [""])[0] || "$"; return sym + (c / 100).toFixed(2).replace(/\.00$/, ""); };
    let base = (window.DYN_SHOPIFY || {}).priceMoney || pr.textContent;
    if (typeof _sidesResolve === "function" && _sidesResolve) {
      const vBase = _sidesResolve(hasBack, false);
      const vGift = _sidesResolve(hasBack, true);
      if (vBase && vBase.price) base = vBase.price;
      // Gift is a priced option → its variant already includes the fee.
      if (vBase && vGift && vBase.price !== vGift.price) { pr.textContent = (giftOn ? vGift : vBase).price; return; }
    }
    pr.textContent = base;
    // Legacy method: a separate fee variant is added at checkout, so show base + fee.
    const feeC = cents(giftCfg.wrapMoney);
    if (giftOn && feeC > 0 && giftCfg.wrapVariantId) pr.textContent = fmt(cents(base) + feeC, base);
  }

  // The gift-wrap fee field accepts a variant id, a .../variants/ID URL, or the
  // Gift Wrap product's handle / URL — we look up the variant id when needed.
  let _wrapIdCache;
  async function resolveWrapVariant(raw) {
    raw = String(raw || "").trim();
    if (!raw) return null;
    if (/^\d{4,}$/.test(raw)) return raw;
    const vm = raw.match(/variants?[\/=](\d{4,})/i); if (vm) return vm[1];
    if (_wrapIdCache !== undefined) return _wrapIdCache;
    let handle = raw;
    const hm = raw.match(/\/products\/([a-z0-9_-]+)/i); if (hm) handle = hm[1];
    handle = handle.replace(/^https?:\/\/[^\/]+\//i, "").split(/[?#]/)[0].replace(/\/+$/, "").split("/").pop().toLowerCase();
    try {
      const r = await fetch("/products/" + encodeURIComponent(handle) + ".js", { headers: { Accept: "application/json" } });
      if (!r.ok) { _wrapIdCache = null; return null; }
      const p = await r.json();
      const v = (p.variants || []).find((x) => x.available) || (p.variants || [])[0];
      _wrapIdCache = v ? String(v.id) : null;
      return _wrapIdCache;
    } catch (e) { _wrapIdCache = null; return null; }
  }

  function updateCustomizeSummary() {
    const el = $("#customizeSummary");
    if (!el) return;
    const areas = decoratedCount();
    el.textContent = areas ? `${areas} print area${areas > 1 ? "s" : ""} designed` : "Not customized yet";
  }

  function colorHex(id) {
    const c = product.colors.find((x) => x.id === id);
    return c ? c.hex : "#ffffff";
  }
  function decoratedCount() {
    const s = store.get();
    return Object.keys(s.areas).filter((k) => s.areas[k].objectCount > 0).length;
  }

  let modalOpen = false;

  async function uploadToCloudinary(fileOrBlob, filename) {
    const S = window.DYN_SHOPIFY || {};
    if (!S.cloudName || !S.uploadPreset || !fileOrBlob) return null;
    try {
      const fd = new FormData();
      fd.append("file", fileOrBlob, filename || "upload");
      fd.append("upload_preset", S.uploadPreset);
      const res = await fetch("https://api.cloudinary.com/v1_1/" + S.cloudName + "/auto/upload", { method: "POST", body: fd });
      if (!res.ok) { console.warn("[Dynamic] Cloudinary upload failed", res.status); return null; }
      const data = await res.json();
      return data.secure_url || data.url || null;
    } catch (e) { console.warn("[Dynamic] Cloudinary error", e); return null; }
  }
  function dataURLtoBlob(dataurl) {
    try {
      const arr = String(dataurl).split(","), mime = (arr[0].match(/:(.*?);/) || [])[1] || "image/png";
      const bstr = atob(arr[1]); let n = bstr.length; const u8 = new Uint8Array(n);
      while (n--) u8[n] = bstr.charCodeAt(n);
      return new Blob([u8], { type: mime });
    } catch (e) { return null; }
  }

  async function submitToShopify(properties, extraItems, files, variantOverride) {
    const S = window.DYN_SHOPIFY || {};
    const submitId = variantOverride || S.variantId;   // front+back variant when a back design is present
    const qty = Math.max(1, (store.get().quantity) || 1);
    const clean = {};
    Object.keys(properties || {}).forEach((k) => { if (properties[k]) clean[k] = properties[k]; });
    const extra = (extraItems || []).map((it) => {
      if (!it || it.id == null) return null;
      const m = String(it.id).match(/\d{4,}/);
      return m ? Object.assign({}, it, { id: m[0] }) : null;
    }).filter(Boolean);
    if (submitId) {
      try {
        let res;
        if (files && files.length) {
          // Multipart add — Shopify uploads the attached files and stores their
          // URLs on the line item (free hosting, no third-party service).
          const fd = new FormData();
          fd.append("id", String(submitId));
          fd.append("quantity", String(qty));
          Object.keys(clean).forEach((k) => fd.append("properties[" + k + "]", clean[k]));
          files.forEach((f) => {
            const blob = f.file || f.blob; if (!blob) return;
            fd.append("properties[" + f.name + "]", blob, f.filename || (f.file && f.file.name) || "file.png");
          });
          res = await fetch("/cart/add.js", { method: "POST", headers: { Accept: "application/json" }, body: fd });
        } else {
          res = await fetch("/cart/add.js", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ items: [{ id: submitId, quantity: qty, properties: clean }] }),
          });
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.warn("[Dynamic] /cart/add.js failed", err);
          toast(err.description || "Couldn't add to bag");
          return false;
        }
        for (const it of extra) {
          try {
            const fr = await fetch("/cart/add.js", {
              method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({ items: [it] }),
            });
            if (!fr.ok) {
              const fe = await fr.json().catch(() => ({}));
              console.warn("[Dynamic] fee line add failed", it.id, fe);
              toast("Added — but the back fee couldn't be applied (check the fee variant ID).");
            }
          } catch (e) { console.warn("[Dynamic] fee line error", e); }
        }
        if (document.getElementById("hdCart") && window.DynamicHeader && window.DynamicHeader.openCart) {
          window.DynamicHeader.openCart();
        } else if (window.DynamicCart) {
          await window.DynamicCart.refresh(); window.DynamicCart.open();
        } else { window.location.href = "/cart"; }
        return true;
      } catch (e) { console.warn("[Dynamic] cart error", e); }
    }
    window.Dynamic.lastOrder = { variantId: submitId || null, quantity: qty, properties: clean };
    console.groupCollapsed("%c[Dynamic] Add to Bag (demo \u2014 no Shopify variant)", "color:#0071e3;font-weight:600");
    console.log(window.Dynamic.lastOrder);
    console.groupEnd();
    return true;
  }

  function fileToImageDataUrl(file) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (ext === "svg") {
      return file.text().then((t) => "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(t))));
    }
    if (ext === "pdf") {
      return loadPdfJs().then((pdfjs) => file.arrayBuffer()
        .then((buf) => pdfjs.getDocument({ data: buf }).promise)
        .then((doc) => doc.getPage(1))
        .then((page) => {
          const vp = page.getViewport({ scale: 2 });
          const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height;
          return page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise.then(() => c.toDataURL("image/png"));
        })).catch(() => null);
    }
    return readAsDataURL(file);
  }

  function q2(sel) { return document.querySelector(sel); }
  function clampPct(v) { return Math.max(0, Math.min(100, v)); }

  function activeLayer() { return layers.find(function (l) { return l.id === activeLayerId; }) || null; }
  function activeTextLayer() { const l = activeLayer(); return (l && l.kind === "text") ? l : null; }
  function countKind(k) { return layers.filter(function (l) { return l.kind === k; }).length; }
  function layerEl(id) { return q2('#printArea .up-el[data-lid="' + id + '"]'); }

  function backEnabled() {
    const S = window.DYN_SETTINGS || {};
    // Only needs "Enable back side"; a separate back image and the back fee are optional.
    return !!(S.enableBack && (product && product.uploadMode));
  }
  // Find a back image for the current variant colour by matching a product image
  // whose ALT TEXT contains the colour name AND the word "back" (e.g. alt "Red back").
  function variantBackImage() {
    const shop = window.DYN_SHOPIFY || {};
    const imgs = shop.productImagesData || [];
    if (!imgs.length || !curVariantOpts.length) return "";
    for (let i = 0; i < curVariantOpts.length; i++) {
      const val = String(curVariantOpts[i] || "").toLowerCase().trim();
      if (!val) continue;
      const hit = imgs.find(function (im) {
        const a = String(im.alt || "").toLowerCase();
        return a.indexOf("back") > -1 && a.indexOf(val) > -1;
      });
      if (hit && hit.url) return hit.url;
    }
    return "";
  }
  function sideImage(side) {
    const S = window.DYN_SETTINGS || {};
    if (side === "back") return variantBackImage() || S.backImage || S.frontImage || product.image;
    return S.frontImage || product.image;
  }
  // Merchant-configurable property labels shown on the order.
  function labels() {
    const S = window.DYN_SETTINGS || {};
    return {
      design: S.labelDesign || "Print Front",
      backDesign: S.labelBackDesign || "Print Back",
      preview: S.labelPreview || "Preview Front",
      backPreview: S.labelBackPreview || "Preview Back",
      text: S.labelText || "Text",
      backText: S.labelBackText || "Back text"
    };
  }
  function slug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40); }
  // Base for the downloadable file names: product + selected colour/options.
  function fileBaseName() {
    const shop = window.DYN_SHOPIFY || {};
    const parts = [slug(shop.productTitle) || "design"];
    if (curVariantOpts && curVariantOpts.length) { const v = slug(curVariantOpts.join("-")); if (v) parts.push(v); }
    return parts.join("-") || "design";
  }
  function sidePrint(side) {
    const S = window.DYN_SETTINGS || {};
    return (side === "back" ? S.printBack : S.print) || {};
  }
  function sideHasContent(side) {
    return (sideLayers[side] || []).some(function (l) {
      return (l.kind === "img" && l.url) || (l.kind === "text" && l.text);
    });
  }
  function applyStageForSide(side) {
    const pa = q2("#printArea"), P = sidePrint(side);
    if (pa) {
      pa.style.left = (P.x != null ? P.x : 22) + "%";
      pa.style.top = (P.y != null ? P.y : 30) + "%";
      pa.style.width = (P.w != null ? P.w : 56) + "%";
      pa.style.height = (P.h != null ? P.h : 40) + "%";
      pa.classList.toggle("outline", P.show !== false);
    }
    const img = q2(".engrave-frame > img"); if (img) img.src = sideImage(side) || "";
  }

  function switchSide(side) {
    if (side === currentSide) return;
    sideActive[currentSide] = activeLayerId;         // remember selection per side
    const pa = q2("#printArea");
    if (pa) pa.querySelectorAll(".up-el").forEach(function (e) { e.remove(); });
    currentSide = side;
    layers = sideLayers[side];
    activeLayerId = sideActive[side] || null;
    applyStageForSide(side);
    layers.forEach(function (l) { createLayerEl(l); });
    document.querySelectorAll(".side-tab").forEach(function (t) {
      t.classList.toggle("on", t.dataset.side === side);
      t.setAttribute("aria-selected", String(t.dataset.side === side));
    });
    const al = activeTextLayer(), t = q2("#upText");
    if (t) t.value = al ? (al.text || "") : "";
    renderUpEls();
  }

  function pruneEmptyText(exceptId) {
    layers.filter(function (l) { return l.kind === "text" && !l.text && l.id !== exceptId; })
      .slice().forEach(function (l) { removeLayer(l.id); });
  }

  function selectLayer(id) {
    activeLayerId = id;
    const l = activeLayer();
    const t = q2("#upText");
    if (t) t.value = (l && l.kind === "text") ? (l.text || "") : "";
    if (l && l.kind === "text" && l.font) setKbdFont(l.font);
    renderUpEls();
  }

  function createLayerEl(layer) {
    const pa = q2("#printArea"); if (!pa) return null;
    const el = document.createElement("div");
    el.className = "up-el " + (layer.kind === "img" ? "up-img" : "up-txt");
    el.setAttribute("data-lid", layer.id);
    if (layer.kind === "img") {
      el.innerHTML = '<img alt="">' +
        '<span class="rotate-handle" title="Rotate"></span>' +
        '<span class="upload-handle"></span>' +
        '<button class="up-remove" type="button" aria-label="Remove image">×</button>';
      const im = el.querySelector("img"); if (im) { im.crossOrigin = "anonymous"; if (layer.url) im.src = layer.url; }
    } else {
      el.innerHTML = '<span class="up-txt-content"></span>' +
        '<span class="rotate-handle" title="Rotate"></span>' +
        '<span class="upload-handle"></span>' +
        '<button class="up-remove" type="button" aria-label="Remove text">×</button>';
    }
    pa.appendChild(el);
    makeUpInteractive(el, layer);
    const rm = el.querySelector(".up-remove");
    if (rm) rm.onclick = function (e) { e.stopPropagation(); removeLayer(layer.id); };
    return el;
  }

  const CASCADE = [[0, 0], [12, 12], [-12, 12], [12, -12], [-12, -12], [0, 14]];
  function cascade() { return CASCADE[layers.length % CASCADE.length]; }
  const TEXT_ROWS = [50, 26, 74];
  function freeTextY() {
    const used = layers.filter((l) => l.kind === "text").map((l) => l.y);
    for (let i = 0; i < TEXT_ROWS.length; i++) {
      const s = TEXT_ROWS[i];
      if (!used.some((u) => Math.abs(u - s) < 18)) return s;
    }
    return TEXT_ROWS[used.length % TEXT_ROWS.length];
  }

  function addTextLayer(geom) {
    pruneEmptyText();
    if (countKind("text") >= MAX_TXT) { toast("Up to " + MAX_TXT + " text boxes"); return null; }
    const eg = (window.DYN_SETTINGS && window.DYN_SETTINGS.engrave) || {};
    const layer = Object.assign({
      id: ++layerSeq, kind: "text", x: 50, y: freeTextY(), size: 12, rotate: 0,
      font: UPLOAD_FONTS[0].stack,
      color: (eg.color && eg.color !== "#9a9ba2" ? eg.color : "#1d1d1f"), text: ""
    }, geom || {});
    layers.push(layer);
    createLayerEl(layer);
    activeLayerId = layer.id;
    renderUpEls();
    return layer;
  }

  function addImageLayer(url, file, geom) {
    const cap = maxImages();
    if (countKind("img") >= cap) { toast(cap === 1 ? "One design per item" : "Up to " + cap + " photos"); return null; }
    const o = cascade();
    const layer = Object.assign({
      id: ++layerSeq, kind: "img", x: 50 + o[0], y: 50 + o[1], scale: 62, rotate: 0,
      url: url || "", file: file || null, cloudUrl: (file && file._cloudUrl) || null
    }, geom || {});
    layers.push(layer);
    createLayerEl(layer);
    activeLayerId = layer.id;
    renderUpEls();
    const el = layerEl(layer.id), im = el && el.querySelector("img"), area = q2("#printArea");
    const fit = function () { if (el && area) { fitInArea(el, area, layer, "img"); renderUpEls(); } };
    if (im) { if (im.complete && im.naturalWidth) fit(); else im.addEventListener("load", fit, { once: true }); }
    return layer;
  }

  function removeLayer(id) {
    const i = layers.findIndex(function (l) { return l.id === id; });
    if (i < 0) return;
    const el = layerEl(id); if (el) el.remove();
    layers.splice(i, 1);
    if (activeLayerId === id) {
      activeLayerId = layers.length ? layers[layers.length - 1].id : null;
      const al = activeTextLayer(), t = q2("#upText");
      if (t) t.value = al ? (al.text || "") : "";
    }
    renderUpEls();
  }

  function renderUpEls() {
    layers.forEach(function (layer) {
      const el = layerEl(layer.id); if (!el) return;
      el.style.left = layer.x + "%"; el.style.top = layer.y + "%";
      el.style.transform = "translate(-50%, -50%) rotate(" + (layer.rotate || 0) + "deg)";
      el.classList.toggle("selected", layer.id === activeLayerId);
      if (layer.kind === "img") {
        el.style.width = layer.scale + "%";
        const im = el.querySelector("img");
        if (im && layer.url && im.getAttribute("src") !== layer.url) im.src = layer.url;
      } else {
        el.style.fontSize = layer.size + "cqw";
        const c = el.querySelector(".up-txt-content");
        if (c) { c.textContent = layer.text; c.style.fontFamily = "'DynEmoji', " + layer.font; c.style.color = layer.color; }
      }
    });
    const apply = q2("#uploadApply");
    if (apply) apply.disabled = !layers.some(function (l) {
      return (l.kind === "img" && l.url) || (l.kind === "text" && l.text);
    });
    // Photo-only click-to-upload hint hides once a design is on the print area.
    const hint = q2("#printHint");
    if (hint) hint.style.display = countKind("img") ? "none" : "";
    // Example placeholder: hide as soon as the customer adds any design.
    const example = q2("#upExample");
    if (example) example.style.display = (layers && layers.length) ? "none" : "";
    updateModalPrice();
  }

  // Live popup price: reflects the Print-sides upcharge once a back design is added
  // (and gift wrapping), using the same variant the cart will use.
  function updateModalPrice() {
    const totalEl = document.querySelector("#modalRoot .price-breakdown .total");
    if (!totalEl) return;
    const S = window.DYN_SHOPIFY || {};
    const has = (s) => (sideLayers[s] || []).some((l) => (l.kind === "img" && l.url) || (l.kind === "text" && l.text));
    const hasBackDesign = has("back");
    const giftCfg = (window.DYN_SETTINGS && window.DYN_SETTINGS.gift) || {};
    const giftOnEl = document.querySelector("#giftIsGift");
    const giftOn = !!(giftCfg.enabled && giftOnEl && giftOnEl.checked);
    let price = S.priceMoney || "";
    const v = (typeof _sidesResolve === "function" && _sidesResolve) ? _sidesResolve(hasBackDesign, giftOn) : null;
    if (v && v.price) price = v.price;
    if (price) totalEl.textContent = price;
  }
  // Photo-only methods (e.g. DTF) allow just ONE design; others allow up to MAX_IMG.
  function maxImages() { return (product && product.photoOnly) ? 1 : MAX_IMG; }

  function clampIn(v, half) { return half >= 50 ? 50 : Math.max(half, Math.min(100 - half, v)); }
  function clampToArea(ov, area, state) {
    const r = area.getBoundingClientRect(), er = ov.getBoundingClientRect();
    const halfW = r.width ? (er.width / r.width) * 50 : 0, halfH = r.height ? (er.height / r.height) * 50 : 0;
    state.x = clampIn(state.x, halfW); state.y = clampIn(state.y, halfH);
  }
  function fitInArea(ov, area, state, kind) {
    const prop = kind === "text" ? "size" : "scale";
    const floor = kind === "text" ? 3 : 10;
    for (let i = 0; i < 40; i++) {
      const r = area.getBoundingClientRect(), er = ov.getBoundingClientRect();
      if (er.width <= r.width + 1 && er.height <= r.height + 1) break;
      if (state[prop] <= floor) break;
      state[prop] = Math.max(floor, state[prop] * 0.93);
      renderUpEls();
    }
    clampToArea(ov, area, state);
  }
  function makeUpInteractive(ov, layer) {
    const area = q2("#printArea");
    if (!ov || !area) return;
    const state = layer, kind = layer.kind;
    const handle = ov.querySelector(".upload-handle");
    const rotateHandle = ov.querySelector(".rotate-handle");
    ov.addEventListener("pointerdown", (e) => {
      if (e.target === handle || (e.target.classList && e.target.classList.contains("up-remove"))) return;
      selectLayer(layer.id);
      e.preventDefault();
      const r = area.getBoundingClientRect();
      const er = ov.getBoundingClientRect();
      const halfW = r.width ? (er.width / r.width) * 50 : 0, halfH = r.height ? (er.height / r.height) * 50 : 0;
      const sx = e.clientX, sy = e.clientY, ox = state.x, oy = state.y;
      try { ov.setPointerCapture(e.pointerId); } catch (_) {}
      const gv = q2("#guideV"), gh = q2("#guideH"), SNAP = 3.5;
      const move = (ev) => {
        let nx = clampIn(ox + ((ev.clientX - sx) / r.width) * 100, halfW);
        let ny = clampIn(oy + ((ev.clientY - sy) / r.height) * 100, halfH);
        if (Math.abs(nx - 50) < SNAP && halfW < 50) { nx = 50; if (gv) gv.classList.add("on"); } else if (gv) gv.classList.remove("on");
        if (Math.abs(ny - 50) < SNAP && halfH < 50) { ny = 50; if (gh) gh.classList.add("on"); } else if (gh) gh.classList.remove("on");
        state.x = nx; state.y = ny; renderUpEls();
      };
      const up = () => {
        if (gv) gv.classList.remove("on"); if (gh) gh.classList.remove("on");
        ov.removeEventListener("pointermove", move); ov.removeEventListener("pointerup", up);
      };
      ov.addEventListener("pointermove", move); ov.addEventListener("pointerup", up);
    });
    if (handle) handle.addEventListener("pointerdown", (e) => {
      e.preventDefault(); e.stopPropagation();
      selectLayer(layer.id);
      const r = area.getBoundingClientRect();
      // Resize by how far the pointer is dragged from the design's CENTRE, relative
      // to where it started. This is rotation-invariant, so dragging the corner
      // handle feels natural at any angle (unlike a plain left/right drag).
      const rect0 = ov.getBoundingClientRect();
      const cx = rect0.left + rect0.width / 2, cy = rect0.top + rect0.height / 2;
      const startDist = Math.max(1, Math.hypot(e.clientX - cx, e.clientY - cy));
      const start = (kind === "text" ? state.size : state.scale);
      try { handle.setPointerCapture(e.pointerId); } catch (_) {}
      const move = (ev) => {
        const prev = (kind === "text" ? state.size : state.scale);
        const factor = Math.hypot(ev.clientX - cx, ev.clientY - cy) / startDist;
        if (kind === "text") state.size = Math.max(3, Math.min(60, start * factor));
        else state.scale = Math.max(10, Math.min(100, start * factor));
        renderUpEls();
        const er = ov.getBoundingClientRect();
        if (er.width > r.width + 1 || er.height > r.height + 1) {
          if (kind === "text") state.size = prev; else state.scale = prev;
          renderUpEls();
        }
        clampToArea(ov, area, state); renderUpEls();
      };
      const up = () => { handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", up); };
      handle.addEventListener("pointermove", move); handle.addEventListener("pointerup", up);
    });
    if (rotateHandle) rotateHandle.addEventListener("pointerdown", (e) => {
      e.preventDefault(); e.stopPropagation();
      selectLayer(layer.id);
      const rect = ov.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const startAng = Math.atan2(e.clientY - cy, e.clientX - cx);
      const startRot = state.rotate || 0;
      try { rotateHandle.setPointerCapture(e.pointerId); } catch (_) {}
      const move = (ev) => {
        let deg = startRot + (Math.atan2(ev.clientY - cy, ev.clientX - cx) - startAng) * 180 / Math.PI;
        if (ev.shiftKey) {
          deg = Math.round(deg / 45) * 45;
        } else {
          const near = Math.round(deg / 90) * 90;
          if (Math.abs(deg - near) < 7) deg = near;
        }
        state.rotate = deg; renderUpEls();
        fitInArea(ov, area, state, kind); renderUpEls();
      };
      const up = () => { rotateHandle.removeEventListener("pointermove", move); rotateHandle.removeEventListener("pointerup", up); };
      rotateHandle.addEventListener("pointermove", move); rotateHandle.addEventListener("pointerup", up);
    });
  }

  function enablePrintAreaSetup(pa) {
    const frame = q2(".engrave-frame");
    if (!frame || !pa) return;
    pa.classList.add("setup");
    const rh = document.createElement("span"); rh.className = "pa-resize"; pa.appendChild(rh);
    const readout = document.createElement("div"); readout.className = "pa-readout";
    document.body.appendChild(readout);
    const num = (v) => Math.round(parseFloat(v) || 0);
    function vals() { return { x: num(pa.style.left), y: num(pa.style.top), w: num(pa.style.width), h: num(pa.style.height) }; }
    function draw() {
      const v = vals();
      readout.innerHTML = "Print area &nbsp;·&nbsp; Left " + v.x + "% · Top " + v.y + "% · Width " + v.w + "% · Height " + v.h + "%" +
        "<span>Enter these 4 numbers in Theme settings → Printable area, then Save</span>";
    }
    draw();
    pa.addEventListener("pointerdown", (e) => {
      if (e.target === rh) return;
      e.preventDefault();
      const r = frame.getBoundingClientRect(), v = vals(), sx = e.clientX, sy = e.clientY;
      try { pa.setPointerCapture(e.pointerId); } catch (_) {}
      const move = (ev) => {
        const nx = Math.max(0, Math.min(100 - v.w, v.x + ((ev.clientX - sx) / r.width) * 100));
        const ny = Math.max(0, Math.min(100 - v.h, v.y + ((ev.clientY - sy) / r.height) * 100));
        pa.style.left = nx + "%"; pa.style.top = ny + "%"; draw();
      };
      const up = () => { pa.removeEventListener("pointermove", move); pa.removeEventListener("pointerup", up); };
      pa.addEventListener("pointermove", move); pa.addEventListener("pointerup", up);
    });
    rh.addEventListener("pointerdown", (e) => {
      e.preventDefault(); e.stopPropagation();
      const r = frame.getBoundingClientRect(), v = vals(), sx = e.clientX, sy = e.clientY;
      try { rh.setPointerCapture(e.pointerId); } catch (_) {}
      const move = (ev) => {
        const nw = Math.max(5, Math.min(100 - v.x, v.w + ((ev.clientX - sx) / r.width) * 100));
        const nh = Math.max(5, Math.min(100 - v.y, v.h + ((ev.clientY - sy) / r.height) * 100));
        pa.style.width = nw + "%"; pa.style.height = nh + "%"; draw();
      };
      const up = () => { rh.removeEventListener("pointermove", move); rh.removeEventListener("pointerup", up); };
      rh.addEventListener("pointermove", move); rh.addEventListener("pointerup", up);
    });
  }

  function compositeSide(layersArr, imageUrl, P) {
    return new Promise((resolve) => {
      if (!layersArr || !layersArr.length || !imageUrl) { resolve(null); return; }
      const prod = new Image(); prod.crossOrigin = "anonymous";
      prod.onload = () => {
        const W = prod.naturalWidth || 900, H = prod.naturalHeight || 900;
        const c = document.createElement("canvas"); c.width = W; c.height = H;
        const ctx = c.getContext("2d");
        try { ctx.drawImage(prod, 0, 0, W, H); } catch (_) {}
        P = P || {};
        const aX = (P.x != null ? P.x : 22) / 100 * W, aY = (P.y != null ? P.y : 30) / 100 * H,
              aW = (P.w != null ? P.w : 56) / 100 * W, aH = (P.h != null ? P.h : 40) / 100 * H;
        ctx.save();
        ctx.beginPath(); ctx.rect(aX, aY, aW, aH); ctx.clip();
        const imgLayers = layersArr.filter((l) => l.kind === "img" && l.url);
        const imgMap = {};
        let pending = imgLayers.length;
        const paint = () => {
          layersArr.forEach((layer) => {
            if (layer.kind === "text") {
              if (!layer.text) return;
              const fs = (layer.size / 100) * aW;
              ctx.save();
              ctx.translate(aX + (layer.x / 100) * aW, aY + (layer.y / 100) * aH);
              ctx.rotate((layer.rotate || 0) * Math.PI / 180);
              ctx.font = "600 " + fs + "px 'DynEmoji', " + (layer.font || "sans-serif");
              ctx.fillStyle = layer.color || "#1d1d1f";
              ctx.textAlign = "center"; ctx.textBaseline = "middle";
              const lines = String(layer.text).split("\n");
              const lh = fs * 1.25, y0 = -((lines.length - 1) * lh) / 2;
              lines.forEach((ln, i) => { try { ctx.fillText(ln, 0, y0 + i * lh); } catch (_) {} });
              ctx.restore();
            } else {
              const des = imgMap[layer.id]; if (!des) return;
              try {
                const w = aW * (layer.scale / 100), h = w * ((des.naturalHeight || 1) / (des.naturalWidth || 1));
                ctx.save();
                ctx.translate(aX + (layer.x / 100) * aW, aY + (layer.y / 100) * aH);
                ctx.rotate((layer.rotate || 0) * Math.PI / 180);
                ctx.drawImage(des, -w / 2, -h / 2, w, h);
                ctx.restore();
              } catch (_) {}
            }
          });
          try { ctx.restore(); } catch (_) {}
          try { resolve(c.toDataURL("image/png")); } catch (e) { resolve(null); }
        };
        if (!pending) { paint(); return; }
        imgLayers.forEach((layer) => {
          const des = new Image(); des.crossOrigin = "anonymous";
          des.onload = () => { imgMap[layer.id] = des; if (--pending === 0) paint(); };
          des.onerror = () => { if (--pending === 0) paint(); };
          des.src = layer.url;
        });
      };
      prod.onerror = () => resolve(null);
      prod.src = imageUrl;
    });
  }

  // Gift options block for the customizer popup (matches the Dynamic design).
  function giftHtml() {
    const g = (window.DYN_SETTINGS && window.DYN_SETTINGS.gift) || {};
    if (!g.enabled) return "";
    // Wrapping is offered when either a variant option is mapped (one line item)
    // or the legacy separate-fee variant id is set.
    const wrapId = (String(g.wrapOption || "").trim() || String(g.wrapVariantId || "").trim());
    const wrapMoney = g.wrapMoney || "";
    const toggleLabel = g.toggleLabel || "This is a gift";
    const wrapLabel = g.wrapLabel || "Add gift wrapping";
    const noteLabel = g.noteLabel || "Add a gift note (optional)";
    const css =
      '<style>' +
      '.dc-gift{--gi:#1d1d1f;--gs:#6e6e73;--gf:#86868b;--gl:#d2d2d7;--gp:#f5f5f7;--ga:#0071e3;' +
        'margin:20px 0 0;font-family:inherit;color:var(--gi)}' +
      '.dc-gift *{box-sizing:border-box}' +
      '.dc-gift-toggle{display:inline-flex;align-items:center;gap:12px;cursor:pointer;user-select:none}' +
      '.dc-gift-toggle-input{position:absolute;opacity:0;width:0;height:0}' +
      '.dc-gift-track{position:relative;width:50px;height:30px;border-radius:999px;flex:none;background:rgba(120,120,128,.22);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);box-shadow:inset 0 1px 3px rgba(0,0,0,.18),inset 0 0 0 1px rgba(255,255,255,.22);transition:background .28s,box-shadow .28s}' +
      '.dc-gift-track::before{content:"";position:absolute;left:2px;right:2px;top:1px;height:45%;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,0));pointer-events:none}' +
      '.dc-gift-knob{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:linear-gradient(180deg,#fff,#eef0f2);box-shadow:0 2px 5px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.9);transition:transform .28s cubic-bezier(.4,1.25,.5,1)}' +
      '.dc-gift-toggle-input:checked+.dc-gift-track{background:linear-gradient(180deg,rgba(76,222,128,.92),rgba(40,199,84,.92));-webkit-backdrop-filter:blur(8px) saturate(1.5);backdrop-filter:blur(8px) saturate(1.5);box-shadow:inset 0 1px 1px rgba(255,255,255,.6),inset 0 -2px 4px rgba(0,90,35,.28),0 2px 9px rgba(52,199,89,.5),inset 0 0 0 1px rgba(255,255,255,.28)}' +
      '.dc-gift-toggle-input:checked+.dc-gift-track .dc-gift-knob{transform:translateX(20px)}' +
      '.dc-gift-label{font-size:15px;font-weight:500}' +
      '.dc-gift-panel{margin-top:14px;padding:16px 18px;background:var(--gp);border:1px solid var(--gl);border-radius:14px;display:grid;gap:14px}' +
      '.dc-gift-panel[hidden]{display:none}' +
      '.dc-gift-row{display:flex;align-items:center;gap:11px;cursor:pointer;font-size:15px}' +
      '.dc-gift-check{width:19px;height:19px;accent-color:var(--gi);flex:none;cursor:pointer;margin:0}' +
      '.dc-gift-note-h{display:block;font-size:14px;font-weight:500;margin-bottom:8px}' +
      '.dc-gift-note-input{width:100%;resize:vertical;min-height:70px;padding:11px 13px;font-family:inherit;font-size:15px;line-height:1.45;color:var(--gi);background:#fff;border:1px solid var(--gl);border-radius:12px;transition:border-color .16s,box-shadow .16s}' +
      '.dc-gift-note-input::placeholder{color:var(--gf)}' +
      '.dc-gift-note-input:focus{outline:none;border-color:var(--ga);box-shadow:0 0 0 3px rgba(0,113,227,.15)}' +
      '.dc-gift-note-input:disabled{opacity:.55}' +
      '.dc-gift-count{margin-top:8px;text-align:right;font-size:12px;color:var(--gf);font-variant-numeric:tabular-nums}' +
      '</style>';
    // The toggle IS the gift-wrapping switch when a wrap product is set
    // (turning it on adds the $8 wrapping); otherwise it's a plain gift toggle.
    const label = wrapId
      ? escapeHtml(wrapLabel) + (wrapMoney ? ' — <strong>' + escapeHtml(wrapMoney) + '</strong>' : '')
      : escapeHtml(toggleLabel);
    return css +
      '<div class="dc-gift" id="giftBlock">' +
        '<label class="dc-gift-toggle"><input type="checkbox" id="giftIsGift" class="dc-gift-toggle-input">' +
          '<span class="dc-gift-track"><span class="dc-gift-knob"></span></span>' +
          '<span class="dc-gift-label">' + label + '</span></label>' +
        '<div class="dc-gift-panel" id="giftPanel" hidden>' +
          '<div class="dc-gift-note"><label class="dc-gift-note-h" for="giftNote">' + escapeHtml(noteLabel) + '</label>' +
          '<textarea id="giftNote" class="dc-gift-note-input" maxlength="250" rows="3" placeholder="Write your message…" disabled></textarea>' +
          '<div class="dc-gift-count"><span id="giftCount">0</span>/250</div></div>' +
        '</div>' +
      '</div>';
  }

  function buildUploadModal() {
    sideLayers = { front: [], back: [] };
    sideActive = { front: null, back: null };
    currentSide = "front";
    layers = sideLayers.front; activeLayerId = null; layerSeq = 0;
    const S = window.DYN_SETTINGS || {};
    const hasBack = backEnabled();
    const feeMoney = S.backFeeMoney || "";
    const noun = product.engraveNoun || (window.DYN_SHOPIFY && window.DYN_SHOPIFY.productTitle) || product.name || "product";
    const priceStr = (window.DYN_SHOPIFY && window.DYN_SHOPIFY.priceMoney) || D.pricing.money(product.base);
    const photoOnly = !!(product && product.photoOnly);
    const exampleImg = (window.DYN_SETTINGS && window.DYN_SETTINGS.exampleImage) || "";
    const eTitle = (window.DYN_SETTINGS && window.DYN_SETTINGS.engraveTitle) || ("Personalize your " + noun + ".");
    const eSub = (window.DYN_SETTINGS && window.DYN_SETTINGS.engraveSub) || (photoOnly
      ? ("Click the image to upload your design, then drag, resize or rotate it on your " + noun + ".")
      : ("Add photos and text — tap to select, then drag, resize or rotate each on your " + noun + ". Up to " + MAX_IMG + " of each."));
    const eBtn = (window.DYN_SETTINGS && window.DYN_SETTINGS.popupButtonLabel) || "Add to Bag";
    const ePlaceholder = (window.DYN_SETTINGS && window.DYN_SETTINGS.popupPlaceholder) || "Add your text";
    const html =
      '<div class="modal-scrim" data-close></div>' +
      '<div class="modal-sheet engrave-sheet" role="dialog" aria-modal="true" aria-labelledby="engraveTitle">' +
        '<button class="modal-close" data-close aria-label="Close">✕</button>' +
        '<div class="engrave-scroll">' +
          '<div class="engrave-head"><h2 id="engraveTitle">' + escapeHtml(eTitle) + '</h2>' +
            '<p>' + escapeHtml(eSub) + '</p></div>' +
          (hasBack
            ? '<div class="side-tabs" role="tablist">' +
                '<button type="button" class="side-tab on" data-side="front" role="tab" aria-selected="true">' + escapeHtml(S.frontTabLabel || "Front") + '</button>' +
                '<button type="button" class="side-tab" data-side="back" role="tab" aria-selected="false">' + escapeHtml(S.backTabLabel || "Back") +
                  (feeMoney ? '<span class="side-fee">+' + escapeHtml(feeMoney) + '</span>' : '') +
                '</button>' +
              '</div>'
            : '') +
          '<div class="engrave-stage"><div class="engrave-frame">' +
            '<img src="' + (sideImage("front") || "") + '" alt="">' +
            '<div class="print-area" id="printArea">' +
              // Faded example design: shows customers where/how their design goes; hidden once they upload.
              (exampleImg ? '<img class="up-example" id="upExample" src="' + exampleImg + '" alt="Example design">' : '') +
              '<span class="print-area-label">Print area</span>' +
              '<div class="up-guide up-guide-v" id="guideV"></div><div class="up-guide up-guide-h" id="guideH"></div>' +
              // Photo-only (e.g. DTF): the customer uploads by clicking the image itself.
              (photoOnly ? '<button type="button" class="print-hint" id="printHint" data-drop="design">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>' +
                '<span>Click to upload your design</span></button>' : '') +
            '</div>' +
          '</div></div>' +
          '<div class="up-controls">' +
            '<input type="file" data-file="design" accept=".png,.jpg,.jpeg,.svg,.pdf" hidden>' +
            // Photo-only has no compose bar — you upload by clicking the image above.
            (photoOnly ? '' :
              '<div class="ios-compose">' +
                '<button type="button" class="ios-plus" data-drop="design" aria-label="Upload your design (PNG, JPG, SVG, PDF)" title="Upload your design">' +
                  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>' +
                '</button>' +
                '<div class="ios-field"><textarea id="upText" class="engrave-input" maxlength="60" rows="1" placeholder="' + escapeHtml(ePlaceholder) + '" autocomplete="off"></textarea></div>' +
                '<button type="button" class="kbd-arrow" id="kbdArrow" aria-label="Show keyboard" aria-expanded="false" title="Keyboard">' +
                  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>' +
                '</button>' +
                '<button type="button" class="ios-plus" id="addTextBtn" aria-label="Add a text box" title="Add text">' +
                  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>' +
                '</button>' +
              '</div>' +
              '<div class="engrave-tools">' + kbdHtml() + '</div>') +
          '</div>' +
        '</div>' +
        '<div class="modal-foot"><div class="price-breakdown"><div class="price-breakdown-toggle" style="cursor:default">' +
          '<span class="total">' + priceStr + '</span><span class="meta">' + escapeHtml((window.DYN_SETTINGS && window.DYN_SETTINGS.customPrintLabel) || "Custom print") + '</span></div></div>' +
          '<div class="foot-actions"><button class="btn btn-ghost" data-close>Cancel</button>' +
          '<button class="btn btn-primary" id="uploadApply" disabled>' + escapeHtml(eBtn) + '</button></div></div>' +
      '</div>';
    $("#modalRoot").innerHTML = html;
    wireUploadModal();
  }

  function wireUploadModal() {
    $("#modalRoot").querySelectorAll("[data-close]").forEach((b) => (b.onclick = closeModal));
    const pa = q2("#printArea");
    if (pa) {
      applyStageForSide(currentSide);
      if (/[?&#]printsetup/i.test(location.search + location.hash)) enablePrintAreaSetup(pa);
    }
    document.querySelectorAll(".side-tab").forEach((t) => {
      t.onclick = () => switchSide(t.dataset.side);
    });
    const drop = q2('[data-drop="design"]'), input = q2('[data-file="design"]');
    async function accept(file) {
      if (file.size > 20 * 1024 * 1024) return toast("File is larger than 20 MB");
      if (countKind("img") >= maxImages()) return toast(maxImages() === 1 ? "One design per item — remove the current one first" : "Up to " + maxImages() + " photos");
      toast("Adding " + file.name + "…");
      const url = await fileToImageDataUrl(file);
      if (!url) return toast("Couldn't read that file");
      const layer = addImageLayer(url, file);
      if (!layer) return;
      uploadToCloudinary(file, file.name).then((u) => { if (u) { file._cloudUrl = u; layer.cloudUrl = u; } });
    }
    $("#modalRoot").querySelectorAll('[data-drop="design"]').forEach((d) => {
      d.onclick = () => input.click();
      d.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } };
    });
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("drag"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("drag"); }));
    drop.addEventListener("drop", (e) => { if (e.dataTransfer.files[0]) accept(e.dataTransfer.files[0]); });
    input.onchange = (e) => { if (e.target.files[0]) accept(e.target.files[0]); input.value = ""; };
    const txt = q2("#upText");
    if (txt) {
      const upSync = () => {
        let l = activeTextLayer();
        if (!l) {
          if (!txt.value) return;
          if (countKind("text") >= MAX_TXT) { toast("Up to " + MAX_TXT + " text boxes"); return; }
          l = addTextLayer(); if (!l) return;
        }
        l.text = txt.value; renderUpEls();
        const el = layerEl(l.id), area = q2("#printArea");
        if (el && area && l.text) { fitInArea(el, area, l, "text"); renderUpEls(); }
      };
      txt.oninput = upSync;
      wireKbd(txt, upSync, (f) => { const l = activeTextLayer(); if (l) { l.font = f.stack; renderUpEls(); } });
      setKbdFont(UPLOAD_FONTS[0].stack);
      const addTextBtn = q2("#addTextBtn");
      if (addTextBtn) addTextBtn.onclick = () => {
        if (countKind("text") >= MAX_TXT) return toast("Up to " + MAX_TXT + " text boxes");
        const l = addTextLayer(); if (!l) return;
        txt.value = ""; try { txt.focus(); } catch (e) {}
      };
    }
    const frame = q2(".engrave-frame");
    if (frame) frame.addEventListener("pointerdown", (e) => {
      if (!e.target.closest(".up-el")) { activeLayerId = null; if (txt) txt.value = ""; renderUpEls(); }
    });
    q2("#uploadApply").onclick = onUploadApply;
    renderUpEls();
  }

  // Mount the gift options on the PRODUCT PAGE (under Quantity) and wire the
  // toggle → note reveal + live counter. The selections are read at Add to Bag.
  function mountGiftOptions() {
    const mount = document.getElementById("giftMount");
    if (!mount) return;
    const html = giftHtml();
    mount.innerHTML = html;
    if (!html) return;
    const giftIsGift = mount.querySelector("#giftIsGift");
    if (!giftIsGift) return;
    const giftPanel = mount.querySelector("#giftPanel"), giftNote = mount.querySelector("#giftNote");
    const giftCount = mount.querySelector("#giftCount");
    const syncGift = () => {
      const on = giftIsGift.checked;
      if (giftPanel) giftPanel.hidden = !on;
      if (giftNote) giftNote.disabled = !on;
      applyVariantPrice();   // reflect the wrapping fee in the page price
    };
    giftIsGift.onchange = syncGift; syncGift();
    if (giftNote && giftCount) { const c = () => (giftCount.textContent = String(giftNote.value.length)); giftNote.oninput = c; c(); }
  }

  // Wipe the canvas back to an empty Front side (both sides cleared, field empty).
  // Called after Add to Bag so the next open starts fresh for a new design.
  function resetUploadDesign() {
    sideLayers = { front: [], back: [] };
    sideActive = { front: null, back: null };
    currentSide = "front";
    layers = sideLayers.front; activeLayerId = null;
    const pa = q2("#printArea"); if (pa) pa.querySelectorAll(".up-el").forEach((e) => e.remove());
    const t = q2("#upText"); if (t) t.value = "";
    document.querySelectorAll(".side-tab").forEach(function (tb) {
      var on = tb.dataset.side === "front";
      tb.classList.toggle("on", on); tb.setAttribute("aria-selected", String(on));
    });
    if (pa) applyStageForSide("front");
    renderUpEls();
  }

  async function onUploadApply() {
    const btn = $("#uploadApply");
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Saving';
    try {
      const S = window.DYN_SETTINGS || {};
      ["front", "back"].forEach((s) => {
        sideLayers[s] = sideLayers[s].filter((l) => !(l.kind === "text" && !l.text));
      });
      layers = sideLayers[currentSide];
      async function ensureCloud(arr) {
        for (const l of arr.filter((x) => x.kind === "img" && x.url)) {
          if (l.cloudUrl) continue;
          if (l.file && l.file._cloudUrl) l.cloudUrl = l.file._cloudUrl;
          else if (l.file instanceof File) l.cloudUrl = await uploadToCloudinary(l.file, l.file.name);
          else if (/^https?:/i.test(l.url)) l.cloudUrl = l.url; // edited item: reuse existing URL
        }
      }
      await ensureCloud(sideLayers.front); await ensureCloud(sideLayers.back);
      const imgs = (s) => sideLayers[s].filter((l) => l.kind === "img" && l.url);
      const txts = (s) => sideLayers[s].filter((l) => l.kind === "text" && l.text);
      const hasBackDesign = !!(imgs("back").length || txts("back").length);
      // Merchant-configurable labels (what shows on the order) + a base for the
      // downloadable file names (product + colour), so files are identifiable.
      const L = labels();
      const base = fileBaseName();
      const props = {};
      // Customer-facing: one clean note. Everything else is prefixed "_" so Shopify
      // hides it from the cart/checkout but keeps it on your order (admin) page.
      props["Personalized"] = hasBackDesign ? "Front + Back" : "Front";
      if (txts("front").length) props["_" + L.text] = txts("front").map((l) => l.text).join(" | ");
      if (hasBackDesign) {
        if (txts("back").length) props["_" + L.backText] = txts("back").map((l) => l.text).join(" | ");
        props["_Sides"] = "Front + Back";
      }
      if (product && product.method) props["_Print method"] = product.method;
      // Collect the raw design files + composed previews — Shopify hosts them for
      // free (attached as multipart line-item properties; no third-party host).
      const files = [];
      const extOf = (fn) => { const m = String(fn || "").match(/\.[a-z0-9]{1,5}$/i); return m ? m[0] : ".png"; };
      async function collectFiles(side, label, sideName) {
        const arr = imgs(side);
        for (let i = 0; i < arr.length; i++) {
          const l = arr[i], name = "_" + label + (i ? " " + (i + 1) : "");
          const fname = base + "-" + sideName + (i ? "-" + (i + 1) : "") + extOf(l.file && l.file.name);
          if (l.file instanceof File) { files.push({ name: name, file: l.file, filename: fname }); }
          else if (/^https?:/i.test(String(l.cloudUrl || l.url || ""))) {
            const blob = await fetch(l.cloudUrl || l.url).then((r) => r.blob()).catch(() => null);
            if (blob) files.push({ name: name, blob: blob, filename: base + "-" + sideName + ".png" });
          }
        }
      }
      await collectFiles("front", L.design, "front");
      if (hasBackDesign) await collectFiles("back", L.backDesign, "back");
      // Composed preview = the product with the design in the customer's exact
      // position/size/rotation. Visible name so it shows on the order + cart.
      const compF = await compositeSide(sideLayers.front, sideImage("front"), sidePrint("front"));
      if (compF) files.push({ name: "_" + L.preview, blob: dataURLtoBlob(compF), filename: base + "-front-preview.png" });
      if (hasBackDesign) {
        const compB = await compositeSide(sideLayers.back, sideImage("back"), sidePrint("back"));
        if (compB) files.push({ name: "_" + L.backPreview, blob: dataURLtoBlob(compB), filename: base + "-back-preview.png" });
      }
      const desc = (s) => [
        imgs(s).length ? (imgs(s).length + " image" + (imgs(s).length > 1 ? "s" : "")) : null,
        txts(s).length ? (txts(s).length + " text") : null
      ].filter(Boolean).join(" + ");
      props["_Customized"] = ("Front: " + (desc("front") || "—")) + (hasBackDesign ? (" · Back: " + desc("back")) : "");
      // Design state keeps positions/text only (image pixels live in the hosted files).
      const ser = (arr) => arr.map((l) => l.kind === "img"
        ? { kind: "img", x: l.x, y: l.y, scale: l.scale, rotate: l.rotate || 0 }
        : { kind: "text", text: l.text, x: l.x, y: l.y, size: l.size, rotate: l.rotate || 0, font: l.font, color: l.color }
      ).filter((s2) => s2.kind === "img" || (s2.kind === "text" && s2.text));
      const _state = { v: (window.DYN_SHOPIFY || {}).variantId || null, front: ser(sideLayers.front), back: ser(sideLayers.back) };
      // The design state (layer positions/text) is only used to re-open a design
      // for editing from the cart — it isn't needed for production. Keep it in the
      // browser and put just a short id on the order so the admin stays clean
      // (instead of a big JSON blob on every line item).
      if (_state.front.length || _state.back.length) {
        const _dsJson = JSON.stringify(_state);
        try {
          const _dsId = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
          localStorage.setItem("dyn_design_" + _dsId, _dsJson);
          props["_design_id"] = _dsId;
        } catch (e) { props["_design_state"] = _dsJson; }
      }
      // Single-line-item pricing: pick the variant (higher price) that matches the
      // customer's choices with Print-sides (back design) and Gift-wrapping (toggle)
      // forced — so both charges ride on the SAME line item.
      const gift = (window.DYN_SETTINGS && window.DYN_SETTINGS.gift) || {};
      const giftOnEl = $("#giftIsGift");
      const giftOn = !!(gift.enabled && giftOnEl && giftOnEl.checked);
      const sidesVariant = (typeof _sidesResolve === "function" && _sidesResolve) ? _sidesResolve(hasBackDesign, giftOn) : null;
      const extraItems = [];
      if (!sidesVariant && hasBackDesign && S.backFeeVariantId) {
        const grp = "g" + Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36);
        props["_grp"] = grp;
        const qty = Math.max(1, (store.get().quantity) || 1);
        extraItems.push({ id: S.backFeeVariantId, quantity: qty, properties: { "_For": (window.DYN_SHOPIFY || {}).productTitle || "custom item", "_grp": grp } });
      }
      // Gift options: flag the item as a gift and attach the note. The wrapping
      // charge now rides on the resolved variant above (one line item). Only if
      // the merchant hasn't mapped a "Gift wrapping" option do we fall back to the
      // legacy separate wrapping line (wrapVariantId).
      if (giftOn) {
        props["Gift"] = "Yes";
        const noteEl = $("#giftNote");
        if (noteEl && noteEl.value.trim()) props["Gift note"] = noteEl.value.trim();
        const usedGiftVariant = !!(sidesVariant && _giftVariantActive);
        if (!usedGiftVariant) {
          const wrapId = await resolveWrapVariant(gift.wrapVariantId);
          if (wrapId) {
            const gq = Math.max(1, (store.get().quantity) || 1);
            // Share a _grp with the item so the cart display folds the wrapping
            // line into it (shows as one item with a combined price).
            let grp = props["_grp"];
            if (!grp) { grp = "g" + Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36); props["_grp"] = grp; }
            extraItems.push({ id: wrapId, quantity: gq, properties: { "_For": (window.DYN_SHOPIFY || {}).productTitle || "item", "_grp": grp, "Gift wrapping": "Yes" } });
          }
        }
      }
      root.Dynamic.lastOrder = { properties: props };
      $("#customizeSummary") && ($("#customizeSummary").textContent = "Design added");
      const ok = await submitToShopify(props, extraItems, files, sidesVariant ? sidesVariant.id : null);
      if (ok) {
        const wasEditing = !!(editingLineKey || editingGrp);
        const oldGrp = editingGrp, oldKey = editingLineKey;
        editingLineKey = null; editingGrp = null;
        try {
          const drop = async (id) => fetch("/cart/change.js", {
            method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ id: id, quantity: 0 })
          });
          if (oldGrp) {
            const cart = await (await fetch("/cart.js", { headers: { "Accept": "application/json" } })).json();
            for (const it of (cart.items || [])) {
              if (it.properties && it.properties._grp === oldGrp) await drop(it.key);
            }
          } else if (oldKey) {
            await drop(oldKey);
          }
        } catch (e) {}
        if (window.DynamicCart && window.DynamicCart.refresh) { try { window.DynamicCart.refresh(); } catch (e) {} }
        closeModal(); toast(wasEditing ? "Design updated" : "Added to Bag");
        // Clear the canvas so the next time it opens the customer starts fresh
        // (can upload a different design without the old one still there).
        resetUploadDesign();
      }
    } catch (e) { console.error(e); toast("Something went wrong"); }
    finally { btn.textContent = (window.DYN_SETTINGS && window.DYN_SETTINGS.popupButtonLabel) || "Add to Bag"; renderUpEls(); }
  }

  async function maybeEditMode() {
    let key = null;
    try { key = new URLSearchParams(location.search).get("edit"); } catch (e) {}
    if (!key || !product || !product.uploadMode) return;
    let cart;
    try { cart = await (await fetch("/cart.js", { headers: { "Accept": "application/json" } })).json(); }
    catch (e) { return; }
    const line = (cart.items || []).find((it) => it.key === key);
    // Design state now lives in the browser under a short id (_design_id); older
    // carts may still carry the full state inline (_design_state) — support both.
    let rawState = null;
    if (line && line.properties) {
      if (line.properties._design_id) { try { rawState = localStorage.getItem("dyn_design_" + line.properties._design_id); } catch (e) {} }
      if (!rawState && line.properties._design_state) rawState = line.properties._design_state;
    }
    if (!line || !rawState) { toast("Couldn't load that design"); return; }
    let state;
    try { state = JSON.parse(rawState); } catch (e) { return; }

    // Image pixels live in the Shopify-hosted files (Design / Back design props),
    // not in _design_state — pair those URLs back onto the image layers, in order.
    try {
      const L = labels();
      const rx = (lab) => new RegExp("^_?" + lab.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "( \\d+)?$");
      const gather = (re) => Object.keys(line.properties)
        .filter((k) => re.test(k)).sort()
        .map((k) => line.properties[k]).filter((v) => /^https?:/i.test(String(v)));
      const fUrls = gather(rx(L.design)), bUrls = gather(rx(L.backDesign));
      const fill = (list, urls) => { let i = 0; (list || []).forEach((s) => { if (s.kind === "img") s.url = urls[i++] || s.url || ""; }); };
      fill(state.front, fUrls); fill(state.back, bUrls);
    } catch (e) {}

    if (state.v) {
      const shop = window.DYN_SHOPIFY || {};
      const v = (shop.variants || []).find((x) => String(x.id) === String(state.v));
      if (v && v.options) {
        v.options.forEach((val, oi) => {
          const btns = document.querySelectorAll('.pill[data-oi="' + oi + '"], .swatch[data-oi="' + oi + '"]');
          btns.forEach((b) => { if (b.dataset.val === val) b.click(); });
        });
      }
    }

    editingLineKey = key;
    editingGrp = (line.properties && line.properties._grp) || null; // to remove its old back-fee line
    openModal();                 // builds & resets the upload modal
    setTimeout(() => applyEditState(state), 60); // restore after the modal is built
  }

  function applyEditState(state) {
    if (!state) return;
    const pa = q2("#printArea"); if (pa) pa.querySelectorAll(".up-el").forEach((e) => e.remove());
    sideLayers = { front: [], back: [] };
    sideActive = { front: null, back: null };
    currentSide = "front"; layers = sideLayers.front; activeLayerId = null;
    const frontList = Array.isArray(state.front) ? state.front
      : Array.isArray(state.layers) ? state.layers
      : [].concat(state.img ? [Object.assign({ kind: "img" }, state.img)] : [],
                  state.txt ? [Object.assign({ kind: "text" }, state.txt)] : []);
    const backList = Array.isArray(state.back) ? state.back : [];
    const buildData = (s) => {
      if (s.kind === "img" && s.url) return { id: ++layerSeq, kind: "img", x: s.x, y: s.y, scale: s.scale, rotate: s.rotate || 0, url: s.url, file: { _cloudUrl: s.url, name: "edited-design" }, cloudUrl: s.url };
      if (s.kind === "text" && s.text) return { id: ++layerSeq, kind: "text", x: s.x, y: s.y, size: s.size, rotate: s.rotate || 0, font: s.font, color: s.color, text: s.text };
      return null;
    };
    sideLayers.back = backList.map(buildData).filter(Boolean);
    layers = sideLayers.front; currentSide = "front"; activeLayerId = null;
    applyStageForSide("front");
    frontList.forEach((s) => {
      if (s.kind === "img" && s.url) {
        addImageLayer(s.url, { _cloudUrl: s.url, name: "edited-design" },
          { x: s.x, y: s.y, scale: s.scale, rotate: s.rotate || 0, cloudUrl: s.url });
      } else if (s.kind === "text" && s.text) {
        addTextLayer({ x: s.x, y: s.y, size: s.size, rotate: s.rotate || 0, font: s.font, color: s.color, text: s.text });
      }
    });
    const al = activeTextLayer(), t = document.querySelector("#upText");
    if (t) t.value = al ? (al.text || "") : "";
    if (typeof renderUpEls === "function") renderUpEls();
    const sum = document.querySelector("#customizeSummary"); if (sum) sum.textContent = "Editing your saved design";
    toast("Editing your saved design");
  }

  function buildEngraveModal() {
    const noun = product.engraveNoun || product.name;
    $("#modalRoot").innerHTML = `
      <div class="modal-scrim" data-close></div>
      <div class="modal-sheet engrave-sheet" role="dialog" aria-modal="true" aria-labelledby="engraveTitle">
        <button class="modal-close" data-close aria-label="Close">\u2715</button>
        <div class="engrave-scroll">
          <div class="engrave-head">
            <h2 id="engraveTitle">${escapeHtml((window.DYN_SETTINGS && window.DYN_SETTINGS.engraveTitle) || ("Personalize your " + noun + "."))}</h2>
            <p>${escapeHtml((window.DYN_SETTINGS && window.DYN_SETTINGS.engraveSub) || "Fast, free engraving of emoji with a click. Type in names, initials, or numbers. You can even combine them.")}</p>
          </div>
          <div class="engrave-stage">
            <div class="engrave-frame">
              <img src="${product.image}" alt="${escapeHtml(product.name)} case">
              <div class="engrave-overlay" id="engraveOverlay"></div>
            </div>
          </div>
          <div class="engrave-input-wrap">
            <textarea id="engraveInput" class="engrave-input" maxlength="30" rows="1"
              placeholder="YOUR ENGRAVING" autocomplete="off" aria-label="Your engraving"></textarea>
            <button type="button" class="kbd-arrow" id="kbdArrow" aria-label="Show keyboard" aria-expanded="false" title="Keyboard">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </div>
          <div class="engrave-tools">
            ${kbdHtml()}
          </div>
        </div>
        <div class="modal-foot">
          <div class="price-breakdown">
            <div class="price-breakdown-toggle" style="cursor:default">
              <span class="total">${(window.DYN_SHOPIFY && window.DYN_SHOPIFY.priceMoney) || D.pricing.money(product.base)}</span>
              <span class="meta">Free engraving</span>
            </div>
          </div>
          <div class="foot-actions">
            <button class="btn btn-ghost" data-close>Cancel</button>
            <button class="btn btn-primary" id="engraveApply">Add to Bag</button>
          </div>
        </div>
      </div>`;
    wireEngrave();
  }

  function wireEngrave() {
    const input = $("#engraveInput");
    const overlay = $("#engraveOverlay");
    const eg = (window.DYN_SETTINGS && window.DYN_SETTINGS.engrave) || {};
    if (overlay) {
      if (eg.x != null) overlay.style.left = eg.x + "%";
      if (eg.y != null) overlay.style.top = eg.y + "%";
      overlay.style.transform = "translate(-50%, -50%) rotate(" + (eg.rotate || 0) + "deg)";
      if (eg.size) overlay.style.fontSize = "clamp(11px, " + eg.size + "cqw, 44px)";
      if (eg.color) overlay.style.color = eg.color;
    }
    let engFontName = UPLOAD_FONTS[0].name;
    if (overlay) overlay.style.fontFamily = "'DynEmoji', " + UPLOAD_FONTS[0].stack;
    const sync = () => {
      overlay.textContent = input.value;
    };
    input.oninput = sync;
    wireKbd(input, sync, (f) => { if (overlay) overlay.style.fontFamily = "'DynEmoji', " + f.stack; engFontName = f.name; });
    setKbdFont(UPLOAD_FONTS[0].stack);
    $("#modalRoot")
      .querySelectorAll("[data-close]")
      .forEach((b) => (b.onclick = closeModal));
    $("#engraveApply").onclick = async () => {
      const text = ($("#engraveInput").value || "").trim();
      store.get().engraving = text;
      const _sum = $("#customizeSummary");
      if (_sum) _sum.textContent = text ? "Engraving: \u201c" + text + "\u201d" : "No engraving added";
      const btn = $("#engraveApply");
      btn.disabled = true;
      const props = text ? { Engraving: text, Font: engFontName } : {};
      const ok = await submitToShopify(props);
      btn.disabled = false;
      if (ok) {
        closeModal();
        toast(text ? "Added to Bag with engraving" : "Added to Bag");
      }
    };
  }

  function buildModal() {
    const areasTabs = product.areas
      .map(
        (a, i) =>
          `<button class="area-tab" role="tab" data-area="${a.id}" aria-selected="${i === 0}">
             ${a.label}<span class="area-count" data-count="${a.id}"></span>
             ${i === 0 ? '<span class="area-tab-bg"></span>' : ""}
           </button>`
      )
      .join("");

    const modeButtons = [
      ["text", "Add Text", ICONS.text],
      ["upload", "Upload Logo", ICONS.upload],
      ["photo", "Upload Photo", ICONS.photo],
      ["ai", "AI Design", ICONS.ai],
      ["templates", "Templates", ICONS.tmpl],
    ]
      .map(
        ([k, label, ic], i) =>
          `<button class="mode-btn" role="tab" data-mode="${k}" aria-selected="${i === 0}">${ic}<span>${label}</span></button>`
      )
      .join("");

    const html = `
      <div class="modal-scrim" data-close></div>
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div class="modal-head">
          <div>
            <h2 id="modalTitle">Customize your ${escapeHtml(product.name)}.</h2>
            <div class="sub">Design it your way. Live preview updates as you go.</div>
          </div>
          <button class="modal-close" data-close aria-label="Close">✕</button>
        </div>

        <div class="modal-body">
          <section class="stage" aria-label="Live preview">
            <div class="stage-toolbar">
              <div class="area-tabs" role="tablist" aria-label="Print areas">${areasTabs}</div>
              <span class="tool-spacer"></span>
              <button class="tool-btn" data-act="undo" title="Undo (⌘Z)" disabled>${ICONS.undo}</button>
              <button class="tool-btn" data-act="redo" title="Redo (⇧⌘Z)" disabled>${ICONS.redo}</button>
              <span class="tool-divider"></span>
              <button class="tool-btn" data-act="dup" title="Duplicate (⌘D)" disabled>${ICONS.dup}</button>
              <button class="tool-btn" data-act="rotate" title="Rotate 15°" disabled>${ICONS.rotate}</button>
              <button class="tool-btn" data-act="del" title="Delete (⌫)" disabled>${ICONS.del}</button>
              <span class="tool-divider"></span>
              <button class="tool-btn" data-act="alignL" title="Align left" disabled>${ICONS.alignL}</button>
              <button class="tool-btn" data-act="alignT" title="Align top" disabled>${ICONS.alignT}</button>
              <button class="tool-btn" data-act="alignB" title="Align bottom" disabled>${ICONS.alignB}</button>
              <button class="tool-btn" data-act="alignR" title="Align right" disabled>${ICONS.alignR}</button>
              <button class="tool-btn" data-act="center" title="Snap to center" disabled>${ICONS.center}</button>
              <span class="tool-divider"></span>
              <button class="tool-btn" data-act="zoomOut" title="Zoom out">${ICONS.zoomOut}</button>
              <button class="tool-btn" data-act="zoomIn" title="Zoom in">${ICONS.zoomIn}</button>
            </div>
            <div class="canvas-wrap">
              <div class="canvas-frame" id="canvasFrame">
                <div id="stageSilhouette" style="position:absolute;inset:0;pointer-events:none;"></div>
                <canvas id="designCanvas"></canvas>
              </div>
              <div class="stage-empty" id="stageEmpty">Pick an option on the right to start designing.<br>Everything you add appears here, live.</div>
              <div class="zoom-badge" id="zoomBadge">100%</div>
            </div>
          </section>

          <aside class="panel">
            <div class="mode-rail" role="tablist" aria-label="Design tools">${modeButtons}</div>
            <div class="panel-scroll">
              <div class="panel-pane active" data-pane="text">${paneText()}</div>
              <div class="panel-pane" data-pane="upload">${paneUpload("logo")}</div>
              <div class="panel-pane" data-pane="photo">${paneUpload("photo")}</div>
              <div class="panel-pane" data-pane="ai">${paneAI()}</div>
              <div class="panel-pane" data-pane="templates">${paneTemplates()}</div>
              <div class="divider"></div>
              ${paneFinishing()}
              <div class="divider"></div>
              <div id="layersSection"></div>
            </div>
          </aside>
        </div>

        <div class="modal-foot">
          <div class="price-breakdown" id="priceBreakdown">
            <button class="price-breakdown-toggle" id="priceToggle" aria-expanded="false">
              <span class="total" id="modalTotal">$0</span>
              <span class="meta">Total <span class="caret">▾</span></span>
            </button>
            <div class="price-items"><div class="price-items-inner"><ul id="priceList"></ul></div></div>
          </div>
          <div class="foot-actions">
            <button class="btn btn-ghost" data-close>Cancel</button>
            <button class="btn btn-primary" id="applyBtn">Add to Cart</button>
          </div>
        </div>
      </div>`;

    const rootEl = $("#modalRoot");
    rootEl.innerHTML = html;
    wireModal();
  }

  function paneText() {
    return `
      <div class="field">
        <label for="txtInput">Your text</label>
        <textarea class="textarea" id="txtInput" placeholder="Happy Birthday Sarah" maxlength="120"></textarea>
      </div>
      <button class="btn btn-primary btn-block" id="addTextBtn">Add to design</button>
      <div class="divider"></div>
      <div class="field">
        <label>Font</label>
        <div class="font-grid" id="fontGrid">
          ${FONTS.map(
            (f, i) =>
              `<button class="font-chip" data-font="${f.stack}" style="font-family:${f.stack}" aria-pressed="${i === 0}">${f.name}</button>`
          ).join("")}
        </div>
      </div>
      <div class="field">
        <label>Color</label>
        <div class="swatch-grid" id="textColors">
          ${TEXT_COLORS.map(
            (c, i) => `<button class="color-dot" style="--c:${c}" data-color="${c}" aria-pressed="${i === 0}" aria-label="${c}"></button>`
          ).join("")}
        </div>
      </div>
      <div class="field">
        <label>Size <span id="fontSizeVal" style="float:right;color:var(--ink-faint)">46</span></label>
        <input type="range" id="fontSize" min="16" max="120" value="46" style="width:100%">
      </div>
      <div class="field">
        <label>Emoji</label>
        <div class="emoji-grid">${EMOJI.map((e) => `<button class="emoji-btn" data-emoji="${e}">${e}</button>`).join("")}</div>
      </div>`;
  }

  function paneUpload(kind) {
    const formats = kind === "logo" ? "PNG · JPG · SVG · PDF" : "PNG · JPG";
    const accept = kind === "logo" ? ".png,.jpg,.jpeg,.svg,.pdf" : ".png,.jpg,.jpeg";
    return `
      <div class="dropzone" data-drop="${kind}" tabindex="0" role="button" aria-label="Upload ${kind}">
        <strong>Drop your ${kind} here</strong>
        or click to browse
        <div class="formats">${formats} · up to 20&nbsp;MB</div>
      </div>
      <input type="file" data-file="${kind}" accept="${accept}" hidden>
      <p class="hint" style="margin-top:12px">${
        kind === "logo"
          ? "Transparent PNG or SVG works best. Vectors stay razor-sharp at any size."
          : "High-resolution photos print best. We recommend at least 1500&nbsp;px on the long edge."
      }</p>`;
  }

  function paneAI() {
    return `
      <div class="field">
        <label for="aiPrompt">Describe your design</label>
        <textarea class="textarea" id="aiPrompt" placeholder="Vintage mountain logo with pine trees"></textarea>
      </div>
      <button class="btn btn-primary btn-block" id="aiGenBtn">Generate</button>
      <div id="aiResults" style="margin-top:16px"></div>
      <p class="hint" style="margin-top:12px">Generated artwork drops straight into the editor — resize, move and combine it with text.</p>`;
  }

  function paneTemplates() {
    return `<div class="template-grid">${D.templates
      .map((t) => `<button class="template-card" data-tmpl="${t.id}" aria-label="${t.name}">${t.svg}</button>`)
      .join("")}</div>`;
  }

  function paneFinishing() {
    const finishes = (product.finishes || [])
      .map(
        (f, i) =>
          `<button class="pill" data-finish="${f.id}" aria-pressed="${i === 0}">${f.name}${
            f.surcharge ? ` +${D.pricing.money(f.surcharge)}` : ""
          }</button>`
      )
      .join("");
    const addons = (product.addons || [])
      .map(
        (a) =>
          `<label style="display:flex;align-items:center;gap:10px;font-size:14px;margin-top:8px">
             <input type="checkbox" data-addon="${a.id}"> ${a.name} <span class="meta">+${D.pricing.money(a.surcharge)}</span>
           </label>`
      )
      .join("");
    return `
      <div class="field"><label>Finish</label><div class="pills" id="finishPills">${finishes}</div></div>
      ${addons ? `<div class="field"><label>Add-ons</label>${addons}</div>` : ""}`;
  }

  function wireModal() {
    editor = D.createEditor({
      canvasEl: $("#designCanvas"),
      product,
      store,
      callbacks: {
        onChange: onEditorChange,
        onSelection: onSelection,
        onZoom: (z) => {
          $("#zoomBadge").textContent = Math.round(z * 100) + "%";
        },
      },
    });
    $("#stageSilhouette").innerHTML = D.renderSilhouette(product.id, colorHex(store.get().colorId), true);

    $("#modalRoot")
      .querySelectorAll("[data-close]")
      .forEach((b) => (b.onclick = closeModal));

    if (!editor) {
      $("#stageEmpty").innerHTML =
        "The design editor needs to load its canvas engine.<br>Check your connection and reopen Customize.";
      $("#stageEmpty").style.opacity = "1";
      $("#priceToggle").onclick = null;
      $("#applyBtn").disabled = true;
      return;
    }

    $("#modalRoot")
      .querySelectorAll(".mode-btn")
      .forEach((btn) => {
        btn.onclick = () => selectMode(btn.dataset.mode);
      });

    $("#modalRoot")
      .querySelectorAll(".area-tab")
      .forEach((tab) => {
        tab.onclick = () => selectArea(tab.dataset.area);
      });

    $("#modalRoot")
      .querySelectorAll(".tool-btn")
      .forEach((btn) => {
        btn.onclick = () => toolAction(btn.dataset.act);
      });

    $("#addTextBtn").onclick = () => {
      const v = $("#txtInput").value.trim();
      if (!v) {
        toast("Type something first");
        $("#txtInput").focus();
        return;
      }
      editor.addText(v, currentTextStyle());
      $("#txtInput").value = "";
    };
    $("#fontGrid")
      .querySelectorAll(".font-chip")
      .forEach((c) => {
        c.onclick = () => {
          pressOne("#fontGrid", c);
          editor.styleSelected({ fontFamily: c.dataset.font });
        };
      });
    $("#textColors")
      .querySelectorAll(".color-dot")
      .forEach((c) => {
        c.onclick = () => {
          pressOne("#textColors", c);
          editor.styleSelected({ fill: c.dataset.color });
        };
      });
    $("#fontSize").oninput = (e) => {
      $("#fontSizeVal").textContent = e.target.value;
      editor.styleSelected({ fontSize: parseInt(e.target.value, 10) });
    };
    $("#modalRoot")
      .querySelectorAll(".emoji-btn")
      .forEach((b) => {
        b.onclick = () => editor.addText(b.dataset.emoji, { fontSize: 80 });
      });

    ["logo", "photo"].forEach(wireUpload);

    $("#aiGenBtn").onclick = runAI;

    $("#modalRoot")
      .querySelectorAll(".template-card")
      .forEach((card) => {
        card.onclick = async () => {
          const t = D.templates.find((x) => x.id === card.dataset.tmpl);
          await editor.addSVG(t.svg, t.name);
          toast(`${t.name} added`);
        };
      });

    $("#finishPills") &&
      $("#finishPills")
        .querySelectorAll(".pill")
        .forEach((p) => {
          p.onclick = () => {
            pressOne("#finishPills", p);
            store.set({ finishId: p.dataset.finish });
            refreshPricing();
          };
        });
    $("#modalRoot")
      .querySelectorAll("[data-addon]")
      .forEach((cb) => {
        cb.onchange = () => {
          const s = store.get();
          const set = new Set(s.addons);
          cb.checked ? set.add(cb.dataset.addon) : set.delete(cb.dataset.addon);
          store.set({ addons: set });
          refreshPricing();
        };
      });

    $("#priceToggle").onclick = () => {
      const bd = $("#priceBreakdown");
      const open = bd.classList.toggle("open");
      $("#priceToggle").setAttribute("aria-expanded", String(open));
    };

    $("#applyBtn").onclick = onAddToCart;

    document.addEventListener("keydown", editor.keyHandler);

    refreshPricing();
    updateLayers();
    updateAreaCounts();
    selectMode("text");
  }

  function currentTextStyle() {
    const font = $("#fontGrid .font-chip[aria-pressed='true']");
    const color = $("#textColors .color-dot[aria-pressed='true']");
    return {
      fontFamily: font ? font.dataset.font : FONTS[0].stack,
      fill: color ? color.dataset.color : "#1d1d1f",
      fontSize: parseInt($("#fontSize").value, 10) || 46,
    };
  }

  function wireUpload(kind) {
    const drop = $(`[data-drop="${kind}"]`);
    const input = $(`[data-file="${kind}"]`);
    drop.onclick = () => input.click();
    drop.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        input.click();
      }
    };
    ["dragenter", "dragover"].forEach((ev) =>
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        drop.classList.add("drag");
      })
    );
    ["dragleave", "drop"].forEach((ev) =>
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        drop.classList.remove("drag");
      })
    );
    drop.addEventListener("drop", (e) => {
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    input.onchange = (e) => {
      if (e.target.files[0]) handleFile(e.target.files[0]);
      input.value = "";
    };
  }

  async function handleFile(file) {
    const MAX = 20 * 1024 * 1024;
    if (file.size > MAX) return toast("File is larger than 20 MB");
    const ext = file.name.split(".").pop().toLowerCase();
    const _asset = { name: file.name, type: file.type, size: file.size };
    uploadedAssets.push(_asset);
    uploadToCloudinary(file, file.name).then((url) => { if (url) _asset.url = url; });
    toast(`Adding ${file.name}…`);
    try {
      if (ext === "svg") {
        const text = await file.text();
        await editor.addSVG(text, file.name);
      } else if (ext === "pdf") {
        await addPDF(file);
      } else {
        const url = await readAsDataURL(file);
        await editor.addImageFromURL(url, { kind: "upload", name: file.name });
      }
      toast(`${file.name} added`);
    } catch (err) {
      console.error(err);
      toast("Couldn't read that file");
    }
  }

  function readAsDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  async function addPDF(file) {
    try {
      const pdfjs = await loadPdfJs();
      const buf = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buf }).promise;
      const page = await doc.getPage(1);
      const viewport = page.getViewport({ scale: 2 });
      const c = document.createElement("canvas");
      c.width = viewport.width;
      c.height = viewport.height;
      await page.render({ canvasContext: c.getContext("2d"), viewport }).promise;
      await editor.addImageFromURL(c.toDataURL("image/png"), { kind: "pdf", name: file.name });
    } catch (e) {
      console.warn("pdf.js unavailable, storing PDF as attached asset", e);
      const svg = `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="192" height="112" rx="10" fill="#f5f5f7" stroke="#d2d2d7"/>
        <text x="100" y="56" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#d70015" font-weight="700">PDF</text>
        <text x="100" y="82" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6e6e73">${escapeHtml(file.name).slice(0, 22)}</text>
      </svg>`;
      await editor.addSVG(svg, file.name);
    }
  }

  let pdfJsPromise = null;
  function loadPdfJs() {
    if (root.pdfjsLib) return Promise.resolve(root.pdfjsLib);
    if (pdfJsPromise) return pdfJsPromise;
    pdfJsPromise = new Promise((res, rej) => {
      const CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174";
      const s = document.createElement("script");
      s.src = `${CDN}/pdf.min.js`;
      s.onload = () => {
        root.pdfjsLib.GlobalWorkerOptions.workerSrc = `${CDN}/pdf.worker.min.js`;
        res(root.pdfjsLib);
      };
      s.onerror = rej;
      document.head.appendChild(s);
    });
    return pdfJsPromise;
  }

  async function runAI() {
    const prompt = $("#aiPrompt").value.trim();
    if (!prompt) {
      toast("Describe your design first");
      return;
    }
    const btn = $("#aiGenBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span> Generating';
    $("#aiResults").innerHTML =
      '<p class="hint">Dreaming up your artwork…</p>';
    try {
      const art = await D.generateAI(prompt);
      $("#aiResults").innerHTML = `
        <div class="template-grid">
          <button class="template-card" id="aiUse" aria-label="Use generated art">${art.svg}</button>
        </div>
        <p class="hint" style="margin-top:8px">Motif: ${art.motif}. Tap the artwork to place it, or generate again.</p>`;
      $("#aiUse").onclick = async () => {
        await editor.addSVG(art.svg, art.name);
        toast("AI artwork added");
      };
    } catch (e) {
      $("#aiResults").innerHTML = '<p class="hint">Generation failed. Try again.</p>';
    } finally {
      btn.disabled = false;
      btn.textContent = "Generate";
    }
  }

  function selectMode(mode) {
    $("#modalRoot")
      .querySelectorAll(".mode-btn")
      .forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === mode)));
    $("#modalRoot")
      .querySelectorAll(".panel-pane")
      .forEach((p) => p.classList.toggle("active", p.dataset.pane === mode));
  }

  function selectArea(areaId) {
    editor.setActiveArea(areaId);
    $("#modalRoot")
      .querySelectorAll(".area-tab")
      .forEach((t) => {
        const on = t.dataset.area === areaId;
        t.setAttribute("aria-selected", String(on));
        const existing = t.querySelector(".area-tab-bg");
        if (on && !existing) t.appendChild(el("span", "area-tab-bg"));
        if (!on && existing) existing.remove();
      });
    const frame = $("#canvasFrame");
    if (frame) {
      frame.style.opacity = "0";
      setTimeout(() => (frame.style.opacity = "1"), 90);
    }
  }

  function toolAction(act) {
    switch (act) {
      case "undo": editor.undo(); break;
      case "redo": editor.redo(); break;
      case "dup": editor.duplicate(); break;
      case "rotate": editor.rotateSelected(15); break;
      case "del": editor.removeSelected(); break;
      case "alignL": editor.align("left"); break;
      case "alignR": editor.align("right"); break;
      case "alignT": editor.align("top"); break;
      case "alignB": editor.align("bottom"); break;
      case "center": editor.snapCenter(); break;
      case "zoomIn": editor.zoomIn(); break;
      case "zoomOut": editor.zoomOut(); break;
    }
  }

  function onEditorChange(info) {
    const s = store.get();
    s.areas[info.areaId].objectCount = info.objectCount;
    $("#stageEmpty").style.opacity = info.objectCount ? "0" : "1";
    setDisabled("undo", !info.canUndo);
    setDisabled("redo", !info.canRedo);
    updateAreaCounts();
    updateLayers();
    refreshPricing();
    updateCustomizeSummary();
    updatePagePrice();
  }

  function onSelection(obj) {
    const hasSel = !!obj;
    ["dup", "rotate", "del", "alignL", "alignR", "alignT", "alignB", "center"].forEach((a) =>
      setDisabled(a, !hasSel)
    );
    updateLayers();
    if (obj && obj.dynamicKind === "text") {
      if (obj.fill) markPressed("#textColors", "[data-color]", obj.fill);
      if (obj.fontFamily) markPressed("#fontGrid", "[data-font]", obj.fontFamily);
      if (obj.fontSize) {
        $("#fontSize").value = obj.fontSize;
        $("#fontSizeVal").textContent = Math.round(obj.fontSize);
      }
      selectMode("text");
    }
  }

  function setDisabled(act, val) {
    const b = $(`.tool-btn[data-act="${act}"]`);
    if (b) b.disabled = val;
  }

  function updateAreaCounts() {
    const s = store.get();
    Object.keys(s.areas).forEach((k) => {
      const badge = $(`.area-count[data-count="${k}"]`);
      if (badge) {
        const n = s.areas[k].objectCount;
        badge.textContent = n ? ` · ${n}` : "";
      }
    });
  }

  function updateLayers() {
    const host = $("#layersSection");
    if (!host || !editor) return;
    const objs = editor.listObjects().slice().reverse();
    const activeObj = editor.getActive();
    if (!objs.length) {
      host.innerHTML = `<label style="font-size:12px;font-weight:600;color:var(--ink-soft)">Layers</label><p class="hint" style="margin-top:6px">Nothing on this area yet.</p>`;
      return;
    }
    host.innerHTML = `<label style="font-size:12px;font-weight:600;color:var(--ink-soft);display:block;margin-bottom:8px">Layers · ${objs.length}</label><div class="layer-list"></div>`;
    const list = host.querySelector(".layer-list");
    objs.forEach((o) => {
      const isText = o.dynamicKind === "text";
      const row = el("div", "layer" + (o === activeObj ? " sel" : ""));
      row.innerHTML = `<span class="layer-ico">${isText ? ICONS.layerText : ICONS.layerImg}</span>
        <span class="layer-name">${escapeHtml(o.name || (isText ? o.text : "Layer"))}</span>
        <button class="layer-del" aria-label="Delete layer">${ICONS.del}</button>`;
      row.querySelector(".layer-name").onclick = () => editor.selectObject(o);
      row.querySelector(".layer-ico").onclick = () => editor.selectObject(o);
      row.querySelector(".layer-del").onclick = (e) => {
        e.stopPropagation();
        editor.selectObject(o);
        editor.removeSelected();
      };
      list.appendChild(row);
    });
  }

  function refreshPricing() {
    const p = D.pricing.compute(product, store.get());
    currentPricing = p;
    $("#modalTotal").textContent = p.format(p.total);
    $("#priceList").innerHTML = p.items
      .map(
        (i) =>
          `<li><span>${escapeHtml(i.label)}</span><span class="${i.kind === "free" ? "free" : ""}">${
            i.kind === "free" ? "Free" : "+" + p.format(i.amount).replace("$", "$")
          }</span></li>`
      )
      .join("") +
      (p.quantity > 1
        ? `<li style="border-top:1px solid var(--line-soft);margin-top:6px;padding-top:8px"><span>× ${p.quantity} qty</span><span>${p.format(p.total)}</span></li>`
        : "");
  }

  async function onAddToCart() {
    const btn = $("#applyBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span> Saving';
    try {
      const props = {};
      for (const a of product.areas) {
        const st = store.get().areas[a.id];
        if (st && st.objectCount > 0) {
          const url = await uploadToCloudinary(dataURLtoBlob(editor.exportAreaPNG(a.id, 3)), product.id + "-" + a.id + ".png");
          props[a.label + " artwork"] = url || "(will be sent to print)";
        }
      }
      const fileUrls = (uploadedAssets || []).map((x) => x.url).filter(Boolean);
      if (fileUrls.length) props["Uploaded files"] = fileUrls.join("  |  ");
      const compUrl = await uploadToCloudinary(dataURLtoBlob(editor.exportCompositePNG()), product.id + "-preview.png");
      if (compUrl) props["_preview_url"] = compUrl;
      const decorated = product.areas
        .filter((a) => { const st = store.get().areas[a.id]; return st && st.objectCount > 0; })
        .map((a) => a.label);
      props["Customized"] = decorated.join(", ") || "None";

      root.Dynamic.lastOrder = { properties: props };
      console.groupCollapsed("%c[Dynamic] Add to Cart", "color:#0071e3;font-weight:600");
      console.log(props);
      console.groupEnd();

      updateCustomizeSummary();
      const ok = await submitToShopify(props);
      if (ok) { closeModal(); toast("Added to Bag"); }
    } catch (e) {
      console.error(e);
      toast("Something went wrong saving your design");
    } finally {
      btn.disabled = false;
      btn.textContent = "Add to Cart";
    }
  }

  function openModal() {
    const rootEl = $("#modalRoot");
    rootEl.classList.add("open");
    modalOpen = true;
    document.body.classList.add("no-scroll");
    // Show the currently-selected variant colour (in case it changed since the
    // modal was built) — the editor image follows the chosen colour.
    const efImg = rootEl.querySelector(".engrave-frame > img");
    if (efImg) { const fi = sideImage(currentSide || "front"); if (fi) efImg.src = fi; }
    const stImg = rootEl.querySelector("#stageProduct img, .up-stage img");
    if (stImg && product && product.image) stImg.src = product.image;
    rootEl.onclick = (e) => { if (!e.target.closest(".modal-sheet")) closeModal(); };
    const sheet = $(".modal-sheet");
    const scrim = $(".modal-scrim");
    if (root.gsap) {
      root.gsap.to(scrim, { opacity: 1, duration: 0.3, ease: "power2.out" });
      root.gsap.fromTo(
        sheet,
        { opacity: 0, y: 28, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }
      );
    } else {
      scrim.style.transition = "opacity .3s";
      sheet.style.transition = "opacity .45s cubic-bezier(.16,1,.3,1), transform .45s cubic-bezier(.16,1,.3,1)";
      requestAnimationFrame(() => {
        scrim.style.opacity = "1";
        sheet.style.opacity = "1";
        sheet.style.transform = "none";
      });
    }
    setTimeout(() => $(".modal-close") && $(".modal-close").focus(), 60);
  }

  function closeModal() {
    if (!modalOpen) return;
    modalOpen = false;
    const rootEl = $("#modalRoot");
    const sheet = $(".modal-sheet");
    const scrim = $(".modal-scrim");
    document.querySelectorAll(".pa-readout").forEach((e) => e.remove());
    const done = () => {
      rootEl.classList.remove("open");
      modalOpen = false;
      document.body.classList.remove("no-scroll");
      $("#customizeBtn") && $("#customizeBtn").focus();
    };
    if (root.gsap) {
      root.gsap.to(scrim, { opacity: 0, duration: 0.28 });
      root.gsap.to(sheet, {
        opacity: 0,
        y: 24,
        scale: 0.99,
        duration: 0.32,
        ease: "power2.in",
        onComplete: done,
      });
    } else {
      sheet.style.opacity = "0";
      sheet.style.transform = "translateY(24px) scale(.99)";
      scrim.style.opacity = "0";
      setTimeout(done, 300);
    }
  }

  function pressOne(scope, btn) {
    $(scope)
      .querySelectorAll("[aria-pressed]")
      .forEach((b) => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
  }
  function markPressed(scope, sel, value) {
    const host = $(scope);
    if (!host) return;
    host.querySelectorAll(sel).forEach((b) => {
      const key = b.dataset.color || b.dataset.font;
      b.setAttribute("aria-pressed", String(key === value));
    });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  let toastTimer;
  function toast(msg) {
    let host = $(".toast-host");
    if (!host) {
      host = el("div", "toast-host");
      document.body.appendChild(host);
    }
    const t = el("div", "toast", escapeHtml(msg));
    host.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastTimer);
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 400);
    }, 2400);
  }

  function patchProductFromSettings(p) {
    const S = window.DYN_SETTINGS || {};
    if (!p) return;
    const _shop = window.DYN_SHOPIFY || {};
    p.tagline = S.title || _shop.productTitle || p.tagline;
    p.name = S.eyebrow || "";
    if (S.description) { p.description = S.description; p._descHtml = false; }
    else if (_shop.productDescription) { p.description = _shop.productDescription; p._descHtml = true; }
    if (_shop.priceCents && _shop.priceCents > 0) {
      p.base = _shop.priceCents;            // real Shopify price (matches cart)
    } else if (S.price) {
      const m = String(S.price).match(/[\d.]+/);
      if (m) p.base = Math.round(parseFloat(m[0]) * 100);
    }
    const mainImg = S.mainImage || _shop.productMainImage || p.image;
    p.image = mainImg;
    if (p.colors && p.colors[0]) p.colors[0].image = mainImg;
    const settingsGallery = (S.gallery || []).filter(Boolean);
    const productGallery = (_shop.productImages || []).filter(Boolean);
    if (settingsGallery.length) {
      GAL_EXTRAS[p.id] = settingsGallery;
    } else if (productGallery.length) {
      GAL_EXTRAS[p.id] = productGallery.filter((u) => u !== mainImg);
    }
  }

  function applyDomSettings() {
    const S = window.DYN_SETTINGS || {};
    const setText = (sel, val) => { const el = document.querySelector(sel); if (el && val) el.textContent = val; };
    const setExact = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val || ""; };
    setExact("#colorName", S.modelLabel);
    setExact("#pPriceNote", S.priceNote);
    const _eb = document.querySelector("#pEyebrow");
    if (_eb) { _eb.textContent = S.eyebrow || ""; _eb.style.display = S.eyebrow ? "" : "none"; }
    setText("#customizeBtn", S.customizeLabel);
    setText("#pageAddCart", S.addcartLabel);
    const _shop = window.DYN_SHOPIFY || {};
    setText("#pPrice", _shop.priceMoney || S.price);
    const RZ = Array.isArray(S.reassure) ? S.reassure : [];
    const RI = Array.isArray(S.reassureIcons) ? S.reassureIcons : [];
    let shownRz = 0;
    ["0", "1", "2"].forEach((i) => {
      const item = document.querySelector('[data-reassure-item="' + i + '"]');
      const span = document.querySelector('[data-reassure="' + i + '"]');
      if (!item || !span) return;
      const ic = document.querySelector('[data-reassure-ic="' + i + '"]');
      const iconKey = RI[+i];
      if (ic && iconKey && TRUST_ICONS[iconKey]) {
        ic.innerHTML = '<svg viewBox="0 0 24 24" fill="none">' + TRUST_ICONS[iconKey] + '</svg>';
      }
      const val = RZ[+i];
      if (val === "") { item.style.display = "none"; }
      else { if (val != null) span.textContent = val; item.style.display = ""; shownRz++; }
    });
    const rzRow = document.querySelector(".reassure");
    if (rzRow) rzRow.style.display = shownRz ? "" : "none";
  }
  const TRUST_ICONS = {
    truck: '<path d="M3 7h13v8H3z" stroke-width="1.5"></path><path d="M16 10h3l2 3v2h-5" stroke-width="1.5"></path><circle cx="7" cy="17" r="1.6" stroke-width="1.5"></circle><circle cx="17" cy="17" r="1.6" stroke-width="1.5"></circle>',
    clock: '<circle cx="12" cy="12" r="8" stroke-width="1.5"></circle><path d="M12 8v4l3 2" stroke-width="1.5"></path>',
    check: '<path d="m5 13 4 4 10-10" stroke-width="1.5"></path>',
    shield: '<path d="M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6l7-3Z" stroke-width="1.5"></path>',
    returns: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" stroke-width="1.5"></path><path d="M20 3v5h-5" stroke-width="1.5"></path><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" stroke-width="1.5"></path><path d="M4 21v-5h5" stroke-width="1.5"></path>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1" stroke-width="1.5"></rect><path d="M4 13h16M12 9v11" stroke-width="1.5"></path><path d="M12 9C10.3 9 8.5 8 8.5 6.2A2 2 0 0 1 12 5a2 2 0 0 1 3.5 1.2C15.5 8 13.7 9 12 9Z" stroke-width="1.5"></path>',
    star: '<path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.7l5.4-.8Z" stroke-width="1.5"></path>',
    heart: '<path d="M12 20s-7-4.5-7-9a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 4.5-7 9-7 9Z" stroke-width="1.5"></path>',
    tag: '<path d="M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8-8-8Z" stroke-width="1.5"></path><circle cx="8.5" cy="8.5" r="1.2" stroke-width="1.5"></circle>',
    leaf: '<path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14Z" stroke-width="1.5"></path><path d="M5 19c3-5 7-7 10-8" stroke-width="1.5"></path>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="1.5" stroke-width="1.5"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke-width="1.5"></path>',
    badge: '<circle cx="12" cy="9" r="5" stroke-width="1.5"></circle><path d="M9 13.2 7.5 21l4.5-2.6L16.5 21 15 13.2" stroke-width="1.5"></path>'
  };

  // Finished-product sample button + popup — injected into whichever modal is
  // open, so it works for every customizer style (upload, engrave, and multi-mode).
  function installSampleButton() {
    const S = window.DYN_SETTINGS || {};
    if (!S.sampleImage) return;
    const root = document.querySelector("#modalRoot");
    if (!root || root.querySelector("#sampleBtn")) return;
    const label = S.sampleButtonLabel || "See a finished sample";
    const caption = S.sampleCaption || "How your finished product will look";
    const row = document.createElement("div");
    row.className = "engrave-sample-row";
    row.innerHTML = '<button type="button" class="sample-btn" id="sampleBtn">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 15l5-4 4 3 3-2 6 5"/><circle cx="8.5" cy="9" r="1.4"/></svg>' +
      '<span>' + escapeHtml(label) + '</span></button>';
    const anchor = root.querySelector(".engrave-stage") || root.querySelector(".stage");
    if (anchor) anchor.insertAdjacentElement("afterend", row);
    else { const sheet = root.querySelector(".modal-sheet"); if (sheet) sheet.appendChild(row); else return; }
    const lb = document.createElement("div");
    lb.className = "sample-lightbox"; lb.id = "sampleLightbox"; lb.setAttribute("aria-hidden", "true");
    lb.innerHTML = '<div class="sample-lightbox-scrim" data-sample-close></div>' +
      '<figure class="sample-lightbox-fig">' +
        '<button type="button" class="sample-lightbox-close" data-sample-close aria-label="Close">✕</button>' +
        '<img id="sampleShot" src="' + S.sampleImage + '" alt="Finished product example">' +
        (caption ? '<figcaption>' + escapeHtml(caption) + '</figcaption>' : '') +
      '</figure>';
    // Keep clicks inside the popup from bubbling to the modal's click-outside-to-close.
    lb.addEventListener("click", function (e) { e.stopPropagation(); });
    root.appendChild(lb);
    // Show the sample for the side the customer is currently on (Front vs Back).
    root.querySelector("#sampleBtn").onclick = function () {
      const onBack = (currentSide === "back");
      const shot = lb.querySelector("#sampleShot");
      if (shot) shot.src = (onBack && S.sampleImage2) ? S.sampleImage2 : S.sampleImage;
      lb.classList.add("open"); lb.setAttribute("aria-hidden", "false");
    };
    const closeLb = function () { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); };
    lb.querySelectorAll("[data-sample-close]").forEach(function (el) { el.onclick = closeLb; });
  }

  function loadProduct(id) {
    product = D.getProduct(id);
    patchProductFromSettings(product);
    store = D.createStore(D.initState(product));
    unsubStore && unsubStore();
    renderProductPage();
    if (product.uploadMode) buildUploadModal();
    else if (product.engraving) buildEngraveModal();
    else buildModal();
    installSampleButton();
    applyDomSettings();
    document.querySelectorAll("[data-product]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.product === id))
    );
  }

  root.Dynamic.setVariation = function (id) {
    if (!product) return false;
    const col = (product.colors || []).find((c) => c.id === id);
    if (!col) return false;
    store.set({ colorId: id });
    renderProductPage();
    const cn = document.querySelector("#colorName");
    if (cn) cn.textContent = col.name;
    const im = document.querySelector(".engrave-frame img");
    const fimg = sideImage(currentSide || "front");
    if (im && fimg) im.src = fimg;
    return true;
  };

  function init() {
    document.querySelectorAll("[data-product]").forEach((b) => {
      b.onclick = () => loadProduct(b.dataset.product);
    });
    const qtyInput = $("#qtyInput");
    $("#qtyMinus").onclick = () => setQty(store.get().quantity - 1);
    $("#qtyPlus").onclick = () => setQty(store.get().quantity + 1);
    qtyInput.onchange = () => setQty(parseInt(qtyInput.value, 10) || 1);
    function setQty(n) {
      n = Math.max(1, Math.min(999, n));
      store.set({ quantity: n });
      qtyInput.value = n;
      updatePagePrice();
      if (modalOpen) refreshPricing();
    }
    $("#customizeBtn").onclick = openModal;
    mountGiftOptions();
    wireWishButton();
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalOpen) { closeModal(); return; }
      if (!modalOpen) return;
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      const ae = document.activeElement;
      if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) return;
      if (activeLayerId == null) return;
      e.preventDefault();
      removeLayer(activeLayerId);
    });

    function wireWishButton() {
      const btn = document.getElementById("wishBtn");
      if (!btn) return;
      const S = window.DYN_SHOPIFY || {};
      const SET = window.DYN_SETTINGS || {};
      const KEY = "dyn_wishlist";
      const id = S.productHandle || S.productUrl || (location.pathname) || (SET.title || "product");
      function read() { try { const a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
      function write(l) { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} try { window.dispatchEvent(new CustomEvent("dyn-wishlist-change")); } catch (e) {} }
      function has() { return read().some((x) => String(x.id) === String(id)); }
      function item() {
        const p = (typeof product !== "undefined" && product) ? product : {};
        return {
          id: id,
          title: (p.tagline || S.productTitle || document.querySelector("#pName") && document.querySelector("#pName").textContent || "Product"),
          url: S.productUrl || location.pathname,
          image: S.productMainImage || (p.image || ""),
          price: S.priceMoney || (document.querySelector("#pPrice") && document.querySelector("#pPrice").textContent) || ""
        };
      }
      function paint() {
        const on = has();
        btn.classList.toggle("is-saved", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.setAttribute("aria-label", on ? "Remove from wishlist" : "Save to wishlist");
        btn.setAttribute("title", on ? "Saved to wishlist" : "Save to wishlist");
      }
      btn.addEventListener("click", () => {
        if (window.DynWishlist && window.DynWishlist.toggle) { window.DynWishlist.toggle(item()); }
        else { const l = read(); const i = l.findIndex((x) => String(x.id) === String(id)); if (i >= 0) l.splice(i, 1); else l.unshift(item()); write(l); }
        paint();
      });
      window.addEventListener("dyn-wishlist-change", paint);
      window.addEventListener("storage", (e) => { if (e.key === KEY) paint(); });
      paint();
    }

    $("#galPrev") && ($("#galPrev").onclick = () => galMove(-1));
    $("#galNext") && ($("#galNext").onclick = () => galMove(1));
    const row = $("#galleryRow");
    if (row) {
      const srcs = [].slice.call(row.querySelectorAll("img")).map((im) => im.getAttribute("src"));
      row.querySelectorAll("img").forEach((im, i) => {
        im.style.cursor = "zoom-in";
        im.onclick = () => openLightbox(srcs, i);
      });
      const step = () => Math.max(260, row.clientWidth * 0.8);
      $("#stripPrev") && ($("#stripPrev").onclick = () => row.scrollBy({ left: -step(), behavior: "smooth" }));
      $("#stripNext") && ($("#stripNext").onclick = () => row.scrollBy({ left: step(), behavior: "smooth" }));
    }
    document.addEventListener("keydown", (e) => {
      if (!lbEl || !lbEl.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") lbMove(-1);
      else if (e.key === "ArrowRight") lbMove(1);
    });

    loadProduct((window.DYN_SETTINGS && window.DYN_SETTINGS.customizerType) || "uv");
    maybeEditMode();
  }

  root.Dynamic.mountApp = init;
})(window);

(function () {
  var drawer, overlay, itemsEl, footEl;
  var lastCart = null, inFlight = false, pending = null;
  function fmt(cents, cur) {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: cur || "USD" }).format((cents || 0) / 100); }
    catch (e) { return "$" + ((cents || 0) / 100).toFixed(2); }
  }
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function build() {
    if (drawer) return;
    overlay = document.createElement("div");
    overlay.className = "dyn-cart-overlay"; overlay.setAttribute("data-cart-close", "");
    drawer = document.createElement("aside");
    drawer.className = "dyn-cart"; drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-label", "Shopping bag"); drawer.setAttribute("aria-hidden", "true");
    drawer.innerHTML =
      '<div class="dyn-cart-head"><h3>Your Bag</h3><button class="dyn-cart-close" data-cart-close aria-label="Close">✕</button></div>' +
      '<div class="dyn-cart-items" id="dynCartItems"><div class="dyn-cart-loading">Loading…</div></div>' +
      '<div class="dyn-cart-foot" id="dynCartFoot"></div>';
    document.body.appendChild(overlay); document.body.appendChild(drawer);
    itemsEl = drawer.querySelector("#dynCartItems"); footEl = drawer.querySelector("#dynCartFoot");
    overlay.addEventListener("click", close);
    drawer.addEventListener("click", function (e) { if (e.target.closest("[data-cart-close]")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("open")) close(); });
  }
  function open() { build(); overlay.classList.add("open"); drawer.classList.add("open"); drawer.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
  function close() { if (!drawer) return; overlay.classList.remove("open"); drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }

  function setCount(n) {
    document.querySelectorAll("[data-cart-count]").forEach(function (b) {
      b.textContent = n; if (n > 0) b.removeAttribute("hidden"); else b.setAttribute("hidden", "");
    });
  }

  function render(cart) {
    build();
    lastCart = cart;
    var cur = cart.currency;
    if (!cart.items || !cart.items.length) {
      itemsEl.innerHTML = '<div class="dyn-cart-empty">Your bag is empty.</div>'; footEl.innerHTML = ""; return;
    }
    var items = cart.items;
    var isFee = function (it) { return !!(it.properties && it.properties._grp && !it.properties._design_state && !it.properties._design_id); };
    var feeByGrp = {}, mainGrps = {};
    items.forEach(function (it) { if (isFee(it) && it.properties._grp) feeByGrp[it.properties._grp] = it; });
    items.forEach(function (it) { if (!isFee(it) && it.properties && it.properties._grp) mainGrps[it.properties._grp] = true; });
    itemsEl.innerHTML = items.map(function (it) {
      if (isFee(it) && it.properties._grp && mainGrps[it.properties._grp]) return "";
      var opts = [];
      if (it.variant_title && it.variant_title !== "Default Title") opts.push(esc(it.variant_title));
      (it.options_with_values || []).forEach(function (o) { if (o.value && o.value !== "Default Title") opts.push(esc(o.name) + ": " + esc(o.value)); });
      if (it.properties) Object.keys(it.properties).forEach(function (k) { if (k.charAt(0) !== "_" && it.properties[k]) opts.push(esc(k) + ": " + esc(it.properties[k])); });
      var grp = it.properties && it.properties._grp;
      var fee = (grp && !isFee(it)) ? feeByGrp[grp] : null;
      var feeNote = fee ? '<div class="ci-fee">+ ' + esc(fee.product_title) + " · " + fmt(fee.final_line_price, cur) + "</div>" : "";
      return '<div class="dyn-cart-item" data-key="' + esc(it.key) + '"' + (fee ? ' data-fee-key="' + esc(fee.key) + '"' : "") + ">" +
        (it.image ? '<img src="' + esc(it.image) + '" alt="">' : "<div></div>") +
        '<div><div class="ci-title">' + esc(it.product_title) + "</div>" +
        (opts.length ? '<div class="ci-opt">' + opts.join(" · ") + "</div>" : "") + feeNote +
        '<div class="dyn-cart-qty"><button data-dec aria-label="Decrease">−</button><span>' + it.quantity + '</span><button data-inc aria-label="Increase">+</button></div>' +
        '<button class="dyn-cart-remove" data-remove>Remove</button>' +
        "</div>" +
        '<div class="ci-price">' + fmt(it.final_line_price, cur) + "</div>" +
        "</div>";
    }).join("");
    footEl.innerHTML =
      '<div class="dyn-cart-subtotal"><span>Subtotal</span><span>' + fmt(cart.total_price, cur) + "</span></div>" +
      '<div class="dyn-cart-note">Shipping &amp; taxes calculated at checkout.</div>' +
      '<a class="btn btn-primary btn-block" href="/checkout">Checkout</a>' +
      '<a class="btn btn-ghost btn-block" href="' + ((window.DYN_SHOPIFY && window.DYN_SHOPIFY.cartUrl) || "/cart") + '">View full cart</a>';
    itemsEl.querySelectorAll(".dyn-cart-item").forEach(function (row) {
      var key = row.getAttribute("data-key"), feeKey = row.getAttribute("data-fee-key");
      var span = row.querySelector(".dyn-cart-qty span"), qty = parseInt(span ? span.textContent : "1", 10) || 0;
      var dec = row.querySelector("[data-dec]"), inc = row.querySelector("[data-inc]"), rm = row.querySelector("[data-remove]");
      var upd = function (q) { var o = {}; o[key] = q; if (feeKey) o[feeKey] = q; return o; };
      if (dec) dec.onclick = function () { applyUpdates(upd(Math.max(0, qty - 1))); };
      if (inc) inc.onclick = function () { applyUpdates(upd(qty + 1)); };
      if (rm) rm.onclick = function () { applyUpdates(upd(0)); };
    });
  }

  function refresh() {
    build();
    return fetch("/cart.js", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (cart) { setCount(cart.item_count); render(cart); return cart; })
      .catch(function (e) { console.warn("[Dynamic] cart refresh failed", e); });
  }
  function change(line, quantity) {
    if (itemsEl) itemsEl.style.opacity = "0.5";
    return fetch("/cart/change.js", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ line: line, quantity: quantity }) })
      .then(function (r) { return r.json(); })
      .then(function (cart) { if (itemsEl) itemsEl.style.opacity = ""; setCount(cart.item_count); render(cart); return cart; })
      .catch(function (e) { if (itemsEl) itemsEl.style.opacity = ""; console.warn(e); });
  }
  // Instant edits: patch the drawer immediately, then sync in one /cart/update.js
  // call (item + its back-fee line together). `updates` = { "<key>": quantity }.
  function applyUpdates(updates) {
    if (lastCart && lastCart.items) {
      var kept = [];
      lastCart.items.forEach(function (it) {
        if (Object.prototype.hasOwnProperty.call(updates, it.key)) {
          var q = updates[it.key];
          if (q <= 0) return;
          it.quantity = q;
          if (typeof it.final_price === "number") it.final_line_price = it.final_price * q;
        }
        kept.push(it);
      });
      lastCart.items = kept;
      lastCart.item_count = kept.reduce(function (n, it) { return n + (it.quantity || 0); }, 0);
      lastCart.total_price = kept.reduce(function (s, it) { return s + (it.final_line_price || 0); }, 0);
      setCount(lastCart.item_count); render(lastCart);
    }
    if (inFlight) { pending = Object.assign(pending || {}, updates); return; }
    sendUpdates(updates);
  }
  function sendUpdates(updates) {
    inFlight = true;
    fetch("/cart/update.js", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ updates: updates }) })
      .then(function (r) { return r.json(); })
      .then(function (cart) { if (!pending && cart && cart.items != null) { setCount(cart.item_count); render(cart); } })
      .catch(function () { refresh(); })
      .then(function () { inFlight = false; if (pending) { var u = pending; pending = null; sendUpdates(u); } });
  }

  function patchFetch() {
    if (window.__dynCartFetchPatched || !window.fetch) return; window.__dynCartFetchPatched = true;
    var _f = window.fetch;
    window.fetch = function (input) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var p = _f.apply(this, arguments);
      if (/\/cart\/(add|update|clear)(\.js)?/.test(url)) { p.then(function () { setTimeout(refresh, 80); }).catch(function () {}); }
      return p;
    };
  }

  function init() {
    build(); patchFetch();
    var c = document.querySelector("[data-cart]");
    if (c) c.addEventListener("click", function (e) { e.preventDefault(); open(); refresh(); });
    refresh();
  }
  window.DynamicCart = { init: init, open: open, close: close, refresh: refresh };
})();

(function(){
  function boot(){
    document.querySelectorAll('[data-asset]').forEach(function(e){ e.src = DYNasset(e.getAttribute('data-asset')); });

    var t=0;(function w(){
      if((window.fabric && window.Dynamic && window.Dynamic.mountApp) || t>150){
        if(window.Dynamic && window.Dynamic.mountApp) window.Dynamic.mountApp();
        if(window.DynamicCart) window.DynamicCart.init();
      } else { t++; setTimeout(w,60); }
    })();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
