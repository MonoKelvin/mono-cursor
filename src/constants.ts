import type { MonoCursorOptions } from './types'

export const Z_INDEX = 999999

export const DEFAULT_OPTIONS: Required<MonoCursorOptions> = {
  color: '#6366f1',
  arrowSize: 26,
  ringSize: 22,
  ringBorderWidth: 1.5,
  hideDefaultCursor: true,
  enableCircle: true,
  shadow: true,
  clickEffect: true,
  zIndex: Z_INDEX,
}

/**
 * Arrow path tip, in viewBox units. The SVG is rendered at
 * `--mc-arrow-size` for a 24×24 viewBox, so the tip sits at
 * `tip × size / 24` px from the element's top-left; the CSS translates the
 * arrow back by exactly that amount to pin the tip on the pointer.
 */
export const ARROW_TIP = { x: 5.5, y: 3.2 }
export const ARROW_VIEWBOX = 24

/** Arrow outline — keeps the pointer readable on any background. */
export const ARROW_PATH = 'M5.5 3.2 L18.8 11.4 L12.6 12.8 L9.9 19.6 Z'
