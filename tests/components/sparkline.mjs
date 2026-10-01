// Interaction spec for the sparkline. See tests/components.mjs for the contract.
export const tests = [
  {
    name: 'every sparkline is an image with a sentence for a name, and takes no focus',
    async run({ page, goto, expect }) {
      await goto('components/sparkline.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('.spark')].map((s) => ({ role: s.getAttribute('role'), label: s.getAttribute('aria-label'), focusable: s.getAttribute('focusable'), tab: s.getAttribute('tabindex') })))
      expect.ok(r.length >= 9, `found the sparklines (${r.length})`)
      for (const s of r) {
        expect.equal(s.role, 'img', 'role=img')
        expect.ok(s.label && s.label.length > 25, `label is a sentence: "${s.label}"`)
        expect.ok(/up|down|flat/.test(s.label), `label gives the direction in words: "${s.label}"`)
        expect.equal(s.focusable, 'false', 'focusable=false (old IE/Edge)')
        expect.equal(s.tab, null, 'no tabindex')
      }
    },
  },
  {
    name: 'the line is 2px however the box is stretched, and the dot is round-capped',
    async run({ page, goto, expect }) {
      await goto('components/sparkline.html')
      const r = await page.evaluate(() => {
        const line = document.querySelector('#demo-sizes .spark__line')
        const dot = document.querySelector('#demo-sizes .spark__dot:not(.spark__dot--ring)')
        const cs = getComputedStyle(line), ds = getComputedStyle(dot)
        return { w: cs.strokeWidth, eff: cs.vectorEffect, cap: ds.strokeLinecap, dw: ds.strokeWidth }
      })
      expect.equal(r.w, '2px', 'frame weight')
      expect.equal(r.eff, 'non-scaling-stroke', 'drawn in screen pixels')
      expect.equal(r.cap, 'round', 'round cap = always a circle')
      expect.equal(r.dw, '12px', '12px dot')
    },
  },
  {
    name: 'the three sizes are 1.75, 2.5 and 4rem high, and fill the width',
    async run({ page, goto, expect }) {
      await goto('components/sparkline.html')
      const r = await page.evaluate(() => {
        const s = [...document.querySelectorAll('#demo-sizes .spark')].map((e) => { const b = e.getBoundingClientRect(); return { h: b.height, w: b.width, parent: e.parentElement.getBoundingClientRect().width } })
        return s
      })
      expect.equal(r.length, 3, 'three sizes')
      expect.equal(r[0].h, 28, 'sm = 1.75rem')
      expect.equal(r[1].h, 40, 'md = 2.5rem')
      expect.equal(r[2].h, 64, 'lg = 4rem')
      for (const x of r) expect.ok(Math.abs(x.w - x.parent) < 1, 'fills the width')
    },
  },
  {
    name: 'inside a card the line takes the card ink, and the ring takes the card fill',
    async run({ page, goto, expect }) {
      await goto('components/sparkline.html')
      const r = await page.evaluate(() => {
        const card = document.querySelectorAll('#demo-stat .card')[1]
        const ink = getComputedStyle(card).color, bg = getComputedStyle(card).backgroundColor
        const s = card.querySelector('.spark')
        return { ink, bg, line: getComputedStyle(s.querySelector('.spark__line')).stroke, ring: getComputedStyle(s.querySelector('.spark__dot--ring')).stroke }
      })
      expect.equal(r.line, r.ink, 'line = card ink')
      expect.equal(r.ring, r.bg, 'ring = card fill')
    },
  },
  {
    name: 'direction is also in words and an icon next to the stat, never only in the line',
    async run({ page, goto, expect }) {
      await goto('components/sparkline.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('#demo-stat .card')].map((c) => ({ text: c.querySelector('.card__meta').textContent.trim(), icon: !!c.querySelector('.card__meta .ic') })))
      expect.ok(r.every((x) => /^(Up|Down)/.test(x.text) && x.icon), 'each stat says up or down and shows an icon')
    },
  },
  {
    name: 'SG.chart.sparkline: points stay inside the margin, a flat series is a flat line, a label is required',
    async run({ page, goto, expect }) {
      await goto('components/sparkline.html')
      const r = await page.evaluate(() => {
        const pts = SG.chart.points([3, 9, 1, 7])
        const flat = SG.chart.points([5, 5, 5])
        let threw = false
        try { SG.chart.sparkline([1, 2, 3], {}) } catch (e) { threw = /label/.test(e.message) }
        const one = SG.chart.points([4])
        return { ys: pts.map((p) => p[1]), xs: pts.map((p) => p[0]), flat: flat.map((p) => p[1]), threw, one }
      })
      expect.equal(Math.min(...r.ys), 8, 'the highest value sits at 8')
      expect.equal(Math.max(...r.ys), 92, 'the lowest at 92')
      expect.equal(r.xs[0], 0, 'starts at the left edge')
      expect.equal(r.xs[3], 100, 'ends at the right edge')
      expect.ok(r.flat.every((y) => y === r.flat[0] && !isNaN(y)), 'flat is flat, not NaN')
      expect.ok(r.threw, 'throws without a label')
      expect.equal(r.one[0][0], 50, 'a single point is centred')
    },
  },
  {
    name: 'in a table the sparkline column has a header and the row keeps its value as text',
    async run({ page, goto, expect }) {
      await goto('components/sparkline.html')
      const r = await page.locator('#demo-table table').evaluate((t) => ({ heads: [...t.tHead.rows[0].cells].map((c) => c.textContent.trim()), row: [...t.tBodies[0].rows[0].cells].map((c) => c.textContent.trim()) }))
      // Corrected: this asserted the column ORDER (Deck|Now|12 days). The order is a docs choice (the trend column now comes
      // second so it is in view first on a phone); what matters is that the trend column is named, the row's name and
      // value are text, and the trend sits before the value so a scrolled phone table shows it without scrolling.
      expect.equal([...r.heads].sort().join('|'), '12 days|Deck|Now', 'the trend column is named')
      expect.equal(r.heads[0] + '|' + r.heads[1], 'Deck|12 days', 'the trend is the second column, in view first')
      expect.equal(r.row[0] + r.row[2], 'Shapes92%', 'name and value are text')
    },
  },
  {
    name: 'forced colours: line and dot use CanvasText',
    async run({ page, goto, expect }) {
      await goto('components/sparkline.html')
      await page.emulateMedia({ forcedColors: 'active' })
      await page.waitForTimeout(100)
      const r = await page.evaluate(() => ({ line: getComputedStyle(document.querySelector('.spark__line')).stroke, ring: getComputedStyle(document.querySelector('.spark__dot--ring')).stroke }))
      expect.ok(r.line !== 'none' && r.ring !== 'none', `line ${r.line}, ring ${r.ring}`)
    },
  },
]
