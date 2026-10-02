// Interaction spec for the calendar. See tests/components.mjs for the contract and tests/components/button.mjs for a model.
const M = '#demo-month .cal'
const cursorDate = (page) => page.evaluate(() => document.activeElement?.dataset?.date)

export const tests = [
  {
    name: 'renders a labelled grid: seven named columns, six weeks, the month as its name',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      const r = await page.locator(M).evaluate((el) => {
        const grid = el.querySelector('table')
        return {
          role: grid.getAttribute('role'),
          name: document.getElementById(grid.getAttribute('aria-labelledby')).textContent,
          cols: [...grid.tHead.rows[0].cells].map((c) => c.getAttribute('abbr')),
          days: grid.querySelectorAll('tbody .cal__day').length,
          rows: grid.tBodies[0].rows.length,
        }
      })
      expect.equal(r.role, 'grid', 'role=grid')
      expect.equal(r.name, 'October 2026', 'named by the month title')
      expect.equal(r.cols.join(','), 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday', 'Monday first, full names in abbr')
      expect.equal(r.days, 42, 'six weeks, always')
      expect.equal(r.rows, 6, 'six rows')
    },
  },
  {
    name: 'each day is a button named with its full date; today, events and the count are in the name',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      const r = await page.locator(M).evaluate((el) => {
        const name = (d) => el.querySelector(`.cal__day[data-date="${d}"]`).getAttribute('aria-label')
        return { today: name('2026-09-30'), chosen: name('2026-10-02'), plain: name('2026-10-07'), tag: el.querySelector('.cal__day').tagName }
      })
      expect.equal(r.tag, 'BUTTON', 'a real button')
      // The date comes from Intl.DateTimeFormat, and Chromium builds differ on the comma after the weekday
      // ("Wednesday, 30 September 2026" in CI's ICU, "Wednesday 30 September 2026" in another): either is the full date.
      expect.ok(/^Wednesday,? 30 September 2026, today, 2 events/.test(r.today), `today: ${r.today}`)
      expect.ok(/^Friday,? 2 October 2026, 3 events/.test(r.chosen), `chosen: ${r.chosen}`)
      expect.ok(/^Wednesday,? 7 October 2026$/.test(r.plain), `a quiet day is just its date: ${r.plain}`)
    },
  },
  {
    name: 'one tab stop in the grid (roving tabindex), after the two nav buttons',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      const r = await page.locator(M).evaluate((el) => ({ stops: el.querySelectorAll('.cal__day[tabindex="0"]').length, which: el.querySelector('.cal__day[tabindex="0"]').dataset.date, others: el.querySelectorAll('.cal__day[tabindex="-1"]').length }))
      expect.equal(r.stops, 1, 'exactly one day is tabbable')
      expect.equal(r.which, '2026-10-02', 'the chosen day')
      expect.equal(r.others, 41, 'the rest are -1')
      await page.locator(`${M} [data-cal="prev"]`).focus()
      await page.keyboard.press('Tab')
      await expect.focused(page, '[data-cal="next"]', 'prev then next')
      await page.keyboard.press('Tab')
      expect.equal(await cursorDate(page), '2026-10-02', 'then the grid, on the chosen day')
    },
  },
  {
    name: 'arrow keys move a day or a week and focus follows; in-view moves do not rebuild the buttons',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      await page.locator(`${M} .cal__day[tabindex="0"]`).focus()
      await page.evaluate(() => { window.__first = document.activeElement })
      await page.keyboard.press('ArrowRight')
      expect.equal(await cursorDate(page), '2026-10-03', 'right = +1 day')
      await page.keyboard.press('ArrowDown')
      expect.equal(await cursorDate(page), '2026-10-10', 'down = +1 week')
      await page.keyboard.press('ArrowLeft')
      expect.equal(await cursorDate(page), '2026-10-09', 'left = -1 day')
      await page.keyboard.press('ArrowUp')
      expect.equal(await cursorDate(page), '2026-10-02', 'up = -1 week')
      expect.equal(await page.evaluate(() => document.body.contains(window.__first)), true, 'the same button element is still in the page')
      expect.equal(await page.locator(`${M} .cal__day[tabindex="0"]`).count(), 1, 'still one tab stop')
    },
  },
  {
    name: 'Home and End go to the week edges; crossing a month edge pages the grid and keeps focus',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      await page.locator(`${M} .cal__day[tabindex="0"]`).focus()
      await page.keyboard.press('End')
      expect.equal(await cursorDate(page), '2026-10-04', 'End = Sunday')
      await page.keyboard.press('Home')
      expect.equal(await cursorDate(page), '2026-09-28', 'Home = Monday (which is in September)')
      expect.equal(await page.locator(`${M} .cal__title`).textContent(), 'September 2026', 'the grid paged to September')
      await expect.focused(page, '.cal__day', 'and focus is on a day')
    },
  },
  {
    name: 'PageUp / PageDown move a month and clamp the day; Shift moves a year',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      await page.locator(`${M} .cal__day[tabindex="0"]`).focus()
      await page.keyboard.press('PageDown')
      expect.equal(await cursorDate(page), '2026-11-02', 'next month, same day')
      await page.keyboard.press('PageUp')
      await page.keyboard.press('PageUp')
      expect.equal(await cursorDate(page), '2026-09-02', 'two back')
      await page.keyboard.press('Shift+PageDown')
      expect.equal(await cursorDate(page), '2027-09-02', 'Shift = a year')
      await page.evaluate(() => SG.calendar.select(document.querySelector('#demo-month .cal'), '2026-01-31'))
      await page.keyboard.press('PageDown')
      expect.equal(await cursorDate(page), '2026-02-28', 'the 31st clamps to the end of February')
    },
  },
  {
    name: 'Enter and Space choose a day: aria-selected moves, the events list changes, the event fires',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      await page.evaluate(() => { window.__sel = []; document.querySelector('#demo-month .cal').addEventListener('sg-calendar-select', (e) => window.__sel.push(e.detail.value)) })
      await page.locator(`${M} .cal__day[tabindex="0"]`).focus()
      await page.keyboard.press('ArrowLeft') // 1 Oct
      await page.keyboard.press('Enter')
      let r = await page.locator(M).evaluate((el) => ({ sel: [...el.querySelectorAll('td[aria-selected="true"] .cal__day')].map((b) => b.dataset.date), title: el.querySelector('.cal__events-title').textContent, items: [...el.querySelectorAll('.cal__event')].map((e) => e.querySelector('.cal__what').textContent), value: el.getAttribute('data-value') }))
      expect.equal(r.sel.join(), '2026-10-01', 'exactly one selected cell')
      expect.equal(r.items.join(), 'Dentist', 'that day\'s events')
      expect.ok(/Thursday,? 1 October/.test(r.title), r.title)
      expect.equal(r.value, '2026-10-01', 'data-value follows')
      await expect.focused(page, '.cal__day', 'focus stays on the day')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('Space')
      r = await page.locator(M).evaluate((el) => [...el.querySelectorAll('.cal__event .cal__what')].map((e) => e.textContent))
      expect.equal(r.join(), 'Standup,Design review,Rent due', 'Space chooses too')
      expect.equal(await page.evaluate(() => window.__sel.join()), '2026-10-01,2026-10-02', 'one event per choice')
    },
  },
  {
    name: 'today and the chosen day are marked by shape, not colour: ring, underline, fill, doubled frame',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      const r = await page.locator(M).evaluate((el) => {
        const today = el.querySelector('.cal__day[aria-current="date"]')
        const chosen = el.querySelector('td[aria-selected="true"] .cal__day')
        const plain = el.querySelector('.cal__day[data-date="2026-10-07"]')
        const cs = (e) => getComputedStyle(e)
        return {
          todayRing: cs(today).borderTopColor !== 'rgba(0, 0, 0, 0)' && cs(today).borderTopWidth === '2px',
          todayUnderline: cs(today.querySelector('.cal__num')).textDecorationLine,
          plainRing: cs(plain).borderTopColor,
          chosenBg: cs(chosen).backgroundColor, plainBg: cs(plain).backgroundColor,
          chosenShadow: cs(chosen).boxShadow,
          chosenInk: cs(chosen).color, plainInk: cs(plain).color,
        }
      })
      expect.ok(r.todayRing, 'today has a 2px ring')
      expect.equal(r.todayUnderline, 'underline', 'today\'s numeral is underlined')
      expect.equal(r.plainRing, 'rgba(0, 0, 0, 0)', 'an ordinary day has no frame at rest')
      expect.ok(r.chosenBg !== r.plainBg, 'the chosen day is filled')
      expect.ok(/0px 0px 0px 2px inset/.test(r.chosenShadow), `doubled frame, drawn inward (${r.chosenShadow})`)
      expect.ok(r.chosenInk !== r.plainInk, 'and its numeral inverts')
    },
  },
  {
    name: 'event markers are decorative squares (max three); the count is in the name and the list is text',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      const r = await page.locator(M).evaluate((el) => {
        const d = (x) => el.querySelector(`.cal__day[data-date="${x}"]`)
        return { two: d('2026-09-30').querySelectorAll('.cal__pip').length, three: d('2026-10-02').querySelectorAll('.cal__pip').length, none: d('2026-10-07').querySelectorAll('.cal__pip').length, hidden: d('2026-10-02').querySelector('.cal__pips').getAttribute('aria-hidden') }
      })
      expect.equal(r.two, 2, 'two events, two squares')
      expect.equal(r.three, 3, 'three')
      expect.equal(r.none, 0, 'none')
      expect.equal(r.hidden, 'true', 'decorative')
    },
  },
  {
    name: 'paging with the round buttons announces the month and keeps focus on the button',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      const next = page.locator(`${M} [data-cal="next"]`)
      await next.focus()
      await page.keyboard.press('Enter')
      await expect.focused(page, '[data-cal="next"]', 'focus stays so you can page again')
      expect.equal(await page.locator(`${M} .cal__title`).textContent(), 'November 2026', 'title changed')
      const live = await page.locator(`${M} .cal__title`).evaluate((e) => [e.getAttribute('aria-live'), e.getAttribute('aria-atomic')])
      expect.equal(live.join(), 'polite,true', 'the title is a polite live region')
      await page.keyboard.press('Enter')
      expect.equal(await page.locator(`${M} .cal__title`).textContent(), 'December 2026', 'and again')
      expect.equal(await page.locator(`${M} [data-cal="prev"]`).getAttribute('aria-label'), 'Previous month', 'buttons are named')
    },
  },
  {
    name: 'the week starts where the locale or data-first-day says, and names come from Intl',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      const heads = (sel) => page.locator(sel).evaluate((el) => [...el.querySelector('thead').rows[0].cells].map((c) => c.getAttribute('abbr')).join(','))
      expect.ok((await heads('#demo-sunday .cal')).startsWith('Sunday,Monday'), 'en-US starts on Sunday')
      expect.ok((await heads('#demo-month .cal')).startsWith('Monday,Tuesday'), 'data-first-day=1 starts on Monday')
      expect.ok((await heads('#demo-locale .cal')).startsWith('Montag,Dienstag'), 'de-DE names')
      expect.equal(await page.locator('#demo-locale .cal__title').textContent(), 'Oktober 2026', 'German month')
    },
  },
  {
    name: 'days outside data-min / data-max are aria-disabled, reachable, and cannot be chosen',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      const R = '#demo-range .cal'
      const r = await page.locator(R).evaluate((el) => ({ off: el.querySelector('.cal__day[data-date="2026-09-10"]').getAttribute('aria-disabled'), on: el.querySelector('.cal__day[data-date="2026-09-15"]').getAttribute('aria-disabled'), label: el.querySelector('.cal__day[data-date="2026-09-10"]').getAttribute('aria-label') }))
      expect.equal(r.off, 'true', 'before min')
      expect.equal(r.on, null, 'inside')
      expect.ok(/not available/.test(r.label), `the name says so (${r.label})`)
      await page.locator(`${R} .cal__day[data-date="2026-09-15"]`).focus()
      for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft')
      // the cursor is clamped at the minimum: it never lands before 14 September
      const at = await cursorDate(page)
      expect.ok(at >= '2026-09-14', `clamped at min (${at})`)
      const before = await page.locator(R).getAttribute('data-value')
      await page.locator(`${R} .cal__day[data-date="2026-09-13"]`).focus()
      await page.keyboard.press('Enter')
      expect.equal(await page.locator(R).getAttribute('data-value'), before, 'Enter on an unavailable day does nothing')
    },
  },
  {
    name: 'week view: seven days, weekday names in the day, Page keys move a week, title is a range',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      const W = '#demo-week .cal'
      const r = await page.locator(W).evaluate((el) => ({ days: el.querySelectorAll('.cal__day').length, title: el.querySelector('.cal__title').textContent, dow: el.querySelector('.cal__day .cal__dow .cal__dow-long')?.textContent, head: getComputedStyle(el.querySelector('thead')).position, prev: el.querySelector('[data-cal="prev"]').getAttribute('aria-label') }))
      expect.equal(r.days, 7, 'seven days')
      expect.ok(/28 Sep.*4 Oct 2026/.test(r.title.replace(/\u00a0/g, ' ')), `range title: ${r.title}`)
      expect.ok(/28\u00a0Sept?/.test(r.title) && /4\u00a0Oct\u00a02026/.test(r.title), 'each date is kept whole (no-break spaces); the range breaks only at its dash')
      expect.equal(r.dow, 'Mon', 'the name is in the pill')
      expect.equal(r.head, 'absolute', 'the real header stays for screen readers, visually hidden')
      expect.equal(r.prev, 'Previous week', 'buttons say week')
      await page.locator(`${W} .cal__day[tabindex="0"]`).focus()
      await page.keyboard.press('PageDown')
      expect.equal(await cursorDate(page), '2026-10-09', 'PageDown = +1 week')
      expect.ok(/5.*11 Oct 2026/.test((await page.locator(`${W} .cal__title`).textContent()).replace(/\u00a0/g, ' ')), 'and the title follows')
    },
  },
  {
    name: 'right-to-left mirrors the arrow keys',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      await page.locator(M).evaluate((el) => { el.setAttribute('dir', 'rtl') })
      await page.locator(`${M} .cal__day[tabindex="0"]`).focus()
      await page.keyboard.press('ArrowRight')
      expect.equal(await cursorDate(page), '2026-10-01', 'right goes back a day in RTL')
    },
  },
  {
    name: 'choosing a day from a neighbouring month moves the grid to it',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      await page.locator(`${M} .cal__day[data-date="2026-11-01"]`).click()
      expect.equal(await page.locator(`${M} .cal__title`).textContent(), 'November 2026', 'the month changed')
      expect.equal(await page.locator(M).getAttribute('data-value'), '2026-11-01', 'and the day is chosen')
    },
  },
  {
    name: 'every day cell is a 44px-tall target at least 40px wide at 390px',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      const r = await page.locator(M).evaluate((el) => {
        const btn = el.querySelector('.cal__day')
        const cell = btn.parentElement.getBoundingClientRect()
        const b = btn.getBoundingClientRect()
        const hit = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === btn || btn.contains(t)) }
        btn.scrollIntoView({ block: 'center' })
        const c = btn.getBoundingClientRect()
        const cx = c.left + c.width / 2, cy = c.top + c.height / 2
        return { cellW: cell.width, cellH: cell.height, drawnW: b.width, up: hit(cx, cy - 21), down: hit(cx, cy + 21) }
      })
      expect.ok(r.cellW >= 40, `cell width ${r.cellW}`)
      expect.ok(r.cellH >= 44, `cell height ${r.cellH}`)
      expect.ok(r.drawnW <= 41, 'the drawn circle is at most 40px')
      expect.ok(r.up && r.down, 'the hit area reaches 44px tall')
    },
  },
  {
    name: 'hover and keyboard focus lift a day the same way; pressing sinks it',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      const b = page.locator(`${M} .cal__day[data-date="2026-10-14"]`)
      const nums = () => b.evaluate((el) => ({ lift: Number(getComputedStyle(el).getPropertyValue('--lift')), fill: Number(getComputedStyle(el).getPropertyValue('--fill')) }))
      await page.waitForTimeout(50)
      expect.equal((await nums()).lift, 0, 'rest')
      await b.hover()
      await page.waitForTimeout(400)
      expect.equal((await nums()).lift, 1, 'hover lifts')
      expect.equal((await nums()).fill, 0, 'hover is an outline: the solid fill is the chosen day\'s alone')
      await page.mouse.down()
      await page.waitForTimeout(300)
      expect.equal((await nums()).lift, 0, 'pressed sinks')
      expect.equal((await nums()).fill, 0.15, 'pressed: a light tint, at once')
      await page.mouse.move(0, 0)
      await page.mouse.up()
      const chosen = await page.locator(`${M} td[aria-selected="true"] > .cal__day`).evaluate((el) => { el.classList.add('is-active'); return Number(getComputedStyle(el).getPropertyValue('--fill')) })
      expect.equal(chosen, 1, 'the chosen day stays filled while pressed')
    },
  },
  {
    name: 'unavailable days are quiet: no frame, a faint numeral struck through',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      const r = await page.locator('#demo-range .cal .cal__day[data-date="2026-09-10"]').evaluate((el) => {
        const cs = getComputedStyle(el), n = getComputedStyle(el.querySelector('.cal__num'))
        return { border: cs.borderTopColor, style: cs.borderTopStyle, deco: n.textDecorationLine }
      })
      expect.equal(r.border, 'rgba(0, 0, 0, 0)', 'no frame round an unavailable day')
      expect.ok(r.style !== 'dashed', 'no dashed circle')
      expect.equal(r.deco, 'line-through', 'struck through: a cue that is not colour')
    },
  },
  {
    name: 'the chosen day\'s events share one time column, so their titles line up',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      const r = await page.locator('#demo-month .cal__event .cal__what').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)))
      expect.ok(r.length >= 3, `three events (${r.length})`)
      expect.equal(new Set(r).size, 1, `titles start at one x (${r.join(', ')})`)
    },
  },
  {
    name: 'at 200% text the head stays one row and every day is a circle that holds its numeral',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.waitForTimeout(300)
      for (const id of ['#demo-month', '#demo-range', '#demo-locale']) {
        const r = await page.locator(`${id} .cal`).evaluate((cal) => {
          const head = [...cal.querySelector('.cal__head').children].map((c) => c.getBoundingClientRect())
          const mid = (b) => b.top + b.height / 2
          const days = [...cal.querySelectorAll('.cal__day')].map((d) => { const b = d.getBoundingClientRect(), n = d.querySelector('.cal__num').getBoundingClientRect(); return { w: b.width, h: b.height, fits: n.width <= d.clientWidth + 0.5 } })
          return { oneRow: Math.abs(mid(head[0]) - mid(head[2])) < 2 && head[1].left > head[0].right && head[2].left > head[1].right, ovals: days.filter((d) => Math.abs(d.w - d.h) > 1.5).length, spill: days.filter((d) => !d.fits).length }
        })
        expect.ok(r.oneRow, `${id}: [prev] [month] [next] on one row`)
        expect.equal(r.ovals, 0, `${id}: every day is round`)
        expect.equal(r.spill, 0, `${id}: every numeral fits inside its circle`)
      }
    },
  },
  {
    name: 'a week strip that cannot give seven 44px days scrolls with snap, and shows the chosen day',
    viewport: { width: 320, height: 800 },
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.waitForTimeout(400)
      const r = await page.locator('#demo-week .cal').evaluate((cal) => {
        const box = cal.querySelector('.cal__scroll'), b = box.getBoundingClientRect()
        const td = cal.querySelector('td[aria-selected="true"]').getBoundingClientRect()
        return { scrolls: box.scrollWidth > box.clientWidth + 1, snap: getComputedStyle(box).scrollSnapType, cell: cal.querySelector('tbody td').getBoundingClientRect().width, inView: td.left >= b.left - 1 && td.right <= b.right + 1 }
      })
      expect.ok(r.scrolls, 'the strip scrolls')
      expect.ok(/x/.test(r.snap), `with snap (${r.snap})`)
      expect.ok(r.cell >= 42.9, `days keep their width (${r.cell.toFixed(1)}px)`)
      expect.ok(r.inView, 'the chosen day is in view')
    },
  },
  {
    name: 'reduced motion: no travel, the frame still appears',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      const b = page.locator(`${M} .cal__day[data-date="2026-10-14"]`)
      await b.hover()
      await page.waitForTimeout(500)
      const r = await b.evaluate((el) => ({ t: getComputedStyle(el).transform, bc: getComputedStyle(el).borderTopColor }))
      expect.ok(r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)', `no travel (${r.t})`)
      expect.ok(r.bc !== 'rgba(0, 0, 0, 0)', 'the frame appears')
    },
  },
  {
    name: 'forced colours: days keep a frame, the chosen day a heavy one',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      await page.emulateMedia({ forcedColors: 'active' })
      await page.waitForTimeout(100)
      const r = await page.locator(M).evaluate((el) => ({ rest: getComputedStyle(el.querySelector('.cal__day[data-date="2026-10-07"]')).borderTopWidth, chosen: getComputedStyle(el.querySelector('td[aria-selected="true"] .cal__day')).borderTopWidth, today: getComputedStyle(el.querySelector('[aria-current="date"] .cal__num')).textDecorationLine }))
      expect.equal(r.rest, '2px', 'rest has a frame')
      expect.equal(r.chosen, '4px', 'chosen is heavy')
      expect.equal(r.today, 'underline', 'today is still underlined')
    },
  },
  {
    name: '200% text keeps seven columns without clipping',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.waitForTimeout(200)
      const r = await page.locator(M).evaluate((el) => {
        const g = el.querySelector('table').getBoundingClientRect()
        const days = [...el.querySelectorAll('tbody tr:first-child .cal__day')].map((d) => d.getBoundingClientRect())
        const narrow = getComputedStyle(el.querySelector('.cal__dow-narrow')).display
        return { over: el.scrollWidth > el.clientWidth + 1, cols: days.length, allInside: days.every((d) => d.left >= g.left - 1 && d.right <= g.right + 1), narrow }
      })
      expect.equal(r.over, false, 'no horizontal overflow')
      expect.ok(r.allInside, 'all seven days sit inside the grid')
      expect.equal(r.narrow, 'inline', 'weekday names shrink to one letter')
    },
  },
  {
    name: 'a day is drawn inside its column less its doubled frame, and a focused or forced-focus day wears a whole ring above its neighbours',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      for (const w of [390, 320]) {
        await page.setViewportSize({ width: w, height: 800 })
        await page.waitForTimeout(150)
        const r = await page.evaluate(() => [...document.querySelectorAll('#demo-month td[aria-selected="true"] > .cal__day, #demo-week td[aria-selected="true"] > .cal__day')].map((d) => {
          const td = d.closest('td').getBoundingClientRect(), b = d.getBoundingClientRect(), bw = parseFloat(getComputedStyle(d).borderTopWidth)
          return { over: b.width + 2 * bw - td.width }
        }))
        expect.ok(r.length >= 2, 'a chosen day in the month and in the week strip')
        for (const x of r) expect.ok(x.over <= 0.5, `${w}px: the chosen day plus its outer frame is wider than its column by ${x.over.toFixed(1)}px`)
      }
      // keyboard focus on the chosen day: it paints above its neighbours (they have opaque paper backgrounds) and keeps the ring
      await page.setViewportSize({ width: 390, height: 800 })
      await page.locator('#demo-week td[aria-selected="true"] .cal__day').focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      const f = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { cls: document.activeElement.className, z: cs.zIndex, outline: cs.outlineStyle + ' ' + cs.outlineWidth, shadow: cs.boxShadow } })
      expect.ok(/cal__day/.test(f.cls), 'a day has focus')
      expect.ok(Number(f.z) >= 1, `the focused day is above its neighbours (z-index ${f.z})`)
      expect.equal(f.outline, 'solid 3px', 'the ring')
      // the forced Focus specimen draws the same ring a real focus does, not only the lift
      const s = await page.locator('#demo-states .cal__day.is-focus').evaluate((el) => { const cs = getComputedStyle(el); return cs.outlineStyle + ' ' + cs.outlineWidth })
      expect.equal(s, 'solid 3px', 'is-focus shows the focus ring')
    },
  },
  {
    name: 'the States specimens wrap in a grid and never overprint their names, at 320px and at 200% text',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      for (const [w, pct] of [[320, 100], [390, 200]]) {
        await page.setViewportSize({ width: w, height: 800 })
        await page.addStyleTag({ content: `html{font-size:${pct}%!important}` })
        await page.waitForTimeout(200)
        const r = await page.locator('#demo-states').evaluate((el) => {
          const names = [...el.querySelectorAll('.t-meta')].map((n) => n.getBoundingClientRect())
          let clash = 0
          for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
            const a = names[i], b = names[j]
            if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) clash++
          }
          const cal = el.querySelector('.cal').getBoundingClientRect()
          return { n: names.length, clash, inside: names.every((n) => n.left >= cal.left && n.right <= cal.right), over: el.querySelector('.cal').scrollWidth > el.querySelector('.cal').clientWidth + 1 }
        })
        expect.equal(r.n, 12, `${w}px ${pct}%: twelve specimens, each with its name`)
        expect.equal(r.clash, 0, `${w}px ${pct}%: no two names overlap`)
        expect.ok(r.inside && !r.over, `${w}px ${pct}%: names stay inside the frame`)
      }
    },
  },
  {
    name: 'today, the chosen day and every other marker share one outer size, and two neighbouring markers keep 4px between them',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      for (const [w, pct] of [[390, 100], [320, 100], [390, 200], [320, 200]]) {
        await page.setViewportSize({ width: w, height: 900 })
        await page.addStyleTag({ content: `html{font-size:${pct}%!important}` })
        await page.waitForTimeout(300)
        const r = await page.evaluate(() => ['#demo-month', '#demo-sunday', '#demo-week'].map((id) => {
          const el = document.querySelector(id + ' .cal')
          const today = el.querySelector('.cal__day[aria-current="date"]'), chosen = el.querySelector('td[aria-selected="true"] > .cal__day')
          const a = today.getBoundingClientRect(), b = chosen.getBoundingClientRect()
          // nothing is painted outside the chosen day at rest: its only spread shadow is the inset second frame
          const outer = getComputedStyle(chosen).boxShadow.split(/,(?![^(]*\))/).filter((x) => !/inset/.test(x) && !/rgba\(0, 0, 0, 0\)/.test(x) && /\b[1-9]\d*(\.\d+)?px\s*$/.test(x.trim().replace(/^.*\)\s*/, '')))
          const next = today.closest('td').nextElementSibling
          const gap = next && next.contains(chosen) ? b.left - a.right : null
          return { id, tw: a.width, cw: b.width, th: a.height, ch: b.height, outer: outer.length, gap }
        }))
        for (const x of r) {
          const at = `${w}px ${pct}% ${x.id}`
          expect.ok(Math.abs(x.tw - x.cw) < 0.5 && Math.abs(x.th - x.ch) < 0.5, `${at}: today ${x.tw.toFixed(1)}x${x.th.toFixed(1)}, chosen ${x.cw.toFixed(1)}x${x.ch.toFixed(1)}: one size`)
          expect.equal(x.outer, 0, `${at}: the chosen day draws nothing outside itself at rest`)
          if (x.gap !== null) expect.ok(x.gap >= 3.5, `${at}: today and the chosen day beside it are ${x.gap.toFixed(1)}px apart`)
        }
      }
    },
  },
  {
    name: 'the weekday bar under the month head is square; it follows the frame\'s curve only when it is the first row',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      await page.evaluate(() => document.documentElement.setAttribute('data-corners', 'soft'))
      await page.waitForTimeout(100)
      const r = await page.evaluate(() => {
        const el = document.querySelector('#demo-month .cal')
        const th = el.querySelector('thead th')
        const before = getComputedStyle(th).borderStartStartRadius
        el.querySelector('.cal__head').hidden = true
        const after = getComputedStyle(th).borderStartStartRadius
        el.querySelector('.cal__head').hidden = false
        return { before, after }
      })
      expect.equal(r.before, '0px', 'under the head: square (no dark notches at its ends)')
      expect.ok(r.after !== '0px', `the head hidden, the bar is the first row and follows the frame (${r.after})`)
    },
  },
  {
    name: 'a scrolled week strip shows part of a day at its start edge too, so the days before it read as "more"',
    async run({ page, goto, expect }) {
      await goto('components/calendar.html')
      await page.setViewportSize({ width: 320, height: 900 })
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.waitForTimeout(500)
      const r = await page.locator('#demo-week .cal').evaluate((el) => {
        const box = el.querySelector('.cal__scroll'), a = box.getBoundingClientRect()
        const vis = [...el.querySelectorAll('tbody td')].map((td) => { const b = td.getBoundingClientRect(); return Math.max(0, Math.min(b.right, a.right) - Math.max(b.left, a.left)) / b.width })
        const chosen = el.querySelector('td[aria-selected="true"]').getBoundingClientRect()
        return { scrolled: box.scrollLeft, atEnd: box.scrollLeft + box.clientWidth >= box.scrollWidth - 1, vis, chosenIn: chosen.left >= a.left - 0.5 && chosen.right <= a.right + 0.5, title: el.querySelector('.cal__title').textContent }
      })
      expect.ok(r.scrolled > 0, 'the strip had to scroll to show the chosen day')
      expect.ok(r.chosenIn, 'the chosen day is whole and in view')
      const first = r.vis.findIndex((v) => v > 0.02)
      expect.ok(r.vis[first] >= 0.4 && r.vis[first] <= 0.8, `the first day in view is cut, part of it showing (${r.vis.map((v) => v.toFixed(2)).join(' ')})`)
      if (!r.atEnd) {
        const last = r.vis.length - 1 - [...r.vis].reverse().findIndex((v) => v > 0.02)
        expect.ok(r.vis[last] >= 0.4 && r.vis[last] <= 0.8, 'and so is the last')
      }
    },
  },
]
