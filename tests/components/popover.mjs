// Interaction spec for Popover (non-modal card on the native popover attribute). Real keyboard and mouse input in Chromium.
// Docs page: components/popover.html. Contract: tests/components.mjs.
const isOpen = (page, id) => page.evaluate((i) => document.getElementById(i).matches(':popover-open'), id)

export const tests = [
  {
    name: 'Enter opens it, focus moves to its first control, aria-expanded follows; Esc closes and returns focus',
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      const btn = page.locator('[popovertarget="pop-known"][aria-haspopup]')
      await btn.focus()
      expect.equal(await btn.getAttribute('aria-expanded'), 'false')
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => document.activeElement.closest('#pop-known'))
      expect.ok(await isOpen(page, 'pop-known'), 'open')
      expect.equal(await btn.getAttribute('aria-expanded'), 'true')
      await expect.focused(page, '#pop-known .card__ctl', 'focus moved onto the Close control')
      await page.keyboard.press('Escape')
      expect.ok(!(await isOpen(page, 'pop-known')), 'Esc closed it')
      await expect.focused(page, '[popovertarget="pop-known"][aria-haspopup]', 'focus is back on the button')
      expect.equal(await btn.getAttribute('aria-expanded'), 'false')
    },
  },
  {
    name: 'the Close control (popovertargetaction="hide") closes it by key and by tap, and focus returns',
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      await page.locator('[popovertarget="pop-known"][aria-haspopup]').click()
      await page.waitForFunction(() => document.activeElement.closest('#pop-known'))
      await page.keyboard.press('Enter')
      expect.ok(!(await isOpen(page, 'pop-known')), 'Enter on Close')
      await expect.focused(page, '[popovertarget="pop-known"][aria-haspopup]')
      await page.locator('[popovertarget="pop-known"][aria-haspopup]').click()
      await page.locator('#pop-known .card__ctl').click()
      expect.ok(!(await isOpen(page, 'pop-known')), 'tap on Close')
      await expect.focused(page, '[popovertarget="pop-known"][aria-haspopup]')
    },
  },
  {
    name: 'a popover with no controls is focused as a whole, so a screen reader reads it',
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      await page.locator('[popovertarget="pop-p1"]').click()
      await page.waitForFunction(() => document.activeElement.closest('#pop-p1'))
      await expect.focused(page, '#pop-p1', 'focus is on the popover itself')
      expect.equal(await page.locator('#pop-p1').getAttribute('tabindex'), '-1')
      await page.keyboard.press('Escape')
      await expect.focused(page, '[popovertarget="pop-p1"]')
    },
  },
  {
    name: 'a click outside closes it (light dismiss); focus goes where the click went, never stays in the closed popover',
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      await page.locator('[popovertarget="pop-known"][aria-haspopup]').click()
      await page.waitForTimeout(300)
      await page.mouse.click(5, 300)
      await page.waitForTimeout(300)
      expect.ok(!(await isOpen(page, 'pop-known')), 'closed')
      expect.equal(await page.locator('[popovertarget="pop-known"][aria-haspopup]').getAttribute('aria-expanded'), 'false')
      const inside = await page.evaluate(() => !!document.activeElement.closest('#pop-known'))
      expect.ok(!inside, 'focus is not stranded inside the hidden popover')
    },
  },
  {
    name: 'tabbing out of the last control closes it and focus continues to the next control on the page',
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      await page.locator('[popovertarget="pop-options"]').first().focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => document.activeElement.closest('#pop-options'))
      // Close, then three checkboxes, then out
      for (let i = 0; i < 3; i++) await page.keyboard.press('Tab')
      await expect.focused(page, '#pop-options label:nth-of-type(3) input')
      await page.keyboard.press('Tab')
      await page.waitForTimeout(300)
      expect.ok(!(await isOpen(page, 'pop-options')), 'closed when focus left it')
      const w = await page.evaluate(() => { const a = document.activeElement; return { inPop: !!a.closest('#pop-options'), body: a === document.body } })
      expect.ok(!w.inPop && !w.body, 'focus moved on to a real control')
    },
  },
  {
    name: 'Shift+Tab from the first control goes back to the button without closing it',
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      await page.locator('[popovertarget="pop-options"]').first().focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => document.activeElement.closest('#pop-options'))
      await page.keyboard.press('Shift+Tab')
      await expect.focused(page, '[popovertarget="pop-options"][aria-haspopup]')
      await page.waitForTimeout(200)
      expect.ok(await isOpen(page, 'pop-options'), 'still open: the button is where it came from')
    },
  },
  {
    name: 'only one auto popover is open at a time',
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      await page.locator('[popovertarget="pop-known"][aria-haspopup]').click()
      await page.waitForTimeout(300)
      await page.locator('[popovertarget="pop-options"][aria-haspopup]').click()
      await page.waitForTimeout(300)
      expect.ok(await isOpen(page, 'pop-options'), 'the second is open')
      expect.ok(!(await isOpen(page, 'pop-known')), 'the first closed')
    },
  },
  {
    name: 'it is named and described for assistive technology: role=dialog, a visible title, aria-haspopup on the button',
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      const r = await page.evaluate(() => {
        const p = document.getElementById('pop-known')
        const t = document.getElementById(p.getAttribute('aria-labelledby'))
        const b = document.querySelector('[popovertarget="pop-known"][aria-haspopup]')
        return { role: p.getAttribute('role'), title: t && t.textContent.trim(), tag: t && t.tagName, haspopup: b.getAttribute('aria-haspopup'), close: p.querySelector('.card__ctl').getAttribute('aria-label') }
      })
      expect.equal(r.role, 'dialog'); expect.equal(r.haspopup, 'dialog'); expect.equal(r.tag, 'H2')
      expect.ok(r.title.length > 2, 'labelledby resolves to a visible title')
      expect.equal(r.close, 'Close')
    },
  },
  {
    name: 'the default placement is under the button, start-aligned, with an 8px gap',
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      await page.locator('[popovertarget="pop-known"][aria-haspopup]').click()
      await page.waitForTimeout(400)
      const r = await page.evaluate(() => { const b = document.querySelector('[popovertarget="pop-known"][aria-haspopup]').getBoundingClientRect(); const m = document.getElementById('pop-known').getBoundingClientRect(); return { gap: m.top - b.bottom, left: m.left - b.left, native: SG.anchor.native } })
      expect.ok(r.native, 'CSS anchor positioning')
      expect.ok(Math.abs(r.gap - 8) <= 2.5, `8px below (${r.gap})`)
      expect.ok(Math.abs(r.left) <= 2.5, `start edges aligned (${r.left})`)
    },
  },
  {
    name: 'bottom-end lines up the end edges; top sits above the button; end sits beside it',
    viewport: { width: 1024, height: 800 },
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      const place = async (id) => {
        await page.locator(`[popovertarget="${id}"]`).scrollIntoViewIfNeeded()
        await page.locator(`[popovertarget="${id}"]`).click()
        await page.waitForTimeout(400)
        const r = await page.evaluate((i) => { const b = document.querySelector(`[popovertarget="${i}"]`).getBoundingClientRect(); const m = document.getElementById(i).getBoundingClientRect(); return { dRight: m.right - b.right, below: m.top - b.bottom, above: b.top - m.bottom, besideGap: m.left - b.right, besideGapStart: b.left - m.right, cx: (m.left + m.right) / 2 - (b.left + b.right) / 2, cy: (m.top + m.bottom) / 2 - (b.top + b.bottom) / 2 } }, id)
        await page.keyboard.press('Escape')
        return r
      }
      const be = await place('pop-p2')
      expect.ok(Math.abs(be.dRight) <= 2.5, `end edges aligned (${be.dRight})`)
      const top = await place('pop-p3')
      expect.ok(Math.abs(top.above - 8) <= 2.5, `8px above (${top.above})`)
      expect.ok(Math.abs(top.cx) <= 3, `centred (${top.cx})`)
      const end = await place('pop-p4')
      // beside it: on the end side, or flipped to the start side when the button is too near the screen edge
      expect.ok(Math.abs(end.besideGap - 8) <= 2.5 || Math.abs(end.besideGapStart - 8) <= 2.5, `8px beside (end side ${end.besideGap}, start side ${end.besideGapStart})`)
      expect.ok(Math.abs(end.cy) <= 3, `and centred on the button, not a screen away (${end.cy})`)
    },
  },
  {
    name: 'with no room below, it flips above and stays on screen',
    viewport: { width: 390, height: 600 },
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      await page.evaluate(() => { const b = document.querySelector('[popovertarget="pop-known"][aria-haspopup]'); const y = b.getBoundingClientRect().top + scrollY; scrollTo(0, y - (innerHeight - 90)) })
      await page.locator('[popovertarget="pop-known"][aria-haspopup]').click()
      await page.waitForTimeout(400)
      const r = await page.evaluate(() => { const b = document.querySelector('[popovertarget="pop-known"][aria-haspopup]').getBoundingClientRect(); const m = document.getElementById('pop-known').getBoundingClientRect(); return { above: m.bottom <= b.top + 1, top: m.top } })
      expect.ok(r.above && r.top >= 0, `flipped above and on screen (${JSON.stringify(r)})`)
    },
  },
  {
    name: 'fallback without anchor positioning: JS places it below the button, start-aligned, and keeps it on screen',
    async run({ page, goto, expect }) {
      await page.addInitScript(() => { const s = CSS.supports.bind(CSS); CSS.supports = (...a) => (/position-area|anchor-name/.test(a.join(' ')) ? false : s(...a)) })
      await goto('components/popover.html')
      expect.equal(await page.evaluate(() => SG.anchor.native), false)
      await page.locator('[popovertarget="pop-known"][aria-haspopup]').click()
      await page.waitForTimeout(400)
      const r = await page.evaluate(() => { const b = document.querySelector('[popovertarget="pop-known"][aria-haspopup]').getBoundingClientRect(); const m = document.getElementById('pop-known'); const r = m.getBoundingClientRect(); return { placed: m.hasAttribute('data-placed'), gap: r.top - b.bottom, left: r.left - b.left, vis: getComputedStyle(m).visibility, right: r.right, vw: innerWidth } })
      expect.ok(r.placed && r.vis === 'visible', 'placed and visible')
      expect.ok(Math.abs(r.gap - 8) <= 2.5, `8px below, give or take the 2px the lifted button has moved (${r.gap})`)
      expect.ok(r.left >= -1 && r.right <= r.vw, 'on screen')
    },
  },
  {
    name: 'a flat card in the top layer: 2px frame, no shadow, no z-index; square and soft corners; tone works',
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      await page.locator('[popovertarget="pop-known"][aria-haspopup]').click()
      await page.waitForTimeout(400)
      const r = await page.evaluate(() => {
        const cs = getComputedStyle(document.getElementById('pop-known'))
        const sq = getComputedStyle(document.querySelector('[data-corners="square"] .popover')).borderTopLeftRadius
        const so = getComputedStyle(document.querySelector('[data-corners="soft"] .popover')).borderTopLeftRadius
        return { bw: cs.borderTopWidth, shadow: cs.boxShadow, z: cs.zIndex, top: document.getElementById('pop-known').matches(':popover-open'), sq, so, tone: getComputedStyle(document.getElementById('pop-tone')).backgroundColor, plain: cs.backgroundColor }
      })
      expect.equal(r.bw, '2px'); expect.equal(r.z, 'auto')
      expect.ok((r.shadow.match(/-?[\d.]+px/g) ?? []).every((v) => parseFloat(v) === 0), `no shadow (${r.shadow})`)
      expect.equal(r.sq, '0px'); expect.equal(r.so, '24px')
    },
  },
  {
    name: 'touch: a tap opens it and a tap outside closes it',
    touch: true,
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      await page.locator('[popovertarget="pop-known"][aria-haspopup]').tap()
      await page.waitForTimeout(300)
      expect.ok(await isOpen(page, 'pop-known'))
      await page.touchscreen.tap(5, 300)
      await page.waitForTimeout(300)
      expect.ok(!(await isOpen(page, 'pop-known')))
    },
  },
  {
    name: 'at 200% text on a phone the open popover still fits on the screen (scripted placement takes over when CSS has no room)',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.locator('[popovertarget="pop-known"][aria-haspopup]').scrollIntoViewIfNeeded()
      await page.locator('[popovertarget="pop-known"][aria-haspopup]').click()
      await page.waitForTimeout(600)
      const r = await page.evaluate(() => { const b = document.querySelector('#pop-known').getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, vw: document.documentElement.clientWidth, vh: innerHeight } })
      expect.ok(r.l >= -1 && r.r <= r.vw + 1 && r.t >= -1 && r.b <= r.vh + 1, `inside the screen (${JSON.stringify(r)})`)
    },
  },
  {
    name: 'reduced motion: a fade with no vertical travel',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      const t0 = await page.evaluate(() => { const m = document.getElementById('pop-known'); m.showPopover(); const t = new DOMMatrix(getComputedStyle(m).transform).m42; const o = Number(getComputedStyle(m).opacity); m.hidePopover(); return { t, o } })
      expect.equal(t0.t, 0, 'no vertical travel')
      expect.ok(t0.o < 1, 'fading in')
    },
  },
  {
    name: 'full motion: a small settle (proves the reduced test can fail)',
    async run({ page, goto, expect }) {
      await goto('components/popover.html')
      const t = await page.evaluate(() => { const m = document.getElementById('pop-known'); m.showPopover(); const v = new DOMMatrix(getComputedStyle(m).transform).m42; m.hidePopover(); return v })
      expect.ok(t > 1, `travel ${t}px`)
    },
  },
]
