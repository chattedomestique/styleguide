#!/usr/bin/env node
/* ==========================================================================
   api.mjs — the contract: an inventory of the public API, read from the
   code. Zero dependencies.

     node design/tools/api.mjs           writes design/API.md
     node design/tools/api.mjs --check   exits 1 if API.md is stale, with a diff summary
     node design/tools/api.mjs --audit   the honesty pass: dead and undocumented API

   What ships is what css/flashcards.css imports and what js/components/
   holds. API.md lists the names in it an app can depend on: classes,
   tokens, attributes, the script's global and its events, and the files an
   app links. The versioning rule (STYLE.md §1 Versioning) applies to every
   name it lists that isn't marked "not API". check.mjs runs apiProblems()
   (check 11), so API.md can't fall behind the code.

   How "settable" is decided: a component-level custom property is settable
   when a page or a spec sets it in markup (style="--x: …"), or when the CSS
   reads it with a fallback and no shipped CSS sets it (an open hook). One
   a script sets is listed with that script. The roles an app sets are the
   ones tools/accent.mjs prints. Every other custom property a component
   sets is internal.

   Read but never listed: css/sheet.css (.sg-*) and css/screens.css (the
   pages' own CSS), pwa/app.css (the starter's own), js/sheet.js (the
   pages' script) and data-sg-* (the pages' hooks). None of them ships.
   ========================================================================== */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadColours, toHex, splitTop } from "./accent.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "API.md");
const ENTRY = "css/flashcards.css";

/* ---- reading ------------------------------------------------------------------ */

const read = (p) => readFileSync(join(ROOT, p), "utf8");
const ls = (dir, ext) =>
  readdirSync(join(ROOT, dir)).filter((n) => n.endsWith(ext) && !n.startsWith("_")).sort().map((n) => `${dir}/${n}`);
const blank = (s, re) => s.replace(re, (m) => m.replace(/[^\n]/g, " "));
const stripComments = (s) => blank(s, /\/\*[\s\S]*?\*\//g);
const stem = (p) => basename(p).replace(/\.[a-z]+$/, "");
const uniq = (a) => [...new Set(a)];
const push = (map, k, v) => (map.get(k) ?? map.set(k, []).get(k)).push(v);
const code = (s) => "`" + s + "`";
const codes = (a) => a.map(code).join(" ");
const cell = (s) => String(s).replace(/\|/g, "\\|");
const kebab = (s) => s.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function lines(s) {
  const starts = [0];
  for (let i = 0; i < s.length; i++) if (s[i] === "\n") starts.push(i + 1);
  return (i) => {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= i) lo = mid; else hi = mid - 1; }
    return lo + 1;
  };
}

/** every rule: { prelude, line, parents, decls: [{ prop, value, line }] } */
function cssRules(raw) {
  const s = blank(stripComments(raw), /url\((?:"[^"]*"|'[^']*'|[^)]*)\)/g);
  const at = lines(s);
  const out = [], stack = [];
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' || ch === "'") { for (i++; i < s.length && s[i] !== ch; i++) if (s[i] === "\\") i++; continue; }
    if (ch !== "{" && ch !== ";" && ch !== "}") continue;
    const text = s.slice(start, i);
    const where = at(start + Math.max(0, text.search(/\S/)));
    if (ch === "{") {
      const r = { prelude: text.trim().replace(/\s+/g, " "), line: where, parents: stack.map((x) => x.prelude), decls: [] };
      out.push(r);
      stack.push(r);
    } else {
      const m = /^\s*(--[\w-]+|-?[a-z][\w-]*)\s*:([\s\S]*)$/i.exec(text);
      if (m && stack.length) stack.at(-1).decls.push({ prop: m[1], value: m[2].trim().replace(/\s+/g, " "), line: where });
      if (ch === "}") stack.pop();
    }
    start = i + 1;
  }
  return out;
}
const isSelector = (r) => !r.prelude.startsWith("@") && !r.parents.some((p) => /^@(-webkit-)?keyframes\b/.test(p));
const noAttrs = (sel) => blank(sel, /\[[^\]]*\]/g);
const classesIn = (sel) => [...noAttrs(sel).matchAll(/\.(-?[a-z_][\w-]*)/gi)].map((m) => m[1]);
const attrsIn = (sel) =>
  [...sel.matchAll(/\[\s*([a-z][\w-]*)\s*(?:[~|^$*]?=\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+))\s*[is]?)?\s*\]/gi)].map((m) => ({
    name: m[1].toLowerCase(),
    value: m[2] ?? m[3] ?? m[4] ?? null,
  }));
/* native states worth naming; :hover, :focus-visible and :active are every element's */
const STATES = ["checked", "indeterminate", "disabled", "read-only", "placeholder-shown", "invalid", "user-invalid", "required",
  "popover-open", "modal", "open", "target", "empty", "autofill", "dir"];
const pseudosIn = (sel) =>
  [...noAttrs(sel).matchAll(/(?<![:\\]):(?!:)([a-z-]+)(\(\s*(?:ltr|rtl)\s*\))?/gi)]
    .filter((m) => STATES.includes(m[1].toLowerCase()))
    .map((m) => m[1].toLowerCase() + (m[2] ? m[2].replace(/\s/g, "") : ""));
/** var(--name, fallback) reads, with the fallback as written (nested var() kept) */
function varReads(value) {
  const out = [];
  for (let i = value.indexOf("var("); i >= 0; i = value.indexOf("var(", i + 4)) {
    let d = 0, j = i + 3;
    for (; j < value.length; j++) { if (value[j] === "(") d++; else if (value[j] === ")" && --d === 0) break; }
    const inner = value.slice(i + 4, j), k = inner.indexOf(","); // a name has no comma: the first one is the fallback's
    out.push({ name: (k < 0 ? inner : inner.slice(0, k)).trim(), fallback: k < 0 ? null : inner.slice(k + 1).trim() });
  }
  return out;
}

/** comments blanked, strings kept; and every string literal */
function scanJS(src) {
  let out = "", i = 0;
  const strings = [];
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (c === "/" && (n === "*" || n === "/")) {
      const j = n === "*" ? src.indexOf("*/", i + 2) : src.indexOf("\n", i);
      const end = j < 0 ? src.length : n === "*" ? j + 2 : j;
      out += src.slice(i, end).replace(/[^\n]/g, " ");
      i = end;
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1;
      strings.push(src.slice(i + 1, j));
      out += src.slice(i, j + 1);
      i = j + 1;
    } else { out += c; i++; }
  }
  return { code: out, strings };
}

/* ---- the model ------------------------------------------------------------------ */

const specOf = (file) => {
  const n = stem(file);
  if (/(^|\/)(components\/|icons\.css)/.test(file) && existsSync(join(ROOT, "elements", `${n}.md`))) return `elements/${n}.md`;
  return null;
};
const SPECIAL = {
  "css/base.css": { title: "Base: type styles and utilities", spec: "STYLE.md#type" },
  "css/wire.css": { title: "Wireframe kit (disposable: not API)", spec: "STYLE.md#5-wireframe-kit" },
};

function entry() {
  const s = read(ENTRY);
  const layers = s.match(/@layer\s+([\w\s,-]+);/)[1].split(",").map((x) => x.trim());
  const imports = [...stripComments(s).matchAll(/@import\s+url\(\s*["']?([^"')]+)["']?\s*\)\s*(?:layer\(\s*([\w-]+)\s*\))?/g)]
    .map((m) => ({ file: `css/${m[1]}`, layer: m[2] || null }));
  /* the layers' notes, from the header comment ("     tokens      values and roles…") */
  const notes = {};
  let cur = null, col = 0;
  for (const l of (s.match(/\/\*[\s\S]*?\*\//) ?? [""])[0].split("\n")) {
    const m = l.match(/^(\s+)([a-z]+)(\s{2,})(\S.*)$/);
    if (m && layers.includes(m[2])) { cur = m[2]; col = m[1].length + m[2].length + m[3].length; notes[cur] = m[4].trim(); }
    else if (cur && l.length > col && !l.slice(0, col).trim() && l[col] !== " ") notes[cur] += " " + l.trim();
    else cur = null;
  }
  return { layers, imports, notes };
}

export function inventory() {
  const { layers, imports, notes } = entry();
  const cssFiles = imports.map((i) => i.file).filter((f) => !/fonts\.css$/.test(f));
  const rules = Object.fromEntries(cssFiles.map((f) => [f, cssRules(read(f))]));
  const elementFiles = cssFiles.filter((f) => !/\/tokens\//.test(f));

  /* classes: where each is used in a selector, and which file owns its block */
  const defs = new Map(), alone = new Map(), byBlock = new Map();
  const blockOf = (c) => c.split(/__|--/)[0];
  for (const f of elementFiles) {
    for (const r of rules[f].filter(isSelector)) {
      for (const item of splitTop(r.prelude)) {
        const cs = classesIn(item);
        for (const c of cs) {
          push(defs, c, { file: f, line: r.line });
          if (!c.startsWith("is-")) push(byBlock, `${blockOf(c)} ${f}`, c);
        }
        if (cs.length && /^\.[\w-]+(?:::?[\w-]+(?:\([^)]*\))?|\[[^\]]*\])*$/.test(item.trim())) push(alone, cs[0], f);
      }
    }
  }
  const owner = new Map();
  for (const c of defs.keys()) {
    if (c.startsWith("is-")) continue;
    const b = blockOf(c);
    if (owner.has(b)) continue;
    const count = (f) => uniq(byBlock.get(`${b} ${f}`) ?? []).length;
    const pool = uniq(alone.get(b) ?? []).length ? uniq(alone.get(b)) : uniq(defs.get(c).map((d) => d.file));
    owner.set(b, pool.sort((x, y) => count(y) - count(x) || elementFiles.indexOf(x) - elementFiles.indexOf(y))[0]);
  }

  const elements = elementFiles.map((f) => {
    const spec = specOf(f);
    const title = SPECIAL[f]?.title ?? (spec ? read(spec).match(/^#\s+(.+)$/m)[1].trim() : stem(f));
    const blocks = new Map();
    for (const [c, ds] of defs) {
      if (c.startsWith("is-") || owner.get(blockOf(c)) !== f) continue;
      const b = blockOf(c);
      if (!blocks.has(b)) blocks.set(b, { name: b, line: Infinity, parts: [], variants: [], self: false });
      const e = blocks.get(b);
      const own = ds.filter((d) => d.file === f);
      e.line = Math.min(e.line, ...(own.length ? own : ds).map((d) => d.line));
      if (c === b) e.self = true;
      else if (c.includes("__")) e.parts.push(c);
      else e.variants.push(c);
    }
    const forcing = uniq([...defs].filter(([c, ds]) => c.startsWith("is-") && ds.some((d) => d.file === f)).map(([c]) => c)).sort();
    /* the states this file's selectors key on */
    const aria = new Map(), other = new Map(), native = new Set();
    for (const r of rules[f].filter(isSelector)) {
      for (const a of attrsIn(r.prelude)) {
        if (a.name.startsWith("data-")) continue;
        const into = /^(aria-|role$)/.test(a.name) ? aria : other;
        if (!into.has(a.name)) into.set(a.name, new Set());
        into.get(a.name).add(a.value);
      }
      for (const p of pseudosIn(r.prelude)) native.add(p);
    }
    return {
      file: f, name: stem(f), title, spec: SPECIAL[f]?.spec ?? spec,
      blocks: [...blocks.values()].sort((a, b) => a.line - b.line).map((b) => ({ ...b, parts: uniq(b.parts).sort(), variants: uniq(b.variants).sort() })),
      forcing, aria, other, native: [...native].sort(),
    };
  });

  /* tokens: foundation.css by its section comments, colour roles resolved per scheme */
  const foundation = [];
  {
    let group = null;
    read("css/tokens/foundation.css").split("\n").forEach((l, i) => {
      const h = l.match(/\/\*\s*-{3}\s*([a-z][^-:(]*?)\s*(?:[:(]|-{3})/i);
      if (h) group = h[1].trim();
      const d = l.match(/^\s*(--[\w-]+)\s*:\s*(.+?);\s*(?:\/\*\s*(.*?)\s*\*\/)?\s*$/);
      if (d && group) foundation.push({ name: d[1], value: d[2], px: /^\d+$/.test(d[3] ?? "") ? d[3] : null, group, line: i + 1 });
    });
  }
  const colours = loadColours(ROOT);
  const [light, dark, lightMore, darkMore] = colours.schemes;
  const show = (env, n) => { try { const c = env.get(n); return c.alpha < 1 ? `${toHex(c.rgb)} at ${Math.round(c.alpha * 100)}%` : toHex(c.rgb); } catch { return "?"; } };
  const appSets = uniq([...read("tools/accent.mjs").matchAll(/`\s*(--[\w-]+):\s*\$\{/g)].map((m) => m[1]));
  const roles = Object.keys(light.decls).filter((n) => !/^--grey-/.test(n)).map((n) => {
    const ref = light.decls[n].match(/^var\((--[\w-]+)\)$/)?.[1];
    const more = [show(lightMore, n) !== show(light, n) ? `light ${show(lightMore, n)}` : "", show(darkMore, n) !== show(dark, n) ? `dark ${show(darkMore, n)}` : ""].filter(Boolean).join(", ");
    return { name: n, light: show(light, n), dark: show(dark, n), more, follows: ref && !/^--grey-/.test(ref) ? ref : null, app: appSets.includes(n) };
  });
  const primitives = Object.keys(light.decls).filter((n) => /^--grey-/.test(n)).map((n) => ({ name: n, value: light.decls[n] }));
  const rootDecls = (f) => rules[f].filter((r) => isSelector(r) && /(^|,\s*):root\b|\[data-scheme/.test(r.prelude) && !/\[data-tone/.test(r.prelude));
  const smoothing = new Map();
  for (const r of rootDecls("css/base.css")) for (const d of r.decls.filter((x) => x.prop.startsWith("--"))) {
    if (!smoothing.has(d.prop)) smoothing.set(d.prop, { name: d.prop, light: null, dark: null });
    smoothing.get(d.prop)[/dark/.test(r.prelude) ? "dark" : "light"] ??= d.value;
  }
  const glyphs = [];
  for (const r of rootDecls("css/icons.css")) for (const d of r.decls.filter((x) => x.prop.startsWith("--"))) {
    const by = rules["css/icons.css"].filter((x) => isSelector(x) && x.decls.some((y) => y.value === `var(${d.prop})`)).map((x) => x.prelude);
    glyphs.push({ name: d.prop, by });
  }
  const registered = [];
  for (const f of cssFiles) for (const r of rules[f]) {
    const m = r.prelude.match(/^@property\s+(--[\w-]+)/);
    if (!m) continue;
    const get = (p) => r.decls.find((d) => d.prop === p)?.value ?? "";
    const setters = cssFiles.flatMap((g) => rules[g].filter((x) => isSelector(x) && x.decls.some((d) => d.prop === m[1])).map((x) => x.prelude));
    const attr = uniq(setters.map((s) => s.match(/^\[([\w-]+)/)?.[1] ?? "")).filter(Boolean);
    registered.push({
      name: m[1], syntax: get("syntax").replace(/["']/g, ""), inherits: get("inherits"), initial: get("initial-value"),
      use: get("syntax").includes("<number>") ? "state number" : attr.length === 1 && setters.every((s) => s.startsWith(`[${attr[0]}`)) ? `set by ${code(`[${attr[0]}]`)}` : "",
    });
  }

  /* the script */
  const known = new Set(defs.keys());
  const scripts = ls("js/components", ".js").map((file) => analyseJS(file, known));
  const global = scripts.map((s) => s.global).find(Boolean) ?? null;

  /* component-level custom properties: settable, set by a script, or internal */
  const tokenNames = new Set([...foundation.map((t) => t.name), ...Object.keys(light.decls), ...smoothing.keys(), ...glyphs.map((g) => g.name), ...registered.map((r) => r.name)]);
  const declared = new Map(), reads = new Map();
  for (const f of elementFiles) for (const r of rules[f]) for (const d of r.decls) {
    if (d.prop.startsWith("--")) push(declared, d.prop, { file: f, selector: r.prelude, value: d.value });
    for (const v of varReads(d.value)) push(reads, v.name, { file: f, selector: r.prelude, fallback: v.fallback });
  }
  const inline = new Set();
  for (const p of [...pagesList(), ...specsList()]) {
    for (const m of read(p).matchAll(/style="([^"]*)"/g)) for (const d of m[1].matchAll(/(--[\w-]+)\s*:/g)) inline.add(d[1]);
  }
  const scriptSets = new Map();
  for (const s of scripts) for (const p of s.setsProps) scriptSets.set(p, s.file);
  const settable = [];
  for (const [p, rs] of [...reads].sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (tokenNames.has(p) || /^--(dur|ease)-/.test(p)) continue;
    const open = rs.some((r) => r.fallback !== null) && !declared.has(p);
    if (!inline.has(p) && !open) continue;
    const rank = (f) => {
      const fr = rs.filter((r) => r.file === f);
      const decl = (declared.get(p) ?? []).some((d) => d.file === f);
      return fr.some((r) => r.fallback !== null) && !decl ? 0 : decl ? 1 : 2;
    };
    const files = uniq(rs.map((r) => r.file)).sort((a, b) => rank(a) - rank(b) || elementFiles.indexOf(a) - elementFiles.indexOf(b));
    const by = scriptSets.get(p) ?? null;
    const home = by ? `css/components/${stem(by)}.css` : files[0];
    const homeFb = rs.find((r) => r.file === home && r.fallback !== null);
    const decl = (declared.get(p) ?? []).find((d) => d.file === home);
    const fb = homeFb ?? rs.find((r) => r.fallback !== null);
    settable.push({
      name: p, element: elements.find((e) => e.file === home) ?? elements.find((e) => e.file === files[0]),
      default: homeFb || !decl ? (fb ? `${code(fb.fallback)} (fallback)` : "unset") : `${code(decl.value)} on ${code(decl.selector)}`,
      by, readBy: files,
    });
  }
  const internal = [...declared.keys()].filter((p) => !tokenNames.has(p) && !settable.some((s) => s.name === p)).sort();

  /* data attributes: shipped CSS and the scripts */
  const data = new Map();
  const attr = (n) => data.get(n) ?? data.set(n, { name: n, values: new Set(), present: false, text: false, readBy: new Set(), setBy: new Set() }).get(n);
  for (const f of cssFiles) for (const r of rules[f].filter(isSelector)) for (const a of attrsIn(r.prelude)) {
    if (!a.name.startsWith("data-")) continue;
    const e = attr(a.name);
    e.readBy.add(f);
    if (a.value === null) e.present = true; else e.values.add(a.value);
  }
  for (const s of scripts) {
    for (const a of s.attrsRead.filter((x) => x.name.startsWith("data-"))) {
      const e = attr(a.name);
      e.readBy.add(s.file);
      if (a.how === "text") e.text = true; else if (a.value === null) e.present = true; else a.value.split(/\s+/).forEach((v) => e.values.add(v));
    }
    for (const a of s.attrsWritten.filter((x) => x.name.startsWith("data-"))) {
      const e = attr(a.name);
      e.setBy.add(s.file);
      if (a.value) e.values.add(a.value); else e.present = true;
    }
  }
  const attributes = [...data.values()].filter((a) => !a.name.startsWith("data-sg-")).sort((a, b) => (a.name < b.name ? -1 : 1));

  /* files an app links: bundle.mjs's own list of what it writes */
  const dist = [];
  {
    const head = (read("tools/bundle.mjs").match(/\/\*[\s\S]*?\*\//) ?? [""])[0];
    const block = head.slice(head.indexOf("Writes to design/dist/"), head.indexOf("And rewrites")).split("\n").slice(1);
    let cur = null, col = 0;
    for (const l of block) {
      const m = l.match(/^(\s+)(\S+\.(?:css|js|html))(\s+)(\S.*)$/);
      if (m) { cur = { file: `dist/${m[2]}`, what: m[4].trim() }; col = m[1].length + m[2].length + m[3].length; dist.push(cur); }
      else if (cur && l.length > col && !l.slice(0, col).trim()) cur.what += " " + l.trim();
      else cur = null;
    }
  }
  const fonts = uniq([...read("css/fonts.css").matchAll(/url\(\s*["']?\.\.\/([^"')]+)/g)].map((m) => m[1]));
  const starter = readdirSync(join(ROOT, "pwa")).filter((n) => !/^README/.test(n)).sort().map((n) => (statSync(join(ROOT, "pwa", n)).isDirectory() ? `${n}/` : n));

  return { layers, imports, notes, elements, foundation, roles, primitives, smoothing: [...smoothing.values()], glyphs, registered, settable, internal, attributes, scripts, global, dist, fonts, starter, defs, owner, rules, cssFiles, tokenNames, declared };
}

function analyseJS(file, known) {
  const src = read(file);
  const { code: js, strings } = scanJS(src);
  const all = (re, s = js) => [...s.matchAll(re)].map((m) => m[1]);
  const global = js.match(/window\.(\w+)\s*=\s*window\.\1\s*\|\|/)?.[1] ?? null;
  const alias = js.match(/var\s+(\w+)\s*=\s*\(\s*window\.\w+\s*=/)?.[1] ?? null;
  const functions = [];
  if (alias) {
    for (const m of src.matchAll(new RegExp(`\\b${alias}\\.(\\w+)\\s*=\\s*function\\s*\\(([^)]*)\\)\\s*\\{[ \\t]*(?://[ \\t]*(.*))?`, "g"))) {
      /* what it returns: the first return at the function's own depth */
      let d = 0, ret = "nothing";
      for (let j = m.index + m[0].indexOf("{"); j < js.length; j++) {
        if (js[j] === "{") d++;
        else if (js[j] === "}" && --d === 0) break;
        else if (d === 1 && js.startsWith("return", j) && !/\w/.test(js[j - 1]) && !/\w/.test(js[j + 6])) {
          const stmt = js.slice(j + 6, js.indexOf(";", j)).trim();
          if (stmt.startsWith("{")) ret = `{ ${all(/(\w+)\s*:\s*function/g, stmt).map((k) => `${k}()`).join(", ")} }`;
          else if (/Promise|\.then\(|\.catch\(|\.persist\(\)/.test(stmt)) ret = "a Promise";
          break;
        }
      }
      const note = (m[3] ?? "").trim();
      const shape = /^\{[^}]*\}$/.test(note) && !m[2].includes(",") ? note : null;
      functions.push({ name: m[1], params: shape ?? m[2].trim(), note: shape ? "" : note, returns: ret });
    }
  }
  /* selectors in strings: the classes and attributes it hooks onto */
  const selectorish = strings.filter((s) => !s.includes("<") && /[.[]/.test(s) && /^[\s\w.#:>+~,()[\]="'*^$|-]+$/.test(s));
  const classesRead = uniq([...selectorish.flatMap((s) => classesIn(s)), ...all(/classList\.contains\(\s*["']([\w-]+)["']/g)].filter((c) => known.has(c))).sort();
  const attrsRead = [];
  for (const s of selectorish) for (const a of attrsIn(s)) attrsRead.push({ ...a, how: "selector" });
  for (const n of all(/getAttribute\(\s*["']([\w-]+)["']/g)) attrsRead.push({ name: n, value: null, how: "text" });
  for (const n of all(/hasAttribute\(\s*["']([\w-]+)["']/g)) attrsRead.push({ name: n, value: null, how: "presence" });
  for (const n of all(/\.dataset\.(\w+)/g)) attrsRead.push({ name: "data-" + kebab(n), value: null, how: "text" });
  const metas = uniq(strings.flatMap((s) => all(/meta\[name="([^"]+)"\]/g, s)));
  /* what it writes */
  const attrsWritten = [];
  for (const n of all(/(?:set|remove|toggle)Attribute\(\s*["']([\w-]+)["']/g)) attrsWritten.push({ name: n, value: null });
  for (const n of all(/\.(hidden|inert)\s*=[^=]/g)) attrsWritten.push({ name: n, value: null });
  if (/\.tabIndex\s*=[^=]/.test(js)) attrsWritten.push({ name: "tabindex", value: null });
  const markup = strings.filter((s) => s.includes("<"));
  for (const s of markup) for (const m of s.matchAll(/\s((?:data|aria)-[\w-]+)="([^"]*)"/g)) attrsWritten.push({ name: m[1], value: m[2] });
  const created = uniq([
    ...markup.flatMap((s) => all(/class="([^"]*)"/g, s).flatMap((v) => v.split(/\s+/))),
    ...all(/className\s*=\s*["']([^"']*)["']/g).flatMap((v) => v.split(/\s+/)),
    ...all(/classList\.(?:add|toggle|replace)\(([^)]*)\)/g).flatMap((v) => all(/["']([^"']+)["']/g, v)),
    ...markup.flatMap((s) => s.split(/[\s"'<>=]+/)).filter((t) => /__|--/.test(t)),
    ...strings.filter((s) => s.trim() && s.trim().split(/\s+/).every((t) => known.has(t) && /__|--/.test(t))).flatMap((s) => s.trim().split(/\s+/)),
  ].filter((c) => known.has(c))).sort();
  const header = (src.match(/\/\*\s*=+\s*\n([\s\S]*?)\*\//)?.[1] ?? "").replace(/^\s*/gm, "").replace(/\n/g, " ");
  const does = (header.split(/\s+—\s+/)[1] ?? header).split(/(?<=[^.])\.(?:\s|$)|:\s/)[0].trim();
  return {
    file, global, functions, does,
    events: uniq(all(/new\s+CustomEvent\(\s*["']([\w-]+)["']/g)),
    native: uniq(all(/new\s+Event\(\s*["']([\w-]+)["']/g)),
    setsProps: uniq(all(/setProperty\(\s*["'](--[\w-]+)["']/g)),
    messages: uniq(all(/postMessage\(\s*\{\s*type:\s*["']([\w-]+)["']/g)),
    metas, classesRead, created, attrsRead, attrsWritten,
  };
}

/* the pages, the starter and the specs, as check.mjs reads them */
function pagesList() {
  return ["index.html", "screens.html", ...ls("elements", ".html"), ...ls("pwa", ".html")];
}
function specsList() {
  return ["STYLE.md", "README.md", ...ls("elements", ".md").filter((n) => !n.endsWith("README.md"))];
}

/* ---- API.md ----------------------------------------------------------------------- */

/* a link to a spec, or to a STYLE.md section by its heading */
const link = (spec) => {
  if (!spec) return "";
  const [file, anchor] = spec.split("#");
  const heading = anchor && read(file).split("\n").map((l) => l.match(/^#{2,3}\s+(.+)$/)?.[1]).find((h) => h && slug(h) === anchor);
  const section = heading ? ` §${/^\d/.test(heading) ? "" : `${sectionOf(file, heading)} `}${heading.replace(/^(\d+)\.\s*/, "$1 ")}` : "";
  return `[${file.replace(/^elements\//, "")}${section}](${spec})`;
};
const slug = (h) => h.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
/* the "## N." a "### heading" sits under */
const sectionOf = (file, heading) => {
  let n = "";
  for (const l of read(file).split("\n")) {
    const m = l.match(/^##\s+(\d+)\./);
    if (m) n = m[1];
    if (l === `### ${heading}`) return n;
  }
  return "";
};
const fmtStates = (map) =>
  [...map].sort(([a], [b]) => (a < b ? -1 : 1)).map(([n, vs]) => {
    const values = [...vs].filter((v) => v !== null);
    const shown = values.length >= 5 && values.every((v) => /^\d+$/.test(v)) ? [`${Math.min(...values)}…${Math.max(...values)}`] : values.sort().map((v) => `"${v}"`);
    if (vs.has(null)) shown.unshift("present");
    return `${code(n)} (${shown.join(", ")})`;
  }).join(" ");
const fname = (f) => code(basename(f));
const fnames = (a) => uniq(a).map(fname).join(" ");

export function render(inv = inventory()) {
  const o = [];
  const g = inv.global;

  o.push("# API", "");
  o.push("Generated by `node design/tools/api.mjs` from the code: don't edit it, run that. `check.mjs` fails while it is stale.");
  o.push("The versioning rule in [STYLE.md §1 Versioning](STYLE.md#versioning) applies to every name here that isn't marked not API.");
  o.push("Not listed, because they don't ship: the pages' own `css/sheet.css` (`.sg-*`), `css/screens.css`, `js/sheet.js` and `data-sg-*`, and the starter's own `pwa/app.css`.", "");
  o.push("1. [Classes](#1-classes) · 2. [Tokens](#2-tokens) · 3. [Attributes and hooks](#3-attributes-and-hooks) · 4. [Script](#4-script) · 5. [Files an app links](#5-files-an-app-links)", "");

  /* 1 */
  const nClasses = inv.elements.reduce((n, e) => n + e.blocks.reduce((m, b) => m + (b.self ? 1 : 0) + b.parts.length + b.variants.length, 0), 0);
  o.push("## 1. Classes", "");
  o.push(`${nClasses} classes, by the file that defines their block. \`.is-*\` force a state on the pages and in tests: not API.`, "");
  for (const e of inv.elements) {
    o.push(`### ${e.title}`, "");
    o.push(`${code(e.file)} · ${link(e.spec)}`, "");
    if (e.file === "css/base.css") {
      o.push("| Class | Reads |", "| --- | --- |");
      for (const b of e.blocks) {
        const font = inv.rules[e.file].find((r) => isSelector(r) && r.prelude === `.${b.name}`)?.decls.find((d) => d.prop === "font")?.value;
        o.push(`| ${code("." + b.name)} | ${font ? code(font) : "utility"} |`);
      }
    } else {
      o.push("| Block | Parts | Variants |", "| --- | --- | --- |");
      for (const b of e.blocks) o.push(`| ${b.self ? code("." + b.name) : `(${code(b.name)})`} | ${codes(b.parts.map((c) => "." + c))} | ${codes(b.variants.map((c) => "." + c))} |`);
    }
    if (!e.blocks.length) o.splice(o.length - 2, 2, "No classes of its own: hooks only (§3).");
    if (e.forcing.length) o.push("", `Pages and tests only, not API: ${codes(e.forcing.map((c) => "." + c))}.`);
    o.push("");
  }

  /* 2 */
  o.push("## 2. Tokens", "");
  o.push("Custom properties on `:root`, from `css/tokens/`, plus the smoothing tokens in `base.css` and the glyphs in `icons.css`. Components read roles, never primitives.", "");
  const groups = uniq(inv.foundation.map((t) => t.group));
  for (const grp of groups) {
    o.push(`### ${grp[0].toUpperCase()}${grp.slice(1)}`, "", "| Token | Value |", "| --- | --- |");
    for (const t of inv.foundation.filter((x) => x.group === grp)) o.push(`| ${code(t.name)} | ${code(cell(t.value))}${t.px ? ` (${t.px}px)` : ""} |`);
    o.push("");
  }
  o.push("### Colour roles", "", `${link("STYLE.md#colour")}. Each is \`light-dark()\`; more contrast shown where it differs.`, "");
  o.push("| Role | Light | Dark | More contrast | Note |", "| --- | --- | --- | --- | --- |");
  for (const r of inv.roles) o.push(`| ${code(r.name)} | ${r.light} | ${r.dark} | ${r.more} | ${[r.follows ? `follows ${code(r.follows)}` : "", r.app ? "an app sets it, in `@layer app` (`tools/accent.mjs`)" : ""].filter(Boolean).join("; ")} |`);
  o.push("", "### Primitives (not for components)", "", "Only the colour file reads these (check 6).", "");
  o.push("| Primitive | Value |", "| --- | --- |");
  for (const p of inv.primitives) o.push(`| ${code(p.name)} | ${p.value} |`);
  o.push("", "### Smoothing", "", `From \`base.css\`, following the scheme and \`data-scheme\`. ${link("STYLE.md#type")}.`, "");
  o.push("| Token | Light | Dark |", "| --- | --- | --- |");
  for (const s of inv.smoothing) o.push(`| ${code(s.name)} | ${s.light ?? ""} | ${s.dark ?? ""} |`);
  o.push("", "### Glyphs", "", `Masks in \`icons.css\`, each read by its \`.ic--*\` class. ${link("elements/icons.md")}.`, "");
  o.push("| Token | Class |", "| --- | --- |");
  for (const x of inv.glyphs) o.push(`| ${code(x.name)} | ${codes(x.by)} |`);
  o.push("", "### Registered (`@property`)", "", "| Property | Syntax | Inherits | Initial | Use |", "| --- | --- | --- | --- | --- |");
  for (const r of inv.registered) o.push(`| ${code(r.name)} | ${code(r.syntax)} | ${r.inherits} | ${r.initial} | ${r.use} |`);
  o.push("", "### Settable, per element", "");
  o.push("Set in markup by a page or a spec, or read with a fallback that no shipped CSS sets. Set by a script: the script publishes it.", "");
  o.push("| Element | Property | Default | Set by | Read by |", "| --- | --- | --- | --- | --- |");
  for (const s of [...inv.settable].sort((a, b) => inv.elements.indexOf(a.element) - inv.elements.indexOf(b.element) || (a.name < b.name ? -1 : 1))) {
    o.push(`| ${s.element.title} · ${link(s.element.spec)} | ${code(s.name)} | ${s.default} | ${s.by ? fname(s.by) : "app"} | ${fnames(s.readBy)} |`);
  }
  o.push("", `Internal, not API (${inv.internal.length}): ${codes(inv.internal)}.`, "");

  /* 3 */
  o.push("## 3. Attributes and hooks", "");
  o.push("What the CSS and the script key on, besides classes.", "");
  o.push("### Data attributes", "", "| Attribute | Values | Read by | Set by | Spec |", "| --- | --- | --- | --- | --- |");
  for (const a of inv.attributes) {
    const values = [...[...a.values].sort((x, y) => (/^\d+$/.test(x) && /^\d+$/.test(y) ? x - y : x < y ? -1 : 1)).map((v) => `"${v}"`), a.text ? "text" : "", a.present ? "(present)" : ""].filter(Boolean).join(" ");
    const files = [...a.setBy, ...a.readBy];
    const home = files.find((f) => f.endsWith(".js")) ?? files[0];
    const spec = specOf(home) ?? (home === "css/wire.css" ? SPECIAL[home].spec : /base|tokens/.test(home) ? "STYLE.md#colour" : null);
    o.push(`| ${code(a.name)}${/wire/.test(home) ? " (disposable)" : ""} | ${values} | ${fnames([...a.readBy])} | ${fnames([...a.setBy])} | ${link(spec)} |`);
  }
  o.push("", "### Meta and messages", "", "| Hook | Kind | Used by | Spec |", "| --- | --- | --- | --- |");
  for (const s of inv.scripts) {
    for (const m of s.metas) o.push(`| ${code(`<meta name="${m}" content="…">`)} | meta, in the page's head | ${fname(s.file)} | ${link(specOf(s.file))} |`);
    for (const m of s.messages) {
      const sw = ls("pwa", ".js").filter((f) => read(f).includes(`"${m}"`));
      o.push(`| ${code(`{ type: "${m}" }`)} | message, page to waiting worker | ${fname(s.file)} ${codes(sw)} | ${link(specOf(s.file))} |`);
    }
  }
  o.push("", "### ARIA and native states, per element", "", "| Element | ARIA | Other attributes | Native |", "| --- | --- | --- | --- |");
  for (const e of inv.elements) {
    if (!e.aria.size && !e.other.size && !e.native.length) continue;
    o.push(`| ${e.title} · ${link(e.spec)} | ${fmtStates(e.aria)} | ${fmtStates(e.other)} | ${codes(e.native.map((n) => ":" + n))} |`);
  }
  o.push("");

  /* 4 */
  o.push("## 4. Script", "");
  o.push(`\`dist/flashcards.js\`: every \`js/components/*.js\`, vanilla, and everything works without it.${g ? ` One global, \`window.${g}\`.` : ""}`, "");
  o.push(`### \`window.${g}\``, "", "| Function | Returns | Note | File |", "| --- | --- | --- | --- |");
  for (const s of inv.scripts) for (const f of s.functions) o.push(`| ${code(`${g}.${f.name}(${f.params})`)} | ${cell(f.returns)} | ${cell(f.note)} | ${fname(s.file)} · ${link(specOf(s.file))} |`);
  o.push("", "### Events", "", "| Event | Kind | Dispatched by | Spec |", "| --- | --- | --- | --- |");
  for (const [kind, key] of [["custom, bubbles", "events"], ["native, fired after a change the script made", "native"]]) {
    for (const ev of uniq(inv.scripts.flatMap((s) => s[key]))) {
      const by = inv.scripts.filter((s) => s[key].includes(ev));
      o.push(`| ${code(ev)} | ${kind} | ${fnames(by.map((s) => s.file))} | ${by.map((s) => link(specOf(s.file))).join(" ")} |`);
    }
  }
  o.push("", "### Files", "", "| File | Does | Hooks onto | Writes |", "| --- | --- | --- | --- |");
  for (const s of inv.scripts) {
    const hooks = [...s.classesRead.map((c) => "." + c), ...uniq(s.attrsRead.filter((a) => /^(data-|aria-|command)/.test(a.name) && !a.name.startsWith("data-sg-")).map((a) => a.name)).sort(), ...s.metas.map((m) => `meta[name="${m}"]`)];
    const writes = [...uniq(s.attrsWritten.map((a) => a.name)).sort(), ...s.setsProps, ...s.created.map((c) => "." + c)];
    o.push(`| ${code(s.file)} · ${link(specOf(s.file))} | ${cell(s.does)} | ${codes(uniq(hooks))} | ${codes(uniq(writes))} |`);
  }
  o.push("");

  /* 5 */
  o.push("## 5. Files an app links", "");
  o.push("Built by `node design/tools/bundle.mjs`. Ship `dist/` and `fonts/` side by side: the CSS loads the font from `../fonts/`.", "");
  o.push("| File | Role | What |", "| --- | --- | --- |");
  for (const d of inv.dist) {
    const role = /\.min\./.test(d.file) ? "a served app links this" : /\.html$/.test(d.file) ? "the style sheet's pages: not for apps" : "the readable copy: an app may link it";
    const twin = inv.dist.find((x) => x !== d && x.file.replace(".min.", ".") === d.file.replace(".min.", "."));
    const what = d.what.replace(/\s+/g, " ").replace(/^the same\b/, twin ? basename(twin.file) : "the same");
    o.push(`| ${code(d.file)} | ${role} | ${cell(what)} |`);
  }
  for (const f of inv.fonts) o.push(`| ${code(f)} | the font, preloaded with \`crossorigin\` | ${link("STYLE.md#type")} |`);
  o.push(`| ${code("pwa/")} | the starter: copy it with \`dist/\` and \`fonts/\` | ${codes(inv.starter)} · [pwa/README.md](pwa/README.md) |`);
  o.push("", "### Layers", "", `\`${ENTRY}\`: \`@layer ${inv.layers.join(", ")};\`. Later wins. ${link("STYLE.md#files-and-layers")}.`, "");
  o.push("| Layer | Files | What |", "| --- | --- | --- |");
  for (const l of inv.layers) {
    const files = inv.imports.filter((i) => i.layer === l).map((i) => i.file.replace(/^css\//, ""));
    const short = files.length > 4 ? [...files.slice(0, 2), `… ${files.length} files`] : files;
    o.push(`| ${code(l)} | ${short.map((f) => (f.startsWith("…") ? f : code(f))).join(" ")} | ${cell(inv.notes[l] ?? "")} |`);
  }
  const unlayered = inv.imports.filter((i) => !i.layer).map((i) => i.file);
  if (unlayered.length) o.push(`| (none) | ${codes(unlayered.map((f) => f.replace(/^css\//, "")))} | \`@font-face\`, outside the layers |`);
  o.push("", "**App CSS goes in `@layer app`.** Unlayered CSS beats every layer and would override the components' states.", "");
  return o.join("\n");
}

/* ---- keeping it honest ---------------------------------------------------------------- */

/** the problems check.mjs reports as check 11: API.md stale or missing, and
    script API (globals, events, data attributes, meta) that no spec names */
export function apiProblems() {
  let inv, want;
  try {
    inv = inventory();
    want = render(inv);
  } catch (e) {
    return [`tools/api.mjs can't read the code: ${e.message}`];
  }
  const problems = [];
  if (!existsSync(OUT)) problems.push("API.md is missing: run node design/tools/api.mjs");
  else {
    const have = readFileSync(OUT, "utf8");
    if (have !== want) problems.push(...stale(have, want));
  }
  const docs = specsList().map((p) => read(p)).join("\n");
  const named = (re) => re.test(docs);
  for (const s of inv.scripts) {
    for (const f of s.functions) if (!named(new RegExp(`${esc(inv.global ?? "")}\\.${f.name}\\b`))) problems.push(`${s.file}: ${inv.global}.${f.name} is named in no spec`);
    for (const ev of s.events) if (!named(new RegExp(`\\b${esc(ev)}\\b`))) problems.push(`${s.file}: the event "${ev}" is named in no spec`);
    for (const m of s.metas) if (!named(new RegExp(`name="${esc(m)}"`))) problems.push(`${s.file}: <meta name="${m}"> is named in no spec`);
  }
  for (const a of inv.attributes) {
    if (!named(new RegExp(`(?<![\\w-])${esc(a.name)}(?![\\w-])`))) problems.push(`${a.name} is read by ${[...a.readBy].join(", ")} but named in no spec`);
    if (a.name === "data-pwa") for (const v of a.values) {
      if (!named(new RegExp(`data-pwa~?="[^"]*(?<![\\w-])${esc(v)}(?![\\w-])`))) problems.push(`data-pwa="${v}" is named in no spec`);
    }
  }
  for (const e of inv.elements) if (!e.spec) problems.push(`${e.file} has no spec in elements/`);
  return problems;
}

/** a summary of what differs, line by line, the generated side first */
function stale(have, want) {
  const count = (s) => s.split("\n").reduce((m, l) => m.set(l, (m.get(l) ?? 0) + 1), new Map());
  const a = count(have), b = count(want);
  const added = [], removed = [];
  for (const [l, n] of b) for (let i = a.get(l) ?? 0; i < n; i++) added.push(l);
  for (const [l, n] of a) for (let i = b.get(l) ?? 0; i < n; i++) removed.push(l);
  const out = [`API.md is stale (${added.length} lines to add, ${removed.length} to remove): run node design/tools/api.mjs`];
  const clip = (l) => (l.length > 110 ? l.slice(0, 107) + "…" : l);
  for (const l of added.slice(0, 6)) out.push(`+ ${clip(l)}`);
  if (added.length > 6) out.push(`+ … and ${added.length - 6} more`);
  for (const l of removed.slice(0, 6)) out.push(`- ${clip(l)}`);
  if (removed.length > 6) out.push(`- … and ${removed.length - 6} more`);
  if (!added.length && !removed.length) out.push("  (the same lines, in another order)");
  return out;
}

/** the honesty pass: dead API, undocumented API, tokens never read, hooks never used */
export function audit(inv = inventory()) {
  const pages = pagesList();
  const scriptsAll = [...ls("js/components", ".js"), ...ls("pwa", ".js"), "js/sheet.js"];
  const docs = specsList();
  const docText = Object.fromEntries(docs.map((p) => [p, read(p)]));
  const roadmap = read("elements/README.md");
  const used = new Map(); // class -> where
  for (const p of pages) {
    const s = read(p), at = lines(s);
    for (const m of s.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/).filter(Boolean)) push(used, c, `${p}:${at(m.index)}`);
  }
  const known = new Set(inv.defs.keys());
  for (const f of scriptsAll) {
    const a = analyseJS(f, known);
    for (const c of [...a.classesRead, ...a.created]) push(used, c, f);
    for (const s of scanJS(read(f)).strings) for (const t of s.split(/[\s"'.<>=]+/)) if (known.has(t) && /__|--|-/.test(t)) push(used, t, f);
  }
  const namedIn = (c, text) =>
    (/[-_]/.test(c) ? new RegExp(`(?<![\\w-])\\.?${esc(c)}(?![\\w-])`) : new RegExp(`(?<![\\w-])\\.${esc(c)}(?![\\w-])`)).test(text) ||
    [...text.matchAll(/class="([^"]*)"/g)].some((m) => m[1].split(/\s+/).includes(c));
  const where = (c) => inv.defs.get(c).map((d) => `${d.file}:${d.line}`)[0];
  const dead = [], undocumented = [], unshown = [];
  for (const c of [...known].sort()) {
    const specs = docs.filter((p) => namedIn(c, docText[p]));
    const inPages = (used.get(c) ?? []).filter((w) => /\.html:/.test(w));
    const anyUse = used.get(c) ?? [];
    if (!anyUse.length && !specs.length) dead.push({ c, at: where(c), roadmap: namedIn(c, roadmap) });
    else if (inPages.length && !specs.length) undocumented.push({ c, at: where(c), seen: inPages[0], roadmap: namedIn(c, roadmap) });
    else if (!anyUse.length) unshown.push({ c, at: where(c), specs });
  }
  /* tokens and component properties never read */
  const allCss = [...readdirSync(join(ROOT, "css")).filter((n) => n.endsWith(".css")).map((n) => `css/${n}`), ...ls("css/tokens", ".css"), ...ls("css/components", ".css"), ...ls("pwa", ".css")];
  const readsBy = new Map();
  for (const f of allCss) for (const m of stripComments(read(f)).matchAll(/var\(\s*(--[\w-]+)/g)) push(readsBy, m[1], f);
  for (const f of [...pages, ...scriptsAll, "js/sheet-scheme.js"]) for (const m of read(f).matchAll(/var\(\s*(--[\w-]+)|getPropertyValue\(\s*["'](--[\w-]+)/g)) push(readsBy, m[1] ?? m[2], f);
  const shippedSet = new Set(inv.cssFiles);
  const tokenLines = new Map();
  for (const f of ["css/tokens/foundation.css", "css/tokens/color.css", "css/base.css", "css/icons.css"]) {
    const s = read(f), at = lines(s);
    for (const m of stripComments(s).matchAll(/(?:^|[;{\s])(--[\w-]+)\s*:/g)) if (!tokenLines.has(m[1])) tokenLines.set(m[1], `${f}:${at(m.index + m[0].indexOf("--"))}`);
    for (const m of s.matchAll(/@property\s+(--[\w-]+)/g)) if (!tokenLines.has(m[1])) tokenLines.set(m[1], `${f}:${at(m.index)}`);
  }
  for (const [p, ds] of inv.declared) if (!tokenLines.has(p)) tokenLines.set(p, `${ds[0].file}`);
  const neverRead = [], pagesOnly = [];
  for (const [p, at] of [...tokenLines].sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (/^--grey-/.test(p)) continue; // primitives: the colour file reads them
    const by = uniq(readsBy.get(p) ?? []);
    if (!by.length) neverRead.push({ p, at });
    else if (!by.some((f) => shippedSet.has(f) || f.startsWith("js/components/"))) pagesOnly.push({ p, at, by });
  }
  /* tokens no spec names: the scale is the contract, so each step should be findable */
  const allDocs = Object.values(docText).join("\n");
  const ranges = [...allDocs.matchAll(/`(--[\w-]+?)(\d+)`\s*(?:…|\.\.\.|to)\s*`\1(\d+)`/g)];
  const inRange = (p) => ranges.some((m) => p.startsWith(m[1]) && /^\d+$/.test(p.slice(m[1].length)) && +p.slice(m[1].length) >= +m[2] && +p.slice(m[1].length) <= +m[3]);
  const unnamedTokens = [...tokenLines]
    .filter(([p]) => inv.tokenNames.has(p) && !/^--grey-/.test(p) && !inRange(p) && !new RegExp(`(?<![\\w-])${esc(p)}(?![\\w-])`).test(allDocs))
    .map(([p, at]) => ({ p, at }));
  /* hooks never used by a page, the starter or the starter's script */
  const usage = [...pages, ...ls("pwa", ".js")].map((p) => read(p)).join("\n");
  const unusedHooks = [];
  for (const a of inv.attributes) {
    if (!a.setBy.size && !new RegExp(`\\s${esc(a.name)}(?=[\\s=>])`).test(usage)) unusedHooks.push(`${a.name} (read by ${[...a.readBy].join(", ")})`);
    if (a.name === "data-pwa") for (const v of a.values) if (!new RegExp(`data-pwa="[^"]*(?<![\\w-])${esc(v)}(?![\\w-])`).test(usage)) unusedHooks.push(`data-pwa="${v}"`);
  }
  for (const s of inv.scripts) {
    for (const f of s.functions) if (!new RegExp(`\\.${f.name}\\(`).test(usage)) unusedHooks.push(`${inv.global}.${f.name}() (${s.file})`);
    for (const ev of s.events) if (!new RegExp(`["']${esc(ev)}["']`).test(usage)) unusedHooks.push(`event "${ev}" (${s.file}): nothing listens on a page or in the starter`);
  }
  return { dead, undocumented, unshown, neverRead, pagesOnly, unnamedTokens, unusedHooks };
}

/* ---- the command ---------------------------------------------------------------------- */

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = process.argv[2];
  if (arg === "--check") {
    const problems = apiProblems();
    for (const p of problems) console.log(p);
    if (!problems.length) console.log(`API.md is current (${readFileSync(OUT, "utf8").split("\n").length} lines).`);
    process.exit(problems.length ? 1 : 0);
  } else if (arg === "--audit") {
    const a = audit();
    const out = (title, rows) => { console.log(`\n${title} (${rows.length})`); for (const r of rows) console.log(`  ${r}`); };
    out("Dead: defined, used by no page, starter or script, named in no spec", a.dead.map((d) => `${d.at} .${d.c}${d.roadmap ? "  (named in elements/README.md)" : ""}`));
    out("Undocumented: used in a page, named in no spec", a.undocumented.map((d) => `${d.at} .${d.c}  (e.g. ${d.seen})${d.roadmap ? "  (named in elements/README.md)" : ""}`));
    out("Specified, but no page, starter or script uses it", a.unshown.map((d) => `${d.at} .${d.c}  (${d.specs.join(", ")})`));
    out("Custom properties never read", a.neverRead.map((d) => `${d.at} ${d.p}`));
    out("Tokens read only by the pages' own CSS or script", a.pagesOnly.map((d) => `${d.at} ${d.p}  (${d.by.join(", ")})`));
    out("Tokens no spec names", a.unnamedTokens.map((d) => `${d.at} ${d.p}`));
    out("Hooks no page or starter uses", a.unusedHooks);
  } else if (!arg) {
    const md = render();
    writeFileSync(OUT, md);
    console.log(`wrote API.md: ${md.split("\n").length} lines, ${(Buffer.byteLength(md) / 1024).toFixed(1)} KB`);
  } else {
    console.log("usage: node design/tools/api.mjs [--check | --audit]");
    process.exit(2);
  }
}
