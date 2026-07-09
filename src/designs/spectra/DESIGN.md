---
name: Spectra
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#4c4546'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1b1b'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  data-mono:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '300'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.1em
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1440px
---

## Brand & Style

The design system is rooted in the "Design Shift" philosophy—a binary visual state that mirrors the transition from human-driven interaction (Idle) to autonomous agentic execution (Active). It is a study in **Strict Minimalism** and **Stark Brutalism**, removing all decorative artifice to prioritize high-speed data and executive clarity.

The aesthetic is uncompromisingly monochromatic, utilizing a pure #000000 and #FFFFFF palette to evoke an atmosphere of institutional authority and cutting-edge technical precision. The UI does not seek to be "friendly"; it seeks to be a high-performance instrument for the Web3 era. It balances high negative space with hair-line strokes to create a sense of digital "breathing room" amidst complex financial data.

## Colors

This design system employs a strict binary color model. There are no grays, no accents, and no semantic colors like red or green for status; urgency and state are communicated through typography, iconography, and the "Design Shift."

- **Idle Mode (Default):** White background with black text and borders. This represents the wallet in a passive, observational state.
- **Active AI Mode:** Pure black background with white text and borders. This state is triggered when an autonomous agent is executing a trade, signing a contract, or performing on-chain analysis.

The transition between these states should be instantaneous and total, affecting every surface and stroke simultaneously.

## Typography

Typography is the primary vehicle for information hierarchy. We utilize **Hanken Grotesk** for its clean, geometric soul and **Geist** for technical data to provide a developer-centric precision.

Headers are set in SemiBold or Medium weights with tight letter-spacing to command attention. For all numerical and blockchain data (addresses, transaction amounts, gas fees), **Geist** is used with `tabular-nums` enabled to ensure vertical alignment across data rows. All body text maintains a "Light" or "Regular" weight to preserve the airy, minimal aesthetic.

## Layout & Spacing

The layout is governed by a **12-column fixed grid** on desktop and a **4-column grid** on mobile. The system emphasizes extreme negative space—"The Void"—to prevent the dense Web3 data from feeling overwhelming.

Margins are unusually wide (64px on desktop) to center the user’s focus. Elements are separated by large white-space intervals, but once grouped, they are held together by a 1px border logic. Spacing follows a strict 4px base unit, with 24px (3 units) serving as the standard gutter between functional blocks.

## Elevation & Depth

In this design system, **shadows do not exist**. Depth is entirely flat and architectural. 

Hierarchy is achieved through:
1.  **Inversion:** An element that needs to pop (like a modal) might be pure black in Idle Mode, creating a visual hole in the white surface.
2.  **Strokes:** 1px solid borders define the boundaries of every container.
3.  **Layering:** Elements appear to be stacked like sheets of paper. When a component is "above" another, it simply occludes the content beneath it without any blur or shadow.

## Shapes

The shape language is strictly **Sharp (0px)**. Every button, input field, card, and modal is a perfect rectangle. This reinforces the "unrefined" brutalist aesthetic and suggests a mathematical rigidity suitable for a financial protocol. Icons must be thin-stroke (1px) and also follow a geometric, non-rounded pathing wherever possible to match the UI's edges.

## Components

- **Buttons:** Rectangular with a 1px border. In Idle Mode, they are white with black text; on hover, they invert to black with white text. No gradients or transitions beyond a hard color switch.
- **Inputs:** 1px border on all sides. The label is placed in `label-caps` typography directly above the input. Focus state is indicated by a weight increase in the border (to 2px) or an inversion of the text color.
- **Cards:** Simple 1px containers. No padding between the card edge and the grid if it's part of a list.
- **Chips/Status:** Since we do not use color, status is indicated by text strings in brackets, e.g., `[ SUCCESS ]` or `[ PENDING ]`, or by filling the chip with the foreground color.
- **Icons:** Use Lucide-react icons with a 1px stroke weight. Icons should never be filled; they are always skeletal.
- **Data Tables:** No row separators. Use `data-mono` typography and rely on generous vertical padding to distinguish rows.