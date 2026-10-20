#!/usr/bin/env node
/* ==========================================================================
   accent.mjs — the accent guard. Zero dependencies.

     node design/tools/accent.mjs "#c2410c"             a light accent: proposes a dark one
     node design/tools/accent.mjs "#c2410c" "#fb923c"   both: checks both
     node design/tools/accent.mjs "oklch(0.55 0.19 41)"  hex or oklch()

   An app sets one accent: the fill of the primary Button and the card's
   action, nothing else. This checks it in light and dark, and in both with
   more contrast, against the role values in the colour file itself (read
   through css/flashcards.css, never copied):

     · as a fill, 3:1 against paper and against canvas (what's around it);
     · its text, --on-accent, 4.5:1: paper or ink, whichever passes better.

   Given only a light accent, it proposes a dark one by moving the accent's
   OKLCH lightness (lighter first, as dark mode wants) until every pair
   passes, with chroma pulled in where the colour would leave sRGB. Then it
   prints the block to paste into the app's CSS. If the accent can't pass it
   says why, suggests the nearest lightness that would, and exits 1.

   The colour-file reader below is shared: check.mjs (check 9) and bundle.mjs
   (the PWA's theme colours) import it, so the roles are parsed in one place.
   ========================================================================== */

import { readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ---- colour maths ------------------------------------------------------------ */

const toLinear = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const fromLinear = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** WCAG 2.x relative luminance of [r, g, b] in 0–255 */
export const luminance = (rgb) => rgb.map(toLinear).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
/** WCAG 2.x contrast ratio */
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
export const round8 = (rgb) => rgb.map((v) => Math.min(255, Math.max(0, Math.round(v))));
export const toHex = (rgb) => "#" + round8(rgb).map((v) => v.toString(16).padStart(2, "0")).join("");

/** OKLCH [L 0–1, C, h°] to linear sRGB (may fall outside 0–1) */
function oklchToLinear([L, C, h]) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
const inGamut = (lin) => lin.every((c) => c >= -1e-4 && c <= 1 + 1e-4);

/** OKLCH to sRGB 0–255; chroma is pulled in until the colour fits sRGB */
export function fromOklch([L, C, h]) {
  L = Math.min(1, Math.max(0, L));
  let lin = oklchToLinear([L, C, h]);
  if (!inGamut(lin)) {
    let lo = 0, hi = C;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear([L, mid, h]))) lo = mid; else hi = mid;
    }
    lin = oklchToLinear([L, lo, h]);
  }
  return lin.map((c) => fromLinear(Math.min(1, Math.max(0, c))));
}

/** sRGB 0–255 to OKLCH [L 0–1, C, h°] */
export function toOklch(rgb) {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  return [L, C, C < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}
export const oklchText = ([L, C, h]) => `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(1)})`;

/** split at top-level commas (or whitespace), ignoring those inside ( ) */
export function splitTop(s, sep = ",") {
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

/** a literal colour: hex, rgb() or oklch(). Returns [r, g, b] 0–255, or null. */
export function parseColour(v) {
  v = v.trim();
  let m;
  if ((m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i))) {
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  if ((m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/][^)]*)?\)$/i))) return [+m[1], +m[2], +m[3]];
  if ((m = v.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)(%?)\s+([\d.]+)(?:deg)?\s*(?:\/[^)]*)?\)$/i))) {
    const L = +m[1] / (m[2] ? 100 : 1), C = m[4] ? (+m[3] / 100) * 0.4 : +m[3];
    return fromOklch([L, C, +m[5]]);
  }
  return null;
}

/* ---- the colour file ----------------------------------------------------------- */

/** a tiny CSS tree: { prelude, body } for blocks, { prop, value } for declarations */
export function parseCSS(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0;
  const add = (out, s) => {
    const m = s.match(/^\s*(--[\w-]+|[a-z-]+)\s*:\s*([\s\S]+?)\s*$/i);
    if (m) out.push({ prop: m[1], value: m[2] });
  };
  const block = () => {
    const out = [];
    let buf = "";
    while (i < css.length) {
      const c = css[i++];
      if (c === "{") { out.push({ prelude: buf.trim(), body: block() }); buf = ""; }
      else if (c === "}") break;
      else if (c === ";") { add(out, buf); buf = ""; }
      else buf += c;
    }
    add(out, buf);
    return out;
  };
  return block();
}

/** the custom properties :root ends up with, for one environment:
    { scheme: "light" | "dark", more: bool (prefers-contrast: more),
      lightDark: bool (does the engine know light-dark()?) } */
export function declarations(tree, env) {
  const supports = (p) => {
    const cond = /light-dark\(/.test(p) ? env.lightDark : true;
    return /^@supports\s+not\b/.test(p) ? !cond : cond;
  };
  const media = (p) => {
    const features = [...p.matchAll(/\(\s*([a-z-]+)\s*(?::\s*([a-z-]+))?\s*\)/g)];
    return features.length > 0 && features.every(([, f, v]) => {
      if (f === "prefers-contrast") return env.more ? v === "more" : false;
      if (f === "prefers-color-scheme") return v === env.scheme;
      return false; // forced-colors, print… : not a colour-role environment
    });
  };
  const out = {};
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.prop) continue;
      const p = n.prelude;
      if (p.startsWith("@supports")) { if (supports(p)) walk(n.body); }
      else if (p.startsWith("@media")) { if (media(p)) walk(n.body); }
      else if (!p.startsWith("@") && p.split(",").map((s) => s.trim()).includes(":root")) {
        for (const d of n.body) if (d.prop && d.prop.startsWith("--")) out[d.prop] = d.value;
      }
    }
  };
  walk(tree);
  return out;
}

/** a role's colour in one scheme: var() substituted, light-dark() picked,
    color-mix(in srgb, …) mixed. Returns { rgb, alpha, refs } or throws. */
export function resolveRole(decls, name, scheme, lightDark = true) {
  const refs = new Set();
  const substitute = (v, depth) => {
    if (depth > 16) throw new Error(`${name}: var() goes too deep`);
    let out = "", i = 0;
    while (i < v.length) {
      const at = v.indexOf("var(", i);
      if (at < 0) { out += v.slice(i); break; }
      out += v.slice(i, at);
      let d = 0, j = at + 3;
      for (; j < v.length; j++) { if (v[j] === "(") d++; else if (v[j] === ")" && --d === 0) break; }
      const [ref, fallback] = splitTop(v.slice(at + 4, j));
      if (decls[ref] !== undefined) { refs.add(ref); out += substitute(decls[ref], depth + 1); }
      else if (fallback !== undefined) out += substitute(fallback, depth + 1);
      else throw new Error(`${name}: ${ref} is not defined in the colour file`);
      i = j + 1;
    }
    return out;
  };
  const evaluate = (v) => {
    v = v.trim();
    const fn = v.match(/^([a-z-]+)\(([\s\S]*)\)$/i);
    if (fn && fn[1] === "light-dark") {
      if (!lightDark) throw new Error(`${name}: light-dark() in an engine without it`);
      const args = splitTop(fn[2]);
      if (args.length !== 2) throw new Error(`${name}: light-dark() takes two colours`);
      return evaluate(args[scheme === "dark" ? 1 : 0]);
    }
    if (fn && fn[1] === "color-mix") {
      const [space, ...parts] = splitTop(fn[2]);
      if (space.replace(/\s+/g, " ") !== "in srgb" || parts.length !== 2) throw new Error(`${name}: only color-mix(in srgb, a, b) is understood`);
      const items = parts.map((part) => {
        const t = splitTop(part, " ");
        const pct = /%$/.test(t.at(-1)) ? parseFloat(t.pop()) / 100 : null;
        return { c: evaluate(t.join(" ")), pct };
      });
      let [p1, p2] = items.map((x) => x.pct);
      if (p1 === null && p2 === null) p1 = p2 = 0.5;
      else if (p1 === null) p1 = 1 - p2;
      else if (p2 === null) p2 = 1 - p1;
      const [a, b] = items.map((x) => x.c);
      const alpha = a.alpha * p1 + b.alpha * p2;
      const rgb = alpha === 0 ? [0, 0, 0] : a.rgb.map((v, k) => (v * a.alpha * p1 + b.rgb[k] * b.alpha * p2) / alpha);
      return { rgb, alpha: Math.min(1, alpha) };
    }
    if (v === "transparent") return { rgb: [0, 0, 0], alpha: 0 };
    const rgb = parseColour(v);
    if (!rgb) throw new Error(`${name}: can't read "${v}"`);
    return { rgb, alpha: 1 };
  };
  if (decls[name] === undefined) throw new Error(`${name} is not defined in the colour file`);
  refs.add(name);
  const c = evaluate(substitute(decls[name], 0));
  return { ...c, refs };
}

/* the four environments every role is checked in */
export const SCHEMES = [
  { label: "light", scheme: "light", more: false },
  { label: "dark", scheme: "dark", more: false },
  { label: "light, more contrast", scheme: "light", more: true },
  { label: "dark, more contrast", scheme: "dark", more: true },
];

/** the colour file css/flashcards.css imports, parsed, with a resolver per environment */
export function loadColours(root = ROOT) {
  const entry = readFileSync(join(root, "css", "flashcards.css"), "utf8");
  const rel = entry.match(/@import\s+url\(\s*["']?(tokens\/color[^"')]*\.css)/)?.[1];
  if (!rel) throw new Error("css/flashcards.css imports no tokens/color*.css");
  const tree = parseCSS(readFileSync(join(root, "css", rel), "utf8"));
  const env = (scheme, more, lightDark = true) => {
    const decls = declarations(tree, { scheme, more, lightDark });
    return { scheme, more, lightDark, decls, get: (name) => resolveRole(decls, name, scheme, lightDark) };
  };
  return { rel: `css/${rel}`, tree, env, schemes: SCHEMES.map((s) => ({ ...s, ...env(s.scheme, s.more) })) };
}

/* ---- the guard ------------------------------------------------------------------- */

const FILL = 3, TEXT = 4.5;

/** an accent in one scheme: the fill pairs, and the better of paper and ink on it */
function judge(colours, rgb, scheme, on) {
  const rows = colours.schemes.filter((s) => s.scheme === scheme).map((s) => {
    const paper = s.get("--paper").rgb, canvas = s.get("--canvas").rgb, ink = s.get("--ink").rgb;
    const pick = on ?? (contrast(paper, rgb) >= contrast(ink, rgb) ? "paper" : "ink");
    const text = contrast(pick === "paper" ? paper : ink, rgb);
    const r = { label: s.label, paper: contrast(rgb, paper), canvas: contrast(rgb, canvas), on: pick, text, paperRgb: paper, canvasRgb: canvas };
    r.pass = r.paper >= FILL && r.canvas >= FILL && r.text >= TEXT;
    on = pick; // more contrast keeps the scheme's choice: the role resolves to its own value there
    return r;
  });
  return { rows, on: rows[0].on, pass: rows.every((r) => r.pass) };
}

/** the first lightness, walking from the colour's own, at which judge() passes */
function search(colours, rgb, scheme, order) {
  const [L0, C, h] = toOklch(rgb);
  const steps = [];
  for (let L = L0; L <= 1.0001; L += 0.005) steps.push(L);
  const down = [];
  for (let L = L0 - 0.005; L >= -0.0001; L -= 0.005) down.push(L);
  const tries = order === "nearest"
    ? [...steps, ...down].sort((a, b) => Math.abs(a - L0) - Math.abs(b - L0))
    : [...steps, ...down];
  for (const L of tries) {
    const cand = round8(fromOklch([L, C, h]));
    if (judge(colours, cand, scheme).pass) return cand;
  }
  return null;
}

function why(rows, hex) {
  const out = [];
  const [base] = rows; // more contrast is only named where it fails and the plain scheme doesn't
  for (const r of rows) {
    const named = (k, min) => r[k] < min && (r === base || base[k] >= min);
    if (named("paper", FILL)) out.push(`as a fill it is ${r.paper.toFixed(2)}:1 against ${r.label} paper (${toHex(r.paperRgb)}); it needs ${FILL}:1`);
    if (named("canvas", FILL)) out.push(`as a fill it is ${r.canvas.toFixed(2)}:1 against ${r.label} canvas (${toHex(r.canvasRgb)}); it needs ${FILL}:1`);
    if (named("text", TEXT)) out.push(`its text, the better of paper and ink (${r.on}), is ${r.text.toFixed(2)}:1 on it in ${r.label}; text needs ${TEXT}:1`);
  }
  return `${hex} can't be the accent:\n  · ${out.join(";\n  · ")}.`;
}

function table(rows) {
  const ok = (v, min) => `${v.toFixed(2).padStart(6)} ${v >= min ? "pass" : "FAIL"}`;
  const lines = [`  ${"".padEnd(22)}${"on paper".padEnd(14)}${"on canvas".padEnd(14)}its text (--on-accent)`];
  for (const r of rows) lines.push(`  ${r.label.padEnd(22)}${ok(r.paper, FILL).padEnd(14)}${ok(r.canvas, FILL).padEnd(14)}${r.on.padEnd(6)}${ok(r.text, TEXT)}`);
  return lines.join("\n");
}

function main(args) {
  if (!args.length || args.length > 2 || args.some((a) => /^-/.test(a))) {
    console.log('usage: node design/tools/accent.mjs <light accent> [<dark accent>]\n       each a hex ("#c2410c") or oklch() ("oklch(0.55 0.19 41)")');
    process.exit(1);
  }
  const parsed = args.map((a) => ({ text: a, rgb: parseColour(a) }));
  const bad = parsed.find((p) => !p.rgb);
  if (bad) {
    console.error(`Can't read "${bad.text}": give a hex such as "#c2410c" or an oklch() such as "oklch(0.55 0.19 41)".`);
    process.exit(1);
  }
  const colours = loadColours();
  const light = round8(parsed[0].rgb), lightHex = toHex(light);
  console.log(`Accent guard, against ${colours.rel}. A fill needs ${FILL}:1 against paper and canvas; its text ${TEXT}:1.\n`);

  const L = judge(colours, light, "light");
  console.log(`Light: ${lightHex}  ${oklchText(toOklch(light))}\n${table(L.rows)}\n`);
  if (!L.pass) {
    console.error(why(L.rows, lightHex));
    const near = search(colours, light, "light", "nearest");
    if (near) console.error(`\nThe nearest lightness of the same hue that passes in light: ${toHex(near)}  ${oklchText(toOklch(near))}.`);
    process.exit(1);
  }

  let dark, D;
  if (parsed[1]) {
    dark = round8(parsed[1].rgb);
    D = judge(colours, dark, "dark");
    console.log(`Dark: ${toHex(dark)}  ${oklchText(toOklch(dark))}\n${table(D.rows)}\n`);
    if (!D.pass) {
      console.error(why(D.rows, toHex(dark)));
      const p = search(colours, light, "dark", "lighter");
      if (p) console.error(`\nFrom the light accent, this dark one passes: ${toHex(p)}  ${oklchText(toOklch(p))}.`);
      process.exit(1);
    }
  } else {
    D = judge(colours, light, "dark");
    if (D.pass) {
      dark = light;
      console.log(`Dark: the same ${lightHex} passes as it is.\n${table(D.rows)}\n`);
    } else {
      dark = search(colours, light, "dark", "lighter");
      if (!dark) {
        console.error(`${why(D.rows, lightHex)}\nAnd no lightness of its hue passes in dark.`);
        process.exit(1);
      }
      console.log(`Dark: ${lightHex} as it is doesn't pass on a dark page.\n${table(D.rows)}\n`);
      D = judge(colours, dark, "dark");
      const [l0] = toOklch(light), [l1] = toOklch(dark);
      console.log(`Proposed dark: ${toHex(dark)}  ${oklchText(toOklch(dark))}, the same hue with its lightness ${l1 > l0 ? "raised" : "lowered"} from ${l0.toFixed(3)}.\n${table(D.rows)}\n`);
    }
  }

  const darkHex = toHex(dark);
  const on = L.on === D.on ? `var(--${L.on})` : `light-dark(var(--${L.on}), var(--${D.on}))`;
  const plainOn = `var(--${L.on})`;
  const lines = ["@layer app {", "  :root {", `    --accent: ${lightHex};`, `    --on-accent: ${plainOn};`, "  }"];
  if (darkHex !== lightHex || on !== plainOn) {
    lines.push(
      "  /* light-dark() only where the engine has it: an older one keeps the light pair above */",
      "  @supports (color: light-dark(#000, #fff)) {",
      "    :root {",
      `      --accent: ${darkHex === lightHex ? lightHex : `light-dark(${lightHex}, ${darkHex})`};`,
      `      --on-accent: ${on};`,
      "    }",
      "  }",
    );
  }
  lines.push("}");
  console.log(`Every pair passes. Paste into your app's CSS:\n\n${lines.join("\n")}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
