# styleguide

The design system for our installed mobile PWAs and Mac-first apps: minimal, brutalist, friendly,
and not AI-looking, with usability first. Built one element at a time.

**Status:** v0.2.1, wireframe stage (greys, no motion). The foundations are done, Card has passed
gates 0–2, and Button is next.

| Path | What it is |
| --- | --- |
| `design/README.md` | Start here: the pipeline, the gates, the status of every element |
| `design/STYLE.md` | The spec: rules, tokens, elements, platforms (PWA, macOS, SwiftUI) |
| `design/index.html` | The living style sheet. Opens straight from disk |
| `design/screens.html` | The test bed: phone and Mac screens built from the system, missing elements marked |
| `design/dist/` | What an app links: one CSS file, plus single-file copies of both pages |
| `audit/` | How v0.2 was audited, fixed and verified: the brief, the plan and every report |

```
node design/tools/check.mjs     the gate: must pass before anything merges
node design/tools/bundle.mjs    rebuilds design/dist/
```

No build step, no dependencies. Node is only needed for the two tools.
