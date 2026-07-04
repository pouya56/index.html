/* ============================================================================
   pricing.js — Deterministic dynamic pricing engine.

   Pure function: given a product and the current customization state it returns
   an itemized breakdown and totals. No side effects, no DOM — trivially testable
   and safe to call on every keystroke. Prices are integer cents throughout to
   avoid floating-point drift; formatting to currency happens only at the edge.
   ========================================================================== */
(function (root) {
  "use strict";

  const money = (cents) =>
    "$" + (cents / 100).toFixed(2).replace(/\.00$/, "");

  /**
   * @param {object} product  entry from the catalog
   * @param {object} state    { colorId, sizeId, quantity, finishId, addons:Set,
   *                            areas: { [areaId]: { objectCount } } }
   * @returns {{ items: Array, subtotalUnit:number, total:number, currency }}
   */
  function compute(product, state) {
    const items = [];

    // 1. Base product (unit price).
    items.push({ label: product.name, amount: product.base, kind: "base" });

    // 2. Print areas. First area that actually has a design is included;
    //    every additional decorated area adds its surcharge.
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

    // 3. Finish (e.g. gold metallic / foil / embroidery), charged once per
    //    decorated area beyond plain standard.
    const finish = (product.finishes || []).find((f) => f.id === state.finishId);
    if (finish && finish.surcharge > 0 && decorated.length > 0) {
      items.push({
        label: finish.name,
        amount: finish.surcharge,
        kind: "finish",
      });
    }

    // 4. Add-ons (gift box, etc.).
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
