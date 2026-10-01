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
]
