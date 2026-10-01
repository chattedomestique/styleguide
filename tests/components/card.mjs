// Words cut across two lines, when the word would have fitted a line of its own: a Range over a word has client rects
// at more than one height once the word was broken; a word wider than the whole line (an e-mail address in a stress
// demo) may break. (Self-contained, because Playwright serialises it into the page.)
const brokenWords = (selector) => {
  const out = []
  for (const root of document.querySelectorAll(selector)) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let n; (n = walker.nextNode()); ) {
      const re = /\S+/g
      for (let m; (m = re.exec(n.data)); ) {
        const r = document.createRange()
        r.setStart(n, m.index)
        r.setEnd(n, m.index + m[0].length)
        if (new Set([...r.getClientRects()].map((q) => Math.round(q.top))).size < 2) continue
        const probe = document.createElement('span')
        const cs = getComputedStyle(n.parentElement)
        for (const k of ['fontFamily', 'fontSize', 'fontWeight', 'fontStretch', 'fontStyle', 'letterSpacing', 'textTransform', 'fontVariationSettings']) probe.style[k] = cs[k]
        probe.style.whiteSpace = 'nowrap'
        probe.style.position = 'absolute'
        probe.textContent = m[0]
        document.body.append(probe)
        const w = probe.getBoundingClientRect().width
        probe.remove()
        const rcs = getComputedStyle(root)
        const line = root.clientWidth - parseFloat(rcs.paddingLeft) - parseFloat(rcs.paddingRight)
        if (w <= line) out.push(`${m[0]} (${w.toFixed(0)}px word, ${line.toFixed(0)}px line)`)
      }
    }
  }
  return out
}

export const tests = [
  {
    name: 'link card: hover lifts it (2px, hard shadow); motion is on',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const c = page.locator('#link ~ .demo .card--link').first()
      await c.hover()
      await page.waitForTimeout(600)
      const r = await c.evaluate((el) => ({ t: getComputedStyle(el).transform, sh: getComputedStyle(el).boxShadow, lift: getComputedStyle(el).getPropertyValue('--lift') }))
      expect.equal(Number(r.lift), 1, '--lift is 1')
      expect.ok(r.t !== 'none', `card has moved (got ${r.t})`)
      expect.ok(/0px 0px/.test(r.sh) || / 0px /.test(r.sh), `shadow is hard-edged (got ${r.sh})`)
    },
  },
  {
    name: 'link card: the card wears the focus ring, the anchor inside does not',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      await page.keyboard.press('Tab')
      const a = page.locator('#link ~ .demo .card__link').first()
      await a.focus()
      await page.waitForTimeout(400)
      const r = await a.evaluate((el) => {
        const card = el.closest('.card')
        const cs = getComputedStyle(card)
        return { anchor: getComputedStyle(el).outlineStyle, card: cs.outlineStyle, w: parseFloat(cs.outlineWidth), lift: cs.getPropertyValue('--lift') }
      })
      expect.equal(r.anchor, 'none', 'anchor has no ring of its own')
      expect.ok(r.card !== 'none' && r.w >= 3, 'card has a 3px ring')
      expect.equal(Number(r.lift), 1, 'keyboard focus lifts like hover')
    },
  },
  {
    name: 'link card: clicking anywhere on the card follows its link',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const c = page.locator('#link ~ .demo .card--link').first()
      await c.scrollIntoViewIfNeeded()
      const box = await c.boundingBox()
      await page.evaluate(() => { document.querySelectorAll('.card__link').forEach((a, i) => a.setAttribute('href', '#hit-' + i)) })
      await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.3)
      await page.waitForTimeout(100)
      expect.ok(/#hit-\d+$/.test(await page.evaluate(() => location.hash)), 'the URL changed')
    },
  },
  {
    name: 'disabled card takes no pointer events and is not an anchor',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const c = page.locator('.card[aria-disabled="true"]').first()
      expect.equal(await c.evaluate((el) => getComputedStyle(el).pointerEvents), 'none', 'pointer-events none')
      expect.equal(await c.evaluate((el) => el.tagName === 'A' || !!el.querySelector('a[href]')), false, 'no link inside')
    },
  },
  {
    name: 'portrait card is 5:7, and the original .card--study name still works',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const r = await page.evaluate(() => {
        const host = document.querySelector('.card--portrait').parentElement
        const old = document.createElement('article')
        old.className = 'card card--study'
        host.appendChild(old)
        const ratio = (el) => getComputedStyle(el).aspectRatio
        const out = { portrait: ratio(document.querySelector('.card--portrait')), study: ratio(old) }
        old.remove()
        return out
      })
      expect.equal(r.portrait, '5 / 7', 'portrait ratio')
      expect.equal(r.study, '5 / 7', 'legacy alias ratio')
    },
  },
  {
    name: 'data-corners switches the card radius roles, and only them',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const r = await page.evaluate(() => {
        const card = document.querySelector('.card')
        const get = () => getComputedStyle(card).borderTopLeftRadius
        const square = get()
        document.documentElement.setAttribute('data-corners', 'soft')
        const soft = get()
        document.documentElement.removeAttribute('data-corners')
        return { square, soft }
      })
      expect.equal(r.square, '0px', 'square by default')
      expect.equal(r.soft, '24px', 'soft = --radius-3')
    },
  },
  {
    name: 'panel control is a disclosure: constant name, aria-expanded flips, the region hides',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const btn = page.locator('#pn1-body').locator('xpath=ancestor::section[1]').locator('.card__ctl')
      await btn.scrollIntoViewIfNeeded()
      await btn.focus()
      const name = await btn.evaluate((b) => b.getAttribute('aria-labelledby'))
      expect.equal(name, 'pn1-t', 'named by the panel title')
      await page.keyboard.press('Enter')
      await expect.attr(page, '.card__ctl[aria-controls="pn1-body"]', 'aria-expanded', 'false', 'collapsed after Enter')
      expect.equal(await page.locator('#pn1-body').isHidden(), true, 'region hidden')
      const glyph = await btn.locator('.ic').evaluate((el) => getComputedStyle(el).getPropertyValue('--ic').includes('M12 5v14'))
      expect.ok(glyph, 'the glyph flips from minus to plus')
      await page.keyboard.press('Space')
      await expect.attr(page, '.card__ctl[aria-controls="pn1-body"]', 'aria-expanded', 'true', 'expanded after Space')
      expect.equal(await page.locator('#pn1-body').isVisible(), true, 'region visible again')
    },
  },
  {
    name: 'portrait card: "Show answer" reveals the answer and announces it politely',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const btn = page.locator('button[aria-controls="pc1-a"]')
      await btn.scrollIntoViewIfNeeded()
      expect.equal(await page.locator('#pc1-a').isHidden(), true, 'the answer starts hidden')
      await btn.focus()
      await page.keyboard.press('Enter')
      expect.equal(await page.locator('#pc1-a').isVisible(), true, 'the answer is shown')
      await expect.attr(page, 'button[aria-controls="pc1-a"]', 'aria-expanded', 'true')
      await page.waitForTimeout(150)
      const live = await page.evaluate(() => Array.from(document.querySelectorAll('[aria-live]')).map((n) => n.textContent).join('|'))
      expect.ok(/Triangle/.test(live), `the live region says the answer (got "${live}")`)
    },
  },
  {
    name: 'forced-state specimens are inert: no decoy tab stops or second focus rings',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const n = await page.evaluate(() => document.querySelectorAll('#states ~ .demo [inert] a[href]').length)
      expect.ok(n >= 5, 'the specimens exist')
      await page.locator('#states ~ .demo [inert] a').first().evaluate((a) => a.focus())
      await expect.focused(page, 'body', 'an inert link cannot take focus')
    },
  },
  {
    name: 'aria-selected on a plain card does nothing; aria-current and aria-pressed select it',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const r = await page.evaluate(() => {
        const host = document.querySelector('#plain ~ .demo .grid')
        const mk = (attrs) => { const a = document.createElement('article'); a.className = 'card'; for (const k in attrs) a.setAttribute(k, attrs[k]); a.innerHTML = '<div class="card__body"><p class="card__title">x</p></div>'; host.appendChild(a); return a }
        const sel = (el) => getComputedStyle(el).getPropertyValue('--shadow-select').trim()
        const out = {
          none: sel(mk({})),
          ariaSelectedArticle: sel(mk({ 'aria-selected': 'true' })),
          current: sel(mk({ 'aria-current': 'page' })),
          currentFalse: sel(mk({ 'aria-current': 'false' })),
          pressed: sel(mk({ 'aria-pressed': 'true' })),
          option: sel(mk({ role: 'option', 'aria-selected': 'true' })),
        }
        host.querySelectorAll('.card:not([data-tone]):nth-last-child(-n+6)').forEach((e) => e.remove())
        return out
      })
      const off = r.none
      expect.equal(r.ariaSelectedArticle, off, 'aria-selected is not a selection on an article')
      expect.equal(r.currentFalse, off, 'aria-current="false" is not selected')
      expect.ok(r.current !== off && r.pressed !== off && r.option !== off, 'current, pressed and option cards are selected')
    },
  },
  {
    name: 'selected is visible on the inverted tone (a gap of canvas, not ink on ink)',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const sh = await page.evaluate(() => {
        const a = document.createElement('article'); a.className = 'card'; a.setAttribute('data-tone', 'ink'); a.setAttribute('aria-current', 'page')
        a.innerHTML = '<div class="card__body"><p class="card__title">x</p></div>'
        document.querySelector('#plain ~ .demo .grid').appendChild(a)
        const v = getComputedStyle(a).boxShadow; a.remove(); return v
      })
      expect.ok((sh.match(/\dpx/g) || []).length >= 8 && sh.split('),').length >= 1, `two rings (got ${sh})`)
      expect.ok(sh.split(/rgb|oklch|color\(/).length >= 3, 'the ring is drawn in two colours')
    },
  },
  {
    name: '<button class="card card--ghost"> fills its parent instead of collapsing',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const w = await page.evaluate(() => {
        const host = document.createElement('div'); host.style.cssText = 'inline-size:30rem'
        host.innerHTML = '<button class="card card--ghost" type="button"><span class="card__title">Add a shape</span></button>'
        document.body.appendChild(host)
        const r = { btn: host.firstChild.getBoundingClientRect().width, host: host.getBoundingClientRect().width }
        host.remove(); return r
      })
      expect.ok(w.btn >= w.host - 1, `button is ${Math.round(w.btn)}px in a ${Math.round(w.host)}px parent`)
    },
  },
  {
    name: 'bar control, list row and action answer hover and press like every other pressable part',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const fill = (sel) => page.evaluate((s) => Number(getComputedStyle(document.querySelector(s)).getPropertyValue('--fill')), sel)
      const ctl = page.locator('#pn1-body').locator('xpath=ancestor::section[1]').locator('.card__ctl')
      await ctl.scrollIntoViewIfNeeded()
      await page.mouse.move(0, 0)
      await page.waitForTimeout(300)
      expect.equal(await ctl.evaluate((e) => Number(getComputedStyle(e).getPropertyValue('--fill'))), 0, 'ctl rest')
      await ctl.hover(); await page.waitForTimeout(400)
      expect.equal(await ctl.evaluate((e) => Number(getComputedStyle(e).getPropertyValue('--fill'))), 1, 'ctl hover')
      const row = page.locator('#pn2-body li').first()
      await row.scrollIntoViewIfNeeded()
      await row.hover(); await page.waitForTimeout(400)
      expect.equal(await row.evaluate((e) => Number(getComputedStyle(e).getPropertyValue('--fill'))), 1, 'row hover')
      // the whole row is the target: clicking the count (not the link text) follows the link
      await page.evaluate(() => { document.querySelectorAll('#pn2-body a').forEach((a, i) => a.setAttribute('href', '#row-' + i)) })
      const cb = await row.locator('span').boundingBox()  // a real click: Playwright's own click refuses to click through the overlay
      await page.mouse.click(cb.x + cb.width / 2, cb.y + cb.height / 2)
      expect.equal(await page.evaluate(() => location.hash), '#row-0', 'the count is part of the link')
    },
  },
  {
    name: 'right-to-left: the notch and the stack mirror',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const r = await page.evaluate(() => {
        const n = document.querySelector('.card--notch'); const st = document.querySelector('.card--stack')
        const ltrPos = getComputedStyle(n).backgroundPosition, ltrSh = getComputedStyle(st).boxShadow
        document.documentElement.dir = 'rtl'
        const rtlPos = getComputedStyle(n).backgroundPosition, rtlSh = getComputedStyle(st).boxShadow
        const act = document.querySelector('.card--notch > .card__action').getBoundingClientRect(), nb = n.getBoundingClientRect()
        const actLeft = act.left - nb.left
        document.documentElement.dir = 'ltr'
        return { ltrPos, rtlPos, ltrSh, rtlSh, actLeft }
      })
      expect.ok(r.ltrPos !== r.rtlPos, 'notch background is mirrored')
      expect.ok(r.ltrSh !== r.rtlSh, 'stack shadow is mirrored')
      expect.ok(r.actLeft < 120, `the notch action moved to the left edge (${Math.round(r.actLeft)}px from it)`)
    },
  },
  {
    name: 'state specimens: the ring and the hard shadow of a specimen clear its caption (at least 12px between them)',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const r = await page.evaluate(() => [...document.querySelector('#parts ~ .demo').querySelectorAll('.card')].map((c) => {
        const cap = c.parentElement.querySelector('.t-meta')
        return { cls: c.className, gap: cap.getBoundingClientRect().top - c.getBoundingClientRect().bottom }
      }))
      expect.ok(r.length >= 6, 'six specimens')
      for (const s of r) expect.ok(s.gap >= 12, `"${s.cls}": ${s.gap}px between the specimen and its caption (the ring is 3px + 3px offset, the shadow 4px)`)
    },
  },
  {
    name: 'a panel list switches its rows as a whole, and its text starts where the bar label starts',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      for (const text of [100, 200]) {
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(250)
        const r = await page.evaluate(() => {
          const card = document.querySelector('#panel ~ .demo .card[data-tone="ink"]')
          const left = (el) => { const rg = document.createRange(); rg.selectNodeContents(el); return rg.getClientRects()[0].left }
          return {
            label: left(card.querySelector('.card__label')),
            rows: [...card.querySelectorAll('.card__list > li')].map((li) => {
              const a = li.querySelector('a'), v = li.querySelector(':scope > span')
              return { name: a.textContent.trim(), left: left(a), below: v.getBoundingClientRect().top >= a.getBoundingClientRect().bottom - 1 }
            }),
          }
        })
        expect.equal(new Set(r.rows.map((x) => x.below)).size, 1, `${text}%: every row has the same layout (${r.rows.map((x) => x.name + (x.below ? ' below' : ' beside')).join(', ')})`)
        for (const x of r.rows) expect.ok(Math.abs(x.left - r.label) <= 1, `${text}%: "${x.name}" starts at ${x.left.toFixed(1)}px, the bar label at ${r.label.toFixed(1)}px`)
      }
    },
  },
  {
    name: 'square cards: square two to a phone row with one height, and a wide one stops being square',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const read = () => page.evaluate(() => [...document.querySelectorAll('#stat ~ .demo .card--square')].slice(0, 2).map((c) => {
        const b = c.getBoundingClientRect(), body = c.querySelector('.card__body')
        const cs = getComputedStyle(c)
        // empty: the body's height beyond its padding, its children and the gaps between them
        const bs = getComputedStyle(body), kids = [...body.children]
        const used = kids.reduce((n, k) => n + k.getBoundingClientRect().height, 0) + (kids.length - 1) * parseFloat(bs.rowGap) + parseFloat(bs.paddingTop) + parseFloat(bs.paddingBottom)
        return { w: b.width, h: b.height, top: b.top, spill: body.scrollHeight - body.clientHeight, empty: body.clientHeight - used, frame: parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth), rem: parseFloat(getComputedStyle(document.documentElement).fontSize) }
      }))
      const phone = await read()
      expect.ok(Math.abs(phone[0].top - phone[1].top) <= 1, 'the two stats share a row at 390px')
      expect.ok(Math.abs(phone[0].h - phone[1].h) <= 1, `with one height (${phone[0].h.toFixed(0)} / ${phone[1].h.toFixed(0)})`)
      for (const c of phone) expect.ok(Math.abs(c.w - c.h) <= 1, `and square (${c.w.toFixed(0)} x ${c.h.toFixed(0)})`)
      await page.setViewportSize({ width: 1024, height: 800 })
      await page.evaluate(() => document.querySelector('#stat ~ .demo .grid').style.setProperty('--grid-min', '100%'))
      await page.waitForTimeout(200)
      for (const c of await read()) {
        expect.ok(c.h <= 14 * c.rem + c.frame + 1 && c.h < c.w, `a ${c.w.toFixed(0)}px wide square card stops at ${c.h.toFixed(0)}px tall (14rem and its frame)`)
        expect.ok(c.spill <= 1, 'and its content still fits')
        expect.ok(c.empty <= 1, `and it is as tall as its content, with no empty band (${c.empty.toFixed(1)}px)`)
      }
      await page.setViewportSize({ width: 390, height: 844 })
      await page.addStyleTag({ content: 'html{font-size:200%}' })
      await page.waitForTimeout(200)
      for (const c of await read()) {
        expect.ok(c.spill <= 1, `200%: the content fits its card (${c.spill}px over)`)
        expect.ok(c.h < c.w - 16, `200%: a card alone on its row is as tall as its content, not a ${c.w.toFixed(0)}px square (${c.h.toFixed(0)}px)`)
      }
    },
  },
  {
    name: 'at 200% text on a phone: link eyebrows and the ghost title keep their words whole beside the action circle',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      await page.addStyleTag({ content: 'html{font-size:200%}' })
      await page.waitForTimeout(250)
      const r = await page.evaluate(() => {
        // the lines of the WORDS: a range over the whole element would also return the box of each fact <span>
        // (data-facts), whose top is the line box's, not the glyphs'
        const lines = (el) => {
          const tops = new Set()
          const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
          for (let n; (n = w.nextNode()); ) { const rg = document.createRange(); rg.selectNodeContents(n); for (const q of rg.getClientRects()) if (q.width > 1) tops.add(Math.round(q.top)) }
          return tops.size
        }
        const eyebrows = [...document.querySelectorAll('#link ~ .demo .card--link .card__eyebrow')].slice(0, 3).map((e) => ({ t: e.textContent.trim(), lines: lines(e) }))
        const ghost = document.querySelector('#ghost ~ .demo .card--ghost')
        const title = ghost.querySelector('.card__title').getBoundingClientRect(), circle = ghost.querySelector('.card__action').getBoundingClientRect()
        return { eyebrows, ghostLines: lines(ghost.querySelector('.card__title')), beside: title.left >= circle.right - 1 && title.top < circle.bottom }
      })
      for (const e of r.eyebrows) expect.equal(e.lines, 1, `"${e.t}" holds one line`)
      expect.ok(r.beside, 'the ghost title sits beside its circle')
      expect.equal(r.ghostLines, 1, '"Add a shape" holds one line')
      const cut = await page.evaluate(brokenWords, '.card__title, .card__eyebrow, .card__meta, .card__text, .card__list a')
      expect.equal(cut.join(', '), '', 'no word on the page is cut inside')
    },
  },
  {
    name: 'a row card reads in order at every width: the value under the title when narrow, every part stacked when cramped; a lone icon control stays at the end',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      const read = (w) => page.evaluate((width) => {
        const host = document.createElement('div')
        host.style.cssText = `inline-size:${width}px`
        host.innerHTML = '<article class="card card--row"><span class="card__tile" aria-hidden="true"><span class="ic ic--heart" aria-hidden="true"></span></span><div class="card__main"><p class="card__title">Heart</p><p class="card__meta">Card 06</p></div><div class="card__trail"><p>Known</p></div></article>'
          + '<article class="card card--row"><span class="card__tile" aria-hidden="true"><span class="ic ic--heart" aria-hidden="true"></span></span><div class="card__main"><p class="card__title">Heart</p><p class="card__meta">Card 06</p></div><div class="card__trail"><button class="btn" data-shape="circle" data-size="sm" type="button" aria-label="Delete Heart"><span class="ic ic--trash-2" aria-hidden="true"></span></button></div></article>'
        document.querySelector('#row').before(host)
        const box = (el) => el.getBoundingClientRect()
        const [a, b] = host.children
        const out = {
          words: { tile: box(a.querySelector('.card__tile')), main: box(a.querySelector('.card__main')), trail: box(a.querySelector('.card__trail')) },
          icon: { main: box(b.querySelector('.card__main')), trail: box(b.querySelector('.card__trail')) },
        }
        host.remove()
        return JSON.parse(JSON.stringify(out))
      }, w)
      await page.addStyleTag({ content: 'html{font-size:200%}' })
      await page.waitForTimeout(150)
      // 200% text: 340px is a phone column (value drops under the title), 200px is cramped (everything stacks)
      const phone = await read(340)
      expect.ok(phone.words.trail.top >= phone.words.main.bottom - 1 && Math.abs(phone.words.trail.left - phone.words.main.left) <= 1, 'phone column: the value sits under the title, aligned with it')
      expect.ok(phone.words.tile.right <= phone.words.main.left, 'and the tile stays beside the title')
      expect.ok(phone.icon.trail.left >= phone.icon.main.right - 1 && phone.icon.trail.top < phone.icon.main.bottom, 'a lone icon control stays at the end of the row')
      const cramped = await read(200)
      expect.ok(cramped.words.tile.bottom <= cramped.words.main.top + 1, 'cramped: the tile, then the title')
      expect.ok(cramped.words.main.bottom <= cramped.words.trail.top + 1, 'then the value, in reading order')
    },
  },
  {
    name: 'a panel list row is 44px at 100% text, and at 200% its words keep 8px or more from the rules above and below',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      for (const text of [100, 200]) {
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(250)
        const r = await page.evaluate(() => [...document.querySelectorAll('#panel ~ .demo .card__list > li')].map((li) => {
          const b = li.getBoundingClientRect(), bt = parseFloat(getComputedStyle(li).borderTopWidth)
          let top = Infinity, bottom = -Infinity
          const w = document.createTreeWalker(li, NodeFilter.SHOW_TEXT)
          for (let n; (n = w.nextNode()); ) { if (!n.data.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n); for (const q of rg.getClientRects()) { top = Math.min(top, q.top); bottom = Math.max(bottom, q.bottom) } }
          return { name: li.querySelector('a').textContent.trim(), h: b.height, above: top - b.top - bt, below: b.bottom - bottom }
        }))
        expect.ok(r.length >= 4, 'four rows')
        for (const x of r) {
          if (text === 100) expect.ok(Math.abs(x.h - 44) <= 0.5, `100%: "${x.name}" is ${x.h.toFixed(1)}px tall`)
          else expect.ok(x.above >= 8 && x.below >= 8, `200%: "${x.name}" keeps ${x.above.toFixed(1)}px above and ${x.below.toFixed(1)}px below its words`)
        }
      }
    },
  },
  {
    name: 'a line of facts (data-facts) shows a dot between two facts on one line, and never starts or ends a line with one',
    async run({ page, goto, expect }) {
      await goto('components/card.html')
      for (const text of [100, 200]) {
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(250)
        const r = await page.evaluate(() => [...document.querySelectorAll('[data-facts]')].filter((m) => m.offsetParent).map((m) => {
          const mb = m.getBoundingClientRect(), cs = getComputedStyle(m)
          const facts = [...m.children].map((f) => {
            const b = f.getBoundingClientRect(), d = getComputedStyle(f, '::before')
            return { left: b.left, right: b.right, top: Math.round(b.top), dot: d.content, at: parseFloat(d.insetInlineStart), w: parseFloat(d.width) }
          })
          return { t: m.textContent.trim().replace(/\s+/g, ' '), clip: cs.overflowX, left: mb.left, right: mb.right, facts }
        }))
        expect.ok(r.length >= 10, `${text}%: lines of facts on the page (${r.length})`)
        for (const m of r) {
          expect.equal(m.clip, 'clip', `${text}%: "${m.t}" clips what lies past its edges`)
          m.facts.forEach((f, i) => {
            if (i === 0) return expect.ok(f.dot === 'none' || f.dot === 'normal', `${text}%: "${m.t}": no dot before the first fact`)
            expect.ok(/·/.test(f.dot), `${text}%: "${m.t}": a dot before fact ${i + 1}`)
            const prev = m.facts[i - 1]
            if (f.top === prev.top) expect.ok(Math.abs(f.left - prev.right - f.w) <= 1, `${text}%: "${m.t}": the dot fills the gap between two facts on one line`)
            else expect.ok(f.left + f.at + f.w <= m.left + 0.5, `${text}%: "${m.t}": the dot of a fact that starts a line lies past the start edge, where it is clipped`)
          })
        }
      }
    },
  },
]
