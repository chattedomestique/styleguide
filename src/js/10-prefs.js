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

   YOUR APP'S OWN LOOK. Author it as attributes on <html> (<html data-palette="mint" data-corners="soft">).
   Choosing the guide's own default ("default", "square") then writes that value explicitly, so it wins over
   what you authored; and reset() puts your authored attributes back instead of stripping them.

   TWO APPS ON ONE ORIGIN share localStorage. Give each its own key on <html>:
     <html data-sg-prefs-key="flashcards:prefs">
   (read once, when the script loads; use the same key in the head snippet below).

   AVOID A FLASH OF THE WRONG THEME: apply the saved values before first paint
   with this inline snippet in <head> (before the stylesheet):
     <script>try{var p=JSON.parse(localStorage.getItem('sg:prefs')||'{}');for(var k in p)document.documentElement.setAttribute('data-'+k,p[k])}catch(e){}</script>
   With your own key, replace 'sg:prefs' there with the same string.
   ========================================================================== */
(function (SG) {
  'use strict';

  var root = document.documentElement;
  var STORE = root.getAttribute('data-sg-prefs-key') || 'sg:prefs';
  var NAMES = ['theme', 'contrast', 'palette', 'corners', 'motion'];
  var DEFAULT_VALUE = { palette: 'default', corners: 'square' }; // the guide's own values; they mean "no attribute" unless the app authored another
  var listeners = [];

  function saved() { return SG.storage.get(STORE, {}) || {}; }

  // What the app wrote on <html> itself. When a choice is saved over it, the original is kept under "was-<name>"
  // (the head snippet copies it to a harmless data-was-* attribute); otherwise a value that differs from the
  // saved one, or any value when nothing is saved, is the app's own.
  var authored = {};
  (function () {
    var s = saved();
    NAMES.forEach(function (n) {
      var cur = root.getAttribute('data-' + n);
      authored[n] = s['was-' + n] != null ? s['was-' + n] : (cur != null && s[n] !== cur ? cur : null);
    });
  })();

  /** Must this choice be stored? Not if it just means "what the app wrote" or "nothing at all". */
  function explicit(name, value) {
    if (value == null || value === '') return false;
    if (value === authored[name]) return false;
    if (value === 'system' || value === DEFAULT_VALUE[name]) return authored[name] != null; // these need writing down only to override the app's own
    return true;
  }

  function apply(name, value) {
    var plain = value == null || value === '' || value === 'system' || (value === DEFAULT_VALUE[name] && authored[name] == null);
    if (plain) root.removeAttribute('data-' + name);
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
      if (explicit(name, value)) {
        s[name] = value;
        if (authored[name] != null) s['was-' + name] = authored[name];
      } else {
        delete s[name];
        delete s['was-' + name];
      }
      if (Object.keys(s).length) SG.storage.set(STORE, s); else SG.storage.remove(STORE);
      syncThemeColor();
      listeners.forEach(function (fn) { fn(name, SG.prefs.get(name)); });
    },
    reset: function () {
      NAMES.forEach(function (n) {
        if (authored[n] != null) root.setAttribute('data-' + n, authored[n]); else root.removeAttribute('data-' + n);
      });
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
