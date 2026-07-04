# Dynamic — Backend & Shopify Integration Contract

This document is the **integration contract** between the shipped frontend and a
production backend. The frontend already produces everything below; a backend
team can implement these endpoints without touching the client. Every payload
shape here matches exactly what `assets/js/cart.js` emits (`Dynamic.lastOrder`
after an Add-to-Cart, inspectable in the browser console).

---

## 1. Architecture at a glance

```
┌──────────────┐   design bundle    ┌───────────────┐   Admin API    ┌──────────┐
│  Storefront  │ ─────────────────▶ │  Dynamic API  │ ─────────────▶ │  Shopify │
│ (this app +  │   preview + files  │ Node/Express  │  metafields    │  Store   │
│  theme block)│ ◀───────────────── │  + Prisma     │  line items    └──────────┘
└──────────────┘   asset URLs       └──────┬────────┘
                                           │ upload
                                    ┌──────▼────────┐   ┌────────────┐
                                    │  Cloudinary   │   │ PostgreSQL │
                                    │ (art/preview) │   │  (designs) │
                                    └───────────────┘   └────────────┘
```

The client uploads heavy artefacts first, receives URLs, then adds to cart with
those URLs as line-item properties. This keeps cart properties small (Shopify
limits) while preserving full print-ready data on the order.

---

## 2. Data model (Prisma)

```prisma
model Design {
  id           String   @id @default(cuid())
  shop         String                       // myshopify domain
  productId    String                       // Shopify product GID
  variantId    String?                      // resolved from color/size
  schemaVersion String  @default("1.0")
  bundle       Json                         // full design bundle (see §3)
  previewUrl   String?                      // Cloudinary URL of composite preview
  areaPreviews Json?                        // { areaId: url }
  assets       Asset[]
  orderId      String?                      // set on checkout via webhook
  createdAt    DateTime @default(now())
}

model Asset {
  id        String  @id @default(cuid())
  designId  String
  design    Design  @relation(fields: [designId], references: [id])
  kind      String  // "upload" | "photo" | "svg" | "pdf" | "ai" | "preview"
  url       String  // Cloudinary secure_url
  mime      String
  bytes     Int
}
```

---

## 3. The design bundle

Produced by `Dynamic.cart.buildDesignBundle()`. This is the canonical record —
it can fully reconstruct and print the order.

```jsonc
{
  "schemaVersion": "1.0",
  "productId": "mug",
  "productName": "Ceramic Mug",
  "options": {
    "color": "White",
    "size": null,
    "finish": "Gold Metallic Print",
    "addons": ["giftbox"],
    "quantity": 2
  },
  "printAreas": ["front", "back"],
  "design": {                     // per-area Fabric.js JSON (fonts, colours,
    "front": { "objectCount": 2, "json": { /* fabric scene */ } },
    "back":  { "objectCount": 1, "json": { /* fabric scene */ } }
  },
  "pricing": {
    "currency": "USD",
    "unitCents": 4000,
    "totalCents": 8000,
    "breakdown": [ { "label": "Ceramic Mug", "cents": 2000 }, ... ]
  },
  "previewImage": "data:image/png;base64,...", // replaced by URL after upload
  "areaPreviews": { "front": "data:...", "back": "data:..." },
  "uploadedAssets": [ { "name": "logo.svg", "type": "image/svg+xml", "size": 4211 } ]
}
```

---

## 4. HTTP API

All routes are `application/json` unless noted. Auth via Shopify App Bridge
session token (`Authorization: Bearer <token>`), verified server-side.

### `POST /api/uploads`  — multipart
Upload one artefact (PNG/JPG/SVG/PDF or a preview PNG) to Cloudinary.

**Request:** `multipart/form-data` with `file`, `kind`.
**Response:** `201`
```json
{ "id": "ast_...", "url": "https://res.cloudinary.com/.../logo.png", "kind": "upload", "mime": "image/png", "bytes": 4211 }
```

### `POST /api/designs`
Persist a design bundle. Call after uploads so `previewImage`/asset fields hold
URLs, not data URIs.

**Request:** the design bundle (§3) with URL-ified assets.
**Response:** `201`
```json
{ "designId": "dsn_abc123", "designJsonUrl": "https://.../designs/dsn_abc123.json", "previewUrl": "https://.../preview.png" }
```

### `GET /api/designs/:id`
Return a stored bundle (used by admin/fulfilment to render print files).

### `POST /api/cart-tokens` *(optional)*
Resolve `{ productId, color, size }` → Shopify `variantId` when the storefront
does not already know it.

---

## 5. Shopify wiring

### Add to cart (storefront, AJAX)
`Dynamic.cart.buildCartRequest()` returns the body for `POST /cart/add.js`:

```json
{
  "items": [{
    "id": 45678901234567,
    "quantity": 2,
    "properties": {
      "_dynamic_design_id": "dsn_abc123",
      "_dynamic_schema": "1.0",
      "Color": "White",
      "Finish": "Gold Metallic Print",
      "Print Areas": "front, back",
      "Add-ons": "giftbox",
      "_design_json_url": "https://.../designs/dsn_abc123.json",
      "_preview_url": "https://.../preview.png"
    }
  }]
}
```

- Properties **without** a leading underscore are shown to the customer on the
  cart/checkout line item (Color, Size, Finish, Print Areas, Add-ons).
- Properties **with** a leading underscore are hidden from the buyer but kept on
  the order for fulfilment (`_design_json_url`, `_preview_url`, `_dynamic_*`).

### Custom pricing
Per-side / finish / add-on surcharges can be applied via any of:
1. **Variant per finish** (simplest) — map finish → variant.
2. **Shopify Functions (Cart Transform)** — add the surcharge as a merged line
   from the `_dynamic_*` properties. Recommended for many combinations.
3. **Draft Orders API** for fully bespoke B2B pricing.

The client already computes the authoritative breakdown (`pricing` in the
bundle); the server should **re-verify** it before creating the order — never
trust client-side totals.

### Metafields (product-level config, optional)
Print-area geometry lives in `assets/js/products.js` today. To let merchants
edit it without a deploy, mirror it to a product metafield:

- namespace `dynamic`, key `print_config`, type `json` — the product's `areas`,
  `finishes`, `addons`. The client can read this via the Storefront API and fall
  back to the bundled catalog.

### Order webhook
Subscribe to `orders/create`. Match line-item property `_dynamic_design_id` →
`Design` row, set `orderId`, and trigger print-file generation from
`areaPreviews` / stored asset URLs.

---

## 6. AI Design — production swap

`assets/js/designs.js#generateAI()` currently returns procedural SVG so the demo
works offline. To use a real model, replace only that function body:

```js
async function generateAI(prompt) {
  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const { url } = await res.json();            // model output (PNG/SVG URL)
  return { kind: "image", url, name: `AI · ${prompt.slice(0, 24)}` };
}
```

Server-side `/api/ai/generate` calls the image model, uploads the result to
Cloudinary, and returns the URL. The editor already accepts both
`{ kind: "svg", svg }` and `{ kind: "image", url }`.

---

## 7. Security & correctness checklist

- [ ] Verify App Bridge session token on every `/api/*` request.
- [ ] Validate uploads: MIME sniff, size cap (20 MB), reject SVG with scripts
      (sanitize with DOMPurify server-side before storing/rendering).
- [ ] Recompute pricing server-side from the bundle; reject on mismatch.
- [ ] Sign Cloudinary uploads; never expose the API secret to the client.
- [ ] Rate-limit `/api/ai/generate` and `/api/uploads`.
- [ ] Store PII-free previews; the bundle may contain customer names in text.
