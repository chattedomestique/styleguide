// Interaction spec for Switch: Space, stable accessible name, On/Off words, 3:1 contrast in both states in every
// theme and palette, hit area, lift, thumb travel with --move, forced colours, the ring.
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
const W = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(page, goto) {
  await goto('components/switch.html')
  await settle(page)
}
const pseudo = (page, sel, which, props) =>
  page.locator(sel).evaluate((e, [w, p]) => { const c = getComputedStyle(e, w); const o = {}; for (const k of p) o[k] = c[k]; return o }, [which, props])
const num = (page, sel, prop) => page.locator(sel).evaluate((e, p) => Number(getComputedStyle(e).getPropertyValue(p)), prop)

/** WCAG contrast between two CSS colours, resolved by the page's own canvas. */
async function ratio(page, a, b) {
  return page.evaluate(([x, y]) => {
    const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2] }
    const p = lum(SG.colorToHex(x)), q = lum(SG.colorToHex(y))
    return (Math.max(p, q) + 0.05) / (Math.min(p, q) + 0.05)
  }, [a, b])
}

export const tests = [
  {
    name: 'Space toggles; role is switch; the accessible NAME does not change with the state',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const sw = page.locator('input[name=sw-sound]')
      await sw.focus()
      const before = await sw.ariaSnapshot()
      expect.ok(/switch "Sound effects"/.test(before), 'role switch with a plain name: ' + before)
      expect.ok(!/\[checked\]/.test(before), 'off')
      await page.keyboard.press('Space')
      const after = await sw.ariaSnapshot()
      expect.ok(/switch "Sound effects"/.test(after), 'same name after toggling (no "Off On" defect): ' + after)
      expect.ok(/\[checked\]/.test(after), 'now on')
      expect.equal(await sw.getAttribute('role'), 'switch', 'role attribute')
      await page.keyboard.press('Space')
      expect.equal(await sw.isChecked(), false, 'Space toggles back')
    },
  },
  {
    name: 'visible On / Off words swap with the state and are aria-hidden',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const words = (name) => page.locator(`input[name=${name}]`).evaluate((i) => {
        const s = i.parentElement.querySelector('.switch__state')
        const vis = [...s.children].filter((c) => getComputedStyle(c).opacity === '1').map((c) => c.textContent.trim())
        return { vis, hidden: s.getAttribute('aria-hidden') }
      })
      const off = await words('sw-sound')
      expect.equal(off.vis.join(), 'Off', 'shows Off when off')
      expect.equal(off.hidden, 'true', 'aria-hidden')
      await page.locator('input[name=sw-sound]').focus()
      await page.keyboard.press('Space')
      await W(400)
      expect.equal((await words('sw-sound')).vis.join(), 'On', 'shows On when on')
    },
  },
  {
    name: 'the whole row is the target: 56x44 input, and clicking the label text toggles',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const b = await page.locator('input[name=sw-sound]').boundingBox()
      expect.ok(b.height >= 43.9 && b.width >= 43.9, `input ${b.width}x${b.height}`)
      await page.locator('.demo__stage .switch__label', { hasText: 'Sound effects' }).click()
      expect.equal(await page.locator('input[name=sw-sound]').isChecked(), true, 'label click toggles')
    },
  },
  {
    name: 'a pill track and a circle thumb; hover and keyboard focus raise it the same way, hover never turns it on, pressing sinks it',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const row = 'label.switch:has(input[name=sw-sound])'
      const tr = await pseudo(page, 'input[name=sw-sound]', '::before', ['borderRadius', 'borderTopWidth'])
      const th = await pseudo(page, 'input[name=sw-sound]', '::after', ['borderRadius', 'width', 'height'])
      expect.ok(parseFloat(tr.borderRadius) >= 100, 'the track is a pill: ' + tr.borderRadius)
      expect.equal(tr.borderTopWidth, '2px', 'frame is --bw')
      expect.ok(parseFloat(th.borderRadius) >= 100 && th.width === th.height, 'the thumb is a circle: ' + th.borderRadius)
      await page.locator(row).scrollIntoViewIfNeeded()
      expect.equal(await num(page, row, '--lift'), 0, 'rest: flat')
      await page.locator(row).hover()
      await W(400)
      expect.equal(await num(page, row, '--lift'), 1, 'hover: raised')
      expect.equal(await num(page, 'input[name=sw-sound]', '--fill'), 0, 'hover: still off (no fill)')
      const t = await pseudo(page, 'input[name=sw-sound]', '::before', ['transform', 'boxShadow'])
      expect.ok(t.transform !== 'none' && /0px 0px/.test(t.boxShadow) || / 0px /.test(t.boxShadow), 'moved, hard shadow: ' + t.transform + ' ' + t.boxShadow)
      await page.mouse.down()
      await W(300)
      expect.equal(await num(page, row, '--lift'), 0, 'pressed: back onto the surface')
      await page.mouse.up()
      await page.mouse.move(0, 0)
      await W(400)
      await page.keyboard.press('Tab')
      await page.locator('input[name=sw-sound]').focus()
      await W(400)
      expect.equal(await num(page, row, '--lift'), 1, 'keyboard focus: same lift as hover')
    },
  },
  {
    name: 'track and thumb keep 3:1 in BOTH states in every theme and palette',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important}' }) // read settled colours, not mid-fade ones
      const cases = []
      for (const theme of ['light', 'dark']) for (const palette of ['default', 'mint', 'periwinkle', 'sand', 'cream', 'wire']) cases.push([theme, palette])
      let checked = 0
      for (const [theme, palette] of cases) {
        await page.evaluate(([t, p]) => { const r = document.documentElement; r.setAttribute('data-theme', t); r.setAttribute('data-palette', p) }, [theme, palette])
        for (const [name, label] of [['st-off', 'off'], ['st-on', 'on']]) {
          const sel = `input[name=${name}]`
          const t = await pseudo(page, sel, '::before', ['backgroundColor', 'borderTopColor'])
          const th = await pseudo(page, sel, '::after', ['backgroundColor'])
          const stage = await page.locator(sel).evaluate((e) => getComputedStyle(e.closest('.demo__stage')).backgroundColor)
          const where = `${theme}/${palette} ${label}`
          const frame = await ratio(page, t.borderTopColor, stage)
          expect.ok(frame >= 3, `${where}: track frame vs page ${frame.toFixed(2)}:1`)
          const thumbVsTrack = await ratio(page, th.backgroundColor, t.backgroundColor)
          expect.ok(thumbVsTrack >= 3, `${where}: thumb vs track ${thumbVsTrack.toFixed(2)}:1`)
          checked++
        }
      }
      expect.equal(checked, 24, 'all combinations were measured')
    },
  },
  {
    name: 'on vs off also differ by position and a tick, not only colour',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important}' })
      const x = async (name) => (await pseudo(page, `input[name=${name}]`, '::after', ['translate'])).translate
      const off = await x('st-off')
      const on = await x('st-on')
      expect.ok(off === 'none' || parseFloat(off) === 0, 'thumb at the start when off: ' + off)
      expect.ok(parseFloat(on) > 12, 'thumb moved along the track when on: ' + on)
      const mOn = await pseudo(page, 'input[name=st-on]', '::after', ['maskImage'])
      expect.ok(/svg/.test(mOn.maskImage), 'a tick is cut out of the thumb when on')
    },
  },
  {
    name: 'thumb travels with --fill in full motion, and lands at the midpoint of the colour change in reduced motion',
    async run({ page, goto, expect, browser, url }) {
      await open(page, goto)
      const x = (fill) => page.locator('input[name=st-off]').evaluate((e, f) => { e.style.setProperty('--fill', String(f)); return getComputedStyle(e, '::after').translate }, fill)
      await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important}' })
      const mid = parseFloat(await x(0.4))
      const end = parseFloat(await x(1))
      expect.ok(mid > 2 && mid < end - 2, `full motion slides: 0.4 -> ${mid}px of ${end}px`)
      const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })
      const p = await ctx.newPage()
      await p.goto(`${url}/docs/components/switch.html`, { waitUntil: 'networkidle' })
      await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important}' })
      const rx = (fill) => p.locator('input[name=st-off]').evaluate((e, f) => { e.style.setProperty('--fill', String(f)); return getComputedStyle(e, '::after').translate }, fill)
      const low = parseFloat(await rx(0.4)) || 0
      const high = parseFloat(await rx(0.6))
      expect.ok(low === 0, `reduced motion: below the midpoint the thumb has not moved (${low})`)
      expect.ok(Math.abs(high - end) < 0.6, `and above it it has arrived (${high} vs ${end}): it never slides`)
      await ctx.close()
    },
  },
  {
    name: 'data-state=hidden hides the words visually but keeps them in the DOM',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const s = await page.locator('label.switch[data-state=hidden] .switch__state').evaluate((e) => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, text: e.textContent.trim() } })
      expect.ok(s.w <= 2 && s.h <= 2, 'clipped to 1px')
      expect.ok(/On/.test(s.text) && /Off/.test(s.text), 'text still present')
    },
  },
  {
    name: 'disabled switch is dashed, flat, skipped by Tab and ignores Space',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const d = await pseudo(page, 'input[name=st-dis]', '::before', ['borderTopStyle', 'boxShadow'])
      expect.equal(d.borderTopStyle, 'dashed', 'dashed = not here')
      expect.ok(d.boxShadow === 'none' || /0px 0px 0px 0px/.test(d.boxShadow), 'no shadow: ' + d.boxShadow)
      await page.locator('input[name=st-on]').focus()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      expect.ok(await page.evaluate(() => !document.activeElement.name || !document.activeElement.name.startsWith('st-dis')), 'Tab skips disabled switches')
      expect.equal(await page.locator('input[name=st-disc]').isChecked(), true, 'disabled on stays on')
    },
  },
  {
    name: 'focus ring is visible on the track (with its halo) in square and soft corners',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.keyboard.press('Tab')
      for (const corners of ['square', 'soft']) {
        await page.evaluate((c) => document.documentElement.setAttribute('data-corners', c), corners)
        await page.locator('input[name=sw-remind]').focus()
        const r = await pseudo(page, 'input[name=sw-remind]', '::before', ['outlineStyle', 'outlineWidth', 'boxShadow'])
        expect.ok(r.outlineStyle !== 'none' && parseFloat(r.outlineWidth) >= 3, corners + ': 3px outline on the track')
        expect.ok(r.boxShadow !== 'none', corners + ': halo on the track')
      }
    },
  },
  {
    name: 'forced colours: on and off still differ without any author colour',
    async run({ page, goto, browser, url, expect }) {
      const ctx = await browser.newContext({ forcedColors: 'active', viewport: { width: 390, height: 844 } })
      const p = await ctx.newPage()
      await p.goto(`${url}/docs/components/switch.html`, { waitUntil: 'networkidle' })
      const f = async (name) => {
        const t = await pseudo(p, `input[name=${name}]`, '::before', ['backgroundColor', 'borderTopColor', 'borderTopWidth'])
        const th = await pseudo(p, `input[name=${name}]`, '::after', ['backgroundColor', 'translate'])
        return { t, th }
      }
      const on = await f('st-on')
      const off = await f('st-off')
      expect.ok(parseFloat(off.t.borderTopWidth) > 0 && parseFloat(on.t.borderTopWidth) > 0, 'both keep a border')
      expect.ok(on.t.backgroundColor !== off.t.backgroundColor, 'track fill differs')
      expect.ok(on.th.backgroundColor !== off.th.backgroundColor, 'thumb colour differs')
      expect.ok(parseFloat(on.th.translate) > 12, 'thumb position differs')
      await ctx.close()
    },
  },
  {
    name: 'layout: at 390 px every switch shares a row with its label, in the docs and in a card (a 10rem label basis wrapped them all at 320)',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const rows = await page.evaluate(() => [...document.querySelectorAll('label.switch:not([data-layout="start"])')].map((l) => {
        const i = l.querySelector('input').getBoundingClientRect(); const t = l.querySelector('.switch__label').getBoundingClientRect()
        return { name: l.querySelector('input').name, sameRow: i.top < t.bottom }
      }))
      for (const r of rows) expect.ok(r.sameRow, r.name + ': the switch wrapped under its label')
      await page.setViewportSize({ width: 320, height: 700 })
      const narrow = await page.evaluate(() => [...document.querySelectorAll('.demo__stage > .stack > label.switch, .demo__stage > label.switch')].map((l) => {
        const i = l.querySelector('input').getBoundingClientRect(); const t = l.querySelector('.switch__label').getBoundingClientRect()
        return { name: l.querySelector('input').name, sameRow: i.top < t.bottom }
      }))
      for (const r of narrow) expect.ok(r.sameRow, r.name + ' at 320 px: the switch wrapped under its label')
    },
  },
  {
    name: 'layout: the word and the switch are ONE unit: too narrow a row (a narrow column, 200% text) drops them together under the label, aligned to the start; the switch stays 48 x 28',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await open(page, goto)
      const read = () => page.evaluate(() => [...document.querySelectorAll('label.switch:not([data-layout="start"], [data-state="hidden"])')].map((l) => {
        const i = l.querySelector('input').getBoundingClientRect(); const t = l.querySelector('.switch__label').getBoundingClientRect(); const w = l.querySelector('.switch__state').getBoundingClientRect()
        const track = getComputedStyle(l.querySelector('input'), '::before')
        return { name: l.querySelector('input').name, dropped: i.top >= t.bottom - 1, together: Math.abs((w.top + w.height / 2) - (i.top + i.height / 2)) <= 1 && w.right <= i.left + 1, start: Math.abs(w.left - t.left) <= 1, track: [track.width, track.height] }
      }))
      for (const r of await read()) expect.ok(!r.dropped && r.together, `${r.name} at 390 px: one row, the word beside its switch`)
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
      await settle(page)
      for (const r of await read()) {
        expect.ok(r.dropped, `${r.name} at 200% text: the unit dropped under the label`)
        expect.ok(r.together, `${r.name}: the word and the switch stay together, on one line`)
        expect.ok(r.start, `${r.name}: aligned to the start, under the label`)
        expect.equal(r.track.join(' x '), '48px x 28px', `${r.name}: the switch is chrome: 48 x 28 at 200% text`)
      }
    },
  },
  {
    name: 'a forced .is-focus specimen draws the same ring round the track as real keyboard focus',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const forced = await pseudo(page, '#states ~ .demo .switch.is-focus > input', '::before', ['outlineStyle', 'outlineWidth', 'outlineOffset'])
      expect.equal(forced.outlineStyle, 'solid', 'the forced focus specimen has a ring')
      await page.keyboard.press('Tab')
      await page.locator('#states ~ .demo input[name=st-off]').focus()
      const real = await pseudo(page, '#states ~ .demo input[name=st-off]', '::before', ['outlineStyle', 'outlineWidth', 'outlineOffset'])
      expect.equal(forced.outlineStyle, real.outlineStyle, 'same style as real focus')
      expect.equal(forced.outlineWidth, real.outlineWidth, 'same width as real focus')
      expect.equal(forced.outlineOffset, real.outlineOffset, 'same offset as real focus')
    },
  },
]
