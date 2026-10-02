// Interaction spec for Timeline. See tests/components.mjs for the contract and tests/components/button.mjs for a model.
const TL = '#tl1'
const root = '#editor + p + .demo .timeline'

const head = (page) =>
  page.evaluate(() => {
    const h = document.getElementById('tl1-head')
    return { now: Number(h.getAttribute('aria-valuenow')), text: h.getAttribute('aria-valuetext'), out: document.querySelector('#editor + p + .demo .timeline__time output').textContent, t: parseFloat(h.parentElement.style.getPropertyValue('--t')) }
  })

const clips = (page, track = 0) =>
  page.evaluate((i) => {
    const t = document.querySelectorAll('#editor + p + .demo .timeline__track')[i]
    return [...t.querySelectorAll('.timeline__clip')].map((c) => ({
      name: c.querySelector('.timeline__name').textContent.trim(),
      start: parseFloat(c.style.getPropertyValue('--start')),
      dur: parseFloat(c.style.getPropertyValue('--dur')),
      inn: parseFloat(c.style.getPropertyValue('--in')) || 0,
      sel: c.getAttribute('aria-selected'),
      tab: c.tabIndex,
      dtext: c.querySelector('.timeline__dur').textContent,
      sr: c.querySelector('.sr-only') && c.querySelector('.sr-only').textContent,
    }))
  }, track)

const btn = (page, action) => page.locator(`${root} [data-timeline="${action}"]`)
const hint = (page) => page.locator('#tl1-hint').textContent()

export const tests = [
  {
    name: 'roles and names: a group with a slider playhead and two listboxes of options that say their length',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      const r = await page.evaluate(() => {
        const t = document.querySelector('#editor + p + .demo .timeline')
        const h = t.querySelector('.timeline__head')
        const tracks = [...t.querySelectorAll('[role="listbox"]')]
        const opts = [...t.querySelectorAll('[role="option"]')]
        const audio = t.querySelector('.timeline__clip[data-kind="audio"]')
        const wave = audio.querySelector('.timeline__wave')
        const desc = document.getElementById(audio.getAttribute('aria-describedby'))
        return {
          group: t.getAttribute('role'), label: t.getAttribute('aria-label'),
          slider: h.getAttribute('role'), min: h.getAttribute('aria-valuemin'), max: h.getAttribute('aria-valuemax'), now: h.getAttribute('aria-valuenow'), text: h.getAttribute('aria-valuetext'), tabindex: h.tabIndex,
          listboxes: tracks.map((x) => x.getAttribute('aria-label')), horizontal: tracks.every((x) => x.getAttribute('aria-orientation') === 'horizontal'),
          options: opts.length, selected: opts.filter((o) => o.getAttribute('aria-selected') === 'true').length, rovingStops: tracks.map((x) => [...x.querySelectorAll('[role="option"]')].filter((o) => o.tabIndex === 0).length),
          waveHidden: wave.getAttribute('aria-hidden'), hasPath: !!wave.querySelector('path[d]'), summary: desc && desc.textContent,
          lighthouse: [...t.querySelectorAll('[role="option"]')].find((o) => /Lighthouse/.test(o.textContent)).textContent.replace(/\s+/g, ' ').trim(),
        }
      })
      expect.equal(r.group, 'group', 'a named group')
      expect.equal(r.slider, 'slider', 'the playhead is a slider')
      expect.equal(r.min + '/' + r.max + '/' + r.now, '0/84/30', 'min, max, now')
      expect.equal(r.text, '0:30 of 1:24', 'valuetext reads as a time')
      expect.equal(r.tabindex, 0, 'the head is a tab stop')
      expect.equal(r.listboxes.join(), 'Video clips,Audio', 'two labelled listboxes')
      expect.ok(r.horizontal, 'they are horizontal')
      expect.equal(r.options, 4, 'four clips')
      expect.equal(r.selected, 1, 'exactly one selected')
      expect.equal(r.rovingStops.join(), '1,1', 'one tab stop per track')
      expect.equal(r.waveHidden, 'true', 'the waveform is aria-hidden')
      expect.ok(r.hasPath, 'the waveform is drawn')
      expect.ok(/loud for the first 20 seconds/.test(r.summary || ''), 'and described in text')
      expect.ok(/Lighthouse.*30 seconds/.test(r.lighthouse), `a clip's name includes its length in words (got "${r.lighthouse}")`)
    },
  },
  {
    name: 'playhead keys: arrows step, PageUp/PageDown take ten, Home and End jump, and everything stays in step',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      await page.locator('#tl1-head').focus()
      await page.keyboard.press('ArrowRight')
      let h = await head(page)
      expect.equal(h.now, 31, 'ArrowRight +1 s')
      expect.equal(h.text, '0:31 of 1:24', 'valuetext')
      expect.equal(h.out, '0:31', 'the readout follows')
      expect.equal(h.t, 31, '--t follows (the line moves)')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      expect.equal((await head(page)).now, 29, 'ArrowLeft -1 s')
      await page.keyboard.press('PageUp')
      expect.equal((await head(page)).now, 39, 'PageUp +10 s')
      await page.keyboard.press('PageDown')
      await page.keyboard.press('PageDown')
      expect.equal((await head(page)).now, 19, 'PageDown -10 s')
      await page.keyboard.press('Home')
      expect.equal((await head(page)).now, 0, 'Home')
      await page.keyboard.press('ArrowLeft')
      expect.equal((await head(page)).now, 0, 'clamped at the start')
      await page.keyboard.press('End')
      h = await head(page)
      expect.equal(h.now, 84, 'End')
      expect.equal(h.text, '1:24 of 1:24', 'valuetext at the end')
      await page.keyboard.press('ArrowRight')
      expect.equal((await head(page)).now, 84, 'clamped at the end')
    },
  },
  {
    name: 'no drag needed: clicking the ruler moves the playhead; the round buttons nudge it; dragging the head works too',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      // click the ruler
      const ruler = page.locator(`${root} .timeline__ruler`)
      await ruler.scrollIntoViewIfNeeded()
      const rb = await ruler.boundingBox()
      const sb = await page.locator(`${root} .timeline__scroll`).boundingBox()
      const before = (await head(page)).now
      const scrollBefore = await page.locator(`${root} .timeline__scroll`).evaluate((el) => el.scrollLeft)
      await page.mouse.click(sb.x + sb.width - 40, rb.y + 30) // inside the visible part of the ruler
      const after = (await head(page)).now
      expect.ok(after !== before, `the ruler click moved the playhead (${before} -> ${after})`)
      expect.ok(Math.abs((await page.locator(`${root} .timeline__scroll`).evaluate((el) => el.scrollLeft)) - scrollBefore) < 2, 'and did not scroll the view under the pointer')
      // nudge buttons
      await btn(page, 'forward').click()
      expect.equal((await head(page)).now, after + 1, 'Forward one second')
      await btn(page, 'back').click()
      await btn(page, 'back').click()
      expect.equal((await head(page)).now, after - 1, 'Back one second, twice')
      // drag the head (from the start, so it is fully in view)
      await page.locator('#tl1-head').focus()
      await page.keyboard.press('Home')
      await page.waitForTimeout(600) // the view glides back to the start
      const hb = await page.locator('#tl1-head').boundingBox()
      const start = (await head(page)).now
      await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2)
      await page.mouse.down()
      await page.mouse.move(hb.x + hb.width / 2 + 56, hb.y + hb.height / 2, { steps: 4 })
      await page.mouse.up()
      const dragged = (await head(page)).now
      expect.ok(dragged > start + 2, `dragging 56px right moved it forward (${start} -> ${dragged})`)
      await expect.focused(page, '#tl1-head', 'the head takes focus when dragged')
    },
  },
  {
    name: 'nudge buttons are aria-disabled at the ends (and never the disabled attribute)',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      await page.locator('#tl1-head').focus()
      await page.keyboard.press('Home')
      expect.equal(await btn(page, 'back').getAttribute('aria-disabled'), 'true', 'back is unavailable at 0:00')
      expect.equal(await btn(page, 'forward').getAttribute('aria-disabled'), null, 'forward is available')
      await page.keyboard.press('End')
      expect.equal(await btn(page, 'forward').getAttribute('aria-disabled'), 'true', 'forward is unavailable at the end')
      expect.equal(await btn(page, 'forward').evaluate((el) => el.disabled), false, 'never disabled')
    },
  },
  {
    name: 'a track is one tab stop; arrows move focus along it without selecting; Enter and Space select; Home and End jump',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      await page.locator('#tl1-head').focus()
      await page.keyboard.press('Tab')
      let f = await page.evaluate(() => document.activeElement.textContent.replace(/\s+/g, ' ').trim())
      expect.ok(/^Lighthouse/.test(f), `Tab from the head lands on the selected clip (${f})`)
      await page.keyboard.press('ArrowRight')
      f = await page.evaluate(() => document.activeElement.querySelector('.timeline__name').textContent)
      expect.equal(f, 'Gulls over the quay', 'ArrowRight moves to the next clip')
      expect.equal((await clips(page))[1].sel, 'true', 'focus did not change the selection')
      await page.keyboard.press('ArrowRight')
      expect.equal(await page.evaluate(() => document.activeElement.querySelector('.timeline__name').textContent), 'Gulls over the quay', 'no wrap at the end')
      await page.keyboard.press('Home')
      expect.equal(await page.evaluate(() => document.activeElement.querySelector('.timeline__name').textContent), 'Harbour at dawn', 'Home')
      await page.keyboard.press('Enter')
      let c = await clips(page)
      expect.equal(c.map((x) => x.sel).join(), 'true,false,false', 'Enter selects it, the others deselect')
      await page.keyboard.press('End')
      await page.keyboard.press('Space')
      c = await clips(page)
      expect.equal(c.map((x) => x.sel).join(), 'false,false,true', 'Space selects the last')
      expect.equal(c.map((x) => x.tab).join(), '-1,-1,0', 'roving tabindex follows focus')
      await page.keyboard.press('Tab')
      const inAudio = await page.evaluate(() => !!document.activeElement.closest('[data-kind="audio"]'))
      expect.ok(inAudio, 'the next Tab goes to the audio track stop')
    },
  },
  {
    name: 'Split cuts the selected clip at the playhead, keeps the waveform continuous, updates lengths and announces',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      expect.equal(await btn(page, 'split').getAttribute('aria-disabled'), null, 'available: the playhead is inside the selected clip')
      expect.ok(/Split and trim act on .Lighthouse. at\u00a00:30/.test(await hint(page)), `hint says what will happen, the time kept with "at" by a no-break space (${await hint(page)})`)
      await btn(page, 'split').click()
      const c = await clips(page)
      expect.equal(c.length, 4, 'four clips now')
      const [, a, b] = c
      expect.equal(`${a.name}|${a.start}|${a.dur}|${a.dtext}`, 'Lighthouse|22|8|0:08', 'the left half')
      expect.equal(`${b.name}|${b.start}|${b.dur}|${b.inn}|${b.dtext}`, 'Lighthouse (2)|30|22|8|0:22', 'the right half starts at the cut and remembers where it is in the source')
      expect.ok(/8 seconds/.test(a.sr) && /22 seconds/.test(b.sr), 'spoken lengths are updated too')
      expect.equal(a.sel + b.sel, 'truefalse', 'the left half stays selected')
      expect.equal(await btn(page, 'split').getAttribute('aria-disabled'), 'true', 'nothing left to split at the edge')
      expect.ok(/Move the playhead inside/.test(await hint(page)), 'and the hint says why')
      await expect.focused(page, `${root} [data-timeline="split"]`, 'focus stays on the button')
      await page.waitForTimeout(80)
      const said = await page.evaluate(() => document.querySelector('[role="status"].sr-only')?.textContent)
      expect.ok(/Split .Lighthouse. at 0:30/.test(said || ''), `announced (got "${said}")`)
    },
  },
  {
    name: 'Trim start and Trim end move the selected clip\'s edges to the playhead',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      await btn(page, 'trim-start').click()
      let l = (await clips(page))[1]
      expect.equal(`${l.start}|${l.dur}|${l.inn}|${l.dtext}`, '30|22|8|0:22', 'the start moved to 0:30; 8 s of source are cut off')
      // the playhead is now at the clip's start: nothing to trim until it moves
      expect.equal(await btn(page, 'trim-end').getAttribute('aria-disabled'), 'true', 'at the edge there is nothing to trim')
      await page.locator('#tl1-head').focus()
      await page.keyboard.press('PageUp')
      await btn(page, 'trim-end').click()
      l = (await clips(page))[1]
      expect.equal(`${l.start}|${l.dur}|${l.dtext}`, '30|10|0:10', 'the end moved to 0:40')
      await page.waitForTimeout(80)
      const said = await page.evaluate(() => document.querySelector('[role="status"].sr-only')?.textContent)
      expect.ok(/Trimmed the end of .Lighthouse. to 0:40/.test(said || ''), `announced (got "${said}")`)
    },
  },
  {
    name: 'outside the clip the actions are aria-disabled with the reason in the hint, and keyboard activation is blocked',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      await page.locator('#tl1-head').focus()
      await page.keyboard.press('Home')
      for (const a of ['split', 'trim-start', 'trim-end']) expect.equal(await btn(page, a).getAttribute('aria-disabled'), 'true', `${a} unavailable`)
      expect.ok(/Move the playhead inside .Lighthouse. \(0:22\u00a0to\u00a00:52\)/.test(await hint(page)), `the hint explains, the times kept together (${await hint(page)})`)
      expect.equal(await btn(page, 'split').getAttribute('aria-describedby'), 'tl1-hint', 'the button is described by it')
      await btn(page, 'split').focus()
      await page.keyboard.press('Enter')
      expect.equal((await clips(page)).length, 3, 'Enter on an unavailable Split does nothing')
    },
  },
  {
    name: 'an app can own the change: preventDefault on sg:timeline-action leaves the DOM alone',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      await page.evaluate(() => { window.__a = []; document.querySelector('#editor + p + .demo .timeline').addEventListener('sg:timeline-action', (e) => { window.__a.push(e.detail.action + '@' + e.detail.time); e.preventDefault() }) })
      await btn(page, 'split').click()
      expect.equal((await clips(page)).length, 3, 'our default was skipped')
      expect.equal((await page.evaluate(() => window.__a)).join(), 'split@30', 'the app was told what and when')
    },
  },
  {
    name: 'zoom changes the scale, redraws the ruler and the waveform, and is aria-disabled at the limits',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      const read = () => page.evaluate(() => {
        const t = document.querySelector('#editor + p + .demo .timeline')
        const body = t.querySelector('.timeline__body')
        return { w: body.getBoundingClientRect().width, labels: t.querySelectorAll('.timeline__ruler > span').length, bars: (t.querySelector('.timeline__wave path').getAttribute('d').match(/M/g) || []).length, zoom: t.style.getPropertyValue('--_zoom') }
      })
      const a = await read()
      await btn(page, 'zoom-in').click()
      await page.waitForTimeout(150)
      const b = await read()
      expect.ok(b.w > a.w * 1.4, `zooming in widens the body (${a.w} -> ${b.w})`)
      expect.ok(b.bars > a.bars, `and draws more bars, not fatter ones (${a.bars} -> ${b.bars})`)
      expect.equal(b.zoom, '1.5', 'zoom level')
      for (let i = 0; i < 5; i++) await btn(page, 'zoom-in').click({ force: true })
      expect.equal(await btn(page, 'zoom-in').getAttribute('aria-disabled'), 'true', 'zoom in stops at the limit')
      for (let i = 0; i < 8; i++) await btn(page, 'zoom-out').click({ force: true })
      expect.equal(await btn(page, 'zoom-out').getAttribute('aria-disabled'), 'true', 'zoom out stops at the limit')
    },
  },
  {
    name: 'targets: the head has a 44px hit area and every clip is at least 44px tall; the scroller leaves room for the ring',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      const r = await page.evaluate(() => {
        const t = document.querySelector('#editor + p + .demo .timeline')
        const h = t.querySelector('.timeline__head')
        h.scrollIntoView({ block: 'center' })
        const b = h.getBoundingClientRect()
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2
        const at = (x, y) => { const e = document.elementFromPoint(x, y); return !!e && (e === h || h.contains(e)) }
        const clipH = [...t.querySelectorAll('.timeline__clip')].map((c) => c.getBoundingClientRect().height)
        const scroll = t.querySelector('.timeline__scroll'), body = t.querySelector('.timeline__body')
        return { headH: b.height, hit: at(cx - 21.5, cy) && at(cx + 21.5, cy) && at(cx, cy - 21.5) && at(cx, cy + 21.5), minClip: Math.min(...clipH), padTop: body.getBoundingClientRect().top - scroll.getBoundingClientRect().top }
      })
      expect.ok(r.headH < 44, 'the head is drawn smaller than 44px')
      expect.ok(r.hit, 'but its hit area reaches 44px')
      expect.ok(r.minClip >= 44, `clips are tall enough (${r.minClip}px)`)
      expect.ok(r.padTop >= 8, `room above the head for its ring (${r.padTop}px)`)
    },
  },
  {
    name: 'the playhead line does not swallow clicks meant for clips under it',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      const hit = await page.evaluate(() => {
        const t = document.querySelector('#editor + p + .demo .timeline')
        const line = t.querySelector('.timeline__playhead')
        const clip = t.querySelector('.timeline__clip[aria-selected="true"]')
        clip.scrollIntoView({ block: 'center', inline: 'center' })
        const lb = line.getBoundingClientRect(), cb = t.querySelector('.timeline__track').getBoundingClientRect()
        const e = document.elementFromPoint(lb.left, cb.top + cb.height / 2)
        return e && (e.closest('.timeline__clip') ? 'clip' : e.className)
      })
      expect.equal(hit, 'clip', 'a click on the line reaches the clip beneath')
    },
  },
  {
    name: 'reduced motion: a clip does not travel when it lifts, and the raised outline still shows',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      const c = page.locator('#clips + p + .demo .timeline__clip.is-hover')
      await c.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      const r = await c.evaluate((el) => ({ t: getComputedStyle(el).transform, lift: Number(getComputedStyle(el).getPropertyValue('--lift')), shadow: getComputedStyle(el).boxShadow }))
      expect.ok(r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)', `no movement (got ${r.t})`)
      expect.equal(r.lift, 1, 'still raised')
      expect.ok(/4px 4px 0px/.test(r.shadow), `its hard shadow appears in place (${r.shadow})`)
    },
  },
  {
    name: 'clips follow the selection recipe: hover and focus raise an outline, a press tints, only the selected clip is filled',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      const r = await page.locator('#clips + p + .demo').evaluate((el) => {
        const get = (name) => { const c = [...el.querySelectorAll('.timeline__clip')].find((x) => x.querySelector('.timeline__name').textContent.trim() === name); const cs = getComputedStyle(c); return { lift: Number(cs.getPropertyValue('--lift')), fill: Number(cs.getPropertyValue('--fill')), bg: cs.backgroundColor } }
        return { rest: get('Rest'), sel: get('Selected'), hover: get('Hover'), focus: get('Focus'), press: get('Pressed') }
      })
      expect.equal(r.hover.lift + '/' + r.hover.fill, '1/0', 'hover: raised, not filled')
      expect.equal(r.focus.lift + '/' + r.focus.fill, '1/0', 'focus: raised, not filled')
      expect.equal(r.press.lift + '/' + r.press.fill, '0/0.15', 'pressed: down, a light tint')
      expect.equal(r.sel.fill, 1, 'selected: filled')
      expect.equal(r.hover.bg, r.rest.bg, 'hover keeps the rest fill')
      expect.ok(r.press.bg !== r.rest.bg && r.press.bg !== r.sel.bg, 'the press tint is neither rest nor selected')
      // a selected clip stays filled while it is pressed
      const pressedSel = await page.locator('#clips + p + .demo .timeline__clip[aria-selected="true"]').evaluate((el) => { el.classList.add('is-active'); return Number(getComputedStyle(el).getPropertyValue('--fill')) })
      expect.equal(pressedSel, 1, 'selected + pressed stays filled')
    },
  },
  {
    name: 'the playhead head never covers a ruler label, wherever it is',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      await page.locator('#tl1-head').scrollIntoViewIfNeeded()
      await page.locator('#tl1-head').focus()
      const hits = []
      for (const key of ['Home', 'PageDown', 'PageDown', 'ArrowRight', 'PageDown', 'PageDown', 'ArrowRight', 'ArrowRight', 'PageDown', 'End']) {
        await page.keyboard.press(key)
        await page.waitForTimeout(80)
        const h = await page.evaluate(() => {
          const t = document.querySelector('#editor + p + .demo .timeline')
          const hd = t.querySelector('.timeline__head').getBoundingClientRect()
          return [...t.querySelectorAll('.timeline__ruler > span')].filter((s) => {
            const b = s.getBoundingClientRect()
            return b.width && hd.left < b.right && b.left < hd.right && hd.top < b.bottom && b.top < hd.bottom
          }).map((s) => s.textContent)
        })
        if (h.length) hits.push(key + ': ' + h.join())
      }
      expect.equal(hits.join(' | '), '', 'no label sits under the head')
    },
  },
  {
    name: 'the bar never wraps raggedly: the pair stays round the readout, the three tools are one row of equal pills, at 390 and 320px and 200% text',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      for (const [w, pct] of [[390, 100], [320, 100], [390, 200], [320, 200]]) {
        await page.setViewportSize({ width: w, height: 800 })
        await page.addStyleTag({ content: `html{font-size:${pct}%!important}` })
        await page.waitForTimeout(350)
        const all = await page.evaluate(() => [...document.querySelectorAll('.timeline')].filter((t) => t.querySelector('.timeline__bar')).map((t) => {
          const bar = t.querySelector('.timeline__bar'), time = t.querySelector('.timeline__time')
          const box = (el) => el.getBoundingClientRect()
          const back = box(time.querySelector('[data-timeline="back"]')), fwd = box(time.querySelector('[data-timeline="forward"]')), tl = box(t)
          const tools = [...t.querySelectorAll('.timeline__actions .btn')].map((b) => { const r = box(b); const word = b.querySelector('.timeline__word'); return { top: r.top, w: r.width, h: r.height, radius: parseFloat(getComputedStyle(b).borderTopLeftRadius), name: b.textContent.trim(), clipped: word.scrollWidth > word.clientWidth + 1 && getComputedStyle(word).position !== 'absolute' } })
          const zoom = [...t.querySelectorAll('.timeline__zoom .btn')].map(box)
          return {
            name: t.getAttribute('aria-label'), fit: bar.dataset.fit, spills: bar.scrollWidth > bar.clientWidth + 1,
            pair: Math.abs((back.top + back.height / 2) - (fwd.top + fwd.height / 2)) < 2 || Math.abs(back.top - fwd.top) < 2,
            inside: back.left >= tl.left && fwd.right <= tl.right,
            oneRow: tools.every((x) => Math.abs(x.top - tools[0].top) < 1),
            equal: tools.every((x) => Math.abs(x.w - tools[0].w) < 1),
            pills: tools.every((x) => x.radius >= x.h / 2 - 1),
            clipped: tools.filter((x) => x.clipped).length,
            names: tools.map((x) => x.name).join('|'),
            zoomRow: Math.abs(zoom[0].top - zoom[1].top) < 1,
          }
        }))
        for (const r of all) {
          const at = `${w}px ${pct}% ${r.name} [${r.fit}]`
          expect.ok(r.pair && r.inside, `${at}: Back and Forward stay round the readout, inside the timeline`)
          expect.ok(!r.spills, `${at}: nothing spills out of the bar`)
          expect.ok(r.oneRow, `${at}: the three tools are one row`)
          expect.ok(r.equal, `${at}: of equal cells`)
          expect.ok(r.pills, `${at}: each a pill (radius half its height), never a rectangle`)
          expect.equal(r.clipped, 0, `${at}: every word that shows fits its cell`)
          expect.equal(r.names, 'Split|Trim start|Trim end', `${at}: each tool keeps its word as its name`)
          expect.ok(r.zoomRow, `${at}: the zoom pair stays one row`)
        }
      }
    },
  },
  {
    name: 'a clip that runs off the start of the scroller keeps its name in view, and no ruler number is shown cut',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      const r = await page.locator('#context + p + .demo .timeline').evaluate(async (t) => {
        const sc = t.querySelector('.timeline__scroll')
        sc.scrollLeft = 200
        await new Promise((res) => setTimeout(res, 150))
        const box = sc.getBoundingClientRect()
        const cut = [...t.querySelectorAll('.timeline__clip')].filter((c) => { const b = c.getBoundingClientRect(); return b.left < box.left && b.right > box.left + 60 })
        const names = cut.map((c) => { const n = c.querySelector('.timeline__name').getBoundingClientRect(); return n.left >= box.left - 0.5 })
        const labels = [...t.querySelectorAll('.timeline__ruler > span')].filter((s) => getComputedStyle(s).visibility !== 'hidden').map((s) => { const b = s.getBoundingClientRect(); return b.left >= box.left - 0.5 && b.right <= box.right + 0.5 })
        return { cut: cut.length, names, labels }
      })
      expect.ok(r.cut >= 1, `a clip runs off the start (${r.cut})`)
      expect.ok(r.names.every(Boolean), 'its name is still in view')
      expect.ok(r.labels.length >= 1 && r.labels.every(Boolean), 'every ruler number shown is whole')
    },
  },
  {
    name: 'the dark stage selects the clip under the playhead, and its hint names it',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      const r = await page.locator('#dark + p + .demo .timeline').evaluate((t) => {
        const sel = t.querySelector('.timeline__clip[aria-selected="true"]'), ph = t.querySelector('.timeline__playhead').getBoundingClientRect(), b = sel.getBoundingClientRect()
        return { name: sel.querySelector('.timeline__name').textContent.trim(), under: ph.left > b.left && ph.left < b.right, hint: t.querySelector('.timeline__hint').textContent }
      })
      expect.ok(r.under, 'the selected clip is the one the playhead is in')
      expect.ok(r.hint.includes(r.name), `the hint names it (${r.hint})`)
    },
  },
  {
    name: 'the Clips demo shows Rest, Selected, Hover, Focus and Pressed together, with no scrolling needed',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      const r = await page.locator('#clips + p + .demo').evaluate((el) => {
        const sc = el.querySelector('.timeline__scroll'), tl = el.querySelector('.timeline').getBoundingClientRect()
        const clips = [...el.querySelectorAll('.timeline__clip')]
        return { n: clips.length, names: clips.map((c) => c.querySelector('.timeline__name').textContent.trim()), inside: clips.every((c) => { const b = c.getBoundingClientRect(); return b.left >= tl.left && b.right <= tl.right }), scrolls: sc.scrollWidth > sc.clientWidth + 1 }
      })
      expect.equal(r.names.join(), 'Rest,Selected,Hover,Focus,Pressed', 'Selected sits next to Rest')
      expect.ok(r.inside && !r.scrolls, 'every state is in view at 390px')
      const f = await page.locator('#clips + p + .demo .timeline__clip.is-focus').evaluate((el) => { const c = getComputedStyle(el); return c.outlineStyle + ' ' + c.outlineWidth })
      expect.equal(f, 'solid 3px', 'the Focus specimen draws the ring')
    },
  },
  {
    name: 'a clip mostly scrolled away shows how its name STARTS (one line, cut with an ellipsis), not how it ends',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      await page.waitForTimeout(300)
      const r = await page.locator('#editor + p + .demo .timeline').evaluate((t) => {
        const sc = t.querySelector('.timeline__scroll').getBoundingClientRect()
        const c = [...t.querySelectorAll('.timeline__clip')].find((x) => { const b = x.getBoundingClientRect(); return b.left < sc.left && b.right > sc.left })
        if (!c) return null
        const n = c.querySelector('.timeline__name'), nb = n.getBoundingClientRect(), cb = c.getBoundingClientRect(), cs = getComputedStyle(n)
        return { name: n.textContent.trim(), cut: c.hasAttribute('data-cut'), start: nb.left >= sc.left - 0.5, end: nb.right <= cb.right + 0.5, ellipsis: cs.textOverflow, wrap: cs.whiteSpace, truncated: n.scrollWidth > n.clientWidth }
      })
      expect.ok(r, 'the editor opens with a clip running off the start')
      expect.ok(r.cut, `${r.name} is marked as cut`)
      expect.ok(r.start && r.end, 'its name starts inside the scroller and ends inside the clip')
      expect.ok(r.ellipsis === 'ellipsis' && r.wrap === 'nowrap', 'one line with an ellipsis')
      expect.ok(r.truncated, 'the name is longer than the part in view, so the ellipsis shows')
    },
  },
  {
    name: 'the playhead line runs whole from the head to the last track: no ruler number sits on it, wherever it is',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      const onLine = (sel) => page.evaluate((sel) => {
        const t = document.querySelector(sel)
        const x = t.querySelector('.timeline__playhead').getBoundingClientRect().left
        return [...t.querySelectorAll('.timeline__ruler > span')].filter((s) => getComputedStyle(s).visibility !== 'hidden').filter((s) => { const b = s.getBoundingClientRect(); return x > b.left - 1 && x < b.right + 1 }).map((s) => s.textContent)
      }, sel)
      expect.equal((await onLine('#dark + p + .demo .timeline')).join(), '', 'dark stage at load: the line crosses no number')
      await page.locator('#tl1-head').scrollIntoViewIfNeeded()
      await page.locator('#tl1-head').focus()
      await page.keyboard.press('Home')
      const hits = []
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(30)
        const h = await onLine(root)
        if (h.length) hits.push(i + 1 + 's: ' + h.join())
      }
      expect.equal(hits.join(' | '), '', 'no number on the line at any second from 0:01 to 0:40')
      // the number the line would cross is still shown, on the other side of its tick
      const flipped = await page.evaluate(() => [...document.querySelectorAll('#editor + p + .demo .timeline__ruler > span[data-flip]')].map((s) => { const b = s.getBoundingClientRect(), tick = s.previousElementSibling.getBoundingClientRect(); return { shown: getComputedStyle(s).visibility !== 'hidden', before: b.right <= tick.left + 0.5 } }))
      expect.ok(flipped.every((f) => f.before), 'a flipped number ends before its tick')
    },
  },
  {
    name: 'a clip is as tall as its words: at 200% text the name and the length sit together, no hollow middle',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.waitForTimeout(400)
      const r = await page.evaluate(() => [...document.querySelectorAll('#editor + p + .demo .timeline__clip:not([data-kind])')].map((c) => {
        const n = c.querySelector('.timeline__name').getBoundingClientRect(), d = c.querySelector('.timeline__dur').getBoundingClientRect(), b = c.getBoundingClientRect()
        return { between: d.top - n.bottom, below: b.bottom - d.bottom }
      }))
      for (const x of r) {
        expect.ok(x.between <= 6, `the length follows the name (${x.between.toFixed(1)}px between)`)
        expect.ok(x.below <= 12, `and the clip ends after its padding (${x.below.toFixed(1)}px below the length)`)
      }
    },
  },
  {
    name: 'under the last track is the same air as between the tracks, not an empty lane',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      const r = await page.evaluate(() => {
        const t = document.querySelector('#editor + p + .demo .timeline')
        const tracks = [...t.querySelectorAll('.timeline__track')].map((x) => x.getBoundingClientRect())
        const sc = t.querySelector('.timeline__scroll').getBoundingClientRect()
        const bw = parseFloat(getComputedStyle(t).borderBottomWidth)
        return { between: tracks[1].top - tracks[0].bottom, below: t.getBoundingClientRect().bottom - bw - tracks[tracks.length - 1].bottom }
      })
      expect.ok(Math.abs(r.below - r.between) <= 1, `below the last track ${r.below}px, between tracks ${r.between}px`)
    },
  },
  {
    name: 'when the bar takes three lines, every group starts at the start (zoom is not a stray pair at the end)',
    viewport: { width: 320, height: 800 },
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      const r = await page.locator('#context + p + .demo .timeline').evaluate((t) => {
        const bar = t.querySelector('.timeline__bar')
        const first = (sel) => t.querySelector(sel).getBoundingClientRect().left
        return { fit: bar.dataset.fit, time: first('.timeline__time .btn'), tools: first('.timeline__actions .btn'), zoom: first('.timeline__zoom .btn') }
      })
      expect.equal(r.fit, 'tall', 'the phone mock at 320px takes three lines')
      expect.ok(Math.abs(r.zoom - r.tools) < 1 && Math.abs(r.tools - r.time) < 1, `time ${r.time}, tools ${r.tools}, zoom ${r.zoom}: one start edge`)
    },
  },
  {
    name: 'the clip states keep clear of each other: shadows and rings never come within 8px of the next clip',
    async run({ page, goto, expect }) {
      await goto('components/timeline.html')
      const r = await page.locator('#clips + p + .demo').evaluate((el) => {
        const box = (name) => [...el.querySelectorAll('.timeline__clip')].find((x) => x.querySelector('.timeline__name').textContent.trim() === name).getBoundingClientRect()
        const hover = box('Hover'), focus = box('Focus')
        // hover paints its 4px shadow to the end, focus its 6px ring (3px ring + 3px offset) all round
        return { gap: (focus.left - 6) - (hover.right + 4), sameRow: Math.abs(hover.top - focus.top) < 8 }
      })
      if (r.sameRow) expect.ok(r.gap >= 8, `Hover's shadow and Focus's ring are ${r.gap.toFixed(0)}px apart`)
    },
  },
]
