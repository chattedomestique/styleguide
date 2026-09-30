# References

Working notes that the guide was built from. They are inputs, not documentation: the living guide is in `docs/`, the rules are in `CLAUDE.md` and `STYLE.md`.

| Folder | What | Use it when |
| --- | --- | --- |
| `screens/` | one analysis per reference screen the owner supplied (nine), plus notes on `1bit-ui` and `ui-ux-pro-max`: measured layout, type and colour, component anatomy, the accessibility failures of each mockup, and the fix | you are adding an element that one of the screens shows. Take the idea and the anatomy; do **not** copy their colours, radii, shadows or gradients (they fail contrast and break the seven rules) |
| `standards/` | WCAG 2.2 numbers, the ARIA pattern and keyboard model per component, the test protocol, and which CSS / HTML features are safe to rely on in 2026 | you need the exact requirement or the browser-support answer |
| `audit/` | the four reviews of the owner's Flashcards style sheet v0.1 (CSS, rendering, tooling, genericisation), and an earlier audit of the Flashcards app | you want the evidence behind `AUDIT.md`, or a rule's history |

The screens are third-party mockups analysed for ideas only; none of their artwork is in this repository. A CodePen link the owner shared could not be read (Cloudflare returned 403), so nothing was taken from it. If it matters, paste its HTML and CSS into a session and it will be analysed the same way.

To add a new reference screen: save its analysis as `screens/imgN-short-name.md` (layout and spacing measured, type, components with anatomy and states, contrast failures, what is generic), then follow the gate pipeline in `CLAUDE.md`.
