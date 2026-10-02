// Spec for the Stat recipe page: it adds no CSS, so what is worth proving is that the composition keeps the
// promises of the parts it is made from (tabular figures, a name for every number, status never colour-only).
export const tests = [
  {
    name: 'the recipe adds no CSS of its own',
    async run({ page, goto, expect }) {
      await goto('components/stat.html')
      const r = await page.evaluate(() => {
        const hits = []
        const walk = (rules) => { for (const rule of rules) { if (rule.cssRules) walk(rule.cssRules); if (rule.selectorText && /\.stat(?![\w-])/.test(rule.selectorText)) hits.push(rule.selectorText) } }
        for (const sheet of document.styleSheets) { try { walk(sheet.cssRules) } catch (e) { /* cross-origin */ } }
        return hits
      })
      expect.equal(r.length, 0, `no .stat selectors (found ${r.join(', ')})`)
    },
  },
  {
    name: 'every figure is tabular, and a figure with a decorative "/12" still reads "of 12"',
    async run({ page, goto, expect }) {
      await goto('components/stat.html')
      const r = await page.evaluate(() => {
        const figs = [...document.querySelectorAll('.card__figure')]
        const tabular = figs.every((f) => /tabular-nums/.test(getComputedStyle(f).fontVariantNumeric))
        const slashed = figs.filter((f) => f.querySelector('small[aria-hidden="true"]'))
        const named = slashed.every((f) => /of \d+/.test(f.querySelector('.sr-only')?.textContent || ''))
        return { n: figs.length, tabular, slashed: slashed.length, named }
      })
      expect.ok(r.n >= 8, `the page has stat figures (${r.n})`)
      expect.ok(r.tabular, 'all tabular')
      expect.ok(r.slashed > 0 && r.named, 'every "/12" has its words in a visually hidden span')
    },
  },
  {
    name: 'the meter is a real meter with a value, and its number is also text',
    async run({ page, goto, expect }) {
      await goto('components/stat.html')
      const r = await page.evaluate(() => {
        const m = document.querySelector('[role="meter"]')
        return { min: m.getAttribute('aria-valuemin'), max: m.getAttribute('aria-valuemax'), now: m.getAttribute('aria-valuenow'), label: m.getAttribute('aria-label'), fig: m.closest('.card').querySelector('.card__figure').textContent.trim().replace(/\s+/g, ' ') }
      })
      expect.equal(r.now, '5', 'aria-valuenow')
      expect.equal(r.max, '12', 'aria-valuemax')
      expect.ok(r.label, 'and a name')
      expect.ok(/^5/.test(r.fig), `the figure next to it says the same number ("${r.fig}")`)
    },
  },
  {
    name: 'every status tag on the page has words and a symbol; every priority has its bars',
    async run({ page, goto, expect }) {
      await goto('components/stat.html')
      const r = await page.evaluate(() => {
        const bad = []
        for (const t of document.querySelectorAll('.tag')) {
          const words = t.textContent.trim()
          if (!words) bad.push('a tag with no words')
          const status = t.matches('[data-tone="ok"],[data-tone="warn"],[data-tone="bad"],[data-tone="info"]')
          const priority = t.hasAttribute('data-priority')
          if (status || priority) {
            const glyph = getComputedStyle(t, '::before').content !== 'none' || !!t.querySelector(':scope > .ic')
            if (!glyph) bad.push(`"${words}" has no symbol`)
          }
        }
        return bad
      })
      expect.ok(r.length === 0, r.join('; '))
    },
  },
  {
    name: 'headings stay in order inside the dashboard: a screen title, then one heading per group',
    async run({ page, goto, expect }) {
      await goto('components/stat.html')
      const levels = await page.evaluate(() => [...document.querySelectorAll('#dashboard ~ .demo .phone h3, #dashboard ~ .demo .phone h4')].slice(0, 4).map((h) => Number(h.tagName[1])))
      expect.equal(levels.join(), '3,4,4', 'h3 then h4, h4')
    },
  },
  {
    name: 'no demo needs the dev-only wireframe kit: a copy-pasted recipe works with the shipped CSS',
    async run({ page, goto, expect }) {
      await goto('components/stat.html')
      const n = await page.evaluate(() => document.querySelectorAll('.demo [class*="wf-"]').length)
      expect.equal(n, 0, 'no .wf-* class in a demo')
    },
  },
  {
    name: 'two stats sit side by side at phone width, down to 320px: a stat is not a full-width square, and nothing in it is cut',
    async run({ page, goto, expect }) {
      await goto('components/stat.html')
      for (const w of [390, 320]) {
        await page.setViewportSize({ width: w, height: 844 })
        await page.waitForTimeout(200)
        // the wider-screen demo keeps its 9rem cells: below 390px it is one stat a row (as tall as its content)
        const r = await page.evaluate((ids) => ids.map((id) => {
          const g = document.querySelector(`${id} ~ .demo .grid`)
          // the body, not the card: the card's frame is painted over its content by an overlay 2px outside its padding box
          const c = [...g.children].map((e) => { const body = e.querySelector('.card__body'); return { top: e.getBoundingClientRect().top, spill: body.scrollWidth - body.clientWidth, figure: e.querySelector('.card__figure') } })
          return { id, first: c[0].top, second: c[1].top, spill: Math.max(...c.map((x) => x.spill)), figures: c.map((x) => x.figure ? x.figure.scrollWidth - x.figure.clientWidth : 0) }
        }), w === 390 ? ['#recipe', '#dashboard', '#wide'] : ['#recipe', '#dashboard'])
        for (const x of r) {
          expect.ok(Math.abs(x.first - x.second) <= 1, `${w}px: ${x.id}: the first two stats share a row`)
          expect.ok(x.spill <= 1 && x.figures.every((f) => f <= 1), `${w}px: ${x.id}: no stat spills or cuts its figure`)
        }
      }
    },
  },
  {
    name: 'cards in one row share one height, and a card holds at most one state (one tag or one meter)',
    async run({ page, goto, expect }) {
      await goto('components/stat.html')
      for (const [w, text] of [[390, 100], [1024, 100], [390, 200]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(200)
        const rows = await page.evaluate(() => [...document.querySelectorAll('.grid')].filter((g) => g.offsetParent).flatMap((g) => {
          const byTop = new Map()
          for (const c of g.children) { const b = c.getBoundingClientRect(); const k = Math.round(b.top); byTop.set(k, [...(byTop.get(k) || []), b.height]) }
          return [...byTop.values()].filter((hs) => hs.length > 1)
        }))
        for (const hs of rows) expect.ok(Math.max(...hs) - Math.min(...hs) <= 1, `${w}px ${text}%: one row, one height (${hs.map((h) => h.toFixed(0)).join(', ')})`)
      }
      const states = await page.evaluate(() => [...document.querySelectorAll('.card--square')].map((c) => c.querySelectorAll('.tag, .meter').length))
      expect.ok(states.every((n) => n <= 1), `one state per card (${states.join(', ')})`)
    },
  },
]
