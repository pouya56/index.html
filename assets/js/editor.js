/* ============================================================================
   editor.js — Canvas design editor (built on Fabric.js).

   Owns one Fabric canvas that is re-populated as the customer switches print
   areas. Provides the full editing surface: add / transform / align / snap /
   layer / undo-redo / zoom, plus (de)serialization to the design JSON that the
   Shopify cart payload stores. All operations are guarded so a missing Fabric
   (e.g. offline CDN) degrades gracefully instead of throwing.
   ========================================================================== */
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
    // Per-area history stacks so undo/redo respect the active area.
    const histories = {};
    product.areas.forEach((a) => (histories[a.id] = { stack: [], index: -1 }));
    let suspend = false; // pause history capture during programmatic loads

    /* ---------- print-area boundary + clip ---------- */
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
      // Clip every design object to the printable rectangle.
      canvas.clipPath = new fabric.Rect({
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        absolutePositioned: true,
      });
    }

    /* ---------- history ---------- */
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
        // Boundary/clip are excluded from export, so re-apply them.
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

    /* ---------- change notification ---------- */
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

    /* ---------- snapping ---------- */
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

    /* ---------- add operations ---------- */
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

    /* ---------- object ops ---------- */
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

    /* ---------- align + snap ---------- */
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

    /* ---------- selected text styling ---------- */
    function styleSelected(patch) {
      const o = active();
      if (!o) return;
      Object.keys(patch).forEach((k) => o.set(k, patch[k]));
      if (patch.text && o.name !== undefined) o.name = String(patch.text).slice(0, 24);
      o.setCoords();
      canvas.renderAll();
      pushHistory();
    }

    /* ---------- zoom ---------- */
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

    /* ---------- area switching ---------- */
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
        // seed history baseline for the empty area
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

    /* ---------- export ---------- */
    function exportAreaPNG(areaId, mult) {
      // Render just the printable rect of the given area at higher resolution.
      const target = areaId || activeAreaId;
      if (target !== activeAreaId) saveActiveArea();
      const r = areaRect(target);
      // temporarily hide boundary
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

    /* ---------- keyboard shortcuts ---------- */
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

    // init
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
