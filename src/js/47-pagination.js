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

   THE STATUS KEEPS THE ROOM OF ITS LONGEST FORM. In the short form, "Page 1 of 12" fitted one line where
   "Page 12 of 12" wrapped, so two pagers of the same list differed in height and their arrows did not line
   up. The status is therefore as wide as its longest form (every number at its most digits; the digits are
   tabular, so "88" is as wide as any two), up to the room between the arrows (--_status-w), and when that
   longest form would wrap, it reserves two lines at every page (data-lines="2").

   API   SG.pagination.fit()   re-check every pager now
   ========================================================================== */
(function (SG) {
  'use strict';

  SG.fit.register('.pagination:not([data-variant="switcher"])', {
    steps: ['full', 'compact', 'fewer', 'short'],
    measure: '.pagination__list',
    attrs: ['aria-current']
  });

  function status(nav) {
    var st = nav.querySelector('.pagination__status');
    if (!st) return;
    st.style.removeProperty('--_status-w');
    st.removeAttribute('data-lines');
    if (!nav.matches('[data-fit="short"]') || getComputedStyle(st).display === 'none') return;
    var text = st.textContent.trim();
    var most = (text.match(/\d+/g) || []).reduce(function (n, d) { return Math.max(n, d.length); }, 0);
    var probe = document.createElement('span');
    probe.textContent = most ? text.replace(/\d+/g, new Array(most + 1).join('8')) : text;
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;inset:0 auto auto 0';
    st.appendChild(probe);
    var need = Math.ceil(probe.getBoundingClientRect().width);
    probe.remove();
    // the room between the arrows: the list's content box less every other item and the gaps
    var list = st.parentElement;
    var cs = getComputedStyle(list);
    var room = list.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    var items = SG.qsa(':scope > *', list).filter(function (li) { return getComputedStyle(li).display !== 'none'; });
    items.forEach(function (li) { if (li !== st) room -= li.getBoundingClientRect().width; });
    room -= (items.length - 1) * (parseFloat(cs.columnGap) || 0);
    st.style.setProperty('--_status-w', Math.max(0, Math.floor(Math.min(need, room))) + 'px');
    if (need > room + 0.5) st.setAttribute('data-lines', '2');
  }
  function statuses() { SG.qsa('.pagination').forEach(status); }

  var frame = 0;
  function later() { if (!frame) frame = requestAnimationFrame(function () { frame = 0; statuses(); }); }
  SG.ready(function () {
    statuses(); // after SG.fit's first pass, which is also an SG.ready callback (registered earlier, core)
    if (window.ResizeObserver) {
      // created after SG.fit's observer, so on a resize its frame (which sets data-fit) runs before this one
      var ro = new ResizeObserver(later);
      SG.qsa('.pagination').forEach(function (nav) { ro.observe(nav); });
    }
    if ('MutationObserver' in window) {
      // a pager that re-renders (new page, new count) or changes form
      new MutationObserver(later).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-fit'] });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
  });

  SG.pagination = { fit: function () { SG.fit.update(); statuses(); } };
})((window.SG = window.SG || {}));
