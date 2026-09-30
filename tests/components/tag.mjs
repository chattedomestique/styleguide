// Interaction spec for Tag. A tag is static, so there are no keys to press; what is worth proving is
// what the guide promises about it: never colour alone, never pressable, always readable.
export const tests = [
  {
    name: 'status tones draw a glyph of their own, and a supplied .ic replaces it',
    async run({ page, goto, expect }) {
      await goto('components/tag.html')
      const r = await page.evaluate(() => {
        const out = {}
        for (const tone of ['ok', 'warn', 'bad', 'info']) {
          const el = document.querySelector(`.tag[data-tone="${tone}"]:not(:has(> .ic)):not([data-priority])`)
          const cs = getComputedStyle(el, '::before')
          out[tone] = { content: cs.content, mask: cs.maskImage || cs.webkitMaskImage, words: el.textContent.trim() }
        }
        const own = document.querySelector('.tag[data-tone="warn"]:has(> .ic)')
        out.own = { content: getComputedStyle(own, '::before').content, hasIc: !!own.querySelector(':scope > .ic') }
        return out
      })
      for (const tone of ['ok', 'warn', 'bad', 'info']) {
        expect.equal(r[tone].content, '""', `${tone}: a glyph is drawn`)
        expect.ok(/data:image\/svg/.test(r[tone].mask), `${tone}: the glyph is a mask drawing`)
        expect.ok(r[tone].words.length > 2, `${tone}: the words are in the tag ("${r[tone].words}")`)
      }
      expect.equal(new Set(['ok', 'warn', 'bad', 'info'].map((t) => r[t].mask)).size, 4, 'four different glyphs')
      expect.equal(r.own.content, 'none', 'no built-in glyph when the author supplies an .ic')
      expect.ok(r.own.hasIc, 'the supplied .ic is there')
    },
  },
  {
    name: 'a priority draws bars that differ by level, and changes weight',
    async run({ page, goto, expect }) {
      await goto('components/tag.html')
      const r = await page.evaluate(() =>
        ['high', 'medium', 'low'].map((p) => {
          const el = document.querySelector(`.tag[data-priority="${p}"]:not([data-tone])`)
          const cs = getComputedStyle(el)
          return { p, bg: cs.backgroundColor, bw: cs.borderTopWidth, mask: getComputedStyle(el, '::before').maskImage, content: getComputedStyle(el, '::before').content, words: el.textContent.trim().toLowerCase() }
        }),
      )
      expect.equal(new Set(r.map((x) => x.mask)).size, 3, 'three different bar glyphs')
      for (const x of r) {
        expect.equal(x.content, '""', `${x.p}: glyph drawn`)
        expect.equal(x.words, x.p, `${x.p}: the word is in the tag`)
      }
      expect.ok(!/0\)$/.test(r[0].bg), `high is solid (got ${r[0].bg})`)
      expect.equal(r[1].bw, '2px', 'medium has the heavier 2px frame')
      expect.equal(r[0].bw, '1px', 'high keeps the thin frame')
      expect.equal(r[2].bg, 'rgba(0, 0, 0, 0)', 'low is outline')
    },
  },
  {
    name: 'a priority wins over a status tone: High in the bad tone shows bars, not a cross',
    async run({ page, goto, expect }) {
      await goto('components/tag.html')
      const r = await page.evaluate(() => {
        const plain = getComputedStyle(document.querySelector('.tag[data-priority="high"]:not([data-tone])'), '::before').maskImage
        const toned = getComputedStyle(document.querySelector('.tag[data-priority="high"][data-tone="bad"]'), '::before').maskImage
        const bad = getComputedStyle(document.querySelector('.tag[data-tone="bad"]:not([data-priority])'), '::before').maskImage
        return { plain, toned, bad }
      })
      expect.equal(r.toned, r.plain, 'same bars with or without a tone')
      expect.ok(r.toned !== r.bad, 'not the status cross')
    },
  },
  {
    name: 'a tag is static: no pointer, no shadow, not focusable, no hover change',
    async run({ page, goto, expect }) {
      await goto('components/tag.html')
      const tag = page.locator('#variants ~ .demo .tag').first()
      const read = () => tag.evaluate((el) => { const cs = getComputedStyle(el); return { cursor: cs.cursor, shadow: cs.boxShadow, bg: cs.backgroundColor, tab: el.tabIndex, transform: cs.transform } })
      const before = await read()
      await tag.hover()
      await page.waitForTimeout(300)
      const after = await read()
      expect.equal(before.cursor, 'default', 'cursor is the arrow')
      expect.equal(before.shadow, 'none', 'no hard shadow: a shadow means "press me"')
      expect.equal(before.tab, -1, 'not a tab stop')
      expect.equal(after.bg, before.bg, 'hover changes nothing')
      expect.equal(after.transform, before.transform, 'and nothing moves')
    },
  },
  {
    name: 'text is readable in every theme, palette and contrast mode (7:1 soft, 4.5:1 solid)',
    async run({ page, goto, expect }) {
      await goto('components/tag.html')
      const fails = await page.evaluate(() => {
        const cv = document.createElement('canvas')
        cv.width = cv.height = 1
        const cx = cv.getContext('2d', { willReadFrequently: true })
        const rgba = (css) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
        const lum = ([r, g, b]) => { const f = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
        const ratio = (a, b) => { const x = lum(a), y = lum(b); return ((x > y ? x : y) + 0.05) / ((x > y ? y : x) + 0.05) }
        const backdrop = (el) => { for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] === 1) return c } return [255, 255, 255, 1] }
        const root = document.documentElement
        const bad = []
        for (const theme of ['light', 'dark']) for (const palette of ['default', 'mint', 'wire']) for (const contrast of ['off', 'more']) {
          root.setAttribute('data-theme', theme)
          if (palette === 'default') root.removeAttribute('data-palette'); else root.setAttribute('data-palette', palette)
          if (contrast === 'more') root.setAttribute('data-contrast', 'more'); else root.removeAttribute('data-contrast')
          for (const el of document.querySelectorAll('.tag')) {
            const cs = getComputedStyle(el)
            let bg = rgba(cs.backgroundColor)
            if (bg[3] < 1) bg = backdrop(el)
            const fg = rgba(cs.color)
            const solid = el.matches('[data-variant="solid"], [data-priority="high"]')
            const bold = el.matches('[data-emphasis="bold"]')
            const min = solid || bold ? 4.5 : 7
            const r = ratio(fg, bg)
            if (r < min) bad.push(`${theme}/${palette}/${contrast} "${el.textContent.trim()}" ${r.toFixed(2)} < ${min}`)
          }
        }
        return bad
      })
      expect.ok(fails.length === 0, `contrast failures: ${fails.slice(0, 6).join(' | ')}`)
    },
  },
]
