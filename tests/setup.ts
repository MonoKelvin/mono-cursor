// ── matchMedia ───────────────────────────────────────────────────────────────
// jsdom never evaluates media queries (everything is "no match"), so the
// pointer / reduced-motion guards have to be faked: fine pointer + no
// reduced-motion unless a test overrides it.

type MediaMatches = Record<string, boolean>

let mediaMatches: MediaMatches = {}

/** Override media query results for a single test (reset automatically). */
export function setMediaMatches(next: MediaMatches): void {
  mediaMatches = next
}

export function resetMediaMatches(): void {
  mediaMatches = {}
}

function matchMedia(query: string): MediaQueryList {
  const matched = query in mediaMatches ? mediaMatches[query] : !query.includes('reduced-motion')
  return {
    matches: matched,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList
}

Object.defineProperty(window, 'matchMedia', { writable: true, configurable: true, value: matchMedia })
Object.defineProperty(global, 'matchMedia', { writable: true, configurable: true, value: matchMedia })

// ── getComputedStyle ─────────────────────────────────────────────────────────
// Only the bits scrollbar detection reads; jsdom's own version would need a
// full layout pass.
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  configurable: true,
  value: () => ({ overflowY: 'visible', overflowX: 'visible' }),
})

// ── PointerEvent ─────────────────────────────────────────────────────────────
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId = 0
    pointerType = 'mouse'
    isPrimary = true
    constructor(type: string, init?: MouseEventInit) {
      super(type, init)
    }
  }
  Object.defineProperty(window, 'PointerEvent', { writable: true, value: PointerEventPolyfill })
  Object.defineProperty(global, 'PointerEvent', { writable: true, value: PointerEventPolyfill })
}
