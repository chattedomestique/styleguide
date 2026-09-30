#!/usr/bin/env node
/**
 * Interaction tests for components: keyboard behaviour, ARIA state changes, focus management.
 * axe (tests/a11y.mjs) cannot know that arrow keys should move between tabs; these specs do.
 *
 *   npm run test:components                  run every spec in tests/components/
 *   npm run test:components -- button tabs   only these
 *
 * A spec is tests/components/<name>.mjs:
 *
 *   export const tests = [
 *     { name: 'arrow keys move selection', async run({ page, goto, expect }) {
 *         await goto('components/tabs.html')
 *         await page.locator('[role=tab]').first().focus()
 *         await page.keyboard.press('ArrowRight')
 *         expect.ok(await page.locator('[role=tab][aria-selected=true]').count() === 1, 'exactly one selected tab')
 *     } },
 *   ]
 *
 * Every spec should cover: Tab reaches it; the documented keys work; aria-* state flips with the
 * visual state; Escape/focus return for overlays; nothing throws in the console.
 */
import { readdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import { start, ROOT } from './lib/browser.mjs'

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const dir = join(ROOT, 'tests', 'components')
const specs = (existsSync(dir) ? readdirSync(dir) : []).filter((f) => f.endsWith('.mjs') && (!only.length || only.includes(basename(f, '.mjs')))).sort()

const expect = {
  ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy') },
  equal(a, b, msg) { if (a !== b) throw new Error(`${msg || 'not equal'}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`) },
  async focused(page, selector, msg) {
    const ok = await page.evaluate((s) => document.activeElement?.matches(s), selector)
    if (!ok) throw new Error(`${msg || 'focus'}: expected focus on ${selector}, but it is on ${await page.evaluate(() => { const e = document.activeElement; return e ? e.tagName + (e.className ? '.' + e.className : '') : 'nothing' })}`)
  },
  async attr(page, selector, name, value, msg) {
    const got = await page.locator(selector).first().getAttribute(name)
    if (got !== value) throw new Error(`${msg || selector + ' @' + name}: expected ${JSON.stringify(value)}, got ${JSON.stringify(got)}`)
  },
}

const { browser, url, close } = await start()
let pass = 0, fail = 0
try {
  for (const file of specs) {
    const mod = await import(pathToFileURL(join(dir, file)).href)
    for (const t of mod.tests ?? []) {
      const ctx = await browser.newContext({ viewport: t.viewport ?? { width: 390, height: 844 }, hasTouch: !!t.touch, reducedMotion: t.reducedMotion ? 'reduce' : 'no-preference' })
      const page = await ctx.newPage()
      const errs = []
      page.on('pageerror', (e) => errs.push(String(e)))
      page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
      await page.addInitScript(() => { try { localStorage.clear() } catch (e) {} })
      const goto = async (p) => { await page.goto(`${url}/docs/${p}`, { waitUntil: 'networkidle' }); await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' }) }
      try {
        await t.run({ page, goto, expect, url, browser })
        if (errs.length) throw new Error('console errors: ' + errs.join(' | '))
        pass++
        console.log(`  ok   ${basename(file, '.mjs')}: ${t.name}`)
      } catch (e) {
        fail++
        console.log(`  FAIL ${basename(file, '.mjs')}: ${t.name}\n       ${String(e.message).split('\n')[0]}`)
      }
      await ctx.close()
    }
  }
  console.log(`\n${pass} passed, ${fail} failed, ${specs.length} spec file(s).`)
  process.exitCode = fail ? 1 : 0
} finally {
  await close()
}
