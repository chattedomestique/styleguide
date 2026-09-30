/* ==========================================================================
   SG.stepper: quantity control behaviour
   --------------------------------------------------------------------------
   For any [data-sg-stepper] (see components/stepper.css). The value is a native
   <input type="number">; this wires the - / + buttons:

     - click steps by the input's own step / min / max (input.stepUp / stepDown), then fires
       "input" and "change" so forms and app code see it like a typed change
     - at a limit the button gets aria-disabled="true" (kept in the tab order and never removed;
       SG.guard makes it inert). Typing a value re-evaluates the limits
     - the new value is announced politely, debounced so a fast run of clicks or a long press
       says only the final number: "Quantity: 3", plus ", maximum" / ", minimum" at a limit
     - holding a button (mouse, touch or pen; never required) repeats the step after 450 ms,
       speeding up; releasing, leaving or cancelling stops it. A held press does not add one
       more step on release
     - a typed value outside min / max is pulled back into range when the field loses focus

   Announcement wording: data-announce="{label}: {value}" on the stepper (default).
   Events bubble from the input: listen for "change".
   ========================================================================== */
(function (SG) {
  'use strict';

  var HOLD_DELAY = 450;
  var timers = new WeakMap(); // stepper -> { announce, hold, repeat, held }

  function parts(stepper) {
    return {
      input: stepper.querySelector('input'),
      minus: stepper.querySelector('[data-sg-step^="-"]'),
      plus: stepper.querySelector('[data-sg-step]:not([data-sg-step^="-"])'),
    };
  }
  function st(stepper) {
    var s = timers.get(stepper);
    if (!s) { s = { announce: 0, hold: 0, repeat: 0, held: false }; timers.set(stepper, s); }
    return s;
  }
  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }

  function sync(stepper) {
    var p = parts(stepper);
    if (!p.input) return;
    var v = num(p.input.value, null);
    var min = num(p.input.min, -Infinity);
    var max = num(p.input.max, Infinity);
    var set = function (btn, off) {
      if (!btn) return;
      if (off) btn.setAttribute('aria-disabled', 'true'); else btn.removeAttribute('aria-disabled');
    };
    set(p.minus, v !== null && v <= min);
    set(p.plus, v !== null && v >= max);
  }

  function say(stepper) {
    var p = parts(stepper);
    var s = st(stepper);
    window.clearTimeout(s.announce);
    s.announce = window.setTimeout(function () {
      var label = p.input.labels && p.input.labels[0] ? p.input.labels[0].textContent.replace(/\s+/g, ' ').trim() : (p.input.getAttribute('aria-label') || '');
      var v = num(p.input.value, 0);
      var tpl = stepper.getAttribute('data-announce') || '{label}: {value}';
      var text = tpl.replace('{label}', label).replace('{value}', String(v));
      if (v >= num(p.input.max, Infinity)) text += ', maximum';
      else if (v <= num(p.input.min, -Infinity)) text += ', minimum';
      SG.announce(text);
    }, 350);
  }

  function step(stepper, dir) {
    var p = parts(stepper);
    if (!p.input || p.input.disabled) return false;
    var before = p.input.value;
    try {
      if (p.input.value === '') p.input.value = p.input.min || '0';
      else if (dir > 0) p.input.stepUp(dir); else p.input.stepDown(-dir);
    } catch (e) { /* step="any": nothing sensible to do */ }
    var changed = p.input.value !== before;
    if (changed) {
      p.input.dispatchEvent(new Event('input', { bubbles: true }));
      p.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    sync(stepper);
    if (changed) say(stepper);
    return changed;
  }

  function stopHold(stepper) {
    var s = st(stepper);
    window.clearTimeout(s.hold);
    window.clearInterval(s.repeat);
    s.hold = 0;
    s.repeat = 0;
  }

  /* Long press: an enhancement on top of the click, which always works. */
  document.addEventListener('pointerdown', function (e) {
    if (e.button > 0) return;
    var btn = e.target.closest ? e.target.closest('[data-sg-step]') : null;
    var stepper = btn && btn.closest('[data-sg-stepper]');
    if (!stepper || btn.getAttribute('aria-disabled') === 'true') return;
    var dir = num(btn.getAttribute('data-sg-step'), 0);
    var s = st(stepper);
    s.held = false;
    stopHold(stepper);
    s.hold = window.setTimeout(function () {
      var count = 0;
      s.held = true;
      var tick = function () {
        if (!step(stepper, dir)) stopHold(stepper); // reached the limit
        count++;
        if (count === 8) { window.clearInterval(s.repeat); s.repeat = window.setInterval(tick, 60); }
      };
      tick();
      s.repeat = window.setInterval(tick, 120);
    }, HOLD_DELAY);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      var stepper = e.target.closest ? e.target.closest('[data-sg-stepper]') : null;
      if (stepper) stopHold(stepper);
    }, true);
  });
  document.addEventListener('contextmenu', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-sg-step]') : null;
    var stepper = btn && btn.closest('[data-sg-stepper]');
    if (stepper && (st(stepper).hold || st(stepper).held)) e.preventDefault();
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-sg-step]') : null;
    var stepper = btn && btn.closest('[data-sg-stepper]');
    if (!stepper || btn.getAttribute('aria-disabled') === 'true') return;
    var s = st(stepper);
    stopHold(stepper);
    // The press already repeated, so the click that ends it adds nothing. Only a POINTER click is swallowed
    // (detail > 0): a hold that ended off the button never produced one, and the next keyboard Enter / Space
    // (detail 0) must still work.
    if (s.held) { s.held = false; if (e.detail > 0) return; }
    step(stepper, num(btn.getAttribute('data-sg-step'), 0));
  });

  document.addEventListener('input', function (e) {
    var stepper = e.target.closest ? e.target.closest('[data-sg-stepper]') : null;
    if (stepper) sync(stepper);
  });

  /* Typed values: pull back into range when the field is left. */
  document.addEventListener('change', function (e) {
    var stepper = e.target.closest ? e.target.closest('[data-sg-stepper]') : null;
    if (!stepper || !e.target.matches('input')) return;
    var input = e.target;
    var v = num(input.value, null);
    if (v !== null) {
      var clamped = Math.min(num(input.max, Infinity), Math.max(num(input.min, -Infinity), v));
      if (clamped !== v) { input.value = String(clamped); say(stepper); }
    }
    sync(stepper);
  });

  function init(root) { SG.qsa('[data-sg-stepper]', root || document).forEach(sync); }
  document.addEventListener('reset', function (e) { window.setTimeout(function () { init(e.target); }, 0); });

  SG.stepper = { init: init, step: step };

  // One frame after load (see 30-field.js for why), still before first paint.
  SG.ready(function () { window.requestAnimationFrame(function () { init(document); }); });
})((window.SG = window.SG || {}));
