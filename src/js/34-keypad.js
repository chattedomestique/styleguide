/* ==========================================================================
   SG.keypad: amount entry for .keypad
   --------------------------------------------------------------------------
   Behaviour for any [data-sg-keypad] (see components/keypad.css). The keys are real buttons with a
   data-key of 0-9, ".", "back" or "clear"; the display is an <output> (a polite, atomic live region).
   This script does what markup cannot:

     1. ENTRY      builds the amount as a plain string ("1234.5") and writes it formatted for the page
                   language with Intl ("$1,234.5"): grouping, the decimal separator, the currency symbol
                   and its side. The point key shows the language's own separator.
     2. RULES      one point; at most data-decimals digits after it (default 2); at most data-max-digits
                   digits in all (default 9); never above data-max. A leading zero is replaced, not stacked.
                   A refused key press does nothing to the value, is ANNOUNCED ("Maximum is $5,000.00"),
                   and sets data-state="limit" on the keypad for a moment so the display can point at it.
     3. HARDWARE   digits, "." and ",", Backspace and Delete work while focus is anywhere in the keypad.
                   Enter and Space still press the focused button: that is how keyboard-only people use
                   the keys, and the confirm button is its own tab stop.
     4. CONFIRM    any [data-sg-keypad-confirm] inside the keypad gets aria-disabled="true" until the
                   amount is above data-min (default 0). It stays focusable so a reason in
                   aria-describedby can be read; SG.guard makes it inert.
     5. HOLD       holding "back" repeats the delete after 450 ms. Tapping always works; nothing needs holding.
     6. FORMS      a hidden <input> inside the keypad receives the plain value ("12.5") for submission.

   Events (bubble from the keypad): "sg:keypad" with detail { raw, value, formatted } after every change.
   API (window.SG.keypad): init(root), get(pad) -> { raw, value, formatted }, set(pad, raw), press(pad, key).

   Messages (override with data attributes on the keypad): data-msg-max "Maximum is {max}",
   data-msg-digits "No more digits", data-msg-decimals "Only {n} decimal places", data-msg-point
   "Already has a decimal point".
   ========================================================================== */
(function (SG) {
  'use strict';

  var HOLD_DELAY = 450;
  var state = new WeakMap(); // pad -> { raw, timer, hold, repeat, held, fmt }

  function locale() { return document.documentElement.lang || undefined; }
  function st(pad) {
    var s = state.get(pad);
    if (!s) { s = { raw: '', timer: 0, hold: 0, repeat: 0, held: false, fmt: null }; state.set(pad, s); }
    return s;
  }
  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }

  function cfg(pad) {
    var dec = pad.getAttribute('data-decimals');
    return {
      decimals: dec === null ? 2 : Math.max(0, parseInt(dec, 10) || 0),
      max: pad.hasAttribute('data-max') ? num(pad.getAttribute('data-max'), Infinity) : Infinity,
      min: num(pad.getAttribute('data-min'), 0),
      hasMin: pad.hasAttribute('data-min'),
      maxDigits: parseInt(pad.getAttribute('data-max-digits'), 10) || 9,
    };
  }

  /* Intl pieces, built once per keypad: the grouping formatter, the decimal separator, the currency affixes. */
  function fmtOf(pad) {
    var s = st(pad);
    var lang = locale();
    var currency = pad.getAttribute('data-currency');
    var key = lang + '|' + currency;
    if (s.fmt && s.fmt.key === key) return s.fmt;
    var f = { key: key, group: null, dec: '.', prefix: '', suffix: '' };
    try {
      f.group = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 });
      var sample = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).formatToParts(1.1);
      sample.forEach(function (p) { if (p.type === 'decimal') f.dec = p.value; });
      if (currency) {
        var seenInt = false;
        new Intl.NumberFormat(lang, { style: 'currency', currency: currency, maximumFractionDigits: 0 }).formatToParts(1).forEach(function (p) {
          if (p.type === 'integer') { seenInt = true; return; }
          if (p.type === 'currency' || p.type === 'literal' || p.type === 'minusSign') {
            if (seenInt) f.suffix += p.value; else f.prefix += p.value;
          }
        });
      }
    } catch (e) {
      f.group = { format: function (n) { return String(n); } };
    }
    s.fmt = f;
    return f;
  }

  function format(pad, raw) {
    var f = fmtOf(pad);
    var dot = raw.indexOf('.');
    var whole = dot < 0 ? raw : raw.slice(0, dot);
    var text = f.group.format(whole === '' ? 0 : parseInt(whole, 10));
    if (dot >= 0) text += f.dec + raw.slice(dot + 1);
    return f.prefix + text + f.suffix;
  }

  function valueOf(raw) { return raw === '' ? 0 : parseFloat(raw); }

  function message(pad, name, fallback, vars) {
    var t = pad.getAttribute('data-msg-' + name) || fallback;
    Object.keys(vars || {}).forEach(function (k) { t = t.replace('{' + k + '}', vars[k]); });
    return t;
  }

  /* ---- render ------------------------------------------------------------------------------ */
  function render(pad) {
    var s = st(pad);
    var c = cfg(pad);
    var out = pad.querySelector('output');
    var text = format(pad, s.raw);
    if (out && out.textContent !== text) out.textContent = text;
    if (s.raw === '') pad.setAttribute('data-empty', ''); else pad.removeAttribute('data-empty');

    var hidden = pad.querySelector('input[type="hidden"]');
    if (hidden) hidden.value = s.raw.replace(/\.$/, '');

    var v = valueOf(s.raw);
    var ready = c.hasMin ? v >= c.min && v > 0 : v > 0;
    SG.qsa('[data-sg-keypad-confirm]', pad).forEach(function (b) {
      if (ready) b.removeAttribute('aria-disabled'); else b.setAttribute('aria-disabled', 'true');
    });
    return { raw: s.raw.replace(/\.$/, ''), value: v, formatted: text };
  }

  function refuse(pad, text) {
    var s = st(pad);
    pad.setAttribute('data-state', 'limit');
    window.clearTimeout(s.timer);
    s.timer = window.setTimeout(function () { pad.removeAttribute('data-state'); }, 1400);
    SG.announce(text);
    return false;
  }

  /* ---- entry ------------------------------------------------------------------------------- */
  function press(pad, key) {
    var s = st(pad);
    var c = cfg(pad);
    var raw = s.raw;
    var next = raw;

    if (key === 'back') {
      if (!raw) return false;
      next = raw.slice(0, -1);
    } else if (key === 'clear') {
      if (!raw) return false;
      next = '';
    } else if (key === '.') {
      if (c.decimals === 0) return false;
      if (raw.indexOf('.') >= 0) return refuse(pad, message(pad, 'point', 'Already has a decimal point'));
      next = (raw || '0') + '.';
    } else if (/^[0-9]$/.test(key)) {
      var dot = raw.indexOf('.');
      if (dot >= 0 && raw.length - dot - 1 >= c.decimals) {
        return refuse(pad, message(pad, 'decimals', 'Only {n} decimal places', { n: c.decimals }));
      }
      next = raw === '0' ? key : raw + key;
    } else {
      return false;
    }

    if (next.replace('.', '').replace(/^0+(?=\d)/, '').length > c.maxDigits) {
      return refuse(pad, message(pad, 'digits', 'No more digits'));
    }
    if (valueOf(next) > c.max) {
      return refuse(pad, message(pad, 'max', 'Maximum is {max}', { max: format(pad, c.max.toFixed(c.decimals)) }));
    }

    s.raw = next;
    pad.removeAttribute('data-state');
    var detail = render(pad);
    pad.dispatchEvent(new CustomEvent('sg:keypad', { bubbles: true, detail: detail }));
    return true;
  }

  function set(pad, raw) {
    st(pad).raw = String(raw == null ? '' : raw).replace(/[^0-9.]/g, '');
    return render(pad);
  }

  function get(pad) {
    var s = st(pad);
    return { raw: s.raw.replace(/\.$/, ''), value: valueOf(s.raw), formatted: format(pad, s.raw) };
  }

  function init(root) {
    SG.qsa('[data-sg-keypad]', root || document).forEach(function (pad) {
      var c = cfg(pad);
      var point = pad.querySelector('[data-key="."]');
      if (point) {
        if (c.decimals === 0) point.setAttribute('aria-disabled', 'true');
        else if (point.textContent.trim() === '.' || point.textContent.trim() === ',') point.textContent = fmtOf(pad).dec;
      }
      st(pad).raw = (pad.getAttribute('data-value') || '').replace(/[^0-9.]/g, '');
      render(pad);
    });
  }

  /* ---- events ------------------------------------------------------------------------------ */
  function keyOf(e) {
    var btn = e.target.closest ? e.target.closest('[data-key]') : null;
    var pad = btn && btn.closest('[data-sg-keypad]');
    return pad ? { btn: btn, pad: pad, key: btn.getAttribute('data-key') } : null;
  }

  function stopHold(pad) {
    var s = st(pad);
    window.clearTimeout(s.hold);
    window.clearInterval(s.repeat);
    s.hold = 0;
    s.repeat = 0;
  }

  document.addEventListener('click', function (e) {
    var k = keyOf(e);
    if (!k || k.btn.getAttribute('aria-disabled') === 'true') return;
    var s = st(k.pad);
    stopHold(k.pad);
    // The hold already repeated, so the click that ends it adds nothing. Only a POINTER click is swallowed
    // (detail > 0): a hold that ended off the key never produced one, and the next keyboard Enter / Space
    // (detail 0) on the key must still work.
    if (s.held) { s.held = false; if (e.detail > 0) return; }
    press(k.pad, k.key);
  });

  /* Hold "back" to keep deleting: an enhancement on top of the tap. */
  document.addEventListener('pointerdown', function (e) {
    if (e.button > 0) return;
    var k = keyOf(e);
    if (!k) return;
    var s = st(k.pad);
    s.held = false; // a hold that ended off the key never produced a click; do not swallow the next one
    if (k.key !== 'back') return;
    stopHold(k.pad);
    s.hold = window.setTimeout(function () {
      s.held = true;
      s.repeat = window.setInterval(function () { if (!press(k.pad, 'back')) stopHold(k.pad); }, 90);
    }, HOLD_DELAY);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      var pad = e.target.closest ? e.target.closest('[data-sg-keypad]') : null;
      if (pad) stopHold(pad);
    }, true);
  });
  document.addEventListener('contextmenu', function (e) {
    var k = keyOf(e);
    if (k && (st(k.pad).hold || st(k.pad).held)) e.preventDefault();
  });

  /* A hardware keyboard: digits, the point or comma, Backspace and Delete. */
  document.addEventListener('keydown', function (e) {
    var pad = e.target.closest ? e.target.closest('[data-sg-keypad]') : null;
    if (!pad || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if (e.target.matches && e.target.matches('input:not([type="hidden"]), textarea, select, [contenteditable]')) return;
    var key = null;
    if (/^[0-9]$/.test(e.key)) key = e.key;
    else if (e.key === '.' || e.key === ',') key = '.';
    else if (e.key === 'Backspace' || e.key === 'Delete') key = 'back';
    if (key === null) return;
    e.preventDefault();
    press(pad, key);
  });

  SG.keypad = { init: init, get: get, set: set, press: press };

  // One frame after load (see 30-field.js for why), still before first paint.
  SG.ready(function () { window.requestAnimationFrame(function () { init(document); }); });
})((window.SG = window.SG || {}));
