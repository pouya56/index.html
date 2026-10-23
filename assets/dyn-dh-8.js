
(function () {
var hero = document.getElementById("dynHero");

var labCv = document.getElementById("dhLabCv");
var labCfgEl = document.getElementById("dhLabCfg");
if (labCv && labCfgEl && hero) {
(function () {
var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var cfg;
try { cfg = JSON.parse(labCfgEl.textContent); } catch (err) { return; }
var WORDS = cfg.words || [];
if (!WORDS.length) return;
var BASE = Math.max(0.03, Math.min(1, cfg.base || 0.18));
var SMEAR = cfg.style === "smear";
var PICS = cfg.pics || {};
var REST = SMEAR ? Math.min(1, BASE * 4) : BASE;
var ctx = labCv.getContext("2d");
if (!ctx) return;
var topCv = document.getElementById("dhLabTop");
var tctx = topCv ? topCv.getContext("2d") : null;
var HOT = "#e10600";

if (cfg.style === "wall") {
var wallGlass = hero.querySelector(".dh-labglass");
if (wallGlass) wallGlass.style.display = "none";
if (topCv) { topCv.width = 0; topCv.height = 0; }
PROC = {};
var picW = document.createElement("div");
picW.style.cssText = "position:absolute;z-index:120;width:210px;display:none;pointer-events:none;opacity:0;transition:opacity 0.18s;";
hero.appendChild(picW);
var RED = "#d0201a";
var INKA = Math.max(0.5, Math.min(1, BASE * 4));
var calmW = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var W = 0, H = 0, FS = 26, RH = 35, GAP2 = 9;
var spB = [], spW = [], seqW = [], cum = [], totalW = 0, seqLen = 0, rowsN = 0;
var noisePat = null;
var rowDebt = [], rowFrozenAt = [], rowPerm = [], rowCum = [];

function wallSprite(word, color) {
var c = document.createElement("canvas");
var g = c.getContext("2d");
var font = "800 " + FS + "px Jost, Futura, 'Century Gothic', sans-serif";
g.font = font;
var txt = "“" + word.toUpperCase() + "”";
var tw = Math.ceil(g.measureText(txt).width) + 4;
c.width = Math.max(2, tw); c.height = Math.ceil(FS * 1.3);
g = c.getContext("2d");
g.font = font;
g.textBaseline = "middle";
g.fillStyle = color;
g.fillText(txt, 2, c.height / 2 + FS * 0.05);
g.globalCompositeOperation = "destination-out";
g.globalAlpha = 0.55;
for (var n2 = 0, N2 = tw * 1.5; n2 < N2; n2++) {
g.fillRect(Math.random() * c.width, Math.random() * c.height, 1.3, 1.3);
}
g.globalAlpha = 1;
g.globalCompositeOperation = "source-over";
return c;
}
function buildWall() {
FS = W < 640 ? 17 : 26;
RH = Math.ceil(FS * 1.35);
GAP2 = Math.ceil(FS * 0.35);
spB = []; spW = []; seqW = []; cum = [];
totalW = 0;
seqLen = WORDS.length;
for (var i6 = 0; i6 < seqLen; i6++) {
spB.push(wallSprite(WORDS[i6], "#161210"));
spW.push(wallSprite(WORDS[i6], "#ffffff"));
seqW.push(spB[i6].width + GAP2);
cum.push(totalW);
totalW += seqW[i6];
}
rowsN = Math.ceil(H / RH) + 1;
rowDebt = []; rowFrozenAt = []; rowPerm = []; rowCum = [];
for (var iR = 0; iR < rowsN; iR++) {
rowDebt.push(0); rowFrozenAt.push(-1);
var sd = iR * 9301 + 49297, pm = [], k9, j9, t9;
for (k9 = 0; k9 < seqLen; k9++) pm.push(k9);
for (k9 = seqLen - 1; k9 > 0; k9--) {
sd = (sd * 9301 + 49297) % 233280;
j9 = sd % (k9 + 1); t9 = pm[k9]; pm[k9] = pm[j9]; pm[j9] = t9;
}
rowPerm.push(pm);
var cc = [], ac = 0;
for (k9 = 0; k9 < seqLen; k9++) { cc.push(ac); ac += seqW[pm[k9]]; }
rowCum.push(cc);
}
var nt = document.createElement("canvas");
nt.width = nt.height = 128;
var ng = nt.getContext("2d");
var nid = ng.createImageData(128, 128);
for (var i7 = 0; i7 < nid.data.length; i7 += 4) {
var vv = Math.random() < 0.5 ? 0 : 255;
nid.data[i7] = nid.data[i7 + 1] = nid.data[i7 + 2] = vv;
nid.data[i7 + 3] = Math.random() * 22;
}
ng.putImageData(nid, 0, 0);
noisePat = ctx.createPattern(nt, "repeat");
}
function sizeWall() {
var r = hero.getBoundingClientRect();
W = r.width; H = r.height;
labCv.width = Math.round(W);
labCv.height = Math.round(H);
buildWall();
}
function rowOff(r2, tSec) {
var eff = (rowFrozenAt[r2] >= 0 ? rowFrozenAt[r2] : tSec) - (rowDebt[r2] || 0);
var dir2 = r2 % 2 ? 1 : -1;
var sp = 6 + (r2 * 13) % 7;
var off = (r2 * 137) % totalW + eff * sp * dir2;
return ((off % totalW) + totalW) % totalW;
}
function zonesNow() {
var hr = labCv.getBoundingClientRect();
var out = [];
/* hamburger + reset float above the wall; words paint behind */
var sels = [".dh-search", ".dh-head", ".dh-hero-btns .dh-gbtn", ".dh-hero-btns .dh-goo-wrap"];
for (var s3 = 0; s3 < sels.length; s3++) {
var list = hero.querySelectorAll(sels[s3]);
for (var e3 = 0; e3 < list.length; e3++) {
var rc = list[e3].getBoundingClientRect();
if (rc.width < 5 || rc.height < 5) continue;
out.push({ x: rc.left - hr.left - 10, y: rc.top - hr.top - 8, w: rc.width + 20, h: rc.height + 16 });
}
}
return out;
}
function inZone(zs, x, y, w2, h2) {
for (var z2 = 0; z2 < zs.length; z2++) {
var z3 = zs[z2];
if (x < z3.x + z3.w && x + w2 > z3.x && y < z3.y + z3.h && y + h2 > z3.y) return true;
}
return false;
}
function cellAt(px3, py3, tSec) {
var r2 = Math.floor(py3 / RH);
if (r2 < 0 || r2 >= rowsN || totalW <= 0) return null;
var world = px3 + rowOff(r2, tSec);
var q2 = Math.floor(world / totalW);
var rem = world - q2 * totalW;
var pmC = rowPerm[r2], cmC = rowCum[r2];
for (var i8 = 0; i8 < seqLen; i8++) {
if (rem >= cmC[i8] && rem < cmC[i8] + seqW[pmC[i8]]) {
if (rem > cmC[i8] + spB[pmC[i8]].width) return null;
return { r: r2, j: q2 * seqLen + i8, w: pmC[i8] };
}
}
return null;
}

var hovCell = null, selCell = null, mxw = -1, myw = -1;
var liveW = true, rafW = 0, tBW = null, lastDW = 0, lastPtrW = "mouse";
function frameW(tms) {
rafW = 0;
if (!liveW) return;
if (tBW == null) tBW = tms;
if (tms - lastDW < 41) { rafW = requestAnimationFrame(frameW); return; }
lastDW = tms;
var tSec = calmW ? 0 : (tms - tBW) / 1000;
var zs = zonesNow();
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.globalAlpha = 1;
ctx.fillStyle = RED;
ctx.fillRect(0, 0, W, H);
if (noisePat) { ctx.fillStyle = noisePat; ctx.fillRect(0, 0, W, H); }
var hov2 = null, selPos = null;
for (var r2 = 0; r2 < rowsN; r2++) {
var y2 = r2 * RH;
var off = rowOff(r2, tSec);
var q2 = Math.floor(off / totalW);
var rem0 = off - q2 * totalW;
var pmR = rowPerm[r2], cmR = rowCum[r2];
var i9 = 0;
while (i9 < seqLen && cmR[i9] + seqW[pmR[i9]] <= rem0) i9++;
if (i9 >= seqLen) { i9 = 0; q2++; rem0 -= totalW; }
var j2 = q2 * seqLen + i9;
var x2 = cmR[i9] - rem0;
while (x2 < W) {
var wi = pmR[((j2 % seqLen) + seqLen) % seqLen];
var sw = spB[wi].width, sh = spB[wi].height;
if (!inZone(zs, x2, y2, sw, sh)) {
var isSelC = selCell && selCell.r === r2 && selCell.j === j2;
var white = isSelC;
if (mxw >= x2 && mxw < x2 + sw && myw >= y2 && myw < y2 + sh) {
hov2 = { r: r2, j: j2, w: wi, x: x2, y: y2, sw: sw };
white = true;
}
if (isSelC) selPos = { r: r2, j: j2, w: wi, x: x2, y: y2, sw: sw };
ctx.globalAlpha = white ? 1 : INKA;
ctx.drawImage(white ? spW[wi] : spB[wi], x2, y2 + (RH - sh) / 2);
}
x2 += seqW[wi];
j2++;
}
}
hovCell = hov2;
labCv.style.cursor = hov2 ? "pointer" : "";
for (var rf = 0; rf < rowsN; rf++) {
var holdRow = (hov2 && hov2.r === rf) || (selCell && selCell.r === rf);
if (holdRow) {
if (rowFrozenAt[rf] < 0) rowFrozenAt[rf] = tSec;
} else if (rowFrozenAt[rf] >= 0) {
rowDebt[rf] += tSec - rowFrozenAt[rf];
rowFrozenAt[rf] = -1;
}
}
var actC = hov2 || selPos;
var psrcW = actC ? PICS[(WORDS[actC.w] || "").toUpperCase()] || null : null;
var pelW = psrcW ? procPic(WORDS[actC.w], psrcW) : null;
if (pelW) {
var keyW = WORDS[actC.w];
if (picW.getAttribute("data-w") !== keyW) {
picW.setAttribute("data-w", keyW);
while (picW.firstChild) picW.removeChild(picW.firstChild);
picW.appendChild(pelW);
}
var pwW = W < 640 ? 144 : 210;
picW.style.width = pwW + "px";
var pxW = actC.x + actC.sw + 14;
if (pxW + pwW > W - 8) pxW = actC.x - 14 - pwW;
picW.style.left = Math.max(8, pxW) + "px";
picW.style.top = (actC.y + RH / 2) + "px";
picW.style.transform = "translateY(-50%)";
picW.style.display = "block";
picW.style.opacity = "1";
} else {
picW.style.opacity = "0";
picW.style.display = "none";
}
rafW = requestAnimationFrame(frameW);
}
function kickW() { if (!rafW && liveW) rafW = requestAnimationFrame(frameW); }
function setLiveW(v) { liveW = v; if (v) { tBW = null; lastDW = 0; kickW(); } }
document.addEventListener("visibilitychange", function () { setLiveW(!document.hidden); });
if (typeof IntersectionObserver !== "undefined") {
new IntersectionObserver(function (es) { setLiveW(!!(es[0] && es[0].isIntersecting) && !document.hidden); }, { threshold: 0.02 }).observe(hero);
}

labCv.addEventListener("pointermove", function (e) {
if (e.pointerType) lastPtrW = e.pointerType;
var r3 = labCv.getBoundingClientRect();
mxw = e.clientX - r3.left; myw = e.clientY - r3.top;
kickW();
});
labCv.addEventListener("pointerdown", function (e) {
if (e.pointerType) lastPtrW = e.pointerType;
});
labCv.addEventListener("pointerleave", function (e) {
if (!e.pointerType || e.pointerType === "mouse") { mxw = myw = -1; kickW(); }
});
labCv.addEventListener("click", function (e) {
var r3 = labCv.getBoundingClientRect();
mxw = e.clientX - r3.left; myw = e.clientY - r3.top;
var tSecC = calmW || tBW == null ? 0 : (lastDW - tBW) / 1000;
var cell = cellAt(mxw, myw, tSecC);
var isTouchW = lastPtrW === "touch";
if (!cell) {
selCell = null;
if (isTouchW) mxw = myw = -1;
kickW();
return;
}
if (isTouchW && !(selCell && selCell.r === cell.r && selCell.j === cell.j)) {
selCell = cell;
kickW();
return;
}
selCell = null;
var word = (WORDS[cell.w] || "").toUpperCase();
var input = document.getElementById("dhSearch");
if (!input) {
if (cfg.search) location.href = cfg.search + "?q=" + encodeURIComponent(word);
return;
}
if (calmW) {
input.value = word;
try { input.dispatchEvent(new Event("input", { bubbles: true })); } catch (e0) {}
if (!isTouchW) input.focus();
return;
}
var off2 = rowOff(cell.r, tSecC);
var cx2 = Math.floor(cell.j / seqLen) * totalW + rowCum[cell.r][((cell.j % seqLen) + seqLen) % seqLen] - off2 + spB[cell.w].width / 2;
var cy2 = cell.r * RH + RH / 2;
var fly = document.createElement("span");
fly.textContent = "“" + word + "”";
fly.style.cssText = "position:fixed;left:0;top:0;z-index:200;pointer-events:none;white-space:nowrap;" +
"background:" + RED + ";color:#fff;padding:0.22em 0.4em;letter-spacing:0.01em;will-change:transform,opacity;" +
"font:800 " + FS + "px Jost, Futura, 'Century Gothic', sans-serif;";
fly.style.transform = "translate(" + (r3.left + cx2) + "px," + (r3.top + cy2) + "px) translate(-50%,-50%)";
document.body.appendChild(fly);
var ir = input.getBoundingClientRect();
var tx2 = ir.left + Math.min(ir.width * 0.5, 90), ty2 = ir.top + ir.height / 2;
fly.style.transition = "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s 0.4s";
requestAnimationFrame(function () { requestAnimationFrame(function () {
fly.style.transform = "translate(" + tx2 + "px," + ty2 + "px) translate(-50%,-50%) scale(0.55)";
fly.style.opacity = "0";
}); });
if (!isTouchW) input.focus();
input.value = "";
if (isTouchW) mxw = myw = -1;
setTimeout(function () {
if (fly.parentNode) fly.parentNode.removeChild(fly);
var k4 = 0;
var typer = setInterval(function () {
k4++;
input.value = word.slice(0, k4);
try { input.dispatchEvent(new Event("input", { bubbles: true })); } catch (e1) {}
if (k4 >= word.length) clearInterval(typer);
}, 55);
}, 560);
});

sizeWall();
window.addEventListener("resize", function () { sizeWall(); kickW(); }, { passive: true });
kickW();
return;
}

var pic = null;
if (SMEAR) {
pic = document.createElement("div");
pic.style.cssText = "position:absolute;z-index:120;width:210px;display:none;pointer-events:none;opacity:0;transition:opacity 0.18s;";
hero.appendChild(pic);
}
var PROC = {};
function stylePic(img) {
var sc = Math.min(1, 420 / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
var w = Math.max(1, Math.round((img.naturalWidth || 1) * sc));
var h = Math.max(1, Math.round((img.naturalHeight || 1) * sc));
var m2 = 16;
var ph = document.createElement("canvas");
ph.width = w; ph.height = h;
var pg = ph.getContext("2d");
pg.drawImage(img, 0, 0, w, h);
var id = pg.getImageData(0, 0, w, h);        var d = id.data;
for (var i5 = 0; i5 < d.length; i5 += 4) {
if (!d[i5 + 3]) continue;
var gy = d[i5] * 0.299 + d[i5 + 1] * 0.587 + d[i5 + 2] * 0.114;
gy = (gy - 128) * 1.12 + 128 + (Math.random() - 0.5) * 52;
gy = gy < 0 ? 0 : gy > 255 ? 255 : gy;
d[i5] = d[i5 + 1] = d[i5 + 2] = gy;
}
pg.putImageData(id, 0, 0);
var sil = document.createElement("canvas");
sil.width = w; sil.height = h;
var sg = sil.getContext("2d");
sg.drawImage(img, 0, 0, w, h);
sg.globalCompositeOperation = "source-in";
sg.fillStyle = "#ffffff";
sg.fillRect(0, 0, w, h);
var out = document.createElement("canvas");
out.width = w + m2 * 2; out.height = h + m2 * 2;
var og = out.getContext("2d");
var RO = 9, RI = 5, a3;
for (a3 = 0; a3 < 16; a3++) og.drawImage(sil, m2 + Math.cos(a3 * 0.3927) * RO, m2 + Math.sin(a3 * 0.3927) * RO);
og.globalCompositeOperation = "destination-out";
for (a3 = 0; a3 < 16; a3++) og.drawImage(sil, m2 + Math.cos(a3 * 0.3927) * RI, m2 + Math.sin(a3 * 0.3927) * RI);
og.globalCompositeOperation = "source-over";
og.drawImage(ph, m2, m2);
out.style.cssText = "display:block;width:100%;height:auto;";
return out;
}
function fallbackPic(url) {
var f = document.createElement("img");
f.alt = "";
f.src = url;
f.style.cssText = "display:block;width:100%;height:auto;" +
"filter:grayscale(1) contrast(1.1) drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff);";
return f;
}
function procPic(word, url) {
var got = PROC[word];
if (got && got !== "loading") return got;
if (got) return null;        PROC[word] = "loading";
var im = new Image();
im.crossOrigin = "anonymous";
var finish = function () {
try { PROC[word] = stylePic(im); }
catch (eP) { PROC[word] = fallbackPic(url); }
};
im.onload = finish;
im.onerror = function () { PROC[word] = fallbackPic(url); };
im.src = url;
if (im.complete && im.naturalWidth) { im.onload = null; finish(); }
var now = PROC[word];
return now && now !== "loading" ? now : null;
}
var N = SMEAR ? 20 : 30;
var TIER = [
{ blur: 9, scale: 2.2 },        { blur: 0, scale: 1 },        { blur: 3, scale: 1.35 },        { blur: 0, scale: 1 }      ];
var DIRS = "trbl";
var W = 0, H = 0, DPR = 1, FSCALE = 1;
var lastPtr = "mouse";

var bag = [];
function nextWord() {
if (!bag.length) {
bag = WORDS.slice();
for (var b = bag.length - 1; b > 0; b--) {
var j = Math.floor(Math.random() * (b + 1));
var tw2 = bag[b]; bag[b] = bag[j]; bag[j] = tw2;
}
}
return bag.pop();
}

var strips = [];
for (var i = 0; i < N; i++) {
var tier = TIER[i % 4];
strips.push({
word: nextWord(),
xb: ((i * 37 + 13) % 97) / 97,
yb: ((i * 53 + 7) % 89) / 89,
rot: SMEAR ? (((i * 41) % 25) - 12) * Math.PI / 180
: (((i * 41) % 121) - 60) * Math.PI / 180,
fs: SMEAR ? (i * 29) % 40 + 30 : (i * 29) % 22 + 12,
dur: (i * 17) % 19 + 22,
dir: DIRS[i % 4],
tier: tier,
phase: ((i * 3.7) % ((i * 17) % 19 + 22)) / ((i * 17) % 19 + 22),
frozen: -1, pPrev: null,
sprite: null, crisp: null, w: 0, h: 0
});
}
strips.sort(function (a, b2) { return b2.tier.blur - a.tier.blur; });

function makeSprite(st) {
var fs = st.fs * st.tier.scale * FSCALE * DPR;
var mc = document.createElement("canvas");
var m = mc.getContext("2d");
var font = (SMEAR ? "700 " : "600 ") + fs + "px Jost, Futura, 'Century Gothic', sans-serif";
var ls = fs * (SMEAR ? 0.02 : 0.18);
m.font = font;
try { m.letterSpacing = ls + "px"; } catch (eLs) {}
var tw = m.measureText(st.word).width;
var padX = SMEAR ? fs * 0.3 : fs * 0.95, padY = SMEAR ? fs * 0.3 : fs * 0.55;
var w = Math.ceil(tw + padX * 2), h = Math.ceil(fs + padY * 2);
mc.width = w; mc.height = h;
m = mc.getContext("2d");
m.font = font;
try { m.letterSpacing = ls + "px"; } catch (eLs2) {}
if (SMEAR) {
m.fillStyle = "#0a0a0a";
m.textBaseline = "middle";
m.fillText(st.word, padX, h / 2 + fs * 0.06);
} else {
m.fillStyle = "#0a0a0a";
m.fillRect(0, 0, w, h);
m.fillStyle = "#fff";
m.textBaseline = "middle";
m.fillText(st.word, padX, h / 2 + fs * 0.06);
}
st.crisp = mc;
st.padX = padX / DPR;
if (SMEAR && typeof m.filter === "string") {
var pad2 = Math.ceil((st.tier.blur + 10) * 3 * DPR + fs * 0.6);
var bc2 = document.createElement("canvas");
bc2.width = w + pad2 * 2; bc2.height = h + pad2 * 2;
var bx = bc2.getContext("2d");
var seed = st.fs + st.word.length;
for (var k3 = 6; k3 >= 0; k3--) {
var tt = k3 / 6;            bx.globalAlpha = 0.16 + (1 - tt) * 0.6;
bx.filter = "blur(" + ((1 + st.tier.blur * 0.5 + tt * 8) * DPR) + "px)";
var oy = (k3 % 2 ? 1 : -1) * tt * fs * 0.5 + Math.sin(seed + k3 * 1.9) * fs * 0.12 * tt;
var ox = Math.sin(seed * 1.3 + k3 * 2.3) * fs * 0.14 * tt;
bx.drawImage(mc, pad2 + ox, pad2 + oy);
}
st.sprite = bc2;
} else if (!SMEAR && st.tier.blur > 0 && typeof m.filter === "string") {
var bc = document.createElement("canvas");
var pad = st.tier.blur * 3 * DPR;
bc.width = w + pad * 2; bc.height = h + pad * 2;
var bctx = bc.getContext("2d");
bctx.filter = "blur(" + (st.tier.blur * DPR) + "px)";
bctx.drawImage(mc, pad, pad);
st.sprite = bc;
} else {
st.sprite = mc;
}
st.w = st.sprite.width; st.h = st.sprite.height;
}

function size() {
var r = hero.getBoundingClientRect();
DPR = 1;
W = r.width; H = r.height;
FSCALE = W < 640 ? 0.72 : 1;
labCv.width = Math.round(W * DPR);
labCv.height = Math.round(H * DPR);
if (topCv) { topCv.width = labCv.width; topCv.height = labCv.height; }
for (var i2 = 0; i2 < strips.length; i2++) makeSprite(strips[i2]);
}

function posAt(st, p) {
var span = 2.4, off = -1.2 + span * p;
var x, y;
if (st.dir === "t") { x = st.xb * W; y = (off + 0.5) * H; }
else if (st.dir === "b") { x = st.xb * W; y = (0.5 - off) * H; }
else if (st.dir === "l") { x = (off + 0.5) * W; y = st.yb * H; }
else { x = (0.5 - off) * W; y = st.yb * H; }
return { x: x, y: y, r: st.rot + (p - 0.5) * 0.7 };
}
function progressOf(st, tSec) {
if (st.frozen >= 0) return st.frozen;
return (tSec / st.dur + st.phase) % 1;
}

var hovered = null, mx = -1, my = -1;
var dragSt = null, dragPending = null, dragPX = 0, dragPY = 0, didDrag = false;
var scrF = 0;
var CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@";
function hitStrip(st) {
var q = st.last;
if (!q) return false;
var pad = lastPtr === "touch" ? 14 : 0;
var dx = mx - q.x, dy = my - q.y;
var c = Math.cos(-q.r), s2 = Math.sin(-q.r);
var lx2 = dx * c - dy * s2, ly2 = dx * s2 + dy * c;
return Math.abs(lx2) <= st.w / DPR / 2 + pad && Math.abs(ly2) <= st.h / DPR / 2 + pad;
}
function hitTest() {
for (var i3 = strips.length - 1; i3 >= 0; i3--) {
if (hitStrip(strips[i3])) return strips[i3];
}
return null;
}

function drawHot(st, q) {
var g = tctx || ctx;
if (SMEAR) {
var ci = st.crisp;
g.save();
g.translate(q.x, q.y);
g.rotate(q.r);
g.globalAlpha = 1;
g.drawImage(ci, -ci.width / DPR / 2, -ci.height / DPR / 2, ci.width / DPR, ci.height / DPR);
g.restore();
return;
}
var fs = st.fs * st.tier.scale * FSCALE;
var w = st.crisp.width / DPR, h = st.crisp.height / DPR;
var word = st.word, text = word;
if (!calm) {
var lock = Math.max(0, Math.floor((scrF - 8) / 2));
if (lock < word.length) {
text = "";
for (var k2 = 0; k2 < word.length; k2++) {
var ch = word.charAt(k2);
text += (ch === " " || k2 < lock) ? ch : CH.charAt(Math.floor(Math.random() * CH.length));
}
}
}
g.save();
g.translate(q.x, q.y);
g.rotate(q.r);
g.globalAlpha = 1;
g.fillStyle = HOT;
g.fillRect(-w / 2, -h / 2, w, h);
g.fillStyle = "#fff";
g.font = "600 " + fs + "px Jost, Futura, 'Century Gothic', sans-serif";
try { g.letterSpacing = (fs * 0.18) + "px"; } catch (eLs3) {}
g.textBaseline = "middle";
g.fillText(text, -w / 2 + st.padX, fs * 0.06);
g.restore();
}

var live = true, raf = 0, tBase = null, lastDraw = 0;
function frame(tms) {
raf = 0;
if (!live) return;
if (tBase == null) tBase = tms;
if (tms - lastDraw < 41) { raf = requestAnimationFrame(frame); return; }
lastDraw = tms;
var tSec = (tms - tBase) / 1000;
ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
ctx.clearRect(0, 0, W, H);
for (var i4 = 0; i4 < strips.length; i4++) {
var st = strips[i4];
if (st === hovered || st === dragSt) continue;          var p = progressOf(st, tSec);
if (st.frozen < 0 && st.pPrev != null && p < st.pPrev - 0.5) { st.word = nextWord(); makeSprite(st); }
st.pPrev = p;
var q = posAt(st, p);
st.last = q;
if (q.x < -st.w || q.x > W + st.w || q.y < -st.h || q.y > H + st.h) continue;
ctx.save();
ctx.translate(q.x, q.y);
ctx.rotate(q.r);
ctx.globalAlpha = REST;
var img = st.sprite;
ctx.drawImage(img, -img.width / DPR / 2, -img.height / DPR / 2, img.width / DPR, img.height / DPR);
ctx.restore();
}
if (lastPtr !== "touch" && !dragSt) {
var h2 = mx >= 0 ? hitTest() : null;
if (h2 !== hovered) {
if (hovered) { var pOld = hovered.frozen; hovered.frozen = -1; hovered.phase = ((pOld - tSec / hovered.dur) % 1 + 1) % 1; }
hovered = h2;
if (hovered) { hovered.frozen = progressOf(hovered, tSec); scrF = 0; }
labCv.style.cursor = hovered ? "pointer" : "";
}
}
if (tctx) { tctx.setTransform(DPR, 0, 0, DPR, 0, 0); tctx.clearRect(0, 0, W, H); }
var act = dragSt || hovered;
if (act) {
scrF++;
var qa = dragSt ? { x: act.dragX, y: act.dragY, r: act.dragR } : posAt(act, progressOf(act, tSec));
act.last = qa;
drawHot(act, qa);
}
if (pic) {
var psrc = act ? PICS[(act.word || "").toUpperCase()] || null : null;
var pel = psrc ? procPic(act.word, psrc) : null;
if (pel) {
if (pic.getAttribute("data-w") !== act.word) {
pic.setAttribute("data-w", act.word);
while (pic.firstChild) pic.removeChild(pic.firstChild);
pic.appendChild(pel);
}
var pw2 = W < 640 ? 144 : 210;
pic.style.width = pw2 + "px";
var bw2 = act.crisp.width / DPR / 2;
var px2 = act.last.x + bw2 + 16;
if (px2 + pw2 > W - 8) px2 = act.last.x - bw2 - 16 - pw2;
pic.style.left = Math.max(8, px2) + "px";
pic.style.top = act.last.y + "px";
pic.style.transform = "translateY(-50%)";
pic.style.display = "block";
pic.style.opacity = "1";
} else {
pic.style.opacity = "0";
pic.style.display = "none";
}
}
if (!calm || hovered || dragSt) raf = requestAnimationFrame(frame);
}
function kick() { if (!raf && live) raf = requestAnimationFrame(frame); }
function setLive(v) { live = v; if (v) { tBase = null; kick(); } }
document.addEventListener("visibilitychange", function () { setLive(!document.hidden); });
if (typeof IntersectionObserver !== "undefined") {
new IntersectionObserver(function (es) { setLive(!!(es[0] && es[0].isIntersecting) && !document.hidden); }, { threshold: 0.02 }).observe(hero);
}

labCv.addEventListener("pointermove", function (e) {
if (e.pointerType) lastPtr = e.pointerType;
var r = labCv.getBoundingClientRect();
mx = e.clientX - r.left; my = e.clientY - r.top;
if (dragPending && !dragSt && (Math.abs(e.clientX - dragPX) > 6 || Math.abs(e.clientY - dragPY) > 6)) {
dragSt = dragPending;
didDrag = true;
dragSt.dragR = dragSt.last ? dragSt.last.r : dragSt.rot;
labCv.style.cursor = "grabbing";
}
if (dragSt) { dragSt.dragX = mx; dragSt.dragY = my; }
kick();
});
labCv.addEventListener("pointerdown", function (e) {
if (e.pointerType) lastPtr = e.pointerType;
didDrag = false;
var r = labCv.getBoundingClientRect();
mx = e.clientX - r.left; my = e.clientY - r.top;
var t = hovered && hitStrip(hovered) ? hovered : hitTest();
if (lastPtr === "touch" && t !== hovered) t = null;
if (t) {
dragPending = t;
dragPX = e.clientX; dragPY = e.clientY;
try { labCv.setPointerCapture(e.pointerId); } catch (eCap) {}
}
kick();
});
labCv.addEventListener("touchmove", function (e) {
if (dragPending || dragSt) e.preventDefault();
}, { passive: false });
function endDrag() {
dragPending = null;
if (!dragSt) return;
var st = dragSt;
dragSt = null;
var tSecD = tBase != null ? (lastDraw - tBase) / 1000 : 0;
var p;
if (st.dir === "t") { st.xb = Math.max(0, Math.min(1, st.dragX / W)); p = ((st.dragY / H - 0.5) + 1.2) / 2.4; }
else if (st.dir === "b") { st.xb = Math.max(0, Math.min(1, st.dragX / W)); p = ((0.5 - st.dragY / H) + 1.2) / 2.4; }
else if (st.dir === "l") { st.yb = Math.max(0, Math.min(1, st.dragY / H)); p = ((st.dragX / W - 0.5) + 1.2) / 2.4; }
else { st.yb = Math.max(0, Math.min(1, st.dragY / H)); p = ((0.5 - st.dragX / W) + 1.2) / 2.4; }
p = Math.max(0, Math.min(1, p));
st.rot = st.dragR - (p - 0.5) * 0.7;        st.phase = ((p - tSecD / st.dur) % 1 + 1) % 1;
st.pPrev = p;
if (lastPtr === "touch") {
hovered = null;
st.frozen = -1;
mx = my = -1;
} else {
st.frozen = p;
labCv.style.cursor = "pointer";
}
kick();
}
labCv.addEventListener("pointerup", endDrag);
labCv.addEventListener("pointercancel", endDrag);
labCv.addEventListener("pointerleave", function (e) {
if (!e.pointerType || e.pointerType === "mouse") mx = my = -1;
});
labCv.addEventListener("click", function (e) {
if (didDrag) { didDrag = false; return; }
var r0 = labCv.getBoundingClientRect();
mx = e.clientX - r0.left; my = e.clientY - r0.top;
var isTouch = lastPtr === "touch";
var hit = (isTouch && hovered && hitStrip(hovered)) ? hovered : hitTest();
if (isTouch) {
if (!hit || hit !== hovered) {
var tSec0 = tBase != null ? (lastDraw - tBase) / 1000 : 0;
if (hovered) { var pO = hovered.frozen; hovered.frozen = -1; hovered.phase = ((pO - tSec0 / hovered.dur) % 1 + 1) % 1; }
hovered = hit;
if (hovered) { hovered.frozen = progressOf(hovered, tSec0); scrF = 0; }
if (!hit) mx = my = -1;
kick();
return;
}
} else if (!hit || hit !== hovered) { kick(); return; }
var st = hit, word = st.word, q = st.last;
var input = document.getElementById("dhSearch");
if (!input) {
if (cfg.search) location.href = cfg.search + "?q=" + encodeURIComponent(word);
return;
}
var tSec = tBase != null ? (lastDraw - tBase) / 1000 : 0;
st.frozen = -1;
st.phase = ((-tSec / st.dur) % 1 + 1) % 1;        st.pPrev = 0;
st.word = nextWord();
makeSprite(st);
hovered = null;
labCv.style.cursor = "";
if (isTouch) mx = my = -1;        if (calm) {          input.value = word;
try { input.dispatchEvent(new Event("input", { bubbles: true })); } catch (e0) {}
if (!isTouch) input.focus();
return;
}
var cr = labCv.getBoundingClientRect();
var fly = document.createElement("span");
fly.textContent = word;
var ffs = Math.round(st.fs * st.tier.scale * FSCALE);
fly.style.cssText = "position:fixed;left:0;top:0;z-index:200;pointer-events:none;white-space:nowrap;" +
(SMEAR ? "background:transparent;color:#0a0a0a;padding:0.3em;letter-spacing:0.02em;"
: "background:" + HOT + ";color:#fff;padding:0.55em 0.95em;letter-spacing:0.18em;") +
"will-change:transform,opacity;" +
"font:" + (SMEAR ? "700 " : "600 ") + ffs + "px Jost, Futura, 'Century Gothic', sans-serif;";
fly.style.transform = "translate(" + (cr.left + q.x) + "px," + (cr.top + q.y) + "px) translate(-50%,-50%) rotate(" + q.r + "rad)";
document.body.appendChild(fly);
var ir = input.getBoundingClientRect();
var tx = ir.left + Math.min(ir.width * 0.5, 90), ty = ir.top + ir.height / 2;
fly.style.transition = "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s 0.4s";
requestAnimationFrame(function () { requestAnimationFrame(function () {
fly.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%) rotate(0rad) scale(0.55)";
fly.style.opacity = "0";
}); });
if (!isTouch) input.focus();
input.value = "";
setTimeout(function () {
if (fly.parentNode) fly.parentNode.removeChild(fly);
var k = 0;
var typer = setInterval(function () {
k++;
input.value = word.slice(0, k);
try { input.dispatchEvent(new Event("input", { bubbles: true })); } catch (e1) {}
if (k >= word.length) clearInterval(typer);
}, 55);
}, 560);
});

size();
window.addEventListener("resize", function () { size(); kick(); }, { passive: true });
kick();
})();
}

if (hero) {
hero.addEventListener("click", function (e) {
var a = e.target && e.target.closest ? e.target.closest("a.dh-word, a.dh-lab") : null;
if (!a) return;
var input = document.getElementById("dhSearch");
if (!input) return;      e.preventDefault();
var word = (a.querySelector(".dh-lab-f") || a).textContent.trim();
input.value = word;
try { input.dispatchEvent(new Event("input", { bubbles: true })); } catch (err) {}
input.focus();
});
}

var field = document.getElementById("dhWords");
if (!hero || !field) return;
var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

var words = Array.prototype.slice.call(field.querySelectorAll(".dh-word")).map(function (el) {
return { el: el, rect: null, tx: 0, ty: 0, cx: 0, cy: 0, ts: 1, cs: 1 };
});
var rows = Array.prototype.slice.call(field.querySelectorAll(".dh-wtrack"));

var live = true;
function setLive(v) {
live = v;
for (var i = 0; i < rows.length; i++) rows[i].style.animationPlayState = v ? "" : "paused";
if (v) { kick(); sweep(); }
}
document.addEventListener("visibilitychange", function () { setLive(!document.hidden); });
if (typeof IntersectionObserver !== "undefined") {
new IntersectionObserver(function (es) { setLive(!!(es[0] && es[0].isIntersecting) && !document.hidden); }, { threshold: 0.02 }).observe(hero);
}

function sweep() {
if (!live) return;
for (var i = 0; i < words.length; i++) words[i].rect = words[i].el.getBoundingClientRect();
}
sweep();
setInterval(sweep, 160);
window.addEventListener("resize", sweep, { passive: true });

if (fine && !calm) {
words.forEach(function (w) {
w.el.addEventListener("pointerenter", function () {
var track = w.el.closest(".dh-wtrack");
if (track) track.style.animationPlayState = "paused";
w.ts = 1.6;
w.el.classList.add("is-hot");
for (var i = 0; i < words.length; i++) {
var o = words[i];
if (o === w || !o.rect || !w.rect) continue;
if (Math.abs(o.rect.left - w.rect.left) < 640 && Math.abs(o.rect.top - w.rect.top) < 260) o.el.classList.add("is-dim");
}
kick();
});
w.el.addEventListener("pointerleave", function () {
var track = w.el.closest(".dh-wtrack");
if (track && live) track.style.animationPlayState = "";
w.ts = 1;
w.el.classList.remove("is-hot");
for (var i = 0; i < words.length; i++) words[i].el.classList.remove("is-dim");
kick();
});
});
}

var mx = -1e4, my = -1e4, raf = 0;
if (fine && !calm) {
hero.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; kick(); }, { passive: true });
hero.addEventListener("pointerleave", function () { mx = my = -1e4; kick(); }, { passive: true });
}
var REACH = 150, PUSH = 16;
function frame() {
raf = 0;
if (!live) return;
var busy = false;
for (var i = 0; i < words.length; i++) {
var w = words[i];
if (w.rect) {
var wx = w.rect.left + w.rect.width / 2, wy = w.rect.top + w.rect.height / 2;
var dx = wx - mx, dy = wy - my;
var d = Math.sqrt(dx * dx + dy * dy);
if (d < REACH && d > 0.01) {
var f = (REACH - d) / REACH * PUSH;
w.tx = dx / d * f; w.ty = dy / d * f;
} else { w.tx = 0; w.ty = 0; }
}
w.cx += (w.tx - w.cx) * 0.12;
w.cy += (w.ty - w.cy) * 0.12;
w.cs += (w.ts - w.cs) * 0.12;
if (Math.abs(w.tx - w.cx) > 0.1 || Math.abs(w.ty - w.cy) > 0.1 || Math.abs(w.ts - w.cs) > 0.005) {
busy = true;
w.el.style.setProperty("--wx", w.cx.toFixed(1) + "px");
w.el.style.setProperty("--wy", w.cy.toFixed(1) + "px");
w.el.style.setProperty("--ws", w.cs.toFixed(3));
}
}
if (busy) kick();
}
function kick() { if (!raf && live) raf = requestAnimationFrame(frame); }
})();
