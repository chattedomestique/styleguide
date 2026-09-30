// Spec for Progress and Meter: names and text values, the meter's ARIA range, the ring's ARIA,
// indeterminate + reduced motion, fill-vs-track >= 3:1 everywhere, SG.progress keeping number,
// visual and announcements in step, forced colours.
const PAGE = 'components/progress.html'

async function until(page, fn, arg, what = 'condition', tries = 60) {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(fn, arg)) return
    await page.waitForTimeout(50)
  }
  throw new Error('timed out waiting for ' + what)
}

export const tests = [
  {
    name: 'every <progress> and meter has an accessible name, and its value is also visible text',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const r = await page.evaluate(() => {
        const out = []
        let checked = 0
        for (const el of document.querySelectorAll('progress.progress__bar')) {
          checked += 1
          const named = (el.labels && el.labels.length) || el.getAttribute('aria-labelledby') || el.getAttribute('aria-label')
          if (!named) out.push('unnamed progress: ' + el.id)
          const value = el.closest('.progress').querySelector('.progress__value')
          if (!value || !value.textContent.trim()) out.push('no value text for ' + el.id)
          else if (el.hasAttribute('value') && !/\d/.test(value.textContent)) out.push('value text without a number for ' + el.id)
        }
        for (const el of document.querySelectorAll('[role="meter"]')) {
          checked += 1
          const named = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
          if (!named) out.push('unnamed meter')
          // a visible number somewhere near: the card's figure/meta, or the sibling text
          const scope = el.closest('.card__body, .stack, .demo__stage') || el.parentElement
          if (!/\d/.test(scope.textContent)) out.push('meter with no number in view: ' + (named || ''))
        }
        return { out, checked }
      })
      expect.ok(r.checked >= 14, 'found ' + r.checked + ' bars and meters')
      expect.equal(r.out.join(' | '), '', 'problems')
    },
  },
  {
    name: 'meters are role=meter with min, max, now and a --value percentage that matches them',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const meters = await page.$$eval('[role="meter"]', (els) => els.map((el) => ({
        cls: el.className,
        min: Number(el.getAttribute('aria-valuemin')),
        max: Number(el.getAttribute('aria-valuemax')),
        now: Number(el.getAttribute('aria-valuenow')),
        valueVar: el.style.getPropertyValue('--value').trim(),
        width: parseFloat(getComputedStyle(el, '::before').width) / (el.clientWidth || 1),
      })))
      expect.ok(meters.length >= 5, 'meters: ' + meters.length)
      for (const m of meters) {
        expect.ok(/\bmeter\b/.test(m.cls), 'uses .meter')
        expect.ok(m.max > m.min && m.now >= m.min && m.now <= m.max, 'sane range ' + JSON.stringify(m))
        const pct = ((m.now - m.min) / (m.max - m.min)) * 100
        expect.ok(m.valueVar.endsWith('%'), '--value carries its unit: ' + m.valueVar)
        expect.ok(Math.abs(parseFloat(m.valueVar) - pct) < 0.6, `--value ${m.valueVar} matches ${m.now}/${m.max} (${pct.toFixed(1)}%)`)
        expect.ok(Math.abs(m.width * 100 - pct) < 1.5, `drawn fill is ${(m.width * 100).toFixed(1)}% (expected ${pct.toFixed(1)}%)`)
      }
    },
  },
  {
    name: 'rings are progressbars with name, range, value and visible text that matches; the svg is hidden',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const rings = await page.$$eval('.progress-ring', (els) => els.map((el) => ({
        role: el.getAttribute('role'),
        name: el.getAttribute('aria-label'),
        now: Number(el.getAttribute('aria-valuenow')),
        min: el.getAttribute('aria-valuemin'),
        max: Number(el.getAttribute('aria-valuemax')),
        value: Number(getComputedStyle(el).getPropertyValue('--value')),
        text: el.textContent.trim(),
        hiddenSvg: el.querySelector('svg').getAttribute('aria-hidden'),
      })))
      expect.ok(rings.length >= 4, 'rings found: ' + rings.length)
      for (const r of rings) {
        expect.equal(r.role, 'progressbar')
        expect.ok(r.name, 'ring has a name')
        expect.equal(r.min, '0')
        expect.equal(r.hiddenSvg, 'true')
        expect.ok(/\d/.test(r.text), 'centre text has the number: ' + r.text)
        expect.ok(Math.abs(r.value - (r.now / r.max) * 100) < 0.6, `--value ${r.value} matches aria-valuenow ${r.now}/${r.max}`)
      }
    },
  },
  {
    name: 'the track and the meter have the real 2px frame (a boundary that survives forced colours)',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const w = await page.evaluate(() => [...document.querySelectorAll('.progress__track, .meter, .progress-steps__bar > *')].map((el) => { const cs = getComputedStyle(el); return { width: cs.borderTopWidth, style: cs.borderTopStyle, radius: cs.borderTopLeftRadius } }))
      expect.ok(w.length >= 12, 'framed parts: ' + w.length)
      for (const x of w) {
        expect.equal(x.width, '2px')
        expect.equal(x.style, 'solid')
      }
    },
  },
  {
    name: 'indeterminate: no value attribute, a sliding segment that is a part of the track',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      expect.equal(await page.locator('#pg-ind').getAttribute('value'), null, 'indeterminate has no value')
      const probe = () => page.evaluate(() => {
        const track = document.getElementById('pg-ind').parentElement
        const cs = getComputedStyle(track, '::after')
        return { name: cs.animationName, transform: cs.transform, width: cs.width, trackW: track.clientWidth }
      })
      const a = await probe()
      await page.waitForTimeout(350)
      const b = await probe()
      expect.equal(a.name, 'sg-progress-slide')
      expect.ok(a.transform !== b.transform, 'segment moves: ' + a.transform + ' -> ' + b.transform)
      expect.ok(parseFloat(a.width) < a.trackW * 0.5, 'segment is a part of the track')
    },
  },
  {
    name: 'indeterminate under reduced motion: no travel, a full-width segment whose opacity pulses',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const samples = []
      for (let i = 0; i < 6; i++) {
        samples.push(await page.evaluate(() => {
          const track = document.getElementById('pg-ind').parentElement
          const cs = getComputedStyle(track, '::after')
          return { transform: cs.transform, width: parseFloat(cs.width), trackW: track.clientWidth, opacity: Number(cs.opacity) }
        }))
        await page.waitForTimeout(330)
      }
      for (const s of samples) {
        expect.ok(s.transform === 'none' || s.transform === 'matrix(1, 0, 0, 1, 0, 0)', 'no translation, got ' + s.transform)
        expect.ok(s.width >= s.trackW - 4.5, `segment is full width (${s.width} of ${s.trackW})`)
      }
      const ops = samples.map((s) => s.opacity)
      expect.ok(Math.max(...ops) - Math.min(...ops) > 0.15, 'opacity pulses: ' + ops.map((o) => o.toFixed(2)).join(', '))
    },
  },
  {
    name: 'fill is at least 3:1 against its track in every theme, palette and contrast setting (bars, meters, segments, rings)',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const result = await page.evaluate(() => {
        const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
        const root = document.documentElement
        // resolve var(--x) as seen from `scope` to #rrggbb (probes live in the wrapper, never inside <progress>)
        const resolve = (scope, css) => { const p = document.createElement('i'); p.style.cssText = 'position:absolute;visibility:hidden;color:' + css; scope.appendChild(p); const hex = SG.colorToHex(getComputedStyle(p).color); p.remove(); return hex }
        const wrappers = [...document.querySelectorAll('.progress, .meter, .progress-ring, .progress-steps')]
        const pairs = wrappers.map((w, i) => ({ w, label: w.className.split(' ')[0] + '#' + i + (w.dataset.tone ? '[' + w.dataset.tone + ']' : '') }))
        const out = []
        let worst = 99
        for (const theme of ['light', 'dark']) for (const palette of ['default', 'periwinkle', 'mint', 'sand', 'cream', 'wire']) for (const contrast of [null, 'more']) {
          root.setAttribute('data-theme', theme)
          if (palette === 'default') root.removeAttribute('data-palette'); else root.setAttribute('data-palette', palette)
          if (contrast) root.setAttribute('data-contrast', contrast); else root.removeAttribute('data-contrast')
          for (const p of pairs) {
            const tag = `${theme}/${palette}/${contrast || 'normal'} ${p.label}`
            let f, t
            if (p.w.classList.contains('meter')) {
              // the meter paints its own fill and track: measure what is really drawn
              f = SG.colorToHex(getComputedStyle(p.w, '::before').backgroundColor)
              t = SG.colorToHex(getComputedStyle(p.w).backgroundColor)
            } else {
              f = resolve(p.w, 'var(--_fill)')
              t = resolve(p.w, 'var(--_track)')
            }
            const r = ratio(f, t)
            worst = Math.min(worst, r)
            if (r < 3) out.push(`${tag}: ${r.toFixed(2)}`)
            if (p.w.classList.contains('progress-ring')) {
              const arc = SG.colorToHex(getComputedStyle(p.w.querySelector('.progress-ring__arc')).stroke)
              const tr = SG.colorToHex(getComputedStyle(p.w.querySelector('.progress-ring__track')).stroke)
              const r2 = ratio(arc, tr)
              worst = Math.min(worst, r2)
              if (r2 < 3) out.push(`${tag} arc vs ring track: ${r2.toFixed(2)}`)
            }
          }
        }
        return { out, worst, n: pairs.length }
      })
      expect.ok(result.n >= 18, 'elements measured: ' + result.n)
      expect.equal(result.out.slice(0, 6).join(' | '), '', `fill vs track below 3:1 (worst ${result.worst.toFixed(2)})`)
    },
  },
  {
    name: 'SG.progress.set keeps the native value, the ARIA value, --value and the visible text in step on every form',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const r = await page.evaluate(() => {
        const out = {}
        const lin = document.getElementById('pg-live-root')
        out.linP = SG.progress.set(lin, 40, { hint: '86 of 214 cards' })
        out.lin = { v: document.getElementById('pg-live').value, t: document.getElementById('pg-live-val').textContent, h: document.getElementById('pg-live-hint').textContent }
        SG.progress.set(lin, null, { text: 'Working' })
        out.indeterminate = { has: document.getElementById('pg-live').hasAttribute('value'), t: document.getElementById('pg-live-val').textContent }
        const meter = document.querySelector('#meter ~ .demo .meter')
        SG.progress.set(meter, 6, { valuetext: '6 of 12 shapes' })
        out.meter = { now: meter.getAttribute('aria-valuenow'), v: meter.style.getPropertyValue('--value'), text: meter.getAttribute('aria-valuetext'), w: getComputedStyle(meter, '::before').width, cw: meter.clientWidth }
        const ring = document.querySelector('#ring ~ .demo .progress-ring:nth-of-type(2)') || document.querySelectorAll('#ring ~ .demo .progress-ring')[1]
        SG.progress.set(ring, 50, { text: '50%' })
        out.ring = { now: ring.getAttribute('aria-valuenow'), v: ring.style.getPropertyValue('--value'), t: ring.querySelector('.progress-ring__num').textContent }
        const steps = document.querySelector('#steps ~ .demo .progress-steps')
        SG.progress.set(steps, 3, { name: 'Confirm' })
        out.steps = { text: steps.querySelector('.progress-steps__text').textContent.replace(/\s+/g, ' ').trim(), states: [...steps.querySelectorAll('.progress-steps__bar > *')].map((s) => s.getAttribute('data-state') || '-').join(',') }
        out.pct = SG.progress.percent(meter)
        return out
      })
      expect.equal(r.linP, (40 / 100) * 100)
      expect.equal(r.lin.v, 40)
      expect.equal(r.lin.t, '40%')
      expect.equal(r.lin.h, '86 of 214 cards')
      expect.equal(r.indeterminate.has, false, 'null = indeterminate')
      expect.equal(r.indeterminate.t, 'Working')
      expect.equal(r.meter.now, '6')
      expect.equal(r.meter.v, '50%')
      expect.equal(r.meter.text, '6 of 12 shapes')
      expect.ok(Math.abs(parseFloat(r.meter.w) / r.meter.cw - 0.5) < 0.05, 'drawn fill follows: ' + r.meter.w + ' of ' + r.meter.cw)
      expect.equal(r.ring.now, '50')
      expect.equal(r.ring.v, '50')
      expect.equal(r.ring.t, '50%')
      expect.equal(r.steps.text, 'Step 3 of 4 Confirm')
      expect.equal(r.steps.states, 'done,done,current,-')
      expect.equal(r.pct, 50)
    },
  },
  {
    name: 'live demo: value, text and hint update together; milestones and completion are announced, ticks are not',
    async run({ page, goto, expect }) {
      await page.clock.install()
      await goto(PAGE)
      await page.evaluate(() => {
        SG.announce('ready')
        window.__said = []
        const region = document.querySelector('div.sr-only[role="status"]')
        new MutationObserver(() => { const t = region.textContent; if (t && t !== 'ready') window.__said.push(t) }).observe(region, { childList: true, characterData: true, subtree: true })
      })
      await page.clock.runFor(100)
      await page.locator('#pg-live-btn').click()
      await page.clock.runFor(1300)
      const mid = await page.evaluate(() => ({ v: document.getElementById('pg-live').value, t: document.getElementById('pg-live-val').textContent, h: document.getElementById('pg-live-hint').textContent }))
      expect.ok(mid.v > 0 && mid.t === mid.v + '%', 'text follows value: ' + JSON.stringify(mid))
      expect.ok(/ of 214 cards$/.test(mid.h), 'hint updated: ' + mid.h)
      await page.clock.runFor(4000)
      await until(page, () => window.__said.includes('Importing deck: complete'), null, 'completion announced')
      const said = await page.evaluate(() => window.__said)
      expect.ok(said.includes('Importing deck: 25 percent') && said.includes('Importing deck: 50 percent') && said.includes('Importing deck: 75 percent'), 'milestones: ' + said.join(' / '))
      expect.equal(said.length, 4, 'exactly four announcements, not every tick: ' + said.join(' / '))
      expect.equal(await page.locator('#pg-live').evaluate((el) => el.value), 100)
    },
  },
  {
    name: 'steps: the text says which step, the segments are hidden from assistive tech',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const s = await page.locator('#steps ~ .demo .progress-steps').first().evaluate((el) => ({
        text: el.querySelector('.progress-steps__text').textContent.replace(/\s+/g, ' ').trim(),
        hidden: el.querySelector('.progress-steps__bar').getAttribute('aria-hidden'),
        done: el.querySelectorAll('[data-state="done"]').length,
        cur: el.querySelectorAll('[data-state="current"]').length,
        curW: parseFloat(getComputedStyle(el.querySelector('[data-state="current"]'), '::before').width) / el.querySelector('[data-state="current"]').clientWidth,
      }))
      expect.ok(/Step 2 of 4/.test(s.text), s.text)
      expect.equal(s.hidden, 'true')
      expect.equal(s.done + s.cur, 2)
      expect.ok(Math.abs(s.curW - 0.5) < 0.05, 'the current step is half full (a shape cue): ' + s.curW)
    },
  },
  {
    name: 'forced colours: fill is Highlight, track is Canvas, the frame is CanvasText',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.emulateMedia({ forcedColors: 'active' })
      const r = await page.evaluate(() => {
        const probe = (c, prop) => { const p = document.createElement('i'); p.style.cssText = prop + ':' + c; document.body.appendChild(p); const v = getComputedStyle(p)[prop === 'color' ? 'color' : 'backgroundColor']; p.remove(); return v }
        const m = document.querySelector('#meter ~ .demo .meter')
        return {
          meterFill: getComputedStyle(m, '::before').backgroundColor, meterTrack: getComputedStyle(m).backgroundColor, meterFrame: getComputedStyle(m).borderTopColor,
          hi: probe('Highlight', 'background-color'), canvas: probe('Canvas', 'background-color'), text: probe('CanvasText', 'color'),
          arc: getComputedStyle(document.querySelector('.progress-ring__arc')).stroke,
          gray: probe('GrayText', 'color'),
          ringTrack: getComputedStyle(document.querySelector('.progress-ring__track')).stroke,
        }
      })
      expect.equal(r.meterFill, r.hi, 'fill is Highlight')
      expect.equal(r.meterTrack, r.canvas, 'track is Canvas')
      expect.equal(r.meterFrame, r.text, 'frame is CanvasText')
      expect.equal(r.arc, r.hi, 'ring arc is Highlight')
      expect.equal(r.ringTrack, r.gray, 'ring track is GrayText')
    },
  },
]
