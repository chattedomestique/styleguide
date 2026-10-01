// Interaction spec for the agenda. See tests/components.mjs for the contract and tests/components/button.mjs for a model.
const DAYS = '#demo-days'
const GRID = '#demo-grid'

// contrast of two CSS colours (any syntax the browser understands), resolved through a canvas in the page
const contrast = (page, a, b) => page.evaluate(([x, y]) => {
  const c = document.createElement('canvas'); c.width = c.height = 1
  const g = c.getContext('2d', { willReadFrequently: true })
  const rgb = (col) => { g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = col; g.fillRect(0, 0, 1, 1); return [...g.getImageData(0, 0, 1, 1).data].slice(0, 3) }
  const lum = ([r, gg, bb]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(bb) }
  const l1 = lum(rgb(x)), l2 = lum(rgb(y))
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}, [a, b])

export const tests = [
  {
    name: 'each day is a tonal Card labelled by its date; its events are a list of links that state their own times',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      const r = await page.locator(DAYS).evaluate((el) => {
        const day = el.querySelector('.agenda__day')
        const links = [...el.querySelectorAll('.agenda__event')]
        return { card: day.classList.contains('card'), tone: day.dataset.tone, time: day.querySelector('time').getAttribute('datetime'), links: links.length, body: getComputedStyle(day.querySelector('.card__body')).display }
      })
      expect.ok(r.card, 'built on .card')
      expect.equal(r.tone, '1', 'has a tone')
      expect.equal(r.time, '2026-09-30', 'the date is a <time>')
      expect.equal(r.links, 7, 'seven events (one is all day)')
      expect.equal(r.body, 'grid', 'the body is a grid (beats Card\'s flex)')
      // the accessible name (computed by the browser's own rules) is the title followed by both times
      expect.equal(await page.getByRole('link', { name: /^Design review\s+14:00\s+–\s+15:30$/ }).count(), 1, 'the link is named with its times')
    },
  },
  {
    name: 'two events in the same hour stack in one column, in time order',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      const r = await page.locator(DAYS).evaluate((el) => {
        const slot = [...el.querySelectorAll('.agenda__slot')].find((s) => s.querySelector('.agenda__hour').textContent.trim() === '14:00')
        const [a, b] = [...slot.querySelectorAll('.agenda__event')].map((e) => e.getBoundingClientRect())
        return { n: slot.querySelectorAll('.agenda__event').length, aBottom: a.bottom, bTop: b.top, sameX: Math.abs(a.left - b.left) < 1, sameW: Math.abs(a.width - b.width) < 1 }
      })
      expect.equal(r.n, 2, 'two events')
      expect.ok(r.bTop >= r.aBottom, 'the second sits under the first, no overlap')
      expect.ok(r.sameX && r.sameW, 'same column')
    },
  },
  {
    name: 'hours are rows on a phone and columns once the card is 34rem wide',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      const layout = () => page.locator(DAYS).evaluate((el) => {
        const d = el.querySelectorAll('.agenda__day')[0]
        const slots = [...d.querySelectorAll('.agenda__slot')].map((s) => s.getBoundingClientRect())
        const date = d.querySelector('.agenda__date').getBoundingClientRect()
        return { sameRow: Math.abs(slots[0].top - slots[1].top) < 2, rail: slots[0].left > date.right - 2 && slots[0].top < date.bottom, cardW: d.getBoundingClientRect().width }
      })
      const narrow = await layout()
      expect.equal(narrow.sameRow, false, 'phone: one hour under the next')
      expect.equal(narrow.rail, false, 'phone: date above the hours')
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.waitForTimeout(250)
      const wide = await layout()
      expect.ok(wide.cardW > 34 * 16, `card is wide (${wide.cardW})`)
      expect.equal(wide.sameRow, true, 'wide: hours side by side')
      expect.equal(wide.rail, true, 'wide: the date is a rail on the left')
    },
  },
  {
    name: 'chips wear the card tone, darker, with text at least 7:1 on them',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      const r = await page.locator(DAYS).evaluate((el) => [...el.querySelectorAll('.agenda__day')].flatMap((d) => [...d.querySelectorAll('.agenda__event')].map((a) => ({ chip: getComputedStyle(a).backgroundColor, ink: getComputedStyle(a).color, card: getComputedStyle(d).backgroundColor }))))
      expect.equal(r.length, 7, 'seven chips')
      for (const c of r) {
        expect.ok(c.chip !== c.card, 'the chip differs from the card')
        const k = await contrast(page, c.chip, c.ink)
        expect.ok(k >= 7, `chip text ${k.toFixed(2)}:1`)
      }
    },
  },
  {
    name: 'a chip lifts on hover and on keyboard focus the same way, and sinks when pressed',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      const a = page.locator(`${DAYS} .agenda__event`).first()
      const lift = () => a.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--lift')))
      await page.waitForTimeout(50)
      expect.equal(await lift(), 0, 'rest')
      await a.hover()
      await page.waitForTimeout(400)
      expect.equal(await lift(), 1, 'hover')
      await page.mouse.down()
      await page.waitForTimeout(300)
      expect.equal(await lift(), 0, 'pressed')
      await page.mouse.up()
      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab')
      await a.focus()
      await page.waitForTimeout(400)
      expect.equal(await lift(), 1, 'keyboard focus')
      expect.equal(await a.evaluate((el) => parseFloat(getComputedStyle(el).outlineWidth)), 3, '3px ring')
    },
  },
  {
    name: 'time grid: events sit on the quarter-hour rows they say, and heights follow durations',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      const r = await page.locator(GRID).evaluate((el) => {
        const events = el.querySelector('.agenda-day__events').getBoundingClientRect()
        const step = events.height / 24
        const box = (title) => { const li = [...el.querySelectorAll('.agenda-day__event')].find((e) => e.querySelector('.card__title').textContent.trim() === title); const b = li.getBoundingClientRect(); return { top: (b.top - events.top) / step, rows: b.height / step, left: b.left, right: b.right } }
        return { step, standup: box('Standup'), review: box('Design review'), deck: box('Slide deck'), lunch: box('Lunch with Sam'), study: box('Study block') }
      })
      expect.ok(Math.abs(r.standup.top - 2) < 0.05 && Math.abs(r.standup.rows - 2) < 0.05, `Standup starts 30 min in and lasts 30: ${JSON.stringify(r.standup)}`)
      expect.ok(Math.abs(r.review.top - 4) < 0.05 && Math.abs(r.review.rows - 6) < 0.05, 'Design review 10:00 for 90 min')
      expect.ok(Math.abs(r.study.rows - 6) < 0.05, 'Study block is 90 min too')
      expect.ok(Math.abs(r.lunch.top - 14) < 0.05, 'Lunch at 12:30')
      expect.ok(r.step >= 26, `a quarter hour is tall enough to read (${r.step}px)`)
    },
  },
  {
    name: 'overlapping events sit side by side in lanes; events that overlap nothing take the full width',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      const r = await page.locator(GRID).evaluate((el) => {
        const get = (title) => [...el.querySelectorAll('.agenda-day__event')].find((e) => e.querySelector('.card__title').textContent.trim() === title).getBoundingClientRect()
        return { review: get('Design review'), deck: get('Slide deck'), standup: get('Standup'), study: get('Study block'), call: get('Call with landlord') }
      })
      expect.ok(r.deck.left >= r.review.right, 'the slide deck is in the second lane, to the right of the review')
      expect.ok(r.deck.top >= r.review.top && r.deck.bottom <= r.review.bottom, 'and sits inside its hours')
      expect.ok(r.call.left >= r.study.right, 'the call is beside the study block')
      expect.ok(r.standup.width > r.review.width * 1.8, `Standup (alone) spans both lanes: ${Math.round(r.standup.width)} vs ${Math.round(r.review.width)}`)
    },
  },
  {
    name: 'no event loses its time line: a half-hour event in a narrow lane keeps title and times inside its frame, at any width and text size',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      // for every event in the demo: the times (the last thing in the card) end inside the border box, and do not run past its side
      const lost = (sel) => page.locator(sel).evaluate((el) => [...el.querySelectorAll('.agenda-day__event')].flatMap((e) => {
        const b = e.getBoundingClientRect(), bw = parseFloat(getComputedStyle(e).borderBottomWidth), m = e.querySelector('.card__meta').getBoundingClientRect()
        const t = e.querySelector('.card__title')
        const out = []
        if (m.bottom > b.bottom - bw + 0.5) out.push(e.querySelector('.card__title').textContent.trim() + ': time line below the frame by ' + (m.bottom - (b.bottom - bw)).toFixed(1))
        if (m.right > b.right - bw + 0.5) out.push(e.querySelector('.card__title').textContent.trim() + ': time line past the side by ' + (m.right - (b.right - bw)).toFixed(1))
        if (t.scrollHeight > t.clientHeight + 1 && t.getBoundingClientRect().bottom > m.top + 0.5) out.push('title overlaps the time line')
        return out
      }))
      // the 390px phone (the Friday grid sits in a ~19rem column: two lanes of ~7.5rem)
      expect.equal((await lost(GRID)).join('; '), '', 'phone width, the Friday grid')
      // the same day while the column is dragged from 15rem to 28rem (below 16rem it stacks; every width in between has to hold)
      for (const rem of [15, 16, 16.5, 17.5, 19, 21, 24, 28]) {
        await page.locator('#demo-stack .resize-box').evaluate((b, r) => { b.style.inlineSize = r + 'rem' }, rem)
        await page.waitForTimeout(60)
        const l = await lost('#demo-stack')
        expect.equal(l.join('; '), '', `column ${rem}rem wide`)
      }
      // and the quarter-hour scale is still a fixed rem length at normal text: a half hour is two steps
      const step = await page.locator(GRID).evaluate((el) => {
        const ev = [...el.querySelectorAll('.agenda-day__event')].find((e) => e.querySelector('.card__title').textContent.trim() === 'Call with landlord')
        return ev.getBoundingClientRect().height / parseFloat(getComputedStyle(document.documentElement).fontSize)
      })
      expect.ok(Math.abs(step - 4) < 0.05, `a 30-minute event is 4rem tall (${step.toFixed(2)})`)
      // bigger text: still nothing lost in the Friday grid (it stacks, or it fits)
      for (const pct of [125, 150, 200]) {
        await page.addStyleTag({ content: `html{font-size:${pct}%!important}` })
        await page.waitForTimeout(120)
        expect.equal((await lost(GRID)).join('; '), '', `${pct}% text, the Friday grid`)
      }
    },
  },
  {
    name: 'the ruler is decorative; DOM and tab order are chronological; one tab stop per event',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      const r = await page.locator(GRID).evaluate((el) => ({ hidden: el.querySelector('.agenda-day__hours').getAttribute('aria-hidden'), order: [...el.querySelectorAll('.agenda-day__event time')].filter((t, i) => i % 2 === 0).map((t) => t.getAttribute('datetime')), stops: el.querySelectorAll('.agenda-day a[href], .agenda-day [tabindex="0"]').length }))
      expect.equal(r.hidden, 'true', 'the ruler is aria-hidden')
      expect.equal(r.order.join(), '09:30,10:00,10:30,12:30,13:30,14:00', 'start times ascend through the DOM')
      expect.equal(r.stops, 6, 'six events, six tab stops')
      await page.locator(`${GRID} .card__link`).first().focus()
      await page.keyboard.press('Tab')
      const second = await page.evaluate(() => document.activeElement.textContent.trim())
      expect.equal(second, 'Design review', 'Tab goes to the next event in time')
    },
  },
  {
    name: 'an event card is one link: the whole card is the target and wears the ring',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      const r = await page.locator(`${GRID} .agenda-day__event`).nth(1).evaluate((li) => {
        const b = li.getBoundingClientRect()
        li.scrollIntoView({ block: 'center' })
        const c = li.getBoundingClientRect()
        const hit = document.elementFromPoint(c.left + c.width * 0.8, c.top + c.height * 0.85)
        return { h: b.height, hit: hit && (hit.closest('.card__link') ? 'link' : hit.className) }
      })
      expect.ok(r.h >= 44, `event is at least 44px tall (${r.h})`)
      expect.equal(r.hit, 'link', 'a click anywhere on the card lands on the link')
      await page.locator(`${GRID} .card__link`).first().focus()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Shift+Tab')
      const ring = await page.locator(`${GRID} .agenda-day__event`).first().evaluate((el) => parseFloat(getComputedStyle(el).outlineWidth))
      expect.ok(ring >= 3, `the card wears a ring (${ring})`)
    },
  },
  {
    name: 'when the lanes do not fit, events stack in time order and the ruler goes',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      const stack = await page.locator('#demo-stack').evaluate((el) => {
        const evs = [...el.querySelectorAll('.agenda-day__event')].map((e) => e.getBoundingClientRect())
        return { ruler: getComputedStyle(el.querySelector('.agenda-day__hours')).display, sameLeft: evs.every((e) => Math.abs(e.left - evs[0].left) < 1), ordered: evs.every((e, i) => i === 0 || e.top >= evs[i - 1].bottom - 1), n: evs.length }
      })
      expect.equal(stack.ruler, 'none', 'the ruler is dropped')
      expect.ok(stack.sameLeft, 'one column')
      expect.ok(stack.ordered, 'no overlap, in order')
      expect.equal(stack.n, 6, 'all six events are still there')
      const wide = await page.locator(GRID).evaluate((el) => getComputedStyle(el.querySelector('.agenda-day__hours')).display)
      expect.equal(wide, 'grid', 'and the ruler is there when they fit')
    },
  },
  {
    name: 'at 200% text the day view stacks instead of clipping',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.waitForTimeout(200)
      const r = await page.locator(GRID).evaluate((el) => ({ ruler: getComputedStyle(el.querySelector('.agenda-day__hours')).display, over: el.querySelector('.agenda-day').scrollWidth > el.querySelector('.agenda-day').clientWidth + 1 }))
      expect.equal(r.ruler, 'none', 'stacked')
      expect.equal(r.over, false, 'nothing overflows')
    },
  },
  {
    name: 'SG.agenda.layout: lanes, spans, back-to-back events, chains, and the grid rows',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      const r = await page.evaluate(() => {
        const L = (evs, o) => SG.agenda.layout(evs.map(([s, e]) => ({ start: SG.agenda.minutes(s), end: SG.agenda.minutes(e), s, e })), o)
        const back = L([['09:00', '10:00'], ['10:00', '11:00']])
        const three = L([['09:00', '10:00'], ['09:15', '10:15'], ['09:30', '09:45']])
        const chain = L([['09:00', '10:00'], ['09:30', '10:30'], ['10:15', '11:00']])
        const alone = L([['09:00', '10:00'], ['09:30', '10:00'], ['12:00', '13:00']])
        const empty = SG.agenda.layout([])
        return {
          back: back.items.map((i) => [i.lane, i.span]), backLanes: back.lanes,
          three: three.items.map((i) => [i.s, i.lane]), threeLanes: three.lanes,
          chain: chain.items.map((i) => [i.s, i.lane]), chainLanes: chain.lanes,
          alone: alone.items.map((i) => [i.s, i.lane, i.span]), aloneLanes: alone.lanes,
          rows: alone.items.map((i) => [i.from, i.to]), steps: alone.steps,
          empty: [empty.lanes, empty.steps, empty.items.length],
          mins: [SG.agenda.minutes('09:30'), SG.agenda.time(570), SG.agenda.time(605)],
        }
      })
      expect.equal(JSON.stringify(r.back), '[[1,1],[1,1]]', 'back-to-back events do not overlap')
      expect.equal(r.backLanes, 1, 'one lane')
      expect.equal(JSON.stringify(r.three), '[["09:00",1],["09:15",2],["09:30",3]]', 'three overlapping events take three lanes')
      expect.equal(r.threeLanes, 3, 'three lanes')
      expect.equal(JSON.stringify(r.chain), '[["09:00",1],["09:30",2],["10:15",1]]', 'a chain reuses a freed lane')
      expect.equal(r.chainLanes, 2, 'two lanes')
      expect.equal(JSON.stringify(r.alone), '[["09:00",1,1],["09:30",2,1],["12:00",1,2]]', 'an event alone in its cluster spans every lane')
      expect.equal(JSON.stringify(r.rows), '[[1,5],[3,5],[13,17]]', 'rows count 15-minute steps from the first hour')
      expect.equal(r.steps, 16, 'grid runs 9:00 to 13:00')
      expect.equal(JSON.stringify(r.empty), '[1,0,0]', 'no events is not an error')
      expect.equal(JSON.stringify(r.mins), '[570,"9:30","10:05"]', 'minute helpers')
    },
  },
  {
    name: 'the markup on the page is exactly what SG.agenda.layout computes',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      const r = await page.locator(GRID).evaluate((el) => {
        const items = [...el.querySelectorAll('.agenda-day__event')].map((li) => {
          const t = li.querySelectorAll('time')
          const cs = getComputedStyle(li)
          return { start: SG.agenda.minutes(t[0].getAttribute('datetime')), end: SG.agenda.minutes(t[1].getAttribute('datetime')), from: li.style.getPropertyValue('--from').trim(), to: li.style.getPropertyValue('--to').trim(), lane: li.style.getPropertyValue('--lane').trim(), span: li.style.getPropertyValue('--span').trim() || '1' }
        })
        const lay = SG.agenda.layout(items.map((i) => ({ start: i.start, end: i.end })), { start: 540, end: 900 })
        return { dom: items.map((i) => [i.from, i.to, i.lane, i.span].join(',')), fn: lay.items.map((i) => [i.from, i.to, i.lane, i.span].join(',')), lanes: lay.lanes, attr: el.querySelector('.agenda-day').dataset.lanes }
      })
      expect.equal(r.dom.join('|'), r.fn.join('|'), 'the docs markup was not hand-drawn')
      expect.equal(String(r.lanes), r.attr, 'data-lanes matches')
    },
  },
  {
    name: 'in context: choosing a day in the week strip swaps the agenda; an empty day says so',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      const shown = () => page.evaluate(() => [...document.querySelectorAll('#plan > .agenda-day')].filter((s) => !s.hidden).map((s) => s.id).join() + '|' + (document.getElementById('plan-none').hidden ? '' : 'none'))
      expect.equal(await shown(), 'plan-fri|', 'Friday first')
      await page.locator('#demo-context .cal__day[data-date="2026-09-30"]').click()
      expect.equal(await shown(), 'plan-wed|', 'Wednesday')
      await page.locator('#demo-context .cal__day[data-date="2026-10-03"]').click()
      expect.equal(await shown(), '|none', 'Saturday is empty and says so')
    },
  },
  {
    name: 'forced colours: chips and event cards keep frames',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      await page.emulateMedia({ forcedColors: 'active' })
      await page.waitForTimeout(100)
      const r = await page.evaluate(() => ({ chip: getComputedStyle(document.querySelector('.agenda__event')).borderTopWidth, card: getComputedStyle(document.querySelector('.agenda-day__event')).borderTopWidth }))
      expect.equal(r.chip, '2px', 'chip frame')
      expect.equal(r.card, '2px', 'event card frame')
    },
  },
  {
    name: 'the forced Focus specimen wears the ring a real keyboard focus gets, not only the lift',
    async run({ page, goto, expect }) {
      await goto('components/agenda.html')
      const r = await page.locator('.agenda__event.is-focus').evaluate((el) => { const cs = getComputedStyle(el); return { outline: cs.outlineStyle + ' ' + cs.outlineWidth, lift: cs.getPropertyValue('--lift').trim() } })
      expect.equal(r.outline, 'solid 3px', 'is-focus draws the ring')
      expect.equal(r.lift, '1', 'and the lift')
    },
  },
]
