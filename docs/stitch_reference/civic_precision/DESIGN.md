---
name: Civic Precision
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#404944'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#707974'
  outline-variant: '#c0c9c2'
  surface-tint: '#336854'
  primary: '#002e20'
  on-primary: '#ffffff'
  primary-container: '#0b4634'
  on-primary-container: '#7db39c'
  inverse-primary: '#9bd2ba'
  secondary: '#006a63'
  on-secondary: '#ffffff'
  secondary-container: '#9bf2e8'
  on-secondary-container: '#007169'
  tertiary: '#002e1d'
  on-tertiary: '#ffffff'
  tertiary-container: '#00472f'
  on-tertiary-container: '#20bf86'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b6efd5'
  primary-fixed-dim: '#9bd2ba'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#18503d'
  secondary-fixed: '#9bf2e8'
  secondary-fixed-dim: '#7fd5cc'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#00504a'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  title-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system defines a next-generation civic technology platform designed to bridge local governance and citizens across administrative tiers: Platform Admins, Grama Panchayats, Ward Members, Authorized Representatives, and Residents.

The aesthetic strips away traditional bureaucratic cliches—such as state emblems, heavy-handed ornamental badges, and bloated enterprise tables—in favor of a high-density, warm-minimalist interface inspired by modern tools like Linear, Raycast, and high-end fintech applications. 

Key pillars:
- **Warm Institutional Rigor:** Evokes institutional integrity without institutional lethargy. Pristine white containers set against organic, warm-tinted parchment backings create immediate spatial clarity.
- **AI-Native Fluidity:** Interfaces treat intelligence as an inline utility, using focused keyboard shortcuts, omni-search input surfaces, contextual summarization cards, and discrete status indicators.
- **Bilingual Balance:** High-performance, neutral Latin glyphs seamlessly paired with native Malayalam typography to preserve vertical rhythm and baseline legibility across both languages simultaneously.

## Colors

The color palette centers on a disciplined forest and emerald spectrum, evoking trust, vitality, and civic sustainability, grounded by neutral charcoal and warm stone canvases.

- **Primary Canvas & Surfaces:** 
  - Canvas Root: `#F9FAF8` (Warm stone-tinted neutral providing optical warmth).
  - Canvas Elevated / Cards: `#FFFFFF` (Crisp, flat white for maximum reading contrast).
  - Subtle Framing / Borders: `#E2E8F0` with contextual alpha variants (`rgba(15, 23, 42, 0.06)`).
- **Core Brand:**
  - Primary (`#0B4634`): Deep forest green. Applied to authoritative actions, navigation rails, high-priority CTAs, and structural accents.
  - Primary Hover (`#125B42`): Lighter forest tone for interactive states.
  - Secondary (`#0D766E`): Balanced teal for analytical metrics, secondary actions, and civic progress rings.
  - Accent / Mint (`#10B981`): Vibrant emerald for operational statuses, live updates, and positive deltas. Soft mint tint (`#ECFDF5`) acts as its tonal background.
- **Typography & Neutrals:**
  - Dominant Ink: `#111827` (Deep neutral charcoal for display and primary reading levels).
  - Secondary Ink: `#64748B` (Muted slate for metadata, captions, and structural labels).
  - Subtle Muted: `#94A3B8` (Disabled states and placeholder text).

## Typography

The typography scale utilizes Geist for structured, geometric titles, numerical data, and utility labels, paired with Inter for running body text and localized copy.

- **Bilingual Rendering (Malayalam & English):** Malayalam strings must be targeted using system font-fallback chains prioritizing modern humanist Malayalam grotesques (`Manjari`, `Gayathri`, or macOS `Noto Sans Malayalam`) mapped cleanly to match Inter’s x-height. 
- **Vertical Metrics:** For dual-language strings (English + Malayalam inline), line-height is strictly augmented by `+2px` to prevent descender and ascender clipping on complex Malayalam ligatures.
- **Data Densities:** All monetary values, citizen counts, ward identifiers, and civic resolution timestamps inherit tabular lining figures (`font-feature-settings: "tnum" 1`).

## Layout & Spacing

The layout is built on a responsive 12-column structural grid system on desktop, collapsing to 6 columns on tablet, and a unified single or dual-column stream on mobile.

- **Canvas & Shells:** The top-level application framework supports two primary layout templates:
  1. *Command Console (Admin / Panchayat / Ward Representative):* Fixed left utility sidebar (64px collapsed, 240px expanded), central fluid dynamic workspace (constrained to a maximum width of 1440px), and an optional collapsible AI inspector panel (360px).
  2. *Citizen Portal (Resident View):* Centered, distraction-free container with an 840px max-width ceiling to optimize single-column legibility and petition submissions.
- **Rhythm & Alignments:** Multi-item forms, metadata lists, and analytical summaries adhere strictly to an 8-point vertical cadence. Component internal padding never drops below `space-sm` (8px) for interactive touch surfaces.

## Elevation & Depth

Visual hierarchy is communicated through subtle tonal layering and ambient, light-absorbing shadows rather than heavy blurs or excessive skeuomorphism.

- **Base Layer (Level 0):** Background canvas (`#F9FAF8`), completely un-elevated.
- **Surface Layer (Level 1 - Cards, List Rows):** Pure white fill (`#FFFFFF`) with a 1px continuous border of `#E2E8F0` or `rgba(15, 23, 42, 0.05)`. Ambient drop: `0px 1px 3px rgba(17, 24, 39, 0.03), 0px 1px 2px rgba(17, 24, 39, 0.02)`.
- **Floating Layer (Level 2 - Menus, Popovers, Flyouts):** Elevated white surface with a refined, deep-distance shadow: `0px 10px 25px -5px rgba(11, 70, 52, 0.05), 0px 8px 10px -6px rgba(17, 24, 39, 0.04)`.
- **Modals & Command Center (Level 3):** Frosted ambient backdrop (`rgba(17, 24, 39, 0.35)` with `backdrop-filter: blur(4px)`). The modal card features high-clarity containment: `0px 20px 32px -8px rgba(15, 23, 42, 0.12)`.

## Shapes

The design system maintains a modern, soft-cornered language with intentional curvature scale mappings:

- **Cards & Primary Modules:** Standardized at `1.25rem` (20px) radius for standard containers and `1.5rem` (24px) for expansive analytical summary sections or highlighted resident dashboard banners.
- **Interactive Elements (Buttons, Inputs, Badges):** Inputs and control elements maintain an 8px (`0.5rem`) to 10px corner radius to preserve a functional, software-oriented precision.
- **Full Pills (`rounded-full`):** Reserved strictly for dynamic status badges, category filter chips, AI processing pills, and citizen avatar frames.

## Components

### Buttons
- **Primary:** Solid `#0B4634` fill, white text, subtle hover lift to `#125B42`. Borderless, `0.5rem` radius, 36px height (compact) or 42px height (default).
- **Secondary:** Clean white background, 1px border of `#E2E8F0`, `#111827` text. On hover, background shifts to `#F9FAF8` with border tinting to `#CBD5E1`.
- **AI Action Button:** Subtle gradient tint from `#ECFDF5` to `#FFFFFF`, 1px border in `#A7F3D0`, text in `#0B4634` with an inline spark icon.

### Chips & Badges
- **Status Pills:** Compact height (24px), full-pill radius, 11px uppercase label font.
  - Active/Resolved: `#ECFDF5` background, `#0B4634` text, 6px solid emerald dot.
  - In Review: `#FEF3C7` background, `#92400E` text, 6px amber dot.
  - Critical/Grievance: `#FEE2E2` background, `#991B1B` text, 6px red dot.
- **Category Filter Chips:** Neutral background (`#FFFFFF`), border `#E2E8F0`, selectable state toggles to `#0B4634` text with `#D1FAE5` surface tint.

### Lists & Activity Feeds
- **Card-Style Rows:** Grouped items nested in white containers. Divider borders use `#F1F5F9`. Hover state triggers soft translation or background tint to `#F8FAFC`.
- **Malayalam/English Pairing:** Primary title displayed in bold Malayalam/English with secondary classification metadata in slate `#64748B` directly beneath.

### Checkboxes & Radio Buttons
- Precision 16px square (checkbox) and 16px circle (radio). Inactive state is a 1.5px border of `#CBD5E1` on white. Active state transitions to `#0B4634` solid fill with a crisp white check or center pip.

### Input Fields & Omni-Search
- **Inputs:** 40px height, background `#FFFFFF`, border 1px `#E2E8F0`. Focused state uses a crisp 1px ring of `#0B4634` paired with an outer box-shadow ring `rgba(11, 70, 52, 0.08)`. Placeholder text in `#94A3B8`.
- **Command Search (Raycast-Style):** Prominent, centered input field on modal activation with a 48px height, embedded shortcut badges (`⌘K`), and live query categorization.

### Cards
- Standard white surfaces framed with 20px radius and `#E2E8F0` border. Headers feature metadata tags and action menus top-right. Zero inner drop-shadows on flat state; elevated cards utilize Level 1 elevation tokens.

### Domain-Specific Components
- **Ward Resolution Progress Bar:** 6px slim bar with `#E2E8F0` track and segmented teal-to-emerald gradient fills showing grievance redressal rate.
- **AI Triage Pill:** A contextual indicator summarizing resident petition sentiment and department routing with a single click to accept AI recommendation.