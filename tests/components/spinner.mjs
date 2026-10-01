// Spec for Spinner: a named status, a masked arc that turns (and pulses under reduced motion),
// a 300 ms delay, and an overlay whose label sits on a solid plate over inert content.
const PAGE = 'components/spinner.html'

async function until(page, fn, arg, what = 'condition', tries = 80) {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(fn, arg)) return
    await page.waitForTimeout(50)
  }
  throw new Error('timed out waiting for ' + what)
}

export const tests = [
  {
    name: 'every spinner is a status with a text name, and its ring is hidden from assistive tech',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const bad = await page.evaluate(() => {
        const out = []
        const all = [...document.querySelectorAll('.spinner')]
        for (const s of all) {
          if (s.getAttribute('role') !== 'status') out.push('no role=status: ' + s.outerHTML.slice(0, 60))
          const label = s.querySelector('.spinner__label, .sr-only')
          if (!label || !label.textContent.trim()) out.push('no text name: ' + s.outerHTML.slice(0, 60))
          const ring = s.querySelector('.spinner__ring')
          if (!ring || ring.getAttribute('aria-hidden') !== 'true') out.push('ring not aria-hidden')
        }
        return { out, n: all.length }
      })
      expect.ok(bad.n >= 8, 'found ' + bad.n + ' spinners')
      expect.equal(bad.out.join(' | '), '', 'problems')
    },
  },
  {
    name: 'the arc turns with --anim-spin and the track stays still',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const probe = () => page.evaluate(() => {
        const ring = document.querySelector('#inline ~ .demo .spinner__ring')
        const arc = getComputedStyle(ring, '::after')
        return { name: arc.animationName, transform: arc.transform, ringAnim: getComputedStyle(ring).animationName }
      })
      const a = await probe()
      await page.waitForTimeout(250)
      const b = await probe()
      expect.equal(a.name, 'sg-spin', 'arc uses the spin keyframes')
      expect.equal(a.ringAnim, 'none', 'the track does not animate')
      expect.ok(a.transform !== b.transform, `arc rotates: ${a.transform} -> ${b.transform}`)
    },
  },
  {
    name: 'reduced motion: the arc does not rotate, it pulses in opacity',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const samples = []
      for (let i = 0; i < 6; i++) {
        samples.push(await page.evaluate(() => {
          const arc = getComputedStyle(document.querySelector('#inline ~ .demo .spinner__ring'), '::after')
          return { name: arc.animationName, transform: arc.transform, opacity: Number(arc.opacity) }
        }))
        await page.waitForTimeout(260)
      }
      for (const s of samples) {
        expect.equal(s.name, 'sg-pulse', 'pulse keyframes')
        expect.ok(s.transform === 'none' || s.transform === 'matrix(1, 0, 0, 1, 0, 0)', 'no rotation, got ' + s.transform)
      }
      const ops = samples.map((s) => s.opacity)
      expect.ok(Math.max(...ops) - Math.min(...ops) > 0.15, 'opacity pulses: ' + ops.map((o) => o.toFixed(2)).join(', '))
    },
  },
  {
    name: 'data-delay: invisible at first, fully visible once 300 ms have passed',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.locator('#sp-go').click()
      const spinner = page.locator('#sp-slot .spinner')
      await spinner.waitFor({ state: 'attached' })
      const early = Number(await spinner.evaluate((el) => getComputedStyle(el).opacity))
      expect.ok(early < 0.2, `hidden during the delay (opacity ${early})`)
      expect.equal(await page.locator('#sp-go').getAttribute('aria-busy'), 'true', 'the trigger is busy')
      await page.waitForTimeout(900)
      const late = Number(await spinner.evaluate((el) => getComputedStyle(el).opacity))
      expect.ok(late > 0.95, `visible after the delay (opacity ${late})`)
      await until(page, () => !document.querySelector('#sp-slot .spinner'), null, 'the task to finish', 80)
      expect.equal(await page.locator('#sp-go').getAttribute('aria-busy'), null, 'busy cleared')
      await until(page, () => document.querySelector('div.sr-only[role="status"]')?.textContent === 'Saved', null, 'completion announced')
    },
  },
  {
    // Over a small region (a card) the plate covers the whole region: a plate across the middle of a few lines of
    // text left cut letters peeking out above and below it. Over a large region the scrim dims everything and a
    // framed plate sits in the middle.
    name: 'overlay: a small region is covered whole by a solid plate (ring and label centred together); a large one gets the scrim and a framed plate; content beneath is inert',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const read = () => page.evaluate(() => {
        const ov = document.querySelector('.spinner-overlay')
        const plate = ov.querySelector('.spinner')
        const cs = getComputedStyle(plate)
        const ocs = getComputedStyle(ov)
        const a = (c) => (c.startsWith('rgba') ? Number(c.split(',')[3]) : c.includes('/') ? Number(c.split('/')[1].replace(')', '')) : 1)
        const o = ov.getBoundingClientRect(), p = plate.getBoundingClientRect()
        const ring = plate.querySelector('.spinner__ring').getBoundingClientRect(), label = plate.querySelector('.spinner__label')
        const range = document.createRange(); range.selectNodeContents(label); const text = range.getBoundingClientRect()
        return {
          position: ocs.position,
          veilAlpha: a(ocs.backgroundColor),
          plateAlpha: a(cs.backgroundColor),
          plateBorder: cs.borderTopWidth,
          covers: Math.abs(p.width - o.width) <= 1 && Math.abs(p.height - o.height) <= 1,
          groupMid: (ring.left + text.right) / 2, mid: (o.left + o.right) / 2,
          inert: !!ov.parentElement.querySelector('[inert]'),
          busy: ov.parentElement.getAttribute('aria-busy'),
          w: o.width,
          parentW: ov.parentElement.getBoundingClientRect().width,
        }
      })
      const small = await read()
      expect.equal(small.position, 'absolute', 'covers the positioned parent')
      expect.ok(Math.abs(small.w - small.parentW) <= 4.5, `overlay spans the parent's padding box (${small.w} of ${small.parentW})`)
      expect.ok(small.covers, 'a small region: the plate covers the whole region')
      expect.equal(small.plateAlpha, 1, 'the plate is solid')
      expect.ok(Math.abs(small.groupMid - small.mid) <= 3, `ring and label are centred as one group (${small.groupMid} vs ${small.mid})`)
      expect.ok(small.inert, 'content beneath is inert')
      expect.equal(small.busy, 'true', 'region is aria-busy')
      await page.addStyleTag({ content: '#overlay ~ .demo .card[aria-busy] { min-block-size: 32rem }' })
      await page.waitForTimeout(100)
      const large = await read()
      expect.ok(!large.covers, 'a large region: the plate sits in the middle')
      expect.ok(large.veilAlpha < 1 && large.veilAlpha > 0.5, 'the scrim is the one translucent thing: ' + large.veilAlpha)
      expect.equal(large.plateAlpha, 1, 'the plate behind the label is solid')
      expect.equal(large.plateBorder, '2px', 'plate has the 2px frame')
    },
  },
  {
    // At 200% text a 24px ring beside a 32px label was a second, smaller "working" mark next to the busy Button's (1.1em).
    name: 'a ring that leads a visible label grows with it (1.15em, never under 24px); a ring on its own keeps its size cap',
    async run({ page, goto, expect }) {
      for (const scale of [100, 200]) {
        await goto('components/spinner.html')
        if (scale !== 100) await page.addStyleTag({ content: `html{font-size:${scale}%!important}` })
        await page.waitForTimeout(200)
        const r = await page.evaluate(() => {
          const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
          const labelled = [...document.querySelectorAll('.spinner:not([data-size]) > .spinner__label')].map((l) => l.parentElement.querySelector('.spinner__ring').getBoundingClientRect().width)
          let demo = document.getElementById('sizes'); while (demo && !demo.matches('.demo')) demo = demo.nextElementSibling
          const sizes = [...demo.querySelectorAll('.spinner')].map((s) => s.querySelector('.spinner__ring').getBoundingClientRect().width)
          return { rem, labelled, sizes }
        })
        expect.ok(r.labelled.length >= 3, 'labelled spinners: ' + r.labelled.length)
        for (const w of r.labelled) expect.ok(Math.abs(w - Math.max(24, 1.15 * r.rem)) <= 0.5, `@${scale}%: a labelled ring is ${w}px, expected ${Math.max(24, 1.15 * r.rem)}`)
        expect.equal(r.sizes.map(Math.round).join(' '), '16 24 40 56', `@${scale}%: the four sizes keep their caps`)
      }
    },
  },
  {
    name: 'forced colours: track GrayText, arc Highlight, plate Canvas',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.emulateMedia({ forcedColors: 'active' })
      const r = await page.evaluate(() => {
        const ring = document.querySelector('#inline ~ .demo .spinner__ring')
        const probe = (c) => { const p = document.createElement('i'); p.style.cssText = 'color:' + c; document.body.appendChild(p); const v = getComputedStyle(p).color; p.remove(); return v }
        return {
          track: getComputedStyle(ring).backgroundColor, arc: getComputedStyle(ring, '::after').backgroundColor,
          gray: probe('GrayText'), hi: probe('Highlight'),
        }
      })
      expect.equal(r.track, r.gray, 'track is GrayText')
      expect.equal(r.arc, r.hi, 'arc is Highlight')
    },
  },
]
