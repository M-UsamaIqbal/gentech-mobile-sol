# [P2][Localization][Improvement] Translate checkout and order-status UI strings

**Labels:** enhancement, localization, pakistan-market, bahrain-market

## Opportunity / problem
Translation files have key parity, but checkout and order-status UI contains hardcoded English strings. Arabic/Urdu users see mixed-language payment, shipping and order status content even when route/locale is correct.

## Evidence from the existing code
- `components/checkout/checkout-client.tsx:103,135-163` â€” hardcoded English.
- `components/checkout/shipping-selector.tsx:66-120` â€” hardcoded labels.
- `components/checkout/payment-method-selector.tsx:46-80` â€” hardcoded labels.
- `app/[country]/[locale]/(dashboard)/dashboard/orders/page.tsx:7-15` â€” status labels hardcoded.
- `messages/en.json`, `ar.json`, `ur.json` â€” locale files exist.
- Confidence: High (code-confirmed); visual RTL Unverified.

## Business rationale
- Affected users: BH/PK customers in ar/ur locales.
- Affected markets: BH and PK.
- Business impact: checkout confusion, support cost, lower trust.
- Why this matters now: route coverage (#38) is separate from content completeness.

## Proposed outcome
Checkout and order status are fully localized in all supported locales.

## Recommended solution
Move strings to message files, use existing locale routing/direction utilities, add locale-aware number/currency formatting, and add screenshot/text tests for en/ar/ur checkout and order pages.

## MVP scope
- In scope: checkout, shipping selector, payment selector, order status labels.
- Out of scope: translating legal text (#20) and product content.

## Multi-region considerations
- Language: en/ar/ur; RTL must be visually verified.
- Currency: use formatter from #8.
- Payment/shipping: method labels localised without changing provider ids.

## Acceptance criteria
- [ ] No hardcoded English in listed components.
- [ ] ar/ur render correct `lang`/`dir`.
- [ ] Currency/date/number formatting is locale-aware.
- [ ] Existing en behaviour unchanged.
- [ ] Tests cover all three locales.

## Success measurement
- Metric: zero untranslated strings in checkout/order locale audit.

## Dependencies and risks
- Depends on #8 for currency formatting; risk: layout expansion in RTL.

## Estimate
M â€” message keys, component changes and tests.

## Research and references
- No external research required.

## Product decision
Ready for development.
