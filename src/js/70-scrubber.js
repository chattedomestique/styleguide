/* ==========================================================================
   SG.scrubber: readout, aria-valuetext, ruler and step buttons for .scrubber
   --------------------------------------------------------------------------
   The range input does the real work (keys, pointer, touch, the slider role).
   This script adds what HTML cannot:
     · the readout text and aria-valuetext, formatted (signed, percent, time)
     · --_from / --_to on the wrapper, so the fill and the covered ticks follow the thumb
     · the ruler: decorative <i> ticks, built once (progressive: no script, no ruler)
     · [data-step="down|up"] buttons: input.stepDown() / stepUp(), announced, aria-disabled
       (not disabled) at the ends so focus is never thrown away by the last step
     · an optional [data-reset] button that returns to the input's default value
     · a ruler that thins out: under 4px between ticks (a narrow dial at 200% text) the minor ticks
       go (data-dense on .scrubber__ticks) and the major ones and the origin stay
     · one decision per panel: the scrubbers that share a parent keep every readout beside its label
       or put every one under it (SG.fit writes data-fit="beside|under" on the parent), so a tool's
       panel never mixes the two

   Markup it reads is documented in src/components/scrubber.css. Hooks are classes
   and data-* attributes, bound by delegation on document, so scrubbers added later
   (or re-rendered by an app) work without re-init; call SG.scrubber.sync(el) after
   you change a value, min or max from code (setting input.value fires no event).

   Also defined here, for every script after it in filename order:
     SG.afterParse(fn)   run fn once the document has been parsed AND every deferred
                         script has run (DOMContentLoaded), or at once if that has
                         passed. Enhancing on DOMContentLoaded instead of immediately
                         keeps DOM the script adds out of code that reads the
                         server-sent markup first (the docs "Markup" disclosure).
   ========================================================================== */
(function (SG) {
  'use strict';

  /* ---- SG.afterParse ---------------------------------------------------------------- */
  SG.afterParse = function (fn) {
    var done = false;
    function once() { if (done) return; done = true; fn(); }
    if (document.readyState === 'complete') { once(); return; }
    // 'loading' and 'interactive' both precede or include the deferred scripts. DOMContentLoaded is
    // the first moment they have all run; load is the backstop if it has already fired.
    document.addEventListener('DOMContentLoaded', once, { once: true });
    window.addEventListener('load', once, { once: true });
  };

  /* ---- Formatting ----------------------------------------------------------------------- */
  var MINUS = '−'; // the true minus, not a hyphen (STYLE.md: numbers)

  function trueMinus(text) { return text.replace(/^-/, MINUS); }

  function clock(seconds) {
    seconds = Math.max(0, Math.round(seconds));
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = seconds % 60;
    var ss = (s < 10 ? '0' : '') + s;
    return h ? h + ':' + (m < 10 ? '0' : '') + m + ':' + ss : m + ':' + ss;
  }

  /** Formatters take (value, input) and return { text, spoken }. Add your own: SG.scrubber.formatters.ev = … */
  var formatters = {
    number: function (v) {
      var t = trueMinus(new Intl.NumberFormat(document.documentElement.lang || undefined).format(v));
      return { text: t, spoken: t };
    },
    signed: function (v) {
      var t = trueMinus(new Intl.NumberFormat(document.documentElement.lang || undefined, { signDisplay: 'exceptZero' }).format(v));
      return { text: t, spoken: t };
    },
    percent: function (v) {
      var t = trueMinus(new Intl.NumberFormat(document.documentElement.lang || undefined).format(v)) + '%';
      return { text: t, spoken: t };
    },
    time: function (v, input) {
      var t = clock(v);
      return { text: t, spoken: t + ' of ' + clock(Number(input.max)) };
    },
  };

  function format(root, input) {
    var name = root.getAttribute('data-format') || 'number';
    var f = formatters[name] || formatters.number;
    var out = f(Number(input.value), input);
    var unit = root.getAttribute('data-unit');
    if (unit) { out.text += unit; out.spoken += unit; }
    return out;
  }

  /* ---- State ------------------------------------------------------------------------------- */
  function parts(root) {
    return {
      input: root.querySelector('input[type="range"]'),
      value: root.querySelector('.scrubber__value'),
      label: root.querySelector('.scrubber__label'),
      reset: root.querySelector('[data-reset]'),
    };
  }

  function setAriaDisabled(el, on) {
    if (!el) return;
    if (on) el.setAttribute('aria-disabled', 'true'); else el.removeAttribute('aria-disabled');
  }

  /** What Reset returns to: data-default on the input, else the value attribute it was sent with. */
  function resetValue(input) {
    return input.hasAttribute('data-default') ? input.getAttribute('data-default') : input.defaultValue;
  }

  /** Bring the readout, valuetext, fill and buttons in step with the input. */
  function sync(target) {
    var root = target && target.closest ? target.closest('.scrubber') : target;
    if (!root) return;
    var p = parts(root);
    if (!p.input) return;
    var min = Number(p.input.min || 0);
    var max = Number(p.input.max || 100);
    var value = Number(p.input.value);
    var span = max - min || 1;
    var pos = (value - min) / span;
    var origin = root.hasAttribute('data-origin') ? (Number(root.getAttribute('data-origin')) - min) / span : 0;
    origin = Math.min(1, Math.max(0, origin));
    root.style.setProperty('--_from', String(Math.min(origin, pos)));
    root.style.setProperty('--_to', String(Math.max(origin, pos)));

    var out = format(root, p.input);
    if (p.value) p.value.textContent = out.text;
    p.input.setAttribute('aria-valuetext', out.spoken);

    var down = root.querySelector('[data-step="down"]');
    var up = root.querySelector('[data-step="up"]');
    setAriaDisabled(down, p.input.disabled || value <= min);
    setAriaDisabled(up, p.input.disabled || value >= max);
    setAriaDisabled(p.reset, p.input.disabled || String(p.input.value) === String(resetValue(p.input)));
  }

  /** The ruler: n + 1 decorative ticks. One per step when that is a sensible number, else 20. */
  function buildTicks(root) {
    if (root.getAttribute('data-variant') === 'plain' || root.querySelector('.scrubber__ticks')) return;
    var p = parts(root);
    if (!p.input) return;
    var track = p.input.parentNode;
    var min = Number(p.input.min || 0);
    var max = Number(p.input.max || 100);
    var step = Number(p.input.step) || 1;
    var n = Number(root.getAttribute('data-ticks'));
    if (!n) { var steps = Math.round((max - min) / step); n = steps >= 4 && steps <= 40 ? steps : 20; }
    var major = Number(root.getAttribute('data-major')) || 5;
    // the origin (where the fill starts) is a tick that always stays, like the major ones
    var zero = root.hasAttribute('data-origin') ? Math.round(((Number(root.getAttribute('data-origin')) - min) / (max - min || 1)) * n) : -1;
    var ticks = document.createElement('span');
    ticks.className = 'scrubber__ticks';
    ticks.setAttribute('aria-hidden', 'true');
    ticks.setAttribute('data-count', String(n));
    for (var i = 0; i <= n; i++) {
      var t = document.createElement('i');
      t.style.setProperty('--p', String(Math.round((i / n) * 10000) / 10000));
      if (i % major === 0 || i === n || i === zero) t.setAttribute('data-major', '');
      ticks.appendChild(t);
    }
    track.insertBefore(ticks, p.input);
    density(ticks);
    if (ro) ro.observe(ticks);
  }

  /** Under 4px apart, 2px ticks run into one grey bar: keep the major ones (and the origin) only. */
  function density(ticks) {
    var n = Number(ticks.getAttribute('data-count')) || 1;
    var dense = ticks.getBoundingClientRect().width / n < 4;
    if (dense) ticks.setAttribute('data-dense', ''); else ticks.removeAttribute('data-dense');
  }
  var ro = 'ResizeObserver' in window ? new ResizeObserver(function (entries) { entries.forEach(function (e) { density(e.target); }); }) : null;

  /* ---- Events (delegated) --------------------------------------------------------------- */
  document.addEventListener('input', function (e) {
    if (e.target.matches && e.target.matches('.scrubber input[type="range"]')) sync(e.target);
  });

  function fire(input, type) { input.dispatchEvent(new Event(type, { bubbles: true })); }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.scrubber [data-step], .scrubber [data-reset]');
    if (!btn) return;
    var root = btn.closest('.scrubber');
    var p = parts(root);
    if (!p.input || p.input.disabled || btn.getAttribute('aria-disabled') === 'true') return;
    var before = p.input.value;
    if (btn.hasAttribute('data-reset')) p.input.value = resetValue(p.input);
    else if (btn.getAttribute('data-step') === 'down') p.input.stepDown();
    else p.input.stepUp();
    if (p.input.value === before) return;
    fire(p.input, 'input');
    fire(p.input, 'change');
    // Focus stays on the button, so say what the value is now.
    var name = p.label ? p.label.textContent.trim() : 'Value';
    SG.announce(name + ' ' + format(root, p.input).spoken);
  });

  function init(root) { buildTicks(root); sync(root); }

  SG.scrubber = { init: init, sync: sync, formatters: formatters, clock: clock };

  SG.afterParse(function () { SG.qsa('.scrubber').forEach(init); });

  /* every readout of a panel beside its label, or every one under it (see scrubber.css) */
  if (SG.fit) SG.fit.register(':has(> .scrubber)', { steps: ['beside', 'under'], parts: '.scrubber > .scrubber__head' });
})((window.SG = window.SG || {}));
