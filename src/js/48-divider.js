/* ==========================================================================
   Divider: a row with vertical rules is one line, or a column
   --------------------------------------------------------------------------
   A vertical rule separates the two items beside it. When its row wrapped, a rule could start
   or end a line ("| Settings"), separating nothing. This measures every row that holds vertical
   dividers with SG.fit (05-fit.js) and writes data-fit on it; divider.css draws:

     row     every item on one line, each one whole
     stack   one item per line, the rules lying flat between them

   It re-checks when the row's size changes (a rotation, the reader's text size, a font
   loading) and when such a row is added. Without JS there is no data-fit and the row wraps.

   API   SG.divider.fit()   re-check every row now
   ========================================================================== */
(function (SG) {
  'use strict';

  SG.fit.register(':has(> .divider[data-orientation="vertical"])', {
    steps: ['row', 'stack']
  });

  SG.divider = { fit: SG.fit.update };
})((window.SG = window.SG || {}));
