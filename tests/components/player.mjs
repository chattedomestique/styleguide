// Interaction spec for Player. See tests/components.mjs for the contract and tests/components/button.mjs for a model.
//
// Media needs byte-range support to seek (Chromium will not move currentTime in a file whose server
// ignores Range), and the repo's tiny static server (scripts/serve.mjs) sends whole files only. GitHub
// Pages, S3 and every real host answer Range, so the spec stands in for one: it serves the demo media
// from docs/assets/media with 206 responses.
import { readFileSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import { ROOT } from '../lib/browser.mjs'

const TYPES = { '.wav': 'audio/wav', '.webm': 'video/webm', '.png': 'image/png', '.vtt': 'text/vtt' }
async function rangeMedia(page) {
  await page.route('**/assets/media/*', async (route) => {
    const file = join(ROOT, 'docs', 'assets', 'media', basename(new URL(route.request().url()).pathname))
    const buf = readFileSync(file)
    const type = TYPES[extname(file)] || 'application/octet-stream'
    const m = /bytes=(\d*)-(\d*)/.exec(route.request().headers().range || '')
    if (m) {
      const start = m[1] ? Number(m[1]) : 0
      const end = m[2] ? Math.min(Number(m[2]), buf.length - 1) : buf.length - 1
      return route.fulfill({ status: 206, headers: { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${buf.length}`, 'content-length': String(end - start + 1) }, body: buf.subarray(start, end + 1) })
    }
    return route.fulfill({ status: 200, headers: { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': String(buf.length) }, body: buf })
  })
}
const open = async ({ page, goto }) => { await rangeMedia(page); await goto('components/player.html') }

const A = '#audio + p + .demo .player'
const V = '#video + p + .demo .player'

const media = (page, sel = A) =>
  page.evaluate((s) => {
    const m = document.querySelector(s + ' .player__media')
    return { paused: m.paused, time: m.currentTime, dur: m.duration, muted: m.muted, ended: m.ended, controls: m.hasAttribute('controls'), ready: m.readyState }
  }, sel)

const ready = async (page, sel = A) => {
  await page.waitForFunction((s) => { const m = document.querySelector(s + ' .player__media'); return m && m.readyState >= 1 && isFinite(m.duration) }, sel, { timeout: 8000 })
}

export const tests = [
  {
    name: 'the script takes the browser\'s controls off and shows ours; the seek bar knows the length',
    async run({ page, goto, expect }) {
      await open({ page, goto })
      await ready(page)
      const r = await page.evaluate((s) => {
        const root = document.querySelector(s)
        const m = root.querySelector('.player__media'), c = root.querySelector('.player__controls')
        const seek = root.querySelector('input[type="range"]'), play = root.querySelector('.player__play')
        return { native: m.hasAttribute('controls'), shown: !c.hidden && c.getBoundingClientRect().height > 0, max: seek.max, valuetext: seek.getAttribute('aria-valuetext'), dur: root.querySelector('[data-player="duration"]').textContent, name: play.getAttribute('aria-label'), pressed: play.getAttribute('aria-pressed'), role: root.getAttribute('role'), describedby: m.getAttribute('aria-describedby') }
      }, A)
      expect.equal(r.native, false, 'native controls are off')
      expect.ok(r.shown, 'our controls are shown')
      expect.equal(Number(r.max), 12, 'seek max = duration')
      expect.equal(r.valuetext, '0:00 of 0:12', 'the position is spoken as a time')
      expect.equal(r.dur, '0:12', 'length shown')
      expect.equal(r.name, 'Play', 'the name is Play')
      expect.equal(r.pressed, 'false', 'not playing')
      expect.equal(r.role, 'group', 'a named group')
      expect.ok(!!r.describedby, 'the media is described by the sentence under the title')
    },
  },
  {
    name: 'Play is a toggle: the NAME stays "Play", aria-pressed follows playback, the icon swaps, the seek bar and time follow',
    async run({ page, goto, expect }) {
      await open({ page, goto })
      await ready(page)
      const play = page.locator(`${A} .player__play`)
      await play.scrollIntoViewIfNeeded()
      await play.click()
      await page.waitForFunction((s) => !document.querySelector(s + ' .player__media').paused && document.querySelector(s + ' .player__media').currentTime > 0.3, A, { timeout: 6000 })
      const r = await page.evaluate((s) => {
        const root = document.querySelector(s)
        const play = root.querySelector('.player__play')
        const vis = (sel) => getComputedStyle(root.querySelector(sel)).display !== 'none'
        const seek = root.querySelector('input[type="range"]')
        return { name: play.getAttribute('aria-label'), pressed: play.getAttribute('aria-pressed'), pauseIcon: vis('.player__play .ic--pause'), playIcon: vis('.player__play .ic--play'), seek: Number(seek.value), time: root.querySelector('[data-player="current"]').textContent, t: root.querySelector('.player__media').currentTime }
      }, A)
      expect.equal(r.name, 'Play', 'the name did not change')
      expect.equal(r.pressed, 'true', 'pressed while playing')
      expect.ok(r.pauseIcon && !r.playIcon, 'the pause icon shows')
      expect.ok(Math.abs(r.seek - r.t) <= 1, `the seek thumb follows playback (${r.seek} vs ${r.t})`)
      expect.ok(/^0:0\d$/.test(r.time), `the time text follows (${r.time})`)
      await play.click()
      await page.waitForTimeout(150)
      expect.equal(await play.getAttribute('aria-pressed'), 'false', 'pressed = false after pausing')
      expect.equal((await media(page)).paused, true, 'paused')
    },
  },
  {
    name: 'seeking without a drag: arrow keys step a second, Home/End jump, clicking the bar jumps; the value is spoken as a time',
    async run({ page, goto, expect }) {
      await open({ page, goto })
      await ready(page)
      const seek = page.locator(`${A} input[type="range"]`)
      await seek.focus()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')
      expect.equal(Math.round((await media(page)).time), 3, 'three arrows = 3 s')
      expect.equal(await seek.getAttribute('aria-valuetext'), '0:03 of 0:12', 'spoken')
      expect.equal(await page.locator(`${A} [data-player="current"]`).textContent(), '0:03', 'time text')
      await page.keyboard.press('End')
      expect.equal(Math.round((await media(page)).time), 12, 'End = the end')
      await page.keyboard.press('Home')
      expect.equal(Math.round((await media(page)).time), 0, 'Home = the start')
      const b = await seek.boundingBox()
      await page.mouse.click(b.x + b.width * 0.5, b.y + b.height / 2)
      const t = (await media(page)).time
      expect.ok(t >= 4.5 && t <= 7.5, `clicking the middle of the bar jumps to about 6 s (got ${t})`)
    },
  },
  {
    name: 'Back and Forward jump by data-skip, clamp at the ends, and announce the new position',
    async run({ page, goto, expect }) {
      await open({ page, goto })
      await ready(page)
      const fwd = page.locator(`${A} [data-player="forward"]`), back = page.locator(`${A} [data-player="back"]`)
      expect.equal(await fwd.getAttribute('aria-label'), 'Forward 5 seconds', 'the name carries the number')
      expect.equal((await fwd.textContent()).trim(), '5', 'and so does the visible label')
      await fwd.scrollIntoViewIfNeeded()
      await fwd.click()
      expect.equal(Math.round((await media(page)).time), 5, 'forward 5 s')
      await page.waitForTimeout(80)
      const said = await page.evaluate(() => document.querySelector('[role="status"].sr-only')?.textContent)
      expect.equal(said, '0:05 of 0:12', 'the position is announced (focus stays on the button)')
      await back.click()
      await back.click()
      expect.equal((await media(page)).time, 0, 'clamped at the start')
      await fwd.click(); await fwd.click(); await fwd.click()
      expect.equal(Math.round((await media(page)).time), 12, 'clamped at the end')
    },
  },
  {
    name: 'Mute is a toggle with a stable name; the icon swaps',
    async run({ page, goto, expect }) {
      await open({ page, goto })
      await ready(page)
      const mute = page.locator(`${A} [data-player="mute"]`)
      await mute.scrollIntoViewIfNeeded()
      await mute.click()
      expect.equal((await media(page)).muted, true, 'muted')
      expect.equal(await mute.getAttribute('aria-pressed'), 'true', 'pressed = muted')
      expect.equal(await mute.getAttribute('aria-label'), 'Mute', 'the name did not change')
      const icons = await mute.evaluate((el) => ({ on: getComputedStyle(el.querySelector('.ic--volume-x')).display, off: getComputedStyle(el.querySelector('.ic--volume-2')).display }))
      expect.ok(icons.on !== 'none' && icons.off === 'none', 'the muted icon shows')
      await mute.click()
      expect.equal((await media(page)).muted, false, 'unmuted')
    },
  },
  {
    name: 'finishing resets the button and is announced; starting one player pauses the others',
    async run({ page, goto, expect }) {
      await open({ page, goto })
      await ready(page); await ready(page, V)
      await page.evaluate((s) => { document.querySelector(s + ' .player__media').currentTime = 11.2 }, A)
      const play = page.locator(`${A} .player__play`)
      await play.scrollIntoViewIfNeeded()
      await play.click()
      await page.waitForFunction((s) => document.querySelector(s + ' .player__media').ended, A, { timeout: 6000 })
      await page.waitForTimeout(150)
      expect.equal(await play.getAttribute('aria-pressed'), 'false', 'not pressed once it has ended')
      const said = await page.evaluate(() => document.querySelector('[role="status"].sr-only')?.textContent)
      expect.ok(/Harbour bell finished/.test(said || ''), `announced (got "${said}")`)
      // one at a time
      await page.evaluate((s) => { document.querySelector(s + ' .player__media').currentTime = 1 }, A)
      await play.click()
      await page.waitForFunction((s) => !document.querySelector(s + ' .player__media').paused, A, { timeout: 4000 })
      const vplay = page.locator(`${V} .player__play`)
      await vplay.scrollIntoViewIfNeeded()
      await vplay.click()
      await page.waitForFunction((s) => !document.querySelector(s + ' .player__media').paused, V, { timeout: 4000 })
      await page.waitForFunction((s) => document.querySelector(s + ' .player__media').paused, A, { timeout: 2000 })
      expect.equal((await media(page, A)).paused, true, 'the audio was paused when the video started')
    },
  },
  {
    name: 'a recording that fails says so in words, dashes the frame and makes the controls unavailable',
    async run({ page, goto, expect }) {
      await open({ page, goto })
      await ready(page)
      await page.evaluate((s) => { const m = document.querySelector(s + ' .player__media'); m.src = 'data:audio/wav;base64,AAAAAAAAAAAAAAAA'; m.load() }, A)
      await page.waitForFunction((s) => document.querySelector(s).getAttribute('data-state') === 'error', A, { timeout: 6000 })
      const r = await page.evaluate((s) => {
        const root = document.querySelector(s)
        return { status: root.querySelector('.player__status').textContent.trim(), icon: !!root.querySelector('.player__status .ic--circle-alert'), play: root.querySelector('.player__play').getAttribute('aria-disabled'), seek: root.querySelector('input[type="range"]').disabled, border: getComputedStyle(root).borderTopStyle }
      }, A)
      expect.ok(/could not be played/.test(r.status), `plain words (got "${r.status}")`)
      expect.ok(r.icon, 'with an icon')
      expect.equal(r.play, 'true', 'Play is unavailable')
      expect.ok(r.seek, 'the seek bar is disabled')
      expect.equal(r.border, 'dashed', 'the frame is dashed')
    },
  },
  {
    name: 'captions: the switch comes back when the media has a caption track, and toggles it',
    async run({ page, goto, expect }) {
      await open({ page, goto })
      await ready(page, V)
      const cc = page.locator(`${V} [data-player="captions"]`)
      await cc.scrollIntoViewIfNeeded()
      expect.equal(await cc.isVisible(), true, 'shown, because the clip has a <track kind="captions">')
      expect.equal(await cc.getAttribute('aria-pressed'), 'false', 'off')
      await cc.click()
      expect.equal(await cc.getAttribute('aria-pressed'), 'true', 'on')
      expect.equal(await page.evaluate((s) => document.querySelector(s + ' video').textTracks[0].mode, V), 'showing', 'the track is showing')
      await cc.click()
      expect.equal(await page.evaluate((s) => document.querySelector(s + ' video').textTracks[0].mode, V), 'hidden', 'and hidden again')
      expect.equal(await page.locator(`${A} [data-player="captions"]`).count(), 0, 'the audio player has no captions button at all')
    },
  },
  {
    name: 'without the script the browser\'s own controls are all there is, and they are there',
    async run({ browser, url, expect }) {
      const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
      const page = await ctx.newPage()
      await page.goto(`${url}/docs/components/player.html`, { waitUntil: 'load' })
      const r = await page.evaluate((a) => {
        const root = document.querySelector(a)
        return { controlsAttr: root.querySelector('.player__media').hasAttribute('controls'), ours: root.querySelector('.player__controls').getBoundingClientRect().height }
      }, A).catch(() => null)
      // With scripts off page.evaluate still runs (it is the harness, not the page): it only reads the DOM.
      expect.ok(r && r.controlsAttr, 'the media element still has its controls attribute')
      expect.equal(r.ours, 0, 'our row stays hidden, so there are not two sets of controls')
      await ctx.close()
    },
  },
  {
    name: 'Play is the large circle (56px), the small buttons keep a 44px hit area, and Tab visits them in reading order',
    async run({ page, goto, expect }) {
      await open({ page, goto })
      await ready(page)
      const r = await page.evaluate((s) => {
        const root = document.querySelector(s)
        root.scrollIntoView({ block: 'center' })
        const play = root.querySelector('.player__play').getBoundingClientRect()
        const mute = root.querySelector('[data-player="mute"]')
        const b = mute.getBoundingClientRect()
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2
        const at = (x, y) => { const e = document.elementFromPoint(x, y); return !!e && (e === mute || mute.contains(e)) }
        return { playW: play.width, muteW: b.width, hit: at(cx - 21.5, cy) && at(cx + 21.5, cy) && at(cx, cy - 21.5) && at(cx, cy + 21.5) }
      }, A)
      expect.equal(Math.round(r.playW), 56, 'large circle')
      expect.ok(r.muteW < 44 && r.hit, 'small circle, 44px hit area')
      await page.locator(`${A} input[type="range"]`).focus()
      const order = []
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Tab')
        order.push(await page.evaluate(() => document.activeElement.getAttribute('aria-label')))
      }
      expect.equal(order.join(), 'Play,Back 5 seconds,Forward 5 seconds,Mute', 'seek, then Play, Back, Forward, Mute')
    },
  },
  {
    name: 'Play, Back and Forward never come apart: they share a line, and Mute / Captions drop under them as a unit',
    async run({ page, goto, expect }) {
      await rangeMedia(page)
      for (const w of [320, 390]) {
        await page.setViewportSize({ width: w, height: 800 })
        await goto('components/player.html')
        await page.waitForTimeout(250)
        const rows = await page.evaluate(() => [...document.querySelectorAll('.player__row')].filter((r) => r.getBoundingClientRect().height > 0).map((row) => {
          const t = [...row.querySelectorAll('.player__transport > .btn')].map((b) => b.getBoundingClientRect())
          const end = row.querySelector('.player__end'), eb = end && end.getBoundingClientRect()
          const sameLine = t.every((b) => Math.abs((b.top + b.height / 2) - (t[0].top + t[0].height / 2)) < 12)
          return { n: t.length, sameLine, rowW: row.clientWidth, endBelowOrBeside: !eb || eb.height === 0 || eb.top >= t[0].top - 30 }
        }))
        expect.ok(rows.length >= 5, `${w}px: the demo rows are there`)
        for (const r of rows) {
          expect.equal(r.n, 3, 'Play, Back and Forward are one group')
          // a row under 11.25rem (the 236px phone mock at 320px) cannot hold three 44px targets and their gaps on one line at all
          if (r.rowW >= 180) expect.ok(r.sameLine, `${w}px: the three share one line (row ${r.rowW}px)`)
        }
      }
    },
  },
]
