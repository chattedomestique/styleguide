// App bar: the title is a real heading, the controls are named, the editor order is fixed, buttons and
// the focus ring follow the bar's colours, and a sticky bar publishes --appbar-h so focused content is
// never left behind it.
const appbarH = (page) => page.evaluate(() => document.documentElement.style.getPropertyValue('--appbar-h'))
const FRAME = '[data-chrome-scope]'
// computed colours come back as oklch() or color(srgb …) depending on the path; compare them as rendered
const hex = (page, css) => page.evaluate((c) => SG.colorToHex(c), css)

export const tests = [
  {
    name: 'Every bar has a non-empty heading for a title',
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('.appbar')].map((b) => {
        const t = b.querySelector('.appbar__title, h1, h2, h3, h4'); return { tag: t && t.tagName, text: t && t.textContent.trim() }
      }))
      expect.ok(r.length >= 7, 'found the demo bars')
      expect.ok(r.every((b) => /^H[1-6]$/.test(b.tag || '')), 'every bar title is a heading element: ' + JSON.stringify(r.filter((b) => !/^H[1-6]$/.test(b.tag || ''))))
      expect.ok(r.every((b) => b.text), 'no empty heading (the search bar\'s is sr-only text)')
    },
  },
  {
    name: 'Every control in a bar has a text name, and a back link says where it goes',
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('.appbar a, .appbar button, .appbar input')].map((c) => {
        const name = c.getAttribute('aria-label') || (c.id && document.querySelector(`label[for="${c.id}"]`)?.textContent.trim()) || c.textContent.trim()
        return { name, tag: c.tagName }
      }))
      expect.ok(r.length > 15, 'found the controls')
      expect.ok(r.every((c) => c.name && c.name.length > 2), 'named: ' + JSON.stringify(r.filter((c) => !c.name)))
      const backs = await page.evaluate(() => [...document.querySelectorAll('.appbar a[aria-label^="Back"]')].map((a) => a.getAttribute('aria-label')))
      expect.ok(backs.length >= 3 && backs.every((b) => /^Back to /.test(b)), 'links say where they go: ' + backs.join(' | '))
    },
  },
  {
    name: 'Editor bar order is cancel, title, apply in the DOM and on screen, and Tab follows it',
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      const bar = '.appbar[data-variant="editor"]'
      const xs = await page.evaluate((sel) => { const b = document.querySelector(sel); const x = (e) => Math.round(e.getBoundingClientRect().left); return { cancel: x(b.querySelector('[aria-label="Cancel"]')), title: x(b.querySelector('.appbar__title')), apply: x(b.querySelector('[aria-label="Apply"]')) } }, bar)
      expect.ok(xs.cancel < xs.title && xs.title < xs.apply, 'cancel, title, apply from left to right: ' + JSON.stringify(xs))
      await page.locator(bar).locator('[aria-label="Cancel"]').focus()
      await page.keyboard.press('Tab')
      expect.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Help: editing a card', 'help follows the title')
      await page.keyboard.press('Tab')
      expect.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Apply')
    },
  },
  {
    name: 'The editor title is centred on the bar, with the help circle in the end group (never glued to the title)',
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      const r = await page.evaluate(() => {
        const b = document.querySelector('.appbar[data-variant="editor"]'); const t = b.querySelector('.appbar__title'); const br = b.getBoundingClientRect()
        const rg = document.createRange(); rg.selectNodeContents(t); const words = rg.getBoundingClientRect()
        const help = b.querySelector('[aria-label^="Help"]').getBoundingClientRect()
        return { off: Math.abs((words.left + words.right) / 2 - (br.left + br.right) / 2), gap: Math.round(help.left - words.right), inEnd: !!b.querySelector('.appbar__end [aria-label^="Help"]') }
      })
      expect.ok(r.off < 2, 'the words are centred on the bar within 2px: off by ' + r.off)
      expect.ok(r.inEnd, 'help sits in the end group, beside Apply')
      expect.ok(r.gap >= 16, 'the help circle keeps clear of the words (' + r.gap + 'px)')
    },
  },
  {
    name: 'Search bar: labelled type=search input, 16px text, a 2px frame, 44px tall, in a search form; focus ring on the field',
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      const r = await page.evaluate(() => { const i = document.getElementById('appbar-q'); const cs = getComputedStyle(i); return { type: i.type, label: document.querySelector('label[for="appbar-q"]').textContent.trim(), px: parseFloat(cs.fontSize), h: i.getBoundingClientRect().height, bw: parseFloat(cs.borderTopWidth), form: i.closest('form').getAttribute('role') } })
      expect.equal(r.type, 'search'); expect.equal(r.label, 'Search decks'); expect.equal(r.form, 'search')
      expect.ok(r.px >= 16, 'iOS will not zoom: ' + r.px); expect.ok(r.h >= 44, 'height ' + r.h); expect.equal(r.bw, 2, 'a --bw frame')
      await page.locator('#appbar-q').focus()
      await page.keyboard.type('bones')
      expect.equal(await page.locator('#appbar-q').inputValue(), 'bones', 'typing works')
      const ring = await page.evaluate(() => { const cs = getComputedStyle(document.getElementById('appbar-q')); return [cs.outlineStyle, parseFloat(cs.outlineWidth), cs.boxShadow] })
      expect.equal(ring[0], 'solid', 'focus ring on the field'); expect.ok(ring[1] >= 3, 'ring is 3px'); expect.ok(/0px 0px 0px 3px/.test(ring[2]), 'and its halo: ' + ring[2])
    },
  },
  {
    name: 'Ink bar: buttons invert with the bar (rest = bar fill, ink = bar text) and the focus ring follows the bar',
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      const bar = page.locator('.appbar[data-tone="ink"]')
      const barColors = await bar.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, ink: getComputedStyle(el).color }))
      const bg = await hex(page, barColors.bg); const ink = await hex(page, barColors.ink)
      expect.ok(bg !== ink, 'the bar has a fill and a text colour')
      const btn = bar.locator('.btn').first()
      await page.mouse.move(0, 0)
      const rest = await btn.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, ink: getComputedStyle(el).color, bd: getComputedStyle(el).borderTopColor }))
      expect.equal(await hex(page, rest.bg), bg, 'at rest the button is the bar\'s fill')
      expect.equal(await hex(page, rest.ink), ink, 'with the bar\'s text colour')
      expect.equal(await hex(page, rest.bd), ink, 'and the bar\'s ink as its frame')
      await btn.focus()
      await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
      await page.waitForTimeout(350)
      const f = await btn.evaluate((el) => { const cs = getComputedStyle(el); return { ring: cs.outlineColor, halo: cs.boxShadow, bg: cs.backgroundColor } })
      expect.equal(await hex(page, f.ring), ink, 'the ring is the bar\'s text colour, so it shows on the bar')
      expect.equal(await hex(page, f.bg), ink, 'focus fills the button with the bar\'s ink (--fill 1)')
      const haloColor = await hex(page, f.halo.match(/(oklch\([^)]*\)|color\([^)]*\)|rgba?\([^)]*\))/)[1])
      expect.equal(haloColor, bg, 'and the halo between ring and button is the bar\'s fill: ' + f.halo)
    },
  },
  {
    name: 'A sticky bar inside a scroll frame publishes --appbar-h on the frame, not on <html>',
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      expect.equal(await appbarH(page), '', 'the page itself has no sticky bar, so <html> has no inline --appbar-h')
      const v = await page.evaluate((sel) => { const f = document.querySelector(sel); return { h: parseFloat(f.style.getPropertyValue('--appbar-h')), bar: f.querySelector('.appbar').getBoundingClientRect().height } }, FRAME)
      expect.ok(v.h >= v.bar - 1, `published ${v.h} covers the bar height ${v.bar}`)
    },
  },
  {
    name: 'A sticky bar in a column-flex frame never shrinks: at 320px, at 100% and 200% text, every control stays inside the rule, clear of the first row',
    viewport: { width: 320, height: 700 },
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      for (const text of [100, 200]) {
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(250) // 41-bars.js re-measures on resize
        const r = await page.evaluate((sel) => {
          const f = document.querySelector(sel); const b = f.querySelector('.appbar'); const bb = b.getBoundingClientRect()
          const row = f.querySelector('.card__list li').getBoundingClientRect()
          return { shrink: getComputedStyle(b).flexShrink, bar: bb.height, below: Math.max(...[...b.children].map((c) => c.getBoundingClientRect().bottom)) - bb.bottom, row: row.top - bb.bottom, pub: parseFloat(f.style.getPropertyValue('--appbar-h')) }
        }, FRAME)
        expect.equal(r.shrink, '0', text + '%: flex-shrink')
        expect.ok(r.below <= 0, text + '%: every control sits inside the bar (hangs ' + r.below + 'px below it)')
        expect.ok(r.row >= -1, text + '%: the first row starts below the bar (' + r.row + 'px)')
        expect.ok(r.pub >= r.bar - 1, text + '%: --appbar-h ' + r.pub + ' covers the ' + r.bar + 'px bar')
      }
    },
  },
  {
    name: 'Tabbing through a scrolling list never leaves a row behind the sticky bar',
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      const rows = page.locator(`${FRAME} .card__list a`)
      await rows.first().focus()
      const clear = () => page.evaluate((sel) => {
        const bar = document.querySelector(sel + ' .appbar').getBoundingClientRect()
        const row = document.activeElement.getBoundingClientRect()
        return { label: document.activeElement.textContent.trim().slice(0, 10), clear: row.top >= bar.bottom - 1 }
      }, FRAME)
      const res = []
      for (let i = 0; i < 9; i++) { res.push(await clear()); if (i < 8) await page.keyboard.press('Tab') }
      for (let i = 0; i < 8; i++) await page.keyboard.press('Shift+Tab')
      const back = await clear()
      expect.ok(res.every((r) => r.clear), 'rows clear of the bar going down: ' + JSON.stringify(res.filter((r) => !r.clear)))
      expect.ok(back.clear, 'and going back up to the first row')
    },
  },
  {
    name: 'A sticky bar added to the page itself publishes --appbar-h and html scroll-padding covers it',
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      await page.evaluate(() => {
        const h = document.createElement('header'); h.className = 'appbar'; h.setAttribute('data-sticky', ''); h.id = 'inj-bar'
        h.innerHTML = '<h1 class="appbar__title">Injected</h1>'
        document.body.insertBefore(h, document.body.firstChild.nextSibling)
      })
      await page.waitForTimeout(150)
      const r = await page.evaluate(() => { const b = document.getElementById('inj-bar'); return { h: parseFloat(document.documentElement.style.getPropertyValue('--appbar-h')), bar: b.getBoundingClientRect().height, pos: getComputedStyle(b).position, pad: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) } })
      expect.equal(r.pos, 'sticky')
      expect.ok(r.h >= r.bar - 1, `--appbar-h ${r.h} >= bar ${r.bar}`)
      expect.ok(r.pad >= r.h, `html scroll-padding-top ${r.pad} covers it`)
    },
  },
  {
    name: 'All bar controls are at least 44x44 (the small buttons keep a 44px hit area)',
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      const small = await page.evaluate(() => [...document.querySelectorAll('.appbar a, .appbar button')].filter((e) => e.getBoundingClientRect().width).map((e) => { const b = e.getBoundingClientRect(); const a = getComputedStyle(e, '::after'); const w = Math.max(b.width, parseFloat(a.width) || 0); const h = Math.max(b.height, parseFloat(a.height) || 0); return [Math.round(w), Math.round(h), e.getAttribute('aria-label')] }).filter(([w, h]) => w < 43.5 || h < 43.5))
      expect.equal(small.length, 0, 'undersized: ' + JSON.stringify(small))
    },
  },
  {
    name: 'The greeting bar shows a small eyebrow above a larger sentence-case title, with no uppercase',
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      const r = await page.evaluate(() => { const b = document.querySelector('.appbar[data-variant="greeting"]'); const e = b.querySelector('.appbar__eyebrow'); const t = b.querySelector('.appbar__title'); return { ey: parseFloat(getComputedStyle(e).fontSize), ti: parseFloat(getComputedStyle(t).fontSize), tt: getComputedStyle(t).textTransform, above: e.getBoundingClientRect().bottom <= t.getBoundingClientRect().top + 2 } })
      expect.ok(r.ti >= r.ey * 1.5, `title ${r.ti}px vs eyebrow ${r.ey}px`)
      expect.equal(r.tt, 'none', 'a sentence, not a label'); expect.ok(r.above, 'eyebrow sits above the title')
    },
  },
  {
    name: 'The bar title of a standard bar is an uppercase label applied in CSS (the HTML is natural case)',
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      const r = await page.evaluate(() => { const t = document.querySelector('.appbar:not([data-variant]) .appbar__title'); return { raw: t.textContent, tt: getComputedStyle(t).textTransform } })
      expect.equal(r.tt, 'uppercase'); expect.ok(r.raw !== r.raw.toUpperCase(), 'typed in natural case: ' + r.raw)
    },
  },
  {
    name: 'Large text (200% at 390px): every bar is ONE row: circles keep their 100% size, the title wraps beside them by whole words, the controls line up with its first line, the editor title stays centred',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
      await page.waitForTimeout(300)
      const r = await page.evaluate(() => {
        const longest = (t) => Math.max(...t.textContent.trim().split(/\s+/).map((w) => { const p = t.cloneNode(false); p.textContent = w; p.style.cssText += ';position:absolute;visibility:hidden;white-space:nowrap;flex:none;inline-size:auto;min-inline-size:0;padding:0'; t.parentElement.appendChild(p); const x = p.getBoundingClientRect().width; p.remove(); return x }))
        return [...document.querySelectorAll('.docs-article .appbar')].map((b) => {
          const br = b.getBoundingClientRect()
          const btns = [...b.querySelectorAll('.btn')].map((x) => x.getBoundingClientRect())
          const kids = [...b.children].filter((k) => getComputedStyle(k).position !== 'absolute' && !k.classList.contains('sr-only')).map((k) => k.getBoundingClientRect())
          // one row: no child starts below the bottom of another
          const stacked = kids.some((a) => kids.some((c) => c !== a && c.top >= a.bottom - 1))
          const t = b.querySelector('.appbar__title:not(.sr-only)')
          let firstLine = null, word = 0, title = 0, centreOff = null
          if (t) {
            const rg = document.createRange(); rg.selectNodeContents(t); const line = rg.getClientRects()[0]
            firstLine = line ? (line.top + line.bottom) / 2 : null
            word = Math.round(longest(t)); title = Math.round(t.getBoundingClientRect().width)
            const all = rg.getBoundingClientRect(); centreOff = Math.abs((all.left + all.right) / 2 - (br.left + br.right) / 2)
          }
          // visible boxes only: a 36px circle's 44px hit area may reach past an untoned bar's edge, into the gutter
          const over = kids.some((k) => k.left < br.left - 1 || k.right > br.right + 1)
          return { kind: b.getAttribute('data-variant') || 'standard', h: Math.round(br.height), stacked, sizes: [...new Set(btns.map((x) => Math.round(x.height)))], centres: btns.map((x) => (x.top + x.bottom) / 2), firstLine, word, title, centreOff, over }
        })
      })
      for (const b of r) {
        expect.ok(!b.stacked, b.kind + ': one row, nothing dropped under anything: ' + JSON.stringify(b))
        expect.ok(b.sizes.every((h) => h <= 44.5), b.kind + ': the circles keep their 100% size (36px small, 44px default; chrome): ' + b.sizes)
        expect.ok(!b.over, b.kind + ': no sideways overflow')
        if (b.kind === 'standard' || b.kind === 'editor') {
          expect.ok(b.title >= b.word - 1, b.kind + ': the title is at least as wide as its longest word: ' + JSON.stringify(b))
          expect.ok(b.centres.every((c) => Math.abs(c - b.firstLine) <= 2), b.kind + ': the controls are level with the title\'s first line: ' + JSON.stringify(b))
        }
        if (b.kind === 'editor') expect.ok(b.centreOff < 2, 'editor: the title stays centred on the bar (' + b.centreOff + ')')
      }
      const sticky = r.filter((b) => b.kind === 'standard').map((b) => b.h)
      expect.ok(Math.max(...sticky) <= 120, 'a standard bar is at most three lines of title tall: ' + sticky)
    },
  },
  {
    name: 'A toned or ink bar pads its sides, so its buttons never touch the edge of the fill (and the ring has room)',
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('.appbar[data-tone]:not([data-sticky])')].map((b) => {
        const bb = b.getBoundingClientRect(); const first = b.querySelector('.btn').getBoundingClientRect(); const last = [...b.querySelectorAll('.btn')].pop().getBoundingClientRect()
        return { tone: b.getAttribute('data-tone'), start: Math.round(first.left - bb.left), end: Math.round(bb.right - last.right) }
      }))
      expect.ok(r.length >= 2, 'found the ink and tonal demo bars')
      expect.ok(r.every((b) => b.start >= 8 && b.end >= 8), 'at least 8px between the fill\'s edge and the first / last button: ' + JSON.stringify(r))
    },
  },
  {
    name: 'Right-to-left: the Back arrow mirrors so it points the way Back goes; left-to-right is untouched',
    async run({ page, goto, expect }) {
      await goto('components/appbar.html')
      const t = () => page.evaluate(() => getComputedStyle(document.querySelector('.appbar .ic--arrow-left')).transform)
      expect.equal(await t(), 'none', 'LTR: not flipped')
      await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'))
      expect.equal(await t(), 'matrix(-1, 0, 0, 1, 0, 0)', 'RTL: mirrored')
    },
  },
]
