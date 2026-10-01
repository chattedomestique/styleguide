/* ==========================================================================
   Tabs  (WAI-ARIA Authoring Practices: Tabs)
   --------------------------------------------------------------------------
   Markup and look are in src/components/tabs.css. The HTML is complete without
   this script (the first tab is selected and its panel shown); the script adds:

   - click selects a tab
   - roving tabindex: only the selected tab is in the Tab order (tabindex 0), the rest -1
   - ArrowLeft / ArrowRight (ArrowUp / ArrowDown when aria-orientation="vertical"),
     Home and End move focus between tabs, wrapping, skipping disabled ones. Mirrored in
     right-to-left layouts.
   - AUTOMATIC activation by default: moving focus selects. Put data-activation="manual"
     on .tabs to only move focus and select with Enter / Space.
   - hidden follows selection: inactive panels get the hidden attribute
   - the chosen tab is scrolled into view inside an overflowing tablist
   - an overflowing tablist is marked data-more="start", "end" or "start end" while tabs are scrolled out
     of view on that side, and its optional scroll buttons (.tabs__scroll[data-dir="back|forward"] in the
     same .tabs__bar, written hidden in the markup) are shown while it overflows, aria-disabled at the end
     they cannot go past, and scroll the list by one list's width when pressed (smoothly unless
     SG.motion.reduced()). They are tabindex -1: arrow keys already bring the focused tab into view, and the
     tablist stays one tab stop. They stay in the accessibility tree.
   - whole tabs beside scroll buttons: while such a list overflows, every tab grows by the same amount
     (--_grow on the list) so the tabs that fit at the start fill it exactly. A tab sliced beside the forward
     button read as a stray bracket; the button already says there is more. Re-measured when the list or a
     tab changes size (rotation, text size, fonts). A list without scroll buttons keeps its cut tab: that one
     is the cue, at the scroller's edge.
   - data-hash on .tabs keeps location.hash in step with the chosen panel
     (history.replaceState, so arrow keys do not flood the Back button) and opens the
     panel named by the hash on load and on hashchange, including a hash that points at
     an element INSIDE a panel.

   Events (bubbling CustomEvent on the tab)
     sg:tab   detail { tab, panel, index, previous }

   API
     SG.tabs.select(tabElement)        choose a tab programmatically (moves no focus)
     SG.watchMore(element)             keep data-more current on any horizontally scrolling row (no CSS draws it any more;
                                       it is a hook for an app that wants to)

   Not handled here: adding or removing tabs. Re-run SG.tabs.init(root) after you do.
   ========================================================================== */
(function (SG) {
  'use strict';

  function tabsOf(list) {
    return SG.qsa('[role="tab"]', list).filter(function (t) { return t.closest('[role="tablist"]') === list; });
  }
  function enabled(tab) {
    return !tab.disabled && tab.getAttribute('aria-disabled') !== 'true';
  }
  function panelOf(tab) {
    var id = tab.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  }
  function tabOfPanel(panel, root) {
    return SG.qsa('[role="tab"]', root).filter(function (t) { return t.getAttribute('aria-controls') === panel.id; })[0] || null;
  }

  /** Scroll a horizontally scrolling container just enough that `el` is fully visible, leaving
      `pad` px of its neighbour showing (the "there is more" cue). Browsers do not scroll a
      partly visible element on focus, which would leave a focus ring half cut off. Physical
      deltas, so it is right in RTL too. Shared with the chip row (42-chip.js). */
  SG.revealInline = function (el, scroller, pad) {
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return;
    pad = pad == null ? 24 : pad;
    var t = el.getBoundingClientRect();
    var l = scroller.getBoundingClientRect();
    var delta = 0;
    if (t.left < l.left + pad) delta = t.left - l.left - pad;
    else if (t.right > l.right - pad) delta = t.right - l.right + pad;
    if (delta) scroller.scrollBy({ left: delta, behavior: SG.motion.reduced() ? 'auto' : 'smooth' });
  };
  function reveal(tab, list) {
    // Beside visible scroll buttons the buttons are the cue: bring the tab in just clear of the edge (the list's
    // own padding holds its ring) and leave no sliver of the next one. Otherwise 24px of the neighbour shows.
    var pad = buttonsShown(list) ? parseFloat(getComputedStyle(list).paddingInlineEnd) || 0 : 24;
    SG.revealInline(tab, list, pad);
  }
  function buttonsShown(list) {
    var bar = list.parentElement;
    return !!(bar && bar.classList.contains('tabs__bar') && bar.querySelector(':scope > .tabs__scroll:not([hidden])'));
  }

  /** Which edges of a scrolling horizontal row hide something: data-more="start", "end" or "start end" (absent when
      everything shows). The distance from the start edge is taken as an absolute value, so it is right in
      right-to-left too (scrollLeft goes negative there). tabs.css and chip.css draw the cue from it. */
  function measure(el) {
    var max = el.scrollWidth - el.clientWidth;
    var pos = Math.abs(el.scrollLeft);
    var more = [];
    if (max > 1 && pos > 1) more.push('start');
    if (max > 1 && pos < max - 1) more.push('end');
    if (more.length) el.setAttribute('data-more', more.join(' '));
    else el.removeAttribute('data-more');
    scrollButtons(el, max > 1, more);
  }

  /** The optional scroll buttons beside an overflowing tablist: shown only while it overflows, aria-disabled at
      the end they cannot go past (a disabled button keeps its place, so the row does not jump while scrolling). */
  function scrollButtons(list, over, more) {
    var bar = list.parentElement;
    if (!bar || !bar.classList.contains('tabs__bar')) return;
    SG.qsa(':scope > .tabs__scroll', bar).forEach(function (b) {
      if (b.hidden !== !over) b.hidden = !over;
      b.tabIndex = -1;
      var side = b.getAttribute('data-dir') === 'back' ? 'start' : 'end';
      var stuck = more.indexOf(side) < 0;
      if (stuck) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
    });
  }
  /** Keep data-more current on a scrolling row: now, when the row or one of its children changes size (width, text
      size, fonts), and on scroll. Exported for any scrolling row. Safe to call twice. */
  SG.watchMore = function (el) {
    if (!el || el.hasAttribute('data-sg-watch')) return;
    el.setAttribute('data-sg-watch', '');
    measure(el);
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { measure(el); });
      ro.observe(el);
      Array.prototype.forEach.call(el.children, function (c) { ro.observe(c); });
    }
  };
  function watch(list) {
    if (list.getAttribute('aria-orientation') === 'vertical') return;
    SG.watchMore(list);
    var bar = list.parentElement;
    if (!bar || !bar.classList.contains('tabs__bar') || !bar.querySelector(':scope > .tabs__scroll') || list.hasAttribute('data-sg-whole')) return;
    list.setAttribute('data-sg-whole', '');
    fitWhole(list);
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { later(list); });
      ro.observe(list);
      tabsOf(list).forEach(function (t) { ro.observe(t); });
    }
  }

  /** Whole tabs: with the natural widths, which tabs fit whole from the start of the list? Every tab then grows
      by the same amount so those fill it exactly (scroll coordinates, so it holds while scrolled and in RTL). */
  function fitWhole(list) {
    list.style.removeProperty('--_grow');
    measure(list);
    if (!buttonsShown(list)) return;
    var cs = getComputedStyle(list);
    var rtl = cs.direction === 'rtl';
    var padS = parseFloat(cs.paddingInlineStart) || 0;
    var box = list.getBoundingClientRect();
    // the box, not clientWidth: clientWidth is rounded to a whole pixel, and the 0.1px it drops showed as a hairline
    var room = box.width - padS - (parseFloat(cs.paddingInlineEnd) || 0);
    var pos = Math.abs(list.scrollLeft);
    var n = 0;
    var end = 0;
    tabsOf(list).forEach(function (t) {
      var r = t.getBoundingClientRect();
      var e = (rtl ? box.right - r.left : r.right - box.left) - padS + pos;
      if (e <= room + 0.5 && e > end) { n++; end = e; }
    });
    // a hair more than the exact share: the next tab then starts just past the clipped edge, never 0.2px inside it
    // (an antialiased hairline of its frame read as a stray rule beside the forward button)
    var grow = n ? Math.ceil(((room - end) / n + 0.05) * 100) / 100 : 0;
    if (grow > 0) list.style.setProperty('--_grow', grow + 'px');
    measure(list);
  }
  // one re-fit per list per frame, outside the ResizeObserver callback (it changes the sizes it watches)
  var queued = [];
  function later(list) {
    if (queued.indexOf(list) > -1) return;
    queued.push(list);
    if (queued.length === 1) requestAnimationFrame(function () {
      var lists = queued;
      queued = [];
      lists.forEach(fitWhole);
    });
  }
  // scroll does not bubble, so one capturing listener on the document serves every watched row
  document.addEventListener('scroll', function (e) {
    var t = e.target;
    if (t && t.nodeType === 1 && t.hasAttribute('data-sg-watch')) measure(t);
  }, { capture: true, passive: true });

  function syncHash(tab) {
    var root = tab.closest('.tabs');
    var panel = panelOf(tab);
    if (!root || !root.hasAttribute('data-hash') || !panel || !panel.id) return;
    try { history.replaceState(history.state, '', '#' + panel.id); } catch (e) { /* file:// or sandbox: ignore */ }
  }

  /** Make `tab` the selected one of its list.
      opts.silent   nothing but the state change: no event, no animation, no hash write (first paint)
      opts.noHash   fire the event but leave location.hash alone (the hash caused this change) */
  function select(tab, opts) {
    opts = opts || {};
    var list = tab.closest('[role="tablist"]');
    if (!list || !enabled(tab)) return;
    var tabs = tabsOf(list);
    var previous = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || null;
    var changed = previous !== tab;
    var chosenPanel = null;
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var p = panelOf(t);
      if (p) {
        p.hidden = !on;
        if (on) chosenPanel = p;
      }
    });
    reveal(tab, list);
    if (chosenPanel && changed && !opts.silent) {
      // One animation cycle of fade; removed afterwards so it can fire again next time.
      chosenPanel.setAttribute('data-enter', '');
      var done = function () { chosenPanel.removeAttribute('data-enter'); };
      chosenPanel.addEventListener('animationend', done, { once: true });
      window.setTimeout(done, 600);
    }
    if (opts.silent || !changed) return;
    if (!opts.noHash) syncHash(tab);
    tab.dispatchEvent(new CustomEvent('sg:tab', {
      bubbles: true,
      detail: { tab: tab, panel: chosenPanel, index: tabs.indexOf(tab), previous: previous },
    }));
  }

  /** Bring one .tabs root to a consistent state: one selected tab, roving tabindex, hidden panels, ids. */
  function init(scope) {
    SG.qsa('.tabs', scope || document).forEach(function (root) {
      SG.qsa('[role="tablist"]', root).forEach(function (list) {
        var tabs = tabsOf(list);
        if (!tabs.length) return;
        // Wire ids the author left out, so a minimal markup is still valid ARIA.
        var panels = SG.qsa('[role="tabpanel"]', root);
        tabs.forEach(function (t, i) {
          if (!t.id) t.id = SG.uid('sg-tab');
          if (!t.hasAttribute('aria-controls') && panels[i]) {
            if (!panels[i].id) panels[i].id = SG.uid('sg-panel');
            t.setAttribute('aria-controls', panels[i].id);
          }
          var p = panelOf(t);
          if (p && !p.hasAttribute('aria-labelledby')) p.setAttribute('aria-labelledby', t.id);
          if (t.tagName === 'BUTTON' && !t.hasAttribute('type')) t.setAttribute('type', 'button');
        });
        var chosen = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true' && enabled(t); })[0]
          || tabs.filter(enabled)[0];
        if (chosen) select(chosen, { silent: true });
        watch(list);
      });
    });
  }

  /** A hash may name a tab, a panel, or anything inside a panel of a .tabs[data-hash]. */
  function fromHash() {
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    var root = el.closest('.tabs[data-hash]');
    if (!root) return;
    var tab = el.getAttribute('role') === 'tab' ? el : null;
    var panel = el.closest('[role="tabpanel"]');
    if (!tab && panel) tab = tabOfPanel(panel, root);
    if (!tab || !enabled(tab)) return;
    select(tab, { noHash: true });
    if (el !== tab && el !== panel) el.scrollIntoView({ block: 'start', behavior: 'auto' }); // it was hidden when the browser tried
  }

  document.addEventListener('click', function (e) {
    var tab = e.target.closest && e.target.closest('.tabs [role="tab"]');
    if (tab) select(tab);
    var btn = e.target.closest && e.target.closest('.tabs__bar > .tabs__scroll');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    var list = btn.parentElement.querySelector(':scope > [role="tablist"]');
    if (!list) return;
    var cs = getComputedStyle(list);
    var dir = (btn.getAttribute('data-dir') === 'back' ? -1 : 1) * (cs.direction === 'rtl' ? -1 : 1);
    // one list's width (inside its padding) and one gap: the next whole tabs start where the list starts
    var page = list.getBoundingClientRect().width - (parseFloat(cs.paddingInlineStart) || 0) - (parseFloat(cs.paddingInlineEnd) || 0) + (parseFloat(cs.columnGap) || 0);
    list.scrollBy({ left: dir * page, behavior: SG.motion.reduced() ? 'auto' : 'smooth' });
  });

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var tab = e.target.closest && e.target.closest('.tabs [role="tab"]');
    if (!tab) return;
    var list = tab.closest('[role="tablist"]');
    if (!list) return;
    var vertical = list.getAttribute('aria-orientation') === 'vertical';
    var target = SG.roving(tabsOf(list).filter(enabled), tab, e.key, { orientation: vertical ? 'vertical' : 'horizontal' });
    if (!target) return;
    e.preventDefault();
    var root = tab.closest('.tabs');
    if (!root || root.getAttribute('data-activation') !== 'manual') select(target);
    else reveal(target, list);
  });

  window.addEventListener('hashchange', fromHash);

  SG.tabs = { select: select, init: init };

  SG.ready(function () {
    init(document);
    fromHash();
  });
})((window.SG = window.SG || {}));
