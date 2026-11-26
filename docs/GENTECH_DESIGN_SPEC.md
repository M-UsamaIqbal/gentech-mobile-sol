# GenTech Design Prompt and Specification

This document is the canonical design specification for the GenTech marketplace. It was produced with the `design-prompt-generator-v2` 7 step framework and applies the visual rules from `landing-page-design` and the mobile-first accessibility rules from `ui-ux-development`. It records the decisions made during the UI/UX redesign so future work stays consistent.

---

## Step 1: Domain Context

**Category:** Mobile-first classified marketplace (first vertical: mobile phones).

**Markets:** Pakistan (PKR, English/Urdu) and Bahrain (BHD, English/Arabic). Country and locale are resolved from the route prefix `/{country}/{locale}`; Arabic and Urdu render RTL.

**Domain UX patterns adopted**
- Listing grids with image-forward cards, condition and price labels, and seller trust badges.
- Search first navigation: a compact header search and a prominent hero search.
- Dedicated trust surface: PTA/CPID (PK) and TRA (BH) IMEI checks plus optional third party inspection booking.
- Seller and dealer profiles with verification state, branch and inventory management.
- Role workspaces: buyer dashboard, dealer dashboard, inspector queue, admin operations.

**Trust signals surfaced in the UI:** verified seller / dealer badges, inspection status, transaction and listing counts, real listing photography, and clear inspection call-to-action on detail pages.

**Pain points the redesign addresses**
- Critical device truth (IMEI, PTA/CPID, condition) was buried; it is now visible early and reinforced in the hero tagline.
- Two competing dark palettes and background gradients made surfaces feel inconsistent; replaced with one flat surface system.
- Navigation was hidden inside an avatar menu on mobile; primary sections are now reachable directly.
- Broken font wiring and off-scale type made the UI look unmanaged; replaced with one font family and a named type scale.

---

## Step 2: User Journey

Framework: `[entry] → [discover] → [evaluate] → [decide] → [act] → [retain]`

| Stage | User goal | Key information | Friction | Design solution |
|---|---|---|---|---|
| Entry | Understand what GenTech does | Trust, country coverage, device focus | Generic marketplace copy | Localized hero with country name, proof line, and inspection signal |
| Discover | Find a phone nearby | Search, category chips, featured deal | Hidden navigation | Hero search, popular category chips, floating header with active section links |
| Evaluate | Judge the listing and seller | Photos, price, condition, location, verification | Off-scale cards, gradient placeholders | Flat image-first cards, consistent badges, real featured listing in hero |
| Decide | Reduce purchase risk | IMEI result, inspection option, seller rating | Trust actions hard to find | Inspection CTA and IMEI check in primary navigation and footer |
| Act | Contact seller or post an ad | Clear single action | Competing CTAs | One primary action per hero/section, secondary actions de-emphasized |
| Retain | Manage listings and orders | Dashboard status, messages, saved searches | Dense role hubs | Role landing hubs with a single hero, clear stats, and quick actions |

**Role specific journeys**
- **Buyer:** home → marketplace → listing detail → IMEI check / inspection → message → order.
- **Seller:** dashboard → create listing → manage listings → promotions → messages/orders.
- **Dealer:** apply → dashboard → profile/branches/inventory → stock listings.
- **Inspector:** queue → claim/schedule → detail → submit graded report.
- **Admin:** overview KPIs → approval/moderation queue → catalog/finance/settings workspace.

---

## Step 3: Emotional Direction

**Ratio:** 60% Trust, 30% Professional, 10% Warmth.

| Emotion | Visual interpretation in GenTech |
|---|---|
| Trust | Flat neutral surfaces, consistent badges, real photography, visible verification and inspection states, no decorative gradients on content |
| Professional | Grid based layout, named text styles, structured role workspaces, predictable 8px spacing rhythm |
| Warmth | Rounded 8–16px corners, restrained emerald/sky accents for positive states, friendly but concise sentence case copy |

Explicitly avoided: ultra-bold display weights, neon gradients, large uppercase tracked eyebrows, bounce/elastic motion, and decorative background glows.

---

## Step 4: Identity and Goal

```
Service Name:  GenTech
One-liner:     Know the phone before you pay.
Category:      Mobile-first phone marketplace (Pakistan and Bahrain)
Positioning:   Verification-first marketplace: IMEI/PTA/CPID/TRA checks and optional
               independent inspection built into the buying path, not bolted on.
Primary Goal:  A buyer finds and commits to a trusted listing.
Secondary Goal: A seller or dealer lists stock and manages it with confidence.
Brand Personality: Dependable, Direct, Modern.
```

---

## Step 5: Design System

### Color
The system uses semantic tokens defined in `app/globals.css` (shadcn/neutral OKLCH base) plus one approved dark surface ramp:

```
Background:   var(--background)        light canvas
Surface:      var(--card)              cards and raised panels
Surface dark: #181818                  primary dark surface (workspaces, admin shell)
Surface dark: #1F1F1F                  secondary dark surface
Surface dark: #272727                  tertiary dark surface
Text primary: var(--foreground)
Text muted:   var(--muted-foreground)
Primary:      var(--primary)           CTAs and focus
Success:      emerald-600 / emerald-400 (dark)
Info:         sky-300                  inspector workspace accent
Warning:      var(--destructive)       errors and invalid states
Border:       var(--border) / white/10 on dark surfaces
```

Background gradients and radial glows on content surfaces are prohibited. Focus rings use `var(--ring)` with a 2px offset.

### Typography
```
Headings: Geist (next/font/google), weight 600, tight tracking, text-balance
Body:     Geist, weight 400–500, leading-6
Mono:     Geist Mono (IMEI, order numbers, document refs)
Scale:    12/16/20/24/30/36/48/60 px via named utilities
Arabic:   Noto Naskh Arabic system stack (RTL)
Urdu:     Noto Nastaliq Urdu system stack (RTL)
```

Named utilities in `app/globals.css`: `heading-1` … `heading-6`, `title-1` … `title-5`, `body-1` … `body-6`, `button-lg/xsm`, `caption-1` … `caption-5`, plus `surface-flat` and `hover-lift`. No raw `text-[Npx]` or `font-black` in new code.

### Spacing and layout
```
Base unit:    8px (Tailwind spacing scale)
Corner radius: 8px controls, 12px cards, 16px panels; no pill/rounded-full surfaces
Container:    max-w-6xl public/dashboard, max-w-5xl inspector, max-w-[1440px] admin
Grid:         12 column responsive; listing cards 1 / 2 / 3 columns by breakpoint
```

### Components
```
Buttons:  h-10 default, h-9 sm, h-11 lg; radius 8px; semibold; active scale 0.98;
          single primary action per section; min 44px touch target on mobile
Cards:    radius 12px; 1px border; flat background; hover-lift on interactive cards
Inputs:   1px border; focus ring; 44px min height on mobile
Badges:   small uppercase captions for verification and status only
```

### Motion
```
Easing:   cubic-bezier(0.22, 1, 0.36, 1) for all CSS and Framer Motion transitions
Entrance: 600–700ms fade + translateY, stagger 60–180ms
Feedback: 150–300ms color/transform transitions
Reduced motion: all non-essential animation disabled via prefers-reduced-motion
```

---

## Step 6: Component Specifications

**SiteHeader**
- Purpose: persistent identity, primary navigation, search, account and locale controls.
- Contents: logo, marketplace and inspection links, compact search, sell CTA, country/locale selector, theme toggle, notification bell, user menu, mobile trigger.
- States: default, active section (`aria-current`), scrolled (floating translucent bar).
- Responsive: full nav at `lg`, search collapses to second row below `md`, all navigation in full screen panel below `md`.

**MobileNav**
- Purpose: complete mobile navigation without hiding sections in the avatar menu.
- Contents: primary links, category list, locale selector, sell and dashboard/sign-in actions.
- States: closed, open with focus trap and focus restore, Escape to close, backdrop click to close, link click to close.
- Responsive: full-viewport panel with staggered link entrance, RTL aware slide direction.

**HomeHero**
- Purpose: explain the verification-first promise and start the main journey.
- Contents: country and brand eyebrow, left aligned gradient heading, localized subtitle, hero search, proof line, popular category chips, featured real listing card.
- States: with and without a featured listing (graceful fallback when no stock).
- Responsive: stacked on mobile, two column at `lg`.

**TaglineReveal**
- Purpose: reinforce the trust message with a word-by-word scroll reveal.
- Contents: localized tagline string from `homepage.tagline`.
- States: words activate as they enter the viewport; all visible immediately under reduced motion.

**ListingCard**
- Purpose: image-forward result with price, condition, location and trust signals.
- Contents: photo (flat neutral placeholder when absent), title, price, badges, favorite and compare controls.
- States: default, hover lift, selected/compared, favorited, loading skeleton in global loading route.
- Responsive: 1 / 2 / 3 columns.

**Role hubs (dashboard, dealer, inspector, admin)**
- Purpose: orient the user immediately with one hero, current status, and the next action.
- Contents: role eyebrow, greeting/title, short body, status badges, primary and secondary CTAs, KPI/stat cards, quick actions.
- States: authenticated, pending verification, no data, loader and error boundaries.
- Responsive: stacking hero content, wrapping badges, 2-column stat and quick action grids on small screens.

**State pages**
- Global `not-found.tsx`, `loading.tsx`, `error.tsx` plus existing admin error/loading.
- Skeleton loaders mirror real card geometry; error and 404 pages offer a single clear recovery action.

---

## Step 7: Micro-interactions

```
Trigger: primary section navigation
Animation: active pill background + aria-current
Duration: 300ms
Easing: cubic-bezier(0.22,1,0.36,1)
Purpose: orient the user within the current section

Trigger: mobile menu open/close
Animation: full-height panel slide, backdrop fade, staggered links (60ms steps)
Duration: 500ms panel, 200ms under reduced motion
Easing: cubic-bezier(0.22,1,0.36,1)
Purpose: make every section reachable and focus order predictable

Trigger: tagline scroll into view
Animation: per-word color activation via IntersectionObserver
Duration: 500ms per word, no stagger delay under reduced motion
Easing: cubic-bezier(0.22,1,0.36,1)
Purpose: draw attention to the trust message without noise

Trigger: interactive card hover
Animation: -2px translateY, background/border transition, 0.98 active scale
Duration: 500ms hover, 150ms press
Easing: cubic-bezier(0.22,1,0.36,1)
Purpose: signal clickability without decorative motion

Trigger: button press
Animation: 1px translateY + 0.98 scale
Duration: 300ms
Easing: cubic-bezier(0.22,1,0.36,1)
Purpose: tactile feedback on every action

Trigger: route load
Animation: workspace hero and staggered KPI entrance
Duration: 600–700ms
Easing: cubic-bezier(0.22,1,0.36,1)
Purpose: establish hierarchy on role hubs
```

---

## Implementation Prompt

Build and maintain GenTech as a mobile-first, verification-focused phone marketplace for Pakistan and Bahrain. Use one Geist type family with a named type scale, semantic neutral color tokens, and a single flat dark surface ramp (`#181818`, `#1F1F1F`, `#272727`). Avoid background gradients, decorative glows, off-scale font sizes, ultra-bold weights, and pill shaped surfaces. Make search and primary navigation immediately reachable on mobile through a full-height accessible menu with focus trap. Keep one primary action per section. Surface trust signals (verified seller, inspection, IMEI/PTA/CPID/TRA) early and consistently. Use `cubic-bezier(0.22,1,0.36,1)` for motion, honor `prefers-reduced-motion`, and preserve English/Urdu/Arabic RTL support throughout. All role workspaces (buyer, dealer, inspector, admin) must open with a clear hero, current status, and next action.

## Iterative Refinement Prompts

1. "Audit every new component against the named type scale in `app/globals.css` and replace raw text size utilities."
2. "Check all interactive elements for a minimum 44px touch target and a visible focus ring."
3. "Verify that no new background gradient or hardcoded off-token dark hex value was introduced."
4. "Test the public pages, buyer dashboard, dealer dashboard, inspector queue, and admin overview at 390px width and in RTL."
5. "Confirm all new motion uses the approved easing and is disabled under reduced motion."
