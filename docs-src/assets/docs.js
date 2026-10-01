/* ==========================================================================
   Docs behaviour (docs only, never shipped to apps).
   1. Appearance panel       theme / contrast / palette / surface / motion via SG.prefs
   2. Mobile navigation      slide-over drawer with focus management
   3. Demo code              every .demo gets a "Markup" disclosure generated from its live markup
   4. Token swatches         [data-swatches] lists live colours with contrast ratios
   ========================================================================== */
(function () {
  'use strict';
  var SG = window.SG;
  var $ = SG.qs, $$ = SG.qsa;

  function icon(id) {
    return '<span class="ic ic--' + id + '" aria-hidden="true"></span>';
  }

  /* ---- 1 · Appearance panel --------------------------------------------------------- */
  var OPTIONS = {
    theme: { label: 'Theme', opts: [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']] },
    contrast: { label: 'Contrast', opts: [['system', 'System'], ['more', 'More']] },
    palette: { label: 'Palette', opts: [['default', 'Default'], ['mint', 'Mint'], ['periwinkle', 'Periwinkle'], ['sand', 'Sand'], ['cream', 'Cream'], ['wire', 'Wire']] },
    corners: { label: 'Corners', opts: [['square', 'Square'], ['soft', 'Soft']] },
    motion: { label: 'Motion', opts: [['system', 'System'], ['reduced', 'Reduced'], ['full', 'Full']] },
  };

  function buildPanel() {
    var panel = $('#docs-prefs');
    if (!panel) return;
    var html = '<form>';
    Object.keys(OPTIONS).forEach(function (name) {
      var cfg = OPTIONS[name];
      html += '<fieldset><legend>' + cfg.label + '</legend><div class="opts">';
      cfg.opts.forEach(function (o) {
        html += '<label class="opt"><input type="radio" name="' + name + '" value="' + o[0] + '"> <span>' + o[1] + '</span></label>';
      });
      html += '</div></fieldset>';
    });
    html += '<p class="hint">Every page, component and colour on this site updates live. "System" follows your device. Saved in this browser only.</p>';
    html += '<button class="btn" type="button" data-size="sm" data-reset>Reset to system</button></form>';
    panel.innerHTML = html;

    function sync() {
      $$('input[type=radio]', panel).forEach(function (r) { r.checked = SG.prefs.get(r.name) === r.value; });
    }
    sync();
    panel.addEventListener('change', function (e) {
      if (e.target.name) SG.prefs.set(e.target.name, e.target.value);
    });
    $('[data-reset]', panel).addEventListener('click', function () { SG.prefs.reset(); sync(); SG.announce('Appearance reset to system settings'); });
    SG.prefs.onChange(function () { sync(); refreshSwatches(); });
  }

  /* ---- 2 · Mobile navigation -------------------------------------------------------------- */
  function buildNav() {
    var btn = $('.docs-bar__menu');
    var nav = $('#docs-nav');
    var scrim = $('[data-docs-scrim]');
    if (!btn || !nav) return;
    var wide = window.matchMedia('(min-width: 64em)');

    function setOpen(open, restoreFocus) {
      if (open) nav.setAttribute('data-open', ''); else nav.removeAttribute('data-open');
      btn.setAttribute('aria-expanded', String(open));
      scrim.hidden = !open;
      if (open) {
        var cur = $('[aria-current="page"]', nav) || $('a', nav);
        if (cur) cur.focus();
      } else if (restoreFocus) btn.focus();
    }
    btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true', true); });
    scrim.addEventListener('click', function () { setOpen(false, true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.hasAttribute('data-open')) { setOpen(false, true); }
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a') && !wide.matches) setOpen(false, false); });
    wide.addEventListener('change', function () { if (wide.matches) setOpen(false, false); });

    // Drawer is visibility:hidden when closed on phones; make sure the current link is in view on desktop.
    var cur = $('[aria-current="page"]', nav);
    if (cur && wide.matches) cur.scrollIntoView({ block: 'nearest' });
  }

  /* ---- 3 · Demo code -------------------------------------------------------------------------- */
  function dedent(text) {
    var lines = text.replace(/^\n+|\s+$/g, '').split('\n');
    var min = Infinity;
    lines.forEach(function (l) { if (l.trim()) min = Math.min(min, l.match(/^\s*/)[0].length); });
    if (!isFinite(min)) min = 0;
    return lines.map(function (l) { return l.slice(min); }).join('\n');
  }
  function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function buildDemos() {
    $$('.demo').forEach(function (demo) {
      if (demo.hasAttribute('data-nocode')) return;
      var stage = $('.demo__stage', demo);
      if (!stage) return;
      var raw = stage.getAttribute('data-code') || stage.innerHTML;
      var code = dedent(raw).replace(/\s*aria-describedby="sg-[^"]*"/g, '');
      var id = SG.uid('code');
      var det = document.createElement('details');
      det.className = 'demo__code';
      det.innerHTML = '<summary>' + icon('plus') + 'Markup</summary><pre><code id="' + id + '">' + escapeHtml(code) + '</code>' +
        '<button class="btn demo__copy" type="button" data-size="sm" aria-label="Copy markup">' + icon('copy') + '<span>Copy</span></button></pre>';
      demo.appendChild(det);
      $('.demo__copy', det).addEventListener('click', function (e) {
        var b = e.currentTarget;
        var done = function () { b.querySelector('span').textContent = 'Copied'; SG.announce('Code copied'); setTimeout(function () { b.querySelector('span').textContent = 'Copy'; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, function () {});
        else { var r = document.createRange(); r.selectNodeContents(document.getElementById(id)); var s = getSelection(); s.removeAllRanges(); s.addRange(r); done(); }
      });
    });
  }

  /* ---- 4 · Token swatches ---------------------------------------------------------------------- */
  function lum(rgb) {
    var f = function (c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  }
  function ratio(a, b) { var x = lum(a), y = lum(b); return ((x > y ? x : y) + 0.05) / ((x > y ? y : x) + 0.05); }
  function hexToRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

  /* <div data-swatches="--color-canvas --color-surface" data-on="--color-surface" data-min="4.5"></div>
     data-on: a colour to measure each token against; data-min: the threshold it must meet (default 3). */
  function refreshSwatches() {
    $$('[data-swatches]').forEach(function (box) {
      var names = box.getAttribute('data-swatches').split(/\s+/).filter(Boolean);
      var on = box.getAttribute('data-on');
      var min = parseFloat(box.getAttribute('data-min') || '3');
      var scope = box.closest('[data-tone],[data-status]') || box;
      var onHex = on ? SG.tokenToHex(on, scope) : null;
      box.classList.add('swatches');
      box.innerHTML = names.map(function (n) {
        var hex = SG.tokenToHex(n, scope);
        var meta = hex;
        if (onHex) {
          var r = ratio(hexToRgb(hex), hexToRgb(onHex));
          meta += ' · ' + r.toFixed(2) + ':1 · <span class="swatch__pass">' + (r >= min ? 'Pass ' + min : 'Below ' + min) + '</span>';
        }
        return '<div class="swatch"><span class="swatch__chip" style="background:var(' + n + ')"></span><span class="swatch__body"><span class="swatch__name">' + n + '</span><span class="swatch__meta">' + meta + '</span></span></div>';
      }).join('');
    });
  }

  /* Anything that scrolls sideways is a keyboard-reachable, named region (WCAG 1.4.10 / 2.1.1), and ONLY when it scrolls: a tab
     stop on a table that fits is noise. Tables that do scroll get a visible cue ("Scrolls sideways"), because a clipped last
     column with no sign of more is how the key content of a table goes unread. Re-checked when the width or the text size
     changes, since both decide whether it fits. Most docs tables stack on a phone (the build marks them data-stack) and never need this. */
  function refreshScrollers() {
    $$('pre, .table-wrap').forEach(function (el) {
      var scrolls = el.scrollWidth > el.clientWidth + 1;
      var own = el.hasAttribute('data-sg-scroller');
      if (scrolls) {
        if (!el.hasAttribute('tabindex')) { el.setAttribute('tabindex', '0'); el.setAttribute('data-sg-scroller', ''); }
        if (!el.hasAttribute('role')) { el.setAttribute('role', 'region'); el.setAttribute('data-sg-scroller', ''); }
        if (!el.hasAttribute('aria-label')) {
          var cap = el.classList.contains('table-wrap') ? $('caption', el) : null;
          el.setAttribute('aria-label', el.tagName === 'PRE' ? 'Code sample' : (cap ? cap.textContent.trim() : 'Table'));
        }
      } else if (own) {
        el.removeAttribute('tabindex'); el.removeAttribute('role'); el.removeAttribute('aria-label'); el.removeAttribute('data-sg-scroller');
      }
      if (el.classList.contains('table-wrap')) {
        var hint = el.nextElementSibling && el.nextElementSibling.classList.contains('table-hint') ? el.nextElementSibling : null;
        if (scrolls && !hint) {
          hint = document.createElement('p');
          hint.className = 'table-hint';
          hint.setAttribute('aria-hidden', 'true');
          hint.innerHTML = icon('chevrons-left-right') + 'Scrolls sideways';
          el.parentNode.insertBefore(hint, el.nextSibling);
        }
        if (hint) hint.hidden = !scrolls;
      }
    });
  }

  function buildTables() {
    refreshScrollers();
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(refreshScrollers, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshScrollers);
  }

  SG.ready(function () {
    buildPanel();
    buildNav();
    buildDemos();
    buildTables();
    refreshSwatches();
    // Fonts load late and change nothing for swatches, but wait for layout-affecting prefs:
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refreshSwatches);
  });
})();
