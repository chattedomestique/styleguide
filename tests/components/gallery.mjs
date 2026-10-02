// Interaction spec for Gallery: a bento grid on the card grid. Layout is the behaviour, so this measures it.
const GRID = '#basic ~ .demo .gallery'

const measure = (page) => page.evaluate((sel) => {
  const g = document.querySelector(sel)
  const gr = g.getBoundingClientRect()
  const items = [...g.children].map((li) => { const r = li.getBoundingClientRect(); return { size: li.dataset.size || 'one', w: r.width, h: r.height, x: r.left - gr.left, y: r.top - gr.top } })
  // the grid always has four tracks; the columns a person sees are how many single cells fit across it
  const one = items.find((i) => i.size === 'one')
  const cols = Math.round(gr.width / one.w)
  return { cols, w: gr.width, h: gr.height, items, page: document.documentElement.scrollWidth - document.documentElement.clientWidth }
}, GRID)

export const tests = [
  {
    name: 'at phone width: two columns; big is 2x2 and square, wide is 2x1, tall is 1x2',
    async run({ page, goto, expect }) {
      await goto('components/gallery.html')
      const m = await measure(page)
      expect.equal(m.cols, 2, `two columns (got ${m.cols})`)
      const one = m.items.find((i) => i.size === 'one'), big = m.items.find((i) => i.size === 'big'), wide = m.items.find((i) => i.size === 'wide'), tall = m.items.find((i) => i.size === 'tall')
      const near = (a, b) => Math.abs(a - b) < 1
      expect.ok(near(one.w, one.h), `a cell is square (${one.w}x${one.h})`)
      expect.ok(near(big.w, 2 * one.w) && near(big.h, 2 * one.h), `big is exactly 2 x 2 (${big.w}x${big.h} vs ${one.w})`)
      expect.ok(near(wide.w, 2 * one.w) && near(wide.h, one.h), `wide is exactly 2 x 1 (${wide.w}x${wide.h})`)
      expect.ok(near(tall.w, one.w) && near(tall.h, 2 * one.h), `tall is exactly 1 x 2 (${tall.w}x${tall.h})`)
      expect.ok(near(big.w, m.w), 'and at this width big fills the whole grid')
    },
  },
  {
    name: 'no tile overlaps another and none leaves the grid',
    async run({ page, goto, expect }) {
      await goto('components/gallery.html')
      const m = await measure(page)
      for (const a of m.items) expect.ok(a.x >= -0.5 && a.x + a.w <= m.w + 0.5, 'inside the grid horizontally')
      for (let i = 0; i < m.items.length; i++) for (let j = i + 1; j < m.items.length; j++) {
        const a = m.items[i], b = m.items[j]
        const overlap = a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1
        expect.ok(!overlap, `tiles ${i} and ${j} overlap`)
      }
    },
  },
  {
    name: 'at 320px a span cannot invent a column: the page never scrolls sideways and every tile fits the grid',
    viewport: { width: 320, height: 700 },
    async run({ page, goto, expect }) {
      await goto('components/gallery.html')
      const m = await measure(page)
      expect.ok(m.page <= 1, `no horizontal overflow (${m.page}px)`)
      for (const i of m.items) expect.ok(i.w <= m.w + 0.5, `a ${i.size} tile fits the grid (${Math.round(i.w)} of ${Math.round(m.w)})`)
    },
  },
  {
    name: 'at desktop width: four columns, and big spans exactly two of them',
    viewport: { width: 1280, height: 900 },
    async run({ page, goto, expect }) {
      await goto('components/gallery.html')
      const m = await measure(page)
      expect.equal(m.cols, 4, `four columns (got ${m.cols})`)
      const one = m.items.find((i) => i.size === 'one'), big = m.items.find((i) => i.size === 'big')
      expect.ok(Math.abs(big.w - 2 * one.w) < 1, `big is exactly two cells wide (${big.w} vs ${2 * one.w})`)
      expect.ok(Math.abs(big.h - big.w) < 1, 'and square')
    },
  },
  {
    name: 'the columns are planned (1, 2 or 4), so the Basic mosaic closes every row: no empty cell at 320, 390, 600, 1024 or 1280px, or at 200% text',
    async run({ page, goto, expect }) {
      for (const [w, pct, want] of [[320, 100, 2], [390, 100, 2], [600, 100, 4], [1024, 100, 4], [1280, 100, 4], [390, 200, 1], [1024, 200, 1]]) {
        await page.setViewportSize({ width: w, height: 900 })
        await goto('components/gallery.html')
        if (pct !== 100) { await page.addStyleTag({ content: `html{font-size:${pct}%!important}` }); await page.waitForTimeout(250) }
        const m = await measure(page)
        expect.equal(m.cols, want, `${w}px ${pct}%: ${want} column(s) (got ${m.cols})`)
        // the tiles cover the grid exactly: their areas add up to the grid's (a hole would leave area over)
        const area = m.items.reduce((a, i) => a + i.w * i.h, 0)
        expect.ok(Math.abs(area - m.w * m.h) / (m.w * m.h) < 0.01, `${w}px ${pct}%: every row closes (tiles cover ${(100 * area / (m.w * m.h)).toFixed(1)}% of the grid)`)
      }
    },
  },
  {
    name: 'a linked tile: one tab stop per tile in DOM order, the whole tile is the hit area, the tile wears the ring',
    async run({ page, goto, expect }) {
      await goto('components/gallery.html')
      const links = await page.evaluate((s) => [...document.querySelectorAll(s + ' a.media__link')].map((a) => a.textContent.trim()), GRID)
      expect.equal(links.length, 8, 'eight linked tiles (the count card is not a link)')
      const tile = page.locator(`${GRID} .media[data-link]`).nth(1)
      await tile.scrollIntoViewIfNeeded()
      const hit = await tile.evaluate((el) => { const r = el.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 3); return t.closest('a') ? t.closest('a').textContent.trim() : t.tagName })
      expect.equal(hit, links[1], 'clicking the middle of the picture follows the tile link')
      await page.keyboard.press('Tab')
      await page.locator(`${GRID} a.media__link`).nth(1).focus()
      await page.waitForTimeout(300)
      const ring = await tile.evaluate((el) => getComputedStyle(el).outlineWidth)
      expect.equal(ring, '3px', 'the tile wears the ring')
      await page.keyboard.press('Tab')
      const next = await page.evaluate(() => document.activeElement.textContent.trim())
      expect.equal(next, links[2], 'Tab goes to the next tile in DOM order')
    },
  },
  {
    name: 'a tile that holds a card fills its cell (less the gap, which is padding in the cell)',
    async run({ page, goto, expect }) {
      await goto('components/gallery.html')
      const r = await page.evaluate((s) => { const li = document.querySelector(s + ' li[data-size="wide"]'); const c = li.firstElementChild; const a = li.getBoundingClientRect(), b = c.getBoundingClientRect(); return { dh: a.height - b.height, dw: a.width - b.width } }, GRID)
      expect.ok(Math.abs(r.dh - 12) < 1.5 && Math.abs(r.dw - 12) < 1.5, `the card is the cell minus the 12px gap (${r.dw}, ${r.dh})`)
    },
  },
  {
    name: 'tiled: neighbouring frames overlap into one 2px line',
    async run({ page, goto, expect }) {
      await goto('components/gallery.html')
      const r = await page.evaluate(() => {
        const g = document.querySelector('#tiled ~ .demo .gallery')
        const lis = [...g.children]
        const a = lis[1].getBoundingClientRect(), b = lis[2].getBoundingClientRect()
        return { gap: b.left - a.right, radius: getComputedStyle(lis[0].firstElementChild).borderTopLeftRadius }
      })
      expect.ok(Math.abs(r.gap + 2) < 0.6, `tiles overlap by one frame width (gap ${r.gap})`)
      expect.equal(r.radius, '0px', 'and go square')
    },
  },
  {
    name: 'a failed tile keeps its cell and keeps the button in a small tile (the icon drops out)',
    async run({ page, goto, expect }) {
      await goto('components/gallery.html')
      const r = await page.evaluate(() => {
        const li = document.querySelector('#states ~ .demo .gallery li:nth-child(2)')
        const s = li.querySelector('.media__status')
        const cell = li.getBoundingClientRect()
        const btn = s.querySelector('button').getBoundingClientRect()
        return { icon: getComputedStyle(s.querySelector('.ic')).display, w: cell.width, h: cell.height, btnInside: btn.left >= cell.left - 1 && btn.right <= cell.right + 1 && btn.bottom <= cell.bottom + 1 }
      })
      expect.equal(r.icon, 'none', 'compact: no icon')
      expect.ok(Math.abs(r.w - r.h) < 1.5, 'still square')
      expect.ok(r.btnInside, 'the button fits in the tile')
    },
  },
]
