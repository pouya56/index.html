
(function () {
  var cfgEl = document.getElementById("dyn-config");
  if (!cfgEl) return;
  var cfg; try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }
  var _open = false, _styled = false;
  function openTool() {
  if (_open) return; _open = true;
  var s = cfg.settings || {}, shop = cfg.shopify || {};
  var prodImg = shop.productMainImage || (shop.productImages && shop.productImages[0]) || "";
  var sides = [{ key: "front", label: "Front", img: s.frontImage || prodImg, field: "Print area position", p: s.print || {} }];
  if (s.backImage || s.printBack) sides.push({ key: "back", label: "Back", img: s.backImage || s.frontImage || prodImg, field: "Back print area position", p: s.printBack || {} });
  sides.forEach(function (sd) { var p = sd.p; sd.box = { x: +p.x || 22, y: +p.y || 30, w: +p.w || 56, h: +p.h || 40 }; });
  var cur = (/[?&#]setarea=back\b/.test(location.href) && sides.length > 1) ? 1 : 0;

  if (!_styled) { _styled = true;
  var st = document.createElement("style");
  st.textContent = ".pa-tool{position:fixed;inset:0;z-index:100000;background:rgba(20,20,25,.72);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;}"
    + ".pa-stage{position:relative;line-height:0;box-shadow:0 20px 60px rgba(0,0,0,.5);border-radius:10px;background:#fff;}"
    + ".pa-stage img{display:block;max-width:min(560px,90vw);max-height:62vh;width:auto;height:auto;border-radius:10px;-webkit-user-drag:none;user-select:none;}"
    + ".pa-box{position:absolute;border:2px solid #0071e3;background:rgba(0,113,227,.14);cursor:move;box-sizing:border-box;touch-action:none;}"
    + ".pa-box .pa-h{position:absolute;width:26px;height:26px;border-radius:50%;background:#0071e3;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.45);touch-action:none;}"
    + ".pa-h.nw{left:-13px;top:-13px;cursor:nwse-resize;}.pa-h.ne{right:-13px;top:-13px;cursor:nesw-resize;}.pa-h.sw{left:-13px;bottom:-13px;cursor:nesw-resize;}.pa-h.se{right:-13px;bottom:-13px;cursor:nwse-resize;}"
    + ".pa-tag{position:absolute;top:-24px;left:0;background:#0071e3;color:#fff;font-size:11px;font-weight:600;padding:2px 7px;border-radius:5px;white-space:nowrap;}"
    + ".pa-panel{margin-top:16px;background:#fff;border-radius:14px;padding:14px 18px;max-width:90vw;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.3);}"
    + ".pa-tabs{display:inline-flex;gap:4px;background:#f0f0f2;border-radius:999px;padding:4px;margin-bottom:12px;}"
    + ".pa-tab{border:0;background:transparent;padding:7px 18px;border-radius:999px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;color:#6e6e73;}"
    + ".pa-tab.on{background:#fff;color:#1d1d1f;box-shadow:0 1px 3px rgba(0,0,0,.12);}"
    + ".pa-nums{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;font-variant-numeric:tabular-nums;}"
    + ".pa-nums b{display:block;font-size:22px;color:#1d1d1f;}.pa-nums span{font-size:11px;color:#6e6e73;text-transform:uppercase;letter-spacing:.03em;}"
    + ".pa-row{display:flex;gap:10px;justify-content:center;}"
    + ".pa-btn{height:40px;padding:0 18px;border-radius:999px;border:0;font:inherit;font-size:14px;font-weight:600;cursor:pointer;}"
    + ".pa-copy{background:#1d1d1f;color:#fff;}.pa-close{background:#f0f0f2;color:#1d1d1f;}"
    + ".pa-hint{font-size:12.5px;color:#6e6e73;margin:10px 0 0;line-height:1.5;}";
  document.head.appendChild(st); }

  var tabsHtml = sides.length > 1 ? ('<div class="pa-tabs">' + sides.map(function (sd, i) { return '<button class="pa-tab" data-side="' + i + '">' + sd.label + '</button>'; }).join("") + '</div>') : "";
  var root = document.createElement("div"); root.className = "pa-tool";
  root.innerHTML = '<div class="pa-stage" id="paStage">'
    + '<img id="paImg" alt="">'
    + '<div class="pa-box" id="paBox"><div class="pa-tag" id="paTag"></div><i class="pa-h nw" data-c="nw"></i><i class="pa-h ne" data-c="ne"></i><i class="pa-h sw" data-c="sw"></i><i class="pa-h se" data-c="se"></i></div></div>'
    + '<div class="pa-panel">' + tabsHtml + '<div class="pa-nums">'
    + '<div><b id="paL">0</b><span>Left</span></div><div><b id="paT">0</b><span>Top</span></div>'
    + '<div><b id="paW">0</b><span>Width</span></div><div><b id="paHt">0</b><span>Height</span></div></div>'
    + '<div class="pa-row"><button class="pa-btn pa-copy" id="paCopy">Copy the 4 numbers</button>'
    + '<button class="pa-btn pa-close" id="paCloseBtn">Done</button></div>'
    + '<p class="pa-hint" id="paHint"></p></div>';
  document.body.appendChild(root);

  var stage = root.querySelector("#paStage"), boxEl = root.querySelector("#paBox"), imgEl = root.querySelector("#paImg");
  var L = root.querySelector("#paL"), T = root.querySelector("#paT"), W = root.querySelector("#paW"), H = root.querySelector("#paHt"), tag = root.querySelector("#paTag"), hint = root.querySelector("#paHint");
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function box() { return sides[cur].box; }
  function render() {
    var b = box();
    b.x = clamp(b.x, 0, 100 - b.w); b.y = clamp(b.y, 0, 100 - b.h);
    boxEl.style.left = b.x + "%"; boxEl.style.top = b.y + "%"; boxEl.style.width = b.w + "%"; boxEl.style.height = b.h + "%";
    var r = [Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h)];
    L.textContent = r[0]; T.textContent = r[1]; W.textContent = r[2]; H.textContent = r[3];
    tag.textContent = r[0] + " · " + r[1] + " · " + r[2] + " · " + r[3];
  }
  function selectSide(i) {
    cur = i;
    imgEl.src = sides[cur].img || "";
    // Circle-shaped areas draw as an oval in the tool too.
    boxEl.style.borderRadius = (sides[cur].p && sides[cur].p.shape === "circle") ? "50%" : "0";
    Array.prototype.forEach.call(root.querySelectorAll(".pa-tab"), function (t, ti) { t.classList.toggle("on", ti === cur); });
    hint.textContent = "Drag to move, drag the blue dot to resize. Tap Copy, then paste into the “" + sides[cur].field + "” field" + (sides.length > 1 ? " of the " + sides[cur].label + " block." : ".");
    render();
  }
  selectSide(cur);
  Array.prototype.forEach.call(root.querySelectorAll(".pa-tab"), function (t) { t.addEventListener("click", function () { selectSide(+t.getAttribute("data-side")); }); });

  var drag = null; // { c: 'move'|'nw'|'ne'|'sw'|'se', o:{x,y,w,h}, sx, sy }
  function rect() { return stage.getBoundingClientRect(); }
  function start(c) {
    return function (e) {
      e.preventDefault(); e.stopPropagation();
      var b = box(); drag = { c: c, o: { x: b.x, y: b.y, w: b.w, h: b.h }, sx: e.clientX, sy: e.clientY };
      try { e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId); } catch (err) {}
    };
  }
  boxEl.addEventListener("pointerdown", start("move"));
  Array.prototype.forEach.call(boxEl.querySelectorAll(".pa-h"), function (h) { h.addEventListener("pointerdown", start(h.getAttribute("data-c"))); });
  document.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var rc = rect(); var b = box(); var o = drag.o;
    var dx = (e.clientX - drag.sx) / rc.width * 100, dy = (e.clientY - drag.sy) / rc.height * 100;
    if (drag.c === "move") { b.x = o.x + dx; b.y = o.y + dy; }
    else {
      var right = o.x + o.w, bottom = o.y + o.h;
      if (drag.c.indexOf("w") >= 0) { b.x = clamp(o.x + dx, 0, right - 2); b.w = right - b.x; }
      if (drag.c.indexOf("e") >= 0) { b.w = clamp(o.w + dx, 2, 100 - o.x); }
      if (drag.c.indexOf("n") >= 0) { b.y = clamp(o.y + dy, 0, bottom - 2); b.h = bottom - b.y; }
      if (drag.c.indexOf("s") >= 0) { b.h = clamp(o.h + dy, 2, 100 - o.y); }
    }
    render();
  });
  document.addEventListener("pointerup", function () { drag = null; });
  document.addEventListener("pointercancel", function () { drag = null; });

  root.querySelector("#paCopy").addEventListener("click", function () {
    var b = box();
    var txt = Math.round(b.x) + ", " + Math.round(b.y) + ", " + Math.round(b.w) + ", " + Math.round(b.h);
    if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(function () {});
    this.textContent = "Copied " + txt; var self = this; setTimeout(function () { self.textContent = "Copy the 4 numbers"; }, 1800);
  });
  root.querySelector("#paCloseBtn").addEventListener("click", function () { root.remove(); _open = false; });
  }

  var auto = /[?&#]setarea\b/.test(location.href);
  var design = !!(window.Shopify && window.Shopify.designMode);
  if (!auto && !design) return;
  if (auto) openTool();
  if (design) {
    var launch = document.createElement("button");
    launch.type = "button"; launch.textContent = "◳ Set print area";
    launch.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:99999;height:46px;padding:0 20px;border:0;border-radius:999px;background:#0071e3;color:#fff;font:600 14px/1 -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.3);cursor:pointer;";
    launch.addEventListener("click", openTool);
    document.body.appendChild(launch);
  }
})();
