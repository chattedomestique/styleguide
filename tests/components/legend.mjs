// Interaction spec for the legend and the shared series marks. See tests/components.mjs for the contract.
export const tests = [
  {
    name: 'keys are decorative, labels are words, and the list has a role',
    async run({ page, goto, expect }) {
      await goto('components/legend.html')
      const r = await page.locator('#demo-stack .legend').evaluate((el) => ({
        role: el.getAttribute('role'),
        items: el.querySelectorAll('.legend__item').length,
        hidden: [...el.querySelectorAll('.legend__key')].every((k) => k.getAttribute('aria-hidden') === 'true'),
        labels: [...el.querySelectorAll('.legend__label')].map((l) => l.textContent.trim()),
        focusable: el.querySelectorAll('a, button, input, [tabindex]').length,
      }))
      expect.equal(r.role, 'list', 'role=list (a styled list keeps its semantics)')
      expect.equal(r.items, 5, 'five items')
      expect.ok(r.hidden, 'all keys are aria-hidden')
      expect.equal(r.labels.join(','), 'Rent,Food,Transport,Fun,Other', 'the names are text')
      expect.equal(r.focusable, 0, 'a legend is not a control')
    },
  },
  {
    name: 'the six series keys are six different patterns, welded to their tone',
    async run({ page, goto, expect }) {
      await goto('components/legend.html')
      const r = await page.evaluate(() => {
        const keys = [...document.querySelectorAll('#demo-series .legend__key')]
        return keys.map((k) => ({ tone: k.dataset.tone, mask: getComputedStyle(k, '::before').maskImage, bg: getComputedStyle(k).backgroundColor, bw: getComputedStyle(k).borderTopWidth }))
      })
      expect.equal(r.length, 6, 'six keys')
      expect.equal(new Set(r.map((x) => x.mask)).size, 6, 'six different masks')
      expect.equal(new Set(r.map((x) => x.bg)).size, 6, 'six different fills')
      expect.ok(r.every((x) => x.bw === '2px'), 'every key has the 2px frame')
      expect.ok(!/path|circle/.test(decodeURIComponent(r[0].mask)), 'tone 1 is solid')
      expect.ok(r.slice(1).every((x) => /path|circle/.test(decodeURIComponent(x.mask))), 'tones 2 to 6 draw something')
    },
  },
  {
    name: 'the pattern follows data-tone of the element itself, not an ancestor',
    async run({ page, goto, expect }) {
      await goto('components/legend.html')
      const r = await page.evaluate(() => {
        const host = document.createElement('div')
        host.setAttribute('data-tone', '5')
        host.innerHTML = '<span class="mark" id="m-none" style="display:block;width:20px;height:20px"></span><span class="mark" data-tone="2" id="m-two" style="display:block;width:20px;height:20px"></span>'
        document.body.appendChild(host)
        const none = getComputedStyle(document.getElementById('m-none'), '::before').maskImage
        const two = getComputedStyle(document.getElementById('m-two'), '::before').maskImage
        host.remove()
        return { none, two }
      })
      expect.ok(!/path|circle/.test(decodeURIComponent(r.none)), 'a mark with no tone of its own inside a tone-5 card is solid (nothing leaks in)')
      expect.ok(/path/.test(decodeURIComponent(r.two)), 'a mark with its own tone draws its pattern')
    },
  },
  {
    name: 'values and shares line up down the list (tabular, right-aligned)',
    async run({ page, goto, expect }) {
      await goto('components/legend.html')
      const r = await page.evaluate(() => {
        const rights = (sel) => [...document.querySelectorAll(`#demo-stack ${sel}`)].map((e) => Math.round(e.getBoundingClientRect().right * 10) / 10)
        return { values: rights('.legend__value'), shares: rights('.legend__share'), fig: getComputedStyle(document.querySelector('#demo-stack .legend__value')).fontVariantNumeric }
      })
      expect.equal(new Set(r.values).size, 1, `value right edges align (${r.values})`)
      expect.equal(new Set(r.shares).size, 1, `share right edges align (${r.shares})`)
      expect.ok(/tabular-nums/.test(r.fig), 'tabular figures')
    },
  },
  {
    name: 'the row layout flows and wraps; the key stays 20px',
    async run({ page, goto, expect }) {
      await goto('components/legend.html')
      const r = await page.evaluate(() => {
        const l = document.querySelector('#demo-row .legend')
        const k = l.querySelector('.legend__key').getBoundingClientRect()
        return { display: getComputedStyle(l).display, w: Math.round(k.width), h: Math.round(k.height) }
      })
      expect.equal(r.display, 'flex', 'flex row')
      expect.equal(r.w, 20, 'key is 20px wide')
      expect.equal(r.h, 20, 'and 20px tall')
    },
  },
  {
    name: 'forced colours: the key keeps a system-colour edge and pattern',
    async run({ page, goto, expect }) {
      await goto('components/legend.html')
      await page.emulateMedia({ forcedColors: 'active' })
      await page.waitForTimeout(100)
      const r = await page.evaluate(() => {
        const k = document.querySelector('#demo-series .legend__key[data-tone="3"]')
        return { mask: getComputedStyle(k, '::before').maskImage !== 'none', bg: getComputedStyle(k, '::before').backgroundColor, border: getComputedStyle(k).borderTopStyle }
      })
      expect.ok(r.mask, 'mask survives')
      expect.ok(r.bg !== 'rgba(0, 0, 0, 0)', `pattern is painted (${r.bg})`)
      expect.equal(r.border, 'solid', 'the frame survives')
    },
  },
  {
    name: 'labels wrap instead of overflowing at 200% text',
    async run({ page, goto, expect }) {
      await goto('components/legend.html')
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.waitForTimeout(150)
      const r = await page.evaluate(() => {
        const l = document.querySelector('#demo-stack .legend')
        return { over: l.scrollWidth > l.clientWidth + 1 }
      })
      expect.equal(r.over, false, 'no horizontal overflow')
    },
  },
]
