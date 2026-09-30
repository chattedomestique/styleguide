/* ==========================================================================
   SG.calendar: a month grid (or one week) you can drive with the keyboard
   --------------------------------------------------------------------------
   The grid, the month title, the previous / next buttons and the list of the
   chosen day's events are all rendered from a few data attributes, because a
   calendar is data: there is no sensible static HTML for "this month". The
   markup you write is one element; everything inside it is ours.

     <div class="cal" data-sg-calendar data-value="2026-10-02" data-first-day="1" data-locale="en-GB">
       <script type="application/json" data-sg-events>
         { "2026-10-02": [ { "title": "Standup", "time": "09:30", "end": "09:45", "tone": 3 } ] }
       </script>
     </div>

   ATTRIBUTES (all optional)
     data-view        month (default) | week
     data-value       the chosen day, YYYY-MM-DD. Absent = nothing chosen yet.
     data-first-day   0 (Sunday) to 6. Absent = the locale's own week start (Intl weekInfo), else Monday.
     data-locale      a BCP 47 tag. Absent = the page's lang, else the browser's.
     data-min / data-max   YYYY-MM-DD. Days outside are aria-disabled (dashed), still reachable.
     data-today       YYYY-MM-DD: pins "today" for demos and tests. Absent = the real date.
     data-list        off: hide the list of the chosen day's events (you show them elsewhere, e.g. in an Agenda).

   KEYBOARD  (the WAI-ARIA Authoring Practices date-picker grid)
     Arrow keys   a day / a week    Home, End   start, end of the week
     PageUp, PageDown   a month (a week in the week view)    Shift + PageUp / PageDown   a year (a month in week view)
     Enter, Space choose the day (they are buttons)    Tab   one stop in the grid (roving tabindex)

   EVENTS  (bubble from the .cal)
     sg-calendar-select   detail { value: 'YYYY-MM-DD', date: Date }

   API  SG.calendar.init(scope)   render every [data-sg-calendar] not yet rendered
        SG.calendar.value(el)     the chosen 'YYYY-MM-DD' or null
        SG.calendar.select(el, iso)   choose a day (moves the view to it)
        SG.calendar.setEvents(el, map)   replace the events and redraw
        SG.calendar.labels        the English strings; replace them to translate

   WHAT A SCREEN READER HEARS  Each day is a button named with its full date from Intl:
   "Wednesday 30 September 2026, today, 2 events". The chosen day is aria-selected on its cell.
   The month title is a polite live region, so paging announces the new month. The day's events
   are also a polite live region: choose a day and they are read. Event markers in the grid are
   decorative squares (aria-hidden): every event is also text.
   ========================================================================== */
(function (SG) {
  'use strict';

  var LABELS = {
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    prevWeek: 'Previous week',
    nextWeek: 'Next week',
    today: 'today',
    selected: 'selected',
    unavailable: 'not available',
    event: 'event',
    events: 'events',
    none: 'Nothing planned.',
    choose: 'Choose a day to see what is planned.',
    allDay: 'All day',
  };

  var state = new WeakMap();

  /* ---- dates: always local, always whole days ---------------------------------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  /** Same day of the month in another month, or the last day if that month is shorter. */
  function addMonths(d, n) {
    var first = new Date(d.getFullYear(), d.getMonth() + n, 1);
    var last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), last));
  }
  function startOfWeek(d, first) { return addDays(d, -((d.getDay() - first + 7) % 7)); }
  function same(a, b) { return !!a && !!b && iso(a) === iso(b); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function weekStart(locale) {
    try {
      var loc = new Intl.Locale(locale);
      var info = typeof loc.getWeekInfo === 'function' ? loc.getWeekInfo() : loc.weekInfo;
      if (info && info.firstDay) return info.firstDay % 7; // Intl: 1 = Monday ... 7 = Sunday
    } catch (e) { /* older engine: fall through */ }
    return 1;
  }

  function config(el) {
    var locale = el.getAttribute('data-locale') || document.documentElement.lang || navigator.language || 'en';
    var first = el.getAttribute('data-first-day');
    var events = {};
    var json = el.querySelector('script[data-sg-events]');
    if (json) { try { events = JSON.parse(json.textContent) || {}; } catch (e) { events = {}; } }
    var today = parse(el.getAttribute('data-today')) || new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var selected = parse(el.getAttribute('data-value'));
    return {
      view: el.getAttribute('data-view') === 'week' ? 'week' : 'month',
      locale: locale,
      first: first != null && first !== '' ? ((+first % 7) + 7) % 7 : weekStart(locale),
      min: parse(el.getAttribute('data-min')),
      max: parse(el.getAttribute('data-max')),
      today: today,
      selected: selected,
      cursor: selected || today,
      events: events,
      version: 0,
      id: SG.uid ? SG.uid('cal') : 'cal',
    };
  }

  function fmt(st, opts) { return new Intl.DateTimeFormat(st.locale, opts); }

  /* ---- render ------------------------------------------------------------------------- */
  function visibleDays(st) {
    var c = st.cursor, days = [], start, i;
    if (st.view === 'week') start = startOfWeek(c, st.first);
    else start = startOfWeek(new Date(c.getFullYear(), c.getMonth(), 1), st.first);
    var count = st.view === 'week' ? 7 : 42; // six weeks, always: the grid never changes height between months
    for (i = 0; i < count; i++) days.push(addDays(start, i));
    return days;
  }

  function disabled(st, d) { return (st.min && d < st.min) || (st.max && d > st.max); }

  function eventsOn(st, d) { return st.events[iso(d)] || []; }

  function countLabel(n) { return n + ' ' + (n === 1 ? LABELS.event : LABELS.events); }

  function dayName(st, d) {
    var parts = [fmt(st, { dateStyle: 'full' }).format(d)];
    if (same(d, st.today)) parts.push(LABELS.today);
    var n = eventsOn(st, d).length;
    if (n) parts.push(countLabel(n));
    if (disabled(st, d)) parts.push(LABELS.unavailable);
    return parts.join(', ');
  }

  function headHtml(st) {
    var start = startOfWeek(new Date(2024, 0, 7), st.first); // any week will do: only the weekday names matter
    var long = fmt(st, { weekday: 'long' }), short = fmt(st, { weekday: 'short' }), narrow = fmt(st, { weekday: 'narrow' });
    var out = '<tr>';
    for (var i = 0; i < 7; i++) {
      var d = addDays(start, i);
      out += '<th scope="col" abbr="' + esc(long.format(d)) + '"><span class="cal__dow-long">' + esc(short.format(d)) + '</span><span class="cal__dow-narrow" aria-hidden="true">' + esc(narrow.format(d)) + '</span></th>';
    }
    return out + '</tr>';
  }

  function dayHtml(st, d, tab) {
    var n = eventsOn(st, d).length, pips = '';
    for (var p = 0; p < Math.min(n, 3); p++) pips += '<i class="cal__pip"></i>';
    var attrs = ' class="cal__day" type="button" data-date="' + iso(d) + '" tabindex="' + (tab ? 0 : -1) + '" aria-label="' + esc(dayName(st, d)) + '"';
    if (same(d, st.today)) attrs += ' aria-current="date"';
    if (disabled(st, d)) attrs += ' aria-disabled="true"';
    if (st.view === 'month' && d.getMonth() !== st.cursor.getMonth()) attrs += ' data-outside';
    var dow = st.view === 'week' ? '<span class="cal__dow" aria-hidden="true">' + esc(fmt(st, { weekday: 'short' }).format(d)) + '</span>' : '';
    return '<td' + (same(d, st.selected) ? ' aria-selected="true"' : '') + '><button' + attrs + '>' + dow + '<span class="cal__num" aria-hidden="true">' + d.getDate() + '</span><span class="cal__pips" aria-hidden="true">' + pips + '</span></button></td>';
  }

  function eventsHtml(st) {
    if (!st.selected) return '<p class="cal__empty">' + esc(LABELS.choose) + '</p>';
    var list = eventsOn(st, st.selected);
    var title = fmt(st, { weekday: 'long', day: 'numeric', month: 'long' }).format(st.selected);
    var out = '<p class="cal__events-title">' + esc(title) + '</p>';
    if (!list.length) return out + '<p class="cal__empty">' + esc(LABELS.none) + '</p>';
    var t = fmt(st, { hour: 'numeric', minute: '2-digit' });
    out += '<ul class="cal__list" role="list">';
    list.forEach(function (ev) {
      var when = LABELS.allDay, dt = '';
      if (ev.time) {
        var a = /^(\d{1,2}):(\d{2})$/.exec(ev.time);
        if (a) { when = t.format(new Date(2000, 0, 1, +a[1], +a[2])); dt = ev.time; }
        var b = ev.end && /^(\d{1,2}):(\d{2})$/.exec(ev.end);
        if (b) when += ' – ' + t.format(new Date(2000, 0, 1, +b[1], +b[2]));
      }
      out += '<li class="cal__event"' + (ev.tone ? ' data-tone="' + esc(ev.tone) + '"' : '') + '>' +
        '<time class="cal__when"' + (dt ? ' datetime="' + esc(dt) + '"' : '') + '>' + esc(when) + '</time>' +
        '<span class="cal__what">' + esc(ev.title) + '</span></li>';
    });
    return out + '</ul>';
  }

  function titleText(st) {
    if (st.view === 'month') return fmt(st, { month: 'long', year: 'numeric' }).format(st.cursor);
    var a = startOfWeek(st.cursor, st.first), b = addDays(a, 6);
    var f = fmt(st, { day: 'numeric', month: 'short', year: 'numeric' });
    return typeof f.formatRange === 'function' ? f.formatRange(a, b) : f.format(a) + ' – ' + f.format(b);
  }

  /** Redraw the parts that change; the buttons in the head are never replaced, so focus on them survives paging. */
  function render(el) {
    var st = state.get(el);
    var days = visibleDays(st);
    var focusIso = iso(st.cursor);
    var rows = '';
    for (var r = 0; r < days.length / 7; r++) {
      rows += '<tr>';
      for (var c = 0; c < 7; c++) { var d = days[r * 7 + c]; rows += dayHtml(st, d, iso(d) === focusIso); }
      rows += '</tr>';
    }
    // Only touch a live region when its content really changes, or a screen reader says it again on every keystroke.
    var title = el.querySelector('.cal__title'), text = titleText(st);
    if (title.textContent !== text) title.textContent = text;
    el.querySelector('tbody').innerHTML = rows;
    var list = el.querySelector('.cal__events'), key = (st.selected ? iso(st.selected) : '-') + '|' + st.version;
    if (list.getAttribute('data-key') !== key) { list.innerHTML = eventsHtml(st); list.setAttribute('data-key', key); }
    var week = st.view === 'week';
    el.querySelector('[data-cal="prev"]').setAttribute('aria-label', week ? LABELS.prevWeek : LABELS.prevMonth);
    el.querySelector('[data-cal="next"]').setAttribute('aria-label', week ? LABELS.nextWeek : LABELS.nextMonth);
    // the cursor can be a day that is not in the grid (a month with no such weekday placement): keep one tab stop
    if (!el.querySelector('.cal__day[tabindex="0"]')) { var first = el.querySelector('.cal__day:not([data-outside])'); if (first) first.tabIndex = 0; }
  }

  function build(el) {
    var st = config(el);
    state.set(el, st);
    el.classList.add('cal');
    el.setAttribute('data-view', st.view);
    var json = el.querySelector('script[data-sg-events]');
    el.innerHTML = '';
    if (json) el.appendChild(json);
    var id = st.id;
    var nav = function (dir, icon) {
      return '<button class="btn" type="button" data-shape="circle" data-size="sm" data-cal="' + dir + '" aria-label=""><span class="ic ic--' + icon + '" aria-hidden="true"></span></button>';
    };
    var shell = document.createElement('div');
    shell.className = 'cal__shell';
    shell.innerHTML =
      '<div class="cal__head">' + nav('prev', 'chevron-left') +
      '<p class="cal__title" id="' + id + '-title" aria-live="polite" aria-atomic="true"></p>' + nav('next', 'chevron-right') + '</div>' +
      '<table class="cal__grid" role="grid" aria-labelledby="' + id + '-title"><thead>' + headHtml(st) + '</thead><tbody></tbody></table>' +
      '<div class="cal__events" aria-live="polite" aria-atomic="true"></div>';
    while (shell.firstChild) el.appendChild(shell.firstChild);
    render(el);
  }

  /* ---- behaviour ----------------------------------------------------------------------- */
  function focusDay(el, d) {
    var btn = el.querySelector('.cal__day[data-date="' + iso(d) + '"]');
    if (btn) btn.focus();
  }

  function go(el, date, focus) {
    var st = state.get(el);
    if (st.min && date < st.min) date = st.min;
    if (st.max && date > st.max) date = st.max;
    st.cursor = date;
    // Moving inside what is already drawn only moves the tab stop and the focus: nothing is re-rendered,
    // so the button a screen reader is on is not destroyed and re-announced on every arrow key.
    var btn = el.querySelector('.cal__day[data-date="' + iso(date) + '"]');
    if (btn && (st.view === 'week' || !btn.hasAttribute('data-outside'))) {
      SG.qsa('.cal__day[tabindex="0"]', el).forEach(function (b) { b.tabIndex = -1; });
      btn.tabIndex = 0;
      if (focus) btn.focus();
      return;
    }
    render(el);
    if (focus) focusDay(el, date);
  }

  function select(el, date) {
    var st = state.get(el);
    if (disabled(st, date)) return;
    st.selected = date;
    st.cursor = date;
    el.setAttribute('data-value', iso(date));
    render(el);
    focusDay(el, date);
    el.dispatchEvent(new CustomEvent('sg-calendar-select', { bubbles: true, detail: { value: iso(date), date: date } }));
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-sg-calendar] button');
    if (!t) return;
    var el = t.closest('[data-sg-calendar]');
    var st = state.get(el);
    if (!st) return;
    var dir = t.getAttribute('data-cal');
    if (dir) {
      var step = dir === 'next' ? 1 : -1;
      go(el, st.view === 'week' ? addDays(st.cursor, 7 * step) : addMonths(st.cursor, step), false);
      return;
    }
    if (t.classList.contains('cal__day')) select(el, parse(t.getAttribute('data-date')));
  });

  document.addEventListener('keydown', function (e) {
    var t = e.target.closest && e.target.closest('.cal__day');
    if (!t || e.ctrlKey || e.altKey || e.metaKey) return;
    var el = t.closest('[data-sg-calendar]');
    var st = state.get(el);
    if (!st) return;
    var d = parse(t.getAttribute('data-date'));
    var rtl = getComputedStyle(el).direction === 'rtl';
    var week = st.view === 'week';
    var next = null;
    switch (e.key) {
      case 'ArrowLeft': next = addDays(d, rtl ? 1 : -1); break;
      case 'ArrowRight': next = addDays(d, rtl ? -1 : 1); break;
      case 'ArrowUp': next = addDays(d, -7); break;
      case 'ArrowDown': next = addDays(d, 7); break;
      case 'Home': next = startOfWeek(d, st.first); break;
      case 'End': next = addDays(startOfWeek(d, st.first), 6); break;
      case 'PageUp': next = e.shiftKey ? (week ? addMonths(d, -1) : addMonths(d, -12)) : (week ? addDays(d, -7) : addMonths(d, -1)); break;
      case 'PageDown': next = e.shiftKey ? (week ? addMonths(d, 1) : addMonths(d, 12)) : (week ? addDays(d, 7) : addMonths(d, 1)); break;
      default: return;
    }
    e.preventDefault();
    go(el, next, true);
  });

  function init(scope) {
    SG.qsa('[data-sg-calendar]', scope).forEach(function (el) { if (!state.has(el)) build(el); });
  }

  SG.calendar = {
    labels: LABELS,
    init: init,
    value: function (el) { var st = state.get(el); return st && st.selected ? iso(st.selected) : null; },
    select: function (el, isoDate) { var d = parse(isoDate); if (d && state.get(el)) select(el, d); },
    setEvents: function (el, map) { var st = state.get(el); if (!st) return; st.events = map || {}; st.version++; render(el); },
  };

  SG.ready(function () { init(document); });
})((window.SG = window.SG || {}));
