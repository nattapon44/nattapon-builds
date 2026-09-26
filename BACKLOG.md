# NATTAPON BUILDS backlog

_Last updated: 2026-09-27_

## v1.1 — PRODUCTION COMPLETE

NATTAPON BUILDS v1.1 is released to production at:
https://nattapon-builds.pages.dev/

### Applied Statistics & Research Support — COMPLETE / PRODUCTION

Dedicated service page is live at `/research-support/`.

Implemented:
- Shared persisted TH/EN preference.
- BASE / STANDARD / PREMIUM++ packages.
- Package comparison table.
- Inferential-statistics add-on examples.
- SPSS, Microsoft Excel, and Python tool section.
- Research workflow and service conditions.
- Visible/copyable contact email.
- Responsive desktop/tablet/mobile layouts.
- Reduced-motion support and accessible semantic markup.
- Page metadata, canonical, Open Graph, structured data, and sitemap entry.
- Main portfolio Research CTA links to the service page.

Approved pricing:
- BASE: 1,000–1,499 บาท
- STANDARD: 1,500–1,999 บาท
- PREMIUM++: 2,000 บาท ++
- t-test: +300 บาท
- Chi-square: +300 บาท
- Correlation: +500 บาท
- One-way ANOVA: +500 บาท
- Two-way ANOVA: +700 บาท
- Multiple Regression: +800–1,000 บาท

### Coffee Support Experience — COMPLETE / PRODUCTION

Implemented:
- ฿50 / ฿100 / ฿200 / Custom support options.
- PromptPay QR assets:
  - assets/support/coffee-50.png
  - assets/support/coffee-100.png
  - assets/support/coffee-200.png
  - assets/support/coffee-custom.png
- QR assets must remain byte-for-byte unchanged.
- Modal inherits persisted TH/EN language.
- All four QR codes were manually tested successfully in a real Thai banking app.
- “I've supported” acknowledgement.
- Coffee-cup celebration renders ABOVE the QR/payment card.
- Celebration does not block interaction.
- Reduced-motion acknowledgement supported.
- No backend.
- No transaction verification.
- No transaction storage.
- No subscription / recurring payment.

## SEO / GOOGLE SEARCH CONSOLE — FOLLOW-UP IN PROGRESS

Current:
- Search Console property exists.
- Google verification preserved.
- robots.txt live.
- sitemap.xml live.
- Sitemap contains:
  - https://nattapon-builds.pages.dev/
  - https://nattapon-builds.pages.dev/research-support/
- sitemap.xml opens normally in browser.
- URL Inspection LIVE TEST can fetch sitemap successfully.
- Crawl allowed = Yes.
- Page fetch = Successful.
- Indexing allowed = Yes.
- Search Console currently still reports:
  “Couldn't fetch / Sitemap could not be read”
- Daily Request Indexing quota was reached during testing.

Next SEO work:
1. Do NOT modify the sitemap simply because Search Console temporarily reports Couldn't fetch.
2. Wait for Google to reprocess it.
3. Recheck Sitemaps and Pages later.
4. Inspect homepage and /research-support/ after indexing quota resets if necessary.
5. Use real Search Console query/impression/CTR data before changing titles/descriptions.
6. Monitor Core Web Vitals, HTTPS, indexing coverage, and crawl errors.

## v1.2 — NEXT PORTFOLIO PHASE

Do not perform major visual changes until v1.1 indexing settles.

Candidate work:
- Review actual Google Search Console performance data.
- Improve metadata/snippets only from actual search evidence.
- Clean up GitHub README/project documentation.
- Small UX/content polish only when a real gap is identified.
- Preserve v1.1 visual identity and architecture.

## FUTURE / DEFERRED

### International / Card Support via Stripe

Status: DEFERRED.

PromptPay remains the primary support method.

Do not add Stripe code unless this backlog item is explicitly reopened.

Possible future review:
- Stripe account readiness.
- Fees / settlement.
- Hosted Checkout vs Payment Links.
- Currency/international-card support.
- Privacy/data handling.
- Success/cancel state.
- Backend/webhook necessity.
