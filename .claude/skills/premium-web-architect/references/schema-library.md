# Schema Library — JSON-LD by Niche

Copy the relevant schema, fill in the placeholders, and embed in a `<script type="application/ld+json">` tag in the `<head>`. Validate at https://validator.schema.org before shipping.

---

## LocalBusiness (Base — All Niches)
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "[שם העסק]",
  "description": "[תיאור קצר של העסק]",
  "url": "https://[domain]",
  "telephone": "[03-XXX-XXXX]",
  "email": "[email@domain.com]",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[רחוב ומספר]",
    "addressLocality": "[עיר]",
    "addressRegion": "[מחוז]",
    "postalCode": "[מיקוד]",
    "addressCountry": "IL"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "[XX.XXXX]",
    "longitude": "[XX.XXXX]"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      "opens": "09:00",
      "closes": "18:00"
    }
  ],
  "image": "https://[domain]/og-image.jpg",
  "priceRange": "₪₪",
  "currenciesAccepted": "ILS",
  "paymentAccepted": "Cash, Credit Card"
}
```

---

## Dentist / Medical Clinic
```json
{
  "@context": "https://schema.org",
  "@type": "Dentist",
  "name": "[שם הקליניקה]",
  "medicalSpecialty": "Dentistry",
  "description": "[תיאור]",
  "url": "https://[domain]",
  "telephone": "[03-XXX-XXXX]",
  "address": { "— same as base —" },
  "physician": [
    {
      "@type": "Physician",
      "name": "[ד״ר שם]",
      "medicalSpecialty": "[התמחות]"
    }
  ],
  "availableService": [
    { "@type": "MedicalProcedure", "name": "[שם הטיפול]" }
  ],
  "hasMap": "https://maps.google.com/?q=[address]"
}
```

---

## Restaurant
```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "[שם המסעדה]",
  "cuisine": "[סוג מטבח]",
  "description": "[תיאור]",
  "url": "https://[domain]",
  "telephone": "[03-XXX-XXXX]",
  "address": { "— same as base —" },
  "servesCuisine": "[סוג מטבח]",
  "priceRange": "₪₪₪",
  "hasMenu": "https://[domain]/menu",
  "acceptsReservations": "true",
  "openingHoursSpecification": [{ "—" }],
  "image": ["https://[domain]/food-1.jpg", "https://[domain]/interior.jpg"]
}
```

---

## Law Firm
```json
{
  "@context": "https://schema.org",
  "@type": "LegalService",
  "name": "[שם המשרד]",
  "description": "[תחומי עיסוק]",
  "url": "https://[domain]",
  "telephone": "[03-XXX-XXXX]",
  "address": { "— same as base —" },
  "areaServed": {
    "@type": "GeoCircle",
    "geoMidpoint": {
      "@type": "GeoCoordinates",
      "latitude": "[XX.XXXX]",
      "longitude": "[XX.XXXX]"
    },
    "geoRadius": "50000"
  },
  "knowsAbout": ["[תחום משפטי 1]", "[תחום משפטי 2]"],
  "hasCredential": {
    "@type": "EducationalOccupationalCredential",
    "credentialCategory": "Israeli Bar Association License",
    "recognizedBy": { "@type": "Organization", "name": "לשכת עורכי הדין בישראל" }
  }
}
```

---

## Construction / Contractor
```json
{
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "name": "[שם הקבלן / החברה]",
  "description": "[תיאור שירותים]",
  "url": "https://[domain]",
  "telephone": "[03-XXX-XXXX]",
  "address": { "— same as base —" },
  "areaServed": ["[עיר 1]", "[עיר 2]"],
  "hasCredential": {
    "@type": "EducationalOccupationalCredential",
    "credentialCategory": "קבלן רשום",
    "recognizedBy": { "@type": "Organization", "name": "רשם הקבלנים" }
  },
  "knowsAbout": ["[סוג עבודה 1]", "[סוג עבודה 2]"]
}
```

---

## SaaS / Software
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "[שם המוצר]",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "[מה המוצר עושה]",
  "url": "https://[domain]",
  "offers": {
    "@type": "Offer",
    "price": "[מחיר בסיס]",
    "priceCurrency": "ILS",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "billingIncrement": "P1M"
    }
  },
  "provider": {
    "@type": "Organization",
    "name": "[שם החברה]",
    "url": "https://[domain]"
  }
}
```

---

## Real Estate Agent / Agency
```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "[שם המשרד]",
  "description": "[תיאור]",
  "url": "https://[domain]",
  "telephone": "[03-XXX-XXXX]",
  "address": { "— same as base —" },
  "areaServed": ["[שכונה 1]", "[עיר 1]"],
  "hasCredential": {
    "@type": "EducationalOccupationalCredential",
    "credentialCategory": "רישיון תיווך",
    "recognizedBy": { "@type": "Organization", "name": "משרד המשפטים" }
  }
}
```

---

## FAQ Schema (Add to Any Page with FAQ Section)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[שאלה 1?]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[תשובה 1]"
      }
    },
    {
      "@type": "Question",
      "name": "[שאלה 2?]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[תשובה 2]"
      }
    }
  ]
}
```

---

## BreadcrumbList Schema (All Inner Pages)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "ראשי",
      "item": "https://[domain]"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "[שם עמוד]",
      "item": "https://[domain]/[slug]"
    }
  ]
}
```

---

## Review / AggregateRating (ONLY if you have real reviews)
```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "[4.8]",
  "reviewCount": "[127]",
  "bestRating": "5",
  "worstRating": "1"
}
```

**WARNING:** Only include this if the numbers are real and sourced from a verifiable platform (Google, Facebook, etc.). Fake ratings expose the client to legal liability under Israeli consumer protection law.
