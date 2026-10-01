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

   It also does four small jobs that HTML cannot:
     · [data-toggle] on a button flips its aria-pressed (an app with its own state skips this)
     · role="radio" buttons inside role="radiogroup": pressing one sets aria-checked on it and
       clears it on the others (arrow keys move focus only, as in the APG toolbar example)
     · overflow: when .toolbar__list scrolls, the .toolbar__scroll buttons appear and scroll it
       by one list's width (the next whole tools); they are aria-disabled at the ends, so focus is
       not thrown away (honours SG.motion.reduced()). They are tabindex -1: arrow keys already
       scroll the focused tool into view, and the toolbar stays a single tab stop.
     · whole tools: while the list scrolls, every cell grows by the same amount (--_grow on the
       list) so the tools that fit at the start fill it exactly. A tool sliced at the list's edge
       read as broken (a sliver of a circle looks like a stray bracket); the forward button already
       says there are more. Re-measured when the tray or a label changes size and when fonts load.
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
    var bar = list.closest('.toolbar');
    fit(bar);
    // the tray (a rotation, a resize) and every cell (the reader's text size: the labels grow, the tray does not)
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { later(bar); });
      ro.observe(bar || list);
      SG.qsa('.toolbar__item', list).forEach(function (item) { ro.observe(item); });
    }
    list.addEventListener('scroll', function () { measure(bar); }, { passive: true });
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

  /* ---- Whole tools ------------------------------------------------------------------------- */
  function fit(bar) {
    var list = bar && bar.querySelector(LIST);
    if (!list) return;
    list.style.removeProperty('--_grow');
    measure(bar);
    var back = bar.querySelector('.toolbar__scroll[data-dir="back"]');
    if (!back || back.hidden) return;
    var rtl = getComputedStyle(list).direction === 'rtl';
    var box = list.getBoundingClientRect();
    var pos = Math.abs(list.scrollLeft);
    var room = box.width; // the list has no inline padding (the cells pad their circles); not clientWidth, which is rounded
    var n = 0;
    var end = 0;
    // the cells that fit whole from the start of the list (in scroll coordinates, either direction)
    SG.qsa('.toolbar__item', list).forEach(function (item) {
      var r = item.getBoundingClientRect();
      var e = (rtl ? box.right - r.left : r.right - box.left) + pos;
      if (e <= room + 0.5 && e > end) { n++; end = e; }
    });
    // a hair more than the exact share is harmless (a cell's edge is empty space) and never leaves a gap at the end
    var grow = n ? Math.ceil(((room - end) / n + 0.05) * 100) / 100 : 0;
    if (grow > 0) list.style.setProperty('--_grow', grow + 'px');
    measure(bar);
  }

  // one re-fit per tray per frame, outside the ResizeObserver callback (it changes the sizes it watches)
  var queued = [];
  function later(bar) {
    if (!bar || queued.indexOf(bar) > -1) return;
    queued.push(bar);
    if (queued.length === 1) requestAnimationFrame(function () {
      var bars = queued;
      queued = [];
      bars.forEach(fit);
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.toolbar__scroll');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    var bar = btn.closest('.toolbar');
    var list = bar.querySelector(LIST);
    var rtl = getComputedStyle(list).direction === 'rtl';
    var dir = (btn.getAttribute('data-dir') === 'forward' ? 1 : -1) * (rtl ? -1 : 1);
    // one list's width and one gap: the next whole tools start where the list starts
    var page = list.getBoundingClientRect().width + (parseFloat(getComputedStyle(list).columnGap) || 0);
    list.scrollBy({ left: dir * page, behavior: SG.motion.reduced() ? 'auto' : 'smooth' });
  });

  SG.toolbar = { init: init, measure: measure, fit: fit };

  SG.afterParse(function () { SG.qsa(LIST).forEach(init); });
  // a web font that lands late changes every label's width
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', function () {
      SG.qsa(LIST).forEach(function (list) { later(list.closest('.toolbar')); });
    });
  }
})((window.SG = window.SG || {}));
