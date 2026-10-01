// Interaction spec for Scrubber. See tests/components.mjs for the contract and tests/components/button.mjs for a model.
const DIAL = '#dial + p + .demo .scrubber'
const PLAIN = '#plain + p + .demo'
const STATES = '#states + p + .demo .scrubber'

export const tests = [
  {
    name: 'the ruler is built, hidden from assistive tech, and the readout and valuetext match the value',
    async run({ page, goto, expect }) {
      await goto('components/scrubber.html')
      const r = await page.evaluate((sel) => {
        const root = document.querySelector(sel)
        const input = root.querySelector('input')
        const ticks = root.querySelector('.scrubber__ticks')
        return { ticks: ticks ? ticks.children.length : 0, hidden: ticks?.getAttribute('aria-hidden'), text: root.querySelector('.scrubber__value').textContent, valuetext: input.getAttribute('aria-valuetext'), live: root.querySelector('output').getAttribute('aria-live') }
      }, DIAL)
      expect.equal(r.ticks, 21, 'twenty divisions make twenty-one ticks')
      expect.equal(r.hidden, 'true', 'ticks are aria-hidden')
      expect.equal(r.text, '+12', 'signed readout')
      expect.equal(r.valuetext, '+12', 'aria-valuetext mirrors the readout')
      expect.equal(r.live, 'off', 'the output does not double-announce the slider')
    },
  },
  {
    name: 'Tab reaches the slider; arrows, PageUp/PageDown, Home and End move the value and keep the readout in step',
    async run({ page, goto, expect }) {
      await goto('components/scrubber.html')
      const input = page.locator(`${DIAL} input`)
      const out = page.locator(`${DIAL} .scrubber__value`)
      await input.focus()
      await expect.focused(page, `${DIAL} input`)
      await page.keyboard.press('ArrowRight')
      expect.equal(await input.inputValue(), '13', 'ArrowRight +1')
      expect.equal(await out.textContent(), '+13', 'readout follows')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      expect.equal(await input.inputValue(), '11', 'ArrowLeft -1')
      await page.keyboard.press('PageUp')
      const big = Number(await input.inputValue())
      expect.ok(big - 11 > 1, `PageUp takes a larger step (got +${big - 11})`)
      await page.keyboard.press('Home')
      expect.equal(await input.inputValue(), '-50', 'Home = min')
      expect.equal(await out.textContent(), '−50', 'negative values use the true minus U+2212')
      expect.equal(await input.getAttribute('aria-valuetext'), '−50', 'valuetext uses the true minus')
      await page.keyboard.press('End')
      expect.equal(await input.inputValue(), '50', 'End = max')
      expect.equal(await out.textContent(), '+50', 'readout at max')
    },
  },
  {
    name: 'minus and plus buttons step the value, announce it, and go aria-disabled (not disabled) at the ends so focus stays',
    async run({ page, goto, expect }) {
      await goto('components/scrubber.html')
      const root = page.locator(STATES).nth(4) // "At the start"
      const input = root.locator('input')
      const down = root.locator('[data-step="down"]')
      const up = root.locator('[data-step="up"]')
      expect.equal(await input.inputValue(), '0', 'starts at the minimum')
      expect.equal(await down.getAttribute('aria-disabled'), 'true', 'minus is unavailable at the start')
      expect.equal(await up.getAttribute('aria-disabled'), null, 'plus is available')
      await up.focus()
      await page.keyboard.press('Enter')
      expect.equal(await input.inputValue(), '1', 'plus steps up by one')
      expect.equal(await down.getAttribute('aria-disabled'), null, 'minus becomes available')
      await expect.focused(page, '#states + p + .demo .scrubber:nth-child(5) [data-step="up"]', 'focus stays on the button that was pressed')
      await page.waitForTimeout(80)
      const said = await page.evaluate(() => document.querySelector('[role="status"].sr-only')?.textContent)
      expect.ok(/At the start 1%/.test(said || ''), `the new value is announced (got "${said}")`)
      // a button that becomes unavailable on the last step keeps focus
      await down.focus()
      await page.keyboard.press('Enter')
      expect.equal(await input.inputValue(), '0', 'minus steps back')
      expect.equal(await down.getAttribute('aria-disabled'), 'true', 'minus is unavailable again')
      await expect.focused(page, '#states + p + .demo .scrubber:nth-child(5) [data-step="down"]', 'focus is not thrown away when the button becomes unavailable')
      expect.equal(await down.evaluate((el) => el.disabled), false, 'never the disabled attribute')
    },
  },
  {
    name: 'Reset returns to the default and is aria-disabled when there is nothing to undo',
    async run({ page, goto, expect }) {
      await goto('components/scrubber.html')
      const input = page.locator(`${DIAL} input`)
      const reset = page.locator(`${DIAL} [data-reset]`)
      expect.equal(await reset.getAttribute('aria-disabled'), null, 'value 12 differs from the default 0: reset is live')
      await reset.click()
      expect.equal(await input.inputValue(), '0', 'back to data-default')
      expect.equal(await page.locator(`${DIAL} .scrubber__value`).textContent(), '0', 'zero has no sign')
      expect.equal(await reset.getAttribute('aria-disabled'), 'true', 'nothing left to reset')
    },
  },
  {
    name: 'clicking the bar jumps the thumb there (a pointer alternative to dragging, WCAG 2.5.7)',
    async run({ page, goto, expect }) {
      await goto('components/scrubber.html')
      const input = page.locator(`${PLAIN} input`)
      await input.scrollIntoViewIfNeeded()
      const box = await input.boundingBox()
      await page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2)
      const v = Number(await input.inputValue())
      expect.ok(v >= 70 && v <= 85, `clicking at 80% of the bar sets about 80 (got ${v})`)
      expect.equal(await page.locator(`${PLAIN} .scrubber__value`).textContent(), v + '%', 'readout follows a pointer change')
    },
  },
  {
    name: 'the thumb lifts on hover and keyboard focus the same way, and sinks while pressed',
    async run({ page, goto, expect }) {
      await goto('components/scrubber.html')
      const input = page.locator(STATES).first().locator('input')
      await input.scrollIntoViewIfNeeded()
      const nums = () => input.evaluate((el) => ({ lift: Number(getComputedStyle(el).getPropertyValue('--lift')), fill: Number(getComputedStyle(el).getPropertyValue('--fill')) }))
      await page.waitForTimeout(50)
      const rest = await nums()
      expect.equal(rest.lift, 0, 'rest: --lift 0')
      expect.equal(rest.fill, 0, 'rest: --fill 0')
      const box = await input.boundingBox()
      await page.mouse.move(box.x + 6, box.y + box.height / 2)
      await page.waitForTimeout(400)
      const hover = await nums()
      expect.equal(hover.lift, 1, 'hover: --lift 1')
      expect.equal(hover.fill, 1, 'hover: --fill 1')
      await page.mouse.down()
      await page.waitForTimeout(400)
      const down = await nums()
      expect.equal(down.lift, 0, 'pressed: back onto the bar')
      expect.equal(down.fill, 1, 'pressed: fill stays')
      await page.mouse.up()
      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab')
      await input.focus()
      await page.waitForTimeout(400)
      expect.equal((await nums()).lift, 1, 'keyboard focus: same lift as hover')
    },
  },
  {
    name: 'the bar is 44px tall and the small step buttons still have a 44px hit area',
    async run({ page, goto, expect }) {
      await goto('components/scrubber.html')
      const r = await page.evaluate((sel) => {
        const root = document.querySelector(sel)
        root.scrollIntoView({ block: 'center' })
        const input = root.querySelector('input').getBoundingClientRect()
        const btn = root.querySelector('[data-step="up"]')
        const b = btn.getBoundingClientRect()
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2
        const at = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === btn || btn.contains(t)) }
        return { barH: input.height, btnH: b.height, up: at(cx, cy - 21.5), down: at(cx, cy + 21.5), left: at(cx - 21.5, cy), right: at(cx + 21.5, cy) }
      }, DIAL)
      expect.ok(r.barH >= 43.5, `bar height ${r.barH}`)
      expect.ok(r.btnH < 44, 'the drawn button is smaller than 44px')
      expect.ok(r.up && r.down && r.left && r.right, 'the hit area reaches 44px each way')
    },
  },
  {
    name: 'reduced motion: the thumb does not travel when it lifts',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/scrubber.html')
      const input = page.locator(STATES).nth(1).locator('input') // .is-hover
      await input.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      const t = await input.evaluate((el) => getComputedStyle(el, '::-webkit-slider-thumb').transform)
      expect.ok(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)', `no movement (got ${t})`)
      const fill = await input.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--fill')))
      expect.equal(fill, 1, 'the fill still changes')
    },
  },
  {
    name: 'the disabled slider cannot take focus and its steppers are unavailable',
    async run({ page, goto, expect }) {
      await goto('components/scrubber.html')
      const root = page.locator(STATES).nth(5)
      expect.equal(await root.locator('input').isDisabled(), true, 'native disabled')
      expect.equal(await root.locator('[data-step="up"]').getAttribute('aria-disabled'), 'true', 'plus unavailable')
      await page.evaluate(() => { window.__c = 0; document.addEventListener('input', () => window.__c++) })
      await root.locator('[data-step="up"]').focus()
      await page.keyboard.press('Enter')
      expect.equal(await page.evaluate(() => window.__c), 0, 'no change fires')
    },
  },
  {
    name: 'the hint and Reset share a line or Reset drops under it whole: its label is never split, at 320px or 200% text',
    async run({ page, goto, expect }) {
      await goto('components/scrubber.html')
      for (const [w, pct] of [[320, 100], [390, 200]]) {
        await page.setViewportSize({ width: w, height: 800 })
        await page.addStyleTag({ content: `html{font-size:${pct}%!important}` })
        await page.waitForTimeout(200)
        const r = await page.locator('#dial + p + .demo').evaluate((el) => {
          const b = el.querySelector('[data-reset]'), hint = el.querySelector('.scrubber__foot > span')
          const lines = (n) => { const tops = []; const wk = document.createTreeWalker(n, NodeFilter.SHOW_TEXT); for (let t = wk.nextNode(); t; t = wk.nextNode()) { if (!t.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(t); for (const q of r.getClientRects()) if (q.width > 0 && !tops.some((x) => Math.abs(x - q.top) < 4)) tops.push(q.top) } return tops.length }
          const bb = b.getBoundingClientRect(), foot = el.querySelector('.scrubber__foot').getBoundingClientRect()
          return { lines: lines(b), h: bb.height, minH: parseFloat(getComputedStyle(b).minHeight), inside: bb.left >= foot.left - 1 && bb.right <= foot.right + 1, hintLines: lines(hint) }
        })
        expect.equal(r.lines, 1, `${w}px ${pct}%: "Reset" is on one line`)
        expect.ok(r.h < r.minH * 1.5, `${w}px ${pct}%: Reset is a one-line pill, not a tall oval (${r.h}px)`)
        expect.ok(r.inside, `${w}px ${pct}%: Reset is inside the row`)
      }
    },
  },
  {
    name: 'a raised thumb stands its hard shadow off behind a paper gap, and the forced Focus specimen draws the ring',
    async run({ page, goto, expect }) {
      await goto('components/scrubber.html')
      // the thumb is a pseudo-element the page cannot read, so read the shadow it is given (--_shadow on the input) and let a probe resolve it to px
      const shadow = (sel) => page.locator(sel).evaluate((el) => {
        const probe = document.createElement('div')
        probe.style.cssText = 'position:fixed;inline-size:1px;block-size:1px;box-shadow:' + getComputedStyle(el).getPropertyValue('--_shadow')
        el.after(probe)
        const v = getComputedStyle(probe).boxShadow
        probe.remove()
        return v
      })
      const hover = await shadow('#st-hover'), rest = await shadow('#st-rest')
      expect.ok(/0px 0px 0px 2px/.test(hover) && /4px 4px 0px 2px/.test(hover), `a paper ring (0 0 0 2px) under an offset line shadow (4px 4px 0 2px): ${hover}`)
      expect.ok(!/ [1-9]\d*px [1-9]\d*px/.test(rest) && !/0px 0px 0px [1-9]/.test(rest), `at rest there is no ring and no offset shadow: ${rest}`)
      const ring = await page.locator('#st-focus').evaluate((el) => { const c = getComputedStyle(el); return c.outlineStyle + ' ' + c.outlineWidth })
      expect.equal(ring, 'solid 3px', 'is-focus draws the ring')
    },
  },
]
