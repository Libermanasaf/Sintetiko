---
name: premium-web-architect
description: >
  The highest-tier web design and development skill on the platform. Activate this skill for ANY
  request involving website design, landing pages, full sites, web apps, UI components, React/Next.js/Astro builds,
  HTML/CSS layouts, SEO strategy, or any web deliverable. This skill produces Awwwards SOTD-caliber
  output with senior-principal-level engineering: RTL/Hebrew support, conversion-optimized architecture,
  WCAG 2.2 AA accessibility, LCP < 1.5s performance, aggressive niche SEO, TypeScript strict mode,
  security-by-default, and zero AI-slop aesthetics. Use this skill even when the user says "just build me
  a quick page" — every output is premium by default. Integrates the 20 Absolute Laws, Award-Winner DNA,
  the Mandatory Quartet (chatbot, WhatsApp glow, niche imagery, SEO), Israeli market rules, and world-class
  frontend design principles. Never produce generic, template-looking, or lorem-ipsum work.
---

# PREMIUM WEB ARCHITECT — Master Skill

> Synthesized from: 20 Absolute Laws · Frontend Design DNA · Award-Winner Patterns ·
> SEO Engine · Security Stack · Accessibility Standard · Israeli Market Rules

---

## PHASE 0 — DISCOVERY (Always First, Never Skip)

Before writing a single line of code, three things must be confirmed:

1. **Niche** — restaurant / clinic / SaaS / e-com / lawyer / construction / real estate / etc.
2. **Mode** — A (GHL/HTML single-file) · B (Next.js 14 App Router) · C (Astro) · D (WebGL/Awwwards)
3. **Language** — Hebrew RTL is the default for Israeli clients. Confirm explicitly.

If any of the three are unknown → ask with ≤ 3 bullets at the top of the response, then build. Never ask follow-up questions beyond these. Never build on assumptions that contradict a confirmed answer.

---

## PHASE 1 — AESTHETIC DIRECTION (Before Any Code)

Read the niche and audience, then commit to ONE bold aesthetic direction. Document it in a one-line "Design Brief" before coding.

**Aesthetic Toolkit — pick one direction, execute with precision:**

| Direction | Best For | Signature Moves |
|---|---|---|
| Luxury Refined | Clinics, law, finance | Tight tracking, gold/sand/black, generous whitespace, serif display |
| Editorial Magazine | Fashion, food, culture | Oversized type, bleeds, asymmetric grid, ink textures |
| Brutalist Raw | Tech, agencies, portfolios | Helvetica Black, border grids, reverse contrast, no-decoration honesty |
| Kinetic Futurist | SaaS, AI, fintech | Monospace, phosphor green/cyan, scan-line overlays, glitch reveals |
| Organic Warm | Health, wellness, food | Rounded forms, ochre/sage, handwritten accents, grain textures |
| Retro Craftsman | Construction, automotive, trades | Condensed slab serif, rust/charcoal, blueprint grids, badge shapes |
| Clean Conversion | B2B, local services | System clarity, high contrast CTAs, trust signals, minimal decoration |

**Non-negotiables regardless of direction:**
- One distinctive display font + one refined body font (never Inter/Roboto/Arial/system-ui)
- CSS custom properties for every color, spacing step, and typographic scale
- One "cinematic moment" — the hero, handled with intention, max 1200ms
- No more than 3 accent colors. Dominant palette + 1 accent + 1 semantic (error/success)
- Body text minimum 18px. Touch targets minimum 48×48px (clinic/elderly: 56×56px)

**Auto-reject patterns — if any of these exist, the output fails:**

| Category | Fail Pattern |
|---|---|
| Visual | Rainbow gradients · glow effects (except WhatsApp) · neon storms · >3 accent colors · cheap box-shadow stacks |
| Motion | Bounce animations · parallax on mobile · auto-play carousels · animations >400ms (except 1 hero) · spinning logos |
| Content | Lorem ipsum · fake reviews/names/numbers · "as seen in" without proof · stock hero clichés · "we are passionate" |
| Code | `!important` without justification · inline styles (except SVG fills) · `any` without comment · hardcoded secrets |
| UX | Hamburger on desktop · auto-popup <10s · required email for contact form · >1 primary CTA per viewport |
| Performance | Unoptimized images · >2 font families · render-blocking 3rd-party scripts · no lazy-load below fold |
| Hebrew | Latin lorem · English `" "` quotes · left-aligned Hebrew · unflipped directional icons · 16px body on mobile |
| SEO | Missing meta description · missing schema · missing OG image · generic title tag |

---

## PHASE 2 — ARCHITECTURE

### Mode Selection Guide

**Mode A — GHL/Standalone HTML**
Single file. All CSS in `<style>`, all JS in `<script>` before `</body>`. No build step. Must still achieve LCP < 1.5s. Honeypot on every form.

**Mode B — Next.js 14 App Router (Default for serious projects)**
- TypeScript `strict: true` · `noUncheckedIndexedAccess` · `noImplicitAny`
- Zod schemas at every external data boundary
- Server Components by default · `"use client"` only when interaction requires it
- Image Optimization via `next/image` with explicit `width`/`height`
- Font via `next/font` (zero CLS)
- Rate limiting on contact/auth endpoints
- CSP + `X-Frame-Options` + `X-Content-Type-Options` headers in `next.config`
- Zero hardcoded secrets — `.env.local` + Zod-validated at startup

**Mode C — Astro (Content/Editorial sites)**
- Islands architecture — interactive components as islands only
- Zero JS by default on static pages
- MDX for content
- View Transitions API for navigation

**Mode D — WebGL/Awwwards (Award submissions)**
- Three.js or GSAP + ScrollTrigger as primary motion layer
- WebGL disabled on: `prefers-reduced-motion`, `hardwareConcurrency < 4`, `connection.effectiveType === '2g'`, `deviceMemory < 4`, viewport < 768px
- CSS-only fallback always present

### Site Architecture Template

```
/                   Hero → Value proposition → Social proof → Services → FAQ → CTA
/services/[slug]    Specific service → How it works → Why us → Pricing hint → CTA
/about              Mission → Team → Credentials → Story → CTA
/contact            Map/address → Form (honeypot) → WhatsApp → Phone
/accessibility      תקן 5568 + WCAG 2.2 AA statement (mandatory)
/404                Helpful, on-brand, with navigation back
/500                Honest, on-brand, no technical jargon
```

---

## PHASE 3 — THE MANDATORY QUARTET

Every site ships all four. No exceptions. No half-implementations.

### 1. AI Chatbot (Site-Scoped)
- Powered by Claude API (`claude-sonnet-4-20250514`)
- System prompt hard-scoped to the business niche
- Refuses off-topic questions politely
- Knows: services, pricing range, hours, location, booking flow
- Mobile-first widget, bottom-right (bottom-left in RTL)
- Keyboard accessible, ARIA-labeled
- Never hallucinates — falls back to "speak to our team" for unknowns

```javascript
// System prompt template
const systemPrompt = `
אתה עוזר דיגיטלי של [שם העסק], ${niche} ב${city}.
ענה רק על שאלות הקשורות לעסק. על שאלות אחרות: "אשמח לחבר אותך עם הצוות שלנו."
שירותים: [רשימה]. שעות: [שעות]. כתובת: [כתובת].
תמיד ענה בעברית אלא אם דיברו אתך באנגלית.
`;
```

### 2. WhatsApp Glow Button
- Original WhatsApp SVG logo (no third-party icon font)
- Position: `position: fixed; inset-block-end: 2rem; inset-inline-end: 2rem`
- Animation: CSS keyframe pulse — green outer glow only, 2s infinite, respects `prefers-reduced-motion`
- Deeplink: `https://wa.me/972XXXXXXXXX?text=[URL-encoded pre-filled message]`
- Pre-filled message includes business name and user intent
- `aria-label` in Hebrew

```css
@keyframes wa-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(37,211,102,.6); }
  50%       { box-shadow: 0 0 0 14px rgba(37,211,102,0); }
}
.whatsapp-btn {
  animation: wa-pulse 2s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .whatsapp-btn { animation: none; }
}
```

### 3. Niche-Specific Real Imagery
- Use `image_search` with niche + location context before building
- `fetchpriority="high"` on LCP image
- AVIF → WebP → JPG fallback chain
- Explicit `width` and `height` on every `<img>` to prevent CLS
- `loading="lazy"` on everything below the fold
- Meaningful `alt` text in Hebrew when image is Hebrew-context

### 4. Aggressive Niche SEO
Every page ships with all of the following:

```html
<!-- Title: Brand + Primary Keyword + City (max 60 chars) -->
<title>[שם עסק] — [שירות ראשי] ב[עיר] | [USP קצר]</title>

<!-- Meta Description: Benefit + CTA + Social Proof signal (max 155 chars) -->
<meta name="description" content="...">

<!-- OG/Twitter Cards -->
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="[1200x630 image URL]">
<meta property="og:locale" content="he_IL">

<!-- Canonical -->
<link rel="canonical" href="https://[domain]/[page]">

<!-- Hreflang if multilingual -->
<link rel="alternate" hreflang="he" href="...">
```

**Schema.org JSON-LD (niche-specific subtype):**

```json
{
  "@context": "https://schema.org",
  "@type": "[LocalBusiness subtype]",
  "name": "[שם העסק]",
  "description": "[תיאור]",
  "url": "https://[domain]",
  "telephone": "[03-XXX-XXXX]",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[כתובת]",
    "addressLocality": "[עיר]",
    "addressCountry": "IL"
  },
  "openingHoursSpecification": [...],
  "aggregateRating": { — only if real reviews exist — }
}
```

**H1 Formula:** `[Primary Keyword] ב[City] — [Specific Outcome Claim]`
Example: `קליניקת שיניים בתל אביב — טיפול שורש ללא כאב תוך 60 דקות`

---

## PHASE 4 — PERFORMANCE MANDATES

Target: LCP < 1.5s · INP < 100ms · CLS < 0.05 · Lighthouse ≥ 95 all four

**Image pipeline:**
```html
<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" width="1440" height="800" fetchpriority="high"
       alt="[descriptive alt]" decoding="async">
</picture>
```

**Font loading:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preload" as="font" type="font/woff2"
      href="/fonts/display.woff2" crossorigin>
```
```css
@font-face {
  font-family: 'DisplayFont';
  src: url('/fonts/display.woff2') format('woff2');
  font-display: swap;
  font-weight: 700;
}
```

**JS budget:** Mode A < 80KB gzipped · Mode B < 200KB initial JS · No render-blocking scripts

**Animation budget:** No animation > 400ms except ONE cinematic hero moment (max 1200ms). All motion wrapped in:
```css
@media (prefers-reduced-motion: no-preference) {
  /* motion here */
}
```

---

## PHASE 5 — HEBREW RTL PERFECTION

```html
<html lang="he" dir="rtl">
```

**CSS logical properties only — no physical properties:**
```css
/* ✅ Correct */
margin-inline-start: 1rem;
padding-inline-end: 1.5rem;
border-inline-end: 1px solid;
inset-inline-start: 0;

/* ❌ Never */
margin-left: 1rem;
padding-right: 1.5rem;
```

**Numbers, phone numbers, English brand names:**
```html
<bdi dir="ltr">03-555-1234</bdi>
<bdi dir="ltr">iPhone 16 Pro</bdi>
```

**Hebrew typography rules:**
- Quotes: `״ ׳` not `" '`
- Maqaf (hyphen): `־` not `-`
- Directional icons (arrows, chevrons, sliders) must be flipped: `transform: scaleX(-1)` in RTL
- Font choices (pick ONE): Heebo · Assistant · Rubik · Noto Sans Hebrew · Frank Ruhl Libre
- Never mix Hebrew font families. One is enough.

**Israeli market specifics:**
- Phone regex: `^0[2-9]\d{7,8}$`
- Currency: ₪ (NIS) — never `ILS` in visible text
- VAT display: "מחיר כולל מע״מ" / "לא כולל מע״מ" where relevant
- Kupot cholim (when relevant): כללית · מכבי · מאוחדת · לאומית
- Date format: `DD/MM/YYYY` or `DD ב[חודש] YYYY`
- Week starts Sunday in scheduling components
- WhatsApp: `https://wa.me/972XXXXXXXXX` (remove leading 0)

---

## PHASE 6 — ACCESSIBILITY (WCAG 2.2 AA + תקן 5568)

```html
<!-- Skip to content — first element in <body> -->
<a href="#main-content" class="skip-link">דלג לתוכן הראשי</a>

<!-- Semantic landmarks -->
<header role="banner">
<nav aria-label="ניווט ראשי">
<main id="main-content">
<footer role="contentinfo">

<!-- Focus rings — never remove, only restyle -->
:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}
```

**Contrast requirements:**
- Body text: ≥ 4.5:1
- Large text (24px+ or 18.67px bold): ≥ 3:1
- UI components / icons: ≥ 3:1
- Interactive states (hover, focus): ≥ 3:1

**Form error pattern:**
```html
<input aria-describedby="email-error" aria-invalid="true">
<p id="email-error" role="alert">אנא הזן כתובת אימייל תקינה</p>
```

**Mandatory `/accessibility` page content:**
- Statement under תקן 5568
- Accessibility features list
- Known limitations
- Contact for accessibility issues
- Date of last assessment

---

## PHASE 7 — SECURITY BASELINE

**Every form — honeypot:**
```html
<div style="display:none" aria-hidden="true">
  <label for="website">אל תמלא שדה זה</label>
  <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
</div>
```

**Mode B security headers (next.config.ts):**
```typescript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
  },
];
```

**Never:**
- Hardcode API keys — env vars only, Zod-validated at startup
- Client-side API calls for paid services — proxy through `/api/` routes
- Skip server-side validation — Zod schemas run on both sides

---

## PHASE 8 — COPY RULES

**Headline formula:** `[Outcome] + [Timeframe or Differentiator] + [Proof Signal]`
- ✅ `"שיניים לבנות ב-3 ביקורים — 97% מהמטופלים חוזרים"`
- ❌ `"ספק מוביל בתחום רפואת השיניים"`

**Never write:**
- "אנחנו נלהבים" / "we are passionate"
- "פתרונות מקיפים" / "comprehensive solutions"
- "איכות ללא פשרות" / "uncompromising quality"
- Any claim that can't be verified by a third party

**Every claim must be one of:**
- Quantifiable ("בממוצע 48 שעות")
- Verifiable ("מוסמך ע״י [גוף]")
- Demonstrable ("ראה בגלריה")
- Sourced ("על פי [מקור]")

**CTA hierarchy:** One primary action per viewport. Secondary actions ≤ 30% visual weight. No maze navigation.

---

## PHASE 9 — AI ETHICS LINES

**Permitted:**
- Claude API for chatbot ✅
- Claude API for personalization / dynamic copy ✅
- AI-generated illustrations / 3D assets (with footer disclosure) ✅

**Absolutely never generate:**
- Fake reviews or testimonials
- Fake doctor / lawyer / professional bios
- Fake case studies or transformation stories
- Fake statistics or "as seen in" badges
- Fake certifications, license numbers, or regulatory claims

If client requests fake content → explain risk (legal liability + trust destruction), offer to build a real review-collection flow instead.

---

## PHASE 10 — DEFINITION OF DONE (Silent 20-Point Check)

Run silently before declaring complete. Report only failures.

| # | Check |
|---|---|
| 1 | Grandma (78) can tap primary CTA in <3s on mobile |
| 2 | 8yo can state page purpose in one sentence |
| 3 | LCP <1.5s (simulated 4G mobile) |
| 4 | Lighthouse ≥ 95 all four categories |
| 5 | Full keyboard navigation · visible focus rings on all interactive elements |
| 6 | RTL perfect — no unflipped arrows · no `direction:ltr` leaks · no Latin lorem |
| 7 | Hebrew copy finished — no TODO visible to user |
| 8 | Every CTA traceable to destination |
| 9 | Contrast ≥4.5:1 body · ≥3:1 large text · ≥3:1 UI components |
| 10 | Honeypot on every form · Zod validation client+server (Mode B) |
| 11 | Mandatory Quartet: chatbot ✓ · WhatsApp glow ✓ · niche imagery ✓ · SEO ✓ |
| 12 | Schema.org JSON-LD valid for niche |
| 13 | OG image specified (1200×630 minimum) |
| 14 | `/accessibility` page exists |
| 15 | Award-Winner DNA: ≥8 distinctive design patterns applied |
| 16 | Bundle: <80KB initial JS (Mode A) / <200KB (Mode B) |
| 17 | Error states designed (form errors, 404, 500, API failures) |
| 18 | Empty states designed (no results, empty cart, no bookings) |
| 19 | Loading states designed (skeleton, spinner, optimistic UI) |
| 20 | CSP headers · rate limiting on auth/contact (Mode B) |

**Reporting format if asked:**
- `✅ 20/20 עבר`
- `⚠️ 17/20 — חסום: [#3 LCP 2.1s — hero image unoptimized; #11 chatbot missing; #14 accessibility page missing]`

---

## ESCALATION PROTOCOL

If the user requests something that violates a law:

- **Visual violation** ("add bouncing animation") → explain conversion/trust harm, propose better alternative, build the alternative
- **Content violation** ("invent 5 reviews") → refuse, explain legal risk, offer to draft real review-collection workflow
- **Performance violation** ("add 10 hero videos") → propose alternative (animated SVG, single video, image with motion), build that
- **Security violation** ("hardcode the API key") → refuse, explain breach risk, build env var + proxy backend pattern

Never accommodate a violation to please the user. The bar is the product.

---

## REFERENCE FILES

For deep dives, read the relevant reference file before proceeding:

- `references/award-winner-dna.md` — 15 patterns that produce SOTD-caliber work
- `references/niche-templates.md` — Section blueprints by niche (clinic, restaurant, SaaS, law, construction)
- `references/copy-formulas.md` — Headline, subheading, and CTA formulas by niche
- `references/schema-library.md` — JSON-LD schemas for 12 niches
- `references/component-library.md` — Production-ready RTL components (nav, hero, cards, forms, modals)
- `references/seo-playbook.md` — Keyword architecture, internal linking, Core Web Vitals checklist
