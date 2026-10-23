
(function () {
  var t = document.getElementById("dcTabs");
  if (!t || t.__dcWheel) return;
  t.__dcWheel = true;
  /* vertical wheel scrolls the row horizontally while the pointer is on it */
  t.addEventListener("wheel", function (e) {
    if (t.scrollWidth <= t.clientWidth + 2) return;
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!d) return;
    t.scrollLeft += d;
    e.preventDefault();
  }, { passive: false });
  /* mouse drag scrolls too; a real drag swallows the click so no tab fires */
  var down = false, sx = 0, sl = 0, dragPx = 0;
  t.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    down = true; sx = e.clientX; sl = t.scrollLeft; dragPx = 0;
  });
  t.addEventListener("pointermove", function (e) {
    if (!down) return;
    var dx = e.clientX - sx;
    if (Math.abs(dx) > 4) { dragPx = Math.abs(dx); t.scrollLeft = sl - dx; }
  });
  window.addEventListener("pointerup", function () { down = false; });
  t.addEventListener("click", function (e) {
    if (dragPx > 6) { e.stopPropagation(); e.preventDefault(); }
    dragPx = 0;
  }, true);
  /* fade the edges that hide more tabs */
  function fades() {
    var max = t.scrollWidth - t.clientWidth;
    t.classList.toggle("is-moreL", t.scrollLeft > 4);
    t.classList.toggle("is-moreR", max > 4 && t.scrollLeft < max - 4);
  }
  t.addEventListener("scroll", fades, { passive: true });
  window.addEventListener("resize", fades);
  fades();
  /* one-time nudge on first view: slide out and spring back */
  try {
    if (t.scrollWidth > t.clientWidth + 40 && !sessionStorage.getItem("dcTabsNudged")) {
      sessionStorage.setItem("dcTabsNudged", "1");
      setTimeout(function () {
        t.scrollTo({ left: 44, behavior: "smooth" });
        setTimeout(function () { t.scrollTo({ left: 0, behavior: "smooth" }); }, 420);
      }, 900);
    }
  } catch (e0) {}
})();
