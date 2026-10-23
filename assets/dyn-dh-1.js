
(function () {
function boot() {
var host = document.getElementById("dhGame");
var dataEl = document.getElementById("dhGameData");
var root = document.getElementById("dynHero");
if (!host || !dataEl || !root) return;
if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
var data; try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
if (!data.boxes || !data.boxes.length) return;

var canvas = document.createElement("canvas");
canvas.style.position = "absolute"; canvas.style.inset = "0";
canvas.style.width = "100%"; canvas.style.height = "100%";
canvas.style.display = "block"; canvas.style.pointerEvents = "none";
host.appendChild(canvas);
var ctx = canvas.getContext("2d");

var w = 0, h = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
function fit() {
w = host.clientWidth; h = host.clientHeight;
canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function cutout(url, cb) {
var img = new Image(); img.crossOrigin = "anonymous";
img.onload = function () { cb(img, img.naturalWidth || 200, img.naturalHeight || 200); };
img.onerror = function () { cb(null); };
img.src = url;
}

var bodies = [];
var GRAV = 2000 * (data.gravity || 1);
var gravX = 0, gravY = GRAV, tgtGX = 0, tgtGY = GRAV;
var tiltOn = false, shakeCd = 0;
var placed = 0; // how many boxes already placed, laid out along the floor
var cursorX = 0; // running x position so boxes sit side by side

function spawn(sprite, size) {
var r = size * 0.46;
if (placed === 0) cursorX = r + 6;
var bx = cursorX + r;
cursorX += 2 * r + 4;
placed++;
var wf = Math.max(0.6, Math.min(3, size / 110));
bodies.push({
x: Math.min(bx, w - r), y: h - r - 4,
vx: 0, vy: 0,
a: (Math.random() - 0.5) * 0.15, av: 0,
r: r, size: size, m: r * r, wf: wf, spr: sprite, held: false, rest: 0
});
}

var total = 0;
data.boxes.forEach(function (b) {
cutout(b.url, function (spr) {
if (!spr) return;
var size = Math.max(40, Math.min(400, b.size || 90));
var count = Math.max(1, Math.min(6, b.count || 2));
for (var k = 0; k < count && total < 22; k++) { total++; spawn(spr, size); }
});
});

function shelves() {
if (isTouch) return [];
var out = [], hr = host.getBoundingClientRect();
var el = root.querySelector(".dh-search");
if (el) {
var r = el.getBoundingClientRect();
if (r.width >= 4 && r.height >= 4) {
out.push({ x: r.left - hr.left + r.width / 2, y: r.top - hr.top + r.height / 2, w: r.width, h: r.height });
}
}
return out;
}

function collideRect(b, rc, rest) {
var hx = rc.w / 2, hy = rc.h / 2;
var cx = Math.max(rc.x - hx, Math.min(b.x, rc.x + hx));
var cy = Math.max(rc.y - hy, Math.min(b.y, rc.y + hy));
var dx = b.x - cx, dy = b.y - cy;
var d2 = dx * dx + dy * dy;
if (d2 > b.r * b.r) return;
var d = Math.sqrt(d2) || 0.0001;
var nx = dx / d, ny = dy / d, pen = b.r - d;
b.x += nx * pen; b.y += ny * pen;
var vn = b.vx * nx + b.vy * ny;
if (vn < 0) { b.vx -= (1 + rest) * vn * nx; b.vy -= (1 + rest) * vn * ny; }
b.vx *= 0.96; b.av *= 0.9;
}

function step(dt) {
var i, j, b, o, s, rcs = shelves();
if (shakeCd > 0) shakeCd -= dt;
gravX += (tgtGX - gravX) * Math.min(1, dt * 6);
gravY += (tgtGY - gravY) * Math.min(1, dt * 6);
for (i = 0; i < bodies.length; i++) {
b = bodies[i];
if (b.held) continue;
var gm = 0.85 + 0.2 * b.wf;
b.vx += gravX * dt * gm; b.vy += gravY * dt * gm;
b.vx *= 0.9995; b.vy *= 0.9995;
b.x += b.vx * dt; b.y += b.vy * dt;
b.a += b.av * dt; b.av *= 0.99;

var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
if (speed < 45 && Math.abs(b.av) < 1.4) {
b.rest = Math.min(1, b.rest + dt * 1.2);
} else {
b.rest = 0;
}
if (b.rest > 0.15) {
var twoPi = Math.PI * 2;
var target = Math.round(b.a / twoPi) * twoPi;   // nearest upright
var diff = target - b.a;
if (Math.abs(diff) <= 0.785) {
var stepA = diff * Math.min(1, dt * 0.35);
var cap = 0.35 * dt;
if (stepA > cap) stepA = cap; else if (stepA < -cap) stepA = -cap;
b.a += stepA;
b.av *= 0.5;
}
}
}
for (var pass = 0; pass < 5; pass++) {
for (i = 0; i < bodies.length; i++) {
b = bodies[i];
for (j = i + 1; j < bodies.length; j++) {
o = bodies[j];
var dx = o.x - b.x, dy = o.y - b.y;
var d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
var overlap = b.r + o.r - d;
if (overlap > 0) {
var nx = dx / d, ny = dy / d, tm = b.m + o.m;
var bw = b.held ? 0 : (o.held ? 1 : o.m / tm);
var ow = o.held ? 0 : (b.held ? 1 : b.m / tm);
b.x -= nx * overlap * bw; b.y -= ny * overlap * bw;
o.x += nx * overlap * ow; o.y += ny * overlap * ow;
var rvx = o.vx - b.vx, rvy = o.vy - b.vy, vn = rvx * nx + rvy * ny;
if (vn < 0) {
var imp = -(1 + 0.28) * vn / tm;
if (!b.held) { b.vx -= imp * o.m * nx; b.vy -= imp * o.m * ny; }
if (!o.held) { o.vx += imp * b.m * nx; o.vy += imp * b.m * ny; }
b.av += (Math.random() - 0.5) * 0.4; o.av += (Math.random() - 0.5) * 0.4;
}
}
}
if (b.x - b.r < 0) { b.x = b.r; if (b.vx < 0) b.vx *= -0.35; }
if (b.x + b.r > w) { b.x = w - b.r; if (b.vx > 0) b.vx *= -0.35; }
if (b.y + b.r > h) { b.y = h - b.r; if (b.vy > 0) b.vy *= -0.35; b.vx *= 0.88; b.av *= 0.85; }
if (tiltOn) { if (b.y - b.r < 0) { b.y = b.r; if (b.vy < 0) b.vy *= -0.35; b.vx *= 0.88; b.av *= 0.85; } }
else if (b.y - b.r < -h) { b.y = -h + b.r; }
for (s = 0; s < rcs.length; s++) collideRect(b, rcs[s], 0.3);
}
}
}

function draw() {
ctx.clearRect(0, 0, w, h);
var i, b;
for (i = 0; i < bodies.length; i++) {
b = bodies[i]; if (!b.spr) continue;
var bottom = b.y + b.r;
var gap = Math.max(0, h - bottom);
var lift = Math.min(1, gap / (b.r * 5));   // 0 on the floor, 1 high up
var t = 1 - lift;                          // strength fades with height
if (t <= 0.03) continue;
var rx = b.r * (1.05 + lift * 1.5);        // spreads out as it rises
var ry = rx * 0.3;
var a = 0.42 * t * t;                      // softer, fades fast with height
ctx.save();
ctx.translate(b.x, h - 2);
ctx.scale(1, ry / rx);
var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
g.addColorStop(0, "rgba(0,0,0," + a.toFixed(3) + ")");
g.addColorStop(0.45, "rgba(0,0,0," + (a * 0.5).toFixed(3) + ")");
g.addColorStop(1, "rgba(0,0,0,0)");
ctx.fillStyle = g;
ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
ctx.restore();
}
for (i = 0; i < bodies.length; i++) {
b = bodies[i]; if (!b.spr) continue;
ctx.save();
ctx.translate(b.x, b.y); ctx.rotate(b.a);
ctx.shadowColor = "rgba(0,0,0,0.22)";
ctx.shadowBlur = b.size * 0.2;
ctx.shadowOffsetX = b.size * 0.02;
ctx.shadowOffsetY = b.size * 0.06;
ctx.drawImage(b.spr, -b.size / 2, -b.size / 2, b.size, b.size);
ctx.restore();
}
}

var isTouch = false;
try { isTouch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches; } catch (e) {}

function pos(e) { var hr = host.getBoundingClientRect(); return { x: e.clientX - hr.left, y: e.clientY - hr.top }; }
var held = null, grabOff = null, lastP = null, lastT = 0, throwVX = 0, throwVY = 0;
var downQ = null, downT = 0, moved = 0, swallowClick = false;
root.addEventListener("pointerdown", function (e) {
swallowClick = false;
if (e.button && e.button !== 0) return;
// real UI wins over the toys: never grab a box lying on a link or button
if (e.target && e.target.closest && e.target.closest("a, button, input, select, textarea, [role='button']")) return;
var q = pos(e), best = null, bd = 1e9;
for (var i = bodies.length - 1; i >= 0; i--) {
var b = bodies[i], dx = b.x - q.x, dy = b.y - q.y, d = dx * dx + dy * dy;
var hitR = b.size * 0.55;
if (d < hitR * hitR && d < bd) { bd = d; best = b; break; }
}
if (!best) return;   // tapped empty space -> let links etc. work normally
swallowClick = true;
held = best; held.held = true; held.vx = held.vy = held.av = 0;
grabOff = { x: held.x - q.x, y: held.y - q.y };
lastP = q; lastT = e.timeStamp || 0; throwVX = throwVY = 0;
downQ = q; downT = e.timeStamp || 0; moved = 0;
e.preventDefault(); try { root.setPointerCapture(e.pointerId); } catch (x) {}
}, true);
root.addEventListener("click", function (e) {
if (swallowClick) { e.preventDefault(); e.stopPropagation(); swallowClick = false; }
}, true);
window.addEventListener("pointermove", function (e) {
if (!held) return;
var q = pos(e), nx = q.x + grabOff.x, ny = q.y + grabOff.y;
var t = e.timeStamp || (lastT + 16), dt = Math.max(0.001, (t - lastT) / 1000);
var follow = Math.min(1, 0.45 + 0.5 / held.wf);
var px = held.x + (nx - held.x) * follow, py = held.y + (ny - held.y) * follow;
throwVX = (px - held.x) / dt; throwVY = (py - held.y) / dt;
held.x = px; held.y = py; lastP = q; lastT = t;
if (downQ) { var mx = q.x - downQ.x, my = q.y - downQ.y; moved = Math.max(moved, Math.sqrt(mx * mx + my * my)); }
}, { passive: true });
function release(e) {
if (!held) return;
var b = held; held.held = false; held = null;
var elapsed = ((e && e.timeStamp) || (downT + 999)) - downT;
b.rest = 0;
if (moved < 12 && elapsed < 500) {
var jumpV = Math.sqrt(2 * GRAV * 260) * (0.55 + 0.45 / b.wf);
b.vy = -jumpV;
b.vx = (Math.random() - 0.5) * jumpV * 0.35; // slight sideways kick
b.av = (Math.random() - 0.5) * 6;            // playful spin
} else {
var cap = 3600 / b.wf, tf = 0.6 + 0.4 / b.wf;
b.vx = Math.max(-cap, Math.min(cap, throwVX * tf));
b.vy = Math.max(-cap, Math.min(cap, throwVY * tf));
b.av = Math.max(-8, Math.min(8, throwVX / b.r));
}
}
window.addEventListener("pointerup", release);
window.addEventListener("pointercancel", release);
window.addEventListener("touchmove", function (e) {
if (held) { e.preventDefault(); }
}, { passive: false });

var acc = 0, last = 0, MAXDT = 1 / 30, FIXED = 1 / 120;
function frame(ts) {
if (!last) last = ts;
var dt = Math.min(MAXDT, (ts - last) / 1000); last = ts;
acc += dt;
var guard = 0;
while (acc >= FIXED && guard < 8) { step(FIXED); acc -= FIXED; guard++; }
draw();
requestAnimationFrame(frame);
}

var tries = 0;
(function start() {
if (host.clientHeight < 40 || host.clientWidth < 40) {
if (tries++ > 200) return;
return setTimeout(start, 60);
}
fit();
var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(fit, 150); });
requestAnimationFrame(frame);
})();
}
if (document.readyState !== "loading") boot(); else document.addEventListener("DOMContentLoaded", boot);
})();
