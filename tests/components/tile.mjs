// Interaction spec for Tile: the --lift / --fill model, on / current / unavailable states, the badge joining the
// accessible name, wrapping labels at 200% text, corners, and the caption bar swapping polarity.
export const tests = [
  {
    name: 'hover and keyboard focus raise the tile the same way; pressing sinks it',
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
      expect.equal(hover.fill, 1, 'hover: --fill 1')
      expect.ok(/4px 4px 0px 0px/.test(hover.shadow), `hard shadow, zero blur (got ${hover.shadow})`)
      expect.ok(hover.t !== 'none', `it moved (${hover.t})`)
      await page.mouse.down()
      await page.waitForTimeout(450)
      const down = await nums()
      expect.equal(down.lift, 0, 'pressed: back onto the surface')
      expect.equal(down.fill, 1, 'pressed: fill stays')
      await page.mouse.up()
      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab')
      await t.focus()
      await page.waitForTimeout(450)
      const focus = await nums()
      expect.equal(focus.lift, 1, 'keyboard focus: same lift as hover')
      expect.equal(focus.fill, 1, 'keyboard focus: same fill as hover')
      expect.ok(/3px/.test(await t.evaluate((el) => getComputedStyle(el).outlineWidth)), 'and the 3px ring')
    },
  },
  {
    name: 'the tone decides the hover fill: a toned tile fills with its own solid, a plain tile with the accent',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const r = await page.evaluate(async () => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 1
        const cx = cv.getContext('2d', { willReadFrequently: true })
        const rgb = (css) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data] }
        const toned = document.querySelector('#quick ~ .demo a.tile[data-tone="1"]')
        const plain = document.querySelector('#quick ~ .demo a.tile:not([data-tone])')
        const fill = (el, cls) => { el.classList.add(cls) }
        const before = { toned: rgb(getComputedStyle(toned).backgroundColor), plain: rgb(getComputedStyle(plain).backgroundColor) }
        fill(toned, 'is-hover'); fill(plain, 'is-hover')
        await new Promise((r) => setTimeout(r, 450))
        const after = { toned: rgb(getComputedStyle(toned).backgroundColor), plain: rgb(getComputedStyle(plain).backgroundColor) }
        toned.classList.remove('is-hover'); plain.classList.remove('is-hover')
        return { before, after }
      })
      expect.ok(r.after.toned.join() !== r.before.toned.join(), 'the toned tile changes on hover')
      const dark = (c) => (c[0] + c[1] + c[2]) / 3 < 110
      expect.ok(dark(r.after.toned), `and ends dark enough for light text (${r.after.toned})`)
      expect.ok(dark(r.after.plain), `the plain tile fills with the accent (${r.after.plain})`)
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
    name: 'caption tile: the bar swaps polarity where the quick tile fills',
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const r = await page.evaluate(async () => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 1
        const cx = cv.getContext('2d', { willReadFrequently: true })
        const rgb = (css) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data].join() }
        const probe = (v) => { const p = document.createElement('i'); p.style.color = `var(${v})`; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return rgb(c) }
        const t = document.querySelector('#caption ~ .demo a.tile')
        const bar = t.querySelector('.tile__bar')
        const rest = { bg: rgb(getComputedStyle(bar).backgroundColor), ink: rgb(getComputedStyle(bar).color) }
        t.classList.add('is-hover')
        await new Promise((res) => setTimeout(res, 450))
        const hover = { bg: rgb(getComputedStyle(bar).backgroundColor), ink: rgb(getComputedStyle(bar).color) }
        t.classList.remove('is-hover')
        return { rest, hover, ink: probe('--ink'), paper: probe('--paper') }
      })
      expect.equal(r.rest.bg, r.ink, 'rest: ink bar')
      expect.equal(r.rest.ink, r.paper, 'rest: paper text')
      expect.equal(r.hover.bg, r.paper, 'hover: the bar is paper')
      expect.equal(r.hover.ink, r.ink, 'hover: with ink text')
    },
  },
  {
    name: 'reduced motion: a tile does not travel, but the shadow and fill still show',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/tile.html')
      const t = page.locator('#quick ~ .demo').first().locator('a.tile').first()
      await t.hover()
      await page.waitForTimeout(500)
      const r = await t.evaluate((el) => ({ t: getComputedStyle(el).transform, lift: getComputedStyle(el).getPropertyValue('--lift'), fill: getComputedStyle(el).getPropertyValue('--fill'), shadow: getComputedStyle(el).boxShadow }))
      expect.ok(r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)', `no movement (got ${r.t})`)
      expect.equal(Number(r.fill), 1, 'the fill still changes')
      expect.ok(/4px 4px/.test(r.shadow), 'and the shadow still says "press me"')
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
]
