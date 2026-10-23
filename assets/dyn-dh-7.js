
(function () {
var hero = document.getElementById("dynHero");
if (!hero) return;
var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!fine || calm) return;
var CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@";
Array.prototype.forEach.call(hero.querySelectorAll(".dh-corner-link"), function (chip) {
var txt = chip.querySelector(".dh-corner-txt");
if (!txt) return;
var orig = txt.textContent;
var sRaf = 0;
chip.addEventListener("mouseenter", function () {
txt.style.display = "inline-block";
txt.style.minWidth = txt.getBoundingClientRect().width + "px";
var f = 0;
cancelAnimationFrame(sRaf);
var HOLD = 14, RATE = 3;
var step = function () {
f++;
var lock = Math.max(0, Math.floor((f - HOLD) / RATE));
var out = "";
for (var i = 0; i < orig.length; i++) {
var c = orig.charAt(i);
if (c === " ") { out += c; continue; }
out += i < lock ? c : CH.charAt(Math.floor(Math.random() * CH.length));
}
txt.textContent = out;
if (lock < orig.length) sRaf = requestAnimationFrame(step);
else txt.textContent = orig;
};
sRaf = requestAnimationFrame(step);
});
chip.addEventListener("mouseleave", function () {
cancelAnimationFrame(sRaf);
txt.textContent = orig;
});
});
})();
