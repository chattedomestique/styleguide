/* ==========================================================================
   SG.toolbar: roving focus, radio groups and overflow buttons for .toolbar
   --------------------------------------------------------------------------
   Follows the WAI-ARIA Authoring Practices toolbar pattern
   (https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/):
     · the toolbar is ONE tab stop (roving tabindex); Tab moves on, arrows move inside
     · Left / Right (Right / Left in RTL) move between controls and wrap; Home / End jump
     · Enter and Space press the focused control (a native <button> does that itself)
     · unavailable controls (aria-disabled) stay in the order, so a keyboard user can land on
       "Redo, unavailable" and read why; only a native `disabled` button is skipped
   Markup it reads is documented in src/components/toolbar.css. Hooks are the roles and
   classes, bound by delegation on document; call SG.toolbar.init(listEl) for a toolbar
   you add later (the initial ones are found for you).

   It also does three small jobs that HTML cannot:
     · [data-toggle] on a button flips its aria-pressed (an app with its own state skips this)
     · role="radio" buttons inside role="radiogroup": pressing one sets aria-checked on it and
       clears it on the others (arrow keys move focus only, as in the APG toolbar example)
     · overflow: when .toolbar__list scrolls, the .toolbar__scroll buttons appear and scroll it
       by most of its width; they are aria-disabled at the ends, so focus is not thrown away
       (honours SG.motion.reduced()). They are tabindex -1: arrow keys already scroll the
       focused tool into view, and the toolbar stays a single tab stop.
   ========================================================================== */
(function (SG) {
  'use strict';

  var LIST = '.toolbar__list[role="toolbar"]';

  function items(list) {
    return SG.qsa('.btn', list).filter(function (b) { return !b.disabled && !b.hidden; });
  }

  /** Exactly one control in the list has tabindex 0: the one last used, else the first on one, else the first. */
  function setCurrent(list, el) {
    items(list).forEach(function (b) { b.tabIndex = b === el ? 0 : -1; });
  }

  function init(list) {
    if (!list || list.hasAttribute('data-sg-ready')) return;
    list.setAttribute('data-sg-ready', '');
    var all = items(list);
    var start = list.querySelector('.btn[tabindex="0"]') || list.querySelector('.btn:is([aria-pressed="true"], [aria-checked="true"])') || all[0];
    if (start) setCurrent(list, start);
    measure(list.closest('.toolbar'));
    if (window.ResizeObserver) new ResizeObserver(function () { measure(list.closest('.toolbar')); }).observe(list);
    list.addEventListener('scroll', function () { measure(list.closest('.toolbar')); }, { passive: true });
  }

  /* ---- Keyboard ------------------------------------------------------------------------ */
  document.addEventListener('keydown', function (e) {
    var list = e.target.closest && e.target.closest(LIST);
    if (!list || e.altKey || e.ctrlKey || e.metaKey) return;
    var list_ = items(list);
    var i = list_.indexOf(e.target.closest('.btn'));
    if (i < 0) return;
    var rtl = getComputedStyle(list).direction === 'rtl';
    var to = -1;
    if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) to = (i + 1) % list_.length;
    else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) to = (i - 1 + list_.length) % list_.length;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = list_.length - 1;
    if (to < 0) return;
    e.preventDefault();
    setCurrent(list, list_[to]);
    list_[to].focus();
  });

  // Whatever takes focus (click, tap, script) becomes the tab stop.
  document.addEventListener('focusin', function (e) {
    var list = e.target.closest && e.target.closest(LIST);
    var btn = list && e.target.closest('.btn');
    if (btn && btn.tabIndex !== 0) setCurrent(list, btn);
  });

  /* ---- Toggle buttons: [data-toggle] flips aria-pressed, for pages with no framework ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.toolbar .btn[data-toggle]');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    btn.setAttribute('aria-pressed', String(btn.getAttribute('aria-pressed') !== 'true'));
  });

  /* ---- Radio buttons in a toolbar ------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.toolbar .btn[role="radio"]');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    var group = btn.closest('[role="radiogroup"]');
    if (!group) return;
    SG.qsa('[role="radio"]', group).forEach(function (r) { r.setAttribute('aria-checked', String(r === btn)); });
  });

  /* ---- Overflow: previous / next ------------------------------------------------------------- */
  function measure(bar) {
    if (!bar) return;
    var list = bar.querySelector(LIST);
    var back = bar.querySelector('.toolbar__scroll[data-dir="back"]');
    var fwd = bar.querySelector('.toolbar__scroll[data-dir="forward"]');
    if (!list || !back || !fwd) return;
    var max = list.scrollWidth - list.clientWidth;
    var over = max > 1;
    back.hidden = fwd.hidden = !over;
    // Pointer and touch affordance only: a keyboard user scrolls by arrowing to the next tool, which
    // brings it into view, so the toolbar stays ONE tab stop (APG). They remain in the accessibility tree.
    back.tabIndex = fwd.tabIndex = -1;
    if (!over) return;
    var pos = Math.abs(list.scrollLeft); // distance from the start edge, in either direction
    var atStart = pos <= 1;
    var atEnd = pos >= max - 1;
    setDisabled(back, atStart);
    setDisabled(fwd, atEnd);
  }

  function setDisabled(btn, on) {
    if (on) btn.setAttribute('aria-disabled', 'true'); else btn.removeAttribute('aria-disabled');
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.toolbar__scroll');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    var bar = btn.closest('.toolbar');
    var list = bar.querySelector(LIST);
    var rtl = getComputedStyle(list).direction === 'rtl';
    var dir = (btn.getAttribute('data-dir') === 'forward' ? 1 : -1) * (rtl ? -1 : 1);
    list.scrollBy({ left: dir * list.clientWidth * 0.8, behavior: SG.motion.reduced() ? 'auto' : 'smooth' });
  });

  SG.toolbar = { init: init, measure: measure };

  SG.afterParse(function () { SG.qsa(LIST).forEach(init); });
})((window.SG = window.SG || {}));
