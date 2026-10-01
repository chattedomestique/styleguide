// Interaction spec for Sheet. Real keyboard and mouse input in Chromium.
// Docs page: components/sheet.html. Contract: tests/components.mjs.
const isOpen = (page, id) => page.evaluate((i) => { const e = document.getElementById(i); return e.tagName === 'DIALOG' ? e.open : e.matches(':popover-open') }, id)
const heightOf = (page, id) => page.evaluate((i) => Math.round(document.getElementById(i).getBoundingClientRect().height), id)
const nums = (loc) => loc.evaluate((el) => ({ lift: Number(getComputedStyle(el).getPropertyValue('--lift')), fill: Number(getComputedStyle(el).getPropertyValue('--fill')) }))

export const tests = [
  {
    name: 'opens from the keyboard as a modal; focus starts on Close; Esc closes and returns focus to the opener',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-deck"]').focus()
      await page.keyboard.press('Enter')
      expect.ok(await isOpen(page, 'sh-deck'), 'open')
      expect.ok(await page.evaluate(() => document.getElementById('sh-deck').matches(':modal')), 'modal (showModal)')
      await expect.focused(page, '#sh-deck [data-sg-close]', 'autofocus on the visible Close control')
      await page.keyboard.press('Escape')
      expect.ok(!(await isOpen(page, 'sh-deck')), 'Esc closed it')
      await expect.focused(page, '[data-sg-open="#sh-deck"]', 'focus returned to the opener')
    },
  },
  {
    name: 'the Close control closes it with Enter and Space, and with a tap; it is a 44px target',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      for (const key of ['Enter', 'Space']) {
        await page.locator('[data-sg-open="#sh-deck"]').focus()
        await page.keyboard.press('Enter')
        await expect.focused(page, '#sh-deck [data-sg-close]')
        await page.keyboard.press(key)
        expect.ok(!(await isOpen(page, 'sh-deck')), `${key} on Close closes`)
        await expect.focused(page, '[data-sg-open="#sh-deck"]')
      }
      await page.locator('[data-sg-open="#sh-deck"]').click()
      const b = await page.locator('#sh-deck [data-sg-close]').evaluate((el) => { const r = el.getBoundingClientRect(); return [r.width, r.height] })
      expect.ok(b[0] >= 43.5 && b[1] >= 43.5, `Close is 44px (${b})`)
      await page.locator('#sh-deck [data-sg-close]').click()
      expect.ok(!(await isOpen(page, 'sh-deck')), 'click on Close closes')
    },
  },
  {
    name: 'Tab never leaves a modal sheet',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-deck"]').focus()
      await page.keyboard.press('Enter')
      for (let i = 0; i < 16; i++) {
        await page.keyboard.press('Tab')
        const w = await page.evaluate(() => { const a = document.activeElement; return a.closest('#sh-deck') ? 'sheet' : a === document.body ? 'browser-ui' : 'PAGE ' + a.tagName })
        expect.ok(w === 'sheet' || w === 'browser-ui', `Tab #${i + 1} landed on ${w}`)
      }
    },
  },
  {
    name: 'a tap on the scrim closes a modal sheet; a tap inside does not',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-deck"]').click()
      const box = await page.locator('#sh-deck .card__figure').boundingBox()
      await page.mouse.click(box.x + 20, box.y + 20)
      expect.ok(await isOpen(page, 'sh-deck'), 'inside tap keeps it open')
      await page.mouse.click(10, 10)
      expect.ok(!(await isOpen(page, 'sh-deck')), 'scrim tap closes')
      await expect.focused(page, '[data-sg-open="#sh-deck"]')
    },
  },
  {
    name: 'the handle is a real button: labelled, focusable, toggles full height with click, Enter and Space; the label never changes',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-deck"]').click()
      await page.waitForTimeout(500)
      const h = page.locator('#sh-deck .sheet__handle')
      expect.equal(await h.evaluate((e) => e.tagName), 'BUTTON', 'a native button')
      expect.equal(await h.getAttribute('aria-label'), 'Full height')
      expect.equal(await h.getAttribute('aria-pressed'), 'false')
      const half = await heightOf(page, 'sh-deck')
      expect.ok(half <= 844 * 0.62 + 2, `half height is capped at 62% (${half})`)
      await h.focus()
      await page.keyboard.press('Space')
      await page.waitForTimeout(600)
      expect.equal(await h.getAttribute('aria-pressed'), 'true', 'pressed after Space')
      expect.equal(await page.locator('#sh-deck').getAttribute('data-size'), 'full')
      expect.equal(await h.getAttribute('aria-label'), 'Full height', 'label is stable')
      const full = await heightOf(page, 'sh-deck')
      expect.ok(full > half + 100 && full <= 844 - 60, `full (${full}) is taller than half (${half}) and leaves a strip of the page`)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(600)
      expect.equal(await h.getAttribute('aria-pressed'), 'false')
      expect.equal(await heightOf(page, 'sh-deck'), half, 'back to half')
      await expect.focused(page, '#sh-deck .sheet__handle', 'focus stays on the handle')
      await h.click()
      await page.waitForTimeout(600)
      expect.equal(await h.getAttribute('aria-pressed'), 'true', 'a tap toggles too')
    },
  },
  {
    name: 'handle keys: ArrowUp sets full height, ArrowDown sets half, neither closes',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-deck"]').click()
      await page.waitForTimeout(500)
      await page.locator('#sh-deck .sheet__handle').focus()
      await page.keyboard.press('ArrowUp')
      expect.equal(await page.locator('#sh-deck').getAttribute('data-size'), 'full')
      expect.equal(await page.locator('#sh-deck .sheet__handle').getAttribute('aria-pressed'), 'true')
      await page.keyboard.press('ArrowUp')
      expect.equal(await page.locator('#sh-deck').getAttribute('data-size'), 'full', 'stays full')
      await page.keyboard.press('ArrowDown')
      expect.equal(await page.locator('#sh-deck').getAttribute('data-size'), 'half')
      await page.keyboard.press('ArrowDown')
      expect.ok(await isOpen(page, 'sh-deck'), 'ArrowDown at half does not close it')
    },
  },
  {
    name: 'the handle acts like a pill: rest 0/0, hover and keyboard focus lift and fill, pressed sinks, on is filled with a doubled frame',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-deck"]').click()
      await page.waitForTimeout(500)
      const h = page.locator('#sh-deck .sheet__handle')
      await page.mouse.move(5, 5)
      await page.waitForTimeout(400)
      const rest = await nums(h)
      expect.equal(rest.lift, 0, 'rest: --lift 0')
      expect.equal(rest.fill, 0, 'rest: --fill 0 (outline)')
      await h.hover()
      await page.waitForTimeout(400)
      const hov = await nums(h)
      expect.equal(hov.lift, 1, 'hover: raised')
      expect.equal(hov.fill, 1, 'hover: filled')
      await page.mouse.down()
      await page.waitForTimeout(300)
      const down = await nums(h)
      expect.equal(down.lift, 0, 'pressed: back onto the surface')
      expect.equal(down.fill, 1, 'pressed: fill stays')
      await page.mouse.up()
      await page.waitForTimeout(600)
      // the tap toggled it on: filled, and the frame doubles
      expect.equal(await h.getAttribute('aria-pressed'), 'true')
      await page.mouse.move(5, 5)
      await page.keyboard.press('Tab')
      await page.waitForTimeout(400)
      const on = await h.evaluate((el) => ({ fill: Number(getComputedStyle(el).getPropertyValue('--fill')), shadow: getComputedStyle(el, '::before').boxShadow }))
      expect.equal(on.fill, 1, 'on: filled')
      expect.ok(/0px 0px 0px 2px/.test(on.shadow), `on: doubled frame (${on.shadow})`)
    },
  },
  {
    name: 'the handle is drawn 48x28 but its hit area is 44px tall',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-deck"]').click()
      await page.waitForTimeout(500)
      const r = await page.evaluate(() => {
        const el = document.querySelector('#sh-deck .sheet__handle')
        const b = el.getBoundingClientRect()
        const cx = b.left + b.width / 2
        const at = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)) }
        return { w: b.width, h: b.height, up: at(cx, b.top - 5), down: at(cx, b.bottom + 9), beyond: at(cx, b.bottom + 12), above: at(cx, b.top - 8) }
      })
      expect.ok(r.h < 44 && r.w >= 44, `drawn ${r.w}x${r.h}`)
      expect.ok(r.up && r.down, 'the invisible hit area reaches 44px tall (6px above, 10px below the capsule)')
      expect.ok(!r.beyond, 'and stops there')
    },
  },
  {
    name: 'content scrolls inside the sheet, contains overscroll, and does not scroll the page',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-deck"]').click()
      await page.waitForTimeout(500)
      const info = await page.evaluate(() => {
        const b = document.querySelector('#sh-deck .card__body')
        return { over: getComputedStyle(b).overscrollBehaviorY, oy: getComputedStyle(b).overflowY, scrolls: b.scrollHeight > b.clientHeight, page: getComputedStyle(document.documentElement).overflow }
      })
      expect.equal(info.over, 'contain', 'overscroll-behavior: contain')
      expect.equal(info.oy, 'auto')
      expect.ok(info.scrolls, 'the demo content is taller than half height')
      expect.equal(info.page, 'hidden', 'page scroll locked behind a modal sheet')
      const y0 = await page.evaluate(() => scrollY)
      const box = await page.locator('#sh-deck .card__body').boundingBox()
      await page.mouse.move(box.x + 100, box.y + 100)
      await page.mouse.wheel(0, 300)
      await page.waitForTimeout(300)
      expect.ok((await page.locator('#sh-deck .card__body').evaluate((b) => b.scrollTop)) > 0, 'the wheel scrolls the body')
      expect.equal(await page.evaluate(() => scrollY), y0, 'and not the page')
    },
  },
  {
    name: 'drag: a long pull down on the handle closes it; a short pull snaps back; a pull up expands and is not also a click',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-deck"]').click()
      await page.waitForTimeout(500)
      const hb = await page.locator('#sh-deck .sheet__handle').boundingBox()
      const x = hb.x + hb.width / 2, y = hb.y + hb.height / 2
      // short pull, slowly (a fast pull counts as a flick and dismisses, which is also intended)
      await page.mouse.move(x, y); await page.mouse.down()
      for (let i = 1; i <= 4; i++) { await page.mouse.move(x, y + i * 10); await page.waitForTimeout(60) }
      const mid = await page.evaluate(() => document.getElementById('sh-deck').style.transform)
      expect.ok(/translateY\((3|4)\d/.test(mid), `follows the pointer (${mid})`)
      await page.mouse.up()
      await page.waitForTimeout(500)
      expect.ok(await isOpen(page, 'sh-deck'), 'short pull keeps it open')
      expect.equal(await page.evaluate(() => document.getElementById('sh-deck').style.transform), '', 'inline pose cleared')
      expect.equal(await page.locator('#sh-deck .sheet__handle').getAttribute('aria-pressed'), 'false', 'a drag is not a click')
      // pull up: expands, and stays expanded (the click after the drag is swallowed)
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x, y - 90, { steps: 5 }); await page.mouse.up()
      await page.waitForTimeout(700)
      expect.equal(await page.locator('#sh-deck').getAttribute('data-size'), 'full', 'upward drag expands')
      expect.equal(await page.locator('#sh-deck .sheet__handle').getAttribute('aria-pressed'), 'true', 'and stays pressed')
      // long pull: closes
      const hb2 = await page.locator('#sh-deck .sheet__handle').boundingBox()
      await page.mouse.move(hb2.x + 24, hb2.y + 14); await page.mouse.down(); await page.mouse.move(hb2.x + 24, hb2.y + 500, { steps: 8 }); await page.mouse.up()
      expect.ok(!(await isOpen(page, 'sh-deck')), 'long pull closes')
      await expect.focused(page, '[data-sg-open="#sh-deck"]')
    },
  },
  {
    name: 'the bar can be dragged too, but a press on its Close control is not a drag',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-filter"]').click()
      await page.waitForTimeout(500)
      const bar = await page.locator('#sh-filter .card__bar').boundingBox()
      await page.mouse.move(bar.x + 100, bar.y + 20); await page.mouse.down(); await page.mouse.move(bar.x + 100, bar.y + 500, { steps: 8 }); await page.mouse.up()
      expect.ok(!(await isOpen(page, 'sh-filter')), 'dragging the bar down closes')
      await page.locator('[data-sg-open="#sh-filter"]').click()
      await page.waitForTimeout(500)
      const b = await page.locator('#sh-filter .card__ctl').boundingBox()
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
      await page.mouse.down(); await page.mouse.move(b.x + b.width / 2 + 2, b.y + b.height / 2 + 2); await page.mouse.up()
      expect.ok(!(await isOpen(page, 'sh-filter')), 'closed by the click on Close')
    },
  },
  {
    name: 'form sheet: opens at full height with the handle pressed; toggles flip aria-pressed; the action closes it with a value',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-filter"]').focus()
      await page.keyboard.press('Enter')
      expect.equal(await page.locator('#sh-filter .sheet__handle').getAttribute('aria-pressed'), 'true', 'the handle says full height')
      const t = page.locator('#sh-filter fieldset button').nth(2)
      await t.focus()
      await page.keyboard.press('Enter')
      expect.equal(await t.getAttribute('aria-pressed'), 'true')
      await page.locator('#sh-filter [data-sg-close][value="apply"]').focus()
      await page.keyboard.press('Enter')
      expect.ok(!(await isOpen(page, 'sh-filter')))
      expect.equal(await page.evaluate(() => document.getElementById('sh-filter').returnValue), 'apply')
    },
  },
  {
    name: 'non-modal panel: page stays live, Esc inside closes, focus returns; Close works',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-panel"]').focus()
      await page.keyboard.press('Enter')
      expect.ok(await isOpen(page, 'sh-panel'), 'open')
      expect.ok(!(await page.evaluate(() => document.getElementById('sh-panel').matches(':modal'))), 'not modal')
      await expect.focused(page, '#sh-panel [data-sg-close]')
      expect.ok((await page.evaluate(() => getComputedStyle(document.documentElement).overflow)) !== 'hidden', 'page is not scroll-locked')
      await page.locator('#sh-poke').scrollIntoViewIfNeeded()
      await page.locator('#sh-poke').click()
      expect.equal(await page.locator('#sh-poke-out').textContent(), 'Pressed 1 time', 'background button still works')
      await page.locator('#sh-panel [data-sg-close]').focus()
      await page.keyboard.press('Escape')
      expect.ok(!(await isOpen(page, 'sh-panel')), 'Esc closed the panel')
      await expect.focused(page, '[data-sg-open="#sh-panel"]', 'focus returned to the opener')
      await page.keyboard.press('Enter')
      await page.keyboard.press('Enter')
      expect.ok(!(await isOpen(page, 'sh-panel')), 'Close control (Enter) closes')
    },
  },
  {
    name: 'a persistent panel keeps a focused page control clear of itself (WCAG 2.4.11)',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-panel"]').click()
      await page.waitForTimeout(600)
      const pad = await page.evaluate(() => ({ s: getComputedStyle(document.documentElement).scrollPaddingBottom, h: Math.round(document.getElementById('sh-panel').getBoundingClientRect().height), v: document.documentElement.style.getPropertyValue('--sg-sheet-block') }))
      expect.ok(parseFloat(pad.s) >= pad.h, `scroll-padding ${pad.s} covers the ${pad.h}px panel`)
      // Put the button just below the fold and scroll it into view the way Tab does ("nearest"): it must stop
      // above the panel, not at the bottom edge of the screen behind it.
      await page.evaluate(() => { const b = document.getElementById('sh-poke'); scrollTo(0, b.getBoundingClientRect().top + scrollY - innerHeight - 120); b.scrollIntoView({ block: 'nearest' }) })
      await page.waitForTimeout(300)
      const r = await page.evaluate(() => ({ btn: document.getElementById('sh-poke').getBoundingClientRect().bottom, panel: document.getElementById('sh-panel').getBoundingClientRect().top }))
      expect.ok(r.btn <= r.panel, `the focused button (bottom ${Math.round(r.btn)}) sits above the panel (top ${Math.round(r.panel)})`)
      await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
      await page.locator('#sh-panel [data-sg-close]').focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(400)
      expect.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--sg-sheet-block')), '', 'and lets go when it closes')
    },
  },
  {
    name: 'non-modal: Esc pressed while focus is on the page does not close the panel; it has no scrim',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-panel"]').click()
      await page.locator('#sh-poke').focus()
      await page.keyboard.press('Escape')
      expect.ok(await isOpen(page, 'sh-panel'), 'panel persists')
    },
  },
  {
    name: 'separation: a 2px frame on three sides, no bottom edge, no shadow, no z-index, scrim behind a modal',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-deck"]').click()
      await page.waitForTimeout(500)
      const r = await page.evaluate(() => {
        const cs = getComputedStyle(document.getElementById('sh-deck'))
        const a = getComputedStyle(document.getElementById('sh-deck'), '::backdrop').backgroundColor.match(/[\d.]+/g).map(Number)
        return { top: cs.borderTopWidth, bottom: cs.borderBottomWidth, side: cs.borderLeftWidth, z: cs.zIndex, shadow: cs.boxShadow, alpha: a.length === 4 ? a[3] : 1, bottomPx: document.getElementById('sh-deck').getBoundingClientRect().bottom, vh: innerHeight, brBl: cs.borderBottomLeftRadius }
      })
      expect.equal(r.top, '2px'); expect.equal(r.side, '2px'); expect.equal(r.bottom, '0px', 'docked: no bottom frame')
      expect.equal(r.z, 'auto')
      expect.ok((r.shadow.match(/-?[\d.]+px/g) ?? []).every((v) => parseFloat(v) === 0), `no shadow (${r.shadow})`)
      expect.ok(r.alpha >= 0.55, `scrim alpha ${r.alpha}`)
      expect.equal(Math.round(r.bottomPx), r.vh, 'docked to the bottom edge')
      expect.equal(r.brBl, '0px', 'the docked corners stay square')
    },
  },
  {
    name: 'static previews: square and soft top corners, bottom corners always straight',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      const r = await page.evaluate(() => {
        const g = (sel) => { const cs = getComputedStyle(document.querySelector(sel)); return [cs.borderTopLeftRadius, cs.borderBottomLeftRadius, cs.borderBottomWidth] }
        return { sq: g('[data-corners="square"] .sheet'), so: g('[data-corners="soft"] .sheet') }
      })
      expect.equal(r.sq[0], '0px'); expect.equal(r.so[0], '24px', 'soft reads --radius-card')
      expect.equal(r.so[1], '0px'); expect.equal(r.so[2], '0px')
    },
  },
  {
    name: 'safe areas: the sheet is inset by the side insets and the body pads the home indicator',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.addStyleTag({ content: ':root { --safe-left: 20px; --safe-right: 24px; --safe-bottom: 34px; }' })
      await page.locator('[data-sg-open="#sh-deck"]').click()
      await page.waitForTimeout(500)
      const r = await page.evaluate(() => {
        const s = document.getElementById('sh-deck').getBoundingClientRect()
        const b = document.querySelector('#sh-deck .card__body')
        return { left: s.left, right: innerWidth - s.right, pad: parseFloat(getComputedStyle(b).paddingBottom) }
      })
      expect.equal(Math.round(r.left), 20, 'left inset'); expect.equal(Math.round(r.right), 24, 'right inset')
      expect.ok(r.pad >= 34 + 12 - 1, `bottom padding clears the home indicator (${r.pad})`)
    },
  },
  {
    // Regression: the body's top padding left a blank band with a hairline between the ink bar and the first row.
    name: 'a ruled list that opens the body runs up to the bar: no blank band above the first row',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-panel"]').click()
      await page.waitForTimeout(600)
      const r = await page.evaluate(() => { const bar = document.querySelector('#sh-panel .card__bar').getBoundingClientRect(); const li = document.querySelector('#sh-panel .card__list > li').getBoundingClientRect(); return { gap: li.top - bar.bottom } })
      expect.ok(Math.abs(r.gap) <= 1, `first row starts ${r.gap}px below the bar`)
    },
  },
  {
    // Regression: the soft preview's handle was aria-pressed="true" (filled), so the two previews differed by more than the corners.
    name: 'the square and soft previews differ only by their corners: the same handle state in both',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      const pressed = await page.locator('#sh-corners .sheet__handle').evaluateAll((els) => els.map((e) => e.getAttribute('aria-pressed')))
      expect.equal(pressed.length, 2, 'two previews')
      expect.equal(pressed[0], pressed[1], 'same handle state in both previews')
    },
  },
  {
    name: 'data-side: the static pane has the side-panel look (frame on the inline-start side only, no handle) and fills the stage height',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      const r = await page.locator('[data-stage][data-side] > .sheet').evaluate((el) => {
        const cs = getComputedStyle(el), st = el.parentElement.getBoundingClientRect(), r = el.getBoundingClientRect()
        const h = el.querySelector('.sheet__handle')
        return { start: cs.borderInlineStartWidth, end: cs.borderInlineEndWidth, top: cs.borderBlockStartWidth, bottom: cs.borderBlockEndWidth, handle: h ? getComputedStyle(h).display : 'none', fills: Math.abs(r.height - (st.height - 4)) < 3 }
      })
      expect.equal(r.start, '2px', 'frame on the start side')
      expect.equal(r.end + r.top + r.bottom, '0px0px0px', 'and nowhere else')
      expect.equal(r.handle, 'none', 'no handle on a pane')
      expect.ok(r.fills, 'full height of the stage')
    },
  },
  {
    name: 'wide screen: a side panel docked to the end edge at full height, no handle, slides in from the end',
    viewport: { width: 1024, height: 700 },
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      const t0 = await page.evaluate(() => { const d = document.getElementById('sh-deck'); d.showModal(); const m = new DOMMatrix(getComputedStyle(d).transform); d.close(); return m.m41 })
      expect.ok(t0 > 100, `enters along the inline axis (${t0}px at the first frame)`)
      await page.locator('[data-sg-open="#sh-deck"]').click()
      await page.waitForTimeout(600)
      const r = await page.evaluate(() => {
        const d = document.getElementById('sh-deck'); const b = d.getBoundingClientRect()
        return { top: b.top, bottom: b.bottom, right: b.right, w: b.width, vw: innerWidth, vh: innerHeight, handle: getComputedStyle(d.querySelector('.sheet__handle')).display, side: getComputedStyle(d).getPropertyValue('--_side').trim(), bl: getComputedStyle(d).borderLeftWidth, bb: getComputedStyle(d).borderBottomWidth }
      })
      expect.ok(r.top <= 1 && Math.abs(r.bottom - r.vh) <= 1, `full height (${r.top}..${r.bottom} of ${r.vh})`)
      expect.ok(Math.abs(r.right - r.vw) <= 1, 'docked to the inline-end edge')
      expect.equal(Math.round(r.w), 416, 'the panel is 26rem wide')
      expect.equal(r.handle, 'none', 'no handle: nothing to resize')
      expect.equal(r.side, '1', 'CSS tells the script it is a panel')
      expect.equal(r.bl, '2px'); expect.equal(r.bb, '0px')
      // dragging the bar does not move or close a panel
      const bar = await page.locator('#sh-deck .card__bar').boundingBox()
      await page.mouse.move(bar.x + 100, bar.y + 20); await page.mouse.down(); await page.mouse.move(bar.x + 100, bar.y + 400, { steps: 6 }); await page.mouse.up()
      expect.ok(await isOpen(page, 'sh-deck'), 'no drag in the panel layout')
      await page.keyboard.press('Escape')
      expect.ok(!(await isOpen(page, 'sh-deck')))
    },
  },
  {
    name: 'wide screen, right-to-left: the panel docks to the left edge and enters from the left',
    viewport: { width: 1024, height: 700 },
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.evaluate(() => { document.documentElement.dir = 'rtl' })
      const t0 = await page.evaluate(() => { const d = document.getElementById('sh-deck'); d.showModal(); const m = new DOMMatrix(getComputedStyle(d).transform); d.close(); return m.m41 })
      expect.ok(t0 < -100, `enters from the left (${t0}px)`)
      await page.locator('[data-sg-open="#sh-deck"]').click()
      await page.waitForTimeout(600)
      const left = await page.evaluate(() => document.getElementById('sh-deck').getBoundingClientRect().left)
      expect.ok(Math.abs(left) <= 1, `docked to the left (${left})`)
    },
  },
  {
    name: 'reduced motion: a sheet fades in with no vertical travel; full motion slides',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      const t0 = await page.evaluate(() => { const d = document.getElementById('sh-deck'); d.showModal(); const m = new DOMMatrix(getComputedStyle(d).transform); const o = getComputedStyle(d).opacity; d.close(); return { ty: m.m42, o: Number(o) } })
      expect.equal(t0.ty, 0, 'no translation at the first frame')
      expect.ok(t0.o < 1, 'opacity is animating (a fade)')
    },
  },
  {
    name: 'the app-level data-motion="reduced" setting behaves like the OS one, and "full" overrides an OS request',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      const ty = (attr) => page.evaluate((a) => { document.documentElement.setAttribute('data-motion', a); const d = document.getElementById('sh-deck'); d.showModal(); const m = new DOMMatrix(getComputedStyle(d).transform); d.close(); return m.m42 }, attr)
      expect.equal(await ty('reduced'), 0, 'reduced: a fade')
      await page.waitForTimeout(500) // let the exit finish, or the next entry starts mid-flight
      expect.ok((await ty('full')) > 200, 'full: a slide')
    },
  },
  {
    name: 'full motion: the sheet starts below the screen',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      const ty = await page.evaluate(() => { const d = document.getElementById('sh-deck'); d.showModal(); const m = new DOMMatrix(getComputedStyle(d).transform); d.close(); return m.m42 })
      expect.ok(ty > 200, `travel at the first frame is ${ty}px`)
    },
  },
  {
    name: 'reduced motion: dragging still follows the pointer, and releasing past the threshold closes',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-deck"]').click()
      await page.waitForTimeout(500)
      const hb = await page.locator('#sh-deck .sheet__handle').boundingBox()
      await page.mouse.move(hb.x + 24, hb.y + 14); await page.mouse.down(); await page.mouse.move(hb.x + 24, hb.y + 500, { steps: 8 }); await page.mouse.up()
      expect.ok(!(await isOpen(page, 'sh-deck')), 'closed')
      await page.waitForTimeout(800)
      expect.equal(await page.evaluate(() => document.getElementById('sh-deck').style.transform), '', 'pose reset after hiding')
    },
  },
  {
    name: 'data-required: no Esc, no scrim tap, no drag; the Close control still closes it',
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.evaluate(() => document.getElementById('sh-deck').setAttribute('data-required', ''))
      await page.locator('[data-sg-open="#sh-deck"]').click()
      await page.waitForTimeout(500)
      await page.keyboard.press('Escape'); await page.keyboard.press('Escape')
      expect.ok(await isOpen(page, 'sh-deck'), 'Esc does nothing')
      await page.mouse.click(10, 10)
      expect.ok(await isOpen(page, 'sh-deck'), 'scrim tap does nothing')
      const hb = await page.locator('#sh-deck .sheet__handle').boundingBox()
      await page.mouse.move(hb.x + 24, hb.y + 14); await page.mouse.down(); await page.mouse.move(hb.x + 24, hb.y + 500, { steps: 8 }); await page.mouse.up()
      await page.waitForTimeout(400)
      expect.ok(await isOpen(page, 'sh-deck'), 'and a long drag does not dismiss it')
      await page.locator('#sh-deck [data-sg-close]').click()
      expect.ok(!(await isOpen(page, 'sh-deck')), 'Close still works')
    },
  },
  {
    name: 'short landscape screen: the sheet stays inside the viewport and scrolls',
    viewport: { width: 740, height: 360 },
    async run({ page, goto, expect }) {
      await goto('components/sheet.html')
      await page.locator('[data-sg-open="#sh-deck"]').click()
      await page.waitForTimeout(600)
      const r = await page.evaluate(() => { const d = document.getElementById('sh-deck').getBoundingClientRect(); return { top: d.top, bottom: d.bottom, w: d.width } })
      expect.ok(r.top >= 0 && r.bottom <= 360 + 1, `inside the viewport (${r.top}..${r.bottom})`)
    },
  },
]
