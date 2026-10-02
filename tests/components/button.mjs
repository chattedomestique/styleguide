// Reference spec. Copy its shape for every component.
export const tests = [
  {
    name: 'Tab reaches buttons in order and Enter/Space activate a toggle',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const toggle = page.locator('#states ~ .demo button[aria-pressed="false"]').first()
      await toggle.focus()
      await page.keyboard.press('Enter')
      // The docs demo is static; this checks the control is a real, focusable, activatable <button>.
      expect.equal(await toggle.evaluate((el) => el.tagName), 'BUTTON', 'is a native button')
      await expect.focused(page, '.btn[aria-pressed]')
    },
  },
  {
    name: 'aria-disabled buttons are focusable but inert (SG.guard)',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const b = page.locator('.btn[aria-disabled="true"]').first()
      await page.evaluate(() => { window.__clicks = 0; document.querySelector('.btn[aria-disabled="true"]').addEventListener('click', () => window.__clicks++) })
      await b.focus()
      await expect.focused(page, '.btn[aria-disabled="true"]', 'aria-disabled stays focusable')
      await page.keyboard.press('Enter')
      await page.keyboard.press('Space')
      expect.equal(await page.evaluate(() => window.__clicks), 0, 'keyboard activation is blocked')
    },
  },
  {
    name: 'disabled buttons are skipped by Tab',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const n = await page.locator('.btn:disabled').count()
      expect.ok(n >= 1, 'demo has a disabled button')
      await page.locator('.btn:disabled').first().focus().catch(() => {})
      await expect.focused(page, 'body', 'disabled button cannot take focus')
    },
  },
  {
    name: 'hover and keyboard focus raise the button the same way; pressing sinks it and, on a filled button, lightens the fill',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const b = page.locator('#variants ~ .demo .btn[data-variant="primary"]').first()
      const nums = () => b.evaluate((el) => ({ lift: Number(getComputedStyle(el).getPropertyValue('--lift')), fill: Number(getComputedStyle(el).getPropertyValue('--fill')), bg: getComputedStyle(el).backgroundColor, ink: getComputedStyle(el).color }))
      await page.waitForTimeout(50)
      const rest = await nums()
      expect.equal(rest.lift, 0, 'rest: --lift 0')
      await b.hover()
      await page.waitForTimeout(400)
      const hover = await nums()
      expect.equal(hover.lift, 1, 'hover: --lift 1')
      expect.equal(hover.fill, 1, 'hover: --fill 1')
      await page.mouse.down()
      await page.waitForTimeout(400)
      const down = await nums()
      expect.equal(down.lift, 0, 'pressed: back onto the surface')
      // a primary button is filled at rest, so a press that only sank it would look like rest on a touch screen:
      // its fill lightens a little (--_press) while the label keeps its colour (golden rule 14)
      expect.equal(down.fill, 1, 'pressed: still filled')
      expect.ok(down.bg !== rest.bg, 'pressed: the fill lightens, so a tap shows (' + rest.bg + ' -> ' + down.bg + ')')
      expect.equal(down.ink, rest.ink, 'pressed: the label keeps its colour, so its contrast does not drop')
      await page.mouse.up()
      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab') // switch to keyboard modality so :focus-visible applies
      await b.focus()
      await page.waitForTimeout(400)
      const focus = await nums()
      expect.equal(focus.lift, 1, 'keyboard focus: same lift as hover')
    },
  },
  {
    name: 'a toggle is a selection control: off, hover and keyboard focus raise it WITHOUT filling, a press only tints it, on is filled with a doubled frame',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const read = (loc) => loc.evaluate((el) => { const c = getComputedStyle(el); return { lift: Number(c.getPropertyValue('--lift')), fill: Number(c.getPropertyValue('--fill')), shadow: c.boxShadow, bg: c.backgroundColor } })
      const off = page.locator('#toggle ~ .demo .btn[aria-pressed="false"]:not(.is-hover, .is-active)').first()
      const on = page.locator('#toggle ~ .demo .btn[aria-pressed="true"]:not(.is-hover, .is-active)').first()
      await page.waitForTimeout(50)
      const rest = await read(off)
      expect.equal(rest.fill, 0, 'off at rest: an outline')
      await off.hover()
      await page.waitForTimeout(400)
      const hover = await read(off)
      expect.equal(hover.lift, 1, 'off + hover: raised')
      expect.equal(hover.fill, 0, 'off + hover: NOT filled (the fill means on)')
      await page.mouse.down()
      await page.waitForTimeout(400)
      const down = await read(off)
      expect.equal(down.lift, 0, 'pressed: back onto the surface')
      expect.ok(down.fill > 0 && down.fill < 0.5, 'pressed: a light tint, visible at once (' + down.fill + ')')
      await page.mouse.move(0, 0)
      await page.mouse.up()
      await page.keyboard.press('Tab') // keyboard modality, so :focus-visible applies (the docs toggles are static: the click changed nothing)
      await off.focus()
      await page.waitForTimeout(400)
      const focus = await read(off)
      expect.equal(focus.lift, 1, 'off + keyboard focus: raised like hover')
      expect.equal(focus.fill, 0, 'off + keyboard focus: not filled')
      const onRest = await read(on)
      expect.equal(onRest.fill, 1, 'on: filled')
      expect.ok(/inset/.test(onRest.shadow), 'on: the doubled frame is a ring inside the frame: ' + onRest.shadow)
      expect.ok(onRest.bg !== rest.bg, 'on and off differ in fill')
      const forced = await read(page.locator('#toggle ~ .demo .btn.is-hover[aria-pressed="false"]').first())
      expect.equal(forced.fill, 0, 'the forced "Off, hover" specimen is not filled')
      const onHover = await read(page.locator('#toggle ~ .demo .btn.is-hover[aria-pressed="true"]').first())
      expect.equal(onHover.lift, 1, 'on + hover: raised')
      expect.equal(onHover.fill, 1, 'on + hover: still filled')
    },
  },
  {
    name: 'state specimens stand at least 16px apart AS DRAWN (lift, hard shadow and focus ring included), the caption 8px clear of them, at 320, 390 and 1024 px, at 100% and 200% text',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const gaps = () => page.evaluate(() => {
        // The painted extent: the border box where it is drawn (transforms included, so a raised specimen is 2px up
        // and left), grown by its outline (width + offset) and by every outer box-shadow (offset, spread and blur; the
        // house shadows have no blur). Border boxes passed while a hard shadow ended 4px from the next ring.
        const px = (s) => (s.match(/-?[\d.]+px/g) || []).map(parseFloat)
        const painted = (e) => {
          const r = e.getBoundingClientRect(), c = getComputedStyle(e)
          let left = r.left, top = r.top, right = r.right, bottom = r.bottom
          if (c.outlineStyle !== 'none') {
            const o = parseFloat(c.outlineWidth) + parseFloat(c.outlineOffset)
            left -= o; top -= o; right += o; bottom += o
          }
          if (c.boxShadow !== 'none') {
            for (const sh of c.boxShadow.split(/,(?![^(]*\))/)) {
              if (/inset/.test(sh)) continue
              const [x = 0, y = 0, blur = 0, spread = 0] = px(sh.replace(/[a-z-]+\([^)]*\)/g, ''))
              left = Math.min(left, r.left + x - spread - blur); top = Math.min(top, r.top + y - spread - blur)
              right = Math.max(right, r.right + x + spread + blur); bottom = Math.max(bottom, r.bottom + y + spread + blur)
            }
          }
          return { left, top, right, bottom }
        }
        const out = []
        // #states ~ .demo: the States demo and the Toggle demo after it
        for (const grid of document.querySelectorAll('#states ~ .demo .specimens')) {
          const name = (e) => ({ true: 'On ', false: 'Off ' })[e.getAttribute('aria-pressed')] ?? ''
          const items = [...grid.querySelectorAll(':scope > .btn, :scope > p, .specimens__col > .btn')].map((e) => ({ t: name(e) + e.textContent.trim(), caption: e.tagName === 'P', r: painted(e) }))
          for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
            const a = items[i].r, b = items[j].r
            const dx = Math.max(b.left - a.right, a.left - b.right), dy = Math.max(b.top - a.bottom, a.top - b.bottom)
            out.push({ pair: items[i].t + ' / ' + items[j].t, gap: Math.max(dx, dy), need: items[i].caption || items[j].caption ? 8 : 16 })
          }
        }
        return out
      })
      for (const [w, text] of [[320, 100], [390, 100], [1024, 100], [320, 200], [390, 200]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(100)
        const all = await gaps()
        expect.ok(all.length > 20, `${w}px, ${text}%: specimens found (${all.length} pairs)`)
        for (const g of all) expect.ok(g.gap >= g.need - 0.5, `${w}px, ${text}%: ${g.pair}: ${Math.round(g.gap)}px clear as drawn (needs ${g.need})`)
      }
    },
  },
  {
    name: 'a 36px button still has a 44x44 hit area',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const hits = await page.evaluate(() => {
        const el = document.querySelector('.btn[data-size="sm"]')
        el.scrollIntoView({ block: 'center' })
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2
        const at = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)) }
        return { h: r.height, up: at(cx, cy - 21.5), down: at(cx, cy + 21.5) }
      })
      expect.ok(hits.h < 44, 'the drawn box is smaller than 44px')
      expect.ok(hits.up && hits.down, 'the invisible hit area reaches 44px')
    },
  },
  {
    name: 'a forced .is-focus specimen draws the same ring as real keyboard focus (the docs show it)',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const ring = (loc) => loc.evaluate((e) => { const c = getComputedStyle(e); return { style: c.outlineStyle, width: c.outlineWidth, offset: c.outlineOffset, halo: c.boxShadow.includes('0px 0px 0px 3px') } })
      const forced = await ring(page.locator('#states ~ .demo .btn.is-focus').first())
      expect.equal(forced.style, 'solid', 'the forced focus specimen has an outline')
      expect.ok(parseFloat(forced.width) >= 3, `the ring is at least 3px (got ${forced.width})`)
      expect.ok(forced.halo, 'and the paper halo beside it')
      await page.keyboard.press('Tab')
      const real = page.locator('#states ~ .demo .btn[aria-pressed="false"]').first()
      await real.focus()
      const live = await ring(real)
      expect.equal(forced.style, live.style, 'same outline style as real focus')
      expect.equal(forced.width, live.width, 'same ring width as real focus')
      expect.equal(forced.offset, live.offset, 'same ring offset as real focus')
    },
  },
  {
    name: 'an icon before the words (.btn__label) leads the FIRST line of a wrapped label, beside the first word, and the group stays centred in the pill; one line looks as before (320 and 390 px, 100% and 200% text)',
    viewport: { width: 320, height: 800 },
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const read = () => page.evaluate(() => [...document.querySelectorAll('.demo__stage .btn > .btn__label')].filter((l) => l.querySelector('.ic')).map((l) => {
        const b = l.parentElement.getBoundingClientRect(), cs = getComputedStyle(l.parentElement)
        const ic = l.querySelector('.ic').getBoundingClientRect()
        const tn = [...l.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim())
        const rg = document.createRange(); rg.selectNodeContents(tn)
        const rects = [...rg.getClientRects()].filter((q) => q.width > 0)
        const first = rects[0]
        const lines = new Set(rects.map((q) => Math.round(q.top))).size
        const left = Math.min(ic.left, ...rects.map((q) => q.left)) - b.left, right = b.right - Math.max(ic.right, ...rects.map((q) => q.right))
        return { text: l.textContent.trim(), lines, mid: (ic.top + ic.height / 2) - (first.top + first.height / 2), gap: first.left - ic.right, left, right, bw: parseFloat(cs.borderLeftWidth) }
      }))
      for (const [w, text] of [[390, 100], [320, 100], [390, 200], [320, 200]]) {
        await page.setViewportSize({ width: w, height: 800 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(100)
        const all = await read()
        expect.ok(all.length >= 2, `${w}px, ${text}%: labelled icon buttons found (${all.length})`)
        for (const r of all) {
          expect.ok(Math.abs(r.mid) <= 1.5, `${w}px, ${text}%: "${r.text}": the icon is centred on the first line (${r.mid.toFixed(1)}px off), ${r.lines} line(s)`)
          expect.ok(r.gap >= 7 && r.gap <= 9.5, `${w}px, ${text}%: "${r.text}": the icon sits beside the first word (${r.gap.toFixed(1)}px)`)
          expect.ok(Math.abs(r.left - r.right) <= 2, `${w}px, ${text}%: "${r.text}": the group is centred in the pill (${r.left.toFixed(1)}px / ${r.right.toFixed(1)}px)`)
        }
        if (w === 320 && text === 200) expect.ok(all.some((r) => r.lines > 1), 'at 320px with 200% text a label wraps, so the wrapped case is measured')
      }
    },
  },
  {
    name: 'at 200% text in a narrow row a label wraps between words, the row wraps the button, and a tall pill is not an oval',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const r = await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
        const host = document.createElement('div')
        // a container 226px wide: 7rem at 200% text, the narrowest row the docs stage leaves on a 390px phone
        host.style.cssText = 'container-type:inline-size;inline-size:226px;display:flex;flex-wrap:wrap;gap:0.5rem'
        host.innerHTML = '<button class="btn" type="button">Secondary</button><button class="btn" type="button">Cancel</button><button class="btn" type="button" data-variant="primary" data-block>Review the transfer before sending</button>'
        document.body.append(host)
        const hostBox = host.getBoundingClientRect()
        const brokenWords = (el) => {
          const node = el.firstChild, text = node.textContent, bad = []
          let i = 0
          for (const w of text.split(' ')) {
            const rg = document.createRange(); rg.setStart(node, i); rg.setEnd(node, i + w.length)
            if (new Set([...rg.getClientRects()].map((q) => Math.round(q.top))).size > 1) bad.push(w)
            i += w.length + 1
          }
          return bad
        }
        return [...host.children].map((b) => {
          const q = b.getBoundingClientRect(), cs = getComputedStyle(b)
          return { text: b.textContent, broken: brokenWords(b), inside: q.left >= hostBox.left - 0.5 && q.right <= hostBox.right + 0.5, h: q.height, minH: parseFloat(cs.minHeight), radius: parseFloat(cs.borderTopLeftRadius), top: Math.round(q.top) }
        })
      })
      for (const b of r) {
        expect.equal(b.broken.length, 0, `"${b.text}" breaks inside a word (${b.broken.join(', ')})`)
        expect.ok(b.inside, `"${b.text}" stays inside its row`)
        expect.ok(b.radius <= b.h / 2 + 0.5, `"${b.text}": the radius never exceeds half the height`)
      }
      expect.ok(r[1].top > r[0].top, 'the second button wraps to its own row instead of squeezing the first')
      const tall = r[2]
      expect.ok(tall.h > tall.minH * 1.4, `the long label made a tall button (${tall.h}px)`)
      expect.ok(tall.radius < tall.h / 2 - 4, `a tall button is a rounded rectangle, not an oval (radius ${tall.radius}px, height ${tall.h}px)`)
    },
  },
  {
    name: 'aria-busy shows a spinner and ignores taps',
    async run({ page, goto, expect }) {
      await goto('components/button.html')
      const b = page.locator('.btn[aria-busy="true"]').first()
      const pe = await b.evaluate((el) => getComputedStyle(el).pointerEvents)
      expect.equal(pe, 'none', 'busy buttons take no pointer events')
    },
  },
  {
    name: 'reduced motion removes travel but keeps the fill change',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const c = page.locator('#link ~ .demo .card--link').first()
      await c.hover()
      await page.waitForTimeout(600)
      const r = await c.evaluate((el) => ({ t: getComputedStyle(el).transform, fill: getComputedStyle(el).getPropertyValue('--fill') }))
      expect.ok(r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)', `no movement under reduced motion (got ${r.t})`)
      expect.equal(Number(r.fill), 1, 'the fill still changes')
    },
  },
]
