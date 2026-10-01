/* ==========================================================================
   Fit: the richest layout that fits, measured
   --------------------------------------------------------------------------
   Some rows must never wrap raggedly: a dock, a segmented control, a pager. Either the whole
   row fits on one line, or the element switches to another layout AS A WHOLE (icons only, one
   option per line, the short form). CSS cannot ask "does this fit?", so this script tries each
   layout in order, richest first, and keeps the first one in which nothing spills. It writes
   the layout to data-fit on the element; the element's CSS draws each one. For the measure to
   mean something, the CSS keeps the measured row on ONE line while data-fit is set (nowrap),
   so "does not fit" shows up as overflow instead of as a wrapped or broken word.

     SG.fit.register('.dock', {
       steps: ['labels', 'compact', 'icons'],   richest first; the last one is used when none fits
       measure: '.dock__list',                  what must not overflow (default: the element itself)
       parts: '.seg__label',                    optional: descendants that must not overflow either
       start: function (el) { return 0; },      optional: index of the first step to try
       attrs: ['aria-current']                  optional: attribute changes inside that re-check
     })
     SG.fit.update()                            re-check everything now

   It re-checks when an element's size changes (a rotation, the reader's text size), when fonts
   load, when a matching element is added, and when one of attrs changes inside one. Without JS
   there is no data-fit, and each element's CSS has its own fallback (it wraps, or it scrolls).
   ========================================================================== */
(function (SG) {
  'use strict';

  var kinds = [];
  var watched = [];
  var frame = 0;
  var ro = 'ResizeObserver' in window ? new ResizeObserver(schedule) : null;
  var mo = null;
  var attrNames = ['hidden'];

  function overflows(node) {
    return node.scrollWidth > node.clientWidth + 1;
  }

  function fits(el, kind) {
    var box = kind.measure ? el.querySelector(kind.measure) : el;
    if (!box || overflows(box)) return !box;
    if (!kind.parts) return true;
    var parts = el.querySelectorAll(kind.parts);
    for (var i = 0; i < parts.length; i++) if (overflows(parts[i])) return false;
    return true;
  }

  function fitOne(el, kind) {
    var steps = kind.steps;
    var from = kind.start ? Math.max(0, Math.min(steps.length - 1, kind.start(el) || 0)) : 0;
    for (var i = from; i < steps.length; i++) {
      if (el.getAttribute('data-fit') !== steps[i]) el.setAttribute('data-fit', steps[i]);
      if (i === steps.length - 1 || fits(el, kind)) return;
    }
  }

  function update() {
    frame = 0;
    kinds.forEach(function (kind) {
      SG.qsa(kind.selector).forEach(function (el) {
        if (ro && watched.indexOf(el) < 0) { watched.push(el); ro.observe(el); }
        fitOne(el, kind);
      });
    });
    watched = watched.filter(function (el) {
      if (el.isConnected) return true;
      if (ro) ro.unobserve(el);
      return false;
    });
  }

  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(update);
  }

  function matchesAny(node) {
    if (!node || node.nodeType !== 1) return false;
    for (var i = 0; i < kinds.length; i++) {
      var sel = kinds[i].selector;
      if (node.closest(sel) || node.querySelector(sel)) return true;
    }
    return false;
  }

  function observe() {
    if (!('MutationObserver' in window)) return;
    if (mo) mo.disconnect();
    mo = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (r.type === 'attributes' ? matchesAny(r.target) : r.addedNodes.length && matchesAny(r.target)) {
          schedule();
          return;
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: attrNames });
  }

  var started = false;

  SG.fit = {
    register: function (selector, opts) {
      var kind = { selector: selector, steps: opts.steps, measure: opts.measure, parts: opts.parts, start: opts.start };
      kinds.push(kind);
      (opts.attrs || []).forEach(function (a) { if (attrNames.indexOf(a) < 0) attrNames.push(a); });
      if (started) { observe(); schedule(); }
    },
    update: update
  };

  SG.ready(function () {
    started = true;
    update();
    observe();
    window.addEventListener('resize', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  });
})((window.SG = window.SG || {}));
