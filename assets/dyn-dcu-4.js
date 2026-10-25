
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

    function advance() { order.push(order.shift()); layout(); markThumb(); }
    function retreat() { order.unshift(order.pop()); layout(); markThumb(); }

    if (next) next.addEventListener("click", advance);
    if (prev) prev.addEventListener("click", retreat);

    /* Labelled thumbnail strip under the photo (phones — CSS hides it on
       desktop). Captions come from each product image's alt text: the part
       after the last comma, so "Custom printed t-shirt, front view" reads
       "front view" and "Black back" stays as is. */
    var thumbs = document.createElement("div");
    thumbs.className = "dyn-thumbs";
    (function () {
      var meta = {};
      (((window.DYN_SHOPIFY || {}).productImagesData) || []).forEach(function (im) {
        if (im && im.url) meta[String(im.url).split("?")[0]] = im.alt || "";
      });
      imgs.forEach(function (u, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "dyn-thumb" + (i === 0 ? " is-on" : "");
        var im = document.createElement("img");
        im.src = u; im.alt = ""; im.loading = "lazy"; im.draggable = false;
        b.appendChild(im);
        var cap = (meta[String(u).split("?")[0]] || "").split(",").pop().trim();
        if (cap) {
          var c = document.createElement("span");
          c.className = "dyn-thumb-cap";
          c.textContent = cap.charAt(0).toUpperCase() + cap.slice(1);
          b.appendChild(c);
        }
        b.addEventListener("click", function () {
          var at = order.indexOf(i);
          if (at > 0) { order = order.slice(at).concat(order.slice(0, at)); layout(); }
          markThumb();
        });
        thumbs.appendChild(b);
      });
      var main = host.closest(".gallery-main") || host.parentNode;
      if (main && main.parentNode) main.parentNode.insertBefore(thumbs, main.nextSibling);
    })();
    function markThumb() {
      Array.prototype.forEach.call(thumbs.children, function (t, i) {
        t.classList.toggle("is-on", order[0] === i);
      });
    }

    /* Choosing a colour variant brings that colour's photo to the front of the
       deck (the app announces the variant's image; sizes differ only in the
       query string, so cards match on pathname). */
    document.addEventListener("dyn:variant-image", function (e) {
      var u = e.detail && e.detail.url; if (!u) return;
      var path = String(u).split("?")[0];
      var at = -1;
      imgs.forEach(function (x, i) { if (String(x).split("?")[0] === path) at = i; });
      if (at < 0) return;
      var pos = order.indexOf(at);
      if (pos > 0) { order = order.slice(pos).concat(order.slice(0, pos)); layout(); }
      markThumb();
    });

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
