# GEEKDINO TAB 5 — Design System

Verified from UI UX Pro Max (style / landing / typography / ux / gsap searches).
The generic `--design-system` generator returned light Swiss + blue/orange, which does not fit this cinematic hardware product. This master uses the verified catalog matches instead.

## Product
Cinematic web product page for the GEEKDINO TAB 5 / WorkTab V tablet. Dark OLED, 360° CSS 3D product, scroll-driven story.

## Pattern
**Product Demo + Features**
Hero (headline + 3D product) → Journey value props → Anatomy demo → Spec breakdown → CTA + Footer

CTA: Hero + Final. Primary = Get / Enquire. Secondary = Specs / Explore.

## Style
- Dark Mode (OLED) — deep black, high contrast, neon accent, minimal glow
- Parallax Storytelling — sticky chapters, scrubbed 3D, skip intro, reduced-motion fallback
- 3D Product Preview — 360° rotate, drag to look, zoom during anatomy

## Color tokens
| Role | Hex | Notes |
|------|-----|--------|
| Background | `#050607` | OLED black |
| Surface | `#0C0E10` | Cards, bars |
| Foreground | `#F5F7F6` | Primary text ≥4.5:1 |
| Muted | `#A8B2AE` | Secondary text ≥4.5:1 on bg |
| Accent / CTA | `#3CF5A0` | Brand neon |
| On accent | `#050607` | CTA label |
| Border | `rgba(245,247,246,0.12)` | |
| Ring | `#3CF5A0` | Focus |

Do not use light `#F8FAFC` backgrounds. Do not switch to trust-blue/orange.

## Typography
**Modern Dark Cinema (Inter)** for body, UI, labels.
Display titles: Unbounded. Logo wordmark: Syncopate only.

- Display 48–84: Unbounded/Syncopate, tracking tight
- H2 24–48: Unbounded 700
- Body 16–18: Inter 400
- Labels: Inter 500, uppercase, +0.16–0.24em tracking

## Motion
Complex scroll (scrub 1–1.1). Pin at most the journey + anatomy chapters.
Disable hero bob, grain animation, and 360 spin under `prefers-reduced-motion`.
Skip intro available. Animate 1–2 key elements per view.

## Anti-patterns
- Emoji as icons
- mix-blend-mode on navigation (kills focus and contrast)
- Removing focus outlines
- Autoplay without pause / reduced-motion
- Muted footer text below 4.5:1
- Tiny 8px journey dots without a 44px hit area
