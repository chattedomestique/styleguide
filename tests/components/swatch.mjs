// Interaction spec for Swatch. See tests/components.mjs for the contract and tests/components/button.mjs for a model.
const SET = '#set + p + .demo .swatch-set'

const checkedOf = (page, sel = SET) => page.evaluate((s) => [...document.querySelectorAll(s + ' input')].filter((i) => i.checked).map((i) => i.value), sel)

// Words cut across two lines: a Range over a word has client rects at more than one height once the word was broken.
// (Self-contained, because Playwright serialises it into the page.)
const brokenWords = (selector) => {
  const out = []
  for (const root of document.querySelectorAll(selector)) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let n; (n = walker.nextNode()); ) {
      const re = /\S+/g
      for (let m; (m = re.exec(n.data)); ) {
        const r = document.createRange()
        r.setStart(n, m.index)
        r.setEnd(n, m.index + m[0].length)
        if (new Set([...r.getClientRects()].map((q) => Math.round(q.top))).size > 1) out.push(m[0])
      }
    }
  }
  return out
}

export const tests = [
  {
    name: 'Tab enters the group on the chosen swatch; arrows move AND choose, wrapping; the next Tab leaves',
    async run({ page, goto, expect }) {
      await goto('components/swatch.html')
      await page.evaluate(() => { const p = document.querySelector('#set + p'); p.setAttribute('tabindex', '-1'); p.focus() })
      await page.keyboard.press('Tab')
      await expect.focused(page, `${SET} input[value="sky"]`, 'Tab lands on the chosen swatch')
      await page.keyboard.press('ArrowRight')
      expect.equal((await checkedOf(page)).join(), 'blush', 'ArrowRight chooses the next')
      await page.keyboard.press('ArrowDown')
      expect.equal((await checkedOf(page)).join(), 'sage', 'ArrowDown chooses the next (native radio group)')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      expect.equal((await checkedOf(page)).join(), 'charcoal', 'Left from the first wraps to the last')
      await page.keyboard.press('ArrowRight')
      expect.equal((await checkedOf(page)).join(), 'sky', 'Right from the last wraps to the first')
      await page.keyboard.press('Tab')
      const inSet = await page.evaluate((s) => !!document.activeElement.closest(s), SET)
      expect.ok(!inSet, 'the next Tab leaves the group: it is one tab stop')
    },
  },
  {
    name: 'every swatch is named by its visible word, and the group by its legend',
    async run({ page, goto, expect }) {
      await goto('components/swatch.html')
      const r = await page.evaluate((s) => {
        const set = document.querySelector(s)
        const out = [...set.querySelectorAll('input')].map((i) => ({ name: i.labels[0].querySelector('.swatch-set__name').textContent.trim(), labelText: i.labels[0].textContent.trim() }))
        return { legend: set.querySelector('legend').textContent.trim(), tag: set.tagName, out }
      }, SET)
      expect.equal(r.tag, 'FIELDSET', 'a native fieldset')
      expect.equal(r.legend, 'Backdrop', 'the legend names the choice')
      expect.equal(r.out.length, 12, 'twelve swatches')
      expect.ok(r.out.every((o) => o.name.length > 0 && o.labelText === o.name), 'each label is exactly its visible name')
    },
  },
  {
    name: 'the chosen swatch has three cues that are not colour: a check, a second ring, an underlined name',
    async run({ page, goto, expect }) {
      await goto('components/swatch.html')
      const cues = () => page.evaluate((s) => {
        const pick = (v) => {
          const opt = document.querySelector(s + ' input[value="' + v + '"]').closest('label')
          const chip = opt.querySelector('.swatch-set__chip')
          return { check: getComputedStyle(chip.querySelector('.ic')).visibility, ring: getComputedStyle(chip, '::after').display, line: getComputedStyle(opt.querySelector('.swatch-set__name')).textDecorationLine }
        }
        return { sky: pick('sky'), blush: pick('blush') }
      }, SET)
      let c = await cues()
      expect.equal(c.sky.check, 'visible', 'check on the chosen one')
      expect.equal(c.sky.ring, 'block', 'second ring on the chosen one')
      expect.equal(c.sky.line, 'underline', 'underlined name on the chosen one')
      expect.equal(c.blush.check, 'hidden', 'no check on the others')
      expect.equal(c.blush.ring, 'none', 'no ring on the others')
      expect.equal(c.blush.line, 'none', 'no underline on the others')
      await page.locator(`${SET} input[value="blush"]`).check({ force: true })
      c = await cues()
      expect.equal(c.blush.check, 'visible', 'the cues move with the choice')
      expect.equal(c.sky.check, 'hidden', '... and leave the old one')
    },
  },
  {
    name: 'the check contrasts at least 4.5:1 with every swatch colour (black or white, whichever is better)',
    async run({ page, goto, expect }) {
      await goto('components/swatch.html')
      const rows = await page.evaluate(() => {
        const lum = (h) => { const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }; return 0.2126 * f(parseInt(h.slice(1, 3), 16)) + 0.7152 * f(parseInt(h.slice(3, 5), 16)) + 0.0722 * f(parseInt(h.slice(5, 7), 16)) }
        const out = []
        for (const chip of document.querySelectorAll('.swatch-set__chip')) {
          const cs = getComputedStyle(chip)
          const bg = SG.colorToHex(cs.backgroundColor), fg = SG.colorToHex(cs.color)
          const a = lum(bg), b = lum(fg)
          out.push({ bg, fg, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) })
        }
        return out
      })
      expect.ok(rows.length >= 20, 'measured many swatches')
      const worst = rows.reduce((m, r) => (r.ratio < m.ratio ? r : m))
      expect.ok(worst.ratio >= 4.5, `worst check contrast ${worst.ratio.toFixed(2)}:1 on ${worst.bg} (check ${worst.fg})`)
      // the colours that sit near the flip point must still be a hard black or white, never a mid grey
      expect.ok(rows.every((r) => r.fg === '#000000' || r.fg === '#ffffff'), 'the check is pure black or white')
    },
  },
  {
    name: 'the whole label is at least 44px, and the radio stretched over it is the hit area',
    async run({ page, goto, expect }) {
      await goto('components/swatch.html')
      const r = await page.evaluate((s) => {
        const opt = document.querySelector(s + ' input[value="sand"]').closest('label')
        const b = opt.getBoundingClientRect(), i = opt.querySelector('input').getBoundingClientRect()
        opt.scrollIntoView({ block: 'center' })
        const b2 = opt.getBoundingClientRect()
        const hit = document.elementFromPoint(b2.left + b2.width / 2, b2.top + b2.height - 4)
        return { w: b.width, h: b.height, iw: i.width, ih: i.height, hitIsInput: hit === opt.querySelector('input') }
      }, SET)
      expect.ok(r.w >= 44 && r.h >= 44, `label ${r.w}x${r.h}`)
      expect.ok(Math.abs(r.iw - r.w) < 1 && Math.abs(r.ih - r.h) < 1, 'the radio covers the label')
      expect.ok(r.hitIsInput, 'a tap on the name hits the radio')
    },
  },
  {
    name: 'the chip lifts on hover and on keyboard focus the same way, a press tints the option; the focus ring sits outside the selection ring',
    async run({ page, goto, expect }) {
      await goto('components/swatch.html')
      const opt = page.locator(`${SET} input[value="sage"]`).locator('xpath=..')
      await opt.scrollIntoViewIfNeeded()
      const lift = () => opt.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--lift')))
      const bg = () => opt.evaluate((el) => getComputedStyle(el).backgroundColor)
      await page.waitForTimeout(60)
      expect.equal(await lift(), 0, 'rest')
      const restBg = await bg()
      await opt.hover()
      await page.waitForTimeout(400)
      expect.equal(await lift(), 1, 'hover lifts')
      expect.equal(await bg(), restBg, 'hover does not tint')
      await page.mouse.down()
      await page.waitForTimeout(300)
      expect.equal(await lift(), 0, 'pressed sinks')
      const downBg = await bg()
      expect.ok(downBg !== restBg, `pressed: the option takes a tint, so a tap shows (rest ${restBg}, pressed ${downBg})`)
      await page.mouse.up()
      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab')
      await page.locator(`${SET} input[value="sage"]`).focus() // the click above chose it: it has the selection ring
      await page.waitForTimeout(400)
      const r = await page.evaluate((s) => {
        const chip = document.querySelector(s + ' input[value="sage"]').closest('label').querySelector('.swatch-set__chip')
        const cs = getComputedStyle(chip)
        return { lift: Number(getComputedStyle(chip.parentElement).getPropertyValue('--lift')), outline: cs.outlineStyle, w: parseFloat(cs.outlineWidth), offset: parseFloat(cs.outlineOffset) }
      }, SET)
      expect.equal(r.lift, 1, 'keyboard focus lifts the same way')
      expect.equal(r.outline, 'solid', 'a focus ring is drawn on the chip')
      expect.ok(r.offset >= 9, `the ring clears the 6px selection ring (offset ${r.offset}px)`)
    },
  },
  {
    name: 'a disabled swatch is skipped by the arrows and cannot be chosen',
    async run({ page, goto, expect }) {
      await goto('components/swatch.html')
      const off = page.locator('#states + p + .demo input[value="off"]')
      expect.equal(await off.isDisabled(), true, 'native disabled')
      await page.locator('#states + p + .demo input[value="on"]').focus()
      await page.keyboard.press('ArrowRight')
      const v = await page.evaluate(() => document.activeElement.value)
      expect.ok(v !== 'off', `arrow skips the unavailable swatch (focus on ${v})`)
    },
  },
  {
    name: 'reduced motion: the chip does not move when it lifts',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/swatch.html')
      const opt = page.locator('#states + p + .demo input[value="hover"]').locator('xpath=..') // .is-hover
      await opt.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      const t = await opt.locator('.swatch-set__chip').evaluate((el) => getComputedStyle(el).transform)
      expect.ok(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)', `no movement (got ${t})`)
    },
  },
  {
    name: 'forced colours: the swatch keeps its colour, the chosen one gets a 4px frame and the check a plate',
    async run({ page, goto, expect }) {
      await page.emulateMedia({ forcedColors: 'active' })
      await goto('components/swatch.html')
      const r = await page.evaluate((s) => {
        const chip = document.querySelector(s + ' input[value="sky"]').closest('label').querySelector('.swatch-set__chip')
        const other = document.querySelector(s + ' input[value="blush"]').closest('label').querySelector('.swatch-set__chip')
        const cs = getComputedStyle(chip)
        return { bg: SG.colorToHex(cs.backgroundColor), frame: parseFloat(cs.borderTopWidth), otherFrame: parseFloat(getComputedStyle(other).borderTopWidth), plate: getComputedStyle(chip, '::before').display }
      }, SET)
      expect.equal(r.bg, '#b4c8dc', 'the swatch colour is not repainted')
      expect.equal(r.frame, 4, 'chosen: 4px frame')
      expect.equal(r.otherFrame, 2, 'others: 2px frame')
      expect.ok(r.plate !== 'none', 'the check sits on a plate')
    },
  },
  {
    name: 'at 1024px no colour name is cut inside a word ("Unavailable" fits its column)',
    viewport: { width: 1024, height: 800 },
    async run({ page, goto, expect }) {
      await goto('components/swatch.html')
      const cut = await page.evaluate(brokenWords, '.swatch-set__name')
      expect.equal(cut.join(', '), '', 'words split across lines')
    },
  },
  {
    name: 'at 200% text on a phone the set is at least two to a row, and no name is cut inside a word',
    async run({ page, goto, expect }) {
      await goto('components/swatch.html')
      await page.addStyleTag({ content: 'html{font-size:200%}' })
      await page.waitForTimeout(150)
      const r = await page.evaluate(() => [...document.querySelectorAll('.swatch-set__list')].filter((l) => l.offsetParent).map((l) => {
        const tops = [...l.children].map((o) => Math.round(o.getBoundingClientRect().top))
        return { n: l.children.length, perRow: tops.filter((t) => t === tops[0]).length }
      }))
      for (const x of r) expect.ok(x.perRow >= Math.min(2, x.n), `a set of ${x.n} shows ${x.perRow} to a row`)
      const cut = await page.evaluate(brokenWords, '.swatch-set__name')
      expect.equal(cut.join(', '), '', 'words split across lines')
    },
  },
  {
    name: 'a set comes out in even rows: never five to a row, and four, six or eight colours never leave a short last row',
    async run({ page, goto, expect }) {
      await goto('components/swatch.html')
      for (const [w, text] of [[320, 100], [390, 100], [1024, 100], [390, 200], [1024, 200]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(150)
        const r = await page.evaluate(() => [...document.querySelectorAll('.swatch-set__list')].filter((l) => l.offsetParent).map((l) => {
          const rows = new Map()
          for (const o of l.children) { const k = Math.round(o.getBoundingClientRect().top); rows.set(k, (rows.get(k) || 0) + 1) }
          return { n: l.children.length, counts: [...rows.values()] }
        }))
        for (const x of r) {
          expect.ok(x.counts.every((c) => c === x.counts[0]), `${w}px ${text}%: a set of ${x.n} in rows of ${x.counts.join(' + ')}`)
          expect.ok(x.counts[0] !== 5, `${w}px ${text}%: never five to a row`)
        }
      }
    },
  },
  {
    name: 'every name sits 8px or more under what its chip paints: the focus ring around a chosen chip, the lift and its shadow (390px, 320px, 200% text)',
    async run({ page, goto, expect }) {
      await goto('components/swatch.html')
      for (const [w, text] of [[390, 100], [320, 100], [390, 200]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(200)
        const r = await page.evaluate(() => [...document.querySelector('#states ~ .demo').querySelectorAll('.swatch-set__opt')].map((o) => {
          const chip = o.querySelector('.swatch-set__chip'), cs = getComputedStyle(chip), b = chip.getBoundingClientRect()
          let below = 0
          if (cs.outlineStyle !== 'none') below = parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth)
          for (const m of cs.boxShadow.matchAll(/(-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px (-?[\d.]+)px/g)) { const [, y, , sp] = m.slice(1).map(Number); below = Math.max(below, sp + y) }
          const ring = getComputedStyle(chip, '::after')
          if (ring.display !== 'none') below = Math.max(below, -parseFloat(ring.bottom)) // the selection ring, 6px out
          const name = o.querySelector('.swatch-set__name')
          return { t: name.textContent.trim(), clear: name.getBoundingClientRect().top - (b.bottom + below) }
        }))
        expect.equal(r.length, 8, `${w}px ${text}%: eight specimens`)
        for (const x of r) expect.ok(x.clear >= 8, `${w}px ${text}%: "${x.t}" is ${x.clear.toFixed(1)}px under what its chip paints`)
      }
    },
  },
]
