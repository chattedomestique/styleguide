// Spec for SG.prefs: the look an app authors on <html>, the guide's own defaults, "system", reset(), and the storage key.
// The shared runner clears localStorage on every navigation, so these tests open their own context (no clearing) and
// mimic the inline head snippet that applies saved choices before the script runs.
const HEAD_SNIPPET = (key) => `try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(key)})||'{}');for(var k in p)document.documentElement.setAttribute('data-'+k,p[k])}catch(e){}`

async function open(browser, url, { authored = {}, key = 'sg:prefs' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  // An app authors its look in its own HTML: write the attributes into <html> and the snippet into <head> of the served page.
  await page.route(`${url}/docs/index.html`, async (route) => {
    const res = await route.fetch()
    const attrs = Object.entries(authored).map(([k, v]) => `${k}="${v}"`).join(' ')
    const body = (await res.text()).replace('<html ', `<html ${attrs} `).replace('<head>', `<head><script>${HEAD_SNIPPET(key)}</script>`)
    await route.fulfill({ response: res, body })
  })
  await page.goto(`${url}/docs/index.html`, { waitUntil: 'networkidle' })
  return { ctx, page }
}
const attr = (page, n) => page.evaluate((n) => document.documentElement.getAttribute('data-' + n), n)
const stored = (page, key = 'sg:prefs') => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key)

export const tests = [
  {
    name: "choosing the guide's default over a look the app authored writes it down, survives a reload, and reset() restores the app's look",
    async run({ browser, url, expect }) {
      const { ctx, page } = await open(browser, url, { authored: { 'data-corners': 'soft', 'data-palette': 'mint' } })
      try {
        expect.equal(await attr(page, 'corners'), 'soft', 'the app look is applied')
        await page.evaluate(() => SG.prefs.set('corners', 'square'))
        await page.evaluate(() => SG.prefs.set('palette', 'default'))
        expect.equal(await attr(page, 'corners'), 'square', 'square wins over the authored soft')
        expect.equal(await attr(page, 'palette'), 'default', 'default wins over the authored mint')
        const s = await stored(page)
        expect.equal(s.corners, 'square', 'the choice is stored')
        expect.equal(s['was-corners'], 'soft', 'the app value is remembered')
        await page.reload({ waitUntil: 'networkidle' })
        expect.equal(await attr(page, 'corners'), 'square', 'the choice survives a reload')
        expect.equal(await page.evaluate(() => SG.prefs.get('corners')), 'square')
        await page.evaluate(() => SG.prefs.reset())
        expect.equal(await attr(page, 'corners'), 'soft', 'reset() puts the authored corners back')
        expect.equal(await attr(page, 'palette'), 'mint', 'reset() puts the authored palette back')
        expect.equal(await stored(page), null, 'nothing is left in storage')
      } finally { await ctx.close() }
    },
  },
  {
    name: 'choosing what the app authored stores nothing; the guide default on a plain page stores nothing and leaves no attribute',
    async run({ browser, url, expect }) {
      const a = await open(browser, url, { authored: { 'data-corners': 'soft' } })
      try {
        await a.page.evaluate(() => SG.prefs.set('corners', 'soft'))
        expect.equal(await stored(a.page), null, 'same as authored: nothing to remember')
      } finally { await a.ctx.close() }
      const b = await open(browser, url)
      try {
        await b.page.evaluate(() => SG.prefs.set('corners', 'soft'))
        expect.equal((await stored(b.page)).corners, 'soft')
        await b.page.evaluate(() => SG.prefs.set('corners', 'square'))
        expect.equal(await attr(b.page, 'corners'), null, 'the default is no attribute')
        expect.equal(await stored(b.page), null, 'and nothing stored')
      } finally { await b.ctx.close() }
    },
  },
  {
    name: '"system" overrides an authored theme and keeps doing so after a reload',
    async run({ browser, url, expect }) {
      const { ctx, page } = await open(browser, url, { authored: { 'data-theme': 'dark' } })
      try {
        expect.equal(await attr(page, 'theme'), 'dark')
        await page.evaluate(() => SG.prefs.set('theme', 'system'))
        expect.equal(await attr(page, 'theme'), null, 'follows the device again')
        expect.equal((await stored(page)).theme, 'system', 'written down, or the authored dark would return')
        await page.reload({ waitUntil: 'networkidle' })
        expect.equal(await attr(page, 'theme'), null, 'still the device after a reload')
        expect.equal(await page.evaluate(() => SG.prefs.get('theme')), 'system')
        await page.evaluate(() => SG.prefs.reset())
        expect.equal(await attr(page, 'theme'), 'dark', 'reset() brings the authored dark back')
      } finally { await ctx.close() }
    },
  },
  {
    name: 'a data-sg-prefs-key on <html> keeps two apps on one origin apart',
    async run({ browser, url, expect }) {
      const { ctx, page } = await open(browser, url, { authored: { 'data-sg-prefs-key': 'flashcards:prefs' }, key: 'flashcards:prefs' })
      try {
        await page.evaluate(() => SG.prefs.set('palette', 'sand'))
        expect.equal((await stored(page, 'flashcards:prefs')).palette, 'sand', 'saved under the app key')
        expect.equal(await stored(page, 'sg:prefs'), null, "and not under the guide's key")
        await page.reload({ waitUntil: 'networkidle' })
        expect.equal(await attr(page, 'palette'), 'sand', 'read back from the app key')
      } finally { await ctx.close() }
    },
  },
]
