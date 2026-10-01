/* ==========================================================================
   Pagination: the richest row that fits, measured
   --------------------------------------------------------------------------
   A pager is one row. When Previous, the numbers and Next do not fit the nav's own width,
   it must not wrap (Previous alone on a second line) or run out of its frame (the current
   page cut off). This script picks the richest form that fits and writes it to data-fit;
   pagination.css draws each one:

     full      Previous and Next with their words, every number in the markup
     compact   Previous and Next as circles (their words stay as their names), every number
     fewer     the circles, and only the first, the current and the last page
     short     the circles around "Page 5 of 12"

   The measuring is SG.fit (05-fit.js): it re-checks when the nav's size changes (a rotation,
   the reader's text size, a font loading), when a pager is added, and when aria-current moves
   (a pager that re-renders in place). The switcher variant (a month) is always the short form
   and is not measured. Without JS a container query stands in (pagination.css).

   API   SG.pagination.fit()   re-check every pager now
   ========================================================================== */
(function (SG) {
  'use strict';

  SG.fit.register('.pagination:not([data-variant="switcher"])', {
    steps: ['full', 'compact', 'fewer', 'short'],
    measure: '.pagination__list',
    attrs: ['aria-current']
  });

  SG.pagination = { fit: SG.fit.update };
})((window.SG = window.SG || {}));
