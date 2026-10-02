// Interaction spec for Tooltip: WCAG 1.4.13 (dismissible, hoverable, persistent) and the APG Tooltip pattern.
// Docs page: components/tooltip.html. Contract: tests/components.mjs.
const shown = (page, id) => page.evaluate((i) => document.getElementById(i).matches(':popover-open'), id)
const anyShown = (page) => page.evaluate(() => document.querySelectorAll('.tooltip:popover-open').length)
const center = async (page, sel) => { await page.locator(sel).scrollIntoViewIfNeeded(); const b = await page.locator(sel).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2] }
const FLIP = '[aria-describedby="tip-flip"]'
const UNDO = '[aria-describedby="tip-undo"]'

export const tests = [
  {
    name: 'hover shows it after a short wait (not at once), and leaving hides it',
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      const [x, y] = await center(page, FLIP)
      await page.mouse.move(x, y)
      await page.waitForTimeout(200)
      expect.ok(!(await shown(page, 'tip-flip')), 'not yet after 200ms')
      await page.waitForTimeout(500)
      expect.ok(await shown(page, 'tip-flip'), 'shown after the delay')
      await page.mouse.move(5, 5)
      await page.waitForTimeout(400)
      expect.ok(!(await shown(page, 'tip-flip')), 'gone once the pointer has left')
    },
  },
  {
    name: 'keyboard focus shows it at once; blur hides it; the tooltip never takes focus',
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      await page.locator(FLIP).scrollIntoViewIfNeeded()
      await page.locator(FLIP).focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab') // keyboard modality, so :focus-visible applies
      await page.waitForTimeout(60)
      expect.ok(await shown(page, 'tip-flip'), 'shown on keyboard focus with no delay')
      await expect.focused(page, FLIP, 'focus stays on the control')
      await page.keyboard.press('Tab')
      await page.waitForTimeout(60)
      expect.ok(!(await shown(page, 'tip-flip')), 'hidden when focus moved on')
      expect.ok(await shown(page, 'tip-undo'), 'and the next control has its own')
    },
  },
  {
    name: 'a mouse click that focuses a button does not pop the tooltip up on focus',
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      const [x, y] = await center(page, FLIP)
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.up()
      await page.waitForTimeout(700)
      expect.ok(!(await shown(page, 'tip-flip')), 'pressing the control hides it and keeps it away until the pointer leaves')
    },
  },
  {
    name: 'Esc (dismissible): hides it without moving focus or the pointer, and it stays away until you leave and return',
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      await page.locator(FLIP).scrollIntoViewIfNeeded()
      await page.locator(FLIP).focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      await page.waitForTimeout(60)
      expect.ok(await shown(page, 'tip-flip'))
      await page.keyboard.press('Escape')
      await page.waitForTimeout(60)
      expect.ok(!(await shown(page, 'tip-flip')), 'Esc hid it')
      await expect.focused(page, FLIP, 'focus did not move')
      // moving away and back brings it back
      await page.keyboard.press('Tab')
      await page.keyboard.press('Shift+Tab')
      await page.waitForTimeout(60)
      expect.ok(await shown(page, 'tip-flip'), 'shown again after focus came back')
    },
  },
  {
    name: 'Esc hides a hovered tooltip even though focus is elsewhere; it does not reappear while the pointer stays',
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      const [x, y] = await center(page, FLIP)
      await page.mouse.move(x, y)
      await page.waitForTimeout(700)
      expect.ok(await shown(page, 'tip-flip'))
      await page.keyboard.press('Escape')
      await page.waitForTimeout(700)
      expect.ok(!(await shown(page, 'tip-flip')), 'dismissed, and the pointer has not moved')
      await page.mouse.move(5, 5)
      await page.waitForTimeout(300)
      await page.mouse.move(x, y)
      await page.waitForTimeout(700)
      expect.ok(await shown(page, 'tip-flip'), 'leaving and coming back shows it again')
    },
  },
  {
    name: 'Esc inside a dialog hides the tooltip first and does not close the dialog; the next Esc does',
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      await page.evaluate(() => {
        const d = document.createElement('dialog')
        d.className = 'dialog card'; d.id = 'dlg-t'; d.setAttribute('aria-label', 'Test')
        d.innerHTML = '<div class="card__body"><button class="btn" id="dlg-t-btn" aria-describedby="dlg-t-tip">Hint</button><div class="tooltip" id="dlg-t-tip" role="tooltip" popover="manual">Inside a dialog</div></div>'
        document.body.append(d)
        d.showModal()
      })
      await page.locator('#dlg-t-btn').focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)
      expect.ok(await shown(page, 'dlg-t-tip'), 'the tooltip shows inside the modal dialog')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(100)
      expect.ok(!(await shown(page, 'dlg-t-tip')), 'first Esc hides the tooltip')
      expect.ok(await page.evaluate(() => document.getElementById('dlg-t').open), 'and the dialog is still open')
      await page.keyboard.press('Escape')
      expect.ok(!(await page.evaluate(() => document.getElementById('dlg-t').open)), 'the second Esc closes the dialog')
    },
  },
  {
    name: 'hoverable: the pointer can travel onto the tooltip and it stays; leaving it hides it',
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      const sel = '[aria-describedby="tip-id"]'
      const [x, y] = await center(page, sel)
      await page.mouse.move(x, y)
      await page.waitForTimeout(700)
      expect.ok(await shown(page, 'tip-id'))
      const tb = await page.locator('#tip-id').boundingBox()
      await page.mouse.move(tb.x + tb.width / 2, tb.y - 2, { steps: 4 })
      await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2, { steps: 4 })
      await page.waitForTimeout(500)
      expect.ok(await shown(page, 'tip-id'), 'still there while the pointer is on the tooltip')
      await page.mouse.move(5, 5, { steps: 3 })
      await page.waitForTimeout(400)
      expect.ok(!(await shown(page, 'tip-id')), 'gone when the pointer leaves both')
    },
  },
  {
    name: 'persistent: it stays as long as the pointer rests on the control',
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      const [x, y] = await center(page, FLIP)
      await page.mouse.move(x, y)
      await page.waitForTimeout(3000)
      expect.ok(await shown(page, 'tip-flip'), 'still shown after 3s')
    },
  },
  {
    name: 'only one tooltip at a time, and the next shows at once after one has just shown (warm)',
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      const [x, y] = await center(page, FLIP)
      await page.mouse.move(x, y)
      await page.waitForTimeout(700)
      const [x2, y2] = await center(page, UNDO)
      await page.mouse.move(x2, y2, { steps: 3 })
      await page.waitForTimeout(150)
      expect.ok(await shown(page, 'tip-undo'), 'the neighbour shows without the full wait')
      expect.equal(await anyShown(page), 1, 'exactly one is visible')
    },
  },
  {
    name: 'touch: a tap does not show a tooltip (no essential information lives there)',
    touch: true,
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      await page.locator(FLIP).scrollIntoViewIfNeeded()
      await page.locator(FLIP).tap()
      await page.waitForTimeout(800)
      expect.equal(await anyShown(page), 0, 'nothing shown after a tap')
    },
  },
  {
    name: 'never the only name: every trigger has its own accessible name and is wired with aria-describedby to a role=tooltip',
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      const bad = await page.evaluate(() => {
        const out = []
        for (const el of document.querySelectorAll('[aria-describedby]')) {
          const tips = el.getAttribute('aria-describedby').split(/\s+/).map((i) => document.getElementById(i)).filter((t) => t && t.classList.contains('tooltip'))
          if (!tips.length) continue
          const name = (el.getAttribute('aria-label') || el.textContent).trim()
          if (!name) out.push('no name: ' + el.outerHTML.slice(0, 60))
          for (const t of tips) { if (t.getAttribute('role') !== 'tooltip') out.push('no role: #' + t.id); if (name === t.textContent.trim()) out.push('name equals the tooltip: #' + t.id) }
        }
        return out
      })
      expect.equal(bad.length, 0, bad.join(' | '))
    },
  },
  {
    name: 'an aria-disabled control is focusable and shows the reason on keyboard focus',
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      const sel = '[aria-describedby~="tip-archive"]'
      await page.locator(sel).scrollIntoViewIfNeeded()
      await page.locator(sel).focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)
      expect.ok(await shown(page, 'tip-archive'), 'the reason shows')
      await expect.focused(page, sel)
    },
  },
  {
    name: 'placement: top by default with an 8px gap, bottom beneath, start and end beside; centred on the control; all stay on screen',
    viewport: { width: 1024, height: 800 },
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      const measure = async (btnSel, id) => {
        const [x, y] = await center(page, btnSel)
        await page.mouse.move(5, 5)
        await page.waitForTimeout(250)
        await page.mouse.move(x, y)
        await page.waitForTimeout(800)
        const r = await page.evaluate(([s, i]) => { const b = document.querySelector(s).getBoundingClientRect(); const el = document.getElementById(i); const t = el.getBoundingClientRect(); const vw = document.documentElement.clientWidth; return { above: b.top - t.bottom, below: t.top - b.bottom, before: b.left - t.right, after: t.left - b.right, cy: (t.top + t.bottom) / 2 - (b.top + b.bottom) / 2, cx: (t.left + t.right) / 2 - (b.left + b.right) / 2, inside: t.left >= 0 && t.right <= innerWidth && t.top >= 0 && t.bottom <= innerHeight, width: t.width, roomBefore: b.left, roomAfter: vw - b.right, gutter: parseFloat(getComputedStyle(el).scrollMarginLeft) } }, [btnSel, id])
        return r
      }
      const top = await measure('[aria-describedby="tip-p-top"]', 'tip-p-top')
      expect.ok(Math.abs(top.above - 8) <= 2.5 && Math.abs(top.cx) <= 3 && top.inside, `top: ${JSON.stringify(top)}`)
      const bot = await measure('[aria-describedby="tip-p-bottom"]', 'tip-p-bottom')
      expect.ok(Math.abs(bot.below - 8) <= 2.5 && Math.abs(bot.cx) <= 3 && bot.inside, `bottom: ${JSON.stringify(bot)}`)
      // Beside, 8px from the control, on its own side when that side holds the tooltip, the gap AND the screen's gutter
      // (a tooltip never runs flush to the glass); otherwise flipped to the other side. Either way centred on the control.
      const fits = (room, r) => room >= r.width + 8 + r.gutter
      const st = await measure('[aria-describedby="tip-p-start"]', 'tip-p-start')
      expect.ok(Math.abs((fits(st.roomBefore, st) ? st.before : st.after) - 8) <= 2.5 && Math.abs(st.cy) <= 3 && st.inside, `start: ${JSON.stringify(st)}`)
      const en = await measure('[aria-describedby="tip-p-end"]', 'tip-p-end')
      expect.ok(Math.abs((fits(en.roomAfter, en) ? en.after : en.before) - 8) <= 2.5 && Math.abs(en.cy) <= 3 && en.inside, `end: ${JSON.stringify(en)}`)
    },
  },
  {
    name: 'a tooltip centred on a control at the screen edge slides along to stay fully on screen',
    viewport: { width: 320, height: 640 },
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      const [x, y] = await center(page, FLIP)
      await page.mouse.move(x, y)
      await page.waitForTimeout(800)
      const r = await page.evaluate(() => { const t = document.getElementById('tip-flip').getBoundingClientRect(); return { left: t.left, right: t.right, vw: innerWidth } })
      expect.ok(r.left >= 0 && r.right <= r.vw, `on screen (${Math.round(r.left)}..${Math.round(r.right)} of ${r.vw})`)
    },
  },
  {
    // Regression: a tooltip lined up with its trigger's start edge was given the strip to the end of the screen and shrank
    // to fit, so on a 320px phone its right edge sat at x = 320, flush with the glass, while popovers kept 16px.
    name: 'at 320 px a tooltip that is longer than the room beside its trigger keeps the screen gutter (16 px), start-aligned or flipped',
    viewport: { width: 320, height: 640 },
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      for (const id of ['tip-start', 'tip-archive', 'tip-id']) {
        const sel = `[aria-describedby^="${id}"]`
        await page.locator(sel).first().scrollIntoViewIfNeeded()
        await page.locator(sel).first().focus()
        await page.keyboard.press('Shift+Tab')
        await page.keyboard.press('Tab') // keyboard modality, so the tooltip shows
        await page.waitForTimeout(450)
        const r = await page.evaluate((i) => { const t = document.getElementById(i).getBoundingClientRect(); return { open: document.getElementById(i).matches(':popover-open'), left: t.left, right: t.right, vw: innerWidth } }, id)
        expect.ok(r.open, `${id} is shown`)
        expect.ok(r.right <= r.vw - 15.5 && r.left >= 15.5 - 2, `${id}: ${Math.round(r.left)}..${Math.round(r.right)} of ${r.vw}, expected a 16px gutter at the screen edge`)
      }
    },
  },
  {
    name: 'fallback without anchor positioning: JS places and clamps it',
    async run({ page, goto, expect }) {
      await page.addInitScript(() => { const s = CSS.supports.bind(CSS); CSS.supports = (...a) => (/position-area|anchor-name/.test(a.join(' ')) ? false : s(...a)) })
      await goto('components/tooltip.html')
      expect.equal(await page.evaluate(() => SG.anchor.native), false)
      const [x, y] = await center(page, FLIP)
      await page.mouse.move(x, y)
      await page.waitForTimeout(800)
      const r = await page.evaluate(() => { const m = document.getElementById('tip-flip'); const t = m.getBoundingClientRect(); const b = document.querySelector('[aria-describedby="tip-flip"]').getBoundingClientRect(); return { placed: m.hasAttribute('data-placed'), vis: getComputedStyle(m).visibility, left: t.left, right: t.right, vw: innerWidth, above: b.top - t.bottom } })
      expect.ok(r.placed && r.vis === 'visible', 'placed and visible')
      expect.ok(r.left >= 0 && r.right <= r.vw, 'clamped on screen')
      expect.ok(r.above > 0, 'above the control')
    },
  },
  {
    name: 'look: an inverted box (ink with paper text), 2px frame, flat (no shadow), no z-index; key caps stay legible',
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      const [x, y] = await center(page, FLIP)
      await page.mouse.move(x, y)
      await page.waitForTimeout(800)
      const r = await page.evaluate(() => {
        const t = document.getElementById('tip-flip'); const cs = getComputedStyle(t); const k = getComputedStyle(t.querySelector('kbd'))
        return { bg: cs.backgroundColor, fg: cs.color, bw: cs.borderTopWidth, shadow: cs.boxShadow, z: cs.zIndex, top: t.matches(':popover-open'), kbg: k.backgroundColor, kfg: k.color, radius: cs.borderTopLeftRadius }
      })
      expect.ok(r.bg !== r.fg, 'text differs from the box')
      expect.equal(r.bw, '2px'); expect.equal(r.shadow, 'none'); expect.equal(r.z, 'auto'); expect.equal(r.radius, '0px')
      expect.ok(r.kbg !== r.bg && r.kfg !== r.kbg, `the key cap is a light chip (${r.kbg} on ${r.bg}), text ${r.kfg}`)
    },
  },
  {
    name: 'soft corners: the tooltip reads --radius-ctl (6px)',
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      const r = await page.evaluate(() => [getComputedStyle(document.querySelector('[data-corners="square"] .tooltip')).borderTopLeftRadius, getComputedStyle(document.querySelector('[data-corners="soft"] .tooltip')).borderTopLeftRadius])
      expect.equal(r[0], '0px'); expect.equal(r[1], '6px')
    },
  },
  {
    name: 'reduced motion: a fade with no vertical travel',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/tooltip.html')
      const t0 = await page.evaluate(() => { const m = document.getElementById('tip-flip'); m.showPopover(); const t = new DOMMatrix(getComputedStyle(m).transform).m42; const o = Number(getComputedStyle(m).opacity); m.hidePopover(); return { t, o } })
      expect.equal(t0.t, 0, 'no vertical travel')
      expect.ok(t0.o < 1, 'fading in')
    },
  },
]
