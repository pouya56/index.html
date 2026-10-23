
  /* The circle-fill on Customize / Add to Cart starts from where the pointer
     enters (and unfills toward where it leaves). */
  (function () {
    ["customizeBtn", "pageAddCart"].forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;
      function setOrigin(e) {
        var r = btn.getBoundingClientRect();
        btn.style.setProperty("--mx", (e.clientX - r.left) + "px");
        btn.style.setProperty("--my", (e.clientY - r.top) + "px");
      }
      btn.addEventListener("pointerenter", setOrigin);
      btn.addEventListener("pointerleave", setOrigin);
    });
    /* "Add design": on click, flip to the green check for a moment, then let
       the real action run (which adds the design and closes the window).
       Capture phase + a re-fired click so we run before the app's handler. */
    document.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("#uploadApply") : null;
      if (!t || t.hasAttribute("disabled")) return;
      if (t.dataset.dynDone) return;              /* the re-fired click passes straight through */
      e.preventDefault(); e.stopImmediatePropagation();
      t.classList.add("is-flipped");              /* green face + check mark */
      t.dataset.dynDone = "1";
      setTimeout(function () { t.click(); }, 850); /* then the design is added & the window closes */
    }, true);
  })();
