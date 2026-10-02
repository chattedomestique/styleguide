// Interaction spec for Tile: the --lift / --fill model (hover and focus raise, a press tints, only on / current
// fills), on / current / unavailable states, the badge joining the accessible name, wrapping labels at 200% text,
// corners, the caption bar swapping polarity, and the 4-or-2 grid (never three and a lonely fourth).

// Tiles grouped into visual rows by their top edge. (Self-contained: Playwright serialises it into the page.)
const gridRows = () => [...document.querySelectorAll('.tile-grid')].filter((g) => g.offsetParent).map((g) => {
  const rows = new Map()
  for (const t of g.children) {
    const r = t.getBoundingClientRect()
    if (!r.width) continue
    const k = Math.round(r.top)
    if (!rows.has(k)) rows.set(k, [])
    rows.get(k).push({ w: r.width, h: r.height })
  }
  const label = g.closest('.demo').previousElementSibling
  return { where: (g.closest('section, .demo')?.previousElementSibling?.id || label?.textContent || '').slice(0, 30) + ' [' + g.children.length + ']', rows: [...rows.values()] }
})

export const tests = [
  {
    name: 'hover and keyboard focus raise the tile the same way without filling it; pressing sinks it with a light tint',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const t = page.locator('#quick ~ .demo').first().locator('a.tile').first()
      const nums = () => t.evaluate((el) => ({ lift: Number(getComputedStyle(el).getPropertyValue('--lift')), fill: Number(getComputedStyle(el).getPropertyValue('--fill')), shadow: getComputedStyle(el).boxShadow, t: getComputedStyle(el).transform }))
      await page.waitForTimeout(50)
      const rest = await nums()
      expect.equal(rest.lift, 0, 'rest: --lift 0')
      expect.equal(rest.fill, 0, 'rest: --fill 0')
      await t.hover()
      await page.waitForTimeout(450)
      const hover = await nums()
      expect.equal(hover.lift, 1, 'hover: --lift 1')
      expect.equal(hover.fill, 0, 'hover: not filled (the fill is what "on" looks like)')
      expect.ok(/4px 4px 0px 0px/.test(hover.shadow), `hard shadow, zero blur (got ${hover.shadow})`)
      expect.ok(hover.t !== 'none', `it moved (${hover.t})`)
      await page.mouse.down()
      await page.waitForTimeout(450)
      const down = await nums()
      expect.equal(down.lift, 0, 'pressed: back onto the surface')
      expect.ok(down.fill > 0.05 && down.fill < 0.3, `pressed: a light tint, not the "on" fill (--fill ${down.fill})`)
      await page.mouse.up()
      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab')
      await t.focus()
      await page.waitForTimeout(450)
      const focus = await nums()
      expect.equal(focus.lift, 1, 'keyboard focus: same lift as hover')
      expect.equal(focus.fill, 0, 'keyboard focus: not filled, as hover')
      expect.ok(/3px/.test(await t.evaluate((el) => getComputedStyle(el).outlineWidth)), 'and the 3px ring')
    },
  },
  {
    name: 'the tone decides the ON fill: a toned tile fills with its own solid, a plain tile with the accent; hover does not fill',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const r = await page.evaluate(async () => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 1
        const cx = cv.getContext('2d', { willReadFrequently: true })
        const rgb = (css) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data] }
        const toned = document.querySelector('#quick ~ .demo a.tile[data-tone="1"]')
        const plain = document.querySelector('#quick ~ .demo a.tile:not([data-tone])')
        const wait = () => new Promise((res) => setTimeout(res, 450))
        const bg = () => ({ toned: rgb(getComputedStyle(toned).backgroundColor), plain: rgb(getComputedStyle(plain).backgroundColor) })
        const before = bg()
        toned.classList.add('is-hover'); plain.classList.add('is-hover')
        await wait()
        const hover = bg()
        toned.classList.remove('is-hover'); plain.classList.remove('is-hover')
        toned.setAttribute('aria-current', 'page'); plain.setAttribute('aria-current', 'page')
        await wait()
        const on = bg()
        toned.removeAttribute('aria-current'); plain.removeAttribute('aria-current')
        return { before, hover, on }
      })
      expect.equal(r.hover.toned.join(), r.before.toned.join(), 'hover keeps the toned field')
      expect.equal(r.hover.plain.join(), r.before.plain.join(), 'hover keeps the plain field')
      expect.ok(r.on.toned.join() !== r.before.toned.join(), 'the toned tile fills when current')
      const dark = (c) => (c[0] + c[1] + c[2]) / 3 < 110
      expect.ok(dark(r.on.toned), `and ends dark enough for light text (${r.on.toned})`)
      expect.ok(dark(r.on.plain), `the plain tile fills with the accent (${r.on.plain})`)
    },
  },
  {
    name: 'on / current: filled and the frame doubles',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const r = await page.evaluate(async () => {
        const on = document.querySelector('#toggle ~ .demo button.tile[aria-pressed="true"]')
        const off = document.querySelector('#toggle ~ .demo button.tile[aria-pressed="false"]')
        await new Promise((res) => setTimeout(res, 450))
        return { onFill: Number(getComputedStyle(on).getPropertyValue('--fill')), offFill: Number(getComputedStyle(off).getPropertyValue('--fill')), onShadow: getComputedStyle(on).boxShadow, offShadow: getComputedStyle(off).boxShadow }
      })
      expect.equal(r.onFill, 1, 'on: filled')
      expect.equal(r.offFill, 0, 'off: outline')
      expect.ok(/0px 0px 0px 2px/.test(r.onShadow), `on: a second 2px frame (got ${r.onShadow})`)
      expect.ok(!/2px/.test(r.offShadow), 'off: a single frame')
    },
  },
  {
    name: 'the badge joins the name: "Bills 3 due"',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const snap = await page.locator('#badge ~ .demo').first().ariaSnapshot()
      expect.ok(/link "Bills 3 due"/.test(snap), `name includes the count and its unit (${snap.split('\n')[0]})`)
      expect.ok(/link "Inbox 99\+ unread"/.test(snap), 'an overflowing count reads too')
    },
  },
  {
    name: 'an unavailable tile is dashed, flat, focusable, and inert',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const t = page.locator('#states ~ .demo button.tile[aria-disabled="true"]')
      await page.evaluate(() => { window.__clicks = 0; document.querySelector('#states ~ .demo button.tile[aria-disabled="true"]').addEventListener('click', () => window.__clicks++) })
      await t.focus()
      await expect.focused(page, 'button.tile[aria-disabled="true"]', 'focusable, so its reason can be read')
      await page.keyboard.press('Enter')
      await page.keyboard.press('Space')
      expect.equal(await page.evaluate(() => window.__clicks), 0, 'keyboard activation is blocked')
      // the focus halo (a paper ring) may be there; the hard lift shadow must not be
      const r = await t.evaluate((el) => ({ style: getComputedStyle(el).borderTopStyle, shadow: getComputedStyle(el).boxShadow.replace(/^[^,]*3px,\s*/, ''), lift: getComputedStyle(el).getPropertyValue('--lift'), cursor: getComputedStyle(el).cursor }))
      expect.equal(r.style, 'dashed', 'dashed = not here')
      expect.ok(!/[1-9]px [1-9]px/.test(r.shadow), `no hard shadow (got ${r.shadow})`)
      expect.equal(Number(r.lift), 0, 'and no lift, even while focused')
      expect.equal(r.cursor, 'not-allowed', 'and the cursor says so')
    },
  },
  {
    name: 'at 200% text a label wraps and the tile grows; nothing clips or scrolls sideways',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const r = await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
        const bad = []
        for (const t of document.querySelectorAll('.tile')) {
          if (t.scrollWidth > t.clientWidth + 1 || t.scrollHeight > t.clientHeight + 1) bad.push(t.textContent.trim().replace(/\s+/g, ' ').slice(0, 20))
          for (const l of t.querySelectorAll('.tile__label')) if (l.scrollWidth > l.clientWidth + 1) bad.push('label:' + l.textContent.trim())
        }
        document.documentElement.style.fontSize = ''
        return bad
      })
      expect.ok(r.length === 0, `clipped at 200%: ${r.join(', ')}`)
    },
  },
  {
    name: 'every tile is at least 44x44 at 320px wide',
    viewport: { width: 320, height: 640 },
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const small = await page.evaluate(() => [...document.querySelectorAll('.tile')].map((t) => t.getBoundingClientRect()).filter((r) => r.width && (r.width < 44 || r.height < 44)).length)
      expect.equal(small, 0, 'no tile under 44px')
    },
  },
  {
    name: 'data-corners switches the tile radius role, and only it',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const r = await page.evaluate(() => {
        const sq = document.querySelector('#corners ~ .demo [data-corners="square"] .tile')
        const so = document.querySelector('#corners ~ .demo [data-corners="soft"] .tile')
        const badge = document.querySelector('#corners ~ .demo [data-corners="soft"] .tile__badge')
        return { square: getComputedStyle(sq).borderTopLeftRadius, soft: getComputedStyle(so).borderTopLeftRadius, badge: getComputedStyle(badge).borderTopLeftRadius }
      })
      expect.equal(r.square, '0px', 'square by default')
      expect.equal(r.soft, '12px', 'soft = --radius-tile')
      expect.ok(parseFloat(r.badge) > 100, 'the badge is a pill in both')
    },
  },
  {
    name: 'caption tile: the bar swaps polarity when the tile is on; hover only raises it',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const r = await page.evaluate(async () => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 1
        const cx = cv.getContext('2d', { willReadFrequently: true })
        const rgb = (css) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data].join() }
        const probe = (v) => { const p = document.createElement('i'); p.style.color = `var(${v})`; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return rgb(c) }
        const t = document.querySelector('#caption ~ .demo a.tile')
        const bar = t.querySelector('.tile__bar')
        const wait = () => new Promise((res) => setTimeout(res, 450))
        const read = () => ({ bg: rgb(getComputedStyle(bar).backgroundColor), ink: rgb(getComputedStyle(bar).color) })
        const rest = read()
        t.classList.add('is-hover')
        await wait()
        const hover = read()
        t.classList.remove('is-hover')
        t.setAttribute('aria-current', 'page')
        await wait()
        const on = read()
        t.removeAttribute('aria-current')
        return { rest, hover, on, ink: probe('--ink'), paper: probe('--paper') }
      })
      expect.equal(r.rest.bg, r.ink, 'rest: ink bar')
      expect.equal(r.rest.ink, r.paper, 'rest: paper text')
      expect.equal(r.hover.bg, r.ink, 'hover: the bar stays ink')
      expect.equal(r.on.bg, r.paper, 'on: the bar is paper')
      expect.equal(r.on.ink, r.ink, 'on: with ink text')
    },
  },
  {
    name: 'reduced motion: a tile does not travel, but the shadow still shows and a press still tints',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const t = page.locator('#quick ~ .demo').first().locator('a.tile').first()
      await t.hover()
      await page.waitForTimeout(500)
      const r = await t.evaluate((el) => ({ t: getComputedStyle(el).transform, lift: getComputedStyle(el).getPropertyValue('--lift'), fill: getComputedStyle(el).getPropertyValue('--fill'), shadow: getComputedStyle(el).boxShadow }))
      expect.ok(r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)', `no movement (got ${r.t})`)
      expect.ok(/4px 4px/.test(r.shadow), 'and the shadow still says "press me"')
      await page.mouse.down()
      await page.waitForTimeout(400)
      const fill = await t.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--fill')))
      await page.mouse.up()
      expect.ok(fill > 0.05, `a press still shows as a tint (--fill ${fill})`)
    },
  },
  {
    name: 'the forced .is-focus state draws the same 3px ring, offset outside the frame, that a real focus does',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const r = await page.locator('#states ~ .demo .tile.is-focus').first().evaluate((el) => { const cs = getComputedStyle(el); return { s: cs.outlineStyle, w: cs.outlineWidth, o: cs.outlineOffset } })
      expect.equal(r.s, 'solid', 'a ring is drawn')
      expect.equal(r.w, '3px', 'the ring width')
      expect.equal(r.o, '3px', 'outside the frame')
    },
  },
  {
    name: 'caption tiles are square whatever is in the field (a photo cannot stretch one), and their bars start at the same height',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('#caption ~ .demo .tile[data-variant="caption"]')].map((t) => {
        const b = t.getBoundingClientRect()
        return { w: b.width, h: b.height, bar: t.querySelector('.tile__bar').getBoundingClientRect().top - b.top, name: t.querySelector('.tile__label').textContent.trim() }
      }))
      expect.ok(r.length >= 3, `three caption tiles (${r.length})`)
      for (const t of r) expect.ok(Math.abs(t.h - t.w) <= 1, `${t.name} is square (${t.w.toFixed(0)} x ${t.h.toFixed(0)})`)
      const first = r.slice(0, 2)
      expect.ok(Math.abs(first[0].bar - first[1].bar) <= 1, `a one-line and a two-line name share a bar height (${first[0].bar.toFixed(0)} / ${first[1].bar.toFixed(0)})`)
    },
  },
  {
    name: 'the tones demo shows what it says: the six slots, ink and the four status tones',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const names = await page.evaluate(() => [...document.querySelectorAll('#tones ~ .demo .tile')].slice(0, 11).map((t) => t.dataset.tone))
      expect.equal(names.join(','), '1,2,3,4,5,6,ink,ok,warn,bad,info', 'every tone is on the page')
    },
  },
  {
    name: 'a tile grid is four to a row or two, never three and a lonely fourth (390px, 320px, and 200% text)',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      for (const [w, text] of [[390, 100], [320, 100], [390, 200], [1024, 100]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(150)
        const grids = await page.evaluate(gridRows)
        for (const g of grids) {
          const counts = g.rows.map((r) => r.length)
          expect.ok(counts.every((n) => n === counts[0]), `${w}px ${text}%: ${g.where} rows of ${counts.join(' + ')}`)
          expect.ok(counts[0] === 1 || counts[0] % 2 === 0, `${w}px ${text}%: ${g.where} puts an even number in a row (${counts[0]})`)
        }
      }
    },
  },
  {
    name: 'a wide tile stops at 10rem tall, and the tiles of one row share one height',
    viewport: { width: 1024, height: 800 },
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      for (const text of [100, 200]) {
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(150)
        const r = await page.evaluate(() => {
          const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
          return { rem, grids: [...document.querySelectorAll('#quick ~ .demo .tile-grid, #tones ~ .demo .tile-grid')].map((g) => [...g.children].map((t) => { const b = t.getBoundingClientRect(); return { top: Math.round(b.top), h: b.height, w: b.width } })) }
        })
        for (const tiles of r.grids) {
          for (const t of tiles) expect.ok(t.h <= 10 * r.rem + 1, `${text}%: a ${t.w.toFixed(0)}px wide tile is ${t.h.toFixed(0)}px tall (cap ${10 * r.rem}px)`)
          const byRow = new Map()
          for (const t of tiles) byRow.set(t.top, [...(byRow.get(t.top) || []), t.h])
          for (const hs of byRow.values()) expect.ok(Math.max(...hs) - Math.min(...hs) <= 1, `${text}%: one row, one height (${hs.map((h) => h.toFixed(0)).join(', ')})`)
        }
      }
    },
  },
  {
    name: 'a badge never covers the icon or the label (390px, 320px, 200% text, 1024px)',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      for (const [w, text] of [[390, 100], [320, 100], [390, 200], [1024, 100]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(150)
        const r = await page.evaluate(() => [...document.querySelectorAll('.tile')].filter((t) => t.offsetParent && t.querySelector('.tile__badge')).map((t) => {
          const b = t.querySelector('.tile__badge').getBoundingClientRect()
          const hit = (el) => { if (!el) return false; const q = el.getBoundingClientRect(); return q.left < b.right - 0.5 && b.left < q.right - 0.5 && q.top < b.bottom - 0.5 && b.top < q.bottom - 0.5 }
          return { name: t.querySelector('.tile__label').textContent.trim(), icon: hit(t.querySelector(':scope > .ic')), label: hit(t.querySelector('.tile__label')) }
        }))
        expect.ok(r.length >= 4, `badged tiles (${r.length})`)
        for (const x of r) expect.ok(!x.icon && !x.label, `${w}px ${text}%: the badge on "${x.name}" is clear of the icon and the label`)
      }
    },
  },
  {
    name: 'a label stays inside the padding: four to a phone row a seven-letter word fits whole (390px and 1024px, 100% and 200%)',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      for (const [w, text] of [[390, 100], [390, 200], [1024, 100], [1024, 200]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(150)
        const r = await page.evaluate(() => [...document.querySelectorAll('.tile:not([data-variant="caption"])')].filter((t) => t.offsetParent).map((t) => {
          const b = t.getBoundingClientRect(), cs = getComputedStyle(t)
          const l = t.querySelector('.tile__label')
          const rg = document.createRange()
          rg.selectNodeContents(l)
          const rects = [...rg.getClientRects()]
          const inner = { left: b.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft) - 0.5, right: b.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight) + 0.5 }
          const words = l.textContent.trim().split(/\s+/).length
          const lines = new Set(rects.map((q) => Math.round(q.top))).size
          return { name: l.textContent.trim(), inside: rects.every((q) => q.left >= inner.left && q.right <= inner.right), whole: lines <= words }
        }))
        for (const x of r) {
          expect.ok(x.inside, `${w}px ${text}%: "${x.name}" stays inside the tile's padding`)
          expect.ok(x.whole, `${w}px ${text}%: "${x.name}" is not cut inside a word`)
        }
      }
    },
  },
  {
    name: 'the States board: one tile size, captions 8px or more clear of the ring and the shadow, specimens 16px or more apart (390, 320 and 1024px; 200% text)',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      for (const [w, text] of [[390, 100], [320, 100], [390, 200], [1024, 100]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(200)
        const r = await page.evaluate(() => [...document.querySelectorAll('#states ~ .demo .tile-states > figure')].map((f) => {
          const t = f.querySelector('.tile'), cs = getComputedStyle(t), b = t.getBoundingClientRect()
          // what is painted around the frame: the focus ring (outline) and every box-shadow (lift, doubled frame, halo)
          const ext = { l: 0, r: 0, t: 0, b: 0 }
          if (cs.outlineStyle !== 'none') { const o = parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth); ext.l = ext.r = ext.t = ext.b = o }
          for (const m of cs.boxShadow.matchAll(/(-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px (-?[\d.]+)px/g)) {
            const [x, y, , sp] = m.slice(1).map(Number)
            if (/rgba\([^)]*, 0\)/.test(cs.boxShadow) && x === 0 && y === 0 && sp === 0) continue
            ext.l = Math.max(ext.l, sp - x); ext.r = Math.max(ext.r, sp + x); ext.t = Math.max(ext.t, sp - y); ext.b = Math.max(ext.b, sp + y)
          }
          const cap = f.querySelector('figcaption').getBoundingClientRect()
          return { name: f.querySelector('figcaption').textContent.trim(), w: b.width, h: b.height, vis: { left: b.left - ext.l, right: b.right + ext.r, top: b.top - ext.t, bottom: b.bottom + ext.b }, cap: { top: cap.top, bottom: cap.bottom } }
        }))
        expect.equal(r.length, 8, `${w}px ${text}%: eight specimens`)
        for (const x of r) {
          expect.ok(Math.abs(x.w - r[0].w) <= 1 && Math.abs(x.h - r[0].h) <= 1, `${w}px ${text}%: "${x.name}" is the same tile (${x.w.toFixed(0)} x ${x.h.toFixed(0)})`)
          expect.ok(x.cap.top - x.vis.bottom >= 8, `${w}px ${text}%: "${x.name}" caption is ${(x.cap.top - x.vis.bottom).toFixed(1)}px under what the tile paints`)
        }
        for (const a of r) for (const b of r) {
          if (a === b) continue
          const sameRow = Math.abs(a.vis.top - b.vis.top) < a.h / 2
          if (sameRow && b.vis.left > a.vis.left) expect.ok(b.vis.left - a.vis.right >= 16, `${w}px ${text}%: "${a.name}" and "${b.name}" are ${(b.vis.left - a.vis.right).toFixed(1)}px apart`)
          if (!sameRow && b.vis.top > a.cap.bottom && b.vis.left < a.vis.right && a.vis.left < b.vis.right) expect.ok(b.vis.top - a.cap.bottom >= 16, `${w}px ${text}%: "${b.name}" is ${(b.vis.top - a.cap.bottom).toFixed(1)}px under the caption "${a.name}"`)
        }
      }
    },
  },
  {
    name: 'a badge is chrome: 24px with 14px figures at any text size, like the icon beside it',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      for (const text of [100, 200]) {
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(150)
        const r = await page.evaluate(() => [...document.querySelectorAll('#badge ~ .demo .tile__badge')].map((b) => ({ t: b.textContent.trim(), h: b.getBoundingClientRect().height, f: parseFloat(getComputedStyle(b).fontSize) })))
        expect.ok(r.length >= 4, 'four badges')
        for (const b of r) {
          expect.ok(Math.abs(b.h - 24) <= 0.5, `${text}%: "${b.t}" is ${b.h}px tall`)
          expect.ok(b.f <= 14, `${text}%: "${b.t}" figures are ${b.f}px`)
        }
      }
    },
  },
]
