import { ARROW_TIP, ARROW_VIEWBOX } from './constants'

const STYLE_ID = 'mono-cursor-styles'

// Arrow tip as a fraction of the arrow size — derived from the path data so
// the SVG stays the single source of truth for where the tip is.
const TIP_X = (ARROW_TIP.x / ARROW_VIEWBOX).toFixed(6)
const TIP_Y = (ARROW_TIP.y / ARROW_VIEWBOX).toFixed(6)

const BOX = 'translate(calc(-1 * var(--mc-tip-x)), calc(-1 * var(--mc-tip-y)))'

const styles = `
:root {
  --mc-color: #6366f1;
  --mc-stroke: #fff;
  --mc-arrow-size: 26px;
  --mc-ring-size: 24px;
  --mc-ring-border: 1.8px;
  --mc-z-index: 999999;
  --mc-ease: cubic-bezier(0.33, 1, 0.68, 1);
  --mc-tip-x: calc(var(--mc-arrow-size) * ${TIP_X});
  --mc-tip-y: calc(var(--mc-arrow-size) * ${TIP_Y});
  --mc-shadow: 0 1px 2px rgba(15, 23, 42, 0.25);
  --mc-ring-shadow: 0 1px 5px rgba(15, 23, 42, 0.22);
}

/* Positioned with a single transform written straight from the pointer event
   (no rAF, no easing, no will-change): the layer stays on the main thread's
   paint and lands on the same frame as the system pointer. */
.mc-container {
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--mc-z-index);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.mc-container.mc-visible { opacity: 1 }

/* Arrow. transform-origin is the tip, so scaling on hover / press keeps the
   tip anchored to the pointer instead of drifting. */
.mc-arrow {
  display: block;
  width: var(--mc-arrow-size);
  height: var(--mc-arrow-size);
  filter: drop-shadow(var(--mc-shadow));
  transform-origin: var(--mc-tip-x) var(--mc-tip-y);
  transform: ${BOX};
  transition: opacity 0.18s var(--mc-ease), transform 0.18s var(--mc-ease);
}

.mc-arrow path {
  fill: var(--mc-color);
  stroke: var(--mc-stroke);
  stroke-width: 2.2;
  stroke-linejoin: round;
  paint-order: stroke;
}

/* Ring / I-beam: centred on the container origin, i.e. it opens up around the
   arrow tip. */
.mc-ring {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--mc-color);
  box-shadow: var(--mc-ring-shadow);
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.4);
  transition:
    opacity 0.18s var(--mc-ease),
    transform 0.18s var(--mc-ease),
    width 0.18s var(--mc-ease),
    height 0.18s var(--mc-ease),
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

/* ── States ─────────────────────────────────────────────────────────────── */
.mc-container[data-state='pointer'] .mc-arrow,
.mc-container[data-state='text'] .mc-arrow {
  opacity: 0;
  transform: ${BOX} scale(0.5);
}

.mc-container[data-state='pointer'] .mc-ring,
.mc-container[data-state='text'] .mc-ring {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.mc-container[data-state='pointer'] .mc-ring {
  width: var(--mc-ring-size);
  height: var(--mc-ring-size);
  background: color-mix(in srgb, var(--mc-color) 12%, transparent);
  border: var(--mc-ring-border) solid var(--mc-color);
  box-shadow: none;
}

.mc-container[data-state='text'] .mc-ring {
  width: 2px;
  height: 20px;
  border-radius: 1px;
  background: var(--mc-color);
  box-shadow: var(--mc-ring-shadow);
}

/* ── Shadow: off ────────────────────────────────────────────────────────────
   Zeroing the properties (rather than making them transparent) also drops the
   compositing layer the filter would otherwise keep alive on every frame. */
.mc-container.mc-shadows-off .mc-arrow { filter: none }
.mc-container.mc-shadows-off .mc-ring { box-shadow: none }

/* ── Press feedback ─────────────────────────────────────────────────────── */
.mc-container.mc-pressed .mc-arrow {
  transform: ${BOX} scale(0.88);
  transition-duration: 0.1s;
}
.mc-container.mc-pressed .mc-ring {
  transform: translate(-50%, -50%) scale(0.8);
  transition-duration: 0.1s;
}

/* ── Ring disabled: keep the arrow in every state ───────────────────────── */
.mc-container.mc-ring-off .mc-ring { display: none }
.mc-container.mc-ring-off .mc-arrow { opacity: 1; transform: ${BOX} }

/* ── System pointer ─────────────────────────────────────────────────────── */
html.has-mc-cursor,
html.has-mc-cursor * { cursor: none !important }

/* DevTools element-picking (Ctrl+Shift+C) lays its own overlay over the page
   and swallows pointer events. Hand the native pointer back so the page stays
   inspectable — the custom cursor stays mounted and keeps tracking. */
html.has-mc-cursor.devtools-open,
html.has-mc-cursor.devtools-open * { cursor: default !important }

/* Native scrollbars are composited above every fixed element, so the custom
   cursor can never cover them. During a scrollbar drag we hand control back
   rather than leaving the user with no visible pointer at all. */
html.has-mc-cursor.scrollbar-active,
html.has-mc-cursor.scrollbar-active * { cursor: auto !important }
html.has-mc-cursor.scrollbar-active .mc-container { opacity: 0 }

@media (prefers-reduced-motion: reduce) {
  .mc-container,
  .mc-arrow,
  .mc-ring { transition: none !important }
}
`

export function injectStyles(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return

  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = styles.trim()
  ;(document.head || document.documentElement).appendChild(el)
}

export const STYLES = styles.trim()
