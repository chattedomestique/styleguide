/* ==========================================================================
   SG.table: sorting, row selection and the "scroll sideways" hint
   --------------------------------------------------------------------------
   Progressive enhancement: the table is a real <table> with real headers and is
   fully readable without this file. JS adds

     sort       a click on .tbl__sort sorts the rows by that column and sets
                aria-sort on its <th> (and removes it from the others, as in the
                APG sortable-table example). Click again to reverse.
                Sort key of a cell:  data-value  >  <time datetime>  >  its text.
                Numbers are compared as numbers (the true minus U+2212, currency
                symbols and thousands separators are ignored), everything else
                with Intl.Collator({ numeric: true }).
     select     .tbl[data-select]: a row checkbox sets aria-selected on its <tr>;
                the header checkbox selects / clears every row and shows the
                indeterminate state when only some are selected. The count goes
                to any [data-sg-count] inside the table's .tbl, which is a live
                region, so the change is announced without moving focus.
     hint       .tbl gets data-scrollable while its scroll region overflows; CSS
                shows .tbl__hint only then.

   EVENTS (bubble from the .tbl)
     sg-table-sort    detail { column: index, direction: 'ascending'|'descending', header }
                      cancelable: call preventDefault() to sort on your server instead;
                      aria-sort is still updated, the rows are left alone.
     sg-table-select  detail { count, total, rows: [<tr>] }

   API  SG.table.sort(table, columnIndex, direction), SG.table.selected(table)
   ========================================================================== */
(function (SG) {
  'use strict';

  var collator = (typeof Intl !== 'undefined' && Intl.Collator) ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }) : null;

  function cellKey(cell) {
    if (!cell) return '';
    if (cell.hasAttribute('data-value')) return cell.getAttribute('data-value');
    var t = cell.querySelector('time[datetime]');
    if (t) return t.getAttribute('datetime');
    return cell.textContent.replace(/\s+/g, ' ').trim();
  }

  /** "−$1,199.00" -> -1199, "12 %" -> 12. NaN when the text is not a number. */
  function toNumber(s) {
    var clean = String(s).replace(/−/g, '-').replace(/[^\d.,\-+]/g, '');
    if (!/\d/.test(clean)) return NaN;
    // "1,199.00" (comma thousands) and "1.199,00" (dot thousands): the last separator is the decimal mark
    var lastComma = clean.lastIndexOf(','), lastDot = clean.lastIndexOf('.');
    if (lastComma > lastDot) clean = clean.replace(/\./g, '').replace(',', '.');
    else clean = clean.replace(/,/g, '');
    var n = parseFloat(clean);
    return isNaN(n) ? NaN : n;
  }

  function compare(a, b) {
    var na = toNumber(a), nb = toNumber(b);
    // numeric only when BOTH look like numbers and neither is a date-like string (2026-04-08)
    var dateLike = /^\d{4}-\d{2}-\d{2}/;
    if (!isNaN(na) && !isNaN(nb) && !dateLike.test(a) && !dateLike.test(b)) return na - nb;
    return collator ? collator.compare(a, b) : (a < b ? -1 : a > b ? 1 : 0);
  }

  function headerCells(table) {
    var row = table.tHead && table.tHead.rows[0];
    return row ? Array.prototype.slice.call(row.cells) : [];
  }

  function label(th) {
    var b = th.querySelector('.tbl__sort');
    return (b || th).textContent.replace(/\s+/g, ' ').trim();
  }

  /** Sort tbody rows by column `index`. Stable (ties keep their order). */
  function sort(table, index, direction) {
    var heads = headerCells(table);
    var th = heads[index];
    if (!th) return;
    var dir = direction === 'descending' ? 'descending' : 'ascending';
    heads.forEach(function (h) { if (h !== th) h.removeAttribute('aria-sort'); });
    th.setAttribute('aria-sort', dir);

    var ev = new CustomEvent('sg-table-sort', { bubbles: true, cancelable: true, detail: { column: index, direction: dir, header: th } });
    var proceed = table.dispatchEvent(ev);
    if (proceed) {
      Array.prototype.forEach.call(table.tBodies, function (body) {
        var rows = Array.prototype.slice.call(body.rows).filter(function (r) { return !r.classList.contains('tbl__empty'); });
        var keyed = rows.map(function (r, i) { return { r: r, i: i, k: cellKey(r.cells[index]) }; });
        keyed.sort(function (x, y) {
          var c = compare(x.k, y.k);
          if (c === 0) return x.i - y.i;
          return dir === 'ascending' ? c : -c;
        });
        keyed.forEach(function (o) { body.appendChild(o.r); });
      });
    }
    SG.announce('Sorted by ' + label(th) + ', ' + dir);
  }

  /* ---- selection ---------------------------------------------------------- */
  function rowBoxes(table) {
    return SG.qsa('tbody .tbl__check input', table);
  }

  function selected(table) {
    return rowBoxes(table).filter(function (b) { return b.checked; }).map(function (b) { return b.closest('tr'); });
  }

  function syncSelection(table, announce) {
    var boxes = rowBoxes(table);
    var rows = [];
    boxes.forEach(function (b) {
      var tr = b.closest('tr');
      if (b.checked) { tr.setAttribute('aria-selected', 'true'); rows.push(tr); } else tr.removeAttribute('aria-selected');
    });
    var all = SG.qs('thead .tbl__check input', table);
    if (all) {
      all.checked = boxes.length > 0 && rows.length === boxes.length;
      all.indeterminate = rows.length > 0 && rows.length < boxes.length;
    }
    var wrap = table.closest('.tbl');
    var text = rows.length ? rows.length + ' of ' + boxes.length + ' selected' : 'None selected';
    if (wrap) SG.qsa('[data-sg-count]', wrap).forEach(function (el) { el.textContent = text; });
    if (announce) table.dispatchEvent(new CustomEvent('sg-table-select', { bubbles: true, detail: { count: rows.length, total: boxes.length, rows: rows } }));
  }

  /* ---- overflow hint -------------------------------------------------------- */
  function measure(wrap) {
    var scroller = SG.qs('.tbl__scroll', wrap);
    if (!scroller) return;
    if (scroller.scrollWidth > scroller.clientWidth + 1) wrap.setAttribute('data-scrollable', '');
    else wrap.removeAttribute('data-scrollable');
  }

  var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function (entries) {
    entries.forEach(function (e) { var w = e.target.closest('.tbl'); if (w) measure(w); });
  }) : null;

  function init(scope) {
    SG.qsa('.tbl', scope).forEach(function (wrap) {
      var scroller = SG.qs('.tbl__scroll', wrap);
      var table = SG.qs('table', wrap);
      if (!scroller || !table) return;
      measure(wrap);
      if (ro && !scroller.__sgRo) { scroller.__sgRo = true; ro.observe(scroller); ro.observe(table); }
      if (wrap.hasAttribute('data-select')) syncSelection(table, false);
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.tbl__sort');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    var th = btn.closest('th');
    var table = btn.closest('table');
    if (!th || !table) return;
    var index = headerCells(table).indexOf(th);
    var next = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
    sort(table, index, next);
  });

  document.addEventListener('change', function (e) {
    var input = e.target;
    if (!input.matches || !input.matches('.tbl__check > input')) return;
    var table = input.closest('table');
    if (!table) return;
    if (input.closest('thead')) {
      rowBoxes(table).forEach(function (b) { b.checked = input.checked; });
    }
    syncSelection(table, true);
  });

  SG.table = { sort: sort, selected: selected, init: init };
  SG.ready(function () { init(document); });
})((window.SG = window.SG || {}));
