// Spec for Empty state: anatomy of the four states (a card: dashed when empty, solid when toned),
// the layouts, and the live "no results" flow with announcement and focus management.
const PAGE = 'components/empty.html'

async function until(page, fn, arg, what = 'condition', tries = 60) {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(fn, arg)) return
    await page.waitForTimeout(50)
  }
  throw new Error('timed out waiting for ' + what)
}

export const tests = [
  {
    name: 'each of the four states is a card with a heading, a message and an action; the icon tile is decorative and each icon differs',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const rows = await page.$$eval('#four + p + .demo .empty', (els) => els.map((el) => ({
        card: el.classList.contains('card'),
        title: el.querySelector('.card__title')?.textContent.trim(),
        tag: el.querySelector('.card__title')?.tagName,
        text: el.querySelector('.card__text')?.textContent.trim(),
        tile: el.querySelector('.empty__icon')?.getAttribute('aria-hidden'),
        icon: [...el.querySelector('.empty__icon .ic').classList].find((c) => c.startsWith('ic--')),
        buttons: el.querySelectorAll('.empty__actions button').length,
        labelled: el.getAttribute('aria-labelledby') === el.querySelector('.card__title')?.id,
      })))
      expect.equal(rows.length, 4)
      expect.equal(new Set(rows.map((r) => r.icon)).size, 4, 'four icon shapes: ' + rows.map((r) => r.icon).join(','))
      for (const r of rows) {
        expect.ok(r.card, 'is a .card')
        expect.ok(/^H[1-6]$/.test(r.tag), 'real heading')
        expect.ok(r.title && r.text, 'title and message')
        expect.equal(r.tile, 'true')
        expect.ok(r.buttons >= 1, 'has an action: ' + r.title)
        expect.ok(r.labelled, 'the section is named by its heading')
      }
    },
  },
  {
    name: 'nothing-yet is dashed and transparent (the ghost); a tone makes it solid and filled',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const s = await page.$$eval('#four + p + .demo .empty', (els) => els.map((el) => { const cs = getComputedStyle(el); return { tone: el.dataset.tone || 'none', style: cs.borderTopStyle, width: cs.borderTopWidth, bg: cs.backgroundColor } }))
      expect.equal(s.map((x) => x.tone).join(','), 'none,none,bad,warn')
      for (const x of s) {
        expect.equal(x.width, '2px')
        if (x.tone === 'none') { expect.equal(x.style, 'dashed'); expect.ok(x.bg === 'rgba(0, 0, 0, 0)' || x.bg === 'transparent', 'transparent: ' + x.bg) }
        else { expect.equal(x.style, 'solid'); expect.ok(x.bg !== 'rgba(0, 0, 0, 0)', 'filled: ' + x.bg) }
      }
    },
  },
  {
    name: 'the icon tile is a 2px-framed paper slot; actions are at least 44 px tall',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const t = await page.$eval('.empty__icon', (el) => { const cs = getComputedStyle(el); return { w: cs.borderTopWidth, st: cs.borderTopStyle, bg: cs.backgroundColor, size: el.getBoundingClientRect().width } })
      expect.equal(t.w, '2px')
      expect.equal(t.st, 'solid')
      expect.ok(t.bg !== 'rgba(0, 0, 0, 0)', 'has a fill: ' + t.bg)
      const heights = await page.$$eval('.empty__actions .btn:not([data-size="sm"])', (els) => els.map((b) => b.getBoundingClientRect().height))
      expect.ok(heights.length >= 5, 'buttons: ' + heights.length)
      expect.ok(Math.min(...heights) >= 43.5, 'smallest ' + Math.min(...heights))
    },
  },
  {
    name: 'page layout fills the space; list layout is a compact two-column unit',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const h = await page.locator('.empty[data-layout="page"]').evaluate((el) => el.getBoundingClientRect().height)
      expect.ok(h >= 25 * 16 - 2, `page layout is ${h}px tall (>= 25rem)`)
      const l = await page.locator('.empty[data-layout="list"]').first().evaluate((el) => { const b = el.querySelector('.card__body'); const cs = getComputedStyle(b); return { cols: cs.gridTemplateColumns.split(' ').length, align: cs.textAlign } })
      expect.equal(l.cols, 2, 'tile beside the words')
      expect.ok(l.align === 'start' || l.align === 'left', 'left aligned')
    },
  },
  {
    name: 'no results: appears, is announced politely, and Clear search returns focus to the field',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.evaluate(() => { SG.announce('ready'); window.__said = []; const r = document.querySelector('div.sr-only[role="status"]'); new MutationObserver(() => { if (r.textContent && r.textContent !== 'ready') window.__said.push(r.textContent) }).observe(r, { childList: true, characterData: true, subtree: true }) })
      await page.locator('#ex-q').fill('fox')
      await until(page, () => document.querySelectorAll('#ex-slot .empty').length === 1, null, 'state shown')
      expect.ok((await page.locator('#ex-slot .card__title').innerText()).includes('fox'), 'names what was searched')
      expect.equal(await page.locator('#ex-list li:not([hidden])').count(), 0, 'list is empty')
      await until(page, () => window.__said.includes('No decks match fox'), null, 'announced')
      await page.keyboard.press('Tab')
      await expect.focused(page, '#ex-slot [data-clear]', 'the recovery action is next in the tab order')
      await page.keyboard.press('Enter')
      expect.equal(await page.locator('#ex-slot .empty').count(), 0, 'state removed')
      expect.equal(await page.locator('#ex-list li:not([hidden])').count(), 4, 'list restored')
      await expect.focused(page, '#ex-q', 'focus returned to the field, not lost to <body>')
    },
  },
  {
    name: 'a search with matches announces the count and shows no empty state',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.evaluate(() => { SG.announce('ready'); window.__said = []; const r = document.querySelector('div.sr-only[role="status"]'); new MutationObserver(() => { if (r.textContent && r.textContent !== 'ready') window.__said.push(r.textContent) }).observe(r, { childList: true, characterData: true, subtree: true }) })
      await page.locator('#ex-q').fill('farm')
      await until(page, () => window.__said.includes('1 deck'), null, 'count announced')
      expect.equal(await page.locator('#ex-slot .empty').count(), 0)
      expect.equal(await page.locator('#ex-list li:not([hidden])').count(), 1)
    },
  },
  {
    name: 'text is at least 7:1 on the toned states in every theme, palette and contrast setting',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const r = await page.evaluate(() => {
        const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
        const root = document.documentElement
        const cards = [...document.querySelectorAll('#four + p + .demo .empty')]
        const out = []
        for (const theme of ['light', 'dark']) for (const palette of ['default', 'periwinkle', 'mint', 'sand', 'cream', 'wire']) for (const contrast of [null, 'more']) {
          root.setAttribute('data-theme', theme)
          if (palette === 'default') root.removeAttribute('data-palette'); else root.setAttribute('data-palette', palette)
          if (contrast) root.setAttribute('data-contrast', contrast); else root.removeAttribute('data-contrast')
          for (const c of cards) {
            // a transparent card sits on the canvas
            let bg = getComputedStyle(c).backgroundColor
            bg = /rgba\(0, 0, 0, 0\)|transparent/.test(bg) ? SG.colorToHex(getComputedStyle(document.body).backgroundColor) : SG.colorToHex(bg)
            for (const sel of ['.card__title', '.card__text']) {
              const k = ratio(SG.colorToHex(getComputedStyle(c.querySelector(sel)).color), bg)
              if (k < 7) out.push(`${theme}/${palette}/${contrast || 'normal'} ${c.dataset.tone || 'none'} ${sel}: ${k.toFixed(2)}`)
            }
          }
        }
        return out
      })
      expect.equal(r.slice(0, 6).join(' | '), '', 'contrast below 7:1')
    },
  },
  {
    name: '200% text on a phone: titles, messages and button labels wrap inside the card; nothing is clipped',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.addStyleTag({ content: 'html{font-size:200%}' })
      await page.waitForTimeout(200)
      // the phone mock nests the card in a further 100px of docs padding at 200%: not a real screen
      const r = await page.evaluate(() => [...document.querySelectorAll('.empty:not(.phone .empty)')].map((c) => {
        const cr = c.getBoundingClientRect()
        const inner = c.querySelector('.card__body').getBoundingClientRect()
        const parts = [...c.querySelectorAll('.card__title, .card__text, .empty__actions .btn, .empty__icon')]
        return { worst: Math.max(...parts.map((p) => p.getBoundingClientRect().right - cr.right)), left: Math.min(...parts.map((p) => p.getBoundingClientRect().left - cr.left)), sw: c.querySelector('.card__body').scrollWidth - c.querySelector('.card__body').clientWidth, title: c.querySelector('.card__title').textContent.trim() }
      }))
      expect.ok(r.length >= 5, 'states: ' + r.length)
      for (const x of r) {
        expect.ok(x.worst <= 0.5, `a part pokes ${x.worst}px past the card: ${x.title}`)
        expect.ok(x.left >= 0, `a part starts ${x.left}px outside the card: ${x.title}`)
        expect.ok(x.sw <= 1, `body scrolls sideways by ${x.sw}px: ${x.title}`)
      }
    },
  },
  {
    name: 'the primary action on a toned state is the filled button, and the cards in a row line up at the top',
    viewport: { width: 1024, height: 800 },
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const r = await page.evaluate(() => [...document.querySelectorAll('#four + p + .demo .empty')].map((c) => ({
        tone: c.dataset.tone || 'none',
        first: c.querySelector('.empty__actions .btn').dataset.variant,
        icon: c.querySelector('.empty__icon').getBoundingClientRect().top - c.getBoundingClientRect().top,
        row: Math.round(c.getBoundingClientRect().top),
      })))
      for (const c of r.filter((x) => x.tone !== 'none')) expect.equal(c.first, 'primary', `the ${c.tone} card leads with the filled button`)
      const rows = {}
      for (const c of r) (rows[c.row] ||= []).push(c.icon)
      for (const icons of Object.values(rows)) expect.ok(Math.max(...icons) - Math.min(...icons) <= 1, `icons start at the same height within a row (${icons.map((n) => n.toFixed(0)).join(' / ')})`)
    },
  },
  {
    // The lead's review: stacked pairs of two different widths, centred, read as ragged; and a side-by-side pair
    // squeezed the longer label into its padding until the label touched the frame. Two buttons are side by
    // side only at one shared width with every label whole and clear of the frame; otherwise they stack, one
    // per line, at one shared width.
    name: 'a pair of actions is one row or one stack, at one shared width and height; a label never touches its frame',
    async run({ page, goto, expect }) {
      for (const [width, text] of [[390, 100], [390, 200], [320, 200], [420, 100], [1024, 100]]) {
        await page.setViewportSize({ width, height: 844 })
        await goto(PAGE)
        if (text !== 100) await page.addStyleTag({ content: `html{font-size:${text}%}` })
        await page.waitForTimeout(250)
        const r = await page.evaluate(() => [...document.querySelectorAll('.empty__actions')].filter((a) => a.children.length > 1 && a.getClientRects().length).map((a) => {
          const btns = [...a.querySelectorAll(':scope > .btn')].map((b) => {
            const br = b.getBoundingClientRect(), cs = getComputedStyle(b)
            const range = document.createRange()
            range.selectNodeContents(b)
            const cr = range.getBoundingClientRect()
            return { top: br.top, left: br.left, w: br.width, h: br.height, gapL: cr.left - br.left, gapR: br.right - cr.right, pad: parseFloat(cs.paddingInlineStart), label: b.textContent.trim() }
          })
          return { fit: a.dataset.fit, btns }
        }))
        expect.ok(r.length >= 2, `${width}px ${text}%: pairs found ${r.length}`)
        for (const { fit, btns } of r) {
          const names = btns.map((b) => b.label).join(' / ')
          const widths = btns.map((b) => b.w)
          expect.ok(Math.max(...widths) - Math.min(...widths) <= 1, `${width}px ${text}% ${fit}: one shared width (${widths.map((n) => n.toFixed(0)).join(' vs ')}) for ${names}`)
          const heights = btns.map((b) => b.h)
          expect.ok(Math.max(...heights) - Math.min(...heights) <= 1, `${width}px ${text}% ${fit}: one shared height (${heights.map((n) => n.toFixed(0)).join(' vs ')}) for ${names}`)
          if (fit === 'row') expect.ok(btns.every((b) => Math.abs(b.top - btns[0].top) <= 1), `${width}px ${text}%: a row is one line: ${names}`)
          else expect.ok(btns.every((b, i) => i === 0 || (b.top > btns[i - 1].top + 20 && Math.abs(b.left - btns[0].left) <= 1)), `${width}px ${text}%: a stack is one button per line, left edges level: ${names}`)
          for (const b of btns) expect.ok(Math.min(b.gapL, b.gapR) >= b.pad - 1, `${width}px ${text}%: "${b.label}" keeps its side padding (${b.gapL.toFixed(0)} / ${b.gapR.toFixed(0)} of ${b.pad})`)
        }
      }
    },
  },
]
