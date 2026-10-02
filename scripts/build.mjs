#!/usr/bin/env node
/**
 * Build script. Zero dependencies (Node 18+).
 *
 *   node scripts/build.mjs            build dist/ and docs/
 *   node scripts/build.mjs --check    build in memory, fail if committed output is stale
 *
 * What it does
 *   1. dist/styleguide.css      every file in src/{tokens,base,layout,components,utilities}
 *                               in that order, each wrapped in its own cascade layer
 *   2. dist/styleguide.min.css  the same, comments and whitespace stripped
 *   3. dist/styleguide.js       every file in src/js (plain scripts, no modules, no globals but `SG`)
 *   4. dist/fonts/*             src/fonts copied verbatim (woff2 + licence files)
 *   5. docs/**.html             every docs-src page fragment wrapped in docs-src/_layout.html,
 *                               nav generated from page metadata; docs/assets/ gets dist/ + docs assets
 *
 * Source of truth is always src/ and docs-src/. dist/ and docs/ are generated and committed so
 * that consumers can copy one file, and so GitHub Pages can serve docs/ with no CI.
 */
import { mdToHtml } from './lib/md.mjs'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, copyFileSync, rmSync } from 'node:fs'
import { join, dirname, relative, sep, posix, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')
const ALLOW_BROKEN = process.argv.includes('--allow-broken-links') // interim flag while pages are being written
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))

/**
 * Cascade layers, lowest to highest priority. Each source file opens its own `@layer name { }`
 * block; the build only checks the name is known and emits the ordering statement once at the top.
 * Folders are concatenated in SOURCE_DIRS order (files alphabetically inside a folder).
 */
const SOURCE_DIRS = ['tokens', 'base', 'layout', 'components', 'utilities']
const LAYER_ORDER = 'sg.reset, sg.tokens, sg.base, sg.layout, sg.wire, sg.components, sg.utilities'

/* ------------------------------------------------------------------ helpers */

const out = new Map() // relative path -> Buffer | string
const errors = []
const warn = (m) => console.warn('  ! ' + m)
const fail = (m) => errors.push(m)

function walk(dir, filter = () => true) {
  if (!existsSync(dir)) return []
  const res = []
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) res.push(...walk(p, filter))
    else if (filter(p)) res.push(p)
  }
  return res
}
const rel = (p) => relative(ROOT, p).split(sep).join('/')
const put = (path, data) => out.set(path, data)

/** Strip block comments without touching strings. Keeps licence banners (comments starting with an exclamation mark). */
function stripComments(css) {
  let res = ''
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (c === '"' || c === "'") {
      const q = c
      res += c
      i++
      while (i < css.length && css[i] !== q) {
        if (css[i] === '\\') res += css[i++]
        res += css[i++]
      }
      res += q
    } else if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      const body = css.slice(i, end + 2)
      if (body.startsWith('/*!')) res += body
      i = end + 1
    } else res += c
  }
  return res
}

/**
 * Conservative minifier: collapses whitespace around structural punctuation only, and never
 * inside a quoted string (so `content: ", "` and quoted data: URIs survive intact). Spaces around
 * + and - are never touched, because calc() needs them. Source rule: quote every url().
 */
function minifyCss(css) {
  const pieces = stripComments(css).split(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/)
  const min = pieces
    .map((piece, i) => (i % 2 ? piece : piece.replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/;}/g, '}')))
    .join('')
  return min.trim()
}


/**
 * JS minifier, deliberately modest: removes comments, indentation, trailing spaces and blank lines. It never
 * renames, never joins lines (ASI stays exactly as written), and copies strings, template literals and regex
 * literals verbatim. The caller parses the result with `new Function` and falls back to the source if that fails.
 */
function minifyJs(src) {
  const n = src.length
  let out = ''
  let i = 0
  let prev = '' // last significant character written
  let word = '' // trailing identifier, to tell `return /re/` from `a / b`
  const REGEX_AFTER = new Set(['', '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^'])
  const KEYWORDS = new Set(['return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'else', 'do', 'instanceof'])
  const copyString = (q) => {
    let j = i + 1
    while (j < n && src[j] !== q) { if (src[j] === '\\') j++; j++ }
    out += src.slice(i, j + 1); i = j + 1; prev = q; word = ''
  }
  const scanTemplate = (start) => { // returns the index just after the closing backtick
    let j = start + 1
    while (j < n && src[j] !== '`') {
      if (src[j] === '\\') { j += 2; continue }
      if (src[j] === '$' && src[j + 1] === '{') {
        let depth = 1; j += 2
        while (j < n && depth) {
          const c = src[j]
          if (c === '{') depth++
          else if (c === '}') depth--
          else if (c === '"' || c === "'") { const q = c; j++; while (j < n && src[j] !== q) { if (src[j] === '\\') j++; j++ } }
          else if (c === '`') { j = scanTemplate(j); continue }
          j++
        }
        continue
      }
      j++
    }
    return j + 1
  }
  while (i < n) {
    const c = src[i]
    const d = src[i + 1]
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue }
    if (c === '/' && d === '*') {
      const end = src.indexOf('*/', i + 2)
      const body = src.slice(i, end + 2)
      if (body.startsWith('/*!')) out += body
      else if (!/[\s]$/.test(out) && out) out += ' '
      i = end + 2; continue
    }
    if (c === '"' || c === "'") { copyString(c); continue }
    if (c === '`') { const end = scanTemplate(i); out += src.slice(i, end); i = end; prev = '`'; word = ''; continue }
    if (c === '/') {
      if (REGEX_AFTER.has(prev) || KEYWORDS.has(word)) { // a regex literal
        let j = i + 1; let inClass = false
        while (j < n) { const x = src[j]; if (x === '\\') { j += 2; continue } if (x === '[') inClass = true; else if (x === ']') inClass = false; else if (x === '/' && !inClass) break; j++ }
        j++; while (/[a-z]/i.test(src[j] ?? '')) j++
        out += src.slice(i, j); i = j; prev = ')'; word = ''; continue
      }
      out += c; i++; prev = c; word = ''; continue
    }
    if (c === '\n') {
      out = out.replace(/[ \t]+$/, '')
      if (!out.endsWith('\n') && out) out += '\n'
      i++
      while (i < n && (src[i] === ' ' || src[i] === '\t' || src[i] === '\r' || src[i] === '\n')) i++
      continue
    }
    out += c
    if (!/\s/.test(c)) { prev = c; word = /[\w$]/.test(c) ? word + c : '' } else word = ''
    i++
  }
  return out.trim() + '\n'
}

/** Parse check for a minified script; returns the minified text, or the original if it does not parse. */
function safeMinifyJs(src, label) {
  const min = minifyJs(src)
  try { new Function(min); return min } catch (e) { warn(`${label}: minified JS did not parse (${e.message}); shipping it unminified`); return src }
}

/* --------------------------------------------------------------------- CSS */

const ELEMENTS = new Map() // name -> { css: rawText, needs: Set, scripts: [] }

function buildCss() {
  const parts = []
  const core = []
  const banner = `/*! ${pkg.name} v${pkg.version} - generated by scripts/build.mjs from src/. Do not edit. */\n`
  const order = `@layer ${LAYER_ORDER};\n`
  parts.push(banner, order)
  core.push(banner.replace('generated', 'core (tokens, base, layout, utilities), generated'), order)

  for (const dir of SOURCE_DIRS) {
    const files = walk(join(ROOT, 'src', dir), (p) => p.endsWith('.css'))
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      const name = rel(file)
      // Every rule must live in a layer. Cheap check: a file needs at least one @layer block, and
      // the layer it opens must be one we know about.
      const layers = [...src.matchAll(/@layer\s+([a-z][a-z0-9.-]*)\s*\{/g)].map((m) => m[1])
      const fontFaceOnly = /^\s*(\/\*[\s\S]*?\*\/\s*)*@font-face/.test(src) && layers.length === 0
      if (!layers.length && !fontFaceOnly) fail(`${name}: no "@layer sg.<name> { ... }" block. Every source file must declare its layer.`)
      for (const l of layers) if (!LAYER_ORDER.split(', ').includes(l)) fail(`${name}: unknown layer "${l}". Known: ${LAYER_ORDER}`)
      const chunk = [`\n/* ===== ${name} ===== */\n`, src.replace(/\s+$/, '') + '\n']
      parts.push(...chunk)
      if (dir === 'components') ELEMENTS.set(posix.basename(name, '.css'), { css: src.replace(/\s+$/, '') + '\n', needs: new Set(), scripts: [] })
      else core.push(...chunk)
    }
  }
  const css = parts.join('')
  put('dist/styleguide.css', css)
  put('dist/styleguide.min.css', minifyCss(css) + '\n')
  put('dist/core.css', core.join(''))
  put('dist/core.min.css', minifyCss(core.join('')) + '\n')

  // One file per element. An element that reads another file's private (--_*) properties builds on it: say so.
  const privateOf = (text) => new Set([...text.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  const declaredBy = new Map()
  for (const [n, e] of ELEMENTS) for (const t of privateOf(e.css)) { if (!declaredBy.has(t)) declaredBy.set(t, new Set()); declaredBy.get(t).add(n) }
  for (const [n, e] of ELEMENTS) {
    const own = privateOf(e.css)
    for (const m of e.css.matchAll(/var\(\s*(--_[\w-]+)/g)) if (!own.has(m[1])) for (const d of declaredBy.get(m[1]) ?? []) if (d !== n) e.needs.add(d)
    const header = `/*! ${pkg.name} v${pkg.version} - element: ${n}. Needs core.css${e.needs.size ? ' and the elements: ' + [...e.needs].join(', ') : ''}. Generated from src/components/${n}.css. */\n`
    put(`dist/elements/${n}.css`, header + order + '\n' + e.css)
    put(`dist/elements/${n}.min.css`, header + order + minifyCss(e.css) + '\n')
  }
}

/* ------------------------------------------------------------------- wire kit */

/** The owner's wireframe kit (.wf-* placeholders): dev-only, never in the main bundle. */
function buildWire() {
  const files = walk(join(ROOT, 'src', 'wire'), (p) => p.endsWith('.css'))
  if (!files.length) return
  put('dist/wire.css', `/*! ${pkg.name} v${pkg.version} - wireframe kit (.wf-*), dev-only. Generated from src/wire. */\n` + files.map((f) => readFileSync(f, 'utf8')).join('\n'))
}

/* ---------------------------------------------------------------------- JS */

const CORE_JS = new Set(['00-core.js', '05-fit.js', '10-prefs.js', '20-guard.js', '25-disclosure.js'])

function buildJs() {
  const files = walk(join(ROOT, 'src', 'js'), (p) => p.endsWith('.js'))
  const head = (what) => [`/*! ${pkg.name} v${pkg.version} - ${what}, generated by scripts/build.mjs from src/js. Do not edit. */\n`, `window.SG = window.SG || {};\n`]
  const all = head('all scripts')
  const core = head('core scripts (SG, fit, prefs, guard, disclosure)')
  const scripts = []
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    if (/^\s*(import|export)\s/m.test(src)) fail(`${rel(file)}: uses import/export. src/js files are plain IIFE scripts attached to window.SG (no module system, so they work from file://).`)
    const base = posix.basename(rel(file))
    const chunk = [`\n/* ===== ${rel(file)} ===== */\n`, src.replace(/\s+$/, '') + '\n']
    all.push(...chunk)
    if (CORE_JS.has(base)) core.push(...chunk)
    else {
      // one file per script; it needs core.js (window.SG) loaded first
      const one = head(`script ${base} (needs core.js first)`).slice(0, 1).concat(chunk)
      put(`dist/js/${base}`, one.join(''))
      put(`dist/js/${base.replace(/\.js$/, '.min.js')}`, safeMinifyJs(one.join(''), base))
      scripts.push({ file: base, bytes: one.join('').length })
    }
  }
  if (!files.length) return
  put('dist/styleguide.js', all.join(''))
  put('dist/styleguide.min.js', safeMinifyJs(all.join(''), 'styleguide.js'))
  put('dist/core.js', core.join(''))
  put('dist/core.min.js', safeMinifyJs(core.join(''), 'core.js'))
  JS_SCRIPTS.push(...scripts)
}
const JS_SCRIPTS = []

/** dist/elements/manifest.json: what each element file is, what it builds on, and the scripts that exist. */
function buildManifest() {
  const elements = {}
  for (const [n, e] of [...ELEMENTS].sort(([a], [b]) => a.localeCompare(b))) {
    const css = out.get(`dist/elements/${n}.css`)
    const min = out.get(`dist/elements/${n}.min.css`)
    // a script called NN-<n>.js belongs to the element <n>; scripts shared by several elements are listed under `scripts`
    const js = JS_SCRIPTS.filter((x) => x.file.replace(/^\d+-/, '').replace(/\.js$/, '') === n).map((x) => x.file)
    elements[n] = { css: `elements/${n}.css`, bytes: css.length, minBytes: min.length, buildsOn: [...e.needs].sort(), scripts: js }
  }
  put('dist/elements/manifest.json', JSON.stringify({
    version: pkg.version,
    use: 'Link core.min.css (or core.css) first, then the elements you use, then core.min.js and the scripts they list. Or link styleguide.min.css and styleguide.min.js for everything.',
    coreCss: { file: 'core.min.css', bytes: out.get('dist/core.min.css').length },
    coreJs: out.has('dist/core.min.js') ? { file: 'core.min.js', bytes: out.get('dist/core.min.js').length } : null,
    elements,
    scripts: JS_SCRIPTS.map((x) => ({ file: `js/${x.file}`, bytes: x.bytes })),
  }, null, 2) + '\n')
}

/* ------------------------------------------------------------------- fonts */

function copyFonts() {
  for (const file of walk(join(ROOT, 'src', 'fonts'))) put('dist/fonts/' + rel(file).slice('src/fonts/'.length), readFileSync(file))
}


/* ------------------------------------------------------------------- icons */

/**
 * Icons are CSS masks (the owner's system): `<span class="ic ic--name" aria-hidden="true"></span>`.
 * The five the owner drew (arrow, plus, minus, close, check) live in src/base/20-icons.css and ship in the
 * main bundle. Every other src/icons/<id>.svg (24x24 Lucide glyphs, ISC) is re-stroked to the same 2px
 * square-cap weight and emitted into dist/icons.css as .ic--<id>. No sprite, nothing to inline, works from file://.
 */
const CORE_ICONS = new Set(['arrow', 'plus', 'minus', 'close', 'check'])
const ICONS = new Map() // id -> inner svg markup
function loadIcons() {
  for (const file of walk(join(ROOT, 'src', 'icons'), (p) => p.endsWith('.svg'))) {
    const id = posix.basename(rel(file), '.svg')
    const svg = readFileSync(file, 'utf8')
    const m = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)
    if (!m) { fail(`${rel(file)}: no <svg> element`); continue }
    if (!/viewBox="0 0 24 24"/.test(svg)) fail(`${rel(file)}: icons must use viewBox="0 0 24 24"`)
    ICONS.set(id, m[1].replace(/\s+/g, ' ').replace(/> </g, '><').replace(/"/g, "'").trim())
  }
}
const maskUrl = (inner) =>
  'url("data:image/svg+xml,' +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='#000' stroke-width='2' stroke-linecap='square' stroke-linejoin='miter'>${inner}</svg>`).replace(/'/g, '%27').replace(/%20/g, ' ') +
  '")'
/** Every icon class that exists: the owner's five, their aliases, and the generated set. */
const iconClasses = () => new Set([...CORE_ICONS, 'x', ...ICONS.keys()])

function buildIcons() {
  loadIcons()
  const rules = []
  for (const [id, inner] of [...ICONS].sort(([a], [b]) => a.localeCompare(b))) {
    if (CORE_ICONS.has(id)) continue // the owner's drawings win
    rules.push(`.ic--${id}{--ic:${maskUrl(inner)}}`)
  }
  const css = `/*! ${pkg.name} v${pkg.version} - generated from src/icons by scripts/build.mjs. Do not edit. Lucide (ISC), re-stroked to 2px square caps. */\n@layer sg.base{\n.ic--x{--ic:var(--icon-close)}\n${rules.join('\n')}\n}\n`
  put('dist/icons.css', css)
}

/* -------------------------------------------------------------------- docs */

const GROUP_ORDER = ['Start', 'Foundations', 'Components', 'Patterns', 'Accessibility', 'Project']
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const MARKDOWN_PAGES = [
  { file: 'AUDIT.md', path: 'project/audit', lede: 'What was wrong with the Flashcards style sheet v0.1, how it was found, and what was done about each finding. The same text is in <code>AUDIT.md</code>; the four full reviews are in <code>references/audit/</code>.', meta: { title: 'Audit', group: 'Project', order: 20, summary: 'What was wrong with the Flashcards style sheet v0.1, how it was found, and what was done about each finding.' } },
]

function parsePage(file) {
  let src = readFileSync(file, 'utf8')
  const m = src.match(/^\s*<!--\s*(\{[\s\S]*?\})\s*-->/)
  if (!m) { fail(`${rel(file)}: first line must be a metadata comment: <!--{"title":"...","group":"Components","order":10,"summary":"..."}-->`); return null }
  let meta
  try { meta = JSON.parse(m[1]) } catch (e) { fail(`${rel(file)}: bad metadata JSON (${e.message})`); return null }
  for (const k of ['title', 'group', 'summary']) if (!meta[k]) fail(`${rel(file)}: metadata needs "${k}"`)
  if (!GROUP_ORDER.includes(meta.group)) fail(`${rel(file)}: unknown group "${meta.group}". Known: ${GROUP_ORDER.join(', ')}`)
  src = src.slice(m[0].length).replace(/^\s+/, '')
  const path = rel(file).slice('docs-src/'.length).replace(/\.html$/, '')
  return { meta, body: src, path, out: path + '.html' }
}

// Element families by `order` band (CLAUDE.md "Adding an element"): the overview groups the component list by them.
const FAMILIES = [
  ['Actions', 10, 19], ['Forms', 20, 39], ['Selection and navigation', 40, 59], ['Surfaces', 60, 79],
  ['Overlays and feedback', 80, 99], ['Data', 100, 119], ['Media and tools', 120, 139],
]

/** {{index:Group}} in a page: a link to every page of that group with its one-line summary (components by family), generated so it never goes stale. */
function renderIndex(group, pages, page, root) {
  const items = pages.filter((p) => p.meta.group === group && p !== page)
  if (!items.length) { fail(`${page.out}: {{index:${group}}} but there are no pages in that group`); return '' }
  const li = (p) => `<li><a href="${root}${p.out}"><strong>${esc(p.meta.title)}</strong><span>${esc(p.meta.summary)}</span></a></li>`
  if (group !== 'Components') return `<ul class="docs-index" role="list">${items.map(li).join('')}</ul>`
  const used = new Set()
  const sections = FAMILIES.map(([name, lo, hi]) => {
    const inBand = items.filter((p) => (p.meta.order ?? 999) >= lo && (p.meta.order ?? 999) <= hi)
    inBand.forEach((p) => used.add(p))
    return inBand.length ? `<h3>${esc(name)}</h3>\n<ul class="docs-index" role="list">${inBand.map(li).join('')}</ul>` : ''
  })
  const rest = items.filter((p) => !used.has(p))
  if (rest.length) sections.push(`<h3>More</h3>\n<ul class="docs-index" role="list">${rest.map(li).join('')}</ul>`)
  return sections.filter(Boolean).join('\n')
}

/**
 * Docs tables on a phone. A table of words (an API, a keyboard list) is wider than 390px, so its last column, the one
 * that says what the thing DOES, sat off-screen behind a sideways scroll nobody knew about. Every plain `.docs-table`
 * whose header and body line up gets `data-stack`, a `data-label` on each cell and the table ARIA roles (display: block
 * would otherwise strip the table semantics in some browsers); docs.css turns the rows into labelled blocks below 40em.
 * Left alone: tables already marked data-stack / data-nostack, tables with row or column spans, tables with more than
 * six columns (they read as a table and scroll, with a cue from docs.js), and any whose rows do not match the header.
 */
function stackDocsTables(html) {
  const text = (h) => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
  return html.replace(/<table\b[^>]*\bclass="[^"]*\bdocs-table\b[^"]*"[^>]*>[\s\S]*?<\/table>/g, (t) => {
    const open = t.match(/^<table\b[^>]*>/)[0]
    if (/\bdata-(no)?stack\b/.test(open) || /\b(rowspan|colspan)=/.test(t)) return t
    const head = t.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/)
    if (!head) return t
    const labels = [...head[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].map((m) => text(m[1]))
    if (labels.length < 2 || labels.length > 6 || labels.some((l) => !l)) return t
    const afterHead = t.slice(t.indexOf('</thead>') + 8)
    const rows = [...afterHead.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)]
    if (!rows.length) return t
    for (const r of rows) if ([...r[1].matchAll(/<t[dh]\b/g)].length !== labels.length) return t
    const esc2 = (x) => x.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    const addAttrs = (tag, attrs) => tag.replace(/^<(\w+)/, (m, n) => `<${n}${attrs}`)
    // head
    let newHead = head[0]
      .replace(/<thead\b/, '<thead role="rowgroup" data-allow-clip')
      .replace(/<tr\b/g, '<tr role="row"')
      .replace(/<th\b(?![^>]*\brole=)/g, '<th role="columnheader"')
    // body
    const newAfter = afterHead
      .replace(/<tbody\b/, '<tbody role="rowgroup"')
      .replace(/<tr\b[^>]*>[\s\S]*?<\/tr>/g, (row) => {
        let i = 0
        return row
          .replace(/^<tr\b/, '<tr role="row"')
          .replace(/<(td|th)\b([^>]*)>/g, (m, tag, attrs) => {
            const label = esc2(labels[i++] ?? '')
            const role = tag === 'th' ? 'rowheader' : 'cell'
            return `<${tag}${/\brole=/.test(attrs) ? '' : ` role="${role}"`}${/\bdata-label=/.test(attrs) ? '' : ` data-label="${label}"`}${attrs}>`
          })
      })
    const newOpen = open.replace(/^<table\b/, '<table data-stack' + (/\brole=/.test(open) ? '' : ' role="table"'))
    return newOpen + t.slice(open.length, t.indexOf(head[0])) + newHead + newAfter
  })
}

function buildDocs() {
  const layoutFile = join(ROOT, 'docs-src', '_layout.html')
  if (!existsSync(layoutFile)) return
  const layout = readFileSync(layoutFile, 'utf8')
  const pages = walk(join(ROOT, 'docs-src'), (p) => p.endsWith('.html') && !posix.basename(rel(p)).startsWith('_')).map(parsePage).filter(Boolean)

  // Pages generated from the repo's own markdown, so the page and the file can never drift apart.
  for (const v of MARKDOWN_PAGES) {
    const f = join(ROOT, v.file)
    if (!existsSync(f)) continue
    pages.push({ meta: v.meta, path: v.path, out: v.path + '.html', body: `<h1>${esc(v.meta.title)}</h1>\n<p class="lede">${v.lede}</p>\n${mdToHtml(readFileSync(f, 'utf8'))}\n` })
  }

  // Stable order: group order, then `order`, then title.
  pages.sort((a, b) => GROUP_ORDER.indexOf(a.meta.group) - GROUP_ORDER.indexOf(b.meta.group) || (a.meta.order ?? 999) - (b.meta.order ?? 999) || a.meta.title.localeCompare(b.meta.title))

  const seen = new Set()
  for (const p of pages) { if (seen.has(p.out)) fail(`duplicate page ${p.out}`); seen.add(p.out) }

  for (const page of pages) {
    const depth = page.out.split('/').length - 1
    const root = depth ? '../'.repeat(depth) : './'
    const navGroups = GROUP_ORDER.map((g) => {
      const items = pages.filter((p) => p.meta.group === g)
      if (!items.length) return ''
      const lis = items.map((p) => {
        const href = root + p.out
        const current = p === page ? ' aria-current="page"' : ''
        return `<li><a href="${href}"${current}>${esc(p.meta.title)}</a></li>`
      }).join('')
      return `<section class="docs-nav__group"><h2 class="docs-nav__heading">${esc(g)}</h2><ul role="list">${lis}</ul></section>`
    }).join('')

    // Table of contents from <h2 id="..."> in the page body.
    const toc = [...page.body.matchAll(/<h2[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)]
      .map((m) => `<li><a href="#${m[1]}">${m[2].replace(/<[^>]+>/g, '')}</a></li>`).join('')

    // {{icon-grid}} in a page becomes a grid of every icon in src/icons, generated so it never goes stale.
    if (page.body.includes('{{icon-grid}}')) {
      const grid = `<ul class="icon-grid" role="list">${[...iconClasses()].sort().map((id) => `<li><span class="ic ic--${id}" aria-hidden="true"></span><code>${id}</code></li>`).join('')}</ul>`
      page.body = page.body.replace('{{icon-grid}}', grid)
    }

    page.body = page.body.replace(/\{\{index:([A-Za-z]+)\}\}/g, (_, g) => renderIndex(g, pages, page, root))
    page.body = stackDocsTables(page.body)
    // a single-word <code> (a token, an attribute, a class) is one inline box (code.nb in docs.css): it never breaks
    // inside while it fits a line, so it cannot strand its leading '--'; one wider than the whole line wraps in its box
    page.body = page.body.replace(/<code>([^<\s]{1,30})<\/code>/g, '<code class="nb">$1</code>')

    let html = layout
      .replaceAll('{{title}}', esc(page.meta.title))
      .replaceAll('{{summary}}', esc(page.meta.summary))
      .replaceAll('{{group}}', esc(page.meta.group))
      .replaceAll('{{root}}', root)
      .replaceAll('{{version}}', esc(pkg.version))
      .replace('{{nav}}', navGroups)
      .replace('{{toc}}', toc ? `<nav class="docs-toc" aria-label="On this page"><h2 class="docs-toc__heading">On this page</h2><ul role="list">${toc}</ul></nav>` : '')
      .replace('{{content}}', page.body)
    // Every icon class a page uses must exist (the typo check the owner's gate calls "every class is defined").
    for (const m of html.matchAll(/\bic--([a-z0-9-]+)/g)) if (!iconClasses().has(m[1])) fail(`${page.out}: uses icon "ic--${m[1]}" but there is no such icon (src/icons/${m[1]}.svg)`)
    if (/\{\{[a-z]+\}\}/.test(html)) fail(`${page.out}: unreplaced template placeholder ${html.match(/\{\{[a-z]+\}\}/)[0]}`)

    // Relative link hygiene: pages may write href="@/components/button" to mean "docs root".
    html = html.replace(/(href|src)="@\/([^"]*)"/g, (_, a, p) => `${a}="${root}${p}"`)
    put('docs/' + page.out, html)
  }


  // ---- Link, anchor and id hygiene across the generated site -------------------------------
  const htmlPages = new Map([...out].filter(([k]) => k.startsWith('docs/') && k.endsWith('.html')).map(([k, v]) => [k.slice(5), String(v)]))
  const idsOf = (html) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  for (const [file, html] of htmlPages) {
    const ids = idsOf(html)
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i)
    // ids inside <symbol> sprites are unique per page by construction; any other duplicate is a bug.
    for (const id of new Set(dup)) fail(`docs/${file}: duplicate id "${id}"`)
    const idSet = new Set(ids)
    for (const m of html.matchAll(/\shref="([^"]+)"/g)) {
      const href = m[1]
      if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(href)) continue
      const [path, frag] = href.split('#')
      let target = file
      if (path) {
        target = posix.normalize(posix.join(posix.dirname(file), path))
        if (target.startsWith('assets/') || !target.endsWith('.html')) continue
        if (!htmlPages.has(target)) {
          (ALLOW_BROKEN ? warn : fail)(`docs/${file}: link to "${href}" does not resolve to a page`)
          continue
        }
      }
      if (frag && !idsOf(htmlPages.get(target)).includes(frag)) (ALLOW_BROKEN ? warn : fail)(`docs/${file}: link "${href}" points to a missing anchor #${frag}`)
    }
  }

  // Docs assets: the library itself (dogfooding) plus docs-only css/js.
  for (const f of ['styleguide.css', 'styleguide.min.css', 'styleguide.js', 'icons.css', 'wire.css']) if (out.has('dist/' + f)) put('docs/assets/' + f, out.get('dist/' + f))
  for (const [k, v] of [...out]) if (k.startsWith('dist/fonts/')) put('docs/assets/' + k.slice('dist/'.length), v)
  for (const f of walk(join(ROOT, 'docs-src', 'assets'))) put('docs/assets/' + rel(f).slice('docs-src/assets/'.length), readFileSync(f))
  // Raw-file marker so GitHub Pages does not run Jekyll over underscores.
  put('docs/.nojekyll', '')
}

/* -------------------------------------------------------------------- main */

console.log(CHECK ? 'Checking generated files are up to date...' : 'Building...')
buildCss()
buildWire()
buildJs()
buildManifest()
copyFonts()
buildIcons()
buildDocs()

if (errors.length) {
  console.error('\nBuild failed:\n' + errors.map((e) => '  x ' + e).join('\n'))
  process.exit(1)
}

const managed = (p) => p.startsWith('dist/') || p.startsWith('docs/')
const same = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0

if (CHECK) {
  const stale = []
  for (const [p, data] of out) {
    const disk = join(ROOT, p)
    if (!existsSync(disk) || !same(readFileSync(disk), data)) stale.push(p)
  }
  for (const dir of ['dist', 'docs']) for (const f of walk(join(ROOT, dir))) if (!out.has(rel(f))) stale.push(rel(f) + ' (orphan: no longer generated)')
  if (stale.length) {
    console.error('\nGenerated files are stale. Run `npm run build` and commit:\n' + stale.map((s) => '  - ' + s).join('\n'))
    process.exit(1)
  }
  console.log(`OK: ${out.size} generated files match.`)
} else {
  // Remove orphans so renamed/deleted sources do not leave dead files behind.
  for (const dir of ['dist', 'docs']) for (const f of walk(join(ROOT, dir))) if (!out.has(rel(f))) rmSync(f)
  let bytes = 0
  for (const [p, data] of out) {
    const disk = join(ROOT, p)
    mkdirSync(dirname(disk), { recursive: true })
    writeFileSync(disk, data)
    bytes += Buffer.byteLength(data)
  }
  const css = out.get('dist/styleguide.css') ?? ''
  const min = out.get('dist/styleguide.min.css') ?? ''
  console.log(`Wrote ${out.size} files (${(bytes / 1024).toFixed(0)} KiB). CSS ${(css.length / 1024).toFixed(1)} KiB, min ${(min.length / 1024).toFixed(1)} KiB.`)
}
