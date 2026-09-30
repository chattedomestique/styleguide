// Interaction spec for Keypad: entry by tap, by hardware keys, the rules and their announcements, the confirm button,
// the standard 3 x 4 order, sizes and gaps, localisation, hold-to-delete, forced state.
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
const W = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(page, goto) {
  await goto('components/keypad.html')
  await settle(page)
}
const PAD = '.keypad:has(#kp-amt)'
const key = (k) => `${PAD} [data-key="${k}"]`
const shown = (page) => page.locator('#kp-amt').textContent()
const said = (page) => page.evaluate(() => document.querySelector('body > [role=status].sr-only')?.textContent)
const tap = async (page, ...ks) => { for (const k of ks) await page.locator(key(k)).click() }

export const tests = [
  {
    name: 'tapping keys builds the amount, grouped and formatted by Intl; the plain value is in the event',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.evaluate(() => { window.__d = []; document.querySelector('.keypad:has(#kp-amt)').addEventListener('sg:keypad', (e) => window.__d.push(e.detail)) })
      expect.equal(await shown(page), '$0', 'starts at zero')
      await tap(page, '1', '2', '3', '4')
      expect.equal(await shown(page), '$1,234', 'grouping separator')
      await tap(page, '.', '5')
      expect.equal(await shown(page), '$1,234.5', 'decimal part as typed (no padding while typing)')
      const d = await page.evaluate(() => window.__d.at(-1))
      expect.equal(d.raw, '1234.5', 'raw value')
      expect.equal(d.value, 1234.5, 'numeric value')
      expect.equal(d.formatted, '$1,234.5', 'formatted value')
      await tap(page, 'back')
      expect.equal(await shown(page), '$1,234.', 'Backspace removes one character (the digit)')
      await tap(page, 'back')
      expect.equal(await shown(page), '$1,234', 'then the point')
    },
  },
  {
    name: 'the display is an <output>: a polite, atomic live region, labelled by a real <label>',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const o = await page.locator('#kp-amt').evaluate((e) => ({ tag: e.tagName, live: e.getAttribute('aria-live'), atomic: e.getAttribute('aria-atomic'), label: e.labels[0]?.textContent.trim() }))
      expect.equal(o.tag, 'OUTPUT', 'an output element')
      expect.equal(o.live, 'polite', 'polite')
      expect.equal(o.atomic, 'true', 'atomic: the whole amount is read')
      expect.equal(o.label, 'Amount to send', 'labelled')
    },
  },
  {
    name: 'a hardware keyboard works while focus is in the keypad: digits, the point or comma, Backspace, Delete',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator(key('5')).focus()
      await page.keyboard.type('40.5')
      expect.equal(await shown(page), '$40.5', 'typed 4 0 . 5')
      await page.keyboard.press('Backspace')
      expect.equal(await shown(page), '$40.', 'Backspace')
      await page.keyboard.press('Delete')
      await page.keyboard.type(',25')
      expect.equal(await shown(page), '$40.25', 'comma works as the point')
      await page.keyboard.press('Control+1')
      expect.equal(await shown(page), '$40.25', 'shortcuts with Ctrl are left alone')
      // Enter still presses the FOCUSED button (keyboard-only people use it)
      await page.locator(key('7')).focus()
      await page.keyboard.press('Enter')
      expect.equal(await shown(page), '$40.25', 'the third decimal is refused, even through Enter on a key')
    },
  },
  {
    name: 'rules: one point, two decimals, never above data-max; refusals change nothing, are announced, and mark the display',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await tap(page, '1', '.', '5', '0')
      await tap(page, '5')
      expect.equal(await shown(page), '$1.50', 'third decimal refused')
      await W(120)
      expect.equal(await said(page), 'Only 2 decimal places', 'announced')
      await tap(page, '.')
      await W(120)
      expect.equal(await said(page), 'Already has a decimal point', 'second point refused')
      expect.equal(await shown(page), '$1.50', 'value unchanged')
      // leading zero is replaced, not stacked
      await tap(page, 'back', 'back', 'back', 'back', 'back')
      expect.equal(await shown(page), '$0', 'empty shows the muted zero')
      await tap(page, '0', '0', '7')
      expect.equal(await shown(page), '$7', 'leading zeros are not stacked')
      await tap(page, 'back', '.')
      expect.equal(await shown(page), '$0.', 'a point first gives 0.')
      // max
      await tap(page, 'back', 'back', '5', '0', '0', '0')
      expect.equal(await shown(page), '$5,000', 'exactly the maximum is fine')
      await tap(page, '1')
      await W(120)
      expect.equal(await shown(page), '$5,000', 'above the maximum is refused')
      expect.equal(await said(page), 'Maximum is $5,000.00', 'and said in words, with the limit formatted')
      expect.equal(await page.locator(PAD).getAttribute('data-state'), 'limit', 'the keypad marks the refusal')
      const f = await page.locator('#kp-amt').evaluate((e) => ({ sh: getComputedStyle(e).boxShadow, col: getComputedStyle(e).borderTopColor }))
      expect.ok(/inset/.test(f.sh), 'the display frame doubles (not colour alone): ' + f.sh)
      await W(1600)
      expect.equal(await page.locator(PAD).getAttribute('data-state'), null, 'and lets go after a moment')
    },
  },
  {
    name: 'the confirm button is aria-disabled until there is an amount, stays focusable, and is inert',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const c = `${PAD} [data-sg-keypad-confirm]`
      expect.equal(await page.locator(c).getAttribute('aria-disabled'), 'true', 'off at zero')
      expect.equal(await page.locator(c).getAttribute('disabled'), null, 'not disabled: it keeps focus and its reason')
      expect.ok(await page.locator(c).getAttribute('aria-describedby'), 'with a reason to read')
      await page.locator(c).focus()
      await page.keyboard.press('Enter')
      expect.equal(await page.locator(`${PAD} [data-demo-status]`).textContent(), '', 'Enter does nothing while off')
      await tap(page, '2')
      expect.equal(await page.locator(c).getAttribute('aria-disabled'), null, 'on once there is an amount')
      await page.locator(c).focus()
      await page.keyboard.press('Enter')
      await W(200)
      expect.ok((await page.locator(`${PAD} [data-demo-status]`).textContent()).includes('$2'), 'the app hears the confirm with the amount')
      await tap(page, 'back')
      expect.equal(await page.locator(c).getAttribute('aria-disabled'), 'true', 'off again at zero')
    },
  },
  {
    name: 'phone-standard 3 x 4 order in the DOM and on screen; every key is a real button named by its text (2.5.3)',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const r = await page.locator(`${PAD} .keypad__keys`).evaluate((g) => {
        const ks = [...g.children]
        return { role: g.getAttribute('role'), label: g.getAttribute('aria-label'), keys: ks.map((k) => { const b = k.getBoundingClientRect(); return { tag: k.tagName, text: k.textContent.trim(), name: k.getAttribute('aria-label'), x: Math.round(b.x), y: Math.round(b.y), w: b.width, h: b.height } }) }
      })
      expect.equal(r.role, 'group', 'role=group')
      expect.equal(r.label, 'Number pad', 'labelled')
      expect.equal(r.keys.map((k) => k.text || '').join(''), '123456789.0', 'DOM order 1-9, point, 0 (delete is an icon)')
      expect.ok(r.keys.every((k) => k.tag === 'BUTTON'), 'all buttons')
      const rows = [...new Set(r.keys.map((k) => k.y))]
      expect.equal(rows.length, 4, 'four rows')
      expect.equal(r.keys.slice(0, 3).map((k) => k.text).join(''), '123', 'first row 1 2 3')
      expect.ok(r.keys[0].x < r.keys[1].x && r.keys[1].x < r.keys[2].x, 'left to right')
      expect.equal(r.keys[11].name, 'Delete last digit', 'the icon key has an action name')
      expect.equal(r.keys[9].name, 'Decimal point', 'the punctuation key has a spoken name')
      for (const k of r.keys.filter((x) => /^[0-9]$/.test(x.text))) expect.ok(!k.name, 'digit ' + k.text + ' is named by its visible text')
    },
  },
  {
    name: 'keys are at least 44px (up to 88) and circles with at least 8px between them, at 390 and 320 wide',
    async run({ page, goto, expect }) {
      await open(page, goto)
      for (const w of [390, 320]) {
        await page.setViewportSize({ width: w, height: 844 })
        await settle(page)
        const r = await page.locator(`${PAD} .keypad__keys`).evaluate((g) => [...g.children].map((k) => { const b = k.getBoundingClientRect(); return { x: b.x, y: b.y, r: b.right, b: b.bottom, w: b.width, h: b.height, rad: getComputedStyle(k).borderTopLeftRadius } }))
        expect.ok(r.every((k) => k.w >= 43.9 && k.h >= 43.9), w + ': every key >= 44')
        expect.ok(r.every((k) => Math.abs(k.w - k.h) < 1), w + ': circles are square boxes')
        expect.ok(r.every((k) => parseFloat(k.rad) >= 100), w + ': round')
        expect.ok(r[1].x - r[0].r >= 7.9, w + ': 8px across: ' + (r[1].x - r[0].r))
        expect.ok(r[3].y - r[0].b >= 7.9, w + ': 8px down: ' + (r[3].y - r[0].b))
        if (w === 390) expect.ok(r[0].w >= 80, 'phone width keys are 88: ' + r[0].w)
      }
    },
  },
  {
    name: 'keys are ordinary buttons: hover and keyboard focus raise and fill them, press sinks them',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const n = () => page.locator(key('5')).evaluate((e) => ({ lift: Number(getComputedStyle(e).getPropertyValue('--lift')), fill: Number(getComputedStyle(e).getPropertyValue('--fill')) }))
      await page.locator(key('5')).scrollIntoViewIfNeeded()
      await page.locator(key('5')).hover()
      await W(400)
      expect.equal((await n()).lift, 1, 'hover: raised')
      expect.equal((await n()).fill, 1, 'hover: filled')
      await page.mouse.down()
      await W(300)
      expect.equal((await n()).lift, 0, 'pressed: sunk')
      await page.mouse.up()
      await page.mouse.move(0, 0)
      await W(300)
      await page.keyboard.press('Tab')
      await page.locator(key('6')).focus()
      await W(400)
      const f = await page.locator(key('6')).evaluate((e) => Number(getComputedStyle(e).getPropertyValue('--lift')))
      expect.equal(f, 1, 'keyboard focus: same lift as hover')
    },
  },
  {
    name: 'holding delete keeps deleting; a tap deletes exactly one',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await tap(page, '1', '2', '3', '4')
      await tap(page, 'back')
      expect.equal(await shown(page), '$123', 'a tap is one')
      await page.locator(key('back')).scrollIntoViewIfNeeded()
      const b = await page.locator(key('back')).boundingBox()
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
      await page.mouse.down()
      await W(1200)
      await page.mouse.up()
      await W(100)
      expect.equal(await shown(page), '$0', 'held until empty')
      await tap(page, '9')
      expect.equal(await shown(page), '$9', 'and the next tap after a hold is not swallowed')
    },
  },
  {
    name: 'whole numbers: the point key is aria-disabled and inert, digits are capped, the minimum gates the button',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const pad = '.keypad:has(#kp-cards)'
      const pt = `${pad} [data-key="."]`
      expect.equal(await page.locator(pt).getAttribute('aria-disabled'), 'true', 'point is aria-disabled')
      expect.equal(await page.locator(`#kp-cards`).textContent(), '20', 'starts at data-value')
      const c = `${pad} [data-sg-keypad-confirm]`
      expect.equal(await page.locator(c).getAttribute('aria-disabled'), null, '20 is above the minimum of 5')
      await page.locator(`${pad} [data-key="back"]`).click()
      await page.locator(`${pad} [data-key="back"]`).click()
      await page.locator(`${pad} [data-key="3"]`).click()
      expect.equal(await page.locator(c).getAttribute('aria-disabled'), 'true', '3 is below data-min=5')
      await page.locator(`${pad} [data-key="5"]`).click()
      await page.locator(`${pad} [data-key="5"]`).click()
      await page.locator(`${pad} [data-key="5"]`).click()
      expect.equal(await page.locator('#kp-cards').textContent(), '355', 'three digits at most')
      await W(120)
      expect.equal(await said(page), 'No more digits', 'said when refused')
      await page.locator(pt).focus()
      await page.keyboard.press('Enter')
      expect.equal(await page.locator('#kp-cards').textContent(), '355', 'the aria-disabled point key is inert even from the keyboard')
    },
  },
  {
    name: 'follows the page language: the separator, grouping and the currency side come from Intl',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.evaluate(() => { document.documentElement.lang = 'de'; const p = document.querySelector('.keypad:has(#kp-amt)'); p.setAttribute('data-currency', 'EUR'); SG.keypad.set(p, '1234.5') })
      const t = (await shown(page)).replace(/\s/g, ' ')
      expect.equal(t, '1.234,5 €', 'German: dot grouping, decimal comma, euro after')
      await page.evaluate(() => SG.keypad.init())
      expect.equal((await page.locator(key('.')).textContent()).trim(), ',', 'the point key shows the language separator')
    },
  },
  {
    name: 'a hidden input inside the keypad receives the plain value for a form post',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.evaluate(() => { const p = document.querySelector('.keypad:has(#kp-amt)'); const h = document.createElement('input'); h.type = 'hidden'; h.name = 'amount'; h.id = 'kp-hidden'; p.append(h) })
      await tap(page, '1', '2', '.', '5')
      expect.equal(await page.locator('#kp-hidden').inputValue(), '12.5', 'plain number string')
    },
  },
  {
    name: 'the display grows from the keypad\'s own width and wraps at 200% text without scrolling sideways',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.addStyleTag({ content: 'html{font-size:200%}' })
      await tap(page, '4', '9', '9', '9', '.', '9', '9')
      await settle(page)
      const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
      expect.ok(r.sw <= r.cw + 1, `no sideways scroll at 200% text (${r.sw} vs ${r.cw})`)
    },
  },
  {
    name: 'narrow column at large text: keys stay circles and never overlap (a .btn floor of --hit = 88 px at 200 % pushed them into each other)',
    viewport: { width: 320, height: 700 },
    async run({ page, goto, expect }) {
      await open(page, goto)
      // a realistic column: a 288 px app column (320 px phone, 16 px gutters) at 200 % text, not the docs page's own padding
      await page.addStyleTag({ content: 'html{font-size:200%!important} .keypad:has(#kp-amt){inline-size:288px;max-inline-size:288px}' })
      await settle(page)
      const r = await page.evaluate(() => {
        const keys = [...document.querySelectorAll('.keypad:has(#kp-amt) .keypad__key')].map((k) => k.getBoundingClientRect())
        let overlap = 0
        for (let a = 0; a < keys.length; a++) for (let b = a + 1; b < keys.length; b++) {
          const x = Math.min(keys[a].right, keys[b].right) - Math.max(keys[a].left, keys[b].left)
          const y = Math.min(keys[a].bottom, keys[b].bottom) - Math.max(keys[a].top, keys[b].top)
          if (x > 0.5 && y > 0.5) overlap++
        }
        return { overlap, round: keys.every((k) => Math.abs(k.width - k.height) < 1), min: Math.min(...keys.map((k) => k.width)), width: Math.max(...keys.map((k) => k.right)) - Math.min(...keys.map((k) => k.left)) }
      })
      expect.equal(r.overlap, 0, 'no two keys overlap')
      expect.ok(r.round, 'every key is a circle')
      expect.ok(r.min >= 44, 'and none is under 44 px: ' + r.min)
      expect.ok(r.width <= 289, 'the pad stays inside its 288 px column: ' + r.width)
    },
  },
  {
    name: 'hold-to-delete that ends OFF the key leaves no swallowed click: the next keyboard Enter on Delete still deletes',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await tap(page, '1', '2', '3', '4')
      const back = page.locator(key('back'))
      await back.scrollIntoViewIfNeeded()
      const b = await back.boundingBox()
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
      await page.mouse.down()
      await W(700)
      await page.mouse.move(b.x - 120, b.y + b.height / 2)
      await page.mouse.up()
      const after = await shown(page)
      expect.ok(after !== '$1,234', 'the hold repeated: ' + after)
      await back.focus()
      await page.keyboard.press('Enter')
      const next = await shown(page)
      expect.ok(next.replace(/\D/g, '').length === after.replace(/\D/g, '').length - 1 || (after === '$0' && next === '$0'), 'Enter deleted one more digit: ' + after + ' -> ' + next)
    },
  },
]
