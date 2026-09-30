/**
 * A deliberately small Markdown -> HTML converter for the repo's own prose (AUDIT.md and friends):
 * headings, paragraphs, ordered / unordered lists, pipe tables, **bold**, *italic*, `code`, [links](x).
 * Anything else is passed through as a paragraph. Not a general Markdown engine: if you need more, use one.
 */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function inline(t) {
  t = esc(t)
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/(?<![*\w])\*([^*\n]+)\*(?![*\w])/g, '<em>$1</em>')
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  return t
}

export function mdToHtml(md, { skipH1 = true } = {}) {
  const lines = md.split('\n')
  const out = []
  const seen = {}
  const slug = (s) => {
    const b = s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const n = seen[b] ?? 0
    seen[b] = n + 1
    return n ? `${b}-${n}` : b
  }
  let table = 0
  for (let i = 0; i < lines.length; ) {
    const l = lines[i]
    let m
    if (/^# /.test(l)) { if (!skipH1) out.push(`<h1>${inline(l.slice(2))}</h1>`); i++; continue }
    if ((m = l.match(/^(#{2,4}) (.*)/))) { out.push(`<h${m[1].length} id="${slug(m[2])}">${inline(m[2])}</h${m[1].length}>`); i++; continue }
    if (l.startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++].trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|')))
      table++
      out.push(`<div class="table-wrap"><table class="docs-table">\n<caption class="sr-only">Table ${table}</caption>\n<thead><tr>${rows[0].map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>\n<tbody>\n${rows.slice(2).map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('\n')}\n</tbody></table></div>`)
      continue
    }
    if (/^\d+\. /.test(l)) { const it = []; while (i < lines.length && /^\d+\. /.test(lines[i])) it.push(lines[i++].replace(/^\d+\. /, '')); out.push(`<ol>${it.map((x) => `<li>${inline(x)}</li>`).join('')}</ol>`); continue }
    if (l.startsWith('- ')) { const it = []; while (i < lines.length && lines[i].startsWith('- ')) it.push(lines[i++].slice(2)); out.push(`<ul>${it.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`); continue }
    if (!l.trim()) { i++; continue }
    out.push(`<p>${inline(l)}</p>`)
    i++
  }
  return out.join('\n')
}
