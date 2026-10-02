// Spec for Marquee (SG.marquee, src/js/64-marquee.js): WCAG 2.2.2 pause control, single reading for
// assistive tech, transform-only movement, reduced motion.
const PAGE = 'components/marquee.html'
const FIRST = '#default + p + .demo .marquee'

const track = (page, sel = FIRST) => page.locator(`${sel} .marquee__track`)
const probe = (page, sel = FIRST) => track(page, sel).evaluate((el) => { const cs = getComputedStyle(el); return { name: cs.animationName, state: cs.animationPlayState, transform: cs.transform } })
async function until(page, fn, arg, what = 'condition', tries = 60) {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(fn, arg)) return
    await page.waitForTimeout(50)
  }
  throw new Error('timed out waiting for ' + what)
}

export const tests = [
  {
    name: 'the script builds the loop: the copy is aria-hidden and inert, the original is read once',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const m = await page.locator(FIRST).evaluate((el) => {
        const lists = [...el.querySelectorAll('.marquee__list')]
        const orig = lists.find((l) => !l.hasAttribute('data-clone'))
        const clone = lists.find((l) => l.hasAttribute('data-clone'))
        return { loop: el.hasAttribute('data-loop'), ready: el.hasAttribute('data-ready'), n: lists.length, origHidden: orig.closest('[aria-hidden="true"]') !== null, cloneHidden: clone.getAttribute('aria-hidden'), cloneInert: clone.hasAttribute('inert'), same: orig.textContent === clone.textContent, duration: getComputedStyle(el).getPropertyValue('--marquee-duration').trim() }
      })
      expect.ok(m.loop && m.ready, 'enhanced: ' + JSON.stringify(m))
      expect.equal(m.n, 2)
      expect.equal(m.origHidden, false, 'the original list is exposed')
      expect.equal(m.cloneHidden, 'true')
      expect.ok(m.cloneInert, 'copy is inert')
      expect.ok(m.same, 'the copy is identical')
      expect.ok(/^\d+(\.\d+)?s$/.test(m.duration), 'duration from content width: ' + m.duration)
    },
  },
  {
    name: 'the toggle is the Button element, comes before the moving text in the DOM, has a stable name and a 44 px hit area',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const t = await page.locator(FIRST).evaluate((el) => {
        const toggle = el.querySelector('.marquee__toggle'), view = el.querySelector('.marquee__viewport')
        toggle.scrollIntoView({ block: 'center' })
        const r = toggle.getBoundingClientRect()
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2
        const at = (x, y) => { const n = document.elementFromPoint(x, y); return !!n && (n === toggle || toggle.contains(n)) }
        return { before: !!(toggle.compareDocumentPosition(view) & Node.DOCUMENT_POSITION_FOLLOWING), label: toggle.getAttribute('aria-label'), pressed: toggle.getAttribute('aria-pressed'), h: r.height, tag: toggle.tagName, btn: toggle.classList.contains('btn'), shape: toggle.dataset.shape, hit: at(cx, cy - 21.5) && at(cx, cy + 21.5) && at(cx - 21.5, cy) && at(cx + 21.5, cy), visible: r.width > 0 }
      })
      expect.ok(t.before, 'toggle precedes the content')
      expect.equal(t.tag, 'BUTTON')
      expect.ok(t.btn && t.shape === 'circle', 'a small round Button')
      expect.equal(t.label, 'Pause ticker')
      expect.equal(t.pressed, 'false')
      expect.ok(t.visible && t.hit, 'visible, and the hit area reaches 44px each way')
      const box = await page.locator(`${FIRST} .marquee__toggle`).boundingBox()
      expect.ok(Math.abs(box.width - box.height) < 1, `drawn ${box.width}x${box.height}: a circle, not an oval`)
    },
  },
  {
    name: 'the toggle shows pause while it runs and play once paused (one icon at a time), and pressed looks different from rest',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const icons = () => page.locator(`${FIRST} .marquee__toggle`).evaluate((t) => ({ shown: [...t.querySelectorAll('.ic')].filter((i) => getComputedStyle(i).display !== 'none').map((i) => [...i.classList].find((c) => c.startsWith('ic--') && c !== 'ic')), fill: getComputedStyle(t).getPropertyValue('--fill').trim(), frame: getComputedStyle(t).boxShadow }))
      const run = await icons()
      expect.equal(run.shown.join(), 'ic--pause')
      await page.locator(`${FIRST} .marquee__toggle`).click()
      await page.mouse.move(2, 2)
      await page.waitForTimeout(350)
      const paused = await icons()
      expect.equal(paused.shown.join(), 'ic--play')
      expect.equal(paused.fill, '1', 'pressed = filled')
      expect.ok(paused.frame !== 'none' && paused.frame !== run.frame, 'and the frame doubles (a second cue)')
    },
  },
  {
    name: 'it moves with transform only: transform changes over time while layout does not',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const a = await probe(page)
      const w1 = await track(page).evaluate((el) => el.getBoundingClientRect().width)
      await page.waitForTimeout(400)
      const b = await probe(page)
      const w2 = await track(page).evaluate((el) => el.getBoundingClientRect().width)
      expect.equal(a.name, 'sg-ticker')
      expect.equal(a.state, 'running')
      expect.ok(a.transform !== b.transform, 'transform changed: ' + a.transform + ' -> ' + b.transform)
      expect.ok(Math.abs(w1 - w2) < 0.5, 'layout width is constant: ' + w1 + ' vs ' + w2)
    },
  },
  {
    name: 'Pause: aria-pressed flips, the animation stops, the loop copy hides and the text wraps; Play resumes',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const toggle = page.locator(`${FIRST} .marquee__toggle`)
      await toggle.click()
      await expect.attr(page, `${FIRST} .marquee__toggle`, 'aria-pressed', 'true')
      await page.mouse.move(2, 2) // not hovering: the pause must hold by itself
      await page.locator('#main h1').focus()
      const a = await probe(page)
      await page.waitForTimeout(350)
      const b = await probe(page)
      expect.ok(a.name === 'none' || a.state === 'paused', 'animation is off: ' + JSON.stringify(a))
      expect.equal(a.transform, b.transform, 'transform no longer changes')
      const wrap = await page.locator(FIRST).evaluate((el) => ({ clone: getComputedStyle(el.querySelector('[data-clone]')).display, wrap: getComputedStyle(el.querySelector('.marquee__list:not([data-clone])')).flexWrap, ws: getComputedStyle(el.querySelector('.marquee__list:not([data-clone])')).whiteSpace, mask: getComputedStyle(el.querySelector('.marquee__viewport')).maskImage }))
      expect.equal(wrap.clone, 'none', 'copy hidden')
      expect.equal(wrap.wrap, 'wrap', 'text wraps')
      expect.equal(wrap.ws, 'normal')
      expect.equal(wrap.mask, 'none', 'no edge fade on static text')
      await toggle.click()
      await expect.attr(page, `${FIRST} .marquee__toggle`, 'aria-pressed', 'false')
      await page.locator('#main h1').focus()
      expect.equal((await probe(page)).name, 'sg-ticker')
    },
  },
  {
    name: 'keyboard: Space and Enter on the toggle pause and resume; the name never changes',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.locator(`${FIRST} .marquee__toggle`).focus()
      await page.keyboard.press('Space')
      await expect.attr(page, `${FIRST} .marquee__toggle`, 'aria-pressed', 'true')
      await page.keyboard.press('Enter')
      await expect.attr(page, `${FIRST} .marquee__toggle`, 'aria-pressed', 'false')
      await expect.attr(page, `${FIRST} .marquee__toggle`, 'aria-label', 'Pause ticker')
    },
  },
  {
    name: 'Tab order: the toggle is reachable, the inert loop copy is skipped',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const focusable = await page.locator(FIRST).evaluate((el) => [...el.querySelectorAll('button,a[href],[tabindex]')].filter((n) => !n.closest('[inert]')).length)
      expect.equal(focusable, 1, 'only the toggle is tabbable')
    },
  },
  {
    name: 'hover and focus-within freeze the strip in place (a courtesy, not the pause mechanism)',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.locator(`${FIRST} .marquee__viewport`).hover()
      const a = await probe(page)
      await page.waitForTimeout(300)
      const b = await probe(page)
      expect.equal(a.state, 'paused', 'hover pauses')
      expect.equal(a.transform, b.transform, 'frozen in place')
      await page.mouse.move(2, 2)
      expect.equal((await probe(page)).state, 'running', 'resumes when the pointer leaves')
      await page.locator(`${FIRST} .marquee__toggle`).focus()
      expect.equal((await probe(page)).state, 'paused', 'focus-within pauses')
      expect.equal(await page.locator(`${FIRST} .marquee__toggle`).getAttribute('aria-pressed'), 'false', 'but the toggle is still not pressed: hover/focus pause is not the mechanism')
    },
  },
  {
    // A control that can do nothing is hidden, not shown disabled: the dashed pause button in a strip that does
    // not move read as broken.
    name: 'text that fits does not scroll, and the toggle is hidden (nothing to pause), not shown disabled',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const fit = await page.locator('.marquee[data-tone="info"]').evaluate((el) => {
        const t = el.querySelector('.marquee__toggle')
        return { fit: el.hasAttribute('data-fit'), loop: el.hasAttribute('data-loop'), hidden: t.hidden, shown: t.getBoundingClientRect().width > 0, disabled: t.getAttribute('aria-disabled'), anim: getComputedStyle(el.querySelector('.marquee__track')).animationName }
      })
      expect.ok(fit.fit && !fit.loop, 'fits, no loop')
      expect.ok(fit.hidden && !fit.shown, 'the toggle is hidden')
      expect.equal(fit.disabled, null, 'and never just dimmed')
      expect.equal(fit.anim, 'none')
    },
  },
  {
    name: 'reduced motion: never scrolls, the list is static and whole, and there is no toggle (nothing to pause)',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const r = await page.locator(FIRST).evaluate((el) => {
        const t = el.querySelector('.marquee__toggle')
        const list = el.querySelector('.marquee__list:not([data-clone])')
        return { loop: el.hasAttribute('data-loop'), clone: el.querySelector('[data-clone]') !== null, hidden: t.hidden, shown: t.getBoundingClientRect().width > 0, disabled: t.getAttribute('aria-disabled'), anim: getComputedStyle(el.querySelector('.marquee__track')).animationName, wrap: getComputedStyle(list).flexWrap }
      })
      expect.equal(r.loop, false)
      expect.equal(r.clone, false, 'no loop copy')
      expect.equal(r.anim, 'none')
      expect.equal(r.wrap, 'wrap', 'the static list wraps, every item readable')
      expect.ok(r.hidden && !r.shown, 'the toggle is hidden')
      expect.equal(r.disabled, null, 'not a dimmed control')
    },
  },
  {
    name: 'switching the Motion preference at runtime stops and restarts the loop, and hides and brings back the toggle',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      expect.ok(await page.locator(FIRST).evaluate((el) => el.hasAttribute('data-loop')), 'looping to start with')
      await page.evaluate(() => SG.prefs.set('motion', 'reduced'))
      await until(page, (sel) => !document.querySelector(sel).hasAttribute('data-loop'), FIRST, 'loop removed')
      expect.equal((await probe(page)).name, 'none')
      expect.ok(await page.locator(`${FIRST} .marquee__toggle`).evaluate((t) => t.hidden), 'toggle hidden while nothing moves')
      await page.evaluate(() => SG.prefs.set('motion', 'full'))
      await until(page, (sel) => document.querySelector(sel).hasAttribute('data-loop'), FIRST, 'loop restored')
      expect.equal((await probe(page)).name, 'sg-ticker')
      expect.ok(await page.locator(`${FIRST} .marquee__toggle`).evaluate((t) => !t.hidden && t.getBoundingClientRect().width > 0), 'toggle back')
    },
  },
  {
    name: 'pressing Pause survives a resize; the user\'s choice is remembered across motion changes',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.locator(`${FIRST} .marquee__toggle`).click()
      await page.setViewportSize({ width: 360, height: 800 })
      await page.waitForTimeout(250)
      await expect.attr(page, `${FIRST} .marquee__toggle`, 'aria-pressed', 'true')
      await page.evaluate(() => { SG.prefs.set('motion', 'reduced'); SG.prefs.set('motion', 'full') })
      await page.waitForTimeout(250)
      await expect.attr(page, `${FIRST} .marquee__toggle`, 'aria-pressed', 'true', 'still paused after motion went reduced and back')
    },
  },
  {
    name: 'a strip without a toggle never starts (WCAG 2.2.2) and warns',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const r = await page.evaluate(() => {
        const warns = []
        const orig = console.warn
        console.warn = (...a) => warns.push(a[0])
        const el = document.createElement('div')
        el.className = 'marquee'
        el.innerHTML = '<div class="marquee__viewport"><div class="marquee__track"><ul class="marquee__list" role="list"><li>' + 'A very long announcement '.repeat(30) + '</li></ul></div></div>'
        document.body.appendChild(el)
        SG.marquee.init(el)
        console.warn = orig
        const out = { loop: el.hasAttribute('data-loop'), anim: getComputedStyle(el.querySelector('.marquee__track')).animationName, warns: warns.length }
        el.remove()
        return out
      })
      expect.equal(r.loop, false)
      expect.equal(r.anim, 'none')
      expect.equal(r.warns, 1, 'developer is told why')
    },
  },
  {
    name: 'data-speed sets the pace: twice the speed, half the duration',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const d = await page.locator(FIRST).evaluate((el) => {
        const read = () => parseFloat(getComputedStyle(el).getPropertyValue('--marquee-duration'))
        el.setAttribute('data-speed', '40'); SG.marquee.refresh(el); const slow = read()
        el.setAttribute('data-speed', '80'); SG.marquee.refresh(el); const fast = read()
        return { slow, fast }
      })
      expect.ok(Math.abs(d.slow / d.fast - 2) < 0.15 || d.fast === 8, `slow ${d.slow}s vs fast ${d.fast}s`)
    },
  },
  {
    name: '200% text on a phone: too little room to scroll, so it stays a static wrapped list with nothing clipped, and the toggle is hidden',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.addStyleTag({ content: 'html{font-size:200%}' })
      await page.evaluate(() => { for (const el of document.querySelectorAll('.marquee')) SG.marquee.refresh(el) })
      await page.waitForTimeout(250)
      const r = await page.evaluate(() => [...document.querySelectorAll('.marquee')].map((el) => {
        const vp = el.querySelector('.marquee__viewport')
        const lists = [...el.querySelectorAll('.marquee__list:not([data-clone])')]
        const t = el.querySelector('.marquee__toggle')
        const overflow = Math.max(...lists.flatMap((l) => [...l.children].map((li) => li.getBoundingClientRect().right - vp.getBoundingClientRect().right)))
        // Measured against the STRIP, not the viewport: the viewport is the thing that used to spill (a grid
        // of label + toggle wider than the strip pushed the toggle and the text out past the phone's frame).
        const strip = el.getBoundingClientRect()
        const parts = [...el.querySelectorAll('.marquee__label, .marquee__toggle, .marquee__viewport'), ...lists.flatMap((l) => [...l.children])].filter((n) => n.getClientRects().length) // a hidden toggle has no box
        const spill = Math.max(...parts.flatMap((n) => { const r = n.getBoundingClientRect(); return [r.right - strip.right, strip.left - r.left] }))
        return { loop: el.hasAttribute('data-loop'), overflow, spill, hidden: t.hidden, disabled: t.getAttribute('aria-disabled'), fit: el.hasAttribute('data-fit') }
      }))
      expect.ok(r.length >= 6, 'strips: ' + r.length)
      for (const x of r) {
        expect.equal(x.loop, false, 'nothing scrolls in a few letters of room')
        expect.ok(x.overflow <= 1, `text does not spill past the viewport (${x.overflow}px)`)
        expect.ok(x.spill <= 1, `label, toggle, viewport and text all stay inside the strip (${x.spill}px past it)`)
        expect.ok(x.hidden && x.disabled === null, 'nothing moves, so the toggle is hidden (not dimmed)')
      }
    },
  },
  {
    // Regression: the display size was taken from the viewport width alone, so PALETTE broke into PALETT / E at 320
    // and the line fell to a letter or two per line at 200% text. It is sized from the strip (cqi) now.
    name: 'data-size="lg": no word is broken mid-word at 320 px, or at 200% text on a 390 px phone',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const broken = () => page.evaluate(() => {
        const out = []
        for (const strip of document.querySelectorAll('.marquee[data-size="lg"]')) {
          for (const li of strip.querySelectorAll('.marquee__list:not([data-clone]) > li')) {
            const node = [...li.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim())
            const text = node.textContent
            const re = /\S+/g
            let m
            while ((m = re.exec(text))) {
              const r = document.createRange()
              r.setStart(node, m.index); r.setEnd(node, m.index + m[0].length)
              const tops = new Set([...r.getClientRects()].map((q) => Math.round(q.top)))
              if (tops.size > 1) out.push(`"${m[0]}" is split over ${tops.size} lines at ${Math.round(parseFloat(getComputedStyle(li).fontSize))}px`)
            }
            const v = strip.querySelector('.marquee__viewport').getBoundingClientRect()
            const lr = li.getBoundingClientRect()
            if (lr.right > v.right + 1) out.push(`"${text}" spills ${Math.round(lr.right - v.right)}px past the viewport`)
          }
        }
        return out
      })
      for (const [w, scale] of [[320, 100], [390, 200]]) {
        await page.setViewportSize({ width: w, height: 800 })
        await page.addStyleTag({ content: `html{font-size:${scale}%!important}` })
        await page.evaluate(() => { for (const el of document.querySelectorAll('.marquee')) SG.marquee.refresh(el) })
        await page.waitForTimeout(250)
        expect.equal((await broken()).join(' | '), '', `${w}px at ${scale}% text`)
      }
    },
  },
  {
    // Regression: the first item of a wrapped list had no marker, so one item sat flush left over a column indented
    // behind squares, and the square was centred on the whole item rather than its first line.
    name: 'a wrapped (paused) list gives every item the same marker, aligned to its first line',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const r = await page.locator(FIRST).evaluate((el) => {
        el.querySelector('.marquee__toggle').click()
        return new Promise((done) => setTimeout(() => {
          const items = [...el.querySelectorAll('.marquee__list:not([data-clone]) > li')]
          done({
            wrapped: !el.hasAttribute('data-loop') || el.querySelector('.marquee__toggle').getAttribute('aria-pressed') === 'true',
            markers: items.map((li) => getComputedStyle(li, '::before').display),
            align: items.map((li) => getComputedStyle(li).alignItems),
            xs: items.map((li) => Math.round(li.getBoundingClientRect().left)),
          })
        }, 150))
      })
      expect.ok(r.wrapped, 'paused = wrapped list')
      expect.ok(r.markers.every((d) => d !== 'none'), 'every item, the first too, has a marker: ' + r.markers.join(','))
      expect.ok(r.align.every((a) => a === 'baseline'), 'the marker follows the first line (baseline alignment), not the middle of the item')
    },
  },
  {
    name: 'the strip is a 2px-framed rectangle with no shadow; the ink band is ink with paper text and keeps 7:1 in every appearance',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const b = await page.locator(FIRST).evaluate((el) => { const cs = getComputedStyle(el); return { w: cs.borderTopWidth, st: cs.borderTopStyle, shadow: cs.boxShadow } })
      expect.equal(b.w, '2px')
      expect.equal(b.st, 'solid')
      expect.equal(b.shadow, 'none', 'not pressable: no shadow')
      const out = await page.evaluate(() => {
        const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
        const root = document.documentElement
        const strips = [...document.querySelectorAll('.marquee')]
        const fails = []
        for (const theme of ['light', 'dark']) for (const palette of ['default', 'periwinkle', 'mint', 'sand', 'cream', 'wire']) for (const contrast of [null, 'more']) {
          root.setAttribute('data-theme', theme)
          if (palette === 'default') root.removeAttribute('data-palette'); else root.setAttribute('data-palette', palette)
          if (contrast) root.setAttribute('data-contrast', contrast); else root.removeAttribute('data-contrast')
          for (const s of strips) {
            const bg = SG.colorToHex(getComputedStyle(s).backgroundColor)
            const fg = SG.colorToHex(getComputedStyle(s.querySelector('.marquee__list')).color)
            const k = ratio(fg, bg)
            if (k < 7) fails.push(`${theme}/${palette}/${contrast || 'normal'} ${s.dataset.tone || 'plain'} text: ${k.toFixed(2)}`)
            const lb = ratio(SG.colorToHex(getComputedStyle(s.querySelector('.marquee__label')).color), SG.colorToHex(getComputedStyle(s.querySelector('.marquee__label')).backgroundColor))
            if (lb < 7) fails.push(`${theme}/${palette}/${contrast || 'normal'} ${s.dataset.tone || 'plain'} label: ${lb.toFixed(2)}`)
          }
        }
        return fails
      })
      expect.equal(out.slice(0, 5).join(' | '), '', 'contrast below 7:1')
    },
  },
  {
    name: 'on the ink band the focus ring follows the surface (paper ring, ink halo); on the paper strip it is the page ring',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.keyboard.press('Tab')
      const ring = async (sel) => {
        await page.locator(`${sel} .marquee__toggle`).focus()
        await page.keyboard.press('Shift+Tab')
        await page.keyboard.press('Tab')
        return page.evaluate(() => { const e = document.activeElement; return { ring: SG.colorToHex(getComputedStyle(e).outlineColor), ink: SG.tokenToHex('--ink'), paper: SG.tokenToHex('--paper') } })
      }
      const ink = await ring('#ink + p + .demo .marquee')
      expect.equal(ink.ring, ink.paper, 'paper ring on the ink band')
      const plain = await ring(FIRST)
      expect.equal(plain.ring, plain.ink, 'ink ring on the paper strip')
    },
  },
]
