// Interaction spec for Accordion: native details/summary keyboard behaviour, exclusive and independent groups,
// focus staying on the head, closed content out of the tab order, the ring drawn inside, states as --fill.
export const tests = [
  {
    name: 'Tab reaches each head; Enter and Space toggle it; focus stays on the head',
    async run({ page, goto, expect }) {
      await goto('components/accordion.html')
      const demo = page.locator('#one-open ~ .demo').first()
      const heads = demo.locator('summary.accordion__head')
      await page.keyboard.press('Tab') // keyboard modality, so :focus-visible applies
      await heads.nth(1).focus()
      await expect.focused(page, '.accordion__head', 'the head takes focus')
      const open = (i) => demo.locator('details.accordion__item').nth(i).evaluate((d) => d.open)
      expect.equal(await open(1), false, 'starts closed')
      await page.keyboard.press('Enter')
      expect.equal(await open(1), true, 'Enter opens it')
      await expect.focused(page, '.accordion__head', 'focus stays on the head after opening')
      await page.keyboard.press('Space')
      expect.equal(await open(1), false, 'Space closes it')
      await expect.focused(page, '.accordion__head', 'focus stays on the head after closing')
    },
  },
  {
    name: 'items that share a name are exclusive: opening one closes the other',
    async run({ page, goto, expect }) {
      await goto('components/accordion.html')
      const demo = page.locator('#one-open ~ .demo').first()
      const states = () => demo.locator('details.accordion__item').evaluateAll((ds) => ds.map((d) => d.open))
      expect.equal((await states()).join(), 'true,false,false,false', 'the first starts open')
      await demo.locator('summary').nth(2).focus()
      await page.keyboard.press('Enter')
      expect.equal((await states()).join(), 'false,false,true,false', 'opening the third closed the first')
    },
  },
  {
    name: 'items without a name open independently',
    async run({ page, goto, expect }) {
      await goto('components/accordion.html')
      const demo = page.locator('#many-open ~ .demo').first()
      const count = () => demo.locator('details.accordion__item').evaluateAll((ds) => ds.filter((d) => d.open).length)
      expect.equal(await count(), 2, 'two start open')
      await demo.locator('summary').nth(1).focus()
      await page.keyboard.press('Enter')
      expect.equal(await count(), 3, 'a third opens without closing the others')
    },
  },
  {
    name: 'the expanded state is exposed natively and flips with the item',
    async run({ page, goto, expect }) {
      await goto('components/accordion.html')
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Accessibility.enable')
      const state = async (name) => {
        const { nodes } = await cdp.send('Accessibility.getFullAXTree')
        const n = nodes.find((x) => x.name?.value === name && /Disclosure/.test(x.role?.value || ''))
        if (!n) throw new Error(`no disclosure node named "${name}"`)
        return { focusable: n.properties.find((p) => p.name === 'focusable')?.value.value, expanded: n.properties.find((p) => p.name === 'expanded')?.value.value }
      }
      let s = await state('Can I study without a connection?')
      expect.equal(s.expanded, false, 'closed = collapsed')
      expect.equal(s.focusable, true, 'and focusable')
      await page.locator('#one-open ~ .demo').first().locator('summary').nth(1).focus()
      await page.keyboard.press('Enter')
      s = await state('Can I study without a connection?')
      expect.equal(s.expanded, true, 'open = expanded')
    },
  },
  {
    name: 'closed content is out of the tab order; open content is in it',
    async run({ page, goto, expect }) {
      await goto('components/accordion.html')
      await page.locator('#context ~ .demo summary').first().focus()
      const seen = []
      for (let i = 0; i < 7; i++) {
        seen.push(await page.evaluate(() => (document.activeElement?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30)))
        await page.keyboard.press('Tab')
      }
      const flat = seen.join(' | ')
      expect.ok(/Cards per session/.test(flat), `open content is reachable (${flat})`)
      expect.ok(/Account/.test(flat), 'the next head is reachable')
      expect.ok(!/maya@example/.test(flat), 'the closed Account list is skipped')
    },
  },
  {
    name: 'open head is the ink bar with paper text; the ring is drawn inside and follows the head ink',
    async run({ page, goto, expect }) {
      await goto('components/accordion.html')
      await page.keyboard.press('Tab')
      const r = await page.evaluate(async () => {
        const probe = (v) => { const p = document.createElement('i'); p.style.color = `var(${v})`; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c }
        const open = document.querySelector('#one-open ~ .demo details[open] > summary')
        const closed = document.querySelector('#one-open ~ .demo details:not([open]) > summary')
        open.focus()
        await new Promise((r) => setTimeout(r, 450))
        const o = getComputedStyle(open)
        const out = { openBg: o.backgroundColor, openInk: o.color, ink: probe('--ink'), paper: probe('--paper'), openRing: o.outlineColor, openOffset: parseFloat(o.outlineOffset), openW: o.outlineWidth }
        closed.focus()
        await new Promise((r) => setTimeout(r, 450))
        const c = getComputedStyle(closed)
        out.closedRing = c.outlineColor
        out.closedOffset = parseFloat(c.outlineOffset)
        return out
      })
      expect.ok(r.openBg !== r.paper, 'the open head is not paper')
      expect.equal(r.openInk, r.paper, 'open: paper text')
      expect.equal(r.openRing, r.paper, 'open: the ring is paper, so it shows on the bar')
      expect.ok(r.openOffset < 0, `the ring is drawn inside the head (offset ${r.openOffset})`)
      expect.equal(r.openW, '3px', 'and is 3px')
      expect.equal(r.closedRing, r.ink, 'closed: the ring is ink')
      expect.ok(r.closedOffset < 0, 'closed: inside too')
    },
  },
  {
    name: 'hover and keyboard focus set --fill (the tint) and never lift the head; pressing deepens it',
    async run({ page, goto, expect }) {
      await goto('components/accordion.html')
      const head = page.locator('#one-open ~ .demo details:not([open]) > summary').first()
      const nums = () => head.evaluate((el) => ({ fill: Number(getComputedStyle(el).getPropertyValue('--fill')), lift: Number(getComputedStyle(el).getPropertyValue('--lift')), t: getComputedStyle(el).transform, bg: getComputedStyle(el).backgroundColor }))
      await page.waitForTimeout(50)
      const rest = await nums()
      expect.equal(rest.fill, 0, 'rest: no tint')
      await head.hover()
      await page.waitForTimeout(450)
      const hover = await nums()
      expect.equal(hover.fill, 1, 'hover: --fill 1')
      expect.equal(hover.lift, 0, 'the head does not lift')
      expect.equal(hover.t, 'none', 'and does not move')
      expect.ok(hover.bg !== rest.bg, 'the tint shows')
      await page.mouse.down()
      await page.waitForTimeout(450)
      const down = await nums()
      expect.ok(down.bg !== hover.bg, 'pressed: a deeper tint')
      await page.mouse.up()
      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab')
      await head.focus()
      await page.waitForTimeout(450)
      expect.equal((await nums()).fill, 1, 'keyboard focus: same tint as hover')
    },
  },
  {
    name: 'an aria-disabled head stays focusable and cannot be opened by key or pointer',
    async run({ page, goto, expect }) {
      await goto('components/accordion.html')
      const head = page.locator('#states ~ .demo summary[aria-disabled="true"]')
      await head.focus()
      await expect.focused(page, 'summary[aria-disabled="true"]', 'still focusable, so its reason can be read')
      const open = () => head.evaluate((s) => s.parentElement.open)
      await page.keyboard.press('Enter')
      await page.keyboard.press('Space')
      expect.equal(await open(), false, 'keys do nothing (SG.guard)')
      await head.click({ force: true }).catch(() => {})
      expect.equal(await open(), false, 'a click does nothing')
      expect.equal(await head.evaluate((s) => getComputedStyle(s).cursor), 'not-allowed', 'and the cursor says so')
    },
  },
  {
    name: 'panels: the bar is there when closed; the ink tone flips it to paper',
    async run({ page, goto, expect }) {
      await goto('components/accordion.html')
      const r = await page.evaluate(() => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 1
        const cx = cv.getContext('2d', { willReadFrequently: true })
        const rgb = (css) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data].join() }
        const probe = (v) => { const p = document.createElement('i'); p.style.color = `var(${v})`; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return rgb(c) }
        const closed = document.querySelector('#panels ~ .demo details[data-tone="2"]:not([open]) > summary')
        const ink = document.querySelector('#panels ~ .demo details[data-tone="ink"] > summary')
        return { closedBg: rgb(getComputedStyle(closed).backgroundColor), inkBg: rgb(getComputedStyle(ink).backgroundColor), ink: probe('--ink'), paper: probe('--paper') }
      })
      expect.equal(r.closedBg, r.ink, 'a closed panel still has its ink bar')
      expect.equal(r.inkBg, r.paper, 'the inverted tone flips the bar to paper')
    },
  },
  {
    name: 'the control shows + when closed and − when open',
    async run({ page, goto, expect }) {
      await goto('components/accordion.html')
      const r = await page.evaluate(() => {
        const mask = (sel) => getComputedStyle(document.querySelector(sel), '::after').maskImage
        return { open: mask('#one-open ~ .demo details[open] > summary'), closed: mask('#one-open ~ .demo details:not([open]) > summary') }
      })
      expect.ok(r.open !== r.closed, 'the glyph differs between states')
      expect.ok(/data:image\/svg/.test(r.open) && /data:image\/svg/.test(r.closed), 'both are drawn')
    },
  },
  {
    name: 'opening fades the body in and drops it; closing is instant',
    async run({ page, goto, expect }) {
      await goto('components/accordion.html')
      const r = await page.evaluate(async () => {
        const d = document.querySelector('#many-open ~ .demo details:not([open])')
        const closedT = getComputedStyle(d, '::details-content').transform
        d.open = true
        await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)))
        const mid = getComputedStyle(d, '::details-content').opacity
        await new Promise((res) => setTimeout(res, 600))
        const done = getComputedStyle(d, '::details-content').opacity
        d.open = false
        await new Promise((res) => requestAnimationFrame(res))
        const closing = getComputedStyle(d, '::details-content').transitionDuration
        return { closedT, mid: Number(mid), done: Number(done), closing }
      })
      expect.ok(/matrix\(1, 0, 0, 1, 0, -8\)/.test(r.closedT), `closed body waits 8px above (got ${r.closedT})`)
      expect.ok(r.mid < 1, `fading in (opacity ${r.mid})`)
      expect.equal(r.done, 1, 'fully in')
      expect.ok(/^0s/.test(r.closing), `closing has no transition (got ${r.closing})`)
    },
  },
  {
    name: 'reduced motion: the drop becomes a plain fade',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/accordion.html')
      const t = await page.evaluate(() => getComputedStyle(document.querySelector('#many-open ~ .demo details:not([open])'), '::details-content').transform)
      expect.ok(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)', `no travel (got ${t})`)
    },
  },
]
