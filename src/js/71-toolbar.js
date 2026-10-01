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
     · overflow: when .toolbar__list scrolls, the .toolbar__scroll buttons appear; they are
       aria-disabled at the ends, so focus is not thrown away. They are tabindex -1: arrow keys
       already scroll the focused tool into view, and the toolbar stays a single tab stop.
     · pages of whole tools: while the list overflows, its cells are cut into pages, each the run
       of whole cells that fits the list. The cells of a page widen evenly (--_spread on each cell)
       until they fill the list, and the page's last cell keeps the room before the next page
       (--_tail: the list's padding on both sides, so even a ring or a shadow of the next page stays
       out of view). The first cell of each page is marked data-sg-page (a snap point, so a swipe
       lands on a page too). A scroll button goes one page (smoothly unless SG.motion.reduced());
       a focused tool's page is brought into view. A tool sliced at the list's edge read as broken
       (a sliver of a circle looks like a stray bracket, "Effe" like a typo), and paging by the
       list's width only landed on whole tools while every cell was the same width. Re-measured
       when the tray or a label changes size and when fonts load, staying on the page in view.
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

  /* ---- Pages of whole tools ------------------------------------------------------------------
     Geometry in scroll coordinates from the start of the list's content, so it holds while scrolled and in
     right-to-left (scrollLeft runs negative there). */
  function geometry(list) {
    var cs = getComputedStyle(list);
    var box = list.getBoundingClientRect(); // not clientWidth, which is rounded to a whole pixel
    var padS = parseFloat(cs.paddingInlineStart) || 0;
    var padE = parseFloat(cs.paddingInlineEnd) || 0;
    return { rtl: cs.direction === 'rtl', box: box, padS: padS, padE: padE, room: box.width - padS - padE, gap: parseFloat(cs.columnGap) || 0, pos: Math.abs(list.scrollLeft) };
  }
  function startOf(el, g) {
    var r = el.getBoundingClientRect();
    return (g.rtl ? g.box.right - r.right : r.left - g.box.left) - g.padS + g.pos;
  }
  function cells(list) {
    return SG.qsa('.toolbar__item', list);
  }
  function pagesOf(list) {
    return cells(list).filter(function (c) { return c.hasAttribute('data-sg-page'); });
  }
  /** The first cell of the page that holds `el` (a cell or anything inside one). */
  function pageOf(list, el) {
    var item = el.closest('.toolbar__item');
    var first = null;
    cells(list).some(function (c) {
      if (c.hasAttribute('data-sg-page')) first = c;
      return c === item;
    });
    return first;
  }
  function current(list) {
    var g = geometry(list);
    var best = null;
    var dist = Infinity;
    pagesOf(list).forEach(function (c) {
      var d = Math.abs(startOf(c, g) - g.pos);
      if (d < dist) { dist = d; best = c; }
    });
    return best;
  }
  function goPage(list, first, behavior) {
    if (!first) return;
    var g = geometry(list);
    var s = Math.max(0, startOf(first, g));
    if (Math.abs(s - g.pos) < 0.5) return;
    list.scrollTo({ left: g.rtl ? -s : s, behavior: behavior || 'auto' });
  }
  function page(bar, step) {
    var list = bar && bar.querySelector(LIST);
    if (!list || !list.hasAttribute('data-sg-paged')) return;
    var pages = pagesOf(list);
    var i = pages.indexOf(current(list));
    goPage(list, pages[Math.min(pages.length - 1, Math.max(0, i + step))], SG.motion.reduced() ? 'auto' : 'smooth');
  }

  function fit(bar) {
    var list = bar && bar.querySelector(LIST);
    if (!list) return;
    var was = list.hasAttribute('data-sg-paged');
    var anchor = was ? current(list) : list.querySelector('.toolbar__item:has(> .btn[role="radio"][aria-checked="true"])');
    cells(list).forEach(function (c) { c.style.removeProperty('--_spread'); c.style.removeProperty('--_tail'); c.removeAttribute('data-sg-page'); });
    list.removeAttribute('data-sg-paged');
    measure(bar);
    var back = bar.querySelector('.toolbar__scroll[data-dir="back"]');
    if (!back || back.hidden) return;
    var g = geometry(list);
    var pages = [];
    var cur = null;
    cells(list).forEach(function (c) {
      var s = startOf(c, g);
      var e = s + c.getBoundingClientRect().width;
      if (cur && e - cur.s <= g.room + 0.5) { cur.cells.push(c); cur.e = e; } else { cur = { s: s, e: e, cells: [c] }; pages.push(cur); }
    });
    var between = g.padS + g.padE - g.gap;
    pages.forEach(function (p, i) {
      p.cells[0].setAttribute('data-sg-page', '');
      var spread = Math.floor((g.room - (p.e - p.s)) / p.cells.length * 100) / 100;
      if (spread > 0) p.cells.forEach(function (c) { c.style.setProperty('--_spread', spread + 'px'); });
      // what the even spread leaves (under a pixel), and between pages the list's padding on both sides
      var tail = Math.ceil((g.room - (p.e - p.s) - Math.max(0, spread) * p.cells.length + (i < pages.length - 1 ? between : 0)) * 100) / 100;
      if (tail > 0) p.cells[p.cells.length - 1].style.setProperty('--_tail', tail + 'px');
    });
    list.setAttribute('data-sg-paged', '');
    measure(bar);
    if (anchor) goPage(list, pageOf(list, anchor), 'auto');
  }
  // a focused tool's page comes into view (the arrow keys move focus from one page to the next)
  document.addEventListener('focusin', function (e) {
    var list = e.target.closest && e.target.closest(LIST);
    if (!list || !list.hasAttribute('data-sg-paged')) return;
    var first = pageOf(list, e.target);
    if (first && first !== current(list)) goPage(list, first, SG.motion.reduced() ? 'auto' : 'smooth');
  });

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
    page(btn.closest('.toolbar'), btn.getAttribute('data-dir') === 'forward' ? 1 : -1);
  });

  SG.toolbar = { init: init, measure: measure, fit: fit, page: page };

  SG.afterParse(function () { SG.qsa(LIST).forEach(init); });
  // a web font that lands late changes every label's width
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', function () {
      SG.qsa(LIST).forEach(function (list) { later(list.closest('.toolbar')); });
    });
  }
})((window.SG = window.SG || {}));
