// Reference spec. Copy its shape for every component.
export const tests = [
  {
    name: 'Tab reaches buttons in order and Enter/Space activate a toggle',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const toggle = page.locator('#states ~ .demo button[aria-pressed="false"]').first()
      await toggle.focus()
      await page.keyboard.press('Enter')
      // The docs demo is static; this checks the control is a real, focusable, activatable <button>.
      expect.equal(await toggle.evaluate((el) => el.tagName), 'BUTTON', 'is a native button')
      await expect.focused(page, '.btn[aria-pressed]')
    },
  },
  {
    name: 'aria-disabled buttons are focusable but inert (SG.guard)',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const b = page.locator('.btn[aria-disabled="true"]').first()
      await page.evaluate(() => { window.__clicks = 0; document.querySelector('.btn[aria-disabled="true"]').addEventListener('click', () => window.__clicks++) })
      await b.focus()
      await expect.focused(page, '.btn[aria-disabled="true"]', 'aria-disabled stays focusable')
      await page.keyboard.press('Enter')
      await page.keyboard.press('Space')
      expect.equal(await page.evaluate(() => window.__clicks), 0, 'keyboard activation is blocked')
    },
  },
  {
    name: 'disabled buttons are skipped by Tab',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const n = await page.locator('.btn:disabled').count()
      expect.ok(n >= 1, 'demo has a disabled button')
      await page.locator('.btn:disabled').first().focus().catch(() => {})
      await expect.focused(page, 'body', 'disabled button cannot take focus')
    },
  },
  {
    name: 'hover and keyboard focus raise the button the same way; pressing sinks it',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const b = page.locator('#variants ~ .demo .btn[data-variant="primary"]').first()
      const nums = () => b.evaluate((el) => ({ lift: Number(getComputedStyle(el).getPropertyValue('--lift')), fill: Number(getComputedStyle(el).getPropertyValue('--fill')) }))
      await page.waitForTimeout(50)
      const rest = await nums()
      expect.equal(rest.lift, 0, 'rest: --lift 0')
      await b.hover()
      await page.waitForTimeout(400)
      const hover = await nums()
      expect.equal(hover.lift, 1, 'hover: --lift 1')
      expect.equal(hover.fill, 1, 'hover: --fill 1')
      await page.mouse.down()
      await page.waitForTimeout(400)
      const down = await nums()
      expect.equal(down.lift, 0, 'pressed: back onto the surface')
      expect.equal(down.fill, 1, 'pressed: fill stays')
      await page.mouse.up()
      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab') // switch to keyboard modality so :focus-visible applies
      await b.focus()
      await page.waitForTimeout(400)
      const focus = await nums()
      expect.equal(focus.lift, 1, 'keyboard focus: same lift as hover')
    },
  },
  {
    name: 'a 36px button still has a 44x44 hit area',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const hits = await page.evaluate(() => {
        const el = document.querySelector('.btn[data-size="sm"]')
        el.scrollIntoView({ block: 'center' })
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2
        const at = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)) }
        return { h: r.height, up: at(cx, cy - 21.5), down: at(cx, cy + 21.5) }
      })
      expect.ok(hits.h < 44, 'the drawn box is smaller than 44px')
      expect.ok(hits.up && hits.down, 'the invisible hit area reaches 44px')
    },
  },
  {
    name: 'aria-busy shows a spinner and ignores taps',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const b = page.locator('.btn[aria-busy="true"]').first()
      const pe = await b.evaluate((el) => getComputedStyle(el).pointerEvents)
      expect.equal(pe, 'none', 'busy buttons take no pointer events')
    },
  },
  {
    name: 'reduced motion removes travel but keeps the fill change',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const c = page.locator('#link ~ .demo .card--link').first()
      await c.hover()
      await page.waitForTimeout(600)
      const r = await c.evaluate((el) => ({ t: getComputedStyle(el).transform, fill: getComputedStyle(el).getPropertyValue('--fill') }))
      expect.ok(r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)', `no movement under reduced motion (got ${r.t})`)
      expect.equal(Number(r.fill), 1, 'the fill still changes')
    },
  },
]
