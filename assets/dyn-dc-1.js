
(function () {
  var root = document.getElementById("dynCol");
  if (!root) return;

  // Head video: play once and stop (no loop).
  var headVid = root.querySelector(".dc-head-video");
  if (headVid) {
    headVid.loop = false; headVid.muted = true;
    var hp = headVid.play(); if (hp && hp.catch) hp.catch(function () {});
  }

  var grid = document.getElementById("dcGrid");
  var tabs = document.getElementById("dcTabs");
  var noRes = document.getElementById("dcNoResults");
  var tabsWrap = document.getElementById("dcTabsWrap");
  var shelfWrap = document.getElementById("dcShelfWrap");
  var hideUntilSearch = root.getAttribute("data-hide-until-search") === "true";
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".dc-card"));
  // Optional vertical "all products" grid below the row.
  var gridAll = document.getElementById("dcGridAll");
  var allCards = gridAll ? Array.prototype.slice.call(gridAll.querySelectorAll(".dc-card")) : [];
  var allOrig = allCards.slice(); // catalog order, restored when the search clears
  var bestHeading = root.querySelector(".dc-grid-heading:not(.dc-allgrid-heading):not(.dc-banners-heading)");
  var allHeading = root.querySelector(".dc-allgrid-heading");
  var bannersWrap = document.getElementById("dcBannersWrap");
  var bannersWrapB = document.getElementById("dcBannersWrapB");
  var bannersHeading = root.querySelector(".dc-banners-heading");
  /* Per-tab hero sliders (top + bottom wraps): the banners matching the
     active tab form a little carousel — arrows + dots when there's more
     than one. Built as a factory since both positions behave the same. */
  function makeHeroSlider(wrapId, prevId, nextId, dotsId) {
    var wrap = document.getElementById(wrapId);
    if (!wrap) return null;
    var set = [], idx = 0, lastCat = null;
    var prevB = document.getElementById(prevId);
    var nextB = document.getElementById(nextId);
    var dots = document.getElementById(dotsId);
    function show() {
      Array.prototype.forEach.call(wrap.querySelectorAll(".dc-tabhero"), function (h) {
        h.classList.toggle("is-on", set.length > 0 && h === set[idx]);
      });
      var many = set.length > 1;
      if (prevB) prevB.hidden = !many;
      if (nextB) nextB.hidden = !many;
      if (dots) {
        dots.hidden = !many;
        if (many) dots.innerHTML = set.map(function (_, i) {
          return '<span class="dc-tabhero-dot' + (i === idx ? " is-on" : "") + '"></span>';
        }).join("");
      }
      wrap.style.display = set.length ? "" : "none";
    }
    function sync(cat, noneFlag) {
      set = noneFlag ? [] : Array.prototype.filter.call(wrap.querySelectorAll(".dc-tabhero"), function (h) {
        var f = (h.getAttribute("data-for") || "").trim();
        return !f || (" " + f + " ").indexOf(" " + cat + " ") >= 0;
      });
      if (cat !== lastCat) { idx = 0; lastCat = cat; }
      if (idx >= set.length) idx = 0;
      show();
    }
    if (prevB) prevB.addEventListener("click", function () {
      if (set.length < 2) return;
      idx = (idx - 1 + set.length) % set.length; show();
    });
    if (nextB) nextB.addEventListener("click", function () {
      if (set.length < 2) return;
      idx = (idx + 1) % set.length; show();
    });
    return { sync: sync };
  }
  var heroTop = makeHeroSlider("dcTabHeros", "dcHeroPrev", "dcHeroNext", "dcHeroDots");
  var heroBottom = makeHeroSlider("dcTabHerosB", "dcHeroPrevB", "dcHeroNextB", "dcHeroDotsB");
  var scrollbarEl = document.getElementById("dcScrollbar");
  // Top row can be limited to best sellers — but only if some exist (else show all).
  var wantBestTop = root.getAttribute("data-top-best") === "true";
  var hasBest = cards.some(function (c) { return (" " + (c.getAttribute("data-flags") || "") + " ").indexOf(" best ") >= 0; });
  var shelfBestOnly = wantBestTop && hasBest;

  // How many cards are visible at once (for a per-row left->right sweep).
  function colCount() {
    var first = grid.querySelector(".dc-card");
    if (!first) return 1;
    var cw = first.getBoundingClientRect().width + 22; // card + gap
    var n = Math.round(grid.clientWidth / cw);
    return Math.max(1, n || 1);
  }

  // Reveal the given cards with a left-to-right, row-by-row cascade.
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

  // Typo-tolerant matching (Levenshtein edit distance) so small misspellings still match.
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
  /* ===================== SMART SEARCH ENGINE =====================
     Understands typos (Levenshtein above), synonyms, plurals/stems,
     filler words, who-it's-for + occasion words, and price intent —
     and scores every match so results can be ranked best-first. */
  var SMART = (function () { try { return JSON.parse(document.getElementById("dcSmartCfg").textContent) || {}; } catch (e) { return {}; } })();
  var STOPSET = {};
  ("a an the some any of for to from with without and or but my mine your yours our his her their its i me we you he she they them us is are am was were be been being do does did will would can could should that this these those it as at on in into by please want wants need needs looking look find get buy buying something anything gift gifts idea ideas present presents give giving good great nice best perfect really who whom whose what which where when why how have has like about around just").split(/\s+/).forEach(function (w) { STOPSET[w] = 1; });
  var WHO = { dad: "men", father: "men", husband: "men", him: "men", man: "men", boyfriend: "men", brother: "men", grandpa: "men", grandfather: "men", uncle: "men", guy: "men", guys: "men",
    mom: "women", mum: "women", mother: "women", wife: "women", her: "women", woman: "women", girlfriend: "women", sister: "women", grandma: "women", grandmother: "women", aunt: "women", lady: "women",
    kid: "kids", child: "kids", children: "kids", son: "kids", daughter: "kids", boy: "kids", girl: "kids", baby: "kids", toddler: "kids", teen: "kids" };
  var OCC = { bday: "birthday", xmas: "christmas", valentines: "valentine", "father's": "men", "mother's": "women" };
  // Synonyms: sensible defaults + the merchant's own pairs from the settings
  // ("cup=mug", one per line or comma-separated). Both directions are applied.
  var SYN = {}, RELAX3 = false;
  function addSyn(a, b) { if (!a || !b || a === b) return; (SYN[a] = SYN[a] || []).indexOf(b) < 0 && SYN[a].push(b); }
  "cup=mug,tee=t-shirt,tshirt=t-shirt,shirt=t-shirt,top=t-shirt,journal=notebook,diary=notebook,notepad=notebook,planner=notebook,jumper=hoodie,sweater=hoodie,sweatshirt=hoodie,cap=hat,beanie=hat,tumbler=mug,bottle=tumbler,tote=bag,poster=print,artwork=print,photo=picture,book=notebook".split(",").forEach(function (p) {
    var kv = p.split("="); addSyn(kv[0], kv[1]); addSyn(kv[1], kv[0]);
  });
  String(SMART.synonyms || "").toLowerCase().split(/[\n,]+/).forEach(function (p) {
    var kv = p.split("="); if (kv.length === 2) { addSyn(kv[0].trim(), kv[1].trim()); addSyn(kv[1].trim(), kv[0].trim()); }
  });
  // Who-it's-for and occasion words EXPAND rather than replace: "mom" matches
  // products tagged mom directly, and products tagged women as a synonym.
  Object.keys(WHO).forEach(function (k) { addSyn(k, WHO[k]); });
  Object.keys(OCC).forEach(function (k) { addSyn(k, OCC[k]); });
  function stem(w) {
    if (w.length > 4) { w = w.replace(/ies$/, "y").replace(/(ing|ed)$/, ""); }
    if (w.length > 3) { w = w.replace(/e?s$/, ""); }
    return w;
  }
  // Turn the raw query into search tokens + a price cap ("under $25", "cheap").
  function smartTokens(raw) {
    raw = " " + String(raw || "").toLowerCase().trim() + " ";
    var maxPrice = null;
    raw = raw.replace(/(?:under|below|less than|max|up to)\s*\$?\s*(\d+)/g, function (_, n) { maxPrice = n * 100; return " "; });
    raw = raw.replace(/\$\s*(\d+)/g, function (_, n) { maxPrice = n * 100; return " "; });
    if (/\b(cheap|cheapest|affordable|budget)\b/.test(raw)) { maxPrice = SMART.cheap || 2500; raw = raw.replace(/\b(cheap|cheapest|affordable|budget)\b/g, " "); }
    var out = [];
    raw.split(/[^a-z0-9'&+-]+/).forEach(function (t) {
      if (!t || STOPSET[t]) return;
      if (out.indexOf(t) < 0) out.push(t);
    });
    return { tokens: out, maxPrice: maxPrice };
  }
  function variantsOf(t) {
    var v = [t], s = stem(t);
    if (s !== t) v.push(s);
    (SYN[t] || []).forEach(function (x) { if (v.indexOf(x) < 0) { v.push(x); var xs = stem(x); if (xs !== x && v.indexOf(xs) < 0) v.push(xs); } });
    return v;
  }
  // Best score for one token against a card's words (0 = no hit).
  function tokenScore(tok, words, titleText) {
    var vars = variantsOf(tok), best = 0;
    for (var vi = 0; vi < vars.length; vi++) {
      var q = vars[vi];
      /* typo tolerance: none for 3-letter words, one edit up to 7 letters,
         two beyond - distance 2 on short words let wallet match walnut,
         valet and tablet; synonyms must still match cleanly */
      var tol = q.length <= 3 ? 0 : (q.length <= 7 ? 1 : 2);
      for (var k = 0; k < words.length; k++) {
        var w = words[k]; if (!w) continue;
        var s = 0;
        if (w === q) s = 6;
        else if (stem(w) === stem(q)) s = 4;
        /* prefix/inside-word hits need 4+ letters: 'pen' was lighting up
           pendants and everything containing those three letters */
        else if ((q.length >= 4 || RELAX3) && w.indexOf(q) === 0) s = 4;
        /* no inside-word matches: 'friend' must not hit 'girlfriend' -
           real compound aliases (book=notebook) live in the synonym list */
        else if (q.length >= 4 && tol && vi === 0) {
          if (lev(q, w) <= tol) s = 2;
          else if (w.length > q.length && lev(q, w.slice(0, q.length)) <= tol) s = 2;
        }
        if (s) {
          if (vi > 0) s -= 1;                                   // synonym hit ranks a touch lower
          if (titleText && titleText.indexOf(w) >= 0) s += 3;   // title hits outrank tag hits
          if (s > best) best = s;
        }
      }
    }
    return best;
  }
  // Whole-card score. All tokens must hit (long queries may miss one).
  function scoreCard(sq, c) {
    var toks = sq.tokens;
    if (!toks.length) return 1;
    var words = (c.getAttribute("data-search") || "").split(/\s+/);
    var tEl = c.querySelector(".dc-title");
    var titleText = tEl ? tEl.textContent.toLowerCase() : "";
    var total = 0, misses = 0, allowed = toks.length >= 3 ? 1 : 0;
    for (var i = 0; i < toks.length; i++) {
      var s = tokenScore(toks[i], words, titleText);
      if (!s) { if (++misses > allowed) return 0; }
      else total += s;
    }
    return total;
  }
  function priceOk(sq, c) {
    if (!sq || !sq.maxPrice) return true;
    var p = parseInt(c.getAttribute("data-price"), 10);
    return isNaN(p) ? true : p <= sq.maxPrice;
  }
  function queryMatch(query, text) { // kept for callers that just need yes/no
    if (!query) return true;
    var sq = smartTokens(query), fake = { getAttribute: function (k) { return k === "data-search" ? text : ""; }, querySelector: function () { return null; } };
    return scoreCard(sq, fake) > 0;
  }
  /* =================== END SMART SEARCH ENGINE =================== */

  /* ---- Smart-search UX: "did you mean" + zero-result logging ---- */
  // Vocabulary for "Did you mean…?" — every word the catalog actually contains.
  var VOCAB = (function () {
    var m = {};
    allCards.concat(cards).forEach(function (c) {
      (c.getAttribute("data-search") || "").split(/\s+/).forEach(function (w) {
        if (w.length >= 3) m[w] = (m[w] || 0) + 1;
      });
    });
    return m;
  })();
  function bestCorrection(raw) {
    var toks = String(raw || "").toLowerCase().split(/[^a-z0-9'&+-]+/).filter(function (t) { return t && !STOPSET[t]; });
    var fix = null, fixFrom = "";
    toks.forEach(function (t) {
      if (fix || VOCAB[t]) return;                 // token already exists — nothing to correct
      var best = null, bd = 9, w, d;
      for (w in VOCAB) {
        d = lev(t, w);
        if (d < bd || (d === bd && best && VOCAB[w] > VOCAB[best])) { bd = d; best = w; }
      }
      if (best && bd <= (t.length <= 4 ? 1 : 2)) { fix = best; fixFrom = t; }
    });
    return fix ? String(raw).toLowerCase().replace(fixFrom, fix) : null;
  }
  function updateDym(show) {
    var box = document.getElementById("dcDym"), btn = document.getElementById("dcDymBtn");
    if (!box || !btn) return;
    var sug = show ? bestCorrection(query) : null;
    if (!sug || sug === query) { box.hidden = true; return; }
    btn.textContent = sug;
    box.hidden = false;
  }
  function setQuery(q) {
    query = String(q || "").toLowerCase().trim();
    var si = document.getElementById("dcInlineInput"); if (si) si.value = q;
    if (typeof searchEl !== "undefined" && searchEl) searchEl.value = q;
    badgeFilter = null;
    applyFilters();
    if (query && !_lastNone) jumpToProducts();
  }
  document.addEventListener("click", function (e) {
    var dym = e.target.closest("#dcDymBtn");
    if (dym) setQuery(dym.textContent);
  });
  // Log searches that found nothing (browser list + optional Firebase counter),
  // so the merchant can see what shoppers wanted and add tags/products.
  var missT = 0, lastLogged = "";
  function scheduleMissLog(q) {
    clearTimeout(missT);
    missT = setTimeout(function () {
      q = String(q || "").trim(); if (q.length < 3 || q === lastLogged) return;
      lastLogged = q;
      try {
        var l = JSON.parse(localStorage.getItem("dyn_search_misses") || "[]");
        l.unshift({ q: q, t: Date.now() }); localStorage.setItem("dyn_search_misses", JSON.stringify(l.slice(0, 50)));
      } catch (e) {}
      var fb = String(SMART.fb || "").replace(/\/+$/, "");
      if (fb) {
        var key = q.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "blank";
        try { fetch(fb + "/search_misses/" + key + ".json", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ".sv": { "increment": 1 } }) }).catch(function () {}); } catch (e) {}
      }
    }, 1200);
  }
  /* -------------------- end smart-search UX -------------------- */

  // Combined filter: current category tab AND the live search query.
  var currentCat = "__all";
  var query = "";
  var _lastNone = false; // did the last filter pass come up empty?
  var badgeFilter = null; // 'new' | 'best' | 'sale' — clicking a badge filters to it
  var badgeLabels = { "new": "New", "best": "Best sellers", "sale": "On sale" };
  var badgeChip = null, badgeChipTxt = null;
  function applyFilters() {
    // Landing mode: shrink + raise the logo/search once the shopper searches.
    if (hideUntilSearch) root.classList.toggle("dc-searching", query.length > 0);
    // Home-page mode: keep the tabs + grid hidden until the shopper searches.
    if (hideUntilSearch && query.length === 0) {
      if (tabsWrap) tabsWrap.style.display = "none";
      if (shelfWrap) shelfWrap.style.display = "none";
      if (noRes) noRes.style.display = "none";
      return;
    }
    if (tabsWrap) tabsWrap.style.display = "";
    if (shelfWrap) shelfWrap.style.display = "";

    // When the shopper is searching, look across ALL categories (ignore the tab).
    // With no search text, just show the active tab's category.
    var searching = query.length > 0;
    var sq = searching ? smartTokens(query) : null;
    function qScore(c) {
      if (!sq) return 1;
      var s = scoreCard(sq, c);
      return (s > 0 && priceOk(sq, c)) ? s : 0;
    }
    if (tabs) tabs.querySelectorAll(".dc-tab").forEach(function (b) {
      b.classList.toggle("is-active", searching ? b.getAttribute("data-cat") === "__all" : b.getAttribute("data-cat") === currentCat);
    });
    function baseMatch(c) {
      var cc = " " + (c.getAttribute("data-cat") || "") + " ";
      var okCat = currentCat === "__all" || cc.indexOf(" " + currentCat + " ") >= 0;
      var score = qScore(c); c._score = score;
      var okQ = score > 0;
      if (badgeFilter) {
        var fl = " " + (c.getAttribute("data-flags") || "") + " ";
        return fl.indexOf(" " + badgeFilter + " ") >= 0 && okQ;
      }
      return searching ? okQ : okCat;
    }
    // Top best-seller row: stays fixed across category tabs (ignores the
    // category), only responding to search text / badge filters.
    function shelfMatch(c) {
      var score = qScore(c); c._score = score;
      var okQ = score > 0;
      if (badgeFilter) {
        var fl = " " + (c.getAttribute("data-flags") || "") + " ";
        return fl.indexOf(" " + badgeFilter + " ") >= 0 && okQ;
      }
      return okQ;
    }
    var visible = [], visibleAll = [];
    function paintCards() {
      visible = []; visibleAll = [];
      cards.forEach(function (c) {
        var m = shelfMatch(c);
        if (m && shelfBestOnly) {
          var fl = " " + (c.getAttribute("data-flags") || "") + " ";
          if (fl.indexOf(" best ") < 0) m = false;
        }
        c.style.display = m ? "" : "none";
        if (m) visible.push(c);
      });
      // Vertical grid below: every matched card.
      allCards.forEach(function (c) {
        var m = baseMatch(c);
        c.style.display = m ? "" : "none";
        if (m) visibleAll.push(c);
      });
    }
    paintCards();
    /* short tokens match whole words only, which would strand mid-word typing
       (rin -> ring) at zero results: retry once allowing prefix matches */
    if (searching && visible.length + visibleAll.length === 0 && sq && sq.tokens &&
        sq.tokens.some(function (tk) { return tk.length <= 3; })) {
      RELAX3 = true; paintCards(); RELAX3 = false;
    }
    // Google-like ranking: while searching, reorder the grid best-match-first;
    // when the search clears, restore the catalog order.
    var ranked = visibleAll.slice().sort(function (a, b) { return (b._score || 0) - (a._score || 0); });
    if (gridAll) (searching ? ranked : allOrig).forEach(function (c) { gridAll.appendChild(c); });
    // While a category/search is active, make the product grid at least a screen
    // tall so it can scroll up to the top (banners tuck away above; scroll up to see them).
    root.classList.toggle("dc-cat-focused", searching || (currentCat && currentCat !== "__all") || !!badgeFilter);
    // The grid below filters to the chosen category / search, but the best-seller
    // row and promo banners STAY on the page — scroll up and they're still there.
    var showShelf = visible.length > 0;
    if (shelfWrap) shelfWrap.style.display = showShelf ? "" : "none";
    if (bestHeading) bestHeading.style.display = showShelf ? "" : "none";
    if (scrollbarEl) scrollbarEl.style.display = showShelf ? "" : "none";
    // No matches at all: clear the page below the category bar and show the
    // message right under it (instead of buried below the banners).
    var none = (visible.length + visibleAll.length) === 0;
    _lastNone = none;
    // Per-tab banners: each tile declares where it lives (data-for) — empty
    // means everywhere, "__all" the All tab, otherwise category handles.
    // Both the top and the bottom tile groups follow the same rule.
    var anyBannerTop = false;
    [bannersWrap, bannersWrapB].forEach(function (wrap) {
      if (!wrap) return;
      var anyB = false;
      Array.prototype.forEach.call(wrap.querySelectorAll(".dc-banner"), function (bn) {
        var f = (bn.getAttribute("data-for") || "").trim();
        var show = !f || (" " + f + " ").indexOf(" " + currentCat + " ") >= 0;
        bn.style.display = show ? "" : "none";
        if (show) anyB = true;
      });
      wrap.style.display = (none || !anyB) ? "none" : "";
      if (wrap === bannersWrap) anyBannerTop = anyB;
    });
    if (bannersHeading) bannersHeading.style.display = (none || !anyBannerTop) ? "none" : "";
    // Per-tab hero sliders follow the active tab (reset to its first slide).
    if (heroTop) heroTop.sync(currentCat, none);
    if (heroBottom) heroBottom.sync(currentCat, none);
    if (allHeading) allHeading.style.display = none ? "none" : "";
    if (badgeChip) {
      if (badgeFilter) { badgeChip.hidden = false; if (badgeChipTxt) badgeChipTxt.textContent = badgeLabels[badgeFilter] || badgeFilter; }
      else { badgeChip.hidden = true; }
    }
    if (noRes) {
      noRes.style.display = none ? "flex" : "none";
      if (none && tabsWrap && tabsWrap.parentNode && tabsWrap.nextElementSibling !== noRes) {
        tabsWrap.insertAdjacentElement("afterend", noRes);
      }
    }
    updateDym(searching && none);
    if (searching && none) scheduleMissLog(query);
    grid.scrollLeft = 0;
    reveal(visible);
    updateGridArrows();
  }

  if (tabs) tabs.addEventListener("click", function (e) {
    var btn = e.target.closest(".dc-tab"); if (!btn) return;
    tabs.querySelectorAll(".dc-tab").forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
    btn.classList.add("is-active"); btn.setAttribute("aria-selected", "true");
    try { btn.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); } catch (x) {}
    // Clicking a tab clears the search and just opens that category.
    if (searchEl) searchEl.value = "";
    query = "";
    badgeFilter = null;
    currentCat = btn.getAttribute("data-cat"); applyFilters();
    // At the top of the page the view stays put; once the visitor has
    // scrolled down (sticky bar), picking a category jumps straight to
    // the products so the choice is visible immediately.
    if (root.classList.contains("dc-scrolled") && !btn.classList.contains("dc-search-trigger")) jumpToProducts();
  });

  // Scroll the product grid up under the sticky bar (used by tabs AND search,
  // so results are visible immediately instead of sitting below the banners).
  function jumpToProducts() {
    root.classList.add("dc-cat-focused"); // keep the grid tall enough to reach the top
    var target = allHeading || gridAll || shelfWrap;
    if (!target) return;
    var barH = tabsWrap ? tabsWrap.offsetHeight : 0;
    var y = target.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0) - barH - 14;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" }); // premium: glide, don't jump
  }
  // Enter decides where to land: matching products — or, when nothing matched,
  // the "no results" message (so it's never stranded out of view at the top).
  function jumpAfterEnter() {
    if (!query.length) return;
    if (_lastNone) {
      if (!noRes) return;
      var barH = tabsWrap ? tabsWrap.offsetHeight : 0;
      var y = noRes.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0) - barH - 14;
      window.scrollTo({ top: Math.max(0, y), behavior: "auto" });
    } else jumpToProducts();
  }

  // A small chip appears while a badge filter is active, so the shopper can clear it.
  (function () {
    var anchor = shelfWrap || tabsWrap || grid;
    if (!anchor || !anchor.parentNode) return;
    badgeChip = document.createElement("div");
    badgeChip.className = "dc-badge-chip"; badgeChip.hidden = true;
    badgeChip.innerHTML = '<span class="dc-badge-chip-txt"></span><button type="button" class="dc-badge-chip-x" aria-label="Clear filter">&#10005;</button>';
    anchor.parentNode.insertBefore(badgeChip, anchor);
    badgeChipTxt = badgeChip.querySelector(".dc-badge-chip-txt");
    badgeChip.querySelector(".dc-badge-chip-x").addEventListener("click", function () { badgeFilter = null; applyFilters(); });
  })();

  // Clicking a badge on a card filters the grid to that badge instead of opening the product.
  if (grid) grid.addEventListener("click", function (e) {
    var badge = e.target.closest ? e.target.closest(".dc-badge") : null;
    if (!badge) return;
    var flag = badge.classList.contains("dc-badge-new") ? "new"
             : badge.classList.contains("dc-badge-best") ? "best"
             : badge.classList.contains("dc-badge-sale") ? "sale" : null;
    if (!flag) return;
    e.preventDefault(); e.stopPropagation();
    badgeFilter = (badgeFilter === flag) ? null : flag;
    if (searchEl) searchEl.value = "";
    query = ""; currentCat = "__all";
    applyFilters();
  }, true);

  // Live search. Normally filters the on-page grid as the shopper types. If a
  // "results page" URL is set, Enter/submit opens that page with the query.
  var searchEl = document.getElementById("dcSearch");
  var resultsUrl = (root.getAttribute("data-results-url") || "").trim();
  if (searchEl) {
    searchEl.addEventListener("input", function () {
      if (resultsUrl) return; // redirect mode: don't filter here
      query = searchEl.value.trim().toLowerCase();
      if (query) badgeFilter = null; // typing takes over from a badge filter
      applyFilters();
    });
    if (!resultsUrl) searchEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); jumpAfterEnter(); }
    });
    if (resultsUrl) searchEl.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      var q = searchEl.value.trim(); if (!q) return;
      window.location.href = resultsUrl + (resultsUrl.indexOf("?") >= 0 ? "&" : "?") + "q=" + encodeURIComponent(q);
    });
  }
  var searchBtn = document.getElementById("dcSearchGo");
  // Swap the arrow (← empty, ↑ typing) as the shopper types.
  if (searchEl && searchBtn) searchEl.addEventListener("input", function () {
    searchBtn.classList.toggle("has-text", !!searchEl.value.trim());
  });
  function flashOk() { if (!searchBtn) return; searchBtn.classList.add("is-ok"); setTimeout(function () { searchBtn.classList.remove("is-ok"); }, 900); }
  if (searchBtn) searchBtn.addEventListener("click", function () {
    var q = searchEl ? searchEl.value.trim() : "";
    if (resultsUrl) { if (q) window.location.href = resultsUrl + (resultsUrl.indexOf("?") >= 0 ? "&" : "?") + "q=" + encodeURIComponent(q); }
    else { query = q.toLowerCase(); applyFilters(); flashOk(); if (searchEl) searchEl.focus({ preventScroll: true }); }
  });
  // Magnifier tab (next to All) opens the search bar below the categories; closes when clicked away empty.
  var searchTrigger = document.getElementById("dcSearchTrigger");
  var searchBar = document.getElementById("dcSearchBar");
  var searchBelow = document.getElementById("dcSearchBelow");
  var inlineWrap = document.getElementById("dcInlineSearch");
  var inlineInput = document.getElementById("dcInlineInput");
  // Pin the search drawer directly under the sticky category bar (whatever its height).
  function syncBelowTop() { if (searchBelow && tabsWrap) searchBelow.style.top = tabsWrap.offsetHeight + "px"; }
  syncBelowTop();
  window.addEventListener("resize", syncBelowTop);
  function openSearch() { syncBelowTop(); if (searchBelow) searchBelow.classList.add("dc-below-open"); if (searchBar) searchBar.classList.add("is-open"); if (searchTrigger) searchTrigger.setAttribute("aria-expanded", "true"); if (tabs) tabs.classList.add("dc-searching"); if (searchEl) searchEl.focus({ preventScroll: true }); }
  function closeSearch() { if (searchBar && searchEl && !searchEl.value.trim()) { searchBar.classList.remove("is-open"); if (searchBelow) searchBelow.classList.remove("dc-below-open"); if (searchTrigger) searchTrigger.setAttribute("aria-expanded", "false"); if (tabs) tabs.classList.remove("dc-searching"); } }
  // Left inline search (used when the page is scrolled): opens from the sticky bar.
  function openInline() { if (!inlineWrap) return; inlineWrap.classList.add("is-open"); if (searchTrigger) searchTrigger.setAttribute("aria-expanded", "true"); if (inlineInput) inlineInput.focus({ preventScroll: true }); }
  function closeInline() { if (inlineWrap && inlineInput && !inlineInput.value.trim()) { inlineWrap.classList.remove("is-open"); if (searchTrigger) searchTrigger.setAttribute("aria-expanded", "false"); } }
  if (searchTrigger) searchTrigger.addEventListener("click", function (e) {
    e.stopPropagation();  // don't let the category-tab handler treat this as a category
    // Same search everywhere: the compact glass pill in the bar — scrolled or not.
    if (inlineWrap) {
      if (inlineWrap.classList.contains("is-open")) { if (inlineInput) inlineInput.focus({ preventScroll: true }); }
      else openInline();
      return;
    }
    // Fallback (no inline pill rendered): drop the search bar in below the categories.
    if (searchBar && searchBar.classList.contains("is-open")) { if (searchEl) searchEl.focus({ preventScroll: true }); } else { openSearch(); }
  });
  if (searchEl) searchEl.addEventListener("blur", function () { setTimeout(closeSearch, 140); });
  if (inlineInput) inlineInput.addEventListener("blur", function () { setTimeout(closeInline, 160); });
  if (inlineInput) inlineInput.addEventListener("input", function () {
    if (resultsUrl) return;
    query = inlineInput.value.trim().toLowerCase();
    if (query) badgeFilter = null;
    if (searchEl) searchEl.value = inlineInput.value; // keep both boxes in sync
    applyFilters();
  });
  if (inlineInput) inlineInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !resultsUrl) { e.preventDefault(); jumpAfterEnter(); }
  });
  if (inlineInput && resultsUrl) inlineInput.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return; e.preventDefault();
    var q = inlineInput.value.trim(); if (!q) return;
    window.location.href = resultsUrl + (resultsUrl.indexOf("?") >= 0 ? "&" : "?") + "q=" + encodeURIComponent(q);
  });

  // Slide the logo into the sticky category bar once the page is scrolled.
  (function () {
    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        root.classList.toggle("dc-scrolled", (window.pageYOffset || document.documentElement.scrollTop || 0) > 60);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  })();

  // Esc closes the search bar (and clears the filter).
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (inlineWrap && inlineWrap.classList.contains("is-open")) {
      if (inlineInput) inlineInput.value = "";
      if (searchEl) searchEl.value = "";
      query = ""; badgeFilter = null; applyFilters();
      inlineWrap.classList.remove("is-open");
      if (searchTrigger) searchTrigger.setAttribute("aria-expanded", "false");
    }
    if (searchBar && searchBar.classList.contains("is-open")) {
      if (searchEl) { searchEl.value = ""; query = ""; badgeFilter = null; applyFilters(); }
      searchBar.classList.remove("is-open");
      if (searchBelow) searchBelow.classList.remove("dc-below-open");
      if (searchTrigger) searchTrigger.setAttribute("aria-expanded", "false");
      if (tabs) tabs.classList.remove("dc-searching");
    }
  });

  // Typing effect: cycle example phrases through the placeholder like a typewriter.
  // Pauses while the shopper is focused or has typed something; resumes when empty.
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

  // Scroll arrows: appear only when the image-tab row overflows; hide at ends.
  var prev = document.getElementById("dcPrev");
  var next = document.getElementById("dcNext");
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

  // Product shelf arrows: scroll the grid horizontally; hide at ends / when it fits.
  var gPrev = document.getElementById("dcGridPrev");
  var gNext = document.getElementById("dcGridNext");
  function updateGridArrows() {
    var overflow = grid.scrollWidth - grid.clientWidth > 2;
    var atStart = grid.scrollLeft <= 2;
    var atEnd = grid.scrollLeft >= (grid.scrollWidth - grid.clientWidth - 2);
    if (gPrev) gPrev.hidden = !overflow || atStart;
    if (gNext) gNext.hidden = !overflow || atEnd;
  }
  var gStep = function () { return Math.max(220, grid.clientWidth * 0.8); };
  if (gPrev) gPrev.addEventListener("click", function () { grid.scrollBy({ left: -gStep(), behavior: "smooth" }); });
  if (gNext) gNext.addEventListener("click", function () { grid.scrollBy({ left: gStep(), behavior: "smooth" }); });
  grid.addEventListener("scroll", updateGridArrows, { passive: true });
  window.addEventListener("resize", updateGridArrows);

  // Promo banners: left/right scroll arrows (same behaviour as the product row).
  var banners = document.getElementById("dcBanners");
  var bPrev = document.getElementById("dcBanPrev");
  var bNext = document.getElementById("dcBanNext");
  if (banners) {
    function updateBanArrows() {
      var overflow = banners.scrollWidth - banners.clientWidth > 2;
      var atStart = banners.scrollLeft <= 2;
      var atEnd = banners.scrollLeft >= (banners.scrollWidth - banners.clientWidth - 2);
      if (bPrev) bPrev.hidden = !overflow || atStart;
      if (bNext) bNext.hidden = !overflow || atEnd;
    }
    var bStep = function () { return Math.max(240, banners.clientWidth * 0.8); };
    if (bPrev) bPrev.addEventListener("click", function () { banners.scrollBy({ left: -bStep(), behavior: "smooth" }); });
    if (bNext) bNext.addEventListener("click", function () { banners.scrollBy({ left: bStep(), behavior: "smooth" }); });
    banners.addEventListener("scroll", updateBanArrows, { passive: true });
    window.addEventListener("resize", updateBanArrows);
    updateBanArrows();
    setTimeout(updateBanArrows, 120);
  }

  // Scroll progress bar under the row (reflects position; draggable).
  var scrollbar = document.getElementById("dcScrollbar");
  var scrollThumb = document.getElementById("dcScrollThumb");
  if (scrollbar && scrollThumb) {
    function updateScrollbar() {
      var sw = grid.scrollWidth, cw = grid.clientWidth, maxScroll = sw - cw;
      if (maxScroll <= 2) { scrollbar.style.display = "none"; return; }
      scrollbar.style.display = "";
      // Proportional to the viewport, but clamped so the darker pill always
      // reads as a distinct segment (never nearly the whole track).
      var pct = cw / sw * 100;
      pct = Math.max(14, Math.min(pct, 52));
      scrollThumb.style.width = pct + "%";
      scrollThumb.style.left = (grid.scrollLeft / maxScroll) * (100 - pct) + "%";
    }
    grid.addEventListener("scroll", updateScrollbar, { passive: true });
    window.addEventListener("resize", updateScrollbar);
    updateScrollbar();
    // Re-measure after layout/filter settles (cards start hidden then reveal).
    requestAnimationFrame(updateScrollbar);
    setTimeout(updateScrollbar, 120);
    var dragging = false, startX = 0, startLeft = 0;
    scrollThumb.addEventListener("pointerdown", function (e) {
      dragging = true; startX = e.clientX; startLeft = grid.scrollLeft;
      if (scrollThumb.setPointerCapture) { try { scrollThumb.setPointerCapture(e.pointerId); } catch (er) {} }
      e.preventDefault();
    });
    scrollThumb.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var maxScroll = grid.scrollWidth - grid.clientWidth;
      var travel = scrollbar.clientWidth - scrollThumb.clientWidth;
      if (travel > 0) grid.scrollLeft = startLeft + ((e.clientX - startX) / travel) * maxScroll;
    });
    scrollThumb.addEventListener("pointerup", function () { dragging = false; });
    scrollThumb.addEventListener("pointercancel", function () { dragging = false; });
  }

  // If this page was opened with a ?q= query (e.g. from the home search),
  // prefill the box and filter to those results — unless this page itself
  // redirects elsewhere.
  if (!resultsUrl) {
    try {
      var urlQ = new URLSearchParams(window.location.search).get("q");
      if (urlQ) { if (searchEl) searchEl.value = urlQ; query = urlQ.trim().toLowerCase(); }
    } catch (e) {}
  }

  // Initial load: reveal the active tab's products (works whether or not the All tab exists).
  var activeBtn = tabs ? tabs.querySelector(".dc-tab.is-active") : null;
  currentCat = activeBtn ? activeBtn.getAttribute("data-cat") : "__all";
  // Deep link: /collections/shop?cat=<handle> opens straight on that tab
  // (used by emails and anywhere else that links a category).
  try {
    var dlCat = new URLSearchParams(location.search).get("cat");
    if (dlCat && tabs) {
      var dlBtn = tabs.querySelector('.dc-tab[data-cat="' + dlCat.replace(/"/g, "") + '"]');
      if (dlBtn) {
        tabs.querySelectorAll(".dc-tab").forEach(function (b) { b.classList.toggle("is-active", b === dlBtn); });
        currentCat = dlCat;
      }
    }
  } catch (e) {}
  applyFilters();
  // Arrived from the hero with ?q= (their Enter) — land on the results/message
  // immediately, so the top of the shop page never flashes into view first.
  if (query) {
    try { history.scrollRestoration = "manual"; } catch (e) {}
    jumpAfterEnter();
    // Images finishing to load above can shift the layout — re-align once,
    // unless the shopper has already scrolled somewhere on their own.
    var _qY = window.pageYOffset || 0;
    window.addEventListener("load", function () {
      if (Math.abs((window.pageYOffset || 0) - _qY) < 4) jumpAfterEnter();
    });
  }

  // Colour swatches: paint the dots from a name->colour map; hovering a dot
  // swaps the card image to that colour's variant photo.
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
    var img1 = card.querySelector(".dc-media .dc-img-1");
    var baseSrc = img1 ? img1.getAttribute("src") : "";
    card.querySelectorAll(".dc-swatch").forEach(function (sw) {
      sw.style.background = colorFor(sw.getAttribute("data-color"));
      var vimg = sw.getAttribute("data-img");
      if (vimg && img1) sw.addEventListener("mouseenter", function () { img1.src = vimg; });
    });
    if (img1) card.addEventListener("mouseleave", function () { if (baseSrc) img1.src = baseSrc; });
  });
})();
