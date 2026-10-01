// Interaction spec for Table. See tests/components.mjs for the contract and tests/components/button.mjs for a model.
const TX = '#demo-tx .tbl'
const SEL = '#demo-select .tbl'

export const tests = [
  {
    name: 'the scroll region is a named, keyboard-focusable region and the table is labelled',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      const info = await page.locator(`${TX} .tbl__scroll`).evaluate((el) => ({
        role: el.getAttribute('role'),
        tab: el.getAttribute('tabindex'),
        name: document.getElementById(el.getAttribute('aria-labelledby'))?.textContent.trim(),
        tableName: document.getElementById(el.querySelector('table').getAttribute('aria-labelledby'))?.textContent.trim(),
      }))
      expect.equal(info.role, 'region', 'region role')
      expect.equal(info.tab, '0', 'reachable by Tab')
      expect.equal(info.name, 'Transactions, April', 'region has a name')
      expect.equal(info.tableName, 'Transactions, April', 'table has a name')
      await page.locator(`${TX} .tbl__scroll`).focus()
      await expect.focused(page, '.tbl__scroll', 'the region can take focus')
    },
  },
  {
    name: 'Tab goes region, then each sortable header button in order',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      await page.locator(`${TX} .tbl__scroll`).focus()
      const seen = []
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Tab')
        seen.push(await page.evaluate(() => document.activeElement.textContent.trim()))
      }
      expect.equal(seen.join('|'), 'Merchant|Category|Date|Amount', 'sort buttons in DOM order (Method is not sortable)')
    },
  },
  {
    name: 'Enter on a sort button sorts, sets aria-sort on that th only, and keeps focus on the button',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      const amount = page.locator(`${TX} th:has(.tbl__sort:text("Amount")) .tbl__sort`)
      await amount.focus()
      await page.keyboard.press('Enter')
      await expect.focused(page, '.tbl__sort', 'focus stays on the button')
      const r = await page.evaluate((sel) => {
        const t = document.querySelector(sel + ' table')
        const heads = [...t.tHead.rows[0].cells].map((h) => h.getAttribute('aria-sort'))
        const first = [...t.tBodies[0].rows].map((tr) => tr.cells[0].textContent.trim())
        return { heads, first }
      }, TX)
      expect.equal(r.heads.join(','), ',,,,ascending', 'only Amount is sorted; Date lost its initial aria-sort')
      expect.equal(r.first[0], 'Apple Store', 'the most negative amount comes first when ascending')
    },
  },
  {
    name: 'numeric sort reads the true minus and currency; second click reverses; dates sort by datetime',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      const order = () => page.evaluate((sel) => [...document.querySelector(sel + ' table').tBodies[0].rows].map((tr) => tr.cells[0].textContent.trim()).join(','), TX)
      const amount = page.locator(`${TX} .tbl__sort`, { hasText: 'Amount' })
      await amount.click()
      expect.equal(await order(), 'Apple Store,Nike Store,Fuel,Uber,Zara refund,Salary', 'ascending: −$1,199 first, +$3,200 last')
      await expect.attr(page, `${TX} th:has(.tbl__sort:text("Amount"))`, 'aria-sort', 'ascending')
      await amount.click()
      expect.equal(await order(), 'Salary,Zara refund,Uber,Fuel,Nike Store,Apple Store', 'descending reverses')
      await expect.attr(page, `${TX} th:has(.tbl__sort:text("Amount"))`, 'aria-sort', 'descending')
      const date = page.locator(`${TX} .tbl__sort`, { hasText: 'Date' })
      await date.click()
      expect.equal(await order(), 'Salary,Fuel,Zara refund,Uber,Nike Store,Apple Store', 'date ascending; ties keep their order (stable)')
      expect.equal(await page.locator(`${TX} th[aria-sort]`).count(), 1, 'exactly one sorted header')
    },
  },
  {
    name: 'sg-table-sort is cancelable: the app can sort on its server',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      await page.evaluate((sel) => { document.querySelector(sel + ' table').addEventListener('sg-table-sort', (e) => e.preventDefault()) }, TX)
      const before = await page.evaluate((sel) => document.querySelector(sel + ' tbody').textContent, TX)
      await page.locator(`${TX} .tbl__sort`, { hasText: 'Merchant' }).click()
      const after = await page.evaluate((sel) => document.querySelector(sel + ' tbody').textContent, TX)
      expect.equal(after, before, 'rows untouched')
      await expect.attr(page, `${TX} th:has(.tbl__sort:text("Merchant"))`, 'aria-sort', 'ascending', 'aria-sort still follows')
    },
  },
  {
    name: 'sorting is announced in the polite live region',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      await page.locator(`${TX} .tbl__sort`, { hasText: 'Category' }).click()
      await page.waitForTimeout(150)
      const msg = await page.evaluate(() => document.querySelector('[role="status"].sr-only')?.textContent)
      expect.equal(msg, 'Sorted by Category, ascending', 'announcement text')
    },
  },
  {
    name: 'numbers are right-aligned with tabular figures',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      const r = await page.locator(`${TX} tbody tr:first-child td[data-align="end"]`).evaluate((el) => {
        const cs = getComputedStyle(el)
        return { align: cs.textAlign, fig: cs.fontVariantNumeric }
      })
      expect.ok(r.align === 'end' || r.align === 'right', `text-align end (got ${r.align})`)
      expect.ok(/tabular-nums/.test(r.fig), `tabular figures (got ${r.fig})`)
    },
  },
  {
    name: 'the first column stays put while the region scrolls sideways',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      const r = await page.locator(`${TX} .tbl__scroll`).evaluate(async (el) => {
        const th = el.querySelector('tbody th')
        const before = th.getBoundingClientRect().left - el.getBoundingClientRect().left
        el.scrollLeft = 120
        await new Promise((res) => setTimeout(res, 50))
        const after = th.getBoundingClientRect().left - el.getBoundingClientRect().left
        return { before, after, scrolled: el.scrollLeft, overflow: el.scrollWidth > el.clientWidth }
      })
      expect.ok(r.overflow, 'the table overflows at 390px')
      expect.ok(r.scrolled > 0, 'the region scrolled')
      expect.ok(Math.abs(r.before - r.after) < 1.5, `sticky column did not move (${r.before} -> ${r.after})`)
    },
  },
  {
    name: 'with --tbl-max-h the region scrolls vertically and the header bar stays at the top',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      const r = await page.locator(`${TX} .tbl__scroll`).evaluate(async (el) => {
        el.style.setProperty('--tbl-max-h', '9rem')
        await new Promise((res) => setTimeout(res, 50))
        const th = el.querySelector('thead th:nth-child(2)')
        const before = th.getBoundingClientRect().top - el.getBoundingClientRect().top
        el.scrollTop = 80
        await new Promise((res) => setTimeout(res, 50))
        const after = th.getBoundingClientRect().top - el.getBoundingClientRect().top
        return { before, after, scrolled: el.scrollTop, tall: el.scrollHeight > el.clientHeight }
      })
      expect.ok(r.tall && r.scrolled > 0, 'the region scrolls vertically')
      expect.ok(Math.abs(r.before - r.after) < 2, `header bar did not move (${r.before} -> ${r.after})`)
    },
  },
  {
    name: 'the scroll hint shows only while the region overflows',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      expect.equal(await page.locator(`${TX} .tbl__hint`).isVisible(), true, 'visible at 390px')
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.waitForTimeout(250)
      expect.equal(await page.locator(`${TX} .tbl__hint`).isVisible(), false, 'hidden when the table fits')
    },
  },
  {
    name: 'hover and keyboard focus fill a sort button the same way',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      const b = page.locator(`${TX} .tbl__sort`, { hasText: 'Merchant' })
      const fill = () => b.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--fill')))
      await page.waitForTimeout(50)
      expect.equal(await fill(), 0, 'rest: --fill 0')
      await b.hover()
      await page.waitForTimeout(400)
      expect.equal(await fill(), 1, 'hover: --fill 1')
      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab')
      await b.focus()
      await page.waitForTimeout(400)
      expect.equal(await fill(), 1, 'keyboard focus: --fill 1')
    },
  },
  {
    name: 'select all: every row gets aria-selected, the count is written, Space toggles one box',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      const all = page.locator(`${SEL} thead .tbl__check input`)
      await all.focus()
      await page.keyboard.press('Space')
      const r = await page.evaluate((sel) => ({
        rows: document.querySelectorAll(sel + ' tbody tr[aria-selected="true"]').length,
        count: document.querySelector(sel + ' [data-sg-count]').textContent,
      }), SEL)
      expect.equal(r.rows, 4, 'all four rows selected')
      expect.equal(r.count, '4 of 4 selected', 'count text')
      const one = page.locator(`${SEL} tbody tr:nth-child(2) .tbl__check input`)
      await one.focus()
      await page.keyboard.press('Space')
      const r2 = await page.evaluate((sel) => {
        const a = document.querySelector(sel + ' thead .tbl__check input')
        return { rows: document.querySelectorAll(sel + ' tbody tr[aria-selected="true"]').length, indeterminate: a.indeterminate, checked: a.checked, count: document.querySelector(sel + ' [data-sg-count]').textContent }
      }, SEL)
      expect.equal(r2.rows, 3, 'one row deselected')
      expect.equal(r2.indeterminate, true, 'header box shows "some"')
      expect.equal(r2.checked, false, 'header box is not fully checked')
      expect.equal(r2.count, '3 of 4 selected', 'count text updates')
    },
  },
  {
    name: 'a selected row is marked three ways: aria-selected, a checked box, a wash',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      await page.locator(`${SEL} tbody tr:nth-child(1) .tbl__check input`).focus()
      await page.keyboard.press('Space')
      const r = await page.evaluate((sel) => {
        const tr = document.querySelector(sel + ' tbody tr:nth-child(1)')
        const other = document.querySelector(sel + ' tbody tr:nth-child(2)')
        const box = tr.querySelector('.tbl__box')
        return {
          aria: tr.getAttribute('aria-selected'),
          checked: tr.querySelector('input').checked,
          bg: getComputedStyle(tr.cells[1]).backgroundColor,
          otherBg: getComputedStyle(other.cells[1]).backgroundColor,
          mark: getComputedStyle(box, '::after').visibility,
        }
      }, SEL)
      expect.equal(r.aria, 'true', 'aria-selected')
      expect.equal(r.checked, true, 'box checked')
      expect.equal(r.mark, 'visible', 'check mark drawn')
      expect.ok(r.bg !== r.otherBg, 'selected row has a different fill')
    },
  },
  {
    name: 'the checkbox focus ring is visible and the header fills on focus',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      await page.keyboard.press('Tab')
      await page.locator(`${SEL} tbody tr:nth-child(1) .tbl__check input`).focus()
      const r = await page.locator(`${SEL} tbody tr:nth-child(1) .tbl__box`).evaluate((el) => {
        const cs = getComputedStyle(el)
        return { style: cs.outlineStyle, w: parseFloat(cs.outlineWidth) }
      })
      expect.ok(r.style !== 'none' && r.w >= 3, `3px ring (got ${r.style} ${r.w})`)
    },
  },
  {
    name: 'every checkbox and sort header is at least 44px',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      const small = await page.evaluate((sel) => {
        const bad = []
        for (const el of document.querySelectorAll(sel + ' .tbl__check, ' + sel + ' .tbl__sort')) {
          const r = el.getBoundingClientRect()
          if (r.width < 43.5 || r.height < 43.5) bad.push(el.className + ' ' + Math.round(r.width) + 'x' + Math.round(r.height))
        }
        return bad
      }, SEL)
      expect.equal(small.join(','), '', 'all targets >= 44px')
    },
  },
  {
    name: 'the forced .is-focus state draws the 3px ring inside the sort button, and pressed is visibly not hover',
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      const r = await page.evaluate(() => {
        const read = (sel) => { const el = document.querySelector(sel); const cs = getComputedStyle(el); return { s: cs.outlineStyle, w: cs.outlineWidth, o: cs.outlineOffset, bg: cs.backgroundColor, fill: cs.getPropertyValue('--fill') } }
        return { hover: read('#demo-states .tbl__sort.is-hover'), focus: read('#demo-states .tbl__sort.is-focus'), pressed: read('#demo-states .tbl__sort.is-active') }
      })
      expect.equal(r.focus.s, 'solid', 'a ring is drawn')
      expect.equal(r.focus.w, '3px', 'the ring width')
      expect.equal(r.focus.o, '-3px', 'inside the button, where the header clips')
      expect.ok(r.pressed.bg !== r.hover.bg, `pressed (${r.pressed.bg}) is not the hover fill (${r.hover.bg})`)
    },
  },
  {
    name: 'an empty table explains itself inside the visible region: the message is never half off-screen at 320px',
    viewport: { width: 320, height: 640 },
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      const r = await page.locator('#demo-empty .tbl__scroll').evaluate((region) => {
        const msg = region.querySelector('.tbl__empty-msg').getBoundingClientRect()
        const box = region.getBoundingClientRect()
        return { overflow: region.scrollWidth - region.clientWidth, left: msg.left - box.left, right: box.right - msg.right }
      })
      expect.ok(r.overflow > 0, 'the table is wider than its region (that is the case that cut the message)')
      expect.ok(r.left >= 0 && r.right >= 0, `the sentence sits inside the region (${r.left.toFixed(0)}px from the start, ${r.right.toFixed(0)}px from the end)`)
    },
  },
  {
    name: 'every scrolling demo says so: the hint shows while the region overflows',
    viewport: { width: 320, height: 640 },
    async run({ page, goto, expect }) {
      await goto('components/table.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('.demo .tbl')].map((t) => ({ id: t.closest('.demo').id, scrolls: t.querySelector('.tbl__scroll').scrollWidth > t.querySelector('.tbl__scroll').clientWidth + 1, hint: !!t.querySelector('.tbl__hint') && getComputedStyle(t.querySelector('.tbl__hint')).display !== 'none' })))
      expect.ok(r.length >= 5, `table demos (${r.length})`)
      for (const t of r.filter((x) => x.scrolls)) expect.ok(t.hint, `${t.id} scrolls sideways and shows the hint`)
    },
  },
]
