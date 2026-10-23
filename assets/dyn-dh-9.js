
(function () {
var btn = document.getElementById("dhMenuBtn");
var menu = document.getElementById("dhMenu");
var close = document.getElementById("dhMenuClose");
if (!btn || !menu || !close) return;
function setOpen(v) {
menu.classList.toggle("is-open", v);
btn.setAttribute("aria-expanded", v ? "true" : "false");
document.documentElement.style.overflow = v ? "hidden" : "";
document.documentElement.classList.toggle("dyn-menu-open", v);
}
btn.addEventListener("click", function () { setOpen(!menu.classList.contains("is-open")); });
close.addEventListener("click", function () { setOpen(false); });
menu.addEventListener("click", function (e) {
if (e.target === menu) { setOpen(false); return; }
if (e.target && e.target.closest && e.target.closest(".dh-mmenu-link")) setOpen(false);
});
document.addEventListener("keydown", function (e) {
if (e.key === "Escape" && menu.classList.contains("is-open")) setOpen(false);
});
})();
