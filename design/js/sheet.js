/* ==========================================================================
   sheet.js — the style-sheet pages' own behaviour. Not shipped to apps.

   1. Prints each specimen's markup under it, read from the live element.
   2. Computes the tone swatches' contrast from whatever the tokens say.
   Also: the iOS :active listener, and demo links that don't jump.
   ========================================================================== */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  // iOS Safari only applies :active when a touchstart listener exists.
  document.addEventListener("touchstart", function () {}, { passive: true });

  // Demo links must not jump the page.
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href="#"]');
    if (a) e.preventDefault();
  });

  /* ---- 1. markup, read from the live specimens --------------------- */
  var INLINE = /^(a|span|strong|em|b|i|small|code|kbd|abbr|time|sub|sup|mark)$/;
  var VOID = /^(img|br|hr|input|source|wbr)$/;

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function attrs(el) {
    return Array.prototype.map
      .call(el.attributes, function (a) {
        if (a.name === "data-n" || a.name.indexOf("data-sg") === 0) return "";
        if (a.value === "") return " " + a.name;
        return " " + a.name + '="' + a.value.replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '"';
      })
      .join("");
  }
  function inlineOnly(el) {
    return Array.prototype.every.call(el.childNodes, function (n) {
      return n.nodeType === 3 || (n.nodeType === 1 && INLINE.test(n.localName) && inlineOnly(n));
    });
  }
  function inline(n) {
    if (n.nodeType === 3) return esc(n.textContent.replace(/\s+/g, " "));
    if (n.nodeType !== 1) return "";
    var t = n.localName;
    if (VOID.test(t)) return "<" + t + attrs(n) + ">";
    return (
      "<" + t + attrs(n) + ">" +
      Array.prototype.map.call(n.childNodes, inline).join("") +
      "</" + t + ">"
    );
  }
  function fmt(n, d) {
    var pad = new Array(d + 1).join("  ");
    if (n.nodeType === 3) {
      var s = n.textContent.replace(/\s+/g, " ").trim();
      return s ? pad + esc(s) + "\n" : "";
    }
    if (n.nodeType !== 1) return "";
    var t = n.localName;
    if (VOID.test(t)) return pad + "<" + t + attrs(n) + ">\n";
    if (inlineOnly(n)) {
      var inner = Array.prototype.map.call(n.childNodes, inline).join("").replace(/\s+/g, " ").trim();
      return pad + "<" + t + attrs(n) + ">" + inner + "</" + t + ">\n";
    }
    var kids = Array.prototype.map.call(n.childNodes, function (k) { return fmt(k, d + 1); }).join("");
    return pad + "<" + t + attrs(n) + ">\n" + kids + pad + "</" + t + ">\n";
  }

  Array.prototype.forEach.call(document.querySelectorAll(".sg-entry"), function (entry) {
    var specs = entry.querySelectorAll("[data-sg-code]");
    if (!specs.length) return;
    var text = Array.prototype.map
      .call(specs, function (el) { return fmt(el, 0).replace(/\s+$/, ""); })
      .join("\n\n");
    var box = document.createElement("details");
    box.className = "sg-markup";
    var sum = document.createElement("summary");
    sum.textContent = "Markup";
    var pre = document.createElement("pre");
    var code = document.createElement("code");
    code.textContent = text;
    pre.appendChild(code);
    box.appendChild(sum);
    box.appendChild(pre);
    entry.appendChild(box);
  });

  /* ---- 2. contrast, read live from whatever the tokens say ---------- */
  var cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  var cx = cv.getContext("2d", { willReadFrequently: true });
  function rgb(c) {
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = "#000";
    cx.fillStyle = c;
    cx.fillRect(0, 0, 1, 1);
    var d = cx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  }
  function lum(c) {
    var w = [0.2126, 0.7152, 0.0722];
    return c.reduce(function (s, v, i) {
      v /= 255;
      v = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      return s + v * w[i];
    }, 0);
  }
  Array.prototype.forEach.call(document.querySelectorAll(".sg-swatch"), function (el) {
    var cs = getComputedStyle(el);
    var a = lum(rgb(cs.backgroundColor));
    var b = lum(rgb(cs.color));
    var r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    el.querySelector(".sg-swatch__ratio").textContent =
      r.toFixed(1) + ":1 " + (r >= 7 ? "AAA" : r >= 4.5 ? "AA" : "FAIL");
  });
})();
