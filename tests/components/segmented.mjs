// Segmented control: native radios, so the specs press real keys and read back what the
// browser says. The library's only script here is the layout measure (44-segmented.js, SG.fit).

// alpha of a computed colour in any serialisation: rgba(…, a), color(srgb r g b / a), or opaque
const ALPHA = `globalThis.alpha = (c) => { const m = c.match(/\\/\\s*([\\d.]+)\\s*\\)$/) || c.match(/^rgba\\([^)]*,\\s*([\\d.]+)\\)$/); return m ? Number(m[1]) : (c === 'transparent' ? 0 : 1) };`

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
      const rows = await page.evaluate((A) => { eval(A); return [...document.querySelectorAll('input[name="seg-count"]')].map((i) => {
        const l = i.nextElementSibling; const cs = getComputedStyle(l)
        return { v: i.value, on: i.checked, w: Number(cs.fontWeight), fill: Number(cs.getPropertyValue('--fill')), thumb: alpha(cs.backgroundColor), frame: parseFloat(cs.borderTopWidth), frameA: alpha(cs.borderTopColor) }
      }) }, ALPHA)
      const on = rows.find((r) => r.on); const off = rows.filter((r) => !r.on)
      expect.equal(on.v, 'month', 'two presses from Day lands on Month')
      expect.equal(on.fill, 1, 'chosen: --fill 1'); expect.equal(on.thumb, 1, 'chosen: the thumb (the cell\'s own fill) shows'); expect.ok(on.frame === 2 && on.frameA === 1, 'chosen: a 2px frame of its own')
      expect.ok(off.every((r) => r.w === on.w && r.fill === 0 && r.thumb === 0 && r.frameA === 0), 'unchosen: unfilled, no thumb, no frame; same weight so the row cannot reflow')
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
      expect.ok(/\/ 0\)$|rgba\(0, 0, 0, 0\)/.test(rest.bd), 'at rest the cell has a transparent frame: ' + rest.bd)
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
        const bg = getComputedStyle(checked).backgroundColor
        return { i: getComputedStyle(g).getPropertyValue('--_i').trim(), n: getComputedStyle(g).getPropertyValue('--_n').trim(), thumbOpacity: Number(thumb.opacity), labelThumb: /\/ 0\)$|rgba\(0, 0, 0, 0\)/.test(bg) ? 0 : 1, transform: thumb.transform }
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
      const s = await page.evaluate((A) => {
        eval(A)
        const g = document.querySelector('fieldset[data-indicator="slide"]')
        return { thumb: Number(getComputedStyle(g, '::before').opacity), label: alpha(getComputedStyle(g.querySelector('input:checked + .segmented__label')).backgroundColor) }
      }, ALPHA)
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
  {
    name: 'Sliding thumb: pressing an unchosen option tints it and keeps its text readable (no white label on the pale track), and the text follows the glide',
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      const lab = page.locator('input[name="seg-slide"][value="b"] + .segmented__label')
      await lab.evaluate((e) => e.scrollIntoView({ block: 'center' }))
      const b = await lab.boundingBox()
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
      await page.mouse.down()
      await page.waitForTimeout(450)
      const r = await page.evaluate(() => {
        const l = document.querySelector('input[name="seg-slide"][value="b"] + .segmented__label'); const g = l.closest('.segmented')
        return { ink: SG.colorToHex(getComputedStyle(l).color), track: SG.colorToHex(getComputedStyle(g).backgroundColor), fill: Number(getComputedStyle(l).getPropertyValue('--fill')), tint: getComputedStyle(l).backgroundColor }
      })
      await page.mouse.up()
      const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
      const ratio = (a, b2) => { const x = lum(a), y = lum(b2); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
      expect.ok(ratio(r.ink, r.track) >= 7, 'while pressed the label is ' + r.ink + ' on ' + r.track + ' = ' + ratio(r.ink, r.track).toFixed(1) + ':1 (a filled label with no thumb under it was white on pale grey)')
      expect.ok(r.fill > 0.1 && r.fill < 0.2, 'the press is a light tint, not the chosen fill: ' + r.fill); expect.ok(!/\/ 0\)$|rgba\(0, 0, 0, 0\)/.test(r.tint), 'the cell shows the tint itself (the gliding thumb only covers the chosen cell): ' + r.tint)
      const d = await page.evaluate(() => { const g = document.querySelector('fieldset[data-indicator="slide"]'); return { label: getComputedStyle(g.querySelector('.segmented__label')).transitionDuration, thumb: getComputedStyle(g, '::before').transitionDuration } })
      expect.equal(d.label, d.thumb, 'the label colour changes over the same time as the thumb glides (was 200ms against 520ms, so text flipped before the thumb arrived)')
    },
  },
  {
    name: 'A 320px phone (a 288px column): two whole labels (Bank account | Transactions) stay on ONE row, and a full pill keeps its shape',
    viewport: { width: 320, height: 700 },
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      const r = await page.evaluate(() => {
        const host = document.createElement('div'); host.style.cssText = 'position:absolute;inset-inline-start:16px;inset-block-start:0;inline-size:288px'
        host.innerHTML = '<fieldset class="segmented"><legend class="sr-only">Show</legend><label class="segmented__opt"><input type="radio" name="fx-a" checked><span class="segmented__label">Bank account</span></label><label class="segmented__opt"><input type="radio" name="fx-a"><span class="segmented__label">Transactions</span></label></fieldset>'
        document.body.appendChild(host)
        const g = host.querySelector('.segmented'); const o = [...g.querySelectorAll('.segmented__opt')].map((e) => e.getBoundingClientRect()); const t = g.getBoundingClientRect()
        const out = { tops: o.map((x) => Math.round(x.top)), h: Math.round(t.height), R: parseFloat(getComputedStyle(g).borderTopLeftRadius), over: g.scrollWidth > g.clientWidth + 1 }
        host.remove(); return out
      })
      expect.equal(new Set(r.tops).size, 1, 'Bank account | Transactions share one row: ' + JSON.stringify(r)); expect.ok(!r.over, 'nothing spills')
      expect.ok(r.R * 2 >= r.h - 1, 'one row: a full pill: ' + JSON.stringify(r))
    },
  },
  {
    name: 'A shrink-wrapped control never wraps a label while there is room: Bank account | Transactions at 390px is two single-line cells',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      const r = await page.evaluate(() => {
        const g = document.querySelector('input[name="seg-basic"]').closest('.segmented')
        return { h: Math.round(g.getBoundingClientRect().height), lines: [...g.querySelectorAll('.segmented__label')].map((l) => Math.round(l.getBoundingClientRect().height)) }
      })
      expect.ok(r.lines.every((h) => h <= 40), 'both labels sit on one line (equal shares of the track are narrower than the longest label, which once made it wrap): ' + JSON.stringify(r))
    },
  },
  {
    name: 'Large text (200% on a 390px phone): the options give way to more rows, never to broken words, and the track is a rectangle with the one-row corner, not an oval',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      const r = await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
        const host = document.createElement('div'); host.style.cssText = 'position:absolute;inset-inline-start:32px;inset-block-start:0;inline-size:326px'
        host.innerHTML = '<fieldset class="segmented"><legend class="sr-only">Show</legend><label class="segmented__opt"><input type="radio" name="fx-b" checked><span class="segmented__label">Bank account</span></label><label class="segmented__opt"><input type="radio" name="fx-b"><span class="segmented__label">Transactions</span></label></fieldset>'
        document.body.appendChild(host)
        const g = host.querySelector('.segmented'); const cs = getComputedStyle(g)
        const longest = (l) => Math.max(...l.textContent.trim().split(/\s+/).map((w) => { const p = document.createElement('span'); p.textContent = w; p.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:inherit'; l.appendChild(p); const x = p.getBoundingClientRect().width; p.remove(); return x }))
        const labels = [...g.querySelectorAll('.segmented__label')].map((l) => ({ word: Math.round(longest(l)), room: Math.round(l.clientWidth) }))
        const out = { rows: new Set([...g.querySelectorAll('.segmented__opt')].map((e) => Math.round(e.getBoundingClientRect().top))).size, R: parseFloat(cs.borderTopLeftRadius), h: Math.round(g.getBoundingClientRect().height), labels, over: g.scrollWidth > g.clientWidth + 1 }
        host.remove(); document.documentElement.style.fontSize = ''; return out
      })
      expect.equal(r.rows, 2, 'the two long labels cannot share a row at 200%: ' + JSON.stringify(r))
      expect.ok(r.labels.every((l) => l.word <= l.room + 1), 'every word sits whole inside its cell: ' + JSON.stringify(r.labels))
      expect.ok(r.R * 2 < r.h - 20, 'two rows tall, so the corner (' + r.R + 'px) is not half the height (' + r.h + 'px): a rectangle, not an oval')
      expect.ok(!r.over, 'nothing spills sideways')
    },
  },
  {
    name: 'Pressing an unchosen option tints it at once (S1: the solid fill means chosen); the chosen one is not tinted',
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      const lab = page.locator('input[name="seg-basic"][value="transactions"] + .segmented__label')
      await lab.evaluate((e) => e.scrollIntoView({ block: 'center' }))
      const b = await lab.boundingBox()
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
      await page.mouse.down()
      await page.waitForTimeout(300)
      const f = await lab.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--fill')))
      expect.ok(f > 0.1 && f < 0.2, 'pressed: a light tint: ' + f)
      await page.mouse.up()
      await page.waitForTimeout(300)
      expect.equal(await lab.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--fill'))), 1, 'released: chosen, filled')
    },
  },
  {
    name: 'Large text (200% on a 390px phone): every control is one row, two rows of two (four options) or one option per line; never 2 + 1, never a label spilling its cell',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
      await page.waitForTimeout(400)
      const r = await page.evaluate(() => [...document.querySelectorAll('.docs-article .segmented')].map((g) => {
        const opts = [...g.querySelectorAll('.segmented__opt')]
        const rows = [...new Set(opts.map((o) => Math.round(o.getBoundingClientRect().top)))].map((t) => opts.filter((o) => Math.round(o.getBoundingClientRect().top) === t).length)
        const spill = [...g.querySelectorAll('.segmented__label')].filter((l) => l.scrollWidth > l.clientWidth + 1).length
        return { name: g.querySelector('input').name, fit: g.getAttribute('data-fit'), n: opts.length, rows, spill, over: g.scrollWidth > g.clientWidth + 1 }
      }))
      for (const g of r) {
        const ok = g.rows.length === 1 || g.rows.every((c) => c === 1) || (g.n === 4 && g.rows.length === 2 && g.rows.every((c) => c === 2))
        expect.ok(ok, 'one row, a stack or 2x2, never ragged: ' + JSON.stringify(g))
        expect.equal(g.spill, 0, 'no label spills its cell: ' + JSON.stringify(g)); expect.ok(!g.over, 'nothing spills the track: ' + JSON.stringify(g))
      }
      const byName = Object.fromEntries(r.map((g) => [g.name, g]))
      expect.equal(byName['seg-count'].fit, 'stack', 'Day | Week | Month cannot share a row at 200% on a phone: it stacks')
      expect.equal(byName['seg-four'].fit, 'grid', 'four options become two rows of two')
      expect.equal(byName['seg-basic'].fit, 'stack', 'Bank account | Transactions stacks')
    },
  },
  {
    name: 'At 100% text on a 390px phone every demo control is one row (the measure does not stack what fits)',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('.docs-article .segmented')].map((g) => ({ name: g.querySelector('input').name, fit: g.getAttribute('data-fit'), rows: new Set([...g.querySelectorAll('.segmented__opt')].map((o) => Math.round(o.getBoundingClientRect().top))).size })))
      expect.ok(r.every((g) => g.fit === 'row' && g.rows === 1), 'all one row: ' + JSON.stringify(r.filter((g) => g.fit !== 'row' || g.rows !== 1)))
    },
  },
  {
    name: 'The size demo: small and large controls keep their own width; only the data-block control fills the stage',
    viewport: { width: 1024, height: 800 },
    async run({ page, goto, expect }) {
      await goto('components/segmented.html')
      const r = await page.evaluate(() => { const stage = document.querySelector('#sizes + p + .demo .demo__stage'); const w = (n) => Math.round(document.querySelector('input[name="' + n + '"]').closest('.segmented').getBoundingClientRect().width); return { sm: w('seg-sm'), lg: w('seg-lg'), block: w('seg-block'), stage: Math.round(stage.clientWidth) } })
      expect.ok(r.sm < r.block / 2 && r.lg < r.block / 2, 'small and large hug their options, data-block spans the stage: ' + JSON.stringify(r))
    },
  },
]
