# Design Brief

## Direction

Civic Grid — an official electricity commercial office appointment portal that reads as a national public service: paper-white surfaces, deep navy authority, and a live electricity-blue accent.

## Tone

Institutional precision with modern restraint — every surface earns trust through alignment, hairline rules, and generous whitespace rather than decoration.

## Differentiation

A "voltage rail" — a thin electricity-blue gradient rule that pulses with current flow — used as the section divider and header underline, tying the electrical identity to the layout system.

## Color Palette

| Token      | OKLCH            | Role                                             |
| ---------- | ---------------- | ------------------------------------------------ |
| background | 0.995 0.003 250  | Clean white paper; primary canvas                |
| foreground | 0.22 0.045 258   | Deep navy ink; all body and heading text         |
| card       | 1 0 0            | Pure white elevated surfaces                     |
| primary    | 0.28 0.088 258   | Deep navy — header, footer, authority actions    |
| accent     | 0.58 0.185 251   | Electricity blue — CTAs, active states, links    |
| muted      | 0.96 0.01 250    | Faint blue-grey section fills and inactive chips |
| success    | 0.55 0.13 158    | Confirmed / checked-in status                    |
| warning    | 0.72 0.15 78     | Requested / pending status                       |

## Typography

- Display: Space Grotesk — headings, hero, stepper labels, numerals (technical, engineered)
- Body: General Sans — paragraphs, form labels, tables, navigation (neutral, highly legible in AR/KU)
- Mono: Geist Mono — reference numbers, appointment IDs, QR payloads, time slots
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-semibold`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base leading-relaxed`

## Elevation & Depth

Flat paper base with two shadow tiers: `shadow-subtle` for resting cards and `shadow-elevated` for the booking card and modals; depth comes from hairline borders and surface tinting, never heavy blur.

## Structural Zones

| Zone          | Background            | Border                  | Notes                                                        |
| ------------- | --------------------- | ----------------------- | ------------------------------------------------------------ |
| Header        | primary (deep navy)   | —                       | Logo + office name left; language switcher + CTA right; rail under |
| Hero          | background (white)    | —                       | Centered headline, voltage rail accent, primary CTA           |
| Booking flow  | card on muted/30 band | border                  | Elevated 3-step stepper card, slot chips in responsive grid   |
| Content bands | background / muted/30 | —                       | Alternate every other section for rhythm                      |
| Footer        | primary (deep navy)   | —                       | Three columns: brand, contact, links; muted light-blue text   |

## Spacing & Rhythm

Sections separated by `py-16 md:py-24`; content max-width `max-w-6xl`; card padding `p-6 md:p-8`; micro-spacing on a 4px scale with `gap-4`/`gap-6` groupings.

## Component Patterns

- Buttons: 8px radius, navy or electricity-blue fill, full-height 44px touch target, hover lifts with `shadow-elevated` and 2% brightness
- Cards: 8–12px radius, white on tinted band, 1px `border`, `shadow-subtle`, hover promotes to `shadow-elevated`
- Badges: pill radius, tinted background at low chroma, uppercase mono label, color-coded per status
- Inputs: 8px radius, hairline border, electricity-blue `ring` on focus, clear error text in destructive

## Motion

- Entrance: sections fade-and-rise 12px over 400ms, staggered 60ms per child
- Hover: `transition-smooth` 300ms on buttons, cards, and links
- Decorative: `rail-flow` animates the voltage rail gradient; `pulse-soft` on live status dots

## Constraints

- RTL-safe: use logical properties (`ms-*`/`me-*`, `text-start`/`text-end`) so Arabic and Kurdish Sorani mirror correctly
- Token-only styling — no raw hex, `rgb()`, or arbitrary color classes in components
- AA+ contrast in both modes; body text never below 4.5:1
- Light mode is primary; dark mode is a tuned navy inversion, not a mechanical flip

## Signature Detail

The voltage rail — a 2px animated electricity-blue gradient rule — appears under the header and between major sections, making the electrical service identity structural rather than decorative. (Category: texture/material + motion choreography.)
