
(function () {
  function ready(fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }
  ready(function () {
    var root = document.getElementById("modalRoot");
    if (!root || !window.MutationObserver) return;

    /* Product pages, phones: the product name reads as a subtitle under the
       logo masthead (the buy box hides its own title there — see the
       mobile CSS in dynamic-editorial.css). */
    (function () {
      var tb = document.getElementById("dynTopbar");
      var title = (window.DYN_SHOPIFY || {}).productTitle;
      if (!tb || !title || !document.getElementById("buyBox")) return;
      var sub = document.createElement("div");
      sub.className = "dyn-topbar-sub";
      sub.textContent = title;
      tb.appendChild(sub);
    })();
    var stageHolder = null, toolsHolder = null, topHolder = null;
    var appliedOrig = null; /* the untouched product photo, kept while a design preview is painted over it */
    function isPhone() { return !!(window.matchMedia && window.matchMedia("(max-width: 860px)").matches); }

    /* Phones: the step strip (and the print-location chips) lead the design
       step, above the photo — like the artwork-step mock. The strip goes
       back to its home before the action bar when designing ends. */
    function moveStepsUp() {
      var steps = document.getElementById("dynSteps");
      if (steps && topHolder && steps.parentNode !== topHolder) topHolder.insertBefore(steps, topHolder.firstChild);
    }
    function restoreSteps() {
      var steps = document.getElementById("dynSteps");
      var bar = document.getElementById("dynActionBar");
      if (steps && bar && bar.parentNode && steps.parentNode !== bar.parentNode) {
        bar.parentNode.insertBefore(steps, bar);
      }
    }

    /* Order summary card (phones): thumbnail, name + price, the chosen
       options, and an Edit button that leaves the design step. */
    function buildSummary() {
      var old = document.getElementById("dynDesignSummary");
      if (old) old.remove();
      if (!toolsHolder) return;
      var card = document.createElement("div");
      card.id = "dynDesignSummary";
      var th = document.createElement("img");
      th.className = "dds-thumb"; th.alt = "";
      var pageImg = document.querySelector(".gallery-main .dyn-cards img") || document.querySelector("#galleryStage img");
      th.src = appliedOrig || (pageImg && (pageImg.currentSrc || pageImg.src)) || "";
      var main = document.createElement("div");
      main.className = "dds-main";
      var nm = document.createElement("div");
      nm.className = "dds-name";
      nm.textContent = (window.DYN_SHOPIFY || {}).productTitle || "";
      var pr = document.createElement("div");
      pr.className = "dds-price";
      pr.textContent = ((document.getElementById("pPrice") || {}).textContent || "").trim();
      main.appendChild(nm); main.appendChild(pr);
      var opts = document.createElement("div");
      opts.className = "dds-opts";
      Array.prototype.forEach.call(document.querySelectorAll("#buyBox .opt-val"), function (v) {
        var t = (v.textContent || "").trim();
        if (!t) return;
        var d = document.createElement("div");
        d.textContent = t;
        opts.appendChild(d);
      });
      var edit = document.createElement("button");
      edit.type = "button"; edit.className = "dds-edit";
      edit.textContent = "Edit";
      edit.addEventListener("click", function () {
        var x = root.querySelector(".modal-close") || root.querySelector("[data-close]");
        if (x) x.click();
      });
      card.appendChild(th); card.appendChild(main); card.appendChild(opts); card.appendChild(edit);
      toolsHolder.appendChild(card);
    }

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
      restoreSteps();
      if (stageHolder && stageHolder.parentNode) stageHolder.parentNode.removeChild(stageHolder);
      if (toolsHolder && toolsHolder.parentNode) toolsHolder.parentNode.removeChild(toolsHolder);
      if (topHolder && topHolder.parentNode) topHolder.parentNode.removeChild(topHolder);
      stageHolder = toolsHolder = topHolder = null;
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
        var ploc = root.querySelector(".ploc-row");
        var tabs = root.querySelector(".side-tabs");
        var ctr = root.querySelector(".up-controls");
        var foot = root.querySelector(".modal-foot");
        if (isPhone()) {
          /* print location leads the step, above the photo */
          topHolder = document.createElement("div");
          topHolder.id = "dynDesignTop";
          if (ploc) topHolder.appendChild(ploc);
          var galWrap = gal.closest(".gallery") || gal;
          galWrap.parentNode.insertBefore(topHolder, galWrap);
          if (tabs) toolsHolder.appendChild(tabs);
        } else {
          if (ploc) toolsHolder.appendChild(ploc);
          if (tabs) toolsHolder.appendChild(tabs);
        }
        if (ctr) toolsHolder.appendChild(ctr);
        if (foot) toolsHolder.appendChild(foot);
        bar.parentNode.insertBefore(toolsHolder, bar.nextSibling);
        if (isPhone()) buildSummary();
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
        var onSideClick = function (e) {
          var t = e.target.closest(".side-tab");
          var p = e.target.closest(".ploc-chip");
          /* switching back to a front view restores the page photo - re-apply */
          var side = t ? t.getAttribute("data-side") : (p ? p.getAttribute("data-loc") : null);
          if (side === "front" || side === "both") setTimeout(applyPageImage, 0);
        };
        toolsHolder.addEventListener("click", onSideClick);
        if (topHolder) topHolder.addEventListener("click", onSideClick);
      }
      if (!stageHolder || !toolsHolder) return false;
      stageHolder.hidden = false;
      toolsHolder.hidden = false;
      if (topHolder) { topHolder.hidden = false; moveStepsUp(); }
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
        if (topHolder) { topHolder.hidden = true; restoreSteps(); }
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
