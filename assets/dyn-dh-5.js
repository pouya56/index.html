
(function () {
var hero = document.getElementById("dynHero");
if (!hero || hero.__dhIntro) return;
hero.__dhIntro = true;
var groups = Array.prototype.slice.call(hero.querySelectorAll(".dh-corner-group"));
function paintCorners() {
var r = hero.getBoundingClientRect();
for (var i = 0; i < groups.length; i++) {
var isTop = groups[i].className.indexOf("dh-corner-tl") > -1 || groups[i].className.indexOf("dh-corner-tr") > -1;
var dark = isTop ? r.top > 30 : r.top > window.innerHeight - 70;
groups[i].classList.toggle("is-over-dark", dark);
}
}
if (groups.length) {
window.addEventListener("scroll", paintCorners, { passive: true });
window.addEventListener("resize", paintCorners, { passive: true });
paintCorners();
}
var mReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (mReduce || hero.getBoundingClientRect().top < window.innerHeight * 0.6) return;
var wrap = hero.closest(".shopify-section");
var RUN = 0.8;
if (wrap) wrap.classList.add("dh-introrun");
var parts = [
{ el: hero.querySelector(".dh-head"), a: 0.08, b: 0.6,
fx: function (t) { return "scale(" + (2.2 - 1.2 * t).toFixed(3) + ")"; } },
{ el: hero.querySelector(".dh-search"), a: 0.3, b: 0.65,
fx: function (t) { return "translateY(" + (26 * (1 - t)).toFixed(1) + "px)"; } },
{ el: hero.querySelector(".dh-hero-btns"), a: 0.42, b: 0.75,
fx: function (t) { return "translateY(" + (26 * (1 - t)).toFixed(1) + "px)"; } }
].filter(function (x) { return x.el; });
if (!parts.length) return;
var iRaf = 0, iDone = false;
function iTeardown() {
if (iDone) return;
iDone = true;
if (wrap) wrap.classList.remove("dh-introrun");
hero.classList.remove("dh-intro");
for (var i = 0; i < parts.length; i++) { parts[i].el.style.opacity = ""; parts[i].el.style.transform = ""; }
window.removeEventListener("scroll", iQueue);
window.removeEventListener("resize", iQueue);
}
function iEase(t) { return 1 - Math.pow(1 - t, 3); }
function iFrame() {
iRaf = 0;
if (iDone) return;
var vh = window.innerHeight;
var top = (wrap || hero).getBoundingClientRect().top;
var p = (vh - top) / (vh * (1 + (wrap ? RUN : 0)));
var flying = p < 1;
hero.classList.toggle("dh-intro", flying);
for (var i = 0; i < parts.length; i++) {
if (!flying) { parts[i].el.style.opacity = ""; parts[i].el.style.transform = ""; continue; }
var t = Math.max(0, Math.min(1, (p - parts[i].a) / (parts[i].b - parts[i].a)));
t = iEase(t);
parts[i].el.style.opacity = t.toFixed(3);
parts[i].el.style.transform = parts[i].fx(t);
}
}
function iQueue() { if (!iRaf) iRaf = requestAnimationFrame(iFrame); }
if (typeof MutationObserver !== "undefined") {
new MutationObserver(function () {
if (hero.classList.contains("dh-searching")) iTeardown();
}).observe(hero, { attributes: true, attributeFilter: ["class"] });
}
window.addEventListener("scroll", iQueue, { passive: true });
window.addEventListener("resize", iQueue, { passive: true });
iFrame();
})();
