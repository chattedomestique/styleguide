// Interaction spec for Toast (SG.toast, src/js/63-toast.js). Uses Playwright's fake clock so the
// 6-second rules are tested exactly, without waiting. Polling runs Node-side (waitForTimeout), because
// page-side polling would be frozen by the fake clock.
const PAGE = 'components/toast.html'
const VISIBLE = '.toast-region .toast:not([data-state="leaving"])'

async function boot(page, goto) {
  await page.clock.install()
  await goto(PAGE)
}
async function until(page, fn, arg, what = 'condition', tries = 60) {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(fn, arg)) return
    await page.waitForTimeout(50)
  }
  throw new Error('timed out waiting for ' + what)
}
const visibleCount = (page) => page.locator(VISIBLE).count()
async function waitVisible(page, n) {
  await until(page, ([sel, n]) => document.querySelectorAll(sel).length === n, [VISIBLE, n], `${n} visible toast(s)`)
}
const show = (page, opts) => page.evaluate((o) => { const h = SG.toast.show(o); return h && h.id }, opts)

export const tests = [
  {
    name: 'show() renders a region labelled Notifications, announces politely, never inside a live region',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await show(page, { message: 'Task saved', status: 'success' })
      await waitVisible(page, 1)
      await expect.attr(page, '.toast-region', 'aria-label', 'Notifications')
      const toast = page.locator(VISIBLE).first()
      expect.equal(await toast.evaluate((el) => !!el.closest('[aria-live],[role=status],[role=alert]')), false, 'visible toast is not a live region (Undo must not be read as prose)')
      expect.equal(await toast.getAttribute('data-tone'), 'ok', 'success is the ok tone')
      await until(page, () => document.querySelector('[data-toast-live="polite"]').textContent.includes('Success: Task saved'), null, 'polite announcement')
      expect.equal(await page.locator('[data-toast-live="assertive"]').innerText(), '', 'assertive region stays empty for non-errors')
      expect.ok(await page.locator('.toast-region').evaluate((el) => el.matches(':popover-open')), 'region is in the top layer')
    },
  },
  {
    name: 'region is pinned above the bottom edge and ignores pointer events around the toasts',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await show(page, { message: 'Copied' })
      await waitVisible(page, 1)
      const r = await page.locator('.toast-region').evaluate((el) => ({ bottom: el.getBoundingClientRect().bottom, vh: innerHeight, pe: getComputedStyle(el).pointerEvents }))
      expect.ok(r.vh - r.bottom >= 15, `bottom gap is ${r.vh - r.bottom}px, expected >= the space-4 offset`)
      expect.equal(r.pe, 'none', 'region does not intercept taps')
    },
  },
  {
    name: 'errors are assertive and never close themselves',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await show(page, { message: 'Could not save', status: 'danger' })
      await waitVisible(page, 1)
      await until(page, () => document.querySelector('[data-toast-live="assertive"]').textContent.includes('Error: Could not save'), null, 'assertive announcement')
      expect.equal(await page.locator('[data-toast-live="polite"]').innerText(), '', 'polite region is not used for errors')
      await page.clock.fastForward(120000)
      await page.waitForTimeout(300)
      expect.equal(await visibleCount(page), 1, 'error toast survives two minutes')
    },
  },
  {
    name: 'closes itself after 6 s, not before',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await show(page, { message: 'Saved', status: 'success', duration: 1000 }) // below the floor: raised to 6000
      await waitVisible(page, 1)
      await page.clock.fastForward(5500)
      await page.waitForTimeout(400)
      expect.equal(await visibleCount(page), 1, 'still visible at 5.5 s')
      await page.clock.fastForward(1500)
      await waitVisible(page, 0)
    },
  },
  {
    name: 'duration grows with message length and is clamped to 6-20 s',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      const d = await page.evaluate(() => ({ short: SG.toast.duration('Hi'), mid: SG.toast.duration('x'.repeat(91)), long: SG.toast.duration('x'.repeat(2000)) }))
      expect.equal(d.short, 6000, 'floor')
      expect.ok(d.mid > 9000 && d.mid < 11000, `91 chars -> ${d.mid}`)
      expect.equal(d.long, 20000, 'cap')
    },
  },
  {
    name: 'hover pauses the timer; leaving resumes it with at least 1.5 s left',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await show(page, { message: 'Saved', status: 'success' })
      await waitVisible(page, 1)
      await page.clock.fastForward(5000)
      await page.locator(VISIBLE).first().hover()
      await page.clock.fastForward(60000)
      await page.waitForTimeout(400)
      expect.equal(await visibleCount(page), 1, 'hovered toast does not close')
      await page.mouse.move(2, 2)
      await page.clock.fastForward(1000)
      await page.waitForTimeout(300)
      expect.equal(await visibleCount(page), 1, 'grace period after leaving')
      await page.clock.fastForward(1000)
      await waitVisible(page, 0)
    },
  },
  {
    name: 'keyboard focus inside the toast pauses the timer; blur resumes it',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await show(page, { message: 'Saved', status: 'success' })
      await waitVisible(page, 1)
      await page.locator(`${VISIBLE} .toast__close`).focus()
      await page.clock.fastForward(60000)
      await page.waitForTimeout(400)
      expect.equal(await visibleCount(page), 1, 'focused toast does not close')
      await page.evaluate(() => document.activeElement.blur())
      await page.clock.fastForward(7000)
      await waitVisible(page, 0)
    },
  },
  {
    name: 'touch-hold pauses the timer until the finger lifts',
    touch: true,
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await show(page, { message: 'Saved', status: 'success' })
      await waitVisible(page, 1)
      await page.locator(VISIBLE).first().evaluate((el) => el.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true })))
      await page.clock.fastForward(60000)
      await page.waitForTimeout(400)
      expect.equal(await visibleCount(page), 1, 'held toast does not close')
      await page.locator(VISIBLE).first().evaluate((el) => el.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'touch', bubbles: true })))
      await page.clock.fastForward(7000)
      await waitVisible(page, 0)
    },
  },
  {
    name: 'a toast with an action persists, announces the action, runs it once and dismisses',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await page.evaluate(() => { window.__acted = 0; SG.toast.show({ message: 'Message archived', status: 'success', action: { label: 'Undo', onClick: () => { window.__acted += 1 } } }) })
      await waitVisible(page, 1)
      await until(page, () => document.querySelector('[data-toast-live="polite"]').textContent.includes('Undo is available in notifications'), null, 'action announced')
      await page.clock.fastForward(120000)
      await page.waitForTimeout(300)
      expect.equal(await visibleCount(page), 1, 'action toast never times out')
      await page.locator(`${VISIBLE} .toast__action`).click()
      expect.equal(await page.evaluate(() => window.__acted), 1, 'onClick ran once')
      await waitVisible(page, 0)
    },
  },
  {
    name: 'F8 jumps to the newest toast, Esc dismisses it and focus returns to where it was',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await page.locator('#burst').focus()
      await show(page, { message: 'Needs a look', persistent: true })
      await waitVisible(page, 1)
      await expect.focused(page, '#burst', 'showing a toast never steals focus')
      await page.keyboard.press('F8')
      await expect.focused(page, '.toast__close', 'F8 focuses the toast')
      await page.keyboard.press('Escape')
      await waitVisible(page, 0)
      await expect.focused(page, '#burst', 'focus returned to the opener')
    },
  },
  {
    name: 'dismiss button is labelled, is a circle Button with a 44x44 hit area, and closes the toast',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await show(page, { message: 'Saved', status: 'success' })
      await waitVisible(page, 1)
      const close = page.locator(`${VISIBLE} .toast__close`)
      expect.equal(await close.getAttribute('aria-label'), 'Dismiss notification')
      expect.equal(await close.getAttribute('data-shape'), 'circle')
      expect.ok(await close.evaluate((el) => el.classList.contains('btn')), 'it is the Button element')
      const hit = await close.evaluate((el) => {
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2
        const at = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)) }
        return { h: r.height, left: at(cx - 21.5, cy), right: at(cx + 21.5, cy), up: at(cx, cy - 21.5), down: at(cx, cy + 21.5) }
      })
      expect.ok(hit.left && hit.right && hit.up && hit.down, 'the hit area reaches 44px each way')
      const box = await close.boundingBox()
      expect.ok(Math.abs(box.width - box.height) < 1, `drawn ${box.width}x${box.height}: a circle, not an oval`)
      await close.click()
      await waitVisible(page, 0)
    },
  },
  {
    name: 'at most three are visible; the newest wins; persistent toasts queue instead of being lost',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      for (const m of ['One', 'Two', 'Three', 'Four', 'Five']) await show(page, { message: m })
      await until(page, (sel) => document.querySelectorAll(sel).length === 3 && [...document.querySelectorAll(sel)].map((e) => e.textContent.trim()).join('|') === 'Three|Four|Five', VISIBLE, 'three newest')
      await page.evaluate(() => SG.toast.clear())
      await waitVisible(page, 0)
      for (const m of ['E1', 'E2', 'E3', 'E4']) await show(page, { message: m, status: 'danger' })
      await waitVisible(page, 3)
      expect.ok(!(await page.locator(VISIBLE).allInnerTexts()).join(' ').includes('E4'), 'fourth persistent toast is queued, not shown')
      await page.locator(`${VISIBLE} .toast__close`).first().click()
      await until(page, (sel) => document.querySelectorAll(sel).length === 3 && document.querySelector('.toast-region').textContent.includes('E4'), VISIBLE, 'queued toast takes the free slot')
    },
  },
  {
    name: 'same id updates in place; identical text is extended, not duplicated',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await show(page, { id: 'sync', message: 'Saving' })
      await show(page, { id: 'sync', message: 'Saved', status: 'success' })
      await waitVisible(page, 1)
      expect.ok((await page.locator(VISIBLE).first().innerText()).includes('Saved'), 'text replaced')
      await page.evaluate(() => SG.toast.clear())
      await waitVisible(page, 0)
      await show(page, { message: 'Copied' })
      await show(page, { message: 'Copied' })
      await waitVisible(page, 1)
    },
  },
  {
    name: 'messages are text, never HTML',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await show(page, { message: '<img src=x onerror="window.__xss=1"> hi' })
      await waitVisible(page, 1)
      expect.equal(await page.locator(`${VISIBLE} img`).count(), 0, 'no element was created from the message')
      expect.equal(await page.evaluate(() => window.__xss), undefined, 'no handler ran')
    },
  },
  {
    name: 'SG.announce writes to a polite status region; assertive goes to the alert region; repeats are re-announced',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.evaluate(() => SG.announce('Saved'))
      await until(page, () => document.querySelector('div.sr-only[role="status"]')?.textContent === 'Saved', null, 'status text')
      await page.evaluate(() => SG.announce('Saved')) // same text again
      await until(page, () => document.querySelector('div.sr-only[role="status"]')?.textContent === 'Saved', null, 'status text again')
      await page.evaluate(() => SG.announce('Could not save', { assertive: true }))
      await until(page, () => document.querySelector('div.sr-only[role="alert"]')?.textContent === 'Could not save', null, 'alert text')
      expect.equal(await page.locator('div.sr-only[role="status"]').getAttribute('aria-live'), 'polite')
      expect.equal(await page.locator('div.sr-only[role="alert"]').getAttribute('aria-live'), 'assertive')
    },
  },
  {
    name: 'data-sg-toast triggers: the action button fires sg:toast-action on the trigger',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      await page.locator('#archive-btn').click()
      await until(page, (sel) => document.querySelectorAll(sel).length === 1, VISIBLE, 'toast from trigger')
      expect.equal(await page.locator('#undo-state').innerText(), 'Archived')
      await page.locator(`${VISIBLE} .toast__action`).click()
      await until(page, () => document.getElementById('undo-state').textContent === 'In your library', null, 'undo handled')
    },
  },
  {
    name: 'the plain toast is ink with paper text; statuses take their tone and icon; none has a shadow, all have the 2px frame',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await show(page, { message: 'Plain one' })
      await show(page, { message: 'Good', status: 'success' })
      await show(page, { message: 'Heads up', status: 'warning' })
      await waitVisible(page, 3)
      const r = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((t) => {
        const cs = getComputedStyle(t)
        return { tone: t.dataset.tone, shadow: cs.boxShadow, border: cs.borderTopWidth + ' ' + cs.borderTopStyle, bg: SG.colorToHex(cs.backgroundColor), fg: SG.colorToHex(cs.color), icon: t.querySelector('.toast__icon') ? [...t.querySelector('.toast__icon').classList].find((c) => c.startsWith('ic--')) : null, ink: SG.tokenToHex('--ink'), paper: SG.tokenToHex('--paper') }
      }), VISIBLE)
      expect.equal(r.map((x) => x.tone).join(','), 'ink,ok,warn')
      for (const x of r) {
        expect.equal(x.shadow, 'none', 'a toast is not pressable: no shadow')
        expect.equal(x.border, '2px solid')
      }
      expect.equal(r[0].bg, r[0].ink, 'plain toast is filled with ink')
      expect.equal(r[0].fg, r[0].paper, 'and its text is paper')
      expect.equal(r[0].icon, null, 'no status, no icon')
      expect.equal(new Set([r[1].icon, r[2].icon]).size, 2, 'statuses have different icon shapes: ' + r[1].icon + ', ' + r[2].icon)
    },
  },
  {
    name: 'text is at least 7:1 on the plain and every status toast, in light and dark, every palette and contrast setting',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      for (const st of [undefined, 'success', 'info', 'warning', 'danger']) await show(page, { message: 'Message ' + (st || 'plain'), status: st, persistent: true })
      await page.evaluate(() => SG.toast.config.max = 9)
      await until(page, (sel) => document.querySelectorAll(sel).length >= 3, VISIBLE, 'toasts shown')
      const out = await page.evaluate((sel) => {
        const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
        const root = document.documentElement
        const fails = []
        let n = 0
        for (const theme of ['light', 'dark']) for (const palette of ['default', 'periwinkle', 'mint', 'sand', 'cream', 'wire']) for (const contrast of [null, 'more']) {
          root.setAttribute('data-theme', theme)
          if (palette === 'default') root.removeAttribute('data-palette'); else root.setAttribute('data-palette', palette)
          if (contrast) root.setAttribute('data-contrast', contrast); else root.removeAttribute('data-contrast')
          for (const t of document.querySelectorAll(sel)) {
            n++
            const k = ratio(SG.colorToHex(getComputedStyle(t.querySelector('.toast__msg')).color), SG.colorToHex(getComputedStyle(t).backgroundColor))
            if (k < 7) fails.push(`${theme}/${palette}/${contrast || 'normal'} ${t.dataset.tone}: ${k.toFixed(2)}`)
          }
        }
        return { fails, n }
      }, VISIBLE)
      expect.ok(out.n >= 72, 'combinations measured: ' + out.n)
      expect.equal(out.fails.slice(0, 5).join(' | '), '', 'below 7:1')
    },
  },
  {
    name: 'the focus ring follows the surface: paper on the plain (ink) toast, the page ring on a status tone',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await show(page, { message: 'Plain', persistent: true })
      await show(page, { message: 'Good', status: 'success', persistent: true })
      await waitVisible(page, 2)
      await page.keyboard.press('Tab')
      const ring = async (idx) => {
        await page.locator(`${VISIBLE} .toast__close`).nth(idx).focus()
        await page.keyboard.press('Shift+Tab')
        await page.keyboard.press('Tab')
        return page.evaluate(() => { const e = document.activeElement; return { ring: SG.colorToHex(getComputedStyle(e).outlineColor), w: getComputedStyle(e).outlineWidth, ink: SG.tokenToHex('--ink'), paper: SG.tokenToHex('--paper') } })
      }
      const plain = await ring(0)
      expect.equal(plain.w, '3px')
      expect.equal(plain.ring, plain.paper, 'ring is paper on the ink toast')
      const tone = await ring(1)
      expect.equal(tone.ring, tone.ink, 'ring is ink on a status tone')
    },
  },
  {
    name: 'narrow list: a toast with an action puts the action under the message; wide list keeps one row',
    async run({ page, goto, expect }) {
      await boot(page, goto)
      await page.evaluate(() => { SG.toast.show({ message: 'Deck archived', status: 'success', action: { label: 'Undo', onClick: () => {} } }) })
      await waitVisible(page, 1)
      const narrow = await page.locator(VISIBLE).first().evaluate((el) => ({ msgBottom: el.querySelector('.toast__msg').getBoundingClientRect().bottom, actTop: el.querySelector('.toast__action').getBoundingClientRect().top }))
      expect.ok(narrow.actTop >= narrow.msgBottom - 1, `390px wide: action (${narrow.actTop}) is below the message (${narrow.msgBottom})`)
      await page.setViewportSize({ width: 1024, height: 800 })
      await page.waitForTimeout(150)
      const wide = await page.locator(VISIBLE).first().evaluate((el) => ({ msg: el.querySelector('.toast__msg').getBoundingClientRect(), act: el.querySelector('.toast__action').getBoundingClientRect() }))
      expect.ok(wide.act.top < wide.msg.bottom && wide.act.bottom > wide.msg.top, 'wide: message and action share a row')
    },
  },
  {
    name: 'static toasts close with data-sg-dismiss, and focus moves to the next control rather than <body>',
    async run({ page, goto, expect }) {
      await goto(PAGE)
      const close = page.locator('#static ~ .demo .toast[data-tone="ok"] .toast__close').first()
      await close.focus()
      await page.keyboard.press('Enter')
      expect.equal(await page.locator('#static ~ .demo .toast[data-tone="ok"]').first().getAttribute('hidden') !== null, true, 'hidden')
      const onBody = await page.evaluate(() => document.activeElement === document.body)
      expect.ok(!onBody, 'focus was not dropped on <body>')
    },
  },
  {
    name: 'reduced motion: no travel (--move is 0), fade only',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await boot(page, goto)
      expect.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--move').trim()), '0')
      await show(page, { message: 'Saved', status: 'success' })
      await waitVisible(page, 1)
      await page.locator(`${VISIBLE} .toast__close`).click()
      const t = await page.locator('.toast-region .toast[data-state="leaving"]').evaluate((el) => getComputedStyle(el).transform).catch(() => 'none')
      expect.ok(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)', `leaving toast does not translate (got ${t})`)
    },
  },
]
