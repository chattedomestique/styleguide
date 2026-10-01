// Interaction spec for Menu (WAI-ARIA APG Menu Button). Real keyboard and mouse input in Chromium.
// Docs page: components/menu.html. Contract: tests/components.mjs.
const isOpen = (page, id) => page.evaluate((i) => document.getElementById(i).matches(':popover-open'), id)
/** Focus the button, press the key, and wait until focus is inside the menu (the native toggle event is async). */
async function openWith(page, btn, key = 'Enter') {
  await page.locator(btn).focus()
  await page.keyboard.press(key)
  await page.waitForFunction(() => !!document.activeElement.closest('.menu'))
}
/** The focused row's label, without its trailing meta text. */
const activeLabel = (page) => page.evaluate(() => {
  const a = document.activeElement
  if (!a || !a.closest('.menu')) return 'NOT IN MENU: ' + (a && (a.id || a.tagName))
  const c = a.cloneNode(true)
  c.querySelectorAll('.menu__meta').forEach((m) => m.remove())
  return c.textContent.replace(/\s+/g, ' ').trim()
})
const rowNums = (loc) => loc.evaluate((el) => ({ fill: Number(getComputedStyle(el).getPropertyValue('--fill')), lift: Number(getComputedStyle(el).getPropertyValue('--lift') || 0), transform: getComputedStyle(el).transform }))

export const tests = [
  {
    name: 'Enter opens, focuses the first row and sets aria-expanded; Esc closes and returns focus to the button',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      const btn = page.locator('#mb-actions')
      await btn.focus()
      expect.equal(await btn.getAttribute('aria-expanded'), 'false')
      await page.keyboard.press('Enter')
      expect.ok(await isOpen(page, 'm-actions'), 'open')
      expect.equal(await btn.getAttribute('aria-expanded'), 'true')
      await expect.eventually(() => activeLabel(page), (v) => v === 'Rename', 'first row focused')
      await page.keyboard.press('Escape')
      expect.ok(!(await isOpen(page, 'm-actions')), 'closed')
      await expect.focused(page, '#mb-actions', 'focus back on the button')
      expect.equal(await btn.getAttribute('aria-expanded'), 'false')
    },
  },
  {
    name: 'Space and ArrowDown open on the first row; ArrowUp opens on the last',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      const btn = page.locator('#mb-actions')
      for (const key of ['Space', 'ArrowDown']) {
        await btn.focus()
        await page.keyboard.press(key)
        expect.ok(await isOpen(page, 'm-actions'), `${key} opens`)
        await page.waitForFunction(() => !!document.activeElement.closest('.menu')) // the toggle event that moves focus is asynchronous
        expect.equal(await activeLabel(page), 'Rename', `${key}: first row`)
        await page.keyboard.press('Escape')
        await expect.focused(page, '#mb-actions')
      }
      await page.keyboard.press('ArrowUp')
      expect.ok(await isOpen(page, 'm-actions'))
      expect.equal(await activeLabel(page), 'Delete deck', 'ArrowUp opens on the last row')
    },
  },
  {
    name: 'ArrowDown / ArrowUp move and wrap; Home and End jump; the unavailable row is reachable',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await openWith(page, '#mb-actions')
      const order = []
      for (let i = 0; i < 5; i++) { order.push(await activeLabel(page)); await page.keyboard.press('ArrowDown') }
      expect.equal(order.join('|'), 'Rename|Duplicate|Share|Archive|Delete deck', 'visual order is focus order, including the aria-disabled row')
      expect.equal(await activeLabel(page), 'Rename', 'ArrowDown wraps to the first')
      await page.keyboard.press('ArrowUp')
      expect.equal(await activeLabel(page), 'Delete deck', 'ArrowUp wraps to the last')
      await page.keyboard.press('Home')
      expect.equal(await activeLabel(page), 'Rename', 'Home')
      await page.keyboard.press('End')
      expect.equal(await activeLabel(page), 'Delete deck', 'End')
    },
  },
  {
    name: 'type-ahead: a letter jumps to the next match, quick letters narrow, a repeated letter cycles',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await openWith(page, '#mb-actions')
      await page.keyboard.press('d')
      expect.equal(await activeLabel(page), 'Duplicate', '"d" finds Duplicate')
      await page.waitForTimeout(700)
      await page.keyboard.press('d')
      expect.equal(await activeLabel(page), 'Delete deck', 'a second "d" after a pause moves to the next D row')
      await page.waitForTimeout(700)
      await page.keyboard.press('s')
      await page.keyboard.press('h')
      expect.equal(await activeLabel(page), 'Share', '"sh" typed quickly')
      await page.waitForTimeout(700)
      await page.keyboard.press('a')
      expect.equal(await activeLabel(page), 'Archive', 'type-ahead reaches the unavailable row too')
      await page.keyboard.press('z')
      expect.equal(await activeLabel(page), 'Archive', 'no match: focus stays')
    },
  },
  {
    name: 'Tab closes the menu and moves focus on; it never strands focus on a hidden row',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await openWith(page, '#mb-actions')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Tab')
      expect.ok(!(await isOpen(page, 'm-actions')), 'closed by Tab')
      const where = await page.evaluate(() => { const a = document.activeElement; return { inMenu: !!a.closest('.menu'), body: a === document.body, tag: a.tagName } })
      expect.ok(!where.inMenu && !where.body, `focus moved on to a real control (${where.tag})`)
      expect.equal(await page.locator('#mb-actions').getAttribute('aria-expanded'), 'false')
      await openWith(page, '#mb-actions')
      await page.keyboard.press('Shift+Tab')
      expect.ok(!(await isOpen(page, 'm-actions')), 'closed by Shift+Tab')
      const w2 = await page.evaluate(() => { const a = document.activeElement; return !a.closest('.menu') && a !== document.body })
      expect.ok(w2, 'focus is on a real control')
    },
  },
  {
    name: 'radio rows: Enter picks one, flips aria-checked, closes, returns focus; the choice is reported',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await openWith(page, '#mb-sort')
      const radios = page.locator('#m-sort [role="menuitemradio"]')
      expect.equal(await radios.nth(0).getAttribute('aria-checked'), 'true', 'first is checked to begin with')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      expect.ok(!(await isOpen(page, 'm-sort')), 'radio choice closes the menu')
      await expect.focused(page, '#mb-sort')
      expect.equal(await radios.nth(0).getAttribute('aria-checked'), 'false')
      expect.equal(await radios.nth(2).getAttribute('aria-checked'), 'true')
      expect.equal(await page.locator('#menu-result').textContent(), 'Most missed', 'sg:menu-select fired')
      expect.equal(await page.locator('#m-sort [role="menuitemcheckbox"]').first().getAttribute('aria-checked'), 'true', 'the checkbox group is not affected')
    },
  },
  {
    name: 'checkbox rows with data-keep-open toggle on Space and leave the menu open',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await openWith(page, '#mb-sort')
      await page.keyboard.press('End')
      const archived = page.locator('#m-sort [role="menuitemcheckbox"]').nth(1)
      await expect.focused(page, '#m-sort [role="menuitemcheckbox"]:last-of-type')
      expect.equal(await archived.getAttribute('aria-checked'), 'false')
      await page.keyboard.press('Space')
      expect.equal(await archived.getAttribute('aria-checked'), 'true')
      expect.ok(await isOpen(page, 'm-sort'), 'still open')
      await expect.focused(page, '#m-sort [role="menuitemcheckbox"]:last-of-type', 'focus stays on the row')
      await page.keyboard.press('Space')
      expect.equal(await archived.getAttribute('aria-checked'), 'false', 'toggles back')
    },
  },
  {
    name: 'a checked row has a structural cue (check icon visible, label bolder); unchecked rows hide the icon but keep its room',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await openWith(page, '#mb-sort')
      const vis = await page.evaluate(() => [...document.querySelectorAll('#m-sort [role="menuitemradio"]')].map((i) => ({ v: getComputedStyle(i.querySelector('.menu__check')).visibility, w: Number(getComputedStyle(i).fontWeight), x: i.querySelector('.menu__check').getBoundingClientRect().width })))
      expect.equal(vis[0].v, 'visible'); expect.equal(vis[1].v, 'hidden')
      expect.ok(vis[0].w > vis[1].w, 'checked label is bolder')
      expect.equal(vis[0].x, vis[1].x, 'the icon keeps its room, so labels stay aligned')
    },
  },
  {
    name: 'aria-disabled rows are focusable but inert, dashed, and say why',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await openWith(page, '#mb-actions')
      await page.keyboard.press('End'); await page.keyboard.press('ArrowUp')
      expect.equal(await activeLabel(page), 'Archive')
      const before = await page.locator('#menu-result').textContent()
      await page.keyboard.press('Enter')
      await page.keyboard.press('Space')
      expect.ok(await isOpen(page, 'm-actions'), 'menu stays open')
      expect.equal(await page.locator('#menu-result').textContent(), before, 'nothing was activated')
      const row = page.locator('#m-actions [aria-disabled="true"]')
      const d = await row.evaluate((el) => ({ fill: Number(getComputedStyle(el).getPropertyValue('--fill')), meta: el.querySelector('.menu__meta').textContent }))
      expect.equal(d.fill, 0, 'an unavailable row never fills')
      expect.ok(d.meta.length > 3, 'the reason is written in the row: ' + d.meta)
    },
  },
  {
    name: 'rows fill on hover (gated), keyboard focus and press; they never lift or cast a shadow',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await page.locator('#mb-actions').click()
      await page.waitForTimeout(400)
      const rows = page.locator('#m-actions [role="menuitem"]')
      const second = rows.nth(1)
      await page.mouse.move(2, 400)
      await page.waitForTimeout(400)
      const rest = await rowNums(second)
      expect.equal(rest.fill, 0, 'rest: --fill 0')
      await second.hover()
      await page.waitForTimeout(400)
      const hov = await rowNums(second)
      expect.equal(hov.fill, 1, 'hover: filled')
      expect.ok(hov.transform === 'none' || hov.transform === 'matrix(1, 0, 0, 1, 0, 0)', 'and not moved')
      const bg = await second.evaluate((el) => getComputedStyle(el).backgroundColor)
      const ink = await second.evaluate((el) => getComputedStyle(el).color)
      expect.ok(bg !== ink, 'filled row: text and fill differ')
      expect.equal(await second.evaluate((el) => getComputedStyle(el).boxShadow), 'none', 'no shadow on a row')
    },
  },
  {
    name: 'the focused row wears a ring inside it in a colour that shows on the filled row',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await openWith(page, '#mb-actions')
      await page.waitForTimeout(400)
      const r = await page.evaluate(() => {
        const a = document.activeElement
        const cs = getComputedStyle(a)
        return { fill: Number(cs.getPropertyValue('--fill')), outlineW: cs.outlineWidth, outlineStyle: cs.outlineStyle, offset: parseFloat(cs.outlineOffset), outline: cs.outlineColor, bg: cs.backgroundColor, color: cs.color }
      })
      expect.equal(r.fill, 1, 'focus fills the row')
      expect.equal(r.outlineW, '3px'); expect.equal(r.outlineStyle, 'solid')
      expect.ok(r.offset < 0, `the ring is drawn inside the row (offset ${r.offset})`)
      expect.ok(r.outline !== r.bg, `ring ${r.outline} differs from the filled row ${r.bg}`)
    },
  },
  {
    name: 'the destructive row has an icon and a word, and inverts to the tone fill, not the accent',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      const d = await page.evaluate(() => { const i = document.querySelector('#m-actions [data-tone="bad"]'); return { icon: !!i.querySelector('.ic'), text: i.textContent.trim() } })
      expect.ok(d.icon, 'has an icon')
      expect.equal(d.text, 'Delete deck')
      await openWith(page, '#mb-actions')
      await page.keyboard.press('End')
      await page.waitForTimeout(400)
      const bad = await page.evaluate(() => getComputedStyle(document.activeElement).backgroundColor)
      await page.keyboard.press('Home')
      await page.waitForTimeout(400)
      const plain = await page.evaluate(() => getComputedStyle(document.activeElement).backgroundColor)
      expect.ok(bad !== plain, `destructive fill (${bad}) differs from the accent fill (${plain})`)
    },
  },
  {
    name: 'the menu is a flat 2px frame with ruled rows: no shadow, row rules are 1px, no z-index',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await openWith(page, '#mb-actions')
      const r = await page.evaluate(() => {
        const m = document.getElementById('m-actions'); const cs = getComputedStyle(m)
        const rows = [...m.querySelectorAll('.menu__item')].map((i) => getComputedStyle(i).borderTopWidth)
        return { bw: cs.borderTopWidth, shadow: cs.boxShadow, z: cs.zIndex, rows, sep: getComputedStyle(m.querySelector('.menu__sep')).borderTopWidth, radius: cs.borderTopLeftRadius }
      })
      expect.equal(r.bw, '2px'); expect.equal(r.shadow, 'none'); expect.equal(r.z, 'auto')
      expect.ok(r.rows.every((w) => w === '1px'), `rows have a 1px top edge (${r.rows})`)
      expect.equal(r.sep, '2px', 'the group rule is the heavier line')
      expect.equal(r.radius, '0px', 'square by default')
    },
  },
  {
    name: 'the menu opens directly under its button, start-aligned, at least as wide (CSS anchor positioning)',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await page.locator('#mb-actions').focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)
      const r = await page.evaluate(() => { const b = document.getElementById('mb-actions').getBoundingClientRect(); const m = document.getElementById('m-actions').getBoundingClientRect(); return { gap: m.top - b.bottom, left: m.left - b.left, w: m.width, bw: b.width, native: SG.anchor.native } })
      expect.ok(r.native, 'anchor positioning is available in this browser')
      expect.ok(Math.abs(r.gap - 8) <= 2.5, `8px gap below the button (${r.gap})`)
      expect.ok(Math.abs(r.left) <= 2.5, `start edges aligned (${r.left})`)
      expect.ok(r.w >= r.bw - 1, 'as wide as the button')
    },
  },
  {
    name: 'bottom-end placement lines up the end edges',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await page.locator('#mb-more').focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)
      const r = await page.evaluate(() => { const b = document.getElementById('mb-more').getBoundingClientRect(); const m = document.getElementById('m-more').getBoundingClientRect(); return { dRight: m.right - b.right, inside: m.left >= 0 && m.right <= innerWidth } })
      expect.ok(Math.abs(r.dRight) <= 2.5, `end edges aligned (${r.dRight})`)
      expect.ok(r.inside, 'inside the viewport')
    },
  },
  {
    name: 'right-to-left: start means the right edge, in CSS placement and in the script fallback',
    async run({ page, goto, expect }) {
      for (const js of [false, true]) {
        await goto('components/menu.html')
        await page.evaluate((forceJs) => { document.documentElement.dir = 'rtl'; SG.anchor.forceJs = forceJs }, js)
        await page.locator('#mb-actions').scrollIntoViewIfNeeded()
        await page.locator('#mb-actions').focus()
        await page.keyboard.press('Enter')
        await page.waitForTimeout(400)
        const r = await page.evaluate(() => { const b = document.getElementById('mb-actions').getBoundingClientRect(); const m = document.getElementById('m-actions').getBoundingClientRect(); return { dRight: m.right - b.right, dLeft: m.left - b.left, inside: m.left >= 0 && m.right <= innerWidth } })
        expect.ok(Math.abs(r.dRight) <= 2.5, `[${js ? 'script' : 'css'}] start edges (the right ones) are aligned (${r.dRight}; left ${r.dLeft})`)
        expect.ok(r.inside, 'on screen')
        await page.keyboard.press('Escape')
      }
    },
  },
  {
    name: 'with no room below, the menu flips above the button',
    viewport: { width: 390, height: 560 },
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await page.evaluate(() => { const b = document.getElementById('mb-actions'); const y = b.getBoundingClientRect().top + scrollY; scrollTo(0, y - (innerHeight - 90)) })
      await page.locator('#mb-actions').focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)
      const r = await page.evaluate(() => { const b = document.getElementById('mb-actions').getBoundingClientRect(); const m = document.getElementById('m-actions').getBoundingClientRect(); return { above: m.bottom <= b.top + 1, top: m.top, bottom: m.bottom } })
      expect.ok(r.above, `flipped above (menu ${r.top}..${r.bottom})`)
      expect.ok(r.top >= 0, 'and stays on screen')
    },
  },
  {
    name: 'fallback without anchor positioning: JS places the menu below the button and flips at the edge',
    async run({ page, goto, expect }) {
      await page.addInitScript(() => { const s = CSS.supports.bind(CSS); CSS.supports = (...a) => (/position-area|anchor-name/.test(a.join(' ')) ? false : s(...a)) })
      await goto('components/menu.html')
      expect.equal(await page.evaluate(() => SG.anchor.native), false, 'the fallback path is active')
      await page.locator('#mb-actions').focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)
      const r = await page.evaluate(() => { const m = document.getElementById('m-actions'); const b = document.getElementById('mb-actions').getBoundingClientRect(); const r = m.getBoundingClientRect(); return { placed: m.hasAttribute('data-placed'), gap: r.top - b.bottom, left: r.left - b.left, vis: getComputedStyle(m).visibility } })
      expect.ok(r.placed && r.vis === 'visible', 'placed and visible')
      expect.ok(Math.abs(r.gap - 8) <= 2.5, `8px below, give or take the 2px the lifted button has moved (${r.gap})`)
      expect.ok(Math.abs(r.left) <= 2.5, `start aligned (${r.left})`)
      await page.keyboard.press('ArrowDown')
      expect.equal(await activeLabel(page), 'Duplicate', 'keys work the same')
      await page.keyboard.press('Escape')
      await expect.focused(page, '#mb-actions')
    },
  },
  {
    name: 'Esc, a click outside and choosing a row all leave aria-expanded false and focus sensible',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await page.locator('#mb-actions').click()
      expect.ok(await isOpen(page, 'm-actions'), 'opened by click')
      expect.equal(await activeLabel(page), 'Rename', 'click also focuses the first row')
      await page.mouse.click(5, 300)
      await page.waitForTimeout(300)
      expect.ok(!(await isOpen(page, 'm-actions')), 'light dismiss')
      expect.equal(await page.locator('#mb-actions').getAttribute('aria-expanded'), 'false')
      await page.locator('#mb-actions').click()
      await page.locator('#m-actions [role="menuitem"]').nth(1).click()
      expect.ok(!(await isOpen(page, 'm-actions')), 'choosing a row closes')
      expect.equal(await page.locator('#menu-result').textContent(), 'Duplicate')
      await expect.focused(page, '#mb-actions', 'focus returns to the button after a click choice')
    },
  },
  {
    name: 'clicking the button again while the menu is open closes it (it does not flicker shut and open)',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await page.locator('#mb-actions').click()
      expect.ok(await isOpen(page, 'm-actions'))
      await page.locator('#mb-actions').click()
      await page.waitForTimeout(300)
      expect.ok(!(await isOpen(page, 'm-actions')), 'second click closes')
      expect.equal(await page.locator('#mb-actions').getAttribute('aria-expanded'), 'false')
    },
  },
  {
    name: 'a menu row that opens a dialog: closing the dialog returns focus to the menu button',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await openWith(page, '#mb-danger')
      await page.keyboard.press('End')
      await page.keyboard.press('Enter')
      expect.ok(await page.evaluate(() => document.getElementById('m-dlg').open), 'dialog opened from the menu row')
      await expect.focused(page, '#m-dlg [autofocus]')
      expect.ok(!(await isOpen(page, 'm-danger')), 'menu closed')
      await page.keyboard.press('Escape')
      await expect.focused(page, '#mb-danger', 'focus is back on the menu button, not on the hidden row')
      expect.equal(await page.locator('#menu-result').textContent(), 'Delete deck (cancelled)')
    },
  },
  {
    name: 'action sheet: docked full-width with a scrim and 56px rows; Cancel closes and returns focus',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await openWith(page, '#mb-sheet')
      await page.waitForTimeout(500)
      const r = await page.evaluate(() => { const m = document.getElementById('m-sheet').getBoundingClientRect(); const cs = getComputedStyle(document.getElementById('m-sheet')); return { bottom: m.bottom, w: m.width, vh: innerHeight, vw: innerWidth, anchored: document.getElementById('m-sheet').hasAttribute('data-anchored'), h: document.querySelector('#m-sheet [role=menuitem]').getBoundingClientRect().height, bb: cs.borderBottomWidth, back: getComputedStyle(document.getElementById('m-sheet'), '::backdrop').backgroundColor } })
      expect.ok(Math.abs(r.bottom - r.vh) <= 1, `docked to the bottom edge (${r.bottom} of ${r.vh})`)
      expect.ok(r.w >= r.vw - 2, `full width (${r.w})`)
      expect.ok(!r.anchored, 'not anchored to the button')
      expect.ok(r.h >= 55, `rows are 56px (${r.h})`)
      expect.equal(r.bb, '0px', 'no frame on the docked edge')
      expect.ok(/0\.[6-9]|^oklch|rgba\(0, 0, 0, 0\.[6-9]/.test(r.back) || r.back !== 'rgba(0, 0, 0, 0)', `scrim behind it (${r.back})`)
      expect.equal(await activeLabel(page), 'Edit card')
      await page.keyboard.press('End')
      expect.equal(await activeLabel(page), 'Cancel', 'Cancel is the last row')
      await page.keyboard.press('Enter')
      expect.ok(!(await isOpen(page, 'm-sheet')), 'Cancel closes')
      await expect.focused(page, '#mb-sheet')
    },
  },
  {
    name: 'an action sheet closes with a tap on the scrim, and by Esc',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await page.locator('#mb-sheet').click()
      await page.waitForTimeout(500)
      // tap the scrim over something inert (at 10,10 a phone-width page has the docs bar's own menu button, which
      // a non-modal popover's light dismiss lets the click reach, and that button then takes focus)
      // (with the sheet open every point hits its backdrop, so pick from the layout: the padding corner of a demo stage)
      const spot = await page.evaluate(() => {
        const sheet = document.getElementById('m-sheet').getBoundingClientRect()
        const st = [...document.querySelectorAll('.docs-article .demo__stage')].map((e) => e.getBoundingClientRect()).find((r) => r.top >= 60 && r.top + 6 < sheet.top)
        return st ? { x: Math.round(st.left + 4), y: Math.round(st.top + 4) } : null
      })
      expect.ok(spot, 'found an inert spot above the sheet')
      await page.mouse.click(spot.x, spot.y)
      await page.waitForTimeout(300)
      expect.ok(!(await isOpen(page, 'm-sheet')), 'scrim tap closes')
      await page.locator('#mb-sheet').focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press('Escape')
      expect.ok(!(await isOpen(page, 'm-sheet')), 'Esc closes')
      await expect.focused(page, '#mb-sheet')
    },
  },
  {
    name: 'presentation="auto": an action sheet on a phone, a dropdown on a wide screen',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await page.locator('#mb-auto').click()
      await page.waitForTimeout(500)
      const phone = await page.evaluate(() => { const m = document.getElementById('m-auto'); return { sheet: m.hasAttribute('data-sheet'), anchored: m.hasAttribute('data-anchored'), bottom: Math.round(m.getBoundingClientRect().bottom), vh: innerHeight } })
      expect.ok(phone.sheet && !phone.anchored && phone.bottom === phone.vh, 'sheet at 390px wide')
      await page.keyboard.press('Escape')
      await page.setViewportSize({ width: 1024, height: 800 })
      await page.locator('#mb-auto').click()
      await page.waitForTimeout(500)
      const wide = await page.evaluate(() => { const m = document.getElementById('m-auto'); const b = document.getElementById('mb-auto').getBoundingClientRect(); return { sheet: m.hasAttribute('data-sheet'), anchored: m.hasAttribute('data-anchored'), gap: m.getBoundingClientRect().top - b.bottom } })
      expect.ok(!wide.sheet && wide.anchored && Math.abs(wide.gap - 8) <= 2.5, `dropdown at 1024px wide (gap ${wide.gap})`)
    },
  },
  {
    name: 'touch: tapping the button opens the menu, tapping a row chooses it',
    touch: true,
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await page.locator('#mb-actions').tap()
      expect.ok(await isOpen(page, 'm-actions'))
      await page.locator('#m-actions [role="menuitem"]').nth(2).tap()
      expect.ok(!(await isOpen(page, 'm-actions')))
      expect.equal(await page.locator('#menu-result').textContent(), 'Share')
    },
  },
  {
    name: 'rows meet the 44px target and the icon-only trigger has a name',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await openWith(page, '#mb-actions')
      const hs = await page.evaluate(() => [...document.querySelectorAll('#m-actions [role="menuitem"]')].map((i) => Math.round(i.getBoundingClientRect().height)))
      expect.ok(hs.every((h) => h >= 44), `row heights ${hs}`)
      expect.ok((await page.locator('#mb-more').getAttribute('aria-label')).length > 4, 'icon-only button is named')
    },
  },
  {
    name: 'the chevron turns while open, and does not under reduced motion',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await page.locator('#mb-actions').click()
      await page.waitForTimeout(500)
      expect.equal(await page.locator('#mb-actions .menu__chevron').evaluate((e) => getComputedStyle(e).rotate), '180deg')
    },
  },
  {
    name: 'at 200% text on a phone the open menu still fits on the screen (scripted placement takes over when CSS has no room)',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await page.addStyleTag({ content: 'html{font-size:200%!important}' })
      await page.locator('#mb-actions').scrollIntoViewIfNeeded()
      await page.locator('#mb-actions').focus(); await page.keyboard.press('Enter')
      await page.waitForTimeout(600)
      const r = await page.evaluate(() => { const b = document.querySelector('#m-actions').getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, vw: document.documentElement.clientWidth, vh: innerHeight } })
      expect.ok(r.l >= -1 && r.r <= r.vw + 1 && r.t >= -1 && r.b <= r.vh + 1, `inside the screen (${JSON.stringify(r)})`)
    },
  },
  {
    name: 'reduced motion: the menu appears with a fade, no vertical travel, and the chevron stays put',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      const t0 = await page.evaluate(() => { const m = document.getElementById('m-actions'); m.showPopover(); const t = new DOMMatrix(getComputedStyle(m).transform).m42; const o = Number(getComputedStyle(m).opacity); m.hidePopover(); return { t, o } })
      expect.equal(t0.t, 0, 'no vertical travel')
      expect.ok(t0.o < 1, 'fading in')
      await page.locator('#mb-actions').click()
      await page.waitForTimeout(400)
      expect.equal(await page.locator('#mb-actions .menu__chevron').evaluate((e) => getComputedStyle(e).rotate), '0deg', 'no turn')
    },
  },
  {
    name: 'Row-state previews (data-inline) are as wide as their frame, not the viewport, and an unavailable row\'s reason wraps instead of running into its dashed frame',
    viewport: { width: 320, height: 700 },
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      for (const [vw, text] of [[320, 100], [390, 200]]) {
        await page.setViewportSize({ width: vw, height: 700 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(200)
        const r = await page.evaluate(() => {
          const stage = document.querySelector('#states + p + .demo .demo__stage'); const sr = stage.getBoundingClientRect()
          return [...stage.querySelectorAll('.menu[data-inline]')].map((m) => {
            const mr = m.getBoundingClientRect(); const row = m.querySelector('[aria-disabled="true"]'); const rr = row.getBoundingClientRect(); const meta = row.querySelector('.menu__meta').getBoundingClientRect()
            return { menuInside: mr.right <= sr.right + 0.5 && mr.left >= sr.left - 0.5, metaInside: meta.right <= rr.right - 3, pad: parseFloat(getComputedStyle(row).paddingInlineEnd) }
          })
        })
        expect.ok(r.length === 2 && r.every((x) => x.menuInside), vw + 'px, ' + text + '%: both previews sit inside the stage: ' + JSON.stringify(r))
        if (text === 100) expect.ok(r.every((x) => x.metaInside), vw + 'px: the reason ends inside the row\'s padding, clear of the dashed frame: ' + JSON.stringify(r))
      }
    },
  },
  {
    name: 'a row\'s reason stays at the end of its line at 100% text and drops under the label, aligned with its start, at 200%; it never shrinks to letters',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      const read = () => page.evaluate(() => [...document.querySelectorAll('#menu-states .menu__item[aria-disabled="true"]')].map((row) => {
        const meta = row.querySelector('.menu__meta').getBoundingClientRect(); const rr = row.getBoundingClientRect()
        const text = [...row.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim())
        const rg = document.createRange(); rg.selectNodeContents(text); const label = rg.getBoundingClientRect()
        const lines = Math.round(meta.height / parseFloat(getComputedStyle(row.querySelector('.menu__meta')).lineHeight))
        return { fit: row.getAttribute('data-fit'), h: Math.round(rr.height), metaLeft: Math.round(meta.left), labelLeft: label ? Math.round(label.left) : null, below: meta.top >= (label ? label.bottom - 2 : 0), atEnd: Math.abs(meta.right - (rr.right - parseFloat(getComputedStyle(row).paddingRight))) < 2, lines }
      }))
      const a = await read()
      expect.ok(a.every((r) => r.fit === 'inline' && r.atEnd && r.h <= 50), '100%: the reason sits at the end of the row\'s line: ' + JSON.stringify(a))
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
      await page.waitForTimeout(400)
      const b = await read()
      expect.ok(b.every((r) => r.fit === 'stack' && r.below && Math.abs(r.metaLeft - r.labelLeft) <= 1), '200%: the reason is under the label, starting where the label starts: ' + JSON.stringify(b))
      expect.ok(b.every((r) => r.lines <= 2 && r.h < 200), '200%: whole words, a compact row (it was a 500px column of letters): ' + JSON.stringify(b))
    },
  },
  {
    name: 'in the open dropdown, at 100% and 200% text, every reason and shortcut ends inside the row\'s padding (never on its frame), and a label keeps clear of the rules between rows',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      for (const text of [100, 200]) {
        await goto('components/menu.html')
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(300)
        const trig = page.locator('button[aria-haspopup="menu"]', { hasText: 'Deck options' }).first()
        await trig.scrollIntoViewIfNeeded()
        await trig.click()
        await page.waitForTimeout(500)
        const r = await page.evaluate(() => [...document.querySelectorAll('.menu:popover-open .menu__item')].map((row) => {
          const rr = row.getBoundingClientRect(); const cs = getComputedStyle(row); const meta = row.querySelector('.menu__meta')
          const text = [...row.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()); const rg = document.createRange(); rg.selectNodeContents(text); const lb = rg.getBoundingClientRect()
          return { row: text.textContent.trim(), fit: row.getAttribute('data-fit'), metaClear: meta ? Math.round(rr.right - meta.getBoundingClientRect().right) : null, pad: parseFloat(cs.paddingRight), above: Math.round(lb.top - rr.top), below: Math.round(rr.bottom - lb.bottom) }
        }))
        expect.ok(r.length >= 4, 'the dropdown is open')
        const bad = r.filter((x) => (x.metaClear !== null && x.metaClear < x.pad - 0.5) || x.above < 8 || x.below < 8)
        expect.ok(!bad.length, text + '%: every meta ends inside the padding and every label keeps 8px from the rules: ' + JSON.stringify(bad.length ? bad : r))
      }
    },
  },
]
