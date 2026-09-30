#!/usr/bin/env node
/**
 * Scaffold a component: CSS, docs page, and interaction-test stub, all from the same skeleton.
 *
 *   npm run new:component -- chip --order 45 --title "Chip"
 *
 * Creates
 *   src/components/<name>.css           layered, tokenised, with the checklist in the header
 *   docs-src/components/<name>.html     page in the standard format (live demos, API, a11y, tokens)
 *   tests/components/<name>.mjs         keyboard / ARIA interaction test stub
 * Then: `npm run build`, open the page, fill in every TODO, run `npm run lint && npm run test:a11y`.
 * Refuses to overwrite anything. Read CLAUDE.md "Adding a component" first.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const name = argv.find((a) => !a.startsWith('--') && !/^\d+$/.test(a) && argv[argv.indexOf(a) - 1] !== '--title')
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1] }
if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error('Usage: npm run new:component -- <kebab-name> [--order N] [--title "Title"] [--group Components]')
  process.exit(1)
}
const order = Number(opt('order', 500))
const title = opt('title', name.replace(/(^|-)(\w)/g, (_, a, b) => (a ? ' ' : '') + b.toUpperCase()))
const group = opt('group', 'Components')

const files = {
  [`src/components/${name}.css`]: `/* ==========================================================================
   ${title}  (layer: sg.components)
   --------------------------------------------------------------------------
   TODO one sentence: what it is and when to use it.

   <div class="${name}" data-variant="…">…</div>

   data-variant   TODO
   data-size      TODO
   States come from ARIA / native attributes (aria-selected, aria-pressed,
   aria-current, aria-expanded, aria-busy, :disabled, aria-disabled), never classes.

   Follow src/components/button.css. Checklist (also in CLAUDE.md):
   [ ] only colour ROLES, radius/border/shadow ROLES and space/type tokens; no literals
   [ ] works in soft / pop / hard with no style-specific branches
   [ ] hit area >= 44px (use the ::after pattern), gaps >= 8px
   [ ] focus ring visible; if you draw box-shadow, keep var(--focus-shadow)
   [ ] state is never colour-only; selected/on has a shape, weight or icon cue
   [ ] a transparent border exists so forced-colors keeps the edge
   [ ] travel/scale multiplied by --move / --press-scale-style; opacity fades otherwise
   [ ] rem units, wraps at 200% text, fine at 320px wide (container queries, not media)
   [ ] hover gated by @media (hover: hover)
   ========================================================================== */

@layer sg.components {
  .${name} {
    /* private properties: what variants change */
    --_bg: var(--color-surface);
    --_fg: var(--color-ink);

    background: var(--_bg);
    color: var(--_fg);
    border: var(--card-border-w) solid var(--card-border-c);
    border-radius: var(--radius-card);
  }
}
`,
  [`docs-src/components/${name}.html`]: `<!--{"title":"${title}","group":"${group}","order":${order},"summary":"TODO one sentence shown in search results and the page header."}-->
<h1>${title}</h1>
<p class="lede">TODO what it is, in one or two sentences a designer would say out loud.</p>

<h2 id="when">When to use</h2>
<div class="dodont">
  <div class="note" data-kind="do">
    <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-circle-check" /></svg>
    <div><strong>Do</strong><p>TODO</p></div>
  </div>
  <div class="note" data-kind="dont">
    <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-circle-x" /></svg>
    <div><strong>Don't</strong><p>TODO</p></div>
  </div>
</div>

<h2 id="examples">Examples</h2>
<h3 id="basic">Basic</h3>
<div class="demo">
  <div class="demo__stage">
    <div class="${name}">TODO</div>
  </div>
</div>

<h2 id="anatomy">Anatomy</h2>
<ol><li>TODO</li></ol>

<h2 id="api">API</h2>
<div class="table-wrap"><table class="docs-table">
  <caption class="sr-only">${title} attributes</caption>
  <thead><tr><th>Attribute</th><th>Values</th><th>Effect</th></tr></thead>
  <tbody><tr><td><code>class="${name}"</code></td><td>:</td><td>TODO</td></tr></tbody>
</table></div>

<h2 id="a11y">Accessibility</h2>
<div class="table-wrap"><table class="docs-table">
  <caption class="sr-only">${title} keyboard and screen reader behaviour</caption>
  <thead><tr><th>Interaction</th><th>Behaviour</th></tr></thead>
  <tbody>
    <tr><td><kbd>Tab</kbd></td><td>TODO</td></tr>
    <tr><td>Screen reader</td><td>TODO: role, name, state announced</td></tr>
    <tr><td>Touch</td><td>TODO: target size, any gesture has a tap alternative</td></tr>
    <tr><td>Reduced motion</td><td>TODO</td></tr>
    <tr><td>Forced colours</td><td>TODO</td></tr>
  </tbody>
</table></div>

<h2 id="tokens">Tokens used</h2>
<p>TODO list the roles this component reads.</p>
`,
  [`tests/components/${name}.mjs`]: `// Interaction spec for ${title}. See tests/components.mjs for the contract and tests/components/button.mjs for a model.
export const tests = [
  {
    name: 'TODO: Tab reaches it and the documented keys work',
    async run({ page, goto, expect }) {
      await goto('components/${name}.html')
      // TODO
      expect.ok(true)
    },
  },
]
`,
}

for (const [path, content] of Object.entries(files)) {
  const full = join(ROOT, path)
  if (existsSync(full)) { console.error(`Refusing to overwrite ${path}`); process.exit(1) }
}
for (const [path, content] of Object.entries(files)) {
  const full = join(ROOT, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content)
  console.log('created', path)
}
console.log('\nNext: npm run build, open docs/components/' + name + '.html, fill in every TODO, then npm run lint && npm run test:a11y -- --pages components/' + name + '.html')
