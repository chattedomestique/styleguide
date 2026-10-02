/* ==========================================================================
   SG core
   --------------------------------------------------------------------------
   Everything in src/js is a plain script that attaches to window.SG. No
   modules, no build step for consumers, works from file://.

   CONVENTIONS for every script in this folder
   - Progressive enhancement: the HTML + CSS must already be usable. JS adds
     keyboard roving, announcements, persistence; it never creates the UI.
   - Hooks are data attributes (data-sg-*), never classes, and use event
     delegation on document, so markup added later works without re-init.
   - Wrap storage access in try/catch (private windows, blocked storage).
   - Announce state changes that have no visible focus move with SG.announce.
   - Respect SG.motion.reduced() for anything you animate from JS.
   ========================================================================== */
(function (SG) {
  'use strict';

  var root = document.documentElement;

  /** Run fn when the DOM is ready (immediately if it already is). */
  SG.ready = function (fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  SG.qs = function (sel, scope) { return (scope || document).querySelector(sel); };
  SG.qsa = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  var uidCount = 0;
  /** Unique, valid id for aria-controls / aria-labelledby wiring. */
  SG.uid = function (prefix) { return (prefix || 'sg') + '-' + ++uidCount; };

  /** localStorage that never throws. */
  SG.storage = {
    get: function (key, fallback) {
      try {
        var v = localStorage.getItem(key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    remove: function (key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } },
  };

  /* ---- Motion -----------------------------------------------------------------
     True when travel/scale/rotation should be replaced by fades. Mirrors the CSS:
     data-motion="reduced" forces it, data-motion="full" forces it off, otherwise
     follow the OS. Use it for Web Animations, View Transitions, canvas loops. */
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener: function () {} };
  SG.motion = {
    reduced: function () {
      var m = root.getAttribute('data-motion');
      if (m === 'reduced') return true;
      if (m === 'full') return false;
      return mq.matches;
    },
  };

  /* ---- Announcements -----------------------------------------------------------
     A screen-reader-only live region. The text is cleared and set on the next
     frame so repeating the same message is announced again (WCAG 4.1.3).
       SG.announce('3 tasks left');            polite (status)
       SG.announce('Could not save', { assertive: true });   alert: use sparingly */
  var regions = {};
  function region(assertive) {
    var key = assertive ? 'alert' : 'status';
    if (regions[key]) return regions[key];
    var el = document.createElement('div');
    el.className = 'sr-only';
    el.setAttribute('role', key);
    el.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
    el.setAttribute('aria-atomic', 'true');
    document.body.appendChild(el);
    regions[key] = el;
    return el;
  }
  SG.announce = function (message, opts) {
    var el = region(!!(opts && opts.assertive));
    el.textContent = '';
    window.requestAnimationFrame(function () { el.textContent = message; });
  };

  /* ---- Colour helper -------------------------------------------------------------
     Resolve any CSS colour (including var(--role) and light-dark()) to #rrggbb, e.g.
     to keep <meta name="theme-color"> in step with the canvas. */
  var cctx;
  SG.colorToHex = function (cssColor) {
    if (!cctx) { var c = document.createElement('canvas'); c.width = c.height = 1; cctx = c.getContext('2d', { willReadFrequently: true }); }
    cctx.clearRect(0, 0, 1, 1);
    cctx.fillStyle = '#000';
    cctx.fillStyle = cssColor;
    cctx.fillRect(0, 0, 1, 1);
    var d = cctx.getImageData(0, 0, 1, 1).data;
    return '#' + [d[0], d[1], d[2]].map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
  };
  /** Resolve a custom property (e.g. '--color-canvas') on an element to #rrggbb. */
  SG.tokenToHex = function (name, el) {
    var probe = document.createElement('i');
    probe.style.cssText = 'color:var(' + name + ');position:absolute;visibility:hidden';
    (el || root).appendChild(probe);
    var css = getComputedStyle(probe).color;
    probe.remove();
    return SG.colorToHex(css);
  };

  /* ---- Keyboard helpers shared by roving-tabindex widgets ------------------------------ */
  /** Move focus within a list of items per arrow keys. Returns the newly focused item or null. */
  SG.roving = function (items, current, key, opts) {
    var horizontal = !opts || opts.orientation !== 'vertical';
    var rtl = getComputedStyle(root).direction === 'rtl';
    var next = key === (horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown') ? 1
      : key === (horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp') ? -1 : 0;
    var i = items.indexOf(current);
    var target = null;
    if (key === 'Home') target = items[0];
    else if (key === 'End') target = items[items.length - 1];
    else if (next) {
      var n = i;
      for (var step = 0; step < items.length; step++) {
        n = (n + next + items.length) % items.length;
        if (!items[n].disabled && items[n].getAttribute('aria-disabled') !== 'true') { target = items[n]; break; }
      }
    }
    if (target) target.focus();
    return target;
  };
})((window.SG = window.SG || {}));
