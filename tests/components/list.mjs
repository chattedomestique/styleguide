// Interaction spec for List and the key / value grid: one tab stop per pressable row, the tint model (--fill only),
// the ring drawn inside, the current row's three cues, disabled rows inert, rows switching layout together when narrow
// (values drop under the title, aligned with it; the lead and a trailing icon or chevron never move), dl structure.
// Words cut across two lines: a Range over a word has client rects at more than one height once the word was broken.
// (Self-contained, because Playwright serialises it into the page.)
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
        if (new Set([...r.getClientRects()].map((q) => Math.round(q.top))).size > 1) out.push(m[0])
      }
    }
  }
  return out
}

export const tests = [
  {
    name: 'Tab visits each pressable row once, in order, and skips static rows',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      const demo = page.locator('#links ~ .demo').first()
      await page.keyboard.press('Tab')
      await demo.locator('a.list__row').first().focus()
      const seen = []
      for (let i = 0; i < 4; i++) {
        seen.push(await page.evaluate(() => (document.activeElement?.querySelector('.list__title')?.textContent || '').trim()))
        await page.keyboard.press('Tab')
      }
      expect.equal(seen.join(' > '), 'Language > Cards per session > Notifications > Export my decks', 'one stop per row, in DOM order')
      const statics = page.locator('#rows ~ .demo').first().locator('.list__row')
      expect.equal(await statics.evaluateAll((els) => els.filter((e) => e.tabIndex >= 0).length), 0, 'static rows are not tab stops')
    },
  },
  {
    name: 'hover tints the row with --fill (8%), pressing deepens it (16%), and the row never lifts',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      const row = page.locator('#links ~ .demo').first().locator('a.list__row').first()
      const read = () => row.evaluate((el) => ({ fill: Number(getComputedStyle(el).getPropertyValue('--fill')), lift: getComputedStyle(el).getPropertyValue('--lift'), tint: Number(getComputedStyle(el, '::before').opacity), t: getComputedStyle(el).transform, sh: getComputedStyle(el).boxShadow }))
      await page.waitForTimeout(50)
      const rest = await read()
      expect.equal(rest.fill, 0, 'rest: no tint')
      expect.equal(rest.tint, 0, 'rest: the tint layer is invisible')
      await row.hover()
      await page.waitForTimeout(450)
      const hover = await read()
      expect.equal(hover.fill, 1, 'hover: --fill 1')
      expect.ok(Math.abs(hover.tint - 0.08) < 0.005, `hover: 8% (got ${hover.tint})`)
      expect.equal(hover.t, 'none', 'a row does not move')
      expect.equal(hover.sh, 'none', 'and casts no shadow: rectangles hold')
      await page.mouse.down()
      await page.waitForTimeout(450)
      const down = await read()
      expect.ok(Math.abs(down.tint - 0.16) < 0.005, `pressed: 16% (got ${down.tint})`)
      await page.mouse.up()
    },
  },
  {
    name: 'keyboard focus tints the row, and the ring is drawn inside it',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      await page.keyboard.press('Tab')
      const row = page.locator('#links ~ .demo').first().locator('a.list__row').nth(1)
      await row.focus()
      await page.waitForTimeout(450)
      const r = await row.evaluate((el) => { const cs = getComputedStyle(el); return { fill: Number(cs.getPropertyValue('--fill')), w: cs.outlineWidth, off: parseFloat(cs.outlineOffset), tint: Number(getComputedStyle(el, '::before').opacity) } })
      expect.equal(r.fill, 1, 'focus: --fill 1, like hover')
      expect.equal(r.w, '3px', 'a 3px ring')
      expect.ok(r.off < 0, `drawn inside the row (offset ${r.off})`)
      expect.ok(r.tint > 0.07, 'and the tint shows')
    },
  },
  {
    name: 'the current row is inverted, bolder and checked: three cues, none of them colour',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      const r = await page.evaluate(() => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 1
        const cx = cv.getContext('2d', { willReadFrequently: true })
        const rgb = (css) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data].join() }
        const probe = (v) => { const p = document.createElement('i'); p.style.color = `var(${v})`; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return rgb(c) }
        const cur = document.querySelector('#current ~ .demo a.list__row[aria-current="page"]')
        const other = document.querySelector('#current ~ .demo a.list__row:not([aria-current])')
        return {
          bg: rgb(getComputedStyle(cur).backgroundColor), ink: rgb(getComputedStyle(cur).color), inkRole: probe('--ink'), paperRole: probe('--paper'),
          weightCur: getComputedStyle(cur.querySelector('.list__title')).fontWeight, weightOther: getComputedStyle(other.querySelector('.list__title')).fontWeight,
          check: getComputedStyle(cur, '::after').content, checkMask: getComputedStyle(cur, '::after').maskImage, otherCheck: getComputedStyle(other, '::after').content,
        }
      })
      expect.equal(r.bg, r.inkRole, 'inverted: the text colour is the fill')
      expect.equal(r.ink, r.paperRole, 'and the surface colour is the text')
      expect.ok(Number(r.weightCur) > Number(r.weightOther), `bolder title (${r.weightCur} vs ${r.weightOther})`)
      expect.equal(r.check, '""', 'a check is drawn')
      expect.ok(/svg/.test(r.checkMask), 'as a mask icon')
      expect.equal(r.otherCheck, 'none', 'and only on the current row')
    },
  },
  {
    name: 'an unavailable row is inert by key and pointer, faint, and still in the tab order',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      const row = page.locator('#states ~ .demo button.list__row[aria-disabled="true"]')
      await page.evaluate(() => { window.__clicks = 0; document.querySelector('#states ~ .demo button.list__row[aria-disabled="true"]').addEventListener('click', () => window.__clicks++) })
      await row.focus()
      await expect.focused(page, 'button.list__row[aria-disabled="true"]', 'focusable, so its reason can be read')
      await page.keyboard.press('Enter')
      await page.keyboard.press('Space')
      await row.click({ force: true }).catch(() => {})
      expect.equal(await page.evaluate(() => window.__clicks), 0, 'nothing fires')
      expect.equal(await row.evaluate((el) => getComputedStyle(el).cursor), 'not-allowed', 'the cursor says so')
    },
  },
  {
    name: 'inside an inverted card the list reads the card ink, so text is paper on ink',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      const r = await page.evaluate(() => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 1
        const cx = cv.getContext('2d', { willReadFrequently: true })
        const rgb = (css) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data].join() }
        // the docs show a toned card (an ink card's paper bar made its ink rows read as "selected"); the inverted
        // card is the same markup with data-tone="ink", so it is built here from the toned one
        const toned = document.querySelector('#in-card ~ .demo .card[data-tone]')
        const card = toned.cloneNode(true)
        card.dataset.tone = 'ink'
        toned.after(card)
        const plain = document.querySelector('#in-card ~ .demo .card:not([data-tone])')
        const title = card.querySelector('.list__row:not([aria-current]) .list__title')
        const meta = card.querySelector('.list__row:not([aria-current]) .list__meta')
        const rule = card.querySelector('.list > li + li')
        const cur = card.querySelector('.list__row[aria-current]')
        const out = {
          cardInk: rgb(getComputedStyle(card).color), titleInk: rgb(getComputedStyle(title).color), metaInk: rgb(getComputedStyle(meta).color), ruleInk: rgb(getComputedStyle(rule).borderTopColor),
          plainInk: rgb(getComputedStyle(plain).color), curBg: rgb(getComputedStyle(cur).backgroundColor), cardBg: rgb(getComputedStyle(card).backgroundColor),
          tonedInk: rgb(getComputedStyle(toned).color), tonedTitle: rgb(getComputedStyle(toned.querySelector('.list__row:not([aria-current]) .list__title')).color),
          tonedCur: rgb(getComputedStyle(toned.querySelector('.list__row[aria-current]')).backgroundColor), tonedBg: rgb(getComputedStyle(toned).backgroundColor),
          tonedRows: [...toned.querySelectorAll('.list__row')].map((row) => rgb(getComputedStyle(row).backgroundColor)),
        }
        card.remove()
        return out
      })
      expect.equal(r.titleInk, r.cardInk, 'title: the card ink')
      expect.equal(r.ruleInk, r.cardInk, 'rules: the card ink')
      expect.ok(r.metaInk !== r.titleInk, 'meta: the card soft ink')
      expect.equal(r.curBg, r.cardInk, 'current: inverted against the card (the text colour becomes the fill)')
      expect.equal(r.cardBg, r.plainInk, 'the card really is the inverted one (its fill is the ink colour)')
      expect.equal(r.tonedTitle, r.tonedInk, 'on the toned card the title reads the tone ink')
      expect.equal(r.tonedCur, r.tonedInk, 'and the current row is the one inverted row')
      expect.equal(r.tonedRows.filter((c) => c === r.tonedInk).length, 1, 'exactly one dark row on the toned card, so "which one am I on" has one answer')
    },
  },
  {
    name: 'a narrow list drops its values under the titles, all rows together, instead of squeezing the text',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      const frames = () => page.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res))))
      const read = () => page.evaluate(() => {
        const box = document.querySelector('#reflow ~ .demo .resize-box')
        const list = box.querySelector('.list')
        return { fit: list.dataset.fit, rows: [...box.querySelectorAll('.list__row')].map((row) => {
          const main = row.querySelector('.list__main').getBoundingClientRect()
          const title = row.querySelector('.list__title').getBoundingClientRect()
          const value = row.querySelector('.list__trail > *').getBoundingClientRect()
          const lead = row.querySelector('.list__lead')
          const cs = getComputedStyle(row)
          // all the row's width but its padding and the lead (with the lead's gap) goes to the text
          const room = row.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - (lead ? lead.getBoundingClientRect().width + parseFloat(getComputedStyle(lead).marginInlineEnd) : 0)
          return { below: value.top >= main.bottom - 1, startAligned: Math.abs(value.left - title.left) <= 1, mainW: main.width, room, overflow: row.scrollWidth > row.clientWidth + 1 }
        }) }
      })
      await page.evaluate(() => { document.querySelector('#reflow ~ .demo .resize-box').style.inlineSize = '13rem' })
      await frames()
      await page.waitForTimeout(100)
      const narrow = await read()
      expect.equal(narrow.fit, 'stack', 'the list switched to its stacked layout')
      for (const row of narrow.rows) {
        expect.ok(row.below, 'the value drops under the title')
        expect.ok(row.startAligned, 'aligned with the title, not with the end')
        expect.ok(row.mainW >= row.room - 1, `the text takes all the room the lead leaves (${row.mainW.toFixed(0)} of ${row.room.toFixed(0)}px)`)
        expect.ok(!row.overflow, 'and nothing spills out sideways')
      }
      await page.evaluate(() => { document.querySelector('#reflow ~ .demo .resize-box').style.inlineSize = '40rem' })
      await frames()
      await page.waitForTimeout(100)
      const wide = await read()
      expect.equal(wide.fit, 'row', 'wide again: values back at the end')
      expect.ok(wide.rows.every((row) => !row.below), 'every value is beside its title')
      const cut = await page.evaluate(() => {
        const box = document.querySelector('#reflow ~ .demo .resize-box')
        box.style.inlineSize = '13rem'
        return new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => {
          const out = []
          for (const t of box.querySelectorAll('.list__title')) for (const n of t.childNodes) {
            const re = /\S+/g
            for (let m; (m = re.exec(n.data)); ) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); if (new Set([...r.getClientRects()].map((q) => Math.round(q.top))).size > 1) out.push(m[0]) }
          }
          res(out)
        })))
      })
      expect.equal(cut.join(', '), '', 'narrow: no title word is cut inside')
    },
  },
  {
    name: 'at 200% text on a phone the lead and a trailing icon or chevron never leave the row, and the rows of one list match',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      for (const [w, text] of [[390, 200], [320, 200], [390, 100]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(250)
        const lists = await page.evaluate(() => [...document.querySelectorAll('.list')].filter((l) => l.offsetParent && l.querySelector('.list__row .list__main')).map((l) => ({
          where: (l.closest('.demo')?.previousElementSibling?.textContent || '').slice(0, 40),
          rows: [...l.querySelectorAll('.list__row')].filter((r) => r.querySelector('.list__main')).map((row) => {
            const main = row.querySelector('.list__main').getBoundingClientRect()
            const lead = row.querySelector('.list__lead')?.getBoundingClientRect()
            const end = row.querySelector('.list__trail > :is(.list__chevron, .ic, .btn[data-shape="circle"])')?.getBoundingClientRect()
            const val = row.querySelector('.list__trail > :not(.list__chevron, .ic, .btn[data-shape="circle"])')?.getBoundingClientRect()
            return {
              title: row.querySelector('.list__title')?.textContent.trim(),
              leadBeside: !lead || (lead.right <= main.left + 1 && lead.top < main.bottom),
              endBeside: !end || (end.left >= main.right - 1 && end.top < main.bottom),
              valueBelow: val ? val.top >= main.bottom - 1 : null,
            }
          }),
        })))
        for (const l of lists) {
          for (const r of l.rows) {
            expect.ok(r.leadBeside, `${w}px ${text}%: "${r.title}": the lead stays beside the text`)
            expect.ok(r.endBeside, `${w}px ${text}%: "${r.title}": the icon or chevron stays at the end of the row`)
          }
          const drops = new Set(l.rows.filter((r) => r.valueBelow !== null).map((r) => r.valueBelow))
          expect.ok(drops.size <= 1, `${w}px ${text}%: in "${l.where}" every row has the same layout`)
        }
      }
    },
  },
  {
    name: 'key / value: valid dl groups, a wrapping grid, and rows that stack when narrow',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      const r = await page.evaluate(() => {
        const kv = document.querySelector('#kv ~ .demo dl.kv')
        const groups = [...kv.children]
        const okGroups = groups.every((g) => g.tagName === 'DIV' && g.children.length === 2 && g.children[0].tagName === 'DT' && g.children[1].tagName === 'DD')
        const cols = getComputedStyle(kv).gridTemplateColumns.split(' ').length
        const rows = document.querySelectorAll('#kv ~ .demo dl.kv[data-layout="rows"]')[0]
        const wrap = rows.closest('.demo__stage')
        const dd = rows.querySelector('dd')
        wrap.style.inlineSize = '34rem'
        const wide = getComputedStyle(dd).textAlign
        const before = getComputedStyle(rows.firstElementChild).flexDirection
        wrap.style.inlineSize = '15rem'
        const narrow = getComputedStyle(rows.firstElementChild).flexDirection
        const narrowAlign = getComputedStyle(dd).textAlign
        wrap.style.inlineSize = ''
        const dt = kv.querySelector('dt')
        return { okGroups, cols, wide, before, narrow, narrowAlign, upper: getComputedStyle(dt).textTransform, typed: dt.textContent }
      })
      expect.ok(r.okGroups, 'each group is <div><dt/><dd/></div>')
      expect.ok(r.cols >= 2, `at 390px the grid already has ${r.cols} columns of 6.5rem`)
      expect.equal(r.wide, 'end', 'rows: the value sits at the end')
      expect.equal(r.before, 'row', 'rows: key and value share a line')
      expect.equal(r.narrow, 'column', 'rows: below 20rem the value drops under its key')
      expect.equal(r.narrowAlign, 'start', 'and aligns with it')
      expect.equal(r.upper, 'uppercase', 'keys are uppercase in CSS')
      expect.ok(r.typed !== r.typed.toUpperCase(), `and natural case in the HTML ("${r.typed}")`)
    },
  },
  {
    name: 'right to left: the chevron mirrors',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      const r = await page.evaluate(() => {
        const ch = document.querySelector('#links ~ .demo .list__chevron')
        const ltr = getComputedStyle(ch).transform
        document.documentElement.setAttribute('dir', 'rtl')
        const rtl = getComputedStyle(ch).transform
        document.documentElement.removeAttribute('dir')
        return { ltr, rtl }
      })
      expect.equal(r.ltr, 'none', 'ltr: as drawn')
      expect.equal(r.rtl, 'matrix(-1, 0, 0, 1, 0, 0)', 'rtl: flipped')
    },
  },
  {
    name: 'the framed variant takes the card radius role',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      const r = await page.evaluate(() => {
        const l = document.querySelector('#links ~ .demo .list[data-variant="framed"]')
        const sq = getComputedStyle(l).borderTopLeftRadius
        document.documentElement.setAttribute('data-corners', 'soft')
        const so = getComputedStyle(l).borderTopLeftRadius
        document.documentElement.removeAttribute('data-corners')
        return { sq, so, bw: getComputedStyle(l).borderTopWidth }
      })
      expect.equal(r.sq, '0px', 'square by default')
      expect.equal(r.so, '24px', 'soft = --radius-card')
      expect.equal(r.bw, '2px', 'framed with --bw')
    },
  },
  {
    name: 'row text is 7:1 and meta text 4.5:1 or better on every tint, theme, palette and contrast mode',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      const fails = await page.evaluate(async () => {
        const cv = document.createElement('canvas'); cv.width = cv.height = 1
        const cx = cv.getContext('2d', { willReadFrequently: true })
        const rgb = (css) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]] }
        const lum = ([r, g, b]) => { const f = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
        const ratio = (a, b) => { const x = lum(a), y = lum(b); return ((x > y ? x : y) + 0.05) / ((x > y ? y : x) + 0.05) }
        const mix = (a, b, t) => a.map((v, i) => v * t + b[i] * (1 - t))
        // the surface behind a row: its own fill (the current row), else the nearest opaque ancestor, then the tint layer over it
        const surface = (row) => { for (let n = row; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; const d = rgb(c); if (!/rgba\(.*, 0\)$|transparent/.test(c)) return d } return [255, 255, 255] }
        const rows = [...new Set(document.querySelectorAll('.list__row'))].filter((r) => !r.hasAttribute('aria-disabled'))
        const kvs = [...document.querySelectorAll('.kv dt, .kv dd')]
        const root = document.documentElement
        const bad = []
        for (const theme of ['light', 'dark']) for (const palette of ['default', 'mint', 'wire']) for (const contrast of ['off', 'more']) {
          root.setAttribute('data-theme', theme)
          if (palette === 'default') root.removeAttribute('data-palette'); else root.setAttribute('data-palette', palette)
          if (contrast === 'more') root.setAttribute('data-contrast', 'more'); else root.removeAttribute('data-contrast')
          await new Promise((r) => setTimeout(r, 380))
          const tag = `${theme}/${palette}/${contrast}`
          for (const row of rows) {
            const pseudo = getComputedStyle(row, '::before')
            const alpha = pseudo.content === 'none' ? 0 : Number(pseudo.opacity) // only pressable rows have a tint layer
            const base = surface(row)
            const fg = rgb(getComputedStyle(row).color)
            const bg = mix(fg, base, alpha)
            const title = row.querySelector('.list__title')
            if (title) { const r = ratio(rgb(getComputedStyle(title).color), bg); if (r < 7) bad.push(`${tag} title "${title.textContent.trim()}" ${r.toFixed(2)}`) }
            const meta = row.querySelector('.list__meta')
            if (meta) { const r = ratio(rgb(getComputedStyle(meta).color), bg); if (r < 4.5) bad.push(`${tag} meta "${meta.textContent.trim().slice(0, 18)}" ${r.toFixed(2)}`) }
          }
          for (const el of kvs) {
            const base = surface(el)
            const r = ratio(rgb(getComputedStyle(el).color), base)
            const min = el.tagName === 'DT' ? 4.5 : 7
            if (r < min) bad.push(`${tag} ${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 14)}" ${r.toFixed(2)} < ${min}`)
          }
        }
        return bad
      })
      expect.ok(fails.length === 0, `contrast failures: ${fails.slice(0, 8).join(' | ')}`)
    },
  },
  {
    name: 'at 200% text a tag, a short button label and an amount in a trail are never cut inside a word (the trail drops under the text whole)',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      await page.addStyleTag({ content: 'html{font-size:200%}' })
      await page.waitForTimeout(200)
      const cut = await page.evaluate(brokenWords, '.list__trail')
      expect.equal(cut.join(', '), '', 'words split across lines in a trail')
      const seen = await page.evaluate(() => document.querySelectorAll('.list__trail .tag, .list__trail .btn, .list__trail .list__value').length)
      expect.ok(seen >= 12, `the page has trail tags, buttons and values to check (${seen})`)
    },
  },
  {
    name: 'the forced .is-focus state draws the same 3px ring inside the row that a real focus does (the docs show the state with it)',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      const r = await page.locator('#states ~ .demo .list__row.is-focus').first().evaluate((el) => { const cs = getComputedStyle(el); return { s: cs.outlineStyle, w: cs.outlineWidth, o: cs.outlineOffset } })
      expect.equal(r.s, 'solid', 'a ring is drawn')
      expect.equal(r.w, '3px', 'the ring width')
      expect.equal(r.o, '-3px', 'inside the row, where the frame would clip it')
    },
  },
  {
    name: 'nothing in a row runs into its end padding: a row that cannot hold its value beside the text stacks (320px and 390px, 100% and 200%)',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      for (const [w, text] of [[320, 100], [390, 100], [320, 200], [390, 200]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(250)
        const r = await page.evaluate(() => [...document.querySelectorAll('.list__row')].filter((row) => row.offsetParent).map((row) => {
          const cs = getComputedStyle(row)
          const right = row.getBoundingClientRect().right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight)
          let over = 0
          for (const c of row.querySelectorAll('*')) { const b = c.getBoundingClientRect(); if (b.width) over = Math.max(over, b.right - right) }
          return { title: row.querySelector('.list__title')?.textContent.trim(), over }
        }))
        for (const x of r) expect.ok(x.over <= 0.5, `${w}px ${text}%: "${x.title}" stays inside its padding (${x.over.toFixed(1)}px over)`)
      }
    },
  },
  {
    name: 'a meta line of facts (data-facts) shows a dot between two facts on one line, and never starts or ends a line with one (390px and 320px, 100% and 200%)',
    async run({ page, goto, expect }) {
      await goto('components/list.html')
      let wrapped = 0
      for (const [w, text] of [[390, 100], [390, 200], [320, 100], [320, 200]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(250)
        const r = await page.evaluate(() => [...document.querySelectorAll('.list__meta[data-facts]')].filter((m) => m.offsetParent).map((m) => {
          const mb = m.getBoundingClientRect()
          const facts = [...m.children].map((f) => {
            const b = f.getBoundingClientRect(), d = getComputedStyle(f, '::before')
            return { left: b.left, right: b.right, top: Math.round(b.top), dot: d.content, at: parseFloat(d.insetInlineStart), w: parseFloat(d.width), spill: f.scrollWidth - f.clientWidth }
          })
          return { t: m.textContent.trim().replace(/\s+/g, ' '), clip: getComputedStyle(m).overflowX, left: mb.left, facts }
        }))
        expect.ok(r.length >= 7, `${w}px ${text}%: meta lines of facts (${r.length})`)
        for (const m of r) {
          expect.equal(m.clip, 'clip', `${w}px ${text}%: "${m.t}" clips what lies past its edges`)
          m.facts.forEach((f, i) => {
            expect.ok(f.spill <= 1, `${w}px ${text}%: "${m.t}": fact ${i + 1} keeps its words inside it`)
            if (i === 0) return
            const prev = m.facts[i - 1]
            if (f.top === prev.top) expect.ok(Math.abs(f.left - prev.right - f.w) <= 1, `${w}px ${text}%: "${m.t}": the dot fills the gap between two facts on one line`)
            else { wrapped++; expect.ok(f.left + f.at + f.w <= m.left + 0.5, `${w}px ${text}%: "${m.t}": the dot of a fact that starts a line lies past the start edge, where it is clipped`) }
          })
        }
      }
      expect.ok(wrapped > 0, `some lines of facts wrap at 200% text (${wrapped}), so the line-start case is checked`)
    },
  },
]
