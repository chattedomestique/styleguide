/* sheet-scheme.js — the style-sheet pages' stored scheme, before the first paint.
   Loaded in the head, ahead of the CSS, so a viewer who chose Light or Dark never sees
   the other flash first. sheet.js draws the switch and owns the choice; this only reads
   it. Storage can be missing or throw; then the page follows the system. Not shipped. */
(function () {
  try {
    var v = window.localStorage.getItem("flashcards-sheet-scheme");
    if (v === "light" || v === "dark") document.documentElement.setAttribute("data-scheme", v);
  } catch (e) { /* the system's scheme */ }
})();
