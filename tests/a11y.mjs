#!/usr/bin/env node
/**
 * Accessibility gate. Every docs page, under several appearances, in a real browser.
 *
 *   npm run test:a11y                         all pages x all appearances (a few minutes)
 *   npm run test:a11y -- --quick              default + dark/mint/pop only
 *   npm run test:a11y -- --pages components/button.html,components/card.html
 *
 * Checks (ERROR unless noted)
 *   axe        axe-core, tags wcag2a/2aa/21a/21aa/22aa + best-practice (colour-contrast skipped under forced colours)
 *   reflow     no horizontal scroll at 320px wide, and none at 390px with text at 200%      (WCAG 1.4.10, 1.4.4)
 *   focus      tabbing reaches controls; each focused control has a visible indicator and is not
 *              covered by other content                                                    (2.4.7, 2.4.11)
 *   targets    interactive elements are >= 24px (error) and >= 44px (warning) incl. invisible hit areas (2.5.8, 2.5.5)
 *   forced     under forced colours every control keeps a visible border                   (1.4.11)
 *   console    no uncaught errors or failed requests
 *
 * Chromium only. Safari/VoiceOver/TalkBack are NOT covered; see docs/accessibility/manual.
 */
import { readFileSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { createRequire } from 'node:module'
import { start, ROOT } from './lib/browser.mjs'

const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

const argv = process.argv.slice(2)
const flag = (n) => { const i = argv.indexOf('--' + n); return i < 0 ? undefined : argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[i + 1] }
const QUICK = !!flag('quick')

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? (n === 'assets' ? [] : walk(p)) : p.endsWith('.html') ? [p] : [] })
const allPages = walk(join(ROOT, 'docs')).map((p) => relative(join(ROOT, 'docs'), p).split(sep).join('/')).sort()
const wanted = typeof flag('pages') === 'string' ? flag('pages').split(',') : null
const pages = wanted ?? allPages

const APPEARANCES = [
  { name: 'default', prefs: {}, width: 390 },
  { name: 'dark-mint-pop', prefs: { theme: 'dark', palette: 'mint', surface: 'pop' }, width: 390 },
  { name: 'mono-hard', prefs: { theme: 'light', palette: 'mono', surface: 'hard' }, width: 390 },
  { name: 'contrast-periwinkle-dark', prefs: { contrast: 'more', palette: 'periwinkle', theme: 'dark' }, width: 1280 },
  { name: 'forced-colors', prefs: {}, width: 390, forced: true },
].filter((a) => !QUICK || ['default', 'dark-mint-pop'].includes(a.name))

/* ------------------------------------------------------------------ in-page probes */
function probeFocus(maxTabs) {
  return (async () => {
    const res = []
    const seen = new Set()
    const visible = (el) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden'
    }
    for (let i = 0; i < maxTabs; i++) {
      await window.__tab()
      const el = document.activeElement
      if (!el || el === document.body) break
      if (seen.has(el)) break
      seen.add(el)
      if (!visible(el)) { res.push({ kind: 'invisible-focus', el: desc(el) }); continue }
      const cs = getComputedStyle(el)
      const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
      const shadow = cs.boxShadow && cs.boxShadow !== 'none'
      if (!outline && !shadow) res.push({ kind: 'no-indicator', el: desc(el) })
      const r = el.getBoundingClientRect()
      const hit = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1))
      if (hit && !(hit === el || el.contains(hit) || hit.contains(el))) res.push({ kind: 'obscured', el: desc(el), by: desc(hit) })
    }
    res.push({ kind: 'tab-count', n: seen.size })
    return res
    function desc(e) { return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + (e.textContent ? ` "${e.textContent.trim().replace(/\s+/g, ' ').slice(0, 24)}"` : '') }
  })()
}

function probeTargets() {
  const SEL = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=switch], [role=radio], [role=checkbox], [role=slider], [role=menuitem], [role=option], [tabindex="0"]'
  const out = []
  const desc = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + (e.textContent ? ` "${e.textContent.trim().replace(/\s+/g, ' ').slice(0, 24)}"` : '')
  for (const el of document.querySelectorAll(SEL)) {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || el.closest('.sr-only, .visually-hidden, [hidden], pre, [inert]')) continue
    if (el.matches('input[type=radio], input[type=checkbox]') && r.width < 4) continue // visually-hidden native input behind a styled label
    if (el.closest('.table-wrap') === el) continue // scroll region
    const inline = el.tagName === 'A' && el.closest('p, li, dd, figcaption, td') && cs.display === 'inline'
    if (inline) continue // WCAG 2.5.8 inline exception
    // effective size: visible box, or the area that still routes hits to this element
    let w = r.width, h = r.height
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    const hits = (x, y) => { if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return true; const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)) }
    if (w < 44 && hits(cx - 21.5, cy) && hits(cx + 21.5, cy)) w = 44
    if (h < 44 && hits(cx, cy - 21.5) && hits(cx, cy + 21.5)) h = 44
    if (w < 24 || h < 24) out.push({ kind: 'target-lt-24', el: desc(el), size: `${Math.round(r.width)}x${Math.round(r.height)}` })
    else if (w < 43.5 || h < 43.5) out.push({ kind: 'target-lt-44', el: desc(el), size: `${Math.round(r.width)}x${Math.round(r.height)}` })
  }
  return out
}

function probeOverflow() {
  const W = document.documentElement.clientWidth
  const bad = []
  if (document.documentElement.scrollWidth > W + 1) {
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.width && r.right > W + 1 && !el.closest('.table-wrap, .scroller, pre, [data-allow-overflow]')) {
        const a = el.parentElement && el.parentElement.closest('.table-wrap, .scroller, pre')
        if (a) continue
        bad.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '') + ` right=${Math.round(r.right)} (viewport ${W})`)
        if (bad.length > 4) break
      }
    }
    return { overflow: document.documentElement.scrollWidth - W, bad }
  }
  return null
}

function probeForced() {
  const bad = []
  for (const el of document.querySelectorAll('button, .btn, .icon-btn, input:not([type=hidden]):not([type=radio]):not([type=checkbox]), select, textarea')) {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    if (!r.width || cs.visibility === 'hidden' || el.closest('.sr-only, [hidden]')) continue
    const has = ['top', 'right', 'bottom', 'left'].some((s) => cs['border' + s[0].toUpperCase() + s.slice(1) + 'Style'] !== 'none' && parseFloat(cs['border' + s[0].toUpperCase() + s.slice(1) + 'Width']) > 0)
    if (!has) bad.push((el.className || el.tagName).toString().split(' ')[0] + ` "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20)}"`)
  }
  return bad
}

/* ------------------------------------------------------------------------ runner */
const { browser, url, close } = await start()
const results = []
const errorCount = () => results.reduce((n, r) => n + r.errors.length, 0)

async function audit(pg, app) {
  const rec = { page: pg, appearance: app.name, errors: [], warnings: [] }
  const ctx = await browser.newContext({ viewport: { width: app.width, height: 844 }, forcedColors: app.forced ? 'active' : 'none', colorScheme: app.prefs.theme === 'dark' ? 'dark' : 'light' })
  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('pageerror', (e) => consoleErrors.push(String(e)))
  page.on('requestfailed', (r) => consoleErrors.push('request failed: ' + r.url()))
  page.on('response', (r) => { if (r.status() >= 400) consoleErrors.push(`HTTP ${r.status()} ${r.url()}`) })
  await page.addInitScript((p) => { try { localStorage.setItem('sg:prefs', JSON.stringify(p)) } catch (e) {} }, app.prefs)
  await page.exposeFunction('__key', async (k) => { await page.keyboard.press(k) })
  await page.addInitScript(() => { window.__tab = async () => { await window.__key('Tab'); await new Promise((r) => setTimeout(r, 20)) } })
  try {
    await page.goto(`${url}/docs/${pg}`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    // Smooth scrolling would still be animating when we measure; turn it off for the probes only.
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' })

    // axe
    await page.addScriptTag({ content: axeSource })
    const axeRes = await page.evaluate(async (forced) => {
      const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, rules: forced ? { 'color-contrast': { enabled: false } } : {}, resultTypes: ['violations'] })
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, sample: v.nodes.slice(0, 2).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n')[1]?.trim()) }))
    }, !!app.forced)
    for (const v of axeRes) rec.errors.push(`axe ${v.id} (${v.impact}, ${v.n}x): ${v.help}  e.g. ${v.sample.join(' | ')}`)

    // keyboard focus
    const focus = await page.evaluate(probeFocus, 120)
    for (const f of focus) {
      if (f.kind === 'no-indicator') rec.errors.push(`focus: no visible focus indicator on ${f.el}`)
      else if (f.kind === 'obscured') rec.errors.push(`focus: ${f.el} is covered by ${f.by} when focused`)
      else if (f.kind === 'invisible-focus') rec.warnings.push(`focus: focus lands on an invisible element ${f.el}`)
      else if (f.kind === 'tab-count') rec.tabStops = f.n
    }

    // targets
    const targets = await page.evaluate(probeTargets)
    for (const t of targets) (t.kind === 'target-lt-24' ? rec.errors : rec.warnings).push(`target ${t.size}: ${t.el}${t.kind === 'target-lt-24' ? ' is under the 24px WCAG 2.5.8 floor' : ' is under 44px'}`)

    // forced colours
    if (app.forced) for (const b of await page.evaluate(probeForced)) rec.errors.push(`forced-colors: control has no visible border: ${b}`)

    // reflow (once per page, on the first appearance)
    if (app === APPEARANCES[0]) {
      await page.setViewportSize({ width: 320, height: 640 })
      const o1 = await page.evaluate(probeOverflow)
      if (o1) rec.errors.push(`reflow@320: horizontal overflow ${o1.overflow}px. ${o1.bad.join('; ')}`)
      await page.setViewportSize({ width: 390, height: 844 })
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      const o2 = await page.evaluate(probeOverflow)
      if (o2) rec.errors.push(`reflow@200% text: horizontal overflow ${o2.overflow}px. ${o2.bad.join('; ')}`)
    }
  } catch (e) {
    rec.errors.push('runner: ' + e.message.split('\n')[0])
  }
  for (const c of consoleErrors) rec.errors.push('console: ' + c)
  await ctx.close()
  return rec
}

try {
  const jobs = pages.flatMap((pg) => APPEARANCES.map((app) => ({ pg, app })))
  let next = 0
  const worker = async () => {
    while (next < jobs.length) {
      const { pg, app } = jobs[next++]
      const r = await audit(pg, app)
      results.push(r)
      const tag = r.errors.length ? `x ${r.errors.length} error(s)` : 'ok'
      console.log(`${tag.padEnd(14)} ${r.warnings.length ? `(${r.warnings.length} warn) `.padEnd(10) : ''.padEnd(10)} ${pg}  [${app.name}]`)
      for (const e of r.errors.slice(0, 6)) console.log('      x ' + e)
      if (r.errors.length > 6) console.log(`      ... and ${r.errors.length - 6} more`)
    }
  }
  await Promise.all(Array.from({ length: Math.min(Number(process.env.A11Y_JOBS ?? 2), jobs.length) }, worker))

  mkdirSync(join(ROOT, 'test-results'), { recursive: true })
  writeFileSync(join(ROOT, 'test-results', 'a11y.json'), JSON.stringify(results, null, 1))

  const warns = results.flatMap((r) => r.warnings.map((w) => `${r.page} [${r.appearance}] ${w}`))
  const uniqWarns = [...new Set(warns.map((w) => w.replace(/^\S+ \[[^\]]+\] /, '')))]
  if (uniqWarns.length) { console.log(`\n${uniqWarns.length} distinct warning(s) (not failures):`); uniqWarns.slice(0, 25).forEach((w) => console.log('  ! ' + w)) }
  const n = errorCount()
  console.log(n ? `\n${n} accessibility error(s) across ${results.filter((r) => r.errors.length).length} page/appearance runs.` : `\nAccessibility gate passed: ${pages.length} page(s) x ${APPEARANCES.length} appearance(s).`)
  process.exitCode = n ? 1 : 0
} finally {
  await close()
}
