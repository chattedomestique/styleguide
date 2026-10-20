/* ==========================================================================
   Checkbox — "select all" and its mixed state. Spec: elements/checkbox.md

   A checkbox whose aria-controls lists other checkboxes' ids controls them:
   checking it checks them all, clearing it clears them, and while only some
   are checked it shows mixed. `indeterminate` exists only in script.
   ========================================================================== */
(function () {
  "use strict";
  document.querySelectorAll('input[type="checkbox"][aria-controls]').forEach(function (all) {
    var kids = all
      .getAttribute("aria-controls")
      .split(/\s+/)
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);
    if (!kids.length) return;
    function sync() {
      var n = kids.filter(function (k) {
        return k.checked;
      }).length;
      all.checked = n === kids.length;
      all.indeterminate = n > 0 && n < kids.length;
    }
    all.addEventListener("change", function () {
      kids.forEach(function (k) {
        k.checked = all.checked;
      });
    });
    kids.forEach(function (k) {
      k.addEventListener("change", sync);
    });
    sync();
  });
})();
