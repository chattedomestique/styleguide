#!/usr/bin/env node
/**
 * Accessibility gate. Every docs page, under several appearances, in a real browser.
 *
 *   npm run test:a11y                         all pages x all appearances (a few minutes)
 *   npm run test:a11y -- --quick              default + dark/mint/soft only
 *   npm run test:a11y -- --pages components/button.html,components/card.html
 *
 * Checks (ERROR unless noted)
 *   axe        axe-core, tags wcag2a/2aa/21a/21aa/22aa + best-practice (colour-contrast skipped under forced colours)
 *   reflow     no horizontal scroll at 320px wide, and none at 390px with text at 200%, with every <details> open;
 *              no text cut off by a clipping frame (overflow: clip|hidden) at either size      (WCAG 1.4.10, 1.4.4)
 *   focus      tabbing reaches controls; each focused control has a visible indicator, the ring is >= 3:1
 *              against what it is drawn on, and the control is not covered by other content      (2.4.7, 2.4.11, 1.4.11)
 *   targets    interactive elements are >= 24px (error) and >= 44px (warning) incl. invisible hit areas (2.5.8, 2.5.5)
 *   forced     under forced colours every control keeps a visible border                   (1.4.11)
 *   console    no uncaught errors or failed requests
 *
 * Chromium only. Safari/VoiceOver/TalkBack are NOT covered; see docs/accessibility/manual.
 */
import { readFileSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { createHash } from 'node:crypto'
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
  { name: 'dark-mint-soft', prefs: { theme: 'dark', palette: 'mint', corners: 'soft' }, width: 390 },
  { name: 'wire-square', prefs: { theme: 'light', palette: 'wire', corners: 'square' }, width: 390 },
  { name: 'contrast-periwinkle-dark', prefs: { contrast: 'more', palette: 'periwinkle', theme: 'dark' }, width: 1280 },
  { name: 'forced-colors', prefs: {}, width: 390, forced: true },
].filter((a) => !QUICK || ['default', 'dark-mint-soft'].includes(a.name))

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
      // let hover/focus transitions finish: a ring measured mid-fade is measured against the wrong colour
      await Promise.race([Promise.all(document.getAnimations().filter((a) => a instanceof CSSTransition).map((a) => a.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 600))])
      const el = document.activeElement
      if (!el || el === document.body) break
      if (seen.has(el)) break
      seen.add(el)
      if (!visible(el)) { res.push({ kind: 'invisible-focus', el: desc(el) }); continue }
      // The indicator may be on the control or on a container that wears it on the control's behalf
      // (a whole-card link: .card:has(a:focus-visible)). Accept an outline or shadow on the control or the nearest 5 ancestors.
      // A transparent outline is the forced-colours fallback (it becomes a real ring only there); it is not an
      // indicator in normal colours. The ring may also be drawn on ::before / ::after (a styled checkbox).
      let shown = false
      let pixelsOnly = false
      if (el.matches('input[type=range]')) {
        // Ring contrast for a thumb is asserted by tests/components/slider.mjs and tests/contrast.mjs (--focus on --paper);
        // here we only prove that focusing changes what is drawn round the control.
        pixelsOnly = true
        const r = el.getBoundingClientRect()
        const pad = 16
        const x = Math.max(0, r.left - pad), y = Math.max(0, r.top - pad)
        const box = { x, y, width: Math.min(innerWidth - x, r.width + 2 * pad), height: Math.min(innerHeight - y, r.height + 2 * pad) }
        const focusedShot = await window.__snap(box)
        el.blur()
        await Promise.race([Promise.all(document.getAnimations().filter((a) => a instanceof CSSTransition).map((a) => a.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 600))])
        const plainShot = await window.__snap(box)
        shown = !!focusedShot && !!plainShot && focusedShot !== plainShot
      } else {
        for (let n = el, k = 0; n && k < 6 && !shown; n = n.parentElement, k++) {
          const cs = getComputedStyle(n)
          const shadow = cs.boxShadow && cs.boxShadow !== 'none'
          shown = !!ringHolder(n) || !!shadow
        }
      }
      if (!shown) res.push({ kind: 'no-indicator', el: desc(el) })
      else if (!pixelsOnly) {
        // Is the ring actually visible? Compare it with what it is drawn against (WCAG 1.4.11 / 2.4.11):
        // outside the box -> the nearest opaque ancestor background (or the paper halo between box and ring);
        // inside the box (negative offset) -> the element's own background.
        const ring = ringContrast(el)
        if (ring && ring.ratio < 3) res.push({ kind: 'ring-contrast', el: desc(el), ratio: ring.ratio.toFixed(2), detail: ring.detail })
      }
      const r = el.getBoundingClientRect()
      const hit = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1))
      if (hit && !(hit === el || el.contains(hit) || hit.contains(el))) res.push({ kind: 'obscured', el: desc(el), by: desc(hit) })
    }
    res.push({ kind: 'tab-count', n: seen.size })
    return res
    // The computed style (of the node or its ::before / ::after) that draws a visible outline, else null.
    function ringHolder(n) {
      for (const pseudo of [null, '::before', '::after']) {
        const cs = getComputedStyle(n, pseudo)
        if (cs.outlineStyle === 'none' || !(parseFloat(cs.outlineWidth) > 0)) continue
        if (pseudo && cs.content === 'none') continue
        const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
        probe.clearRect(0, 0, 1, 1); probe.fillStyle = '#000'; probe.fillStyle = cs.outlineColor; probe.fillRect(0, 0, 1, 1)
        if (probe.getImageData(0, 0, 1, 1).data[3] > 0) return cs
      }
      return null
    }
    function desc(e) { return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + (e.textContent ? ` "${e.textContent.trim().replace(/\s+/g, ' ').slice(0, 24)}"` : '') }
    function ringContrast(el) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 1
      const cx = cv.getContext('2d', { willReadFrequently: true })
      const rgba = (css) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
      const lum = ([r, g, b]) => { const f = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
      const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
      const bgOf = (n) => { for (; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] >= 0.99) return c } return rgba('canvas') }
      // the node that wears the ring: the control itself or the nearest ancestor with an outline / ring shadow
      let holder = null, cs = null
      for (let n = el, k = 0; n && k < 6 && !holder; n = n.parentElement, k++) { const h = ringHolder(n); if (h) { holder = n; cs = h } }
      if (!holder) return null
      const ringC = rgba(cs.outlineColor)
      const off = parseFloat(cs.outlineOffset) || 0
      const neighbours = []
      if (off >= 0) {
        neighbours.push(['behind', bgOf(holder.parentElement || holder)])
        const m = cs.boxShadow.match(/(rgba?\([^)]*\)|color\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\))\s+0px\s+0px\s+0px\s+([\d.]+)px/)
        if (m && parseFloat(m[2]) >= off - 0.5) neighbours.push(['halo', rgba(m[1])])
      } else neighbours.push(['inside', bgOf(holder)])
      const best = neighbours.map(([n, c]) => [n, ratio(ringC, c)]).sort((a, b) => b[1] - a[1])[0]
      return { ratio: best[1], detail: neighbours.map(([n, c]) => `${n} ${ratio(ringC, c).toFixed(2)}`).join(', ') }
    }
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

// Two frames, so measured layouts settle first: SG.fit and the scripts that measure (dock, segmented, pager, empty
// actions) run in ResizeObserver callbacks, which a real browser runs before it paints; read right after a resize,
// the page would still show the intermediate layout no one ever sees.
function settle() {
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
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


/** Text that a clipping frame cuts off (overflow: clip | hidden): invisible to scrollWidth checks and to axe. */
function probeClipped() {
  const out = []
  const desc = (e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '')
  for (const box of document.querySelectorAll('*')) {
    const cs = getComputedStyle(box)
    if (!/^(clip|hidden)$/.test(cs.overflowX) && !/^(clip|hidden)$/.test(cs.overflowY)) continue
    if (box.closest('.sr-only, [hidden], details:not([open]) > :not(summary), pre, .marquee, [data-allow-clip]')) continue
    const b = box.getBoundingClientRect()
    if (b.width <= 1 || b.height <= 1) continue // a 1px clipped box is the visually-hidden pattern (a week view's header row), not a frame
    const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT)
    for (let t; (t = walker.nextNode()); ) {
      if (!t.nodeValue.trim()) continue
      const host = t.parentElement
      const hs = getComputedStyle(host)
      // closed <details> content is not rendered (content-visibility: hidden); it cannot be cut off
      if (host.closest('details:not([open]) > :not(summary)')) continue
      // a marquee moves on purpose inside a clipping frame and has a pause control; its still / reduced-motion state is covered by its spec
      if (host.closest('.marquee, [data-allow-clip]')) continue
      if (hs.visibility === 'hidden' || hs.display === 'none' || host.closest('.sr-only, [aria-hidden="true"]') || hs.textOverflow === 'ellipsis') continue
      // text inside its own scroller (a <pre>, a table wrapper) is reachable by scrolling, not cut off
      let scrollsX = false, scrollsY = false
      for (let n = host; n && n !== box; n = n.parentElement) { const ns = getComputedStyle(n); if (/^(auto|scroll)$/.test(ns.overflowX)) scrollsX = true; if (/^(auto|scroll)$/.test(ns.overflowY)) scrollsY = true }
      const r = document.createRange(); r.selectNodeContents(t)
      for (const q of r.getClientRects()) {
        if (!q.width) continue
        const cutX = !scrollsX && /^(clip|hidden)$/.test(cs.overflowX) && (q.right > b.right + 1 || q.left < b.left - 1)
        const cutY = !scrollsY && /^(clip|hidden)$/.test(cs.overflowY) && (q.bottom > b.bottom + 1 || q.top < b.top - 1)
        if (cutX || cutY) { out.push(`"${t.nodeValue.trim().slice(0, 28)}" cut off by ${desc(box)} (${cutX ? 'x ' + Math.round(Math.max(q.right - b.right, b.left - q.left)) : 'y ' + Math.round(Math.max(q.bottom - b.bottom, b.top - q.top))}px)`); break }
      }
    }
    if (out.length > 6) break
  }
  return out
}

function probeForced() {
  const bad = []
  for (const el of document.querySelectorAll('button, .btn, .icon-btn, input:not([type=hidden]):not([type=radio]):not([type=checkbox]), select, textarea')) {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    if (!r.width || cs.visibility === 'hidden' || el.closest('.sr-only, [hidden]')) continue
    // The edge may be drawn by the control or by its ::before/::after (a 44px hit area around a drawn 20px box).
    const edged = (c) => ['Top', 'Right', 'Bottom', 'Left'].some((s) => c['border' + s + 'Style'] !== 'none' && parseFloat(c['border' + s + 'Width']) > 0)
    const has = edged(cs) || [getComputedStyle(el, '::before'), getComputedStyle(el, '::after')].some((c) => c.content !== 'none' && edged(c))
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
  // A hash of the pixels in a viewport rectangle: a slider's ring is drawn on the browser's own thumb pseudo-element, which
  // getComputedStyle cannot read, so "is a ring drawn?" is answered by comparing the control focused and not focused.
  await page.exposeFunction('__snap', async (r) => { try { return createHash('sha1').update(await page.screenshot({ clip: r, animations: 'disabled' })).digest('hex') } catch (e) { return null } })
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
      else if (f.kind === 'ring-contrast') rec.errors.push(`focus: ring on ${f.el} is ${f.ratio}:1 against what it is drawn on (needs 3:1; ${f.detail})`)
      else if (f.kind === 'obscured') rec.errors.push(`focus: ${f.el} is covered by ${f.by} when focused`)
      else if (f.kind === 'invisible-focus') rec.warnings.push(`focus: focus lands on an invisible element ${f.el}`)
      else if (f.kind === 'tab-count') rec.tabStops = f.n
    }

    // targets
    const targets = await page.evaluate(probeTargets)
    for (const t of targets) (t.kind === 'target-lt-24' ? rec.errors : rec.warnings).push(`target ${t.size}: ${t.el}${t.kind === 'target-lt-24' ? ' is under the 24px WCAG 2.5.8 floor' : ' is under 44px'}`)

    // forced colours
    if (app.forced) for (const b of await page.evaluate(probeForced)) rec.errors.push(`forced-colors: control has no visible border: ${b}`)

    // reflow (once per page, on the first appearance). Every <details> is opened first: the copy-paste
    // markup panels are part of the page and must not break WCAG 1.4.10 either.
    if (app === APPEARANCES[0]) {
      // name= makes a group exclusive (opening one closes the rest), so drop it or only the last item would stay open
      await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.removeAttribute('name'); d.open = true }))
      await page.setViewportSize({ width: 320, height: 640 })
      await page.evaluate(settle)
      const o1 = await page.evaluate(probeOverflow)
      if (o1) rec.errors.push(`reflow@320: horizontal overflow ${o1.overflow}px. ${o1.bad.join('; ')}`)
      for (const c of await page.evaluate(probeClipped)) rec.errors.push(`clipped@320: ${c}`)
      await page.setViewportSize({ width: 390, height: 844 })
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.evaluate(settle)
      const o2 = await page.evaluate(probeOverflow)
      if (o2) rec.errors.push(`reflow@200% text: horizontal overflow ${o2.overflow}px. ${o2.bad.join('; ')}`)
      for (const c of await page.evaluate(probeClipped)) rec.errors.push(`clipped@200% text: ${c}`)
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
