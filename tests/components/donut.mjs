// Interaction spec for the donut chart. See tests/components.mjs for the contract.
export const tests = [
  {
    name: 'the ring is one image that states the total and every part; the legend repeats them as text',
    async run({ page, goto, expect }) {
      await goto('components/donut.html')
      const r = await page.locator('#demo-basic').evaluate((el) => {
        const svg = el.querySelector('.donut__ring')
        return {
          role: svg.getAttribute('role'),
          label: svg.getAttribute('aria-label'),
          segs: el.querySelectorAll('.donut__seg').length,
          items: [...el.querySelectorAll('.legend__item')].map((i) => [...i.children].map((c) => c.textContent.trim()).filter(Boolean).join(' ')),
        }
      })
      expect.equal(r.role, 'img', 'role=img')
      expect.ok(/\$1,284 in total/.test(r.label) && /rent 48%/.test(r.label) && /other 8%/.test(r.label), `label: ${r.label}`)
      expect.equal(r.segs, 5, 'five sectors')
      expect.equal(r.items.length, 5, 'five legend rows')
      expect.equal(r.items[0], 'Rent $620 48%', 'the legend carries the value and the share')
    },
  },
  {
    name: 'sectors have a 2px frame at any size, and tones 2 to 6 are overprinted with a pattern that exists',
    async run({ page, goto, expect }) {
      await goto('components/donut.html')
      const r = await page.locator('#demo-basic').evaluate((el) => {
        const segs = [...el.querySelectorAll('.donut__seg')]
        return segs.map((g) => {
          const fill = g.querySelector('.donut__fill')
          const pat = g.querySelector('.donut__pat')
          const ref = pat && pat.getAttribute('fill').match(/url\(#([^)]+)\)/)
          return { tone: g.dataset.tone, sw: getComputedStyle(fill).strokeWidth, bg: getComputedStyle(fill).fill, hasPat: !!pat, patExists: ref ? !!el.querySelector('#' + ref[1]) : null }
        })
      })
      expect.ok(r.every((x) => x.sw === '2px'), 'frames are 2px')
      expect.equal(new Set(r.map((x) => x.bg)).size, 5, 'five different fills')
      expect.equal(r[0].hasPat, false, 'tone 1 is solid')
      expect.ok(r.slice(1).every((x) => x.hasPat && x.patExists), 'tones 2 to 5 have a pattern whose tile is defined')
    },
  },
  {
    name: 'the ring takes no focus and is not interactive',
    async run({ page, goto, expect }) {
      await goto('components/donut.html')
      const n = await page.locator('#demo-basic .donut').evaluate((el) => el.querySelectorAll('a, button, input, [tabindex], svg[focusable="true"]').length)
      expect.equal(n, 0, 'nothing focusable in a static chart')
    },
  },
  {
    name: 'phone width stacks ring over legend; a wide container puts them side by side',
    async run({ page, goto, expect }) {
      await goto('components/donut.html')
      const pos = () => page.locator('#demo-basic').evaluate((el) => { const a = el.querySelector('.donut__body').getBoundingClientRect(), b = el.querySelector('.legend').getBoundingClientRect(); return { ringBottom: a.bottom, legendTop: b.top, ringRight: a.right, legendLeft: b.left } })
      const narrow = await pos()
      expect.ok(narrow.legendTop >= narrow.ringBottom - 1, 'stacked at 390')
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.waitForTimeout(200)
      const wide = await pos()
      expect.ok(wide.legendLeft >= wide.ringRight - 1 && wide.legendTop < wide.ringBottom, 'side by side at 1280')
    },
  },
  {
    name: 'the hole text fits inside the hole at 200% text',
    async run({ page, goto, expect }) {
      await goto('components/donut.html')
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.waitForTimeout(150)
      const r = await page.locator('#demo-basic').evaluate((el) => {
        const ring = el.querySelector('.donut__body').getBoundingClientRect()
        const t = el.querySelector('.donut__total').getBoundingClientRect()
        const c = el.querySelector('.donut__caption').getBoundingClientRect()
        const hole = ring.width * (92 / 176)
        return { hole, total: t.width, caption: c.width, ring: ring.width }
      })
      expect.ok(r.total < r.hole * 0.95, `total (${Math.round(r.total)}) fits the hole (${Math.round(r.hole)})`)
      expect.ok(r.caption < r.hole, 'caption fits too')
    },
  },
  {
    name: 'SG.chart.arcs: shares add up, start at 12 o\'clock, and a lone part closes the ring',
    async run({ page, goto, expect }) {
      await goto('components/donut.html')
      const r = await page.evaluate(() => {
        const a = SG.chart.arcs([620, 284, 152, 128, 100])
        const one = SG.chart.arcs([5])
        return { sum: a.reduce((t, x) => t + x.share, 0), starts: a.map((x) => Math.round(x.start)), first: a[0].d.slice(0, 12), end: a[a.length - 1].end, oneD: one[0].d, oneArcs: (one[0].d.match(/A/g) || []).length, oneSub: (one[0].d.match(/M/g) || []).length, oneRadial: /L/.test(one[0].d) }
      })
      expect.ok(Math.abs(r.sum - 1) < 1e-9, 'shares sum to 1')
      expect.equal(r.starts[0], 0, 'first sector starts at 0 degrees')
      expect.equal(Math.round(r.end), 360, 'last sector ends at 360')
      expect.ok(/^M88 8A80 80 0/.test(r.first + '0'), `starts at the top of the ring: x centre, y = cy - outer (${r.first})`)
      // Corrected: this used to assert "two halves", i.e. two sectors with a radial edge each, which drew a seam at 12 and 6 o'clock.
      // What matters is that a lone part is ONE closed outline (the outer circle and the hole), with no radial edge to show a seam.
      expect.equal(r.oneArcs, 4, 'a lone part is the outer and the inner circle, each as two half arcs')
      expect.equal(r.oneSub, 2, 'two sub-paths only: the outer circle and the hole')
      expect.ok(!r.oneRadial, 'and no radial line, so the frame has no seam')
    },
  },
  {
    name: 'SG.chart.donut refuses a chart with no text alternative, and writes only the tiles it uses',
    async run({ page, goto, expect }) {
      await goto('components/donut.html')
      const r = await page.evaluate(() => {
        let threw = false
        try { SG.chart.donut([{ label: 'a', value: 1, tone: 1 }], {}) } catch (e) { threw = /label/.test(e.message) }
        const svg = SG.chart.donut([{ label: 'a', value: 1, tone: 1 }, { label: 'b', value: 1, tone: 3 }], { label: 'Two parts', id: 't1' })
        return { threw, patterns: (svg.match(/<pattern /g) || []).length, hasP3: /t1-p3/.test(svg), hasP2: /t1-p2/.test(svg), aria: /aria-label="Two parts"/.test(svg) }
      })
      expect.ok(r.threw, 'throws without a label')
      expect.equal(r.patterns, 1, 'only one tile is written')
      expect.ok(r.hasP3 && !r.hasP2, 'the one for tone 3')
      expect.ok(r.aria, 'label is written')
    },
  },
  {
    name: 'forced colours: frame and pattern use system colours',
    async run({ page, goto, expect }) {
      await goto('components/donut.html')
      await page.emulateMedia({ forcedColors: 'active' })
      await page.waitForTimeout(100)
      const r = await page.evaluate(() => {
        const g = document.querySelector('#demo-basic .donut__seg[data-tone="2"]')
        const p = document.querySelector('#demo-basic pattern path')
        return { stroke: getComputedStyle(g.querySelector('.donut__fill')).stroke, tile: getComputedStyle(p).stroke }
      })
      expect.ok(r.stroke !== 'none' && r.tile !== 'none', `stroke ${r.stroke}, tile ${r.tile}`)
    },
  },
  {
    name: 'From data: the page shows the ring that SG.chart.donut returns, beside its legend and total',
    async run({ page, goto, expect }) {
      await goto('components/donut.html')
      const r = await page.locator('#demo-data').evaluate((el) => { const svg = el.querySelector('svg.donut__ring'); return svg && { label: svg.getAttribute('aria-label'), segs: svg.querySelectorAll('.donut__seg').length, pats: svg.querySelectorAll('.donut__pat').length, centreAfter: !!svg.nextElementSibling && svg.nextElementSibling.classList.contains('donut__centre') } })
      expect.ok(r, 'a ring was built')
      expect.ok(/Essentials in April, \$1,056 in total/.test(r.label), `the label from the code (${r.label})`)
      expect.equal(r.segs, 3, 'three sectors')
      expect.equal(r.pats, 2, 'tones 2 and 3 carry their patterns')
      expect.ok(r.centreAfter, 'inserted before the total, as the code says (afterbegin)')
    },
  },
]
