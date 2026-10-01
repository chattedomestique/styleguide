/* ==========================================================================
   Segmented control: one row, or one option per line
   --------------------------------------------------------------------------
   A segmented control is a row of equal choices. When large text or a narrow column leaves
   no room for every whole label in one row, it must not wrap raggedly (Day Week / Month) or
   break a word inside a cell (Lig / ht). This script picks the richest layout that fits and
   writes it to data-fit; segmented.css draws each one:

     row     every option in one row of equal cells (the default)
     grid    four options only: two rows of two equal cells
     stack   every option on a line of its own

   The measuring is SG.fit (05-fit.js): it re-checks when the control's size changes (a
   rotation, the reader's text size, a font loading) and when a control is added. While a
   layout is tried the labels do not wrap, so "does not fit" shows up as overflow of the track
   or of a label. Without JS the cells wrap onto more rows of equal cells (the CSS fallback).
   The behaviour of the radios (keys, focus, form value) is native and is not touched.

   API   SG.segmented.fit()   re-check every segmented control now
   ========================================================================== */
(function (SG) {
  'use strict';

  // exactly four options: the fourth label is also the last one
  var FOUR = '.segmented:has(> .segmented__opt:nth-of-type(4):last-of-type)';

  SG.fit.register(FOUR, {
    steps: ['row', 'grid', 'stack'],
    parts: '.segmented__label'
  });
  SG.fit.register('.segmented:not(:has(> .segmented__opt:nth-of-type(4):last-of-type))', {
    steps: ['row', 'stack'],
    parts: '.segmented__label'
  });

  SG.segmented = { fit: SG.fit.update };
})((window.SG = window.SG || {}));
