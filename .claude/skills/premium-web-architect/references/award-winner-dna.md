# Award-Winner DNA — 15 Patterns for SOTD-Caliber Work

Apply ≥ 8 of these 15 patterns on every site. Document which 8+ you applied in the handoff.

---

## 1. Typographic Architecture
Type is the primary visual element, not decoration. The hero headline fills the screen. Use `clamp()` for fluid scaling:
```css
font-size: clamp(2.5rem, 8vw, 7rem);
letter-spacing: clamp(-0.04em, -0.02em, 0);
line-height: 0.92;
```
Hebrew condensed display + Latin numerals creates natural hierarchy without extra elements.

## 2. Cinematic Single Hero Moment
One orchestrated reveal — not scattered micro-interactions. The hero animates in over 800–1200ms with staggered children (title → subtitle → CTA → supporting element). Everything else on the page is instant or < 200ms. Use `animation-delay` to choreograph:
```css
.hero-title  { animation-delay: 0ms; }
.hero-sub    { animation-delay: 120ms; }
.hero-cta    { animation-delay: 240ms; }
```

## 3. Intentional Negative Space
Padding and whitespace are design decisions, not defaults. Sections breathe. The eye is guided. Use a spacing scale (`--space-2xs` through `--space-3xl`) and stick to it. Never use arbitrary pixel values for spacing.

## 4. Grid-Breaking Layouts
At least one section breaks the standard column grid — an oversized element that bleeds off-screen, a card that overlaps two rows, a sticky element that persists while content scrolls past. This signals craft.

## 5. Surface Atmosphere
Backgrounds are never flat solids unless the aesthetic demands brutalist rawness. Choose one: gradient mesh · noise texture overlay · geometric SVG pattern · grain filter · subtle scanlines. Applied at low opacity (3–8%), these add depth without visual noise.

## 6. Color Token Discipline
Every color is a CSS custom property. No hardcoded hex values in components. The full palette:
```css
--color-bg:       hsl(220 14% 6%);
--color-surface:  hsl(220 12% 10%);
--color-border:   hsl(220 10% 18%);
--color-text-1:   hsl(220 10% 96%);
--color-text-2:   hsl(220 8% 62%);
--color-accent:   hsl(24 90% 55%);
--color-accent-2: hsl(24 70% 40%);
--color-success:  hsl(145 60% 42%);
--color-error:    hsl(0 72% 52%);
```
Maximum 3 accent colors. The dominant palette + 1 accent + semantic (error/success).

## 7. Motion as Storytelling
Every animation has a narrative purpose: it reveals, connects, or confirms. Scroll-triggered counters for stats. Horizontal scroll for portfolio/gallery. Path-draw SVG for process steps. None of these for decoration — all of them for comprehension.

## 8. Micro-Interaction Precision
Hover states on cards (1–2px lift + shadow shift, 150ms ease-out). CTA button press state (2px scale-down, 80ms). Form focus state (border color shift + subtle glow, 100ms). These are invisible until noticed, then feel inevitable.

## 9. Iconography Consistency
One icon style across the entire site. Choices: Phosphor (recommended for RTL due to weight variety) · Lucide · custom SVG set. Never mix styles. Size icons at 1.25× the body font size for inline use, 2× for feature icons.

## 10. Data Visualization as Design
Numbers and stats become visual elements — large, centered, animated count-up on scroll entry. `font-variant-numeric: tabular-nums` for counting animations. The metric is the headline, not an afterthought.

## 11. Scroll-Driven Reveals
Cards, sections, and images fade/slide in as they enter viewport. Use `IntersectionObserver` with a 10% threshold. Each group staggers by 60ms. Keep transform distance small (24px max) — long reveals feel cheap.

## 12. Trust Architecture
Proof is organized, not scattered. Social proof → credentials → guarantees follow a consistent visual pattern. Logos use a single-row, greyscale strip. Testimonials show name + role (never fake names). Review counts are real or absent.

## 13. Responsive Craft
Mobile is not a scaled-down desktop — it's a different layout. Navigation collapses to bottom bar (not hamburger) on mobile for conversion-critical sites. Hero adapts to portrait reading. CTAs become full-width on mobile. Typography resets for thumb-reach zones.

## 14. 404 / Error State Design
These pages are designed with the same care as the homepage. They include: on-brand illustration or typographic treatment, a helpful next action, a search or navigation element, and the same Mandatory Quartet. An on-brand 404 page converts lost visitors. A generic one loses them.

## 15. Performance as Design
Fast feels premium. Skeleton loaders match the exact shape of content (not generic spinners). Images load progressively. State transitions are instant (<100ms) even when data is loading (optimistic UI pattern). The perception of speed is part of the aesthetic.
