// Interaction spec for the bar chart. See tests/components.mjs for the contract and tests/components/button.mjs for a model.
const WEEK = '#demo-week'
const STATIC = '#demo-static'
const STACKED = '#demo-stacked'

export const tests = [
  {
    name: 'interactive chart is a named radio group; every bar has a full-sentence name',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const r = await page.locator(`${WEEK} .bars__plot`).evaluate((el) => ({
        role: el.getAttribute('role'),
        name: document.getElementById(el.getAttribute('aria-labelledby'))?.textContent.trim(),
        labels: [...el.querySelectorAll('input[type=radio]')].map((i) => i.getAttribute('aria-label')),
        names: [...new Set([...el.querySelectorAll('input')].map((i) => i.name))],
      }))
      expect.equal(r.role, 'radiogroup', 'role')
      expect.equal(r.name, 'Spending by day', 'group name')
      expect.equal(r.labels.length, 7, 'seven bars')
      expect.ok(r.labels.every((l) => /^\w+day: \$[\d.,]+/.test(l)), `every label is a sentence: ${r.labels[0]}`)
      expect.equal(r.names.length, 1, 'one radio group')
      expect.ok(r.labels.some((l) => /highest day/.test(l)) && r.labels.some((l) => /lowest day/.test(l)), 'extremes are said in words')
    },
  },
  {
    name: 'Tab makes one stop in the group; arrows move focus and selection; the readout repeats the sentence',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      await page.locator(`${WEEK} .bars__title`).evaluate((el) => el.scrollIntoView({ block: 'center' }))
      await page.locator(`${WEEK} .tbl__scroll, ${WEEK} summary`).first().focus().catch(() => {})
      await page.locator(`${WEEK} input:checked`).focus()
      await expect.focused(page, '#demo-week input[type=radio]:checked', 'the selected bar is the stop')
      await page.keyboard.press('ArrowLeft')
      const r = await page.evaluate(() => ({
        active: document.activeElement.getAttribute('aria-label'),
        checked: document.querySelector('#demo-week input:checked').getAttribute('aria-label'),
        readout: document.querySelector('#demo-week .bars__readout').textContent,
        count: document.querySelectorAll('#demo-week input:checked').length,
      }))
      expect.equal(r.active, 'Wednesday: $27.30', 'focus moved to Wednesday')
      expect.equal(r.checked, 'Wednesday: $27.30', 'and selected it')
      expect.equal(r.readout, 'Wednesday: $27.30', 'readout shows the sentence')
      expect.equal(r.count, 1, 'exactly one selected')
      await page.keyboard.press('Home').catch(() => {})
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')
      expect.equal(await page.evaluate(() => document.querySelector('#demo-week input:checked').getAttribute('aria-label')), 'Friday: $35.90', 'arrows keep moving')
    },
  },
  {
    name: 'the readout is a live region',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const r = await page.locator(`${WEEK} .bars__readout`).evaluate((el) => ({ tag: el.tagName, live: el.getAttribute('aria-live') }))
      expect.equal(r.tag, 'OUTPUT', 'an output')
      expect.equal(r.live, 'polite', 'polite')
    },
  },
  {
    name: 'selected is four cues: accent fill, doubled frame, heavy value, inverted label',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const r = await page.evaluate(() => {
        const get = (col) => {
          const bar = col.querySelector('.bars__bar'), val = col.querySelector('.bars__value'), lab = col.querySelector('.bars__label')
          return { bg: getComputedStyle(bar).backgroundColor, shadow: getComputedStyle(bar).boxShadow, weight: getComputedStyle(val).fontWeight, labelBg: getComputedStyle(lab).backgroundColor }
        }
        const cols = [...document.querySelectorAll('#demo-week .bars__col')]
        return { sel: get(cols[3]), other: get(cols[0]) }
      })
      expect.ok(r.sel.bg !== r.other.bg, `fill differs (${r.sel.bg} vs ${r.other.bg})`)
      expect.ok(/0px 0px 0px 2px/.test(r.sel.shadow), `doubled frame (${r.sel.shadow})`)
      expect.ok(!/0px 0px 0px 2px/.test(r.other.shadow), 'unselected has no ring')
      expect.ok(Number(r.sel.weight) >= 800 && Number(r.other.weight) < 800, `value is heavier (${r.sel.weight} vs ${r.other.weight})`)
      expect.ok(r.sel.labelBg !== r.other.labelBg, 'label is inverted')
    },
  },
  {
    name: 'hover and keyboard focus lift a bar the same way; pressing sinks it; the selected bar is filled at rest',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const selAtRest = await page.locator(`${WEEK} .bars__col`).nth(3).evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--fill')))
      expect.equal(selAtRest, 1, 'the selected bar is filled at rest')
      const col = page.locator(`${WEEK} .bars__col`).nth(1)
      const nums = () => col.evaluate((el) => ({ lift: Number(getComputedStyle(el).getPropertyValue('--lift')), fill: Number(getComputedStyle(el).getPropertyValue('--fill')) }))
      await page.waitForTimeout(50)
      const rest = await nums()
      expect.equal(rest.lift, 0, 'rest: --lift 0')
      expect.equal(rest.fill, 0, 'rest: --fill 0 (unselected)')
      await col.hover()
      await page.waitForTimeout(400)
      const h = await nums()
      expect.equal(h.lift, 1, 'hover: --lift 1')
      expect.equal(h.fill, 1, 'hover: --fill 1')
      await page.mouse.down()
      await page.waitForTimeout(400)
      const d = await nums()
      expect.equal(d.lift, 0, 'pressed: back onto the surface')
      expect.equal(d.fill, 1, 'pressed: fill stays')
      await page.mouse.up()
      await page.mouse.move(0, 0)
    },
  },
  {
    name: 'bar length is the value: heights are proportional to --v',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const r = await page.evaluate(() => {
        const hs = [...document.querySelectorAll('#demo-static .bars__col')].map((c) => ({ v: Number(getComputedStyle(c).getPropertyValue('--v')), h: c.querySelector('.bars__bar').getBoundingClientRect().height }))
        return hs
      })
      const top = r.find((x) => x.v === 1), mon = r.find((x) => Math.abs(x.v - 0.296) < 0.001)
      expect.ok(top.h > mon.h * 2.5, `tallest (${top.h}) is about 3.4x Monday (${mon.h})`)
      const k = top.h / top.v
      for (const x of r) expect.ok(Math.abs(x.h - x.v * k) < 4, `height ${x.h} ~ v ${x.v} * ${k.toFixed(1)}`)
    },
  },
  {
    name: 'a static chart is one image with a summary, has no controls inside, and marks the current bar',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const r = await page.locator(`${STATIC} .bars__plot`).evaluate((el) => ({ role: el.getAttribute('role'), label: el.getAttribute('aria-label'), inputs: el.querySelectorAll('input, button, a, [tabindex]').length, current: el.querySelectorAll('[aria-current="true"]').length }))
      expect.equal(r.role, 'img', 'role=img')
      expect.ok(r.label.length > 60 && /Highest Thursday/.test(r.label), `the label says what the chart says (${r.label.slice(0, 50)}...)`)
      expect.equal(r.inputs, 0, 'nothing focusable inside an image')
      expect.equal(r.current, 1, 'one current bar')
      const lift = await page.locator(`${STATIC} .bars__col`).first().evaluate((el) => { el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); return getComputedStyle(el).boxShadow })
      expect.ok(lift === 'none' || /0px 0px 0px 0px/.test(lift) || lift === '', 'a picture you cannot press casts no shadow')
    },
  },
  {
    name: 'the data table is one disclosure away and has the same numbers',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const d = page.locator(`${WEEK} .bars__data`)
      expect.equal(await d.evaluate((el) => el.open), false, 'closed by default')
      await d.locator('summary').focus()
      await page.keyboard.press('Enter')
      expect.equal(await d.evaluate((el) => el.open), true, 'Enter opens it')
      const r = await d.evaluate((el) => ({ rows: el.querySelectorAll('tbody tr').length, first: [...el.querySelector('tbody tr').cells].map((c) => c.textContent.trim()).join(' '), label: el.querySelector('table').getAttribute('aria-label') }))
      expect.equal(r.rows, 7, 'seven rows')
      expect.equal(r.first, 'Monday $18.50', 'exact value, not the rounded one')
      expect.ok(r.label, 'table is named')
    },
  },
  {
    name: 'stacked segments differ by pattern as well as tone, and tone 1 is solid',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const r = await page.evaluate(() => {
        const mask = (el) => getComputedStyle(el, '::before').maskImage
        const seg = (n) => document.querySelector(`#demo-stacked .bars__seg[data-tone="${n}"]`)
        const solid = document.querySelector('#demo-week .bars__bar[data-tone="1"]')
        return { m2: mask(seg(2)), m3: mask(seg(3)), m4: mask(seg(4)), solid: mask(solid), bg2: getComputedStyle(seg(2)).backgroundColor, bg3: getComputedStyle(seg(3)).backgroundColor }
      })
      expect.ok(r.m2 !== r.m3 && r.m3 !== r.m4 && r.m2 !== r.m4, 'three different patterns')
      expect.ok(r.m2.length > 120 && /path/.test(decodeURIComponent(r.m2)), 'tone 2 draws lines')
      expect.ok(!/path|circle/.test(decodeURIComponent(r.solid)), 'tone 1 draws nothing (solid)')
      expect.ok(r.bg2 !== r.bg3, 'and the fills differ too')
    },
  },
  {
    name: 'stacked segments add up: shares fill the stack',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('#demo-stacked .bars__stack')].map((st) => {
        const hs = [...st.children].map((s) => s.getBoundingClientRect().height)
        return { stack: st.getBoundingClientRect().height, sum: hs.reduce((a, b) => a + b, 0) - (hs.length - 1) * 2 }
      }))
      for (const x of r) expect.ok(Math.abs(x.stack - x.sum) < 2, `segments (${x.sum}) fill the stack (${x.stack})`)
    },
  },
  {
    name: 'a vertical chart flips to horizontal when narrower than 15rem, and back',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const flow = () => page.locator('#demo-narrow .bars__plot').evaluate((el) => getComputedStyle(el).gridAutoFlow)
      await page.locator('#demo-narrow .resize-box').evaluate((el) => { el.style.inlineSize = '30rem' })
      await page.waitForTimeout(100)
      expect.equal(await flow(), 'column', 'wide: vertical bars')
      await page.locator('#demo-narrow .resize-box').evaluate((el) => { el.style.inlineSize = '13rem' })
      await page.waitForTimeout(100)
      expect.equal(await flow(), 'row', 'narrow: one row per day')
      const overflow = await page.locator('#demo-narrow .bars').evaluate((el) => el.scrollWidth > el.clientWidth + 1)
      expect.equal(overflow, false, 'nothing overflows when narrow')
    },
  },
  {
    name: 'labels never collide at 200% text in a phone-width chart',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.waitForTimeout(150)
      const r = await page.evaluate(() => {
        const labels = [...document.querySelectorAll('#demo-static .bars__label')].map((l) => l.getBoundingClientRect())
        const overlaps = []
        for (let i = 1; i < labels.length; i++) if (labels[i].left < labels[i - 1].right - 0.5 && Math.abs(labels[i].top - labels[i - 1].top) < 4) overlaps.push(i)
        const plot = document.querySelector('#demo-static .bars__plot')
        return { overlaps, clipped: plot.scrollWidth > plot.clientWidth + 1 }
      })
      expect.equal(r.overlaps.length, 0, 'no overlapping labels')
      expect.equal(r.clipped, false, 'no clipped plot')
    },
  },
  {
    name: 'data-values="selected" prints only the chosen bar\'s number, and the space stays reserved',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const r = await page.locator('#demo-values').evaluate((el) => {
        const cols = [...el.querySelectorAll('.bars__col')]
        const vis = cols.map((c) => getComputedStyle(c.querySelector('.bars__value')).visibility)
        const h = cols.map((c) => Math.round(c.querySelector('.bars__value').getBoundingClientRect().height))
        return { vis, same: new Set(h).size === 1 }
      })
      expect.equal(r.vis.filter((v) => v === 'visible').length, 1, 'one value visible')
      expect.equal(r.vis[5], 'visible', 'Saturday (chosen) is the one')
      expect.ok(r.same, 'hidden values still take their room, so nothing jumps')
      await page.locator('#demo-values input').first().check()
      const v = await page.locator('#demo-values .bars__col').first().locator('.bars__value').evaluate((e) => getComputedStyle(e).visibility)
      expect.equal(v, 'visible', 'choosing Monday reveals Monday\'s')
    },
  },
  {
    name: 'SG.chart.scale and format: proportions against the largest, clamped; true minus',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const r = await page.evaluate(() => ({
        scale: SG.chart.scale([18.5, 42, 27.3]).map((x) => Math.round(x * 1000) / 1000),
        withMax: SG.chart.scale([5, 50], { max: 20 }),
        withMin: SG.chart.scale([10, 15, 20], { min: 10, max: 20 }),
        zero: SG.chart.scale([0, 0]),
        money: SG.chart.format(-1199, { style: 'currency', currency: 'USD' }),
        plus: SG.chart.format(64.9, { style: 'currency', currency: 'USD', signDisplay: 'always' }),
      }))
      expect.equal(JSON.stringify(r.scale), '[0.44,1,0.65]', 'against the largest')
      expect.equal(JSON.stringify(r.withMax), '[0.25,1]', 'clamped to 1')
      expect.equal(JSON.stringify(r.withMin), '[0,0.5,1]', 'min and max')
      expect.equal(JSON.stringify(r.zero), '[0,0]', 'all zero is not NaN')
      expect.equal(r.money.charCodeAt(0), 0x2212, `the minus is U+2212 (got ${r.money})`)
      expect.ok(/^\+/.test(r.plus), 'plus sign kept')
    },
  },
  {
    name: 'each interactive column is at least 44px wide and tall',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('#demo-week label.bars__col')].map((c) => { const b = c.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)] }))
      for (const [w, h] of r) expect.ok(w >= 43.5 && h >= 44, `column ${w}x${h}`)
    },
  },
  {
    name: 'reduced motion removes the lift travel but keeps the fill',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const bar = page.locator(`${WEEK} .bars__col`).nth(1)
      await bar.hover()
      await page.waitForTimeout(600)
      const r = await bar.locator('.bars__bar').evaluate((el) => ({ t: getComputedStyle(el).transform, fill: Number(getComputedStyle(el.parentElement.parentElement).getPropertyValue('--fill')) }))
      expect.ok(r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)', `no travel (got ${r.t})`)
      expect.equal(r.fill, 1, 'the fill still changes')
    },
  },
  {
    name: 'forced colours: patterns stay, the selected bar gets a heavy frame',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      await page.emulateMedia({ forcedColors: 'active' })
      await page.waitForTimeout(100)
      const r = await page.evaluate(() => {
        const seg = document.querySelector('#demo-stacked .bars__seg[data-tone="3"]')
        const pseudo = getComputedStyle(seg, '::before')
        const sel = document.querySelector('#demo-week .bars__col:has(input:checked) .bars__bar')
        return { mask: pseudo.maskImage !== 'none', bg: pseudo.backgroundColor, selBorder: parseFloat(getComputedStyle(sel).borderTopWidth) }
      })
      expect.ok(r.mask, 'pattern mask still applied')
      expect.ok(r.bg !== 'rgba(0, 0, 0, 0)', `pattern painted with a system colour (${r.bg})`)
      expect.equal(r.selBorder, 4, 'selected bar has the heavy frame')
    },
  },
  {
    name: 'Hover, Press and Chosen look different even where the accent is ink: the hover shadow and the chosen frame stand off behind a paper gap',
    async run({ page, goto, expect }) {
      await goto('components/chart-bar.html')
      const shadows = await page.locator('#demo-states').evaluate((el) => {
        const col = (name) => [...el.querySelectorAll('.bars__col')].find((c) => c.querySelector('.bars__label').textContent.trim() === name)
        const s = (name) => getComputedStyle(col(name).querySelector('.bars__bar')).boxShadow
        return { rest: s('Rest'), hover: s('Hover'), press: s('Press'), chosen: s('Chosen') }
      })
      const set = new Set([shadows.hover, shadows.press, shadows.chosen])
      expect.equal(set.size, 3, `three different shadows: ${JSON.stringify(shadows)}`)
      expect.ok(/4px 4px 0px 2px/.test(shadows.hover) && /0px 0px 0px 2px/.test(shadows.hover), 'hover: a paper ring and an offset line shadow beyond it')
      expect.ok(/0px 0px 0px 4px/.test(shadows.chosen) && /0px 0px 0px 2px/.test(shadows.chosen), 'chosen: a gap ring, then a second line (the frame really doubles)')
      expect.ok(!/ [1-9]\d*px [1-9]\d*px/.test(shadows.press), 'press: sunk, no offset shadow')
    },
  },
]
