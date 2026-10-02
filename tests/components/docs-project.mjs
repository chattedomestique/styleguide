// Docs: the Project pages (Status, Decisions, References, Contributing, Changelog) stay true and stay usable.
// The pages are prose, so what can rot is (a) a name or path in code font that no longer exists, (b) a table that
// forgets an element, and (c) a layout that hides a focused control. Each test below caught or guards a real defect.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from '../lib/browser.mjs'

const PAGES = ['status', 'decisions', 'references', 'contributing', 'changelog']
const read = (p) => readFileSync(join(ROOT, p), 'utf8')
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&')

/** Every file a claim can point at, as one string: the source, the tests, the scripts and the other docs pages. */
function corpus() {
  const out = []
  const walk = (dir) => {
    for (const name of readdirSync(join(ROOT, dir))) {
      const rel = dir + '/' + name
      if (name === 'node_modules' || name === 'test-results' || name.startsWith('.git')) continue
      if (rel === 'docs-src/project') continue // the pages under test cannot vouch for themselves
      const st = statSync(join(ROOT, rel))
      if (st.isDirectory()) walk(rel)
      else if (/\.(css|js|mjs|html|json|md|yml|svg)$/.test(name) && st.size < 2_000_000) out.push(read(rel))
    }
  }
  for (const d of ['src', 'tests', 'scripts', 'docs-src', 'references', '.github']) if (existsSync(join(ROOT, d))) walk(d)
  for (const f of ['package.json', 'CLAUDE.md', 'STYLE.md', 'README.md', 'AUDIT.md']) out.push(read(f))
  return out.join('\n')
}

/** What the five pages print in code font outside <pre> and <style> (those are samples to copy, not claims). */
function claims(page) {
  const html = read(`docs-src/project/${page}.html`).replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
  return [...new Set([...html.matchAll(/<code>([\s\S]*?)<\/code>/g)].map((m) => unescape(m[1].replace(/<[^>]+>/g, '')).trim()).filter(Boolean))]
}

// Placeholders, wildcards and things that live outside the repository.
const SKIP = /\*|<|\bname\b|\bNN\b|\bimgN\b|^\.gitignore$|^chattedomestique\/|^bell\.svg$|^1bit-ui\.md$|^ui-ux-pro-max\.md$/

export const tests = [
  {
    name: 'every name in code font on the Project pages exists: npm scripts, files, identifiers, and (once the elements are merged) properties, classes and data attributes',
    async run({ expect }) {
      const text = corpus()
      const pkg = JSON.parse(read('package.json')).scripts
      const integrated = readdirSync(join(ROOT, 'src/components')).filter((f) => f.endsWith('.css')).length > 10
      const bad = []
      for (const page of PAGES) {
        for (const c of claims(page)) {
          if (SKIP.test(c)) continue
          const script = c.match(/^npm run ([\w:-]+)/)
          if (script) { if (!(script[1] in pkg)) bad.push(`${page}: "${c}" is not an npm script`); continue }
          const file = c.match(/^node ([\w./-]+)/)
          if (file) { if (!existsSync(join(ROOT, file[1]))) bad.push(`${page}: "${c}" runs a file that does not exist`); continue }
          if (/^npm /.test(c)) continue
          if (/^[\w@./-]+\.(css|js|mjs|md|html|json|yml|svg|txt)$/.test(c) || /^[\w-]+\/[\w./-]*$/.test(c)) {
            const p = c.replace(/\/$/, '')
            const found = [p, 'src/components/' + p, 'tests/' + p, 'references/screens/' + p].some((x) => existsSync(join(ROOT, x))) || text.includes(p)
            if (!found) bad.push(`${page}: path "${c}" does not exist`)
            continue
          }
          for (const id of c.match(/\b([A-Z][A-Z_]{3,}|[a-z]+[A-Z]\w+)\b/g) || []) if (!new RegExp(`\\b${id}\\b`).test(text)) bad.push(`${page}: identifier "${id}" (in "${c}") appears nowhere`)
          if (!integrated) continue // the element classes and attributes belong to slices that are not in this tree yet
          for (const tok of c.match(/--[a-z][\w-]*|\.[a-z][\w-]+|data-[a-z][\w-]*/g) || []) if (!new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])').test(text)) bad.push(`${page}: "${tok}" (in "${c}") appears nowhere`)
        }
      }
      expect.equal(bad.join('\n          '), '', 'names that do not exist')
    },
  },
  {
    name: 'Status has a row for every element page, and (once any element beyond Card and Button exists) no row for a page that does not exist',
    async run({ expect }) {
      const pages = readdirSync(join(ROOT, 'docs-src/components')).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, '')).filter((n) => n !== 'card' && n !== 'button')
      const html = read('docs-src/project/status.html')
      const rows = [...html.matchAll(/<td[^>]*data-label="Element"[^>]*><a href="@\/components\/([\w-]+)\.html">/g)].map((m) => m[1])
      expect.equal(new Set(rows).size, rows.length, 'an element has two rows')
      expect.equal(pages.filter((n) => !rows.includes(n)).join(', '), '', 'element pages with no row on Status')
      if (pages.length) expect.equal(rows.filter((n) => !pages.includes(n)).join(', '), '', 'Status rows for pages that do not exist')
      // the Changelog lists the same elements, family by family
      const log = read('docs-src/project/changelog.html')
      const listed = [...log.matchAll(/href="@\/components\/([\w-]+)\.html"/g)].map((m) => m[1])
      expect.equal(pages.filter((n) => !listed.includes(n)).join(', '), '', 'element pages missing from the Changelog')
    },
  },
  {
    name: 'phone: following an in-page link never leaves its target under the sticky bar (WCAG 2.4.11)',
    async run({ page, goto, expect }) {
      const bad = []
      for (const name of PAGES) {
        await goto(`project/${name}.html`)
        const hrefs = await page.evaluate(() => [...new Set([...document.querySelectorAll('.docs-article a[href^="#"]')].map((a) => a.getAttribute('href')))])
        for (const h of hrefs) {
          await page.evaluate(() => scrollTo(0, 0))
          await page.evaluate((hash) => document.querySelector(`.docs-article a[href="${hash}"]`).click(), h)
          const r = await page.evaluate((hash) => ({ top: document.getElementById(hash.slice(1)).getBoundingClientRect().top, bar: document.getElementById('docs-bar').getBoundingClientRect().bottom }), h)
          if (r.top < r.bar - 1) bad.push(`${name}${h}: starts ${Math.round(r.top)}px, the bar ends ${Math.round(r.bar)}px`)
        }
      }
      expect.equal(bad.join(' | '), '', 'targets hidden under the bar')
    },
  },
  {
    name: 'phone: Tab never lands on a link or button that is under the bar or off the screen, and Status and Decisions have no tab stop taller than the screen',
    async run({ page, goto, expect }) {
      const bad = []
      for (const name of PAGES) {
        await goto(`project/${name}.html`)
        for (let i = 0; i < 400; i++) {
          await page.keyboard.press('Tab')
          const s = await page.evaluate(() => {
            const el = document.activeElement
            if (!el || el === document.body || el.dataset.walked) return null // the walk is over once Tab comes round again
            el.dataset.walked = '1'
            if (el.closest('#docs-bar, .skip-link')) return { shell: true } // the bar is the thing the rest must clear
            const r = el.getBoundingClientRect()
            return { d: el.tagName.toLowerCase() + ' "' + (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28) + '"', top: r.top, bottom: r.bottom, left: r.left, right: r.right, bar: document.getElementById('docs-bar').getBoundingClientRect().bottom, vw: innerWidth, vh: innerHeight, control: el.matches('a[href], button, summary, input, select, textarea') }
          })
          if (!s) break
          if (s.shell) continue
          if (s.control && (s.top < s.bar - 1 || s.bottom > s.vh + 1 || s.left < -1 || s.right > s.vw + 1)) bad.push(`${name}: ${s.d} at ${Math.round(s.top)}..${Math.round(s.bottom)}`)
          // a region taller than the screen has its ring (and its first line) off screen: it must not be a stop on the pages whose tables hold links
          if (!s.control && (name === 'status' || name === 'decisions') && s.bottom - s.top > s.vh - s.bar) bad.push(`${name}: a ${Math.round(s.bottom - s.top)}px tall region is a tab stop (${s.d})`)
        }
      }
      expect.equal(bad.join(' | '), '', 'tab stops')
    },
  },
  {
    name: 'phone: nothing on the Project pages needs sideways scrolling except the seven-column Card and Button table, even at 320px',
    async run({ page, goto, expect }) {
      const bad = []
      for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 800 })
        for (const name of PAGES) {
          await goto(`project/${name}.html`)
          const r = await page.evaluate(() => {
            const out = []
            document.querySelectorAll('.table-wrap, pre').forEach((e) => { if (e.scrollWidth > e.clientWidth + 1 && !e.querySelector('thead th:nth-child(7)')) out.push((e.getAttribute('aria-label') || e.tagName).slice(0, 40) + ` ${e.scrollWidth}>${e.clientWidth}`) })
            return { out, page: document.documentElement.scrollWidth - document.documentElement.clientWidth }
          })
          if (r.page > 0) bad.push(`${name}@${width}: the page scrolls sideways by ${r.page}px`)
          for (const o of r.out) bad.push(`${name}@${width}: ${o}`)
        }
      }
      expect.equal(bad.join(' | '), '', 'sideways scroll')
    },
  },
  {
    name: 'Contributing: the text to copy (the agent prompt, the checklist, the commands) wraps instead of scrolling, and is not a tab stop with nothing to scroll',
    async run({ page, goto, expect }) {
      await goto('project/contributing.html')
      const blocks = await page.evaluate(() => [...document.querySelectorAll('pre')].map((p) => ({ label: p.getAttribute('aria-label'), tab: p.getAttribute('tabindex'), wraps: getComputedStyle(p).whiteSpace === 'pre-wrap', scrolls: p.scrollWidth > p.clientWidth + 1 })))
      expect.ok(blocks.length >= 3, 'the prompt, the checklist and the commands are all there')
      for (const b of blocks) {
        expect.ok(b.wraps && !b.scrolls, `"${b.label}" wraps and does not scroll sideways`)
        expect.equal(b.tab, '-1', `"${b.label}" has nothing to scroll, so it is no tab stop`)
      }
    },
  },
  {
    name: 'Decisions: the corners recipe names every step that was needed when it was tried: the tokens, the pref default, and the specs that read a radius with no attribute',
    async run({ expect }) {
      const html = read('docs-src/project/decisions.html')
      // <wbr> marks where a long path may break on a phone; it is not part of the name
      const recipe = html.slice(html.indexOf('id="corners"'), html.indexOf('id="motion"')).replace(/<wbr>/g, '')
      for (const part of ['src/tokens/30-corners.css', 'src/js/10-prefs.js', 'DEFAULT_VALUE.corners', 'tests/components.mjs']) expect.ok(recipe.includes(part), `the recipe mentions ${part}`)
      // The specs the recipe lists must be the specs that break: each one reads a radius with the attribute removed or never set.
      const named = ['card', 'choice', 'list', 'menu', 'slider', 'stepper', 'tooltip'].filter((n) => existsSync(join(ROOT, `tests/components/${n}.mjs`)))
      for (const n of named) expect.ok(new RegExp(n.replace(/^./, (c) => c.toUpperCase())).test(recipe), `the recipe names ${n}`)
    },
  },
]
