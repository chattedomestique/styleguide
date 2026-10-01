// Interaction spec for Divider. Nothing to press; what matters is what assistive tech is told, the line weights,
// and that the line follows the text colour.
export const tests = [
  {
    name: 'a bare hr is a separator; a labelled divider is text, not a separator',
    async run({ page, goto, expect }) {
      await goto('components/divider.html')
      const rules = await page.locator('#rules ~ .demo').first().ariaSnapshot()
      expect.ok(/separator/.test(rules), 'an hr keeps its separator role')
      const labelled = await page.locator('#labelled ~ .demo').first().ariaSnapshot()
      expect.ok(/paragraph: or/.test(labelled), `the label is read as text (got ${labelled.split('\n').slice(0, 4).join(' / ')})`)
      expect.ok(!/separator/.test(labelled), 'and is not hidden inside a separator')
      const grouped = await page.locator('#heading ~ .demo').first().ariaSnapshot()
      expect.ok(/heading "Today" \[level=4\]/.test(grouped), 'a divider that names a group is a heading')
    },
  },
  {
    name: 'thin is 1px, frame is 2px, quiet uses the faint line colour, and the line follows the text colour',
    async run({ page, goto, expect }) {
      await goto('components/divider.html')
      const r = await page.evaluate(() => {
        const probe = (v) => { const p = document.createElement('i'); p.style.color = `var(${v})`; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c }
        const q = (sel) => document.querySelector(sel)
        const thin = q('#rules ~ .demo hr.divider:not([data-weight]):not([data-quiet])')
        const frame = q('#rules ~ .demo hr.divider[data-weight="frame"]')
        const quiet = q('#rules ~ .demo hr.divider[data-quiet]')
        const onInk = q('#rules ~ .demo .card[data-tone="ink"] hr.divider')
        const card = q('#rules ~ .demo .card[data-tone="ink"]')
        return {
          thin: getComputedStyle(thin).borderTopWidth,
          frame: getComputedStyle(frame).borderTopWidth,
          quietColor: getComputedStyle(quiet).borderTopColor,
          faint: probe('--line-soft'),
          thinColor: getComputedStyle(thin).borderTopColor,
          thinText: getComputedStyle(thin).color,
          inkLine: getComputedStyle(onInk).borderTopColor,
          inkText: getComputedStyle(card).color,
        }
      })
      expect.equal(r.thin, '1px', 'thin is --bw-thin')
      expect.equal(r.frame, '2px', 'frame is --bw')
      expect.equal(r.quietColor, r.faint, 'quiet is --line-soft')
      expect.equal(r.thinColor, r.thinText, 'the line is the text colour')
      expect.equal(r.inkLine, r.inkText, 'on an inverted card the line is paper, because it is the text colour')
    },
  },
  {
    name: 'a labelled divider draws a rule on each side; aligned to a side it draws only the far one',
    async run({ page, goto, expect }) {
      await goto('components/divider.html')
      const r = await page.evaluate(() => {
        const side = (el, pseudo) => { const cs = getComputedStyle(el, pseudo); return { display: cs.display, w: parseFloat(cs.width) || 0, bt: cs.borderTopWidth } }
        const mid = document.querySelector('#labelled ~ .demo p.divider')
        const start = document.querySelector('#heading ~ .demo h4.divider[data-align="start"]')
        const end = document.querySelector('#heading ~ .demo .divider[data-align="end"]')
        return { midB: side(mid, '::before'), midA: side(mid, '::after'), startB: side(start, '::before'), startA: side(start, '::after'), endB: side(end, '::before'), endA: side(end, '::after') }
      })
      expect.ok(r.midB.w > 12 && r.midA.w > 12, `both rules have length (${r.midB.w}, ${r.midA.w})`)
      expect.equal(r.midB.bt, '1px', 'and are 1px')
      expect.equal(r.startB.display, 'none', 'start: no rule before the label')
      expect.ok(r.startA.w > 12, 'start: the rule after it grows')
      expect.equal(r.endA.display, 'none', 'end: no rule after the label')
      expect.ok(r.endB.w > 12, 'end: the rule before it grows')
    },
  },
  {
    name: 'a vertical divider stretches to its row and is a 1px line',
    async run({ page, goto, expect }) {
      await goto('components/divider.html')
      const r = await page.evaluate(() => {
        const el = document.querySelector('#vertical ~ .demo hr.divider[data-orientation="vertical"]')
        const cs = getComputedStyle(el)
        return { w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height, bl: cs.borderInlineStartWidth, bt: cs.borderTopWidth }
      })
      expect.equal(r.bl, '1px', 'a 1px line at the start edge')
      expect.equal(r.bt, '0px', 'no horizontal rule')
      expect.ok(r.h >= 24 - 0.5, `at least 24px tall (${r.h})`)
      expect.ok(r.w <= 1.5, `no width of its own (${r.w})`)
    },
  },
  {
    name: 'a long label wraps at 200% text and never overflows',
    async run({ page, goto, expect }) {
      await goto('components/divider.html')
      const r = await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
        const out = [...document.querySelectorAll('.divider:not(hr)')].map((el) => ({ text: el.textContent.trim(), scrollW: el.scrollWidth, clientW: el.clientWidth }))
        document.documentElement.style.fontSize = ''
        return out
      })
      expect.ok(r.length >= 5, `labelled dividers (${r.length})`)
      for (const x of r) expect.ok(x.scrollW <= x.clientW + 1, `${x.text}: no sideways overflow (${x.scrollW} vs ${x.clientW})`)
    },
  },
  {
    name: 'at 200% text a label and its amount never overlap, and the amount keeps its minus with its digits',
    async run({ page, goto, expect }) {
      await goto('components/divider.html')
      await page.addStyleTag({ content: 'html{font-size:200%}' })
      await page.waitForTimeout(200)
      const r = await page.evaluate(() => [...document.querySelectorAll('#heading ~ .demo .split')].map((row) => {
        const [label, amount] = [row.firstElementChild, row.lastElementChild]
        const a = label.getBoundingClientRect(), b = amount.getBoundingClientRect()
        const lines = new Set([...(() => { const rg = document.createRange(); rg.selectNodeContents(amount); return rg.getClientRects() })()].map((q) => Math.round(q.top))).size
        const apart = b.left >= a.right - 0.5 || b.top >= a.bottom - 0.5 || b.bottom <= a.top + 0.5
        return { name: label.textContent.trim(), apart, lines, spill: row.scrollWidth - row.clientWidth }
      }))
      expect.ok(r.length >= 4, `rows (${r.length})`)
      for (const x of r) {
        expect.ok(x.apart, `${x.name}: the label and the amount are apart`)
        expect.equal(x.lines, 1, `${x.name}: the amount is on one line, sign and digits together`)
        expect.ok(x.spill <= 1, `${x.name}: the row does not spill sideways`)
      }
    },
  },
  {
    name: 'a labelled divider spans its column even where a base style gives paragraphs a reading measure',
    async run({ page, goto, expect }) {
      await goto('components/divider.html')
      // outside the docs article (whose own unlayered rule is not the component's business), with a measure added to the base layer
      const r = await page.evaluate(() => {
        const st = document.createElement('style')
        st.textContent = '@layer sg.base { p { max-inline-size: 20ch } }'
        document.head.append(st)
        const host = document.createElement('div')
        host.style.cssText = 'inline-size: 500px'
        host.innerHTML = '<p class="divider">or</p>'
        document.body.append(host)
        const d = host.firstElementChild
        const out = { max: getComputedStyle(d).maxInlineSize, w: d.getBoundingClientRect().width }
        host.remove()
        st.remove()
        return out
      })
      expect.equal(r.max, 'none', 'the divider carries no measure')
      expect.equal(Math.round(r.w), 500, 'and spans the 500px column')
    },
  },
  {
    name: 'a row with vertical dividers never starts a line with one: it is one row, or a column with the rules turned flat',
    async run({ page, goto, expect }) {
      await goto('components/divider.html')
      const check = () => page.evaluate(() => [...document.querySelectorAll('#vertical ~ .demo :has(> .divider[data-orientation="vertical"])')].map((row) => {
        const kids = [...row.children].filter((k) => k.getBoundingClientRect().width || k.getBoundingClientRect().height)
        const items = kids.filter((k) => !k.matches('.divider'))
        const rules = kids.filter((k) => k.matches('.divider'))
        const tops = new Set(items.map((k) => Math.round(k.getBoundingClientRect().top)))
        const lefts = new Set(items.map((k) => Math.round(k.getBoundingClientRect().left)))
        const firstLeft = Math.min(...kids.map((k) => k.getBoundingClientRect().left))
        // in a row: one line, every rule between two items; in a column: one left edge, and the rules are horizontal
        const asRow = tops.size === 1 && rules.every((d) => { const b = d.getBoundingClientRect(); return b.left > firstLeft + 1 && b.height > b.width })
        const asColumn = lefts.size === 1 && rules.every((d) => { const b = d.getBoundingClientRect(); return b.width > b.height })
        return { fit: row.dataset.fit, asRow, asColumn, n: items.length, spill: row.scrollWidth - row.clientWidth }
      }))
      for (const [w, text] of [[1024, 100], [390, 100], [390, 200], [320, 200]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(200)
        const rows = await check()
        expect.ok(rows.length >= 1, 'found a row with vertical dividers')
        for (const r of rows) {
          expect.ok(r.asRow || r.asColumn, `${w}px ${text}%: ${r.n} items laid out as one row or one column (data-fit ${r.fit})`)
          expect.ok(r.spill <= 1, `${w}px ${text}%: nothing spills sideways (${r.spill}px)`)
        }
      }
    },
  },
  {
    name: 'a side-aligned label that cannot keep its rule beside it takes the rule on a line of its own; beside a label, the rule starts right after the words',
    async run({ page, goto, expect }) {
      await goto('components/divider.html')
      await page.addStyleTag({ content: 'html{font-size:200%}' })
      await page.waitForTimeout(200)
      const r = await page.evaluate(() => {
        const text = (el) => { let top = Infinity, bottom = -Infinity, right = -Infinity, lines = new Set(); const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode()); ) { const rg = document.createRange(); rg.selectNodeContents(n); for (const q of rg.getClientRects()) { if (q.width < 1) continue; top = Math.min(top, q.top); bottom = Math.max(bottom, q.bottom); right = Math.max(right, q.right); lines.add(Math.round(q.top)) } } return { top, bottom, right, lines: lines.size } }
        const first = document.querySelector('#heading ~ .demo .divider[data-align="start"]')
        const short = { d: first.getBoundingClientRect(), t: text(first), gap: parseFloat(getComputedStyle(first).columnGap) }
        // a label too long for one line beside its rule
        first.textContent = 'Everything you studied with friends this week'
        const long = { d: first.getBoundingClientRect(), t: text(first), rowGap: parseFloat(getComputedStyle(first).rowGap), rule: parseFloat(getComputedStyle(first, '::after').borderTopWidth) }
        return { short: JSON.parse(JSON.stringify(short)), long: JSON.parse(JSON.stringify(long)) }
      })
      expect.equal(r.short.t.lines, 1, 'a short label holds one line')
      expect.ok(r.short.d.height - (r.short.t.bottom - r.short.t.top) <= 2, 'and its rule is beside it, not under it')
      expect.ok(r.long.t.lines >= 2, `a long label wraps (${r.long.t.lines} lines)`)
      expect.ok(r.long.d.bottom - r.long.t.bottom >= r.long.rowGap + r.long.rule - 1, `and its rule is on a line of its own, under the words (${(r.long.d.bottom - r.long.t.bottom).toFixed(1)}px below them)`)
    },
  },
  {
    name: 'a total (end-aligned divider) lines up with the amounts it sums, at 100% and 200% text',
    async run({ page, goto, expect }) {
      await goto('components/divider.html')
      for (const text of [100, 200]) {
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(200)
        const r = await page.evaluate(() => {
          const total = document.querySelector('#heading ~ .demo .divider[data-align="end"]')
          const right = (el) => { const rg = document.createRange(); rg.selectNodeContents(el); return Math.max(...[...rg.getClientRects()].map((q) => q.right)) }
          const amounts = [...total.parentElement.querySelectorAll('.split > .num')].map(right)
          return { total: right(total), amounts }
        })
        expect.ok(r.amounts.length >= 2, 'the amounts above the total')
        for (const a of r.amounts) expect.ok(Math.abs(a - r.total) <= 1.5, `${text}%: an amount ends at ${a.toFixed(1)}px, the total at ${r.total.toFixed(1)}px`)
      }
    },
  },
]
