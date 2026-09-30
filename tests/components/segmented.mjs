// Segmented control: native radios, so the specs press real keys and read back what the
// browser says. No JavaScript from the library is involved.

export const tests = [
  {
    name: 'Tab enters the group once, on the checked option, and leaves on the next Tab',
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      await page.locator('input[name="seg-count"][value="week"]').focus()
      await expect.focused(page, 'input[name="seg-count"][value="week"]', 'focus starts on the checked radio')
      await page.keyboard.press('Tab')
      expect.ok((await page.evaluate(() => document.activeElement.getAttribute('name'))) !== 'seg-count', 'Tab leaves the radio group (one tab stop for the whole group)')
      await page.keyboard.press('Shift+Tab')
      await expect.focused(page, 'input[name="seg-count"][value="week"]', 'Shift+Tab returns to the checked radio, not the first')
    },
  },
  {
    name: 'Arrow keys move focus AND the selection, and wrap at both ends',
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      const first = 'input[name="seg-basic"][value="bank"]'
      const second = 'input[name="seg-basic"][value="transactions"]'
      await page.locator(first).focus()
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, second, 'ArrowRight moves focus to the next option')
      expect.ok(await page.locator(second).isChecked(), 'ArrowRight checks the next option')
      expect.ok(!(await page.locator(first).isChecked()), 'the previous option is unchecked')
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, first, 'ArrowRight wraps from the last to the first')
      await page.keyboard.press('ArrowLeft')
      await expect.focused(page, second, 'ArrowLeft wraps from the first to the last')
      await page.keyboard.press('ArrowUp')
      await expect.focused(page, first, 'ArrowUp behaves like ArrowLeft')
      await page.keyboard.press('ArrowDown')
      await expect.focused(page, second, 'ArrowDown behaves like ArrowRight')
    },
  },
  {
    name: 'Chosen = filled thumb + its own 2px frame; unchosen has neither; the label keeps its weight (no reflow)',
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      await page.locator('input[name="seg-count"][value="day"]').focus()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(350)
      expect.equal(await page.locator('input[name="seg-count"]:checked').count(), 1, 'one checked radio')
      const rows = await page.evaluate(() => [...document.querySelectorAll('input[name="seg-count"]')].map((i) => {
        const l = i.nextElementSibling
        const thumb = getComputedStyle(l, '::before')
        return { v: i.value, on: i.checked, w: Number(getComputedStyle(l).fontWeight), fill: Number(getComputedStyle(l).getPropertyValue('--fill')), thumb: Number(thumb.opacity), frame: parseFloat(thumb.borderTopWidth) }
      }))
      const on = rows.find((r) => r.on); const off = rows.filter((r) => !r.on)
      expect.equal(on.v, 'month', 'two presses from Day lands on Month')
      expect.equal(on.fill, 1, 'chosen: --fill 1'); expect.equal(on.thumb, 1, 'chosen: the thumb shows'); expect.equal(on.frame, 2, 'chosen: a 2px frame of its own')
      expect.ok(off.every((r) => r.w === on.w && r.fill === 0 && r.thumb === 0), 'unchosen: unfilled, no thumb; same weight so the row cannot reflow')
    },
  },
  {
    name: 'A disabled option is skipped by the arrow keys and is dashed',
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      await page.locator('input[name="seg-state-a"][value="b"]').focus()
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, 'input[name="seg-state-a"][value="a"]', 'arrow skips the disabled SMS option and wraps to Email')
      expect.ok(await page.locator('input[name="seg-state-a"][value="c"]').isDisabled(), 'SMS is disabled')
      expect.equal(await page.evaluate(() => getComputedStyle(document.querySelector('input[name="seg-state-a"][value="c"] + .segmented__label')).borderTopStyle), 'dashed', 'dashed = not here')
    },
  },
  {
    name: 'The value posts with the form, and every group has a name (legend)',
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      await page.locator('input[name="period"][value="weekly"]').focus()
      await page.keyboard.press('ArrowRight')
      expect.equal(await page.evaluate(() => new FormData(document.getElementById('seg-form')).get('period')), 'monthly', 'FormData sees the new value')
      expect.equal(await page.locator('#seg-form-value').textContent(), 'monthly', 'the page reacted to the change event')
      const unnamed = await page.evaluate(() => [...document.querySelectorAll('fieldset.segmented')].filter((f) => !f.querySelector(':scope > legend')?.textContent.trim()).length)
      expect.equal(unnamed, 0, 'every segmented fieldset has a non-empty legend')
    },
  },
  {
    name: 'Focus ring is drawn on the visible label (3px ring with a paper halo)',
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      await page.locator('input[name="seg-basic"][value="bank"]').focus()
      await page.keyboard.press('ArrowRight')
      const ring = await page.evaluate(() => {
        const cs = getComputedStyle(document.activeElement.nextElementSibling)
        return { outline: cs.outlineStyle, w: parseFloat(cs.outlineWidth), shadow: cs.boxShadow }
      })
      expect.equal(ring.outline, 'solid', 'outline on the label'); expect.ok(ring.w >= 3, 'outline is 3px')
      expect.ok(ring.shadow && ring.shadow !== 'none', 'the paper halo that keeps the ring visible on the thumb: ' + ring.shadow)
    },
  },
  {
    name: 'Hover draws an unchosen option\'s own frame; the chosen one does not change; its text colour does not move',
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      const s = (value) => page.evaluate((v) => { const l = document.querySelector(`input[name="seg-basic"][value="${v}"] + .segmented__label`); const cs = getComputedStyle(l); return { bd: cs.borderTopColor, bg: cs.backgroundColor, ink: cs.color } }, value)
      const hex = (c) => page.evaluate((x) => SG.colorToHex(x), c)
      await page.mouse.move(0, 0)
      const rest = await s('transactions')
      expect.equal(rest.bd, 'rgba(0, 0, 0, 0)', 'at rest the cell has a transparent frame')
      await page.locator('input[name="seg-basic"][value="transactions"]').hover({ force: true })
      await page.waitForTimeout(300)
      const hov = await s('transactions')
      expect.ok(hov.bd !== rest.bd, 'hover draws the frame: ' + hov.bd)
      expect.equal(await hex(hov.ink), await hex(rest.ink), 'and the text colour does not move (so its contrast cannot drop)')
      expect.equal(hov.bg, rest.bg, 'no tint on the background')
      await page.mouse.move(0, 0)
      await page.waitForTimeout(150)
      await page.locator('input[name="seg-basic"][value="bank"]').hover({ force: true })
      await page.waitForTimeout(300)
      const cur = await s('bank')
      expect.equal(await hex(cur.ink), await hex(await page.evaluate(() => getComputedStyle(document.querySelector('input[name="seg-basic"][value="bank"] + .segmented__label')).color)), 'the chosen cell is unchanged by hover')
    },
  },
  {
    name: 'Sliding thumb: sits on the chosen option, counted with :has()',
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      const read = () => page.evaluate(() => {
        const g = document.querySelector('fieldset[data-indicator="slide"]')
        const thumb = getComputedStyle(g, '::before')
        const checked = g.querySelector('input:checked + .segmented__label')
        return { i: getComputedStyle(g).getPropertyValue('--_i').trim(), n: getComputedStyle(g).getPropertyValue('--_n').trim(), thumbOpacity: Number(thumb.opacity), labelThumb: Number(getComputedStyle(checked, '::before').opacity), transform: thumb.transform }
      })
      await page.locator('input[name="seg-slide"][value="a"]').focus()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(700)
      const s = await read()
      expect.equal(s.n, '3', 'three options counted'); expect.equal(s.i, '2', 'third option is index 2')
      expect.equal(s.thumbOpacity, 1, 'the gliding thumb shows with full motion')
      expect.equal(s.labelThumb, 0, 'the option\'s own thumb is hidden while the gliding one is used')
      expect.ok(s.transform !== 'none', 'the thumb is translated by transform')
    },
  },
  {
    name: 'Reduced motion: no travel, the chosen option fades its own thumb in',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      await page.locator('input[name="seg-slide"][value="a"]').focus()
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(450)
      const s = await page.evaluate(() => {
        const g = document.querySelector('fieldset[data-indicator="slide"]')
        return { thumb: Number(getComputedStyle(g, '::before').opacity), label: Number(getComputedStyle(g.querySelector('input:checked + .segmented__label'), '::before').opacity) }
      })
      expect.equal(s.thumb, 0, 'the gliding thumb is hidden under reduced motion')
      expect.equal(s.label, 1, 'the chosen option shows its own thumb (a fade, not a jump)')
    },
  },
  {
    name: 'Each option is at least 44px in both directions, in every size',
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      const sizes = await page.evaluate(() => [...document.querySelectorAll('.segmented__opt > input')].filter((i) => !i.disabled).map((i) => { const r = i.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)] }))
      expect.ok(sizes.length > 20, 'found the demo radios')
      expect.ok(sizes.every(([w, h]) => w >= 44 && h >= 44), 'every radio hit area is at least 44x44: ' + JSON.stringify(sizes.filter(([w, h]) => w < 44 || h < 44)))
    },
  },
]
