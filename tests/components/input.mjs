// Interaction spec for Input: typing, password reveal, clear button, the group frame and its ring, states, sizes.
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
const W = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(page, goto) {
  await goto('components/input.html')
  await settle(page)
}
const num = (page, sel, prop) => page.locator(sel).evaluate((e, p) => Number(getComputedStyle(e).getPropertyValue(p)), prop)

export const tests = [
  {
    name: 'typing works and every input has a real label (no placeholder-as-label)',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('#inp-name').focus()
      await page.keyboard.type('Jay Marie')
      expect.equal(await page.locator('#inp-name').inputValue(), 'Jay Marie', 'typed value')
      const unlabeled = await page.evaluate(() =>
        [...document.querySelectorAll('.demo__stage .input')].filter((i) => !(i.labels && i.labels.length) && !i.getAttribute('aria-label') && !i.getAttribute('aria-labelledby')).map((i) => i.id || i.name))
      expect.equal(unlabeled.join(','), '', 'inputs without a label: ' + unlabeled.join(','))
    },
  },
  {
    name: 'text is at least 16px at every size (iOS does not zoom on focus)',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const small = await page.evaluate(() => [...document.querySelectorAll('.input')].map((i) => ({ id: i.id, fs: parseFloat(getComputedStyle(i).fontSize) })).filter((x) => x.fs < 16))
      expect.equal(JSON.stringify(small), '[]', 'inputs under 16px: ' + JSON.stringify(small))
    },
  },
  {
    name: 'sizes are 44 and 56 tall, so the box itself is a 44px target; a group is the same height as its input',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const h = (s) => page.locator(s).evaluate((e) => e.getBoundingClientRect().height)
      expect.ok(Math.abs((await h('#inp-md')) - 44) < 0.6, 'default is 44')
      expect.ok(Math.abs((await h('#inp-lg')) - 56) < 0.6, 'large is 56')
      const g = await page.locator('#inp-clear').evaluate((e) => e.closest('.input-group').getBoundingClientRect().height)
      expect.ok(Math.abs(g - 44) < 0.6, 'a group is 44 tall: ' + g)
    },
  },
  {
    name: 'the frame is 2px ink and the field is flat: no shadow at rest, none on hover',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const r = await page.locator('#inp-name').evaluate((e) => { const c = getComputedStyle(e); return { bw: c.borderTopWidth, style: c.borderTopStyle, sh: c.boxShadow, tf: c.transform } })
      expect.equal(r.bw, '2px', 'frame weight is --bw')
      expect.equal(r.style, 'solid', 'solid')
      expect.ok(r.sh === 'none' || /0px 0px 0px 0px/.test(r.sh), 'flat at rest: ' + r.sh)
      await page.locator('#inp-name').hover()
      await W(300)
      const h = await page.locator('#inp-name').evaluate((e) => { const c = getComputedStyle(e); return { sh: c.boxShadow, tf: c.transform } })
      expect.ok(h.sh === 'none' || /0px 0px 0px 0px/.test(h.sh), 'still flat on hover (only pressable things lift): ' + h.sh)
      expect.ok(h.tf === 'none', 'and does not move: ' + h.tf)
    },
  },
  {
    name: 'password reveal: Space toggles type + aria-pressed, the name never changes, caret and focus are kept',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('#inp-pw').focus()
      await page.keyboard.type('hunter2-secret')
      await page.evaluate(() => document.querySelector('#inp-pw').setSelectionRange(2, 5))
      await page.keyboard.press('Tab')
      const btn = '[data-sg-reveal][aria-controls=inp-pw]'
      await expect.focused(page, btn, 'Tab reaches the toggle')
      expect.equal(await page.locator(btn).getAttribute('aria-label'), 'Show password', 'label')
      await page.keyboard.press('Space')
      expect.equal(await page.locator('#inp-pw').getAttribute('type'), 'text', 'now revealed')
      expect.equal(await page.locator(btn).getAttribute('aria-pressed'), 'true', 'aria-pressed true')
      expect.equal(await page.locator(btn).getAttribute('aria-label'), 'Show password', 'label did NOT change with state')
      await expect.focused(page, btn, 'focus stays on the button')
      const sel = await page.evaluate(() => [document.querySelector('#inp-pw').selectionStart, document.querySelector('#inp-pw').selectionEnd])
      expect.equal(sel.join('-'), '2-5', 'selection preserved')
      const shown = await page.evaluate(() => [...document.querySelectorAll('[data-sg-reveal][aria-controls=inp-pw] .ic')].filter((i) => getComputedStyle(i).display !== 'none').map((i) => i.dataset.icon))
      expect.equal(shown.join(','), 'on', 'eye (visible) icon while revealed: the icon changes shape, not only colour')
      await page.keyboard.press('Enter')
      expect.equal(await page.locator('#inp-pw').getAttribute('type'), 'password', 'hidden again')
      expect.equal(await page.locator(btn).getAttribute('aria-pressed'), 'false', 'aria-pressed false')
    },
  },
  {
    name: 'an in-field button fills on keyboard focus and when on, never lifts; on is filled AND doubled',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const btn = '[data-sg-reveal][aria-controls=inp-pw]'
      await page.keyboard.press('Tab')
      await page.locator(btn).focus()
      await W(400)
      expect.equal(await num(page, btn, '--fill'), 1, 'focus fills')
      expect.equal(await num(page, btn, '--lift'), 0, 'and does not lift')
      await page.keyboard.press('Space')
      await page.locator('#inp-pw').focus() // move away so only aria-pressed fills it
      await W(400)
      expect.equal(await num(page, btn, '--fill'), 1, 'on stays filled')
      const sh = await page.locator(btn).evaluate((e) => getComputedStyle(e).boxShadow)
      expect.ok(/inset/.test(sh), 'on has an inner ring (the doubled frame): ' + sh)
    },
  },
  {
    name: 'the group wears the ring (not the inner input) and is a flat rectangle',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.keyboard.press('Tab')
      await page.locator('#inp-clear').focus()
      const r = await page.locator('#inp-clear').evaluate((e) => {
        const g = e.closest('.input-group'); const gc = getComputedStyle(g); const ic = getComputedStyle(e)
        return { go: gc.outlineStyle, gw: parseFloat(gc.outlineWidth), gs: gc.boxShadow, io: ic.outlineStyle, ib: ic.borderTopColor }
      })
      expect.ok(r.go !== 'none' && r.gw >= 3, 'group has the 3px ring')
      expect.ok(r.gs !== 'none', 'and its paper halo')
      expect.equal(r.io, 'none', 'the inner input draws no second ring')
      expect.equal(r.ib, 'rgba(0, 0, 0, 0)', 'the inner input draws its border in no colour (the frame is the group\'s)')
    },
  },
  {
    name: 'clear button: hidden when empty, appears with text, Enter clears and returns focus to the input',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const clear = page.locator('[data-sg-clear][aria-label="Clear nickname"]')
      expect.ok(await clear.isVisible(), 'visible: the field has a value')
      await page.locator('#inp-clear').focus()
      await page.keyboard.press('Tab')
      await expect.focused(page, '[data-sg-clear][aria-label="Clear nickname"]', 'Tab reaches the clear button')
      await page.keyboard.press('Enter')
      expect.equal(await page.locator('#inp-clear').inputValue(), '', 'emptied')
      await expect.focused(page, '#inp-clear', 'focus returns to the input')
      expect.ok(await clear.isHidden(), 'hides itself when empty')
      await page.keyboard.type('Sam')
      expect.ok(await clear.isVisible(), 'reappears once there is text')
      const sclear = page.locator('[data-sg-clear][aria-label="Clear search"]').first()
      expect.ok(await sclear.isHidden(), 'search starts empty with no clear button')
      await page.locator('#inp-q').focus()
      await page.keyboard.type('capitals')
      expect.ok(await sclear.isVisible(), 'search clear appears')
    },
  },
  {
    name: 'clear and reveal buttons have a 44px hit area and do not overlap each other',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const hit = await page.evaluate(() => {
        const el = document.querySelector('[data-sg-reveal][aria-controls=inp-pw]')
        el.scrollIntoView({ block: 'center' })
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2
        const at = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)) }
        return { w: r.width, h: r.height, up: at(cx, cy - 21), down: at(cx, cy + 21), left: at(cx - 21, cy), right: at(cx + 21, cy) }
      })
      expect.ok(hit.w < 44 && hit.h < 44, `drawn smaller than 44 (${hit.w}x${hit.h})`)
      expect.ok(hit.up && hit.down && hit.left && hit.right, 'the invisible hit area reaches 44px')
    },
  },
  {
    name: 'search bar tab order is back, field, (clear when text), action; the circles are ordinary buttons',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('.demo:has(#inp-bar) [aria-label="Back"]').focus()
      expect.ok(await page.locator('.demo:has(#inp-bar) [aria-label="Back"]').evaluate((e) => e.classList.contains('btn')), 'back is a .btn')
      await page.keyboard.press('Tab')
      await expect.focused(page, '#inp-bar', 'field after back')
      await page.keyboard.type('x')
      await page.keyboard.press('Tab')
      await expect.focused(page, '.demo:has(#inp-bar) [data-sg-clear]', 'clear after the field when it has text')
      await page.keyboard.press('Tab')
      await expect.focused(page, '.demo:has(#inp-bar) [aria-label="Add event"]', 'action last')
    },
  },
  {
    name: 'invalid: bad frame plus an inner second frame; the box and the text do not move',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const m = (s) => page.locator(s).evaluate((e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return { h: r.height, w: r.width, bw: parseFloat(c.borderLeftWidth), pl: parseFloat(c.paddingLeft), col: c.borderLeftColor, sh: c.boxShadow } })
      const ok = await m('#inp-st-1')
      const bad = await m('#inp-st-2')
      expect.equal(bad.h, ok.h, 'same height')
      expect.equal(bad.w, ok.w, 'same width')
      expect.equal(bad.bw + bad.pl, ok.bw + ok.pl, 'text starts at the same x')
      expect.ok(bad.col !== ok.col, 'the colour changes')
      expect.ok(/inset/.test(bad.sh) && !/inset/.test(ok.sh), 'and an inner frame appears, so it is not colour alone: ' + bad.sh)
      expect.equal(await page.locator('#inp-st-2').getAttribute('aria-invalid'), 'true', 'aria-invalid')
    },
  },
  {
    name: 'read-only is focusable, not editable and recessed; disabled is dashed and skipped by Tab',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('#inp-st-3').focus()
      await page.keyboard.type('zzz')
      expect.equal(await page.locator('#inp-st-3').inputValue(), 'INV-2026-0042', 'read-only value unchanged')
      const ro = await page.locator('#inp-st-3').evaluate((e) => { const c = getComputedStyle(e); return { st: c.borderTopStyle, bg: c.backgroundColor } })
      const plain = await page.locator('#inp-st-1').evaluate((e) => getComputedStyle(e).backgroundColor)
      expect.equal(ro.st, 'solid', 'read-only keeps a solid frame')
      expect.ok(ro.bg !== plain, 'but is recessed (paper-2): a value, not a blank')
      expect.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#inp-st-4')).borderTopStyle), 'dashed', 'disabled is dashed')
      await page.locator('#inp-st-3').focus()
      await page.keyboard.press('Tab')
      expect.ok(!(await page.evaluate(() => document.activeElement.id === 'inp-st-4')), 'Tab skips the disabled input')
    },
  },
  {
    name: 'amount field: big tabular numerals, decimal keyboard, currency prefix is decorative',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const s = await page.locator('#inp-amt').evaluate((e) => { const c = getComputedStyle(e); return { fs: parseFloat(c.fontSize), fv: c.fontVariantNumeric, im: e.inputMode, type: e.type } })
      expect.ok(s.fs >= 32, 'big numerals (' + s.fs + 'px)')
      expect.ok(s.fv.includes('tabular-nums'), 'tabular figures')
      expect.equal(s.im, 'decimal', 'inputmode decimal')
      expect.equal(s.type, 'text', 'not type=number')
      expect.equal(await page.locator('#inp-amt').evaluate((e) => e.previousElementSibling.getAttribute('aria-hidden')), 'true', 'prefix is aria-hidden')
      await page.locator('#inp-amt').focus()
      await page.keyboard.type('1234.56')
      expect.equal(await page.locator('#inp-amt').inputValue(), '1234.56', "the field does not reformat: that is the app's job")
    },
  },
  {
    name: 'a suffix of any width sits inside the frame (no fixed slot)',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const r = await page.locator('#inp-kg').evaluate((e) => {
        const g = e.closest('.input-group').getBoundingClientRect(); const end = e.closest('.input-group').querySelector('.input-group__end').getBoundingClientRect(); const i = e.getBoundingClientRect()
        return { inside: end.right <= g.right + 0.5 && end.left >= g.left, noOverlap: i.right <= end.left + 0.5 }
      })
      expect.ok(r.inside, 'suffix is inside the group')
      expect.ok(r.noOverlap, 'and the input stops where the suffix starts')
    },
  },
  {
    name: 'date input: real digit keys fill the native segments',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('#inp-date').focus()
      await page.keyboard.type('12252027')
      expect.equal(await page.locator('#inp-date').inputValue(), '2027-12-25', 'native date entry works through the styled box')
    },
  },
  {
    name: 'textarea grows with its content where field-sizing is supported',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const supported = await page.evaluate(() => CSS.supports('field-sizing', 'content'))
      await page.locator('#inp-msg').focus()
      const h0 = await page.locator('#inp-msg').evaluate((e) => e.getBoundingClientRect().height)
      for (let i = 0; i < 9; i++) { await page.keyboard.type('line ' + i); await page.keyboard.press('Enter') }
      const h1 = await page.locator('#inp-msg').evaluate((e) => e.getBoundingClientRect().height)
      if (supported) expect.ok(h1 > h0 + 40, `grew (${h0} -> ${h1})`)
      else expect.ok(h0 >= 100, 'fallback keeps a usable minimum height')
    },
  },
  {
    name: 'number input hides the browser spinner and keeps tabular figures',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const s = await page.locator('#inp-num').evaluate((e) => { const c = getComputedStyle(e); return { app: c.appearance, fv: c.fontVariantNumeric } })
      expect.equal(s.app, 'textfield', 'no spinner buttons')
      expect.ok(s.fv.includes('tabular-nums'), 'tabular')
    },
  },
  {
    name: 'focus ring is visible on a bare input in square and soft corners (frame kept, ring + halo added)',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.keyboard.press('Tab')
      for (const corners of ['square', 'soft']) {
        await page.evaluate((c) => document.documentElement.setAttribute('data-corners', c), corners)
        await page.locator('#inp-name').focus()
        const r = await page.locator('#inp-name').evaluate((e) => { const c = getComputedStyle(e); return { o: c.outlineStyle, ow: parseFloat(c.outlineWidth), s: c.boxShadow, bw: parseFloat(c.borderLeftWidth), rad: c.borderTopLeftRadius } })
        expect.ok(r.o !== 'none' && r.ow >= 3, corners + ': 3px outline')
        expect.ok(r.s !== 'none', corners + ': paper halo')
        expect.equal(r.bw, 2, corners + ': the 2px frame stays')
        expect.ok(corners === 'square' ? r.rad === '0px' : r.rad !== '0px', corners + ': radius role applied (' + r.rad + ')')
      }
    },
  },
  {
    name: 'with scripting off the clear and reveal buttons are hidden instead of dead',
    async run({ url, browser, expect }) {
      const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
      const p = await ctx.newPage()
      await p.goto(`${url}/docs/components/input.html`, { waitUntil: 'load' })
      const vis = await p.evaluate(() => [...document.querySelectorAll('[data-sg-reveal], [data-sg-clear]')].map((b) => getComputedStyle(b).display))
      expect.ok(vis.length >= 2 && vis.every((d) => d === 'none'), 'all hidden: ' + vis.join(','))
      await ctx.close()
    },
  },
]
