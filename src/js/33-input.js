/* ==========================================================================
   SG input helpers: clear button, show / hide password
   --------------------------------------------------------------------------
   Enhancements for .input-group (components/input.css). Both controls are real
   <button>s with a fixed text name. The field itself works without this file; with
   scripting off, CSS (@media (scripting: none)) hides both buttons instead of leaving
   dead controls on the page.

     <button class="input-group__btn" type="button" data-sg-clear aria-label="Clear search" hidden>…</button>
        Empties the input, fires "input", returns focus to it. Shown only while the
        input has a value (the hidden attribute is managed here).

     <button class="input-group__btn" type="button" data-sg-reveal aria-label="Show password" aria-pressed="false">…</button>
        Switches the sibling input between type="password" and type="text".
        The NAME never changes (a pressed toggle keeps its label, APG "toggle button");
        aria-pressed and the eye icon carry the state. Focus stays on the button and
        the caret position in the input is preserved.

   Both find their input as the .input inside the same .input-group.
   ========================================================================== */
(function (SG) {
  'use strict';

  function inputOf(btn) {
    var group = btn.closest('.input-group');
    return group ? group.querySelector('.input') : null;
  }

  function syncClear(btn) {
    var input = inputOf(btn);
    if (input) btn.hidden = input.value === '' || input.disabled || input.readOnly;
  }

  function syncAll(root) {
    SG.qsa('[data-sg-clear]', root || document).forEach(syncClear);
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-sg-clear], [data-sg-reveal]') : null;
    if (!t) return;
    var input = inputOf(t);
    if (!input) return;

    if (t.hasAttribute('data-sg-clear')) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      syncClear(t);
      input.focus();
      return;
    }

    // reveal
    var show = t.getAttribute('aria-pressed') !== 'true';
    var start = input.selectionStart;
    var end = input.selectionEnd;
    input.type = show ? 'text' : 'password';
    try { input.setSelectionRange(start, end); } catch (err) { /* some types have no selection */ }
    t.setAttribute('aria-pressed', String(show));
  });

  document.addEventListener('input', function (e) {
    var group = e.target.closest ? e.target.closest('.input-group') : null;
    if (group) SG.qsa('[data-sg-clear]', group).forEach(syncClear);
  });

  SG.inputs = { sync: syncAll };

  // One frame after load (see 30-field.js for why), still before first paint.
  SG.ready(function () { window.requestAnimationFrame(function () { syncAll(document); }); });
})((window.SG = window.SG || {}));
