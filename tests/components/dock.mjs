// Dock: names and states, the keyboard path, the cell states, and the --dock-h contract that keeps
// content and focus clear of a floating bar (WCAG 2.4.11). Bars are injected where the docs page only
// has static previews, because a fixed dock would cover the page being read.
const INJECT = `(() => {
  const n = document.createElement('nav')
  n.className = 'dock'; n.id = 'inj-dock'; n.setAttribute('aria-label', 'Injected')
  n.innerHTML = '<ul class="dock__list" role="list"><li><a class="dock__item" href="#inj" aria-current="page"><span class="ic ic--house" aria-hidden="true"></span><span class="dock__label">Home</span></a></li><li><a class="dock__item" href="#inj"><span class="ic ic--user" aria-hidden="true"></span><span class="dock__label">Profile</span></a></li></ul>'
  document.body.appendChild(n)
})()`
const dockH = (page) => page.evaluate(() => document.documentElement.style.getPropertyValue('--dock-h'))
const hex = (page, css) => page.evaluate((c) => SG.colorToHex(c), css)

export const tests = [
  {
    name: 'Every dock is a named navigation with exactly one current item; each destination shows a word of at least 13px',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('nav.dock')].map((d) => ({
        name: d.getAttribute('aria-label'),
        current: d.querySelectorAll('[aria-current="page"]').length,
        items: [...d.querySelectorAll('.dock__item')].map((i) => { const l = i.querySelector('.dock__label'); return { label: l.textContent.trim(), px: parseFloat(getComputedStyle(l).fontSize) } }),
        actionLabel: [...d.querySelectorAll('.dock__action')].map((a) => a.getAttribute('aria-label')),
      })))
      expect.ok(r.length >= 8, 'found the demo docks')
      expect.ok(r.every((d) => d.name), 'every dock has an aria-label')
      expect.equal(new Set(r.map((d) => d.name)).size, r.length, 'labels are unique on the page (landmark-unique)')
      expect.ok(r.every((d) => d.current === 1), 'exactly one aria-current="page" per dock')
      expect.ok(r.every((d) => d.items.every((i) => i.label && i.px >= 13)), 'every destination shows text of at least 13px')
      expect.ok(r.every((d) => d.actionLabel.every(Boolean)), 'the icon-only centre action has an aria-label')
    },
  },
  {
    name: 'The current item is a filled pill with a frame of its own; the others are neither; the weight is the same (no reflow)',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      await page.mouse.move(0, 0)
      const r = await page.evaluate(() => {
        const d = document.querySelector('nav.dock[aria-label="Main"]')
        const cur = d.querySelector('[aria-current="page"]'); const other = d.querySelector('.dock__item:not([aria-current])')
        const s = (e) => { const c = getComputedStyle(e); return { bg: c.backgroundColor, w: Number(c.fontWeight), fill: Number(c.getPropertyValue('--fill')), bd: c.borderTopColor, bw: parseFloat(c.borderTopWidth) } }
        return { cur: s(cur), other: s(other), dockBg: getComputedStyle(d).backgroundColor }
      })
      expect.equal(r.cur.fill, 1, 'current: --fill 1'); expect.equal(r.other.fill, 0, 'others: --fill 0')
      expect.ok((await hex(page, r.cur.bg)) !== (await hex(page, r.dockBg)), 'the current item has its own fill that differs from the dock')
      expect.equal(await hex(page, r.other.bg), await hex(page, r.dockBg), 'the others sit on the dock\'s own fill')
      expect.equal(r.cur.bw, 2, 'a 2px edge'); expect.ok(r.cur.bd !== 'rgba(0, 0, 0, 0)', 'drawn on the current item'); expect.equal(r.other.bd, 'rgba(0, 0, 0, 0)', 'and transparent on the others')
      expect.equal(r.cur.w, r.other.w, 'same weight, so choosing one never moves its neighbours')
    },
  },
  {
    name: 'Ink dock: the dock and the current pill swap (paper pill on ink), and the centre action is a paper circle',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      await page.mouse.move(0, 0)
      const r = await page.evaluate(() => {
        const d = document.querySelector('nav.dock[data-tone="ink"]')
        const cur = d.querySelector('[aria-current="page"]'); const act = d.querySelector('.dock__action')
        return { dock: getComputedStyle(d).backgroundColor, dockInk: getComputedStyle(d).color, cur: getComputedStyle(cur).backgroundColor, curInk: getComputedStyle(cur).color, act: getComputedStyle(act).backgroundColor, actInk: getComputedStyle(act).color }
      })
      expect.equal(await hex(page, r.cur), await hex(page, r.dockInk), 'the current pill is the dock\'s text colour')
      expect.equal(await hex(page, r.curInk), await hex(page, r.dock), 'with the dock\'s fill as its text')
      expect.equal(await hex(page, r.act), await hex(page, r.dockInk), 'the centre action is filled with the dock\'s text colour')
      expect.equal(await hex(page, r.actInk), await hex(page, r.dock), 'and its plus is the dock\'s fill')
    },
  },
  {
    name: 'Hover draws an unchosen item\'s own frame (text colour unmoved), the current one is unchanged; the focus ring follows the dock',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      const items = page.locator('nav.dock[aria-label="Main"] .dock__item')
      const st = (i) => items.nth(i).evaluate((el) => { const cs = getComputedStyle(el); return { bd: cs.borderTopColor, ink: cs.color, bg: cs.backgroundColor } })
      await page.mouse.move(0, 0)
      const rest = await st(1); const cur = await st(0)
      expect.equal(rest.bd, 'rgba(0, 0, 0, 0)', 'at rest an item has a transparent frame (an edge for forced colours)')
      await items.nth(1).hover()
      await page.waitForTimeout(300)
      const hov = await st(1)
      expect.ok(hov.bd !== rest.bd, 'hover draws the frame: ' + hov.bd)
      expect.equal(await hex(page, hov.ink), await hex(page, rest.ink), 'and the text colour does not move')
      expect.equal(await hex(page, hov.bg), await hex(page, rest.bg), 'no tint')
      await items.nth(0).hover()
      await page.waitForTimeout(300)
      expect.equal(await hex(page, (await st(0)).bg), await hex(page, cur.bg), 'the current item is unchanged by hover')
      // keyboard focus: ring in the dock's ink, halo in the dock's fill
      await items.nth(0).focus()
      await page.keyboard.press('Tab')
      await page.waitForTimeout(250)
      const f = await items.nth(1).evaluate((el) => { const cs = getComputedStyle(el); const d = getComputedStyle(el.closest('.dock')); return { o: cs.outlineStyle, w: parseFloat(cs.outlineWidth), c: cs.outlineColor, s: cs.boxShadow, dockInk: d.color } })
      expect.equal(f.o, 'solid'); expect.ok(f.w >= 3, 'ring 3px')
      expect.equal(await hex(page, f.c), await hex(page, f.dockInk), 'the ring is the dock\'s text colour')
      expect.ok(/0px 0px 0px 3px/.test(f.s), 'with a 3px halo: ' + f.s)
    },
  },
  {
    name: 'Tab visits the items in visual order; Enter on a focused item makes it current (docs demo)',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      await page.locator('nav.dock[aria-label="Main"] .dock__item').first().focus()
      const order = []
      for (let i = 0; i < 3; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => document.activeElement.textContent.trim())) }
      expect.equal(order.join(','), 'Decks,Stats,Profile', 'DOM order = visual order')
      await page.keyboard.press('Enter')
      expect.equal(await page.evaluate(() => document.querySelector('nav.dock[aria-label="Main"] [aria-current="page"]').textContent.trim()), 'Profile', 'Enter activated the focused item')
      expect.equal(await page.locator('nav.dock[aria-label="Main"] [aria-current="page"]').count(), 1, 'still exactly one current item')
    },
  },
  {
    name: 'Compact: inactive words are visually hidden but still in each link\'s name; the current word shows',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('nav.dock[data-compact] .dock__item')].map((i) => {
        const l = i.querySelector('.dock__label'); const b = l.getBoundingClientRect()
        return { current: i.hasAttribute('aria-current'), w: Math.round(b.width), name: i.textContent.trim() }
      }))
      expect.ok(r.find((x) => x.current).w > 10, 'the current word is visible')
      expect.ok(r.filter((x) => !x.current).every((x) => x.w <= 1), 'inactive words collapse to a 1px clip box')
      expect.ok(r.every((x) => x.name.length > 1), 'every link still has its text name: ' + JSON.stringify(r.map((x) => x.name)))
    },
  },
  {
    name: 'A count badge adds its meaning to the link\'s name ("Inbox 3 unread") and is not colour alone',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      const t = await page.evaluate(() => document.querySelector('.dock__badge').closest('a').textContent.replace(/\s+/g, ' ').trim())
      expect.equal(t, 'Inbox3 unread', 'visible number plus screen-reader-only meaning')
      expect.equal(await page.evaluate(() => document.querySelector('.dock__badge').firstChild.textContent), '3', 'the number is visible text')
    },
  },
  {
    name: 'A fixed dock publishes --dock-h (height + gap, minus safe area) and the foundation reserves it',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      await page.evaluate(INJECT)
      await page.waitForTimeout(150)
      const r = await page.evaluate(() => {
        const d = document.getElementById('inj-dock'); const b = d.getBoundingClientRect(); const cs = getComputedStyle(d)
        return { h: parseFloat(document.documentElement.style.getPropertyValue('--dock-h')), expected: b.height + parseFloat(cs.bottom), pos: cs.position, pad: parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom) }
      })
      expect.equal(r.pos, 'fixed')
      expect.ok(Math.abs(r.h - r.expected) < 1, `--dock-h ${r.h} equals dock height + gap ${r.expected}`)
      expect.ok(r.pad >= r.h, `html scroll-padding-block-end (${r.pad}) covers the dock (${r.h})`)
      await page.evaluate(() => document.getElementById('inj-dock').remove())
      await page.waitForTimeout(150)
      expect.equal(await dockH(page), '', 'property cleared when the dock is gone')
    },
  },
  {
    name: 'A full-width bar publishes its height without a gap and keeps the safe area inside',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      await page.evaluate(`(() => {
        const n = document.createElement('nav'); n.className = 'dock'; n.id = 'inj-bar'; n.setAttribute('data-variant', 'bar'); n.setAttribute('aria-label', 'Injected bar')
        n.innerHTML = '<ul class="dock__list" role="list"><li><a class="dock__item" href="#inj" aria-current="page"><span class="dock__label">Home</span></a></li></ul>'
        document.body.appendChild(n)
      })()`)
      await page.waitForTimeout(150)
      const r = await page.evaluate(() => { const d = document.getElementById('inj-bar'); const b = d.getBoundingClientRect(); const cs = getComputedStyle(d); return { h: parseFloat(document.documentElement.style.getPropertyValue('--dock-h')), height: b.height, bottom: Math.round(window.innerHeight - b.bottom), left: b.left, width: b.width, rt: parseFloat(cs.borderTopWidth), rb: parseFloat(cs.borderBottomWidth), radius: parseFloat(cs.borderTopLeftRadius), vw: document.documentElement.clientWidth } })
      expect.ok(Math.abs(r.h - r.height) < 1, `--dock-h ${r.h} is the bar's height ${r.height}: no gap under it`)
      expect.equal(r.bottom, 0, 'flush with the bottom edge'); expect.equal(r.left, 0, 'flush with the left edge'); expect.equal(Math.round(r.width), r.vw, 'edge to edge')
      expect.equal(r.rt, 2, 'a 2px rule above'); expect.equal(r.rb, 0, 'and none below'); expect.equal(r.radius, 0, 'square-cornered')
    },
  },
  {
    name: '--dock-h follows the dock when text is enlarged (ResizeObserver)',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      await page.evaluate(INJECT)
      await page.waitForTimeout(150)
      const a = parseFloat(await dockH(page))
      await page.evaluate(() => { const d = document.getElementById('inj-dock'); d.style.setProperty('font-size', '200%'); d.style.setProperty('padding', '1.5rem') })
      await page.waitForTimeout(250)
      const b = parseFloat(await dockH(page))
      expect.ok(b > a + 10, `published height grew from ${a} to ${b}`)
    },
  },
  {
    name: 'Static / absolute docks and docks inside a data-chrome-scope frame do not touch <html>',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      expect.equal(await dockH(page), '', 'the page has no --dock-h of its own: every demo dock is static or scoped')
      const framed = await page.evaluate(() => { const f = document.querySelector('[data-chrome-scope]'); return { v: parseFloat(f.style.getPropertyValue('--dock-h')), isFixed: getComputedStyle(f.querySelector('.dock')).position } })
      expect.equal(framed.isFixed, 'fixed', 'the framed dock really is position: fixed')
      expect.ok(framed.v > 40, 'and its height is published on the frame: ' + framed.v)
    },
  },
  {
    name: 'The fixed dock stays inside its frame, and no row is left behind it when tabbing',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      const rows = page.locator('[data-chrome-scope] .card__list a')
      await rows.first().focus()
      const res = []
      for (let i = 0; i < 8; i++) {
        res.push(await page.evaluate(() => {
          const frame = document.querySelector('[data-chrome-scope]')
          const dock = frame.querySelector('.dock').getBoundingClientRect()
          const fr = frame.getBoundingClientRect()
          const row = document.activeElement.getBoundingClientRect()
          const scroller = frame.querySelector('.app').getBoundingClientRect()
          return { label: document.activeElement.textContent.trim().slice(0, 12), clear: row.bottom <= dock.top + 1, inFrame: dock.bottom <= fr.bottom + 1 && dock.top >= fr.top, seen: row.top >= scroller.top - 1 }
        }))
        if (i < 7) await page.keyboard.press('Tab')
      }
      expect.ok(res.every((r) => r.inFrame), 'dock pinned inside the frame')
      expect.ok(res.every((r) => r.clear), 'each focused row sits above the dock: ' + JSON.stringify(res.filter((r) => !r.clear)))
      expect.ok(res[7].label.startsWith('Last row'), 'the last row is reachable')
    },
  },
  {
    name: 'On a very short viewport the floating dock stops floating and publishes 0',
    viewport: { width: 390, height: 380 },
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      await page.evaluate(INJECT)
      await page.waitForTimeout(150)
      expect.equal(await page.evaluate(() => getComputedStyle(document.getElementById('inj-dock')).position), 'static', 'static under max-height: 26em')
      expect.equal(parseFloat(await dockH(page)), 0, 'nothing is reserved')
    },
  },
  {
    name: 'The floating dock is a pill with a 2px frame; the bar variant is a rectangle with a rule on top',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      const r = await page.evaluate(() => { const f = getComputedStyle(document.querySelector('nav.dock[aria-label="Main"]')); const b = getComputedStyle(document.querySelector('nav.dock[data-variant="bar"]')); return { fr: parseFloat(f.borderTopLeftRadius), fw: parseFloat(f.borderTopWidth), br: parseFloat(b.borderTopLeftRadius), bt: parseFloat(b.borderTopWidth), bb: parseFloat(b.borderBottomWidth) } })
      expect.ok(r.fr >= 100, 'floating: a pill'); expect.equal(r.fw, 2, 'floating: 2px frame')
      expect.equal(r.br, 0, 'bar: rectangular'); expect.equal(r.bt, 2, 'bar: 2px rule above'); expect.equal(r.bb, 0, 'bar: no rule below')
    },
  },
  {
    name: 'Every destination and the centre action are at least 44x44 (and the action is 56)',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      const small = await page.evaluate(() => [...document.querySelectorAll('nav.dock a, nav.dock button')].map((e) => { const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height), e.textContent.trim() || e.getAttribute('aria-label')] }).filter(([w, h]) => w < 44 || h < 44))
      expect.equal(small.length, 0, 'undersized: ' + JSON.stringify(small))
      expect.equal(await page.evaluate(() => Math.round(document.querySelector('.dock__action').getBoundingClientRect().height)), 56, 'the centre action is the large circle')
    },
  },
  {
    name: 'Reduced motion: the compact label appears without travel',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      const r = await page.evaluate(() => { const l = document.querySelector('nav.dock[data-compact] [aria-current] .dock__label'); return { name: getComputedStyle(l).animationName, move: getComputedStyle(document.documentElement).getPropertyValue('--move').trim() } })
      expect.equal(r.move, '0', '--move is 0'); expect.equal(r.name, 'dock-label-in', 'still a fade')
    },
  },
]
