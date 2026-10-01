// Pagination: real links in a labelled nav, the current page filled + framed twice + aria-current,
// unavailable Previous/Next that stay focusable but inert, and the one-row forms the nav chooses from its
// OWN width (47-pagination.js, SG.fit). The live pager in the docs re-renders, moves focus to the results and announces.
const status = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r([...document.querySelectorAll('[role="status"]')].map((e) => e.textContent).join('|'))))))
const LIVE = '#pg-live'
// The short form is shown by the resizable box in "Narrow: the short form", which starts at 16rem.
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50)))))
const SHORT = '#narrow ~ .demo .resize-box .pagination'
const WIDE = { width: 1024, height: 900 }

export const tests = [
  {
    name: 'Wide: Previous, the first page, a window around the current one, the last page, Next; gaps are hidden from the tree',
    viewport: WIDE,
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      const r = await page.evaluate((sel) => {
        const l = document.querySelector(sel + ' .pagination__list')
        return { items: [...l.children].map((li) => li.className.replace('pagination__', '')), pages: [...l.querySelectorAll('.pagination__page a')].map((a) => a.getAttribute('aria-label')), current: [...l.querySelectorAll('[aria-current="page"]')].map((a) => a.textContent.trim()), gapsHidden: [...l.querySelectorAll('.pagination__gap')].every((g) => g.getAttribute('aria-hidden') === 'true') }
      }, LIVE)
      expect.equal(r.items.join(','), 'prev,page,gap,page,page,page,gap,page,status,next')
      expect.equal(r.pages.join(','), 'Page 1,Page 4,Page 5,Page 6,Page 12')
      expect.equal(r.current.join(','), '5', 'exactly one current page'); expect.ok(r.gapsHidden, 'the gaps are aria-hidden')
      const shown = await page.evaluate((sel) => ({ status: getComputedStyle(document.querySelector(sel + ' .pagination__status')).display, page: getComputedStyle(document.querySelector(sel + ' .pagination__page')).display }), LIVE)
      expect.equal(shown.status, 'none', 'the short-form status is not shown when there is room'); expect.equal(shown.page, 'flex', 'the numbers are')
    },
  },
  {
    name: 'The current page is filled AND ringed a second time; the others are outlines',
    viewport: WIDE,
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      await page.mouse.move(0, 0)
      const r = await page.evaluate((sel) => [...document.querySelectorAll(sel + ' .pagination__page .btn')].map((b) => { const cs = getComputedStyle(b); return { cur: b.getAttribute('aria-current') === 'page', fill: Number(cs.getPropertyValue('--fill')), shadow: cs.boxShadow, tab: cs.fontVariantNumeric } }), LIVE)
      const cur = r.find((b) => b.cur); const other = r.filter((b) => !b.cur)
      expect.equal(cur.fill, 1, 'current: --fill 1'); expect.ok(/0px 0px 0px 2px/.test(cur.shadow), 'current: second 2px ring: ' + cur.shadow)
      expect.ok(other.every((b) => b.fill === 0 && !/0px 0px 0px 2px/.test(b.shadow)), 'others: outline, one frame')
      expect.ok(cur.tab.includes('tabular-nums'), 'numbers are tabular')
    },
  },
  {
    name: 'Clicking a page re-renders the pager, moves focus to the results heading and announces the position',
    viewport: WIDE,
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      await page.locator(`${LIVE} .pagination__page a[data-page="6"]`).click()
      expect.equal(await page.locator(`${LIVE} [aria-current="page"]`).textContent(), '6', 'page 6 is now current')
      await expect.focused(page, '#pg-results', 'focus goes to the results heading, not to <body>')
      expect.ok((await status(page)).includes('Page 6 of 12'), 'announced: ' + (await status(page)))
      expect.equal((await page.locator('#pg-results').textContent()).trim(), 'Decks 51–60 of 120', 'the results heading follows')
    },
  },
  {
    name: 'Keyboard: Tab runs Previous, the numbers, Next in visual order; Enter on a number goes there',
    viewport: WIDE,
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      await page.locator(`${LIVE} a[rel="prev"]`).focus()
      const order = []
      for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => document.activeElement.getAttribute('aria-label') || document.activeElement.textContent.trim())) }
      expect.equal(order.join(','), 'Page 1,Page 4,Page 5,Page 6,Page 12,Next')
      await page.locator(`${LIVE} .pagination__page a[data-page="12"]`).focus()
      await page.keyboard.press('Enter')
      expect.equal(await page.locator(`${LIVE} [aria-current="page"]`).textContent(), '12')
    },
  },
  {
    name: 'The last page: Next is an aria-disabled button, still focusable, inert, and explains itself',
    viewport: WIDE,
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      await page.locator(`${LIVE} .pagination__page a[data-page="12"]`).click()
      const next = page.locator(`${LIVE} .pagination__next .btn`)
      expect.equal(await next.evaluate((el) => el.tagName), 'BUTTON', 'a button: there is no page to link to')
      await expect.attr(page, `${LIVE} .pagination__next .btn`, 'aria-disabled', 'true')
      await next.focus()
      await expect.focused(page, `${LIVE} .pagination__next .btn`, 'still focusable so a keyboard user can find out why')
      await page.evaluate(() => { window.__c = 0; document.querySelector('#pg-live .pagination__next .btn').addEventListener('click', () => window.__c++) })
      await page.keyboard.press('Enter'); await page.keyboard.press('Space')
      expect.equal(await page.evaluate(() => window.__c), 0, 'keyboard activation is blocked (SG.guard)')
      const why = await next.evaluate((el) => document.getElementById(el.getAttribute('aria-describedby')).textContent)
      expect.equal(why, 'You are on the last page')
      expect.equal(await next.evaluate((el) => getComputedStyle(el).borderTopStyle), 'dashed', 'dashed = not here')
    },
  },
  {
    name: 'Narrow (390px): the numbers give way to "Page N of M"; Previous and Next are 44px circles that keep their names',
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      const r = await page.evaluate((sel) => {
        const nav = document.querySelector(sel)
        const d = (s) => getComputedStyle(nav.querySelector(s)).display
        const b = nav.querySelector('.pagination__next .btn'); const br = b.getBoundingClientRect(); const labelEl = nav.querySelector('.pagination__next .pagination__label')
        return { page: d('.pagination__page'), gap: d('.pagination__gap'), status: d('.pagination__status'), statusText: nav.querySelector('.pagination__status').textContent, w: Math.round(br.width), h: Math.round(br.height), labelIn: (() => { const rg = document.createRange(); rg.selectNodeContents(labelEl); return [...rg.getClientRects()].every((q) => q.left >= br.left - 1 && q.right <= br.right + 1) })(), clip: getComputedStyle(labelEl).clipPath, abs: getComputedStyle(labelEl).position, name: b.textContent.trim() }
      }, SHORT)
      expect.equal(r.page, 'none'); expect.equal(r.gap, 'none'); expect.equal(r.status, 'block'); expect.equal(r.statusText, 'Page 5 of 12')
      expect.ok(r.w >= 44 && r.h >= 44 && r.w <= 46, `Next is a ${r.w}x${r.h} circle`); expect.ok(r.clip === 'inset(50%)' && r.abs === 'absolute', 'its word is visually hidden (painted nowhere, takes no room)'); expect.ok(r.labelIn, 'and laid out inside the circle, not past it'); expect.equal(r.name, 'Next', 'but still its name')
    },
  },
  {
    name: 'The layout follows the nav\'s OWN width, not the screen\'s: a wide screen with a narrow box still shows the short form',
    viewport: WIDE,
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      const d = () => page.evaluate(() => { const nav = document.querySelector('#narrow ~ .demo .resize-box .pagination'); return { status: getComputedStyle(nav.querySelector('.pagination__status')).display, fit: nav.getAttribute('data-fit') } })
      await page.evaluate(() => { document.querySelector('#narrow ~ .demo .resize-box').style.inlineSize = '44rem' })
      await settle(page)
      const wide = await d()
      await page.evaluate(() => { document.querySelector('#narrow ~ .demo .resize-box').style.inlineSize = '20rem' })
      await settle(page)
      const narrow = await d()
      expect.ok(wide.status === 'none' && wide.fit === 'full', 'roomy box: numbers: ' + JSON.stringify(wide)); expect.ok(narrow.status === 'block' && narrow.fit === 'short', 'narrow box on the same screen: short form: ' + JSON.stringify(narrow))
    },
  },
  {
    name: 'Every control is at least 44x44 in both layouts, with at least 8px between neighbours in a row',
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      const small = await page.evaluate(() => [...document.querySelectorAll('nav.pagination a, nav.pagination button')].filter((e) => e.offsetParent).map((e) => { const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height), e.getAttribute('aria-label') || e.textContent.trim()] }).filter(([w, h]) => w < 44 || h < 44))
      expect.equal(small.length, 0, 'undersized: ' + JSON.stringify(small))
      const gaps = await page.evaluate(() => [...document.querySelectorAll('nav.pagination .pagination__list')].map((l) => { const rs = [...l.querySelectorAll('a, button')].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect()); let min = 99; for (let i = 1; i < rs.length; i++) if (Math.abs(rs[i].top - rs[i - 1].top) < 4) min = Math.min(min, rs[i].left - rs[i - 1].right); return min }))
      expect.ok(gaps.every((g) => g >= 7.5), 'gaps of at least 8px: ' + JSON.stringify(gaps))
    },
  },
  {
    name: 'Switcher: always the short form (even on a wide screen); the value is a polite live region; the buttons keep current names',
    viewport: WIDE,
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      const nav = '#pg-month'
      const disp = await page.evaluate((sel) => { const n = document.querySelector(sel); return { status: getComputedStyle(n.querySelector('.pagination__status')).display, live: n.querySelector('.pagination__status').getAttribute('aria-live'), size: getComputedStyle(n.querySelector('.pagination__status')).fontSize } }, nav)
      expect.equal(disp.status, 'block', 'the value shows at 1024px'); expect.equal(disp.live, 'polite'); expect.ok(parseFloat(disp.size) >= 24, 'and it is the biggest thing in the row: ' + disp.size)
      await expect.attr(page, `${nav} .pagination__next .btn`, 'aria-label', 'Next month, February')
      await page.locator(`${nav} .pagination__next .btn`).focus()
      await page.keyboard.press('Enter')
      expect.equal((await page.locator(`${nav} .pagination__status`).textContent()).trim(), 'February 2026', 'Enter moved to the next month')
      await expect.attr(page, `${nav} .pagination__next .btn`, 'aria-label', 'Next month, March')
      await expect.attr(page, `${nav} .pagination__prev .btn`, 'aria-label', 'Previous month, January')
      await expect.focused(page, `${nav} .pagination__next .btn`, 'focus stays on the pressed button')
    },
  },
  {
    name: 'Reduced motion: a page button raises without travel (its shadow still shows); it is not filled, the fill means current',
    reducedMotion: true,
    viewport: WIDE,
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      const b = page.locator(`${LIVE} .pagination__page a[data-page="6"]`)
      await b.hover(); await page.waitForTimeout(500)
      const r = await b.evaluate((el) => ({ t: getComputedStyle(el).transform, lift: Number(getComputedStyle(el).getPropertyValue('--lift')), fill: Number(getComputedStyle(el).getPropertyValue('--fill')), shadow: getComputedStyle(el).boxShadow }))
      expect.ok(r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)', 'no travel: ' + r.t)
      expect.equal(r.lift, 1, 'raised'); expect.ok(/4px 4px 0px 0px/.test(r.shadow), 'its hard shadow shows: ' + r.shadow)
      expect.equal(r.fill, 0, 'not filled: only the current page is (S1)')
      await page.mouse.down(); await page.waitForTimeout(300)
      const f = await b.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--fill')))
      expect.ok(f > 0.1 && f < 0.2, 'pressed: a light tint: ' + f)
      await page.mouse.up()
    },
  },
  {
    name: 'The short form is ONE row at every size: at 200% text and at 100% in a tiny box the status sits between the circles (wrapping there), never under them',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      const measure = async (w, text) => {
        await page.evaluate(([w, text]) => {
          document.documentElement.style.fontSize = text + '%'
          const host = document.createElement('div'); host.id = 'fx-host'; host.style.cssText = 'position:absolute;inset-inline-start:0;inset-block-start:0;inline-size:' + w + 'px;background:var(--canvas)'
          host.innerHTML = '<nav class="pagination" aria-label="fx"><ul class="pagination__list" role="list"><li class="pagination__prev"><a class="btn" href="#fx"><span class="ic ic--arrow-left" aria-hidden="true"></span><span class="pagination__label">Previous</span></a></li><li class="pagination__page"><a class="btn" data-shape="circle" href="#fx" aria-label="Page 1">1</a></li><li class="pagination__gap" aria-hidden="true">…</li><li class="pagination__page"><a class="btn" data-shape="circle" href="#fx" aria-label="Page 5">5</a></li><li class="pagination__page"><a class="btn" data-shape="circle" href="#fx" aria-label="Page 6" aria-current="page">6</a></li><li class="pagination__page"><a class="btn" data-shape="circle" href="#fx" aria-label="Page 7">7</a></li><li class="pagination__gap" aria-hidden="true">…</li><li class="pagination__page"><a class="btn" data-shape="circle" href="#fx" aria-label="Page 12">12</a></li><li class="pagination__status">Page 6 of 12</li><li class="pagination__next"><a class="btn" href="#fx"><span class="pagination__label">Next</span><span class="ic ic--arrow-right" aria-hidden="true"></span></a></li></ul></nav>'
          document.body.appendChild(host)
        }, [w, text])
        await settle(page)
        return page.evaluate((w) => {
          const host = document.getElementById('fx-host'); const nav = host.querySelector('.pagination')
          const st = host.querySelector('.pagination__status'); const sr = st.getBoundingClientRect()
          const [a, b] = [host.querySelector('.pagination__prev .btn'), host.querySelector('.pagination__next .btn')].map((e) => e.getBoundingClientRect())
          const out = { fit: nav.getAttribute('data-fit'), between: sr.left >= a.right - 1 && sr.right <= b.left + 1, sameRow: Math.abs((a.top + a.bottom) / 2 - (sr.top + sr.bottom) / 2) < 2 && Math.abs(a.top - b.top) < 1, circle: Math.round(a.width), lines: Math.round(sr.height / parseFloat(getComputedStyle(st).lineHeight)), overflow: host.scrollWidth > w, clipped: st.scrollWidth > st.clientWidth + 1 }
          host.remove(); document.documentElement.style.fontSize = ''
          return out
        }, w)
      }
      for (const [w, text] of [[326, 200], [236, 100], [190, 100], [160, 200]]) {
        const r = await measure(w, text)
        expect.equal(r.fit, 'short', w + 'px at ' + text + '%: the short form')
        expect.ok(r.between && r.sameRow && !r.overflow && !r.clipped, w + 'px at ' + text + '%: Previous, the status, Next on ONE row, the status centred between the circles: ' + JSON.stringify(r))
        expect.equal(r.circle, 44, 'the circles stay 44px (chrome)')
      }
    },
  },
  {
    name: 'At 390px the live pager fits its frame: one row, nothing cut off, the current page wholly visible; a wide screen shows the full row',
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      const read = () => page.evaluate(() => [...document.querySelectorAll('.docs-article nav.pagination:not([data-variant="switcher"])')].map((nav) => {
        const stage = nav.closest('.demo__stage, .resize-box, .phone__screen').getBoundingClientRect(); const items = [...nav.querySelectorAll('.pagination__list > li')].filter((li) => getComputedStyle(li).display !== 'none').map((li) => li.getBoundingClientRect())
        const cur = nav.querySelector('[aria-current="page"]'); const c = cur && getComputedStyle(cur.closest('li')).display !== 'none' ? cur.getBoundingClientRect() : null
        return { label: nav.getAttribute('aria-label'), fit: nav.getAttribute('data-fit'), rows: new Set(items.map((x) => Math.round((x.top + x.bottom) / 2))).size, out: items.filter((x) => x.left < stage.left - 1 || x.right > stage.right + 1).length, cur: c ? c.left >= stage.left - 1 && c.right <= stage.right + 1 : 'short' }
      }))
      const phone = await read()
      expect.ok(phone.every((n) => n.rows === 1 && n.out === 0 && n.cur), 'one row, inside its frame, current page visible: ' + JSON.stringify(phone))
      expect.equal(phone.find((n) => n.label === 'Decks pages').fit, 'fewer', 'the live pager keeps the first, the current and the last page at 390px')
      await page.setViewportSize({ width: 1024, height: 900 })
      await settle(page)
      const wide = await read()
      expect.equal(wide.find((n) => n.label === 'Decks pages').fit, 'full', 'at 1024px the full row')
      expect.ok(wide.every((n) => n.rows === 1 && n.out === 0), 'and still one row in its frame: ' + JSON.stringify(wide))
    },
  },
  {
    name: 'Fewer numbers: the first, the current and the last page, with one … for each run left out, whatever the window in the markup',
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      // walk the live pager, then FORCE the fewer form (the measure would choose compact where that fits) and read
      // what shows: the CSS must leave first, current and last, with one … per missing run, for every window
      const shown = async (n) => {
        await page.evaluate((n) => { const a = document.querySelector('#pg-live a[data-page="' + n + '"]'); if (a) a.click() }, n)
        await settle(page)
        return page.evaluate(() => { const nav = document.getElementById('pg-live'); const fit = nav.getAttribute('data-fit'); nav.setAttribute('data-fit', 'fewer'); const seq = [...nav.querySelectorAll('.pagination__list > :is(.pagination__page, .pagination__gap)')].filter((li) => getComputedStyle(li).display !== 'none').map((li) => { const a = li.querySelector('a'); return a && getComputedStyle(a).display !== 'none' ? a.textContent.trim() : '…' }).join(' '); nav.setAttribute('data-fit', fit); return { fit, seq } })
      }
      const c5 = await shown(5)
      expect.equal(c5.fit, 'fewer', 'at 390px the live pager on page 5 needs the fewer form'); expect.equal(c5.seq, '1 … 5 … 12')
      expect.equal((await shown(4)).seq, '1 … 4 … 12', 'page 4')
      expect.equal((await shown(3)).seq, '1 … 3 … 12', 'page 3: page 2, left out with no gap in the markup, still gets its …')
      expect.equal((await shown(2)).seq, '1 2 … 12', 'page 2')
      expect.equal((await shown(1)).seq, '1 … 12', 'page 1')
    },
  },
  {
    name: 'Right-to-left: Previous / Next arrows mirror; left-to-right is untouched',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      const t = () => page.evaluate(() => ({ l: getComputedStyle(document.querySelector('.pagination .ic--arrow-left')).transform, r: getComputedStyle(document.querySelector('.pagination .ic--arrow-right')).transform }))
      const a = await t(); expect.ok(a.l === 'none' && a.r === 'none', 'LTR: not flipped')
      await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'))
      const b = await t(); expect.ok(b.l === 'matrix(-1, 0, 0, 1, 0, 0)' && b.r === 'matrix(-1, 0, 0, 1, 0, 0)', 'RTL: mirrored ' + JSON.stringify(b))
    },
  },
]
