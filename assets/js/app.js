/* ============================================================================
   app.js — Application controller.

   Bootstraps the product page, constructs the Apple-style customization modal,
   and wires the editor, store, pricing engine and cart payload together. Owns
   presentation + orchestration only; all domain logic lives in the focused
   modules it composes (products, store, pricing, editor, designs, cart).
   ========================================================================== */
(function (root) {
  "use strict";
  const D = root.Dynamic;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* --------------------------- constants --------------------------- */
  const FONTS = [
    { name: "SF Pro", stack: "'SF Pro Display', -apple-system, sans-serif" },
    { name: "Serif", stack: "Georgia, 'Times New Roman', serif" },
    { name: "Rounded", stack: "'SF Pro Rounded', 'Trebuchet MS', sans-serif" },
    { name: "Mono", stack: "'SF Mono', ui-monospace, monospace" },
    { name: "Condensed", stack: "'Arial Narrow', sans-serif" },
    { name: "Script", stack: "'Snell Roundhand', 'Segoe Script', cursive" },
  ];
  const TEXT_COLORS = [
    "#1d1d1f", "#ffffff", "#0071e3", "#d70015", "#1a7f37", "#b8860b",
    "#7d3c6a", "#3a6ea5", "#e8a13a", "#ff375f", "#5c5a3a", "#c0392b",
    "#25324a", "#b7c4b0", "#e8cdc9", "#000000",
  ];
  const EMOJI = "😀 😍 🥳 😎 🤩 🥰 😂 🙌 👍 🤟 ✌️ 👑 ❤️ 💛 💚 🔥 ✨ ⭐ 🌟 🎉 🎂 🎁 🌈 ☀️ 🌙 🌸 🌿 🍀 🐝 🦋 🐶 🐱 ⚽ 🏀 🎸 🚀 💯 🍕 ☕ 🍩".split(" ");

  const icon = (p) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const ICONS = {
    undo: icon('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-1"/>'),
    redo: icon('<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h1"/>'),
    dup: icon('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
    del: icon('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/>'),
    rotate: icon('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v4h-4"/>'),
    center: icon('<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>'),
    alignL: icon('<path d="M4 4v16"/><rect x="7" y="8" width="10" height="3"/><rect x="7" y="14" width="6" height="3"/>'),
    alignR: icon('<path d="M20 4v16"/><rect x="7" y="8" width="10" height="3"/><rect x="11" y="14" width="6" height="3"/>'),
    alignT: icon('<path d="M4 4h16"/><rect x="8" y="7" width="3" height="10"/><rect x="14" y="7" width="3" height="6"/>'),
    alignB: icon('<path d="M4 20h16"/><rect x="8" y="7" width="3" height="10"/><rect x="14" y="11" width="3" height="6"/>'),
    zoomIn: icon('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4M11 8v6M8 11h6"/>'),
    zoomOut: icon('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4M8 11h6"/>'),
    front: icon('<path d="M4 8l8-4 8 4-8 4-8-4Z"/><path d="M4 12l8 4 8-4"/>'),
    text: icon('<path d="M4 7V5h16v2M12 5v14M9 19h6"/>'),
    upload: icon('<path d="M12 15V4M8 8l4-4 4 4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
    photo: icon('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m3 17 5-4 4 3 3-2 6 5"/>'),
    ai: icon('<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z"/>'),
    tmpl: icon('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    layerText: icon('<path d="M4 7V5h16v2M12 5v14M9 19h6"/>'),
    layerImg: icon('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m3 17 5-4 4 3 3-2 6 5"/>'),
  };

  /* --------------------------- runtime state --------------------------- */
  let product, store, editor, unsubStore;
  let currentPricing;
  const uploadedAssets = [];

  /* ============================ PRODUCT PAGE ============================ */
  function renderProductPage() {
    $("#galleryStage").innerHTML = D.renderSilhouette(
      product.id,
      colorHex(store.get().colorId)
    );
    $("#pName").textContent = product.tagline;
    $("#pDesc").textContent = product.description;
    $("#pEyebrow").textContent = product.name;
    renderSwatches();
    renderSizes();
    updatePagePrice();
    updateCustomizeSummary();
  }

  function renderSwatches() {
    const host = $("#pColors");
    host.innerHTML = "";
    const cur = store.get().colorId;
    product.colors.forEach((c) => {
      const b = el("button", "swatch");
      b.style.setProperty("--swatch", c.hex);
      b.setAttribute("aria-label", c.name);
      b.setAttribute("aria-pressed", String(c.id === cur));
      b.onclick = () => {
        store.set({ colorId: c.id });
        renderProductPage();
        $("#colorName").textContent = c.name;
        // refresh modal preview if open
        if (modalOpen) $("#stageSilhouette").innerHTML = D.renderSilhouette(product.id, c.hex);
      };
      host.appendChild(b);
    });
    $("#colorName").textContent = product.colors.find((c) => c.id === cur).name;
  }

  function renderSizes() {
    const grp = $("#pSizeGroup");
    if (!product.sizes) {
      grp.style.display = "none";
      return;
    }
    grp.style.display = "";
    const host = $("#pSizes");
    host.innerHTML = "";
    const cur = store.get().sizeId;
    product.sizes.forEach((s) => {
      const b = el("button", "pill", s);
      b.setAttribute("aria-pressed", String(s === cur));
      b.onclick = () => {
        store.set({ sizeId: s });
        renderSizes();
      };
      host.appendChild(b);
    });
  }

  function updatePagePrice() {
    const p = D.pricing.compute(product, store.get());
    currentPricing = p;
    $("#pPrice").textContent = p.format(p.total);
    $("#pPriceNote").textContent =
      store.get().quantity > 1 ? `${p.format(p.subtotalUnit)} each` : "Free shipping";
  }

  function updateCustomizeSummary() {
    const areas = decoratedCount();
    $("#customizeSummary").textContent = areas
      ? `${areas} print area${areas > 1 ? "s" : ""} designed`
      : "Not customized yet";
  }

  function colorHex(id) {
    const c = product.colors.find((x) => x.id === id);
    return c ? c.hex : "#ffffff";
  }
  function decoratedCount() {
    const s = store.get();
    return Object.keys(s.areas).filter((k) => s.areas[k].objectCount > 0).length;
  }

  /* ============================ MODAL ============================ */
  let modalOpen = false;

  function buildModal() {
    const areasTabs = product.areas
      .map(
        (a, i) =>
          `<button class="area-tab" role="tab" data-area="${a.id}" aria-selected="${i === 0}">
             ${a.label}<span class="area-count" data-count="${a.id}"></span>
             ${i === 0 ? '<span class="area-tab-bg"></span>' : ""}
           </button>`
      )
      .join("");

    const modeButtons = [
      ["text", "Add Text", ICONS.text],
      ["upload", "Upload Logo", ICONS.upload],
      ["photo", "Upload Photo", ICONS.photo],
      ["ai", "AI Design", ICONS.ai],
      ["templates", "Templates", ICONS.tmpl],
    ]
      .map(
        ([k, label, ic], i) =>
          `<button class="mode-btn" role="tab" data-mode="${k}" aria-selected="${i === 0}">${ic}<span>${label}</span></button>`
      )
      .join("");

    const html = `
      <div class="modal-scrim" data-close></div>
      <div class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div class="modal-head">
          <div>
            <h2 id="modalTitle">Customize your ${escapeHtml(product.name)}.</h2>
            <div class="sub">Design it your way. Live preview updates as you go.</div>
          </div>
          <button class="modal-close" data-close aria-label="Close">✕</button>
        </div>

        <div class="modal-body">
          <section class="stage" aria-label="Live preview">
            <div class="stage-toolbar">
              <div class="area-tabs" role="tablist" aria-label="Print areas">${areasTabs}</div>
              <span class="tool-spacer"></span>
              <button class="tool-btn" data-act="undo" title="Undo (⌘Z)" disabled>${ICONS.undo}</button>
              <button class="tool-btn" data-act="redo" title="Redo (⇧⌘Z)" disabled>${ICONS.redo}</button>
              <span class="tool-divider"></span>
              <button class="tool-btn" data-act="dup" title="Duplicate (⌘D)" disabled>${ICONS.dup}</button>
              <button class="tool-btn" data-act="rotate" title="Rotate 15°" disabled>${ICONS.rotate}</button>
              <button class="tool-btn" data-act="del" title="Delete (⌫)" disabled>${ICONS.del}</button>
              <span class="tool-divider"></span>
              <button class="tool-btn" data-act="alignL" title="Align left" disabled>${ICONS.alignL}</button>
              <button class="tool-btn" data-act="alignT" title="Align top" disabled>${ICONS.alignT}</button>
              <button class="tool-btn" data-act="alignB" title="Align bottom" disabled>${ICONS.alignB}</button>
              <button class="tool-btn" data-act="alignR" title="Align right" disabled>${ICONS.alignR}</button>
              <button class="tool-btn" data-act="center" title="Snap to center" disabled>${ICONS.center}</button>
              <span class="tool-divider"></span>
              <button class="tool-btn" data-act="zoomOut" title="Zoom out">${ICONS.zoomOut}</button>
              <button class="tool-btn" data-act="zoomIn" title="Zoom in">${ICONS.zoomIn}</button>
            </div>
            <div class="canvas-wrap">
              <div class="canvas-frame" id="canvasFrame">
                <div id="stageSilhouette" style="position:absolute;inset:0;pointer-events:none;"></div>
                <canvas id="designCanvas"></canvas>
              </div>
              <div class="stage-empty" id="stageEmpty">Pick an option on the right to start designing.<br>Everything you add appears here, live.</div>
              <div class="zoom-badge" id="zoomBadge">100%</div>
            </div>
          </section>

          <aside class="panel">
            <div class="mode-rail" role="tablist" aria-label="Design tools">${modeButtons}</div>
            <div class="panel-scroll">
              <div class="panel-pane active" data-pane="text">${paneText()}</div>
              <div class="panel-pane" data-pane="upload">${paneUpload("logo")}</div>
              <div class="panel-pane" data-pane="photo">${paneUpload("photo")}</div>
              <div class="panel-pane" data-pane="ai">${paneAI()}</div>
              <div class="panel-pane" data-pane="templates">${paneTemplates()}</div>
              <div class="divider"></div>
              ${paneFinishing()}
              <div class="divider"></div>
              <div id="layersSection"></div>
            </div>
          </aside>
        </div>

        <div class="modal-foot">
          <div class="price-breakdown" id="priceBreakdown">
            <button class="price-breakdown-toggle" id="priceToggle" aria-expanded="false">
              <span class="total" id="modalTotal">$0</span>
              <span class="meta">Total <span class="caret">▾</span></span>
            </button>
            <div class="price-items"><div class="price-items-inner"><ul id="priceList"></ul></div></div>
          </div>
          <div class="foot-actions">
            <button class="btn btn-ghost" data-close>Cancel</button>
            <button class="btn btn-primary" id="applyBtn">Add to Cart</button>
          </div>
        </div>
      </div>`;

    const rootEl = $("#modalRoot");
    rootEl.innerHTML = html;
    wireModal();
  }

  function paneText() {
    return `
      <div class="field">
        <label for="txtInput">Your text</label>
        <textarea class="textarea" id="txtInput" placeholder="Happy Birthday Sarah" maxlength="120"></textarea>
      </div>
      <button class="btn btn-primary btn-block" id="addTextBtn">Add to design</button>
      <div class="divider"></div>
      <div class="field">
        <label>Font</label>
        <div class="font-grid" id="fontGrid">
          ${FONTS.map(
            (f, i) =>
              `<button class="font-chip" data-font="${f.stack}" style="font-family:${f.stack}" aria-pressed="${i === 0}">${f.name}</button>`
          ).join("")}
        </div>
      </div>
      <div class="field">
        <label>Color</label>
        <div class="swatch-grid" id="textColors">
          ${TEXT_COLORS.map(
            (c, i) => `<button class="color-dot" style="--c:${c}" data-color="${c}" aria-pressed="${i === 0}" aria-label="${c}"></button>`
          ).join("")}
        </div>
      </div>
      <div class="field">
        <label>Size <span id="fontSizeVal" style="float:right;color:var(--ink-faint)">46</span></label>
        <input type="range" id="fontSize" min="16" max="120" value="46" style="width:100%">
      </div>
      <div class="field">
        <label>Emoji</label>
        <div class="emoji-grid">${EMOJI.map((e) => `<button class="emoji-btn" data-emoji="${e}">${e}</button>`).join("")}</div>
      </div>`;
  }

  function paneUpload(kind) {
    const formats = kind === "logo" ? "PNG · JPG · SVG · PDF" : "PNG · JPG";
    const accept = kind === "logo" ? ".png,.jpg,.jpeg,.svg,.pdf" : ".png,.jpg,.jpeg";
    return `
      <div class="dropzone" data-drop="${kind}" tabindex="0" role="button" aria-label="Upload ${kind}">
        <strong>Drop your ${kind} here</strong>
        or click to browse
        <div class="formats">${formats} · up to 20&nbsp;MB</div>
      </div>
      <input type="file" data-file="${kind}" accept="${accept}" hidden>
      <p class="hint" style="margin-top:12px">${
        kind === "logo"
          ? "Transparent PNG or SVG works best. Vectors stay razor-sharp at any size."
          : "High-resolution photos print best. We recommend at least 1500&nbsp;px on the long edge."
      }</p>`;
  }

  function paneAI() {
    return `
      <div class="field">
        <label for="aiPrompt">Describe your design</label>
        <textarea class="textarea" id="aiPrompt" placeholder="Vintage mountain logo with pine trees"></textarea>
      </div>
      <button class="btn btn-primary btn-block" id="aiGenBtn">Generate</button>
      <div id="aiResults" style="margin-top:16px"></div>
      <p class="hint" style="margin-top:12px">Generated artwork drops straight into the editor — resize, move and combine it with text.</p>`;
  }

  function paneTemplates() {
    return `<div class="template-grid">${D.templates
      .map((t) => `<button class="template-card" data-tmpl="${t.id}" aria-label="${t.name}">${t.svg}</button>`)
      .join("")}</div>`;
  }

  function paneFinishing() {
    const finishes = (product.finishes || [])
      .map(
        (f, i) =>
          `<button class="pill" data-finish="${f.id}" aria-pressed="${i === 0}">${f.name}${
            f.surcharge ? ` +${D.pricing.money(f.surcharge)}` : ""
          }</button>`
      )
      .join("");
    const addons = (product.addons || [])
      .map(
        (a) =>
          `<label style="display:flex;align-items:center;gap:10px;font-size:14px;margin-top:8px">
             <input type="checkbox" data-addon="${a.id}"> ${a.name} <span class="meta">+${D.pricing.money(a.surcharge)}</span>
           </label>`
      )
      .join("");
    return `
      <div class="field"><label>Finish</label><div class="pills" id="finishPills">${finishes}</div></div>
      ${addons ? `<div class="field"><label>Add-ons</label>${addons}</div>` : ""}`;
  }

  /* --------------------------- modal wiring --------------------------- */
  function wireModal() {
    // Instantiate editor.
    editor = D.createEditor({
      canvasEl: $("#designCanvas"),
      product,
      store,
      callbacks: {
        onChange: onEditorChange,
        onSelection: onSelection,
        onZoom: (z) => {
          $("#zoomBadge").textContent = Math.round(z * 100) + "%";
        },
      },
    });
    $("#stageSilhouette").innerHTML = D.renderSilhouette(product.id, colorHex(store.get().colorId));

    // Close handlers (always available, even without the editor library).
    $("#modalRoot")
      .querySelectorAll("[data-close]")
      .forEach((b) => (b.onclick = closeModal));

    if (!editor) {
      // Fabric.js unavailable (e.g. offline / blocked CDN). Keep the modal
      // usable: show a clear message instead of throwing on interaction.
      $("#stageEmpty").innerHTML =
        "The design editor needs to load its canvas engine.<br>Check your connection and reopen Customize.";
      $("#stageEmpty").style.opacity = "1";
      $("#priceToggle").onclick = null;
      $("#applyBtn").disabled = true;
      return;
    }

    // Mode rail
    $("#modalRoot")
      .querySelectorAll(".mode-btn")
      .forEach((btn) => {
        btn.onclick = () => selectMode(btn.dataset.mode);
      });

    // Area tabs
    $("#modalRoot")
      .querySelectorAll(".area-tab")
      .forEach((tab) => {
        tab.onclick = () => selectArea(tab.dataset.area);
      });

    // Toolbar
    $("#modalRoot")
      .querySelectorAll(".tool-btn")
      .forEach((btn) => {
        btn.onclick = () => toolAction(btn.dataset.act);
      });

    // Text pane
    $("#addTextBtn").onclick = () => {
      const v = $("#txtInput").value.trim();
      if (!v) {
        toast("Type something first");
        $("#txtInput").focus();
        return;
      }
      editor.addText(v, currentTextStyle());
      $("#txtInput").value = "";
    };
    $("#fontGrid")
      .querySelectorAll(".font-chip")
      .forEach((c) => {
        c.onclick = () => {
          pressOne("#fontGrid", c);
          editor.styleSelected({ fontFamily: c.dataset.font });
        };
      });
    $("#textColors")
      .querySelectorAll(".color-dot")
      .forEach((c) => {
        c.onclick = () => {
          pressOne("#textColors", c);
          editor.styleSelected({ fill: c.dataset.color });
        };
      });
    $("#fontSize").oninput = (e) => {
      $("#fontSizeVal").textContent = e.target.value;
      editor.styleSelected({ fontSize: parseInt(e.target.value, 10) });
    };
    $("#modalRoot")
      .querySelectorAll(".emoji-btn")
      .forEach((b) => {
        b.onclick = () => editor.addText(b.dataset.emoji, { fontSize: 80 });
      });

    // Uploads
    ["logo", "photo"].forEach(wireUpload);

    // AI
    $("#aiGenBtn").onclick = runAI;

    // Templates
    $("#modalRoot")
      .querySelectorAll(".template-card")
      .forEach((card) => {
        card.onclick = async () => {
          const t = D.templates.find((x) => x.id === card.dataset.tmpl);
          await editor.addSVG(t.svg, t.name);
          toast(`${t.name} added`);
        };
      });

    // Finishing
    $("#finishPills") &&
      $("#finishPills")
        .querySelectorAll(".pill")
        .forEach((p) => {
          p.onclick = () => {
            pressOne("#finishPills", p);
            store.set({ finishId: p.dataset.finish });
            refreshPricing();
          };
        });
    $("#modalRoot")
      .querySelectorAll("[data-addon]")
      .forEach((cb) => {
        cb.onchange = () => {
          const s = store.get();
          const set = new Set(s.addons);
          cb.checked ? set.add(cb.dataset.addon) : set.delete(cb.dataset.addon);
          store.set({ addons: set });
          refreshPricing();
        };
      });

    // Price breakdown toggle
    $("#priceToggle").onclick = () => {
      const bd = $("#priceBreakdown");
      const open = bd.classList.toggle("open");
      $("#priceToggle").setAttribute("aria-expanded", String(open));
    };

    // Apply / add to cart
    $("#applyBtn").onclick = onAddToCart;

    // Keyboard shortcuts
    document.addEventListener("keydown", editor.keyHandler);

    refreshPricing();
    updateLayers();
    updateAreaCounts();
    selectMode("text");
  }

  function currentTextStyle() {
    const font = $("#fontGrid .font-chip[aria-pressed='true']");
    const color = $("#textColors .color-dot[aria-pressed='true']");
    return {
      fontFamily: font ? font.dataset.font : FONTS[0].stack,
      fill: color ? color.dataset.color : "#1d1d1f",
      fontSize: parseInt($("#fontSize").value, 10) || 46,
    };
  }

  function wireUpload(kind) {
    const drop = $(`[data-drop="${kind}"]`);
    const input = $(`[data-file="${kind}"]`);
    drop.onclick = () => input.click();
    drop.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        input.click();
      }
    };
    ["dragenter", "dragover"].forEach((ev) =>
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        drop.classList.add("drag");
      })
    );
    ["dragleave", "drop"].forEach((ev) =>
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        drop.classList.remove("drag");
      })
    );
    drop.addEventListener("drop", (e) => {
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    input.onchange = (e) => {
      if (e.target.files[0]) handleFile(e.target.files[0]);
      input.value = "";
    };
  }

  async function handleFile(file) {
    const MAX = 20 * 1024 * 1024;
    if (file.size > MAX) return toast("File is larger than 20 MB");
    const ext = file.name.split(".").pop().toLowerCase();
    uploadedAssets.push({ name: file.name, type: file.type, size: file.size });
    toast(`Adding ${file.name}…`);
    try {
      if (ext === "svg") {
        const text = await file.text();
        await editor.addSVG(text, file.name);
      } else if (ext === "pdf") {
        await addPDF(file);
      } else {
        const url = await readAsDataURL(file);
        await editor.addImageFromURL(url, { kind: "upload", name: file.name });
      }
      toast(`${file.name} added`);
    } catch (err) {
      console.error(err);
      toast("Couldn't read that file");
    }
  }

  function readAsDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  async function addPDF(file) {
    // Lazy-load pdf.js only when a PDF is actually uploaded.
    try {
      const pdfjs = await loadPdfJs();
      const buf = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buf }).promise;
      const page = await doc.getPage(1);
      const viewport = page.getViewport({ scale: 2 });
      const c = document.createElement("canvas");
      c.width = viewport.width;
      c.height = viewport.height;
      await page.render({ canvasContext: c.getContext("2d"), viewport }).promise;
      await editor.addImageFromURL(c.toDataURL("image/png"), { kind: "pdf", name: file.name });
    } catch (e) {
      console.warn("pdf.js unavailable, storing PDF as attached asset", e);
      // Graceful fallback: attach the file and drop a labelled placeholder.
      const svg = `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="192" height="112" rx="10" fill="#f5f5f7" stroke="#d2d2d7"/>
        <text x="100" y="56" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#d70015" font-weight="700">PDF</text>
        <text x="100" y="82" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#6e6e73">${escapeHtml(file.name).slice(0, 22)}</text>
      </svg>`;
      await editor.addSVG(svg, file.name);
    }
  }

  let pdfJsPromise = null;
  function loadPdfJs() {
    if (root.pdfjsLib) return Promise.resolve(root.pdfjsLib);
    if (pdfJsPromise) return pdfJsPromise;
    // Loaded lazily only when a PDF is actually dropped. If the CDN is
    // unreachable, handleFile()'s catch falls back to an attached-asset
    // placeholder, so PDF upload degrades gracefully.
    pdfJsPromise = new Promise((res, rej) => {
      const CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174";
      const s = document.createElement("script");
      s.src = `${CDN}/pdf.min.js`;
      s.onload = () => {
        root.pdfjsLib.GlobalWorkerOptions.workerSrc = `${CDN}/pdf.worker.min.js`;
        res(root.pdfjsLib);
      };
      s.onerror = rej;
      document.head.appendChild(s);
    });
    return pdfJsPromise;
  }

  async function runAI() {
    const prompt = $("#aiPrompt").value.trim();
    if (!prompt) {
      toast("Describe your design first");
      return;
    }
    const btn = $("#aiGenBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span> Generating';
    $("#aiResults").innerHTML =
      '<p class="hint">Dreaming up your artwork…</p>';
    try {
      const art = await D.generateAI(prompt);
      $("#aiResults").innerHTML = `
        <div class="template-grid">
          <button class="template-card" id="aiUse" aria-label="Use generated art">${art.svg}</button>
        </div>
        <p class="hint" style="margin-top:8px">Motif: ${art.motif}. Tap the artwork to place it, or generate again.</p>`;
      $("#aiUse").onclick = async () => {
        await editor.addSVG(art.svg, art.name);
        toast("AI artwork added");
      };
    } catch (e) {
      $("#aiResults").innerHTML = '<p class="hint">Generation failed. Try again.</p>';
    } finally {
      btn.disabled = false;
      btn.textContent = "Generate";
    }
  }

  function selectMode(mode) {
    $("#modalRoot")
      .querySelectorAll(".mode-btn")
      .forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === mode)));
    $("#modalRoot")
      .querySelectorAll(".panel-pane")
      .forEach((p) => p.classList.toggle("active", p.dataset.pane === mode));
  }

  function selectArea(areaId) {
    editor.setActiveArea(areaId);
    $("#modalRoot")
      .querySelectorAll(".area-tab")
      .forEach((t) => {
        const on = t.dataset.area === areaId;
        t.setAttribute("aria-selected", String(on));
        const existing = t.querySelector(".area-tab-bg");
        if (on && !existing) t.appendChild(el("span", "area-tab-bg"));
        if (!on && existing) existing.remove();
      });
    // gentle transition on the stage
    const frame = $("#canvasFrame");
    if (frame) {
      frame.style.opacity = "0";
      setTimeout(() => (frame.style.opacity = "1"), 90);
    }
  }

  function toolAction(act) {
    switch (act) {
      case "undo": editor.undo(); break;
      case "redo": editor.redo(); break;
      case "dup": editor.duplicate(); break;
      case "rotate": editor.rotateSelected(15); break;
      case "del": editor.removeSelected(); break;
      case "alignL": editor.align("left"); break;
      case "alignR": editor.align("right"); break;
      case "alignT": editor.align("top"); break;
      case "alignB": editor.align("bottom"); break;
      case "center": editor.snapCenter(); break;
      case "zoomIn": editor.zoomIn(); break;
      case "zoomOut": editor.zoomOut(); break;
    }
  }

  /* --------------------------- editor callbacks --------------------------- */
  function onEditorChange(info) {
    const s = store.get();
    s.areas[info.areaId].objectCount = info.objectCount;
    $("#stageEmpty").style.opacity = info.objectCount ? "0" : "1";
    setDisabled("undo", !info.canUndo);
    setDisabled("redo", !info.canRedo);
    updateAreaCounts();
    updateLayers();
    refreshPricing();
    updateCustomizeSummary();
    updatePagePrice();
  }

  function onSelection(obj) {
    const hasSel = !!obj;
    ["dup", "rotate", "del", "alignL", "alignR", "alignT", "alignB", "center"].forEach((a) =>
      setDisabled(a, !hasSel)
    );
    updateLayers();
    // Sync text controls to the selected object.
    if (obj && obj.dynamicKind === "text") {
      if (obj.fill) markPressed("#textColors", "[data-color]", obj.fill);
      if (obj.fontFamily) markPressed("#fontGrid", "[data-font]", obj.fontFamily);
      if (obj.fontSize) {
        $("#fontSize").value = obj.fontSize;
        $("#fontSizeVal").textContent = Math.round(obj.fontSize);
      }
      selectMode("text");
    }
  }

  function setDisabled(act, val) {
    const b = $(`.tool-btn[data-act="${act}"]`);
    if (b) b.disabled = val;
  }

  function updateAreaCounts() {
    const s = store.get();
    Object.keys(s.areas).forEach((k) => {
      const badge = $(`.area-count[data-count="${k}"]`);
      if (badge) {
        const n = s.areas[k].objectCount;
        badge.textContent = n ? ` · ${n}` : "";
      }
    });
  }

  function updateLayers() {
    const host = $("#layersSection");
    if (!host || !editor) return;
    const objs = editor.listObjects().slice().reverse();
    const activeObj = editor.getActive();
    if (!objs.length) {
      host.innerHTML = `<label style="font-size:12px;font-weight:600;color:var(--ink-soft)">Layers</label><p class="hint" style="margin-top:6px">Nothing on this area yet.</p>`;
      return;
    }
    host.innerHTML = `<label style="font-size:12px;font-weight:600;color:var(--ink-soft);display:block;margin-bottom:8px">Layers · ${objs.length}</label><div class="layer-list"></div>`;
    const list = host.querySelector(".layer-list");
    objs.forEach((o) => {
      const isText = o.dynamicKind === "text";
      const row = el("div", "layer" + (o === activeObj ? " sel" : ""));
      row.innerHTML = `<span class="layer-ico">${isText ? ICONS.layerText : ICONS.layerImg}</span>
        <span class="layer-name">${escapeHtml(o.name || (isText ? o.text : "Layer"))}</span>
        <button class="layer-del" aria-label="Delete layer">${ICONS.del}</button>`;
      row.querySelector(".layer-name").onclick = () => editor.selectObject(o);
      row.querySelector(".layer-ico").onclick = () => editor.selectObject(o);
      row.querySelector(".layer-del").onclick = (e) => {
        e.stopPropagation();
        editor.selectObject(o);
        editor.removeSelected();
      };
      list.appendChild(row);
    });
  }

  /* --------------------------- pricing --------------------------- */
  function refreshPricing() {
    const p = D.pricing.compute(product, store.get());
    currentPricing = p;
    $("#modalTotal").textContent = p.format(p.total);
    $("#priceList").innerHTML = p.items
      .map(
        (i) =>
          `<li><span>${escapeHtml(i.label)}</span><span class="${i.kind === "free" ? "free" : ""}">${
            i.kind === "free" ? "Free" : "+" + p.format(i.amount).replace("$", "$")
          }</span></li>`
      )
      .join("") +
      (p.quantity > 1
        ? `<li style="border-top:1px solid var(--line-soft);margin-top:6px;padding-top:8px"><span>× ${p.quantity} qty</span><span>${p.format(p.total)}</span></li>`
        : "");
  }

  /* --------------------------- add to cart --------------------------- */
  async function onAddToCart() {
    const btn = $("#applyBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span> Saving';
    try {
      const previewDataUrl = editor.exportCompositePNG();
      const areaPreviews = {};
      product.areas.forEach((a) => {
        const s = store.get().areas[a.id];
        if (s && s.objectCount > 0) areaPreviews[a.id] = editor.exportAreaPNG(a.id, 2);
      });
      const ctx = {
        product,
        state: store.get(),
        editor,
        pricing: currentPricing,
        previewDataUrl,
        areaPreviews,
        uploadedAssets,
        variantId: null, // resolved from color/size by the storefront integration
      };
      const bundle = D.cart.buildDesignBundle(ctx);
      const request = D.cart.buildCartRequest(ctx, {
        designId: "local-" + bundle.productId,
      });
      const result = await D.cart.addToCart(request);

      // Expose for inspection / integration testing.
      root.Dynamic.lastOrder = { bundle, request, result };
      console.groupCollapsed("%c[Dynamic] Add to Cart payload", "color:#0071e3;font-weight:600");
      console.log("Design bundle:", bundle);
      console.log("Shopify cart request:", request);
      console.groupEnd();

      updateCustomizeSummary();
      closeModal();
      toast(
        result.simulated
          ? "Design saved — cart payload ready (see console)"
          : "Added to cart"
      );
    } catch (e) {
      console.error(e);
      toast("Something went wrong saving your design");
    } finally {
      btn.disabled = false;
      btn.textContent = "Add to Cart";
    }
  }

  /* --------------------------- open / close --------------------------- */
  function openModal() {
    const rootEl = $("#modalRoot");
    rootEl.classList.add("open");
    modalOpen = true;
    document.body.classList.add("no-scroll");
    const sheet = $(".modal-sheet");
    const scrim = $(".modal-scrim");
    if (root.gsap) {
      root.gsap.to(scrim, { opacity: 1, duration: 0.3, ease: "power2.out" });
      root.gsap.fromTo(
        sheet,
        { opacity: 0, y: 28, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out" }
      );
    } else {
      scrim.style.transition = "opacity .3s";
      sheet.style.transition = "opacity .45s cubic-bezier(.16,1,.3,1), transform .45s cubic-bezier(.16,1,.3,1)";
      requestAnimationFrame(() => {
        scrim.style.opacity = "1";
        sheet.style.opacity = "1";
        sheet.style.transform = "none";
      });
    }
    // focus management
    setTimeout(() => $(".modal-close") && $(".modal-close").focus(), 60);
  }

  function closeModal() {
    const rootEl = $("#modalRoot");
    const sheet = $(".modal-sheet");
    const scrim = $(".modal-scrim");
    const done = () => {
      rootEl.classList.remove("open");
      modalOpen = false;
      document.body.classList.remove("no-scroll");
      $("#customizeBtn") && $("#customizeBtn").focus();
    };
    if (root.gsap) {
      root.gsap.to(scrim, { opacity: 0, duration: 0.28 });
      root.gsap.to(sheet, {
        opacity: 0,
        y: 24,
        scale: 0.99,
        duration: 0.32,
        ease: "power2.in",
        onComplete: done,
      });
    } else {
      sheet.style.opacity = "0";
      sheet.style.transform = "translateY(24px) scale(.99)";
      scrim.style.opacity = "0";
      setTimeout(done, 300);
    }
  }

  /* --------------------------- helpers --------------------------- */
  function pressOne(scope, btn) {
    $(scope)
      .querySelectorAll("[aria-pressed]")
      .forEach((b) => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
  }
  function markPressed(scope, sel, value) {
    const host = $(scope);
    if (!host) return;
    host.querySelectorAll(sel).forEach((b) => {
      const key = b.dataset.color || b.dataset.font;
      b.setAttribute("aria-pressed", String(key === value));
    });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  let toastTimer;
  function toast(msg) {
    let host = $(".toast-host");
    if (!host) {
      host = el("div", "toast-host");
      document.body.appendChild(host);
    }
    const t = el("div", "toast", escapeHtml(msg));
    host.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastTimer);
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 400);
    }, 2400);
  }

  /* --------------------------- product switching --------------------------- */
  function loadProduct(id) {
    product = D.getProduct(id);
    store = D.createStore(D.initState(product));
    unsubStore && unsubStore();
    renderProductPage();
    buildModal();
    // reflect in switcher
    document.querySelectorAll("[data-product]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.product === id))
    );
  }

  /* --------------------------- init --------------------------- */
  function init() {
    // Product switcher
    document.querySelectorAll("[data-product]").forEach((b) => {
      b.onclick = () => loadProduct(b.dataset.product);
    });
    // Quantity
    const qtyInput = $("#qtyInput");
    $("#qtyMinus").onclick = () => setQty(store.get().quantity - 1);
    $("#qtyPlus").onclick = () => setQty(store.get().quantity + 1);
    qtyInput.onchange = () => setQty(parseInt(qtyInput.value, 10) || 1);
    function setQty(n) {
      n = Math.max(1, Math.min(999, n));
      store.set({ quantity: n });
      qtyInput.value = n;
      updatePagePrice();
      if (modalOpen) refreshPricing();
    }
    // Customize + add to cart (page)
    $("#customizeBtn").onclick = openModal;
    $("#pageAddCart").onclick = () => {
      // Quick add without customization.
      toast(decoratedCount() ? "Added your customized item" : "Added to cart");
    };
    // Escape closes modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalOpen) closeModal();
    });

    loadProduct("mug");
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})(window);
