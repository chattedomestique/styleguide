#!/usr/bin/env node
/**
 * Design integrity probe. The accessibility gate proves that nothing is cut off or unreachable; it cannot tell a designed
 * layout from a broken-looking one. This finds the objective signs of the second kind, on every docs page, in the
 * conditions people actually use: a phone, a small phone, a desktop, text at 200% and a dark soft-cornered palette.
 *
 *   node tests/design.mjs                          every page, every condition
 *   node tests/design.mjs --pages components/dock.html,components/button.html
 *   node tests/design.mjs --conditions phone,large
 *   node tests/design.mjs --crops                  also save a cropped screenshot of each finding (test-results/design/)
 *
 * Findings
 *   not-round       an icon-only control with fully rounded ends that is not a circle (an oval "circle")
 *   oval            a text pill with fully rounded ends whose label wrapped: a pill is for one line
 *   label-wraps     a control's label runs over more than one line (tabs, chips, tags, buttons, segments, dock words)
 *   word-broken     a word split across two lines (not at a hyphen)
 *   narrow-text     text squeezed into a column of a few letters per line
 *   bar-wraps       a bar that is one row by definition (dock, tabs, segmented, toolbar, pagination) runs onto a second row
 *   row-mismatch    two controls of the same kind and size, side by side in one row, at different heights
 *   icon-drift      an icon and its label in one control drawn far apart (the label centred away from its icon)
 *   overhang        a control sticking out past the frame of the box that holds it
 *
 * It reports; it does not fail the build (yet). Chromium only, like every test here.
 */
import { mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { start, ROOT } from './lib/browser.mjs'

const argv = process.argv.slice(2)
const flag = (n) => { const i = argv.indexOf('--' + n); return i < 0 ? undefined : argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[i + 1] }
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? (n === 'assets' ? [] : walk(p)) : p.endsWith('.html') ? [p] : [] })
const allPages = walk(join(ROOT, 'docs')).map((p) => relative(join(ROOT, 'docs'), p).split(sep).join('/')).sort()
const pages = typeof flag('pages') === 'string' ? flag('pages').split(',') : allPages
const CONDITIONS = [
  { name: 'phone', width: 390, text: 100, prefs: {} },
  { name: 'small', width: 320, text: 100, prefs: {} },
  { name: 'desktop', width: 1024, text: 100, prefs: {} },
  { name: 'large', width: 390, text: 200, prefs: {} },
  { name: 'dark-soft', width: 390, text: 100, prefs: { theme: 'dark', palette: 'mint', corners: 'soft' } },
].filter((c) => typeof flag('conditions') !== 'string' || flag('conditions').split(',').includes(c.name))
const CROPS = !!flag('crops')
const OUT = join(ROOT, 'test-results', 'design')
mkdirSync(OUT, { recursive: true })

/* ------------------------------------------------------------------ in-page probe */
function probe() {
  const out = []
  const scope = document.querySelector('.docs-article') || document.body
  const px = (v) => parseFloat(v) || 0
  const hidden = (el) => {
    for (let n = el, k = 0; n && k < 6; n = n.parentElement, k++) {
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.clipPath === 'inset(50%)') return true
      if (n.matches('.sr-only, [hidden], details:not([open]) > :not(summary), pre, .demo__code')) return true
    }
    return false
  }
  const box = (el) => el.getBoundingClientRect()
  let id = 0
  const tag = (el) => { if (!el.dataset.designId) el.dataset.designId = String(++id); return el.dataset.designId }
  const desc = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '') + [...el.attributes].filter((a) => /^(data-(variant|size|shape|fit|tone)|role|aria-current)$/.test(a.name)).map((a) => `[${a.name}=${a.value}]`).join('')
  const section = (el) => { let n = el; while (n && n !== scope) { let p = n.previousElementSibling; while (p) { if (/^H[23]$/.test(p.tagName) && p.id) return '#' + p.id; p = p.previousElementSibling } n = n.parentElement } return '' }
  const add = (kind, el, detail) => out.push({ kind, el: desc(el), where: section(el), detail, text: (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40), id: tag(el) })
  // lines of TEXT (an icon above a label is not a second line of the label)
  const lines = (el) => {
    const set = []
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let n; (n = w.nextNode()); ) {
      if (!n.nodeValue.trim() || hidden(n.parentElement)) continue
      if (n.parentElement !== el && /absolute|fixed/.test(getComputedStyle(n.parentElement).position)) continue
      const r = document.createRange(); r.selectNodeContents(n)
      for (const q of r.getClientRects()) if (q.width > 1 && !set.some((s) => Math.abs(s - q.top) < 4)) set.push(q.top)
    }
    return set.length
  }
  const visibleText = (el) => {
    let t = ''
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let n; (n = w.nextNode()); ) if (n.nodeValue.trim() && !hidden(n.parentElement)) t += n.nodeValue
    return t.trim()
  }
  const radius = (el) => Math.min(px(getComputedStyle(el).borderTopLeftRadius), px(getComputedStyle(el).borderBottomRightRadius))
  const CONTROL = 'button, a.btn, .btn, [role="tab"], [role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], .chip, .tag, .dock__item, .seg__option, .segmented label, [role="radio"]'
  // two lines by structure, not a wrapped label: a week day (weekday over date), a timeline clip (name over length)
  const STRUCTURED = '.cal[data-view="week"] .cal__day, .timeline__clip'

  // not-round / oval
  for (const el of scope.querySelectorAll('button, a, span, div, label, li')) {
    if (hidden(el)) continue
    if (el.matches('[role="meter"], [role="progressbar"], meter, progress, .meter')) continue // a track, not a control
    if (el.matches(STRUCTURED)) continue
    const b = box(el); if (b.width < 16 || b.height < 16) continue
    const r = radius(el); if (r < Math.min(b.width, b.height) / 2 - 1) continue
    const cs = getComputedStyle(el)
    const framed = cs.borderTopStyle !== 'none' && px(cs.borderTopWidth) > 0 || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent')
    if (!framed) continue
    const txt = visibleText(el)
    if (!txt) { if (Math.abs(b.width - b.height) > 1.5) add('not-round', el, `${Math.round(b.width)}x${Math.round(b.height)}`) }
    else if (lines(el) > 1 && r >= b.height / 2 - 1) add('oval', el, `${Math.round(b.width)}x${Math.round(b.height)}, ${lines(el)} lines`)
  }
  // label-wraps / icon-drift
  for (const el of scope.querySelectorAll(CONTROL)) {
    if (hidden(el)) continue
    const txt = visibleText(el); if (!txt) continue
    const n = lines(el)
    if (n > 1 && !el.matches(STRUCTURED)) add('label-wraps', el, `${n} lines`)
    const ic = el.querySelector(':scope > .ic, :scope > span > .ic')
    if (ic && !hidden(ic)) {
      const ib = box(ic)
      const r = document.createRange(); r.selectNodeContents(el)
      const rects = [...r.getClientRects()].filter((q) => q.width > 1 && q.height > 1 && Math.abs((q.top + q.bottom) / 2 - (ib.top + ib.bottom) / 2) < ib.height)
      const gapPx = px(getComputedStyle(el).columnGap) || 8
      for (const q of rects) {
        const d = q.left >= ib.right ? q.left - ib.right : ib.left >= q.right ? ib.left - q.right : 0
        if (d > Math.max(3 * gapPx, 24)) { add('icon-drift', el, `${Math.round(d)}px between icon and label`); break }
      }
    }
  }
  // word-broken / narrow-text
  const seenNarrow = new Set()
  const tw = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT)
  for (let t; (t = tw.nextNode()); ) {
    const v = t.nodeValue; if (!v.trim()) continue
    const host = t.parentElement; if (!host || hidden(host)) continue
    const all = document.createRange(); all.selectNodeContents(t)
    const rs = [...all.getClientRects()].filter((q) => q.width > 1)
    if (rs.length < 2) continue
    const re = /[A-Za-zÀ-ÿ0-9$€£−+.,:'’-]{4,}/g
    let m, broke = 0
    while ((m = re.exec(v)) && broke < 2) {
      const r = document.createRange(); r.setStart(t, m.index); r.setEnd(t, m.index + m[0].length)
      const tops = []; for (const q of r.getClientRects()) if (q.width > 1 && !tops.some((s) => Math.abs(s - q.top) < 4)) tops.push(q.top)
      if (tops.length > 1) {
        // a break right after a hyphen or a slash is a normal line break, not a broken word: find the exact
        // character that starts the second line
        let cut = 1
        for (; cut < m[0].length; cut++) {
          const c = document.createRange(); c.setStart(t, m.index + cut); c.setEnd(t, m.index + cut + 1)
          const q = c.getClientRects()[0]
          if (q && Math.abs(q.top - tops[0]) >= 4) break
        }
        if (!/[-/]$/.test(m[0].slice(0, cut))) { add('word-broken', host, `"${m[0]}"`); broke++ }
      }
    }
    const hb = box(host)
    const fs = px(getComputedStyle(host).fontSize)
    if (!seenNarrow.has(host) && rs.length >= 3 && hb.width > 0 && hb.width < fs * 4.5) { seenNarrow.add(host); add('narrow-text', host, `${Math.round(hb.width)}px wide at ${fs}px text, ${rs.length} lines`) }
  }
  // bar-wraps
  for (const el of scope.querySelectorAll('.dock__list, [role="tablist"], .segmented, .choice-group[data-variant="segmented"], .toolbar__list, .pagination__list, [role="toolbar"]')) {
    if (hidden(el) || el.matches('[aria-orientation="vertical"]') || el.closest('[aria-orientation="vertical"]')) continue
    const kids = [...el.children].filter((k) => !hidden(k) && box(k).width > 0)
    const rows = []; for (const k of kids) { const c = (box(k).top + box(k).bottom) / 2; if (!rows.some((r) => Math.abs(r - c) < 6)) rows.push(c) }
    if (rows.length > 1) add('bar-wraps', el, `${rows.length} rows`)
  }
  // row-mismatch
  for (const el of scope.querySelectorAll('*')) {
    const cs = getComputedStyle(el); if (!/flex|grid/.test(cs.display) || hidden(el)) continue
    const kids = [...el.children].filter((k) => k.matches(CONTROL) && !hidden(k))
    if (kids.length < 2) continue
    const key = (k) => k.tagName + '|' + k.className + '|' + (k.getAttribute('data-size') || '') + '|' + (k.getAttribute('data-shape') || '')
    const groups = {}
    for (const k of kids) (groups[key(k)] ||= []).push(k)
    for (const g of Object.values(groups)) {
      if (g.length < 2) continue
      const byRow = {}
      for (const k of g) { const b = box(k); const row = Math.round((b.top + b.bottom) / 2 / 8); (byRow[row] ||= []).push(b.height) }
      for (const hs of Object.values(byRow)) if (hs.length > 1 && Math.max(...hs) - Math.min(...hs) > 2) { add('row-mismatch', el, `heights ${hs.map(Math.round).join('/')}`); break }
    }
  }
  // overhang
  for (const el of scope.querySelectorAll(CONTROL)) {
    if (hidden(el)) continue
    const b = box(el)
    for (let p = el.parentElement, k = 0; p && p !== scope && k < 5; p = p.parentElement, k++) {
      const cs = getComputedStyle(p)
      if (/auto|scroll/.test(cs.overflowX) || /auto|scroll/.test(cs.overflowY)) break
      if (!(px(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none')) continue
      const pb = box(p)
      const o = Math.max(pb.left - b.left, b.right - pb.right, pb.top - b.top, b.bottom - pb.bottom)
      if (o > 1.5) add('overhang', el, `${Math.round(o)}px outside ${desc(p)}`)
      break
    }
  }
  return out
}

/* ------------------------------------------------------------------ runner */
const { browser, url, close } = await start()
const results = []
try {
  const jobs = pages.flatMap((pg) => CONDITIONS.map((c) => ({ pg, c })))
  let next = 0
  const worker = async () => {
    while (next < jobs.length) {
      const { pg, c } = jobs[next++]
      const ctx = await browser.newContext({ viewport: { width: c.width, height: 900 }, deviceScaleFactor: CROPS ? 2 : 1 })
      const page = await ctx.newPage()
      await page.addInitScript((p) => { try { localStorage.setItem('sg:prefs', JSON.stringify(p)) } catch (e) {} }, c.prefs)
      try {
        await page.goto(`${url}/docs/${pg}`, { waitUntil: 'networkidle' })
        await page.evaluate(() => document.fonts.ready)
        await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' + (c.text !== 100 ? `html{font-size:${c.text}%!important}` : '') })
        await page.evaluate(() => new Promise((r) => setTimeout(r, 350))) // container queries, the dock's fit, fonts
        const found = await page.evaluate(probe)
        // one finding per element and kind
        const uniq = []; const seen = new Set()
        for (const f of found) { const k = f.kind + '|' + f.id; if (!seen.has(k)) { seen.add(k); uniq.push(f) } }
        if (CROPS) {
          let n = 0
          for (const f of uniq) {
            const loc = page.locator(`[data-design-id="${f.id}"]`).first()
            try {
              await loc.scrollIntoViewIfNeeded({ timeout: 2000 })
              const b = await loc.boundingBox()
              if (b) {
                const pad = 16
                const file = join(OUT, `${pg.replace(/\W+/g, '_')}-${c.name}-${++n}-${f.kind}.png`)
                await page.screenshot({ path: file, clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: Math.min(c.width, b.width + 2 * pad), height: Math.min(1200, b.height + 2 * pad) } })
                f.crop = relative(ROOT, file)
              }
            } catch (e) {}
          }
        }
        results.push({ page: pg, condition: c.name, findings: uniq })
        console.log(`${String(uniq.length).padStart(3)}  ${pg}  [${c.name}]` + (uniq.length ? '  ' + Object.entries(uniq.reduce((a, f) => ((a[f.kind] = (a[f.kind] || 0) + 1), a), {})).map(([k, v]) => `${k} ${v}`).join(', ') : ''))
      } catch (e) {
        results.push({ page: pg, condition: c.name, error: e.message.split('\n')[0], findings: [] })
        console.log(`  !  ${pg}  [${c.name}]  ${e.message.split('\n')[0]}`)
      }
      await ctx.close()
    }
  }
  await Promise.all(Array.from({ length: Math.min(Number(process.env.DESIGN_JOBS ?? 3), jobs.length) }, worker))
  results.sort((a, b) => a.page.localeCompare(b.page) || a.condition.localeCompare(b.condition))
  writeFileSync(join(ROOT, 'test-results', 'design.json'), JSON.stringify(results, null, 1))
  const total = results.reduce((s, r) => s + r.findings.length, 0)
  const byKind = results.flatMap((r) => r.findings).reduce((a, f) => ((a[f.kind] = (a[f.kind] || 0) + 1), a), {})
  console.log(`\n${total} finding(s) across ${results.filter((r) => r.findings.length).length} page/condition runs: ${Object.entries(byKind).map(([k, v]) => `${k} ${v}`).join(', ')}`)
  console.log('Details: test-results/design.json' + (CROPS ? ', crops in test-results/design/' : ''))
} finally {
  await close()
}
