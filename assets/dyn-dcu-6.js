
(function () {
  function ready(fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }
  ready(function () {
    var root = document.getElementById("modalRoot");
    if (!root || !window.MutationObserver) return;
    var stageHolder = null, toolsHolder = null;
    var appliedOrig = null; /* the untouched product photo, kept while a design preview is painted over it */

    /* After Add design, the page photo shows the customer's design in place
       (the same composited preview the bulk request attaches). Removing the
       design puts the original photo back. */
    function pageImgs() {
      return Array.prototype.slice.call(document.querySelectorAll(
        ".gallery-main .dyn-cards img, #galleryStage img")).slice(0, 2);
    }
    function paintAppliedPreview() {
      var pv = (window.DYN_DESIGN_PREVIEWS || {});
      var imgs = pageImgs();
      if (!imgs.length) return;
      if (pv.front) {
        if (appliedOrig === null) appliedOrig = imgs[0].currentSrc || imgs[0].src;
        imgs.forEach(function (im) { im.removeAttribute("srcset"); im.src = pv.front; });
      } else if (appliedOrig !== null) {
        imgs.forEach(function (im) { im.src = appliedOrig; });
        appliedOrig = null;
      }
    }

    function cleanup() {
      if (stageHolder && stageHolder.parentNode) stageHolder.parentNode.removeChild(stageHolder);
      if (toolsHolder && toolsHolder.parentNode) toolsHolder.parentNode.removeChild(toolsHolder);
      stageHolder = toolsHolder = null;
    }
    /* Adopt the designer's live nodes into the page (listeners ride along):
       the stage onto the product image, tabs/controls/footer under the
       Start Designing button. Returns false for modal types this doesn't
       cover (they keep the normal popup). */
    function engage() {
      if (!root.querySelector(".modal-sheet.engrave-sheet")) return false;
      var stage = root.querySelector(".engrave-stage");
      if (stage) { /* fresh build - (re)adopt it */
        cleanup();
        var gal = document.querySelector(".gallery-main");
        var bar = document.getElementById("dynActionBar");
        if (!gal || !bar || !bar.parentNode) return false;
        stageHolder = document.createElement("div");
        stageHolder.id = "dynInlineStage";
        stageHolder.appendChild(stage);
        gal.appendChild(stageHolder);
        toolsHolder = document.createElement("div");
        toolsHolder.id = "dynInlineTools";
        var tabs = root.querySelector(".side-tabs");
        if (tabs) toolsHolder.appendChild(tabs);
        var ctr = root.querySelector(".up-controls");
        if (ctr) toolsHolder.appendChild(ctr);
        var foot = root.querySelector(".modal-foot");
        if (foot) toolsHolder.appendChild(foot);
        bar.parentNode.insertBefore(toolsHolder, bar.nextSibling);
        /* same image as the page: the front view shows the photo the
           customer was just looking at, not the designer's own mock */
        var applyPageImage = function () {
          var pageImg = document.querySelector(".gallery-main .dyn-cards img") ||
                        document.querySelector("#galleryStage img");
          var frameImg = stageHolder && stageHolder.querySelector(".engrave-frame > img");
          /* never seed the designer with an already-composited preview - the
             live layers would print on top of themselves */
          var src = appliedOrig || (pageImg && (pageImg.currentSrc || pageImg.src));
          if (frameImg && src) frameImg.src = src;
        };
        applyPageImage();
        toolsHolder.addEventListener("click", function (e) {
          var t = e.target.closest(".side-tab");
          /* switching back to Front restores the designer mock - re-apply */
          if (t && t.getAttribute("data-side") === "front") setTimeout(applyPageImage, 0);
        });
      }
      if (!stageHolder || !toolsHolder) return false;
      stageHolder.hidden = false;
      toolsHolder.hidden = false;
      /* re-opening an existing design: the primary reads Update, not Add */
      var applyBtn = toolsHolder.querySelector("#uploadApply");
      var pageAdd = document.getElementById("pageAddCart");
      if (applyBtn && pageAdd && !pageAdd.hidden) applyBtn.textContent = "Update design";
      return true;
    }
    var wasOpen = false;
    function sync() {
      var open = root.classList.contains("open");
      var inline = open && engage();
      document.documentElement.classList.toggle("dyn-designing", inline);
      if (inline) {
        /* page stays scrollable: openModal also sets the no-scroll CLASS,
           which otherwise keeps the body locked on phones */
        document.body.style.overflow = "";
        document.body.classList.remove("no-scroll");
        /* designing starts from buttons far below the gallery on phones -
           bring the photo (now the design surface) into view, once per open */
        if (!wasOpen && stageHolder) {
          var r = stageHolder.getBoundingClientRect();
          var vh = window.innerHeight || 0;
          var visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
          if (visible < Math.min(r.height, vh) * 0.6) {
            stageHolder.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }
      wasOpen = open;
      if (!open) {
        if (stageHolder) stageHolder.hidden = true;
        if (toolsHolder) toolsHolder.hidden = true;
        /* the composite renders just after apply - retry briefly until it lands */
        var tries = 0;
        (function poll() {
          paintAppliedPreview();
          if (++tries < 8 && !(window.DYN_DESIGN_PREVIEWS || {}).front) setTimeout(poll, 150);
        })();
      }
    }
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["class"], childList: true });
  });
})();
