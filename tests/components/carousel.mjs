// Interaction spec for Carousel: WAI-ARIA APG carousel, dots with roving tabindex, opt-in autoplay that always has a pause.
const NOTES = '#notes-track'
const car = (id) => `.carousel:has(${id})`
// wait until every track has stopped moving, then a beat for the script to release its lock
const settle = async (page) => {
  await page.evaluate(() => new Promise((res) => {
    let last = '', still = 0
    const tick = () => {
      const now = [...document.querySelectorAll('.carousel__track')].map((t) => Math.round(t.scrollLeft)).join(',')
      if (now === last) still++; else { still = 0; last = now }
      if (still >= 4) res(); else setTimeout(tick, 60)
    }
    tick()
  }))
  await page.waitForTimeout(250)
}
const said = (page) => page.evaluate(() => [...document.querySelectorAll('[role="status"]')].map((n) => n.textContent).join('|'))

export const tests = [
  {
    name: 'starts on slide 1: counter, current dot and disabled Previous agree; every slide is named "n of N"',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      const r = await page.evaluate((c) => {
        const el = document.querySelector(c)
        const slides = [...el.querySelectorAll('.carousel__slide')]
        return {
          role: el.getAttribute('aria-roledescription'),
          name: el.getAttribute('aria-label'),
          slides: slides.map((s) => [s.getAttribute('role'), s.getAttribute('aria-roledescription'), s.getAttribute('aria-label')]),
          count: el.querySelector('.carousel__count').textContent.replace(/\s+/g, ' ').trim(),
          current: [...el.querySelectorAll('.carousel__dot')].map((d) => d.getAttribute('aria-current')),
          prev: el.querySelector('.carousel__prev').getAttribute('aria-disabled'),
          next: el.querySelector('.carousel__next').getAttribute('aria-disabled'),
        }
      }, car(NOTES))
      expect.equal(r.role, 'carousel', 'aria-roledescription')
      expect.ok(r.name && r.name.length > 5, 'labelled')
      expect.equal(r.slides.length, 6)
      r.slides.forEach((s, i) => expect.equal(s.join('/'), `group/slide/${i + 1} of 6`, `slide ${i + 1} is named`))
      expect.equal(r.count, '1 of 6')
      expect.equal(r.current.join(','), 'true,,,,,', 'only the first dot is current')
      expect.equal(r.prev, 'true', 'Previous is unavailable on the first slide')
      expect.equal(r.next, null, 'Next is available')
    },
  },
  {
    name: 'Next scrolls one slide, updates counter + dots + buttons, and announces the slide',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      const c = car(NOTES)
      await page.locator(`${c} .carousel__next`).click()
      await settle(page)
      const r = await page.evaluate((sel) => {
        const el = document.querySelector(sel), t = el.querySelector('.carousel__track')
        return {
          left: Math.round(t.scrollLeft), w: Math.round(t.clientWidth),
          count: el.querySelector('.carousel__count').textContent.replace(/\s+/g, ' ').trim(),
          cur: [...el.querySelectorAll('.carousel__dot')].findIndex((d) => d.getAttribute('aria-current') === 'true'),
          prev: el.querySelector('.carousel__prev').getAttribute('aria-disabled'),
          idx: el.getAttribute('data-index'),
        }
      }, c)
      expect.ok(Math.abs(r.left - r.w) <= 2, `scrolled exactly one slide (left ${r.left}, slide ${r.w})`)
      expect.equal(r.count, '2 of 6')
      expect.equal(r.cur, 1, 'second dot is current')
      expect.equal(r.prev, null, 'Previous is available again')
      expect.equal(r.idx, '1')
      expect.ok(/Slide 2 of 6: Tomato stall/.test(await said(page)), `announced (heard: ${await said(page)})`)
    },
  },
  {
    name: 'at the last slide Next is aria-disabled, stays focusable, and Enter does nothing',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      const c = car(NOTES)
      await page.evaluate((sel) => window.SG.carousel.go(document.querySelector(sel), 5), c)
      await settle(page)
      const next = page.locator(`${c} .carousel__next`)
      expect.equal(await next.getAttribute('aria-disabled'), 'true', 'disabled at the end')
      await next.focus()
      await expect.focused(page, `${c} .carousel__next`, 'still focusable (aria-disabled, not disabled)')
      const before = await page.locator(`${c} .carousel__track`).evaluate((t) => t.scrollLeft)
      await page.keyboard.press('Enter')
      await settle(page)
      expect.equal(await page.locator(`${c} .carousel__track`).evaluate((t) => t.scrollLeft), before, 'nothing moved')
    },
  },
  {
    name: 'dots: one tab stop (the current one); arrows move focus AND show that slide; Home / End',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      const c = car(NOTES)
      const tabbable = await page.locator(`${c} .carousel__dot`).evaluateAll((ds) => ds.filter((d) => d.tabIndex === 0).length)
      expect.equal(tabbable, 1, 'roving tabindex: exactly one dot is tabbable')
      await page.locator(`${c} .carousel__dot`).first().focus()
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, `${c} .carousel__dot[aria-label="Slide 2"]`, 'focus moved to dot 2')
      await settle(page)
      expect.equal(await page.locator(`${c} .carousel__dot[aria-label="Slide 2"]`).getAttribute('aria-current'), 'true', 'and it is current')
      expect.equal(await page.locator(`${c} .carousel__dot[aria-label="Slide 2"]`).getAttribute('tabindex'), '0', 'roving tabindex follows')
      await page.keyboard.press('End')
      await settle(page)
      await expect.focused(page, `${c} .carousel__dot[aria-label="Slide 6"]`)
      expect.equal(await page.locator(`${c} .carousel__count`).innerText().then((t) => t.replace(/\s+/g, ' ').toLowerCase()), '6 of 6')
      await page.keyboard.press('Home')
      await settle(page)
      await expect.focused(page, `${c} .carousel__dot[aria-label="Slide 1"]`)
      await page.keyboard.press('ArrowLeft') // no loop on this carousel: dots wrap like radios
      await expect.focused(page, `${c} .carousel__dot[aria-label="Slide 6"]`, 'arrows wrap, like a radio group')
    },
  },
  {
    name: 'a swipe (a scroll the script did not start) updates the counter, dots and buttons',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      const c = car(NOTES)
      await page.locator(`${c} .carousel__track`).evaluate((t) => t.scrollTo({ left: t.clientWidth * 3, behavior: 'instant' }))
      await page.waitForTimeout(400)
      expect.equal((await page.locator(`${c} .carousel__count`).innerText()).replace(/\s+/g, ' ').toLowerCase(), '4 of 6')
      expect.equal(await page.locator(`${c} .carousel__dot[aria-label="Slide 4"]`).getAttribute('aria-current'), 'true')
      expect.equal(await page.locator(`${c} .carousel__prev`).getAttribute('aria-disabled'), null)
      // and it stays quiet: nothing the person did with a control, nothing to announce
      expect.ok(!/Slide 4/.test(await said(page)), 'no announcement for a swipe')
    },
  },
  {
    name: 'the track is a named, focusable group; Tab goes track, dots (one stop), Previous, Next; the frame wears the ring',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      const c = car(NOTES)
      const t = page.locator(`${c} .carousel__track`)
      await t.scrollIntoViewIfNeeded()
      const a = await t.evaluate((el) => ({ tab: el.tabIndex, role: el.getAttribute('role'), name: el.getAttribute('aria-label') }))
      expect.equal(a.tab, 0, 'focusable (a scroller nobody can focus is out of a keyboard\'s reach)')
      expect.equal(a.role, 'group')
      expect.ok(a.name, 'named')
      await t.focus()
      const order = []
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab')
        order.push(await page.evaluate(() => document.activeElement.className.split(' ').find((x) => x.startsWith('carousel__'))))
      }
      expect.equal(order.join(' > '), 'carousel__dot > carousel__prev > carousel__next', 'six dots, one tab stop')
      await t.focus()
      const ring = await page.locator(c).evaluate((el) => getComputedStyle(el).outlineWidth)
      expect.equal(ring, '3px', 'the frame wears the ring for the track')
      expect.equal(await t.evaluate((el) => getComputedStyle(el).outlineStyle), 'none', 'and the track does not double it inside the picture')
    },
  },
  {
    name: 'arrow keys on the focused track do what the buttons do: Left / Right, Home / End, announced; no loop by default',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      const c = car(NOTES)
      const t = page.locator(`${c} .carousel__track`)
      await t.focus()
      await page.keyboard.press('ArrowRight')
      await settle(page)
      expect.equal(await page.locator(c).getAttribute('data-index'), '1')
      expect.ok(/Slide 2 of 6: Tomato stall/.test(await said(page)), `announced (heard ${await said(page)})`)
      await page.keyboard.press('End')
      await settle(page)
      expect.equal(await page.locator(c).getAttribute('data-index'), '5', 'End goes to the last')
      await page.keyboard.press('ArrowRight')
      await settle(page)
      expect.equal(await page.locator(c).getAttribute('data-index'), '5', 'and stays (no loop)')
      await page.keyboard.press('Home')
      await settle(page)
      expect.equal(await page.locator(c).getAttribute('data-index'), '0')
      await page.keyboard.press('ArrowLeft')
      await settle(page)
      expect.equal(await page.locator(c).getAttribute('data-index'), '0')
    },
  },
  {
    name: 'touch targets: dots and buttons are at least 44px',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      const c = car(NOTES)
      const sizes = await page.locator(`${c} .carousel__dot, ${c} .carousel__prev, ${c} .carousel__next`).evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height) }))
      expect.ok(sizes.length === 8 && sizes.every((s) => s >= 43.5), `all 44px or more (got ${sizes.map(Math.round).join(',')})`)
    },
  },
  {
    name: 'auto-advance is OFF by default, starts only when Play is pressed, and Pause stops it',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      const c = car('#auto-track')
      await page.evaluate((sel) => document.querySelector(sel).setAttribute('data-autoplay', '500'), c)
      const play = page.locator(`${c} .carousel__play`)
      expect.equal(await play.getAttribute('aria-label'), 'Start slide show', 'the name says what pressing does')
      expect.equal(await play.getAttribute('data-playing'), 'false')
      await page.waitForTimeout(1600)
      expect.equal(await page.locator(`${c}`).getAttribute('data-index'), '0', 'nothing moves until asked')
      await play.click()
      expect.equal(await play.getAttribute('aria-label'), 'Pause slide show', 'the name changes with the state')
      expect.equal(await play.getAttribute('data-playing'), 'true')
      await page.mouse.move(2, 2) // a resting pointer pauses; get it off the carousel
      await page.waitForTimeout(1900)
      const moved = Number(await page.locator(c).getAttribute('data-index'))
      expect.ok(moved >= 2, `advanced while playing (index ${moved})`)
      await play.click()
      expect.equal(await play.getAttribute('aria-label'), 'Start slide show')
      const at = await page.locator(c).getAttribute('data-index')
      await page.waitForTimeout(1500)
      expect.equal(await page.locator(c).getAttribute('data-index'), at, 'Pause really stops it')
      expect.ok(!/Slide \d of 4:/.test(await said(page)), 'auto-advance never announces a slide')
    },
  },
  {
    name: 'auto-advance stops for good when focus enters the carousel',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      const c = car('#auto-track')
      await page.evaluate((sel) => document.querySelector(sel).setAttribute('data-autoplay', '500'), c)
      await page.locator(`${c} .carousel__play`).click()
      expect.equal(await page.locator(`${c} .carousel__play`).getAttribute('data-playing'), 'true')
      await page.mouse.move(2, 2)
      await page.locator(`${c} .carousel__dot`).first().focus()
      expect.equal(await page.locator(`${c} .carousel__play`).getAttribute('data-playing'), 'false', 'focus inside stops it')
      expect.equal(await page.locator(`${c} .carousel__play`).getAttribute('aria-label'), 'Start slide show')
    },
  },
  {
    name: 'under reduced motion auto-advance refuses to start and slide changes are instant',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      const c = car('#auto-track')
      await page.evaluate((sel) => document.querySelector(sel).setAttribute('data-autoplay', '300'), c)
      await page.locator(`${c} .carousel__play`).click()
      expect.equal(await page.locator(`${c} .carousel__play`).getAttribute('data-playing'), 'false', 'Play does not start it')
      await page.waitForTimeout(900)
      expect.equal(await page.locator(c).getAttribute('data-index'), '0')
      await page.locator(`${c} .carousel__next`).click()
      await page.waitForTimeout(120)
      expect.equal(await page.locator(c).getAttribute('data-index'), '1', 'instant: there on the next frames, no slide')
    },
  },
  {
    name: 'data-loop: Previous on the first slide goes to the last, and the buttons are never disabled',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      const c = car('#auto-track')
      expect.equal(await page.locator(`${c} .carousel__prev`).getAttribute('aria-disabled'), null, 'not disabled on slide 1')
      await page.locator(`${c} .carousel__prev`).click()
      await settle(page)
      expect.equal(await page.locator(c).getAttribute('data-index'), '3', 'wrapped to the last of 4')
      await page.locator(`${c} .carousel__next`).click()
      await settle(page)
      expect.equal(await page.locator(c).getAttribute('data-index'), '0', 'and forward again')
    },
  },
  {
    name: 'data-autoplay without a Play button stays off (WCAG 2.2.2 needs the pause) and warns',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      const warned = []
      page.on('console', (m) => { if (m.type() === 'warning') warned.push(m.text()) })
      const idx = await page.evaluate(async () => {
        const sec = document.querySelector('#guide-track').closest('.carousel').cloneNode(true)
        sec.setAttribute('data-autoplay', '200')
        sec.setAttribute('data-autoplay-start', '')
        sec.querySelector('#guide-track').id = 'clone-track'
        document.body.appendChild(sec)
        window.SG.carousel.init(document)
        await new Promise((r) => setTimeout(r, 800))
        return sec.getAttribute('data-index')
      })
      expect.equal(idx, '0', 'did not move')
      expect.ok(warned.some((w) => /carousel__play/.test(w)), 'explains itself in the console')
    },
  },
  {
    name: 'in a right-to-left page Next still goes forward and the counter is right',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'))
      const c = car(NOTES)
      await page.locator(`${c} .carousel__next`).scrollIntoViewIfNeeded()
      await page.locator(`${c} .carousel__next`).click()
      await settle(page)
      expect.equal((await page.locator(`${c} .carousel__count`).innerText()).replace(/\s+/g, ' ').toLowerCase(), '2 of 6')
      await page.locator(`${c} .carousel__next`).click()
      await settle(page)
      expect.equal(await page.locator(c).getAttribute('data-index'), '2')
    },
  },
  {
    name: 'the bar is one row at 320px and 390px, at 100% and 200% text: the count and the circles share a line, the dots are one line or none',
    async run({ page, goto, expect }) {
      for (const [w, pct] of [[390, 100], [390, 200], [320, 100], [320, 200]]) {
        await page.setViewportSize({ width: w, height: 800 })
        await goto('components/carousel.html')
        if (pct !== 100) await page.addStyleTag({ content: `html{font-size:${pct}%!important}` })
        await page.waitForTimeout(300) // SG.fit re-measures on the next frame after the size changes
        // the page as a whole at the a11y gate's sizes (at 320px with 200% text the docs prose has long code chips of its own)
        if (!(w === 320 && pct === 200)) {
          const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
          expect.ok(over <= 1, `${w}px ${pct}%: the page does not scroll sideways (overflow ${over})`)
        }
        const wide = await page.evaluate(() => [...document.querySelectorAll('.carousel')].filter((c) => c.getBoundingClientRect().right > innerWidth + 1).length)
        expect.equal(wide, 0, `${w}px ${pct}%: every carousel stays inside the screen`)
        const bars = await page.evaluate(() => [...document.querySelectorAll('.carousel')].map((c) => {
          const bar = c.querySelector('.carousel__bar'), b = bar.getBoundingClientRect(), count = c.querySelector('.carousel__count')
          const mid = (r) => r.top + r.height / 2
          const nav = [...c.querySelectorAll('.carousel__nav .btn')].map((x) => x.getBoundingClientRect())
          const dots = c.querySelector('.carousel__dots'), dr = dots && dots.getBoundingClientRect()
          const shown = getComputedStyle(count).position !== 'absolute'
          return {
            name: c.getAttribute('aria-label'), fit: bar.dataset.fit, cr: count.getBoundingClientRect(), shown,
            countMid: mid(count.getBoundingClientRect()), navMids: nav.map(mid), navInside: nav.every((r) => r.left >= b.left - 0.5 && r.right <= b.right + 0.5),
            countFits: count.scrollWidth <= count.clientWidth + 1,
            dots: dots ? { shown: getComputedStyle(dots).display !== 'none', oneLine: [...dots.children].every((d) => Math.abs(d.getBoundingClientRect().top - dots.children[0].getBoundingClientRect().top) < 1), inside: !dr || dr.width === 0 || (dr.left >= b.left - 4.5 && dr.right <= b.right + 4.5) } : null,
          }
        }))
        for (const c of bars) {
          expect.ok(c.navInside, `${w}px ${pct}% ${c.name}: the circles are inside the bar`)
          expect.ok(c.navMids.every((m) => Math.abs(m - c.navMids[0]) < 1), `${w}px ${pct}% ${c.name}: the circles share one line`)
          if (c.shown) {
            expect.ok(Math.abs(c.countMid - c.navMids[0]) < 2, `${w}px ${pct}% ${c.name}: the count is on the circles' line (${c.fit})`)
            expect.ok(c.countFits, `${w}px ${pct}% ${c.name}: the count is not cut (${c.fit})`)
          }
          if (c.dots && c.dots.shown) {
            expect.ok(c.dots.oneLine, `${w}px ${pct}% ${c.name}: the dots are one line`)
            expect.ok(c.dots.inside, `${w}px ${pct}% ${c.name}: the dots fit the bar`)
          }
        }
        if (w === 390) for (const c of bars) expect.equal(c.fit, 'long', `${w}px ${pct}% ${c.name}: at 390px the count keeps its words`)
      }
    },
  },
  {
    name: 'at 200% text the bar cannot widen the carousel: Previous, Next and Play stay inside its frame and the track does not outgrow it',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.waitForTimeout(250)
      const r = await page.evaluate(() => [...document.querySelectorAll('.carousel')].map((c) => {
        const f = c.getBoundingClientRect()
        const inside = (el) => { const b = el.getBoundingClientRect(); return b.left >= f.left - 1 && b.right <= f.right + 1 }
        return { name: c.getAttribute('aria-label'), buttons: [...c.querySelectorAll('.carousel__nav .btn')].map((b) => [b.getAttribute('aria-label'), inside(b)]), track: inside(c.querySelector('.carousel__track')), vw: f.right <= innerWidth + 1 }
      }))
      expect.ok(r.length >= 4, 'the demo carousels')
      for (const c of r) {
        expect.ok(c.track, `${c.name}: the track stays inside the frame`)
        expect.ok(c.vw, `${c.name}: the carousel stays inside the screen`)
        for (const [label, ok] of c.buttons) expect.ok(ok, `${c.name}: "${label}" is inside the frame`)
      }
    },
  },
  {
    name: 'every slide picture covers its frame: no band between the picture and the caption or the bar, at 100% and 200% text',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      for (const pct of [100, 200]) {
        if (pct !== 100) await page.addStyleTag({ content: `html{font-size:${pct}%!important}` })
        await page.waitForTimeout(250)
        const gaps = await page.evaluate(() => [...document.querySelectorAll('.carousel__slide > .media')].map((m) => {
          const f = m.querySelector('.media__frame').getBoundingClientRect(), img = m.querySelector('img').getBoundingClientRect()
          const cap = m.querySelector('.media__caption'), c = cap.getBoundingClientRect(), over = getComputedStyle(cap).gridRowStart === '1'
          const below = over ? m.getBoundingClientRect().bottom - (getComputedStyle(m).borderBottomWidth === '0px' ? 0 : 2) : c.top
          return { band: Math.round(below - f.bottom), img: Math.round(f.bottom - img.bottom) }
        }))
        for (const g of gaps) {
          expect.ok(Math.abs(g.band) <= 1, `${pct}%: the frame reaches the caption (band ${g.band}px)`)
          expect.ok(Math.abs(g.img) <= 1, `${pct}%: the picture fills the frame (${g.img}px short)`)
        }
      }
    },
  },
  {
    name: 'dots keep the solid fill for the current one: hover draws the cell ring, pressing tints half way, the current one fills and stretches',
    async run({ page, goto, expect }) {
      await goto('components/carousel.html')
      const dot = page.locator(`${car(NOTES)} .carousel__dot`).nth(2)
      await dot.scrollIntoViewIfNeeded()
      const read = () => dot.evaluate((d) => ({ fill: Number(getComputedStyle(d).getPropertyValue('--fill')), ring: getComputedStyle(d).borderTopColor, w: d.getBoundingClientRect().width }))
      const rest = await read()
      expect.equal(rest.fill, 0, 'rest: --fill 0')
      expect.equal(Math.round(rest.w), 44, 'a 44px cell')
      await dot.hover()
      await page.waitForTimeout(300)
      const h = await read()
      expect.equal(h.fill, 0, 'hover: no fill (a filled dot means "here")')
      expect.ok(h.ring !== rest.ring, `hover: the cell ring appears (${rest.ring} -> ${h.ring})`)
      await page.mouse.down()
      await page.waitForTimeout(250)
      expect.equal((await read()).fill, 0.5, 'pressed: half way, at once')
      await page.mouse.up()
      await page.waitForTimeout(300)
      const cur = await dot.evaluate((d) => ({ current: d.getAttribute('aria-current'), fill: Number(getComputedStyle(d).getPropertyValue('--fill')), pill: getComputedStyle(d, '::before').width }))
      expect.equal(cur.current, 'true', 'the click made it current')
      expect.equal(cur.fill, 1, 'current: filled')
      expect.equal(cur.pill, '28px', 'and stretched into a pill')
    },
  },
]
