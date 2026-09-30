#!/usr/bin/env node
/**
 * Static checks that keep the system honest. Fast, no browser.
 *
 *   npm run lint
 *
 * ERRORS fail the run; WARNINGS are printed and should be justified in the PR.
 * Rules are the machine-checkable half of the component checklist in CLAUDE.md.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, basename, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const walk = (d, ok = () => true) =>
  !existsSync(d) ? [] : readdirSync(d).sort().flatMap((n) => {
    const p = join(d, n)
    return statSync(p).isDirectory() ? walk(p, ok) : ok(p) ? [p] : []
  })
const rel = (p) => relative(ROOT, p).split(sep).join('/')

const errors = []
const warnings = []
const err = (file, line, msg) => errors.push(`${file}${line ? ':' + line : ''}  ${msg}`)
const warn = (file, line, msg) => warnings.push(`${file}${line ? ':' + line : ''}  ${msg}`)

/** CSS text with comments blanked out (line numbers preserved). */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length

const cssFiles = walk(join(ROOT, 'src'), (p) => p.endsWith('.css'))
const componentCss = cssFiles.filter((f) => rel(f).startsWith('src/components/'))
const layoutCss = cssFiles.filter((f) => /^src\/(components|layout|base)\//.test(rel(f)))

/* ---- Declared vs used custom properties ------------------------------------------------ */
const declared = new Set()
const used = new Map() // name -> [file:line]
for (const f of [...cssFiles, ...walk(join(ROOT, 'docs-src'), (p) => /\.(css|html)$/.test(p))]) {
  const css = stripComments(readFileSync(f, 'utf8'))
  for (const m of css.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)) declared.add(m[1])
  for (const m of css.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)\s*([,)])/g)) {
    if (m[2] === ',') continue // has a fallback: allowed to be undefined
    if (!used.has(m[1])) used.set(m[1], [])
    used.get(m[1]).push(`${rel(f)}:${lineOf(css, m.index)}`)
  }
}
// Tokens supplied by the app or by JS at runtime are allowed to be undefined in the library.
const RUNTIME = new Set(['--stack-gap', '--cluster-gap', '--cluster-align', '--cluster-justify', '--grid-min', '--grid-gap', '--scroller-gap', '--header-h', '--demo-bg', '--icon-size', '--docs-nav-w', '--appbar-h', '--dock-h'])
for (const [name, places] of used) {
  if (declared.has(name) || RUNTIME.has(name)) continue
  err(places[0], '', `var(${name}) is used but never declared (${places.length} use${places.length > 1 ? 's' : ''})`)
}

/* ---- Per-file CSS rules ------------------------------------------------------------------- */
for (const f of layoutCss) {
  const raw = readFileSync(f, 'utf8')
  const css = stripComments(raw)
  const name = rel(f)
  const isComponent = name.startsWith('src/components/')

  if (!/@layer\s+sg\.[a-z]+/.test(css)) err(name, '', 'no @layer sg.* block')

  // Literal colours belong in tokens, never in components/layout/base.
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(\s*[\d.]/g)) {
    const ln = lineOf(css, m.index)
    err(name, ln, `literal colour "${m[0]}": use a colour role from src/tokens (add a role there if none fits)`)
  }
  // Sizing text in px defeats user text scaling.
  for (const m of css.matchAll(/font-size\s*:\s*[^;{}]*\b\d+(\.\d+)?px/g)) err(name, lineOf(css, m.index), `font-size in px ("${m[0].trim()}"): use rem (--text-*)`)
  for (const m of css.matchAll(/line-height\s*:\s*\d+(\.\d+)?px/g)) err(name, lineOf(css, m.index), 'line-height in px: use a unitless value or --leading-*')
  // outline removal
  for (const m of css.matchAll(/outline\s*:\s*(none|0)\b/g)) {
    const before = css.slice(Math.max(0, m.index - 160), m.index)
    if (/:focus:not\(:focus-visible\)|\[tabindex="-1"\]/.test(before)) continue
    err(name, lineOf(css, m.index), 'outline removed without a replacement (WCAG 2.4.7)')
  }
  for (const m of css.matchAll(/transition(?:-property)?\s*:\s*all\b/g)) err(name, lineOf(css, m.index), 'transition: all. List the properties (transform, opacity, colour ...)')
  for (const m of css.matchAll(/!important/g)) {
    const ln = lineOf(css, m.index)
    const line = css.split('\n')[ln - 1]
    if (!/display:\s*none|sr-only|position:\s*absolute/.test(line)) warn(name, ln, '!important: avoid; layers already let apps override')
  }
  // Physical properties break RTL. Flag the common ones.
  for (const m of css.matchAll(/\b(margin|padding)-(left|right)\b|\b(left|right)\s*:\s*[^;]*;|text-align\s*:\s*(left|right)|\bborder-(left|right)\b/g)) {
    const ln = lineOf(css, m.index)
    warn(name, ln, `physical property "${m[0].trim()}": prefer logical (margin-inline, inset-inline-start ...)`)
  }
  // Fixed px sizes for layout in components (borders, shadows and hairlines are fine).
  if (isComponent) {
    for (const m of css.matchAll(/\b(width|height|min-width|min-height|max-width|max-height|inline-size|block-size|min-inline-size|min-block-size|max-inline-size|max-block-size|padding[a-z-]*|margin[a-z-]*|gap|inset[a-z-]*)\s*:\s*[^;{}]*?\b(\d+(?:\.\d+)?)px/g)) {
      const v = Number(m[2])
      if (v > 2) warn(name, lineOf(css, m.index), `fixed ${v}px in "${m[1]}": use rem / a --space-* / --size token so it scales with text`)
    }
    // breakpoints should be em so they follow the user's font size
    for (const m of css.matchAll(/@media[^{]*\((?:min|max)-width\s*:\s*\d+px\)/g)) warn(name, lineOf(css, m.index), 'px media query: use em so breakpoints follow text size')
    // hover must be gated so touch screens never get a stuck hover
    for (const m of css.matchAll(/:hover\b/g)) {
      const before = css.slice(Math.max(0, m.index - 400), m.index)
      const lastMedia = before.lastIndexOf('@media')
      const gated = lastMedia >= 0 && /hover:\s*hover/.test(before.slice(lastMedia)) && !/\}\s*\}/.test(before.slice(lastMedia).replace(/\{[^{}]*\}/g, ''))
      if (!gated) warn(name, lineOf(css, m.index), ':hover outside @media (hover: hover)')
    }
    if (!basename(f).startsWith('00-') && !/forced-colors/.test(css) && !/border/.test(css)) warn(name, '', 'no border and no forced-colors rule: will the edge survive Windows High Contrast?')
  }
}

/* ---- The two prefers-contrast / prefers-reduced-motion blocks must not drift ---------------- */
function blockPairs(file) {
  const css = stripComments(readFileSync(file, 'utf8'))
  const grab = (re) => [...css.matchAll(re)].map((m) => m[1].replace(/\s+/g, ' ').trim())
  return {
    mediaContrast: grab(/@media \(prefers-contrast: more\)\s*\{\s*:root:not\(\[data-contrast="off"\]\)\s*\{([^}]*)\}/g),
    attrContrast: grab(/:root\[data-contrast="more"\]\s*\{([^}]*)\}/g),
    mediaMotion: grab(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*:root:not\(\[data-motion="full"\]\)\s*\{([^}]*)\}/g),
    attrMotion: grab(/:root\[data-motion="reduced"\]\s*\{([^}]*)\}/g),
  }
}
for (const f of cssFiles.filter((p) => rel(p).startsWith('src/tokens/'))) {
  const b = blockPairs(f)
  for (const [a, c, what] of [['mediaContrast', 'attrContrast', 'prefers-contrast / data-contrast'], ['mediaMotion', 'attrMotion', 'prefers-reduced-motion / data-motion']]) {
    if (b[a].length !== b[c].length) err(rel(f), '', `${what}: ${b[a].length} media block(s) but ${b[c].length} attribute block(s)`)
    else b[a].forEach((x, i) => { if (x !== b[c][i]) err(rel(f), '', `${what}: media block #${i + 1} and attribute block differ. Keep them identical`) })
  }
}

/* ---- Every component has a docs page ------------------------------------------------------------ */
for (const f of componentCss) {
  const n = basename(f, '.css')
  if (/^\d\d-/.test(n) || n.startsWith('_')) continue
  // A few pieces are documented under Foundations rather than Components.
  const ALIAS = { icon: 'foundations/icons' }
  const docPath = ALIAS[n] ?? `components/${n}`
  if (!existsSync(join(ROOT, 'docs-src', docPath + '.html'))) err(rel(f), '', `no docs page: create docs-src/${docPath}.html (run \`npm run new:component ${n}\` for a template)`)
}

/* ---- Docs HTML hygiene (axe does the rest in the a11y test) -------------------------------------- */
for (const f of walk(join(ROOT, 'docs-src'), (p) => p.endsWith('.html') && !basename(p).startsWith('_'))) {
  const html = readFileSync(f, 'utf8')
  const name = rel(f)
  if (!/^\s*<!--\s*\{/.test(html)) err(name, 1, 'missing page metadata comment on line 1')
  for (const m of html.matchAll(/tabindex="([1-9]\d*)"/g)) err(name, lineOf(html, m.index), 'positive tabindex breaks natural order')
  for (const m of html.matchAll(/<(div|span)[^>]*role="button"/g)) err(name, lineOf(html, m.index), 'use a real <button>, not role="button" on a div/span')
  for (const m of html.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)) err(name, lineOf(html, m.index), '<img> without alt')
  for (const m of html.matchAll(/<svg\b[^>]*class="[^"]*\bicon\b[^"]*"(?![^>]*aria-hidden)[^>]*>/g)) err(name, lineOf(html, m.index), 'icon <svg> without aria-hidden="true"')
  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const text = m[2].replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim()
    if (!text && !/aria-label(ledby)?=/.test(m[1])) err(name, lineOf(html, m.index), '<button> with no text and no aria-label')
  }
  for (const m of html.matchAll(/style="[^"]*(?:#[0-9a-fA-F]{3,8}\b|rgba?\()[^"]*"/g)) warn(name, lineOf(html, m.index), 'literal colour in an inline style: use a colour role')
  for (const m of html.matchAll(/[✓✔✗✕→←↑↓▸▾•★☆]/g)) warn(name, lineOf(html, m.index), `text glyph "${m[0]}" is missing from the bundled font: use an SVG icon`)
}

/* ---- Report ------------------------------------------------------------------------------------------ */
const unusedTokens = [...declared].filter((t) => t.startsWith('--color-') || t.startsWith('--space-') || t.startsWith('--radius-')).filter((t) => {
  const all = cssFiles.concat(walk(join(ROOT, 'docs-src'), (p) => /\.(css|html|js)$/.test(p))).map((f) => readFileSync(f, 'utf8')).join('\n')
  return (all.match(new RegExp(t.replace(/[-]/g, '\\-') + '(?![\\w-])', 'g')) || []).length < 2
})
if (unusedTokens.length) warn('tokens', '', `declared but never used: ${unusedTokens.join(', ')}`)

if (warnings.length) console.log(`\n${warnings.length} warning(s):\n` + warnings.map((w) => '  ! ' + w).join('\n'))
if (errors.length) {
  console.log(`\n${errors.length} error(s):\n` + errors.map((e) => '  x ' + e).join('\n'))
  process.exit(1)
}
console.log(`\nLint OK (${cssFiles.length} css files, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}).`)
