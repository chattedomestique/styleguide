// Interaction spec for Media: ratios, captions that never sit on a bare photo, loading / failed states, linked figure.
export const tests = [
  {
    name: 'each data-ratio gives its frame that shape',
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      const got = await page.evaluate(() => {
        const out = {}
        for (const fig of document.querySelectorAll('#ratios + p + .demo .media[data-ratio]')) {
          const r = fig.querySelector('.media__frame').getBoundingClientRect()
          out[fig.dataset.ratio] = r.width / r.height
        }
        return out
      })
      const want = { '1:1': 1, '4:3': 4 / 3, '3:2': 3 / 2, '16:9': 16 / 9, '21:9': 21 / 9, '3:4': 3 / 4, '4:5': 4 / 5 }
      for (const [k, v] of Object.entries(want)) {
        expect.ok(got[k] !== undefined, `demo has a ${k} figure`)
        expect.ok(Math.abs(got[k] - v) < 0.03, `${k}: frame is ${got[k].toFixed(3)}, wanted ${v.toFixed(3)}`)
      }
      expect.ok(got.free > 1.2 && got.free < 1.5, `free uses the file's own 4:3 shape (got ${got.free})`)
    },
  },
  {
    name: 'an over caption sits on a scrim plate along the bottom of the picture, never on the bare photo',
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      const r = await page.evaluate(() => {
        const fig = document.querySelector('.media[data-caption="over"]')
        const cap = fig.querySelector('.media__caption'), frame = fig.querySelector('.media__frame')
        const cs = getComputedStyle(cap), fr = frame.getBoundingClientRect(), cr = cap.getBoundingClientRect()
        const m = cs.backgroundColor.match(/[\d.]+/g).map(Number)
        const probe = (v) => { const i = document.createElement('i'); i.style.color = `var(${v})`; document.body.appendChild(i); const c = getComputedStyle(i).color; i.remove(); return c }
        return { alpha: m.length > 3 ? m[3] : 1, color: cs.color, onMedia: probe('--on-media'), inside: cr.top >= fr.top && cr.bottom <= fr.bottom + 0.5, flush: Math.abs(cr.bottom - fr.bottom) < 1.5, full: Math.abs(cr.width - fr.width) < 1.5 }
      })
      expect.ok(r.alpha >= 0.55, `plate is at least 0.55 opaque (got ${r.alpha})`)
      expect.ok(r.inside && r.flush && r.full, 'the plate is a band across the bottom edge of the frame')
      expect.equal(r.color, r.onMedia, 'text is --on-media')
    },
  },
  {
    name: 'the bar caption is ink with paper text; flipping to ink tone flips it',
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      const c = await page.evaluate(() => {
        const cap = document.querySelector('.media[data-caption="bar"] .media__caption')
        const cs = getComputedStyle(cap)
        const probe = (v) => { const i = document.createElement('i'); i.style.color = `var(${v})`; document.body.appendChild(i); const c = getComputedStyle(i).color; i.remove(); return c }
        return { bg: cs.backgroundColor, ink: probe('--ink'), fg: cs.color, paper: probe('--paper') }
      })
      expect.equal(c.bg, c.ink, 'bar is --ink')
      expect.equal(c.fg, c.paper, 'text is --paper')
    },
  },
  {
    name: 'a picture that cannot load becomes a failed figure with words and a Try again button, and announces it',
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      const fig = page.locator('#states ~ .demo[data-nocode] .media').first()
      await page.waitForFunction(() => document.querySelector('#states ~ .demo[data-nocode] .media')?.getAttribute('data-state') === 'failed')
      const s = fig.locator('.media__status')
      expect.ok(await s.isVisible(), 'status is visible')
      expect.ok((await s.locator('.ic').count()) === 1 && (await s.locator('.media__note').innerText()).length > 3, 'icon AND words')
      expect.equal(await s.locator('button').innerText(), 'Try again', 'has a way out')
      const dashed = await fig.evaluate((el) => getComputedStyle(el).borderStyle)
      expect.equal(dashed, 'dashed', 'dashed = not here')
      const said = await page.evaluate(() => [...document.querySelectorAll('[role="status"]')].map((n) => n.textContent).join('|'))
      expect.ok(/load/i.test(said), `announced politely (heard: ${said})`)
    },
  },
  {
    name: 'Try again by keyboard re-requests the picture and puts focus on the frame, not the page top',
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      await page.waitForFunction(() => document.querySelector('#states ~ .demo[data-nocode] .media')?.getAttribute('data-state') === 'failed')
      const btn = page.locator('#states ~ .demo[data-nocode] [data-media-retry]')
      await btn.focus()
      await page.keyboard.press('Enter')
      await expect.focused(page, '#states ~ .demo[data-nocode] .media__frame', 'focus moved to the frame')
      // a broken picture fails again; the loop ends in the failed state, not in a stuck spinner
      await page.waitForFunction(() => document.querySelector('#states ~ .demo[data-nocode] .media')?.getAttribute('data-state') === 'failed')
      expect.ok(await page.locator('#states ~ .demo[data-nocode] [data-media-retry]').isVisible(), 'the button is back')
    },
  },
  {
    name: 'loading is aria-busy with a spinner; under reduced motion the spinner pulses instead of spinning',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      const r = await page.evaluate(() => {
        const fig = document.querySelector('.media[data-state="loading"]')
        return { busy: fig.getAttribute('aria-busy'), anim: getComputedStyle(fig.querySelector('.media__status'), '::before').animationName }
      })
      expect.equal(r.busy, 'true', 'aria-busy')
      expect.equal(r.anim, 'sg-pulse', 'pulse under reduced motion')
    },
  },
  {
    name: 'loading spinner spins when motion is welcome',
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.media[data-state="loading"] .media__status'), '::before').animationName)
      expect.equal(anim, 'sg-spin', 'spin')
    },
  },
  {
    name: 'a linked figure: the whole figure is the hit area, hover and keyboard focus raise it the same way',
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      const fig = page.locator('#link ~ .demo .media[data-link]').first()
      await fig.scrollIntoViewIfNeeded()
      const nums = () => fig.evaluate((el) => ({ lift: Number(getComputedStyle(el).getPropertyValue('--lift')), fill: Number(getComputedStyle(el).getPropertyValue('--fill')) }))
      expect.equal((await nums()).lift, 0, 'rest: flat')
      // the picture's centre is the stretched anchor, not the image
      const hit = await fig.evaluate((el) => { const r = el.querySelector('.media__frame').getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return t && t.closest('a') ? t.closest('a').className : t && t.tagName })
      expect.ok(/media__link/.test(hit), `clicking the picture hits the link (hit: ${hit})`)
      await fig.hover()
      await page.waitForTimeout(400)
      expect.equal((await nums()).lift, 1, 'hover: raised')
      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab')
      await fig.locator('.media__link').focus()
      await page.waitForTimeout(400)
      const f = await nums()
      expect.equal(f.lift, 1, 'focus: same lift as hover')
      const ring = await fig.evaluate((el) => getComputedStyle(el).outlineWidth)
      expect.equal(ring, '3px', 'the figure wears the ring')
      const own = await fig.locator('.media__link').evaluate((el) => getComputedStyle(el).outlineStyle)
      expect.equal(own, 'none', 'the anchor itself does not double it')
    },
  },
  {
    name: 'reduced motion removes the lift travel but keeps the fill',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      const fig = page.locator('#link ~ .demo .media[data-link]').first()
      await fig.scrollIntoViewIfNeeded()
      await fig.hover()
      await page.waitForTimeout(600)
      const r = await fig.evaluate((el) => ({ t: getComputedStyle(el).transform, fill: getComputedStyle(el).getPropertyValue('--fill') }))
      expect.ok(r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)', `no movement (got ${r.t})`)
      expect.equal(Number(r.fill), 1, 'the fill still changes')
    },
  },
  {
    name: 'data-fit contain letterboxes; cover fills; --pos moves the crop',
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      const r = await page.evaluate(() => {
        const im = (sel) => getComputedStyle(document.querySelector(sel))
        return {
          contain: im('#crop ~ .demo .media[data-fit="contain"] img').objectFit,
          cover: im('#crop ~ .demo .media:not([data-fit]) img').objectFit,
          pos: getComputedStyle(document.querySelector('#crop ~ .demo img[style*="--pos: 10%"]')).objectPosition,
        }
      })
      expect.equal(r.contain, 'contain')
      expect.equal(r.cover, 'cover')
      expect.ok(/^10%/.test(r.pos), `object-position follows --pos (got ${r.pos})`)
    },
  },
  {
    name: 'media.js does not touch an authored state, and sets none on a picture that loaded',
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      const r = await page.evaluate(() => ({
        authored: document.querySelectorAll('#states ~ .demo .media[data-state]').length,
        loaded: [...document.querySelectorAll('#ratios + p + .demo .media')].filter((f) => f.hasAttribute('data-state')).length,
      }))
      expect.ok(r.authored >= 2, 'authored loading and failed figures keep their state')
      expect.equal(r.loaded, 0, 'loaded pictures carry no state')
    },
  },
]
