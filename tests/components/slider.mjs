// Interaction spec for Slider: native keys, aria-valuetext per format, readout, fill, nudge buttons (2.5.7),
// pointer on the track, tick marks, pop focus ring.
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
const W = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(page, goto) {
  await goto('components/slider.html')
  await settle(page)
}
const vt = (page, sel) => page.locator(sel).getAttribute('aria-valuetext')
const val = (page, sel) => page.locator(sel).inputValue()
const out = (page, sel) => page.locator(sel).evaluate((i) => i.closest('[data-sg-slider]').querySelector('output').textContent.trim())
const fill = (page, sel) => page.locator(sel).evaluate((i) => i.closest('[data-sg-slider]').style.getPropertyValue('--p'))

export const tests = [
  {
    name: 'native keys: arrows, PageUp / PageDown, Home / End change the value, the readout and aria-valuetext',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const s = '#sld-vol'
      await page.locator(s).focus()
      expect.equal(await vt(page, s), '40%', 'valuetext on load')
      expect.equal(await out(page, s), '40%', 'readout on load')
      await page.keyboard.press('ArrowRight')
      expect.equal(await val(page, s), '45', 'ArrowRight +1 step')
      expect.equal(await vt(page, s), '45%', 'valuetext follows')
      expect.equal(await out(page, s), '45%', 'readout follows')
      await page.keyboard.press('ArrowUp')
      expect.equal(await val(page, s), '50', 'ArrowUp +1 step')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowDown')
      expect.equal(await val(page, s), '40', 'ArrowLeft / ArrowDown -1 step')
      await page.keyboard.press('PageUp')
      expect.equal(await val(page, s), '50', 'PageUp: a larger step (10% of the range)')
      await page.keyboard.press('PageDown')
      expect.equal(await val(page, s), '40', 'PageDown')
      await page.keyboard.press('End')
      expect.equal(await val(page, s), '100', 'End = max')
      expect.equal(await vt(page, s), '100%', 'valuetext at max')
      await page.keyboard.press('Home')
      expect.equal(await val(page, s), '0', 'Home = min')
      expect.equal(await vt(page, s), '0%', 'valuetext at min')
      expect.equal(await out(page, s), '0%', 'readout at min')
    },
  },
  {
    name: 'the track fill follows the value (--p is 0 at min, 1 at max)',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const s = '#sld-vol'
      expect.equal(await fill(page, s), '0.4', 'initial fill')
      await page.locator(s).focus()
      await page.keyboard.press('End')
      expect.equal(await fill(page, s), '1', 'full at max')
      await page.keyboard.press('Home')
      expect.equal(await fill(page, s), '0', 'empty at min')
    },
  },
  {
    name: 'formats use Intl: percent, currency, minutes (short on screen, long when spoken), signed units with a true minus',
    async run({ page, goto, expect }) {
      await open(page, goto)
      // currency
      expect.equal(await vt(page, '#sld-bud'), '$600', 'currency valuetext')
      expect.equal(await out(page, '#sld-bud'), '$600', 'currency readout')
      await page.locator('#sld-bud').focus()
      await page.keyboard.press('End')
      expect.equal(await vt(page, '#sld-bud'), '$1,000', 'grouping separator')
      // minutes
      expect.equal(await out(page, '#sld-min'), '25 min', 'short unit on screen')
      expect.equal(await vt(page, '#sld-min'), '25 minutes', 'long unit for speech')
      // negative values
      await page.locator('#sld-temp').focus()
      await page.keyboard.press('Home')
      const shown = await out(page, '#sld-temp')
      expect.ok(shown.startsWith('−'), 'true minus sign (U+2212) on screen: ' + shown)
      expect.ok(/celsius/i.test(await vt(page, '#sld-temp')), 'spoken with the unit: ' + (await vt(page, '#sld-temp')))
    },
  },
  {
    name: 'Tab order is minus, slider, plus; the nudge buttons step the value and announce it politely',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('#sld-vol').focus()
      await page.keyboard.press('Shift+Tab')
      await expect.focused(page, '[data-sg-nudge="-1"][aria-controls=sld-vol]', 'Shift+Tab reaches minus')
      await page.keyboard.press('Tab')
      await expect.focused(page, '#sld-vol', 'then the slider')
      await page.keyboard.press('Tab')
      await expect.focused(page, '[data-sg-nudge="1"][aria-controls=sld-vol]', 'then plus')
      await page.keyboard.press('Enter')
      expect.equal(await val(page, '#sld-vol'), '45', 'Enter on plus steps up')
      expect.equal(await out(page, '#sld-vol'), '45%', 'readout')
      await page.keyboard.press('Space')
      expect.equal(await val(page, '#sld-vol'), '50', 'Space on plus steps up')
      await expect.focused(page, '[data-sg-nudge="1"][aria-controls=sld-vol]', 'focus stays on the button')
      await W(150)
      const said = await page.evaluate(() => document.querySelector('body > [role=status].sr-only')?.textContent)
      expect.equal(said, 'Volume: 50%', 'announced via the polite live region')
    },
  },
  {
    name: 'nudge buttons become aria-disabled at the ends (not removed) and stay focusable',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('#sld-vol').focus()
      await page.keyboard.press('End')
      const plus = '[data-sg-nudge="1"][aria-controls=sld-vol]'
      expect.equal(await page.locator(plus).getAttribute('aria-disabled'), 'true', 'plus is aria-disabled at max')
      expect.equal(await page.locator(plus).getAttribute('disabled'), null, 'but not disabled')
      await page.keyboard.press('Tab')
      await expect.focused(page, plus, 'still focusable')
      await page.keyboard.press('Enter')
      expect.equal(await val(page, '#sld-vol'), '100', 'inert at the limit')
      await expect.focused(page, plus, 'focus is not lost')
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Home')
      expect.equal(await page.locator('[data-sg-nudge="-1"][aria-controls=sld-vol]').getAttribute('aria-disabled'), 'true', 'minus aria-disabled at min')
      expect.equal(await page.locator(plus).getAttribute('aria-disabled'), null, 'plus is live again')
    },
  },
  {
    name: 'a pointer can set the value without dragging (click on the track) and buttons are a second route (WCAG 2.5.7)',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const s = '#sld-vol'
      await page.locator(s).scrollIntoViewIfNeeded()
      const b = await page.locator(s).boundingBox()
      await page.mouse.click(b.x + b.width * 0.8, b.y + b.height / 2)
      const v = Number(await val(page, s))
      expect.ok(v >= 70 && v <= 90, 'clicking the track at ~80% sets ~80: ' + v)
      expect.equal(await page.locator('[data-sg-slider] [data-sg-nudge]').count() >= 2, true, 'nudge buttons exist for pointer users who cannot drag')
    },
  },
  {
    name: 'target sizes: the range is 44 tall; the thumb is 28px; nudge buttons are 36px circles with 44px hit areas 8px clear of the range',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const r = await page.locator('#sld-vol').boundingBox()
      expect.ok(r.height >= 43.9, 'range input at least 44 tall: ' + r.height)
      const thumb = await page.locator('#sld-vol').evaluate((e) => { const s = e.closest('.slider'); const probe = document.createElement('i'); probe.style.width = getComputedStyle(s).getPropertyValue('--_thumb'); s.append(probe); const w = probe.getBoundingClientRect().width; probe.remove(); return w })
      expect.ok(thumb >= 24, 'thumb is at least 24px: ' + thumb)
      const sel = '[data-sg-nudge="-1"][aria-controls=sld-vol]'
      await page.locator(sel).scrollIntoViewIfNeeded()
      const minus = await page.locator(sel).boundingBox()
      expect.ok(minus.height < 44 && minus.height >= 35.9, 'drawn 36px: ' + minus.height)
      expect.ok(await page.locator(sel).evaluate((e) => e.classList.contains('btn') && e.dataset.shape === 'circle'), 'an ordinary circle button')
      const hit = await page.evaluate((s) => { const b = document.querySelector(s); const r = b.getBoundingClientRect(); const cx = r.x + r.width / 2, cy = r.y + r.height / 2; const t = document.elementFromPoint(cx, cy - 21.5); return t === b || b.contains(t) }, sel)
      expect.ok(hit, 'hit area extends to 44px')
      const r2 = await page.locator('#sld-vol').evaluate((e) => e.closest('.slider__track').getBoundingClientRect().x)
      expect.ok(r2 - (minus.x + minus.width) >= 11.9, 'gap between minus and the slider track is 12px: ' + (r2 - (minus.x + minus.width)))
    },
  },
  {
    name: 'min / max captions and tick marks are decoration (aria-hidden)',
    async run({ page, goto, expect }) {
      await open(page, goto)
      expect.equal(await page.locator('#sld-vol').evaluate((e) => e.closest('.slider__track').querySelector('.slider__scale').getAttribute('aria-hidden')), 'true', 'scale is aria-hidden')
      const t = await page.locator('#sld-bud').evaluate((e) => { const m = e.closest('.slider__track').querySelector('.slider__ticks'); return { hidden: m.getAttribute('aria-hidden'), n: m.children.length } })
      expect.equal(t.hidden, 'true', 'ticks are aria-hidden')
      expect.equal(t.n, 5, 'data-ticks="5" makes five marks')
      const bw = await page.locator('#sld-bud').evaluate((e) => getComputedStyle(e.closest('.slider__track').querySelector('.slider__ticks > i')).width)
      expect.equal(bw, '2px', 'a tick is one --bw wide')
    },
  },
  {
    name: 'the readout is not a live region (the slider already speaks its value)',
    async run({ page, goto, expect }) {
      await open(page, goto)
      expect.equal(await page.locator('#sld-vol').evaluate((e) => e.closest('.slider').querySelector('output').getAttribute('aria-live')), 'off', 'aria-live=off on <output>')
    },
  },
  {
    name: 'the thumb behaves like a button: an outline at rest, FILLED and raised on hover and keyboard focus, sunk while dragging',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const s = '#sld-vol'
      await page.locator(s).scrollIntoViewIfNeeded()
      const n = () => page.locator(s).evaluate((e) => ({ lift: Number(getComputedStyle(e).getPropertyValue('--lift')), fill: Number(getComputedStyle(e).getPropertyValue('--fill')) }))
      await W(100)
      const rest = await n()
      expect.equal(rest.lift, 0, 'rest: flat')
      expect.equal(rest.fill, 0, 'rest: an outline')
      const b = await page.locator(s).boundingBox()
      await page.mouse.move(0, 0)
      await W(300)
      const restShot = await page.locator(s).screenshot() // the thumb pseudo cannot be read with getComputedStyle, so compare pixels
      await page.mouse.move(b.x + b.width * 0.4, b.y + b.height / 2)
      await W(400)
      const hov = await n()
      expect.equal(hov.lift, 1, 'hover: raised')
      expect.equal(hov.fill, 1, 'hover: filled')
      const hovShot = await page.locator(s).screenshot()
      expect.ok(!restShot.equals(hovShot), 'the thumb looks different when raised and filled')
      await page.mouse.down()
      await W(400)
      const down = await n()
      expect.equal(down.lift, 0, 'dragging: back onto the surface')
      expect.equal(down.fill, 1, 'dragging: fill stays')
      await page.mouse.up()
      await page.mouse.move(0, 0)
      await W(400)
      await page.keyboard.press('Tab')
      await page.locator(s).focus()
      await W(400)
      const foc = await n()
      expect.equal(foc.lift, 1, 'keyboard focus: same lift as hover')
    },
  },
  {
    name: 'the rail is a 2px-framed rectangle behind a transparent native track; the fill is the accent up to the thumb',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const r = await page.locator('#sld-vol').evaluate((e) => {
        const t = e.closest('.slider__track'); const rail = getComputedStyle(t, '::before'); const fill = getComputedStyle(t, '::after')
        const tr = t.getBoundingClientRect()
        return { bw: rail.borderTopWidth, rad: rail.borderTopLeftRadius, fillW: parseFloat(fill.width), trackW: tr.width, p: parseFloat(e.closest('.slider').style.getPropertyValue('--p')), native: getComputedStyle(e, '::-webkit-slider-runnable-track').backgroundColor }
      })
      expect.equal(r.bw, '2px', 'rail frame is --bw')
      expect.equal(r.rad, '0px', 'a rectangle (square corners)')
      expect.equal(r.native, 'rgba(0, 0, 0, 0)', 'the native track is transparent')
      const expected = (r.trackW - 28) * r.p + 14 - 2
      expect.ok(Math.abs(r.fillW - expected) < 1, `fill ends under the thumb centre (${r.fillW} vs ${expected})`)
    },
  },
  {
    name: 'disabled slider is skipped by Tab and faint',
    async run({ page, goto, expect }) {
      await open(page, goto)
      expect.ok(await page.locator('#sld-dis').isDisabled(), 'disabled')
      await page.locator('#sld-min').focus()
      await page.keyboard.press('Tab')
      expect.ok(await page.evaluate(() => document.activeElement.id !== 'sld-dis'), 'Tab skips it')
    },
  },
  {
    name: 'focus ring is drawn round the thumb (pixels change on focus), in square and soft corners',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('#sld-vol').scrollIntoViewIfNeeded()
      // The ring lives on ::-webkit-slider-thumb, which getComputedStyle cannot read, so compare pixels.
      const diff = (a, b) => page.evaluate(async ([x, y]) => {
        const dec = async (b64) => { const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob()); const c = new OffscreenCanvas(bm.width, bm.height); const g = c.getContext('2d'); g.drawImage(bm, 0, 0); return g.getImageData(0, 0, bm.width, bm.height).data }
        const A = await dec(x), B = await dec(y)
        let n = 0
        for (let i = 0; i < A.length; i += 4) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 60) n++
        return n
      }, [a.toString('base64'), b.toString('base64')])
      for (const surface of ['square', 'soft']) {
        await page.evaluate((s) => { document.documentElement.setAttribute('data-corners', s); document.activeElement && document.activeElement.blur && document.activeElement.blur() }, surface)
        await W(200)
        const blurred = await page.locator('#sld-vol').screenshot()
        await page.keyboard.press('Tab')
        await page.locator('#sld-vol').focus()
        await W(200)
        const focused = await page.locator('#sld-vol').screenshot()
        const n = await diff(blurred, focused)
        expect.ok(n > 150, `${surface}: focused thumb shows a ring (${n} pixels changed)`)
        const again = await diff(blurred, blurred)
        expect.equal(again, 0, 'control: identical images differ by nothing')
      }
      // and the input itself keeps a transparent outline so forced-colours mode can show the system ring
      const o = await page.locator('#sld-vol').evaluate((e) => { const s = getComputedStyle(e); return { st: s.outlineStyle, w: parseFloat(s.outlineWidth) } })
      expect.ok(o.st !== 'none' && o.w > 0, 'outline exists (transparent) for forced colours')
    },
  },
  {
    name: 'nudge buttons are circles (36 x 36), not 44 x 36 ovals, and their hit area still reaches 44',
    async run({ page, goto, expect }) {
      await open(page, goto)
      for (const sel of ['[data-sg-nudge="-1"][aria-controls=sld-vol]', '[data-sg-nudge="1"][aria-controls=sld-vol]']) {
        await page.locator(sel).scrollIntoViewIfNeeded()
        const b = await page.locator(sel).boundingBox()
        expect.ok(Math.abs(b.width - b.height) < 0.5, 'width equals height: ' + b.width + ' x ' + b.height)
        const hit = await page.evaluate((s) => { const el = document.querySelector(s); const r = el.getBoundingClientRect(); const cx = r.x + r.width / 2, cy = r.y + r.height / 2; const h = (x, y) => { const t = document.elementFromPoint(x, y); return t === el || el.contains(t) }; return h(cx - 21.5, cy) && h(cx + 21.5, cy) && h(cx, cy - 21.5) && h(cx, cy + 21.5) }, sel)
        expect.ok(hit, 'hit area reaches 44 px each way')
      }
    },
  },
  {
    name: 'no script: the nudge buttons, the readout and the filled rail are not drawn (they would be dead or stale); the native slider stays',
    async run({ browser, url, expect }) {
      const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
      const p = await ctx.newPage()
      await p.goto(`${url}/docs/components/slider.html`, { waitUntil: 'load' })
      expect.ok(await p.locator('#sld-vol').isVisible(), 'the range input is there')
      expect.ok(await p.locator('label[for=sld-vol]').isVisible(), 'and its label')
      expect.equal(await p.locator('[data-sg-nudge]').first().isVisible(), false, 'nudge buttons hidden')
      expect.equal(await p.locator('output.slider__value').first().isVisible(), false, 'readout hidden')
      await ctx.close()
    },
  },
  {
    name: 'reduced motion: the range thumb does not travel when raised (its top edge stays put); at full motion it rises',
    async run({ browser, url, expect }) {
      // The thumb is a pseudo-element getComputedStyle cannot read, so measure its drawn top edge (the highest dark pixel row).
      const edge = async (reduced) => {
        const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: reduced ? 'reduce' : 'no-preference' })
        const p = await ctx.newPage()
        await p.goto(`${url}/docs/components/slider.html`, { waitUntil: 'networkidle' })
        await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}.docs-bar,.skip-link{display:none!important}' })
        await p.locator('#sld-vol').scrollIntoViewIfNeeded()
        const b = await p.locator('#sld-vol').boundingBox()
        const cx = b.x + 14 + (b.width - 28) * 0.4, cy = b.y + b.height / 2
        const clip = { x: cx - 30, y: cy - 30, width: 60, height: 60 }
        const measure = async () => {
          const png = (await p.screenshot({ clip })).toString('base64')
          return p.evaluate(async (b64) => {
            const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
            const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
            const g = c.getContext('2d'); g.drawImage(img, 0, 0)
            const d = g.getImageData(0, 0, c.width, c.height).data
            let minx = 1e9, miny = 1e9
            for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
              const i = (y * c.width + x) * 4
              if (d[i] + d[i + 1] + d[i + 2] < 3 * 90 && y > 14 && y < c.height - 14) { minx = Math.min(minx, x); miny = Math.min(miny, y) }
            }
            return { minx, miny }
          }, png)
        }
        await p.mouse.move(5, 5)
        await p.waitForTimeout(350)
        const rest = await measure()
        await p.mouse.move(cx, cy)
        await p.waitForTimeout(600)
        const hover = await measure()
        await ctx.close()
        return { rest, hover }
      }
      const full = await edge(false)
      const red = await edge(true)
      expect.ok(full.hover.miny <= full.rest.miny - 1, 'full motion: the thumb rises (' + JSON.stringify(full) + ')')
      expect.equal(red.hover.miny, red.rest.miny, 'reduced: top edge unchanged ' + JSON.stringify(red))
    },
  },
]
