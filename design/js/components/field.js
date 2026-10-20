/* ==========================================================================
   Field — the search field's clear button. Spec: elements/field.md

   It shows only while the field has text. Pressed, it puts focus back in
   the input, empties it and fires `input`, so a filtered list updates and
   the button hides without dropping focus on the page.
   ========================================================================== */
(function () {
  "use strict";
  document.querySelectorAll(".field__box").forEach(function (box) {
    var input = box.querySelector(".field__input");
    var clear = box.querySelector(".field__clear");
    if (!input || !clear) return;
    function sync() {
      clear.hidden = input.value === "";
    }
    input.addEventListener("input", sync);
    clear.addEventListener("click", function () {
      input.focus();
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    sync();
  });
})();
