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
      await ready(page) // the video loads nothing until Play (preload="none")
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
      // the video loads nothing until Play (preload="none"); its caption track is there all the same
      await page.waitForFunction((s) => document.querySelector(s).hasAttribute('data-sg-ready'), V)
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
    name: 'Play is the 56px circle; Back, Forward and Mute share ONE height (44px) and one centre line; Tab visits them in reading order',
    async run({ page, goto, expect }) {
      await open({ page, goto })
      await ready(page)
      const r = await page.evaluate((s) => {
        const root = document.querySelector(s)
        root.scrollIntoView({ block: 'center' })
        const box = (sel) => root.querySelector(sel).getBoundingClientRect()
        const play = box('.player__play'), back = box('[data-player="back"]'), fwd = box('[data-player="forward"]'), mute = box('[data-player="mute"]')
        const mid = (b) => b.top + b.height / 2
        return { playW: play.width, playH: play.height, heights: [back.height, fwd.height, mute.height], muteW: mute.width, mids: [play, back, fwd, mute].map(mid) }
      }, A)
      expect.equal(Math.round(r.playW), 56, 'Play is the large circle')
      expect.equal(Math.round(r.playH), 56)
      for (const h of r.heights) expect.equal(Math.round(h), 44, 'every secondary control is 44px tall (skip pills too)')
      expect.equal(Math.round(r.muteW), 44, 'Mute is a 44px circle')
      expect.ok(r.mids.every((m) => Math.abs(m - r.mids[0]) < 1), `all centred on one line (${r.mids.map(Math.round)})`)
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
    name: 'the control row is ONE line at 390 and 320px, at 100% and 200% text: nothing drops under anything, every visible control on one centre line, the secondary ones one height (44px, 36 in the small layout), and every row of 176px or more keeps Back and Forward',
    async run({ page, goto, expect }) {
      await rangeMedia(page)
      for (const [w, pct] of [[390, 100], [390, 200], [320, 100], [320, 200]]) {
        await page.setViewportSize({ width: w, height: 800 })
        await goto('components/player.html')
        if (pct !== 100) await page.addStyleTag({ content: `html{font-size:${pct}%!important}` })
        await page.waitForTimeout(300) // SG.fit re-measures on the next frame after the size changes
        const rows = await page.evaluate(() => [...document.querySelectorAll('.player__row')].filter((r) => r.getBoundingClientRect().height > 0).map((row) => {
          const btns = [...row.querySelectorAll('.btn')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => ({ name: b.getAttribute('aria-label'), play: b.classList.contains('player__play'), r: b.getBoundingClientRect() }))
          const mid = (r) => r.top + r.height / 2
          const rr = row.getBoundingClientRect()
          return {
            fit: row.dataset.fit, names: btns.map((b) => b.name).join(','), w: Math.round(rr.width),
            oneLine: btns.every((b) => Math.abs(mid(b.r) - mid(btns[0].r)) < 1),
            secondary: btns.filter((b) => !b.play).map((b) => Math.round(b.r.height)),
            inside: btns.every((b) => b.r.left >= rr.left - 0.5 && b.r.right <= rr.right + 0.5),
          }
        }))
        expect.ok(rows.length >= 5, `${w}px ${pct}%: the demo rows are there`)
        for (const r of rows) {
          expect.ok(r.fit, `${w}px ${pct}%: the row was measured (data-fit)`)
          expect.ok(r.oneLine, `${w}px ${pct}%: one line in a ${r.w}px row (${r.fit}: ${r.names})`)
          expect.ok(r.inside, `${w}px ${pct}%: every control inside its ${r.w}px row (${r.fit})`)
          const want = r.fit === 'small' ? 36 : 44
          expect.ok(r.secondary.every((h) => h === want), `${w}px ${pct}%: the secondary controls share one height, ${want}px in the ${r.fit} layout (${r.secondary})`)
          if (r.w >= 176) expect.ok(/Back 5 seconds/.test(r.names) && /Forward 5 seconds/.test(r.names), `${w}px ${pct}%: a ${r.w}px row keeps Back and Forward (${r.fit})`)
        }
      }
    },
  },
  {
    name: 'a failure offers Try again: it reloads the recording, gives the controls back, and puts focus on Play',
    async run({ page, goto, expect }) {
      await open({ page, goto })
      await ready(page)
      await page.evaluate((s) => { const m = document.querySelector(s + ' .player__media'); m.src = 'data:audio/wav;base64,AAAAAAAAAAAAAAAA'; m.load() }, A)
      await page.waitForFunction((s) => document.querySelector(s).getAttribute('data-state') === 'error', A, { timeout: 6000 })
      const retry = page.locator(`${A} [data-player="retry"]`)
      expect.ok(await retry.isVisible(), 'the sentence says "try again", and there is a button that does it')
      expect.equal((await retry.textContent()).trim(), 'Try again')
      const hang = await page.evaluate((s) => {
        const st = document.querySelector(s + ' .player__status'), ic = st.querySelector('.ic'), words = st.querySelector('.ic + *')
        return { iconRight: ic.getBoundingClientRect().right, wordsLeft: words.getBoundingClientRect().left, inLive: !!st.querySelector('button') }
      }, A)
      expect.ok(hang.wordsLeft > hang.iconRight, 'the words are a column of their own beside the icon, so a second line hangs past it')
      expect.ok(!hang.inLive, 'the button is outside the live region (it is not read as part of the message)')
      // the network comes back: drop the broken src so the <source> is used again
      await page.evaluate((s) => document.querySelector(s + ' .player__media').removeAttribute('src'), A)
      await retry.focus()
      await page.keyboard.press('Enter')
      await expect.focused(page, `${A} .player__play`, 'focus moves to Play, not to the top of the page')
      await page.waitForFunction((s) => { const m = document.querySelector(s + ' .player__media'); return m.readyState >= 1 && isFinite(m.duration) }, A, { timeout: 6000 })
      const r = await page.evaluate((s) => {
        const root = document.querySelector(s)
        return { state: root.getAttribute('data-state'), play: root.querySelector('.player__play').getAttribute('aria-disabled'), seek: root.querySelector('input[type="range"]').disabled, retry: getComputedStyle(root.querySelector('[data-player="retry"]')).display }
      }, A)
      expect.equal(r.state, null, 'the failure is gone')
      expect.equal(r.play, null, 'Play is available again')
      expect.equal(r.seek, false, 'and so is the seek bar')
      expect.equal(r.retry, 'none', 'Try again hides with the failure')
    },
  },
  {
    name: 'the "Could not load" specimen is live: its recording fails for real, Try again reloads it and moves focus to Play, and the failure comes back with its sentence and button',
    async run({ page, goto, expect }) {
      await open({ page, goto })
      const S = '#states + p + p + .demo .player:has(#p5-title)'
      await page.waitForFunction((s) => { const r = document.querySelector(s); return r && r.hasAttribute('data-sg-ready') && r.getAttribute('data-state') === 'error' && !!r.querySelector('.player__status .ic') }, S, { timeout: 6000 })
      const before = await page.evaluate((s) => document.querySelector(s + ' [data-player="duration"]').textContent, S)
      expect.equal(before, '0:12', 'the markup\'s length stands while the media has none of its own')
      const retry = page.locator(`${S} [data-player="retry"]`)
      await retry.focus()
      await page.keyboard.press('Enter')
      await expect.focused(page, `${S} .player__play`, 'focus moves to Play')
      await page.waitForFunction((s) => { const r = document.querySelector(s); return r.getAttribute('data-state') === 'error' && getComputedStyle(r.querySelector('[data-player="retry"]')).display !== 'none' }, S, { timeout: 6000 })
      const r = await page.evaluate((s) => { const root = document.querySelector(s); return { status: root.querySelector('.player__status').textContent.trim(), play: root.querySelector('.player__play').getAttribute('aria-disabled') } }, S)
      expect.ok(/could not be played/.test(r.status), `it fails again and says so (${r.status})`)
      expect.equal(r.play, 'true', 'the controls are unavailable again')
    },
  },
  {
    name: 'the targets in the row are chrome: at 200% text a skip pill is hit within its own 44px, not 22px above it over the time',
    async run({ page, goto, expect }) {
      await rangeMedia(page)
      await page.setViewportSize({ width: 390, height: 800 })
      await goto('components/player.html')
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.waitForTimeout(300)
      const r = await page.evaluate((s) => {
        const b = document.querySelector(s + ' [data-player="back"]')
        b.scrollIntoView({ block: 'center' })
        const q = b.getBoundingClientRect(), cx = q.left + q.width / 2
        const at = (y) => { const t = document.elementFromPoint(cx, y); return !!(t && t.closest('[data-player="back"]')) }
        return { h: q.height, inside: at(q.top + 4), above: at(q.top - 12) }
      }, A)
      expect.equal(Math.round(r.h), 44, 'the pill is 44px tall at 200% text')
      expect.ok(r.inside, 'a tap on the pill hits it')
      expect.ok(!r.above, 'a tap 12px above it does not (its target is 44px, not 88)')
    },
  },
  {
    name: 'a video with a poster loads nothing until Play: the poster shows, the written length stands, and Play loads and plays it',
    async run({ page, goto, expect }) {
      await rangeMedia(page)
      const asked = []
      page.on('request', (r) => { if (/\.webm$/.test(r.url())) asked.push(r.url()) })
      await goto('components/player.html')
      await page.waitForTimeout(500)
      const r = await page.evaluate((s) => { const root = document.querySelector(s), m = root.querySelector('video'); return { preload: m.getAttribute('preload'), poster: !!m.poster, ready: m.readyState, len: root.querySelector('[data-player="duration"]').textContent } }, V)
      expect.equal(r.preload, 'none', 'preload="none"')
      expect.ok(r.poster && r.ready === 0, 'the poster stands in and nothing is loaded')
      expect.equal(r.len, '0:08', 'the length written in the markup stands')
      expect.equal(asked.length, 0, 'no request for the recording on load')
      const vplay = page.locator(`${V} .player__play`)
      await vplay.scrollIntoViewIfNeeded()
      await vplay.click()
      await page.waitForFunction((s) => !document.querySelector(s + ' video').paused, V, { timeout: 6000 })
      expect.ok(asked.length > 0, 'Play asks for it')
    },
  },
]
