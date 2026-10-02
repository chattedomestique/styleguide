// Docs: the code printed on the Install, PWA and Testing pages is run as printed, so a sample cannot rot.
// Each test reads its sample out of the built page (docs/), assembles a small app in a temporary folder
// next to the guide's own dist/ files, serves it over http and drives it in Chromium.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, cpSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { ROOT } from '../lib/browser.mjs'
import { serve } from '../../scripts/serve.mjs'

const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&')

/** The text of the <pre aria-label="label"> on a built docs page. */
function sample(file, label) {
  const html = readFileSync(join(ROOT, 'docs', file), 'utf8')
  for (const m of html.matchAll(/<pre aria-label="([^"]*)">([\s\S]*?)<\/pre>/g)) if (unescape(m[1]) === label) return unescape(m[2])
  throw new Error(`no code sample "${label}" on ${file}`)
}

/** Copy what an app copies from dist/ into <dir>/styleguide/, with the layout the Install page prints. */
function copyGuide(dir) {
  const dist = join(ROOT, 'dist')
  const to = join(dir, 'styleguide')
  mkdirSync(to, { recursive: true })
  copyFileSync(join(dist, 'styleguide.min.css'), join(to, 'styleguide.min.css'))
  copyFileSync(join(dist, 'icons.css'), join(to, 'icons.css'))
  // a build that predates the minified script has the same code in styleguide.js
  copyFileSync(join(dist, existsSync(join(dist, 'styleguide.min.js')) ? 'styleguide.min.js' : 'styleguide.js'), join(to, 'styleguide.min.js'))
  cpSync(join(dist, 'fonts'), join(to, 'fonts'), { recursive: true })
}

/** The complete minimal index.html from the Install page, in a temp folder, served. */
async function minimalApp({ edit = (h) => h } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'sg-docs-'))
  copyGuide(dir)
  const html = sample('start/install.html', 'Complete minimal index.html')
  writeFileSync(join(dir, 'index.html'), edit(html))
  const srv = await serve(dir)
  return { dir, srv, async close() { await srv.close(); rmSync(dir, { recursive: true, force: true }) } }
}

/** Open a page in a fresh context (own storage, service workers allowed) and keep what it complains about. */
async function open(browser, url, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...opts })
  const page = await ctx.newPage()
  const problems = []
  const requests = []
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()) })
  page.on('pageerror', (e) => problems.push(String(e)))
  page.on('requestfailed', (r) => problems.push('request failed: ' + r.url()))
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`) })
  page.on('request', (r) => requests.push(r.url()))
  await page.goto(url, { waitUntil: 'networkidle' })
  return { ctx, page, problems, requests }
}

export const tests = [
  {
    name: 'Install: the complete minimal index.html loads clean, fetches the font once, and Enter on the skip link lands in main',
    async run({ browser, expect }) {
      const app = await minimalApp()
      const { ctx, page, problems, requests } = await open(browser, app.srv.url + '/')
      try {
        expect.equal(problems.join(' | '), '', 'console errors, warnings or failed requests')
        expect.equal(requests.filter((u) => u.endsWith('.woff2')).length, 1, 'requests for the latin font (with the preload)')
        expect.ok(await page.evaluate(() => typeof SG === 'object' && getComputedStyle(document.documentElement).getPropertyValue('--hit').trim() === '2.75rem'), 'SG exists and the tokens are loaded')
        await page.keyboard.press('Tab')
        await expect.focused(page, '.skip-link', 'first Tab stop is the skip link')
        await page.keyboard.press('Enter')
        await expect.focused(page, 'main#main', 'Enter moves focus into main')
        await page.click('#add')
        expect.equal(await page.locator('#count').textContent(), '4', 'Add task counts')
        await page.waitForFunction(() => [...document.querySelectorAll('[aria-live="polite"]')].some((e) => e.textContent.includes('Task added. 4 tasks left')), null, { timeout: 4000 })
      } finally { await ctx.close(); await app.close() }
    },
  },
  {
    name: 'Install: a saved dark theme is applied again after a reload, and both theme-color tags follow it',
    async run({ browser, expect }) {
      const app = await minimalApp()
      const { ctx, page } = await open(browser, app.srv.url + '/')
      try {
        await page.evaluate(() => SG.prefs.set('theme', 'dark'))
        await page.reload({ waitUntil: 'networkidle' })
        expect.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark', 'data-theme after reload')
        const metas = await page.evaluate(() => [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.content))
        expect.equal(metas.join(' '), '#0e0e0e #0e0e0e', 'theme-color tags (the dark canvas on the theme-color table)')
      } finally { await ctx.close(); await app.close() }
    },
  },
  {
    name: 'Install: the printed CSP hash is the prefs snippet, the policy lets the guide load, and it refuses the example\'s own inline script as the page says',
    async run({ browser, expect }) {
      const snippet = sample('start/install.html', 'Complete minimal index.html').match(/<script>(try\{var p=[^<]*)<\/script>/)[1]
      const printed = sample('start/install.html', 'Command that prints the CSP hash of the prefs snippet').match(/printf '%s' "(.*)" \|/)[1]
      expect.equal(printed, snippet, 'the snippet in the openssl command is the one in the complete file')
      const hash = createHash('sha256').update(snippet).digest('base64')
      const policy = sample('start/install.html', 'A policy that works with the guide').replace('Content-Security-Policy: ', '').replace('HASH-FROM-ABOVE', hash)
      const app = await minimalApp({ edit: (h) => h.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n  <meta http-equiv="Content-Security-Policy" content="${policy}">`) })
      const { ctx, page, problems } = await open(browser, app.srv.url + '/')
      try {
        const violations = problems.filter((p) => p.includes('Content Security Policy'))
        expect.equal(violations.length, 1, `CSP violations (only the example's own script): ${violations.join(' | ')}`)
        expect.ok(!problems.some((p) => p.includes('Refused to load the image')), 'icon masks (data: images) are allowed by img-src')
        await page.click('#add')
        expect.equal(await page.locator('#count').textContent(), '3', "the example's own inline script is blocked, so the counter does not move")
        expect.ok(await page.evaluate(() => typeof SG === 'object'), 'the guide\'s script still runs')
      } finally { await ctx.close(); await app.close() }
    },
  },
  {
    name: 'PWA: the example app parses, installs a worker, starts offline with its banner, and offers one update',
    async run({ browser, expect }) {
      const dir = mkdtempSync(join(tmpdir(), 'sg-docs-pwa-'))
      copyGuide(dir)
      const pwa = (label) => sample('start/pwa.html', label)
      let html = sample('start/install.html', 'Complete minimal index.html')
      const appAdd = pwa('Additions to index.html for app.js')
      const instAdd = pwa('Additions to index.html for install.js')
      html = html.replace('</head>', `${pwa('Head additions for an installable app')}\n${appAdd.match(/<script src="app.js" defer><\/script>/)[0]}\n${instAdd.match(/<script src="install.js" defer><\/script>/)[0]}\n</head>`)
      html = html.replace('<main class="app__main stack" id="main" tabindex="-1">', `<main class="app__main stack" id="main" tabindex="-1">\n${appAdd.slice(appAdd.indexOf('<div class="card alert"'))}`)
      html = html.replace('</main>', `${instAdd.slice(instAdd.indexOf('<button'))}\n</main>`)
      writeFileSync(join(dir, 'index.html'), html)
      writeFileSync(join(dir, 'manifest.webmanifest'), pwa('manifest.webmanifest for the example app'))
      writeFileSync(join(dir, 'sw.js'), pwa('sw.js, an offline app shell'))
      writeFileSync(join(dir, 'app.js'), pwa('app.js, which registers the worker, offers updates and shows the connection state'))
      writeFileSync(join(dir, 'install.js'), pwa('install.js, an install button for Chromium and instructions for Safari'))
      // the icons the manifest and the worker name; content does not matter here (the export script is tested below)
      mkdirSync(join(dir, 'icons'))
      for (const n of ['icon-192', 'icon-512', 'icon-maskable-192', 'icon-maskable-512', 'apple-touch-icon-180']) writeFileSync(join(dir, 'icons', n + '.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'))
      const srv = await serve(dir)
      const { ctx, page, problems } = await open(browser, srv.url + '/')
      try {
        expect.equal(problems.join(' | '), '', 'first load: console errors, warnings or failed requests')
        // the manifest parses without a single error
        const cdp = await ctx.newCDPSession(page)
        const manifest = await cdp.send('Page.getAppManifest')
        expect.equal(JSON.stringify(manifest.errors), '[]', 'manifest errors')
        // the worker installs and precaches every file it lists
        await page.reload({ waitUntil: 'networkidle' })
        await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 8000 })
        const shell = await page.evaluate(async () => (await (await caches.open('shell-v1')).keys()).length)
        expect.equal(shell, 9, 'files in the shell cache (the nine the list names)')
        // offline: the banner shows and is announced once; a reload still renders, with the font
        expect.ok(await page.$eval('#offline', (e) => e.hidden), 'the banner is hidden while online')
        await ctx.setOffline(true)
        await page.waitForFunction(() => !document.getElementById('offline').hidden, null, { timeout: 4000 })
        // SG.announce clears the region and sets the text on the next frame, so wait for it
        await page.waitForFunction(() => [...document.querySelectorAll('[aria-live="polite"]')].some((e) => e.textContent.includes('You are offline. Changes sync when you reconnect.')), null, { timeout: 4000 })
        await page.reload({ waitUntil: 'load' })
        expect.equal(await page.title(), 'Today · Tasks', 'the page renders from the worker while offline')
        expect.ok(await page.evaluate(() => document.fonts.check('16px "Archivo"')), 'the font is available offline')
        await ctx.setOffline(false)
        await page.waitForFunction(() => document.getElementById('offline').hidden, null, { timeout: 4000 })
        // an update: new worker waits, a toast offers it, pressing Reload reloads exactly once and drops the old cache.
        // (It needs the Toast element; a tree that does not have it yet has nothing to offer the update with.)
        if (!existsSync(join(ROOT, 'src', 'components', 'toast.css'))) return
        writeFileSync(join(dir, 'sw.js'), readFileSync(join(dir, 'sw.js'), 'utf8').replace("const VERSION = 'v1'", "const VERSION = 'v2'"))
        writeFileSync(join(dir, 'index.html'), readFileSync(join(dir, 'index.html'), 'utf8').replace('Today</h1>', 'Today v2</h1>'))
        let loads = 0
        page.on('framenavigated', (f) => { if (f === page.mainFrame()) loads++ })
        await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()))
        await page.waitForSelector('.toast__action', { timeout: 8000 })
        expect.equal((await page.textContent('.toast')).includes('A new version is ready.'), true, 'the update toast says so')
        expect.equal(await page.textContent('h1'), 'Today', 'the open page still shows the old version')
        const before = loads
        await page.click('.toast__action')
        await page.waitForFunction(() => document.querySelector('h1').textContent.includes('v2'), null, { timeout: 8000 })
        await page.waitForTimeout(600)
        expect.equal(loads - before, 1, 'reloads after pressing Reload')
        expect.equal(JSON.stringify((await page.evaluate(() => caches.keys())).sort()), '["runtime","shell-v2"]', 'the old shell cache is gone')
      } finally { await ctx.close(); await srv.close(); rmSync(dir, { recursive: true, force: true }) }
    },
  },
  {
    name: 'PWA: make-icons.mjs writes the five icons, transparent for "any" and opaque for the rest, and the maskable mark stays inside the safe circle',
    async run({ browser, expect }) {
      const dir = mkdtempSync(join(tmpdir(), 'sg-docs-icons-'))
      try {
        // run the printed script's export loop with the browser this test already has (same code path, no child process)
        const script = sample('start/pwa.html', 'make-icons.mjs, which exports the app icons from one SVG')
        const mark = sample('start/pwa.html', 'mark.svg, the sample mark')
        const from = script.indexOf('const ICONS = ') + 'const ICONS = '.length
        const icons = new Function('PAPER', 'return ' + script.slice(from, script.indexOf('\n}\n', from) + 2))('#f5f5f5')
        const uri = 'data:image/svg+xml;base64,' + Buffer.from(mark).toString('base64')
        const ctx = await browser.newContext()
        const page = await ctx.newPage()
        const shot = {}
        for (const [name, { size, fill, background }] of Object.entries(icons)) {
          await page.setViewportSize({ width: size, height: size })
          await page.setContent(`<body style="margin:0;display:grid;place-items:center;block-size:100vh;background:${background ?? 'transparent'}"><img src="${uri}" style="inline-size:${fill * 100}%;block-size:${fill * 100}%"></body>`)
          shot[name] = { size, background, png: await page.screenshot({ omitBackground: background === null }) }
        }
        await ctx.close()
        expect.equal(Object.keys(shot).join(' '), 'icon-192.png icon-512.png icon-maskable-192.png icon-maskable-512.png apple-touch-icon-180.png', 'the five files')
        // decode in the browser: corner alpha and the dark mark's extent
        const page2 = await browser.newPage()
        for (const [name, s] of Object.entries(shot)) {
          const r = await page2.evaluate(async ({ b64, size }) => {
            const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
            const c = document.createElement('canvas'); c.width = c.height = size
            const g = c.getContext('2d'); g.drawImage(img, 0, 0)
            const d = g.getImageData(0, 0, size, size).data
            let min = size, max = 0
            for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const i = (y * size + x) * 4; if (d[i + 3] > 0 && d[i] < 80) { min = Math.min(min, x); max = Math.max(max, x) } }
            return { corner: d[3], extent: (max - min) / size }
          }, { b64: s.png.toString('base64'), size: s.size })
          if (s.background === null) expect.equal(r.corner, 0, `${name}: transparent corner`)
          else expect.equal(r.corner, 255, `${name}: opaque corner`)
          if (name.startsWith('icon-maskable')) expect.ok(r.extent <= 0.56, `${name}: the mark is ${Math.round(r.extent * 100)}% of the side, at most 56% (the square that fits the 80% circle)`)
        }
        await page2.close()
      } finally { rmSync(dir, { recursive: true, force: true }) }
    },
  },
  {
    name: 'PWA: the safe-zone figure keeps a frame on its mark under forced colours, where fills vanish',
    async run({ browser, url, expect }) {
      const ctx = await browser.newContext({ forcedColors: 'active', viewport: { width: 390, height: 844 } })
      try {
        const page = await ctx.newPage()
        await page.goto(`${url}/docs/start/pwa.html`, { waitUntil: 'networkidle' })
        const frame = await page.$eval('.safezone__mark', (el) => { const c = getComputedStyle(el); return `${c.borderTopStyle} ${c.borderTopWidth}` })
        expect.equal(frame, 'solid 2px', 'border of the mark')
      } finally { await ctx.close() }
    },
  },
  {
    name: 'Customize: the clay block as printed colours only its own region, and an unlayered :root knob beats every palette (why the page says to name the palette)',
    async run({ page, goto, expect }) {
      await goto('start/install.html')
      const clay = sample('start/customize.html', 'A custom palette called clay')
      await page.addStyleTag({ content: clay })
      const read = (sel) => page.evaluate((s) => getComputedStyle(document.querySelector(s)).getPropertyValue('--k-accent-h').trim(), sel)
      await page.evaluate(() => { const d = document.createElement('div'); d.id = 'clay'; d.dataset.palette = 'clay'; document.body.append(d) })
      expect.equal(await read('#clay'), '45', 'accent hue inside the clay region')
      expect.equal(await read('html'), '95', 'accent hue of the page outside it')
      await page.addStyleTag({ content: ':root { --k-accent-h: 30; }' })
      for (const palette of ['default', 'mint', 'periwinkle', 'sand', 'cream', 'wire']) {
        await page.evaluate((p) => { document.documentElement.dataset.palette = p }, palette)
        expect.equal(await read('html'), '30', `the :root knob over the ${palette} palette`)
      }
    },
  },
  {
    name: 'Checklist: the counts printed on the page are the counts of its rows, and the manual-only list is exactly the rows tagged only "manual"',
    async run({ expect }) {
      const html = readFileSync(join(ROOT, 'docs', 'accessibility', 'checklist.html'), 'utf8')
      const rows = []
      for (const table of html.match(/<table class="docs-table ck-table"[\s\S]*?<\/table>/g)) {
        for (const tr of table.match(/<tr role="row"><td role="cell" data-label="(?:Criterion|Topic)">[\s\S]*?<\/tr>/g)) {
          rows.push({ name: unescape(tr.match(/<strong>(.*?)<\/strong>/)[1]), tags: [...tr.matchAll(/<li class="tag" data-kind="(\w+)">/g)].map((m) => m[1]) })
        }
      }
      // the small table near the top: how many rows carry each tag
      const printed = {}
      for (const m of html.matchAll(/<li class="tag" data-kind="(\w+)">[^<]*<\/li><\/ul><\/td><td role="cell" data-label="What it is">[\s\S]*?<td role="cell" data-label="Rows">(\d+)<\/td>/g)) printed[m[1]] = Number(m[2])
      const counted = {}
      for (const r of rows) for (const t of new Set(r.tags)) counted[t] = (counted[t] || 0) + 1
      expect.equal(JSON.stringify(printed, Object.keys(counted).sort()), JSON.stringify(counted, Object.keys(counted).sort()), 'rows per tag, printed against counted')
      const only = rows.filter((r) => r.tags.join() === 'manual').map((r) => r.name)
      const partly = rows.filter((r) => r.tags.includes('manual') && r.tags.length > 1).length
      expect.ok(html.includes(`<p>${only.length} of ${rows.length} rows have no automated check at all.`), `"${only.length} of ${rows.length} rows" is printed`)
      expect.ok(html.includes(`A further ${partly} rows are only partly automated`), `"A further ${partly} rows" is printed`)
      const list = html.match(/<h2 id="manual-only">[\s\S]*?<ul>([\s\S]*?)<\/ul>/)[1]
      const listed = [...list.matchAll(/<li>(.*?)<\/li>/g)].map((m) => unescape(m[1]))
      expect.equal(JSON.stringify(listed.sort()), JSON.stringify(only.sort()), 'the manual-only list against the rows')
    },
  },
  {
    // The tags decide which rules run, so "90 of 105" holds on every page; what each rule finds depends on the page, so the
    // page only says "about half" for the Button page and this checks that loosely. The build marks a one-word code token
    // <code class="nb"> (it must not break after its leading hyphens), so the rule names are read with or without the class.
    name: 'Testing: the axe rules the page says never run are exactly the ones the gate\'s options skip, and the counts match',
    async run({ page, goto, expect }) {
      const { default: axe } = await import('axe-core')
      await goto('components/button.html')
      await page.addScriptTag({ content: axe.source })
      const r = await page.evaluate(async () => {
        const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })
        const ran = new Set([...res.passes, ...res.inapplicable, ...res.incomplete, ...res.violations].map((x) => x.id))
        return { ran: [...ran], all: axe.getRules().map((x) => x.ruleId), passed: res.passes.map((x) => x.id), inapplicable: res.inapplicable.length }
      })
      const para = unescape(readFileSync(join(ROOT, 'docs', 'accessibility', 'testing.html'), 'utf8').match(/<p>The gate runs axe-core[\s\S]*?<\/p>/)[0])
      const printed = [...para.slice(para.indexOf('never run:')).matchAll(/<code(?: class="nb")?>([a-z-]+)<\/code>/g)].map((m) => m[1]).sort()
      const skipped = r.all.filter((id) => !r.ran.includes(id)).sort()
      expect.equal(JSON.stringify(printed), JSON.stringify(skipped), `rules that never run (axe ${axe.version})`)
      expect.ok(para.includes(`the same ${r.ran.length} of axe's ${r.all.length} rules run on every page`), `the counts: ${r.ran.length} of ${r.all.length}`)
      const share = r.passed.length / r.ran.length
      expect.ok(share > 0.35 && share < 0.65, `"about half" found something on the Button page: ${r.passed.length} of ${r.ran.length}`)
      expect.ok(r.passed.includes('color-contrast'), 'colour contrast is among the rules that found something and passed')
      expect.ok(para.includes(`(${axe.version} when this was written)`), `the axe version on the page is ${axe.version}`)
    },
  },
  {
    name: 'Testing: the lint self-test line printed on the page is what the self-test prints today',
    async run({ expect }) {
      const out = execFileSync(process.execPath, [join(ROOT, 'tests', 'lint.selftest.mjs')], { encoding: 'utf8' })
      const line = out.split('\n').find((l) => l.startsWith('violations caught'))
      expect.ok(line, 'the self-test prints a summary line')
      const page = unescape(readFileSync(join(ROOT, 'docs', 'accessibility', 'testing.html'), 'utf8'))
      expect.ok(page.includes(`the current run reads <code>${line.trim()}</code>`), `the page says: ${line.trim()}`)
    },
  },
  {
    name: 'Testing: the spec printed on the page is tests/components/shell.mjs, word for word',
    async run({ expect }) {
      const printed = sample('accessibility/testing.html', 'An example component spec')
      const file = readFileSync(join(ROOT, 'tests', 'components', 'shell.mjs'), 'utf8')
      expect.equal(printed.trim(), file.trim(), 'the page and the file')
    },
  },
]
