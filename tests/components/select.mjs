// Interaction spec for Select: native keyboard behaviour, the mask chevron, the filling slot, lift on hover / focus, states.
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
const W = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(page, goto) {
  await goto('components/select.html')
  await settle(page)
}
const num = (page, sel, prop) => page.locator(sel).evaluate((e, p) => Number(getComputedStyle(e).getPropertyValue(p)), prop)
const wrap = (id) => `.select:has(#${id})`

export const tests = [
  {
    name: 'Tab focuses the select; arrow keys change the value; type-ahead jumps to an option',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('#sel-country').focus()
      await expect.focused(page, '#sel-country', 'focused')
      expect.equal(await page.locator('#sel-country').inputValue(), '', 'starts on the placeholder option')
      await page.keyboard.press('ArrowDown')
      expect.equal(await page.locator('#sel-country').inputValue(), 'Canada', 'ArrowDown picks the next option')
      await page.keyboard.press('ArrowDown')
      expect.equal(await page.locator('#sel-country').inputValue(), 'Ireland', 'and the next')
      await page.keyboard.press('ArrowUp')
      expect.equal(await page.locator('#sel-country').inputValue(), 'Canada', 'ArrowUp goes back')
      await page.keyboard.type('nor')
      expect.equal(await page.locator('#sel-country').inputValue(), 'Norway', 'type-ahead')
      await page.keyboard.press('End')
      expect.equal(await page.locator('#sel-country').inputValue(), 'Portugal', 'End picks the last option')
    },
  },
  {
    name: 'the chevron is a mask icon that ignores taps; no text glyph; the whole box is one target',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const info = await page.locator('#sel-country').evaluate((s) => {
        const icon = s.parentElement.querySelector('.ic')
        const c = getComputedStyle(icon)
        return { hasIcon: !!icon, hidden: icon.getAttribute('aria-hidden'), pe: c.pointerEvents, mask: c.maskImage || c.webkitMaskImage, cls: icon.className, text: s.parentElement.textContent.replace(/\s+/g, ' ').trim() }
      })
      expect.ok(info.hasIcon, 'icon present')
      expect.equal(info.hidden, 'true', 'decorative')
      expect.equal(info.pe, 'none', 'taps fall through to the select')
      expect.ok(/svg/.test(info.mask), 'a mask of an svg draws it')
      expect.ok(/ic--chevron-down/.test(info.cls), 'the chevron-down icon')
      expect.ok(!/[▼▾⌄∨]/.test(info.text.replace('Choose a country Canada Ireland New Zealand Norway Portugal', '')), 'no text chevron glyph')
      await page.locator('#sel-country').scrollIntoViewIfNeeded()
      const box = await page.locator('#sel-country').boundingBox()
      const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y).tagName, [box.x + box.width - 20, box.y + box.height / 2])
      expect.equal(hit, 'SELECT', 'a tap over the chevron lands on the select, not on the icon')
    },
  },
  {
    name: 'sizes are 44 and 56 tall',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const h = (s) => page.locator(s).evaluate((e) => e.getBoundingClientRect().height)
      expect.ok(Math.abs((await h(wrap('sel-md'))) - 44) < 0.6, 'default 44')
      expect.ok(Math.abs((await h(wrap('sel-lg'))) - 56) < 0.6, 'large 56')
    },
  },
  {
    name: 'a select is pressable: hover and keyboard focus raise it and fill the end slot; pressing sinks it',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const w = wrap('sel-md')
      await page.locator(w).scrollIntoViewIfNeeded()
      await W(100)
      expect.equal(await num(page, w, '--lift'), 0, 'rest: flat')
      expect.equal(await num(page, w, '--fill'), 0, 'rest: slot unfilled')
      const rest = await page.locator(w).evaluate((e) => getComputedStyle(e, '::before').backgroundColor)
      await page.locator('#sel-md').hover()
      await W(400)
      expect.equal(await num(page, w, '--lift'), 1, 'hover: raised')
      expect.equal(await num(page, w, '--fill'), 1, 'hover: slot filled')
      const hov = await page.locator(w).evaluate((e) => { const c = getComputedStyle(e); return { bg: getComputedStyle(e, '::before').backgroundColor, sh: c.boxShadow, tf: c.transform } })
      expect.ok(hov.bg !== rest, 'the slot colour changed')
      expect.ok(/ 0px /.test(hov.sh) || /0px 0px/.test(hov.sh), 'hard-edged shadow: ' + hov.sh)
      expect.ok(hov.tf !== 'none', 'and it moved: ' + hov.tf)
      await page.mouse.down()
      await W(400)
      expect.equal(await num(page, w, '--lift'), 0, 'pressed: back onto the surface')
      expect.equal(await num(page, w, '--fill'), 1, 'pressed: the fill stays')
      await page.mouse.up()
      await page.keyboard.press('Escape')
      await page.mouse.move(0, 0)
      await W(400)
      await page.keyboard.press('Tab')
      await page.locator('#sel-md').focus()
      await W(400)
      expect.equal(await num(page, w, '--lift'), 1, 'keyboard focus: same lift as hover')
      expect.equal(await num(page, w, '--fill'), 1, 'keyboard focus: slot filled')
    },
  },
  {
    name: 'the wrapper wears the ring, the select inside draws none',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.keyboard.press('Tab')
      await page.locator('#sel-md').focus()
      const r = await page.locator('#sel-md').evaluate((e) => {
        const w = e.closest('.select'); const c = getComputedStyle(w); const i = getComputedStyle(e)
        return { o: c.outlineStyle, ow: parseFloat(c.outlineWidth), s: c.boxShadow, io: i.outlineStyle }
      })
      expect.ok(r.o !== 'none' && r.ow >= 3, 'wrapper has the 3px ring')
      expect.ok(r.s !== 'none', 'and its halo')
      expect.equal(r.io, 'none', 'the select itself draws no ring')
    },
  },
  {
    name: 'placeholder option reads as a placeholder (ink-mute) until a value is chosen',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const col = () => page.locator('#sel-country').evaluate((e) => getComputedStyle(e).color)
      const before = await col()
      const ink = await page.locator('#sel-md').evaluate((e) => getComputedStyle(e).color)
      expect.ok(before !== ink, 'placeholder colour differs from a chosen value')
      await page.locator('#sel-country').focus()
      await page.keyboard.press('ArrowDown')
      expect.equal(await col(), ink, 'normal ink once chosen')
    },
  },
  {
    name: 'invalid select: aria-invalid, linked message, bad frame with an inner second frame; disabled is dashed, flat and skipped by Tab',
    async run({ page, goto, expect }) {
      await open(page, goto)
      expect.equal(await page.locator('#sel-st-1').getAttribute('aria-invalid'), 'true', 'aria-invalid')
      expect.ok((await page.locator('#sel-st-1').getAttribute('aria-describedby')).split(/\s+/).includes('sel-st-1-msg'), 'message linked')
      const f = (id) => page.locator(wrap(id)).evaluate((e) => { const c = getComputedStyle(e); return { col: c.borderTopColor, sh: c.boxShadow, st: c.borderTopStyle } })
      const ok = await f('sel-md')
      const bad = await f('sel-st-1')
      const dis = await f('sel-st-2')
      expect.ok(bad.col !== ok.col, 'bad colour')
      expect.ok(/inset/.test(bad.sh), 'and an inner second frame: ' + bad.sh)
      expect.equal(dis.st, 'dashed', 'disabled is dashed')
      expect.equal(await num(page, wrap('sel-st-2'), '--lift'), 0, 'disabled never lifts')
      await page.locator('#sel-st-1').focus()
      await page.keyboard.press('Tab')
      expect.ok(await page.evaluate(() => document.activeElement.id !== 'sel-st-2'), 'Tab skips the disabled select')
      expect.ok(await page.locator('#sel-st-2').isDisabled(), 'disabled')
    },
  },
  {
    name: 'listbox (multiple / size): no chevron, no lift, options are 44px tall',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const r = await page.locator('#sel-list').evaluate((s) => {
        const w = s.closest('.select'); const icon = w.querySelector('.ic')
        return { icon: icon ? getComputedStyle(icon).display : 'none', tf: getComputedStyle(w).transform, before: getComputedStyle(w, '::before').display, h: s.querySelector('option').getBoundingClientRect().height }
      })
      expect.equal(r.icon, 'none', 'no chevron')
      expect.equal(r.before, 'none', 'no end slot')
      expect.equal(r.tf, 'none', 'never lifts')
      expect.ok(r.h >= 43.9, 'options at least 44 tall: ' + r.h)
    },
  },
  {
    name: 'optgroups give the picker headings',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const labels = await page.locator('#sel-tz optgroup').evaluateAll((g) => g.map((x) => x.label))
      expect.equal(labels.join(','), 'Europe,Americas,Pacific', 'optgroup labels')
    },
  },
  {
    name: 'reduced motion: a raised select does not travel, the slot still fills',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('#sel-md').hover()
      await W(500)
      const r = await page.locator(wrap('sel-md')).evaluate((e) => ({ tf: getComputedStyle(e).transform, fill: Number(getComputedStyle(e).getPropertyValue('--fill')) }))
      expect.ok(r.tf === 'none' || r.tf === 'matrix(1, 0, 0, 1, 0, 0)', 'no movement: ' + r.tf)
      expect.equal(r.fill, 1, 'the fill still changes')
    },
  },
]
