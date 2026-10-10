import type { MonoCursorOptions } from './types'

export const Z_INDEX = 999999

export const DEFAULT_OPTIONS: Required<MonoCursorOptions> = {
  color: '#6366f1',
  dotSize: 8,
  ringSize: 40,
  ringBorderWidth: 1.5,
  lerpFactor: 0.15,
  hideDefaultCursor: true,
  enableCircle: true,
  zIndex: Z_INDEX,
}
