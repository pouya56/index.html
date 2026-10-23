
(function () {
var hero = document.getElementById("dynHero");
if (!hero) return;
var defs = [
["head", ".dh-head"],
["search", ".dh-search"],
["btn1", "#dhBtnSearch"],
["btn2", ".dh-hero-btns > a.dh-gbtn"],
["btn3", ".dh-goo-wrap"]
];
var els = {};
defs.forEach(function (d) {
var el = hero.querySelector(d[1]);
if (el) { els[d[0]] = el; el.classList.add("dh-dragobj"); }
});
if (!Object.keys(els).length) return;
var pos = {};
function apply(k) {
var el = els[k], p = pos[k] || [0, 0];
el.style.setProperty("--ddx", p[0] + "px");
el.style.setProperty("--ddy", p[1] + "px");
}
var resetBtn = document.createElement("button");
resetBtn.type = "button";
resetBtn.className = "dh-reset-btn";
resetBtn.setAttribute("aria-label", "Put everything back");
resetBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 2.8-6.5"/><polyline points="3 4.5 3 9.5 8 9.5"/></svg>';
hero.appendChild(resetBtn);
var extMoved = false;
hero.addEventListener("dh:ext-moved", function (e) {
extMoved = !!(e.detail && e.detail.moved);
updateReset();
});
function updateReset() {
resetBtn.classList.toggle("is-on", Object.keys(pos).length > 0 || extMoved);
}
function clamp(k) {
var el = els[k], p = pos[k];
if (!p) return;
var rc = el.getBoundingClientRect();
var bx = rc.left - p[0], by = rc.top - p[1];
var pad = 6;
p[0] = Math.min(Math.max(p[0], pad - bx), Math.max(pad - bx, innerWidth - pad - rc.width - bx));
p[1] = Math.min(Math.max(p[1], pad - by), Math.max(pad - by, innerHeight - pad - rc.height - by));
apply(k);
}
var rT;
window.addEventListener("resize", function () {
clearTimeout(rT);
rT = setTimeout(function () { Object.keys(els).forEach(clamp); }, 150);
});

var drag = null, squelch = 0;
document.addEventListener("click", function (e) {
if (Date.now() < squelch) { e.preventDefault(); e.stopPropagation(); }
}, true);
function lift() {
var rc = drag.el.getBoundingClientRect();
drag.bw = rc.width; drag.bh = rc.height;
drag.bx = rc.left - drag.ox; drag.by = rc.top - drag.oy;
drag.moved = true;
drag.el.classList.add("is-drag");
drag.el.style.setProperty("--dds", "1.04");
document.documentElement.classList.add("dh-grabbing");
if (document.activeElement && drag.el.contains(document.activeElement)) document.activeElement.blur();
if (window.getSelection) { try { getSelection().removeAllRanges(); } catch (err) {} }
if (navigator.vibrate) { try { navigator.vibrate(10); } catch (err) {} }
}
Object.keys(els).forEach(function (k) {
var el = els[k];
el.addEventListener("dragstart", function (e) { e.preventDefault(); });
el.addEventListener("contextmenu", function (e) {
if (drag && drag.el === el && drag.touch) e.preventDefault();
});
el.addEventListener("pointerdown", function (e) {
if (e.button != null && e.button !== 0) return;
if (e.pointerType === "touch") return;
if (drag || window.__dhDrag) return;
if (k === "search" && document.activeElement && el.contains(document.activeElement)) return;
window.__dhDrag = true;
var p = pos[k] || [0, 0];
drag = { k: k, el: el, sx: e.clientX, sy: e.clientY, ox: p[0], oy: p[1],
moved: false, touch: e.pointerType === "touch", timer: 0 };
if (drag.touch) drag.timer = setTimeout(function () { if (drag && drag.el === el && !drag.moved) lift(); }, 300);
});
el.addEventListener("touchmove", function (e) {
if (!drag || drag.el !== el || !e.cancelable) return;
if (drag.moved) { e.preventDefault(); return; }      var t = e.touches[0];
if (!t) return;
var dx = t.clientX - drag.sx, dy = t.clientY - drag.sy;
if (dx * dx + dy * dy < 100) { e.preventDefault(); }      else { clearTimeout(drag.timer); drag = null; }    }, { passive: false });
});
window.addEventListener("pointermove", function (e) {
if (!drag) return;
if (drag.touch && !drag.moved) return;    var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
if (!drag.moved) {
if (dx * dx + dy * dy < 64) return;
lift();
}
var mx = 6 + drag.bw * 0.02, my = 6 + drag.bh * 0.02;
var nx = drag.ox + dx, ny = drag.oy + dy;
nx = Math.min(Math.max(nx, mx - drag.bx), Math.max(mx - drag.bx, innerWidth - mx - drag.bw - drag.bx));
ny = Math.min(Math.max(ny, my - drag.by), Math.max(my - drag.by, innerHeight - my - drag.bh - drag.by));
pos[drag.k] = [nx, ny];
apply(drag.k);
}, { passive: true });
function end() {
if (!drag) return;
window.__dhDrag = false;
clearTimeout(drag.timer);
drag.el.style.removeProperty("--dds");
if (drag.moved) {
clamp(drag.k);
if (pos[drag.k] && Math.abs(pos[drag.k][0]) < 2 && Math.abs(pos[drag.k][1]) < 2) {
delete pos[drag.k];
apply(drag.k);
}
updateReset();
squelch = Date.now() + 320;
drag.el.classList.remove("is-drag");
}
document.documentElement.classList.remove("dh-grabbing");
drag = null;
}
window.addEventListener("pointerup", end, { passive: true });
window.addEventListener("pointercancel", end, { passive: true });
function goHome() {
pos = {};
try { hero.dispatchEvent(new CustomEvent("dh:gohome")); } catch (err) {}
updateReset();
Object.keys(els).forEach(function (k) { els[k].classList.add("is-anim"); apply(k); });
setTimeout(function () {
Object.keys(els).forEach(function (k) { els[k].classList.remove("is-anim"); });
}, 500);
}
resetBtn.addEventListener("click", function () {
resetBtn.classList.add("is-spin");
goHome();
setTimeout(function () { resetBtn.classList.remove("is-spin"); }, 550);
});
hero.addEventListener("dblclick", function (e) {
if (e.target.closest(".dh-dragobj, a, button, input, .dh-pop, .dh-menu")) return;
goHome();
});
var lastTap = 0, lastTapX = 0, lastTapY = 0;
hero.addEventListener("pointerup", function (e) {
if (e.pointerType !== "touch") return;
if (e.target.closest(".dh-dragobj, a, button, input, .dh-pop, .dh-menu")) return;
var now = Date.now();
if (now - lastTap < 350 && Math.abs(e.clientX - lastTapX) < 40 && Math.abs(e.clientY - lastTapY) < 40) {
goHome();
lastTap = 0;
return;
}
lastTap = now; lastTapX = e.clientX; lastTapY = e.clientY;
});
})();
