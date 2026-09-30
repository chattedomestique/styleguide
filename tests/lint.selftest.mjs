#!/usr/bin/env node
/**
 * Does the lint catch what it claims to? Replays tests/lint-cases.json, the violations (V) and the
 * legitimate snippets (L) that the tooling audit of the owner's original checker used to show that
 * it caught 44% of 146 violations and wrongly flagged legitimate CSS. Every V must be flagged (error or
 * warning), every L must pass clean. Cases we knowingly do not cover statically are listed in
 * `knownMisses` with the reason, so a regression in either direction is loud.
 *
 *   node tests/lint.selftest.mjs            summary
 *   node tests/lint.selftest.mjs --verbose  every case
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkCss, checkHtml, undefinedTokens, unknownClasses, declaredIn } from './lib/rules.mjs'
import { collectProject } from './lib/project.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(join(here, 'lint-cases.json'), 'utf8'))
const verbose = process.argv.includes('--verbose')
const known = data.knownMisses ?? {}
const project = collectProject()

const LAYER = { component: 'sg.components', base: 'sg.base', wire: 'sg.wire', token: 'sg.tokens', layout: 'sg.layout' }
let caught = 0, total = 0, clean = 0, legit = 0
const bad = []
const stale = []
const skipped = []

for (const c of data.cases) {
  const k = c.files[0]
  let res
  const snippet = c.snippets.join('\n')
  if (!snippet.trim()) { skipped.push(c); continue }
  if (LAYER[k]) {
    const css = `@layer ${LAYER[k]} {\n${snippet}\n}`
    res = checkCss({ name: `src/${k}/case.css`, css, kind: k, gates: c.gates ?? { motion: true } })
    // the cross-file checks run on the same snippet
    const extra = undefinedTokens({ css, declared: project.declared }).map((r) => ({ ...r }))
    res = { errors: [...res.errors, ...extra], warnings: res.warnings }
  } else if (k === 'html') {
    res = checkHtml({ name: 'docs-src/case.html', html: snippet, page: false })
    res = { errors: [...res.errors, ...unknownClasses({ source: snippet, known: project.classes }).map((r) => ({ ...r }))], warnings: res.warnings }
  } else { skipped.push(c); continue }
  const flagged = res.errors.length + res.warnings.length > 0
  if (c.kind === 'V') {
    total++
    if (flagged) { caught++; if (known[c.id]) stale.push(`${c.id} is now caught; remove it from knownMisses`) }
    else if (!known[c.id]) bad.push(`MISSED ${c.id} [${k}] ${c.what}\n      ${c.snippets.join(' ').slice(0, 140)}`)
    if (verbose) console.log(`${flagged ? 'caught' : 'MISS  '} ${c.id} ${c.what}`)
  } else {
    legit++
    if (!flagged) clean++
    else bad.push(`FALSE POSITIVE ${c.id} [${k}] ${c.what}\n      ${[...res.errors, ...res.warnings].map((r) => r.msg).join(' | ').slice(0, 200)}`)
    if (verbose) console.log(`${flagged ? 'FLAGGED' : 'clean  '} ${c.id} ${c.what}`)
  }
}

// unit: the definition scan must not treat selector fragments as tokens (the original's DEF-3)
{
  const d = declaredIn('.card--link:is(.a){color:red} .card--ghost:hover{x:1} a{--real: 1} @property --num { syntax: "<number>"; inherits: true; initial-value: 0 } .y{--last:2}')
  for (const t of ['--link', '--ghost']) if (d.has(t)) bad.push(`PHANTOM TOKEN ${t}: a selector fragment was counted as a definition`)
  for (const t of ['--real', '--num', '--last']) if (!d.has(t)) bad.push(`MISSING TOKEN ${t}: a real definition was not found (last declaration without ';' or @property)`)
}

console.log(`violations caught: ${caught}/${total} (${Math.round((100 * caught) / total)}%) · legitimate snippets passed: ${clean}/${legit} · not static CSS/HTML (skipped): ${skipped.length} · known misses: ${Object.keys(known).length}`)
for (const s of stale) console.log('  ! ' + s)
if (bad.length) { console.log(`\n${bad.length} problem(s):\n` + bad.map((b) => '  x ' + b).join('\n')); process.exit(1) }
console.log('Lint self-test OK.')
