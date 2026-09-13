# NATTAPON BUILDS — v2 Cinematic

Nattapon Surasin’s existing single-page portfolio, refined without a framework or build step.

## Run locally

Serve this directory over HTTP (the JavaScript uses native ES modules):

```powershell
py -m http.server 8810 --bind 127.0.0.1
```

Open [the local preview](http://127.0.0.1:8810). If your Python executable is named `python`, use that in place of `py`. Opening `index.html` directly with a `file://` URL will not load the JavaScript modules; the content and native links remain readable.

## Files

- `index.html` — original content, accessible chapter anchors, mobile chapter menu, product previews and contact links.
- `style.css` — existing visual worlds, responsive layouts, reveals, lighting and motion preferences.
- `app.js` — chapter observation, cached scroll geometry, navigation, reveal and pointer interactions.
- `atmospheres.js` — one shared, visibility-aware canvas clock for rain, coins and structured data signals.
- `assets/` — original resume PDF and a lightweight brand favicon.

## Refined experience

Native scrolling remains in control, with no wheel interception or section snap. Subtle boundary lighting and staggered reveals connect the original sky, gold, teal, experimental, research and future worlds. The chapter rail and mobile menu use real links, support keyboard navigation and indicate the current chapter. About links go to Background, and the brand returns to the hero.

The AI workflow is explained once in Philosophy. Existing project details, sample preview values, background, research and future plans are retained. Mockups are explicitly described as illustrative previews for assistive technology.

Canvas effects share one animation loop, paint at approximately 30 fps, cache dimensions, reduce counts and pixel density on smaller screens, and stop scheduling frames while off-screen, in a hidden tab or under reduced motion. CSS animation clocks also pause outside visible chapters. Scroll and pointer work is coalesced into animation frames; scroll uses cached section geometry.

Reduced motion disables decorative animations, parallax and smooth scrolling, including when the preference changes while the page is open. Content stays visible when JavaScript is unavailable. The resume remains the original supplied PDF.

## Deploy

Upload `index.html`, `style.css`, `app.js`, `atmospheres.js` and `assets/` to your static host, with `index.html` at the deployment root. Cloudflare Pages Direct Upload works with this structure. No dependencies, environment variables, API keys or build step are required.

See `QA.md` for the final verification record and its scope.
