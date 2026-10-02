/* ==========================================================================
   SG.dialog: open, close and focus for <dialog> (and the popover="manual" sheet)
   --------------------------------------------------------------------------
   The browser already traps focus, makes the page inert, closes on Esc and draws
   the backdrop. This file adds only what it does not do reliably:

   - declarative hooks, bound by delegation so markup added later just works
       data-sg-open="#id"     on any button: opens that <dialog> (showModal) or [popover]
                              panel (showPopover) and remembers the opener
       data-sg-close          inside a dialog/panel: closes it. `value="x"` becomes returnValue
       data-sg-close="#id"    closes that one instead (a Close button outside the panel)
       command / commandfor   the invoker attributes, honoured natively where the browser has
                              them and by a small click handler where it does not
   - focus RETURNS to the opener on close, even in Safari (which does not focus a button when
     it is clicked, so the browser has nothing to restore). If the opener is gone or hidden,
     for example a menu item whose menu just closed, focus goes to the menu's button, then to
     <main>. Focus never falls to <body>.
   - backdrop click dismisses, unless the dialog has data-required. Only a press that STARTS
     and ENDS on the backdrop counts, so dragging a text selection out of the box is safe.
   - data-required also blocks Esc (cancel event) and sets closedby="none" where supported.
   - a scrolling body that holds nothing focusable becomes keyboard-scrollable (tabindex="0",
     named like the dialog) so the keyboard can reach it (WCAG 2.1.1).

   API
     SG.dialog.open(elOrSelector, { trigger })   -> element
     SG.dialog.close(elOrSelector, returnValue)
     SG.dialog.requestClose(el)                  as if Esc was pressed: `cancel` can veto
     SG.dialog.restoreFocus(el)                  used by sheets and menus
     SG.dialog.settle(el)                        after an open: make a scrolling body keyboard-reachable
     SG.dialog.nativeCommands                    true when command/commandfor are built in
   Events: the native `close` / `cancel` on <dialog>; `toggle` on popovers.

   Nothing here changes the DOM until a dialog opens, so the docs "Markup" samples stay clean.
   ========================================================================== */
(function (SG) {
  'use strict';

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"]), [contenteditable=""], [contenteditable="true"]';

  function resolve(target) {
    if (!target) return null;
    if (typeof target === 'string') {
      try { return document.querySelector(target); } catch (e) { return null; }
    }
    return target;
  }
  function isDialog(el) { return !!el && el.tagName === 'DIALOG'; }
  function isPopover(el) { return !!el && el.nodeType === 1 && el.hasAttribute('popover'); }
  function popoverOpen(el) {
    try { return el.matches(':popover-open'); } catch (e) { return false; }
  }
  function isOpen(el) { return isDialog(el) ? el.open : isPopover(el) && popoverOpen(el); }
  function shown(el) {
    return !!el && el.isConnected && !el.closest('[hidden], [inert]') && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  /* ---- Where should focus go back to? --------------------------------------------- */
  function returnTarget(el) {
    // An opener inside a panel that has since closed (a menu item) is not focusable any more:
    // walk up to that panel's own button.
    for (var guard = 0; el && guard < 6; guard++) {
      var pop = el.closest ? el.closest('[popover]') : null;
      if (pop && !popoverOpen(pop) && pop.__sgTrigger) el = pop.__sgTrigger;
      else break;
    }
    if (shown(el)) return el;
    var main = document.querySelector('main, [role="main"]');
    if (main) {
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
      return main;
    }
    return null;
  }

  function restoreFocus(el) {
    var t = el.__sgReturn;
    el.__sgReturn = null;
    if (!t) return;
    var active = document.activeElement;
    // Focus is already somewhere sensible (the browser restored it, or the app moved it on,
    // for example to a second dialog). Leave it alone.
    if (active && active !== document.body && active !== document.documentElement && !el.contains(active)) return;
    var target = returnTarget(t);
    if (target) target.focus();
  }

  /* ---- A scrolling body nobody can reach by keyboard ------------------------------- */
  function afterOpen(el) {
    window.requestAnimationFrame(function () {
      SG.qsa('.card__body', el).forEach(function (body) {
        if (body.hasAttribute('tabindex')) return;
        if (body.scrollHeight > body.clientHeight + 1 && !body.querySelector(FOCUSABLE)) {
          body.setAttribute('tabindex', '0');
          // A focusable region needs a name, or a screen reader says only "group".
          var name = el.getAttribute('aria-labelledby');
          if (name && !body.hasAttribute('role')) {
            body.setAttribute('role', 'region');
            body.setAttribute('aria-labelledby', name);
          }
        }
      });
    });
  }

  /* ---- Scroll lock without a jump -------------------------------------------------------- */
  // dialog.css hides the page scrollbar while a modal is open. Where scrollbars take room that
  // would widen the page, so its width is measured BEFORE the lock and padded back in by CSS.
  function holdScrollbar() {
    var root = document.documentElement;
    if (root.style.getPropertyValue('--sg-lock-pad')) return;
    var w = window.innerWidth - root.clientWidth;
    if (w > 0) root.style.setProperty('--sg-lock-pad', w + 'px');
  }
  function releaseScrollbar() {
    if (!document.querySelector('dialog:modal')) document.documentElement.style.removeProperty('--sg-lock-pad');
  }

  /* ---- Open / close ------------------------------------------------------------------ */
  function open(target, opts) {
    var el = resolve(target);
    if (!el) {
      if (window.console) console.warn('SG.dialog: nothing matches', target);
      return null;
    }
    if (isOpen(el)) return el;
    var active = document.activeElement;
    var trigger = (opts && opts.trigger) || (active && active !== document.body ? active : null);
    // A required dialog must not be dismissed by the browser either (Esc). closedby is the
    // built-in way; the cancel handler below covers browsers without it.
    if (isDialog(el) && el.hasAttribute('data-required')) el.setAttribute('closedby', 'none');
    el.__sgReturn = trigger;
    if (isDialog(el)) holdScrollbar();
    try {
      if (isDialog(el)) el.showModal();
      else if (isPopover(el)) el.showPopover();
    } catch (e) { /* not connected, or already open */ }
    afterOpen(el);
    return el;
  }

  function close(target, value) {
    var el = resolve(target);
    if (!el) return;
    if (isDialog(el)) {
      if (el.open) el.close(value);
    } else if (isPopover(el) && popoverOpen(el)) {
      try { el.hidePopover(); } catch (e) { /* already hidden */ }
    }
    // Do not wait for the async `close` / `toggle` event: while the exit animation runs the
    // focused control is still on screen, and a keyboard user has already pressed the next key.
    restoreFocus(el);
  }

  /** Close as if the person pressed Esc: a `cancel` listener may veto it. */
  function requestClose(el) {
    if (!isOpen(el)) return;
    if (!isDialog(el)) { close(el); return; }
    if (typeof el.requestClose === 'function') {
      el.requestClose();
    } else {
      var ev = new Event('cancel', { cancelable: true });
      if (el.dispatchEvent(ev)) el.close();
    }
  }

  /* ---- Declarative hooks ---------------------------------------------------------------- */
  var downOnBackdrop = null;
  function outside(dlg, x, y) {
    var r = dlg.getBoundingClientRect();
    return x < r.left || x > r.right || y < r.top || y > r.bottom;
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var opener = t.closest('[data-sg-open]');
    if (opener) {
      var el = resolve(opener.getAttribute('data-sg-open'));
      if (el) { e.preventDefault(); open(el, { trigger: opener }); }
      else if (window.console) console.warn('SG.dialog: nothing matches', opener.getAttribute('data-sg-open'));
      return;
    }

    var closer = t.closest('[data-sg-close]');
    if (closer) {
      var sel = closer.getAttribute('data-sg-close');
      var panel = sel ? resolve(sel) : closer.closest('dialog, [popover]');
      if (panel) {
        e.preventDefault();
        close(panel, closer.hasAttribute('value') ? closer.value : undefined);
      }
      return;
    }

    // Backdrop: a click whose target is the <dialog> itself, outside its box, and which also
    // STARTED outside its box. (Clicks on the frame have the dialog as target too.)
    if (isDialog(t) && t === downOnBackdrop && outside(t, e.clientX, e.clientY)) {
      downOnBackdrop = null;
      if (!t.hasAttribute('data-required')) requestClose(t);
    }
  });

  document.addEventListener('pointerdown', function (e) {
    var d = e.target;
    downOnBackdrop = isDialog(d) && d.open && d.matches(':modal') && outside(d, e.clientX, e.clientY) ? d : null;
  }, true);
  // Pressing the backdrop must not pull focus out of the dialog's controls onto the <dialog>
  // element itself (a required dialog stays open, and the person should stay where they were).
  document.addEventListener('mousedown', function (e) {
    var d = e.target;
    if (isDialog(d) && d.open && d.matches(':modal') && outside(d, e.clientX, e.clientY)) e.preventDefault();
  }, true);

  /* Required dialogs ignore Esc. (Chrome lets a second Esc through unless closedby="none"
     is honoured, which is why both are used.) */
  document.addEventListener('cancel', function (e) {
    var d = e.target;
    if (isDialog(d) && d.hasAttribute('data-required') && e.cancelable) e.preventDefault();
  }, true);

  /* Give focus back. `close` does not bubble, so listen in the capture phase. */
  document.addEventListener('close', function (e) {
    if (isDialog(e.target)) { restoreFocus(e.target); releaseScrollbar(); }
  }, true);

  /* ---- Invoker commands (command / commandfor) --------------------------------------------- */
  var nativeCommands = typeof HTMLButtonElement !== 'undefined' && 'command' in HTMLButtonElement.prototype;

  if (nativeCommands) {
    // The browser performs the command. We only need the invoker, for focus return.
    document.addEventListener('command', function (e) {
      var target = e.target;
      if (!isDialog(target) && !isPopover(target)) return;
      if (e.command === 'show-modal' && isDialog(target)) {
        if (target.hasAttribute('data-required')) target.setAttribute('closedby', 'none');
        target.__sgReturn = e.source || null;
        holdScrollbar();
        afterOpen(target);
      } else if (e.command === 'show-popover' || e.command === 'toggle-popover') {
        target.__sgReturn = e.source || null;
      }
    }, true);
  } else {
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('button[commandfor]') : null;
      if (!b || b.disabled) return;
      var target = document.getElementById(b.getAttribute('commandfor'));
      if (!target) return;
      switch (b.getAttribute('command')) {
        case 'show-modal': if (isDialog(target)) open(target, { trigger: b }); break;
        case 'close': close(target, b.hasAttribute('value') ? b.value : undefined); break;
        case 'request-close': requestClose(target); break;
        case 'show-popover': if (isPopover(target)) open(target, { trigger: b }); break;
        case 'hide-popover': close(target); break;
        case 'toggle-popover':
          if (isPopover(target)) { if (popoverOpen(target)) close(target); else open(target, { trigger: b }); }
          break;
        default: break;
      }
    });
  }

  SG.dialog = {
    open: open,
    close: close,
    requestClose: requestClose,
    restoreFocus: restoreFocus,
    returnTarget: returnTarget,
    settle: afterOpen,
    isOpen: isOpen,
    nativeCommands: nativeCommands,
  };
})((window.SG = window.SG || {}));
