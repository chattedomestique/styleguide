/* ==========================================================================
   dialog.js — opens a modal from its button, and gives focus back.
   Spec: elements/dialog.md (Sheet uses it too: elements/sheet.md)
   --------------------------------------------------------------------------
   The markup is the standard, invoker commands:

     <button type="button" commandfor="delete-shapes" command="show-modal">…</button>

   A browser that has them opens the dialog with no script at all. This
   file does two small things on top:

   1. Where the browser doesn't know commandfor yet, a click on such a
      button calls showModal() itself.
   2. When the dialog closes, the browser puts focus back where it was. A
      clicked button doesn't take focus in Safari, so there "where it was"
      is nowhere and focus falls to the page. Then this puts it back on
      the button that opened the dialog, if that button is still there.

   Closing needs nothing: <form method="dialog"> and Escape are native.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.HTMLDialogElement) return;
  var native = "command" in HTMLButtonElement.prototype;
  var openers = new WeakMap();

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest('button[commandfor][command="show-modal"]');
    if (!btn) return;
    var dialog = document.getElementById(btn.getAttribute("commandfor"));
    if (!dialog || dialog.localName !== "dialog") return;
    openers.set(dialog, btn);
    if (!native && !dialog.open) dialog.showModal();
  });

  // close doesn't bubble: listen on the way down. Lost focus is still on
  // the hidden button inside the dialog at this point, or already on body.
  document.addEventListener("close", function (e) {
    var btn = openers.get(e.target);
    if (!btn) return;
    openers.delete(e.target);
    var now = document.activeElement;
    var lost = !now || now === document.body || e.target.contains(now);
    if (lost && btn.isConnected) btn.focus();
  }, true);
})();
