
  /* Rename the step strip to the studio words (behaviour is index-based). */
  (function () {
    var names = { "Customize": "Product", "Design": "Artwork", "Gift (optional)": "Gift", "Add to cart": "Order" };
    var tries = 0;
    (function relabel() {
      var strip = document.getElementById("dynSteps");
      if (!strip) { if (++tries < 60) setTimeout(relabel, 250); return; }
      Array.prototype.forEach.call(strip.querySelectorAll(".dyn-step-txt"), function (el) {
        var t = el.textContent.trim();
        if (names[t]) el.textContent = names[t];
      });
    })();
  })();
  