/* ==========================================================================
   Dock: one row at every size
   --------------------------------------------------------------------------
   A dock never wraps: two rows of destinations read as a grid of buttons, not as the app's
   main places. This script picks the richest presentation that fits on ONE row and writes
   it to data-fit; dock.css draws each one:

     labels    every destination shows its icon and its word (the default)
     compact   the current destination shows its word; the others show the icon only
     icons     every destination shows the icon only; the current one is the filled circle

   It re-checks when the dock's size changes (a rotation, the reader's text size, a font
   loading), when a dock is added, and when the current destination changes (its word is
   the widest thing in the compact row). The words stay in the DOM in every presentation,
   as the accessible names. data-compact on the dock starts at compact. Without JS the dock
   keeps its words and wraps onto a second row (the CSS fallback).

   API   SG.dock.fit()   re-check every dock now
   ========================================================================== */
(function (SG) {
  'use strict';

  var STEPS = ['labels', 'compact', 'icons'];
  var frame = 0;
  var ro = 'ResizeObserver' in window ? new ResizeObserver(schedule) : null;
  var watched = [];

  /** The list holds one row (the CSS sets nowrap once data-fit exists): it fits when nothing spills past its edge. */
  function fitsOneRow(list) {
    return list.scrollWidth <= list.clientWidth + 1;
  }

  function fit(dock) {
    var list = dock.querySelector('.dock__list');
    if (!list) return;
    var from = dock.hasAttribute('data-compact') ? 1 : 0;
    for (var i = from; i < STEPS.length; i++) {
      if (dock.getAttribute('data-fit') !== STEPS[i]) dock.setAttribute('data-fit', STEPS[i]);
      if (i === STEPS.length - 1 || fitsOneRow(list)) return;
    }
  }

  function fitAll() {
    frame = 0;
    SG.qsa('.dock').forEach(function (dock) {
      if (ro && watched.indexOf(dock) < 0) { watched.push(dock); ro.observe(dock); }
      fit(dock);
    });
    watched = watched.filter(function (d) {
      if (d.isConnected) return true;
      if (ro) ro.unobserve(d);
      return false;
    });
  }

  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(fitAll);
  }

  SG.dock = { fit: fitAll };

  SG.ready(function () {
    fitAll();
    window.addEventListener('resize', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    if ('MutationObserver' in window) {
      new MutationObserver(function (records) {
        for (var i = 0; i < records.length; i++) {
          var r = records[i];
          var t = r.target;
          if (r.type === 'attributes' ? t.closest && t.closest('.dock') : (r.addedNodes.length && t.closest && (t.closest('.dock') || t.querySelector('.dock')))) {
            schedule();
            return;
          }
        }
      }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current', 'data-compact', 'hidden'] });
    }
  });
})((window.SG = window.SG || {}));
