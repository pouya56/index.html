
/* Instagram-style action bar. Like/Share counts come from your settings; the
   Comment count is the REAL Judge.me review count; Save uses the shared
   wishlist ("dyn_wishlist"). Clicking the comment icon reveals Judge.me's
   review widget. */
(function () {
  var cfgEl = document.getElementById("dyn-social-config");
  var root = document.getElementById("igSocial");
  if (!cfgEl || !root) return;
  var cfg; try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }
  if (!cfg.show) return;
  root.hidden = false;

  var handle = cfg.handle || "product";
  var LK_KEY = "dyn_like_" + handle, SH_KEY = "dyn_share_" + handle, WL_KEY = "dyn_wishlist";
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var likeBtn = document.getElementById("igLike"), likeCount = document.getElementById("igLikeCount");
  var commentBtn = document.getElementById("igComment"), commentCount = document.getElementById("igCommentCount");
  var shareBtn = document.getElementById("igShare"), shareCount = document.getElementById("igShareCount");
  var saveBtn = document.getElementById("igSave"), noteEl = document.getElementById("igNote");
  var panel = document.getElementById("igReviewsPanel");

  /* Optional Firebase Realtime Database for REAL shared like/share counts.
     Uses the plain REST API (fetch), so there's no third-party SDK to be
     blocked; server-side atomic increment keeps the totals correct. */
  var fb = (cfg.fbUrl || "").trim().replace(/\/+$/, "");
  var fbLikes = 0, fbShares = 0;
  function fbInc(field, delta) { if (!fb) return; try { fetch(fb + "/counters/" + encodeURIComponent(handle) + "/" + field + ".json", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ".sv": { "increment": delta } }) }).catch(function () {}); } catch (e) {} }
  function fbLoad() {
    if (!fb) return;
    try {
      fetch(fb + "/counters/" + encodeURIComponent(handle) + ".json").then(function (r) { return r.json(); }).then(function (d) {
        d = d || {}; fbLikes = parseInt(d.likes, 10) || 0; fbShares = parseInt(d.shares, 10) || 0;
        renderLike(); renderShare();
      }).catch(function () {});
    } catch (e) {}
  }
  /* Re-check the shared count when the page regains focus, so a like made on
     another device shows up without a full manual reload. */
  document.addEventListener("visibilitychange", function () { if (!document.hidden) fbLoad(); });
  window.addEventListener("focus", fbLoad);

  /* Like — starting number + real likes (Firebase) or this device's like. */
  function liked() { return jget(LK_KEY, false) === true; }
  function renderLike() {
    var base = parseInt(cfg.likeBase, 10) || 0;
    likeCount.textContent = base + (fb ? fbLikes : (liked() ? 1 : 0));
    likeBtn.classList.toggle("is-on", liked()); likeBtn.setAttribute("aria-pressed", liked() ? "true" : "false");
  }
  likeBtn.addEventListener("click", function () {
    var now = !liked(); jset(LK_KEY, now);
    if (fb) { fbInc("likes", now ? 1 : -1); fbLikes += now ? 1 : -1; }
    if (now) { likeBtn.classList.remove("pop"); void likeBtn.offsetWidth; likeBtn.classList.add("pop"); }
    renderLike();
  });
  renderLike();

  /* Share — starting number + real share-clicks (Firebase), plus the share sheet. */
  function shared() { return jget(SH_KEY, false) === true; }
  function renderShare() {
    if (!shareCount) return;
    var base = parseInt(cfg.shareBase, 10) || 0;
    var n = base + (fb ? fbShares : 0);
    shareCount.textContent = (fb || n > 0) ? String(n) : "";
  }
  function flashNote(msg) { noteEl.textContent = msg; noteEl.hidden = false; setTimeout(function () { noteEl.hidden = true; }, 2500); }
  shareBtn.addEventListener("click", function () {
    var url = cfg.url ? (location.origin + cfg.url) : location.href, title = cfg.title || document.title;
    var text = "Check out " + title + (cfg.price ? " — " + cfg.price : "");
    if (navigator.share) { navigator.share({ title: title, text: text, url: url }).catch(function () {}); }
    else if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text + " " + url).then(function () { flashNote("Link copied!"); }).catch(function () { window.prompt("Copy this link:", url); }); }
    else { window.prompt("Copy this link:", url); }
    if (fb && !shared()) { jset(SH_KEY, true); fbInc("shares", 1); fbShares += 1; renderShare(); }
  });
  renderShare();
  fbLoad();

  /* Save — shared wishlist. */
  function wlRead() { try { var a = JSON.parse(localStorage.getItem(WL_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function wlWrite(l) { try { localStorage.setItem(WL_KEY, JSON.stringify(l)); } catch (e) {} try { window.dispatchEvent(new CustomEvent("dyn-wishlist-change")); } catch (e) {} }
  function saved() { return wlRead().some(function (x) { return String(x.id) === String(handle); }); }
  function paintSave() { var on = saved(); saveBtn.classList.toggle("is-on", on); saveBtn.setAttribute("aria-pressed", on ? "true" : "false"); saveBtn.setAttribute("aria-label", on ? "Saved — remove from wishlist" : "Save to wishlist"); }
  saveBtn.addEventListener("click", function () { var l = wlRead(), i = -1, k; for (k = 0; k < l.length; k++) { if (String(l[k].id) === String(handle)) { i = k; break; } } if (i >= 0) { l.splice(i, 1); } else { l.unshift({ id: handle, title: cfg.title, url: cfg.url, image: cfg.image, price: cfg.price }); } wlWrite(l); paintSave(); });
  window.addEventListener("dyn-wishlist-change", paintSave);
  window.addEventListener("storage", function (e) { if (e.key === WL_KEY) paintSave(); });
  paintSave();

  /* ===== Custom reviews — Instagram-style comments (stored in your Firebase) ===== */
  var ratingEl = document.getElementById("igRating");
  var listEl = document.getElementById("igRvList"), moreBtn = document.getElementById("igRvMore");
  var form = document.getElementById("igRvForm"), textEl = document.getElementById("igRvText");
  var hpEl = document.getElementById("igRvHp"), submitBtn = document.getElementById("igRvSubmit"), rvNote = document.getElementById("igRvNote");
  var starWrap = document.getElementById("igStarsPick"), starHint = document.getElementById("igStarHint"), chosenEl = document.getElementById("igRvChosen"), boxEl = document.getElementById("igRvBox");
  var RVDONE_KEY = "dyn_rvdone_" + handle;
  var reviews = [], expanded = false, pickRating = 0, panelOpen = false, repliesOpen = {};
  /* Only customers who bought this product can write a star review (once). Anyone
     signed in can still REPLY to reviews. Buyers get the green ✓ Verified badge. */
  var canReview = cfg.loggedIn === true && cfg.purchased === true;

  /* ===== Owner (admin) mode =====
     Two ways to become owner (reply with a distinct blue check):
       1. Sign in with the account you named in the section settings ("Owner
          account email") — automatic, nothing to type. (cfg.owner)
       2. Open a product page with ?admin=YOUR-SECRET-WORD (optional fallback).
     The email/word are checked server-side / against a one-way hash, so neither
     the email nor the word ever appears in the page's source code. */
  var ADMIN_KEY = "dyn_admin_" + (cfg.adminHash || "x");
  var isAdmin = cfg.owner === true || (!!cfg.adminHash && jget(ADMIN_KEY, false) === true);
  var ownerPill = null;

  function sha256Hex(str) {
    try {
      if (!window.crypto || !crypto.subtle || !window.TextEncoder) return Promise.resolve("");
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (h) {
        return Array.prototype.map.call(new Uint8Array(h), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
      }).catch(function () { return ""; });
    } catch (e) { return Promise.resolve(""); }
  }
  function setAdmin(on) {
    isAdmin = on; jset(ADMIN_KEY, on);
    if (ownerPill) ownerPill.hidden = !on;
    render();
  }
  function buildOwnerPill() {
    ownerPill = document.createElement("div");
    ownerPill.className = "ig-owner-pill"; ownerPill.hidden = !isAdmin;
    // Account-based owners are always owner on this account, so no "turn off" link.
    var off = cfg.owner ? "" : '<button type="button" class="ig-owner-off">turn off</button>';
    ownerPill.innerHTML = '<span class="ig-owner-check" aria-hidden="true">' + OWNER_SVG + '</span><span>Owner mode — your replies show a blue check as ' + esc(cfg.adminName || "the store") + '.</span>' + off;
    var offBtn = ownerPill.querySelector(".ig-owner-off");
    if (offBtn) offBtn.addEventListener("click", function () { setAdmin(false); flashNote("Owner mode turned off on this device."); });
    if (panel && panel.parentNode) panel.parentNode.insertBefore(ownerPill, panel);
  }
  function handleAdminParam() {
    var m = /[?&]admin=([^&]*)/.exec(location.search);
    if (!m) return;
    var val = decodeURIComponent((m[1] || "").replace(/\+/g, " ")).trim();
    // Remove ?admin=… from the address bar so the secret isn't left visible or shared.
    try { var u = location.href.replace(/([?&])admin=[^&]*/, "$1").replace(/[?&]&/, "$1").replace(/[?&]$/, ""); history.replaceState(null, "", u); } catch (e) {}
    if (val.toLowerCase() === "off") { setAdmin(false); flashNote("Owner mode turned off on this device."); return; }
    if (!cfg.adminHash) { flashNote("Set a secret owner word in the theme settings first."); return; }
    sha256Hex(val).then(function (h) {
      if (h && h === cfg.adminHash) { setAdmin(true); flashNote("Owner mode is on for this device."); }
      else { flashNote("That owner word wasn’t right."); }
    });
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function stars(n) { n = Math.max(0, Math.min(5, Math.round(n))); return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }
  function ago(t) { if (!t) return ""; var s = Math.floor((Date.now() - t) / 1000); if (s < 60) return "just now"; var m = Math.floor(s / 60); if (m < 60) return m + "m"; var h = Math.floor(m / 60); if (h < 24) return h + "h"; var d = Math.floor(h / 24); if (d < 7) return d + "d"; return Math.floor(d / 7) + "w"; }
  function initial(name) { name = (name || "").trim(); return name ? name.charAt(0).toUpperCase() : "?"; }
  /* Apple-style account icon (person cropped by the circle). */
  var AV_SVG = '<svg class="ig-av-ic" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="13.6" r="6.1" fill="currentColor"/><circle cx="18" cy="35" r="11" fill="currentColor"/></svg>';
  /* X.com-style verified seal (blue scalloped badge with a white check). */
  var OWNER_SVG = '<svg class="ig-x-badge" viewBox="0 0 24 24" aria-hidden="true"><path class="seal" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.68.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.66-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.91.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.66 2.19-1.91 2.19-3.34z"/><path class="tick" d="M10.06 15.35 6.7 11.99l1.32-1.32 2.04 2.04 5.22-5.22 1.32 1.33z"/></svg>';
  function fbGet(path) { return fetch(fb + path).then(function (r) { return r.json(); }).catch(function () { return null; }); }
  function fbIncPath(path, delta) { if (!fb) return; try { fetch(fb + path + ".json", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ".sv": { "increment": delta } }) }).catch(function () {}); } catch (e) {} }
  function rvById(id) { for (var i = 0; i < reviews.length; i++) { if (reviews[i].id === id) return reviews[i]; } return null; }
  function likedReview(id) { return jget("dyn_rvlk_" + handle + "_" + id, false) === true; }

  function rvLoad() {
    if (!fb) { render(); return; }
    var h = encodeURIComponent(handle);
    Promise.all([fbGet("/reviews/" + h + ".json"), fbGet("/review_likes/" + h + ".json"), fbGet("/review_replies/" + h + ".json")]).then(function (res) {
      var d = res[0] || {}, lk = res[1] || {}, rp = res[2] || {}, out = [];
      for (var k in d) {
        if (!d.hasOwnProperty(k) || !d[k]) continue;
        var r = d[k], reps = [], rpo = rp[k] || {};
        for (var rk in rpo) { if (rpo.hasOwnProperty(rk) && rpo[rk]) reps.push({ id: rk, name: rpo[rk].name || "Anonymous", text: rpo[rk].text || "", t: parseInt(rpo[rk].t, 10) || 0, a: rpo[rk].admin ? 1 : 0 }); }
        reps.sort(function (a, b) { return a.t - b.t; });
        out.push({ id: k, name: r.name || "Anonymous", rating: parseInt(r.rating, 10) || 5, text: r.text || "", t: parseInt(r.t, 10) || 0, v: r.v ? 1 : 0, likes: parseInt(lk[k], 10) || 0, replies: reps });
      }
      out.sort(function (a, b) { return b.t - a.t; });
      reviews = out; render();
    }).catch(function () { render(); });
  }

  function replyHTML(rp) {
    var owner = rp.a ? 1 : 0;
    var badge = owner ? '<span class="ig-owner-badge" title="Store owner" aria-label="Store owner">' + OWNER_SVG + '</span>' : '';
    return '<div class="ig-rv ig-rv-reply' + (owner ? ' is-owner-reply' : '') + '"><div class="ig-rv-av ig-rv-av-sm' + (owner ? ' ig-av-owner' : '') + '">' + AV_SVG + '</div>' +
      '<div class="ig-rv-main"><div class="ig-rv-cbody"><b>' + esc(rp.name) + '</b>' + badge + esc(rp.text) + '</div>' +
      '<div class="ig-rv-meta"><span>' + ago(rp.t) + '</span></div></div></div>';
  }
  function cardHTML(r) {
    var vb = r.v ? '<span class="ig-rv-verified">✓ Purchased</span>' : '';
    var on = likedReview(r.id), reps = r.replies || [], repsOpen = !!repliesOpen[r.id];
    var toggle = reps.length ? '<button type="button" class="ig-rv-viewreplies" data-id="' + r.id + '">— ' + (repsOpen ? 'Hide' : 'View') + ' replies (' + reps.length + ')</button>' : '';
    return '<div class="ig-rv" data-id="' + r.id + '">' +
      '<div class="ig-rv-av">' + AV_SVG + '</div>' +
      '<div class="ig-rv-main">' +
        '<div class="ig-rv-cbody"><b>' + esc(r.name) + '</b>' + vb + '<span class="ig-rvstars">' + stars(r.rating) + '</span> ' + esc(r.text) + '</div>' +
        '<div class="ig-rv-meta">' +
          '<span>' + ago(r.t) + '</span>' +
          '<span class="ig-rv-likes">' + (r.likes === 1 ? '1 like' : r.likes + ' likes') + '</span>' +
          '<button type="button" class="ig-rv-reply-btn" data-id="' + r.id + '">Reply</button>' +
        '</div>' +
        toggle +
        '<div class="ig-rv-replies" data-id="' + r.id + '"' + (repsOpen ? '' : ' hidden') + '>' + reps.map(replyHTML).join("") + '</div>' +
        '<form class="ig-rv-replyform" data-id="' + r.id + '" hidden><input class="ig-rv-replyinput" type="text" placeholder="' + (isAdmin ? ("Reply as " + esc(cfg.adminName || "the store")) : "Add a reply…") + '" maxlength="300"><button type="submit" class="ig-rv-replysend">Send</button></form>' +
      '</div>' +
      '<button type="button" class="ig-rv-like' + (on ? ' is-on' : '') + '" data-id="' + r.id + '" aria-label="Like this review"><svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.7-10-9.3C.7 9 1.6 5.6 4.6 4.6 7 3.8 9.3 5 12 8c2.7-3 5-4.2 7.4-3.4 3 1 3.9 4.4 2.6 7.1C19.5 16.3 12 21 12 21Z"/></svg></button>' +
    '</div>';
  }
  function render() {
    var n = reviews.length;
    commentCount.textContent = n > 0 ? n : "";
    if (n) { var sum = 0; reviews.forEach(function (r) { sum += r.rating; }); var avg = sum / n; ratingEl.hidden = false; ratingEl.innerHTML = '<span class="ig-rstars">' + stars(avg) + '</span> ' + avg.toFixed(1) + ' · ' + n + (n === 1 ? ' review' : ' reviews'); }
    else { ratingEl.hidden = true; }
    var show = expanded ? reviews : reviews.slice(0, 3);
    listEl.innerHTML = n ? show.map(cardHTML).join("") : '<div class="ig-rv-empty">No reviews yet — be the first to review this product!</div>';
    moreBtn.hidden = n <= 3; moreBtn.textContent = expanded ? "Show less" : ("View all " + n + " reviews");
  }
  moreBtn.addEventListener("click", function () { expanded = !expanded; render(); });

  /* Like a review, reply to it, view replies — all delegated. */
  function toggleReviewLike(id) {
    var rev = rvById(id); if (!rev) return;
    var key = "dyn_rvlk_" + handle + "_" + id, now = !likedReview(id);
    jset(key, now); rev.likes += now ? 1 : -1; if (rev.likes < 0) rev.likes = 0;
    fbIncPath("/review_likes/" + encodeURIComponent(handle) + "/" + id, now ? 1 : -1);
    render();
  }
  listEl.addEventListener("click", function (e) {
    var lk = e.target.closest && e.target.closest(".ig-rv-like");
    if (lk) { toggleReviewLike(lk.getAttribute("data-id")); return; }
    var rb = e.target.closest && e.target.closest(".ig-rv-reply-btn");
    if (rb) { var f = listEl.querySelector('.ig-rv-replyform[data-id="' + rb.getAttribute("data-id") + '"]'); if (f) { f.hidden = !f.hidden; if (!f.hidden) { var inp = f.querySelector("input"); if (inp) inp.focus(); } } return; }
    var vr = e.target.closest && e.target.closest(".ig-rv-viewreplies");
    if (vr) { var id = vr.getAttribute("data-id"), rp = listEl.querySelector('.ig-rv-replies[data-id="' + id + '"]'), rev = rvById(id); if (rp && rev) { var show = rp.hidden; rp.hidden = !show; repliesOpen[id] = show; vr.textContent = "— " + (show ? "Hide" : "View") + " replies (" + rev.replies.length + ")"; } return; }
  });
  listEl.addEventListener("submit", function (e) {
    var f = e.target; if (!f.classList || !f.classList.contains("ig-rv-replyform")) return;
    e.preventDefault();
    if (!fb) return;
    var id = f.getAttribute("data-id"), inp = f.querySelector("input"), text = (inp.value || "").trim();
    if (text.length < 1) return;
    var reply = { name: isAdmin ? (cfg.adminName || "The store") : ((cfg.loggedIn && cfg.customerName) ? cfg.customerName : "Guest"), text: text.slice(0, 300), t: Date.now() };
    if (isAdmin) reply.admin = 1;
    fetch(fb + "/review_replies/" + encodeURIComponent(handle) + "/" + id + ".json", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reply) })
      .then(function (r) { return r.json(); }).then(function (res) {
        if (res && res.name) { var rev = rvById(id); if (rev) { rev.replies.push({ id: res.name, name: reply.name, text: reply.text, t: reply.t, a: isAdmin ? 1 : 0 }); } repliesOpen[id] = true; render(); }
      }).catch(function () {});
  });

  /* Write-a-review form: pick a star first, then the text field appears. */
  function paintStars() { Array.prototype.forEach.call(starWrap.children, function (b, i) { b.classList.toggle("on", i < pickRating); }); }
  /* Star picker shows first; once a rating is chosen the stars move INTO the
     input box (left side) and the text box + send arrow appear. Tap the stars to re-pick. */
  function autoGrow() { if (!textEl) return; textEl.style.height = "auto"; textEl.style.height = Math.min(textEl.scrollHeight, 120) + "px"; }
  function showPicker() { starWrap.style.display = ""; if (starHint) starHint.style.display = ""; if (boxEl) boxEl.hidden = true; }
  function revealForm() {
    starWrap.style.display = "none";
    if (starHint) starHint.style.display = "none";
    if (chosenEl) chosenEl.innerHTML = '<span class="ig-rvstars">' + stars(pickRating) + '</span>';
    if (boxEl) boxEl.hidden = false;
    autoGrow();
    try { textEl.focus(); } catch (e) {}
  }
  showPicker();
  Array.prototype.forEach.call(starWrap.children, function (b) { b.addEventListener("click", function () { pickRating = parseInt(b.getAttribute("data-v"), 10) || 5; paintStars(); revealForm(); }); });
  if (chosenEl) chosenEl.addEventListener("click", function () { showPicker(); });
  if (textEl) textEl.addEventListener("input", autoGrow);
  paintStars();

  function note(msg, ok) { rvNote.textContent = msg; rvNote.style.color = ok === false ? "#c0392b" : "#1a7f37"; rvNote.hidden = false; }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (hpEl && hpEl.value) return;
    if (pickRating < 1) { note("Please tap a star to rate first.", false); return; }
    if (jget(RVDONE_KEY, false)) { note("You’ve already reviewed this product. Thank you!", false); return; }
    var text = (textEl.value || "").trim();
    if (text.length < 3) { note("Please write a little more.", false); textEl.focus(); return; }
    if (!fb) { note("Reviews need the Firebase link set up first.", false); return; }
    var review = { name: ((cfg.customerName || "").toString().trim().slice(0, 60)) || "Anonymous", rating: pickRating, text: text.slice(0, 800), t: Date.now(), v: cfg.purchased ? 1 : 0 };
    submitBtn.disabled = true;
    fetch(fb + "/reviews/" + encodeURIComponent(handle) + ".json", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(review) })
      .then(function (r) { return r.json(); }).then(function (res) {
        submitBtn.disabled = false;
        if (res && res.name) { jset(RVDONE_KEY, true);
          try { var mine = JSON.parse(localStorage.getItem("dyn_myreviews") || "[]"); if (!Array.isArray(mine)) mine = []; mine.push({ handle: handle, title: cfg.title || document.title, url: (cfg.url ? (location.origin + cfg.url) : location.href), rating: review.rating, text: review.text, t: review.t }); localStorage.setItem("dyn_myreviews", JSON.stringify(mine)); } catch (e) {}
          reviews.unshift({ id: res.name, name: review.name, rating: review.rating, text: review.text, t: review.t, v: review.v, likes: 0, replies: [] }); expanded = false; render(); textEl.value = ""; autoGrow(); note("Thanks! Your review is posted."); }
        else { note("Couldn’t post right now — please try again.", false); }
      }).catch(function () { submitBtn.disabled = false; note("Couldn’t post right now — please try again.", false); });
  });

  /* Comment icon — reveal / hide the reviews (we control rendering, so hiding
     is fine and lazy loading is not an issue). */
  function openPanel() {
    panelOpen = true; panel.hidden = false; commentBtn.setAttribute("aria-expanded", "true");
    try { panel.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {}
  }
  commentBtn.addEventListener("click", function () {
    if (!panelOpen) { openPanel(); return; }
    panelOpen = false; panel.hidden = true; commentBtn.setAttribute("aria-expanded", "false");
  });
  /* Deep-link from the account page's "Write a review" button: ?review=1 opens
     the reviews panel and focuses the write-a-review form. */
  try {
    if (/[?&]review=1\b/.test(location.search) || location.hash === "#write-review") {
      setTimeout(function () { openPanel(); var t = document.getElementById("igStarsPick"); if (t) { try { t.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {} } }, 400);
    }
  } catch (e) {}

  /* Review gate: only customers who bought this product can write a star review,
     and only the first time (once done, the form is replaced with a thank-you). */
  if (!canReview) {
    form.style.display = "none";
    var gate = document.createElement("div"); gate.className = "ig-rv-gate";
    if (!cfg.loggedIn) { gate.innerHTML = 'Only customers who bought this product can review it. <a href="' + esc(cfg.loginUrl || "/account/login") + '">Log in</a> to your account.'; }
    else { gate.textContent = "Only customers who bought this product can review it."; }
    panel.appendChild(gate);
  } else if (jget(RVDONE_KEY, false)) {
    form.style.display = "none";
    var done = document.createElement("div"); done.className = "ig-rv-gate";
    done.textContent = "✓ Thanks — you’ve already reviewed this product.";
    panel.appendChild(done);
  }

  buildOwnerPill(); handleAdminParam();
  render(); rvLoad();
  document.addEventListener("visibilitychange", function () { if (!document.hidden) rvLoad(); });
})();
