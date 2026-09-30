/* ==========================================================================
   SG.dismiss: close something that can be closed, without losing the user's place
   --------------------------------------------------------------------------
     <div class="alert" data-dismissible> … <button data-sg-dismiss aria-label="Dismiss">…</button> </div>
     <button data-sg-dismiss="#promo">Hide</button>            target by selector
     SG.dismiss(el)                                            from script

   Hides the element (the `hidden` attribute, so it leaves the accessibility tree and
   can be shown again by removing it) and fires a cancelable, bubbling 'sg:dismiss'
   event first. The dismiss button is found by [data-sg-dismiss]; its target is the
   selector in the attribute, else the closest [data-dismissible], else the closest
   .alert.

   THE REASON THIS IS NOT ONE LINE: when you hide the element that holds keyboard
   focus, focus falls back to <body> and a keyboard or screen-reader user starts again
   from the top of the page (WCAG 2.4.3). If focus is inside the thing being dismissed,
   it moves to the next focusable element after it, or the previous one if there is no
   next. Screen-reader users hear the new target; nothing needs announcing.

   Removing instead of hiding:  SG.dismiss(el, { remove: true })
   ========================================================================== */
(function (SG) {
  'use strict';

  var TABBABLE = 'a[href],button,input,select,textarea,summary,[tabindex],[contenteditable="true"]';

  function isTabbable(n) {
    if (n.disabled || n.getAttribute('tabindex') === '-1' || n.closest('[inert],[hidden]')) return false;
    if (n.tagName === 'INPUT' && n.type === 'hidden') return false;
    if (n.getAttribute('aria-disabled') === 'true') return true; // focusable by design (see guard)
    return n.getClientRects().length > 0 && getComputedStyle(n).visibility !== 'hidden';
  }

  /** The focusable element that should receive focus when `el` goes away. */
  function neighbour(el) {
    var candidates = SG.qsa(TABBABLE).filter(function (n) { return !el.contains(n) && isTabbable(n); });
    var after = null;
    var before = null;
    candidates.forEach(function (n) {
      var pos = el.compareDocumentPosition(n);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING && !(pos & Node.DOCUMENT_POSITION_CONTAINED_BY) && !after) after = n;
      else if (pos & Node.DOCUMENT_POSITION_PRECEDING && !(pos & Node.DOCUMENT_POSITION_CONTAINS)) before = n;
    });
    return after || before;
  }

  SG.dismiss = function (el, opts) {
    if (!el || el.hidden) return false;
    var ev = new CustomEvent('sg:dismiss', { bubbles: true, cancelable: true });
    if (!el.dispatchEvent(ev)) return false;
    var target = el.contains(document.activeElement) ? neighbour(el) : null;
    if (opts && opts.remove) el.parentNode && el.parentNode.removeChild(el);
    else el.hidden = true;
    if (target) target.focus();
    return true;
  };

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-sg-dismiss]') : null;
    if (!btn) return;
    var sel = btn.getAttribute('data-sg-dismiss');
    var target = sel ? document.querySelector(sel) : btn.closest('[data-dismissible], .alert');
    if (target) SG.dismiss(target);
  });
})((window.SG = window.SG || {}));
