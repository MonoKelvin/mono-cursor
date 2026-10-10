const STYLE_ID = 'mono-cursor-styles'

const styles = `
:root {
  --mc-dot-size: 8px;
  --mc-ring-size: 40px;
  --mc-ring-border: 1.5px;
  --mc-color: #6366f1;
  --mc-z-index: 999999;
  --mc-opacity: 1;
}

.mc-container {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: var(--mc-z-index);
  opacity: 0;
  transition: opacity 0.2s ease;
  will-change: transform;
}

.mc-container.mc-visible {
  opacity: var(--mc-opacity, 1);
}

.mc-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--mc-dot-size);
  height: var(--mc-dot-size);
  background: var(--mc-color);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              height 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              background 0.2s ease;
  box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
}

.mc-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--mc-ring-size);
  height: var(--mc-ring-size);
  border: var(--mc-ring-border) solid var(--mc-color);
  border-radius: 50%;
  opacity: 0.7;
  transform: translate(-50%, -50%);
  transition: width 0.25s cubic-bezier(0.34, 1.2, 0.64, 1),
              height 0.25s cubic-bezier(0.34, 1.2, 0.64, 1),
              opacity 0.2s ease,
              border-color 0.2s ease,
              background 0.2s ease;
  will-change: transform, width, height, opacity;
}

.mc-container[data-state="pointer"] .mc-ring {
  opacity: 1;
  background: rgba(99, 102, 241, 0.08);
  width: calc(var(--mc-ring-size) * 1.2);
  height: calc(var(--mc-ring-size) * 1.2);
}

.mc-container[data-state="text"] .mc-ring {
  opacity: 0.5;
  border-radius: 2px;
  width: 2px;
  height: 22px;
  background: var(--mc-color);
  border-color: transparent;
}

.mc-container[data-state="circle"] .mc-ring {
  opacity: 1;
  background: rgba(99, 102, 241, 0.12);
  width: calc(var(--mc-ring-size) * 1.4);
  height: calc(var(--mc-ring-size) * 1.4);
}

.mc-container.mc-pressed .mc-dot {
  transform: translate(-50%, -50%) scale(0.7);
}

.mc-container.mc-pressed .mc-ring {
  opacity: 0.3 !important;
  transform: translate(-50%, -50%) scale(0.85);
  transition: transform 0.1s ease, opacity 0.1s ease;
}

.mc-container.mc-ring-disabled .mc-ring {
  display: none;
}

.mc-hide-default,
.mc-hide-default * {
  cursor: none !important;
}

.mc-dot,
.mc-ring {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (prefers-reduced-motion: reduce) {
  .mc-dot,
  .mc-ring,
  .mc-container {
    transition: none !important;
    animation: none !important;
  }
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
