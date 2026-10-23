
/* 3D card tilt: each card leans toward the cursor (max ~7deg) with a slight
   lift, and settles back on leave. Fine pointers only. (In the zine grid the
   scatter/hover transforms outrank this - it only shows in other layouts.) */
(function () {
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var TILT = 7;
  document.querySelectorAll(".dyn-col .dc-card").forEach(function (card) {
    if (card.__tilt) return;
    card.__tilt = true;
    card.addEventListener("mousemove", function (e) {
      if (!fine.matches || card.classList.contains("is-cdrag")) return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = "perspective(900px) rotateX(" + (-py * TILT).toFixed(2) +
        "deg) rotateY(" + (px * TILT).toFixed(2) + "deg) scale(1.02)";
    });
    card.addEventListener("mouseleave", function () { card.style.transform = ""; });
  });
})();

/* Free drag (desktop): pick any card up and drop it anywhere on the page.
   The offset rides in the --cdx/--cdy custom properties that every zine
   transform includes, so the scatter rotation and hover lift survive. A
   real drag swallows the click; a plain click still opens the product. */
(function () {
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var col = document.getElementById("dynCol");
  if (!col) return;
  var drag = null, squelch = 0;
  document.addEventListener("click", function (e) {
    if (Date.now() < squelch) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  col.addEventListener("dragstart", function (e) {
    if (e.target && e.target.closest && e.target.closest(".dc-card")) e.preventDefault();
  });
  col.addEventListener("pointerdown", function (e) {
    if (!fine.matches || window.innerWidth <= 800) return;
    if (e.button !== 0 || drag) return;
    var card = e.target && e.target.closest ? e.target.closest(".dc-gridall .dc-card") : null;
    if (!card) return;
    drag = { el: card, sx: e.clientX, sy: e.clientY,
      bx: parseFloat(card.dataset.dgx || 0), by: parseFloat(card.dataset.dgy || 0), moved: false };
  });
  window.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved) {
      if (dx * dx + dy * dy < 64) return;   // an 8px wobble is still a click
      drag.moved = true;
      drag.el.classList.add("is-cdrag");
      drag.el.style.transform = "";         // drop any tilt residue
    }
    var nx = drag.bx + dx, ny = drag.by + dy;
    drag.el.dataset.dgx = nx;
    drag.el.dataset.dgy = ny;
    drag.el.style.setProperty("--cdx", nx + "px");
    drag.el.style.setProperty("--cdy", ny + "px");
  }, { passive: true });
  function end() {
    if (!drag) return;
    if (drag.moved) { squelch = Date.now() + 320; moved.add(drag.el); updateReset(); }
    drag.el.classList.remove("is-cdrag");
    drag = null;
  }
  window.addEventListener("pointerup", end, { passive: true });
  window.addEventListener("pointercancel", end, { passive: true });
  /* hand-drawn refresh puts every moved card back in its printed spot */
  var moved = new Set();
  var resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "dc-reset-btn";
  resetBtn.setAttribute("aria-label", "Put the cards back");
  col.appendChild(resetBtn);
  function updateReset() { resetBtn.classList.toggle("is-on", moved.size > 0); }
  resetBtn.addEventListener("click", function () {
    moved.forEach(function (card) {
      card.style.removeProperty("--cdx");
      card.style.removeProperty("--cdy");
      delete card.dataset.dgx;
      delete card.dataset.dgy;
    });
    moved.clear();
    updateReset();
  });
})();
