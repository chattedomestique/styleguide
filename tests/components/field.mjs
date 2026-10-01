// Interaction spec for Field: wiring, validation, error summary, counter, groups.
// Keys are pressed for real (Tab, Enter, Space, typing); nothing is faked with element.click() where a key exists.
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
const W = (ms) => new Promise((r) => setTimeout(r, ms))
const tokens = (s) => (s || '').split(/\s+/).filter(Boolean)

async function open(page, goto) {
  await goto('components/field.html')
  await settle(page)
}
/** Put the keyboard modality in place so programmatic focus shows :focus-visible. */
async function keyboardFocus(page, selector) {
  await page.keyboard.press('Tab')
  await page.locator(selector).focus()
}

export const tests = [
  {
    name: 'label is a real <label for>; Tab lands on the control; hint is in aria-describedby',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const input = page.locator('#fld-name')
      expect.equal(await page.evaluate(() => document.querySelector('#fld-name').labels[0].textContent.trim()), 'Name on the card', 'label text')
      expect.ok(tokens(await input.getAttribute('aria-describedby')).includes('fld-name-hint'), 'hint listed in aria-describedby')
      await page.getByLabel('Name on the card').focus()
      await expect.focused(page, '#fld-name', 'getByLabel focuses the control')
      // "(required)" is WORDS in the accessible name, not a lone asterisk
      const name = await page.evaluate(() => document.querySelector('#fld-email').labels[0].textContent.replace(/\s+/g, ' ').trim())
      expect.equal(name, 'Email (required)', 'required is spelled out')
      expect.ok(await page.locator('#fld-email').getAttribute('required') !== null, 'native required is set too')
    },
  },
  {
    name: 'errors do not show on load; after touching a field the browser (:user-invalid) paints the bad frame and the inner second frame',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const frame = (s) => page.evaluate((sel) => { const c = getComputedStyle(document.querySelector(sel)); return { color: c.borderTopColor, shadow: c.boxShadow } }, s)
      const pristine = await frame('#fld-email') // required + empty, never touched
      const neutral = await frame('#fld-phone')
      expect.equal(pristine.color, neutral.color, 'untouched required field is not styled as an error')
      expect.equal(pristine.shadow, neutral.shadow, 'and has no inner frame')
      await page.locator('#fld-email').focus()
      await page.keyboard.type('not-an-email')
      await page.keyboard.press('Tab')
      const touched = await frame('#fld-email')
      expect.ok(touched.color !== pristine.color, 'frame changes colour after interaction')
      expect.ok(touched.shadow !== 'none' && /inset/.test(touched.shadow), 'and gets an inner second frame, so it is not colour alone: ' + touched.shadow)
    },
  },
  {
    name: 'static error: message is linked by aria-describedby, control is aria-invalid, icon + words are visible',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const input = page.locator('#fld-email-bad')
      expect.equal(await input.getAttribute('aria-invalid'), 'true', 'aria-invalid')
      expect.ok(tokens(await input.getAttribute('aria-describedby')).includes('fld-email-bad-msg'), 'error id in aria-describedby')
      const err = page.locator('#fld-email-bad-msg')
      expect.ok(await err.isVisible(), 'error visible')
      expect.ok((await err.textContent()).includes('Enter an email like'), 'says how to fix it')
      expect.equal(await err.locator('.ic').count(), 1, 'has an icon')
      expect.equal(await err.locator('.ic').getAttribute('aria-hidden'), 'true', 'icon is decorative')
      expect.ok(await page.evaluate(() => document.querySelector('#fld-email-bad-msg').textContent.trim().length > 10), 'has words')
    },
  },
  {
    name: 'failed submit: focus goes to the summary, links name each problem, aria-invalid + describedby are set',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('#frm-name').focus()
      await page.keyboard.press('Tab') // email
      await page.keyboard.press('Tab') // message
      await page.keyboard.press('Tab') // terms checkbox
      await page.keyboard.press('Tab') // Send
      await expect.focused(page, 'form[data-demo-form] button[type=submit]', 'Tab reached Send')
      await page.keyboard.press('Enter')
      await expect.focused(page, '[data-sg-summary]', 'focus moved to the error summary')
      expect.ok(await page.locator('[data-sg-summary]').isVisible(), 'summary visible')
      const items = await page.locator('[data-sg-summary] li a').allTextContents()
      expect.equal(items.length, 3, 'three problems listed')
      expect.ok(items.includes('Enter your name'), 'name message')
      expect.ok(items.includes('Enter your email'), 'email message')
      expect.ok(items.includes('Tick the box to accept the terms'), 'terms message')
      for (const id of ['frm-name', 'frm-email']) {
        expect.equal(await page.locator('#' + id).getAttribute('aria-invalid'), 'true', id + ' aria-invalid')
        const d = tokens(await page.locator('#' + id).getAttribute('aria-describedby'))
        const errId = await page.evaluate((i) => document.getElementById(i).closest('.field').querySelector('.field__error').id, id)
        expect.ok(d.includes(errId), id + ' describedby lists its error')
      }
      expect.ok(await page.locator('[data-sg-summary] [role=alert] h2').isVisible(), 'heading inside role=alert')
      expect.ok(await page.locator('[data-sg-summary]').evaluate((e) => e.classList.contains('card') && e.getAttribute('data-tone') === 'bad'), 'the summary is a card in the bad tone')
    },
  },
  {
    name: 'summary links move focus to the field; fixing a field clears its error and its summary entry',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('#frm-name').focus()
      await page.locator('form[data-demo-form] button[type=submit]').focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press('Tab') // first link
      await expect.focused(page, '[data-sg-summary] li:first-child a', 'Tab walks the links')
      await page.keyboard.press('Enter')
      await expect.focused(page, '#frm-name', 'Enter on a link focuses its field')
      await page.keyboard.type('Jay')
      // live validation: the error clears while typing, and so does the summary entry
      expect.equal(await page.locator('#frm-name').getAttribute('aria-invalid'), null, 'aria-invalid removed once valid')
      const d = tokens(await page.locator('#frm-name').getAttribute('aria-describedby'))
      const errId = await page.evaluate(() => document.querySelector('#frm-name').closest('.field').querySelector('.field__error').id)
      expect.ok(!d.includes(errId), 'the hidden error id is NOT left in aria-describedby (hidden descriptions are still read)')
      expect.equal(await page.locator('[data-sg-summary] li').count(), 2, 'summary now lists two')
    },
  },
  {
    name: 'email: type mismatch gives the "how to fix" message; valid input clears it; a clean form submits',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('#frm-email').focus()
      await page.keyboard.type('jay@')
      await page.keyboard.press('Tab') // leave the field -> validate (it has a value)
      expect.equal(await page.locator('#frm-email').getAttribute('aria-invalid'), 'true', 'invalid after leaving')
      const msg = await page.locator('#frm-email').evaluate((el) => el.closest('.field').querySelector('.field__error').textContent.trim())
      expect.equal(msg, 'Enter an email like you@example.com', 'type message')
      await page.locator('#frm-email').focus()
      await page.keyboard.type('x.com') // -> jay@x.com
      expect.equal(await page.locator('#frm-email').getAttribute('aria-invalid'), null, 'cleared when fixed')
      // fill the rest and submit with the keyboard
      await page.locator('#frm-name').focus()
      await page.keyboard.type('Jay')
      await page.locator('input[name=terms]').focus()
      await page.keyboard.press('Space')
      await page.keyboard.press('Tab') // Send
      await page.keyboard.press('Enter')
      await W(120)
      expect.ok(await page.locator('[data-sg-summary]').isHidden(), 'summary hidden on success')
      expect.ok((await page.locator('[data-demo-status]').textContent()).includes('Thanks'), 'sg:validated reached the page, which took over the submit')
      expect.equal(await page.evaluate(() => location.search), '', 'the page did not navigate (the handler cancelled the submit)')
    },
  },
  {
    name: 'character counter: hard limit counts down; the polite live region speaks once after typing pauses',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const counter = page.locator('#fld-bio').locator('xpath=ancestor::*[contains(@class,"field")][1]').locator('.field__counter')
      expect.equal((await counter.textContent()).trim(), '120 characters left', 'initial text')
      const live = page.locator('#fld-bio').locator('xpath=ancestor::*[contains(@class,"field")][1]').locator('[role=status]')
      expect.equal(await live.getAttribute('aria-live'), 'polite', 'polite, not assertive')
      await page.locator('#fld-bio').focus()
      await page.keyboard.type('Hello there')
      expect.equal((await counter.textContent()).trim(), '109 characters left', 'visible count follows each keystroke')
      expect.equal((await live.textContent()).trim(), '', 'nothing announced while still typing')
      await W(1300)
      expect.equal((await live.textContent()).trim(), '109 characters left', 'announced once after the pause')
      expect.equal(await page.locator('#fld-bio').getAttribute('maxlength'), '120', 'hard limit is the native maxlength')
    },
  },
  {
    name: 'soft limit: over the limit the counter changes words + weight, and the form refuses to submit',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const counter = page.locator('#fld-tagline').locator('xpath=ancestor::*[contains(@class,"field")][1]').locator('.field__counter')
      expect.equal((await counter.textContent()).trim(), '8 characters over', 'words say how far over')
      expect.equal(await counter.getAttribute('data-state'), 'over', 'state attribute')
      expect.ok(await page.evaluate(() => Number(getComputedStyle(document.querySelector('#fld-tagline').closest('.field').querySelector('.field__counter')).fontWeight) >= 700), 'heavier weight, not colour alone')
      // inside the validating form: typing past 60 characters makes the field invalid
      await page.locator('#frm-note').focus()
      await page.keyboard.type('x'.repeat(65))
      expect.equal(await page.locator('#frm-note').getAttribute('aria-invalid'), 'true', 'soft limit exceeded -> aria-invalid')
      expect.equal(await page.evaluate(() => document.querySelector('#frm-note').validity.customError), true, 'customError drives checkValidity')
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace') // 60 again
      expect.equal(await page.locator('#frm-note').getAttribute('aria-invalid'), null, 'back under the limit -> valid')
    },
  },
  {
    name: 'fieldset group: the legend names the group and the hint is described on the fieldset',
    async run({ page, goto, expect }) {
      await open(page, goto)
      expect.equal(await page.evaluate(() => document.querySelector('#fld-contact-hint').closest('fieldset').tagName), 'FIELDSET', 'is a fieldset')
      expect.ok(tokens(await page.locator('fieldset[aria-describedby]').first().getAttribute('aria-describedby')).includes('fld-contact-hint'), 'fieldset describedby')
      const snap = await page.locator('fieldset', { has: page.locator('#fld-contact-hint') }).ariaSnapshot()
      expect.ok(/group "How should we remind you\? \(required\)"/.test(snap), 'group is named by its legend: ' + snap.split('\n')[0])
      // one Tab stop for the radios
      await page.locator('input[name=fld-contact]').first().focus()
      await page.keyboard.press('ArrowDown')
      await expect.focused(page, 'input[name=fld-contact][value=email]', 'arrow moves within the group')
    },
  },
  {
    name: 'inline layout shares a row on a wide screen and stacks on a phone (no media query); the hint stays in the label column, so stacked it reads label, hint, control like every field',
    viewport: { width: 1100, height: 800 },
    async run({ page, goto, expect }) {
      await open(page, goto)
      const rect = (s) => page.locator(s).evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, b: r.bottom, r: r.right } })
      const label = await rect('label[for=fld-city]')
      const input = await rect('#fld-city')
      const hint = await rect('#fld-city-hint')
      expect.ok(input.x > label.r - 1, 'wide: control starts to the right of the label')
      expect.ok(Math.abs(hint.x - label.x) < 1 && hint.y >= label.b - 1, 'wide: the hint is under the label, in its column')
      expect.ok(hint.r <= input.x + 1, 'wide: the hint does not reach into the control column')
      await page.setViewportSize({ width: 390, height: 800 })
      await settle(page)
      const l2 = await rect('label[for=fld-city]')
      const h2 = await rect('#fld-city-hint')
      const i2 = await rect('#fld-city')
      expect.ok(h2.y >= l2.b - 1 && i2.y >= h2.b - 1, 'narrow: label, then hint, then control (the stacked order)')
      const gaps = await page.evaluate(() => {
        const g = (a, b) => document.querySelector(b).getBoundingClientRect().top - document.querySelector(a).getBoundingClientRect().bottom
        return { inline: [g('label[for=fld-city]', '#fld-city-hint'), g('#fld-city-hint', '#fld-city')], stacked: [g('label[for=fld-name]', '#fld-name-hint'), g('#fld-name-hint', '#fld-name')] }
      })
      expect.ok(Math.abs(gaps.inline[0] - gaps.stacked[0]) < 1 && Math.abs(gaps.inline[1] - gaps.stacked[1]) < 1, 'narrow: the same spacing as the stacked field: ' + JSON.stringify(gaps))
    },
  },
  {
    name: 'focus ring is visible on an input (square and soft corners) and on the error summary',
    async run({ page, goto, expect }) {
      await open(page, goto)
      for (const corners of ['square', 'soft']) {
        await page.evaluate((c) => document.documentElement.setAttribute('data-corners', c), corners)
        await keyboardFocus(page, '#fld-name')
        const ring = await page.evaluate(() => { const c = getComputedStyle(document.querySelector('#fld-name')); return { o: c.outlineStyle, ow: parseFloat(c.outlineWidth), s: c.boxShadow } })
        expect.ok(ring.o !== 'none' && ring.ow >= 2, corners + ': outline ring')
        expect.ok(ring.s !== 'none', corners + ': paper halo kept')
      }
      await page.locator('#frm-name').focus()
      await page.locator('form[data-demo-form] button[type=submit]').focus()
      await page.keyboard.press('Enter')
      const sum = await page.evaluate(() => { const c = getComputedStyle(document.querySelector('[data-sg-summary]')); return { o: c.outlineStyle, ow: parseFloat(c.outlineWidth) } })
      expect.ok(sum.o !== 'none' && sum.ow >= 2, 'the focused summary shows a ring')
    },
  },
  {
    name: 'reset clears errors and hides the summary',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('form[data-demo-form] button[type=submit]').focus()
      await page.keyboard.press('Enter')
      expect.ok(await page.locator('[data-sg-summary]').isVisible(), 'summary showing')
      await page.locator('form[data-demo-form] button[type=reset]').focus()
      await page.keyboard.press('Enter')
      await W(50)
      expect.ok(await page.locator('[data-sg-summary]').isHidden(), 'summary hidden after reset')
      expect.equal(await page.locator('#frm-name').getAttribute('aria-invalid'), null, 'errors cleared')
    },
  },
  {
    name: 'an example address in an error message moves to the next line whole when it fits there, splits only after the @ or the dot when it must, and never leaves "like" on a line of its own (320 and 390 px, 100% and 200% text)',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await goto('components/field.html')
      const read = () => page.evaluate(() => ['fld-email-bad-msg', 'ctx-email-msg'].map((id) => {
        const s = document.getElementById(id).querySelector('span:last-child')
        const w = document.createTreeWalker(s, NodeFilter.SHOW_TEXT), lines = new Map()
        let n
        while ((n = w.nextNode())) for (let i = 0; i < n.length; i++) {
          const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1)
          const q = r.getClientRects()[0]; if (!q) continue
          const k = Math.round(q.top / 4); lines.set(k, (lines.get(k) || '') + n.data[i])
        }
        return { id, lines: [...lines.values()].map((x) => x.trim()) }
      }))
      for (const [w, text] of [[320, 100], [390, 100], [320, 200], [390, 200]]) {
        await page.setViewportSize({ width: w, height: 844 })
        await page.evaluate((t) => { document.documentElement.style.fontSize = t + '%' }, text)
        await page.waitForTimeout(100)
        for (const r of await read()) {
          const where = `${w}px, ${text}%, ${r.id}: ${r.lines.join(' / ')}`
          if (text === 100) expect.ok(r.lines.some((l) => l.endsWith('you@example.com')), `${where}: the address is whole`)
          expect.ok(!r.lines.some((l) => l === 'like'), `${where}: no lone "like"`)
          // a line that ends inside the address ends after its @ or its dot, never inside a word
          const addr = r.lines.filter((l) => /you@|example|^com$/.test(l))
          for (const l of addr.slice(0, -1)) expect.ok(/[@.]$/.test(l), `${where}: the address splits after the @ or the dot ("${l}")`)
        }
      }
    },
  },
]
