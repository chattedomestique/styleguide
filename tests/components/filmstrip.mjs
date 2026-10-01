// Interaction spec for Filmstrip: native radio group driving a stage (APG radio group).
const PHOTOS = '#photos + p + .demo .filmstrip'
const BACKDROP = '#swatches + p + .demo .filmstrip'
const said = (page) => page.evaluate(() => [...document.querySelectorAll('[role="status"]')].map((n) => n.textContent).join('|'))
const stage = (page, sel) => page.evaluate((s) => {
  const fig = document.querySelector(s + ' .media')
  const img = fig.querySelector('img')
  return { alt: img.getAttribute('alt'), src: img.getAttribute('src'), title: (fig.querySelector('.media__title') || {}).textContent, tone: fig.getAttribute('data-tone') }
}, sel)

export const tests = [
  {
    name: 'the strip is a native radio group: exactly one tab stop, on the chosen thumbnail',
    async run({ page, goto, expect }) {
      await goto('components/filmstrip.html')
      const r = await page.evaluate((s) => {
        const radios = [...document.querySelectorAll(s + ' .filmstrip__thumb > input[type="radio"]')]
        const strip = document.querySelector(s + ' .filmstrip__strip')
        return { n: radios.length, names: new Set(radios.map((x) => x.name)).size, checked: radios.filter((x) => x.checked).length, tag: strip.tagName, legend: !!strip.querySelector('legend'), controls: strip.getAttribute('aria-controls'), stage: !!document.getElementById(strip.getAttribute('aria-controls')) }
      }, PHOTOS)
      expect.equal(r.n, 6)
      expect.equal(r.names, 1, 'one group')
      expect.equal(r.checked, 1, 'exactly one is chosen')
      expect.equal(r.tag, 'FIELDSET')
      expect.ok(r.legend, 'the group has a legend')
      expect.ok(r.stage, 'aria-controls points at a real stage')
      // Tab from the stage caption lands on the chosen one and the next Tab leaves the strip
      await page.evaluate((s) => { const n = document.querySelector(s + ' .media'); n.setAttribute('tabindex', '-1'); n.focus() }, PHOTOS)
      await page.keyboard.press('Tab')
      await expect.focused(page, `${PHOTOS} input:checked`, 'Tab lands on the chosen thumbnail')
      await page.keyboard.press('Tab')
      const inStrip = await page.evaluate((s) => !!document.activeElement.closest(s + ' .filmstrip__strip'), PHOTOS)
      expect.ok(!inStrip, 'the second Tab leaves the strip: the thumbnails are one stop')
    },
  },
  {
    name: 'arrow keys move AND choose, wrap at the ends, and the stage follows with an announcement',
    async run({ page, goto, expect }) {
      await goto('components/filmstrip.html')
      const first = page.locator(`${PHOTOS} input:checked`)
      await first.focus()
      const s0 = await stage(page, PHOTOS)
      expect.equal(s0.title, 'Harbour at dawn')
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(100)
      await expect.focused(page, `${PHOTOS} input[value="market"]`, 'focus moved')
      expect.ok(await page.locator(`${PHOTOS} input[value="market"]`).isChecked(), 'and it is chosen')
      const s1 = await stage(page, PHOTOS)
      expect.equal(s1.title, 'Tomato stall, number 14', 'caption follows')
      expect.ok(/market/.test(s1.src), 'picture follows')
      expect.ok(/tomatoes/.test(s1.alt), `the stage alt describes the PICTURE, not the choice (got "${s1.alt}")`)
      await expect.eventually(() => said(page), (v) => /Showing Tomato stall, number 14, 2 of 6/.test(v), 'announced')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      await expect.focused(page, `${PHOTOS} input[value="rooftops"]`, 'wraps from the first to the last')
      expect.equal((await stage(page, PHOTOS)).title, 'Rooftops at dusk')
      await page.keyboard.press('ArrowDown')
      await expect.focused(page, `${PHOTOS} input[value="harbour"]`, 'down is next, too')
    },
  },
  {
    name: 'Home and End jump to the first and last thumbnail',
    async run({ page, goto, expect }) {
      await goto('components/filmstrip.html')
      await page.locator(`${PHOTOS} input[value="tram"]`).focus()
      await page.keyboard.press('Space')
      await page.keyboard.press('End')
      await expect.focused(page, `${PHOTOS} input[value="rooftops"]`)
      expect.equal((await stage(page, PHOTOS)).title, 'Rooftops at dusk')
      await page.keyboard.press('Home')
      await expect.focused(page, `${PHOTOS} input[value="harbour"]`)
      expect.equal((await stage(page, PHOTOS)).title, 'Harbour at dawn')
    },
  },
  {
    name: 'a tap or click anywhere on a thumbnail chooses it (the radio covers the whole thumbnail)',
    async run({ page, goto, expect }) {
      await goto('components/filmstrip.html')
      const t = page.locator(`${PHOTOS} .filmstrip__thumb`).nth(2)
      await t.scrollIntoViewIfNeeded()
      const box = await t.boundingBox()
      await page.mouse.click(box.x + 3, box.y + 3) // the very corner
      expect.ok(await page.locator(`${PHOTOS} input[value="tram"]`).isChecked(), 'chosen by a corner click')
      expect.equal((await stage(page, PHOTOS)).title, 'Tram on line 28')
    },
  },
  {
    name: 'the chosen thumbnail has two cues: a doubled frame and a check badge',
    async run({ page, goto, expect }) {
      await goto('components/filmstrip.html')
      const r = await page.evaluate((s) => {
        const on = document.querySelector(s + ' input:checked').parentElement
        const off = document.querySelectorAll(s + ' .filmstrip__thumb')[1]
        return {
          shadowOn: getComputedStyle(on).boxShadow, shadowOff: getComputedStyle(off).boxShadow,
          badgeOn: getComputedStyle(on, '::before').display, badgeOff: getComputedStyle(off, '::before').display,
        }
      }, PHOTOS)
      expect.ok(/0px 0px 0px 2px/.test(r.shadowOn), `frame doubles by 2px (got ${r.shadowOn})`)
      expect.ok(!/0px 0px 0px 2px/.test(r.shadowOff), 'not on an unchosen one')
      expect.equal(r.badgeOn, 'block', 'check badge shows')
      expect.equal(r.badgeOff, 'none', 'and only there')
    },
  },
  {
    name: 'hover and keyboard focus raise a thumbnail the same way without filling it; pressing sinks it and tints it at once',
    async run({ page, goto, expect }) {
      await goto('components/filmstrip.html')
      const t = page.locator(`${PHOTOS} .filmstrip__thumb`).nth(1)
      await t.scrollIntoViewIfNeeded()
      // the alpha of the tint, whichever way the browser writes the colour (rgba(…) or color(srgb … / a))
      const nums = () => t.evaluate((el) => {
        const c = getComputedStyle(el.querySelector('input')).backgroundColor
        const m = c.match(/\/\s*([\d.]+)\s*\)$/) || c.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/)
        return { lift: Number(getComputedStyle(el).getPropertyValue('--lift')), fill: Number(getComputedStyle(el).getPropertyValue('--fill')), tint: c, alpha: m ? Number(m[1]) : (c === 'transparent' ? 0 : 1) }
      })
      await page.waitForTimeout(50)
      const rest = await nums()
      expect.equal(rest.lift, 0, 'rest: flat')
      expect.equal(rest.alpha, 0, `rest: no tint (${rest.tint})`)
      await t.hover()
      await page.waitForTimeout(400)
      const h = await nums()
      expect.equal(h.lift, 1, 'hover: raised')
      expect.equal(h.fill, 0, 'hover: no fill (only the chosen one may look chosen)')
      await page.mouse.down()
      await page.waitForTimeout(300)
      const d = await nums()
      expect.equal(d.lift, 0, 'pressed: sinks')
      expect.ok(Math.abs(d.fill - 0.15) < 0.01, `pressed: --fill 0.15 (got ${d.fill})`)
      expect.ok(d.alpha > 0.1, `pressed: a visible ink tint over the picture (${d.tint})`)
      await page.mouse.up()
      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab')
      await page.locator(`${PHOTOS} input:checked`).focus()
      await page.waitForTimeout(400)
      const f = await page.locator(`${PHOTOS} input:checked`).evaluate((i) => ({ lift: Number(getComputedStyle(i.parentElement).getPropertyValue('--lift')), fill: Number(getComputedStyle(i.parentElement).getPropertyValue('--fill')), ring: getComputedStyle(i.parentElement).outlineWidth }))
      expect.equal(f.lift, 1, 'keyboard focus: same lift')
      expect.equal(f.fill, 0, 'keyboard focus: no fill')
      expect.equal(f.ring, '3px', 'and the label wears the ring')
    },
  },
  {
    name: 'swatches: choosing a tone recolours the stage; None clears it; circles are round',
    async run({ page, goto, expect }) {
      await goto('components/filmstrip.html')
      expect.equal((await stage(page, BACKDROP)).tone, '1', 'starts on the first backdrop')
      expect.equal((await stage(page, BACKDROP)).title, 'Shop listing', 'named for what it is to the person, not "Backdrop 1"')
      await page.locator(`${BACKDROP} input[value="1"]`).focus()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')
      expect.equal((await stage(page, BACKDROP)).tone, '3', 'tone 3')
      await expect.eventually(() => said(page), (v) => /Showing Gift card, 4 of 7/.test(v), 'announced')
      await page.keyboard.press('Home')
      expect.equal((await stage(page, BACKDROP)).tone, null, 'None removes the tone')
      const radius = await page.locator(`${BACKDROP} .filmstrip__thumb`).first().evaluate((el) => getComputedStyle(el).borderTopLeftRadius)
      expect.ok(parseFloat(radius) > 100, `data-shape=circle is round (radius ${radius})`)
    },
  },
  {
    name: 'a disabled thumbnail is skipped by the arrows and cannot be chosen',
    async run({ page, goto, expect }) {
      await goto('components/filmstrip.html')
      const r = await page.evaluate(() => {
        const d = document.querySelector('#states ~ .demo input:disabled')
        return { disabled: d.disabled, dashed: getComputedStyle(d.parentElement).borderStyle }
      })
      expect.ok(r.disabled && r.dashed === 'dashed', 'dashed and disabled')
      await page.evaluate(() => { const radios = document.querySelectorAll('#photos + p + .demo .filmstrip input[type=radio]'); radios[1].disabled = true })
      await page.locator(`${PHOTOS} input:checked`).focus()
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, `${PHOTOS} input[value="tram"]`, 'skipped the disabled market')
    },
  },
  {
    name: 'reduced motion removes the lift travel but keeps the raised state (the hard shadow)',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/filmstrip.html')
      const t = page.locator(`${PHOTOS} .filmstrip__thumb`).nth(1)
      await t.scrollIntoViewIfNeeded()
      await t.hover()
      await page.waitForTimeout(600)
      const r = await t.evaluate((el) => ({ t: getComputedStyle(el).transform, lift: getComputedStyle(el).getPropertyValue('--lift'), shadow: getComputedStyle(el).boxShadow }))
      expect.ok(r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)', `no movement (got ${r.t})`)
      expect.equal(Number(r.lift), 1, 'still raised')
      expect.ok(/4px 4px 0px 0px/.test(r.shadow), `the hard shadow still shows (${r.shadow})`)
    },
  },
  {
    name: 'the track scrolls sideways at 320px without the page doing so',
    viewport: { width: 320, height: 700 },
    async run({ page, goto, expect }) {
      await goto('components/filmstrip.html')
      const r = await page.evaluate((s) => {
        const t = document.querySelector(s + ' .filmstrip__track')
        return { page: document.documentElement.scrollWidth - document.documentElement.clientWidth, scrolls: t.scrollWidth > t.clientWidth }
      }, PHOTOS)
      expect.ok(r.page <= 1, 'page fits')
      expect.ok(r.scrolls, 'and the track is what scrolls')
      // arrow keys bring the chosen thumbnail into view
      await page.locator(`${PHOTOS} input:checked`).focus()
      await page.keyboard.press('End')
      await page.waitForTimeout(400)
      const vis = await page.evaluate((s) => { const t = document.querySelector(s + ' .filmstrip__track'); const r = document.querySelector(s + ' input:checked').getBoundingClientRect(); const tr = t.getBoundingClientRect(); return r.left >= tr.left - 1 && r.right <= tr.right + 1 }, PHOTOS)
      expect.ok(vis, 'the chosen thumbnail is scrolled into view')
    },
  },
  {
    name: 'on load every strip shows its chosen thumbnail whole: the track scrolls (to a snap point) when it starts past the edge',
    async run({ page, goto, expect }) {
      await goto('components/filmstrip.html')
      await page.waitForTimeout(300)
      const r = await page.evaluate(() => [...document.querySelectorAll('.filmstrip__track')].map((t) => {
        const on = t.querySelector('input:checked')
        if (!on) return null
        const a = on.parentElement.getBoundingClientRect(), b = t.getBoundingClientRect()
        return { inView: a.left >= b.left - 0.5 && a.right <= b.right + 0.5, scrolled: t.scrollLeft, name: t.closest('fieldset').querySelector('legend').textContent }
      }).filter(Boolean))
      expect.ok(r.length >= 5, 'the demo strips')
      for (const x of r) expect.ok(x.inView, `${x.name}: the chosen thumbnail is fully in view (scrollLeft ${x.scrolled})`)
      expect.ok(r.some((x) => x.scrolled > 0), 'at least one strip had to scroll to show it (the in-context tool, where the fifth swatch is chosen)')
    },
  },
]
