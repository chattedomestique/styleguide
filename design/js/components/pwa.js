/* ==========================================================================
   pwa.js — the installed app's page side: registers the worker that
   <meta name="flashcards-sw"> names, raises the offline and update Banners,
   offers install, share, notifications and storage, all by data-pwa and
   data-share markup. Silent where an API is missing (file:// included); it
   never reloads or prompts on its own. Spec: elements/pwa.md, STYLE.md §4.
   ========================================================================== */
(function () {
  "use strict";
  var NS = (window.Flashcards = window.Flashcards || {});
  var doc = document, nav = navigator;
  function noop() {}
  function yes() { return true; }
  function no() { return false; }
  var BAND = {
    offline: ["offline", "<strong>You're offline.</strong> Changes are saved on this device."],
    update: ["refresh", "<strong>A new version is ready.</strong>", "Reload"]
  };
  var INSTALL = '[data-pwa~="install"]', sw, reg, asked, deferred;

  function all(sel, fn) { Array.prototype.forEach.call(doc.querySelectorAll(sel), fn); }
  function show(sel, on) {
    all(sel, function (el) {
      if (!on && el.contains(doc.activeElement)) rescue(el);
      el.hidden = !on;
    });
  }
  // hiding the control that has focus would drop it on <body> (WCAG 2.4.3):
  // move it to the last heading above it that stays, else to main
  function rescue(el) {
    var to = el.closest("main") || doc.querySelector("main");
    if (!to) return;
    Array.prototype.forEach.call(to.querySelectorAll("h1, h2, h3, h4, h5, h6"), function (h) {
      if (!el.contains(h) && h.getClientRects().length && h.compareDocumentPosition(el) & 4) to = h;
    });
    if (!to.hasAttribute("tabindex")) to.setAttribute("tabindex", "-1");
    to.focus();
  }
  function size(n) { return n < 1e6 ? Math.ceil(n / 1e3) + " KB" : n < 1e9 ? (n / 1e6).toFixed(1) + " MB" : (n / 1e9).toFixed(1) + " GB"; }

  // a band may take both: offline first, else a waiting update
  function bands() {
    var update = reg && reg.waiting && nav.onLine;
    all('[data-pwa~="offline"], [data-pwa~="update"]', function (el) {
      var k = !nav.onLine && el.matches('[data-pwa~="offline"]') ? "offline" : update && el.matches('[data-pwa~="update"]') ? "update" : "", b = BAND[k];
      if (el.pwaNow === k) return;
      el.pwaNow = k;
      el.hidden = false; // empty, a band is undrawn but still speaks (banner.md)
      el.innerHTML = b ? '<span class="ic ic--' + b[0] + ' banner__icon" aria-hidden="true"></span><p class="banner__text">' + b[1] + "</p>" +
        (b[2] ? '<button class="btn banner__action" type="button" data-pwa="reload">' + b[2] + "</button>" : "") : "";
    });
  }
  function refresh() {
    var p = window.Notification && Notification.permission;
    show('[data-pwa~="notify-ask"]', p === "default");
    show('[data-pwa~="notify-denied"]', p === "denied");
    try {
      if (doc.querySelector('[data-pwa~="quota"]')) nav.storage.estimate().then(function (q) {
        if (q.quota) all('[data-pwa~="quota"]', function (el) {
          el.textContent = "Using " + size(q.usage || 0) + " of " + size(q.quota) + " on this device.";
          el.hidden = false;
        });
      }, noop);
    } catch (e) { /* none */ }
  }
  function share(b) {
    var url = new URL(b.getAttribute("data-share-url") || location.href, doc.baseURI).href, toast = NS.toast || noop;
    var frame = b.closest(".frame"), region = frame && frame.querySelector(':scope > .toasts[role="status"]');
    function copy() { // the toast speaks in the Share button's own frame, if it has one
      nav.clipboard.writeText(url).then(function () { toast({ text: "Link copied.", region: region }); },
        function () { toast({ text: "Couldn't copy the link.", failed: true, region: region }); });
    }
    if (!nav.share) return copy();
    nav.share({ title: b.getAttribute("data-share-title") || doc.title, url: url })
      .catch(function (e) { if (e.name !== "AbortError") copy(); });
  }

  // capture: with Chromium's prompt, Install skips the iOS sheet of its commandfor
  doc.addEventListener("click", function (e) {
    var t = e.target, b;
    if (!t.closest) return;
    if (deferred && t.closest("button" + INSTALL)) {
      e.preventDefault();
      e.stopPropagation();
      b = deferred.prompt();
      if (b) b.catch(noop);
      deferred = null; // one ask each
      show(INSTALL, false);
    } else if (t.closest('button[data-pwa~="reload"]')) {
      if (reg && reg.waiting) { asked = true; reg.waiting.postMessage({ type: "SKIP_WAITING" }); }
      else location.reload();
    } else if (window.Notification && t.closest('button[data-pwa~="notify"]')) {
      b = Notification.requestPermission();
      if (b) b.then(refresh, noop);
    } else if ((b = t.closest("button[data-share]"))) share(b);
  }, true);

  addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); // no pop-up: the page offers it
    deferred = e;
    show(INSTALL, !matchMedia("(display-mode: standalone)").matches);
  });
  addEventListener("appinstalled", function () { deferred = null; show(INSTALL, false); });
  addEventListener("online", bands);
  addEventListener("offline", bands);
  doc.addEventListener("visibilitychange", function () {
    if (doc.hidden) return;
    refresh();
    if (reg) reg.update().catch(noop);
  });

  // iOS: no prompt, but it tells a tab from the app, so offer the steps
  if (nav.standalone === false && doc.querySelector("button" + INSTALL + "[commandfor]")) show(INSTALL, true);
  show('[data-pwa~="reload"]', true);
  show("[data-share]", nav.share || (nav.clipboard && nav.clipboard.writeText));
  bands();
  refresh();

  var meta = doc.querySelector('meta[name="flashcards-sw"]');
  try { sw = meta && /^https?:$/.test(location.protocol) && nav.serviceWorker; } catch (e) { /* none */ }
  if (sw) sw.register(meta.content).then(function (r) {
    if (!(reg = r)) return;
    function check() { if (r.waiting && sw.controller) bands(); } // no controller: first install
    check();
    r.addEventListener("updatefound", function () {
      var w = r.installing;
      if (w) w.addEventListener("statechange", function () { if (w.state === "installed") check(); });
    });
    sw.addEventListener("controllerchange", function () { // after Reload, once
      if (asked) { asked = false; location.reload(); }
    });
  }, noop);

  NS.badge = function (n) { // the app icon's count, 0 clears; resolves true if it took
    return nav.setAppBadge ? (n ? nav.setAppBadge(n) : nav.clearAppBadge()).then(yes, no) : Promise.resolve(false);
  };
  NS.persist = function () { // after real use; true if storage outlives cleanup
    return nav.storage && nav.storage.persist ? nav.storage.persist().catch(no) : Promise.resolve(false);
  };
  NS.download = function (name, data) { // as a JSON file
    var a = doc.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = name;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  };
  NS.readJSON = function (file) { // rejects if it isn't JSON
    return file.text().then(JSON.parse);
  };
})();
