// Spec for Skeleton: aria-hidden groups, the 300 ms delay, a stepped (not smooth, not shimmering)
// pulse, stillness under reduced motion, and the aria-busy + one announcement pattern.
const PAGE = 'components/skeleton.html'

async function until(page, fn, arg, what = 'condition', tries = 60) {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(fn, arg)) return
    await page.waitForTimeout(50)
  }
  throw new Error('timed out waiting for ' + what)
}

export const tests = [
  {
    name: 'skeleton groups are aria-hidden, delayed by 300 ms, hold nothing focusable; a loading region is aria-busy',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const info = await page.$$eval('.skeleton', (els) => els.map((el) => ({ hidden: el.getAttribute('aria-hidden'), delay: getComputedStyle(el).animationDelay, fill: getComputedStyle(el).animationFillMode, focusables: el.querySelectorAll('a,button,input,[tabindex]').length })))
      expect.ok(info.length >= 6, 'skeleton groups on the page: ' + info.length)
      for (const i of info) {
        expect.equal(i.hidden, 'true', 'decorative shapes are hidden from assistive tech')
        expect.equal(i.delay, '0.3s', 'fades in only after 300 ms')
        expect.equal(i.fill, 'both', 'holds opacity 0 through the delay')
        expect.equal(i.focusables, 0, 'nothing focusable inside a skeleton')
      }
      expect.equal(await page.locator('#sk-ctx-h').evaluate((h) => h.closest('section').getAttribute('aria-busy')), 'true')
    },
  },
  {
    name: 'a quick load never shows the skeleton: it is still invisible when the content arrives',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.locator('#sk-fast').click()
      expect.equal(await page.locator('#sk-region').getAttribute('aria-busy'), 'true', 'region is busy while loading')
      const opacity = await page.locator('#sk-body .skeleton').evaluate((el) => getComputedStyle(el).opacity)
      expect.equal(opacity, '0', 'skeleton is still transparent 0-100 ms in')
      await until(page, () => document.getElementById('sk-region').getAttribute('aria-busy') === 'false', null, 'load complete')
      expect.equal(await page.locator('#sk-body .skeleton').count(), 0, 'skeleton replaced by content')
    },
  },
  {
    name: 'a slow load shows the skeleton after 300 ms, then flips aria-busy and announces once, politely',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.evaluate(() => { SG.announce('ready'); window.__said = []; const r = document.querySelector('div.sr-only[role="status"]'); new MutationObserver(() => { if (r.textContent && r.textContent !== 'ready') window.__said.push(r.textContent) }).observe(r, { childList: true, characterData: true, subtree: true }) })
      await page.locator('#sk-slow').click()
      expect.equal(await page.locator('#sk-slow').getAttribute('aria-disabled'), 'true', 'button is inert while loading')
      await page.waitForTimeout(700)
      expect.equal(await page.locator('#sk-body .skeleton').evaluate((el) => getComputedStyle(el).opacity), '1', 'skeleton visible after the delay')
      await until(page, () => document.getElementById('sk-region').getAttribute('aria-busy') === 'false', null, 'load complete', 80)
      await until(page, () => window.__said.length === 1, null, 'one announcement')
      expect.equal((await page.evaluate(() => window.__said))[0], 'Recent sessions loaded')
      expect.equal(await page.locator('#sk-slow').getAttribute('aria-disabled'), null, 'button usable again')
      expect.equal(await page.locator('#sk-body .card--row').count(), 3, 'content rendered')
    },
  },
  {
    name: 'placeholder rows are as tall as the real card rows they are swapped for (when the row is wide enough not to wrap its trail)',
    viewport: { width: 1024, height: 900 },
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.locator('#sk-slow').click()
      await page.waitForTimeout(50)
      const sk = await page.locator('#sk-body .skeleton__row').first().evaluate((el) => el.getBoundingClientRect().height)
      await until(page, () => document.getElementById('sk-region').getAttribute('aria-busy') === 'false', null, 'load complete', 80)
      const real = await page.locator('#sk-body .card--row').first().evaluate((el) => el.getBoundingClientRect().height)
      expect.ok(Math.abs(sk - real) <= 1, `skeleton row ${sk}px vs card row ${real}px`)
    },
  },
  {
    name: 'pulse: pieces step through held opacity levels (no smooth shimmer), never below 0.4',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const ops = []
      for (let i = 0; i < 14; i++) {
        ops.push(await page.locator('#text ~ .demo .skeleton__line').first().evaluate((el) => Number(Number(getComputedStyle(el).opacity).toFixed(2))))
        await page.waitForTimeout(170)
      }
      const levels = [...new Set(ops)].sort()
      expect.ok(levels.length >= 2 && levels.length <= 4, 'a few discrete levels, not a continuum: ' + levels.join(' '))
      expect.ok(Math.min(...ops) >= 0.4, 'shallow: ' + Math.min(...ops))
      expect.equal(await page.locator('#text ~ .demo .skeleton__line').first().evaluate((el) => getComputedStyle(el).animationTimingFunction), 'steps(1)', 'steps, not an easing curve')
    },
  },
  {
    name: 'pulse is OFF under reduced motion: no animation, shapes perfectly still',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const r = await page.evaluate(() => [...document.querySelectorAll('.skeleton [class^="skeleton__"]')].filter((e) => /skeleton__(line|tile|avatar|block|pill)/.test(e.className)).map((e) => getComputedStyle(e).animationName))
      expect.ok(r.length > 10, 'pieces found: ' + r.length)
      expect.ok(r.every((n) => n === 'none'), 'no piece animates: ' + [...new Set(r)].join(','))
      const ops = []
      for (let i = 0; i < 6; i++) {
        ops.push(await page.locator('#text ~ .demo .skeleton__line').first().evaluate((el) => Number(getComputedStyle(el).opacity)))
        await page.waitForTimeout(260)
      }
      expect.equal(Math.min(...ops), 1, 'no dip: ' + ops.join(' '))
    },
  },
  {
    name: 'shapes are visible on the canvas, on a card and on a tone (fill differs from the surface)',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const r = await page.evaluate(() => {
        const out = []
        for (const sel of ['#text ~ .demo .skeleton__line', '#card ~ .demo .card:not([data-tone]) .skeleton__line', '#card ~ .demo .card[data-tone] .skeleton__line']) {
          const line = document.querySelector(sel)
          const bg = getComputedStyle(line).backgroundColor
          let surface = line.parentElement
          while (surface && getComputedStyle(surface).backgroundColor.match(/0\)$|transparent/)) surface = surface.parentElement
          out.push({ sel, bg, surface: surface ? getComputedStyle(surface).backgroundColor : 'none' })
        }
        return out
      })
      for (const x of r) expect.ok(x.bg !== x.surface, `${x.sel}: fill ${x.bg} vs surface ${x.surface}`)
    },
  },
  {
    // Regression: at 14% the shapes were ~1.3:1 on the stage (1.1:1 at the pulse's lowest step): a skeleton nobody could see.
    // They stay quiet (a placeholder is not a control, so well under 3:1) but have to be seen.
    name: 'shapes read against the surface in light and dark (at least 1.5:1 at rest) and stay quiet (under 3:1)',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const out = await page.evaluate(async () => {
        const lum = (c) => { const [r, g, b] = c.map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
        const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
        const rgb = (css) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]] }
        const line = document.querySelector('#text ~ .demo .skeleton__line'), stage = line.closest('.demo__stage')
        const rows = []
        for (const theme of ['light', 'dark']) for (const palette of ['default', 'mint', 'wire']) {
          document.documentElement.setAttribute('data-theme', theme); document.documentElement.setAttribute('data-palette', palette)
          await new Promise((r) => setTimeout(r, 60))
          rows.push({ k: `${theme}/${palette}`, r: ratio(rgb(getComputedStyle(line).backgroundColor), rgb(getComputedStyle(stage).backgroundColor)) })
        }
        return rows
      })
      for (const x of out) expect.ok(x.r >= 1.5 && x.r < 3, `${x.k}: ${x.r.toFixed(2)}:1`)
    },
  },
  {
    name: 'forced colours: shapes are painted GrayText (backgrounds would be deleted)',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.emulateMedia({ forcedColors: 'active' })
      const r = await page.evaluate(() => {
        const probe = (c) => { const p = document.createElement('i'); p.style.cssText = 'color:' + c; document.body.appendChild(p); const v = getComputedStyle(p).color; p.remove(); return v }
        return { bg: getComputedStyle(document.querySelector('.skeleton__line')).backgroundColor, gray: probe('GrayText') }
      })
      expect.equal(r.bg, r.gray)
    },
  },
]
