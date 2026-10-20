/* sheet-scheme.js — the style-sheet pages' stored scheme and direction, before the first
   paint. Loaded in the head, ahead of the CSS, so a viewer who chose Light or Dark, or RTL,
   never sees the other flash first. sheet.js draws both switches and owns the choice; this
   only reads it. Storage can be missing or throw; then the page follows the system's scheme
   and runs left to right. Not shipped. */
(function () {
  var root = document.documentElement;
  try {
    var v = window.localStorage.getItem("flashcards-sheet-scheme");
    if (v === "light" || v === "dark") root.setAttribute("data-scheme", v);
    if (window.localStorage.getItem("flashcards-sheet-dir") === "rtl") root.setAttribute("dir", "rtl");
  } catch (e) { /* the system's scheme, left to right */ }
})();
