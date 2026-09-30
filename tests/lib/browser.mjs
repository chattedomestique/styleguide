/**
 * Shared test helpers: launch Chromium with Playwright and serve the repo over http.
 *
 * Browser lookup order: $CHROME_PATH, Playwright's managed browser, /opt/pw-browsers/chromium.
 * Only Chromium is exercised. Safari/WebKit and Firefox behaviour is NOT covered by these
 * tests; docs/ACCESSIBILITY.md lists what needs a manual pass on a real iPhone.
 */
import { chromium } from 'playwright-core'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '../../scripts/serve.mjs'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  try {
    const p = chromium.executablePath()
    if (p && existsSync(p)) return p
  } catch {}
  if (existsSync('/opt/pw-browsers/chromium')) return '/opt/pw-browsers/chromium'
  throw new Error('No Chromium found. Set CHROME_PATH or run `npx playwright install chromium`.')
}

/** Serve the repo root (so fixtures can reach /dist and /docs) and open a browser. */
export async function start({ dir = ROOT } = {}) {
  const server = await serve(dir)
  const browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox'] })
  return {
    server,
    browser,
    url: server.url,
    async close() {
      await browser.close()
      await server.close()
    },
  }
}
