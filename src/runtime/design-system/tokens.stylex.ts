import * as stylex from '@stylexjs/stylex'

// A typed bridge, NOT a second theme. CSS variables in theme.css remain the
// public theming API. Inline references resolve at the consuming element, so
// nested data-theme boundaries and site CSS overrides continue to work.
// Do not wrap these references in defineVars: root-resolved aliases can freeze
// an inherited value before a nested theme changes the original variable.
export const colors = stylex.defineConsts({
  /*
   * Roles read novon's public token names, so a site stylesheet can override
   * either those names or the HeroUI-derived variables behind them. Derived
   * shades keep HeroUI's color-mix formulas.
   */
  canvas: 'var(--background)',
  sidebar: 'var(--novon-sidebar-surface)',
  text: 'var(--foreground)',
  textSoft: 'color-mix(in oklab, var(--foreground) 90%, transparent)',
  mutedText: 'var(--muted-foreground)',

  /* Surfaces: containers resting on the canvas */
  surface: 'var(--card)',
  surfaceText: 'var(--card-foreground)',
  surfaceSoft: 'var(--novon-raised)',
  canvasSoft: 'color-mix(in oklab, var(--background) 96%, var(--foreground) 4%)',

  /* The gray raised block: panels, cards, tool strips */
  raised: 'var(--novon-raised)',
  raisedHover: 'var(--novon-raised-hover)',
  raisedStrong: 'var(--novon-raised-strong)',

  /* Neutral interactive fills */
  subtle: 'var(--secondary)',
  subtleText: 'var(--secondary-foreground)',
  subtleSoft: 'color-mix(in oklab, var(--secondary) 50%, transparent)',
  hoverSoft: 'color-mix(in oklab, var(--secondary) 60%, transparent)',

  /* Overlays and the selected segment of a segmented control */
  popover: 'var(--popover)',
  popoverText: 'var(--popover-foreground)',
  hover: 'color-mix(in oklab, var(--secondary) 8%, var(--card))',

  /* Accent: the primary identity */
  strong: 'var(--primary)',
  strongHover: 'color-mix(in oklab, var(--primary) 90%, var(--primary-foreground) 10%)',
  onStrong: 'var(--primary-foreground)',

  /* Structure and focus */
  border: 'var(--border)',
  borderSoft: 'color-mix(in oklab, var(--card) 85%, var(--card-foreground) 15%)',
  focus: 'var(--ring)',
  scrim: 'color-mix(in oklab, #000 40%, transparent)',

  /* Status: solid fills pair with their foreground, soft fills carry labels */
  danger: 'var(--destructive)',
  dangerHover: 'color-mix(in oklab, var(--destructive) 90%, var(--destructive-foreground) 10%)',
  onDanger: 'var(--destructive-foreground)',
  dangerSurface: 'var(--novon-danger-surface)',
  dangerText: 'var(--novon-danger-text)',
  successSurface: 'var(--novon-success-surface)',
  successText: 'var(--novon-success-text)',
  warningSurface: 'var(--novon-warning-surface)',
  warningText: 'var(--novon-warning-text)',
})

// The theme is switched by `data-theme` on <html>, which no element can select
// against from its own StyleX style. These variables are flipped by the theme
// block in theme.css, so theme-conditional display and filters stay in StyleX.
export const theme = stylex.defineConsts({
  lightOnly: 'var(--novon-light-only)',
  darkOnly: 'var(--novon-dark-only)',
  invert: 'invert(var(--novon-theme-invert))',
})

/** The consumed 2–64px scale. Padding, gaps and margins use these steps only. */
export const space = stylex.defineConsts({
  half: '0.125rem',
  one: '0.25rem',
  oneHalf: '0.375rem',
  two: '0.5rem',
  twoHalf: '0.625rem',
  three: '0.75rem',
  threeHalf: '0.875rem',
  four: '1rem',
  five: '1.25rem',
  six: '1.5rem',
  seven: '1.75rem',
  eight: '2rem',
  nine: '2.25rem',
  ten: '2.5rem',
  eleven: '2.75rem',
  twelve: '3rem',
  fourteen: '3.5rem',
  sixteen: '4rem',
})

/**
 * Depth. Raised surfaces lift through layered shadows plus a top highlight;
 * borders stay reserved for structure and state. The press token collapses the
 * shadow into the surface.
 */
export const elevation = stylex.defineConsts({
  low: 'var(--novon-elevation-low)',
  lift: 'var(--novon-elevation-lift)',
  press: 'var(--novon-elevation-press)',
})

export const radii = stylex.defineConsts({
  // Resolve against --radius at the consumer, not a root-computed alias.
  small: 'max(0px, calc(var(--radius) - 4px))',
  control: 'max(0px, calc(var(--radius) - 2px))',
  surface: 'var(--radius)',
  large: 'calc(var(--radius) + 4px)',
  pill: '9999px',
})

export const type = stylex.defineConsts({
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
  /** The one page-defining statement: the docs page title. */
  pageTitle: '1.875rem',
  /** Article and generated-page titles. */
  title: '1.5rem',
  /** Section turns and ledes. */
  heading: '1.125rem',
  /** Strong reading text. */
  body: '1rem',
  /** UI labels and the default reading size of dense content. */
  label: '0.875rem',
  /** Deep outline levels, code and operational identifiers. */
  micro: '0.8125rem',
  /** Subordinate status text. */
  caption: '0.75rem',
  regular: 400,
  medium: 500,
  semibold: 600,
  displayLeading: 1.2,
  titleLeading: 1.25,
  headingLeading: 1.35,
  bodyLeading: 1.6,
  compactLeading: 1.5,
  tightTracking: '-0.02em',
  looseTracking: '0.025em',
})

export const layout = stylex.defineConsts({
  reading: '68ch',
  content: 'var(--novon-content-width)',
  column: 'var(--novon-column-width)',
  sidebar: 'var(--novon-sidebar-width)',
  toc: 'var(--novon-toc-width)',
  header: 'var(--novon-header-height)',
})

export const media = stylex.defineConsts({
  // Shared with the existing shell. Add breakpoints only when content needs it.
  small: '@media (min-width: 40rem)',
  medium: '@media (min-width: 48rem)',
  wide: '@media (min-width: 64rem)',
  xwide: '@media (min-width: 80rem)',
  hover: '@media (hover: hover)',
  motion: '@media (prefers-reduced-motion: no-preference)',
  reduceMotion: '@media (prefers-reduced-motion: reduce)',
})
