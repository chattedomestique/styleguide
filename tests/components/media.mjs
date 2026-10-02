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
  {
    name: 'a picture inside its own link fills the frame like any other (a gallery tile of just a photo)',
    async run({ page, goto, expect }) {
      await goto('components/gallery.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('#context ~ .phone .media__frame > .media__link > img')].map((img) => {
        const f = img.closest('.media__frame').getBoundingClientRect(), b = img.getBoundingClientRect()
        return { dh: Math.abs(f.height - b.height), dw: Math.abs(f.width - b.width), pos: getComputedStyle(img).position }
      }))
      expect.ok(r.length >= 4, 'four linked photos in the gallery in context')
      for (const x of r) {
        expect.equal(x.pos, 'absolute', 'placed to fill the frame')
        expect.ok(x.dh < 1 && x.dw < 1, `fills its frame (off by ${x.dw.toFixed(1)} x ${x.dh.toFixed(1)}px)`)
      }
    },
  },
  {
    name: 'an over caption becomes the plain strip under the picture when the figure is under 10rem wide, so large text cannot hide the picture',
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      const measure = () => page.evaluate(() => [...document.querySelectorAll('.media[data-caption="over"]')].filter((m) => !m.closest('.gallery')).map((m) => {
        const f = m.querySelector('.media__frame').getBoundingClientRect(), c = m.querySelector('.media__caption').getBoundingClientRect()
        return { w: m.getBoundingClientRect().width / parseFloat(getComputedStyle(document.documentElement).fontSize), covers: c.top < f.bottom - 1, share: Math.max(0, f.bottom - c.top) / f.height }
      }))
      const normal = await measure()
      expect.ok(normal.length >= 1, 'an over figure in the demos')
      for (const m of normal) expect.ok(m.w >= 10 ? m.covers : true, 'at normal size a wide figure keeps the plate over the picture')
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.waitForTimeout(250)
      for (const m of await measure()) if (m.w < 10) expect.ok(!m.covers, `a ${m.w.toFixed(1)}rem-wide figure puts the caption under the picture`)
    },
  },
  {
    name: 'the ratios specimen reads in rows: the pictures in a row share one height, and at 200% text there is one per line',
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      const rows = () => page.evaluate(() => [...document.querySelectorAll('#ratios + p + .demo [data-role="ratios"] > div')].map((row) => [...row.children].map((f) => f.querySelector('.media__frame').getBoundingClientRect()).map((r) => ({ h: r.height, top: r.top }))))
      for (const row of await rows()) {
        expect.ok(row.every((r) => Math.abs(r.h - row[0].h) < 1), `one height per row (${row.map((r) => r.h.toFixed(1))})`)
        expect.ok(row.every((r) => Math.abs(r.top - row[0].top) < 1), 'one line per row')
      }
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.waitForTimeout(250)
      const tops = (await rows()).flat().map((r) => Math.round(r.top))
      expect.equal(new Set(tops).size, tops.length, 'at 200% text every picture has a line of its own')
    },
  },
  {
    name: 'the figure behind its children is the frame colour (no light seam inside a soft corner); a dashed failed frame keeps paper in its gaps',
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      const r = await page.evaluate(() => {
        const probe = (v) => { const i = document.createElement('i'); i.style.color = `var(${v})`; document.body.appendChild(i); const c = getComputedStyle(i).color; i.remove(); return c }
        const soft = document.querySelector('#corners ~ .demo [data-corners="soft"] .media')
        const failed = document.querySelector('#states ~ .demo .media[data-state="failed"]')
        return { soft: getComputedStyle(soft).backgroundColor, line: probe('--line'), failed: getComputedStyle(failed).backgroundColor, paper: probe('--paper'), radius: parseFloat(getComputedStyle(soft).borderTopLeftRadius) }
      })
      expect.ok(r.radius > 0, 'the soft figure is rounded')
      expect.equal(r.soft, r.line, 'its background is the line colour, so the anti-aliased inner corner reads as frame')
      expect.equal(r.failed, r.paper, 'the dashed frame shows paper between its dashes, not a solid line')
    },
  },
  {
    name: 'a focused linked figure: the paper halo sits in front of the hard shadow, so the ring is not stepped at the corner',
    async run({ page, goto, expect }) {
      await goto('components/media.html')
      const sh = await page.evaluate(() => getComputedStyle(document.querySelector('#link ~ .demo .media.is-focus')).boxShadow)
      const first = sh.split(/,(?![^(]*\))/)[0].trim() // the first of the comma-separated shadows (commas inside a colour do not split)
      expect.ok(/ 0px 0px 0px 3px$/.test(first), `the first shadow is the 3px halo in the ring's offset (${sh})`)
      expect.ok(/4px 4px 0px 0px/.test(sh), `the hard shadow is still there behind it (${sh})`)
    },
  },
  {
    name: 'a failed figure keeps its icon at 200% text: "small" is a tile under 192px on the screen, not under 12rem',
    async run({ page, goto, expect }) {
      await page.setViewportSize({ width: 390, height: 900 })
      await goto('components/media.html')
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.waitForTimeout(250)
      const r = await page.evaluate(() => {
        const f = document.querySelector('#states ~ .demo .media[data-state="failed"]')
        return { w: f.getBoundingClientRect().width, icon: getComputedStyle(f.querySelector('.media__status .ic')).display, note: f.querySelector('.media__note').textContent }
      })
      expect.ok(r.w > 192, `a full-width figure (${Math.round(r.w)}px)`)
      expect.ok(r.icon !== 'none', 'keeps its icon: status is an icon and words')
      expect.equal(r.note, 'Picture didn’t load', 'the one failure sentence the script also writes')
    },
  },
  {
    name: 'the crop specimen: two columns at most, and every caption chip sits inside its caption with room on both sides (320, 390, 1024px)',
    async run({ page, goto, expect }) {
      for (const w of [320, 390, 1024]) {
        await page.setViewportSize({ width: w, height: 900 })
        await goto('components/media.html')
        const r = await page.evaluate(() => [...document.querySelectorAll('#crop ~ .demo [data-role="crop"] .media')].map((f) => {
          const fr = f.getBoundingClientRect(), c = f.querySelector('.media__caption code').getBoundingClientRect()
          return { left: Math.round(fr.left), top: Math.round(fr.top), inL: c.left - fr.left, inR: fr.right - c.right }
        }))
        const cols = new Set(r.map((x) => x.top)).size === r.length ? 1 : new Set(r.map((x) => x.left)).size
        expect.ok(cols <= 2, `${w}px: ${cols} column(s), never four in a row`)
        for (const x of r) expect.ok(x.inL >= 8 && x.inR >= 8, `${w}px: the chip clears the frame (${x.inL.toFixed(1)} / ${x.inR.toFixed(1)}px)`)
      }
    },
  },
  {
    name: 'link-figure states: the overlines are real content, the state is named under each figure clear of its ring, and they are three across or one per line (never two and one)',
    async run({ page, goto, expect }) {
      for (const w of [390, 1024]) {
        await page.setViewportSize({ width: w, height: 900 })
        await goto('components/media.html')
        const r = await page.evaluate(() => [...document.querySelectorAll('#link ~ .demo [data-role="link-states"] > div')].map((d) => {
          const f = d.querySelector('.media').getBoundingClientRect(), c = d.querySelector(':scope > .t-meta').getBoundingClientRect()
          // the row is read from the wrapper: the hovered and focused figures are lifted 2px by design
          return { label: d.querySelector('.media__label').textContent, state: d.querySelector(':scope > .t-meta').textContent, top: Math.round(d.getBoundingClientRect().top), clear: c.top - (f.bottom + 6) }
        }))
        expect.equal(r.length, 3, 'three specimens')
        for (const x of r) {
          expect.ok(!/hover|focus|forced|rest/i.test(x.label), `${w}px: the overline "${x.label}" is content, not a state`)
          expect.ok(x.clear >= 8, `${w}px: "${x.state}" is ${x.clear.toFixed(1)}px clear of the ring`)
        }
        const rows = new Set(r.map((x) => x.top)).size
        expect.ok(rows === 1 || rows === 3, `${w}px: ${rows} row(s): all three in one, or one each`)
      }
    },
  },
]
