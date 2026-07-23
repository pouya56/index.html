/* Dynamic Flashlight — a spotlight that follows the pointer (or finger) and
   dims the rest of the page. Loaded by sections/dynamic-flashlight.liquid.
   All styling is set from here so the effect can't depend on anything else. */
(function () {
  function initEl(el) {
    if (el.__flashInit) return;
    el.__flashInit = true;

    var on = el.getAttribute("data-on") === "1" || /[?&]torch=1\b/.test(location.search);
    if (!on) { if (el.parentNode) el.parentNode.removeChild(el); return; }

    /* Re-parent to <body> so no theme wrapper (transform/filter/contain) can
       trap this fixed overlay in a stacking context and hide it. */
    if (el.parentNode !== document.body) document.body.appendChild(el);

    var s = el.style;
    s.position = "fixed";
    s.top = s.left = s.right = s.bottom = "0";
    s.zIndex = "2147483000";
    s.pointerEvents = "none";
    s.transition = "opacity .2s ease";
    s.opacity = "1";

    var size = parseInt(el.getAttribute("data-size") || "120", 10);
    var dim = parseInt(el.getAttribute("data-dim") || "60", 10);
    dim = Math.min(90, Math.max(15, isNaN(dim) ? 60 : dim)) / 100;
    var r = Math.round((isNaN(size) ? 120 : size) * 1.7);

    var raf = 0,
        px = (window.innerWidth || 800) / 2,
        py = (window.innerHeight || 600) / 2;

    function apply() {
      raf = 0;
      el.style.background = "radial-gradient(circle " + r + "px at " + px + "px " + py + "px, " +
        "rgba(0,0,0,0) 0%, rgba(0,0,0,0) 55%, rgba(0,0,0," + dim + ") 100%)";
    }
    apply();

    function to(x, y) { if (typeof x !== "number") return; px = x; py = y; if (!raf) raf = requestAnimationFrame(apply); }
    window.addEventListener("pointermove", function (e) { to(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener("pointerdown", function (e) { to(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener("touchmove", function (e) { if (e.touches && e.touches[0]) to(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    window.addEventListener("resize", function () { if (!raf) raf = requestAnimationFrame(apply); }, { passive: true });
  }

  function initAll() {
    var list = document.querySelectorAll(".dyn-flash");
    for (var i = 0; i < list.length; i++) initEl(list[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAll);
  else initAll();
  /* Re-run when the section is (re)added or edited in the theme customizer. */
  document.addEventListener("shopify:section:load", initAll);
})();
