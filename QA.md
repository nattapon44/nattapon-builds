# Verification — NATTAPON BUILDS v2

Verified locally on 12 September 2026. The approved visual direction and all project, research, background and future-plan details remain in place.

## Browser review

| Viewport | Result |
| --- | --- |
| 390 × 844 | Reviewed all chapters; forecast, finance and ranking previews fit; experiment titles fit; mobile menu works. |
| 430 × 932 | Hero spacing and typography checked; full-document content overflow audit passed. |
| 768 × 1024 | Single-column layout and Future Projects rows checked; corrected status placement verified. |
| 1024 × 768 | Intermediate two-column project layout checked; titles and mockups fit. |
| 1440 × 900 | Complete chapter-by-chapter desktop visual review. |

No horizontal document overflow or clipped text/preview containers was detected at these widths. Browser checks used the Codex Chromium preview with viewport emulation, not physical mobile devices or Safari/Firefox.

## Behavior

- Native section links preserve URL fragments and focus their destinations. About reaches Background; the brand reaches the top of the hero.
- Skip to content appears on keyboard focus; Enter then Tab moves to Explore the builds.
- The mobile Chapters menu closes on selection and Escape; Escape restores focus to its summary.
- Chapter rail targets are 26 × 26 CSS pixels; the mobile chapter links are at least 44 pixels high.
- Desktop pointer movement updates project tilt. Touch-size layouts remove pointer effects and parallax.
- Page progress reaches `scaleX(1)` at the bottom; the active chapter indicator follows scrolling.
- Inspected off-screen CSS decorations report a paused animation state.
- Browser console contained no application errors or warnings during the final review.

## Motion and fallback verification

The isolated canvas lifecycle checks exercised all three renderers, one shared RAF, the 30 fps drawing gate, off-screen/hidden-tab/reduced-motion cancellation, preference resume, lightning cancellation, resize, pixel-density caps and cleanup.

A temporary local preview fixture forced the production reduced-motion CSS branch and matching JavaScript preference. All content remained visible, scroll behavior became `auto`, canvases were hidden and inspected decorative animations were `none`. This fixture tested the actual production rules without changing the operating system preference.

A second fixture omitted JavaScript entirely: all 11 chapters remained visible. The header remains legible and the inactive chapter indicator stays hidden. Fixtures live outside the project and are not deployment files.

## Links and static checks

- SKYCAST, POCKETFLOW, LocalGov Rank Tracker and Am I Unlucky returned HTTP 200.
- DOI `10.55766/sujst12636` returned HTTP 200 and resolved to the journal article.
- The original one-page resume PDF is present and served as `application/pdf` with HTTP 200.
- All local fragment targets exist; IDs are unique.
- Both JavaScript modules passed `node --check`; CSS syntax and controller hooks were reviewed.

External link checks establish reachability, not a full audit of the linked products. The contact address was preserved; no email was sent.

## Final polish after initial implementation

Corrected tablet status-label placement, versioned stylesheet URLs to prevent stale styles, improved chapter-indicator contrast across section boundaries, and made the header/indicator behave correctly without JavaScript. Removed the original full-screen sweep and section snap; no scrolling input is intercepted.
