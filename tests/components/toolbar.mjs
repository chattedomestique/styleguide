// Interaction spec for Toolbar. See tests/components.mjs for the contract and tests/components/button.mjs for a model.
const TOOLS = '#tools + p + .demo .toolbar'
const TOGGLES = '#toggles + p + .demo .toolbar'

const state = (page, sel) =>
  page.evaluate((s) => {
    const list = document.querySelector(s + ' .toolbar__list')
    const btns = [...list.querySelectorAll('.btn')]
    return {
      tabbable: btns.filter((b) => b.tabIndex === 0).map((b) => b.id),
      checked: btns.filter((b) => b.getAttribute('aria-checked') === 'true').map((b) => b.id),
      focused: document.activeElement && document.activeElement.id,
    }
  }, sel)

export const tests = [
  {
    name: 'the toolbar is one tab stop, on the tool that is on; Tab leaves it',
    async run({ page, goto, expect }) {
      await goto('components/toolbar.html')
      const s = await state(page, TOOLS)
      expect.equal(s.tabbable.length, 1, 'exactly one button is in the tab order')
      expect.equal(s.tabbable[0], 't1-light', 'it is the checked tool')
      // put focus on the paragraph before the demo and Tab once: it lands on the roving stop
      await page.evaluate(() => { const p = document.querySelector('#tools + p'); p.setAttribute('tabindex', '-1'); p.focus() })
      await page.keyboard.press('Tab')
      const f = await state(page, TOOLS)
      expect.equal(f.focused, 't1-light', 'Tab enters on the checked tool (the scroll buttons are not tab stops)')
      await page.keyboard.press('Tab')
      const after = await state(page, TOOLS)
      expect.ok(after.focused !== 't1-light' && !/^t1-/.test(after.focused || ''), `the next Tab leaves the toolbar (focus on "${after.focused}")`)
    },
  },
  {
    name: 'arrow keys move focus and wrap; Home and End jump; arrows never change what is on',
    async run({ page, goto, expect }) {
      await goto('components/toolbar.html')
      await page.locator('#t1-light').focus()
      await page.keyboard.press('ArrowRight')
      expect.equal((await state(page, TOOLS)).focused, 't1-colour', 'Right moves to the next tool')
      expect.equal((await state(page, TOOLS)).tabbable[0], 't1-colour', 'roving: the tab stop follows focus')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      expect.equal((await state(page, TOOLS)).focused, 't1-crop', 'Left moves back')
      await page.keyboard.press('ArrowLeft')
      expect.equal((await state(page, TOOLS)).focused, 't1-rotate', 'Left from the first wraps to the last')
      await page.keyboard.press('ArrowRight')
      expect.equal((await state(page, TOOLS)).focused, 't1-crop', 'Right from the last wraps to the first')
      await page.keyboard.press('End')
      expect.equal((await state(page, TOOLS)).focused, 't1-rotate', 'End')
      await page.keyboard.press('Home')
      expect.equal((await state(page, TOOLS)).focused, 't1-crop', 'Home')
      expect.equal((await state(page, TOOLS)).checked.join(), 't1-light', 'moving focus does not change the choice')
    },
  },
  {
    name: 'Enter and Space turn a radio tool on and the others off; pressing the label does the same',
    async run({ page, goto, expect }) {
      await goto('components/toolbar.html')
      await page.locator('#t1-light').focus()
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('Enter')
      expect.equal((await state(page, TOOLS)).checked.join(), 't1-crop', 'Enter turns Crop on')
      expect.equal(await page.locator('#t1-light').getAttribute('aria-checked'), 'false', 'Light goes off')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('Space')
      expect.equal((await state(page, TOOLS)).checked.join(), 't1-colour', 'Space turns Colour on')
      await page.locator('#t1-colour-l').scrollIntoViewIfNeeded()
      await page.locator('#t1-colour-l').click()
      expect.equal((await state(page, TOOLS)).checked.join(), 't1-colour', 'colour stays on')
      await page.locator('#t1-crop-l').click()
      expect.equal((await state(page, TOOLS)).checked.join(), 't1-crop', 'tapping the words presses the tool')
    },
  },
  {
    name: 'each tool is named by its visible label (label in name), and the on tool is underlined as well as filled',
    async run({ page, goto, expect }) {
      await goto('components/toolbar.html')
      const r = await page.evaluate(() => {
        const out = []
        for (const b of document.querySelectorAll('#tools + p + .demo .toolbar__list .btn')) {
          const label = document.querySelector('label[for="' + b.id + '"]').textContent.trim()
          const name = b.getAttribute('aria-labelledby') && document.getElementById(b.getAttribute('aria-labelledby')).textContent.trim()
          out.push(label === name && label.length > 0)
        }
        const on = document.querySelector('#t1-light-l'), off = document.querySelector('#t1-crop-l')
        return { named: out.every(Boolean), n: out.length, onLine: getComputedStyle(on).textDecorationLine, offLine: getComputedStyle(off).textDecorationLine }
      })
      expect.ok(r.named && r.n === 7, 'all seven tools are named by their visible label')
      expect.equal(r.onLine, 'underline', 'the label of the tool that is on is underlined')
      expect.equal(r.offLine, 'none', 'the others are not')
    },
  },
  {
    name: 'toggles flip aria-pressed; an aria-disabled tool stays in the arrow order but is inert',
    async run({ page, goto, expect }) {
      await goto('components/toolbar.html')
      const grid = page.locator('#t2-grid')
      await grid.focus()
      await page.keyboard.press('Enter')
      expect.equal(await grid.getAttribute('aria-pressed'), 'true', 'Enter turns the toggle on')
      await page.keyboard.press('Space')
      expect.equal(await grid.getAttribute('aria-pressed'), 'false', 'Space turns it off')
      await page.locator('#t2-undo').focus()
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, '#t2-redo', 'the unavailable tool can take focus by arrow key')
      await page.evaluate(() => { window.__c = 0; document.getElementById('t2-redo').addEventListener('click', () => window.__c++) })
      await page.keyboard.press('Enter')
      await page.keyboard.press('Space')
      expect.equal(await page.evaluate(() => window.__c), 0, 'keyboard activation is blocked')
      expect.equal(await page.locator('#t2-redo').getAttribute('aria-describedby'), 't2-redo-why', 'the reason is attached')
      await page.keyboard.press('ArrowRight')
      await expect.focused(page, '#t2-compare', 'the separator is not a stop')
    },
  },
  {
    name: 'overflow: the scroll buttons appear, scroll the list, and are aria-disabled at the ends',
    async run({ page, goto, expect }) {
      await goto('components/toolbar.html')
      const r = await page.evaluate((s) => {
        const bar = document.querySelector(s), list = bar.querySelector('.toolbar__list')
        const back = bar.querySelector('[data-dir="back"]'), fwd = bar.querySelector('[data-dir="forward"]')
        return { over: list.scrollWidth > list.clientWidth, backHidden: back.hidden, fwdHidden: fwd.hidden, backOff: back.getAttribute('aria-disabled'), fwdOff: fwd.getAttribute('aria-disabled') }
      }, TOOLS)
      expect.ok(r.over, 'seven tools overflow a phone-width tray')
      expect.ok(!r.backHidden && !r.fwdHidden, 'both scroll buttons are shown when it overflows')
      expect.equal(r.backOff, 'true', 'back is unavailable at the start')
      expect.equal(r.fwdOff, null, 'forward is available')
      const fwd = page.locator(`${TOOLS} [data-dir="forward"]`)
      await fwd.scrollIntoViewIfNeeded()
      await fwd.click()
      await page.waitForTimeout(700)
      const left = await page.locator(`${TOOLS} .toolbar__list`).evaluate((el) => el.scrollLeft)
      expect.ok(left > 50, `forward scrolled the list (scrollLeft ${left})`)
      expect.equal(await page.locator(`${TOOLS} [data-dir="back"]`).getAttribute('aria-disabled'), null, 'back is now available')
      for (let i = 0; i < 6; i++) { await fwd.click({ force: true }).catch(() => {}); await page.waitForTimeout(450) }
      expect.equal(await fwd.getAttribute('aria-disabled'), 'true', 'forward is unavailable at the end')
      expect.equal(await fwd.evaluate((el) => el.disabled), false, 'never the disabled attribute')
      expect.equal(await fwd.evaluate((el) => el.tabIndex), -1, 'scroll buttons are not tab stops')
    },
  },
  {
    name: 'a wide tray: the scroll buttons sit beside the list, level with the tools\' circles, and never cover a tool',
    async run({ page, goto, expect }) {
      await goto('components/toolbar.html')
      const r = await page.evaluate((s) => {
        const bar = document.querySelector(s), list = bar.querySelector('.toolbar__list')
        const back = bar.querySelector('[data-dir="back"]').getBoundingClientRect(), fwd = bar.querySelector('[data-dir="forward"]').getBoundingClientRect()
        const l = list.getBoundingClientRect(), c = document.getElementById('t1-crop').getBoundingClientRect()
        return { tray: Math.round(bar.getBoundingClientRect().width), dy: Math.round(Math.abs((back.top + back.bottom) / 2 - (c.top + c.bottom) / 2)), dyF: Math.round(Math.abs((fwd.top + fwd.bottom) / 2 - (c.top + c.bottom) / 2)), clearBack: back.right <= l.left + 0.5, clearFwd: fwd.left >= l.right - 0.5 }
      }, TOOLS)
      expect.ok(r.tray >= 288, 'a 390px phone gives the tray at least 18rem: ' + r.tray)
      expect.ok(r.dy <= 1 && r.dyF <= 1, 'the scroll circles are level with the tool circles, not with circle + label: ' + JSON.stringify(r))
      expect.ok(r.clearBack && r.clearFwd, 'both sit outside the list box: ' + JSON.stringify(r))
    },
  },
  {
    name: 'a narrow tray (320px; 200% text on a 390px phone) is still ONE row: the scroll buttons stay beside the list, level with the tools, and scroll it; the circles stay 44px and no label word is broken',
    async run({ page, goto, expect }) {
      await goto('components/toolbar.html')
      // the two required conditions: 320px wide, and 200% text on a 390px phone
      for (const [vw, text] of [[320, 100], [390, 200]]) {
        await page.setViewportSize({ width: vw, height: 700 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(300)
        const r = await page.evaluate((s) => {
          const bar = document.querySelector(s), list = bar.querySelector('.toolbar__list')
          const back = bar.querySelector('[data-dir="back"]'), fwd = bar.querySelector('[data-dir="forward"]')
          const l = list.getBoundingClientRect(), b = back.getBoundingClientRect(), f = fwd.getBoundingClientRect()
          const crop = document.getElementById('t1-crop').getBoundingClientRect()
          const whole = [...list.querySelectorAll('.toolbar__item')].filter((i) => { const ir = i.getBoundingClientRect(); return ir.left >= l.left - 1 && ir.right <= l.right + 1 }).length
          const broken = [...list.querySelectorAll('.toolbar__label')].filter((x) => x.scrollWidth > x.clientWidth + 1).length
          return { over: list.scrollWidth > list.clientWidth, shown: !back.hidden && !fwd.hidden, beside: b.right <= l.left + 0.5 && f.left >= l.right - 0.5,
            level: Math.abs((b.top + b.bottom) / 2 - (crop.top + crop.bottom) / 2) <= 1 && Math.abs((f.top + f.bottom) / 2 - (crop.top + crop.bottom) / 2) <= 1, circle: Math.round(crop.width), whole, broken }
        }, TOOLS)
        expect.ok(r.over, vw + 'px, ' + text + '%: the tools overflow the tray')
        expect.ok(r.shown && r.beside && r.level, vw + 'px, ' + text + '%: both scroll buttons on the same row, beside the list, level with the tools\' circles: ' + JSON.stringify(r))
        expect.equal(r.circle, 44, vw + 'px, ' + text + '%: the tool circles keep their 100% size')
        // 44px circles in cells of their label + 4px a side (52px at least), 36px scroll buttons: two whole tools on a 320px phone,
        // and two at 200% text on a 390px phone (the labels are words, so they grow: "Colour" is 84px wide there)
        expect.ok(r.whole >= 2, vw + 'px, ' + text + '%: at least two whole tools beside the buttons: ' + JSON.stringify(r))
        expect.equal(r.broken, 0, vw + 'px, ' + text + '%: no label spills (a word is never broken)')
        const before = await page.locator(`${TOOLS} .toolbar__list`).evaluate((el) => el.scrollLeft)
        const fwd = page.locator(`${TOOLS} [data-dir="forward"]`)
        await fwd.scrollIntoViewIfNeeded()
        await fwd.click()
        await page.waitForTimeout(700)
        const after = await page.locator(`${TOOLS} .toolbar__list`).evaluate((el) => el.scrollLeft)
        expect.ok(after > before + 20, vw + 'px, ' + text + '%: forward scrolls the list (' + before + ' to ' + after + ')')
        await page.locator(`${TOOLS} [data-dir="back"]`).click()
        await page.waitForTimeout(700)
        await page.locator(`${TOOLS} .toolbar__list`).evaluate((el) => { el.scrollLeft = 0 })
      }
    },
  },
  {
    name: 'pages of whole tools: at rest and after every press of forward or back, every tool in view is whole and the page fills the list; the pages show every tool once (390, 320, 200% text)',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      const look = (bar) => bar.evaluate((el) => {
        const list = el.querySelector('.toolbar__list'); const l = list.getBoundingClientRect(); const cs = getComputedStyle(list)
        const inS = l.left + parseFloat(cs.paddingLeft), inE = l.right - parseFloat(cs.paddingRight)
        const items = [...list.querySelectorAll('.toolbar__item')].map((i) => ({ n: i.querySelector('.toolbar__label').textContent.trim(), r: i.getBoundingClientRect() })).filter((i) => i.r.right > l.left + 0.5 && i.r.left < l.right - 0.5)
        const fwd = el.querySelector('[data-dir="forward"]'), back = el.querySelector('[data-dir="back"]')
        return { names: items.map((i) => i.n), cut: items.filter((i) => i.r.left < inS - 0.5 || i.r.right > inE + 0.5).map((i) => i.n), startGap: items.length ? Math.round(items[0].r.left - inS) : null, endGap: items.length ? Math.round(inE - items[items.length - 1].r.right) : null, fwdEnd: fwd.getAttribute('aria-disabled') === 'true', backEnd: back.getAttribute('aria-disabled') === 'true', hidden: fwd.hidden }
      })
      for (const [vw, text, least] of [[390, 100, 3], [320, 100, 2], [390, 200, 2]]) {
        await page.setViewportSize({ width: vw, height: 800 })
        await goto('components/toolbar.html')
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(400)
        const trays = await page.locator('.docs-article .toolbar').count()
        expect.ok(trays >= 5, 'found the trays')
        for (let t = 0; t < trays; t++) {
          const bar = page.locator('.docs-article .toolbar').nth(t)
          const label = await bar.locator('.toolbar__list').getAttribute('aria-label')
          const tag = `${vw}px ${text}% ${label}`
          let r = await look(bar)
          if (r.hidden) continue
          // go to the first page, then walk forward to the end and back again
          for (let i = 0; i < 9 && !r.backEnd; i++) { await bar.locator('[data-dir="back"]').click(); await page.waitForTimeout(80); r = await look(bar) }
          const all = await bar.evaluate((el) => [...el.querySelectorAll('.toolbar__label')].map((x) => x.textContent.trim()).join(' '))
          const seen = []
          for (let i = 0; i < 12; i++) {
            expect.ok(r.names.length >= 1 && !r.cut.length, tag + ' page ' + (i + 1) + ': every tool in view is whole: ' + JSON.stringify(r))
            expect.ok(Math.abs(r.startGap) <= 1 && Math.abs(r.endGap) <= 1, tag + ' page ' + (i + 1) + ': the page fills the list, edge to edge inside its padding: ' + JSON.stringify(r))
            if (i === 0 && (label === 'Photo tools' || (label === 'Photo tools, editor' && text === 100))) expect.ok(r.names.length >= least, tag + ': the first page shows at least ' + least + ' whole tools: ' + JSON.stringify(r))
            seen.push(...r.names)
            if (r.fwdEnd) break
            await bar.locator('[data-dir="forward"]').click(); await page.waitForTimeout(80); r = await look(bar)
          }
          expect.equal(seen.join(' '), all, tag + ': the pages show every tool once, in order')
          await bar.locator('[data-dir="back"]').click(); await page.waitForTimeout(80)
          const back = await look(bar)
          expect.ok(!back.cut.length && Math.abs(back.startGap) <= 1, tag + ': back lands on whole tools too: ' + JSON.stringify(back))
        }
      }
    },
  },
  {
    name: 'S1: a radio or toggle tool only lifts on hover and tints when pressed; the fill is kept for on; an action tool keeps Button\'s fill on hover',
    async run({ page, goto, expect }) {
      await goto('components/toolbar.html')
      const nums = (sel) => page.locator(sel).evaluate((el) => ({ lift: Number(getComputedStyle(el).getPropertyValue('--lift')), fill: Number(getComputedStyle(el).getPropertyValue('--fill')) }))
      await page.locator('#t1-crop').scrollIntoViewIfNeeded()
      await page.locator('#t1-crop').hover()
      await page.waitForTimeout(350)
      const h = await nums('#t1-crop')
      expect.equal(h.lift, 1, 'an off radio tool raises'); expect.equal(h.fill, 0, 'but is not filled')
      await page.mouse.down(); await page.waitForTimeout(300)
      const p = await nums('#t1-crop')
      expect.ok(p.lift === 0 && p.fill > 0.1 && p.fill < 0.2, 'pressed: sunk with a light tint: ' + JSON.stringify(p))
      await page.mouse.move(0, 0); await page.mouse.up()
      await page.locator('#t1-light').hover(); await page.waitForTimeout(350)
      const on = await nums('#t1-light')
      expect.ok(on.lift === 1 && on.fill === 1, 'the on tool stays filled while raised: ' + JSON.stringify(on))
      await page.locator('#t2-undo').scrollIntoViewIfNeeded()
      await page.locator('#t2-undo').hover(); await page.waitForTimeout(350)
      expect.equal((await nums('#t2-undo')).fill, 1, 'an action tool (Undo) fills on hover, as a Button does')
      await page.locator('#t2-grid').scrollIntoViewIfNeeded()
      await page.locator('#t2-grid').hover(); await page.waitForTimeout(350)
      expect.equal((await nums('#t2-grid')).fill, 0, 'an off toggle (Grid) does not fill on hover')
    },
  },
  {
    name: 'every tray that overflows has its scroll buttons: the Toggles tray too',
    async run({ page, goto, expect }) {
      await goto('components/toolbar.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('.toolbar')].map((bar) => {
        const list = bar.querySelector('.toolbar__list'); const btns = bar.querySelectorAll('.toolbar__scroll')
        return { label: list.getAttribute('aria-label'), over: list.scrollWidth > list.clientWidth + 1, buttons: btns.length, shown: [...btns].every((b) => !b.hidden) }
      }))
      expect.ok(r.length >= 5, 'found the trays')
      expect.ok(r.every((t) => t.buttons === 2), 'every tray has a back and a forward button: ' + JSON.stringify(r.filter((t) => t.buttons !== 2)))
      expect.ok(r.every((t) => t.over === t.shown), 'a tray shows the buttons exactly when it overflows: ' + JSON.stringify(r))
    },
  },
  {
    name: 'hovering the label lifts the circle as if it were pressed',
    async run({ page, goto, expect }) {
      await goto('components/toolbar.html')
      const btn = page.locator('#t1-crop')
      await page.locator('#t1-crop-l').scrollIntoViewIfNeeded()
      await page.waitForTimeout(60)
      const lift = () => btn.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--lift')))
      expect.equal(await lift(), 0, 'rest')
      await page.locator('#t1-crop-l').hover()
      await page.waitForTimeout(400)
      expect.equal(await lift(), 1, 'hovering the words raises the circle')
      await page.mouse.down()
      await page.waitForTimeout(300)
      expect.equal(await lift(), 0, 'pressing the words sinks it')
      await page.mouse.up()
    },
  },
  {
    name: 'the circle keeps a 44px target and the ring is not clipped by the scroller',
    async run({ page, goto, expect }) {
      await goto('components/toolbar.html')
      const r = await page.evaluate(() => {
        const b = document.getElementById('t1-crop'), list = b.closest('.toolbar__list')
        const br = b.getBoundingClientRect(), lr = list.getBoundingClientRect()
        return { w: br.width, h: br.height, padTop: br.top - lr.top, padStart: br.left - lr.left }
      })
      expect.ok(r.w >= 43.5 && r.h >= 43.5, `44px circle (${r.w}x${r.h})`)
      expect.ok(r.padTop >= 6, `room above the circle for the 6px focus ring (${r.padTop}px)`)
      // raised (2px up and back) and ringed (3px offset + 3px ring): the ring reaches 8px before the circle's resting edge
      expect.ok(r.padStart >= 7.5, `room before the first circle for its raised focus ring (${r.padStart}px)`)
    },
  },
  {
    name: 'reduced motion: hovering the circle does not move it',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/toolbar.html')
      const btn = page.locator('#t1-crop')
      await btn.scrollIntoViewIfNeeded()
      await btn.hover()
      await page.waitForTimeout(500)
      const t = await btn.evaluate((el) => getComputedStyle(el).transform)
      expect.ok(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)', `no movement (got ${t})`)
    },
  },
  {
    name: 'right-to-left: the arrow keys are mirrored (Right goes to the previous tool)',
    async run({ page, goto, expect }) {
      await goto('components/toolbar.html')
      await page.evaluate(() => { document.documentElement.dir = 'rtl' })
      await page.locator('#t1-colour').focus()
      await page.keyboard.press('ArrowRight')
      expect.equal((await state(page, TOOLS)).focused, 't1-light', 'Right moves back in a right-to-left page')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      expect.equal((await state(page, TOOLS)).focused, 't1-effects', 'Left moves forward')
    },
  },
]
