#!/usr/bin/env node
/**
 * Screenshot any docs page under any appearance, for visual review.
 *
 *   node tests/screenshots.mjs components/button.html
 *   node tests/screenshots.mjs components/button.html --theme dark --palette mint --corners soft --width 390
 *   node tests/screenshots.mjs components/button.html --matrix          light/dark x default/mint/wire x square/soft at 390px
 *   node tests/screenshots.mjs index.html --selector '#examples' --width 1280
 *
 * Flags: --theme light|dark  --palette <name>  --corners square|soft  --contrast more
 *        --motion reduced|full  --forced-colors  --width N (default 390)  --height N
 *        --scale N (device pixel ratio, default 1)  --selector CSS (crop to an element)
 *        --fullPage (default on)  --out DIR (default test-results/shots)
 * Output: prints the PNG paths. Open them with the Read tool to LOOK at the result.
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { start, ROOT } from './lib/browser.mjs'

const args = process.argv.slice(2)
const pages = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--') || (a.endsWith('.html') && !(args[i - 1] || '').startsWith('--selector')))
const flag = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) }
const out = flag('out', join(ROOT, 'test-results', 'shots'))
mkdirSync(out, { recursive: true })

const base = { theme: flag('theme'), palette: flag('palette'), corners: flag('corners'), contrast: flag('contrast'), motion: flag('motion') }
const combos = flag('matrix', false)
  ? ['light', 'dark'].flatMap((theme) => ['default', 'mint', 'wire'].flatMap((palette) => ['square', 'soft'].map((corners) => ({ theme, palette, corners }))))
  : [base]

const { browser, url, close } = await start()
try {
  for (const pg of pages) {
    for (const c of combos) {
      const ctx = await browser.newContext({
        viewport: { width: Number(flag('width', 390)), height: Number(flag('height', 844)) },
        deviceScaleFactor: Number(flag('scale', 1)),
        forcedColors: flag('forced-colors', false) ? 'active' : 'none',
        reducedMotion: c.motion === 'reduced' ? 'reduce' : 'no-preference',
      })
      const page = await ctx.newPage()
      const errors = []
      page.on('pageerror', (e) => errors.push(String(e)))
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
      // Same path real users take: saved prefs are applied by the inline <head> snippet before first paint.
      await page.addInitScript((p) => {
        const saved = {}
        for (const k of ['theme', 'palette', 'corners', 'contrast', 'motion']) if (p[k] && p[k] !== 'default' && p[k] !== 'square') saved[k] = p[k]
        try { localStorage.setItem('sg:prefs', JSON.stringify(saved)) } catch (e) {}
      }, c)
      await page.goto(`${url}/docs/${pg}`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      const name = [pg.replace(/[/.]/g, '_'), c.theme, c.palette, c.corners, c.contrast && 'hc', flag('forced-colors', false) && 'forced', 'w' + flag('width', 390)].filter(Boolean).join('-') + '.png'
      const file = join(out, name)
      const sel = flag('selector', null)
      if (sel) await page.locator(sel).first().screenshot({ path: file })
      else await page.screenshot({ path: file, fullPage: flag('fullPage', true) !== 'false' })
      console.log(file + (errors.length ? `   [console errors: ${errors.join(' | ')}]` : ''))
      await ctx.close()
    }
  }
} finally {
  await close()
}
