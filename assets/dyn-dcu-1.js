
      /* Popup stub belt-and-braces (no-op on the normal page). */
      (function () {
        var tries = 0;
        function imp(el, map) { for (var k in map) { try { el.style.setProperty(k, map[k], "important"); } catch (e) {} } }
        function stub() {
          tries++;
          var bb = document.querySelector("#dhSlide .dh-slide-inject #buyBox");
          if (!bb) { if (tries < 80) setTimeout(stub, 250); return; }
          var a = bb.querySelector(".dyn-popup-open");
          if (!a) {
            a = document.createElement("a");
            a.className = "dyn-popup-open";
            bb.appendChild(a);
          }
          /* the product URL comes from the page's own config JSON - the
             markup href stays a plain # so no Liquid ever sits in it */
          var url = "#";
          try { url = (JSON.parse(document.getElementById("dyn-config").textContent).shopify || {}).productUrl || "#"; } catch (e) {}
          var cur = a.getAttribute("href") || "#";
          if (url && url !== "#" && (cur === "#" || cur.indexOf("%7B") !== -1 || cur.indexOf("{") !== -1)) a.href = url;
          if (getComputedStyle(bb).position === "static") bb.style.position = "relative";
          imp(a, { position: "relative", top: "auto", bottom: "auto", right: "auto", width: "auto",
            display: "flex", "flex-direction": "column", gap: "8px", "align-items": "center",
            "justify-content": "center", "text-decoration": "none", "z-index": "6",
            visibility: "visible", opacity: "1", background: "none", border: "0", "box-shadow": "none",
            padding: "8px 2px", margin: "6px 0 0", "min-height": "0", height: "auto" });
          var art = getComputedStyle(a).backgroundImage;
          if ((!art || art === "none") && !a.querySelector("span") && !a.querySelector(".dyn-po-t")) {
            a.innerHTML = "";
            var s1 = document.createElement("span");
            s1.className = "dyn-po-t"; s1.textContent = "Open Product";
            s1.style.cssText = "font:800 19px Georgia,'Times New Roman',serif;letter-spacing:.14em;text-transform:uppercase;color:#17130f;border-bottom:2px solid #17130f;padding-bottom:7px;white-space:nowrap;";
            var s2 = document.createElement("span");
            s2.textContent = "Start customizing";
            s2.style.cssText = "font:600 10.5px Georgia,'Times New Roman',serif;letter-spacing:.3em;text-transform:uppercase;color:rgba(23,19,15,0.72);white-space:nowrap;";
            a.appendChild(s1); a.appendChild(s2);
          }
          /* premium price copy: "$22.00" reads as "FROM $22" */
          var pp = document.querySelector("#dhSlide .dh-slide-inject #pPrice");
          if (pp) {
            var pt = (pp.textContent || "").trim();
            if (pt && !/^from/i.test(pt)) pp.textContent = "From " + pt.replace(/\.00$/, "");
          }
          /* collectible product number above the photo, derived from the URL */
          var prod = document.querySelector("#dhSlide .dh-slide-inject .product");
          if (prod && !prod.querySelector(".dyn-popup-meta")) {
            var hsh = 0, uu = url || "";
            for (var hi = 0; hi < uu.length; hi++) hsh = (hsh * 31 + uu.charCodeAt(hi)) % 997;
            var meta = document.createElement("div");
            meta.className = "dyn-popup-meta";
            meta.textContent = "Dynaeimic \u00b7 Product " + String(hsh + 1).replace(/^(\d)$/, "00$1").replace(/^(\d\d)$/, "0$1");
            prod.insertBefore(meta, prod.firstChild);
          }
          if (tries < 80) setTimeout(stub, 500);
        }
        stub();
      })();
      