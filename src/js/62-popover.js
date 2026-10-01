/* ==========================================================================
   SG.anchor and SG.popover: placement and lifecycle for popovers, menus, tooltips
   --------------------------------------------------------------------------
   POPOVER  (native popover="auto" as the container, role="dialog", non-modal)
     <button class="btn" popovertarget="p" aria-haspopup="dialog" aria-expanded="false">Help</button>
     <div class="popover card" id="p" popover role="dialog" aria-labelledby="p-t"> … </div>
   On open, focus goes to [autofocus], then the first control, then the popover itself
   (tabindex="-1") so a screen reader reads a text-only popover. Esc and a click outside
   close it (native); so does moving focus to another control. Focus returns to the button.
   aria-expanded on the button follows the popover. Nothing is changed in the DOM until a
   popover opens, so the docs "Markup" samples stay clean.

   SG.anchor   the shared placement logic (also used by the menu and the tooltip)
     SG.anchor.attach(popover, trigger)   marks the popover data-anchored and either names the
                                          anchor (CSS anchor positioning) or flags data-anchor-js
     SG.anchor.place(popover)             JS fallback: write inset-inline-start / inset-block-start
                                          next to the trigger, in the order popover.css tries places,
                                          never over the trigger, clear of the gutters, the app bar and
                                          the dock (read from the popover's scroll-margin). No-op when native.
     SG.anchor.release(popover)           stop tracking a JS-placed popover
     SG.anchor.verify(popover)            safety net: if a natively placed popover still runs off the screen,
                                          under the sticky chrome or over its trigger, place it with the
                                          script (called after every open)
     SG.anchor.native                     true when CSS anchor positioning is available
     SG.anchor.forceJs                    set true to use the fallback everywhere (tests, old WebViews)

   SG.popover  plumbing for the menu (63-menu.js) on the same lifecycle
     SG.popover.register({ match(el), beforeOpen(el) -> asSheet, afterOpen(el) })
     SG.popover.triggerFor(el, source)    which button opened it
     SG.popover.hide(el)                  close now, fix aria-expanded, give focus back
   ========================================================================== */
(function (SG) {
  'use strict';

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
  var MARGIN = 8; // px kept between a fallback-placed popover and the screen edge
  var GAP = 8;

  function popoverOpen(el) {
    try { return el.matches(':popover-open'); } catch (e) { return false; }
  }
  function shown(el) {
    return !!el && el.isConnected && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }
  function esc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'); }

  /* ---- Anchor -------------------------------------------------------------------------- */
  var seq = 0;
  var placedNow = []; // JS-placed popovers that are open, re-placed on scroll / resize
  var A = {
    native: !!(window.CSS && CSS.supports && CSS.supports('position-area', 'block-end') && CSS.supports('anchor-name', '--a')),
    forceJs: false,
  };

  A.attach = function (pop, trigger) {
    if (!trigger) return false;
    pop.__sgTrigger = trigger;
    pop.setAttribute('data-anchored', '');
    if (A.native && !A.forceJs) {
      pop.removeAttribute('data-anchor-js');
      pop.removeAttribute('data-placed');
      // One anchor name per popover; a trigger may anchor several (a menu and a tooltip).
      var name = pop.__sgAnchor || (pop.__sgAnchor = '--sg-a' + (++seq));
      var list = trigger.__sgAnchors || (trigger.__sgAnchors = []);
      if (list.indexOf(name) < 0) list.push(name);
      trigger.style.setProperty('anchor-name', list.join(', '));
      pop.style.setProperty('position-anchor', name);
    } else {
      pop.setAttribute('data-anchor-js', '');
    }
    return true;
  };

  A.detach = function (pop) {
    pop.removeAttribute('data-anchored');
    pop.removeAttribute('data-anchor-js');
    pop.removeAttribute('data-placed');
    pop.style.removeProperty('position-anchor');
    pop.style.removeProperty('inset-inline-start');
    pop.style.removeProperty('inset-block-start');
    pop.style.removeProperty('max-block-size');
  };

  /** The room a placed popover keeps free, in px: the gutter at the sides, and the sticky app bar and the
      dock (each plus the 8px gap) at the top and the bottom. popover.css resolves them as the popover's own
      scroll-margin, so the script and the CSS fallbacks keep the same distances. */
  function keep(pop) {
    var cs = getComputedStyle(pop);
    return {
      side: Math.max(MARGIN, parseFloat(cs.scrollMarginLeft) || 0),
      top: Math.max(MARGIN, parseFloat(cs.scrollMarginTop) || 0),
      bottom: Math.max(MARGIN, parseFloat(cs.scrollMarginBottom) || 0),
    };
  }

  function covers(a, b) {
    return a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
  }

  /** A SAFETY NET for CSS anchor positioning. If an open, natively placed popover still runs into the
      gutter, under the sticky chrome, or over its own trigger (nothing in its five fallbacks fits, for
      example a card taller than either side of its button at 200% text), place it with the script
      instead: same gaps, and capped to the larger side so its body scrolls. */
  A.verify = function (pop) {
    if (!pop.hasAttribute('data-anchored') || pop.hasAttribute('data-anchor-js') || !popoverOpen(pop)) return;
    var r = pop.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;
    var k = keep(pop);
    var slack = 12; // the entry settles downwards by a few px; do not mistake that for overflow at the bottom
    var t = pop.__sgTrigger && pop.__sgTrigger.getBoundingClientRect();
    if (r.left >= k.side - 1 && r.right <= vw - k.side + 1 && r.top >= k.top - GAP - 1 && r.bottom <= vh - k.bottom + GAP + slack && !(t && covers(r, t))) return;
    pop.removeAttribute('data-placed');
    pop.setAttribute('data-anchor-js', '');
    pop.style.removeProperty('position-anchor');
    A.place(pop);
  };

  /** Fallback placement. Physical coordinates are computed from logical placement names, tried in the
      order popover.css tries them: the asked-for place, the opposite side, the edge-aligned places, centred.
      A side placement (start, end) goes below or above when neither side has room. */
  A.place = function (pop) {
    if (!pop.hasAttribute('data-anchor-js')) return;
    var trigger = pop.__sgTrigger;
    if (!trigger || !popoverOpen(pop)) return;
    pop.style.removeProperty('max-block-size'); // measure its own height, not the cap of the last placement
    var t = trigger.getBoundingClientRect();
    var p = pop.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;
    var k = keep(pop);
    var rtl = getComputedStyle(pop).direction === 'rtl';
    var parts = (pop.getAttribute('data-placement') || 'bottom-start').split('-');
    var side = parts[0];
    var align = parts[1] || 'center';
    var beside = side === 'start' || side === 'end';
    var opposite = { top: 'bottom', bottom: 'top', start: 'end', end: 'start' };

    function at(s, al) {
      var x, y;
      if (s === 'bottom' || s === 'top') {
        y = s === 'bottom' ? t.bottom + GAP : t.top - GAP - p.height;
        if (al === 'start') x = rtl ? t.right - p.width : t.left;
        else if (al === 'end') x = rtl ? t.left : t.right - p.width;
        else x = t.left + t.width / 2 - p.width / 2;
      } else {
        var onLeft = (s === 'start') !== rtl;
        x = onLeft ? t.left - GAP - p.width : t.right + GAP;
        y = t.top + t.height / 2 - p.height / 2;
      }
      return { x: x, y: y };
    }
    function fits(c) {
      return c.x >= k.side && c.x + p.width <= vw - k.side && c.y >= k.top && c.y + p.height <= vh - k.bottom;
    }
    var tries = beside
      ? [at(side), at(opposite[side]), at('bottom', 'start'), at('bottom', 'end'), at('top', 'start'), at('top', 'end'), at('bottom'), at('top')]
      : [at(side, align), at(opposite[side], align), at(side, 'start'), at(side, 'end'), at(opposite[side], 'start'), at(opposite[side], 'end'), at(side), at(opposite[side])];
    var pos = null;
    for (var i = 0; i < tries.length && !pos; i++) if (fits(tries[i])) pos = tries[i];
    var h = p.height;
    var room = vh - k.top - k.bottom;
    if (!pos) {
      // Nothing fits whole: below or above, wherever there is more room, capped to that room so the body
      // scrolls (never over the trigger), centred on it and kept inside the gutters. Only when even that
      // room is too small to read in does it fall back to the whole screen.
      var below = vh - k.bottom - (t.bottom + GAP);
      var above = t.top - GAP - k.top;
      var down = below >= above;
      var space = down ? below : above;
      if (space >= Math.min(p.height, 160)) {
        h = Math.min(p.height, space);
        pos = { x: t.left + t.width / 2 - p.width / 2, y: down ? t.bottom + GAP : t.top - GAP - h };
      } else {
        h = Math.min(p.height, room);
        pos = at(side, align);
      }
    }
    var x = Math.max(k.side, Math.min(pos.x, vw - p.width - k.side));
    var y = Math.max(k.top, Math.min(pos.y, vh - k.bottom - h));
    if (h < p.height) pop.style.maxBlockSize = Math.floor(h) + 'px';
    // Viewport coordinates of a position: fixed box. The logical inset is used for the inline
    // axis so the same number means the same thing in RTL.
    pop.style.insetInlineStart = Math.round(rtl ? vw - x - p.width : x) + 'px';
    pop.style.insetBlockStart = Math.round(y) + 'px';
    pop.setAttribute('data-placed', '');
    if (placedNow.indexOf(pop) < 0) placedNow.push(pop);
  };

  A.release = function (pop) {
    var i = placedNow.indexOf(pop);
    if (i >= 0) placedNow.splice(i, 1);
    pop.removeAttribute('data-placed');
  };

  var raf = 0;
  function replaceAll() {
    if (raf) return;
    raf = window.requestAnimationFrame(function () {
      raf = 0;
      placedNow.slice().forEach(function (p) { if (popoverOpen(p)) A.place(p); else A.release(p); });
    });
  }
  window.addEventListener('scroll', replaceAll, true);
  window.addEventListener('resize', replaceAll);

  SG.anchor = A;

  /* ---- Which button opened this popover? --------------------------------------------------- */
  var lastInvoker = null;
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[popovertarget], [commandfor], [data-sg-open]') : null;
    if (b) lastInvoker = b;
  }, true);

  function triggerFor(pop, source) {
    if (source && source.nodeType === 1) return source;
    var id = pop.id;
    if (lastInvoker && id && (lastInvoker.getAttribute('popovertarget') === id || lastInvoker.getAttribute('commandfor') === id || lastInvoker.getAttribute('data-sg-open') === '#' + id)) return lastInvoker;
    if (pop.__sgReturn) return pop.__sgReturn;
    if (id) return document.querySelector('[popovertarget="' + esc(id) + '"], [commandfor="' + esc(id) + '"]');
    return null;
  }

  /* ---- Kinds: the popover card here, the menu in 63-menu.js ------------------------------------ */
  var kinds = [];
  function kindOf(el) {
    if (!el || el.nodeType !== 1 || !el.hasAttribute || !el.hasAttribute('popover')) return null;
    for (var i = 0; i < kinds.length; i++) if (kinds[i].match(el)) return kinds[i];
    return null;
  }

  var cardKind = {
    match: function (el) { return el.classList.contains('popover'); },
    beforeOpen: function () { return false; },
    afterOpen: function (pop) {
      if (pop.contains(document.activeElement)) return;
      var el = pop.querySelector('[autofocus]') || pop.querySelector(FOCUSABLE);
      if (!el) {
        if (!pop.hasAttribute('tabindex')) pop.setAttribute('tabindex', '-1');
        el = pop;
      }
      el.focus();
      if (SG.dialog && SG.dialog.settle) SG.dialog.settle(pop);
    },
  };
  kinds.push(cardKind);

  /* ---- Open / close lifecycle ---------------------------------------------------------------- */
  document.addEventListener('beforetoggle', function (e) {
    var pop = e.target;
    var kind = kindOf(pop);
    if (!kind || e.newState !== 'open') return;
    var trigger = triggerFor(pop, e.source);
    if (trigger) pop.__sgTrigger = trigger;
    trigger = pop.__sgTrigger;
    pop.__sgReturn = null; // managed popovers return focus themselves, via __sgTrigger
    var asSheet = kind.beforeOpen(pop);
    if (asSheet) A.detach(pop);
    else if (trigger) A.attach(pop, trigger);
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }, true);

  document.addEventListener('toggle', function (e) {
    var pop = e.target;
    var kind = kindOf(pop);
    if (!kind) return;
    if (e.newState === 'open') {
      A.place(pop);
      window.requestAnimationFrame(function () { A.verify(pop); });
      kind.afterOpen(pop);
    } else {
      A.release(pop);
      var trigger = pop.__sgTrigger;
      if (!trigger) return;
      trigger.setAttribute('aria-expanded', 'false');
      giveFocusBack(pop);
    }
  }, true);

  /** Focus goes back to the button unless the person already moved on to another control. */
  function giveFocusBack(pop) {
    var trigger = pop.__sgTrigger;
    var active = document.activeElement;
    if (trigger && shown(trigger) && (!active || active === document.body || pop.contains(active))) trigger.focus();
  }

  function hide(pop) {
    if (popoverOpen(pop)) {
      try { pop.hidePopover(); } catch (e) { /* already hidden */ }
    }
    if (pop.__sgTrigger) pop.__sgTrigger.setAttribute('aria-expanded', 'false');
    giveFocusBack(pop); // now, not on the async toggle event: the next key press is already coming
  }

  SG.popover = {
    register: function (kind) { kinds.push(kind); },
    triggerFor: triggerFor,
    hide: hide,
    giveFocusBack: giveFocusBack,
    isOpen: popoverOpen,
  };

  /* ---- Popover card: the action row is one row, or a stack of full-width pills (popover.css) ------------- */
  if (SG.fit) SG.fit.register('.popover__actions', { steps: ['row', 'stack'], parts: '.btn' });

  /* ---- Popover card: Esc hands focus back deterministically ---------------------------------------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    var card = e.target.closest ? e.target.closest('.popover[popover]') : null;
    if (card && popoverOpen(card)) {
      e.preventDefault();
      hide(card);
    }
  });

  /* ---- Popover card: moving focus to another control closes it -------------------------------------- */
  document.addEventListener('focusout', function (e) {
    var card = e.target.closest ? e.target.closest('.popover[popover]') : null;
    if (!card || !popoverOpen(card)) return;
    var to = e.relatedTarget;
    if (!to || card.contains(to) || to === card.__sgTrigger) return;
    try { card.hidePopover(); } catch (err) { /* already hidden */ }
  });
})((window.SG = window.SG || {}));
