#!/usr/bin/env node
/**
 * Static checks that keep the system honest. Fast, no browser.
 *
 *   npm run lint
 *
 * ERRORS fail the run; WARNINGS are printed and should be justified in the PR.
 *
 * This is the owner's `check.mjs` gate, extended, on a real CSS tokenizer (tests/lib/rules.mjs). The
 * rules themselves are replayed against the violations and legitimate snippets from the tooling audit
 * of the original checker by `tests/lint.selftest.mjs`, so this cannot quietly stop catching things.
 *
 * What is NOT judged here, on purpose: colour contrast (tests/contrast.mjs resolves every pair in a real
 * browser), keyboard behaviour and focus visibility (tests/a11y.mjs, tests/components.mjs), and whether it
 * looks right (look at the screenshots).
 *
 * Which of the seven rules are machine-checked:
 *   1 two line weights   partly: literal border / outline / shadow-spread / stroke widths and --w-style tokens
 *   2 flat               yes: gradients (hard-stop fills allowed), blur, backdrop-filter, text-shadow, blurred shadows
 *   3 rectangles / circles  partly: only the radius roles may be used
 *   4 uppercase is structure  warning: uppercase outside a label / display / eyebrow selector
 *   5 say something real  yes in docs: lorem ipsum, John Doe, "seamless", "leverage"
 *   6 colour is a swap   yes: hex, rgb/hsl/oklch/color/light-dark, named colours, colours in data: URIs, outside src/tokens
 *   7 no decoration      warning: an inset shadow on one edge (accent stripe); the rest is the squint test
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, relative, basename, sep } from 'node:path'
import { checkCss, checkHtml, undefinedTokens, unknownClasses, declaredIn, stripComments, lineOf } from './lib/rules.mjs'
import { ROOT, walk, collectProject } from './lib/project.mjs'

const rel = (p) => relative(ROOT, p).split(sep).join('/')
const errors = []
const warnings = []
const add = (bucket, file, line, msg) => bucket.push(`${file}${line ? ':' + line : ''}  ${msg}`)
const err = (file, line, msg) => add(errors, file, line, msg)
const warn = (file, line, msg) => add(warnings, file, line, msg)
const emit = (file, res) => { for (const r of res.errors) err(file, r.line, r.msg); for (const r of res.warnings) warn(file, r.line, r.msg); for (const w of res.waived ?? []) waivedAll.push(`${file}:${w.line}  [${w.rule}] ${w.why}`) }

const project = collectProject()
const waivedAll = []
const privByFile = new Map(srcCssPriv())
function srcCssPriv() { return project.cssFiles.filter((f) => rel(f).startsWith('src/')).map((f) => [rel(f), declaredPrivate(readFileSync(f, 'utf8'))]) }
function declaredPrivate(css) { return new Set([...declaredIn(css)].filter((x) => x.startsWith('--_'))) }
const kindOf = (name) => name.startsWith('src/tokens/') ? 'token' : name.startsWith('src/base/') ? 'base' : name.startsWith('src/layout/') ? 'layout' : name.startsWith('src/components/') ? 'component' : name.startsWith('src/wire/') ? 'wire' : 'other'
const srcCss = project.cssFiles.filter((f) => rel(f).startsWith('src/'))
const docsCss = project.cssFiles.filter((f) => rel(f).startsWith('docs-src/'))

/* ---- 1. every source CSS file through the rules ----------------------------------------------- */
for (const f of srcCss) {
  const name = rel(f)
  const css = readFileSync(f, 'utf8')
  const kind = kindOf(name)
  const privateElsewhere = new Set([...privByFile].filter(([n]) => n !== name).flatMap(([, set]) => [...set]))
  emit(name, checkCss({ name, css, kind, privateElsewhere }))
  for (const r of undefinedTokens({ css, declared: project.declared })) err(name, r.line, r.msg)
}
// the docs' own CSS may use roles and tokens but is held to the same colour / flat / line rules
for (const f of docsCss) {
  const name = rel(f)
  const css = readFileSync(f, 'utf8')
  emit(name, checkCss({ name, css, kind: 'docs' }))
  for (const r of undefinedTokens({ css, declared: project.declared })) err(name, r.line, r.msg)
}

/* ---- 2. docs pages: hygiene, copy, unknown classes -------------------------------------------- */
const docPages = walk(join(ROOT, 'docs-src'), (p) => p.endsWith('.html') && !basename(p).startsWith('_'))
for (const f of docPages) {
  const html = readFileSync(f, 'utf8')
  const name = rel(f)
  emit(name, checkHtml({ name, html, page: true }))
  const head = html.replace(/<style[\s\S]*?<\/style>/gi, (m) => m.replace(/[^\n]/g, ' '))
  // classes the page defines itself in a <style> block count as defined
  const local = new Set([...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].flatMap((m) => [...stripComments(m[1]).matchAll(/\.([a-zA-Z][\w-]*)/g)].map((x) => x[1])))
  for (const r of unknownClasses({ source: head, known: new Set([...project.classes, ...local]) })) {
    if (/^ic--/.test(r.msg.match(/"([^"]+)"/)?.[1] ?? '')) continue // icon existence is checked by the build
    warn(name, r.line, r.msg)
  }
  // page-local <style> blocks follow the same rules as shipped CSS
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    const res = checkCss({ name, css: m[1], kind: 'docs' })
    const off = lineOf(html, m.index)
    for (const r of res.errors) err(name, off + r.line, r.msg)
    for (const r of res.warnings) warn(name, off + r.line, r.msg)
  }
}
for (const f of [...walk(join(ROOT, 'src', 'js'), (p) => p.endsWith('.js')), join(ROOT, 'docs-src', 'assets', 'docs.js')].filter(existsSync)) {
  const name = rel(f)
  const js = readFileSync(f, 'utf8')
  // comments may show markup, e.g. <span class="ic ic--name">; only code is checked
  const code = js.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:\w])\/\/.*$/gm, (m, a) => a + ' '.repeat(m.length - a.length))
  for (const r of unknownClasses({ source: code, known: project.classes })) warn(name, r.line, r.msg)
  if (/^\s*(?:import|export)\s/m.test(js)) err(name, '', 'import/export: scripts must be plain (they run from file://)')
}

/* ---- 3. the two prefers-contrast / prefers-reduced-motion blocks must not drift --------------- */
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
for (const f of srcCss.filter((p) => rel(p).startsWith('src/tokens/'))) {
  const b = blockPairs(f)
  for (const [a, c, what] of [['mediaContrast', 'attrContrast', 'prefers-contrast / data-contrast'], ['mediaMotion', 'attrMotion', 'prefers-reduced-motion / data-motion']]) {
    if (b[a].length !== b[c].length) err(rel(f), '', `${what}: ${b[a].length} media block(s) but ${b[c].length} attribute block(s)`)
    else b[a].forEach((x, i) => { if (x !== b[c][i]) err(rel(f), '', `${what}: media block #${i + 1} and attribute block differ. Keep them identical`) })
  }
}

/* ---- 4. every component has a docs page ------------------------------------------------------- */
for (const f of srcCss.filter((p) => rel(p).startsWith('src/components/'))) {
  const n = basename(f, '.css')
  if (/^\d\d-/.test(n) || n.startsWith('_')) continue
  if (!existsSync(join(ROOT, 'docs-src', 'components', n + '.html'))) err(rel(f), '', `no docs page: create docs-src/components/${n}.html (run \`npm run new:component ${n}\` for a template)`)
}

/* ---- 5. doc drift: the .md files may only name tokens and classes that exist ------------------ */
{
  const CLI_FLAGS = new Set(['--allow-broken-links', '--quick', '--matrix', '--check', '--pages', '--theme', '--palette', '--corners', '--contrast', '--motion', '--width', '--selector', '--order', '--title', '--group', '--all', '--verbose'])
  for (const name of ['CLAUDE.md', 'STYLE.md', 'README.md']) {
    const file = join(ROOT, name)
    if (!existsSync(file)) continue
    const md = readFileSync(file, 'utf8')
    const seen = new Set()
    for (const m of md.matchAll(/`([^`\n]+)`/g)) {
      const c = m[1]
      const ln = lineOf(md, m.index)
      if (/^--[a-z0-9-]+$/.test(c) && !CLI_FLAGS.has(c) && !c.startsWith('--_') && !project.declared.has(c) && !seen.has(c)) { seen.add(c); err(name, ln, `token \`${c}\` is not in the CSS`) }
      const cls = c.match(/^\.([a-z][\w-]*)$/i)
      if (cls && !project.classes.has(cls[1]) && !seen.has(c)) { seen.add(c); err(name, ln, `class \`${c}\` is not in the CSS`) }
    }
  }
  // one version, typed once: STYLE.md must agree with package.json
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    const style = readFileSync(join(ROOT, 'STYLE.md'), 'utf8')
    const m = style.match(/^v(\d+\.\d+)\b/m)
    if (m && !pkg.version.startsWith(m[1])) err('STYLE.md', lineOf(style, style.search(/^v\d/m)), `STYLE.md says v${m[1]} but package.json is ${pkg.version}`)
  } catch { /* no package.json */ }
}

/* ---- 6. report -------------------------------------------------------------------------------- */
const unused = [...project.declared].filter((t) => /^--(?:radius|bw)-/.test(t)).filter((t) => {
  const all = [...srcCss, ...docsCss, ...walk(join(ROOT, 'docs-src'), (p) => /\.(html|js)$/.test(p)), ...walk(join(ROOT, 'src', 'js'), (p) => p.endsWith('.js'))].map((f) => readFileSync(f, 'utf8')).join('\n')
  return (all.match(new RegExp(t.replace(/[-]/g, '\\-') + '(?![\\w-])', 'g')) || []).length < 2
})
if (unused.length) warn('tokens', '', `declared but never used: ${unused.join(', ')}`)

const uniq = (a) => [...new Set(a)]
if (waivedAll.length) console.log(`\n${waivedAll.length} waived by lint-allow (each has a reason in the source):\n` + waivedAll.map((w) => '  ~ ' + w).join('\n'))
if (warnings.length) console.log(`\n${uniq(warnings).length} warning(s):\n` + uniq(warnings).map((w) => '  ! ' + w).join('\n'))
if (errors.length) {
  console.log(`\n${uniq(errors).length} error(s):\n` + uniq(errors).map((e) => '  x ' + e).join('\n'))
  process.exit(1)
}
console.log(`\nLint OK (${srcCss.length} source css, ${docPages.length} docs pages, ${uniq(warnings).length} warning${uniq(warnings).length === 1 ? '' : 's'}).`)
