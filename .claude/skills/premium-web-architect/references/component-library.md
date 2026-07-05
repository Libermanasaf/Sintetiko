# Component Library — Production-Ready RTL Components

All components use CSS logical properties, respect `prefers-reduced-motion`, and meet WCAG 2.2 AA.
Copy and adapt as needed. Never use as-is without niche-specific styling.

---

## NAV — Desktop + Mobile (RTL)

```html
<a href="#main-content" class="skip-link">דלג לתוכן הראשי</a>

<header class="site-header" role="banner">
  <nav class="nav" aria-label="ניווט ראשי">
    <a class="nav__logo" href="/" aria-label="[שם העסק] — דף הבית">
      <!-- Logo SVG or img -->
    </a>

    <ul class="nav__links" role="list">
      <li><a href="#services">שירותים</a></li>
      <li><a href="#about">אודות</a></li>
      <li><a href="#contact">צור קשר</a></li>
    </ul>

    <a class="btn btn--primary" href="#contact">קבל הצעת מחיר</a>

    <!-- Mobile toggle — bottom bar, not hamburger -->
    <button class="nav__mobile-toggle" aria-expanded="false"
            aria-controls="mobile-nav" aria-label="פתח תפריט">
      <span></span><span></span><span></span>
    </button>
  </nav>
</header>
```

```css
.skip-link {
  position: absolute;
  inset-block-start: -100%;
  inset-inline-start: 1rem;
  padding: 0.5rem 1rem;
  background: var(--color-accent);
  color: var(--color-bg);
  font-weight: 700;
  border-radius: 0 0 4px 4px;
  z-index: 9999;
  transition: inset-block-start 0.2s;
}
.skip-link:focus { inset-block-start: 0; }

.site-header {
  position: sticky;
  inset-block-start: 0;
  z-index: 100;
  background: var(--color-bg);
  border-block-end: 1px solid var(--color-border);
}

.nav {
  display: flex;
  align-items: center;
  gap: 2rem;
  max-inline-size: var(--content-width);
  margin-inline: auto;
  padding-inline: var(--space-md);
  padding-block: var(--space-sm);
}

.nav__links {
  display: flex;
  gap: 1.5rem;
  list-style: none;
  margin-inline-start: auto;
  padding: 0;
}

/* Focus ring — never remove */
:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: 3px;
}
```

---

## HERO — Cinematic Single Moment

```html
<section class="hero" aria-labelledby="hero-title">
  <div class="hero__content">
    <p class="hero__eyebrow">[תגית קצרה]</p>
    <h1 class="hero__title" id="hero-title">
      [כותרת ראשית<br>על שתי שורות]
    </h1>
    <p class="hero__sub">[תת-כותרת ספציפית שמסלקת את ההתנגדות הגדולה ביותר]</p>
    <div class="hero__actions">
      <a class="btn btn--primary" href="#contact">[CTA ראשי]</a>
      <a class="btn btn--ghost" href="#services">[CTA משני]</a>
    </div>
  </div>

  <div class="hero__media">
    <picture>
      <source srcset="/hero.avif" type="image/avif">
      <source srcset="/hero.webp" type="image/webp">
      <img src="/hero.jpg" width="800" height="600"
           alt="[תיאור ספציפי]" fetchpriority="high" decoding="async">
    </picture>
  </div>
</section>
```

```css
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
  align-items: center;
  min-block-size: 90svh;
  padding-inline: var(--space-md);
  padding-block: var(--space-xl);
}

/* Cinematic reveal */
@media (prefers-reduced-motion: no-preference) {
  .hero__eyebrow { animation: fade-up 0.6s ease both 0ms; }
  .hero__title   { animation: fade-up 0.7s ease both 80ms; }
  .hero__sub     { animation: fade-up 0.7s ease both 160ms; }
  .hero__actions { animation: fade-up 0.7s ease both 240ms; }
  .hero__media   { animation: fade-in 0.9s ease both 320ms; }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: none; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.hero__title {
  font-size: clamp(2.5rem, 7vw, 6rem);
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: var(--color-text-1);
}
```

---

## CONTACT FORM (With Honeypot, Accessible)

```html
<form class="contact-form" novalidate aria-label="טופס יצירת קשר"
      action="/api/contact" method="POST">

  <!-- Honeypot — hidden from humans, visible to bots -->
  <div style="display:none" aria-hidden="true">
    <label for="website">אל תמלא</label>
    <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
  </div>

  <div class="form-field">
    <label for="name">שם מלא *</label>
    <input type="text" id="name" name="name" required
           autocomplete="name" aria-required="true"
           aria-describedby="name-error">
    <p id="name-error" class="form-error" role="alert" hidden>
      אנא הזן את שמך המלא
    </p>
  </div>

  <div class="form-field">
    <label for="phone">טלפון *</label>
    <input type="tel" id="phone" name="phone" required
           pattern="^0[2-9]\d{7,8}$" dir="ltr"
           autocomplete="tel" aria-required="true"
           aria-describedby="phone-error"
           placeholder="05X-XXX-XXXX">
    <p id="phone-error" class="form-error" role="alert" hidden>
      אנא הזן מספר טלפון ישראלי תקין
    </p>
  </div>

  <div class="form-field">
    <label for="message">הודעה</label>
    <textarea id="message" name="message" rows="4"
              autocomplete="off"></textarea>
  </div>

  <button type="submit" class="btn btn--primary">
    <span class="btn__text">שלח פנייה</span>
    <span class="btn__loading" hidden aria-live="polite">שולח...</span>
  </button>
</form>
```

---

## WHATSAPP GLOW BUTTON

```html
<a class="whatsapp-btn"
   href="https://wa.me/972XXXXXXXXX?text=[URL-encoded message]"
   target="_blank" rel="noopener noreferrer"
   aria-label="שלח הודעה בוואטסאפ ל[שם העסק]">
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
       width="28" height="28" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
</a>
```

```css
.whatsapp-btn {
  position: fixed;
  inset-block-end: 2rem;
  inset-inline-end: 2rem;
  z-index: 500;
  display: grid;
  place-items: center;
  inline-size: 60px;
  block-size: 60px;
  border-radius: 50%;
  background: #25D366;
  color: #fff;
  text-decoration: none;
  box-shadow: 0 4px 20px rgba(37,211,102,.4);
}

@media (prefers-reduced-motion: no-preference) {
  .whatsapp-btn {
    animation: wa-pulse 2s ease-in-out infinite;
  }
}

@keyframes wa-pulse {
  0%, 100% { box-shadow: 0 4px 20px rgba(37,211,102,.4), 0 0 0 0 rgba(37,211,102,.6); }
  50%       { box-shadow: 0 4px 20px rgba(37,211,102,.4), 0 0 0 14px rgba(37,211,102,0); }
}

.whatsapp-btn:focus-visible {
  outline: 3px solid var(--color-focus, #fff);
  outline-offset: 4px;
}
```

---

## AI CHATBOT WIDGET (Claude-Powered)

```html
<div class="chatbot-widget" aria-label="עוזר דיגיטלי">
  <button class="chatbot-toggle" aria-expanded="false"
          aria-controls="chatbot-panel" aria-label="פתח שיחה עם העוזר שלנו">
    💬
  </button>

  <div class="chatbot-panel" id="chatbot-panel" role="dialog"
       aria-modal="true" aria-labelledby="chatbot-title" hidden>
    <div class="chatbot-header">
      <h2 id="chatbot-title" class="chatbot-title">שאל אותנו</h2>
      <button class="chatbot-close" aria-label="סגור שיחה">✕</button>
    </div>
    <div class="chatbot-messages" role="log" aria-live="polite" aria-atomic="false">
      <!-- Messages injected here -->
    </div>
    <div class="chatbot-input-row">
      <input type="text" class="chatbot-input"
             placeholder="הקלד שאלה..." aria-label="הקלד שאלה">
      <button class="chatbot-send" aria-label="שלח">→</button>
    </div>
  </div>
</div>
```

```javascript
// Claude API call — server-side proxy recommended
async function askClaude(message, history) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history })
  });
  const data = await response.json();
  return data.reply;
}

// /api/chat.ts (Next.js Route Handler)
const SYSTEM = `
אתה עוזר דיגיטלי של [שם העסק], [תחום] ב[עיר].
ענה רק על שאלות הקשורות לעסק.
שירותים: [רשימה]. שעות: [שעות]. טלפון: [מספר].
על שאלות שאינן בתחום: "אשמח לחבר אותך עם הצוות שלנו ישירות."
ענה תמיד בעברית.
`;
```

---

## STAT COUNTER (Animated on Scroll)

```html
<div class="stat-grid" role="list">
  <div class="stat" role="listitem">
    <span class="stat__number" data-target="1400" aria-label="1,400">0</span>
    <span class="stat__label">לקוחות מרוצים</span>
  </div>
  <div class="stat" role="listitem">
    <span class="stat__number" data-target="15" aria-label="15">0</span>
    <span class="stat__label">שנות ניסיון</span>
  </div>
</div>
```

```javascript
const counters = document.querySelectorAll('.stat__number');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.target);
    const duration = 1500;
    const start = performance.now();

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      el.textContent = Math.round(ease * target).toLocaleString('he-IL');
      if (progress < 1) requestAnimationFrame(update);
    }

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = target.toLocaleString('he-IL');
    } else {
      requestAnimationFrame(update);
    }
    observer.unobserve(el);
  });
}, { threshold: 0.5 });

counters.forEach(c => observer.observe(c));
```

---

## SKELETON LOADER (Matches Content Shape)

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 25%,
    var(--color-border) 50%,
    var(--color-surface) 75%
  );
  background-size: 200% 100%;
  border-radius: 4px;
}

@media (prefers-reduced-motion: no-preference) {
  .skeleton {
    animation: shimmer 1.5s ease-in-out infinite;
  }
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}

/* Usage — mirror exact content dimensions */
.card-skeleton {
  block-size: 280px;
  inline-size: 100%;
}
.text-skeleton--title { block-size: 2rem; inline-size: 70%; }
.text-skeleton--body  { block-size: 1rem; inline-size: 100%; }
```
