# Dynamic

A premium, Apple-inspired **product customization platform**. Customers design
any product — mugs, apparel, hats, tumblers, notebooks, gift boxes, totes, phone
cases, canvas prints — in a fullscreen, live editor, then add the finished
design straight to a Shopify cart.

> **Live demo:** open `index.html` on any static host (this repo is
> GitHub-Pages ready). No build step.

![Dynamic](https://img.shields.io/badge/status-phase%201%20complete-0071e3)

## What's built

- **Clean product page** — image, name, price, description, colour, size,
  quantity, and a single **Customize** call-to-action.
- **Apple-style fullscreen modal** — smooth GSAP open/close, live preview.
- **Live editor (Fabric.js)** — add text, upload PNG/JPG/SVG/PDF, emoji,
  templates, and AI artwork; change fonts/colours/size; drag, resize, rotate,
  duplicate, delete, layer, align (L/R/T/B), snap-to-center, zoom, undo/redo.
- **Multiple print areas** per product (e.g. mug Front/Back/Wrap, t-shirt
  Front/Back/Sleeves) with smooth switching and per-area object counts.
- **AI design panel** — prompt-to-artwork, generated live and dropped into the
  editor (procedural today; one-function swap to a real model — see docs).
- **Dynamic pricing** — itemized, recomputed on every change, no refresh.
- **Shopify-ready** — Add-to-Cart builds the exact line-item-property payload +
  a full design bundle (inspect at `window.Dynamic.lastOrder`).
- **Works with any product** — everything is data-driven from one catalog file.

## Project structure

```
index.html                 # product page shell + script loading
assets/
  css/dynamic.css          # Apple-inspired design system (light/dark)
  js/
    products.js            # product catalog, print areas, pricing rules
    silhouettes.js         # vector, colour-aware product renderers
    store.js               # tiny reactive store
    pricing.js             # pure dynamic-pricing engine
    designs.js             # templates + procedural AI generator
    editor.js              # Fabric.js canvas editor (the core)
    cart.js                # Shopify payload + design bundle builder
    app.js                 # product page + modal orchestration
docs/
  ARCHITECTURE.md          # module map, data flow, decisions
  BACKEND_CONTRACT.md      # API, Prisma model, Shopify wiring, AI swap
  PORTING.md               # how this maps to React + Vite + TS
print-estimator.html       # (pre-existing, unrelated)
```

## Run locally

```bash
python3 -m http.server 8080   # or: npx serve .
# visit http://localhost:8080
```

Try: pick a product → **Customize** → add text / upload a logo / **AI Design** →
switch print areas → watch the price update → **Add to Cart**, then open the
console to see the Shopify payload.

## Tech

Fabric.js (2D editor) · GSAP (modal choreography) · pdf.js (lazy, PDF uploads) ·
vanilla ES modules (framework-free, zero build). Backend contract targets
Node/Express · Prisma · PostgreSQL · Cloudinary · Shopify Admin/Storefront APIs
— see [`docs/BACKEND_CONTRACT.md`](docs/BACKEND_CONTRACT.md).

## Roadmap

- [x] **Phase 1** — product page, Apple modal, live editor, multi print-area,
      AI panel, dynamic pricing, Shopify payload, docs.
- [ ] **Phase 2** — port to React + Vite + TypeScript + Polaris/App Bridge.
- [ ] **Phase 3** — Node/Express + Prisma + Cloudinary backend from the contract.
- [ ] **Phase 4** — real AI image model, Three.js 3D preview, merchant metafield
      config.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design.
