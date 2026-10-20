/* ==========================================================================
   sw.js — the starter's service worker. Rules: elements/pwa.md, STYLE.md §4.

   The app shell (SHELL) is precached under a versioned name. VERSION is a
   hash of those files, stamped by tools/bundle.mjs, so changing any of them
   makes a new worker. It installs beside the old one and waits: the page
   shows the update Banner, and only its Reload button (SKIP_WAITING) lets
   it take over. Nothing reloads by surprise.

     shell (same origin)        cache first
     the rest of the origin     stale-while-revalidate
     other origins              not touched: no respondWith, network only
     a page with nothing cached offline.html, when the network fails

   Add a file to SHELL when the app can't start without it; run the bundle.
   ========================================================================== */
"use strict";

var VERSION = "dc1c85f95d"; // stamped by tools/bundle.mjs: don't edit
var SHELL = [
  "./",
  "decks.html",
  "settings.html",
  "offline.html",
  "app.js",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "../dist/flashcards.min.css",
  "../dist/flashcards.min.js",
  "../fonts/archivo-latin-var.woff2"
];

// one cache per version, named for this scope, so two apps on one origin
// never delete each other's
var PREFIX = "flashcards " + self.registration.scope + " ";
var CACHE = PREFIX + VERSION;
var OFFLINE = new URL("offline.html", self.location).href;
var PRECACHED = {};
SHELL.forEach(function (u) { PRECACHED[new URL(u, self.location).href] = true; });

self.addEventListener("install", function (e) {
  // cache: "reload" skips the HTTP cache, so a new version never precaches an old file
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }));
});

self.addEventListener("message", function (e) {
  if (e.data === "SKIP_WAITING" || (e.data && e.data.type === "SKIP_WAITING")) self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf(PREFIX) === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  var key = url.origin + url.pathname.replace(/\/index\.html$/, "/");
  var nav = req.mode === "navigate";
  e.respondWith(caches.open(CACHE).then(function (c) {
    if (PRECACHED[key]) {
      return c.match(key).then(function (hit) {
        return hit || fetch(req).catch(function () { return fallback(c, nav); });
      });
    }
    return c.match(req).then(function (hit) {
      var fresh = fetch(req).then(function (res) {
        if (res.status === 200 && res.type === "basic") e.waitUntil(c.put(req, res.clone()).catch(function () {}));
        return res;
      });
      if (hit) {
        e.waitUntil(fresh.catch(function () {}));
        return hit;
      }
      return fresh.catch(function () { return fallback(c, nav); });
    });
  }));
});

// a page that isn't cached, offline: offline.html. It is served at the URL
// asked for, so a <base> at the scope keeps its relative links working.
function fallback(c, nav) {
  if (!nav) return Response.error();
  return c.match(OFFLINE).then(function (res) {
    if (!res) return Response.error();
    return res.text().then(function (html) {
      return new Response(html.replace(/<head>/i, '<head><base href="' + self.registration.scope + '">'), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    });
  });
}
