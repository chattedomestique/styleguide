// Interaction spec for Avatar and the avatar stack: the photo falls back to initials, presence is a shape
// and not only a colour, a pressable avatar lifts (a press tints, nothing paints over the person) and keeps a 44px
// hit area, a static one never inherits a lift, and avatars are pictures: chrome-sized, so a stack is one row at 200%.
export const tests = [
  {
    name: 'a photo that fails to load is hidden, so the initials underneath show',
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      const r = await page.evaluate(async () => {
        const host = document.querySelector('#photo ~ .demo .demo__stage')
        const el = document.createElement('span')
        el.className = 'avatar'
        el.setAttribute('role', 'img')
        el.setAttribute('aria-label', 'Test person')
        el.innerHTML = 'TP<img src="data:image/png;base64,AAAA" alt="">'
        host.appendChild(el)
        const img = el.querySelector('img')
        await new Promise((res) => (img.complete ? res() : img.addEventListener('error', res, { once: true })))
        await new Promise((res) => setTimeout(res, 50))
        const out = { hidden: img.hidden, display: getComputedStyle(img).display, text: el.childNodes[0].textContent }
        el.remove()
        return out
      })
      expect.equal(r.hidden, true, 'the broken photo is hidden')
      expect.equal(r.display, 'none', 'and takes no space')
      expect.equal(r.text, 'TP', 'the initials are still there')
    },
  },
  {
    name: 'a photo that loads stays, and covers the initials',
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      const r = await page.evaluate(() => {
        const img = document.querySelector('#photo ~ .demo .avatar > img')
        return { hidden: img.hidden, w: img.naturalWidth, pos: getComputedStyle(img).position }
      })
      expect.equal(r.hidden, false, 'a working photo is not hidden')
      expect.ok(r.w > 0, 'it loaded')
      expect.equal(r.pos, 'absolute', 'laid over the initials')
    },
  },
  {
    name: 'presence is four distinct shapes, in every palette (including wire)',
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      for (const palette of ['default', 'wire']) {
        const keys = await page.evaluate((pal) => {
          const root = document.documentElement
          if (pal === 'default') root.removeAttribute('data-palette'); else root.setAttribute('data-palette', pal)
          const paper = (() => { const p = document.createElement('i'); p.style.color = 'var(--paper)'; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c })()
          return ['online', 'away', 'busy', 'offline'].map((s) => {
            const el = document.querySelector(`#presence ~ .demo .avatar[data-presence="${s}"]`)
            const cs = getComputedStyle(el, '::before')
            const round = parseFloat(cs.borderTopLeftRadius) > 10
            const turned = cs.transform !== 'none'
            const hollow = cs.backgroundColor === paper
            return `${round ? 'round' : 'square'}|${turned ? 'turned' : 'upright'}|${hollow ? 'hollow' : 'filled'}`
          })
        }, palette)
        expect.equal(new Set(keys).size, 4, `${palette}: four different shapes (${keys.join(', ')})`)
      }
    },
  },
  {
    name: 'the presence state is in the accessible name, not only in the dot',
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      const names = await page.evaluate(() => [...document.querySelectorAll('#presence ~ .demo .avatar[data-presence]')].map((el) => `${el.dataset.presence}:${el.getAttribute('aria-label')}`))
      for (const n of names) {
        const [state, label] = n.split(':')
        expect.ok(new RegExp(state, 'i').test(label), `"${label}" says "${state}"`)
      }
    },
  },
  {
    name: 'a pressable avatar raises on hover and keyboard focus, sinks with a light tint when pressed, and keeps a 44px hit area',
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      const a = page.locator('#pressable ~ .demo a.avatar:not(.is-hover):not(.is-focus):not(.is-active)').first()
      const nums = () => a.evaluate((el) => ({ lift: Number(getComputedStyle(el).getPropertyValue('--lift')), fill: Number(getComputedStyle(el).getPropertyValue('--fill')), shadow: getComputedStyle(el).boxShadow, img: getComputedStyle(el.querySelector('img')).filter }))
      await page.waitForTimeout(50)
      const rest = await nums()
      expect.equal(rest.lift, 0, 'rest: flat')
      await a.hover()
      await page.waitForTimeout(400)
      const hover = await nums()
      expect.equal(hover.lift, 1, 'hover: raised')
      expect.equal(hover.fill, 0, 'hover: not filled, so the photo or colour stays the person\'s')
      expect.ok(/4px 4px 0px 0px/.test(hover.shadow), `hard shadow, zero blur (got ${hover.shadow})`)
      await page.mouse.down()
      await page.waitForTimeout(400)
      const down = await nums()
      expect.equal(down.lift, 0, 'pressed: back onto the surface')
      expect.ok(down.fill > 0.05 && down.fill < 0.3, `pressed: a light tint, never a solid fill (--fill ${down.fill})`)
      expect.ok(down.img !== rest.img && /brightness/.test(down.img), `pressed: the photo darkens by the tint (${down.img})`)
      await page.mouse.up()
      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab')
      await a.focus()
      await page.waitForTimeout(400)
      expect.equal((await nums()).lift, 1, 'keyboard focus: same lift as hover')

      const hit = await page.evaluate(() => {
        const el = document.querySelector('#pressable ~ .demo button.avatar[data-size="sm"]')
        el.scrollIntoView({ block: 'center' })
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2
        const at = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)) }
        return { w: r.width, h: r.height, up: at(cx, cy - 21.5), down: at(cx, cy + 21.5), left: at(cx - 21.5, cy), right: at(cx + 21.5, cy) }
      })
      expect.ok(hit.h < 44, `the drawn circle is smaller than 44px (${hit.h})`)
      expect.ok(hit.up && hit.down && hit.left && hit.right, 'the invisible hit area reaches 44x44')
    },
  },
  {
    name: 'a static avatar does not inherit the lift of a hovered card around it',
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      const r = await page.evaluate(() => {
        const card = document.createElement('div')
        card.className = 'card card--link is-hover'
        card.innerHTML = '<div class="card__body"><span class="avatar" role="img" aria-label="Test">TT</span></div>'
        document.body.appendChild(card)
        const av = card.querySelector('.avatar')
        const cs = getComputedStyle(av)
        const out = { lift: getComputedStyle(card).getPropertyValue('--lift'), transform: cs.transform, shadow: cs.boxShadow }
        card.remove()
        return out
      })
      expect.equal(Number(r.lift), 1, 'the card itself is lifted')
      expect.equal(r.transform, 'none', 'the avatar inside does not move')
      expect.equal(r.shadow, 'none', 'and casts no shadow')
    },
  },
  {
    name: 'a stack overlaps by 22%, ends on an inverted +N, and is a labelled list',
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      const r = await page.evaluate(() => {
        const ul = document.querySelector('#stack ~ .demo .avatar-stack')
        const items = [...ul.querySelectorAll(':scope > li > .avatar')]
        const rects = items.map((e) => e.getBoundingClientRect())
        const last = items[items.length - 1]
        const cs = getComputedStyle(last)
        return {
          role: ul.getAttribute('role'),
          label: ul.getAttribute('aria-label'),
          n: items.length,
          size: rects[0].width,
          overlap: rects[0].right - rects[1].left,
          overflowText: last.textContent.trim(),
          overflowBg: cs.backgroundColor,
          firstBg: getComputedStyle(items[0]).backgroundColor,
        }
      })
      expect.equal(r.role, 'list', 'role=list')
      expect.ok(r.label && r.label.length > 5, `labelled ("${r.label}")`)
      expect.ok(Math.abs(r.overlap - r.size * 0.22) < 1.5, `overlap is 22% of ${r.size}px (got ${r.overlap.toFixed(1)})`)
      expect.ok(/^\+\d+$/.test(r.overflowText), `ends on +N (got "${r.overflowText}")`)
      expect.ok(r.overflowBg !== r.firstBg, 'the +N is filled differently from the people')
    },
  },
  {
    name: 'stacked initials are centred in the part that shows',
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      const r = await page.evaluate(() => {
        const ul = document.querySelector('#stack ~ .demo .avatar-stack[data-size="sm"]')
        const first = ul.querySelector('li:first-child > .avatar')
        const second = ul.querySelector('li:nth-child(2) > .avatar')
        const range = document.createRange()
        range.selectNodeContents(first)
        const t = range.getBoundingClientRect()
        const a = first.getBoundingClientRect()
        const visibleRight = second.getBoundingClientRect().left
        return { textRight: t.right, visibleRight, textCentre: (t.left + t.right) / 2, visibleCentre: (a.left + visibleRight) / 2 }
      })
      expect.ok(r.textRight <= r.visibleRight + 0.5, `initials end (${r.textRight.toFixed(1)}) before the next circle starts (${r.visibleRight.toFixed(1)})`)
    },
  },
  {
    name: 'the overflow button in a stack is focusable and named',
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      const b = page.locator('#stack-action ~ .demo button.avatar[data-overflow]')
      await b.focus()
      await expect.focused(page, 'button.avatar[data-overflow]')
      const label = await b.getAttribute('aria-label')
      expect.ok(/more/i.test(label), `named for what it does ("${label}")`)
    },
  },
  {
    name: 'reduced motion: a pressable avatar does not travel',
    reducedMotion: true,
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      const a = page.locator('#pressable ~ .demo a.avatar:not(.is-hover):not(.is-focus):not(.is-active)').first()
      await a.hover()
      await page.waitForTimeout(500)
      const r = await a.evaluate((el) => ({ t: getComputedStyle(el).transform, lift: getComputedStyle(el).getPropertyValue('--lift') }))
      expect.equal(Number(r.lift), 1, 'the shadow still appears')
      expect.ok(r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)', `no movement (got ${r.t})`)
    },
  },
  {
    name: 'the forced .is-focus state draws the 3px ring outside the circle, as a real focus does',
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      const r = await page.locator('#pressable ~ .demo a.avatar.is-focus').first().evaluate((el) => { const cs = getComputedStyle(el); return { s: cs.outlineStyle, w: cs.outlineWidth, o: cs.outlineOffset } })
      expect.equal(r.s, 'solid', 'a ring is drawn')
      expect.equal(r.w, '3px', 'the ring width')
      expect.equal(r.o, '3px', 'outside the circle')
    },
  },
  {
    name: 'the states are named: each pressable sample has its state written under it',
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      const names = await page.evaluate(() => [...document.querySelectorAll('#pressable ~ .demo .av-state')].map((s) => s.querySelector('.t-meta').textContent.trim()))
      expect.equal(names.join(','), 'Rest,Hover,Focus,Pressed,Current,Disabled', 'rest, hover, focus, pressed, current, disabled')
    },
  },
  {
    name: 'a stack of 36px circles holds photos or single letters, not two-letter initials that the next circle covers',
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('.avatar-stack[data-size="sm"] .avatar, .avatar-stack[data-size="xs"] .avatar')].filter((a) => !a.querySelector('img')).map((a) => a.textContent.trim().length))
      expect.ok(r.length > 0 && r.every((n) => n === 1), `single letters at 36px and below (${r.join(',')})`)
    },
  },
  {
    name: 'avatars are pictures: at 200% text every size keeps its 100% size, and every stack stays one row',
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      const read = () => page.evaluate(() => ({
        sizes: [...document.querySelectorAll('#sizes + p + .demo .avatar')].map((a) => Math.round(a.getBoundingClientRect().width)),
        stacks: [...document.querySelectorAll('.avatar-stack')].filter((s) => s.offsetParent).map((s) => new Set([...s.querySelectorAll(':scope > li')].map((li) => Math.round(li.getBoundingClientRect().top + li.getBoundingClientRect().height / 2))).size),
      }))
      const at100 = await read()
      await page.addStyleTag({ content: 'html{font-size:200%}' })
      await page.waitForTimeout(150)
      const at200 = await read()
      expect.equal(at200.sizes.join(), at100.sizes.join(), `sizes stay put (${at100.sizes.join(', ')} at 100%, ${at200.sizes.join(', ')} at 200%)`)
      expect.ok(at200.stacks.length >= 3 && at200.stacks.every((n) => n === 1), `every stack is one row at 200% (rows: ${at200.stacks.join(', ')})`)
    },
  },
  {
    name: 'two initials sit inside the circle at every size, 28px included',
    async run({ page, goto, expect }) {
      await goto('components/avatar.html')
      const r = await page.evaluate(() => [...document.querySelectorAll('.avatar')].filter((a) => a.offsetParent && !a.querySelector('img') && a.textContent.trim().length === 2 && !a.closest('.avatar-stack')).map((a) => {
        const range = document.createRange()
        range.selectNodeContents(a.firstChild)
        const t = range.getBoundingClientRect(), b = a.getBoundingClientRect()
        const bw = parseFloat(getComputedStyle(a).borderLeftWidth)
        // the widest chord at the text's top and bottom edges: the letters must fit inside the ring there
        const rIn = b.width / 2 - bw, cy = b.top + b.height / 2
        const dy = Math.max(Math.abs(t.top - cy), Math.abs(t.bottom - cy)) * 0.6 // cap height, not the line box
        const half = Math.sqrt(Math.max(0, rIn * rIn - dy * dy))
        return { name: a.getAttribute('aria-label') || a.textContent, size: Math.round(b.width), textW: t.width, room: half * 2 }
      }))
      expect.ok(r.length >= 5, `measured ${r.length} avatars`)
      for (const x of r) expect.ok(x.textW <= x.room - 4, `${x.name} (${x.size}px): ${x.textW.toFixed(1)}px of letters in ${x.room.toFixed(1)}px of circle`)
    },
  },
]
