// Pagination: real links in a labelled nav, the current page filled + framed twice + aria-current,
// unavailable Previous/Next that stay focusable but inert, and the two layouts the nav chooses from its
// OWN width. The live pager in the docs re-renders, moves focus to the results and announces.
const status = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r([...document.querySelectorAll('[role="status"]')].map((e) => e.textContent).join('|'))))))
const LIVE = '#pg-live'
// The live pager and the Markup / First-and-last demos sit in a frame at least 42rem wide (so they show the numbers on
// every screen); the short form is shown by the resizable box in "Narrow: the short form", which starts at 16rem.
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
      // was asserted on the live pager; that demo now keeps a 42rem frame on every screen, so the narrow box is the subject
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
      const r = await page.evaluate(() => {
        const box = document.querySelector('#narrow ~ .demo .resize-box'); const nav = box.querySelector('.pagination')
        const d = () => getComputedStyle(nav.querySelector('.pagination__status')).display
        box.style.inlineSize = '44rem'; const wide = d(); box.style.inlineSize = '20rem'; const narrow = d(); return { wide, narrow }
      })
      expect.equal(r.wide, 'none', 'roomy box: numbers'); expect.equal(r.narrow, 'block', 'narrow box on the same screen: short form')
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
      expect.equal((await page.locator(`${nav} .pagination__status`).textContent()).trim(), 'February 2024', 'Enter moved to the next month')
      await expect.attr(page, `${nav} .pagination__next .btn`, 'aria-label', 'Next month, March')
      await expect.attr(page, `${nav} .pagination__prev .btn`, 'aria-label', 'Previous month, January')
      await expect.focused(page, `${nav} .pagination__next .btn`, 'focus stays on the pressed button')
    },
  },
  {
    name: 'Reduced motion: a page button raises without travel',
    reducedMotion: true,
    viewport: WIDE,
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      const b = page.locator(`${LIVE} .pagination__page a[data-page="6"]`)
      await b.hover(); await page.waitForTimeout(500)
      const r = await b.evaluate((el) => ({ t: getComputedStyle(el).transform, fill: Number(getComputedStyle(el).getPropertyValue('--fill')) }))
      expect.ok(r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)', 'no travel: ' + r.t); expect.equal(r.fill, 1, 'fill still changes')
    },
  },
  {
    name: 'Large text: the status line never prints under a button; under 13rem of the nav\'s own width it takes a row above the two circles',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      const measure = (w) => page.evaluate((w) => {
        document.documentElement.style.fontSize = '200%'
        const host = document.createElement('div'); host.style.cssText = 'position:absolute;inset-inline-start:0;inset-block-start:0;inline-size:' + w + 'px;background:var(--canvas)'
        host.innerHTML = '<nav class="pagination" aria-label="fx"><ul class="pagination__list" role="list"><li class="pagination__prev"><a class="btn" href="#fx"><span class="ic ic--arrow-left" aria-hidden="true"></span><span class="pagination__label">Previous</span></a></li><li class="pagination__page"><a class="btn" data-shape="circle" href="#fx" aria-label="Page 1">1</a></li><li class="pagination__status">Page 12 of 12</li><li class="pagination__next"><a class="btn" href="#fx"><span class="pagination__label">Next</span><span class="ic ic--arrow-right" aria-hidden="true"></span></a></li></ul></nav>'
        document.body.appendChild(host)
        const st = host.querySelector('.pagination__status'); const sr = st.getBoundingClientRect()
        const btns = [...host.querySelectorAll('.btn')].map((b) => b.getBoundingClientRect()).filter((b) => b.width > 0)
        const hit = btns.some((b) => Math.min(sr.right, b.right) - Math.max(sr.left, b.left) > 1 && Math.min(sr.bottom, b.bottom) - Math.max(sr.top, b.top) > 1)
        const out = { hit, above: btns.every((b) => sr.bottom <= b.top + 1), overflow: host.scrollWidth > w, clipped: st.scrollWidth > st.clientWidth + 1, textLines: Math.round(sr.height / parseFloat(getComputedStyle(st).lineHeight)) }
        host.remove(); document.documentElement.style.fontSize = ''
        return out
      }, w)
      const narrow = await measure(326)   // 10.2rem at 200%: stacked
      expect.ok(!narrow.hit && !narrow.overflow && !narrow.clipped, 'stacked: the status is not under a button and nothing overflows: ' + JSON.stringify(narrow))
      expect.ok(narrow.above, 'stacked: the status sits above the two circles')
      const mid = await measure(640)      // 20rem at 200%: one row
      expect.ok(!mid.hit && !mid.overflow && !mid.clipped, 'one row: the status is between the circles, not under them: ' + JSON.stringify(mid))
    },
  },
  {
    name: 'A 320px phone at normal text keeps ONE row: Previous, the status, Next; the status takes its own row only under 13rem',
    viewport: { width: 320, height: 700 },
    async run({ page, goto, expect }) {
      await goto('components/pagination.html')
      const measure = (w) => page.evaluate((w) => {
        const host = document.createElement('div'); host.style.cssText = 'position:absolute;inset-inline-start:0;inset-block-start:0;inline-size:' + w + 'px;background:var(--canvas)'
        host.innerHTML = '<nav class="pagination" aria-label="fx"><ul class="pagination__list" role="list"><li class="pagination__prev"><a class="btn" href="#fx"><span class="ic ic--arrow-left" aria-hidden="true"></span><span class="pagination__label">Previous</span></a></li><li class="pagination__page"><a class="btn" data-shape="circle" href="#fx" aria-label="Page 1">1</a></li><li class="pagination__status">Page 5 of 12</li><li class="pagination__next"><a class="btn" href="#fx"><span class="pagination__label">Next</span><span class="ic ic--arrow-right" aria-hidden="true"></span></a></li></ul></nav>'
        document.body.appendChild(host)
        const sr = host.querySelector('.pagination__status').getBoundingClientRect()
        const [a, b] = [host.querySelector('.pagination__prev .btn'), host.querySelector('.pagination__next .btn')].map((e) => e.getBoundingClientRect())
        const out = { between: sr.left >= a.right - 1 && sr.right <= b.left + 1, sameRow: Math.abs(a.top - b.top) < 2 && Math.abs(a.top - sr.top) < a.height, apart: Math.round(b.left - a.right), overflow: host.scrollWidth > w }
        host.remove(); return out
      }, w)
      const phone = await measure(236)   // 14.75rem: what the docs demos give a 320px screen
      expect.ok(phone.between && phone.sameRow && !phone.overflow, 'at 236px (14.75rem) the status sits between the two circles on one row: ' + JSON.stringify(phone))
      const tiny = await measure(190)    // 11.9rem: stacked
      expect.ok(!tiny.between && !tiny.overflow, 'at 190px (11.9rem) it takes its own row: ' + JSON.stringify(tiny))
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
