/* ==========================================================================
   SG.prefs: user-chosen appearance, persisted, applied as data-* on <html>
   --------------------------------------------------------------------------
     SG.prefs.set('theme', 'dark')      light | dark | system
     SG.prefs.set('contrast', 'more')   more | system
     SG.prefs.set('palette', 'mint')    default | mint | periwinkle | sand | cream | wire | ...
     SG.prefs.set('corners', 'soft')    square (default) | soft
     SG.prefs.set('motion', 'reduced')  reduced | full | system
     SG.prefs.get('theme')              -> 'system' when unset
     SG.prefs.onChange(fn)              fn(name, value)
     SG.prefs.reset()

   "system" means: remove the attribute and follow the OS (prefers-color-scheme,
   prefers-contrast, prefers-reduced-motion). Give users a settings screen with
   these five controls in every app; some people cannot change OS settings.

   AVOID A FLASH OF THE WRONG THEME: apply the saved values before first paint
   with this inline snippet in <head> (before the stylesheet):
     <script>try{var p=JSON.parse(localStorage.getItem('sg:prefs')||'{}');for(var k in p)document.documentElement.setAttribute('data-'+k,p[k])}catch(e){}</script>
   ========================================================================== */
(function (SG) {
  'use strict';

  var STORE = 'sg:prefs';
  var NAMES = ['theme', 'contrast', 'palette', 'corners', 'motion'];
  var DEFAULT_VALUE = { palette: 'default', corners: 'square' }; // the values that mean "no attribute"
  var root = document.documentElement;
  var listeners = [];

  function saved() { return SG.storage.get(STORE, {}) || {}; }

  function isUnset(name, value) {
    return value == null || value === '' || value === 'system' || value === DEFAULT_VALUE[name];
  }

  function apply(name, value) {
    if (isUnset(name, value)) root.removeAttribute('data-' + name);
    else root.setAttribute('data-' + name, value);
  }

  /** Keep the browser UI colour in step when the user overrides the OS theme. */
  function syncThemeColor() {
    var metas = SG.qsa('meta[name="theme-color"]');
    if (!metas.length) return;
    var overridden = root.hasAttribute('data-theme') || root.hasAttribute('data-palette');
    if (!overridden) {
      // restore the media-query originals
      metas.forEach(function (m) { if (m.dataset.sgOriginal) { m.content = m.dataset.sgOriginal; } });
      return;
    }
    var hex = SG.tokenToHex('--canvas');
    metas.forEach(function (m) {
      if (!m.dataset.sgOriginal) m.dataset.sgOriginal = m.content;
      m.content = hex;
    });
  }

  SG.prefs = {
    names: NAMES,
    get: function (name) {
      var v = root.getAttribute('data-' + name);
      return v == null ? (DEFAULT_VALUE[name] && !root.hasAttribute('data-' + name) ? DEFAULT_VALUE[name] : 'system') : v;
    },
    set: function (name, value) {
      if (NAMES.indexOf(name) < 0) throw new Error('SG.prefs: unknown preference "' + name + '"');
      apply(name, value);
      var s = saved();
      if (isUnset(name, value)) delete s[name]; else s[name] = value;
      SG.storage.set(STORE, s);
      syncThemeColor();
      listeners.forEach(function (fn) { fn(name, SG.prefs.get(name)); });
    },
    reset: function () {
      NAMES.forEach(function (n) { root.removeAttribute('data-' + n); });
      SG.storage.remove(STORE);
      syncThemeColor();
      listeners.forEach(function (fn) { fn('*', null); });
    },
    onChange: function (fn) { listeners.push(fn); },
    all: function () {
      var o = {};
      NAMES.forEach(function (n) { o[n] = SG.prefs.get(n); });
      return o;
    },
  };

  // Apply saved values (idempotent if the inline snippet already did).
  var s = saved();
  NAMES.forEach(function (n) { if (s[n] != null) apply(n, s[n]); });
  SG.ready(syncThemeColor);
})((window.SG = window.SG || {}));
