// Interaction spec for Checkbox, radio and choice card: Space, arrow keys, hit area, indeterminate, lift / fill
// numbers, the ring, cards built on .card, forced colours, reduced motion, large text (chrome-capped box, inline
// groups one row or stacked). The segmented demos on this page are the Segmented element (its own spec).
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
const W = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(page, goto) {
  await goto('components/choice.html')
  await settle(page)
}
const pseudo = (page, sel, which, props) =>
  page.locator(sel).evaluate((e, [w, p]) => { const c = getComputedStyle(e, w); const o = {}; for (const k of p) o[k] = c[k]; return o }, [which, props])
const num = (page, sel, prop) => page.locator(sel).evaluate((e, p) => Number(getComputedStyle(e).getPropertyValue(p)), prop)

export const tests = [
  {
    name: 'Space toggles a checkbox; clicking the label text toggles it too',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('input[name=cb-news]').focus()
      expect.equal(await page.locator('input[name=cb-news]').isChecked(), false, 'starts off')
      await page.keyboard.press('Space')
      expect.equal(await page.locator('input[name=cb-news]').isChecked(), true, 'Space checks')
      await page.keyboard.press('Space')
      expect.equal(await page.locator('input[name=cb-news]').isChecked(), false, 'Space unchecks')
      await page.locator('.demo__stage .choice__label', { hasText: 'Remind me about my streak' }).click()
      expect.equal(await page.locator('input[name=cb-news]').isChecked(), true, 'the label is a target too')
    },
  },
  {
    name: 'radio group: one Tab stop, arrow keys move AND select, wrapping at the ends',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('input[name=rd-len][value="5"]').focus()
      await page.keyboard.press('ArrowDown')
      await expect.focused(page, 'input[name=rd-len][value="20"]', 'ArrowDown moves focus')
      expect.equal(await page.locator('input[name=rd-len][value="20"]').isChecked(), true, 'and selects')
      expect.equal(await page.locator('input[name=rd-len][value="5"]').isChecked(), false, 'the previous one is unselected')
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, 'input[name=rd-len][value=all]', 'ArrowRight also moves forward')
      await page.keyboard.press('ArrowDown')
      await expect.focused(page, 'input[name=rd-len][value="5"]', 'wraps to the first')
      await page.keyboard.press('ArrowUp')
      await expect.focused(page, 'input[name=rd-len][value=all]', 'ArrowUp wraps to the last')
      await page.keyboard.press('Tab')
      expect.ok(await page.evaluate(() => document.activeElement.name !== 'rd-len'), 'Tab leaves the radio group')
      await page.keyboard.press('Shift+Tab')
      await expect.focused(page, 'input[name=rd-len][value=all]', 'Shift+Tab returns to the checked radio')
    },
  },
  {
    name: 'hit area: the input is 44x44 and each row is at least 44 tall with 8px between rows; the drawn box is 24px',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const r = await page.locator('input[name=cb-news]').boundingBox()
      expect.ok(r.width >= 43.9 && r.height >= 43.9, `input ${r.width}x${r.height}`)
      const rows = await page.locator('input[name=rd-len]').evaluateAll((l) => l.map((i) => i.closest('label').getBoundingClientRect()))
      for (const b of rows) expect.ok(b.height >= 43.9, 'row >= 44')
      expect.ok(rows[1].top - rows[0].bottom >= 7.9, 'rows are 8px apart')
      const box = await pseudo(page, 'input[name=cb-news]', '::before', ['width', 'height', 'borderTopWidth'])
      expect.equal(box.width, '24px', 'drawn box is 24px')
      expect.equal(box.borderTopWidth, '2px', 'frame is --bw')
    },
  },
  {
    name: 'a checkbox is a square box at --radius-ctl, a radio is a circle; the mark is a mask, not a glyph',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const cb = await pseudo(page, 'input[name=cb-terms]', '::before', ['borderRadius'])
      const rd = await pseudo(page, 'input[name=rd-rep][value=w]', '::before', ['borderRadius'])
      expect.equal(cb.borderRadius, '0px', 'square corners: a rectangle holds')
      expect.ok(rd.borderRadius === '50%' || parseFloat(rd.borderRadius) >= 12, 'a radio is round: ' + rd.borderRadius)
      await page.evaluate(() => document.documentElement.setAttribute('data-corners', 'soft'))
      const soft = await pseudo(page, 'input[name=cb-terms]', '::before', ['borderRadius'])
      expect.equal(soft.borderRadius, '6px', 'soft corners round the box by the --radius-ctl role')
      const a = await pseudo(page, 'input[name=cb-terms]', '::after', ['content', 'maskImage', 'opacity'])
      expect.equal(a.content, '""', 'pseudo has no text content')
      expect.ok(/svg/.test(a.maskImage), 'a mask of an svg draws the tick')
      expect.equal(a.opacity, '1', 'visible when checked')
      const unchecked = await pseudo(page, 'input[name=rd-rep][value=d]', '::after', ['opacity'])
      expect.equal(unchecked.opacity, '0', 'an unchecked radio is NOT :indeterminate-styled (no dash)')
    },
  },
  {
    name: 'hover and keyboard focus raise a box (same lift); hover never fills it; checked fills; pressing sinks',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const row = 'label:has(input[name=cb-news])'
      await page.locator(row).scrollIntoViewIfNeeded()
      await W(100)
      expect.equal(await num(page, row, '--lift'), 0, 'rest: flat')
      await page.locator(row).hover()
      await W(400)
      expect.equal(await num(page, row, '--lift'), 1, 'hover: raised')
      expect.equal(await num(page, 'input[name=cb-news]', '--fill'), 0, 'hover: NOT filled (a hovered box must not look checked)')
      const sh = await pseudo(page, 'input[name=cb-news]', '::before', ['boxShadow'])
      expect.ok(/ 0px /.test(sh.boxShadow) || /0px 0px/.test(sh.boxShadow), 'hard-edged shadow: ' + sh.boxShadow)
      await page.mouse.down()
      await W(300)
      expect.equal(await num(page, row, '--lift'), 0, 'pressed: back onto the surface')
      await page.mouse.up() // the press was a click: now checked
      await page.mouse.move(0, 0)
      await W(400)
      expect.equal(await num(page, 'input[name=cb-news]', '--fill'), 1, 'checked: filled')
      await page.keyboard.press('Tab')
      await page.locator('input[name=cb-news]').focus()
      await W(400)
      expect.equal(await num(page, row, '--lift'), 1, 'keyboard focus: same lift as hover')
      await page.keyboard.press('Space')
      await W(400)
      expect.equal(await num(page, 'input[name=cb-news]', '--fill'), 0, 'unchecked again: outline')
    },
  },
  {
    name: 'indeterminate parent: dash when some children are checked; Space checks / unchecks all',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const parent = page.locator('[data-demo-parent]')
      expect.equal(await parent.evaluate((e) => e.indeterminate), true, 'indeterminate initially (one of three checked)')
      const a = await pseudo(page, '[data-demo-parent]', '::after', ['opacity', 'maskImage'])
      expect.equal(a.opacity, '1', 'dash is drawn')
      expect.ok(/M5 12h14/.test(decodeURIComponent(a.maskImage)), 'the minus icon mask, not the tick')
      await parent.focus()
      await page.keyboard.press('Space')
      expect.equal(await parent.isChecked(), true, 'parent checked')
      expect.equal(await page.locator('input[name^=nt-]:checked').count(), 3, 'all children checked')
      expect.equal(await parent.evaluate((e) => e.indeterminate), false, 'no longer indeterminate')
      await page.keyboard.press('Space')
      expect.equal(await page.locator('input[name^=nt-]:checked').count(), 0, 'all cleared')
      await page.locator('input[name=nt-push]').focus()
      await page.keyboard.press('Space')
      expect.equal(await parent.evaluate((e) => e.indeterminate), true, 'one child -> indeterminate again')
    },
  },
  {
    name: 'choice card is a .card: the input covers it, text clicks select, selected = doubled frame + tick, arrows move between cards',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const card = page.locator('label.choice-card', { has: page.locator('input[value=card]') })
      const other = page.locator('label.choice-card', { has: page.locator('input[value=cash]') })
      expect.ok(await card.evaluate((e) => e.classList.contains('card')), 'built on .card')
      const inputBox = await page.locator('input[value=card]').boundingBox()
      const cardBox = await card.boundingBox()
      expect.ok(inputBox.width >= cardBox.width - 1 && inputBox.height >= cardBox.height - 1, 'the input covers the card')
      const title = page.locator('.demo__stage .card__title', { hasText: 'Debit card' })
      await title.scrollIntoViewIfNeeded()
      const hb = await title.boundingBox()
      await page.mouse.click(hb.x + 10, hb.y + hb.height / 2)
      expect.equal(await page.locator('input[value=card]').isChecked(), true, 'card text selects the radio')
      await page.mouse.move(0, 0)
      await W(500)
      const sel = await card.evaluate((e) => getComputedStyle(e).boxShadow)
      const not = await other.evaluate((e) => getComputedStyle(e).boxShadow)
      expect.ok(/0px 0px 0px 2px/.test(sel), 'selected: the frame doubles (box-shadow 0 0 0 2px): ' + sel)
      expect.ok(!/0px 0px 0px 2px/.test(not), 'unselected: no doubled frame: ' + not)
      const tick = await pseudo(page, 'input[value=card]', '::after', ['opacity', 'maskImage'])
      expect.equal(tick.opacity, '1', 'tick shows on the selected card')
      expect.ok(/svg/.test(tick.maskImage), 'the tick is an svg mask')
      expect.ok(/^(50%|999px)$/.test((await pseudo(page, 'input[value=card]', '::before', ['borderRadius'])).borderRadius), 'radio cards mark with a circle (the pill radius on a square box)')
      expect.ok((await pseudo(page, 'input[value=offline]', '::before', ['borderRadius'])).borderRadius !== '50%', 'checkbox cards mark with a square')
      await page.locator('input[value=card]').focus()
      await page.keyboard.press('ArrowDown')
      await expect.focused(page, 'input[value=cash]', 'arrow moves to the next card')
      await page.keyboard.press('ArrowDown')
      await expect.focused(page, 'input[value=bank]', 'wraps')
    },
  },
  {
    name: 'choice card: keyboard focus raises the card and gives IT the ring; the input draws none',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.keyboard.press('Tab')
      const card = page.locator('label.choice-card', { has: page.locator('input[value=bank]') })
      await page.locator('input[value=bank]').focus()
      await W(400)
      const r = await card.evaluate((e) => { const c = getComputedStyle(e); return { o: c.outlineStyle, w: parseFloat(c.outlineWidth), lift: Number(c.getPropertyValue('--lift')), tf: c.transform } })
      expect.ok(r.o !== 'none' && r.w >= 3, 'the card has the 3px ring')
      expect.equal(r.lift, 1, 'and is raised')
      expect.ok(r.tf !== 'none', 'and has moved: ' + r.tf)
      expect.equal(await page.locator('input[value=bank]').evaluate((e) => getComputedStyle(e).outlineStyle), 'none', 'the input draws no ring of its own')
    },
  },
  {
    name: 'segmented demos are the Segmented element (one way to draw a pill track): native radios, one tab stop, arrows move and select',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const info = await page.evaluate(() => [...document.querySelectorAll('#segmented ~ .demo')].slice(0, 2).map((d) => ({ seg: !!d.querySelector('.segmented[role=radiogroup][aria-labelledby]'), old: !!d.querySelector('[data-variant=segmented]'), radios: d.querySelectorAll('.segmented__opt > input[type=radio]').length })))
      for (const d of info) {
        expect.ok(d.seg && !d.old, 'a .segmented radiogroup named by its visible label')
        expect.ok(d.radios >= 2, 'built on native radios')
      }
      await page.locator('input[name=sg-range][value=w]').focus()
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, 'input[name=sg-range][value=m]', 'ArrowRight moves focus')
      expect.equal(await page.locator('input[name=sg-range][value=m]').isChecked(), true, 'and selects')
    },
  },
  {
    name: 'invalid checkbox: bad frame and an inner second frame; disabled choices are dashed and skipped by Tab',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const ok = await pseudo(page, 'input[name=st-a]', '::before', ['borderTopColor', 'boxShadow'])
      const bad = await pseudo(page, 'input[name=st-c]', '::before', ['borderTopColor', 'boxShadow'])
      const dis = await pseudo(page, 'input[name=st-d]', '::before', ['borderTopStyle'])
      expect.ok(bad.borderTopColor !== ok.borderTopColor, 'bad colour')
      expect.ok(/inset/.test(bad.boxShadow) && !/inset/.test(ok.boxShadow), 'inner second frame: ' + bad.boxShadow)
      expect.equal(dis.borderTopStyle, 'dashed', 'disabled is dashed')
      expect.ok((await page.locator('input[name=st-c]').getAttribute('aria-describedby')) === 'st-c-msg', 'message linked')
      await page.locator('input[name=st-c]').focus()
      await page.keyboard.press('Tab')
      expect.ok(await page.evaluate(() => document.activeElement.name !== 'st-d'), 'Tab skips the disabled checkbox')
    },
  },
  {
    name: 'focus ring is drawn round the 24px box with a paper halo, in square and soft corners',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.keyboard.press('Tab')
      for (const corners of ['square', 'soft']) {
        await page.evaluate((c) => document.documentElement.setAttribute('data-corners', c), corners)
        await page.locator('input[name=cb-news]').focus()
        const ring = await pseudo(page, 'input[name=cb-news]', '::before', ['outlineStyle', 'outlineWidth', 'boxShadow'])
        expect.ok(ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth) >= 3, corners + ': 3px outline on the drawn box')
        expect.ok(ring.boxShadow !== 'none', corners + ': paper halo on the drawn box')
      }
    },
  },
  {
    name: 'forced colours: checked is a Highlight-filled box, unchecked is not',
    async run({ page, goto, browser, url, expect }) {
      const ctx = await browser.newContext({ forcedColors: 'active', viewport: { width: 390, height: 844 } })
      const p = await ctx.newPage()
      await p.goto(`${url}/docs/components/choice.html`, { waitUntil: 'networkidle' })
      const get = (sel) => p.locator(sel).evaluate((e) => getComputedStyle(e, '::before').backgroundColor)
      const hl = await p.evaluate(() => { const d = document.createElement('div'); d.style.backgroundColor = 'Highlight'; document.body.append(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c })
      const on = await get('input[name=cb-terms]')
      const off = await get('input[name=cb-news]')
      expect.equal(on, hl, 'checked box uses the Highlight system colour')
      expect.ok(off !== hl, 'unchecked box does not')
      const w = await p.locator('label.choice-card', { has: p.locator('input[value=bank]') }).evaluate((e) => getComputedStyle(e).borderTopWidth)
      expect.equal(w, '4px', 'a selected card gets the heavy frame')
      await ctx.close()
    },
  },
  {
    name: 'reduced motion: the box does not travel when raised, the mark still fades (not instant)',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('label:has(input[name=cb-news])').hover()
      await W(500)
      const t = await pseudo(page, 'input[name=cb-news]', '::before', ['transform'])
      expect.ok(t.transform === 'none' || t.transform === 'matrix(1, 0, 0, 1, 0, 0)', 'no travel: ' + t.transform)
      const m = await pseudo(page, 'input[name=cb-news]', '::after', ['transitionDuration'])
      expect.ok(!/^0s/.test(m.transitionDuration), 'fade is not instant: ' + m.transitionDuration)
    },
  },
  {
    name: 'nested groups indent their children under the parent label, at 100% and at 200% text',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const measure = () => page.evaluate(() => {
        const tree = document.querySelector('[data-demo-tree]'); const parent = tree.querySelector('[data-demo-parent]').closest('.choice'); const child = tree.querySelector('input[name=nt-mail]')
        const lab = parent.querySelector('.choice__label').getBoundingClientRect()
        const box = child.getBoundingClientRect()
        return { indent: box.left + 10 - parent.querySelector('input').getBoundingClientRect().left, labelOffset: lab.left - parent.querySelector('input').getBoundingClientRect().left, inline: !!tree.querySelector('[style]') }
      })
      const nest = await measure()
      expect.ok(!nest.inline, 'no inline style in the demo: the indent is CSS')
      expect.ok(Math.abs(nest.indent - nest.labelOffset) <= 6, 'child box sits under the parent label text: ' + nest.indent + ' vs ' + nest.labelOffset)
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
      await settle(page)
      const big = await measure()
      expect.ok(Math.abs(big.indent - big.labelOffset) <= 6, 'at 200% text too: ' + big.indent + ' vs ' + big.labelOffset)
    },
  },
  {
    name: 'large text (200% at 390 px): the box, its column and the target stay 24 / 44px and the box stays centred on the first line of its label',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
      await settle(page)
      const r = await page.evaluate(() => [...document.querySelectorAll('#checkbox ~ .demo .choice, #radio ~ .demo .choice')].slice(0, 6).map((l) => {
        const i = l.querySelector('input'); const box = getComputedStyle(i, '::before'); const ib = i.getBoundingClientRect()
        const lab = l.querySelector('.choice__label'); const rg = document.createRange(); rg.selectNodeContents(lab.firstChild)
        const first = rg.getClientRects()[0]
        return { name: i.name, box: parseFloat(box.width), w: ib.width, mid: ib.top + ib.height / 2, line: first.top + first.height / 2 }
      }))
      for (const c of r) {
        expect.ok(Math.abs(c.box - 24) < 0.5, c.name + ': the drawn box is 24px at 200% text (' + c.box + ')')
        expect.ok(c.w >= 43.9 && c.w <= 44.1, c.name + ': the target column is 44px (' + c.w + ')')
        expect.ok(Math.abs(c.mid - c.line) <= 3, c.name + ': the box is centred on the first line of the label (' + Math.round(c.mid) + ' vs ' + Math.round(c.line) + ')')
      }
    },
  },
  {
    name: 'inline group: one row while every option fits, else one option per row (never two and a lonely third)',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await open(page, goto)
      const rows = () => page.evaluate(() => {
        const g = document.querySelector('#inline ~ .demo .choice-group[data-layout=inline]')
        const tops = [...g.children].map((c) => Math.round(c.getBoundingClientRect().top))
        return { fit: g.dataset.fit, rows: new Set(tops).size, n: tops.length, overflow: g.scrollWidth > g.clientWidth + 1 }
      })
      const wide = await rows()
      expect.equal(wide.fit, 'row', 'measured: the row fits at 390 px')
      expect.equal(wide.rows, 1, 'all three options on one row')
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
      await settle(page); await W(100); await settle(page)
      const big = await rows()
      expect.ok(big.rows === 1 || big.rows === big.n, `one row or one option per row, never ragged (${big.rows} rows for ${big.n} options, fit=${big.fit})`)
      expect.ok(!big.overflow, 'and nothing spills sideways')
    },
  },
  {
    name: 'choice card: on a phone at 200% text the corner mark stays beside the first line (it and the padding are chrome); only a card too narrow for a word beside it moves the mark above the title',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await open(page, goto)
      const measure = () => page.evaluate(() => {
        const card = document.querySelector('.choice-card:has(input[name=cc-extra])')
        const body = card.querySelector('.card__body'), first = body.firstElementChild
        const cs = getComputedStyle(first), bs = getComputedStyle(body)
        const content = body.clientWidth - parseFloat(bs.paddingLeft) - parseFloat(bs.paddingRight)
        const mark = getComputedStyle(card.querySelector('input'), '::before').width
        return { padEnd: parseFloat(cs.paddingRight), titleW: first.getBoundingClientRect().width, content, cardW: card.getBoundingClientRect().width, mark }
      })
      const phone = await measure()
      expect.ok(phone.padEnd > 0, 'at 100%: the title keeps clear of the mark')
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
      await settle(page)
      const big = await measure()
      expect.equal(big.mark, '24px', 'the mark is chrome: 24px at 200% text')
      expect.ok(big.padEnd > 0, `a ${Math.round(big.cardW)}px card at 200% text: the mark is still beside the first line, not above an empty band`)
      await page.evaluate(() => { document.querySelector('.choice-card:has(input[name=cc-extra])').parentElement.style.inlineSize = '200px' }) // a card's own floor is its column
      await settle(page)
      const narrow = await measure()
      expect.equal(narrow.padEnd, 0, 'a 200px card at 200% text: the title no longer reserves a column for the mark')
      expect.ok(narrow.titleW >= narrow.content - 1, `the title has the whole width (${Math.round(narrow.titleW)} of ${Math.round(narrow.content)}px)`)
    },
  },
  {
    name: 'a forced .is-focus specimen draws the same ring round the box as real keyboard focus',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const forced = await pseudo(page, '#states ~ .demo .choice.is-focus > input', '::before', ['outlineStyle', 'outlineWidth', 'outlineOffset'])
      expect.equal(forced.outlineStyle, 'solid', 'the forced focus specimen has a ring')
      await page.keyboard.press('Tab')
      await page.locator('#states ~ .demo input[name=st-a]').focus()
      const real = await pseudo(page, '#states ~ .demo input[name=st-a]', '::before', ['outlineStyle', 'outlineWidth', 'outlineOffset'])
      expect.equal(forced.outlineStyle, real.outlineStyle, 'same style as real focus')
      expect.equal(forced.outlineWidth, real.outlineWidth, 'same width as real focus')
      expect.equal(forced.outlineOffset, real.outlineOffset, 'same offset as real focus')
    },
  },
]
