// Tabs: WAI-ARIA APG "Tabs" pattern. Every test presses real keys in Chromium and reads back
// focus, aria-selected, tabindex and panel visibility, plus the --lift / --fill numbers.
const tab = (id) => `#tabs-${id}`

async function state(page, listSel) {
  return page.evaluate((sel) => {
    const list = document.querySelector(sel)
    const tabs = [...list.querySelectorAll('[role="tab"]')]
    return tabs.map((t) => {
      const p = document.getElementById(t.getAttribute('aria-controls'))
      return { id: t.id, selected: t.getAttribute('aria-selected'), tabindex: t.getAttribute('tabindex'), panelHidden: p ? p.hidden : null, focused: document.activeElement === t }
    })
  }, listSel)
}

export const tests = [
  {
    name: 'Initial state is valid ARIA: one selected tab, roving tabindex, only its panel visible',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      const s = await state(page, '[aria-label="Wallet view"]')
      expect.equal(s.filter((t) => t.selected === 'true').length, 1, 'exactly one selected tab')
      expect.equal(s.filter((t) => t.tabindex === '0').length, 1, 'exactly one tab in the Tab order')
      expect.equal(s[0].tabindex, '0', 'the selected tab is the tab stop')
      expect.equal(s[0].panelHidden, false, 'selected panel shown')
      expect.equal(s[1].panelHidden, true, 'other panel hidden')
      const named = await page.evaluate(() => [...document.querySelectorAll('[role="tabpanel"]')].every((p) => document.getElementById(p.getAttribute('aria-labelledby'))))
      expect.ok(named, 'every panel is named by its tab')
    },
  },
  {
    name: 'Tab lands on the selected tab, the next Tab goes into the panel, Shift+Tab comes back',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      await page.locator(tab('ul-t1')).focus()
      await page.keyboard.press('Tab')
      await expect.focused(page, '#tabs-ul-p1', 'Tab skips the other tabs (tabindex -1) and lands in the open panel')
      await page.keyboard.press('Shift+Tab')
      await expect.focused(page, '#tabs-ul-t1', 'Shift+Tab returns to the selected tab')
    },
  },
  {
    name: 'ArrowRight / ArrowLeft move focus AND select (automatic activation), wrapping',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      await page.locator(tab('ul-t1')).focus()
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, '#tabs-ul-t2')
      await expect.attr(page, '#tabs-ul-t2', 'aria-selected', 'true')
      await expect.attr(page, '#tabs-ul-t1', 'aria-selected', 'false')
      await expect.attr(page, '#tabs-ul-t2', 'tabindex', '0')
      await expect.attr(page, '#tabs-ul-t1', 'tabindex', '-1')
      expect.ok(await page.locator('#tabs-ul-p2').isVisible(), 'panel 2 is shown')
      expect.ok(!(await page.locator('#tabs-ul-p1').isVisible()), 'panel 1 is hidden')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, '#tabs-ul-t1', 'ArrowRight wraps from last to first')
      await page.keyboard.press('ArrowLeft')
      await expect.focused(page, '#tabs-ul-t3', 'ArrowLeft wraps from first to last')
      expect.ok(await page.locator('#tabs-ul-p3').isVisible(), 'panel 3 shown after wrapping')
    },
  },
  {
    name: 'Home and End jump to the first and last tab',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      await page.locator(tab('ul-t2')).focus()
      await page.keyboard.press('End')
      await expect.focused(page, '#tabs-ul-t3')
      await expect.attr(page, '#tabs-ul-t3', 'aria-selected', 'true')
      await page.keyboard.press('Home')
      await expect.focused(page, '#tabs-ul-t1')
      await expect.attr(page, '#tabs-ul-t1', 'aria-selected', 'true')
    },
  },
  {
    name: 'Clicking a tab selects it and updates the panels',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      await page.locator(tab('pill-t2')).click()
      await expect.attr(page, '#tabs-pill-t2', 'aria-selected', 'true')
      expect.ok(await page.locator('#tabs-pill-p2').isVisible(), 'panel shown')
      expect.ok(!(await page.locator('#tabs-pill-p1').isVisible()), 'old panel hidden')
    },
  },
  {
    name: 'Vertical tablist uses Up/Down and ignores Left/Right',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      await page.locator(tab('v-t1')).focus()
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, '#tabs-v-t1', 'ArrowRight does nothing in a vertical list')
      await page.keyboard.press('ArrowDown')
      await expect.focused(page, '#tabs-v-t2')
      await expect.attr(page, '#tabs-v-t2', 'aria-selected', 'true')
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('ArrowUp')
      await expect.focused(page, '#tabs-v-t4', 'ArrowUp wraps to the last tab')
    },
  },
  {
    name: 'Right-to-left: ArrowLeft moves to the NEXT tab and ArrowRight to the previous (mirrored)',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'))
      await page.locator(tab('ul-t1')).focus()
      await page.keyboard.press('ArrowLeft')
      await expect.focused(page, '#tabs-ul-t2', 'ArrowLeft goes forward in a right-to-left page')
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, '#tabs-ul-t1', 'ArrowRight goes back')
    },
  },
  {
    name: 'Manual activation: arrows move focus only, Enter and Space select',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      await page.locator(tab('m-t1')).focus()
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, '#tabs-m-t2')
      await expect.attr(page, '#tabs-m-t2', 'aria-selected', 'false', 'focus moved but nothing is selected yet')
      expect.ok(await page.locator('#tabs-m-p1').isVisible(), 'the first panel is still shown')
      await page.keyboard.press('Enter')
      await expect.attr(page, '#tabs-m-t2', 'aria-selected', 'true')
      expect.ok(await page.locator('#tabs-m-p2').isVisible(), 'Enter opened the panel')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('Space')
      await expect.attr(page, '#tabs-m-t3', 'aria-selected', 'true')
    },
  },
  {
    name: 'An unavailable tab is skipped by the arrow keys and by End; it cannot be chosen by click or key',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      await page.locator(tab('st-t5')).focus()
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, '#tabs-st-t1', 'ArrowRight skips the unavailable tab and wraps')
      await page.keyboard.press('End')
      await expect.focused(page, '#tabs-st-t5', 'End goes to the last ENABLED tab')
      await page.locator(tab('st-t6')).focus()
      await page.keyboard.press('Enter')
      await expect.attr(page, '#tabs-st-t6', 'aria-selected', 'false', 'Enter does nothing on an unavailable tab')
    },
  },
  {
    name: 'In an overflowing list the focused tab is always scrolled fully into view',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      await page.locator(tab('ov-t1')).focus()
      const list = '[aria-label="Finance sections"]'
      const seen = []
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(30)
        seen.push(await page.evaluate((sel) => {
          const l = document.querySelector(sel).getBoundingClientRect()
          const t = document.activeElement.getBoundingClientRect()
          return { inside: t.left >= l.left - 1 && t.right <= l.right + 1, id: document.activeElement.id, scrollable: document.querySelector(sel).scrollWidth > document.querySelector(sel).clientWidth }
        }, list))
      }
      expect.ok(seen[0].scrollable, 'the demo list really overflows at 390px')
      expect.ok(seen.every((s) => s.inside), 'every focused tab is fully inside the list: ' + JSON.stringify(seen.filter((s) => !s.inside)))
      expect.equal(seen[5].id, 'tabs-ov-t7', 'reached the last tab')
    },
  },
  {
    name: 'data-hash: choosing a tab writes the panel id to the hash without adding history',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      const before = await page.evaluate(() => history.length)
      await page.locator(tab('h-t2')).click()
      expect.equal(await page.evaluate(() => location.hash), '#tabs-h-p2', 'hash follows the panel id')
      expect.equal(await page.evaluate(() => history.length), before, 'replaceState: history length unchanged')
    },
  },
  {
    name: 'A URL hash opens the right tab, including a hash that targets content inside a panel',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html#tabs-h-fees')
      await expect.attr(page, '#tabs-h-t2', 'aria-selected', 'true', 'the tab whose panel contains #tabs-h-fees is open')
      expect.ok(await page.locator('#tabs-h-p2').isVisible(), 'panel visible')
      await goto('components/tabs.html#tabs-h-t2')
      await expect.attr(page, '#tabs-h-t2', 'aria-selected', 'true', 'a hash naming the tab itself works too')
      // A link inside the panel that points at another panel switches tabs (hashchange).
      await page.locator('#tabs-h-p2 a').click()
      await expect.attr(page, '#tabs-h-t1', 'aria-selected', 'true', 'in-page link to another panel selects it')
    },
  },
  {
    name: 'sg:tab event bubbles with the tab, panel and index; SG.tabs.select works in code',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      await page.evaluate(() => { window.__ev = []; document.addEventListener('sg:tab', (e) => window.__ev.push({ id: e.detail.tab.id, panel: e.detail.panel.id, index: e.detail.index, prev: e.detail.previous && e.detail.previous.id })) })
      await page.locator(tab('ul-t1')).focus()
      await page.keyboard.press('ArrowRight')
      await page.evaluate(() => SG.tabs.select(document.getElementById('tabs-ul-t3')))
      const ev = await page.evaluate(() => window.__ev)
      expect.equal(ev.length, 2, 'two changes, two events')
      expect.equal(JSON.stringify(ev[0]), JSON.stringify({ id: 'tabs-ul-t2', panel: 'tabs-ul-p2', index: 1, prev: 'tabs-ul-t1' }))
      expect.equal(ev[1].id, 'tabs-ul-t3', 'programmatic select emits too')
    },
  },
  {
    name: 'Pill tab: hover and keyboard focus raise it (--lift 1) without the fill, pressing sinks it with a light tint, rest is flat',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      const t = page.locator(tab('pill-t3'))
      const nums = () => t.evaluate((el) => ({ lift: Number(getComputedStyle(el).getPropertyValue('--lift')), fill: Number(getComputedStyle(el).getPropertyValue('--fill')), shadow: getComputedStyle(el).boxShadow }))
      await page.waitForTimeout(50)
      const rest = await nums()
      expect.equal(rest.lift, 0, 'rest: --lift 0')
      expect.equal(rest.fill, 0, 'rest: --fill 0 (an outline)')
      await t.hover()
      await page.waitForTimeout(400)
      const hover = await nums()
      expect.equal(hover.lift, 1, 'hover: --lift 1')
      expect.equal(hover.fill, 0, 'hover: --fill 0 (the solid fill means chosen; a hovered tab is not chosen)')
      expect.ok(/4px 4px 0px 0px/.test(hover.shadow), 'the hard shadow is 4px with zero blur: ' + hover.shadow)
      await page.mouse.down()
      await page.waitForTimeout(400)
      const down = await nums()
      expect.equal(down.lift, 0, 'pressed: back onto the surface')
      expect.ok(down.fill > 0.1 && down.fill < 0.2, 'pressed: a light tint, not the chosen fill: ' + down.fill)
      await page.mouse.up() // a click: it also chooses tab 3
      await page.waitForTimeout(400)
      const chosen = await nums()
      expect.equal(chosen.fill, 1, 'chosen: filled'); expect.equal(chosen.lift, 1, 'and, still hovered, raised')
      expect.ok(/6px 6px 0px 0px/.test(chosen.shadow) && /0px 0px 0px 2px(?! inset)/.test(chosen.shadow), 'a raised chosen tab opens a surface-coloured gap before its shadow, so the ink pill does not fuse with it: ' + chosen.shadow)
      await page.mouse.move(0, 0)
      await goto('components/tabs.html')
      await page.locator(tab('pill-t1')).focus()
      await page.keyboard.press('Tab') // into the panel, then back, so keyboard modality is on
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('ArrowRight') // focus + select tab 2
      await page.waitForTimeout(400)
      const focus = await page.locator(tab('pill-t2')).evaluate((el) => ({ lift: Number(getComputedStyle(el).getPropertyValue('--lift')), ring: getComputedStyle(el).outlineStyle, w: parseFloat(getComputedStyle(el).outlineWidth) }))
      expect.equal(focus.lift, 1, 'keyboard focus: same lift as hover')
      expect.equal(focus.ring, 'solid', 'and the focus ring is drawn')
      expect.ok(focus.w >= 3, 'ring is 3px')
    },
  },
  {
    name: 'The chosen pill is filled AND its frame doubles (inside, so it is the size of its neighbours); an unchosen one is neither',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      await page.mouse.move(0, 0)
      const r = await page.evaluate(() => [...document.querySelectorAll('[aria-label="Wallet view"] .tabs__tab')].map((t) => {
        const cs = getComputedStyle(t)
        return { sel: t.getAttribute('aria-selected'), fill: Number(cs.getPropertyValue('--fill')), shadow: cs.boxShadow, bg: cs.backgroundColor }
      }))
      const on = r.find((t) => t.sel === 'true'); const off = r.find((t) => t.sel === 'false')
      expect.equal(on.fill, 1, 'chosen: filled')
      expect.ok(/0px 0px 0px 2px inset/.test(on.shadow), 'chosen: a 2px ring inside the frame: ' + on.shadow)
      expect.ok(!/0px 0px 0px [1-9][\d.]*px(?! inset)/.test(on.shadow), 'chosen: nothing drawn outside the frame at rest: ' + on.shadow)
      expect.equal(off.fill, 0, 'unchosen: outline')
      expect.ok(!/0px 0px 0px 2px/.test(off.shadow), 'unchosen: single frame')
      expect.ok(on.bg !== off.bg, 'and the fills differ')
    },
  },
  {
    name: 'Underline: the chosen tab has a 2px bar, a hovered one a 1px bar, the others none',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      const bar = (id) => page.locator(tab(id)).evaluate((el) => { const b = getComputedStyle(el, '::before'); return { h: parseFloat(b.height), o: Number(b.opacity) } })
      await page.mouse.move(0, 0)
      await page.waitForTimeout(300)
      const sel = await bar('ul-t1'); const off = await bar('ul-t2')
      expect.equal(sel.h, 2, 'chosen bar is --bw (2px)'); expect.equal(sel.o, 1, 'chosen bar is opaque')
      expect.equal(off.o, 0, 'unchosen bar is invisible')
      await page.locator(tab('ul-t2')).hover()
      await page.waitForTimeout(400)
      const hov = await bar('ul-t2')
      expect.equal(hov.h, 1, 'hover bar is --bw-thin (1px)'); expect.equal(hov.o, 1)
      const shadow = await page.locator(tab('ul-t2')).evaluate((el) => getComputedStyle(el).boxShadow)
      expect.ok(shadow === 'none' || /0px 0px 0px 0px/.test(shadow), 'the flat variant casts no shadow: ' + shadow)
    },
  },
  {
    name: 'Reduced motion: no lift travel on a tab, no panel travel; the shadow and the press tint still show',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      const t = page.locator(tab('pill-t3'))
      await t.hover()
      await page.waitForTimeout(500)
      const r = await t.evaluate((el) => ({ t: getComputedStyle(el).transform, lift: Number(getComputedStyle(el).getPropertyValue('--lift')), shadow: getComputedStyle(el).boxShadow }))
      expect.ok(r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)', `no movement under reduced motion (got ${r.t})`)
      expect.equal(r.lift, 1, 'still raised'); expect.ok(/4px 4px 0px 0px/.test(r.shadow), 'the hard shadow still shows: ' + r.shadow)
      await page.mouse.down()
      await page.waitForTimeout(300)
      const f = await t.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--fill')))
      expect.ok(f > 0.1 && f < 0.2, 'the press tint still shows: ' + f)
      await page.mouse.up()
      const kf = await page.evaluate(() => { const p = document.querySelector('#tabs-pill-p1'); p.setAttribute('data-enter', ''); return getComputedStyle(p).animationName })
      expect.equal(kf, 'tabs-enter', 'the panel still fades in')
    },
  },
  {
    name: 'Tabs meet the 44px target (including the hit area) in every size',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('.tabs__tab')].filter((t) => t.getBoundingClientRect().width && t.offsetParent).map((t) => {
        const b = t.getBoundingClientRect(); const a = getComputedStyle(t, '::after')
        return { id: t.id, h: Math.max(b.height, parseFloat(a.height) || 0), w: Math.max(b.width, parseFloat(a.width) || 0) }
      }))
      expect.ok(r.length > 20, 'found the demo tabs')
      expect.ok(r.every((t) => t.h >= 43.5 && t.w >= 43.5), 'all tabs are at least 44x44 including the hit area: ' + JSON.stringify(r.filter((t) => t.h < 43.5 || t.w < 43.5)))
    },
  },
  {
    name: 'The States demo can show focus: the forced .is-focus tab draws the same ring (outline and halo) as a keyboard-focused one',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      const read = () => page.evaluate(() => { const cs = getComputedStyle(document.getElementById('tabs-st-t3')); return { w: cs.outlineWidth, st: cs.outlineStyle, off: cs.outlineOffset, shadow: cs.boxShadow, lift: cs.getPropertyValue('--lift').trim() } })
      await page.locator('#tabs-st-t3').scrollIntoViewIfNeeded()
      await page.waitForTimeout(450)
      const forced = await read()
      expect.equal(forced.st, 'solid', 'a ring is drawn'); expect.equal(forced.w, '3px', 'the 3px ring'); expect.ok(/0px 0px 0px 3px/.test(forced.shadow), 'with its halo: ' + forced.shadow)
      await page.evaluate(() => { document.getElementById('tabs-st-t3').classList.remove('is-focus') })
      await page.keyboard.press('Tab')
      await page.locator('#tabs-st-t3').focus()
      await page.waitForTimeout(450)
      const real = await read()
      expect.equal(JSON.stringify(forced), JSON.stringify(real), 'forced and real focus look the same')
    },
  },
  {
    name: 'Overflow: no fence line; the scroll buttons show while the list overflows, dim at the end they cannot pass, scroll it, and are not tab stops',
    viewport: { width: 320, height: 700 },
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      const BAR = '#overflow + p + .demo .tabs__bar'
      const read = () => page.locator(BAR).evaluate((bar) => {
        const el = bar.querySelector('.tabs__list'); const [back, fwd] = [...bar.querySelectorAll('.tabs__scroll')]
        return { more: el.getAttribute('data-more'), shadow: getComputedStyle(el).boxShadow, over: el.scrollWidth > el.clientWidth + 1, pos: el.scrollLeft,
          back: { hidden: back.hidden, dis: back.getAttribute('aria-disabled'), ti: back.tabIndex }, fwd: { hidden: fwd.hidden, dis: fwd.getAttribute('aria-disabled'), ti: fwd.tabIndex } }
      })
      await page.locator(BAR).scrollIntoViewIfNeeded()
      const a = await read()
      expect.ok(a.over, 'seven tabs overflow a 320px phone')
      expect.equal(a.more, 'end', 'at the start only the end hides tabs (data-more is still kept)')
      expect.ok(!/inset/.test(a.shadow), 'no 1px rule on the edge (it read as a fence beside a cut tab): ' + a.shadow)
      expect.ok(!a.back.hidden && !a.fwd.hidden, 'both scroll buttons show while the list overflows')
      expect.equal(a.back.dis, 'true', 'back is dimmed at the start (it keeps its place, so the row does not jump)'); expect.equal(a.fwd.dis, null, 'forward is live')
      expect.ok(a.back.ti === -1 && a.fwd.ti === -1, 'not tab stops: the tablist stays one tab stop')
      await page.locator(BAR + ' .tabs__scroll[data-dir="forward"]').click()
      await page.waitForTimeout(150)
      const b = await read()
      expect.ok(b.pos > 100, 'forward scrolls most of a width: ' + b.pos)
      expect.equal(b.more, 'start end', 'in the middle both edges hide tabs'); expect.equal(b.back.dis, null, 'back is live now')
      await page.locator(BAR + ' .tabs__list').evaluate((el) => { el.scrollLeft = el.scrollWidth })
      await page.waitForTimeout(150)
      const c = await read()
      expect.equal(c.more, 'start', 'at the end only the start does'); expect.equal(c.fwd.dis, 'true', 'forward is dimmed at the end')
      await page.locator(BAR + ' .tabs__scroll[data-dir="back"]').click()
      await page.waitForTimeout(150)
      expect.ok((await read()).pos < c.pos, 'back scrolls back')
      const fits = await page.evaluate(() => [...document.querySelectorAll('.tabs__list[role="tablist"]:not([aria-orientation="vertical"])')].filter((l) => l.scrollWidth <= l.clientWidth + 1).every((l) => !l.hasAttribute('data-more') && [...l.parentElement.querySelectorAll(':scope > .tabs__scroll')].every((x) => x.hidden)))
      expect.ok(fits, 'a list that fits has no cue and no scroll buttons')
    },
  },
  {
    name: 'One bar, one height: the tabs, the scroll buttons and the action share the drawn height at 100% and 200% text, centred on one row',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      for (const text of [100, 200]) {
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(300)
        const bars = await page.evaluate(() => [...document.querySelectorAll('.tabs__bar')].filter((b) => !b.querySelector('[aria-orientation="vertical"]') && !b.closest('[data-overflow="wrap"]')).map((bar) => {
          const list = bar.querySelector('.tabs__list'); const lr = list.getBoundingClientRect()
          const tabs = [...list.querySelectorAll('.tabs__tab')].filter((t) => { const r = t.getBoundingClientRect(); return r.right > lr.left && r.left < lr.right })
          const ctrls = [...tabs, ...[...bar.children].filter((k) => k.classList.contains('btn') && !k.hidden)].map((k) => k.getBoundingClientRect())
          return { label: list.getAttribute('aria-label'), heights: [...new Set(ctrls.map((r) => Math.round(r.height)))], rows: new Set(ctrls.map((r) => Math.round(r.top + r.height / 2))).size }
        }))
        const bad = bars.filter((b) => b.heights.length !== 1 || b.rows !== 1)
        expect.ok(bars.length >= 8, 'found the horizontal bars (the wrapping States specimen is not a bar)')
        expect.ok(!bad.length, text + '%: every control in a bar has one drawn height and sits on one row: ' + JSON.stringify(bad))
        const action = bars.find((b) => b.label === 'Tasks')
        expect.equal(action.heights[0], text === 100 ? 36 : 48, text + '%: the small bar (tabs, scroll buttons and action) is 36px, and grows with the words at large text')
      }
    },
  },
  {
    name: 'Pages: beside the scroll buttons every press of forward or back lands on whole tabs, the first at the list\'s start, at 390, 320 and 200% text',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      const look = (sel) => page.locator(sel).evaluate((demo) => {
        const list = demo.querySelector('.tabs__list'); const lr = list.getBoundingClientRect(); const pad = parseFloat(getComputedStyle(list).paddingLeft)
        const seen = [...list.querySelectorAll('.tabs__tab')].map((t) => ({ n: t.textContent.trim(), r: t.getBoundingClientRect() })).filter((t) => t.r.right > lr.left + 0.5 && t.r.left < lr.right - 0.5)
        const fwd = demo.querySelector('.tabs__scroll[data-dir="forward"]'); const back = demo.querySelector('.tabs__scroll[data-dir="back"]')
        return { names: seen.map((t) => t.n), cut: seen.filter((t) => t.r.left < lr.left + pad - 0.5 || t.r.right > lr.right - pad + 0.5).map((t) => t.n), start: seen.length ? Math.round(seen[0].r.left - lr.left - pad) : null, fwdEnd: fwd.getAttribute('aria-disabled') === 'true', backEnd: back.getAttribute('aria-disabled') === 'true', hidden: fwd.hidden }
      })
      for (const [w, text] of [[390, 100], [320, 100], [390, 200]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await goto('components/tabs.html')
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(400)
        for (const sel of ['#overflow + p + .demo', '#action + p + .demo']) {
          const tag = `${w}px ${text}% ${sel.slice(1, sel.indexOf(' '))}`
          let r = await look(sel)
          if (r.hidden) { expect.ok(sel === '#action + p + .demo' && text === 100, tag + ': only the small bar fits at normal text'); continue }
          const visited = [r.names.join(' ')]
          expect.ok(r.backEnd && !r.cut.length && r.start === 0, tag + ': at rest, whole tabs from the start: ' + JSON.stringify(r))
          for (let i = 0; i < 9 && !r.fwdEnd; i++) {
            await page.locator(sel + ' .tabs__scroll[data-dir="forward"]').click()
            await page.waitForTimeout(120)
            r = await look(sel)
            visited.push(r.names.join(' '))
            expect.ok(r.names.length >= 1 && !r.cut.length && r.start === 0, tag + ' forward ' + (i + 1) + ': every tab in view is whole and the first starts at the list\'s start: ' + JSON.stringify(r))
          }
          expect.ok(r.fwdEnd, tag + ': forward reaches the last page')
          const all = await page.locator(sel + ' .tabs__list').evaluate((l) => [...l.querySelectorAll('.tabs__tab')].map((t) => t.textContent.trim()))
          expect.equal(visited.join(' ').split(' ').filter(Boolean).join(' '), all.join(' '), tag + ': the pages show every tab once, in order')
          for (let i = 0; i < 9 && !r.backEnd; i++) {
            await page.locator(sel + ' .tabs__scroll[data-dir="back"]').click()
            await page.waitForTimeout(120)
            r = await look(sel)
            expect.ok(!r.cut.length && r.start === 0, tag + ' back ' + (i + 1) + ': whole tabs again: ' + JSON.stringify(r))
          }
          expect.equal(r.names.join(' '), visited[0], tag + ': back returns to the first page')
        }
      }
    },
  },
  {
    name: 'A row without scroll buttons runs to the stage edge and, at rest, cuts its last tab near the middle (never a sliver, never only its end), or fits it whole',
    async run({ page, goto, expect }) {
      for (const [w, text] of [[390, 100], [320, 100], [390, 200]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await goto('components/tabs.html')
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(400)
        const rows = await page.evaluate(() => ['#pill', '#underline', '#manual', '#hash'].map((id) => {
          const list = document.querySelector(id + ' + p + .demo .tabs__list'); const lr = list.getBoundingClientRect(); const st = list.closest('.demo__stage').getBoundingClientRect()
          const pad = parseFloat(getComputedStyle(list).paddingRight)
          const shown = [...list.querySelectorAll('.tabs__tab')].map((t) => { const r = t.getBoundingClientRect(); return { n: t.textContent.trim(), v: Math.max(0, Math.min(r.right, lr.right) - Math.max(r.left, lr.left)), w: r.width, end: r.right } }).filter((t) => t.v > 0)
          const last = shown[shown.length - 1]
          return { id, edge: Math.round(st.right - lr.right), over: list.scrollWidth > list.clientWidth + 1, last: last.n, frac: Math.round(last.v / last.w * 100) / 100, v: Math.round(last.v), clear: Math.round(lr.right - pad - last.end) }
        }))
        for (const r of rows) {
          const tag = `${w}px ${text}% ${r.id}`
          expect.equal(r.edge, 0, tag + ': the row runs to the stage edge')
          if (r.frac >= 0.999) expect.ok(r.clear >= -0.5, tag + ': a row that fits keeps its last tab inside the padding, clear of the frame: ' + JSON.stringify(r))
          else expect.ok(r.frac >= 0.3 && r.frac <= 0.6 && r.v >= 24, tag + ': the cut tab shows 30-60% of itself and at least 24px: ' + JSON.stringify(r))
        }
      }
    },
  },
  {
    name: 'Pressing the chosen tab keeps it chosen: it lightens a little, it does not drop to the press tint',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      const t = page.locator(tab('pill-t1'))
      await t.hover()
      await page.mouse.down()
      await page.waitForTimeout(400)
      const f = await t.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--fill')))
      await page.mouse.up()
      expect.ok(f >= 0.8 && f < 1, 'the chosen tab under a press keeps nearly all its fill: ' + f)
      const forced = await page.evaluate(() => { const el = document.getElementById('tabs-pill-t1'); el.classList.add('is-active'); const v = Number(getComputedStyle(el).getPropertyValue('--fill')); el.classList.remove('is-active'); return v })
      expect.ok(forced >= 0.8, 'the forced pressed state agrees: ' + forced)
    },
  },
  {
    name: 'Underline: the selected bar sits ON the divider (flush with its outer edge), horizontal and vertical',
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      const h = await page.evaluate(() => { const t = document.querySelector('#underline + p + .demo .tabs__tab[aria-selected="true"]'); const bar = t.closest('.tabs__bar'); const tr = t.getBoundingClientRect(); const br = bar.getBoundingClientRect(); const cs = getComputedStyle(t, '::before'); const bw = parseFloat(getComputedStyle(t).borderBottomWidth); return { barBottom: tr.bottom - bw - parseFloat(cs.bottom), divider: br.bottom, h: parseFloat(cs.height) } })
      expect.ok(Math.abs(h.barBottom - h.divider) <= 0.5 && h.h === 2, 'horizontal: the 2px bar ends where the divider ends: ' + JSON.stringify(h))
      const v = await page.evaluate(() => { const t = document.querySelector('#vertical + p + .demo .tabs__tab[aria-selected="true"]'); const bar = t.closest('.tabs__bar'); const tr = t.getBoundingClientRect(); const br = bar.getBoundingClientRect(); const cs = getComputedStyle(t, '::before'); const bw = parseFloat(getComputedStyle(t).borderRightWidth); return { barRight: tr.right - bw - parseFloat(cs.right), divider: br.right, w: parseFloat(cs.width) } })
      expect.ok(Math.abs(v.barRight - v.divider) <= 0.5 && v.w === 2, 'vertical: the 2px bar ends where the divider ends: ' + JSON.stringify(v))
    },
  },
  {
    name: 'Vertical tabs hug their labels: when the panel drops underneath the column is not full width, so the bar stays by the words',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/tabs.html')
      const r = await page.evaluate(() => { const root = document.querySelector('#vertical + p + .demo .tabs'); const bar = root.querySelector('.tabs__bar').getBoundingClientRect(); const panel = root.querySelector('.tabs__panel:not([hidden])').getBoundingClientRect(); const widest = Math.max(...[...root.querySelectorAll('.tabs__tab')].map((t) => { const rg = document.createRange(); rg.selectNodeContents(t); return rg.getBoundingClientRect().width })); return { bar: Math.round(bar.width), root: Math.round(root.getBoundingClientRect().width), widest: Math.round(widest), under: panel.top >= bar.bottom - 1 } })
      expect.ok(r.under, 'on a phone the panel is underneath: ' + JSON.stringify(r))
      expect.ok(r.bar <= r.widest + 16 + 8, 'the column is the widest label plus its 16px, not the full row: ' + JSON.stringify(r))
    },
  },
]
