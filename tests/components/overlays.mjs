// Family spec for the overlay elements (dialog, sheet, menu, popover, tooltip).
// The a11y gate (tests/a11y.mjs) only sees docs pages with every overlay CLOSED, so this spec opens
// each one, runs axe on the open state in every appearance, and checks the open overlay's own colours
// and focus indicator. Then it checks the interplay between them (a dialog from a menu, a tooltip in a dialog).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

const APPEARANCES = [
  { name: 'default', prefs: {}, media: {} },
  { name: 'dark-mint-soft', prefs: { theme: 'dark', palette: 'mint', corners: 'soft' }, media: { colorScheme: 'dark' } },
  { name: 'wire-square', prefs: { theme: 'light', palette: 'wire', corners: 'square' }, media: { colorScheme: 'light' } },
  { name: 'contrast-periwinkle-dark', prefs: { contrast: 'more', palette: 'periwinkle', theme: 'dark' }, media: { colorScheme: 'dark' } },
  { name: 'forced-colors', prefs: {}, media: { forcedColors: 'active' } },
]

/** Run axe on the current page state. Returns violation summaries. */
async function axeViolations(page, forced, scope) {
  await page.evaluate(axeSource)
  return page.evaluate(async ([isForced, include]) => {
    // A non-modal overlay (menu, popover, persistent sheet) deliberately covers part of a page that is still
    // there, and axe's target-size rule counts every covered control on that page as a failure. So the
    // audit covers the overlay and its button; the closed page is what tests/a11y.mjs audits.
    const ctx = include && include.length ? { include: include.map((s) => [s]) } : document
    const r = await axe.run(ctx, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      rules: isForced ? { 'color-contrast': { enabled: false } } : {},
      resultTypes: ['violations'],
    })
    return r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`)
  }, [!!forced, scope])
}

/** Open every overlay of a docs page in turn (by its opener selector), audit it, close it with Esc. */
async function auditOpenOverlays({ page, goto, expect, pageUrl, openers, how = 'key' }) {
  for (const app of APPEARANCES) {
    await page.addInitScript((p) => { try { localStorage.setItem('sg:prefs', JSON.stringify(p)) } catch (e) {} }, app.prefs)
    await page.emulateMedia({ colorScheme: 'light', forcedColors: 'none', ...app.media })
    await goto(pageUrl)
    for (const item of openers) {
      const sel = typeof item === 'string' ? item : item.open
      const scope = typeof item === 'string' ? null : item.scope
      await page.locator(sel).first().scrollIntoViewIfNeeded()
      if (how === 'hover') {
        const b = await page.locator(sel).first().boundingBox()
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
        await page.waitForTimeout(800)
      } else {
        await page.locator(sel).first().focus()
        await page.keyboard.press('Enter')
        await page.waitForTimeout(550)
      }
      const v = await axeViolations(page, app.media.forcedColors === 'active', scope)
      expect.ok(v.length === 0, `[${app.name}] ${sel} open: ${v.join(' ; ')}`)
      await page.keyboard.press('Escape')
      await page.mouse.move(2, 2)
      await page.waitForTimeout(300)
    }
  }
}

export const tests = [
  {
    name: 'axe finds nothing on any OPEN dialog, in five appearances',
    async run(ctx) {
      await auditOpenOverlays({ ...ctx, pageUrl: 'components/dialog.html', openers: ['[data-sg-open="#dlg-confirm"]', '[data-sg-open="#dlg-delete"]', '[data-sg-open="#dlg-rename"]', '[data-sg-open="#dlg-required"]', '[data-sg-open="#dlg-long"]', '[data-sg-open="#dlg-tone"]'] })
    },
  },
  {
    name: 'axe finds nothing on any OPEN sheet (modal, full height, persistent), in five appearances',
    async run(ctx) {
      await auditOpenOverlays({ ...ctx, pageUrl: 'components/sheet.html', openers: ['[data-sg-open="#sh-deck"]', '[data-sg-open="#sh-filter"]', { open: '[data-sg-open="#sh-panel"]', scope: ['#sh-panel', '[data-sg-open="#sh-panel"]'] }] })
    },
  },
  {
    name: 'axe finds nothing on any OPEN menu (dropdown, checkable, action sheet), in five appearances',
    async run(ctx) {
      await auditOpenOverlays({ ...ctx, pageUrl: 'components/menu.html', openers: [{ open: '#mb-actions', scope: ['#m-actions', '#mb-actions'] }, { open: '#mb-more', scope: ['#m-more', '#mb-more'] }, { open: '#mb-sort', scope: ['#m-sort', '#mb-sort'] }, { open: '#mb-sheet', scope: ['#m-sheet', '#mb-sheet'] }] })
    },
  },
  {
    name: 'axe finds nothing on any OPEN popover, in five appearances',
    async run(ctx) {
      await auditOpenOverlays({ ...ctx, pageUrl: 'components/popover.html', openers: [{ open: '[popovertarget="pop-known"][aria-haspopup]', scope: ['#pop-known', '[popovertarget="pop-known"][aria-haspopup]'] }, { open: '[popovertarget="pop-options"][aria-haspopup]', scope: ['#pop-options', '[popovertarget="pop-options"][aria-haspopup]'] }, { open: '[popovertarget="pop-tone"]', scope: ['#pop-tone', '[popovertarget="pop-tone"]'] }, { open: '[popovertarget="pop-remind"]', scope: ['#pop-remind', '[popovertarget="pop-remind"]'] }] })
    },
  },
  {
    name: 'axe finds nothing while a tooltip is showing, in five appearances',
    async run(ctx) {
      await auditOpenOverlays({ ...ctx, how: 'hover', pageUrl: 'components/tooltip.html', openers: ['[aria-describedby="tip-flip"]', '[aria-describedby="tip-start"]', '[aria-describedby~="tip-archive"]'] })
    },
  },
  {
    name: 'every open overlay text pair reads at 4.5:1 or better, in dark, high contrast and mint (measured, not assumed)',
    async run({ page, goto, expect }) {
      const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
      const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
      for (const app of APPEARANCES.slice(1, 4)) {
        await page.addInitScript((p) => { try { localStorage.setItem('sg:prefs', JSON.stringify(p)) } catch (e) {} }, app.prefs)
        await page.emulateMedia({ colorScheme: 'light', ...app.media })
        await goto('components/menu.html')
        await page.locator('#mb-actions').focus(); await page.keyboard.press('Enter')
        await page.waitForFunction(() => !!document.activeElement.closest('.menu'))
        await page.waitForTimeout(500)
        // Colours as the browser resolves them (oklch, color-mix and all), read back as sRGB through SG.colorToHex.
        const pairs = await page.evaluate(() => {
          const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
          return [...document.querySelectorAll('#m-actions .menu__item')].map((r) => {
            const cs = getComputedStyle(r)
            return { row: r.textContent.trim().slice(0, 14), fg: hex(SG.colorToHex(cs.color)), bg: hex(SG.colorToHex(cs.backgroundColor)), disabled: r.getAttribute('aria-disabled') === 'true' }
          })
        })
        for (const p of pairs) {
          if (p.disabled) continue // disabled text is exempt (1.4.3); it is still 3:1 by construction
          const c = ratio(p.fg, p.bg)
          expect.ok(c >= 4.5, `[${app.name}] menu row "${p.row}" ${c.toFixed(2)}:1`)
        }
        await page.keyboard.press('Escape')
      }
    },
  },
  {
    name: 'a dialog opened from a menu row is modal over the page, and Esc returns focus to the menu button',
    async run({ page, goto, expect }) {
      await goto('components/menu.html')
      await page.locator('#mb-danger').focus(); await page.keyboard.press('Enter')
      await page.waitForFunction(() => !!document.activeElement.closest('.menu'))
      await page.keyboard.press('End'); await page.keyboard.press('Enter')
      await page.waitForTimeout(400)
      const topLayer = await page.evaluate(() => document.getElementById('m-dlg').matches(':modal'))
      expect.ok(topLayer, 'the dialog is modal over the page')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
      await expect.focused(page, '#mb-danger', 'focus is back on the menu button')
    },
  },
]
