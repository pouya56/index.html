# Dynamic — Porting to React + Vite + TypeScript

The shipped app is framework-free so it runs on this static host with no build.
Its module boundaries were drawn to map **1:1** onto the requested stack. This is
the migration guide.

## Target stack

- **Vite** + **React 18** + **TypeScript** (strict)
- **Shopify Polaris** (admin surfaces) + **App Bridge** (embedded auth)
- **Fabric.js** (already used, unchanged) + **Three.js** (Phase 4 3D)
- **GSAP** (already used) or Framer Motion for the modal
- **Zustand** for the store (drop-in for `store.js`)

## File → component/hook mapping

| Current module | React target | Notes |
|---|---|---|
| `products.js` | `src/data/catalog.ts` | Add `Product`, `PrintArea`, `Finish` interfaces. Pure data — copy as-is. |
| `pricing.js` | `src/lib/pricing.ts` + `usePricing()` | Already pure; add types, keep the algorithm. |
| `store.js` | `src/store/useCustomization.ts` | Replace the mini-observable with Zustand (same shape). |
| `silhouettes.js` | `src/components/ProductSilhouette.tsx` | Return JSX/SVG instead of strings. |
| `designs.js` | `src/data/templates.ts` + `src/lib/ai.ts` | `generateAI` becomes an async service call. |
| `editor.js` | `src/editor/useEditor.ts` + `<DesignCanvas/>` | Wrap Fabric in a hook; keep the public method surface (`addText`, `align`, `undo`, `serializeAllAreas`, …) identical. |
| `cart.js` | `src/lib/cart.ts` | Types on the bundle; unchanged logic. |
| `app.js` | `<ProductPage/>`, `<CustomizeModal/>`, panels | Split panels into `TextPanel`, `UploadPanel`, `AiPanel`, `TemplatePanel`, `LayersPanel`. |

## Suggested structure

```
src/
  data/            catalog.ts, templates.ts
  lib/             pricing.ts, cart.ts, ai.ts
  store/           useCustomization.ts
  editor/          useEditor.ts, DesignCanvas.tsx
  components/
    product/       ProductPage.tsx, ProductSilhouette.tsx, OptionSwatches.tsx
    modal/         CustomizeModal.tsx, Toolbar.tsx, AreaTabs.tsx, PriceFooter.tsx
    panels/        TextPanel.tsx, UploadPanel.tsx, AiPanel.tsx, TemplatePanel.tsx, LayersPanel.tsx
  types/           index.ts
```

## Types to add first

```ts
export interface Rect { x: number; y: number; w: number; h: number }
export interface PrintArea { id: string; label: string; rect: Rect; surcharge: number }
export interface Finish { id: string; name: string; surcharge: number }
export interface Product {
  id: string; name: string; tagline: string; description: string;
  base: number; colors: { id: string; name: string; hex: string }[];
  sizes: string[] | null; areas: PrintArea[]; finishes: Finish[];
  addons: { id: string; name: string; surcharge: number }[];
}
export interface DesignBundle { /* mirror cart.js buildDesignBundle output */ }
```

## Migration order (low-risk)

1. `catalog.ts`, `pricing.ts`, `cart.ts` (pure, fully testable — add Vitest).
2. Zustand store; verify pricing selectors against the current numbers.
3. `useEditor` hook wrapping Fabric — port method-by-method, keep names.
4. Presentational components; wire GSAP/Framer for the modal.
5. App Bridge + real `/api` calls (see `BACKEND_CONTRACT.md`).
