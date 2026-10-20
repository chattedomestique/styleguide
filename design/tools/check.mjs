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
     5  motion                what may move (transform, opacity, the state numbers,
                              discrete display/overlay, and named exceptions), never
                              `all`; durations and easings from the tokens only; a
                              prefers-reduced-motion block wherever anything moves
     6  layering              components/ must not reach for .wf-* or --grey-*
     7  doc drift             tokens and classes named in the .md files that don't exist
     8  markup                classes used in the pages that no CSS defines, and ids that
                              clash once the bundle joins the pages into one
     9  contrast              the colour file's role pairs, against WCAG AA, in light
                              and dark (light-dark() resolved), each with more
                              contrast; the scrim; the fallback for engines
                              without light-dark()
    10  direction             components are written for both directions: no
                              physical left or right (margin, padding, border,
                              inset, radius corners, text-align, float, clear,
                              positions), no move along the line that ignores
                              it; a physical one on purpose says why on its line
    11  the contract          API.md (tools/api.mjs) is current with the code, and
                              the script API it lists is named in a spec

   Checks 2–5 cover sheet.css and screens.css too: the pages that teach the
   rules keep them. Check 5 also reads the PWA starter's own CSS (pwa/*.css).
   Check 10 reads every CSS file but the colour file (pwa/*.css included)
   and the style attributes in the pages.
   ========================================================================== */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { loadColours, contrast, luminance, toHex } from "./accent.mjs";
import { apiProblems } from "./api.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = join(ROOT, "css");

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
/* by path under css/, not by name: css/components/sheet.css is the Sheet element,
   shipped like any other, and only css/sheet.css is the pages' chrome */
const top = (name) => (p) => relative(CSS, p) === name;
const isSheet = top("sheet.css");
const isPage = (p) => isSheet(p) || top("screens.css")(p); // the pages' own CSS
const isWire = top("wire.css");
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

/* ---- 5 motion -----------------------------------------------------------------
   STYLE.md §2 Motion, as far as a machine can read it. In every CSS file:
   - a transition (the shorthand or transition-property) and a keyframe move
     only MOTION.may, or a named exception in the file (and selector) it names;
   - never `all`, and never a transition with no property, which means all;
   - durations, delays and easings only as var(--dur-*) and var(--ease-*),
     calc() over them included. No literal ms or s outside foundation.css (a
     literal zero is fine: no delay is not a duration), no cubic-bezier(),
     steps() or linear() function, no easing keyword. `linear` is allowed in
     an animation, where a constant rate is no curve: a continuous turn;
   - a moving transition names its easing, or CSS's own `ease` slips in;
   - a file that declares a transition, an animation or @keyframes has a
     @media (prefers-reduced-motion: reduce) block. */
const MOTION = {
  /* the compositor's two (transform with its longhands), the registered
     numbers every pressable element draws its states from, and the discrete
     pair an overlay exits with */
  may: ["transform", "translate", "rotate", "scale", "opacity", "--lift", "--fill", "display", "overlay"],
  /* switch at a point in time, so an easing means nothing to them */
  discrete: ["display", "overlay", "visibility", "content-visibility"],
  /* Named exceptions: each says why, and where. Add one only with a reason. */
  except: [
    {
      props: ["block-size", "height", "content-visibility"],
      file: /components[\\/]disclosure\.css$/,
      selector: /::details-content/,
      why: "Disclosure's body opens with interpolate-size: allow-keywords, a progressive extra; content-visibility is the discrete half that lets it close",
    },
    {
      props: ["visibility"],
      file: /components[\\/]card\.css$/,
      why: "the study card's flip: the face turned away leaves the accessibility tree and the Tab order, swapped discretely at the halfway point",
    },
  ],
};
{
  const problems = [];
  const stripStrings = (s) => s.replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, (m) => m.replace(/[^\n]/g, " "));
  /* every declaration, with the preludes of the blocks it sits in */
  function* declarations(s) {
    const stack = [];
    let start = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch !== "{" && ch !== ";" && ch !== "}") continue;
      const text = s.slice(start, i);
      if (ch === "{") stack.push(text.trim().replace(/\s+/g, " "));
      else {
        const m = /^\s*(--[\w-]+|-?[a-z][\w-]*)\s*:([\s\S]*)$/i.exec(text);
        if (m && stack.length) {
          yield { prop: m[1].toLowerCase(), value: m[2].trim(), index: start + text.search(/\S/), stack: [...stack] };
        }
        if (ch === "}") stack.pop();
      }
      start = i + 1;
    }
  }
  const EASE_WORDS = /^(ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end)$/i;
  const LIST = MOTION.may.join(", ");
  const allowed = (prop, p, selector) =>
    MOTION.may.includes(prop) ||
    MOTION.except.some((e) => e.props.includes(prop) && e.file.test(p) && (!e.selector || (selector !== null && e.selector.test(selector))));

  /* the starter's own CSS (pwa/app.css) is app CSS that moves too */
  const starterCss = readdirSync(join(ROOT, "pwa")).filter((n) => n.endsWith(".css")).map((n) => join(ROOT, "pwa", n));
  for (const p of [...cssFiles, ...starterCss]) {
    const s = stripStrings(stripUrls(files[p] ?? stripComments(read(p))));
    const at = (i) => `${rel(p)}:${lineOf(s, i)}`;
    const isFoundation = /tokens[\\/]foundation\.css$/.test(p);

    /* literals: durations and curves live in foundation.css */
    if (!isFoundation) {
      for (const m of s.matchAll(/(?<![\w.#-])(\d*\.?\d+)(ms|s)(?![\w-])/gi)) {
        if (+m[1] !== 0) problems.push(`${at(m.index)} literal "${m[0]}": durations come from var(--dur-*) in tokens/foundation.css`);
      }
      for (const m of s.matchAll(/\b(cubic-bezier|steps|linear)\(/gi)) {
        problems.push(`${at(m.index)} "${m[0]}": easings come from var(--ease-*) in tokens/foundation.css`);
      }
    }

    let moves = null; // the first transition, animation or @keyframes in the file
    const kf = s.search(/@(?:-webkit-)?keyframes\b/);
    if (kf >= 0) moves = { index: kf, what: "@keyframes" };

    for (const d of declarations(s)) {
      const { prop, value, index, stack } = d;
      const keyframes = stack.find((b) => /^@(-webkit-)?keyframes\b/.test(b));
      const selector = stack.filter((b) => !b.startsWith("@")).join(" ") || null;

      if (keyframes) {
        if (/^animation-(timing-function|composition)$/.test(prop)) {
          /* per-keyframe easing: checked below like any other */
        } else if (!allowed(prop, p, null)) {
          problems.push(`${at(index)} ${keyframes} animates "${prop}": only ${LIST} move, or a named exception (check.mjs)`);
          continue;
        }
      }
      /* the timing tokens are foundation.css's, so nobody can redefine one as a literal */
      if (/^--(dur|ease)-/.test(prop) && !isFoundation) {
        problems.push(`${at(index)} ${prop} is defined here: durations and easings are defined in tokens/foundation.css only`);
      }
      if (!/^(transition|animation)(-|$)/.test(prop)) continue;
      if (!moves || index < moves.index) moves = { index, what: prop };

      /* nothing loops: WCAG 2.2.2, anything moving by itself past 5 s needs a way to stop it */
      if (/^animation(-iteration-count)?$/.test(prop) && /\binfinite\b/.test(value)) {
        problems.push(`${at(index)} ${prop}: infinite: nothing loops; give it a count that ends within five seconds (WCAG 2.2.2)`);
      }

      /* tokens only */
      for (const v of value.matchAll(/var\(\s*(--[\w-]+)/g)) {
        if (!/^--(dur|ease)-/.test(v[1])) problems.push(`${at(index)} ${prop} reads var(${v[1]}): durations and easings come from --dur-* and --ease-* only`);
      }
      const items = splitTop(value, ",");
      if (/^(transition|animation)(-timing-function)?$/.test(prop)) {
        for (const item of items) {
          for (const t of splitTop(item, " ")) {
            if (EASE_WORDS.test(t) && !(prop.startsWith("animation") && t.toLowerCase() === "linear")) {
              problems.push(`${at(index)} easing "${t}" in ${prop}: use var(--ease-*)${prop.startsWith("transition") ? "" : " (or linear, for a continuous turn)"}`);
            }
          }
        }
      }

      /* what moves */
      if (prop === "transition-property") {
        for (const name of items) {
          if (name === "all") problems.push(`${at(index)} transition-property: all: name what moves (${LIST})`);
          else if (name !== "none" && !allowed(name, p, selector)) {
            problems.push(`${at(index)} "${name}" can't move: only ${LIST}, or a named exception (check.mjs)`);
          }
        }
      }
      if (prop === "transition") {
        for (const item of items) {
          const parts = splitTop(item, " ");
          if (parts.length === 1 && parts[0] === "none") continue;
          const names = parts.filter(
            (t) =>
              !/^(var|calc)\(/.test(t) &&
              !/^-?\d*\.?\d+m?s$/i.test(t) &&
              !EASE_WORDS.test(t) &&
              !/^(cubic-bezier|steps|linear)\(/i.test(t) &&
              !/^(allow-discrete|normal)$/.test(t),
          );
          if (!names.length) {
            problems.push(`${at(index)} "transition: ${item}" names no property, so it moves all: name what moves`);
            continue;
          }
          for (const name of names) {
            if (name === "all") problems.push(`${at(index)} transition: all: name what moves (${LIST})`);
            else if (!allowed(name, p, selector)) {
              problems.push(`${at(index)} "${name}" can't move: only ${LIST}, or a named exception (check.mjs)`);
            } else if (!MOTION.discrete.includes(name) && !parts.some((t) => /^var\(\s*--ease-/.test(t))) {
              problems.push(`${at(index)} "${name}" moves with no easing: name a var(--ease-*), or CSS's own ease slips in`);
            }
          }
        }
      }
    }

    if (moves && !/@media[^{]*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/.test(s)) {
      problems.push(`${at(moves.index)} "${moves.what}" moves things, but ${basename(p)} has no @media (prefers-reduced-motion: reduce) block`);
    }
  }
  check("motion follows the rules", [...new Set(problems)]);
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

/* ---- 10 direction: begins ------------------------------------------------------
   Wave 8, right to left. Self-contained: from the rest of this file it reads
   only readdirSync and join (imports), ROOT, cssFiles, files, isColourFile,
   pages, rel, read, stripComments, lineOf and check(). Ends at
   "10 direction: ends".

   Components are written for both directions (STYLE.md §2). In every CSS
   file but tokens/color.css (the starter's pwa/*.css included), and in the
   pages' style attributes, a declaration fails when it is physical along
   the line:
   - margin-, padding-, scroll-margin- and scroll-padding-left and -right;
     border-left and -right and their -width, -style and -color; left and
     right as properties; the border-top-left- (and the other three corner)
     -radius longhands;
   - text-align(-last), float and clear, and justify-content, -items and
     -self, set to left or right;
   - background-, mask- and object-position, transform-origin and
     perspective-origin (and the background and mask shorthands), and
     position-area and anchor(), naming left or right;
   - a four-value margin, padding, inset, scroll-margin, scroll-padding or
     border-width, -style or -color whose right and left differ;
   - a move along the line that ignores the direction: translate with a
     non-zero x, translateX(), translate() or translate3d() with a non-zero
     x, or rotateY() or rotate: y, with no var() to carry the sign, outside
     a :dir() rule.
   A declaration that is physical on purpose (a safe area is an edge of the
   screen, not of the line) opts out with a comment at the end of its line
   that starts "physical:" and says why. An opt-out with no reason, or on a
   line with nothing physical, fails too, so none goes stale. */
{
  const problems = [];
  const OPT_OUT = /\/\*\s*physical:([^*]*)\*\//;
  const SIDE = /\b(left|right)\b/i;
  const blank = (s, re) => s.replace(re, (m) => m.replace(/[^\n]/g, " "));
  const words = (v) => {
    const out = [];
    let depth = 0, cur = "";
    for (const ch of v) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (depth === 0 && /\s/.test(ch)) { if (cur) out.push(cur); cur = ""; } else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
  };
  const zero = (t) => /^[-+]?0*\.?0*([a-z%]+)?$/i.test(t) && !/[1-9]/.test(t);
  const signed = (t) => /var\(/.test(t);
  const inline = (side) => (side === "left" ? "start" : "end");

  /* what is physical about one declaration, or null */
  function physical(prop, value, inDir) {
    let m;
    const v = value.trim();
    if ((m = /^(margin|padding|scroll-margin|scroll-padding|border)-(left|right)(-(?:width|style|color))?$/.exec(prop)))
      return `${prop}: use ${m[1]}-inline-${inline(m[2])}${m[3] || ""}`;
    if ((m = /^border-(top|bottom)-(left|right)-radius$/.exec(prop)))
      return `${prop}: use border-${m[1] === "top" ? "start" : "end"}-${inline(m[2])}-radius`;
    if (prop === "left" || prop === "right") return `${prop}: use inset-inline-${inline(prop)}`;
    if (/^(text-align(-last)?|justify-(content|items|self))$/.test(prop) && SIDE.test(v)) return `${prop}: ${v}: use start or end`;
    if (/^(float|clear)$/.test(prop) && SIDE.test(v)) return `${prop}: ${v}: use inline-start or inline-end`;
    if (/^((-webkit-)?mask|background)(-position(-x)?)?$|^(object-position|transform-origin|perspective-origin|position-area|inset-area)$/.test(prop) && SIDE.test(v))
      return `${prop} names left or right: use the start or end form, or a direction-aware value`;
    if (/\banchor\([^)]*\b(left|right)\b/.test(v)) return `anchor() names left or right: use start or end`;
    if (/^(margin|padding|inset|scroll-margin|scroll-padding|border-width|border-style|border-color)$/.test(prop)) {
      const t = words(v);
      if (t.length === 4 && t[1] !== t[3]) return `${prop}: ${v}: its right and left differ: use the -block and -inline forms`;
    }
    if (!inDir) {
      if (prop === "translate") {
        const x = words(v)[0];
        if (x && x !== "none" && !zero(x) && !signed(x)) return `translate: ${v} moves along the line whatever the direction: carry the sign in a var() set under :dir(rtl)`;
      }
      if (prop === "rotate") {
        const t = words(v);
        if (t[0] === "y" && t[1] && !zero(t[1]) && !signed(t[1])) return `rotate: ${v} turns along the line whatever the direction: carry the sign in a var() set under :dir(rtl)`;
      }
      for (const f of v.matchAll(/\b(translateX|translate3d|translate|rotateY)\(((?:[^()]|\([^()]*\))*)\)/g)) {
        const x = f[2].split(",")[0].trim();
        if (x && !zero(x) && !signed(x)) return `${f[1]}(${f[2]}) moves along the line whatever the direction: carry the sign in a var() set under :dir(rtl)`;
      }
    }
    return null;
  }

  /* one file or attribute's verdicts: an opt-out needs a reason and a use */
  function judge(where, lines, found) {
    const used = new Set();
    for (const { line, endLine, prop, msg } of found) {
      const hit = [line, endLine].map((n) => ({ n, m: OPT_OUT.exec(lines[n - 1] || "") })).find((o) => o.m);
      if (!hit) { problems.push(`${where}:${line} ${msg} (physical on purpose? end the line with /* physical: why */)`); continue; }
      used.add(hit.n);
      if (!hit.m[1].trim()) problems.push(`${where}:${hit.n} ${prop} opts out with no reason: say why it is physical`);
    }
    lines.forEach((l, i) => {
      if (OPT_OUT.test(l) && !used.has(i + 1)) problems.push(`${where}:${i + 1} a "physical:" opt-out on a line with nothing physical`);
    });
  }

  /* every declaration in a stylesheet, with the blocks it sits in */
  function* declarations(s) {
    const stack = [];
    let start = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch !== "{" && ch !== ";" && ch !== "}") continue;
      const text = s.slice(start, i);
      if (ch === "{") stack.push(text.trim().replace(/\s+/g, " "));
      else {
        const m = /^\s*(--[\w-]+|-?[a-z][\w-]*)\s*:([\s\S]*)$/i.exec(text);
        if (m && stack.length) yield { prop: m[1].toLowerCase(), value: m[2], index: start + text.search(/\S/), end: i, stack: [...stack] };
        if (ch === "}") stack.pop();
      }
      start = i + 1;
    }
  }

  const starter = readdirSync(join(ROOT, "pwa")).filter((n) => n.endsWith(".css")).map((n) => join(ROOT, "pwa", n));
  for (const p of [...cssFiles.filter((f) => !isColourFile(f)), ...starter]) {
    const raw = read(p);
    const s = blank(blank(files[p] ?? stripComments(raw), /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g), /url\([^)]*\)/g);
    const found = [];
    for (const d of declarations(s)) {
      const msg = physical(d.prop, d.value, d.stack.some((b) => b.includes(":dir(")));
      if (msg) found.push({ line: lineOf(s, d.index), endLine: lineOf(s, d.end), prop: d.prop, msg });
    }
    judge(rel(p), raw.split("\n"), found);
  }
  for (const [name, page] of Object.entries(pages)) {
    const found = [];
    for (const a of page.matchAll(/\sstyle="([^"]*)"/g)) {
      const base = a.index + a[0].indexOf('"') + 1;
      let at = 0;
      for (const decl of stripComments(a[1]).split(";")) {
        const m = /^\s*(--[\w-]+|-?[a-z][\w-]*)\s*:([\s\S]*)$/i.exec(decl);
        if (m) {
          const msg = physical(m[1].toLowerCase(), m[2], false);
          const i = base + at + decl.search(/\S/);
          if (msg) found.push({ line: lineOf(page, i), endLine: lineOf(page, base + at + decl.length), prop: m[1], msg });
        }
        at += decl.length + 1;
      }
    }
    judge(name, page.split("\n"), found);
  }
  check("components are written for both directions", [...new Set(problems)]);
}
/* ---- 10 direction: ends ---------------------------------------------------- */

/* ---- 11 the contract ------------------------------------------------------
   API.md, generated by tools/api.mjs, is current with the code, and the script
   API it lists (globals, events, data attributes, the meta) is named in a spec. */
check("API.md lists the public API, current with the code", apiProblems());

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
