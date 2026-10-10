export type CursorState = 'default' | 'pointer' | 'text' | 'circle'
export type CursorType = CursorState

export interface MonoCursorOptions {
  /** Primary cursor color (hex, rgb, etc.) */
  color?: string
  /** Center dot diameter in pixels */
  dotSize?: number
  /** Outer ring diameter in pixels */
  ringSize?: number
  /** Ring border thickness in pixels */
  ringBorderWidth?: number
  /** Smoothing factor: 0.01 = smooth/slow, 1 = instant */
  lerpFactor?: number
  /** Hide the system default cursor */
  hideDefaultCursor?: boolean
  /** Enable the outer ring element */
  enableCircle?: boolean
  /** Z-index of the cursor container */
  zIndex?: number
}
