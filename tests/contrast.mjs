#!/usr/bin/env node
/**
 * Contrast matrix. Resolves every colour role through the real CSS engine
 * (light-dark(), oklch(), var() and all) and checks WCAG 2.2 ratios for every
 * theme x contrast mode x palette, plus every tone, emphasis and status.
 *
 *   npm run test:contrast            fail on any violation
 *   npm run test:contrast -- --all   print every pair, not only failures
 *
 * Colours are read back through a <canvas>, i.e. as the 8-bit sRGB values that get painted,
 * so a pass here is what a user's screen shows (minus their display profile).
 *
 * To cover a NEW role pair: add a line in PAIRS / TONE_PAIRS below. A role that is used as text
 * or as a control boundary and is not listed here is unverified.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { start, ROOT } from './lib/browser.mjs'

const SHOW_ALL = process.argv.includes('--all')

const THEMES = ['light', 'dark']
const CONTRASTS = ['off', 'more']
const PALETTES = ['ink', 'periwinkle', 'mint', 'sand', 'cream', 'mono']
const TONES = ['rose', 'amber', 'lime', 'green', 'teal', 'sky', 'periwinkle', 'violet', 'stone']
const STATUSES = ['success', 'warning', 'danger', 'info']

const TEXT_SURFACES = ['--color-canvas', '--color-surface', '--color-surface-2']
const ALL_SURFACES = [...TEXT_SURFACES, '--color-surface-3']

/** min = hard requirement. Under data-contrast=more, `more` replaces `min` when present. */
function buildPairs() {
  const P = []
  const add = (fg, bg, min, what, more) => P.push({ fg, bg, min, more: more ?? min, what })
  for (const bg of ALL_SURFACES) {
    add('--color-ink', bg, 7, 'primary text')
    add('--color-ink-2', bg, 4.5, 'secondary text', 7)
    add('--color-ink-3', bg, 4.5, 'tertiary text / placeholder', 7)
    add('--color-accent-ink', bg, 4.5, 'accent text / links', 7)
    for (const s of STATUSES) add(`--color-${s}-ink`, bg, 4.5, `${s} text`, 7)
  }
  for (const bg of TEXT_SURFACES) add('--color-line', bg, 3, 'control boundary / meaningful icon', 4.5)
  add('--color-on-accent', '--color-accent', 4.5, 'text on accent fill', 7)
  add('--color-on-accent-soft', '--color-accent-soft', 4.5, 'text on soft accent', 7)
  add('--color-ink-inverse', '--color-surface-inverse', 7, 'text on inverse surface (dock)')
  add('--color-ink-inverse-2', '--color-surface-inverse', 4.5, 'secondary text on inverse surface', 7)
  add('--color-surface-inverse', '--color-canvas', 3, 'inverse surface boundary vs canvas (dock visibility)')
  add('--color-surface-inverse', '--color-surface', 3, 'inverse surface boundary vs card')
  // An accent fill must be 3:1 against the canvas, or be drawn with an edge (--fill-border-c not transparent).
  P.push({ fg: '--color-accent', bg: '--color-canvas', min: 3, more: 3, what: 'accent fill vs canvas (selected-state shape), unless edged', unlessEdge: true })
  for (const s of STATUSES) {
    add(`--color-${s}-ink`, `--color-${s}-soft`, 4.5, `${s} text on its soft fill`, 7)
    add(`--color-on-${s}-fill`, `--color-${s}-fill`, 4.5, `text on ${s} fill`, 7)
  }
  return P
}

/** Pairs read inside a [data-tone] / [data-status] scope. */
const TONE_PAIRS = [
  { fg: '--tone-ink', bg: '--tone-surface', min: 7, bold: 4.5, what: 'tone text' },
  { fg: '--tone-ink-2', bg: '--tone-surface', min: 4.5, bold: 4.5, what: 'tone secondary text' },
  { fg: '--tone-on-fill', bg: '--tone-fill', min: 4.5, bold: 4.5, what: 'text on tone pill' },
  { fg: '--tone-line', bg: '--tone-surface', min: 3, bold: 3, what: 'tone border / icon' },
  { fg: '--tone-fill', bg: '--tone-surface', min: 3, bold: 3, what: 'tone pill vs its card' },
]

/** Runs in the browser. Returns [{key, fgHex, bgHex, ratio, min, ...}] */
async function runCombo({ theme, contrast, palette, pairs, tonePairs, tones, statuses, useAttrContrast }) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  if (contrast === 'more' && useAttrContrast) root.setAttribute('data-contrast', 'more')
  else root.removeAttribute('data-contrast')
  if (palette === 'ink') root.removeAttribute('data-palette')
  else root.setAttribute('data-palette', palette)

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const toRGBA = (css) => {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2], d[3] / 255]
  }
  const lum = ([r, g, b]) => {
    const l = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b)
  }
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)]
    return ((x > y ? x : y) + 0.05) / ((x > y ? y : x) + 0.05)
  }
  const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

  const resolve = (scope, name) => {
    const probe = document.createElement('i')
    probe.style.cssText = `color:var(${name});display:none`
    probe.style.display = 'inline'
    scope.appendChild(probe)
    const css = getComputedStyle(probe).color
    probe.remove()
    return toRGBA(css)
  }

  const out = []
  const scopeKey = `${theme}/${contrast}/${palette}`
  const check = (scope, p, extra, minKey = 'min') => {
    const fg = resolve(scope, p.fg)
    const bg = resolve(scope, p.bg)
    if (bg[3] < 1) return
    if (p.unlessEdge && resolve(scope, '--fill-border-c')[3] > 0) return
    const r = ratio(fg, bg)
    const min = contrast === 'more' && p.more != null ? p.more : p[minKey]
    out.push({ key: scopeKey + extra, fg: p.fg, bg: p.bg, what: p.what, fgHex: hex(fg), bgHex: hex(bg), ratio: r, min })
  }

  for (const p of pairs) check(root, p, '')

  // Focus ring: at least one of the two tones must be >= 3:1 (real value is >= 4.1) against every surface.
  const surfaces = ['--color-canvas', '--color-surface', '--color-surface-2', '--color-surface-3', '--color-surface-inverse', '--color-accent']
  for (const s of surfaces) {
    const bg = resolve(root, s)
    const inner = ratio(resolve(root, '--color-focus-inner'), bg)
    const outer = ratio(resolve(root, '--color-focus-outer'), bg)
    out.push({ key: scopeKey, fg: '--color-focus-(inner|outer)', bg: s, what: 'focus ring, best of two tones', fgHex: inner > outer ? 'inner' : 'outer', bgHex: hex(bg), ratio: Math.max(inner, outer), min: 3 })
  }
  // Scrim: white text over the worst possible photo (pure white) must stay readable.
  const white = [255, 255, 255]
  for (const s of ['--color-scrim', '--color-media-control']) {
    const a = resolve(root, s)
    const comp = [a[0] * a[3] + 255 * (1 - a[3]), a[1] * a[3] + 255 * (1 - a[3]), a[2] * a[3] + 255 * (1 - a[3])]
    out.push({ key: scopeKey, fg: '--color-on-media', bg: s + ' over white photo', what: 'white text/icon on scrim over worst-case photo', fgHex: '#ffffff', bgHex: hex(comp), ratio: ratio(white, comp), min: 4.5 })
  }

  // Tones: every hue, pastel + bold, and every status.
  const holder = document.createElement('div')
  root.appendChild(holder)
  const scopes = [
    ...tones.flatMap((t) => [['data-tone', t, false], ['data-tone', t, true]]),
    ...statuses.flatMap((s) => [['data-status', s, false], ['data-status', s, true]]),
  ]
  for (const [attr, val, bold] of scopes) {
    const el = document.createElement('div')
    el.setAttribute(attr, val)
    if (bold) el.setAttribute('data-emphasis', 'bold')
    holder.appendChild(el)
    for (const p of tonePairs) check(el, { ...p, min: bold ? p.bold : p.min }, `/${attr.slice(5)}=${val}${bold ? '+bold' : ''}`)
    // Focus ring on each tone surface
    const bg = resolve(el, '--tone-surface')
    const inner = ratio(resolve(el, '--color-focus-inner'), bg)
    const outer = ratio(resolve(el, '--color-focus-outer'), bg)
    out.push({ key: `${scopeKey}/${attr.slice(5)}=${val}${bold ? '+bold' : ''}`, fg: '--color-focus-(inner|outer)', bg: '--tone-surface', what: 'focus ring on tone surface', fgHex: inner > outer ? 'inner' : 'outer', bgHex: hex(bg), ratio: Math.max(inner, outer), min: 3 })
    el.remove()
  }
  holder.remove()
  return out
}

/** Resolve every role to rgb for media-vs-attribute equality check. */
async function snapshotRoles({ theme, palette, attr, roles }) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  if (attr) root.setAttribute('data-contrast', 'more')
  else root.removeAttribute('data-contrast')
  if (palette === 'ink') root.removeAttribute('data-palette')
  else root.setAttribute('data-palette', palette)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const snap = {}
  for (const name of roles) {
    const probe = document.createElement('i')
    probe.style.cssText = `color:var(${name})`
    root.appendChild(probe)
    const css = getComputedStyle(probe).color
    probe.remove()
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    snap[name] = Array.from(ctx.getImageData(0, 0, 1, 1).data).join(',')
  }
  return snap
}

const { browser, url, close } = await start()
const failures = []
let checked = 0
try {
  const pairs = buildPairs()
  const page = await browser.newPage()
  await page.goto(`${url}/tests/fixtures/contrast.html`)
  const roles = [...new Set([...pairs.flatMap((p) => [p.fg, p.bg]), '--color-focus-inner', '--color-focus-outer', '--color-scrim', '--color-media-control'])]

  for (const theme of THEMES) for (const contrast of CONTRASTS) for (const palette of PALETTES) {
    const res = await page.evaluate(runCombo, { theme, contrast, palette, pairs, tonePairs: TONE_PAIRS, tones: TONES, statuses: STATUSES, useAttrContrast: true })
    for (const r of res) {
      checked++
      const ok = r.ratio >= r.min
      if (!ok || SHOW_ALL) (ok ? console.log : () => {})(`  ok   ${r.ratio.toFixed(2).padStart(6)}  ${r.key}  ${r.fg} on ${r.bg}`)
      if (!ok) failures.push(r)
    }
  }

  // The OS preference (prefers-contrast: more) must produce exactly what data-contrast="more" produces.
  const mismatches = []
  for (const theme of THEMES) for (const palette of PALETTES) {
    await page.emulateMedia({ contrast: 'no-preference' })
    const viaAttr = await page.evaluate(snapshotRoles, { theme, palette, attr: true, roles })
    await page.emulateMedia({ contrast: 'more' })
    const viaMedia = await page.evaluate(snapshotRoles, { theme, palette, attr: false, roles })
    await page.emulateMedia({ contrast: 'no-preference' })
    for (const r of roles) if (viaAttr[r] !== viaMedia[r]) mismatches.push(`${theme}/${palette} ${r}: attr=${viaAttr[r]} media=${viaMedia[r]}`)
  }
  if (mismatches.length) {
    console.log(`\n${mismatches.length} media/attribute mismatches (the two prefers-contrast blocks have drifted):`)
    mismatches.slice(0, 15).forEach((m) => console.log('  x ' + m))
  }

  // Report
  mkdirSync(join(ROOT, 'test-results'), { recursive: true })
  writeFileSync(join(ROOT, 'test-results', 'contrast.json'), JSON.stringify({ checked, failures, mismatches }, null, 1))

  if (failures.length) {
    // Group by pair so a single bad token reads as one line, not two hundred.
    const groups = new Map()
    for (const f of failures) {
      const k = `${f.fg} on ${f.bg} (${f.what}) needs ${f.min}`
      const g = groups.get(k) ?? { worst: f, n: 0, combos: [] }
      g.n++
      if (f.ratio < g.worst.ratio) g.worst = f
      if (g.combos.length < 4) g.combos.push(f.key)
      groups.set(k, g)
    }
    console.log(`\n${failures.length} of ${checked} checks FAILED, in ${groups.size} distinct pairs:\n`)
    for (const [k, g] of [...groups].sort((a, b) => b[1].n - a[1].n))
      console.log(`  x ${k}\n      worst ${g.worst.ratio.toFixed(2)}:1 in ${g.worst.key} (${g.worst.fgHex} on ${g.worst.bgHex}); ${g.n} combos, e.g. ${g.combos.join(', ')}`)
  } else {
    console.log(`\nAll ${checked} contrast checks passed across ${THEMES.length * CONTRASTS.length * PALETTES.length} theme/contrast/palette combinations.`)
  }
  process.exitCode = failures.length || mismatches.length ? 1 : 0
} finally {
  await close()
}
