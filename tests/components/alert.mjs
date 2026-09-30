// Interaction spec for Alert (a card with a tone) + SG.dismiss (src/js/65-dismiss.js).
const PAGE = 'components/alert.html'

async function until(page, fn, arg, what = 'condition', tries = 60) {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(fn, arg)) return
    await page.waitForTimeout(50)
  }
  throw new Error('timed out waiting for ' + what)
}

export const tests = [
  {
    name: 'an alert is a card: real 2px frame, a tone fill, and the four statuses have four different icons, a title and a spoken status word',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const rows = await page.$$eval('#status + p + .demo .alert', (els) =>
        els.map((el) => ({
          tone: el.dataset.tone,
          card: el.classList.contains('card'),
          border: getComputedStyle(el).borderTopWidth + ' ' + getComputedStyle(el).borderTopStyle,
          icon: [...el.querySelector('.card__body > .ic').classList].find((c) => c.startsWith('ic--')),
          iconHidden: el.querySelector('.card__body > .ic').getAttribute('aria-hidden'),
          title: el.querySelector('.alert__title')?.textContent.trim(),
          word: el.querySelector('.alert__title .sr-only')?.textContent.trim(),
        })))
      expect.equal(rows.length, 4, 'four status examples')
      expect.equal(new Set(rows.map((r) => r.icon)).size, 4, 'four different icon shapes: ' + rows.map((r) => r.icon).join(', '))
      for (const r of rows) {
        expect.ok(r.card, r.tone + ' is a .card')
        expect.equal(r.border, '2px solid', r.tone + ' has the real frame')
        expect.equal(r.iconHidden, 'true', r.tone + ' icon is decorative')
        expect.ok(r.title && r.title.length > 3, r.tone + ' has a title')
        expect.ok(r.word && r.word.endsWith(':'), r.tone + ' has an sr-only status word')
      }
    },
  },
  {
    name: 'dismiss: Enter hides the alert and moves focus to the next focusable, never to <body>',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const closes = page.locator('#dismiss-stage .alert__close')
      await closes.nth(0).focus()
      await page.keyboard.press('Enter')
      expect.equal(await page.locator('#dismiss-stage .alert').nth(0).getAttribute('hidden') !== null, true, 'first alert hidden')
      await expect.focused(page, '#dismiss-stage .alert:nth-of-type(2) .alert__close', 'focus moved to the next alert close button')
      await page.keyboard.press('Space')
      expect.equal(await page.locator('#dismiss-stage .alert:not([hidden])').count(), 0, 'both dismissed')
      await expect.focused(page, 'summary', "focus moved past the group to the next focusable thing (the demo's Markup disclosure), not to <body>")
    },
  },
  {
    name: 'dismiss: sg:dismiss is cancelable and the alert can be restored',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.evaluate(() => document.addEventListener('sg:dismiss', (e) => { if (window.__block) e.preventDefault() }))
      await page.evaluate(() => { window.__block = true })
      await page.locator('#dismiss-stage .alert__close').first().click()
      expect.equal(await page.locator('#dismiss-stage .alert:not([hidden])').count(), 2, 'preventDefault keeps it')
      await page.evaluate(() => { window.__block = false })
      await page.locator('#dismiss-stage .alert__close').first().click()
      expect.equal(await page.locator('#dismiss-stage .alert:not([hidden])').count(), 1)
      await page.locator('#alerts-restore').click()
      expect.equal(await page.locator('#dismiss-stage .alert:not([hidden])').count(), 2, 'restored')
    },
  },
  {
    name: 'dismiss button is a circle with an aria-label and a 44x44 hit area around its 36px drawing',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const b = page.locator('#dismiss-stage .alert__close').first()
      expect.ok((await b.getAttribute('aria-label')).startsWith('Dismiss'))
      const hits = await b.evaluate((el) => {
        el.scrollIntoView({ block: 'center' })
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2
        const at = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)) }
        return { w: r.width, h: r.height, up: at(cx, cy - 21.5), down: at(cx, cy + 21.5) }
      })
      expect.ok(hits.h < 44, `drawn ${hits.w}x${hits.h}`)
      expect.ok(hits.up && hits.down, 'the hit area reaches 44px')
    },
  },
  {
    name: 'inserting an alert into an existing status / alert container keeps the right roles',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      expect.equal(await page.locator('#live-status-box').getAttribute('role'), 'status')
      expect.equal(await page.locator('#live-alert-box').getAttribute('role'), 'alert')
      expect.equal(await page.locator('#live-status-box').getAttribute('aria-live'), null, 'the role already implies aria-live; no duplicate')
      await page.locator('#live-status').click()
      await page.locator('#live-alert').click()
      expect.equal(await page.locator('#live-status-box .alert[data-tone="ok"]').count(), 1)
      expect.equal(await page.locator('#live-alert-box .alert[data-tone="bad"]').count(), 1)
      await page.locator('#live-alert-box .alert__close').click()
      await until(page, () => document.querySelector('#live-alert-box .alert').hidden === true, null, 'alert hidden')
    },
  },
  {
    name: 'banner row keeps icon, text and action on one line; the default layout puts actions under the text',
    viewport: { width: 1024, height: 900 },
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const banner = await page.locator('#banner ~ .demo .alert[data-size="sm"]').nth(1).evaluate((el) => {
        const r = (s) => el.querySelector(s).getBoundingClientRect()
        return { bodyTop: r('.alert__main').top, bodyBottom: r('.alert__main').bottom, actTop: r('.alert__actions').top, actBottom: r('.alert__actions').bottom }
      })
      expect.ok(banner.actTop < banner.bodyBottom && banner.actBottom > banner.bodyTop, 'action overlaps the text row vertically')
      const full = await page.locator('#actions ~ .demo .alert').first().evaluate((el) => ({ body: el.querySelector('.alert__main').getBoundingClientRect().bottom, act: el.querySelector('.alert__actions').getBoundingClientRect().top }))
      expect.ok(full.act >= full.body, 'default layout: actions start below the text')
    },
  },
  {
    name: 'text is at least 7:1 on every tone (status and slots) in light and dark, every palette and contrast; bold is at least 4.5:1',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const r = await page.evaluate(() => {
        const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
        const root = document.documentElement
        const alerts = [...document.querySelectorAll('.demo .alert')]
        const out = []
        let worst = 99
        for (const theme of ['light', 'dark']) for (const palette of ['default', 'periwinkle', 'mint', 'sand', 'cream', 'wire']) for (const contrast of [null, 'more']) {
          root.setAttribute('data-theme', theme)
          if (palette === 'default') root.removeAttribute('data-palette'); else root.setAttribute('data-palette', palette)
          if (contrast) root.setAttribute('data-contrast', contrast); else root.removeAttribute('data-contrast')
          for (const a of alerts) {
            if (a.hidden || !a.offsetParent) continue
            const bg = SG.colorToHex(getComputedStyle(a).backgroundColor)
            const bold = a.dataset.emphasis === 'bold'
            for (const sel of ['.alert__title', '.alert__text']) {
              const el = a.querySelector(sel)
              if (!el) continue
              const fg = SG.colorToHex(getComputedStyle(el).color)
              const k = ratio(fg, bg)
              worst = Math.min(worst, bold ? 99 : k)
              const min = bold ? 4.5 : 7
              if (k < min) out.push(`${theme}/${palette}/${contrast || 'normal'} ${a.dataset.tone || 'plain'}${bold ? '+bold' : ''} ${sel}: ${k.toFixed(2)}`)
            }
          }
        }
        return { out, worst, n: alerts.length }
      })
      expect.ok(r.n >= 12, 'alerts measured: ' + r.n)
      expect.equal(r.out.slice(0, 6).join(' | '), '', 'contrast below the floor')
    },
  },
  {
    name: 'buttons inside an alert are 44px tall; wrapped actions keep 8px between their frames',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const r = await page.locator('#actions ~ .demo .alert__actions').first().evaluate((el) => {
        const bs = [...el.querySelectorAll('.btn')].map((b) => b.getBoundingClientRect())
        const gaps = []
        for (let i = 1; i < bs.length; i++) gaps.push(bs[i].left >= bs[i - 1].right ? bs[i].left - bs[i - 1].right : bs[i].top - bs[i - 1].bottom)
        return { heights: bs.map((b) => b.height), gaps }
      })
      for (const h of r.heights) expect.ok(h >= 43.5, `button height ${h}`)
      for (const g of r.gaps) expect.ok(g >= 7.5, `gap ${g}`)
    },
  },
]
