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
        const end = document.querySelector('#heading ~ .demo h4.divider[data-align="end"]')
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
        const el = document.querySelector('#heading ~ .demo h4.divider[data-align="end"]')
        const out = { scrollW: el.scrollWidth, clientW: el.clientWidth }
        document.documentElement.style.fontSize = ''
        return out
      })
      expect.ok(r.scrollW <= r.clientW + 1, `no sideways overflow (${r.scrollW} vs ${r.clientW})`)
    },
  },
]
