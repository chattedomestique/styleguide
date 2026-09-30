/**
 * The rules behind `npm run lint`, as pure functions so the self-test can feed them snippets.
 *
 *   checkCss({ name, css, kind })   kind: 'token' | 'base' | 'layout' | 'component' | 'wire'
 *   checkHtml({ name, html, page }) page: true for a docs page (needs the metadata comment)
 *   tokenize(css)                   -> declarations with their selector / at-rule context
 *
 * Both return { errors, warnings }: arrays of { line, rule, msg }.
 *
 * Why a tokenizer and not regexes: the owner's original checker matched `prop: value;` and so
 * could not see a last declaration with no semicolon, a colour inside a custom property, a blur
 * hidden behind a token, or a named colour. Its tooling audit fed it 146 deliberate violations and
 * it caught 44%. This file is built to catch them, and tests/lint.selftest.mjs replays those same
 * cases (tests/lint-cases.json) on every `npm test` so it cannot quietly regress.
 *
 * Rules that protect the owner's seven rules are tagged so the docs can say which are machine-checked.
 */

/* ---------------------------------------------------------------------------- tokenizer */

const blank = (m) => m.replace(/[^\n]/g, ' ')
export const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, blank)
export const lineOf = (text, idx) => text.slice(0, idx).split('\n').length

/**
 * Walk a stylesheet and return every declaration with the preludes (selectors and at-rules) that
 * enclose it. Handles native nesting, `;` inside url(data:...) and strings, and a last
 * declaration with no trailing semicolon.
 */
export function tokenize(css) {
  const text = stripComments(css)
  const decls = []
  const stack = []
  let buf = ''
  let bufStart = 0
  let paren = 0
  let quote = ''
  const flush = (i) => {
    const d = buf.trim()
    if (d) {
      const c = d.indexOf(':')
      // a declaration has a colon; "a:hover" without braces cannot occur here because preludes end in "{"
      if (c > 0) {
        const prop = d.slice(0, c).trim()
        if (/^(--[\w-]+|-?[a-zA-Z][\w-]*)$/.test(prop)) {
          decls.push({ prop: prop.startsWith('--') ? prop : prop.toLowerCase(), value: d.slice(c + 1).trim(), index: bufStart + buf.indexOf(d), line: lineOf(text, bufStart + buf.indexOf(d)), stack: stack.slice() })
        }
      }
    }
    buf = ''
    bufStart = i + 1
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      buf += ch
      if (ch === '\\') { buf += text[++i] ?? '' } else if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue }
    if (ch === '(') paren++
    else if (ch === ')') paren = Math.max(0, paren - 1)
    if (paren === 0 && ch === '{') { stack.push(buf.trim()); buf = ''; bufStart = i + 1; continue }
    if (paren === 0 && ch === ';') { flush(i); continue }
    if (paren === 0 && ch === '}') { flush(i); stack.pop(); continue }
    buf += ch
  }
  flush(text.length)
  return decls
}

/** Split on a separator at the top level only (not inside parentheses or quotes). */
export function splitTop(s, sep) {
  const out = []
  let depth = 0
  let cur = ''
  let q = ''
  for (const ch of s) {
    if (q) { cur += ch; if (ch === q) q = ''; continue }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue }
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (depth === 0 && (sep === ',' ? ch === ',' : sep === '/' ? ch === '/' : /\s/.test(ch))) {
      if (cur.trim()) out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

/** Balanced contents of the parentheses that open at s[open]. */
function balanced(s, open) {
  let d = 0
  for (let i = open; i < s.length; i++) {
    if (s[i] === '(') d++
    else if (s[i] === ')' && --d === 0) return s.slice(open + 1, i)
  }
  return ''
}

/* ---------------------------------------------------------------------------- vocabulary */

const NAMED = new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen').split(' '))
const COLOUR_FN = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|light-dark)\(/i
const HEX = /#[0-9a-f]{3,8}\b/i
const BAD_FONTS = /^(inter|roboto|open sans|lato|poppins|space grotesk|dm sans|plus jakarta sans|manrope|montserrat|geist|figtree|system-ui|ui-sans-serif|-apple-system|blinkmacsystemfont|segoe ui|sf pro|arial|helvetica(?: neue)?)$/i
const RADIUS_ROLE = /^(0|0px|inherit|initial|unset|var\(--radius-(?:card|tile|ctl|pill)\)|var\(--card-radius\)|var\(--_[\w-]*radius[\w-]*\))$/
const BORDER_WIDTH_OK = /^(0|0px|var\(--(?:bw|bw-thin|bw-heavy|ring)\)|calc\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\))$/
const NOT_A_BORDER = /^(border-(?:spacing|collapse|image[\w-]*|radius|[\w-]*radius))$/
const FONT_PX = /(?:^|[\s/])(\d*\.?\d+)px\b/

/* ---------------------------------------------------------------------------- helpers */

const stripStrings = (v) => v.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""')
const stripUrls = (v) => v.replace(/url\((?:"[^"]*"|'[^']*'|[^)])*\)/gi, 'url()')
const urlBodies = (v) => [...v.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi)].map((m) => m[1] ?? m[2] ?? m[3] ?? '')
const isLength = (t) => /^-?(?:\d*\.?\d+)(?:px|rem|em|ch|vw|vh|%)?$/.test(t)

/** Is every colour stop of a gradient a hard edge (a flat fill, a meter, a hatch)? */
function gradientIsFlat(args) {
  const parts = splitTop(args, ',')
  const stops = parts
    .filter((p) => !/^(?:to\s|\d+(?:\.\d+)?(?:deg|turn|rad|grad)\b|circle|ellipse|closest|farthest|at\s|from\s|in\s)/i.test(p))
    .map((p) => {
      const toks = splitTop(p, ' ')
      // colour is the first token or function; positions follow
      const colour = toks[0]
      const pos = toks.slice(1)
      return { colour, p1: pos[0], p2: pos[1] ?? pos[0] }
    })
  if (stops.length < 2) return true
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]
    const b = stops[i]
    if (a.colour === b.colour) continue
    const atStart = b.p1 === '0' || b.p1 === '0%'
    const meets = b.p1 !== undefined && a.p2 !== undefined && b.p1 === a.p2
    if (!atStart && !meets) return false
  }
  return true
}

const enclosing = (d) => d.stack
const inMedia = (d, re) => d.stack.some((p) => /^@(?:media|supports)/i.test(p) && re.test(p))
const selectorOf = (d) => d.stack.filter((p) => p && !p.startsWith('@')).join(' ')

const COLOURISH = /^(?:color|background(?:-color|-image)?|border(?:-[a-z-]+)?|outline(?:-color)?|fill|stroke|accent-color|caret-color|text-decoration(?:-color)?|column-rule(?:-color)?|box-shadow|text-shadow|-webkit-[a-z-]*color|--[\w-]+|scrollbar-color|mask|filter)$/

/* ---------------------------------------------------------------------------- CSS */

export function checkCss({ name, css, kind, gates = { motion: true } }) {
  const errors = []
  const warnings = []
  const err = (line, rule, msg) => errors.push({ line, rule, msg })
  const warn = (line, rule, msg) => warnings.push({ line, rule, msg })
  const decls = tokenize(css)
  const isToken = kind === 'token'
  const isWire = kind === 'wire'
  const isComponent = kind === 'component'
  const isDocs = kind === 'docs'
  const plain = stripComments(css)

  // private tokens (--_x) are a component's own: they may not be read from another file
  const privDeclared = new Set(decls.filter((d) => d.prop.startsWith('--_')).map((d) => d.prop))

  for (const d of decls) {
    const { prop, value, line } = d
    const v = stripStrings(stripUrls(value))
    const sel = selectorOf(d)

    /* ---- colour is a swap: literals live in src/tokens only (owner rule 6) ---- */
    if (!isToken && !isWire) {
      const colourCtx = COLOURISH.test(prop) || prop.startsWith('--')
      if (colourCtx && (HEX.test(v) || COLOUR_FN.test(v))) err(line, 'colour', `colour literal in "${prop}": read a role (--paper, --ink, --tone-bg …). Literals live in src/tokens only`)
      else if (colourCtx) {
        for (const w of v.toLowerCase().match(/[a-z]+/g) ?? []) {
          if (NAMED.has(w) && !/^(?:font|grid|animation|transition|will-change|list-style|content|counter)/.test(prop)) { err(line, 'colour', `named colour "${w}" in "${prop}": read a role`); break }
        }
      }
      for (const body of urlBodies(value)) {
        if (!/^data:/i.test(body)) continue
        let dec = body
        try { dec = decodeURIComponent(body) } catch { /* keep raw */ }
        const found = [...dec.matchAll(/(?:#|%23)([0-9a-f]{3,8})\b|\b(?:rgba?|hsla?)\(/gi)].filter((m) => !/^(?:#|%23)(?:000|000000)$/i.test(m[0]))
        if (found.length) err(line, 'colour', 'colour inside a data: URI. A mask may be black (its alpha is the shape); anything else belongs in a role')
        if (/\bfill=['"]?(?!none|currentColor|#000)/i.test(dec) && /(?:fill|stroke)=['"]?(?:red|white|blue|green)/i.test(dec)) err(line, 'colour', 'named colour inside a data: URI')
      }
    }

    /* ---- flat: no gradients, blur, glow (owner rule 2) ---- */
    if (!isWire) {
      for (const m of v.matchAll(/\b(?:repeating-)?(?:linear|radial|conic)-gradient\(/gi)) {
        if (!gradientIsFlat(balanced(v, m.index + m[0].length - 1))) err(line, 'flat', 'gradient: flat fills only (a hard-stop gradient for a meter or hatch is fine, a blend is not)')
      }
    }
    if (/backdrop-filter|-webkit-backdrop-filter/i.test(prop)) err(line, 'flat', `"${prop}" is banned (flat: no glass)`)
    if (/\bblur\(/i.test(v)) err(line, 'flat', '"blur()" is banned (flat: no blur)')
    if (prop === 'text-shadow') err(line, 'flat', '"text-shadow" is banned (flat: no glow)')
    if (/drop-shadow\(/i.test(v)) err(line, 'flat', '"drop-shadow()" is banned: shadows are hard-edged')
    if (prop === 'filter' && /url\(/i.test(value)) err(line, 'flat', '"filter: url(#…)" can hide a blur: use a role')
    if (prop === 'box-shadow' || (prop.startsWith('--') && (/shadow|elev/i.test(prop) || /^-?[\d.]+(?:px|rem|em)?\s+-?[\d.]+(?:px|rem|em)?\s+-?[\d.]+/.test(v)))) {
      for (const sh of splitTop(v, ',')) {
        const toks = splitTop(sh, ' ').filter((t) => t !== 'inset')
        const first = toks.findIndex((t) => isLength(t) || /^calc\(/.test(t))
        if (first < 0) continue
        const slots = toks.slice(first, first + 4)
        if (slots.length >= 3 && isLength(slots[2]) && parseFloat(slots[2]) !== 0) err(line, 'flat', `shadow with blur "${slots[2]}": shadows are hard-edged (zero blur)`)
        // a zero-blur shadow whose spread is a literal length is a line drawn with a shadow: a third weight
        if (!isToken && slots.length >= 4 && isLength(slots[3]) && parseFloat(slots[3]) !== 0 && /^\d/.test(slots[3].replace(/^-/, ''))) err(line, 'line', `shadow spread ${slots[3]} draws a line: use --bw, --bw-thin or --ring`)
        // an inset shadow offset on one axis only is the "accent stripe down one edge" (owner rule 7)
        if (/^inset\b/.test(sh) && slots.length >= 2 && isLength(slots[0]) && isLength(slots[1]) && ((parseFloat(slots[0]) === 0) !== (parseFloat(slots[1]) === 0)) && (!isLength(slots[3] ?? '') || parseFloat(slots[3]) === 0)) warn(line, 'rule-7', 'an inset shadow on one edge is an accent stripe: no decoration')
      }
    }

    /* ---- one typeface; defaults are not a choice ---- */
    if (prop.startsWith('--font') && !/^--font-mono/.test(prop)) {
      const first = splitTop(value, ',')[0]?.replace(/["']/g, '').trim() ?? ''
      if (BAD_FONTS.test(first)) err(line, 'type', `"${first}" as the first family is a default, not a choice`)
    }
    if (!isToken && prop === 'font-family' && !/^(?:var\(|inherit$|initial$|unset$)/.test(v)) err(line, 'type', 'font-family must come from a token (var(--font-sans))')
    if (!isToken && prop === 'font' && !/^(?:var\(--type-[\w-]+\)|inherit|initial|unset|-apple-system-body|caption|icon|menu|message-box|small-caption|status-bar)$/.test(v) && !/var\(--font-[\w-]+\)\s*$/.test(v) && !/var\(--type-/.test(v)) err(line, 'type', 'font shorthand with a literal family: use a --type-* token or end it with var(--font-sans)')

    /* ---- two line weights and the radius roles (owner rules 1, 3) ---- */
    if (!isToken) {
      const widthy = (/^(?:border(?:-[a-z]+){0,2}|outline|border(?:-[a-z]+){0,2}-width|outline-width)$/.test(prop) && !NOT_A_BORDER.test(prop)) || prop === 'text-decoration-thickness' || prop === 'stroke-width' || prop === 'column-rule' || prop === 'column-rule-width'
      if (widthy && !/^(?:border-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?-(?:color|style)|border-color|border-style|outline-color|outline-style|outline-offset)$/.test(prop)) {
        for (const tok of splitTop(v, ' ')) {
          if (/^(?:thin|medium|thick)$/.test(tok)) err(line, 'line', `"${tok}" as a line weight in "${prop}": use --bw, --bw-thin or --bw-heavy`)
          else if (/^-?\d*\.?\d+(?:px|rem|em)$/.test(tok) && parseFloat(tok) !== 0) err(line, 'line', `literal ${tok} in "${prop}": use --bw, --bw-thin, --bw-heavy or --ring`)
          else if (prop === 'stroke-width' && /^\d*\.?\d+$/.test(tok) && parseFloat(tok) !== 0) err(line, 'line', `literal stroke-width ${tok}: use var(--bw)`)
          else if (/^var\(\s*(--[\w-]+)/.test(tok)) {
            const nm = tok.match(/^var\(\s*(--[\w-]+)/)[1]
            // a width token: --bw*, --ring, or a component-private --_x. Anything named like a weight (--w, --thick …) is a third weight.
            if (!/^--(?:bw|bw-thin|bw-heavy|ring|_[\w-]*)$/.test(nm) && /(?:^--|-)(?:w|width|weight|thick|thickness|border-w|line-w)(?:-|$)/.test(nm)) err(line, 'line', `${nm} as a line weight in "${prop}": use --bw, --bw-thin, --bw-heavy or --ring`)
          }
        }
        for (const m of v.matchAll(/calc\([^)]*\)/g)) { if (/\d*\.?\d+(?:px|rem|em)\b/.test(m[0].replace(/var\([^)]*\)/g, '')) && !/var\(--(?:bw|ring)/.test(m[0])) err(line, 'line', `literal length in calc() for "${prop}"`) }
      }
      if (/^border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-?(?:start-start|start-end|end-start|end-end)?-?radius$|^border-(?:top|bottom)-(?:left|right)-radius$|^border-(?:start|end)-(?:start|end)-radius$|^border-radius$/.test(prop)) {
        for (const grp of splitTop(v, '/')) {
          for (const tok of splitTop(grp, ' ')) {
            if (RADIUS_ROLE.test(tok)) continue
            if (/^calc\(/.test(tok) && !/\d*\.?\d+(?:px|rem|em)\b/.test(tok.replace(/var\([^)]*\)/g, ''))) continue
            err(line, 'shape', `border-radius "${tok}": use --radius-card, -tile, -ctl or -pill (or 0)`)
          }
        }
      }
      if (prop === 'clip-path' && /round\s+[^)]*\d+(?:px|rem|em)/.test(v)) err(line, 'shape', 'clip-path round <length>: a fourth radius. Use the roles')
      if (/var\(\s*--radius-[123]\b/.test(v)) err(line, 'shape', 'read a radius ROLE (--radius-card, -tile, -ctl, -pill), not the --radius-1/2/3 primitives')
    }

    /* ---- layering: a component stands alone; primitives stay in the colour file ---- */
    if (isComponent && /\.wf-[\w-]+/.test(sel)) err(line, 'layer', 'a component must work without the wireframe kit (.wf-*)')
    if (!isToken && /var\(\s*--grey-\d+/.test(v)) err(line, 'layer', 'read a role, not a --grey-N primitive')

    /* ---- accessibility and robustness hygiene ---- */
    if (!isToken) {
      if ((prop === 'font-size' && FONT_PX.test(v) && !/var\(/.test(v)) || (prop === 'font' && FONT_PX.test(v))) err(line, 'a11y', `font size in px ("${v}"): use rem (--text-*) so it follows the reader's text size`)
      if (prop === 'line-height' && /^\d+(\.\d+)?px$/.test(v)) err(line, 'a11y', 'line-height in px: use a unitless value or --lh-*')
    }
    if (prop === 'font-size' && /^(?:html|:root)$/i.test(sel.split(' ').pop() ?? '') && !/^(?:100%|1rem|inherit|initial)$/.test(v) && !isToken) err(line, 'a11y', 'html font-size other than 100% overrides the reader\'s text size (WCAG 1.4.4)')
    if (prop === 'outline' && /^(?:none|0|0px)\b/.test(v) || prop === 'outline-style' && v === 'none' || prop === 'outline-width' && /^0/.test(v)) {
      const sameRule = decls.filter((o) => o !== d && o.stack.join('\u0000') === d.stack.join('\u0000'))
      const replaced = sameRule.some((o) => (o.prop === 'box-shadow' && !/^none$/.test(o.value)) || (o.prop === 'outline' && !/^(?:none|0|0px)\b/.test(o.value)) || /^outline-(?:width|style)$/.test(o.prop) && !/^(?:none|0)/.test(o.value)) // the same rule draws another indicator
      const ok = replaced || /:focus:not\(:focus-visible\)|\[tabindex="-1"\]|@supports selector\(:has|:where\(\[tabindex="-1"\]\)/.test(sel + ' ' + d.stack.join(' ')) || /forced-colors/.test(d.stack.join(' '))
      if (!ok) err(line, 'a11y', 'outline removed without a replacement (WCAG 2.4.7)')
    }
    if (/^transition(?:-property)?$/.test(prop) && /(?:^|[\s,])all\b/.test(v)) err(line, 'a11y', 'transition: all. List the properties')
    if (/!\s*important/i.test(value) && !/\[hidden\]|sr-only|display:\s*none/.test(sel + value)) warn(line, 'hygiene', '!important: avoid; layers already let apps override')
    if (prop === 'overflow' && /\bhidden\b/.test(v) && isComponent) warn(line, 'a11y', 'overflow: hidden clips focus rings: use overflow: clip and set --ring-gap')
    if (prop === 'opacity' && isComponent) { const n = parseFloat(v); if (!Number.isNaN(n) && n < 1 && !/disabled|aria-disabled|::|skeleton|is-disabled|\[hidden\]|@keyframes|spinner|marquee/.test(sel + d.stack.join(' '))) warn(line, 'a11y', 'opacity dims text and borders below their contrast: use a solid role') }
    if (prop === 'text-transform' && v === 'uppercase' && !isDocs && !/label|display|eyebrow|idx|kbd|caption|tag|badge|\bth\b|thead|\.t-|stat|count|skip/i.test(sel)) warn(line, 'rule-4', 'uppercase is structure (labels, index numbers, the display line): content is sentence case')
    if ((isComponent || kind === 'layout' || kind === 'base') && /^(?:margin|padding)-(?:left|right)$|^(?:left|right)$|^border-(?:left|right)(?:-[a-z]+)?$/.test(prop) && !/forced-colors/.test(d.stack.join(' '))) warn(line, 'rtl', `physical property "${prop}": prefer logical (margin-inline, inset-inline-start …)`)
    if (prop === 'text-align' && /^(?:left|right)$/.test(v) && isComponent) warn(line, 'rtl', `text-align: ${v}: prefer start / end`)
    if (isComponent && /^(?:width|height|min-width|min-height|max-width|max-height|inline-size|block-size|min-inline-size|min-block-size|max-inline-size|max-block-size|padding[\w-]*|margin[\w-]*|gap|inset[\w-]*)$/.test(prop)) {
      for (const m of v.matchAll(/(?<![\w.-])(\d*\.?\d+)px\b/g)) if (parseFloat(m[1]) > 2) warn(line, 'hygiene', `fixed ${m[1]}px in "${prop}": use rem / --space-* so it scales with text`)
    }
    if (isComponent && /^(?:inline-size|block-size|width|height|min-inline-size|min-block-size|min-width|min-height)$/.test(prop) && /button|\ba\b|\.btn|__ctl|__action|input|select|summary|\[role=/.test(sel) && !/::/.test(sel)) {
      const m = v.match(/^(\d*\.?\d+)(px|rem)$/)
      if (m && ((m[2] === 'px' && parseFloat(m[1]) < 44 && parseFloat(m[1]) > 0) || (m[2] === 'rem' && parseFloat(m[1]) < 2.75 && parseFloat(m[1]) > 0)) && !/^min-/.test(prop) === true) warn(line, 'a11y', `a ${v} control is under the 44px target (WCAG 2.5.5): draw it smaller only with a 44px hit area (::after)`)
    }
    if (isComponent && /:hover\b/.test(sel) && !inMedia(d, /hover:\s*hover/) && !inMedia(d, /forced-colors/)) warn(line, 'touch', ':hover outside @media (hover: hover): it sticks on touch screens')
    if (!isToken && d.stack.some((p) => /^@media/i.test(p) && /\((?:min|max)-width\s*:\s*\d+(?:\.\d+)?px\)/.test(p))) warn(line, 'a11y', 'px media query: use em so breakpoints follow the reader\'s text size')
    if (isComponent && prop === 'transition-duration' && /^0s$/.test(v)) { /* allowed: a reset */ }

    /* ---- the gate order: motion waits for gate 4 (open for this guide; a fork can close it) ---- */
    if (!gates.motion && (/^(?:transition|animation)(?:-[a-z-]+)?$/.test(prop) && !/^(?:none|0s)$/.test(v) || prop === 'scroll-behavior' && v === 'smooth' || prop === 'view-transition-name' || d.stack.some((p) => /^@keyframes/i.test(p)))) err(line, 'gate', `"${prop}": motion is gate 4, and it is not open`)

    /* ---- private tokens stay inside their file ---- */
    for (const m of value.matchAll(/var\(\s*(--_[\w-]+)/g)) if (!privDeclared.has(m[1]) && !isToken) err(line, 'tokens', `${m[1]} is component-private but is not declared in this file`)
  }

  // whole-file checks
  if (isComponent || kind === 'layout' || kind === 'base') if (!/@layer\s+sg\.[a-z]+/.test(plain) && !/@font-face/.test(plain)) err(1, 'layer', 'no @layer sg.* block')
  for (const m of plain.matchAll(/@media[^{]*\((?:min|max)-width\s*:\s*\d+(?:\.\d+)?px\)/g)) if (!isToken && !decls.length) warn(lineOf(plain, m.index), 'a11y', 'px media query: use em')
  return { errors, warnings }
}

/* ---------------------------------------------------------------------------- HTML */

export function checkHtml({ name, html, page = false }) {
  const errors = []
  const warnings = []
  const err = (line, rule, msg) => errors.push({ line, rule, msg })
  const warn = (line, rule, msg) => warnings.push({ line, rule, msg })
  const L = (i) => lineOf(html, i)
  if (page && !/^\s*<!--\s*\{/.test(html)) err(1, 'docs', 'missing page metadata comment on line 1')
  for (const m of html.matchAll(/tabindex\s*=\s*["']?([1-9]\d*)/g)) err(L(m.index), 'a11y', 'positive tabindex breaks natural order')
  for (const m of html.matchAll(/<(?:div|span)[^>]*role\s*=\s*["']?button/g)) err(L(m.index), 'a11y', 'use a real <button>, not role="button" on a div/span')
  for (const m of html.matchAll(/<img\b(?![^>]*\balt\s*=)[^>]*>/g)) err(L(m.index), 'a11y', '<img> without alt')
  for (const m of html.matchAll(/<meta[^>]*name\s*=\s*["']viewport["'][^>]*>/gi)) if (/user-scalable\s*=\s*(?:no|0)|maximum-scale\s*=\s*(?:1(?:\.0)?|2)(?![\d.])/i.test(m[0])) err(L(m.index), 'a11y', 'the viewport must not block zoom (WCAG 1.4.4): no user-scalable=no, no maximum-scale below 5')
  for (const m of html.matchAll(/<span class="ic [^"]*"(?![^>]*aria-hidden)[^>]*>/g)) err(L(m.index), 'a11y', 'icon <span class="ic"> without aria-hidden="true" (the control gets the aria-label)')
  for (const m of html.matchAll(/<svg\b[^>]*class="[^"]*\bicon\b[^"]*"(?![^>]*aria-hidden)[^>]*>/g)) err(L(m.index), 'a11y', 'icon <svg> without aria-hidden="true"')
  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const text = m[2].replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<span class="ic[^>]*><\/span>/g, '').replace(/<[^>]+>/g, '').trim()
    if (!text && !/aria-label(?:ledby)?\s*=/.test(m[1])) err(L(m.index), 'a11y', '<button> with no text and no aria-label')
  }
  for (const m of html.matchAll(/style\s*=\s*"([^"]*)"/g)) if (HEX.test(m[1]) || COLOUR_FN.test(m[1])) warn(L(m.index), 'colour', 'literal colour in an inline style: use a colour role')
  for (const m of html.matchAll(/\b(?:fill|stroke)\s*=\s*"#[0-9a-f]{3,8}"/gi)) warn(L(m.index), 'colour', 'literal colour in an SVG attribute: use currentColor or a role')
  for (const m of html.matchAll(/[✓✔✗✕→←↑↓▸▾•★☆]/g)) warn(L(m.index), 'icons', `text glyph "${m[0]}" is missing from the bundled font: use an icon`)
  // owner rule 5: say something real
  html.split('\n').forEach((ln, i) => {
    if (/\b(?:no|never|don.t use|not)\b[^.]*\blorem\b|Lorem ipsum.*(?:banned|fails)/i.test(ln)) return
    if (/lorem ipsum|dolor sit amet|john doe|jane doe|\bseamless(?:ly)?\b|\bleverage\b|\bsynerg/i.test(ln)) err(i + 1, 'rule-5', 'placeholder or marketing copy: say something real (decks, wallets, tasks, streaks)')
  })
  return { errors, warnings }
}

/* ---------------------------------------------------------------------------- cross-file checks */

/** Custom properties a stylesheet defines: real declarations and @property names, never selector fragments
 *  (the original checker counted `.card--link:is(` as defining `--link`). */
export function declaredIn(css) {
  const out = new Set()
  for (const d of tokenize(css)) {
    if (d.prop.startsWith('--')) out.add(d.prop)
    for (const p of d.stack) { const m = p.match(/^@property\s+(--[\w-]+)/); if (m) out.add(m[1]) }
  }
  return out
}

/** var(--x) with no definition and no fallback. `declared` is every custom property the project defines. */
export function undefinedTokens({ css, declared }) {
  const out = []
  const text = stripComments(css)
  for (const m of text.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)) {
    if (m[2] === ',') continue // has a fallback: an override hook
    if (!declared.has(m[1]) && !/^--_/.test(m[1])) out.push({ line: lineOf(text, m.index), rule: 'tokens', msg: `var(${m[1]}) is used but never declared` })
  }
  return out
}

const TONES = new Set(['1', '2', '3', '4', '5', '6', 'ink', 'ok', 'warn', 'bad', 'info'])

/** Class names (and data-tone values) used in markup or JS that no CSS defines. */
export function unknownClasses({ source, known }) {
  const out = []
  const push = (idx, c) => out.push({ line: lineOf(source, idx), rule: 'markup', msg: `class "${c}" has no CSS` })
  const add = (idx, str) => { for (const c of str.split(/\s+/).filter(Boolean)) if (!/[{$<>]|^\W|-$/.test(c) && !known.has(c)) push(idx, c) }
  for (const m of source.matchAll(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"'=`]+))/g)) { const v = m[1] ?? m[2] ?? m[3] ?? ''; if (/['+]/.test(v)) continue; add(m.index, v) }
  for (const m of source.matchAll(/classList\.(?:add|toggle|remove|replace)\(([^)]*)\)/g)) for (const s of m[1].matchAll(/['"`]([^'"`]+)['"`]/g)) add(m.index, s[1])
  for (const m of source.matchAll(/\bclassName\s*[+]?=\s*(['"`])([^'"`]*)\1/g)) add(m.index, m[2])
  for (const m of source.matchAll(/data-tone\s*=\s*["']([^"']*)["']/g)) if (!TONES.has(m[1]) && !/[{$]/.test(m[1])) out.push({ line: lineOf(source, m.index), rule: 'markup', msg: `data-tone="${m[1]}" is not a tone (1-6, ink, ok, warn, bad, info)` })
  return out
}
