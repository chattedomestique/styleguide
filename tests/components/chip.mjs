// Chips: filter toggles, native choice radios, removable input chips (focus move + announcement),
// the "more" disclosure and the scrolling row. Keys are pressed for real; --lift / --fill are read back.
const status = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r([...document.querySelectorAll('[role="status"]')].map((e) => e.textContent).join('|'))))))
const checkShown = (chip) => chip.evaluate((el) => getComputedStyle(el, '::before').display !== 'none')
const FILTERS = '[aria-label="Filter by category"]'

export const tests = [
  {
    name: 'Filter chip: Space and Enter flip aria-pressed, the label stays the same, the check follows',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      const chip = page.locator(`${FILTERS} .chip`, { hasText: 'Shopping' }).first()
      await chip.focus()
      const before = await chip.textContent()
      expect.equal(await chip.getAttribute('aria-pressed'), 'false')
      expect.ok(!(await checkShown(chip)), 'no check while off')
      await page.keyboard.press('Space')
      expect.equal(await chip.getAttribute('aria-pressed'), 'true')
      expect.ok(await checkShown(chip), 'the check appears when on (a cue that is not colour)')
      expect.equal(await chip.textContent(), before, 'label text does not change with state')
      await page.keyboard.press('Enter')
      expect.equal(await chip.getAttribute('aria-pressed'), 'false')
      expect.ok(!(await checkShown(chip)), 'check gone again')
    },
  },
  {
    name: 'Filter chip: on = filled AND the frame doubles AND a check; its leading icon gives way to the check',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      await page.mouse.move(0, 0)
      const r = await page.evaluate((sel) => [...document.querySelectorAll(sel + ' .chip')].map((c) => {
        const cs = getComputedStyle(c)
        const icon = c.querySelector('.chip__icon')
        return { on: c.getAttribute('aria-pressed') === 'true', fill: Number(cs.getPropertyValue('--fill')), shadow: cs.boxShadow, iconShown: getComputedStyle(icon).display !== 'none', check: getComputedStyle(c, '::before').display !== 'none' }
      }), FILTERS)
      const on = r.find((c) => c.on); const off = r.find((c) => !c.on)
      expect.equal(on.fill, 1, 'on: --fill 1'); expect.ok(/0px 0px 0px 2px/.test(on.shadow), 'on: a second 2px ring: ' + on.shadow); expect.ok(on.check, 'on: check'); expect.ok(!on.iconShown, 'on: leading icon hidden')
      expect.equal(off.fill, 0, 'off: --fill 0'); expect.ok(!off.check, 'off: no check'); expect.ok(off.iconShown, 'off: leading icon shown')
    },
  },
  {
    name: 'Filter chip: hover and keyboard focus raise it (--lift 1), pressing sinks it; toggling does not change its width',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      const chip = page.locator(`${FILTERS} .chip`, { hasText: 'Travel' }).first()
      const nums = () => chip.evaluate((el) => ({ lift: Number(getComputedStyle(el).getPropertyValue('--lift')), fill: Number(getComputedStyle(el).getPropertyValue('--fill')), shadow: getComputedStyle(el).boxShadow }))
      await page.waitForTimeout(50)
      expect.equal((await nums()).lift, 0, 'rest: flat')
      const w0 = await chip.evaluate((el) => el.getBoundingClientRect().width)
      await chip.hover()
      await page.waitForTimeout(400)
      const hover = await nums()
      expect.equal(hover.lift, 1, 'hover: --lift 1'); expect.equal(hover.fill, 1, 'hover: --fill 1')
      expect.ok(/4px 4px 0px 0px/.test(hover.shadow), 'hard 4px shadow, zero blur: ' + hover.shadow)
      await page.mouse.down()
      await page.waitForTimeout(400)
      const down = await nums()
      expect.equal(down.lift, 0, 'pressed: sunk'); expect.equal(down.fill, 1, 'pressed: filled')
      await page.mouse.up() // a click: it toggles the chip on
      const w1 = await chip.evaluate((el) => el.getBoundingClientRect().width)
      expect.ok(Math.abs(w1 - w0) < 1.5, `toggling does not reflow the row: ${w0} -> ${w1}`)
    },
  },
  {
    name: 'Filter chip: fires sg:chip-toggle with the new state',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      await page.evaluate(() => { window.__t = []; document.addEventListener('sg:chip-toggle', (e) => window.__t.push([e.detail.chip.textContent.trim(), e.detail.pressed])) })
      await page.locator(`${FILTERS} .chip`, { hasText: 'Travel' }).focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press('Enter')
      expect.equal(JSON.stringify(await page.evaluate(() => window.__t)), JSON.stringify([['Travel', true], ['Travel', false]]))
    },
  },
  {
    name: 'Filter chips are separate tab stops, in DOM order',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      await page.locator(`${FILTERS} .chip`).first().focus()
      await page.keyboard.press('Tab')
      expect.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Shopping', 'Tab moves to the next chip')
    },
  },
  {
    name: 'Choice chips are a native radio group: one tab stop, arrows move and choose, disabled skipped, the check follows',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      await page.locator('input[name="chip-size"][value="m"]').focus()
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, 'input[name="chip-size"][value="l"]')
      expect.ok(await page.locator('input[name="chip-size"][value="l"]').isChecked(), 'ArrowRight checks the next chip')
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, 'input[name="chip-size"][value="s"]', 'the disabled Extra large chip is skipped, focus wraps')
      expect.ok(await checkShown(page.locator('input[name="chip-size"][value="s"]').locator('xpath=..')), 'the chosen chip shows its check')
      const ring = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('input[name="chip-size"][value="s"]').closest('.chip')); return { o: cs.outlineStyle, w: parseFloat(cs.outlineWidth) } })
      expect.equal(ring.o, 'solid', 'the ring is drawn on the chip (the radio is invisible)'); expect.ok(ring.w >= 3, 'ring width')
      await page.keyboard.press('Tab')
      expect.ok((await page.evaluate(() => document.activeElement.getAttribute('name'))) !== 'chip-size', 'one tab stop for the whole group')
    },
  },
  {
    name: 'Checkbox chips toggle with Space',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      await page.locator('input[name="chip-notify"][value="sms"]').focus()
      await page.keyboard.press('Space')
      expect.ok(await page.locator('input[name="chip-notify"][value="sms"]').isChecked(), 'Space checks it')
      await page.keyboard.press('Space')
      expect.ok(!(await page.locator('input[name="chip-notify"][value="sms"]').isChecked()), 'Space unchecks it')
    },
  },
  {
    name: 'Input chip: remove buttons are named "Remove <name>"; the chip is flat (no shadow, no lift on hover)',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      const names = await page.evaluate(() => [...document.querySelectorAll('#chip-rcpt .chip__remove')].map((b) => [b.getAttribute('aria-label'), b.closest('.chip').querySelector('.chip__label').textContent.trim()]))
      expect.equal(names.length, 3)
      expect.ok(names.every(([a, l]) => a === 'Remove ' + l), 'aria-label is "Remove " + the chip text')
      await page.locator('#chip-rcpt .chip').first().hover()
      await page.waitForTimeout(350)
      const s = await page.locator('#chip-rcpt .chip').first().evaluate((el) => ({ lift: Number(getComputedStyle(el).getPropertyValue('--lift')), shadow: getComputedStyle(el).boxShadow }))
      expect.equal(s.lift, 0, 'an input chip does not lift'); expect.ok(/0px 0px 0px 0px/.test(s.shadow) || s.shadow === 'none', 'and casts no shadow: ' + s.shadow)
    },
  },
  {
    name: 'Input chip: hover on the remove button fills it',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      const b = page.locator('#chip-rcpt .chip__remove').first()
      expect.equal(await b.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--fill'))), 0)
      await b.hover()
      await page.waitForTimeout(350)
      expect.equal(await b.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--fill'))), 1)
    },
  },
  {
    name: 'Input chip: removing the MIDDLE chip with Enter focuses the next chip\'s remove button and announces it',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      await page.locator('#chip-rcpt .chip__remove[aria-label="Remove Ravi Patel"]').focus()
      await page.keyboard.press('Enter')
      expect.equal(await page.locator('#chip-rcpt .chip').count(), 2, 'one chip removed')
      await expect.focused(page, '#chip-rcpt .chip__remove[aria-label="Remove Sofia Rossi"]', 'focus moves to the NEXT chip')
      expect.ok((await status(page)).includes('Ravi Patel removed. 2 left.'), 'polite announcement: ' + (await status(page)))
    },
  },
  {
    name: 'Input chip: removing the LAST chip focuses the previous one; Delete and Backspace work',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      await page.locator('#chip-rcpt .chip__remove[aria-label="Remove Sofia Rossi"]').focus()
      await page.keyboard.press('Delete')
      await expect.focused(page, '#chip-rcpt .chip__remove[aria-label="Remove Ravi Patel"]', 'focus goes to the previous chip when there is no next')
      await page.keyboard.press('Backspace')
      await expect.focused(page, '#chip-rcpt .chip__remove[aria-label="Remove Anna Kim"]')
    },
  },
  {
    name: 'Input chip: removing the ONLY chip moves focus to data-empty-focus, never to <body>',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      for (const n of ['Anna Kim', 'Ravi Patel', 'Sofia Rossi']) {
        await page.locator(`#chip-rcpt .chip__remove[aria-label="Remove ${n}"]`).focus()
        await page.keyboard.press('Space')
      }
      expect.equal(await page.locator('#chip-rcpt .chip').count(), 0, 'all removed')
      await expect.focused(page, '#chip-add-person', 'focus lands on the named fallback')
      expect.ok((await status(page)).includes('Sofia Rossi removed. None left.'))
      await page.locator('#chip-reset').click()
      expect.equal(await page.locator('#chip-rcpt .chip').count(), 3, 'the docs reset button restores the demo')
    },
  },
  {
    name: 'Input chip: sg:chip-remove is cancelable (the app can keep the chip)',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      await page.evaluate(() => document.addEventListener('sg:chip-remove', (e) => { window.__label = e.detail.label; e.preventDefault() }))
      await page.locator('#chip-rcpt .chip__remove[aria-label="Remove Anna Kim"]').focus()
      await page.keyboard.press('Enter')
      expect.equal(await page.locator('#chip-rcpt .chip').count(), 3, 'nothing removed')
      expect.equal(await page.evaluate(() => window.__label), 'Anna Kim', 'detail carries the label')
      await expect.focused(page, '#chip-rcpt .chip__remove[aria-label="Remove Anna Kim"]', 'focus stays put')
    },
  },
  {
    name: '"More" disclosure: aria-expanded flips, the glyph changes, the named chips show, focus stays, then Tab reaches them',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      const btn = page.locator('.chip[data-kind="more"]')
      const glyph = () => btn.evaluate((el) => getComputedStyle(el, '::before').maskImage)
      await btn.focus()
      await expect.attr(page, '.chip[data-kind="more"]', 'aria-expanded', 'false')
      expect.ok(!(await page.locator('#chip-more-topics').isVisible()), 'extra chips hidden')
      const plus = await glyph()
      await page.keyboard.press('Enter')
      await expect.attr(page, '.chip[data-kind="more"]', 'aria-expanded', 'true')
      expect.ok(await page.locator('#chip-more-topics').isVisible(), 'extra chips shown')
      expect.ok((await glyph()) !== plus, 'the plus became a minus (a cue that is not a rotation)')
      await expect.focused(page, '.chip[data-kind="more"]', 'focus stays on the button')
      await page.keyboard.press('Tab')
      expect.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Numbers', 'the revealed chips follow the button in the tab order')
      await btn.focus()
      await page.keyboard.press('Space')
      expect.ok(!(await page.locator('#chip-more-topics').isVisible()), 'collapses again')
    },
  },
  {
    name: 'Scrolling row: tabbing through keeps each focused chip inside the visible line',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      const row = '[aria-label="Filter by month"]'
      await page.locator(row + ' .chip').first().focus()
      const res = []
      for (let i = 0; i < 9; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(30)
        res.push(await page.evaluate((sel) => { const l = document.querySelector(sel).getBoundingClientRect(); const c = document.activeElement.getBoundingClientRect(); return { txt: document.activeElement.textContent.trim(), inside: c.left >= l.left - 1 && c.right <= l.right + 1 } }, row))
      }
      expect.equal(res[8].txt, 'September', 'reached the last chip')
      expect.ok(res.every((r) => r.inside), 'every focused chip scrolled fully into view: ' + JSON.stringify(res.filter((r) => !r.inside)))
      expect.ok(await page.evaluate((sel) => { const e = document.querySelector(sel); return e.scrollWidth > e.clientWidth }, row), 'the row really overflows, so the next chip peeks in')
    },
  },
  {
    name: 'Chips keep a 44px hit area and the focus ring keeps both tones with the hard shadow',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      const small = await page.evaluate(() => [...document.querySelectorAll('.chip:not(:disabled):not([data-kind="input"]), .chip__remove')].filter((c) => c.getBoundingClientRect().width && c.offsetParent).map((c) => { const b = c.getBoundingClientRect(); const a = getComputedStyle(c, '::after'); return Math.max(b.height, parseFloat(a.height) || 0) }).filter((h) => h < 43.5))
      expect.equal(small.length, 0, 'every chip and every remove button is at least 44px tall including its hit area')
      await page.locator(`${FILTERS} .chip`).first().focus()
      await page.keyboard.press('Tab')
      await page.waitForTimeout(350)
      const r = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { o: cs.outlineStyle, w: parseFloat(cs.outlineWidth), s: cs.boxShadow } })
      expect.equal(r.o, 'solid'); expect.ok(r.w >= 3, 'ring 3px')
      expect.ok(/0px 0px 0px 3px/.test(r.s) && /4px 4px 0px 0px/.test(r.s), 'halo + hard shadow together: ' + r.s)
    },
  },
  {
    name: 'Reduced motion: a chip raises with no travel, the fill still changes',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      const chip = page.locator(`${FILTERS} .chip`, { hasText: 'Health' }).first()
      await chip.hover()
      await page.waitForTimeout(500)
      const r = await chip.evaluate((el) => ({ t: getComputedStyle(el).transform, fill: Number(getComputedStyle(el).getPropertyValue('--fill')) }))
      expect.ok(r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)', `no movement (got ${r.t})`)
      expect.equal(r.fill, 1, 'the fill still changes')
    },
  },
  {
    name: 'The activity filters narrow the list and announce the count (docs demo of sg:chip-toggle)',
    async run({ page, goto, expect }) {
      await goto('components/chip.html')
      await page.locator('#chip-tx .chip', { hasText: 'Transport' }).click()
      expect.equal(await page.locator('#chip-tx article:not([hidden])').count(), 1, 'only the transport row is left')
      expect.equal((await page.locator('#chip-tx-count').textContent()).trim(), '1 of 3')
      expect.ok((await status(page)).includes('1 transaction shown'))
      await page.locator('#chip-tx .chip', { hasText: 'Transport' }).click()
      expect.equal(await page.locator('#chip-tx article:not([hidden])').count(), 3, 'none on = all shown')
    },
  },
]
