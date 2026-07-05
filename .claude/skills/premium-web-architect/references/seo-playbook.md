# SEO Playbook — Israeli Market, Aggressive Niche SEO

---

## KEYWORD ARCHITECTURE

### Primary Keyword Formula
`[שירות ספציפי] + [עיר/אזור]`

Examples:
- "רופא שיניים תל אביב"
- "עורך דין גירושין חיפה"
- "קבלן שיפוצים ירושלים"
- "מסעדה איטלקית רמת גן"

### Long-Tail Cluster (per primary keyword)
Build 4–6 long-tail variations around each primary:
- `[שירות] + [עיר] + [מחיר/עלות]` — "כמה עולה עקירת שן תל אביב"
- `[שירות] + [עיר] + [דחוף/מהיר]` — "רופא שיניים חירום תל אביב"
- `[שירות] + [עיר] + [המלצה/ביקורות]` — "רופא שיניים מומלץ תל אביב"
- `[שירות] + [עיר] + [קרוב אלי]` — "רופא שיניים קרוב אלי"
- `[שירות ספציפי מאוד] + [עיר]` — "טיפול שורש ללא כאב תל אביב"

### Keyword Placement Hierarchy
1. `<title>` — Primary keyword first, then brand, then city
2. `<h1>` — Primary keyword + outcome claim
3. First 100 words of body copy — Primary keyword natural mention
4. `<h2>` headings — Long-tail variants, questions people ask
5. `alt` text on hero image — Descriptive, includes location
6. URL slug — `/[service-in-hebrew]/` or `/[service]-[city]/`
7. Meta description — Primary keyword + benefit + CTA (no stuffing)

---

## TITLE TAG FORMULAS

Max 60 characters. Primary keyword first.

**Pattern A:** `[שירות] ב[עיר] | [USP קצר] — [שם מותג]`
- "רופא שיניים בתל אביב | ללא כאב, ללא המתנה — ד״ר [שם]"

**Pattern B:** `[שם מותג] — [שירות ראשי] ב[עיר]`
- "[שם קליניקה] — טיפולי שיניים בתל אביב"

**Pattern C (ניסוי A/B שווה):** `[תוצאה] + [שירות] ב[עיר]`
- "שיניים לבנות ב-60 דקות — טיפולי הלבנה בתל אביב"

---

## META DESCRIPTION FORMULA

Max 155 characters. Benefit + differentiator + CTA.

`[תוצאה/יתרון ספציפי]. [מה מייחד אותך]. [CTA עם urgency].`

Example:
"טיפול שורש ללא כאב תוך 60 דקות. רדמה ממוחשבת, תשלומים גמישים, 1,400 לקוחות מרוצים. קבע תור עוד היום."

---

## URL STRUCTURE

```
/                           → Homepage
/שירותים/                   → Services hub
/שירותים/[שם-שירות]/        → Individual service
/אודות/                     → About
/צור-קשר/                   → Contact
/בלוג/                      → Blog hub
/בלוג/[כותרת-מאמר]/         → Article
/accessibility/             → Accessibility statement (mandatory)
```

Rules:
- Hebrew slugs are valid and preferred for Hebrew sites
- Lowercase only, hyphens between words (not underscores)
- No numeric IDs in slugs — use descriptive words
- Keep slugs under 60 characters

---

## INTERNAL LINKING STRATEGY

Every page links to 3–5 other pages. Link with descriptive anchor text, never "לחץ כאן."

Pattern: Mention a related service in body copy, link to its page with the service name as anchor.

Example in copy: "בנוסף לטיפולי שורש, אנו מציעים [טיפולי הלבנה](/שירותים/הלבנת-שיניים/) מקצועיים."

Homepage should link to all primary service pages. Each service page links back to homepage and to 2–3 related services. Blog posts link to relevant service pages ("עוד על [שירות]").

---

## CORE WEB VITALS CHECKLIST

### LCP (Largest Contentful Paint) — Target < 1.5s

Critical fixes in order of impact:
1. `fetchpriority="high"` on LCP image
2. `<link rel="preload">` for LCP image in `<head>`
3. AVIF/WebP format with proper `<picture>` element
4. Explicit `width` and `height` on LCP image
5. No render-blocking CSS above the fold
6. Inline critical CSS (above-fold styles only) in `<style>` in `<head>`
7. Host fonts on same domain or use `font-display: swap`
8. CDN for all static assets

### INP (Interaction to Next Paint) — Target < 100ms
1. No heavy synchronous JS on main thread
2. Event handlers are lightweight; defer heavy work with `requestIdleCallback`
3. No forced layout/reflow in event handlers
4. Third-party scripts loaded with `defer` or `async`
5. Input handlers never block for > 50ms

### CLS (Cumulative Layout Shift) — Target < 0.05
1. Explicit `width`/`height` on every `<img>` and `<video>`
2. `font-display: swap` + `size-adjust` to prevent font-swap shift
3. Never inject content above existing content
4. Reserve space for ads/embeds before they load (`min-height`)
5. Avoid non-composited animations (use `transform`, not `top`/`left`)

---

## GOOGLE BUSINESS PROFILE (Remind Client)

The following must be set up by the client, not built into the site (but mention in handoff):

- Claim and verify Google Business Profile
- NAP consistency: Name/Address/Phone identical to website schema
- Business category matches Schema.org type
- Minimum 10 photos uploaded (interior, exterior, team, products)
- Respond to all reviews within 48 hours
- Use Posts feature weekly for offers and updates
- Enable messaging (WhatsApp integration available)

---

## OG / SOCIAL META

```html
<!-- Open Graph -->
<meta property="og:type"        content="website">
<meta property="og:locale"      content="he_IL">
<meta property="og:title"       content="[same as <title> or shorter]">
<meta property="og:description" content="[same as meta description]">
<meta property="og:url"         content="https://[domain]/[page]">
<meta property="og:image"       content="https://[domain]/og-[page].jpg">
<meta property="og:image:width"  content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt"   content="[description of OG image]">
<meta property="og:site_name"   content="[שם העסק]">

<!-- Twitter/X Card -->
<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:title"       content="[title]">
<meta name="twitter:description" content="[description]">
<meta name="twitter:image"       content="https://[domain]/og-[page].jpg">
```

OG image specs: 1200×630px, JPEG or PNG, include brand name and key message as text overlay, test at https://developers.facebook.com/tools/debug/.

---

## ROBOTS.TXT + SITEMAP

```txt
# robots.txt
User-agent: *
Allow: /

Disallow: /api/
Disallow: /admin/
Disallow: /_next/

Sitemap: https://[domain]/sitemap.xml
```

Sitemap must include:
- All public pages with `<lastmod>`, `<changefreq>`, `<priority>`
- Homepage priority: 1.0
- Service pages priority: 0.9
- Blog posts priority: 0.7
- Static pages (about, contact): 0.6
- Exclude: /accessibility, /privacy (they exist but don't need indexing priority)

In Next.js, use `next-sitemap` package to auto-generate.
