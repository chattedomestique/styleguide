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
]
