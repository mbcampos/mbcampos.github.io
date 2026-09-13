---
name: Modern Slate Glass
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e18'
  surface-container-low: '#171b26'
  surface-container: '#1c1f2a'
  surface-container-high: '#262a35'
  surface-container-highest: '#313540'
  on-surface: '#dfe2f1'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dfe2f1'
  inverse-on-surface: '#2c303b'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00885d'
  on-tertiary-container: '#000703'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0f131d'
  on-background: '#dfe2f1'
  surface-variant: '#313540'
typography:
  display-clock:
    fontFamily: Inter
    fontSize: 88px
    fontWeight: '200'
    lineHeight: 96px
    letterSpacing: -0.04em
  display-clock-mobile:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '200'
    lineHeight: 64px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 12px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system delivers a calm, high-utility operational canvas engineered specifically for high-frequency daily interaction. Positioned between a hyper-minimalist workspace and a tailored operating interface, the visual philosophy centers on atmospheric focus: reducing cognitive friction upon opening a new tab while offering instant, tactical access to daily navigation, live data points, and focus tools.

The visual direction marries dark-mode minimalism with refined, frosted glassmorphism. Semi-translucent panels, microscopic edge illumination, and low-viscosity backdrop filtering let the canvas feel weightless, responsive, and deep. Vibrant luminous highlights—electric indigo, crisp cyan, and grounding emerald—puncture the dark abyss to indicate focus, active states, and real-time feedback without overwhelming the sensory perimeter.

## Colors

The palette is tuned specifically for deep OLED contrast and sustained low-light viewing, avoiding pure pitch black in favor of deep space slate and rich midnight indigo.

- **Background Canvas:** `#0B0F19` provides absolute depth, while `#111827` anchors layered surfaces, toolbars, and contextual sheets.
- **Glass Surfacing:** Surface fills utilize variable transparency: base container fill sits at `rgba(17, 24, 39, 0.65)` with `16px` to `24px` backdrop blur, while elevated hover states scale to `rgba(31, 41, 55, 0.75)`.
- **Primary Accent (`#6366F1` - Electric Indigo):** Drives primary triggers, active tab selections, search suggestions focus, and primary button gradients.
- **Secondary Accent (`#06B6D4` - Cyber Cyan):** Reserved for live status indicators, active widget telemetry, search shortcut tags, and micro-accents.
- **Tertiary Accent (`#10B981` - Emerald):** Handles validation states, system online metrics, battery/network widgets, and completed quick-tasks.
- **Micro-borders & Hairlines:** Borders are never opaque gray; they use linear gradients running from top-left `rgba(255, 255, 255, 0.12)` to bottom-right `rgba(255, 255, 255, 0.02)` to mimic physical light catching polished glass edges.

## Typography

Typography prioritizes extreme optical legibility and clean architectural precision. `Inter` drives all primary content layers, display titles, and interface text, leaning into subtle negative letter spacing at larger scales to maintain structural density.

`JetBrains Mono` handles secondary metadata, search engine prefixes (e.g., `g/`, `yt/`, `gh/`), system telemetry (weather conditions, CPU/memory gauges, date stamps), and hotkey badges. Tabular figures (`font-variant-numeric: tabular-nums`) must be strictly applied across the central clock display, date strips, and widget readouts to eliminate horizontal jitter during live time updates.

## Layout & Spacing

The canvas is constructed around an anchored vertical hierarchy with a fluid center:

1. **Top Utility Bar:** Pinned to top viewport edges (`margin: 2rem`), carrying lightweight profile controls, wallpaper settings, and quiet metrics.
2. **Central Hero Stack:** Maximized between 680px and 840px max-width, maintaining the clock cluster, greeting, and the high-performance search engine input.
3. **Bookmark Matrix:** Employs an adaptive auto-fill grid (`minmax(96px, 1fr)` for compact mode, `minmax(140px, 1fr)` for detailed mode) spanning standard 8 or 10-column spreads on wide displays.
4. **Docked Widget Ribbon:** Resides below the primary matrix or optionally aligns along the right viewport flank on ultrawide viewports (>1800px).

Breakpoints:
- **Desktop (>1024px):** Fixed max content container of `1280px` centered vertically and horizontally; `gutter: 1.25rem`.
- **Tablet (768px - 1023px):** Fluid width with `margin: 1.5rem`; bookmark grid collapses to 4-6 columns; clock shifts to 64px scale.
- **Mobile (<768px):** Single vertical flow with `margin: 1rem`; bookmark matrix condenses into a touch-friendly 4-column compact grid; quick widgets convert to a swipeable horizontal carousel.

## Elevation & Depth

Visual hierarchy is constructed through luminous optical layering rather than heavy drop shadows:

- **Level 0 (Canvas Base):** Deep `#0B0F19` backdrop with optional subtle radial illumination gradients (`rgba(99, 102, 241, 0.08)` centered behind the clock cluster).
- **Level 1 (Static Cards & Quick-Action Tiles):** Translucent backdrop fill `rgba(17, 24, 39, 0.55)`, `backdrop-filter: blur(16px)`, bound by a crisp 1px gradient border (`rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.02)`).
- **Level 2 (Active Search Bar & Interactive Hover):** Translucent fill `rgba(31, 41, 55, 0.70)`, `backdrop-filter: blur(24px)`, boosted border light (`rgba(99, 102, 241, 0.40)` or `rgba(255, 255, 255, 0.18)`), with an ambient glow shadow: `0 8px 32px -4px rgba(0, 0, 0, 0.45), 0 0 16px 0 rgba(99, 102, 241, 0.15)`.
- **Level 3 (Modals, Overlays & Flyout Menus):** High-density glass `rgba(15, 23, 42, 0.88)`, `backdrop-filter: blur(32px)`, structured by `0 24px 48px -12px rgba(0, 0, 0, 0.65)` with a luminous 1px inset ring (`rgba(255, 255, 255, 0.12)`).

## Shapes

The geometric framework balances organic curve appeal with tight architectural density (`roundedness: 2` / 8px base).

- **Standard Tiles & Widgets:** Use `rounded-lg` (16px) for an organic, modern card silhouette.
- **Search Command Bar:** Uses `rounded-xl` (24px) to establish a distinctive tactile pill-feel that invites input without fully disconnecting from adjacent grid forms.
- **Favicon Containers & Micro-Badges:** Use base roundedness (8px) to frame brand logos natively without clipping irregular marks.
- **Context Modals & Drawers:** Use `rounded-xl` (24px) for high-end sheet elegance.

## Components

### Search Bar (Command Center)
- **Structure:** High-presence input block (`height: 56px`), centered with soft glass backing (`rgba(17, 24, 39, 0.6)`), 1px border `rgba(255, 255, 255, 0.1)`.
- **States:** Focus immediately deepens background fill, transitions the border to electric indigo (`#6366F1`), and casts an ambient halo glow (`rgba(99, 102, 241, 0.2)`).
- **Affordances:** Prefixed with active search provider indicator (Google, DuckDuckGo, GitHub); trailing section holds interactive hotkey chip (`⌘K` or `/`) rendered in `JetBrains Mono`.

### Bookmark Cards & Tiles
- **Tile Architecture:** Square or compact horizontal glass nodes with centered high-fidelity favicons (`28px x 28px`) encapsulated in an 8px frosted well.
- **Hover & Interaction:** Smooth 150ms spring lift (`translateY(-3px)`), border lighting shifts from `0.06` to `0.2` white opacity, revealing micro-overflow triggers (`•••`) on the top-right corner.
- **Context Menu:** Glass dropdown flyout supporting: "Edit Bookmark", "Copy URL", "Move to Folder", and "Delete" (in destructive coral `#EF4444`).

### Management Modals (Add / Edit / Preferences)
- **Container:** Centered modal sheet with intense background blur (`32px`), framed by a top-lit hairline border.
- **Inputs:** Dark inset fields (`rgba(11, 15, 25, 0.8)`) with `10px` border radius, high-contrast placeholder text (`#6B7280`), and auto-fetching favicon preview logic that verifies URLs live.
- **Action Footers:** Dismissive actions styled as ghost glass; confirm actions styled with an indigo-to-cyan gradient background (`linear-gradient(135deg, #6366F1, #06B6D4)`) with pure white text and active tap scaling (`scale(0.98)`).

### Quick-Action Widgets
- **Weather / Clock / System Metrics:** Low-profile dashboard cards featuring micro-sparklines, animated SVG weather icons, and tabular mono values.
- **Customization Controls:** Unobtrusive "+" add buttons nestled in the grid that reveal customizable widget templates via subtle spring-loaded drawer panels.