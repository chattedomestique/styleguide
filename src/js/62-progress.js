/* ==========================================================================
   SG.progress: keep the visual, the numbers and the announcements in step
   --------------------------------------------------------------------------
   The CSS reads --value; assistive tech reads aria-valuenow; people read text. They
   must agree, and CSS cannot copy one into the other. This does, for every form in
   components/progress.css:

     SG.progress.set(el, value, opts)
       el      a .progress, .meter, .progress-ring or .progress-steps (or any element inside one)
       value   a number in [min, max], or null on a .progress for indeterminate
       opts    max       (default: the element's own max, else 100)
               text      the visible value ("68%" by default, or "12 of 18 photos")
               hint      replaces .progress__hint
               announce  a short name ("Uploading photos"): on crossing 25, 50, 75 and 100 %
                         it says "Uploading photos: 50 percent" / "...: complete" once, politely
                         through SG.announce. Never every tick (WCAG 4.1.3).
               valuetext aria-valuetext for .meter / .progress-ring ("5 of 12 shapes")
     SG.progress.percent(el) -> the current value as 0-100, or null

   .progress        sets the native <progress> value (removes it for null = indeterminate)
   .meter           sets aria-valuenow and --value: "41.6%"
   .progress-ring   sets aria-valuenow, --value: 41.6 (a bare number) and the centre text
   .progress-steps  SG.progress.set(el, 2, { max: 4, name: "Payment" }) rewrites the text
                    "Step 2 of 4 Payment" and marks the segments done / current / upcoming

   Nothing here is required: static markup with matching numbers works without it.
   ========================================================================== */
(function (SG) {
  'use strict';

  var MILESTONES = [25, 50, 75, 100];

  function root(el) {
    return el && el.closest ? el.closest('.progress, .meter, .progress-ring, .progress-steps') : null;
  }
  function round(n) {
    return Math.round(n * 10) / 10;
  }
  function pct(value, min, max) {
    if (max === min) return 0;
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  }
  function setText(node, text) {
    if (node && text != null && node.textContent !== String(text)) node.textContent = String(text);
  }

  function milestone(el, p, name) {
    if (!name) return;
    var hit = 0;
    MILESTONES.forEach(function (m) { if (p >= m) hit = m; });
    var last = el._sgMilestone || 0;
    el._sgMilestone = hit;
    if (hit > last) SG.announce(name + ': ' + (hit === 100 ? 'complete' : hit + ' percent'));
  }

  function setLinear(el, value, o) {
    var bar = el.querySelector('.progress__bar');
    if (!bar) return null;
    if (value == null) {
      bar.removeAttribute('value');
      setText(el.querySelector('.progress__value'), o.text != null ? o.text : '');
      return null;
    }
    var max = o.max != null ? o.max : Number(bar.getAttribute('max')) || 100;
    bar.setAttribute('max', String(max));
    bar.setAttribute('value', String(value));
    var p = pct(value, 0, max);
    setText(el.querySelector('.progress__value'), o.text != null ? o.text : Math.round(p) + '%');
    bar.textContent = o.text != null ? o.text : Math.round(p) + '%';
    return p;
  }

  function setMeterLike(el, value, o, ring) {
    var min = Number(el.getAttribute('aria-valuemin')) || 0;
    var max = o.max != null ? o.max : Number(el.getAttribute('aria-valuemax')) || 100;
    el.setAttribute('aria-valuemax', String(max));
    el.setAttribute('aria-valuenow', String(value));
    var p = pct(value, min, max);
    if (ring) el.style.setProperty('--value', String(round(p)));
    else el.style.setProperty('--value', round(p) + '%');
    if (o.valuetext != null) el.setAttribute('aria-valuetext', String(o.valuetext));
    if (ring) setText(el.querySelector('.progress-ring__num'), o.text != null ? o.text : Math.round(p) + '%');
    return p;
  }

  function setSteps(el, value, o) {
    var max = o.max != null ? o.max : el.querySelectorAll('.progress-steps__bar > *').length;
    var segs = el.querySelectorAll('.progress-steps__bar > *');
    Array.prototype.forEach.call(segs, function (s, i) {
      if (i < value - 1) s.setAttribute('data-state', 'done');
      else if (i === value - 1) s.setAttribute('data-state', 'current');
      else s.removeAttribute('data-state');
    });
    var text = el.querySelector('.progress-steps__text');
    if (text) {
      var strong = text.querySelector('strong');
      var name = text.querySelector('.progress-steps__name');
      setText(strong, 'Step ' + value + ' of ' + max);
      if (o.name != null) setText(name, o.name);
    }
    return pct(value - 1, 0, max);
  }

  function set(el, value, opts) {
    var r = root(el);
    if (!r) return null;
    var o = opts || {};
    var p;
    if (r.classList.contains('progress')) p = setLinear(r, value, o);
    else if (r.classList.contains('meter')) p = setMeterLike(r, value, o, false);
    else if (r.classList.contains('progress-ring')) p = setMeterLike(r, value, o, true);
    else p = setSteps(r, value, o);
    if (o.hint != null) setText(r.querySelector('.progress__hint'), o.hint);
    if (p != null) milestone(r, p, o.announce);
    return p;
  }

  function percent(el) {
    var r = root(el);
    if (!r) return null;
    if (r.classList.contains('progress')) {
      var bar = r.querySelector('.progress__bar');
      if (!bar || !bar.hasAttribute('value')) return null;
      return pct(Number(bar.getAttribute('value')), 0, Number(bar.getAttribute('max')) || 100);
    }
    if (r.hasAttribute('aria-valuenow')) return pct(Number(r.getAttribute('aria-valuenow')), Number(r.getAttribute('aria-valuemin')) || 0, Number(r.getAttribute('aria-valuemax')) || 100);
    return null;
  }

  SG.progress = { set: set, percent: percent };
})((window.SG = window.SG || {}));
