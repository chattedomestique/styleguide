#!/usr/bin/env node
/* ==========================================================================
   serve.mjs — a static server for design/, for the PWA starter. Zero
   dependencies.

     node design/tools/serve.mjs [port]      http://localhost:8000/pwa/

   A service worker needs a secure context, and localhost is one, so this is
   all the starter needs to install, work offline and update. Every response
   says Cache-Control: no-cache, so the browser asks again each time and an
   edit shows on the next reload; the worker's own cache is what makes the
   app work offline. Paths can't leave design/.
   ========================================================================== */

import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { join, extname, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2]) || 8000;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function send(res, status, text, headers = {}) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache", ...headers });
  res.end(text);
}

/* the real file a URL path names, or null if it isn't inside design/ */
async function locate(urlPath) {
  let path;
  try {
    path = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (path.includes("\0")) return null;
  const full = join(ROOT, path); // join normalises "..", so check where it landed
  if (full !== ROOT && !full.startsWith(ROOT + sep)) return null;
  try {
    const real = await realpath(full); // and a symlink can't lead out either
    const root = await realpath(ROOT);
    return real === root || real.startsWith(root + sep) ? real : null;
  } catch {
    return null;
  }
}

async function handle(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method not allowed\n", { Allow: "GET, HEAD" });
  const url = new URL(req.url, "http://localhost");
  let file = await locate(url.pathname);
  if (!file) return send(res, 404, "Not found\n");
  let info = await stat(file);
  if (info.isDirectory()) {
    // /pwa -> /pwa/, so the page's relative URLs resolve inside it
    if (!url.pathname.endsWith("/")) return send(res, 301, "", { Location: url.pathname + "/" + url.search });
    file = await locate(join(url.pathname, "index.html"));
    info = file && (await stat(file));
    if (!info || !info.isFile()) return send(res, 404, "Not found\n");
  }
  res.writeHead(200, {
    "Content-Type": TYPES[extname(file).toLowerCase()] || "application/octet-stream",
    "Content-Length": info.size,
    "Cache-Control": "no-cache",
    "X-Content-Type-Options": "nosniff",
  });
  if (req.method === "HEAD") return res.end();
  createReadStream(file).pipe(res);
}

const server = createServer((req, res) => {
  handle(req, res).catch(() => {
    if (!res.headersSent) send(res, 500, "Server error\n");
    else res.end();
  });
});

server.listen(PORT, "localhost", () => {
  console.log(`Serving design/ at http://localhost:${PORT}/`);
  console.log(`The PWA starter:  http://localhost:${PORT}/pwa/`);
});
