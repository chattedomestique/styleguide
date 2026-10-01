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
        // the fill is a layer (::before) under the text; the item itself paints nothing, so a wrapped dock's frame is never covered
        const s = (e) => { const c = getComputedStyle(e); const f = getComputedStyle(e, '::before'); return { own: c.backgroundColor, bg: f.backgroundColor, op: Number(f.opacity), w: Number(c.fontWeight), fill: Number(c.getPropertyValue('--fill')), bd: c.borderTopColor, bw: parseFloat(c.borderTopWidth) } }
        return { cur: s(cur), other: s(other), dockBg: getComputedStyle(d).backgroundColor }
      })
      expect.equal(r.cur.fill, 1, 'current: --fill 1'); expect.equal(r.other.fill, 0, 'others: --fill 0')
      expect.equal(r.cur.op, 1, 'the current item\'s fill layer is fully shown'); expect.equal(r.other.op, 0, 'and the others\' is not')
      expect.ok((await hex(page, r.cur.bg)) !== (await hex(page, r.dockBg)), 'the current item has its own fill that differs from the dock')
      expect.equal(r.cur.own, 'rgba(0, 0, 0, 0)', 'an item paints no background of its own (it would cover the dock\'s frame)'); expect.equal(r.other.own, 'rgba(0, 0, 0, 0)', 'nor do the others')
      expect.equal(r.cur.bw, 2, 'a 2px edge'); expect.ok(r.cur.bd !== 'rgba(0, 0, 0, 0)', 'drawn on the current item'); expect.equal(r.other.bd, 'rgba(0, 0, 0, 0)', 'and transparent on the others')
      expect.equal(r.cur.w, r.other.w, 'same weight, so choosing one never moves its neighbours')
    },
  },
  {
    name: 'Ink dock: the current pill is the one filled shape (paper on ink); the centre action is an outlined circle of the same height',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      await page.mouse.move(0, 0)
      const r = await page.evaluate(() => {
        const d = document.querySelector('nav.dock[data-tone="ink"]')
        const cur = d.querySelector('[aria-current="page"]'); const act = d.querySelector('.dock__action')
        const ca = getComputedStyle(act)
        return { dock: getComputedStyle(d).backgroundColor, dockInk: getComputedStyle(d).color, cur: getComputedStyle(cur, '::before').backgroundColor, curInk: getComputedStyle(cur).color, act: ca.backgroundColor, actInk: ca.color, actLine: ca.borderTopColor, curH: Math.round(cur.getBoundingClientRect().height), actH: Math.round(act.getBoundingClientRect().height), actW: Math.round(act.getBoundingClientRect().width) }
      })
      expect.equal(await hex(page, r.cur), await hex(page, r.dockInk), 'the current pill is the dock\'s text colour')
      expect.equal(await hex(page, r.curInk), await hex(page, r.dock), 'with the dock\'s fill as its text')
      expect.equal(await hex(page, r.act), await hex(page, r.dock), 'the centre action is NOT filled at rest: the one filled shape is where you are')
      expect.equal(await hex(page, r.actLine), await hex(page, r.dockInk), 'it is outlined in the dock\'s ink')
      expect.equal(await hex(page, r.actInk), await hex(page, r.dockInk), 'and its plus is the dock\'s ink')
      expect.equal(r.actH, r.curH, 'the action circle and the current pill are the same height')
      expect.equal(r.actW, r.actH, 'the action is a circle')
    },
  },
  {
    name: 'One row at every size: words, then only the current word, then icons; names never change, cells and the action stay one size',
    async run({ page, goto, expect }) {
      const check = async (label) => {
        return page.evaluate((label) => [...document.querySelectorAll('nav.dock')].filter((d) => d.getBoundingClientRect().width).map((d) => {
          const cells = [...d.querySelectorAll('.dock__item, .dock__action')]
          const tops = new Set(cells.map((c) => Math.round(c.getBoundingClientRect().top + c.getBoundingClientRect().height / 2)))
          const list = d.querySelector('.dock__list')
          const names = [...d.querySelectorAll('.dock__item')].map((a) => a.textContent.trim())
          const circles = cells.filter((c) => !c.matches('[aria-current="page"]') || d.dataset.fit === 'icons').map((c) => [Math.round(c.getBoundingClientRect().width), Math.round(c.getBoundingClientRect().height)])
          return { label, fit: d.dataset.fit, rows: tops.size, overflow: list.scrollWidth - list.clientWidth, names, circles, aria: d.getAttribute('aria-label') }
        }), label)
      }
      for (const [w, text] of [[390, 100], [320, 100], [390, 200], [320, 200]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await goto('components/dock.html')
        if (text !== 100) await page.addStyleTag({ content: `html{font-size:${text}%!important}` })
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
        await page.evaluate(() => SG.dock.fit())
        for (const d of await check(`${w}@${text}`)) {
          expect.equal(d.rows, 1, `${d.label} ${d.aria}: one row (fit=${d.fit})`)
          expect.ok(d.overflow <= 1, `${d.label} ${d.aria}: nothing spills past the dock (${d.overflow}px)`)
          expect.ok(d.names.every((n) => n.length > 0), `${d.label} ${d.aria}: every destination keeps its word as its name`)
          if (d.fit !== 'labels') for (const [cw, ch] of d.circles) expect.ok(Math.abs(cw - ch) <= 1 && cw >= 44, `${d.label} ${d.aria}: icon cells are circles of at least 44px (${cw}x${ch})`)
        }
      }
      // at a phone width and normal text, a four-item dock shows every word
      await page.setViewportSize({ width: 390, height: 844 })
      await goto('components/dock.html')
      expect.equal(await page.evaluate(() => document.querySelector('nav.dock[aria-label="Main"]').dataset.fit), 'labels', 'at 390px and normal text the words are shown')
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
        const l = i.querySelector('.dock__label'); const b = l.getBoundingClientRect(); const ib = i.getBoundingClientRect()
        // the hidden word's TEXT is laid out inside its item (not past the dock, where a preview frame clips it)
        const rg = document.createRange(); rg.selectNodeContents(l)
        const inside = [...rg.getClientRects()].every((q) => q.left >= ib.left - 1 && q.right <= ib.right + 1)
        return { current: i.hasAttribute('aria-current'), w: Math.round(b.width), clip: getComputedStyle(l).clipPath, abs: getComputedStyle(l).position, inside, name: i.textContent.trim() }
      }))
      expect.ok(r.find((x) => x.current).w > 10 && r.find((x) => x.current).clip === 'none', 'the current word is visible')
      expect.ok(r.filter((x) => !x.current).every((x) => x.clip === 'inset(50%)' && x.abs === 'absolute'), 'inactive words are painted nowhere (clip-path) and take no room (absolute)')
      expect.ok(r.filter((x) => !x.current).every((x) => x.inside), 'an inactive word is laid out inside its own item, never past the dock: ' + JSON.stringify(r))
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
      const r = await page.evaluate(() => { const f = getComputedStyle(document.querySelector('nav.dock[aria-label="Main"]')); const b = getComputedStyle(document.querySelector('nav.dock[data-variant="bar"]')); return { fr: parseFloat(f.borderTopLeftRadius), fh: document.querySelector('nav.dock[aria-label="Main"]').getBoundingClientRect().height, fw: parseFloat(f.borderTopWidth), br: parseFloat(b.borderTopLeftRadius), bt: parseFloat(b.borderTopWidth), bb: parseFloat(b.borderBottomWidth) } })
      // a pill is a radius of at least half the height (it was asserted as >= 100px when the radius was 999px; the radius is now
      // half of ONE row, so a one-row dock is still a pill, and a wrapped one is a rectangle with that corner: see the large-text test)
      expect.ok(r.fr * 2 >= r.fh - 1, 'floating: a pill (radius ' + r.fr + ' on a ' + r.fh + 'px tall dock)'); expect.equal(r.fw, 2, 'floating: 2px frame')
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
  {
    name: 'Large text (200% at 390px): a wrapped dock keeps the radius of ONE row (a rectangle, not an egg), and every word and cell corner stays inside the curve',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      const r = await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
        const host = document.createElement('div')
        host.style.cssText = 'position:absolute;inset-inline-start:32px;inset-block-start:0;inline-size:326px'
        const item = (i, w, cur) => '<li><a class="dock__item" href="#fx"' + (cur ? ' aria-current="page"' : '') + '><span class="ic ic--' + i + '" aria-hidden="true"></span><span class="dock__label">' + w + '</span></a></li>'
        host.innerHTML = '<nav class="dock" data-position="static" aria-label="fx"><ul class="dock__list" role="list">' + item('book-open', 'Study', true) + item('layers', 'Decks') + item('chart-column', 'Stats') + item('user', 'Profile') + '</ul></nav>'
        document.body.appendChild(host)
        const dock = host.querySelector('.dock'); const d = dock.getBoundingClientRect(); const cs = getComputedStyle(dock)
        const R = parseFloat(cs.borderTopLeftRadius)
        // is the point inside the dock's rounded rectangle?
        const inside = (x, y) => {
          const cx = x < d.left + R ? d.left + R : x > d.right - R ? d.right - R : x
          const cy = y < d.top + R ? d.top + R : y > d.bottom - R ? d.bottom - R : y
          return Math.hypot(x - cx, y - cy) <= R + 0.5
        }
        const pts = []
        for (const i of host.querySelectorAll('.dock__item')) {
          const ir = i.getBoundingClientRect(); const rr = ir.height / 2
          // the 45-degree point of each of the cell's four corner arcs, and the corners of its word
          for (const [ax, ay] of [[ir.left + rr, ir.top + rr], [ir.right - rr, ir.top + rr], [ir.left + rr, ir.bottom - rr], [ir.right - rr, ir.bottom - rr]]) pts.push(['cell', ax + (ax < ir.left + ir.width / 2 ? -1 : 1) * rr * Math.SQRT1_2, ay + (ay < ir.top + ir.height / 2 ? -1 : 1) * rr * Math.SQRT1_2])
          const rg = document.createRange(); rg.selectNodeContents(i.querySelector('.dock__label')); const t = rg.getBoundingClientRect()
          for (const [x, y] of [[t.left, t.top], [t.right, t.top], [t.left, t.bottom], [t.right, t.bottom]]) pts.push(['word', x, y])
        }
        const outside = pts.filter(([k, x, y]) => !inside(x, y)).map(([k, x, y]) => k + '@' + Math.round(x) + ',' + Math.round(y))
        const out = { R: Math.round(R), h: Math.round(d.height), rows: new Set([...host.querySelectorAll('.dock__item')].map((x) => Math.round(x.getBoundingClientRect().top))).size, outside }
        host.remove(); document.documentElement.style.fontSize = ''
        return out
      })
      expect.ok(r.rows >= 2, 'the dock wraps to two rows at 200% (rows: ' + r.rows + ')')
      expect.ok(r.R * 2 < r.h - 20, 'two rows tall, so the corner (' + r.R + 'px) is NOT half the height (' + r.h + 'px): a rectangle, not an egg')
      expect.equal(r.outside.length, 0, 'nothing pokes out of the dock\'s curve: ' + r.outside.join(' '))
    },
  },
  {
    name: 'Large text (200% at 390px): cells keep their whole words and never print over each other; the row wraps instead',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      const r = await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
        const host = document.createElement('div')
        host.style.cssText = 'position:absolute;inset-inline-start:32px;inset-block-start:0;inline-size:326px'
        const item = (i, w, cur) => '<li><a class="dock__item" href="#fx"' + (cur ? ' aria-current="page"' : '') + '><span class="ic ic--' + i + '" aria-hidden="true"></span><span class="dock__label">' + w + '</span></a></li>'
        host.innerHTML = '<nav class="dock" data-position="static" aria-label="fx"><ul class="dock__list" role="list">' + item('book-open', 'Study', true) + item('layers', 'Decks') + item('chart-column', 'Stats') + item('user', 'Profile') + '</ul></nav>'
        document.body.appendChild(host)
        const items = [...host.querySelectorAll('.dock__item')]
        const rects = items.map((i) => i.getBoundingClientRect())
        const overlaps = []
        for (let a = 0; a < rects.length; a++) for (let b = a + 1; b < rects.length; b++) {
          const ox = Math.min(rects[a].right, rects[b].right) - Math.max(rects[a].left, rects[b].left)
          const oy = Math.min(rects[a].bottom, rects[b].bottom) - Math.max(rects[a].top, rects[b].top)
          if (ox > 1 && oy > 1) overlaps.push([a, b])
        }
        const labels = items.map((i) => { const l = i.querySelector('.dock__label'); const lr = l.getBoundingClientRect(); const ir = i.getBoundingClientRect(); return { text: l.textContent, lines: Math.round(lr.height / parseFloat(getComputedStyle(l).lineHeight)), inside: lr.left >= ir.left - 1 && lr.right <= ir.right + 1, fits: l.scrollWidth <= l.clientWidth + 1 } })
        const dock = host.querySelector('.dock').getBoundingClientRect()
        const out = { overlaps, labels, inDock: rects.every((x) => x.left >= dock.left - 1 && x.right <= dock.right + 1), hostOverflow: host.scrollWidth > 326, rows: new Set(rects.map((x) => Math.round(x.top))).size }
        host.remove(); document.documentElement.style.fontSize = ''
        return out
      })
      expect.equal(r.overlaps.length, 0, 'no two cells overlap: ' + JSON.stringify(r.overlaps))
      expect.ok(r.labels.every((l) => l.lines <= 1 && l.inside && l.fits), 'every word sits whole on one line inside its own cell: ' + JSON.stringify(r.labels))
      expect.ok(r.inDock && !r.hostOverflow, 'all cells stay inside the dock and the column')
      expect.ok(r.rows >= 2, 'four 88px-minimum cells cannot share a 326px row, so the dock wraps (rows: ' + r.rows + ')')
    },
  },
  {
    name: 'Normal text: four destinations (and five with the centre action) stay on ONE row at 390px and at 320px',
    async run({ page, goto, expect }) {
      await goto('components/dock.html')
      const rowsAt = (w, withAction) => page.evaluate(([w, withAction]) => {
        const host = document.createElement('div'); host.style.cssText = 'position:absolute;inset-inline-start:0;inset-block-start:0;inline-size:' + w + 'px'
        const item = (i, t) => '<li><a class="dock__item" href="#fx"><span class="ic ic--' + i + '" aria-hidden="true"></span><span class="dock__label">' + t + '</span></a></li>'
        host.innerHTML = '<nav class="dock" data-position="static" aria-label="fx"><ul class="dock__list" role="list">' + item('house', 'Home') + item('chart-column', 'Stats') + (withAction ? '<li><button class="btn dock__action" data-shape="circle" type="button" aria-label="Add"><span class="ic ic--plus" aria-hidden="true"></span></button></li>' : '') + item('wallet', 'Pots') + item('user', 'You') + '</ul></nav>'
        document.body.appendChild(host)
        const tops = new Set([...host.querySelectorAll('.dock__list > li')].map((l) => Math.round(l.getBoundingClientRect().top)))
        const h = host.querySelector('.dock').getBoundingClientRect().height
        host.remove(); return { rows: tops.size, h: Math.round(h) }
      }, [w, withAction])
      for (const [w, a] of [[358, false], [358, true], [288, true]]) {
        const r = await rowsAt(w, a)
        expect.equal(r.rows, 1, w + 'px' + (a ? ' with the centre action' : '') + ': one row (height ' + r.h + ')')
      }
    },
  },
]
