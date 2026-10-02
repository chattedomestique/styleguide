#!/usr/bin/env node
/**
 * Tiny static file server, zero dependencies.
 *
 *   node scripts/serve.mjs [dir=docs] [port=4173]
 *
 * Also importable: `import { serve } from './serve.mjs'` returns { url, close }.
 * Serves index.html for directories and sends correct types for woff2/webmanifest/svg,
 * so service workers and fonts behave the way they will in production.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, normalize, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
}

export function serve(dir, port = 0) {
  const root = resolve(dir)
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x')
      let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
      let file = join(root, path)
      if (!file.startsWith(root)) { res.writeHead(403).end('Forbidden'); return }
      let s = await stat(file).catch(() => null)
      if (s?.isDirectory()) { file = join(file, 'index.html'); s = await stat(file).catch(() => null) }
      if (!s) { res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found: ' + url.pathname); return }
      const body = await readFile(file)
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' }).end(body)
    } catch (e) {
      res.writeHead(500, { 'content-type': 'text/plain' }).end(String(e))
    }
  })
  return new Promise((ok) =>
    server.listen(port, '127.0.0.1', () => {
      const { port: p } = server.address()
      ok({ url: `http://127.0.0.1:${p}`, port: p, close: () => new Promise((r) => server.close(r)) })
    }),
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'docs')
  const { url } = await serve(dir, Number(process.argv[3] ?? 4173))
  console.log(`Serving ${resolve(dir)} at ${url}  (Ctrl+C to stop)`)
}
