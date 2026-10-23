
(function () {
var root = document.getElementById("dynHero");
if (!root) return;

var headVid = root.querySelector(".dh-head-video");
if (headVid) {
headVid.loop = false; headVid.muted = true;
var hp = headVid.play(); if (hp && hp.catch) hp.catch(function () {});
}

document.addEventListener("click", function (e) {
var a = e.target.closest ? e.target.closest('a[href$="#wishlist"], a[href="#wishlist"]') : null;
if (!a) return;
e.preventDefault();
if (window.DynamicHeader && window.DynamicHeader.openWishlist) { window.DynamicHeader.openWishlist(); }
}, true);

var menus = Array.prototype.slice.call(root.querySelectorAll(".dh-menu"));
function closeMenus(except) {
menus.forEach(function (m) {
if (m === except) return;
var b = m.querySelector(".dh-icon-btn"), p = m.querySelector(".dh-pop");
if (p) p.hidden = true; if (b) b.setAttribute("aria-expanded", "false");
});
}
menus.forEach(function (m) {
var btn = m.querySelector(".dh-icon-btn"), pop = m.querySelector(".dh-pop");
if (!btn || !pop) return;
btn.addEventListener("click", function (e) {
e.stopPropagation();
var willOpen = pop.hidden;
closeMenus(m);
pop.hidden = !willOpen;
btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
});
pop.addEventListener("click", function (e) { e.stopPropagation(); });
});
if (menus.length) {
document.addEventListener("click", function () { closeMenus(null); });
document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenus(null); });
var errMenu = root.querySelector(".dh-acct-pop [data-has-error]");
if (errMenu) {
var pop = errMenu.closest(".dh-pop"), mm = errMenu.closest(".dh-menu");
if (pop) pop.hidden = false;
if (mm) { var b = mm.querySelector(".dh-icon-btn"); if (b) b.setAttribute("aria-expanded", "true"); }
}
}

var loginForm = root.querySelector(".dh-login-form");
if (loginForm) {
var loginBtn = loginForm.querySelector(".dh-pop-btn");
var loginBtnHTML = loginBtn ? loginBtn.innerHTML : "";
var OK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
var X_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
function setLogin(state) {
if (!loginBtn) return;
loginBtn.classList.remove("is-ok", "is-err", "is-loading");
if (state === "loading") { loginBtn.classList.add("is-loading"); loginBtn.disabled = true; }
else if (state === "ok") { loginBtn.classList.add("is-ok"); loginBtn.innerHTML = OK_SVG; }
else if (state === "err") { loginBtn.classList.add("is-err"); loginBtn.innerHTML = X_SVG; loginBtn.disabled = false; }
else { loginBtn.disabled = false; loginBtn.innerHTML = loginBtnHTML; }
}
loginForm.addEventListener("submit", function (e) {
var email = loginForm.querySelector('input[name="customer[email]"]');
var pwd = loginForm.querySelector('input[name="customer[password]"]');
if (!email || !email.value || !pwd || !pwd.value) return;
e.preventDefault();
if (loginBtn && loginBtn.dataset.busy) return;
if (loginBtn) loginBtn.dataset.busy = "1";
setLogin("loading");
var action = loginForm.getAttribute("action") || "/account/login";
fetch(action, { method: "POST", body: new FormData(loginForm), headers: { "Accept": "text/html" } })
.then(function (res) {
var url = res.url || "";
var stayedOnLogin = !res.redirected || url.indexOf("/account/login") >= 0 || url.indexOf("/account/register") >= 0;
if (!stayedOnLogin) {
setLogin("ok");
setTimeout(function () { window.location.href = url || "/account"; }, 720);
} else {
setLogin("err");
if (loginBtn) loginBtn.dataset.busy = "";
setTimeout(function () { setLogin("reset"); }, 1900);
}
})
.catch(function () {
if (loginBtn) loginBtn.dataset.busy = "";
loginForm.submit(); // network issue → fall back to a normal submit
});
});
}

var grid = document.getElementById("dhGrid");
var tabs = document.getElementById("dhTabs");
var noRes = document.getElementById("dhNoResults");
var tabsWrap = document.getElementById("dhTabsWrap");
var shelfWrap = document.getElementById("dhShelfWrap");
var hideUntilSearch = root.getAttribute("data-hide-until-search") === "true";
var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll(".dh-card")) : [];

function colCount() {
var first = grid.querySelector(".dh-card");
if (!first) return 1;
var cw = first.getBoundingClientRect().width + 22; // card + gap
var n = Math.round(grid.clientWidth / cw);
return Math.max(1, n || 1);
}

function reveal(visible) {
var cols = colCount();
visible.forEach(function (c) { c.classList.remove("in"); c.style.transitionDelay = "0ms"; });
void grid.offsetWidth; // force reflow so removing/re-adding .in restarts the transition
visible.forEach(function (c, i) {
var col = i % cols, rowN = Math.floor(i / cols);
c.style.transitionDelay = (col * 55 + rowN * 60) + "ms";
c.classList.add("in");
});
}

function lev(a, b) {
var m = a.length, n = b.length; if (!m) return n; if (!n) return m;
var d = [], i, j;
for (i = 0; i <= m; i++) { d[i] = []; d[i][0] = i; }
for (j = 0; j <= n; j++) d[0][j] = j;
for (i = 1; i <= m; i++) {
for (j = 1; j <= n; j++) {
var cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
if (i > 1 && j > 1 && a.charCodeAt(i - 1) === b.charCodeAt(j - 2) && a.charCodeAt(i - 2) === b.charCodeAt(j - 1)) {
d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); // adjacent transposition (e.g. "mgu" -> "mug")
}
}
}
return d[m][n];
}
function wordHit(q, words) {
var tol = q.length <= 5 ? 1 : (q.length <= 8 ? 2 : 3);
for (var k = 0; k < words.length; k++) {
var w = words[k]; if (!w) continue;
if (w.indexOf(q) >= 0) return true;
if (q.length < 3) continue;
if (lev(q, w) <= tol) return true;
if (w.length > q.length && lev(q, w.slice(0, q.length)) <= tol) return true;
}
return false;
}
function queryMatch(query, text) {
if (!query) return true;
if (text.indexOf(query) >= 0) return true;
var qw = query.split(/\s+/), tw = text.split(/\s+/), i;
for (i = 0; i < qw.length; i++) { if (qw[i] && !wordHit(qw[i], tw)) return false; }
return true;
}

var currentCat = "__all";
var query = "";
var badgeFilter = null; // 'new' | 'best' | 'sale' — clicking a badge filters to it
var badgeLabels = { "new": "New", "best": "Best sellers", "sale": "On sale" };
var badgeChip = null, badgeChipTxt = null;
function applyFilters() {
if (hideUntilSearch) root.classList.toggle("dh-searching", query.length > 0);
if (!grid) return; // grid removed from the hero — nothing to filter here
if (hideUntilSearch && query.length === 0) {
if (tabsWrap) tabsWrap.style.display = "none";
if (shelfWrap) shelfWrap.style.display = "none";
if (noRes) noRes.style.display = "none";
return;
}
if (tabsWrap) tabsWrap.style.display = "";
if (shelfWrap) shelfWrap.style.display = "";

var searching = query.length > 0;
if (tabs) tabs.querySelectorAll(".dh-tab").forEach(function (b) {
b.classList.toggle("is-active", searching ? b.getAttribute("data-cat") === "__all" : b.getAttribute("data-cat") === currentCat);
});
var visible = [];
cards.forEach(function (c) {
var cc = " " + (c.getAttribute("data-cat") || "") + " ";
var okCat = currentCat === "__all" || cc.indexOf(" " + currentCat + " ") >= 0;
var okQ = !query || queryMatch(query, c.getAttribute("data-search") || "");
var match;
if (badgeFilter) {
var fl = " " + (c.getAttribute("data-flags") || "") + " ";
match = fl.indexOf(" " + badgeFilter + " ") >= 0 && okQ;
} else {
match = searching ? okQ : okCat;
}
c.style.display = match ? "" : "none";
if (match) visible.push(c);
});
if (badgeChip) {
if (badgeFilter) { badgeChip.hidden = false; if (badgeChipTxt) badgeChipTxt.textContent = badgeLabels[badgeFilter] || badgeFilter; }
else { badgeChip.hidden = true; }
}
if (noRes) noRes.style.display = visible.length ? "none" : "block";
grid.scrollLeft = 0;
reveal(visible);
updateGridArrows();
}

if (tabs) tabs.addEventListener("click", function (e) {
var btn = e.target.closest(".dh-tab"); if (!btn) return;
tabs.querySelectorAll(".dh-tab").forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
btn.classList.add("is-active"); btn.setAttribute("aria-selected", "true");
try { btn.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); } catch (x) {}
if (searchEl) searchEl.value = "";
query = "";
badgeFilter = null;
currentCat = btn.getAttribute("data-cat"); applyFilters();
});

(function () {
var anchor = shelfWrap || tabsWrap || grid;
if (!anchor || !anchor.parentNode) return;
badgeChip = document.createElement("div");
badgeChip.className = "dh-badge-chip"; badgeChip.hidden = true;
badgeChip.innerHTML = '<span class="dh-badge-chip-txt"></span><button type="button" class="dh-badge-chip-x" aria-label="Clear filter">&#10005;</button>';
anchor.parentNode.insertBefore(badgeChip, anchor);
badgeChipTxt = badgeChip.querySelector(".dh-badge-chip-txt");
badgeChip.querySelector(".dh-badge-chip-x").addEventListener("click", function () { badgeFilter = null; applyFilters(); });
})();

if (grid) grid.addEventListener("click", function (e) {
var badge = e.target.closest ? e.target.closest(".dh-badge") : null;
if (!badge) return;
var flag = badge.classList.contains("dh-badge-new") ? "new"
: badge.classList.contains("dh-badge-best") ? "best"
: badge.classList.contains("dh-badge-sale") ? "sale" : null;
if (!flag) return;
e.preventDefault(); e.stopPropagation();
badgeFilter = (badgeFilter === flag) ? null : flag;
if (searchEl) searchEl.value = "";
query = ""; currentCat = "__all";
applyFilters();
}, true);

var searchEl = document.getElementById("dhSearch");
var searchBtn = document.getElementById("dhSearchGo");
var searchWrap = searchEl ? searchEl.closest(".dh-search") : null;
if (searchWrap && searchEl) {
searchWrap.addEventListener("mousedown", function (e) {
if (e.target === searchEl || (e.target.closest && e.target.closest("button, a, input"))) return;
e.preventDefault();          // keep focus from moving to the bar itself
searchEl.focus();
});
}
function followMouse(el, xVar, yVar, sVar) {
if (!el) return;
var lastE = null, raf = null;
function apply() { raf = null; if (!lastE) return; var r = el.getBoundingClientRect(); el.style.setProperty(xVar, (lastE.clientX - r.left).toFixed(1) + "px"); el.style.setProperty(yVar, (lastE.clientY - r.top).toFixed(1) + "px"); }
function onMove(e) { lastE = e; if (!raf) raf = requestAnimationFrame(apply); }
el.addEventListener("mouseenter", function (e) { lastE = e; apply(); el.style.setProperty(sVar, "1"); });
el.addEventListener("mousemove", onMove, { passive: true });
el.addEventListener("mouseleave", function () { if (raf) { cancelAnimationFrame(raf); raf = null; } el.style.setProperty(sVar, "0"); });
}
followMouse(document.querySelector(".dh-goo-wrap"), "--gx", "--gy", "--gs");

var resultsUrl = (root.getAttribute("data-results-url") || "").trim();
var findingOn = root.getAttribute("data-finding") === "true";
var findingText = root.getAttribute("data-finding-text") || "Finding your gift…";
var findingMs = parseInt(root.getAttribute("data-finding-ms"), 10) || 550;
var findingEl = root.querySelector(".dh-finding");
var findingTxtEl = findingEl ? findingEl.querySelector(".dh-finding-txt") : null;
var findingReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (findingEl && findingEl.parentNode !== document.body) document.body.appendChild(findingEl);
window.addEventListener("pageshow", function () { if (findingEl) findingEl.classList.remove("is-on"); });
function runFinding(done, keepUp) {
if (!findingEl || !findingTxtEl || findingReduce) { if (done) done(); return; }
findingTxtEl.textContent = findingText;
findingEl.classList.add("is-on");
setTimeout(function () { if (!keepUp) findingEl.classList.remove("is-on"); if (done) done(); }, Math.max(200, findingMs));
}
var ARROW_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
var CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
function flashArrowOk(cb) {
if (!searchBtn) { if (cb) cb(); return; }
searchBtn.classList.add("is-ok");
if (cb) setTimeout(cb, 430);
}
function resetArrow() {
if (!searchBtn) return;
searchBtn.classList.remove("is-ok");
}
function runSearch(q) {
if (!q) return;
if (resultsUrl) {
var go = function () { window.location.href = resultsUrl + (resultsUrl.indexOf("?") >= 0 ? "&" : "?") + "q=" + encodeURIComponent(q); };
if (findingOn) { if (searchEl) searchEl.blur(); runFinding(go, true); }
else { flashArrowOk(go); }
} else {
query = q.toLowerCase();
flashArrowOk(null); setTimeout(resetArrow, 1300);
if (findingOn) {
if (searchEl) searchEl.blur();
runFinding(function () { applyFilters(); });
} else {
applyFilters();
if (searchEl) searchEl.focus();
}
}
}
if (searchEl) {
searchEl.addEventListener("input", function () {
if (searchBtn) searchBtn.classList.toggle("has-text", !!searchEl.value.trim()); // ← empty, ↑ typing
if (resultsUrl) return; // redirect mode: don't filter here
if (findingOn) { if (!searchEl.value.trim()) { query = ""; applyFilters(); } return; }
query = searchEl.value.trim().toLowerCase();
if (query) badgeFilter = null; // typing takes over from a badge filter
applyFilters();
});
searchEl.addEventListener("keydown", function (e) {
if (e.key !== "Enter") return;
e.preventDefault();
runSearch(searchEl.value.trim());
});
}
if (searchBtn) searchBtn.addEventListener("click", function () {
runSearch(searchEl ? searchEl.value.trim() : "");
});
var searchPlus = document.getElementById("dhSearchPlus");
if (searchPlus && searchEl) searchPlus.addEventListener("click", function () { searchEl.focus(); });
var btnSearch = document.getElementById("dhBtnSearch");
if (btnSearch) btnSearch.addEventListener("click", function () {
var q = searchEl ? searchEl.value.trim() : "";
if (q) { runSearch(q); } else if (searchEl) { searchEl.focus(); }
});

if (searchEl) {
var typeRaw = (searchEl.getAttribute("data-typing") || "").trim();
var phrases = typeRaw.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (phrases.length && !reduce) {
var restPh = searchEl.getAttribute("placeholder") || "";
var pi = 0, ci = 0, deleting = false, paused = false, timer = null;
var tick = function () {
if (paused) return;
var word = phrases[pi];
if (!deleting) {
ci++;
searchEl.setAttribute("placeholder", word.slice(0, ci));
if (ci >= word.length) { deleting = true; timer = setTimeout(tick, 1600); return; }
timer = setTimeout(tick, 55);
} else {
ci--;
searchEl.setAttribute("placeholder", word.slice(0, ci));
if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; timer = setTimeout(tick, 350); return; }
timer = setTimeout(tick, 28);
}
};
var stopType = function () {
paused = true; if (timer) { clearTimeout(timer); timer = null; }
searchEl.setAttribute("placeholder", restPh);
};
var startType = function () {
if (!paused || searchEl.value) return;
paused = false; pi = 0; ci = 0; deleting = false; tick();
};
searchEl.addEventListener("focus", stopType);
searchEl.addEventListener("blur", function () { if (!searchEl.value) startType(); });
searchEl.addEventListener("input", function () { if (searchEl.value) stopType(); });
if (document.activeElement !== searchEl) tick();
}
}

var prev = document.getElementById("dhPrev");
var next = document.getElementById("dhNext");
if (tabs && tabs.classList.contains("is-images")) {
var updateArrows = function () {
var overflow = tabs.scrollWidth - tabs.clientWidth > 2;
tabs.classList.toggle("is-centered", !overflow);
var atStart = tabs.scrollLeft <= 2;
var atEnd = tabs.scrollLeft >= (tabs.scrollWidth - tabs.clientWidth - 2);
if (prev) prev.hidden = !overflow || atStart;
if (next) next.hidden = !overflow || atEnd;
};
var step = function () { return Math.max(180, tabs.clientWidth * 0.7); };
if (prev) prev.addEventListener("click", function () { tabs.scrollBy({ left: -step(), behavior: "smooth" }); });
if (next) next.addEventListener("click", function () { tabs.scrollBy({ left: step(), behavior: "smooth" }); });
tabs.addEventListener("scroll", updateArrows, { passive: true });
window.addEventListener("resize", updateArrows);
updateArrows();
}

var gPrev = document.getElementById("dhGridPrev");
var gNext = document.getElementById("dhGridNext");
function updateGridArrows() {
if (!grid) return;
var overflow = grid.scrollWidth - grid.clientWidth > 2;
var atStart = grid.scrollLeft <= 2;
var atEnd = grid.scrollLeft >= (grid.scrollWidth - grid.clientWidth - 2);
if (gPrev) gPrev.hidden = !overflow || atStart;
if (gNext) gNext.hidden = !overflow || atEnd;
}
var gStep = function () { return Math.max(220, grid.clientWidth * 0.8); };
if (gPrev) gPrev.addEventListener("click", function () { grid.scrollBy({ left: -gStep(), behavior: "smooth" }); });
if (gNext) gNext.addEventListener("click", function () { grid.scrollBy({ left: gStep(), behavior: "smooth" }); });
if (grid) {
grid.addEventListener("scroll", updateGridArrows, { passive: true });
window.addEventListener("resize", updateGridArrows);
}

if (!resultsUrl) {
try {
var urlQ = new URLSearchParams(window.location.search).get("q");
if (urlQ) { if (searchEl) searchEl.value = urlQ; query = urlQ.trim().toLowerCase(); }
} catch (e) {}
}

var activeBtn = tabs ? tabs.querySelector(".dh-tab.is-active") : null;
currentCat = activeBtn ? activeBtn.getAttribute("data-cat") : "__all";
applyFilters();

var MAP = {
black:"#1d1d1f", white:"#f5f5f7", grey:"#8e8e93", gray:"#8e8e93", silver:"#c7c7cc",
red:"#d0021b", crimson:"#b00020", maroon:"#7b1e1e", orange:"#f5820d", amber:"#ffb300",
yellow:"#f7c948", gold:"#c9a227", green:"#2b9348", olive:"#7a7a2e", teal:"#008080",
blue:"#0071e3", navy:"#1b2a4a", "sky blue":"#4aa8e0", "light blue":"#8ec6ef",
purple:"#7b2ff7", violet:"#8f00ff", pink:"#ff5c8a", "hot pink":"#ff2d78", rose:"#e75480",
brown:"#7a4b2b", tan:"#d2b48c", beige:"#e8dcc4", cream:"#f4efe1", ivory:"#fffff0",
khaki:"#c3b091", charcoal:"#36454f", "off white":"#efefe9", natural:"#e8e0d0",
burgundy:"#800020", mustard:"#d4a017", mint:"#a8e6cf", lavender:"#b57edc", coral:"#ff7f50",
turquoise:"#40e0d0", indigo:"#4b0082", magenta:"#d0208a"
};
function colorFor(name) {
var n = (name || "").trim().toLowerCase();
if (MAP[n]) return MAP[n];
var words = n.split(/[\s/]+/);
for (var i = words.length - 1; i >= 0; i--) { if (MAP[words[i]]) return MAP[words[i]]; }
var t = new Option().style; t.color = ""; t.color = n; if (t.color !== "") return n;
return "#c7c7cc";
}
cards.forEach(function (card) {
var img1 = card.querySelector(".dh-media .dh-img-1");
var baseSrc = img1 ? img1.getAttribute("src") : "";
card.querySelectorAll(".dh-swatch").forEach(function (sw) {
sw.style.background = colorFor(sw.getAttribute("data-color"));
var vimg = sw.getAttribute("data-img");
if (vimg && img1) sw.addEventListener("mouseenter", function () { img1.src = vimg; });
});
if (img1) card.addEventListener("mouseleave", function () { if (baseSrc) img1.src = baseSrc; });
});
})();
