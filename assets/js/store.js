/* ============================================================================
   store.js — Minimal reactive state container.

   A tiny observable store (no framework). Holds the full customization state;
   any part of the UI can subscribe and re-render on change. Kept deliberately
   small: predictable, serializable, and the single source of truth that both
   the pricing engine and the Shopify cart payload read from.
   ========================================================================== */
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

  /** Build a fresh state object for a given product. */
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
