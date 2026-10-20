# styleguide

The design system for our installed mobile PWAs and Mac-first apps: minimal, brutalist, friendly,
and not AI-looking, with usability first. Built one element at a time.

**Status:** v1.0.0, frozen. All 27 elements have passed all six gates: built one by one in waves
1–5 (with a starter app in `design/pwa/` that installs and works offline), then given colour,
dark mode and high contrast (wave 6: black, grey and white, plus one accent per app), motion with
a gentler reduced-motion version (wave 7), and right to left, a public API in `design/API.md`
and three final audits (wave 8). Changes from here follow semver over `API.md` (`STYLE.md` §1).

| Path | What it is |
| --- | --- |
| `design/README.md` | Start here: the pipeline, the gates, the status of every element |
| `design/STYLE.md` | The spec: rules, tokens, elements, platforms (PWA, macOS, SwiftUI) |
| [`design/API.md`](design/API.md) | The contract: every class, token, hook and global an app can rely on, generated from the code |
| `design/index.html` | The hub: rules, tokens and the index of every element. Opens straight from disk |
| `design/elements/` | One page and one spec per element, the build contract, and every brief |
| `design/screens.html` | The test bed: phone and Mac screens built from the system |
| `design/pwa/` | The starter app: installs, works offline, updates on Reload. Serve it to try it |
| `design/dist/` | What an app links: the CSS and JS (and their min files). Its two single-file pages, the sheet and the screens, are docs, not for apps |
| `audit/` | How v0.2 was audited, fixed and verified: the brief, the plan and every report |

To use it in an app, read [Use it in an app](design/README.md#use-it-in-an-app): the head to
copy, the files an app needs, `@layer app` and the accent.

```
node design/tools/check.mjs     the gate: must pass before anything merges
node design/tools/bundle.mjs    rebuilds design/dist/ and checks the size budget
node design/tools/api.mjs       regenerates design/API.md from the code
node design/tools/accent.mjs "#c2410c"   checks an app's accent and prints the CSS to paste
node design/tools/serve.mjs     serves design/ at http://localhost:8000/ (the starter is /pwa/)
```

No build step, no dependencies. Node is only needed for the tools.
