#!/usr/bin/env node
/**
 * Regenerate docs-src/project/status.html (the "Status" docs page) from the repo's own gates, so that
 * nobody types a status: a cell says "done" only because a check passed.
 *
 *   npm run status                  build, run the three gates, write the page.
 *                                   All five accessibility appearances: about an hour.
 *   npm run status -- --quick       the same with two appearances (default, dark mint soft): a trial run,
 *                                   about twenty minutes. Do not commit its page: the prose says "all five".
 *
 *   node scripts/status.mjs --components-log A --a11y-log B --lint-log C [--out FILE]
 *                                   render from logs you already have; nothing is run.
 *
 * The logs are the plain output of the gates (stdout and stderr together):
 *   components   node tests/components.mjs
 *   a11y         node tests/a11y.mjs --pages <every docs/components page>      (A11Y_JOBS=1 as --run does)
 *   lint         node tests/lint.mjs
 *
 * Each row has two fields that say what was checked, and nothing more:
 *   Automated checks   "pass" when (a) its spec in tests/components/ passes, (b) the lint has no error ("Lint OK"
 *                      in the lint log) and (c) its page has no accessibility-gate error in any appearance and was
 *                      run in all of them. Otherwise "fail" (the findings go into the row) or "not run".
 *   Screenshots        read from docs-src/project/visual-review.json, which a person keeps by hand after looking
 *                      at the element's demos (390px at 100% and 200% text, and 1024px): { "<element>": { "state":
 *                      "in review" | "changes needed" | "reviewed", "date": "YYYY-MM-DD" } }. Missing = "not reviewed".
 *                      No script ever writes that file.
 * Passing checks are not "done": gates 1 to 4 include looks (the squint test, the states as drawn), so the page
 * never calls an element done on mechanical evidence alone. Gate 5 is always "awaiting sign-off": only the owner
 * closes it. Card and Button are the owner's: their row is copied from STYLE.md section 6 and the same evidence
 * is only cross-checked (a finding shows under Open items, it never edits the owner's record).
 *
 * Where the page goes. With --run: docs-src/project/status.html, because that is the point of the command.
 * With logs: STDOUT. Rendering from logs is also how you try a half-finished run, and that must never
 * overwrite the committed page by accident. --out FILE picks a file in either mode, --out - forces stdout.
 * The page is rendered completely before anything is written, so a failure never leaves a truncated file.
 *
 * Environment: STATUS_DATE sets the date on the page (default: today, local time). STATUS_APPEARANCES, or
 * --appearances N, is how many appearances a page must have been run in to count (default 5, 2 with --quick;
 * it must match the APPEARANCES list in tests/a11y.mjs). A11Y_JOBS is passed to the a11y gate (default 1).
 *
 * Exit status: 0 when a page was rendered, even if elements are open (open items are the content, not a
 * failure of this script); 1 when a step failed or a gate never reached its summary line; 2 for bad usage.
 * No dependencies; Node only, like the rest of the tooling.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, mkdtempSync, openSync, closeSync } from 'node:fs'
import { join, dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { parseArgs } from 'node:util'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PAGE = join(ROOT, 'docs-src', 'project', 'status.html')
// Kept by hand: whether a person has reviewed each element's screenshots since its last change (see the header).
const REVIEW = join(ROOT, 'docs-src', 'project', 'visual-review.json')
const REVIEW_STATES = ['in review', 'changes needed', 'reviewed']
// A path as the messages show it: from the repo root, or whole if it lies outside the repo.
const rel = (p) => {
  const r = relative(ROOT, p).split('\\').join('/')
  return r.startsWith('..') ? p : r
}

class Failure extends Error {
  constructor(message, code = 1) {
    super(message)
    this.code = code
  }
}

/* ---- the element families ---------------------------------------------------------------------------
 * The order bands of CLAUDE.md ("Adding an element"), with overlays and feedback as two tables. `to` is exclusive. */
const FAMILIES = [
  { key: 'actions', title: 'Actions', from: 10, to: 20 },
  { key: 'forms', title: 'Forms', from: 20, to: 40 },
  { key: 'nav', title: 'Selection and navigation', from: 40, to: 60 },
  { key: 'surfaces', title: 'Surfaces', from: 60, to: 80 },
  { key: 'overlays', title: 'Overlays', from: 80, to: 90 },
  { key: 'feedback', title: 'Feedback', from: 90, to: 100 },
  { key: 'data', title: 'Data', from: 100, to: 120 },
  { key: 'media', title: 'Media and tools', from: 120, to: 140 },
]
// The owner's two, in the owner's order. They have their own table and are left out of the family tables.
const OWNERS = ['card', 'button']

// The appearance names tests/a11y.mjs prints, in the order it runs them, with the words the page uses.
const APP_NAMES = new Map([
  ['default', 'default'],
  ['dark-mint-soft', 'dark mint with soft corners'],
  ['wire-square', 'wire palette'],
  ['contrast-periwinkle-dark', 'high contrast, dark periwinkle'],
  ['forced-colors', 'forced colours'],
])

/* ---- small helpers ----------------------------------------------------------------------------------- */
// Entities for text and attribute values: & < > " and '
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
// A log line ends at LF, CRLF, a lone CR, or a Unicode line separator; a stray one in an element description must not glue two records.
const logLines = (text) => text.split(/\r\n|[\n\r\u2028\u2029]/)
const byKey = ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)
// Cut by characters, not UTF-16 units, so a long test name never ends in half an emoji.
const clip = (s, n) => [...s].slice(0, n).join('')
const localDate = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ---- the elements, from their docs pages -------------------------------------------------------------
 * The first line of every docs page is its metadata (CLAUDE.md "Docs page format"), so a new component
 * appears in the table without anybody editing this script. */
function readElements() {
  const dir = join(ROOT, 'docs-src', 'components')
  const els = new Map()
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.html')).sort()) {
    const where = `docs-src/components/${f}`
    const m = readFileSync(join(dir, f), 'utf8').split('\n')[0].match(/\{.*\}/)
    if (!m) throw new Failure(`${where}: the first line is not the <!--{"title": …, "order": …}--> metadata`)
    let meta
    try {
      meta = JSON.parse(m[0])
    } catch (e) {
      throw new Failure(`${where}: the metadata on the first line is not JSON (${e.message})`)
    }
    if (typeof meta.title !== 'string' || typeof meta.order !== 'number') throw new Failure(`${where}: the metadata needs a string "title" and a number "order"`)
    els.set(f.slice(0, -'.html'.length), meta)
  }
  for (const n of OWNERS) if (!els.has(n)) throw new Failure(`docs-src/components/${n}.html is missing: the owner's table needs it`)
  return els
}

/* ---- the screenshot review, kept by hand -----------------------------------------------------------
 * name -> { state, date }. A name that is not an element, a state outside REVIEW_STATES or a date that is not
 * YYYY-MM-DD stops the command: a typo must not quietly show as "not reviewed". */
function readReview(els) {
  let data
  try {
    data = JSON.parse(readFileSync(REVIEW, 'utf8'))
  } catch (e) {
    throw new Failure(`cannot read ${rel(REVIEW)}: ${e.message}`)
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Failure(`${rel(REVIEW)} must be one object: { "<element>": { "state": …, "date": … } }`)
  const out = new Map()
  for (const [name, v] of Object.entries(data)) {
    if (!els.has(name)) throw new Failure(`${rel(REVIEW)}: "${name}" is not an element (there is no docs-src/components/${name}.html)`)
    if (!v || !REVIEW_STATES.includes(v.state)) throw new Failure(`${rel(REVIEW)}: ${name}: "state" must be one of ${REVIEW_STATES.map((x) => `"${x}"`).join(', ')}`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date ?? '')) throw new Failure(`${rel(REVIEW)}: ${name}: "date" must be YYYY-MM-DD`)
    out.set(name, { state: v.state, date: v.date })
  }
  return out
}

// The names of one family, in the page's order (by "order"; ties keep the alphabetical order of the file names).
const inFamily = (els, fam) => [...els].filter(([n, m]) => Number.isInteger(m.order) && m.order >= fam.from && m.order < fam.to && !OWNERS.includes(n)).sort(([, a], [, b]) => a.order - b.order).map(([n]) => n)

/* ---- the gate logs ----------------------------------------------------------------------------------- */
// name -> the names of the tests that failed. A name that is present at all has a spec that ran.
// The spec file names are the element names, which new-component.mjs restricts to [a-z0-9-], so \w is enough.
function parseSpec(text) {
  const spec = new Map()
  for (const line of logLines(text)) {
    const m = line.match(/^\s+(ok|FAIL)\s+([\w-]+): (.*)/)
    if (!m) continue
    const [, status, name, test] = m
    if (!spec.has(name)) spec.set(name, [])
    if (status === 'FAIL') spec.get(name).push(test)
  }
  return spec
}

// What an accessibility error means to a reader of the page. Order matters: the first rule that fits wins.
function a11yKind(msg) {
  if (msg.startsWith('focus: ring')) return 'focus ring contrast'
  if (msg.startsWith('focus: no visible')) return 'no visible focus indicator'
  if (msg.startsWith('focus:') && msg.includes('covered')) return 'focused control covered by other content'
  if (msg.startsWith('clipped@200')) return 'text cut off at 200% text'
  if (msg.startsWith('clipped@320')) return 'text cut off at 320px'
  if (msg.startsWith('clipped')) return 'text cut off at large text or 320px'
  if (msg.startsWith('reflow')) return 'page scrolls sideways'
  if (msg.startsWith('targets')) return 'target too small'
  if (msg.startsWith('axe')) return 'axe: ' + msg.split(':')[0]
  return msg.split(':')[0]
}

// name -> { seen: runs in the log, appearances: Map(appearance -> errors), errors: Map(kind -> count) }
// A run prints one header line, then up to six "      x message" lines, then "... and N more".
function parseA11y(text) {
  const a11y = new Map()
  let cur = null // the page whose error lines we are reading; null after an "ok" header
  for (const line of logLines(text)) {
    // The header is "<ok | x N error(s)>, padded, <'(N warn)', padded, only if there are warnings>, <page>  [<appearance>]".
    // The warning count sits BEFORE the page name, and is optional: a header that has one must still match, or its
    // run is not counted and its error lines would be charged to whichever page came before it.
    const h = line.match(/^(ok|x \d+ error\(s\))\s+(?:\(\d+ warn\)\s+)?(\S+\.html)\s+\[([\w-]+)\]/)
    if (h) {
      const [, status, page, appearance] = h
      const name = page.split('/').pop().slice(0, -'.html'.length)
      if (!a11y.has(name)) a11y.set(name, { seen: 0, appearances: new Map(), errors: new Map() })
      const rec = a11y.get(name)
      rec.seen++
      cur = null
      if (status !== 'ok') {
        rec.appearances.set(appearance, Number(status.match(/\d+/)[0]))
        cur = name
      }
      continue
    }
    const e = line.match(/^\s+x (.*)/)
    if (e && cur) {
      const kind = a11yKind(e[1])
      const errors = a11y.get(cur).errors
      errors.set(kind, (errors.get(kind) ?? 0) + 1)
    }
  }
  return a11y
}

// A gate that died before it printed its summary leaves a log that parses to "nothing ran", and a page that says so
// in every row. Refuse such a log instead: the summary line is the only proof the gate reached its end.
const SUMMARIES = {
  components: { what: 'component specs (node tests/components.mjs)', re: /^\d+ passed, \d+ failed, \d+ spec file\(s\)\.$/m },
  a11y: { what: 'accessibility gate (node tests/a11y.mjs)', re: /^(?:\d+ accessibility error\(s\) across \d+ page\/appearance runs\.|Accessibility gate passed: )/m },
  lint: { what: 'lint (node tests/lint.mjs)', re: /^(?:Lint OK \(|\d+ error\(s\):$)/m },
}
function readLog(kind, file) {
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch (e) {
    throw new Failure(`cannot read the ${kind} log: ${e.message}`)
  }
  if (!SUMMARIES[kind].re.test(text)) throw new Failure(`the ${kind} log (${file}) has no summary line: the ${SUMMARIES[kind].what} did not finish. Run it again.`)
  return text
}

/* ---- the page ----------------------------------------------------------------------------------------- */
function render({ els, spec, a11y, lintOk, minAppearances, date, review }) {
  // What the gates found about one element, as ready-to-print HTML fragments. Empty means no finding.
  function findings(name) {
    const out = []
    const failed = spec.get(name)
    if (failed?.length) out.push('spec fails: ' + failed.slice(0, 2).map((t) => esc(clip(t, 110))).join('; '))
    const a = a11y.get(name)
    if (a?.appearances.size) {
      const kinds = [...a.errors].sort(byKey).map(([k, n]) => `${esc(k)} (${n})`).join(', ') || 'errors'
      const rank = (x) => (APP_NAMES.has(x) ? [...APP_NAMES.keys()].indexOf(x) : 9)
      const apps = [...a.appearances.keys()].sort((x, y) => rank(x) - rank(y)).map((x) => APP_NAMES.get(x) ?? x).join(' / ')
      out.push(`accessibility gate, in ${esc(apps)}: ${kinds}`)
    }
    return out
  }
  // "pass" needs evidence from all three gates. The lint is global (one result for the whole tree), the spec and the
  // page are the element's own; a page counts only if it was run in every appearance, so a skipped one is not a pass.
  const passes = (name) => !findings(name).length && lintOk && spec.has(name) && (a11y.get(name)?.seen ?? 0) >= minAppearances
  // The screenshot review, as printed: "in review (2026-10-01)". Never derived from the gates.
  const shots = (name) => {
    const r = review.get(name)
    return r ? `${esc(r.state)} (${esc(r.date)})` : 'not reviewed'
  }

  function row(name) {
    const f = findings(name)
    const ok = passes(name)
    const items = f.length ? f.join('<br>') : ok ? 'none' : 'not run'
    return '    <tr role="row">' +
      `<td role="cell" data-label="Element"><a href="@/components/${name}.html">${esc(els.get(name).title)}</a></td>` +
      `<td role="cell" data-label="Automated checks">${ok ? 'pass' : f.length ? '<strong>fail</strong>' : '<strong>not run</strong>'}</td>` +
      `<td role="cell" data-label="Screenshots">${shots(name)}</td>` +
      '<td role="cell" data-label="5 Freeze">awaiting sign-off</td>' +
      `<td role="cell" data-label="Open items">${items}</td></tr>`
  }

  const families = FAMILIES.map((fam) => ({ ...fam, names: inFamily(els, fam) })).filter((fam) => fam.names.length)
  // An element whose order is in no band would silently vanish from the table, which is the opposite of a status page.
  const listed = new Set([...OWNERS, ...families.flatMap((fam) => fam.names)])
  for (const [n, m] of els) if (!listed.has(n)) console.error(`status: ${n} (order ${m.order}) is in no family band, so it is not on the page. See FAMILIES in scripts/status.mjs.`)

  const lines = []
  const P = (s) => { lines.push(s) }

  // The head: the stacked-table pattern now comes from docs.css and the build, so only the short status words are kept
  // on one line in the wide layout.
  P(`<!--{"title":"Status","group":"Project","order":1,"summary":"Where every element stands: what the automated checks found, whether a person has reviewed its screenshots, what is still open, and how the table is kept."}-->
<style>
  /* docs.css changes asked of the lead in the docs group's report: delete this block once docs.css has them.
     The inset of a note, a code block and a stacked table row is chrome (Space: chrome caps), so 200% text keeps the
     width for the words. On a phone at large text a note's body runs under its icon, which stays beside the first
     line of the note's title. */
  .docs-article .note { gap: var(--chrome-3); padding: var(--chrome-4); }
  .docs-article pre, .docs-article .demo__code pre { padding: var(--chrome-4); }
  @media (max-width: 40em) { .docs-article .docs-table[data-stack] tr { padding: var(--chrome-3) var(--chrome-4); } }
  @container article (max-width: 16rem) {
    .docs-article .note { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: start; }
    .docs-article .note > .ic { margin-block-start: 0; }
    .docs-article .note > div { display: contents; }
    .docs-article .note > div > * { grid-column: 1 / -1; min-inline-size: 0; }
    .docs-article .note > div > strong:first-child { grid-column: 2; margin-block-start: calc((1.25rem - 1lh) / 2); }
    .docs-article .note :is(ul, ol) { padding-inline-start: 1.1em; }
  }
  .docs-article code [data-f="nw"] { white-space: nowrap; } /* a hyphenated word in a code chip never breaks after its leading hyphens */
  @media (min-width: 40em) { .docs-table[data-stack] td:is([data-label="Automated checks"], [data-label="Screenshots"], [data-label="5 Freeze"]) { white-space: nowrap; } }
</style>
<h1>Status</h1>
<p class="lede">Every element moves through six gates, in order. This page records what has been checked for each one, by machine and by eye, and nothing more. Card and Button are the owner's two and are waiting for sign-off; the rest were built since, and none has been signed off.</p>

<h2 id="gates">The gates</h2>
<p>The full list, with the question each gate asks, is on <a href="@/project/contributing.html#gates">Contributing</a>: 0 brief, 1 wireframe, 2 states, 3 colour, 4 motion, 5 freeze. Gate 5 is the owner's: an element is frozen when its docs are complete, its accessibility gate is green, its screenshots have been looked at, and the owner has said so.</p>

<h2 id="owners">Card and Button</h2>
<p>The table from <code>STYLE.md</code> section 6, which is the owner's record.</p>
<div class="table-wrap"><table class="docs-table">
  <caption class="sr-only">Pipeline status of Card and Button, gate by gate</caption>
  <thead><tr><th>Element</th><th>0 Brief</th><th>1 Wireframe</th><th>2 States</th><th>3 Colour</th><th>4 Motion</th><th>5 Freeze</th></tr></thead>
  <tbody>`)
  // The owner's record says "done" for every gate but the last, whatever the evidence says (see the header).
  for (const n of OWNERS) P(`    <tr><td><a href="@/components/${n}.html">${esc(els.get(n).title)}</a></td><td>done</td><td>done</td><td>done</td><td>done</td><td>done</td><td>awaiting sign-off</td></tr>`)
  P('  </tbody>')
  P('</table></div>')
  P(`<p>Screenshots, kept by hand (<a href="#keep">how</a>): ${OWNERS.map((n) => `${esc(els.get(n).title)} ${shots(n)}`).join('; ')}.</p>`)
  const ownerOpen = OWNERS.filter((n) => findings(n).length)
  if (ownerOpen.length) P('<p>On the last run Card or Button had a finding. It is listed under <a href="#open">Open items</a>.</p>')
  P('')
  P('<h2 id="rest">Everything built since</h2>')
  P(`<p>Last run of the checks: ${esc(date)}, on the merged tree of every slice. Each row has two fields, and each says only what was checked.</p>`)
  P(`<ul>
  <li><strong>Automated checks</strong> reads <em>pass</em> when three things hold at once: the element's spec in <code>tests/<wbr>components/</code> passes, <code>npm run lint</code> reports no error, and its page passes <code>npm run test:a11y</code> in all five appearances. Otherwise it reads <em>fail</em>, with the findings in Open items, or <em>not run</em>. A pass proves what those checks measure: keys, states, names, contrast, targets, no text cut off and no sideways scrolling at 320px and at 200% text. It does not prove that the element looks right.</li>
  <li><strong>Screenshots</strong> says whether a person has looked at the element's demos at 390px with 100% and with 200% text, and at 1024px, since its last change: <em>in review</em>, <em>changes needed</em> or <em>reviewed</em>, with the date. Equal heights in a row, no lonely item, no word broken inside, icons beside their labels: only a person checks those.</li>
</ul>`)
  P(`<p>Gates 1 to 4 include looks (the squint test in <code>data-palette="wire"</code>, the states as drawn), so an element is ready for the owner only when its checks pass <em>and</em> its screenshots are reviewed. <strong>Gate 5</strong> is <em>awaiting sign-off</em> for every element: nobody has signed one off.</p>`)
  P('')
  for (const fam of families) {
    P(`<h3 id="f-${fam.key}">${esc(fam.title)}</h3>`)
    P('<div class="table-wrap" tabindex="-1"><table class="docs-table" data-stack role="table">')
    P(`  <caption class="sr-only">${esc(fam.title)}: automated checks, screenshot review, gate 5 and open items for each element</caption>`)
    P('  <thead role="rowgroup" data-allow-clip><tr role="row"><th role="columnheader">Element</th><th role="columnheader">Automated checks</th><th role="columnheader">Screenshots</th><th role="columnheader">5 Freeze</th><th role="columnheader">Open items</th></tr></thead>')
    P('  <tbody role="rowgroup">')
    for (const n of fam.names) P(row(n))
    P('  </tbody>')
    P('</table></div>')
    P('')
  }

  P('<h2 id="open">Open items</h2>')
  // Card and Button first, then the families in page order.
  const openNames = [...ownerOpen, ...families.flatMap((fam) => fam.names.filter((n) => !passes(n)))]
  if (openNames.length) {
    P('<p>Every item is a finding from an automated check, not an opinion. When one is fixed, run the checks again; the cell changes only with them.</p>')
    P('<ul>')
    for (const n of openNames) P(`  <li><a href="@/components/${n}.html">${esc(els.get(n).title)}</a>: ${findings(n).length ? findings(n).join('; ') : 'not run'}</li>`)
    P('</ul>')
  } else {
    P("<p>No automated check has a finding: every element passes its spec, the lint and the accessibility gate. That is the mechanical half; the Screenshots field says how far the looks have been reviewed.</p>")
  }
  P('')
  P(`<h2 id="keep">How this table is kept</h2>
<ul>
  <li>It is generated, so that nobody types a status. <code>npm run status</code> runs the build, the lint, the component specs and the accessibility gate, and rewrites this page from their output (about an hour for all five appearances; <code>npm run status -- <span data-f="nw">--quick</span></code> runs two and is for looking, not for committing). Run <code>npm run build</code> afterwards so <code>docs/</code> matches; CI fails otherwise.</li>
  <li><code>STYLE.md</code> section 6 keeps the owner's own two rows, Card and Button: when either moves, copy its row there in the same pull request, and add a line to the <a href="@/project/changelog.html">Changelog</a>.</li>
  <li>To refresh only the evidence, run the three commands yourself: <code>npm run lint</code>, <code>npm run test:components</code> and <code>npm run test:a11y</code>. <em>Automated checks</em> only ever reads <em>pass</em> because the checks passed. Gate 5 is the owner's sign-off and is never filled in by the script.</li>
  <li><strong>Screenshots</strong> is kept by hand in <code>docs-src/project/<wbr>visual-review.json</code>, one entry per element: <code>{ "button": { "state": "reviewed", "date": "2026-10-02" } }</code>. The states are <code>in review</code> (being looked at, or changed since the last look), <code>changes needed</code> and <code>reviewed</code>. Whoever reviews the screenshots changes the entry after looking (390px at 100% and 200% text, and 1024px), sets it back to <code>in review</code> when the element changes, and regenerates this page: from the last run's logs, which <code>npm run status</code> keeps in <code>test-results/</code> (the header of <code>scripts/<wbr>status.mjs</code> shows how), so nothing has to run again. No script writes the file.</li>
  <li>Everything here was measured in Chromium. Nothing has been verified in Safari, Firefox or with a screen reader; see <a href="@/project/decisions.html#devices">Decisions</a>.</li>
</ul>`)

  const total = families.reduce((n, fam) => n + fam.names.length, 0)
  return { html: lines.join('\n') + '\n', total, open: openNames.length - ownerOpen.length }
}

/* ---- running the gates (--run) ---------------------------------------------------------------------- */
// Run `node <args>` in the repo with stdout and stderr appended to one log file, like `> log 2>&1`. The exit code is
// returned, not judged: a gate that finds problems exits non-zero, and those findings are what this page is made of.
function node(args, logFile, env = {}) {
  return new Promise((done, fail) => {
    const fd = openSync(logFile, 'w')
    const child = spawn(process.execPath, args, { cwd: ROOT, stdio: ['ignore', fd, fd], env: { ...process.env, ...env } })
    child.on('error', (e) => { closeSync(fd); fail(e) })
    child.on('close', (code, signal) => {
      closeSync(fd)
      if (signal) fail(new Failure(`node ${args.join(' ')} was stopped by ${signal}`))
      else done(code)
    })
  })
}

async function runGates({ els, quick }) {
  mkdirSync(join(ROOT, 'test-results'), { recursive: true }) // git-ignored, like the a11y gate's own a11y.json
  const dir = mkdtempSync(join(ROOT, 'test-results', 'status-'))
  const log = (name) => join(dir, name + '.log')
  const say = (s) => console.error('status: ' + s)
  say(`logs in ${rel(dir)}/ (tail -f ${rel(log('a11y'))} to watch the long one)`)

  // 1. build: the gates read docs/ and dist/. Unlike the gates, a failed build means there is nothing to measure.
  let t = Date.now()
  say('building (docs links may be unfinished, so --allow-broken-links)')
  const built = await node(['scripts/build.mjs', '--allow-broken-links'], log('build'))
  if (built !== 0) throw new Failure(`the build failed (exit ${built}); see ${rel(log('build'))}`)
  say(`  build finished in ${Math.round((Date.now() - t) / 1000)} s`)

  // 2. the three gates, cheapest first, so a gate that cannot run stops the command before the hour-long one starts.
  // Every row of the table gets its page run: the list comes from the same docs-src/components that makes the rows.
  const pages = [...els.keys()].map((n) => `components/${n}.html`).join(',')
  const gates = [
    ['lint', ['tests/lint.mjs'], {}],
    ['components', ['tests/components.mjs'], {}],
    // One job at a time, as the original driver ran it; set A11Y_JOBS to override.
    ['a11y', ['tests/a11y.mjs', '--pages', pages, ...(quick ? ['--quick'] : [])], { A11Y_JOBS: process.env.A11Y_JOBS ?? '1' }],
  ]
  const logs = {}
  for (const [kind, args, env] of gates) {
    t = Date.now()
    say(`running the ${SUMMARIES[kind].what}${kind === 'a11y' ? (quick ? ', two appearances' : ', five appearances: about an hour') : ''}`)
    const code = await node(args, log(kind), env)
    logs[kind] = log(kind)
    readLog(kind, logs[kind]) // fail now, not after the next gate
    say(`  ${kind} finished in ${Math.round((Date.now() - t) / 1000)} s (exit ${code}${code ? ': its findings go into the page' : ''})`)
  }
  return logs
}

/* ---- main ---------------------------------------------------------------------------------------------- */
const USAGE = `usage: node scripts/status.mjs --run [--quick] [--out FILE]
       node scripts/status.mjs --components-log F --a11y-log F --lint-log F [--out FILE] [--appearances N]
(npm run status = the first form. Without --run the page goes to stdout unless --out is given. See the header of this file.)`

async function main() {
  let opt
  try {
    opt = parseArgs({
      options: {
        run: { type: 'boolean' },
        quick: { type: 'boolean' },
        'components-log': { type: 'string' },
        'a11y-log': { type: 'string' },
        'lint-log': { type: 'string' },
        out: { type: 'string' },
        appearances: { type: 'string' },
        help: { type: 'boolean', short: 'h' },
      },
      allowPositionals: false,
    }).values
  } catch (e) {
    throw new Failure(`${e.message}\n${USAGE}`, 2)
  }
  if (opt.help) return console.log(USAGE)
  const given = ['components-log', 'a11y-log', 'lint-log'].filter((k) => opt[k] !== undefined)
  if (opt.run && given.length) throw new Failure(`--run makes its own logs; do not combine it with --${given[0]}\n${USAGE}`, 2)
  if (!opt.run && given.length !== 3) throw new Failure(`give --run, or all three of --components-log, --a11y-log and --lint-log\n${USAGE}`, 2)
  if (opt.quick && !opt.run) throw new Failure(`--quick belongs to --run; for a quick a11y log use --appearances 2\n${USAGE}`, 2)

  const wanted = opt.appearances ?? process.env.STATUS_APPEARANCES ?? (opt.quick ? '2' : '5')
  if (!/^[1-9]\d*$/.test(wanted)) throw new Failure(`appearances must be a positive whole number, not "${wanted}"`, 2)

  const els = readElements()
  const review = readReview(els)
  const logs = opt.run ? await runGates({ els, quick: !!opt.quick }) : { components: opt['components-log'], a11y: opt['a11y-log'], lint: opt['lint-log'] }
  const text = Object.fromEntries(Object.entries(logs).map(([kind, file]) => [kind, readLog(kind, file)]))
  const lintOk = text.lint.includes('Lint OK')
  if (!lintOk) console.error('status: the lint reports errors, so no element can read "done". Fix those first (npm run lint).')

  const { html, total, open } = render({
    els,
    spec: parseSpec(text.components),
    a11y: parseA11y(text.a11y),
    lintOk,
    minAppearances: Number(wanted),
    date: process.env.STATUS_DATE || localDate(),
    review,
  })

  const out = opt.out ?? (opt.run ? PAGE : '-')
  if (out === '-') process.stdout.write(html)
  else {
    writeFileSync(resolve(out), html)
    console.error(`status: wrote ${rel(resolve(out))}`)
    // docs/ is generated from docs-src/ and committed; the CI check (npm run build:check) fails while the two disagree.
    if (resolve(out) === PAGE) console.error('status: now run npm run build, so docs/ carries the new page')
  }
  const seen = [...review.values()].filter((r) => r.state === 'reviewed').length
  console.error(`status: ${total} elements besides Card and Button: ${total - open} pass the automated checks, ${open} do not; ${seen} of ${els.size} have reviewed screenshots`)
  if (opt.quick) console.error('status: --quick ran two appearances, but the page text says all five. Use it to look, not to commit.')
}

main().catch((e) => {
  console.error(e instanceof Failure ? `status: ${e.message}` : e)
  process.exit(e instanceof Failure ? e.code : 1)
})
