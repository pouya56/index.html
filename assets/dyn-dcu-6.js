
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
    var reapplyPageImage = null; /* re-seeds the stage photo on every re-engagement, not just the first build */
    function isPhone() { return !!(window.matchMedia && window.matchMedia("(max-width: 860px)").matches); }

    /* Phones: the step strip (and the print-location chips) lead the design
       step, above the photo — like the artwork-step mock. The strip goes
       back to its home before the action bar when designing ends. */
    function moveStepsInto(holder) {
      var steps = document.getElementById("dynSteps");
      if (steps && holder && steps.parentNode !== holder) holder.insertBefore(steps, holder.firstChild);
    }
    function moveStepsUp() { moveStepsInto(topHolder); }
    function restoreSteps() {
      var steps = document.getElementById("dynSteps");
      if (!steps) return;
      if (!isPhone() && stepsBand) { moveStepsInto(stepsBand); return; }
      var bar = document.getElementById("dynActionBar");
      if (bar && bar.parentNode && steps.parentNode !== bar.parentNode) {
        bar.parentNode.insertBefore(steps, bar);
      }
    }

    /* Desktop: the step strip reads as a full-width band above the product
       columns, and the right column leads with a numbered step heading that
       follows the state (01 Product / 02 Artwork / 04 Order). */
    var stepsBand = null, stepHead = null;
    function ensureDesktopChrome() {
      if (isPhone()) return;
      var buyBox = document.getElementById("buyBox");
      var prod = document.querySelector("main.product") || document.querySelector(".product");
      if (!buyBox || !prod || !prod.parentNode) return;
      if (!stepHead) {
        stepHead = document.createElement("div");
        stepHead.id = "dynStepHead";
        stepHead.innerHTML = '<div class="dsh-row"><span class="dsh-num"></span><span class="dsh-t"></span></div><div class="dsh-sub"></div>';
        buyBox.insertBefore(stepHead, buyBox.firstChild);
      }
      if (!stepsBand) {
        stepsBand = document.createElement("div");
        stepsBand.id = "dynStepsBand";
        prod.parentNode.insertBefore(stepsBand, prod);
      }
      moveStepsInto(stepsBand);
      updateStepHead();
    }
    function updateStepHead() {
      if (!stepHead) return;
      var designing = document.documentElement.classList.contains("dyn-designing");
      var review = document.documentElement.classList.contains("dyn-review");
      var gift = !!window.__dynGiftGate;   // design saved, gift decision pending
      var s = designing ? ["02", "Artwork", "Upload and position your design."]
            : review ? ["04", "Order", "Review your order before adding to cart."]
            : gift ? ["03", "Gift", "Optional — add a personal touch to your order."]
            : ["01", "Product", "Choose your product, color and size."];
      stepHead.querySelector(".dsh-num").textContent = s[0];
      stepHead.querySelector(".dsh-t").textContent = s[1];
      stepHead.querySelector(".dsh-sub").textContent = s[2];
      document.documentElement.classList.toggle("dyn-gifting", gift && !designing && !review);
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

    /* A colour switch re-composites the applied previews on the new photo
       (the app republishes them async). Keep the restore point on the new
       colour and repaint the page cards as the fresh composite lands. */
    document.addEventListener("dyn:variant-image", function (e) {
      var u = e.detail && e.detail.url; if (!u) return;
      if (appliedOrig !== null) appliedOrig = u;
      var tries = 0;
      (function poll() {
        paintAppliedPreview();
        if (++tries < 10) setTimeout(poll, 250);
      })();
    });

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
          /* A configured Front image is a calibrated mock - the print-area
             coordinates were set against it (e.g. the mug's wrap template),
             so never swap it for an arbitrary gallery photo. The designer
             already picks the right surface (variant photo, then the
             configured front image) on its own. */
          if ((window.DYN_SETTINGS || {}).frontImage) return;
          var pageImg = document.querySelector(".gallery-main .dyn-cards img") ||
                        document.querySelector("#galleryStage img");
          var frameImg = stageHolder && stageHolder.querySelector(".engrave-frame > img");
          /* the chosen colour's own photo wins (white pen vs black pen);
             never seed the designer with an already-composited preview - the
             live layers would print on top of themselves */
          var src = window.__dynVariantImage || appliedOrig ||
                    (pageImg && (pageImg.currentSrc || pageImg.src));
          if (frameImg && src) frameImg.src = src;
        };
        applyPageImage();
        reapplyPageImage = applyPageImage;
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
      /* a colour picked since the last session must show on the surface */
      if (reapplyPageImage) reapplyPageImage();
      if (topHolder) { topHolder.hidden = false; moveStepsUp(); }
      /* re-opening an existing design: the primary reads Update, not Add */
      var applyBtn = toolsHolder.querySelector("#uploadApply");
      var pageAdd = document.getElementById("pageAddCart");
      if (applyBtn && pageAdd && !pageAdd.hidden) applyBtn.textContent = "Update design";
      return true;
    }
    /* Step 4 on phones: once the design is saved, the page reads as an order
       review — headline + Front/Back preview toggle above the photo, and a
       summary card with Edit rows above Add to Cart. "Edit Product" returns
       to the plain product page until the design is saved again. */
    var reviewTop = null, reviewCard = null, reviewDismissed = false;
    function designReadyNow() {
      var b = document.getElementById("pageAddCart");
      return !!(b && !b.hidden);
    }
    function removeReview() {
      if (reviewTop) reviewTop.remove();
      if (reviewCard) reviewCard.remove();
      reviewTop = reviewCard = null;
    }
    function buildReview() {
      removeReview();
      var pv = window.DYN_DESIGN_PREVIEWS || {};
      var galWrap = document.querySelector(".gallery");
      var bar = document.getElementById("dynActionBar");
      if (!galWrap || !galWrap.parentNode || !bar || !bar.parentNode) return;
      reviewTop = document.createElement("div");
      reviewTop.id = "dynReviewTop";
      var t = document.createElement("div"); t.className = "rv-title"; t.textContent = "Review your order";
      var s = document.createElement("div"); s.className = "rv-sub"; s.textContent = "Everything look good? Add to cart to continue.";
      reviewTop.appendChild(t); reviewTop.appendChild(s);
      if (pv.front && pv.back) {
        var tg = document.createElement("div"); tg.className = "rv-sides";
        ["front", "back"].forEach(function (side, i) {
          var b = document.createElement("button"); b.type = "button";
          b.className = "rv-side" + (i === 0 ? " on" : "");
          b.textContent = side === "front" ? "Front" : "Back";
          b.addEventListener("click", function () {
            Array.prototype.forEach.call(tg.children, function (x) { x.classList.toggle("on", x === b); });
            pageImgs().forEach(function (im) { im.removeAttribute("srcset"); im.src = pv[side]; });
          });
          tg.appendChild(b);
        });
        reviewTop.appendChild(tg);
      }
      galWrap.parentNode.insertBefore(reviewTop, galWrap);
      if (isPhone()) moveStepsInto(reviewTop);

      reviewCard = document.createElement("div");
      reviewCard.id = "dynReviewCard";
      var head = document.createElement("div"); head.className = "rv-chead";
      /* both sides preview in the summary when a back design exists */
      var th = document.createElement("div"); th.className = "rv-thumbs";
      ["front", "back"].forEach(function (side) {
        if (!pv[side]) return;
        var im = document.createElement("img");
        im.className = "rv-thumb"; im.alt = ""; im.src = pv[side];
        th.appendChild(im);
      });
      var main = document.createElement("div"); main.className = "rv-main";
      var nm = document.createElement("div"); nm.className = "rv-name";
      nm.textContent = (window.DYN_SHOPIFY || {}).productTitle || "";
      var opts = document.createElement("div"); opts.className = "rv-opts";
      var vals = Array.prototype.map.call(document.querySelectorAll("#buyBox .opt-val"), function (v) {
        return (v.textContent || "").trim();
      }).filter(Boolean);
      var qn = (document.getElementById("qtyInput") || {}).value;
      opts.textContent = vals.join(" · ") + (pv.back ? " · Front + Back print" : " · Front print") +
        (qn && qn !== "1" ? " · Qty: " + qn : "");
      main.appendChild(nm); main.appendChild(opts);
      var pr = document.createElement("div"); pr.className = "rv-price";
      pr.textContent = ((document.getElementById("pPrice") || {}).textContent || "").trim();
      head.appendChild(th); head.appendChild(main); head.appendChild(pr);
      reviewCard.appendChild(head);
      var rows = [
        ["Edit product", function () { enterProductEdit(); }],
        ["Edit artwork", function () {
          var st = document.querySelector(".dyn-step.is-link");
          if (st) st.click();
        }]
      ];
      if (document.getElementById("giftOpenBtn")) {
        rows.push(["Edit gift options", function () {
          var g = document.getElementById("giftOpenBtn");
          if (g) g.click();
        }]);
      }
      rows.forEach(function (r) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "rv-row";
        b.textContent = r[0];
        b.addEventListener("click", r[1]);
        /* circle-fill origin follows the pointer, like Start Designing */
        function rvOrigin(e) {
          var rr = b.getBoundingClientRect();
          b.style.setProperty("--mx", (e.clientX - rr.left) + "px");
          b.style.setProperty("--my", (e.clientY - rr.top) + "px");
        }
        b.addEventListener("pointerenter", rvOrigin);
        b.addEventListener("pointerleave", rvOrigin);
        reviewCard.appendChild(b);
      });
      bar.parentNode.insertBefore(reviewCard, bar);
    }
    function syncReview() {
      var pv = window.DYN_DESIGN_PREVIEWS || {};
      /* a back preview that landed after the first build earns the toggle */
      if (reviewCard && pv.back && reviewTop && !reviewTop.querySelector(".rv-sides")) removeReview();
      var on = designReadyNow() && !reviewDismissed &&
               !document.documentElement.classList.contains("dyn-designing");
      if (on && !reviewCard) buildReview();
      document.documentElement.classList.toggle("dyn-review", on && !!reviewCard);
      if (reviewTop) reviewTop.hidden = !on;
      if (reviewCard) reviewCard.hidden = !on;
      if (on) exitProductEdit(false);
      if (on && isPhone()) moveStepsInto(reviewTop);
      else if (!on && !document.documentElement.classList.contains("dyn-designing")) restoreSteps();
      updateStepHead();
    }
    /* Edit product swaps Add to Cart for an Update button: the customer
       changes colour / size / quantity, then Update confirms and returns
       to the review step with the summary rebuilt. */
    var updBtn = null;
    function ensureUpdateBtn() {
      if (updBtn) return updBtn;
      var add = document.getElementById("pageAddCart");
      if (!add || !add.parentNode) return null;
      updBtn = document.createElement("button");
      updBtn.type = "button";
      updBtn.id = "dynUpdateBtn";
      updBtn.className = add.className;
      updBtn.textContent = "Update";
      updBtn.hidden = true;
      add.parentNode.insertBefore(updBtn, add.nextSibling);
      updBtn.addEventListener("click", function () { exitProductEdit(true); });
      return updBtn;
    }
    function enterProductEdit() {
      reviewDismissed = true;
      syncReview();
      var b = ensureUpdateBtn();
      var add = document.getElementById("pageAddCart");
      if (b) b.hidden = false;
      if (add) add.style.display = "none";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    function exitProductEdit(toReview) {
      var add = document.getElementById("pageAddCart");
      if (updBtn) updBtn.hidden = true;
      if (add) add.style.display = "";
      if (toReview) {
        reviewDismissed = false;
        removeReview();          /* rebuild with the new options and price */
        syncReview();
        var top = document.getElementById("dynReviewTop");
        if (top) top.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    (function () {
      var addBtn = document.getElementById("pageAddCart");
      if (addBtn) new MutationObserver(syncReview).observe(addBtn, { attributes: true, attributeFilter: ["hidden"] });
      window.addEventListener("dyn-design-added", function () {
        reviewDismissed = false;
        removeReview();           /* previews changed - rebuild fresh */
        setTimeout(syncReview, 400);
      });
    })();

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
      updateStepHead();
      wasOpen = open;
      if (!open) {
        if (stageHolder) stageHolder.hidden = true;
        if (toolsHolder) toolsHolder.hidden = true;
        if (topHolder) { topHolder.hidden = true; restoreSteps(); }
        /* the composite renders just after apply - retry briefly until it lands */
        var tries = 0;
        (function poll() {
          paintAppliedPreview();
          syncReview();
          if (++tries < 8 && !(window.DYN_DESIGN_PREVIEWS || {}).front) setTimeout(poll, 150);
        })();
      }
      syncReview();
    }
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["class"], childList: true });
    ensureDesktopChrome();
    [300, 1000, 2500].forEach(function (ms) { setTimeout(ensureDesktopChrome, ms); });
  });
})();
