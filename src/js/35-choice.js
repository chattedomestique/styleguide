/* ==========================================================================
   Choice: an inline group is one row or one option per row
   --------------------------------------------------------------------------
   <div class="choice-group" data-layout="inline"> puts short options (Daily | Weekly | Monthly)
   side by side. When they cannot all share a row (a narrow column, 200% text) a wrapping row
   left two on the first line and a lonely third under them, which reads as two groups. So the
   group switches AS A WHOLE: it keeps the row while every option fits on it with its words
   whole, and otherwise stacks one option per row, like a plain group.

     row     every option on one line (the CSS keeps it nowrap while measuring)
     stack   one option per row

   The measuring is SG.fit (05-fit.js): it re-checks when the group's size changes (rotation,
   text size, a font loading) and when a group is added. Without JS there is no data-fit and
   the row wraps (the CSS fallback). Native radios and checkboxes keep all their behaviour.
   ========================================================================== */
(function (SG) {
  'use strict';

  SG.fit.register('.choice-group[data-layout="inline"]', {
    steps: ['row', 'stack'],
    parts: '.choice__label' /* a label squeezed narrower than its words also counts as "does not fit" */
  });
})((window.SG = window.SG || {}));
