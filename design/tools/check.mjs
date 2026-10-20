#!/usr/bin/env node
/* ==========================================================================
   check.mjs — the gate. Zero dependencies.

     node design/tools/check.mjs

   Fails (exit 1) on the things a machine can catch. The rest is the squint
   test in STYLE.md.

     1  undefined tokens      var(--x) with no definition and no fallback
     2  colour literals       hex / rgb() / hsl() / oklch()... outside tokens/color*.css
     3  the AI tells          gradients, blur, blurred shadows, text-shadow, default fonts
     4  the line and shape    literal border widths, radii outside the three roles
     5  the gate order        transitions and keyframes before gate 4 opens
     6  layering              components/ must not reach for .wf-* or --grey-*
     7  doc drift             tokens and classes named in the .md files that don't exist
     8  markup                classes used in the pages that no CSS defines, and ids that
                              clash once the bundle joins the pages into one
     9  contrast              the colour file's role pairs, against WCAG AA, in light
                              and dark (light-dark() resolved), each with more
                              contrast; the scrim; the fallback for engines
                              without light-dark()

   Checks 2–5 cover sheet.css and screens.css too: the pages that teach the
   rules keep them.
   ========================================================================== */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { loadColours, contrast, luminance, toHex } from "./accent.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = join(ROOT, "css");

/* Flip a gate to true when it opens. Motion opens at gate 4. */
const GATES = { motion: false };

/* ---- files ----------------------------------------------------------------- */

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const rel = (p) => relative(ROOT, p);
const read = (p) => readFileSync(p, "utf8");
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
const stripUrls = (s) => s.replace(/url\([^)]*\)/g, "url()");
const lineOf = (s, i) => s.slice(0, i).split("\n").length;

const cssFiles = walk(CSS).filter((p) => p.endsWith(".css"));
const isColourFile = (p) => /tokens[\\/]color[^\\/]*\.css$/.test(p);
const isSheet = (p) => basename(p) === "sheet.css";
const isPage = (p) => isSheet(p) || basename(p) === "screens.css"; // the pages' own CSS
const isWire = (p) => basename(p) === "wire.css";
const isComponent = (p) => /components[\\/]/.test(p);
const shipped = cssFiles.filter((p) => !isSheet(p)); // what an app links: check 6 only

const files = Object.fromEntries(cssFiles.map((p) => [p, stripComments(read(p))]));
/* the pages: the hub, the test bed, one page per element (_name.html is a
   template) and the PWA starter's screens */
const ELEMENTS = join(ROOT, "elements");
const elementFiles = (ext) =>
  readdirSync(ELEMENTS).filter((n) => n.endsWith(ext) && !n.startsWith("_") && n !== "README.md").sort();
const STARTER = ["pwa/index.html", "pwa/decks.html", "pwa/settings.html", "pwa/offline.html"];
const PAGES = ["index.html", "screens.html", ...elementFiles(".html").map((n) => `elements/${n}`), ...STARTER];
const pages = Object.fromEntries(PAGES.map((n) => [n, read(join(ROOT, n))]));
const html = Object.values(pages).join("\n");

/* ---- results --------------------------------------------------------------- */

const results = [];
function check(name, problems, note = "") {
  results.push({ name, problems, note });
}

/* ---- definitions ------------------------------------------------------------ */

const defined = new Set();
const hooks = new Set(); // used as var(--x, fallback): an override hook, not a bug
for (const [p, s] of Object.entries(files)) {
  for (const m of s.matchAll(/(--[a-z0-9-]+)\s*:/gi)) defined.add(m[1]);
  for (const m of s.matchAll(/@property\s+(--[a-z0-9-]+)/gi)) defined.add(m[1]);
  for (const m of s.matchAll(/var\(\s*(--[a-z0-9-]+)\s*,/gi)) hooks.add(m[1]);
}
/* custom properties set inline in the sheet's own markup */
for (const m of html.matchAll(/style="([^"]*)"/g)) {
  for (const d of m[1].matchAll(/(--[a-z0-9-]+)\s*:/gi)) defined.add(d[1]);
}
const known = new Set([...defined, ...hooks]);

/* ---- 1 undefined tokens ------------------------------------------------------ */
{
  const problems = [];
  for (const [p, s] of Object.entries(files)) {
    for (const m of s.matchAll(/var\(\s*(--[a-z0-9-]+)\s*\)/gi)) {
      if (!known.has(m[1])) problems.push(`${rel(p)}:${lineOf(s, m.index)} ${m[1]} is not defined`);
    }
  }
  check("undefined tokens", problems);
}

/* ---- 2 colour literals ------------------------------------------------------- */
{
  const problems = [];
  const re = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/gi;
  for (const p of cssFiles) {
    if (isColourFile(p)) continue;
    const s = stripUrls(files[p]);
    for (const m of s.matchAll(re)) {
      problems.push(`${rel(p)}:${lineOf(s, m.index)} colour literal "${m[0]}": read a role instead`);
    }
  }
  check("colour literals outside tokens/color*.css", problems);
}

/* ---- 3 the AI tells ---------------------------------------------------------- */
function splitTop(s, sep) {
  const out = [];
  let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth === 0 && (sep === "," ? ch === "," : /\s/.test(ch))) {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
{
  const problems = [];
  const BAD_FONTS = /^(inter|roboto|open sans|lato|poppins|space grotesk|dm sans|plus jakarta sans|manrope|montserrat|geist|system-ui|ui-sans-serif|arial|helvetica(?: neue)?)$/i;
  for (const p of cssFiles) {
    const s = stripUrls(files[p]);
    const at = (i) => `${rel(p)}:${lineOf(s, i)}`;

    for (const m of s.matchAll(/\b(?:repeating-)?(?:linear|radial|conic)-gradient\(/g)) {
      if (!isWire(p)) problems.push(`${at(m.index)} gradient outside wire.css`);
    }
    for (const m of s.matchAll(/backdrop-filter|\bblur\(|text-shadow/g)) {
      problems.push(`${at(m.index)} "${m[0]}" is banned (flat, no glass, no glow)`);
    }
    for (const m of s.matchAll(/(box-shadow|--shadow-[a-z-]+)\s*:\s*([^;]+);/g)) {
      for (const shadow of splitTop(m[2], ",")) {
        const t = splitTop(shadow, " ").filter((x) => x !== "inset");
        if (t.length >= 4 && !/^0(px)?$/.test(t[2])) {
          problems.push(`${at(m.index)} shadow with blur "${t[2]}": shadows are hard-edged`);
        }
      }
    }
    for (const m of s.matchAll(/--font-sans\s*:\s*([^;]+);/g)) {
      const first = splitTop(m[1], ",")[0].replace(/["']/g, "").trim();
      if (BAD_FONTS.test(first)) problems.push(`${at(m.index)} "${first}" as the first family is a default, not a choice`);
    }
    if (basename(p) !== "fonts.css") {
      for (const m of s.matchAll(/(?<![@\w-])font-family\s*:\s*([^;]+);/g)) {
        if (!/^var\(/.test(m[1].trim())) problems.push(`${at(m.index)} font-family must come from a token`);
      }
    }
  }
  check("AI tells: gradients, blur, glow, default fonts", problems);
}

/* ---- 4 line and shape -------------------------------------------------------- */
{
  const problems = [];
  const ROLES = /^(0|inherit|var\(--radius-(card|tile|ctl|pill)\)|var\(--card-radius\))$/;
  for (const p of cssFiles) {
    if (p.includes(`tokens${"/"}`) || p.includes(`tokens\\`)) continue;
    const s = files[p];
    const at = (i) => `${rel(p)}:${lineOf(s, i)}`;
    for (const m of s.matchAll(/\b(border(?!-radius)[\w-]*|outline|outline-width)\s*:\s*([^;]+);/g)) {
      const v = stripUrls(m[2]);
      for (const w of v.matchAll(/(?<![\w.-])(\d*\.?\d+)px\b/g)) {
        if (+w[1] !== 0) problems.push(`${at(m.index)} literal ${w[0]} in ${m[1]}: use --bw, --bw-thin, --bw-heavy or --ring`);
      }
    }
    if (isComponent(p) || isWire(p) || isPage(p)) {
      for (const m of s.matchAll(/(?<![\w-])border-radius\s*:\s*([^;]+);/g)) {
        if (!ROLES.test(m[1].trim())) problems.push(`${at(m.index)} border-radius "${m[1].trim()}": use --radius-card, -tile, -ctl or -pill`);
      }
    }
  }
  check("line weights and radii come from tokens", problems);
}

/* ---- 5 the gate order -------------------------------------------------------- */
{
  const problems = [];
  if (!GATES.motion) {
    for (const p of cssFiles) {
      if (!isComponent(p) && !isWire(p) && !isPage(p)) continue;
      const s = files[p];
      for (const m of s.matchAll(/(?<![\w-])(transition|animation)(-[a-z-]+)?\s*:|@keyframes/g)) {
        problems.push(`${rel(p)}:${lineOf(s, m.index)} "${m[0].replace(/\s*:$/, "")}": motion is gate 4, and it isn't open`);
      }
    }
  }
  check("motion waits for gate 4", problems, GATES.motion ? "gate 4 is open" : "");
}

/* ---- 6 layering -------------------------------------------------------------- */
{
  const problems = [];
  for (const p of shipped) {
    const s = files[p];
    const at = (i) => `${rel(p)}:${lineOf(s, i)}`;
    if (isComponent(p)) {
      for (const m of s.matchAll(/\.wf-[\w-]+/g)) problems.push(`${at(m.index)} ${m[0]}: a component must work without the wireframe kit`);
    }
    if (!isColourFile(p)) {
      for (const m of s.matchAll(/var\(\s*--grey-\d+/g)) problems.push(`${at(m.index)} ${m[0]}): read a role, not a primitive`);
    }
  }
  check("components stand alone, primitives stay in the colour file", problems);
}

/* ---- 7 doc drift ------------------------------------------------------------- */
const classes = new Set();
for (const s of Object.values(files)) {
  for (const m of stripUrls(s).matchAll(/\.([a-z][\w-]*)/gi)) classes.add(m[1]);
}
{
  const problems = [];
  /* elements/README.md is the roadmap: it names elements that don't exist yet */
  for (const name of ["STYLE.md", "README.md", ...elementFiles(".md").map((n) => `elements/${n}`)]) {
    const md = read(join(ROOT, name));
    const code = [...md.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
    for (const c of code) {
      if (/^--[a-z0-9-]+$/.test(c) && !known.has(c)) problems.push(`${name}: token \`${c}\` is not in the CSS`);
      const cls = c.match(/^\.([a-z][\w-]*)$/i);
      if (cls && !classes.has(cls[1])) problems.push(`${name}: class \`${c}\` is not in the CSS`);
    }
  }
  check("the .md files name only real tokens and classes", [...new Set(problems)]);
}

/* ---- 8 markup ---------------------------------------------------------------- */
{
  const problems = [];
  for (const [name, page] of Object.entries(pages)) {
    for (const m of page.matchAll(/class="([^"]*)"/g)) {
      for (const c of m[1].split(/\s+/).filter(Boolean)) {
        if (!classes.has(c)) problems.push(`${name}:${lineOf(page, m.index)} class "${c}" has no CSS`);
      }
    }
  }
  /* bundle.mjs joins the hub and every element page into one: ids must not clash */
  const seen = new Map();
  for (const [name, page] of Object.entries(pages)) {
    if (name === "screens.html") continue;
    for (const m of page.matchAll(/\sid="([^"]+)"/g)) {
      if (seen.has(m[1])) problems.push(`${name}:${lineOf(page, m.index)} id "${m[1]}" is also in ${seen.get(m[1])}: prefix it with the element's name`);
      else seen.set(m[1], name);
    }
  }
  check("every class in the pages is defined, no id clashes", [...new Set(problems)]);
}

/* ---- 9 contrast --------------------------------------------------------------
   The colour file is read by accent.mjs's resolver (the accent guard reads it
   the same way): var() substituted, light-dark() picked per scheme, and every
   pair run in light, dark, and both with more contrast. */
{
  const problems = [];
  let colours;
  try {
    colours = loadColours(ROOT);
  } catch (e) {
    problems.push(e.message);
  }
  const get = (env, name, label) => {
    try {
      return env.get(name);
    } catch (e) {
      problems.push(`${label}: ${e.message}`);
      return null;
    }
  };
  if (colours) {
    for (const env of colours.schemes) {
      const at = env.label;
      const rgb = (name) => {
        const c = get(env, name, at);
        if (c && c.alpha < 1) { problems.push(`${at}: ${name} is translucent; only --scrim may be`); return null; }
        return c && c.rgb;
      };
      const pair = (fg, bg, min, what) => {
        const f = Array.isArray(fg) ? fg : rgb(fg);
        const b = Array.isArray(bg) ? bg : rgb(bg);
        if (!f || !b) return;
        const r = contrast(f, b);
        if (r < min) problems.push(`${at}: ${what}: ${r.toFixed(2)}:1, needs ${min}:1`);
      };
      pair("--ink", "--paper", 7, "ink on paper");
      pair("--ink", "--canvas", 7, "ink on canvas");
      pair("--ink-soft", "--paper", 4.5, "ink-soft on paper");
      pair("--ink-soft", "--canvas", 4.5, "ink-soft on canvas");
      pair("--ink-faint", "--paper", 3, "ink-faint on paper (disabled, 3:1)");
      pair("--ink-faint", "--canvas", 3, "ink-faint on canvas (disabled, 3:1)");
      pair("--paper", "--ink", 7, "paper on ink (inverted tone)");
      pair("--on-accent", "--accent", 4.5, "on-accent on accent");
      pair("--accent", "--paper", 3, "accent as a fill on paper (3:1)");
      pair("--accent", "--canvas", 3, "accent as a fill on canvas (3:1)");
      pair("--focus", "--canvas", 3, "focus ring on canvas (3:1)");
      pair("--focus", "--paper", 3, "focus ring on paper (3:1)");
      pair("--line", "--canvas", 3, "frame line on canvas (3:1)");
      pair("--line", "--paper", 3, "frame line on paper (3:1)");
      const paper = rgb("--paper");
      let last = 1;
      for (let n = 1; n <= 6; n++) {
        const bg = rgb(`--tone-${n}`);
        const fg = rgb(`--on-tone-${n}`);
        pair(fg, bg, 4.5, `on-tone-${n} on tone-${n}`);
        if (fg && bg) pair(fg.map((v, i) => v * 0.72 + bg[i] * 0.28), bg, 4.5, `soft text (72% mix) on tone-${n}`);
        /* the same order of strength in every scheme: 1 the quietest */
        if (bg && paper) {
          const r = contrast(bg, paper);
          if (r <= last) problems.push(`${at}: tone-${n} is no further from paper than tone-${n - 1} (${r.toFixed(2)}:1): 1 is the quietest, 6 the strongest`);
          last = r;
        }
      }
      /* the scrim: near-black at 60% in every scheme, never built on ink */
      const scrim = get(env, "--scrim", at);
      if (scrim) {
        if (scrim.refs.has("--ink")) problems.push(`${at}: --scrim is built on --ink; it must come from a near-black primitive, or it lightens the page in dark`);
        if (Math.abs(scrim.alpha - 0.6) > 0.005) problems.push(`${at}: --scrim is ${Math.round(scrim.alpha * 100)}% opaque; it is a flat layer at 60%`);
        if (luminance(scrim.rgb) > 0.02) problems.push(`${at}: --scrim is not near-black (${toHex(scrim.rgb)})`);
      }
    }
    /* an engine without light-dark() must get the light page, role for role */
    const legacy = colours.env("light", false, false);
    const light = colours.schemes[0];
    for (const name of Object.keys(light.decls).filter((n) => !/^--grey-/.test(n))) {
      const a = get(legacy, name, "without light-dark()");
      let b;
      try { b = light.get(name); } catch { continue; }
      if (a && toHex(a.rgb) !== toHex(b.rgb)) problems.push(`without light-dark(): ${name} is ${toHex(a.rgb)}, but the light scheme says ${toHex(b.rgb)}`);
    }
  }
  check("contrast, in light and dark, with and without more contrast", [...new Set(problems)], colours ? colours.rel : "");
}

/* ---- report ------------------------------------------------------------------ */
let failed = 0;
for (const r of results) {
  const ok = r.problems.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "  ok  " : " FAIL "} ${r.name}${r.note ? `  (${r.note})` : ""}`);
  for (const p of r.problems.slice(0, 12)) console.log(`        ${p}`);
  if (r.problems.length > 12) console.log(`        … and ${r.problems.length - 12} more`);
}
console.log(failed ? `\n${failed} of ${results.length} checks failed.` : `\nAll ${results.length} checks pass.`);
process.exit(failed ? 1 : 0);
