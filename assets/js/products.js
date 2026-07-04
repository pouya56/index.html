/* ============================================================================
   products.js — Product catalog, print-area geometry & pricing rules.

   The whole platform is data-driven: adding a product here makes it fully
   customizable with correct print areas, colours, sizes and pricing. This is
   the single source of truth the editor, preview and pricing engine read from.
   ========================================================================== */
(function (root) {
  "use strict";

  /**
   * Each product defines:
   *  - base:        base price in cents
   *  - colors:      selectable body colours (affects preview + swatches)
   *  - sizes:       optional size options (null = none, e.g. mugs)
   *  - areas:       ordered print areas. Each area has an id, label, a
   *                 normalized print rectangle {x,y,w,h} (0..1 of the canvas)
   *                 and a per-area surcharge in cents (first used area is free).
   *  - finishes:    optional print finishes with surcharges (e.g. gold foil)
   *  - addons:      optional product add-ons (e.g. gift box)
   *  - render:      a function (color) -> SVG string for the product silhouette.
   *
   * Geometry is normalized so the same design JSON renders identically at any
   * canvas resolution and maps cleanly onto a physical print template.
   */

  const SIZES_APPAREL = ["XS", "S", "M", "L", "XL", "2XL"];

  const catalog = {
    mug: {
      id: "mug",
      name: "Ceramic Mug",
      tagline: "Personalized Ceramic Mug",
      description:
        "A 325 ml kiln-fired ceramic mug with an ultra-smooth print surface. Dishwasher and microwave safe.",
      base: 2000,
      colors: [
        { id: "white", name: "White", hex: "#ffffff" },
        { id: "black", name: "Black", hex: "#1d1d1f" },
        { id: "sage", name: "Sage", hex: "#b7c4b0" },
        { id: "blush", name: "Blush", hex: "#e8cdc9" },
      ],
      sizes: null,
      areas: [
        { id: "front", label: "Front", rect: { x: 0.28, y: 0.26, w: 0.44, h: 0.48 }, surcharge: 0 },
        { id: "back", label: "Back", rect: { x: 0.28, y: 0.26, w: 0.44, h: 0.48 }, surcharge: 500 },
        { id: "wrap", label: "Wrap Around", rect: { x: 0.12, y: 0.26, w: 0.76, h: 0.48 }, surcharge: 800 },
      ],
      finishes: [
        { id: "standard", name: "Standard Print", surcharge: 0 },
        { id: "gold", name: "Gold Metallic Print", surcharge: 700 },
      ],
      addons: [{ id: "giftbox", name: "Premium Gift Box", surcharge: 800 }],
    },

    tshirt: {
      id: "tshirt",
      name: "T-Shirt",
      tagline: "Custom Cotton T-Shirt",
      description:
        "220 gsm combed ring-spun cotton with a soft hand-feel and durable direct-to-garment print.",
      base: 2400,
      colors: [
        { id: "white", name: "White", hex: "#ffffff" },
        { id: "black", name: "Black", hex: "#1d1d1f" },
        { id: "navy", name: "Navy", hex: "#25324a" },
        { id: "sand", name: "Sand", hex: "#d9cbb2" },
      ],
      sizes: SIZES_APPAREL,
      areas: [
        { id: "front", label: "Front", rect: { x: 0.30, y: 0.28, w: 0.40, h: 0.42 }, surcharge: 0 },
        { id: "back", label: "Back", rect: { x: 0.30, y: 0.26, w: 0.40, h: 0.46 }, surcharge: 600 },
        { id: "sleeve_l", label: "Left Sleeve", rect: { x: 0.10, y: 0.30, w: 0.12, h: 0.14 }, surcharge: 400 },
        { id: "sleeve_r", label: "Right Sleeve", rect: { x: 0.78, y: 0.30, w: 0.12, h: 0.14 }, surcharge: 400 },
      ],
      finishes: [
        { id: "standard", name: "Standard DTG", surcharge: 0 },
        { id: "puff", name: "Puff Print", surcharge: 500 },
      ],
      addons: [{ id: "giftbox", name: "Premium Gift Box", surcharge: 800 }],
    },

    hoodie: {
      id: "hoodie",
      name: "Hoodie",
      tagline: "Heavyweight Custom Hoodie",
      description: "400 gsm brushed-back fleece with a double-layer hood and kangaroo pocket.",
      base: 4800,
      colors: [
        { id: "black", name: "Black", hex: "#1d1d1f" },
        { id: "heather", name: "Heather Grey", hex: "#b9bbbe" },
        { id: "forest", name: "Forest", hex: "#2e4034" },
        { id: "cream", name: "Cream", hex: "#efe9dd" },
      ],
      sizes: SIZES_APPAREL,
      areas: [
        { id: "front", label: "Front", rect: { x: 0.32, y: 0.34, w: 0.36, h: 0.34 }, surcharge: 0 },
        { id: "back", label: "Back", rect: { x: 0.30, y: 0.28, w: 0.40, h: 0.44 }, surcharge: 700 },
        { id: "sleeve_l", label: "Left Sleeve", rect: { x: 0.11, y: 0.34, w: 0.11, h: 0.16 }, surcharge: 400 },
        { id: "sleeve_r", label: "Right Sleeve", rect: { x: 0.78, y: 0.34, w: 0.11, h: 0.16 }, surcharge: 400 },
      ],
      finishes: [
        { id: "standard", name: "Standard Print", surcharge: 0 },
        { id: "embroidery", name: "Embroidered", surcharge: 900 },
      ],
      addons: [{ id: "giftbox", name: "Premium Gift Box", surcharge: 800 }],
    },

    hat: {
      id: "hat",
      name: "Hat",
      tagline: "Structured Custom Cap",
      description: "Six-panel structured cap with a curved brim and adjustable strap.",
      base: 2600,
      colors: [
        { id: "black", name: "Black", hex: "#1d1d1f" },
        { id: "stone", name: "Stone", hex: "#cabfa8" },
        { id: "navy", name: "Navy", hex: "#25324a" },
        { id: "olive", name: "Olive", hex: "#5c5a3a" },
      ],
      sizes: null,
      areas: [
        { id: "front", label: "Front", rect: { x: 0.34, y: 0.36, w: 0.32, h: 0.20 }, surcharge: 0 },
        { id: "side", label: "Side", rect: { x: 0.68, y: 0.40, w: 0.16, h: 0.12 }, surcharge: 400 },
      ],
      finishes: [
        { id: "standard", name: "Standard Print", surcharge: 0 },
        { id: "embroidery", name: "3D Embroidery", surcharge: 800 },
      ],
      addons: [{ id: "giftbox", name: "Premium Gift Box", surcharge: 800 }],
    },

    tumbler: {
      id: "tumbler",
      name: "Tumbler",
      tagline: "Insulated Custom Tumbler",
      description: "600 ml double-wall vacuum-insulated stainless steel with a sip-lid.",
      base: 3200,
      colors: [
        { id: "steel", name: "Steel", hex: "#c4c8cc" },
        { id: "black", name: "Matte Black", hex: "#26262a" },
        { id: "white", name: "White", hex: "#ffffff" },
        { id: "ocean", name: "Ocean", hex: "#3a6b86" },
      ],
      sizes: null,
      areas: [
        { id: "front", label: "Front", rect: { x: 0.34, y: 0.22, w: 0.32, h: 0.56 }, surcharge: 0 },
        { id: "wrap", label: "Wrap Around", rect: { x: 0.16, y: 0.22, w: 0.68, h: 0.56 }, surcharge: 800 },
      ],
      finishes: [
        { id: "standard", name: "UV Print", surcharge: 0 },
        { id: "engrave", name: "Laser Engrave", surcharge: 600 },
      ],
      addons: [{ id: "giftbox", name: "Premium Gift Box", surcharge: 800 }],
    },

    notebook: {
      id: "notebook",
      name: "Notebook",
      tagline: "Hardcover Custom Notebook",
      description: "A5 hardcover notebook, 160 pages of 100 gsm dotted paper with an elastic closure.",
      base: 1800,
      colors: [
        { id: "kraft", name: "Kraft", hex: "#c8a97e" },
        { id: "black", name: "Black", hex: "#1d1d1f" },
        { id: "navy", name: "Navy", hex: "#25324a" },
        { id: "terracotta", name: "Terracotta", hex: "#b5654a" },
      ],
      sizes: null,
      areas: [
        { id: "front", label: "Front Cover", rect: { x: 0.30, y: 0.20, w: 0.40, h: 0.60 }, surcharge: 0 },
        { id: "back", label: "Back Cover", rect: { x: 0.30, y: 0.20, w: 0.40, h: 0.60 }, surcharge: 400 },
      ],
      finishes: [
        { id: "standard", name: "Print", surcharge: 0 },
        { id: "foil", name: "Gold Foil Deboss", surcharge: 700 },
      ],
      addons: [{ id: "giftbox", name: "Premium Gift Box", surcharge: 800 }],
    },

    giftbox: {
      id: "giftbox",
      name: "Gift Box",
      tagline: "Custom Keepsake Gift Box",
      description: "Rigid magnetic-close gift box with a soft-touch finish and ribbon.",
      base: 2200,
      colors: [
        { id: "white", name: "White", hex: "#ffffff" },
        { id: "charcoal", name: "Charcoal", hex: "#3a3a3d" },
        { id: "blush", name: "Blush", hex: "#e8cdc9" },
        { id: "forest", name: "Forest", hex: "#2e4034" },
      ],
      sizes: null,
      areas: [
        { id: "lid", label: "Lid", rect: { x: 0.24, y: 0.24, w: 0.52, h: 0.34 }, surcharge: 0 },
        { id: "bottom", label: "Bottom", rect: { x: 0.24, y: 0.58, w: 0.52, h: 0.20 }, surcharge: 500 },
        { id: "inside", label: "Inside", rect: { x: 0.26, y: 0.30, w: 0.48, h: 0.28 }, surcharge: 500 },
      ],
      finishes: [
        { id: "standard", name: "Print", surcharge: 0 },
        { id: "foil", name: "Foil Print", surcharge: 700 },
      ],
      addons: [],
    },

    tote: {
      id: "tote",
      name: "Tote Bag",
      tagline: "Organic Cotton Tote",
      description: "280 gsm heavyweight organic cotton canvas tote with reinforced handles.",
      base: 2000,
      colors: [
        { id: "natural", name: "Natural", hex: "#e4dcc7" },
        { id: "black", name: "Black", hex: "#1d1d1f" },
        { id: "sage", name: "Sage", hex: "#b7c4b0" },
      ],
      sizes: null,
      areas: [
        { id: "front", label: "Front", rect: { x: 0.28, y: 0.34, w: 0.44, h: 0.42 }, surcharge: 0 },
        { id: "back", label: "Back", rect: { x: 0.28, y: 0.34, w: 0.44, h: 0.42 }, surcharge: 500 },
      ],
      finishes: [{ id: "standard", name: "Screen Print", surcharge: 0 }],
      addons: [{ id: "giftbox", name: "Premium Gift Box", surcharge: 800 }],
    },

    phonecase: {
      id: "phonecase",
      name: "Phone Case",
      tagline: "Impact Custom Phone Case",
      description: "Shock-absorbing dual-layer case with a scratch-resistant matte print.",
      base: 2800,
      colors: [
        { id: "clear", name: "Clear", hex: "#eef1f4" },
        { id: "black", name: "Black", hex: "#1d1d1f" },
        { id: "white", name: "White", hex: "#ffffff" },
      ],
      sizes: ["iPhone 15", "iPhone 15 Pro", "iPhone 16", "iPhone 16 Pro"],
      areas: [{ id: "back", label: "Back", rect: { x: 0.30, y: 0.16, w: 0.40, h: 0.68 }, surcharge: 0 }],
      finishes: [
        { id: "standard", name: "Matte Print", surcharge: 0 },
        { id: "gloss", name: "Glossy Print", surcharge: 400 },
      ],
      addons: [{ id: "giftbox", name: "Premium Gift Box", surcharge: 800 }],
    },

    canvas: {
      id: "canvas",
      name: "Canvas Print",
      tagline: "Gallery Canvas Print",
      description: "Museum-grade cotton canvas on a 38 mm solid-wood stretcher frame.",
      base: 3600,
      colors: [{ id: "white", name: "White Frame", hex: "#f3f0ea" }, { id: "walnut", name: "Walnut", hex: "#5a4632" }, { id: "black", name: "Black", hex: "#1d1d1f" }],
      sizes: ["30×30 cm", "40×50 cm", "50×70 cm"],
      areas: [{ id: "face", label: "Canvas", rect: { x: 0.16, y: 0.16, w: 0.68, h: 0.68 }, surcharge: 0 }],
      finishes: [
        { id: "standard", name: "Matte Canvas", surcharge: 0 },
        { id: "satin", name: "Satin Canvas", surcharge: 500 },
      ],
      addons: [],
    },
  };

  root.Dynamic = root.Dynamic || {};
  root.Dynamic.catalog = catalog;
  root.Dynamic.getProduct = function (id) {
    return catalog[id] || catalog.mug;
  };
})(window);
