/* ============================================================================
   cart.js — Shopify Add-to-Cart payload builder.

   Turns the current customization into the exact shape a Shopify storefront
   expects. Small design metadata rides along as line-item properties (visible
   on the order + in the admin); large artefacts (full design JSON, uploaded
   files, hi-res preview) are meant to be uploaded first and referenced by URL.
   This module produces both the AJAX-cart body and a portable design bundle.
   See docs/BACKEND_CONTRACT.md for the storage contract.
   ========================================================================== */
(function (root) {
  "use strict";

  /**
   * Build the design bundle — everything needed to reproduce & print the order.
   * @returns {object} JSON-serializable design record.
   */
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
      // In production these are Cloudinary/S3 URLs returned by the upload step.
      previewImage: ctx.previewDataUrl || null,
      areaPreviews: ctx.areaPreviews || {},
      uploadedAssets: ctx.uploadedAssets || [],
    };
  }

  /**
   * Build the Shopify AJAX cart request body (POST /cart/add.js).
   * Small values go directly as line-item properties; heavy blobs are expected
   * to be uploaded first (see uploadArtifacts) and referenced by URL.
   */
  function buildCartRequest(ctx, refs) {
    const { product, state, variantId } = ctx;
    const bundle = buildDesignBundle(ctx);
    const properties = {
      _dynamic_design_id: (refs && refs.designId) || "",
      _dynamic_schema: bundle.schemaVersion,
      Color: bundle.options.color,
      Finish: bundle.options.finish,
      "Print Areas": bundle.printAreas.join(", ") || "None",
      // Underscore-prefixed properties are hidden from the storefront line item
      // but retained on the order for fulfilment.
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
      // convenience mirror of what will be persisted server-side
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

  /**
   * Attempt a real Shopify AJAX add-to-cart. Falls back to returning the payload
   * when not embedded in a storefront (e.g. this standalone demo), so the flow
   * is always observable.
   */
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
