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
    name: 'text that fits does not scroll; the toggle is present, dimmed and says why',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const fit = await page.locator('.marquee[data-tone="info"]').evaluate((el) => {
        const t = el.querySelector('.marquee__toggle')
        return { fit: el.hasAttribute('data-fit'), loop: el.hasAttribute('data-loop'), disabled: t.getAttribute('aria-disabled'), desc: document.getElementById(t.getAttribute('aria-describedby'))?.textContent, anim: getComputedStyle(el.querySelector('.marquee__track')).animationName }
      })
      expect.ok(fit.fit && !fit.loop, 'fits, no loop')
      expect.equal(fit.disabled, 'true')
      expect.ok(/fits/.test(fit.desc), 'reason: ' + fit.desc)
      expect.equal(fit.anim, 'none')
    },
  },
  {
    name: 'reduced motion: never scrolls, toggle shows paused and is disabled with the reason',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const r = await page.locator(FIRST).evaluate((el) => {
        const t = el.querySelector('.marquee__toggle')
        return { loop: el.hasAttribute('data-loop'), clone: el.querySelector('[data-clone]') !== null, pressed: t.getAttribute('aria-pressed'), disabled: t.getAttribute('aria-disabled'), desc: document.getElementById(t.getAttribute('aria-describedby'))?.textContent, anim: getComputedStyle(el.querySelector('.marquee__track')).animationName, visible: t.getBoundingClientRect().width > 0 }
      })
      expect.equal(r.loop, false)
      expect.equal(r.clone, false, 'no loop copy')
      expect.equal(r.pressed, 'true')
      expect.equal(r.disabled, 'true')
      expect.ok(/Motion is turned off/.test(r.desc), r.desc)
      expect.equal(r.anim, 'none')
      expect.ok(r.visible, 'the control is still visible')
      await page.locator(`${FIRST} .marquee__toggle`).click({ force: true })
      await expect.attr(page, `${FIRST} .marquee__toggle`, 'aria-pressed', 'true', 'a disabled toggle stays inert (SG.guard)')
    },
  },
  {
    name: 'switching the Motion preference at runtime stops and restarts the loop',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      expect.ok(await page.locator(FIRST).evaluate((el) => el.hasAttribute('data-loop')), 'looping to start with')
      await page.evaluate(() => SG.prefs.set('motion', 'reduced'))
      await until(page, (sel) => !document.querySelector(sel).hasAttribute('data-loop'), FIRST, 'loop removed')
      expect.equal((await probe(page)).name, 'none')
      await page.evaluate(() => SG.prefs.set('motion', 'full'))
      await until(page, (sel) => document.querySelector(sel).hasAttribute('data-loop'), FIRST, 'loop restored')
      expect.equal((await probe(page)).name, 'sg-ticker')
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
