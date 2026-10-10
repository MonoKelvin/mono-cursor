/**
 * Visual state of the cursor.
 *
 * - `default` — arrow pointer
 * - `pointer` — ring, over links / buttons / anything clickable
 * - `text`    — I-beam, over inputs and editable text
 */
export type CursorState = 'default' | 'pointer' | 'text'

export interface MonoCursorOptions {
  /** Arrow fill colour (any CSS colour). */
  color?: string
  /** Arrow size in pixels. */
  arrowSize?: number
  /** Ring diameter in pixels (the `pointer` state). */
  ringSize?: number
  /** Ring border thickness in pixels. */
  ringBorderWidth?: number
  /** Hide the system cursor while the custom cursor is active. */
  hideDefaultCursor?: boolean
  /** Draw the ring / I-beam. When `false` the arrow stays visible in every state. */
  enableCircle?: boolean
  /** Drop shadow under the arrow and ring, so they read on busy backgrounds. */
  shadow?: boolean
  /** Scale the cursor down while the pointer is pressed. */
  clickEffect?: boolean
  /** Z-index of the cursor layer. */
  zIndex?: number
}
