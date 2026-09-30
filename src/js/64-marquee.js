/* ==========================================================================
   SG.marquee: makes a .marquee strip scroll, safely            styles: components/marquee.css
   --------------------------------------------------------------------------
   Progressive enhancement. The HTML is a labelled group with a plain list of
   announcements and a Pause/Play toggle. Without this script (or when it decides
   not to animate) the list simply wraps and can be read in full. With it:

     1. a second copy of the list is appended to make the loop seamless. The copy is
        aria-hidden and inert, so a screen reader reads each message once and Tab
        never lands in it;
     2. the strip gets data-loop and a --marquee-duration computed from the content
        width and data-speed (px per second, default 40), so long and short tickers
        move at the same pace.

   IT DECLINES TO ANIMATE WHEN
     - the user prefers reduced motion (OS setting or the app's data-motion="reduced");
       the toggle then shows "paused" and is aria-disabled with the reason as its
       description, because it would have nothing to do;
     - the text already fits inside the strip (nothing to scroll);
     - there is under 8rem of room for the moving text (200% text on a phone): it stays a
       static, wrapped list, with the toggle disabled and the reason as its description;
     - there is no .marquee__toggle in the markup. WCAG 2.2.2 requires a pause control
       for anything that moves on its own for more than five seconds, and hover or focus
       pausing does not satisfy it, so the loop never starts without the button.

   The toggle:  aria-pressed="true" = PAUSED. Its accessible name stays "Pause ticker";
   only the pressed state and the icon change (WAI-ARIA toggle button).
   It listens to: resize, font loading, the OS reduced-motion setting and SG.prefs.

   API (all optional)
     SG.marquee.init(el)      enhance one strip (done automatically for .marquee on load
                              and for strips added later)
     SG.marquee.refresh(el)   call after you change the list items
   ========================================================================== */
(function (SG) {
  'use strict';

  var reducedMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var all = [];
  var uid = 0;

  function naturalWidth(inst) {
    // Measure the list laid out on ONE line, whatever mode the strip is in right now.
    var probe = inst.list.cloneNode(true);
    probe.removeAttribute('data-clone');
    probe.removeAttribute('id');
    probe.setAttribute('aria-hidden', 'true');
    probe.setAttribute('inert', '');
    probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;flex-wrap:nowrap;inline-size:max-content;white-space:nowrap;padding-inline-end:1rem';
    inst.track.appendChild(probe);
    var w = probe.getBoundingClientRect().width;
    probe.parentNode.removeChild(probe);
    return w;
  }

  function buildClone(inst) {
    if (inst.clone && inst.clone.parentNode) inst.clone.parentNode.removeChild(inst.clone);
    var c = inst.list.cloneNode(true);
    c.setAttribute('data-clone', '');
    c.setAttribute('aria-hidden', 'true');
    c.setAttribute('inert', '');
    Array.prototype.forEach.call(c.querySelectorAll('[id]'), function (n) { n.removeAttribute('id'); });
    // Engines without `inert`: make sure nothing inside can take focus.
    Array.prototype.forEach.call(c.querySelectorAll('a,button,input,select,textarea,[tabindex]'), function (n) { n.setAttribute('tabindex', '-1'); });
    inst.track.appendChild(c);
    inst.clone = c;
  }

  function dropClone(inst) {
    if (inst.clone && inst.clone.parentNode) inst.clone.parentNode.removeChild(inst.clone);
    inst.clone = null;
  }

  function setReason(inst, text) {
    var t = inst.toggle;
    if (!text) {
      t.removeAttribute('aria-disabled');
      t.removeAttribute('aria-describedby');
      t.removeAttribute('title');
      if (inst.note) inst.note.textContent = '';
      return;
    }
    if (!inst.note) {
      inst.note = document.createElement('span');
      inst.note.className = 'sr-only';
      inst.note.id = 'sg-marquee-note-' + ++uid;
      inst.root.appendChild(inst.note);
    }
    inst.note.textContent = text;
    t.setAttribute('aria-disabled', 'true');
    t.setAttribute('aria-describedby', inst.note.id);
    t.setAttribute('title', text);
  }

  function setPressed(inst, pressed) {
    var v = String(pressed);
    if (inst.toggle.getAttribute('aria-pressed') !== v) inst.toggle.setAttribute('aria-pressed', v);
  }

  /** Width the list would have in the ONE-ROW layout (between the label and the toggle),
      independent of whether the strip is currently laid out in one row or wrapped. */
  function availableWidth(inst) {
    var cs = getComputedStyle(inst.root);
    var gap = parseFloat(cs.columnGap) || 0;
    var pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    var label = inst.root.querySelector('.marquee__label');
    var used = (label ? label.offsetWidth : 0) + inst.toggle.offsetWidth + gap * 2;
    return inst.root.clientWidth - pad - used;
  }

  function refresh(root) {
    var inst = root && root._sgMarquee;
    if (!inst) return;
    var reduced = SG.motion.reduced();
    var natural = naturalWidth(inst);
    var room = availableWidth(inst);
    var fits = natural <= room - 4;
    // With 200% text on a phone the label and the button leave a window a few letters wide:
    // a ticker nobody can read. Below 8rem of room it stays a static, wrapped list.
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var cramped = !fits && room < 8 * rem;

    if (fits) root.setAttribute('data-fit', '');
    else root.removeAttribute('data-fit');

    if (reduced) {
      root.removeAttribute('data-loop');
      dropClone(inst);
      setPressed(inst, true);
      setReason(inst, 'Motion is turned off in your settings, so the ticker is not scrolling.');
      return;
    }
    if (fits) {
      root.removeAttribute('data-loop');
      dropClone(inst);
      setPressed(inst, false);
      setReason(inst, 'Nothing is scrolling because the text fits.');
      return;
    }
    if (cramped) {
      root.removeAttribute('data-loop');
      dropClone(inst);
      setPressed(inst, true);
      setReason(inst, 'There is not enough room to scroll, so the ticker shows all of its text.');
      return;
    }

    setReason(inst, '');
    setPressed(inst, inst.userPaused);
    if (!inst.clone || !inst.clone.parentNode) buildClone(inst);
    var speed = Number(root.getAttribute('data-speed')) || 40;
    root.style.setProperty('--marquee-duration', Math.max(8, natural / speed).toFixed(1) + 's');
    if (!root.hasAttribute('data-loop')) root.setAttribute('data-loop', '');
  }

  function init(root) {
    if (!root || root._sgMarquee) return;
    var toggle = root.querySelector('.marquee__toggle');
    var track = root.querySelector('.marquee__track');
    var viewport = root.querySelector('.marquee__viewport');
    var list = track && track.querySelector('.marquee__list:not([data-clone])');
    if (!toggle || !track || !viewport || !list) {
      if (window.console && console.warn) console.warn('SG.marquee: a .marquee needs a .marquee__viewport > .marquee__track > .marquee__list and a .marquee__toggle (WCAG 2.2.2). Leaving it static.', root);
      return;
    }
    var inst = { root: root, toggle: toggle, track: track, viewport: viewport, list: list, clone: null, note: null, userPaused: toggle.getAttribute('aria-pressed') === 'true' };
    root._sgMarquee = inst;
    all.push(inst);
    root.setAttribute('data-ready', '');
    if (!toggle.hasAttribute('aria-label') && !toggle.textContent.trim()) toggle.setAttribute('aria-label', 'Pause ticker');
    if (!toggle.hasAttribute('aria-pressed')) toggle.setAttribute('aria-pressed', 'false');

    if (window.ResizeObserver) {
      // Observe the strip, not the viewport: the viewport changes size when we change layout.
      var last = root.clientWidth;
      new ResizeObserver(function () {
        var w = root.clientWidth;
        if (Math.abs(w - last) > 0.5) { last = w; refresh(root); }
      }).observe(root);
    }
    refresh(root);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { refresh(root); });
  }

  // The toggle. Delegated, so strips added later work. aria-disabled is handled by SG.guard.
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.marquee__toggle') : null;
    if (!b || b.getAttribute('aria-disabled') === 'true') return;
    var root = b.closest('.marquee');
    var inst = root && root._sgMarquee;
    var pressed = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(pressed));
    if (inst) inst.userPaused = pressed;
  });

  function refreshAll() { all.forEach(function (i) { refresh(i.root); }); }
  if (reducedMq && reducedMq.addEventListener) reducedMq.addEventListener('change', refreshAll);
  if (SG.prefs && SG.prefs.onChange) SG.prefs.onChange(refreshAll);

  SG.marquee = { init: init, refresh: refresh };

  SG.ready(function () {
    SG.qsa('.marquee').forEach(init);
    if (window.MutationObserver) {
      new MutationObserver(function (records) {
        records.forEach(function (r) {
          Array.prototype.forEach.call(r.addedNodes, function (n) {
            if (n.nodeType !== 1) return;
            if (n.matches && n.matches('.marquee')) init(n);
            else if (n.querySelectorAll) Array.prototype.forEach.call(n.querySelectorAll('.marquee'), init);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
  });
})((window.SG = window.SG || {}));
