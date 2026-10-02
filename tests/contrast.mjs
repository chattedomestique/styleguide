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
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { start, ROOT } from './lib/browser.mjs'

const SHOW_ALL = process.argv.includes('--all')

const THEMES = ['light', 'dark']
const CONTRASTS = ['off', 'more']
const PALETTES = ['default', 'mint', 'periwinkle', 'sand', 'cream', 'wire']
// Tones are discovered from the CSS, not listed here: add a [data-tone="x"] rule and it is tested.
const TONES = [...new Set([...readFileSync(join(ROOT, 'dist', 'styleguide.css'), 'utf8').matchAll(/\[data-tone="([^"]+)"\]/g)].map((m) => m[1]))]
if (TONES.length < 11) throw new Error(`expected at least 11 tones in dist/styleguide.css (run npm run build); found ${TONES.join(', ')}`)

const TEXT_SURFACES = ['--canvas', '--paper', '--paper-2']
const ALL_SURFACES = [...TEXT_SURFACES, '--paper-3']

/** min = hard requirement. Under data-contrast=more, `more` replaces `min` when present. */
function buildPairs() {
  const P = []
  const add = (fg, bg, min, what, more) => P.push({ fg, bg, min, more: more ?? min, what })
  for (const bg of ALL_SURFACES) {
    add('--ink', bg, 7, 'primary text and frames')
  }
  for (const bg of TEXT_SURFACES) {
    add('--ink-soft', bg, 7, 'secondary text')
    add('--ink-mute', bg, 4.5, 'placeholder / tertiary text', 7)
    add('--accent-ink', bg, 4.5, 'accent text / links', 7)
    add('--ink-faint', bg, 3, 'disabled, quiet decoration (never text that matters)')
    add('--focus', bg, 3, 'focus ring')
  }
  add('--ink-soft', '--paper-3', 4.5, 'secondary text on the pressed shade', 7)
  add('--ink-mute', '--paper-3', 4.5, 'tertiary text on the pressed shade', 7)
  add('--accent-ink', '--paper-3', 4.5, 'accent text on the pressed shade', 7)
  add('--focus', '--paper-3', 3, 'focus ring')
  for (const bg of ALL_SURFACES) {
    for (const s of ['ok', 'warn', 'bad', 'info']) add(`--${s}-ink`, bg, 4.5, `${s} text`, 7)
  }
  add('--on-accent', '--accent', 4.5, 'text on accent fill', 7)
  add('--on-accent-soft', '--accent-soft', 4.5, 'text on soft accent', 7)
  add('--ink', '--accent-soft', 7, 'primary text on soft accent')
  add('--paper', '--ink', 7, 'paper on ink (the inverted tone, the card bar)')
  add('--surface-ink', '--surface-bg', 7, 'surface ink on the page surface')
  add('--surface-ink-soft', '--surface-bg', 7, 'surface soft ink on the page surface')
  return P
}

/** Pairs read inside a [data-tone] scope. `bold` = threshold under data-emphasis="bold". */
const TONE_PAIRS = [
  { fg: '--tone-ink', bg: '--tone-bg', min: 7, bold: 6.5, what: 'tone text' },
  { fg: '--tone-ink-soft', bg: '--tone-bg', min: 7, bold: 6.5, what: 'tone secondary text' },
  { fg: '--tone-on-fill', bg: '--tone-fill', min: 4.5, bold: 4.5, what: 'text on tone pill' },
  { fg: '--tone-fill', bg: '--tone-bg', min: 3, bold: 3, what: 'tone pill vs its card' },
  { fg: '--line', bg: '--tone-bg', min: 3, bold: 3, what: 'frame and icons on a tone', skipBold: true, skipInk: true },
  // A focusable thing INSIDE a toned element draws its ring in the tone's ink over a halo in the tone's fill.
  // Read on a child, because --tone-* do not inherit (the _tone-* copies do).
  { fg: '--focus', bg: '--surface-bg', min: 3, bold: 3, what: 'focus ring on a tone (child)', child: true },
  { fg: '--surface-ink', bg: '--surface-bg', min: 7, bold: 6.5, what: 'surface ink on surface (child)', child: true },
  { fg: '--surface-ink-soft', bg: '--surface-bg', min: 7, bold: 6.5, what: 'surface soft ink on surface (child)', child: true },
  { fg: '--focus', bg: '--focus-halo', min: 3, bold: 3, what: 'focus ring against its own halo (child)', child: true },
]

/** Runs in the browser. Returns [{key, fgHex, bgHex, ratio, min, ...}] */
async function runCombo({ theme, contrast, palette, pairs, tonePairs, tones, useAttrContrast, island }) {
  // island: 'palette-in-contrast' = the page is higher contrast and a child sets the palette;
  //         'contrast-island'     = the page is normal and a child asks for higher contrast (with the palette on the same element).
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  if (island === 'palette-in-contrast' || (!island && contrast === 'more' && useAttrContrast)) root.setAttribute('data-contrast', 'more')
  else root.removeAttribute('data-contrast')
  if (island || palette === 'default') root.removeAttribute('data-palette')
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

  // Read on the scope element itself: --tone-* are registered inherits:false, so a child would not see them.
  const resolve = (scope, name) => {
    const prev = scope.style.color
    scope.style.color = `var(${name})`
    const css = getComputedStyle(scope).color
    scope.style.color = prev
    return toRGBA(css)
  }

  let target = root
  if (island) {
    target = document.createElement('div')
    if (palette !== 'default') target.setAttribute('data-palette', palette)
    if (island === 'contrast-island') target.setAttribute('data-contrast', 'more')
    root.appendChild(target)
  }

  const out = []
  const scopeKey = `${theme}/${contrast}/${palette}${island ? '/' + island : ''}`
  const check = (scope0, p, extra, minKey = 'min') => {
    let scope = scope0
    if (p.child) { scope = document.createElement('i'); scope0.appendChild(scope) }
    const fg = resolve(scope, p.fg)
    const bg = resolve(scope, p.bg)
    if (p.child) scope.remove()
    if (bg[3] < 1) return
    const r = ratio(fg, bg)
    const min = contrast === 'more' && p.more != null ? p.more : p[minKey]
    out.push({ key: scopeKey + extra, fg: p.fg, bg: p.bg, what: p.what, fgHex: hex(fg), bgHex: hex(bg), ratio: r, min })
  }

  for (const p of pairs) check(target, p, '')

  // Scrim: white text over the worst possible photo (pure white) must stay readable.
  const white = [255, 255, 255]
  for (const s of ['--scrim', '--scrim-strong']) {
    const a = resolve(target, s)
    const comp = [a[0] * a[3] + 255 * (1 - a[3]), a[1] * a[3] + 255 * (1 - a[3]), a[2] * a[3] + 255 * (1 - a[3])]
    out.push({ key: scopeKey, fg: '--on-media', bg: s + ' over white photo', what: 'white text/icon on scrim over worst-case photo', fgHex: '#ffffff', bgHex: hex(comp), ratio: ratio(white, comp), min: 4.5 })
  }

  // Tones: every slot, the inverted tone and the four status tones, pastel and bold.
  const holder = document.createElement('div')
  target.appendChild(holder)
  const scopes = tones.flatMap((t) => (t === 'ink' ? [[t, false]] : [[t, false], [t, true]]))
  for (const [val, bold] of scopes) {
    const el = document.createElement('div')
    el.setAttribute('data-tone', val)
    if (bold) el.setAttribute('data-emphasis', 'bold')
    holder.appendChild(el)
    for (const p of tonePairs) {
      if ((bold && p.skipBold) || (val === 'ink' && p.skipInk)) continue
      check(el, { ...p, min: bold ? p.bold : p.min }, `/tone=${val}${bold ? '+bold' : ''}`)
    }
    el.remove()
  }
  holder.remove()
  if (island) target.remove()
  return out
}

/** Resolve roles on a scope: the page itself, or an island with its own palette inside a page with another one. */
async function snapshotScope({ theme, rootPalette, islandPalette, roles }) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.removeAttribute('data-contrast')
  if (rootPalette === 'default') root.removeAttribute('data-palette')
  else root.setAttribute('data-palette', rootPalette)
  let scope = root
  if (islandPalette) {
    scope = document.createElement('div')
    scope.setAttribute('data-palette', islandPalette)
    root.appendChild(scope)
  }
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const snap = {}
  for (const name of roles) {
    scope.style.color = `var(${name})`
    const css = getComputedStyle(scope).color
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    snap[name] = Array.from(ctx.getImageData(0, 0, 1, 1).data).join(',')
  }
  scope.style.color = ''
  if (islandPalette) scope.remove()
  return snap
}

/** Resolve every role to rgb for media-vs-attribute equality check. */
async function snapshotRoles({ theme, palette, attr, roles }) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  if (attr) root.setAttribute('data-contrast', 'more')
  else root.removeAttribute('data-contrast')
  if (palette === 'default') root.removeAttribute('data-palette')
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
  const roles = [...new Set([...pairs.flatMap((p) => [p.fg, p.bg]), '--scrim', '--scrim-strong', '--on-media'])]

  for (const theme of THEMES) for (const contrast of CONTRASTS) for (const palette of PALETTES) {
    const res = await page.evaluate(runCombo, { theme, contrast, palette, pairs, tonePairs: TONE_PAIRS, tones: TONES, useAttrContrast: true })
    for (const r of res) {
      checked++
      const ok = r.ratio >= r.min
      if (!ok || SHOW_ALL) (ok ? console.log : () => {})(`  ok   ${r.ratio.toFixed(2).padStart(6)}  ${r.key}  ${r.fg} on ${r.bg}`)
      if (!ok) failures.push(r)
    }
  }

  // Islands. A palette on an element inside a higher-contrast page, and a higher-contrast request on an element of a normal page,
  // must give the same guarantees as the page itself (the palette block and the contrast block have the same specificity,
  // so without care the island's own palette undoes the inherited contrast knobs).
  for (const island of ['palette-in-contrast', 'contrast-island']) for (const theme of THEMES) for (const palette of island === 'palette-in-contrast' ? PALETTES.filter((p) => p !== 'default') : PALETTES) {
    const res = await page.evaluate(runCombo, { theme, contrast: 'more', palette, island, pairs, tonePairs: TONE_PAIRS, tones: TONES, useAttrContrast: true })
    for (const r of res) {
      checked++
      const ok = r.ratio >= r.min
      if (!ok || SHOW_ALL) (ok ? console.log : () => {})(`  ok   ${r.ratio.toFixed(2).padStart(6)}  ${r.key}  ${r.fg} on ${r.bg}`)
      if (!ok) failures.push(r)
    }
  }

  // Isolation. An island that names a palette must look exactly like a page with that palette, whatever palette the page has:
  // the palette blocks are self-contained (they start from the defaults), so an island labelled "default" or "sand" never
  // shows the page's mint accent.
  const isolation = []
  const ISOLATION_ROLES = [...new Set([...roles, ...[1, 2, 3, 4, 5, 6].map((n) => `--tone-${n}`)])]
  for (const theme of THEMES) for (const island of PALETTES) {
    const alone = await page.evaluate(snapshotScope, { theme, rootPalette: island, islandPalette: null, roles: ISOLATION_ROLES })
    for (const outer of ['mint', 'periwinkle', 'cream', 'wire', 'default'].filter((p) => p !== island)) {
      const inside = await page.evaluate(snapshotScope, { theme, rootPalette: outer, islandPalette: island, roles: ISOLATION_ROLES })
      checked++
      const diff = ISOLATION_ROLES.filter((r) => alone[r] !== inside[r])
      if (diff.length) isolation.push(`${theme}: island "${island}" inside a "${outer}" page differs from a "${island}" page in ${diff.length} roles, e.g. ${diff.slice(0, 3).map((r) => `${r} ${alone[r]} vs ${inside[r]}`).join('; ')}`)
    }
  }
  if (isolation.length) {
    console.log(`\n${isolation.length} palette isolation failures (an island inherits the page's palette):`)
    isolation.slice(0, 15).forEach((m) => console.log('  x ' + m))
    failures.push(...isolation.map((m) => ({ key: 'isolation', fg: '-', bg: '-', what: m, ratio: 0, min: 1, fgHex: '', bgHex: '' })))
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
    console.log(`\nAll ${checked} contrast checks passed across ${THEMES.length * CONTRASTS.length * PALETTES.length} theme/contrast/palette combinations, plus ${THEMES.length * (PALETTES.length - 1 + PALETTES.length)} island combinations.`)
  }
  process.exitCode = failures.length || mismatches.length ? 1 : 0
} finally {
  await close()
}
