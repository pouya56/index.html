
  /* Turn the product photos into a swipeable card-stack deck (like the Swiper
     "cards" effect, but self-contained). Reads the same images the app uses; if
     there are none it reveals the original single-image stage instead. */
  (function () {
    var host = document.getElementById("dynCards");
    var stage = document.getElementById("galleryStage");
    var oPrev = document.getElementById("galPrev"), oNext = document.getElementById("galNext");
    var prev = document.getElementById("cardsPrev"), next = document.getElementById("cardsNext");
    if (!host) return;

    function images() {
      var el = document.getElementById("dynCardsData");
      if (!el) return [];
      var d; try { d = JSON.parse(el.textContent); } catch (e) { return []; }
      var p = (d.product || []).filter(Boolean); if (p.length) return p;
      var g = (d.gallery || []).filter(Boolean); if (g.length) return g;
      return (d.demo || []).filter(Boolean);
    }

    var imgs = images();
    if (!imgs.length) {
      host.style.display = "none";
      if (stage) stage.removeAttribute("hidden");
      if (prev && oPrev) prev.addEventListener("click", function () { oPrev.click(); });
      if (next && oNext) next.addEventListener("click", function () { oNext.click(); });
      return;
    }

    /* Keep the app's single-image stage out of the way, even if its script
       tries to re-show it (a class rule can override the [hidden] attribute). */
    function hideStage() {
      if (!stage) return;
      stage.setAttribute("hidden", "");
      stage.style.setProperty("display", "none", "important");
    }
    hideStage();
    if (stage && window.MutationObserver) {
      new MutationObserver(hideStage).observe(stage, { attributes: true, attributeFilter: ["hidden", "style", "class"] });
    }

    /* Build the deck. order[0] is the front card. */
    var cards = imgs.map(function (u) {
      var c = document.createElement("div");
      c.className = "dyn-card";
      var im = document.createElement("img");
      im.src = u; im.alt = ""; im.loading = "lazy"; im.draggable = false;
      c.appendChild(im); host.appendChild(c);
      return c;
    });
    var order = cards.map(function (_, i) { return i; });
    var VISIBLE = 4, OFFSET = 16, SCALE = 0.05;

    function layout(dragCard, dx) {
      for (var pos = 0; pos < order.length; pos++) {
        var c = cards[order[pos]];
        if (c === dragCard) continue;
        var d = Math.min(pos, VISIBLE);
        c.style.zIndex = String(order.length - pos);
        c.style.opacity = pos > VISIBLE ? "0" : "1";
        c.style.transform = "translateY(" + (d * OFFSET) + "px) scale(" + (1 - d * SCALE) + ")";
        c.classList.remove("is-drag");
      }
    }
    layout();

    function advance() { order.push(order.shift()); layout(); }
    function retreat() { order.unshift(order.pop()); layout(); }

    if (next) next.addEventListener("click", advance);
    if (prev) prev.addEventListener("click", retreat);

    /* Drag the front card to flip through. */
    var startX = 0, dx = 0, dragging = false, frontEl = null;
    function onDown(e) {
      frontEl = cards[order[0]];
      if (!frontEl) return;
      dragging = true; startX = (e.touches ? e.touches[0].clientX : e.clientX);
      frontEl.classList.add("is-drag");
      document.addEventListener("pointermove", onMove); document.addEventListener("pointerup", onUp);
    }
    function onMove(e) {
      if (!dragging) return;
      dx = (e.touches ? e.touches[0].clientX : e.clientX) - startX;
      frontEl.style.transform = "translateX(" + dx + "px) rotate(" + (dx * 0.04) + "deg)";
    }
    function onUp() {
      if (!dragging) return; dragging = false;
      document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", onUp);
      frontEl.classList.remove("is-drag");
      var w = host.clientWidth || 300;
      if (Math.abs(dx) > w * 0.28) {
        frontEl.style.transform = "translateX(" + (dx > 0 ? 1 : -1) * (w * 1.6) + "px) rotate(" + (dx > 0 ? 22 : -22) + "deg)";
        setTimeout(advance, 220);
      } else { layout(); }
      dx = 0;
    }
    host.addEventListener("pointerdown", onDown);
  })();
