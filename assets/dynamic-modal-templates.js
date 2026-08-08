/* ==========================================================================
   DYNAEIMIC — specialized customization modal templates.
   --------------------------------------------------------------------------
   The theme ships four customization experiences that share one design
   system (same sheet, head, footer, close button, buttons and animations —
   the shell reuses the app's .modal-root / .modal-sheet / .modal-head /
   .modal-foot classes so the editorial chrome applies everywhere):

     1. Image customizer  — the app's full designer (upload, drag, resize,
        rotate, print areas, live preview). Built by dynamic-customizer.js.
     2. Text personalization — the app's engrave sheet (text, fonts, emoji,
        live preview). Built by dynamic-customizer.js.
     3. Paper product designer — THIS FILE. "Prepare Your Artwork": front and
        back artwork, bleed / trim / safe-area proof, paper and finish.
     4. Premium configurator — THIS FILE. "Build Your Product": material,
        size, printing, finish, artwork, review.

   Which one a product uses comes from the section's "Customization modal
   template" setting (read from #dyn-tpl-config). "auto" keeps the app's own
   image/text choice; "paper" and "configurator" take over the Customize
   button and open the templates below. Both add to cart through
   /cart/add.js with the configuration as line-item properties and the
   artwork attached as property files (Shopify hosts them, same as the
   app's own pipeline).
   ========================================================================== */
(function () {
  "use strict";
  if (window.__dynTplModals) return; window.__dynTplModals = true;

  /* ---- config ---------------------------------------------------------- */
  function readCfg() {
    try { return JSON.parse(document.getElementById("dyn-tpl-config").textContent) || {}; }
    catch (e) { return {}; }
  }
  function list(s, fallback) {
    return String(s || fallback).split(",").map(function (x) { return x.trim(); }).filter(Boolean);
  }
  var cfg = readCfg();
  var MODE = (cfg.template || "auto").toLowerCase();
  if (MODE !== "paper" && MODE !== "configurator") return; // auto → app engines

  function productName() {
    return (window.DYN_SHOPIFY && window.DYN_SHOPIFY.productTitle) || "";
  }

  /* ---- shared shell ---------------------------------------------------- */
  var CSS = "" +
    /* The base sheet starts invisible (the app reveals it with GSAP) — the
       templates use the same soft rise, driven by a transition on .open. */
    "#dynTplRoot .modal-sheet{max-width:1060px;width:94vw;opacity:0;transform:translateY(28px) scale(.985);" +
      "transition:opacity .38s cubic-bezier(.16,1,.3,1),transform .38s cubic-bezier(.16,1,.3,1);}" +
    "#dynTplRoot.open .modal-sheet{opacity:1;transform:none;}" +
    "@media (prefers-reduced-motion: reduce){#dynTplRoot .modal-sheet{transition:none;}}" +
    "#dynTplRoot .dyn-tpl-sub{font-size:10.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(23,19,15,.5);margin-top:5px;}" +
    "#dynTplRoot .modal-body{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:0;min-height:420px;}" +
    "@media (max-width:900px){#dynTplRoot .modal-body{grid-template-columns:1fr;}}" +
    "#dynTplRoot .dyn-tpl-stage{padding:28px;display:flex;align-items:center;justify-content:center;background:" +
      "repeating-linear-gradient(0deg,rgba(23,19,15,.035) 0 1px,transparent 1px 24px)," +
      "repeating-linear-gradient(90deg,rgba(23,19,15,.035) 0 1px,transparent 1px 24px),#faf9f5;}" +
    "#dynTplRoot .dyn-tpl-panel{padding:26px 26px 18px;border-left:1px solid rgba(23,19,15,.12);overflow-y:auto;max-height:64vh;}" +
    "@media (max-width:900px){#dynTplRoot .dyn-tpl-panel{border-left:0;border-top:1px solid rgba(23,19,15,.12);max-height:none;}}" +
    "#dynTplRoot .dyn-tpl-label{font-size:9.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(23,19,15,.6);margin:0 0 9px;}" +
    "#dynTplRoot .dyn-tpl-group{margin-bottom:22px;}" +
    "#dynTplRoot .dyn-tpl-chips{display:flex;flex-wrap:wrap;gap:8px;}" +
    "#dynTplRoot .dyn-tpl-chip{border:1px solid rgba(23,19,15,.4);border-radius:2px;background:transparent;color:#17130f;" +
      "font:700 11px/1 inherit;letter-spacing:.1em;text-transform:uppercase;padding:10px 14px;cursor:pointer;" +
      "transition:background .18s ease,color .18s ease,border-color .18s ease,transform .18s ease;}" +
    "#dynTplRoot .dyn-tpl-chip:hover{border-color:#17130f;transform:translateY(-1px);}" +
    "#dynTplRoot .dyn-tpl-chip[aria-pressed=\"true\"]{background:#17130f;color:#f6f5f1;border-color:#17130f;}" +
    /* proof (paper template) */
    "#dynTplRoot .dyn-tpl-proof{position:relative;width:100%;max-width:520px;}" +
    "#dynTplRoot .dyn-tpl-bleedbox{position:relative;width:100%;background:#fff;box-shadow:0 18px 44px -20px rgba(23,19,15,.45);overflow:hidden;}" +
    "#dynTplRoot .dyn-tpl-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}" +
    "#dynTplRoot .dyn-tpl-trim{position:absolute;border:1.5px solid #b3242a;pointer-events:none;}" +
    "#dynTplRoot .dyn-tpl-safe{position:absolute;border:1.5px dashed rgba(23,19,15,.55);pointer-events:none;}" +
    "#dynTplRoot .dyn-tpl-bleedhatch{position:absolute;inset:0;pointer-events:none;" +
      "background:repeating-linear-gradient(45deg,rgba(179,36,42,.10) 0 6px,transparent 6px 12px);}" +
    "#dynTplRoot .dyn-tpl-guide-tags{position:absolute;left:0;right:0;top:100%;display:flex;gap:14px;padding-top:10px;justify-content:center;}" +
    "#dynTplRoot .dyn-tpl-guide-tag{font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(23,19,15,.55);}" +
    "#dynTplRoot .dyn-tpl-guide-tag i{font-style:normal;color:#b3242a;}" +
    "#dynTplRoot .dyn-tpl-dropface{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;" +
      "border:1.5px dashed rgba(23,19,15,.35);cursor:pointer;transition:border-color .18s ease,background .18s ease;}" +
    "#dynTplRoot .dyn-tpl-dropface:hover{border-color:#17130f;}" +
    "#dynTplRoot .dyn-tpl-dropface.is-drag{border-color:#b3242a;background:rgba(255,255,255,.7);}" +
    "#dynTplRoot .dyn-tpl-dropface b{font-size:10px;font-weight:800;letter-spacing:.26em;text-transform:uppercase;}" +
    "#dynTplRoot .dyn-tpl-dropface span{font-size:12px;color:rgba(23,19,15,.6);}" +
    "#dynTplRoot .dyn-tpl-sidetabs{display:flex;gap:8px;margin-bottom:18px;}" +
    "#dynTplRoot .dyn-tpl-filerow{display:flex;align-items:center;gap:8px;font-size:12.5px;padding:8px 10px;margin-top:8px;" +
      "background:#fff;border:1px solid rgba(23,19,15,.16);border-left:3px solid #b3242a;border-radius:2px;}" +
    "#dynTplRoot .dyn-tpl-filerow small{color:rgba(23,19,15,.5);margin-left:auto;white-space:nowrap;}" +
    "#dynTplRoot .dyn-tpl-fx{border:0;background:none;cursor:pointer;font-size:14px;color:rgba(23,19,15,.5);padding:2px 4px;}" +
    "#dynTplRoot .dyn-tpl-fx:hover{color:#b3242a;}" +
    "#dynTplRoot .dyn-tpl-note{font-size:11px;line-height:1.55;color:rgba(23,19,15,.55);margin-top:10px;}" +
    /* stepper (configurator) */
    "#dynTplRoot .dyn-tpl-steps{display:flex;flex-wrap:wrap;gap:6px 14px;padding:14px 26px 0;}" +
    "#dynTplRoot .dyn-tpl-step{font-size:9.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(23,19,15,.35);}" +
    "#dynTplRoot .dyn-tpl-step i{font-style:normal;margin-right:5px;}" +
    "#dynTplRoot .dyn-tpl-step.is-active{color:#17130f;}#dynTplRoot .dyn-tpl-step.is-active i{color:#b3242a;}" +
    "#dynTplRoot .dyn-tpl-step.is-done{color:rgba(23,19,15,.6);}" +
    "#dynTplRoot .dyn-tpl-step.is-done::after{content:\" \\2713\";color:#b3242a;}" +
    "#dynTplRoot .dyn-tpl-single .modal-body{grid-template-columns:1fr;}" +
    "#dynTplRoot .dyn-tpl-pane{padding:26px;}" +
    "#dynTplRoot .dyn-tpl-review{border-top:1px solid rgba(23,19,15,.16);}" +
    "#dynTplRoot .dyn-tpl-review-row{display:flex;justify-content:space-between;gap:18px;padding:12px 2px;border-bottom:1px solid rgba(23,19,15,.12);}" +
    "#dynTplRoot .dyn-tpl-review-row b{font-size:9.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(23,19,15,.55);padding-top:2px;}" +
    "#dynTplRoot .dyn-tpl-review-row span{font-family:Georgia,'Times New Roman',serif;font-size:15px;text-align:right;}" +
    "#dynTplRoot .modal-foot .dyn-tpl-hint{font-size:10.5px;letter-spacing:.08em;color:rgba(23,19,15,.5);margin-right:auto;}" +
    "#dynTplRoot .dyn-tpl-empty-hint{font-size:11px;color:rgba(23,19,15,.45);letter-spacing:.06em;}";

  function injectCSS() {
    if (document.getElementById("dynTplCss")) return;
    var st = document.createElement("style"); st.id = "dynTplCss"; st.textContent = CSS;
    document.head.appendChild(st);
  }

  var rootEl = null;
  function shell(titleHtml, subText, bodyHtml, footHtml, extraClass) {
    injectCSS();
    if (!rootEl) {
      rootEl = document.createElement("div");
      rootEl.className = "modal-root"; rootEl.id = "dynTplRoot";
      rootEl.setAttribute("aria-hidden", "true");
      document.body.appendChild(rootEl);
    }
    rootEl.innerHTML =
      '<div class="modal-scrim" data-close></div>' +
      '<div class="modal-sheet ' + (extraClass || "") + '" role="dialog" aria-modal="true" aria-labelledby="dynTplTitle">' +
        '<div class="modal-head"><div>' +
          '<h2 id="dynTplTitle">' + titleHtml + "</h2>" +
          (subText ? '<div class="dyn-tpl-sub">' + esc(subText) + "</div>" : "") +
        "</div>" +
        '<button class="modal-close" data-close aria-label="Close">\u2715</button></div>' +
        bodyHtml +
        '<div class="modal-foot">' + footHtml + "</div>" +
      "</div>";
    rootEl.addEventListener("click", onRootClick);
    document.addEventListener("keydown", onKey);
    rootEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    /* .open lands a frame later so the sheet's rise transition actually runs */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { rootEl.classList.add("open"); });
    });
    return rootEl;
  }
  function closeShell() {
    if (!rootEl) return;
    rootEl.classList.remove("open");
    rootEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function onRootClick(e) { if (e.target.closest("[data-close]")) closeShell(); }
  function onKey(e) { if (e.key === "Escape" && rootEl && rootEl.classList.contains("open")) closeShell(); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtSize(b) {
    if (b >= 1048576) return (b / 1048576).toFixed(1) + " MB";
    if (b >= 1024) return Math.round(b / 1024) + " KB";
    return b + " B";
  }
  function chipRow(id, options, selected) {
    return '<div class="dyn-tpl-chips" data-chips="' + id + '">' + options.map(function (o) {
      return '<button type="button" class="dyn-tpl-chip" data-value="' + esc(o) + '" aria-pressed="' + String(o === selected) + '">' + esc(o) + "</button>";
    }).join("") + "</div>";
  }
  function wireChips(scope, state) {
    scope.querySelectorAll("[data-chips]").forEach(function (row) {
      row.addEventListener("click", function (e) {
        var btn = e.target.closest(".dyn-tpl-chip"); if (!btn) return;
        row.querySelectorAll(".dyn-tpl-chip").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        state[row.getAttribute("data-chips")] = btn.getAttribute("data-value");
        if (state.onChange) state.onChange(row.getAttribute("data-chips"));
      });
    });
  }

  /* Add to cart with properties + attached artwork (Shopify hosts the files). */
  function addToCart(btn, properties, files, done) {
    var S = window.DYN_SHOPIFY || {};
    if (!S.variantId) { alert("This product can't be added from here."); return; }
    btn.disabled = true; var old = btn.textContent; btn.textContent = "Adding\u2026";
    var fd = new FormData();
    fd.append("id", String(S.variantId));
    fd.append("quantity", "1");
    Object.keys(properties).forEach(function (k) { if (properties[k]) fd.append("properties[" + k + "]", properties[k]); });
    (files || []).forEach(function (f) { fd.append("properties[" + f.label + "]", f.file, f.file.name); });
    fetch("/cart/add.js", { method: "POST", headers: { Accept: "application/json" }, body: fd })
      .then(function (r) { if (!r.ok) throw new Error("add failed"); return r.json(); })
      .then(function () {
        btn.textContent = "Added \u2713";
        document.dispatchEvent(new CustomEvent("dyn:cart-changed"));
        window.dispatchEvent(new CustomEvent("dyn:cart-changed"));
        setTimeout(function () { closeShell(); btn.disabled = false; btn.textContent = old; if (done) done(); }, 900);
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = old;
        alert("Couldn't add to bag \u2014 please try again.");
      });
  }

  /* Drag-and-drop wiring for a drop face + hidden input. */
  function wireDrop(face, input, onFiles) {
    face.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () { if (input.files.length) onFiles(input.files); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) {
      face.addEventListener(ev, function (e) { e.preventDefault(); face.classList.add("is-drag"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      face.addEventListener(ev, function (e) { e.preventDefault(); face.classList.remove("is-drag"); });
    });
    face.addEventListener("drop", function (e) {
      if (e.dataTransfer && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
    });
  }

  /* ====================================================================== */
  /* Template 3 — Paper product designer: "Prepare Your Artwork"            */
  /* ====================================================================== */
  function openPaper() {
    var papers = list(cfg.paper, "Matte 350gsm, Silk 400gsm, Uncoated 300gsm, Recycled 350gsm");
    var finishes = list(cfg.finish, "None, Soft-touch lamination, Gloss UV");
    /* trim size, e.g. "3.5 x 2" (inches) — bleed is 0.125in each edge */
    var dims = String(cfg.paperSize || "3.5 x 2").split(/x/i).map(parseFloat);
    var tw = dims[0] > 0 ? dims[0] : 3.5, th = dims[1] > 0 ? dims[1] : 2;
    var BLEED = 0.125, SAFE = 0.125;
    var bw = tw + BLEED * 2, bh = th + BLEED * 2;
    var state = { side: "front", art: { front: null, back: null }, Paper: papers[0], Finish: finishes[0],
      guides: { bleed: true, trim: true, safe: true } };

    var pctX = function (inches) { return (inches / bw) * 100; };
    var pctY = function (inches) { return (inches / bh) * 100; };
    var trimInset = "top:" + pctY(BLEED) + "%;left:" + pctX(BLEED) + "%;right:" + pctX(BLEED) + "%;bottom:" + pctY(BLEED) + "%;";
    var safeInset = "top:" + pctY(BLEED + SAFE) + "%;left:" + pctX(BLEED + SAFE) + "%;right:" + pctX(BLEED + SAFE) + "%;bottom:" + pctY(BLEED + SAFE) + "%;";

    var body =
      '<div class="modal-body">' +
        '<section class="dyn-tpl-stage" aria-label="Live proof">' +
          '<div class="dyn-tpl-proof">' +
            '<div class="dyn-tpl-bleedbox" id="tplBleedBox" style="aspect-ratio:' + bw + "/" + bh + ';">' +
              '<img class="dyn-tpl-art" id="tplArt" alt="" hidden>' +
              '<div class="dyn-tpl-bleedhatch" id="tplHatch" hidden></div>' +
              '<div class="dyn-tpl-trim" id="tplTrim" style="' + trimInset + '"></div>' +
              '<div class="dyn-tpl-safe" id="tplSafe" style="' + safeInset + '"></div>' +
              '<div class="dyn-tpl-dropface" id="tplDrop"><b>Drag &amp; drop</b><span>or click to place your ' +
                '<span id="tplSideWord">front</span> artwork</span></div>' +
              '<input type="file" id="tplFile" accept=".pdf,.ai,.psd,.svg,.png,.jpg,.jpeg" hidden>' +
            "</div>" +
            '<div class="dyn-tpl-guide-tags">' +
              '<span class="dyn-tpl-guide-tag"><i>\u2014</i> Trim</span>' +
              '<span class="dyn-tpl-guide-tag">- - Safe area</span>' +
              '<span class="dyn-tpl-guide-tag"><i>\u2591</i> Bleed ' + BLEED + '"</span>' +
            "</div>" +
          "</div>" +
        "</section>" +
        '<aside class="dyn-tpl-panel">' +
          '<div class="dyn-tpl-group"><div class="dyn-tpl-label">Side</div>' +
            '<div class="dyn-tpl-sidetabs">' + chipRow("side", ["Front", "Back"], "Front") + "</div>" +
            '<div id="tplFiles"></div>' +
          "</div>" +
          '<div class="dyn-tpl-group"><div class="dyn-tpl-label">Guides</div>' +
            '<div class="dyn-tpl-chips">' +
              '<button type="button" class="dyn-tpl-chip" data-guide="bleed" aria-pressed="true">Bleed</button>' +
              '<button type="button" class="dyn-tpl-chip" data-guide="trim" aria-pressed="true">Trim</button>' +
              '<button type="button" class="dyn-tpl-chip" data-guide="safe" aria-pressed="true">Safe</button>' +
            "</div>" +
          "</div>" +
          '<div class="dyn-tpl-group"><div class="dyn-tpl-label">Paper</div>' + chipRow("Paper", papers, papers[0]) + "</div>" +
          '<div class="dyn-tpl-group"><div class="dyn-tpl-label">Finish</div>' + chipRow("Finish", finishes, finishes[0]) + "</div>" +
          '<div class="dyn-tpl-note">Keep text inside the dashed safe area. Anything reaching the paper edge must extend into the bleed. We review every file before printing.</div>' +
        "</aside>" +
      "</div>";

    var foot =
      '<span class="dyn-tpl-hint">Trim ' + tw + '" \u00d7 ' + th + '" \u00b7 professional prepress review included</span>' +
      '<button class="btn btn-ghost" data-close>Cancel</button>' +
      '<button class="btn btn-primary" id="tplPaperAdd">Add to Cart</button>';

    shell("Prepare Your Artwork", productName() ? "Live proof \u00b7 " + productName() : "Live proof", body, foot);

    var art = document.getElementById("tplArt");
    var hatch = document.getElementById("tplHatch");
    var drop = document.getElementById("tplDrop");
    var fileIn = document.getElementById("tplFile");
    var filesEl = document.getElementById("tplFiles");
    var sideWord = document.getElementById("tplSideWord");

    function paint() {
      var f = state.art[state.side];
      sideWord.textContent = state.side;
      if (f && f.url) { art.src = f.url; art.hidden = false; drop.style.display = "none"; hatch.hidden = !state.guides.bleed; }
      else { art.hidden = true; drop.style.display = "flex"; hatch.hidden = true; }
      document.getElementById("tplTrim").style.display = state.guides.trim ? "" : "none";
      document.getElementById("tplSafe").style.display = state.guides.safe ? "" : "none";
      filesEl.innerHTML = ["front", "back"].map(function (s) {
        var g = state.art[s]; if (!g) return "";
        return '<div class="dyn-tpl-filerow"><span>' + esc(s === "front" ? "Front" : "Back") + " \u00b7 " + esc(g.file.name) +
          "</span><small>" + fmtSize(g.file.size) + '</small><button type="button" class="dyn-tpl-fx" data-clear="' + s + '" aria-label="Remove">\u00d7</button></div>';
      }).join("");
    }
    filesEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-clear]"); if (!b) return;
      var s = b.getAttribute("data-clear");
      if (state.art[s] && state.art[s].url) URL.revokeObjectURL(state.art[s].url);
      state.art[s] = null; paint();
    });
    wireDrop(drop, fileIn, function (fl) {
      var f = fl[0]; if (!f) return;
      var url = /\.(png|jpe?g|svg)$/i.test(f.name) ? URL.createObjectURL(f) : null;
      state.art[state.side] = { file: f, url: url };
      paint();
    });
    state.onChange = function (key) {
      if (key === "side") { state.side = (state.side === "front" ? "front" : state.side); }
    };
    /* chips: side tabs + paper + finish */
    wireChips(rootEl, state);
    rootEl.querySelector('[data-chips="side"]').addEventListener("click", function (e) {
      var btn = e.target.closest(".dyn-tpl-chip"); if (!btn) return;
      state.side = btn.getAttribute("data-value").toLowerCase();
      paint();
    });
    rootEl.querySelectorAll("[data-guide]").forEach(function (g) {
      g.addEventListener("click", function () {
        var k = g.getAttribute("data-guide");
        state.guides[k] = !state.guides[k];
        g.setAttribute("aria-pressed", String(state.guides[k]));
        paint();
      });
    });
    document.getElementById("tplPaperAdd").addEventListener("click", function () {
      if (!state.art.front) { alert("Add your front artwork first."); return; }
      var files = [{ label: "Front artwork", file: state.art.front.file }];
      if (state.art.back) files.push({ label: "Back artwork", file: state.art.back.file });
      addToCart(this, {
        "Template": "Paper designer",
        "Paper": state.Paper,
        "Finish": state.Finish,
        "Sides": state.art.back ? "Front + Back" : "Front only",
        "Trim size": tw + '" x ' + th + '"'
      }, files);
    });
    paint();
  }

  /* ====================================================================== */
  /* Template 4 — Premium configurator: "Build Your Product"                */
  /* ====================================================================== */
  function openConfigurator() {
    var STEPS = [
      { key: "Material", label: "Material", options: list(cfg.materials, "Rigid board, Kraft, Linen wrap, Soft-touch") },
      { key: "Size", label: "Size", options: list(cfg.sizes, "Small, Medium, Large, Custom") },
      { key: "Printing", label: "Printing", options: list(cfg.printing, "Foil stamp, Screen print, Digital, Letterpress, Embossing") },
      { key: "Finish", label: "Finish", options: list(cfg.finishes, "None, Matte lamination, Soft-touch, Gloss") },
      { key: "Artwork", label: "Artwork", upload: true },
      { key: "Review", label: "Review", review: true }
    ];
    var state = { step: 0, files: [] };
    STEPS.forEach(function (s) { if (s.options) state[s.key] = null; });

    var body =
      '<div class="dyn-tpl-steps" id="tplSteps"></div>' +
      '<div class="modal-body"><div class="dyn-tpl-pane" id="tplPane"></div></div>';
    var foot =
      '<span class="dyn-tpl-hint" id="tplHint"></span>' +
      '<button class="btn btn-ghost" id="tplBack">Back</button>' +
      '<button class="btn btn-primary" id="tplNext">Continue</button>';

    shell("Build Your Product", productName() || "Premium configuration", body, foot, "dyn-tpl-single");

    var pane = document.getElementById("tplPane");
    var stepsEl = document.getElementById("tplSteps");
    var backBtn = document.getElementById("tplBack");
    var nextBtn = document.getElementById("tplNext");
    var hint = document.getElementById("tplHint");

    function paintSteps() {
      stepsEl.innerHTML = STEPS.map(function (s, i) {
        var cls = i === state.step ? " is-active" : (i < state.step ? " is-done" : "");
        return '<span class="dyn-tpl-step' + cls + '"><i>0' + (i + 1) + "</i>" + esc(s.label) + "</span>";
      }).join("");
    }
    function paintPane() {
      var s = STEPS[state.step];
      paintSteps();
      backBtn.style.visibility = state.step === 0 ? "hidden" : "visible";
      nextBtn.textContent = s.review ? "Add to Cart" : "Continue";
      hint.textContent = s.review ? "Everything checked \u00b7 we confirm details before production" :
        "Step 0" + (state.step + 1) + " of 0" + STEPS.length;
      if (s.options) {
        pane.innerHTML = '<div class="dyn-tpl-group"><div class="dyn-tpl-label">' + esc(s.label) + "</div>" +
          chipRow(s.key, s.options, state[s.key]) + "</div>" +
          '<div class="dyn-tpl-empty-hint">Pick one to continue \u2014 you can come back any time.</div>';
        wireChips(pane, state);
      } else if (s.upload) {
        pane.innerHTML =
          '<div class="dyn-tpl-group"><div class="dyn-tpl-label">Artwork</div>' +
          '<div class="dyn-tpl-dropface" id="tplCfgDrop" style="position:relative;inset:auto;padding:34px 18px;">' +
            "<b>Drag &amp; drop</b><span>or click to browse \u00b7 PDF AI PSD SVG PNG JPG</span></div>" +
          '<input type="file" id="tplCfgFile" multiple accept=".pdf,.ai,.psd,.svg,.png,.jpg,.jpeg" hidden>' +
          '<div id="tplCfgFiles"></div>' +
          '<div class="dyn-tpl-note">Optional \u2014 no artwork yet? Continue and we\u2019ll design it with you.</div></div>';
        var face = document.getElementById("tplCfgDrop");
        var input = document.getElementById("tplCfgFile");
        var listEl = document.getElementById("tplCfgFiles");
        function paintFiles() {
          listEl.innerHTML = state.files.map(function (f, i) {
            return '<div class="dyn-tpl-filerow"><span>' + esc(f.name) + "</span><small>" + fmtSize(f.size) +
              '</small><button type="button" class="dyn-tpl-fx" data-i="' + i + '" aria-label="Remove">\u00d7</button></div>';
          }).join("");
        }
        listEl.addEventListener("click", function (e) {
          var b = e.target.closest("[data-i]"); if (!b) return;
          state.files.splice(parseInt(b.getAttribute("data-i"), 10), 1); paintFiles();
        });
        wireDrop(face, input, function (fl) {
          Array.prototype.forEach.call(fl, function (f) { if (state.files.length < 10) state.files.push(f); });
          paintFiles();
        });
        paintFiles();
      } else if (s.review) {
        var rows = STEPS.filter(function (x) { return x.options; }).map(function (x) {
          return '<div class="dyn-tpl-review-row"><b>' + esc(x.label) + "</b><span>" + esc(state[x.key] || "\u2014") + "</span></div>";
        }).join("");
        rows += '<div class="dyn-tpl-review-row"><b>Artwork</b><span>' +
          (state.files.length ? esc(state.files.length + " file" + (state.files.length > 1 ? "s" : "")) : "Design together") + "</span></div>";
        pane.innerHTML = '<div class="dyn-tpl-group"><div class="dyn-tpl-label">Your configuration</div>' +
          '<div class="dyn-tpl-review">' + rows + "</div></div>";
      }
    }
    backBtn.addEventListener("click", function () {
      if (state.step > 0) { state.step--; paintPane(); }
    });
    nextBtn.addEventListener("click", function () {
      var s = STEPS[state.step];
      if (s.options && !state[s.key]) { alert("Pick a " + s.label.toLowerCase() + " to continue."); return; }
      if (s.review) {
        var props = { "Template": "Configurator" };
        STEPS.forEach(function (x) { if (x.options && state[x.key]) props[x.key] = state[x.key]; });
        addToCart(nextBtn, props, state.files.map(function (f) { return { label: "Artwork \u2014 " + f.name, file: f }; }));
        return;
      }
      state.step++; paintPane();
    });
    paintPane();
  }

  /* ---- take over the Customize button ---------------------------------- */
  function openTemplate() { MODE === "paper" ? openPaper() : openConfigurator(); }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("#customizeBtn") : null;
    if (!btn) return;
    e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
    openTemplate();
  }, true);
})();
