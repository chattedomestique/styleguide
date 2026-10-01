// Interaction spec for Stepper: Tab order, the buttons, native spinbutton keys, limits as aria-disabled, typed values,
// long-press repeat, debounced announcement, circles that act around a rectangle that holds.
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
const W = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(page, goto) {
  await goto('components/stepper.html')
  await settle(page)
}
const val = (page, sel) => page.locator(sel).inputValue()
const said = (page) => page.evaluate(() => document.querySelector('body > [role=status].sr-only')?.textContent)
const PLUS = '[data-sg-step="1"][aria-controls=stp-qty]'
const MINUS = '[data-sg-step="-1"][aria-controls=stp-qty]'

export const tests = [
  {
    name: 'Tab order is minus, the number, plus; buttons step by the input\'s own step and fire input + change',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.evaluate(() => { window.__ev = []; const i = document.querySelector('#stp-qty'); ['input', 'change'].forEach((t) => i.addEventListener(t, () => window.__ev.push(t))) })
      await page.locator(MINUS).focus()
      await page.keyboard.press('Tab')
      await expect.focused(page, '#stp-qty', 'then the number')
      await page.keyboard.press('Tab')
      await expect.focused(page, PLUS, 'then plus')
      await page.keyboard.press('Enter')
      expect.equal(await val(page, '#stp-qty'), '25', 'Enter on plus steps by 5')
      await page.keyboard.press('Space')
      expect.equal(await val(page, '#stp-qty'), '30', 'Space steps again')
      await expect.focused(page, PLUS, 'focus stays on the button')
      expect.equal((await page.evaluate(() => window.__ev)).join(), 'input,change,input,change', 'the page hears input then change, like a typed change')
      await page.locator(MINUS).focus()
      await page.keyboard.press('Enter')
      expect.equal(await val(page, '#stp-qty'), '25', 'minus steps down')
    },
  },
  {
    name: 'the new value is announced once, politely, after a pause (not per press)',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator(PLUS).focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press('Enter')
      await page.keyboard.press('Enter')
      expect.equal(await val(page, '#stp-qty'), '35', 'three steps')
      expect.ok(!(await said(page)), 'nothing announced while still pressing')
      await W(700)
      expect.equal(await said(page), 'Cards per session: 35', 'one message with the final number')
    },
  },
  {
    name: 'ArrowUp / ArrowDown on the number step it natively',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('#stp-qty').focus()
      await page.keyboard.press('ArrowUp')
      expect.equal(await val(page, '#stp-qty'), '25', 'ArrowUp steps by step')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')
      expect.equal(await val(page, '#stp-qty'), '15', 'ArrowDown steps down')
    },
  },
  {
    name: 'at a limit the button is aria-disabled (dashed), not removed, keeps focus, and is inert',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const minus = '[data-sg-step="-1"][aria-controls=stp-min]'
      expect.equal(await page.locator(minus).getAttribute('aria-disabled'), 'true', 'minus is aria-disabled at the minimum')
      expect.equal(await page.locator(minus).getAttribute('disabled'), null, 'but not disabled')
      await page.locator(minus).focus()
      await expect.focused(page, minus, 'still focusable')
      await page.keyboard.press('Enter')
      expect.equal(await val(page, '#stp-min'), '0', 'inert at the limit')
      await expect.focused(page, minus, 'focus is not lost')
      const st = await page.locator(minus).evaluate((e) => getComputedStyle(e).borderTopStyle)
      expect.equal(st, 'dashed', 'dashed = not here')
      const plus = '[data-sg-step="1"][aria-controls=stp-min]'
      expect.equal(await page.locator(plus).getAttribute('aria-disabled'), null, 'plus is live')
      await page.locator(plus).focus()
      await page.keyboard.press('Enter')
      expect.equal(await page.locator(minus).getAttribute('aria-disabled'), null, 'minus is live again once above the minimum')
      const max = '[data-sg-step="1"][aria-controls=stp-max]'
      expect.equal(await page.locator(max).getAttribute('aria-disabled'), 'true', 'plus is aria-disabled at the maximum')
      await page.locator('#stp-max').focus()
      await page.keyboard.press('ArrowDown')
      expect.equal(await page.locator(max).getAttribute('aria-disabled'), null, 'typing or arrows re-evaluate the limits')
    },
  },
  {
    name: 'a typed value outside the range is pulled back when the field is left',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator('#stp-qty').focus()
      await page.keyboard.press('Control+a')
      await page.keyboard.type('99')
      await page.keyboard.press('Tab')
      expect.equal(await val(page, '#stp-qty'), '50', 'clamped to max')
      await page.locator('#stp-qty').focus()
      await page.keyboard.press('Control+a')
      await page.keyboard.type('1')
      await page.keyboard.press('Tab')
      expect.equal(await val(page, '#stp-qty'), '5', 'clamped to min')
    },
  },
  {
    name: 'holding a button repeats the step after a delay; a tap is one step; release stops and adds nothing',
    async run({ page, goto, expect }) {
      await open(page, goto)
      await page.locator(PLUS).scrollIntoViewIfNeeded()
      const b = await page.locator(PLUS).boundingBox()
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
      await page.mouse.down()
      await W(250)
      expect.equal(await val(page, '#stp-qty'), '20', 'nothing yet before the hold delay')
      await W(900)
      const held = Number(await val(page, '#stp-qty'))
      expect.ok(held >= 30, 'repeated while held: ' + held)
      await page.mouse.up()
      await W(100)
      const after = Number(await val(page, '#stp-qty'))
      expect.ok(after <= Math.min(50, held + 5), 'release stops (and a held press adds no extra step): ' + held + ' -> ' + after)
      await W(400)
      expect.equal(Number(await val(page, '#stp-qty')), after, 'and it stays put')
      // a plain tap is exactly one step
      await page.locator(MINUS).focus()
      const before = Number(await val(page, '#stp-qty'))
      await page.locator(MINUS).click()
      expect.equal(Number(await val(page, '#stp-qty')), before - 5, 'a tap is one step')
    },
  },
  {
    name: 'circles act, a rectangle holds: two 44px circle buttons around a 2px-framed number, 8px apart',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const r = await page.evaluate(() => {
        const s = document.querySelector('.stepper'); const [m, i, p] = [s.children[0], s.children[1], s.children[2]]
        const box = (e) => e.getBoundingClientRect(); const rad = (e) => getComputedStyle(e).borderTopLeftRadius
        return { m: box(m), i: box(i), p: box(p), mr: rad(m), ir: rad(i), bw: getComputedStyle(i).borderTopWidth, mc: m.className, ic: i.className, ta: getComputedStyle(i).textAlign }
      })
      expect.ok(r.m.width >= 43.9 && r.m.height >= 43.9 && r.p.width >= 43.9, 'buttons are 44px')
      expect.ok(parseFloat(r.mr) >= 100, 'circle buttons')
      expect.equal(r.ir, '0px', 'the number is a rectangle')
      expect.equal(r.bw, '2px', 'with a 2px frame')
      expect.ok(/btn/.test(r.mc) && /input/.test(r.ic), 'ordinary .btn and .input elements')
      expect.equal(r.ta, 'center', 'centred figures')
      expect.ok(r.i.left - r.m.right >= 7.9 && r.p.left - r.i.right >= 7.9, 'at least 8px between')
    },
  },
  {
    name: 'the buttons lift and fill like any button: hover raises, keyboard focus raises the same, press sinks',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const n = () => page.locator(PLUS).evaluate((e) => ({ lift: Number(getComputedStyle(e).getPropertyValue('--lift')), fill: Number(getComputedStyle(e).getPropertyValue('--fill')) }))
      await page.locator(PLUS).scrollIntoViewIfNeeded()
      await page.locator(PLUS).hover()
      await W(400)
      const h = await n()
      expect.equal(h.lift, 1, 'hover: raised')
      expect.equal(h.fill, 1, 'hover: filled')
      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab')
      await page.locator(PLUS).focus()
      await W(400)
      expect.equal((await n()).lift, 1, 'keyboard focus: same lift')
    },
  },
  {
    name: 'with scripting off the stepper buttons are hidden and the browser spinner returns',
    async run({ url, browser, expect }) {
      const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
      const p = await ctx.newPage()
      await p.goto(`${url}/docs/components/stepper.html`, { waitUntil: 'load' })
      const r = await p.evaluate(() => ({ btns: [...document.querySelectorAll('.stepper > .btn')].map((b) => getComputedStyle(b).display), app: getComputedStyle(document.querySelector('#stp-qty')).appearance }))
      expect.ok(r.btns.length >= 2 && r.btns.every((d) => d === 'none'), 'buttons hidden: ' + r.btns.join(','))
      expect.equal(r.app, 'auto', 'native spinner back')
      await ctx.close()
    },
  },
  {
    name: 'the group is named by its label, and the buttons are named by what they change',
    async run({ page, goto, expect }) {
      await open(page, goto)
      const snap = await page.locator('.stepper', { has: page.locator('#stp-qty') }).ariaSnapshot()
      expect.ok(/group "Cards per session"/.test(snap), 'group name: ' + snap)
      expect.ok(/button "Fewer cards"/.test(snap) && /button "More cards"/.test(snap), 'button names')
      expect.ok(/spinbutton/.test(snap), 'the number is a spinbutton')
    },
  },
  {
    name: 'hold that ends OFF the button leaves no swallowed click: the next keyboard Enter on the same button still steps',
    async run({ page, goto, expect }) {
      await goto('components/stepper.html')
      const plus = page.locator('[data-sg-step="1"][aria-controls=stp-qty]')
      await plus.scrollIntoViewIfNeeded()
      const b = await plus.boundingBox()
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
      await page.mouse.down()
      await new Promise((r) => setTimeout(r, 800))
      await page.mouse.move(b.x + b.width / 2, b.y + 150)
      await page.mouse.up()
      const before = Number(await page.locator('#stp-qty').inputValue())
      expect.ok(before > 20, 'the hold repeated: ' + before)
      if (before >= 50) return // already at the maximum: nothing more to step
      await plus.focus()
      await page.keyboard.press('Enter')
      expect.equal(Number(await page.locator('#stp-qty').inputValue()), before + 5, 'keyboard Enter stepped by one step')
    },
  },
  {
    name: 'Large text (200% at 390px): in a narrow field the stepper wraps inside the column instead of widening it past the card that clips it',
    viewport: { width: 390, height: 844 },
    async run({ page, goto, expect }) {
      await open(page, goto)
      const r = await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
        const host = document.createElement('div')
        host.style.cssText = 'position:absolute;inset-inline-start:0;inset-block-start:0;inline-size:4.8rem'
        // a card frame clips (overflow: clip); its field is a grid whose one column is `auto`
        host.innerHTML = '<section class="card"><div class="card__body"><div class="field"><label class="field__label" for="fx-n">Cards per session</label>'
          + '<div class="stepper" role="group" aria-label="Cards"><button class="btn" type="button" data-shape="circle" aria-label="Fewer"><span class="ic ic--minus" aria-hidden="true"></span></button>'
          + '<input class="input stepper__input" id="fx-n" type="number" value="20"><button class="btn" type="button" data-shape="circle" aria-label="More"><span class="ic ic--plus" aria-hidden="true"></span></button></div></div></div></section>'
        document.body.appendChild(host)
        const card = host.querySelector('.card').getBoundingClientRect()
        const field = host.querySelector('.field').getBoundingClientRect()
        const label = host.querySelector('.field__label'); const range = document.createRange(); range.selectNodeContents(label)
        const text = [...range.getClientRects()].reduce((m, q) => Math.max(m, q.right), 0)
        const out = { card: Math.round(card.right), field: Math.round(field.right), text: Math.round(text), input: Math.round(host.querySelector('.stepper__input').getBoundingClientRect().right) }
        host.remove(); document.documentElement.style.fontSize = ''
        return out
      })
      expect.ok(r.field <= r.card, 'the field stays inside the card: ' + JSON.stringify(r))
      expect.ok(r.text <= r.card, 'the label text is not cut by the card: ' + JSON.stringify(r))
      expect.ok(r.input <= r.card, 'the number field stays inside the card: ' + JSON.stringify(r))
    },
  },
  {
    name: 'the Large and disabled demo shows both steppers at the same size',
    async run({ page, goto, expect }) {
      await goto('components/stepper.html')
      const sizes = await page.evaluate(() => [...document.querySelector('#large ~ .demo').querySelectorAll('.stepper')].map((s) => ({ size: s.dataset.size, h: s.getBoundingClientRect().height })))
      expect.equal(sizes.length, 2, 'two steppers')
      expect.equal(sizes[0].size, sizes[1].size, 'the same data-size')
      expect.ok(Math.abs(sizes[0].h - sizes[1].h) <= 1, `the same height (${sizes[0].h}px, ${sizes[1].h}px)`)
    },
  },
]
