
(function () {
var hero = document.getElementById("dynHero");
if (!hero) return;
var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var props = Array.prototype.slice.call(hero.querySelectorAll(".dh-prop"));
if (calm || !props.length) return;
var items = props.map(function (el) {
return { el: el, f: Math.min(0.85, (parseFloat(el.getAttribute("data-depth")) || 5) * 0.08), tx: 0, ty: 0, cx: 0, cy: 0 };
});
var pRaf = 0;
var pStep = function () {
pRaf = 0;
var busy = false;
for (var i = 0; i < items.length; i++) {
var it = items[i];
it.cx += (it.tx - it.cx) * 0.12;
it.cy += (it.ty - it.cy) * 0.12;
it.el.style.setProperty("--px", it.cx.toFixed(1) + "px");
it.el.style.setProperty("--py", it.cy.toFixed(1) + "px");
it.el.style.setProperty("--pw", (it.cx * 0.12).toFixed(2) + "deg");
if (Math.abs(it.tx - it.cx) > 0.2 || Math.abs(it.ty - it.cy) > 0.2) busy = true;
}
if (busy) pKick();
};
var pKick = function () { if (!pRaf) pRaf = requestAnimationFrame(pStep); };
items.forEach(function (it) {
it.el.addEventListener("pointermove", function (e) {
var r = it.el.getBoundingClientRect();
var bx = r.left + r.width / 2 - it.cx;
var by = r.top + r.height / 2 - it.cy;
it.tx = (e.clientX - bx) * it.f;
it.ty = (e.clientY - by) * it.f;
pKick();
});
it.el.addEventListener("pointerleave", function () { it.tx = 0; it.ty = 0; pKick(); });
["pointerup", "pointercancel"].forEach(function (ev) {
it.el.addEventListener(ev, function (e) {
if (e.pointerType !== "mouse") { it.tx = 0; it.ty = 0; pKick(); }
});
});
});
})();
