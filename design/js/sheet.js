/* ==========================================================================
   sheet.js — the style-sheet pages' own behaviour. Not shipped to apps.

   0. The scheme switch (Auto, Light, Dark) and the direction switch (LTR,
      RTL) in the top bar.
   1. Prints each specimen's markup under it, read from the live element.
   2. Computes the colour swatches' contrast from whatever the tokens say.
   Also: the iOS :active listener, and demo links that don't jump.
   ========================================================================== */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");

  /* ---- 0. the scheme: Auto follows the system; Light or Dark forces it
     with data-scheme on :root (tokens/color.css). Remembered for this viewer
     only; storage can be missing or throw (private windows, blocked site
     data), and then the page simply starts on Auto. ------------------- */
  var SCHEME_KEY = "flashcards-sheet-scheme";
  var SCHEMES = [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]];
  function storedScheme() {
    var v = null;
    try { v = window.localStorage.getItem(SCHEME_KEY); } catch (e) { v = null; }
    return v === "light" || v === "dark" ? v : "auto";
  }
  function storeScheme(v) {
    try {
      if (v === "auto") window.localStorage.removeItem(SCHEME_KEY);
      else window.localStorage.setItem(SCHEME_KEY, v);
    } catch (e) { /* not remembered, still applied */ }
  }
  function applyScheme(v) {
    if (v === "light" || v === "dark") root.setAttribute("data-scheme", v);
    else root.removeAttribute("data-scheme");
  }
  var scheme = storedScheme();
  applyScheme(scheme); // first, so the page paints in it

  /* ---- 0b. the direction: LTR, or RTL, which puts dir="rtl" on <html> so
     the whole page, the bar included, runs right to left. The specimens'
     copy stays English: the point is the layout. Remembered the same way;
     js/sheet-scheme.js sets it in the head, before the first paint. ---- */
  var DIR_KEY = "flashcards-sheet-dir";
  var DIRS = [["ltr", "LTR"], ["rtl", "RTL"]];
  function storedDir() {
    var v = null;
    try { v = window.localStorage.getItem(DIR_KEY); } catch (e) { v = null; }
    return v === "rtl" ? "rtl" : "ltr";
  }
  function storeDir(v) {
    try {
      if (v === "rtl") window.localStorage.setItem(DIR_KEY, v);
      else window.localStorage.removeItem(DIR_KEY);
    } catch (e) { /* not remembered, still applied */ }
  }
  function applyDir(v) {
    if (v === "rtl") root.setAttribute("dir", "rtl");
    else root.removeAttribute("dir");
  }
  var dir = storedDir();
  applyDir(dir);

  // A real radio group, the text-size switch's pattern: one tab stop, arrows
  // move the choice, the group's name comes from its legend.
  function choice(bar, cls, name, title, options, current, change) {
    var set = document.createElement("fieldset");
    set.className = "sg-ctl " + cls;
    var legend = document.createElement("legend");
    legend.className = "sr-only";
    legend.textContent = title;
    var seg = document.createElement("div");
    seg.className = "sg-seg";
    options.forEach(function (o) {
      var label = document.createElement("label");
      var input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.value = o[0];
      input.checked = o[0] === current;
      label.appendChild(input);
      label.appendChild(document.createTextNode(o[1]));
      seg.appendChild(label);
    });
    seg.addEventListener("change", function (e) { change(e.target.value); });
    set.appendChild(legend);
    set.appendChild(seg);
    bar.appendChild(set);
  }
  var bar = document.querySelector(".sg-top__in");
  if (bar) {
    choice(bar, "sg-scheme", "sg-scheme", "Colour scheme", SCHEMES, scheme, function (v) {
      applyScheme(v);
      storeScheme(v);
      ratios();
    });
    choice(bar, "sg-dir", "sg-dir", "Direction", DIRS, dir, function (v) {
      applyDir(v);
      storeDir(v);
    });
  }

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
  // Each swatch reads its own computed colours, so a pane forced with
  // data-scheme reports that scheme. Run again when the scheme or the
  // contrast preference changes.
  function ratios() {
    Array.prototype.forEach.call(document.querySelectorAll(".sg-swatch"), function (el) {
      var cs = getComputedStyle(el);
      var a = lum(rgb(cs.backgroundColor));
      var b = lum(rgb(cs.color));
      var r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      el.querySelector(".sg-swatch__ratio").textContent =
        r.toFixed(1) + ":1 " + (r >= 7 ? "AAA" : r >= 4.5 ? "AA" : "FAIL");
    });
  }
  ratios();
  ["(prefers-contrast: more)", "(prefers-color-scheme: dark)"].forEach(function (q) {
    var mq = window.matchMedia && window.matchMedia(q);
    if (mq && mq.addEventListener) mq.addEventListener("change", ratios);
    else if (mq && mq.addListener) mq.addListener(ratios);
  });
})();
