// Breadcrumb: a labelled nav with an ordered list, the current page marked, separators drawn by CSS
// (never in the tree), 44px targets, the wrapping trail, and the "earlier levels" disclosure.
const LONG = 'nav[aria-label="Breadcrumb, long"]'

export const tests = [
  {
    name: 'Every breadcrumb is a uniquely labelled nav around an ordered list, with exactly one aria-current="page" as its last item',
    async run({ page, goto, expect }) {
      await goto('components/breadcrumb.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('nav.breadcrumb')].map((n) => {
        const items = [...n.querySelectorAll('.breadcrumb__list > li')]
        const visible = items.filter((i) => !i.hidden)
        return { label: n.getAttribute('aria-label'), ol: !!n.querySelector('ol.breadcrumb__list'), current: n.querySelectorAll('[aria-current="page"]').length, lastIsCurrent: !!visible[visible.length - 1].querySelector('[aria-current="page"]') }
      }))
      expect.ok(r.length >= 6, 'found the demo trails')
      expect.ok(r.every((n) => n.label && n.ol), 'labelled, ordered list')
      expect.equal(new Set(r.map((n) => n.label)).size, r.length, 'labels are unique on the page')
      expect.ok(r.every((n) => n.current === 1 && n.lastIsCurrent), 'one current page, and it is last')
    },
  },
  {
    name: 'Ancestors are underlined links, the current page is bold and not underlined (not colour alone)',
    async run({ page, goto, expect }) {
      await goto('components/breadcrumb.html')
      const r = await page.evaluate(() => {
        const n = document.querySelector('nav[aria-label="Breadcrumb"]')
        const s = (e) => { const c = getComputedStyle(e); return { line: c.textDecorationLine, w: Number(c.fontWeight), th: c.textDecorationThickness } }
        return { link: s(n.querySelector('a:not([aria-current])')), cur: s(n.querySelector('[aria-current="page"]')) }
      })
      expect.ok(r.link.line.includes('underline'), 'ancestors are underlined'); expect.equal(r.link.th, '2px', 'with the --bw line weight')
      expect.ok(!r.cur.line.includes('underline'), 'the current page is not'); expect.ok(r.cur.w > r.link.w, `and is bolder (${r.cur.w} vs ${r.link.w})`)
    },
  },
  {
    name: 'Separators are drawn by CSS after every item but the last, and do not exist in the DOM text',
    async run({ page, goto, expect }) {
      await goto('components/breadcrumb.html')
      const r = await page.evaluate(() => {
        const n = document.querySelector('nav[aria-label="Breadcrumb"]'); const lis = [...n.querySelectorAll('li')]
        return { text: n.textContent.replace(/\s+/g, ' ').trim(), seps: lis.map((li) => getComputedStyle(li, '::after').content), before: lis.map((li) => getComputedStyle(li, '::before').content) }
      })
      expect.equal(r.text, 'Library Decks Shapes', 'no separator characters in the text a screen reader reads')
      expect.equal(r.seps.join(','), '"","",none', 'a separator after all but the last')
      expect.ok(r.before.every((c) => c === 'none'), 'nothing in front')
    },
  },
  {
    name: 'In a right-to-left page the separators flip',
    async run({ page, goto, expect }) {
      await goto('components/breadcrumb.html')
      const ltr = await page.evaluate(() => getComputedStyle(document.querySelector('nav[aria-label="Breadcrumb"] li'), '::after').transform)
      await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'))
      const rtl = await page.evaluate(() => getComputedStyle(document.querySelector('nav[aria-label="Breadcrumb"] li'), '::after').transform)
      expect.equal(ltr, 'none'); expect.equal(rtl, 'matrix(-1, 0, 0, 1, 0, 0)')
    },
  },
  {
    name: 'Tab visits the links in trail order; the current page (a link to itself) is last',
    async run({ page, goto, expect }) {
      await goto('components/breadcrumb.html')
      await page.locator('nav[aria-label="Breadcrumb"] a').first().focus()
      const order = []
      for (let i = 0; i < 2; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => document.activeElement.textContent.trim())) }
      expect.equal(order.join(','), 'Decks,Shapes')
    },
  },
  {
    name: 'Every link and the disclosure button is at least 44px tall, and a short word still has a 44px-wide hit area',
    async run({ page, goto, expect }) {
      await goto('components/breadcrumb.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('nav.breadcrumb a, nav.breadcrumb button')].filter((e) => e.offsetParent).map((e) => {
        const b = e.getBoundingClientRect(); const a = getComputedStyle(e, '::after')
        return { t: e.textContent.trim() || e.getAttribute('aria-label'), h: Math.max(b.height, parseFloat(a.height) || 0), w: Math.max(b.width, parseFloat(a.width) || 0) }
      }))
      expect.ok(r.length > 10, 'found the links')
      expect.ok(r.every((e) => e.h >= 43.5 && e.w >= 43.5), 'all targets are 44x44 including the hit area: ' + JSON.stringify(r.filter((e) => e.h < 43.5 || e.w < 43.5)))
    },
  },
  {
    name: 'Long trail: the "…" button shows the hidden levels in place, keeps its name and focus, and Tab then enters them',
    async run({ page, goto, expect }) {
      await goto('components/breadcrumb.html')
      const btn = page.locator(`${LONG} button`)
      await btn.focus()
      await expect.attr(page, `${LONG} button`, 'aria-expanded', 'false')
      expect.ok(!(await page.locator('#crumb-a').isVisible()) && !(await page.locator('#crumb-b').isVisible()), 'hidden levels are hidden')
      const name = await btn.getAttribute('aria-label')
      await page.keyboard.press('Enter')
      await expect.attr(page, `${LONG} button`, 'aria-expanded', 'true')
      expect.ok((await page.locator('#crumb-a').isVisible()) && (await page.locator('#crumb-b').isVisible()), 'both levels are shown')
      expect.equal(await btn.getAttribute('aria-label'), name, 'the name does not change, the state does')
      await expect.focused(page, `${LONG} button`, 'focus stays on the button')
      await page.keyboard.press('Tab')
      expect.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Languages', 'Tab enters the revealed levels in order')
      await btn.focus()
      await page.keyboard.press('Space')
      expect.ok(!(await page.locator('#crumb-a').isVisible()), 'Space folds them away again')
    },
  },
  {
    name: 'A narrow trail wraps onto more lines and never scrolls sideways or truncates',
    async run({ page, goto, expect }) {
      await goto('components/breadcrumb.html')
      const r = await page.evaluate(() => {
        const box = document.querySelector('#wrap ~ .demo .resize-box'); box.style.inlineSize = '11rem'
        const ol = box.querySelector('ol'); const lis = [...ol.children]
        const tops = new Set(lis.map((l) => Math.round(l.getBoundingClientRect().top)))
        return { rows: tops.size, overflow: ol.scrollWidth > ol.clientWidth + 1, clipped: getComputedStyle(ol).overflow, lastText: lis[lis.length - 1].textContent.trim() }
      })
      expect.ok(r.rows >= 2, 'wrapped onto ' + r.rows + ' lines'); expect.ok(!r.overflow, 'no horizontal overflow'); expect.equal(r.lastText, 'Irregular verbs', 'the text is whole')
    },
  },
  {
    name: 'On an ink card the trail takes the card\'s ink (currentColor), so it stays readable',
    async run({ page, goto, expect }) {
      await goto('components/breadcrumb.html')
      const r = await page.evaluate(() => {
        const card = document.querySelector('.card[data-tone="ink"]'); const a = card.querySelector('a'); const sep = getComputedStyle(card.querySelector('li'), '::after')
        return { cardInk: getComputedStyle(card).color, link: getComputedStyle(a).color, sep: sep.backgroundColor }
      })
      const toHex = (c) => page.evaluate((x) => SG.colorToHex(x), c)
      expect.equal(await toHex(r.link), await toHex(r.cardInk), 'link colour = the card\'s ink')
      expect.equal(await toHex(r.sep), await toHex(r.cardInk), 'chevron colour = the card\'s ink')
    },
  },
  {
    name: 'Hover and press move the underline away from the word; the line stays 2px (4px is the forced-colours weight, never a hover cue)',
    async run({ page, goto, expect }) {
      await goto('components/breadcrumb.html')
      const a = page.locator('nav[aria-label="Breadcrumb"] a').nth(1)
      await a.evaluate((e) => e.scrollIntoView({ block: 'center' }))
      await page.mouse.move(0, 0)
      const read = () => a.evaluate((e) => { const c = getComputedStyle(e); return { thick: c.textDecorationThickness, offset: c.textUnderlineOffset } })
      const rest = await read()
      const b = await a.boundingBox()
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
      const over = await read()
      expect.equal(over.thick, rest.thick, 'the line keeps its weight on hover'); expect.equal(rest.thick, '2px', 'and that weight is the 2px frame weight')
      expect.ok(parseFloat(over.offset) > parseFloat(rest.offset) + 1, 'the underline steps away from the word on hover: ' + rest.offset + ' -> ' + over.offset)
    },
  },
]
