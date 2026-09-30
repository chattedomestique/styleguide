/** What the project itself defines: custom properties and class names. Shared by lint and its self-test. */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripComments } from './rules.mjs'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

export const walk = (d, ok = () => true) =>
  !existsSync(d) ? [] : readdirSync(d).sort().flatMap((n) => {
    const p = join(d, n)
    return statSync(p).isDirectory() ? walk(p, ok) : ok(p) ? [p] : []
  })

const stripUrls = (t) => t.replace(/url\((?:"[^"]*"|'[^']*'|[^)])*\)/gi, 'url()')

export function collectProject(root = ROOT) {
  const cssFiles = [...walk(join(root, 'src'), (p) => p.endsWith('.css')), ...walk(join(root, 'docs-src'), (p) => p.endsWith('.css'))]
  const icons = join(root, 'dist', 'icons.css')
  const declared = new Set()
  const classes = new Set()
  for (const f of [...cssFiles, ...(existsSync(icons) ? [icons] : [])]) {
    const css = stripUrls(stripComments(readFileSync(f, 'utf8')))
    for (const m of css.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)) declared.add(m[1])
    for (const m of css.matchAll(/\.([a-zA-Z][\w-]*)/g)) classes.add(m[1])
  }
  // custom properties set inline in docs markup (--grid-min: …) and by JS (style.setProperty)
  for (const f of [...walk(join(root, 'docs-src'), (p) => /\.(html|js)$/.test(p)), ...walk(join(root, 'src', 'js'), (p) => p.endsWith('.js'))]) {
    const t = readFileSync(f, 'utf8')
    for (const m of t.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)) declared.add(m[1])
    for (const m of t.matchAll(/setProperty\(\s*['"](--[\w-]+)/g)) declared.add(m[1])
    if (f.endsWith('.js')) for (const m of t.matchAll(/['"`]\.?([a-z][\w-]*)['"`]/g)) classes.add(m[1])
  }
  for (const c of ['is-hover', 'is-focus', 'is-active', 'is-selected', 'is-disabled']) classes.add(c)
  return { cssFiles, declared, classes }
}
