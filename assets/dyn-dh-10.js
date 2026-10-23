
(function () {
var ph = document.getElementById("dhPhone");
var fx = document.getElementById("dhPhoneCordFx");
if (!ph || !fx) return;
var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
fx.setAttribute("xmlns", "http://www.w3.org/2000/svg");
var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
path.setAttribute("fill", "none");
path.setAttribute("stroke", "#f4b41a");
path.setAttribute("stroke-width", "3");
path.setAttribute("stroke-linecap", "round");
path.setAttribute("stroke-linejoin", "round");
fx.appendChild(path);
var tx = 0, ty = 0, vx = 0, vy = 0, raf = 0, dragging = false, didDrag = false, px = 0, py = 0;
function size() { fx.setAttribute("viewBox", "0 0 " + innerWidth + " " + innerHeight); }
function cord() {
var r = ph.getBoundingClientRect();
var hx = r.left + r.width / 2, hy = r.top + 6;
var ax = r.left + r.width / 2 - tx, ay = 0;
var dx = hx - ax, dy = hy - ay;
var dist = Math.sqrt(dx * dx + dy * dy) || 1;
var amp = Math.max(3, 24 - dist * 0.05);
var N = 48, d = "M" + ax.toFixed(1) + " 0";
var nx = -dy / dist, ny = dx / dist;
for (var i = 1; i <= N; i++) {
var t = i / N;
var off = (i === N ? 0 : Math.sin(t * Math.PI * 7) * amp * (0.35 + 0.65 * Math.sin(t * Math.PI)));
d += " L" + (ax + dx * t + nx * off).toFixed(1) + " " + (ay + dy * t + ny * off).toFixed(1);
}
path.setAttribute("d", d);
}
function apply() {
var rot = Math.max(-18, Math.min(18, tx * 0.06));
ph.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) rotate(" + rot.toFixed(1) + "deg)";
cord();
}
function spring() {
raf = 0;
vx += -tx * 0.055; vy += -ty * 0.055;
vx *= 0.88; vy *= 0.88;
tx += vx; ty += vy;
if (Math.abs(tx) < 0.4 && Math.abs(ty) < 0.4 && Math.abs(vx) < 0.4 && Math.abs(vy) < 0.4) { tx = ty = vx = vy = 0; apply(); return; }
apply();
raf = requestAnimationFrame(spring);
}
ph.addEventListener("pointerdown", function (e) {
dragging = true; didDrag = false;
px = e.clientX - tx; py = e.clientY - ty;
if (raf) { cancelAnimationFrame(raf); raf = 0; }
vx = vy = 0;
try { ph.setPointerCapture(e.pointerId); } catch (err) {}
e.preventDefault();
});
ph.addEventListener("pointermove", function (e) {
if (!dragging) return;
var nx2 = e.clientX - px, ny2 = e.clientY - py;
if (!didDrag && Math.sqrt(nx2 * nx2 + ny2 * ny2) > 7) didDrag = true;
tx = nx2; ty = ny2;
apply();
});
function drop() {
if (!dragging) return;
dragging = false;
if (calm) { tx = ty = 0; apply(); return; }
if (!raf) raf = requestAnimationFrame(spring);
}
ph.addEventListener("pointerup", drop);
ph.addEventListener("pointercancel", drop);
ph.addEventListener("click", function (e) { if (didDrag) { e.preventDefault(); didDrag = false; } });
addEventListener("resize", function () { size(); apply(); }, { passive: true });
size();
apply();
})();
