/* ==========================================================================
   SG.menu: the WAI-ARIA APG "Menu Button" pattern on a popover
   --------------------------------------------------------------------------
     <button class="btn" id="m-btn" aria-haspopup="menu" aria-expanded="false"
             aria-controls="m" popovertarget="m">Deck options</button>
     <div class="menu" id="m" popover role="menu" aria-labelledby="m-btn">
       <button class="menu__item" role="menuitem" type="button">Rename</button>
       <button class="menu__item" role="menuitemradio" aria-checked="true" …>
       <button class="menu__item" role="menuitemcheckbox" aria-checked="false" …>
     </div>
   Button     Enter / Space / ArrowDown opens and focuses the first item; ArrowUp opens on the last.
   Menu       ArrowDown / ArrowUp move and wrap, Home / End jump, a typed letter jumps to the next
              item that starts with it (type several quickly to narrow), Enter / Space activate,
              Esc closes and returns focus to the button, Tab closes and moves on.
   Activating an item closes the menu and returns focus to the button, unless the item or the
   menu has data-keep-open. Checkable items flip aria-checked first (radios: within their
   role="group", else the whole menu). Listen for the result on the menu:
     menu.addEventListener('sg:menu-select', e => e.detail.item / .value / .checked)
   Disabled items use aria-disabled: they stay focusable so people can find out they exist
   (SG.guard already makes them inert).
   data-presentation="sheet" | "auto" turns the menu into an action sheet (see menu.css); "auto"
   does so below 40em.

   Placement, aria-expanded on the button and focus return are shared with the popover card:
   src/js/62-popover.js (load order: this file needs it).

   SG.menu.open(menu, { trigger, focus: 'first' | 'last' })   SG.menu.close(menu)
   ========================================================================== */
(function (SG) {
  'use strict';

  var ITEMS = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

  function popoverOpen(el) {
    try { return el.matches(':popover-open'); } catch (e) { return false; }
  }
  function shown(el) {
    return !!el && el.isConnected && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }
  function isMenu(el) { return !!el && el.nodeType === 1 && el.classList.contains('menu') && el.hasAttribute('popover'); }

  function menuItems(menu) {
    return SG.qsa(ITEMS, menu).filter(function (it) { return !it.hidden && !it.disabled && shown(it); });
  }

  /* ---- Lifecycle, on top of the shared popover plumbing ------------------------------------------ */
  SG.popover.register({
    match: isMenu,
    beforeOpen: function (menu) {
      var pres = menu.getAttribute('data-presentation');
      var asSheet = pres === 'sheet' || (pres === 'auto' && window.matchMedia('(max-width: 39.99em)').matches);
      if (asSheet) menu.setAttribute('data-sheet', ''); else menu.removeAttribute('data-sheet');
      // Roving focus: items are reached with the arrow keys, never with Tab.
      SG.qsa(ITEMS, menu).forEach(function (it) { it.setAttribute('tabindex', '-1'); });
      return asSheet;
    },
    afterOpen: function (menu) { focusItem(menu); },
  });

  function focusItem(menu) {
    // Already moved in (the keyboard path focuses synchronously, this is the async toggle event)?
    if (menu.contains(document.activeElement)) return;
    var items = menuItems(menu);
    if (!items.length) return;
    var target = menu.__sgFocus === 'last' ? items[items.length - 1] : items[0];
    menu.__sgFocus = null;
    target.focus();
  }

  function openMenu(menu, trigger, where) {
    menu.__sgFocus = where || 'first';
    if (popoverOpen(menu)) { focusItem(menu); return; }
    menu.__sgReturn = trigger;
    try { menu.showPopover({ source: trigger }); } catch (e) { try { menu.showPopover(); } catch (err) { /* not connected */ } }
    // The `toggle` event is asynchronous; a keyboard user's next key must already find focus inside.
    if (popoverOpen(menu)) focusItem(menu);
  }

  SG.menu = {
    open: function (menu, opts) {
      var m = typeof menu === 'string' ? document.querySelector(menu) : menu;
      if (m) openMenu(m, (opts && opts.trigger) || SG.popover.triggerFor(m), opts && opts.focus);
      return m;
    },
    close: function (menu) {
      var m = typeof menu === 'string' ? document.querySelector(menu) : menu;
      if (m) SG.popover.hide(m);
    },
  };

  /* ---- Keyboard: the button ------------------------------------------------------------------ */
  var taBuffer = '';
  var taTime = 0;

  function menuFor(trigger) {
    var id = trigger.getAttribute('aria-controls') || trigger.getAttribute('popovertarget') || trigger.getAttribute('commandfor');
    return id ? document.getElementById(id) : null;
  }

  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented) return;
    var t = e.target;
    if (!t.closest) return;

    var trigger = t.closest('[aria-haspopup="menu"]');
    if (trigger && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      var m = menuFor(trigger);
      if (m && isMenu(m)) {
        e.preventDefault();
        openMenu(m, trigger, e.key === 'ArrowUp' ? 'last' : 'first');
      }
      return;
    }

    /* ---- Keyboard: inside the menu ---- */
    var menu = t.closest('.menu[popover]');
    if (menu) menuKey(e, menu);
  });

  function menuKey(e, menu) {
    var items = menuItems(menu);
    var i = items.indexOf(document.activeElement);
    var go = function (n) { if (items[n]) { e.preventDefault(); items[n].focus(); } };
    switch (e.key) {
      case 'ArrowDown': go(i < 0 ? 0 : (i + 1) % items.length); return;
      case 'ArrowUp': go(i < 0 ? items.length - 1 : (i - 1 + items.length) % items.length); return;
      case 'Home': go(0); return;
      case 'End': go(items.length - 1); return;
      case 'Escape':
        e.preventDefault();
        SG.popover.hide(menu);
        return;
      case 'Tab':
        // Close and let Tab carry on from the button, so focus moves to the next control.
        SG.popover.hide(menu);
        return;
      case ' ':
      case 'Enter':
        // Native buttons click themselves. A link with role=menuitem only clicks on Enter.
        if (e.key === ' ' && document.activeElement && document.activeElement.tagName === 'A') {
          e.preventDefault();
          document.activeElement.click();
        }
        return;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(e, items, i);
    }
  }

  /* Type-ahead (APG): letters accumulate for half a second. Repeating one letter cycles through
     the items that start with it. */
  function typeahead(e, items, current) {
    var now = e.timeStamp || Date.now();
    if (now - taTime > 500) taBuffer = '';
    taTime = now;
    taBuffer += e.key.toLowerCase();
    var same = taBuffer.split('').every(function (c) { return c === taBuffer[0]; });
    var query = same ? taBuffer[0] : taBuffer;
    var start = same || taBuffer.length === 1 ? current + 1 : Math.max(current, 0);
    for (var n = 0; n < items.length; n++) {
      var it = items[(start + n) % items.length];
      var label = (it.getAttribute('data-label') || it.textContent).trim().toLowerCase();
      if (label.indexOf(query) === 0) {
        e.preventDefault();
        it.focus();
        return;
      }
    }
  }

  /* ---- Activation ---------------------------------------------------------------------------- */
  var ITEM_IN_MENU = ITEMS.split(', ').map(function (s) { return '.menu[popover] ' + s; }).join(', ');

  document.addEventListener('click', function (e) {
    var item = e.target.closest ? e.target.closest(ITEM_IN_MENU) : null;
    if (!item) return;
    var menu = item.closest('.menu');
    if (item.getAttribute('aria-disabled') === 'true') return;
    var role = item.getAttribute('role');
    if (role === 'menuitemcheckbox') {
      item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
    } else if (role === 'menuitemradio') {
      var group = item.closest('[role="group"]') || menu;
      SG.qsa('[role="menuitemradio"]', group).forEach(function (r) { r.setAttribute('aria-checked', String(r === item)); });
    }
    menu.dispatchEvent(new CustomEvent('sg:menu-select', {
      bubbles: true,
      detail: { item: item, value: item.getAttribute('data-value') != null ? item.getAttribute('data-value') : item.value, checked: item.getAttribute('aria-checked') },
    }));
    if (item.hasAttribute('data-keep-open') || menu.hasAttribute('data-keep-open')) return;
    SG.popover.hide(menu);
  });
})((window.SG = window.SG || {}));
