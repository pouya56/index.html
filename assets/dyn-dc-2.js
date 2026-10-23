
/* Instagram-style save button -> browser wishlist (same "dyn_wishlist" list the
   wishlist page and header drawer use). */
(function () {
  var KEY = "dyn_wishlist";
  var btns = document.querySelectorAll(".dyn-col .dc-save");
  if (!btns.length) return;
  function read() { try { var a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function write(l) { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} try { window.dispatchEvent(new CustomEvent("dyn-wishlist-change")); } catch (e) {} }
  function has(id) { return read().some(function (x) { return String(x.id) === String(id); }); }
  function paint() {
    btns.forEach(function (b) {
      var on = has(b.getAttribute("data-wl-id"));
      b.classList.toggle("is-saved", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-label", on ? "Saved — remove from wishlist" : "Save to wishlist");
    });
  }
  btns.forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      var id = b.getAttribute("data-wl-id"), l = read(), i = -1, k;
      for (k = 0; k < l.length; k++) { if (String(l[k].id) === String(id)) { i = k; break; } }
      if (i >= 0) { l.splice(i, 1); }
      else {
        l.unshift({ id: id, title: b.getAttribute("data-wl-title"), url: b.getAttribute("data-wl-url"), image: b.getAttribute("data-wl-image"), price: b.getAttribute("data-wl-price") });
        b.classList.remove("just-saved"); void b.offsetWidth; b.classList.add("just-saved");
      }
      write(l); paint();
    });
  });
  window.addEventListener("dyn-wishlist-change", paint);
  window.addEventListener("storage", function (e) { if (e.key === KEY) paint(); });
  paint();
})();
