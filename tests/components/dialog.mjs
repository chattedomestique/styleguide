// Interaction spec for Dialog. Drives real keyboard and mouse input in Chromium.
// Docs page: components/dialog.html. Contract: tests/components.mjs.
const open = (page, id) => page.evaluate((i) => document.getElementById(i).open, id)
const css = (page, id, prop, pseudo) => page.evaluate(([i, p, ps]) => getComputedStyle(document.getElementById(i), ps || null).getPropertyValue(p), [id, prop, pseudo])

export const tests = [
  {
    name: 'nothing inside a closed dialog steals focus on page load',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      await expect.focused(page, 'body', 'autofocus inside closed dialogs is ignored')
    },
  },
  {
    name: 'Enter on the opener shows a modal, focus lands on its autofocus control, page scroll is locked',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      await page.locator('[data-sg-open="#dlg-confirm"]').focus()
      await page.keyboard.press('Enter')
      expect.ok(await open(page, 'dlg-confirm'), 'dialog is open')
      expect.ok(await page.evaluate(() => document.getElementById('dlg-confirm').matches(':modal')), 'opened with showModal (modal)')
      await expect.focused(page, '#dlg-confirm [autofocus]')
      expect.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflow), 'hidden', 'page scroll locked')
      await page.keyboard.press('Escape')
      expect.ok(!(await open(page, 'dlg-confirm')), 'Esc closed it')
      expect.ok((await page.evaluate(() => getComputedStyle(document.documentElement).overflow)) !== 'hidden', 'scroll lock released')
    },
  },
  {
    name: 'locking the scroll does not make the page jump sideways (scrollbar width is padded back)',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      const w0 = await page.evaluate(() => Math.round(document.querySelector('main').getBoundingClientRect().width))
      await page.locator('[data-sg-open="#dlg-confirm"]').focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(100)
      const w1 = await page.evaluate(() => Math.round(document.querySelector('main').getBoundingClientRect().width))
      expect.ok(Math.abs(w1 - w0) <= 1, `main stays ${w0}px wide while locked (got ${w1})`)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(100)
      const w2 = await page.evaluate(() => Math.round(document.querySelector('main').getBoundingClientRect().width))
      expect.ok(Math.abs(w2 - w0) <= 1, `and ${w0}px again after (got ${w2})`)
    },
  },
  {
    name: 'Tab and Shift+Tab stay inside the dialog (focus trap, background inert)',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      await page.locator('[data-sg-open="#dlg-long"]').focus()
      await page.keyboard.press('Enter')
      // At the ends Chromium hands focus to the browser's own UI (document.body here) instead of
      // wrapping, which is correct. What must never happen: focus landing on the page behind.
      const where = () => page.evaluate(() => {
        const a = document.activeElement
        return a.closest('#dlg-long') ? 'dialog' : a === document.body ? 'browser-ui' : 'PAGE ' + a.tagName + '.' + a.className
      })
      const seen = new Set()
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab')
        const w = await where()
        expect.ok(w === 'dialog' || w === 'browser-ui', `Tab #${i + 1} landed on ${w}`)
        seen.add(w)
      }
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Shift+Tab')
        const w = await where()
        expect.ok(w === 'dialog' || w === 'browser-ui', `Shift+Tab #${i + 1} landed on ${w}`)
      }
      expect.ok(seen.has('dialog'), 'focus cycles back into the dialog')
    },
  },
  {
    name: 'Esc closes and focus returns to the exact opener',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      await page.locator('[data-sg-open="#dlg-ctx-colours"]').focus()
      await page.keyboard.press('Enter')
      await expect.focused(page, '#dlg-ctx-colours [autofocus]')
      await page.keyboard.press('Escape')
      expect.ok(!(await open(page, 'dlg-ctx-colours')))
      await expect.focused(page, '[data-sg-open="#dlg-ctx-colours"]', 'focus is back on the Delete Colours button')
    },
  },
  {
    name: 'a mouse click on the opener also returns focus to it when closed with a button; returnValue is reported',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      await page.locator('[data-sg-open="#dlg-confirm"]').click()
      await page.locator('#dlg-confirm [value="not now"]').click()
      expect.ok(!(await open(page, 'dlg-confirm')))
      await expect.focused(page, '[data-sg-open="#dlg-confirm"]')
      expect.equal(await page.locator('#dlg-result').textContent(), 'not now', 'returnValue reported')
    },
  },
  {
    name: 'scrim tap dismisses; a click inside and a drag that ends outside do not',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      await page.locator('[data-sg-open="#dlg-confirm"]').focus()
      await page.keyboard.press('Enter')
      const title = await page.locator('#dlg-confirm-t').boundingBox()
      await page.mouse.click(title.x + 4, title.y + 4)
      expect.ok(await open(page, 'dlg-confirm'), 'click inside keeps it open')
      await page.mouse.move(title.x + 4, title.y + 4)
      await page.mouse.down()
      await page.mouse.move(6, 6)
      await page.mouse.up()
      expect.ok(await open(page, 'dlg-confirm'), 'press inside, release on the scrim keeps it open')
      await page.mouse.click(6, 6)
      expect.ok(!(await open(page, 'dlg-confirm')), 'press and release on the scrim dismisses')
      await expect.focused(page, '[data-sg-open="#dlg-confirm"]')
    },
  },
  {
    name: 'destructive alert: alertdialog, names resolve, initial focus is Cancel, Enter does not delete',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      await page.locator('[data-sg-open="#dlg-delete"]').focus()
      await page.keyboard.press('Enter')
      await expect.attr(page, '#dlg-delete', 'role', 'alertdialog')
      await expect.focused(page, '#dlg-delete [value="cancel"]', 'initial focus is the least destructive button')
      const names = await page.evaluate(() => {
        const d = document.getElementById('dlg-delete')
        const t = (a) => document.getElementById(d.getAttribute(a))?.textContent.trim()
        return { label: t('aria-labelledby'), desc: t('aria-describedby'), tag: document.getElementById(d.getAttribute('aria-labelledby')).tagName }
      })
      expect.ok(names.label.length > 3, 'aria-labelledby resolves to visible text')
      expect.equal(names.tag, 'H2', 'the name is a real heading')
      expect.ok(names.desc.length > 10, 'aria-describedby resolves to the message')
      await page.keyboard.press('Enter')
      expect.ok(!(await open(page, 'dlg-delete')), 'Enter on Cancel closes')
      expect.equal(await page.locator('#dlg-result').textContent(), 'cancel', 'nothing was deleted')
    },
  },
  {
    name: 'a status dialog says it with an icon AND words in the bar, not colour alone',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      const bar = await page.evaluate(() => {
        const l = document.querySelector('#dlg-delete .card__label')
        return { icon: !!l.querySelector('.ic'), text: l.textContent.trim(), hidden: l.querySelector('.ic').getAttribute('aria-hidden') }
      })
      expect.ok(bar.icon && bar.hidden === 'true', 'decorative icon is hidden from assistive tech')
      expect.ok(bar.text.length > 5, 'and the words are there: ' + bar.text)
    },
  },
  {
    name: 'form dialog: autofocus field, invalid input blocks Enter, valid Enter saves via returnValue',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      await page.locator('[data-sg-open="#dlg-rename"]').focus()
      await page.keyboard.press('Enter')
      await expect.focused(page, '#dlg-rename-name')
      await page.keyboard.press('Control+A')
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Enter')
      expect.ok(await open(page, 'dlg-rename'), 'empty required field keeps the dialog open')
      await page.keyboard.type('Pantry')
      await page.keyboard.press('Enter')
      expect.ok(!(await open(page, 'dlg-rename')), 'valid submit closes')
      expect.equal(await page.locator('#dlg-result').textContent(), 'renamed to “Pantry”')
      await expect.focused(page, '[data-sg-open="#dlg-rename"]')
    },
  },
  {
    name: 'form dialog: the close control in the bar is type=button, so it cancels without validating',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      await page.locator('[data-sg-open="#dlg-rename"]').focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press('Control+A')
      await page.keyboard.press('Backspace')
      await page.locator('#dlg-rename .card__ctl').click()
      expect.ok(!(await open(page, 'dlg-rename')), 'closed although the required field is empty')
      expect.equal(await page.locator('#dlg-result').textContent(), 'cancel')
    },
  },
  {
    name: 'required dialog ignores Esc (twice) and the scrim, has no close control; its buttons still close it',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      expect.equal(await page.locator('#dlg-required .card__ctl').count(), 0, 'no close control in a required dialog')
      await page.locator('[data-sg-open="#dlg-required"]').focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press('Escape')
      await page.keyboard.press('Escape')
      expect.ok(await open(page, 'dlg-required'), 'Esc does nothing')
      await page.mouse.click(6, 6)
      expect.ok(await open(page, 'dlg-required'), 'scrim tap does nothing')
      await expect.focused(page, '#dlg-required [autofocus]')
      await page.keyboard.press('Enter')
      expect.ok(!(await open(page, 'dlg-required')), 'the button closes it')
    },
  },
  {
    name: 'command / commandfor open and close a dialog and return focus',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      await page.locator('[commandfor="dlg-command"][command="show-modal"]').focus()
      await page.keyboard.press('Enter')
      expect.ok(await open(page, 'dlg-command'), 'opened by command')
      await expect.focused(page, '#dlg-command [autofocus]')
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Enter')
      expect.ok(!(await open(page, 'dlg-command')), 'closed by command="close"')
      await expect.focused(page, '[commandfor="dlg-command"][command="show-modal"]')
    },
  },
  {
    name: 'a long body that holds nothing focusable becomes a named, keyboard-scrollable region',
    viewport: { width: 390, height: 420 },
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      await page.locator('[data-sg-open="#dlg-long"]').focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(400)
      const b = page.locator('#dlg-long .card__body')
      expect.equal(await b.getAttribute('tabindex'), '0', 'body is a tab stop when it scrolls')
      expect.equal(await b.getAttribute('role'), 'region')
      expect.equal(await b.getAttribute('aria-labelledby'), 'dlg-long-t', 'named like the dialog')
      const fits = await page.evaluate(() => { const r = document.getElementById('dlg-long').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight })
      expect.ok(fits, 'the dialog stays inside a short viewport')
      await b.focus()
      await page.keyboard.press('PageDown')
      await page.waitForTimeout(400)
      expect.ok((await b.evaluate((e) => e.scrollTop)) > 0, 'PageDown scrolls the body')
    },
  },
  {
    name: 'the dialog keeps inside narrow screens; its actions stack in DOM order (focus order = visual order)',
    viewport: { width: 320, height: 640 },
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      await page.locator('[data-sg-open="#dlg-delete"]').focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(400)
      const r = await page.evaluate(() => {
        const d = document.getElementById('dlg-delete').getBoundingClientRect()
        const a = [...document.querySelectorAll('#dlg-delete .dialog__actions .btn')].map((b) => b.getBoundingClientRect())
        return { left: d.left, right: d.right, stacked: a[0].top < a[1].top && Math.abs(a[0].left - a[1].left) <= 3, w: a.map((x) => Math.round(x.width)) } // the focused one is lifted 2px
      })
      expect.ok(r.left >= 0 && r.right <= 320, 'no horizontal overflow')
      expect.ok(r.stacked, 'buttons stack, first in the DOM on top (nothing is reversed)')
      expect.ok(r.w.every((w) => w >= 250), `and are full width (${r.w})`)
    },
  },
  {
    name: 'separation is a 2px frame and the scrim: no shadow at all, no z-index, scrim is at least 55% black',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      await page.locator('[data-sg-open="#dlg-confirm"]').focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(400)
      expect.equal(await css(page, 'dlg-confirm', 'border-top-width'), '2px', 'the card frame')
      // The card declares three zero-size layers (select, lift, stack): none may have any extent.
      const sh = await css(page, 'dlg-confirm', 'box-shadow')
      const extent = (sh === 'none' ? '' : sh.replace(/(rgba?|oklch|color)\([^)]*\)/g, '')).match(/-?[\d.]+px/g) ?? []
      expect.ok(extent.every((v) => parseFloat(v) === 0), `a container casts no shadow (${sh})`)
      expect.equal(await css(page, 'dlg-confirm', 'z-index'), 'auto', 'the top layer needs no z-index')
      const a = await page.evaluate(() => {
        const c = getComputedStyle(document.getElementById('dlg-confirm'), '::backdrop').backgroundColor
        const m = c.match(/[\d.]+/g).map(Number)
        return m.length === 4 ? m[3] : 1
      })
      expect.ok(a >= 0.55, `scrim alpha ${a}`)
    },
  },
  {
    name: 'a dialog is a card: tone, bar and corner roles all work on it',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      const r = await page.evaluate(() => {
        const bg = (id) => getComputedStyle(document.getElementById(id)).backgroundColor
        const sq = document.querySelector('[data-corners="square"] dialog')
        const so = document.querySelector('[data-corners="soft"] dialog')
        return { tone: bg('dlg-tone'), plain: bg('dlg-confirm'), sq: getComputedStyle(sq).borderTopLeftRadius, so: getComputedStyle(so).borderTopLeftRadius }
      })
      expect.ok(r.tone !== r.plain, `the tone paints the dialog (${r.tone} vs ${r.plain})`)
      expect.equal(r.sq, '0px', 'square corners')
      expect.equal(r.so, '24px', 'soft corners read --radius-card')
    },
  },
  {
    name: 'reduced motion: the entry has no translation, only a fade',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      const t0 = await page.evaluate(() => {
        const d = document.getElementById('dlg-confirm')
        d.showModal()
        const m = new DOMMatrix(getComputedStyle(d).transform)
        const o = Number(getComputedStyle(d).opacity)
        d.close()
        return { ty: m.m42, sx: m.m11, o }
      })
      expect.equal(t0.ty, 0, 'no vertical travel at the first frame')
      expect.equal(t0.sx, 1, 'no scale at the first frame')
      expect.ok(t0.o < 1, 'but it is fading in, not appearing')
    },
  },
  {
    name: 'full motion: the entry does travel (proves the reduced test can fail)',
    async run({ page, goto, expect }) {
      await goto('components/dialog.html')
      const t0 = await page.evaluate(() => {
        const d = document.getElementById('dlg-confirm')
        d.showModal()
        const m = new DOMMatrix(getComputedStyle(d).transform)
        d.close()
        return m.m42
      })
      expect.ok(t0 > 1, `travel at the first frame is ${t0}px`)
    },
  },
]
