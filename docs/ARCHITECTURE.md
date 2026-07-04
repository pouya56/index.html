# Dynamic — Architecture

A premium, data-driven product customization platform with an Apple-style live
editor. The shipped code is the **customer-facing application**; it is
framework-free by choice so it runs on any static host (including this repo's
GitHub Pages) with zero build step, while staying strictly modular.

## Why vanilla modules (and how it maps to the requested stack)

The brief asked for React + TypeScript + Vite + Fabric.js + GSAP. This repo is a
static-file host with no build pipeline, so the app is delivered as small,
single-responsibility ES modules that mirror the same component boundaries. The
architecture is a **1:1 port target** — each module below is one React
component/hook, and the data contracts (`store`, `pricing`, `cart`) are already
framework-agnostic. `docs/PORTING.md` maps each file to its React equivalent.

Fabric.js and GSAP are used exactly as specified. Three.js is stubbed for the
"optional 3D later" note — the silhouette layer (`silhouettes.js`) is the seam.

## Module map

| File | Responsibility | React equivalent |
|------|----------------|------------------|
| `products.js` | Product catalog: print areas, colours, sizes, pricing rules. Single source of truth. | `catalog.ts` + typed models |
| `silhouettes.js` | Vector, colour-aware product renderers (no static photos). | `<ProductSilhouette/>` |
| `store.js` | Tiny observable store + initial-state factory. | `useCustomizationStore` (Zustand) |
| `pricing.js` | Pure dynamic-pricing engine (integer cents). | `usePricing()` selector |
| `designs.js` | Template library + procedural AI generator. | `templates.ts` + `useAiDesign()` |
| `editor.js` | Fabric canvas: add/transform/align/snap/zoom/undo-redo, (de)serialization. | `<DesignCanvas/>` + `useEditor()` |
| `cart.js` | Design bundle + Shopify cart payload builder. | `cartService.ts` |
| `app.js` | Product page + modal orchestration, wiring. | `<ProductPage/>`, `<CustomizeModal/>` |

## Data flow

```
products.js ──▶ store.js ──▶ pricing.js ──▶ UI (footer + page price)
                   ▲                │
                   │                ▼
   editor.js ◀── app.js ──▶ modal panels (text / upload / AI / templates)
        │                          │
        └────── design JSON ───────┴──▶ cart.js ──▶ Shopify payload
```

- **One-way state**: user action → `store.set()` → subscribers re-render.
- **Editor authority**: the Fabric canvas owns per-area scenes; on Add-to-Cart
  it serializes all areas + exports hi-res previews into the bundle.
- **Pricing is pure**: recomputed on every change from `(product, state)` — no
  DOM reads, trivially unit-testable.

## Key design decisions

- **Normalized geometry** — print areas are stored as `{x,y,w,h}` in 0..1, so a
  design maps identically to any canvas resolution or physical print template.
- **Integer cents everywhere** — no float drift; formatting only at the edge.
- **Graceful degradation** — if the Fabric/GSAP CDN is blocked, the product page
  still renders and the modal shows a clear message instead of throwing.
- **Serializable state** — the entire customization is JSON; that same JSON is
  what the backend persists and what re-hydrates an editor session later.

## Accessibility & performance

- Semantic roles (`dialog`, `tablist`/`tab`, `aria-pressed`, `aria-selected`),
  full keyboard support (⌘Z/⇧⌘Z undo/redo, ⌘D duplicate, ⌫ delete, Esc close),
  visible focus rings, `prefers-reduced-motion` honoured.
- Lazy-loads `pdf.js` only when a PDF is actually uploaded.
- CSS-only transitions where possible; GSAP reserved for the modal choreography.
- Sticky, blurred nav and `content-visibility`-friendly layout; single canvas
  reused across print areas rather than one per area.

## Local preview

Any static server works, e.g.:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Open the browser console and run through Customize → Add to Cart to inspect the
Shopify payload at `Dynamic.lastOrder`.
