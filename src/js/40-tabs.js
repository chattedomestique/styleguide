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
   - data-hash on .tabs keeps location.hash in step with the chosen panel
     (history.replaceState, so arrow keys do not flood the Back button) and opens the
     panel named by the hash on load and on hashchange, including a hash that points at
     an element INSIDE a panel.

   Events (bubbling CustomEvent on the tab)
     sg:tab   detail { tab, panel, index, previous }

   API
     SG.tabs.select(tabElement)        choose a tab programmatically (moves no focus)

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
    SG.revealInline(tab, list, 24);
  }

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
