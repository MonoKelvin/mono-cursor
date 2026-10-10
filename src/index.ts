import { ARROW_PATH, ARROW_VIEWBOX, DEFAULT_OPTIONS } from './constants'
import { injectStyles } from './styles'
import type { MonoCursorOptions, CursorState } from './types'

// ─── Hover detection ─────────────────────────────────────────────────────────

/** Clickable targets → ring. */
const POINTER_SELECTOR = [
  'a',
  'button',
  '[role=button]',
  '[role=link]',
  '[role=tab]',
  'select',
  'label',
  'summary',
  '[data-cursor=interactive]',
  '[data-cursor=pointer]',
  '[data-cursor=link]',
  '[data-cursor=circle]',
].join(',')

/** Typeable targets → I-beam. */
const TEXT_SELECTOR = 'input, textarea, [contenteditable=true], [data-cursor=text]'

/** Inputs where an I-beam would be wrong — they get the ring instead. */
const NON_TEXT_INPUT = new Set([
  'range', 'checkbox', 'radio', 'button', 'submit', 'reset', 'color', 'file', 'image',
])

/** A docked DevTools panel shrinks the viewport by at least this much. */
const DEVTOOLS_GAP = 160

const ARROW_SVG =
  `<svg class="mc-arrow" viewBox="0 0 ${ARROW_VIEWBOX} ${ARROW_VIEWBOX}" aria-hidden="true">` +
  `<path d="${ARROW_PATH}"/></svg><i class="mc-ring"></i>`

// ─── Module-level singleton state ────────────────────────────────────────────
let _singletonInstance: MonoCursor | null = null
let _singletonOptions: Required<MonoCursorOptions> = { ...DEFAULT_OPTIONS }

export class MonoCursor {
  // ─── Static singleton API ────────────────────────────────────────────────

  /**
   * Global singleton — call once at app startup.
   * Safe to call multiple times; only initializes on the first call.
   * Options are sticky: each call merges over whatever was configured before.
   */
  static init(options: MonoCursorOptions = {}): MonoCursor {
    if (!_singletonInstance) {
      _singletonOptions = { ..._singletonOptions, ...options }
      _singletonInstance = new MonoCursor(_singletonOptions)._init()
    }
    return _singletonInstance
  }

  /** Merge new options into the global options and re-apply the CSS variables. */
  static configure(options: MonoCursorOptions): MonoCursor {
    MonoCursor._apply(options)
    return _singletonInstance!
  }

  /** Resume the global cursor */
  static enable(): void { _singletonInstance?._enable() }

  /** Pause the global cursor — keeps the DOM intact */
  static disable(): void { _singletonInstance?._disable() }

  /** Remove the global cursor from the DOM */
  static destroy(): void {
    _singletonInstance?._destroy()
    _singletonInstance = null
  }

  /** Alias for `init()` */
  static create(options?: MonoCursorOptions): MonoCursor { return MonoCursor.init(options) }

  // ─── Static setters — all proxy to the singleton ─────────────────────────

  static setColor(color: string): void { MonoCursor._apply({ color }) }
  static setArrowSize(arrowSize: number): void { MonoCursor._apply({ arrowSize }) }
  static setRingSize(ringSize: number): void { MonoCursor._apply({ ringSize }) }
  static setRingBorderWidth(ringBorderWidth: number): void { MonoCursor._apply({ ringBorderWidth }) }
  static setHideDefaultCursor(hideDefaultCursor: boolean): void { MonoCursor._apply({ hideDefaultCursor }) }
  static setEnableCircle(enableCircle: boolean): void { MonoCursor._apply({ enableCircle }) }
  static setShadow(shadow: boolean): void { MonoCursor._apply({ shadow }) }
  static setClickEffect(clickEffect: boolean): void { MonoCursor._apply({ clickEffect }) }

  /** Force a state until the pointer next moves onto different content. */
  static setState(state: CursorState): void { _singletonInstance?._setState(state) }

  /** The global instance, or `null` when it has not been initialized. */
  static getInstance(): MonoCursor | null { return _singletonInstance }

  /**
   * Store options for later and push them onto the live instance. Callable
   * before `init()` — the values are then used as the init defaults.
   */
  private static _apply(patch: MonoCursorOptions): void {
    const base = _singletonInstance ? _singletonInstance._opts : _singletonOptions
    _singletonOptions = { ...base, ...patch }
    if (_singletonInstance) {
      _singletonInstance._opts = { ..._singletonOptions }
      _singletonInstance._applyCSS()
    }
  }

  // ─── Instance implementation ─────────────────────────────────────────────

  private _container: HTMLElement | null = null
  private _state: CursorState = 'default'
  private _visible = false
  private _enabled = true
  private _devtoolsOpen = false
  private _devtoolsTimer: number | null = null
  private _opts: Required<MonoCursorOptions>

  constructor(options: MonoCursorOptions = {}) {
    this._opts = { ...DEFAULT_OPTIONS, ...options }
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  private _init(): this {
    if (typeof window === 'undefined' || typeof document === 'undefined') return this
    if (this._container) return this

    // Touch devices have no pointer to replace, and a cursor that cannot be
    // eased or followed is worse than the native one for reduced motion.
    if (!window.matchMedia?.('(pointer: fine)').matches) return this
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return this

    injectStyles()

    const container = document.createElement('div')
    container.className = 'mc-container'
    container.dataset.state = 'default'
    container.setAttribute('aria-hidden', 'true')
    container.innerHTML = ARROW_SVG
    ;(document.body || document.documentElement).appendChild(container)
    this._container = container

    this._attachListeners()
    this._applyCSS()
    return this
  }

  /** Remove the cursor from the DOM and detach every listener. */
  _destroy(): void {
    this._detachListeners()
    this._container?.remove()
    this._container = null
    this._visible = false
    this._state = 'default'
    document.documentElement.classList.remove('has-mc-cursor', 'devtools-open', 'scrollbar-active')
  }

  // ─── Event listeners ─────────────────────────────────────────────────────

  private _attachListeners(): void {
    // `pointermove` as well as `mousemove`: during a drag the browser may
    // implicitly capture the pointer and stop delivering mousemove.
    window.addEventListener('mousemove', this._onMove, { passive: true })
    window.addEventListener('pointermove', this._onMove, { passive: true })
    window.addEventListener('mouseover', this._onOver, { passive: true })
    window.addEventListener('pointerdown', this._onDown, { passive: true })
    window.addEventListener('pointerup', this._onUp, { passive: true })
    window.addEventListener('mouseup', this._onUp, { passive: true })
    window.addEventListener('resize', this._syncDevTools)
    window.addEventListener('focus', this._syncDevTools)
    this._devtoolsTimer = window.setInterval(this._syncDevTools, 1000)
    this._syncDevTools()
  }

  private _detachListeners(): void {
    window.removeEventListener('mousemove', this._onMove)
    window.removeEventListener('pointermove', this._onMove)
    window.removeEventListener('mouseover', this._onOver)
    window.removeEventListener('pointerdown', this._onDown)
    window.removeEventListener('pointerup', this._onUp)
    window.removeEventListener('mouseup', this._onUp)
    window.removeEventListener('resize', this._syncDevTools)
    window.removeEventListener('focus', this._syncDevTools)
    if (this._devtoolsTimer !== null) {
      window.clearInterval(this._devtoolsTimer)
      this._devtoolsTimer = null
    }
  }

  // ─── Event handlers ──────────────────────────────────────────────────────

  /**
   * Written straight from the event — no rAF hop, no easing. Writing only
   * `transform` triggers no layout, so the extra writes cost nothing while the
   * cursor lands on the same frame as the system pointer.
   */
  private _onMove = (event: MouseEvent): void => {
    if (!this._enabled || !this._container) return
    this._container.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
    // Light up on the first move, then never hide again.
    if (!this._visible) this._show()
  }

  private _onOver = (event: MouseEvent): void => {
    const target = event.target
    if (!(target instanceof Element) || target === this._container) return
    const next = detectState(target)
    if (next !== this._state) this._setState(next)
  }

  private _onDown = (event: MouseEvent): void => {
    if (!this._enabled || !this._container) return
    if (this._hitsScrollbar(event)) {
      document.documentElement.classList.add('scrollbar-active')
      return
    }
    if (this._opts.clickEffect) this._container.classList.add('mc-pressed')
  }

  private _onUp = (): void => {
    this._container?.classList.remove('mc-pressed')
    document.documentElement.classList.remove('scrollbar-active')
  }

  // ─── State ───────────────────────────────────────────────────────────────

  private _setState(state: CursorState): void {
    this._state = state
    if (this._container) this._container.dataset.state = state
  }

  // ─── Visibility ──────────────────────────────────────────────────────────

  private _show(): void {
    if (!this._container) return
    this._visible = true
    this._container.classList.add('mc-visible')
    this._syncSystemCursor()
  }

  private _hide(): void {
    if (!this._container) return
    this._visible = false
    this._container.classList.remove('mc-visible')
    this._syncSystemCursor()
  }

  /** The native pointer is hidden only while the custom one is actually drawn. */
  private _syncSystemCursor(): void {
    document.documentElement.classList.toggle(
      'has-mc-cursor',
      this._enabled && this._visible && this._opts.hideDefaultCursor,
    )
  }

  private _enable(): void {
    this._enabled = true
    if (this._visible) this._show()
  }

  private _disable(): void {
    this._enabled = false
    this._container?.classList.remove('mc-visible')
    this._syncSystemCursor()
  }

  // ─── CSS variables ───────────────────────────────────────────────────────

  private _applyCSS(): void {
    const root = document.documentElement
    const o = this._opts

    root.style.setProperty('--mc-color', o.color)
    root.style.setProperty('--mc-arrow-size', `${o.arrowSize}px`)
    root.style.setProperty('--mc-ring-size', `${o.ringSize}px`)
    root.style.setProperty('--mc-ring-border', `${o.ringBorderWidth}px`)
    root.style.setProperty('--mc-z-index', String(o.zIndex))

    this._container?.classList.toggle('mc-ring-off', !o.enableCircle)
    this._container?.classList.toggle('mc-shadows-off', !o.shadow)
    this._syncSystemCursor()
  }

  // ─── Chrome overrides ────────────────────────────────────────────────────

  /**
   * A docked DevTools panel shrinks the viewport, which is the only signal
   * available to page script. While it is open the native pointer is released
   * so the page stays inspectable; the cursor itself is never hidden or
   * unmounted. Undocked DevTools cannot be detected — use
   * `setHideDefaultCursor(false)` there.
   */
  private _syncDevTools = (): void => {
    const open =
      window.outerWidth - window.innerWidth > DEVTOOLS_GAP ||
      window.outerHeight - window.innerHeight > DEVTOOLS_GAP
    if (open === this._devtoolsOpen) return
    this._devtoolsOpen = open
    document.documentElement.classList.toggle('devtools-open', open)
  }

  /**
   * Native scrollbars sit above every fixed element, so pressing on a
   * scrollbar trough releases the pointer for the duration of the drag.
   * Deliberately conservative: only the trough outside the content box counts.
   */
  private _hitsScrollbar(event: MouseEvent): boolean {
    const root = document.documentElement
    if (event.clientX > root.clientWidth || event.clientY > root.clientHeight) return true

    const target = event.target
    if (!(target instanceof HTMLElement)) return false

    const style = getComputedStyle(target)
    const scrollY =
      (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
      target.scrollHeight > target.clientHeight
    const scrollX =
      (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
      target.scrollWidth > target.clientWidth
    if (!scrollY && !scrollX) return false

    const rect = target.getBoundingClientRect()
    if (scrollY && event.clientX - rect.left > target.clientLeft + target.clientWidth) return true
    if (scrollX && event.clientY - rect.top > target.clientTop + target.clientHeight) return true
    return false
  }

  // ─── Instance API (for non-singleton use) ────────────────────────────────

  init(): this { return this._init() }
  destroy(): void { this._destroy() }
  enable(): void { this._enable() }
  disable(): void { this._disable() }
  showCursor(): void { this._show() }
  hideCursor(): void { this._hide() }
  setColor(color: string): void { this._opts.color = color; this._applyCSS() }
  setArrowSize(size: number): void { this._opts.arrowSize = size; this._applyCSS() }
  setRingSize(size: number): void { this._opts.ringSize = size; this._applyCSS() }
  setRingBorderWidth(width: number): void { this._opts.ringBorderWidth = width; this._applyCSS() }
  setHideDefaultCursor(hide: boolean): void { this._opts.hideDefaultCursor = hide; this._applyCSS() }
  setEnableCircle(enable: boolean): void { this._opts.enableCircle = enable; this._applyCSS() }
  setShadow(shadow: boolean): void { this._opts.shadow = shadow; this._applyCSS() }
  setClickEffect(clickEffect: boolean): void { this._opts.clickEffect = clickEffect }
  setState(state: CursorState): void { this._setState(state) }
}

// ─── Hover detection ─────────────────────────────────────────────────────────

function detectState(el: Element): CursorState {
  if (el.matches(TEXT_SELECTOR) || el.closest(TEXT_SELECTOR)) {
    const input = el.closest('input')
    if (!input) return 'text'
    const type = input.getAttribute('type')?.toLowerCase() ?? 'text'
    return NON_TEXT_INPUT.has(type) ? 'pointer' : 'text'
  }
  if (el.closest(POINTER_SELECTOR)) return 'pointer'
  return 'default'
}

// ─── Module-level factory ────────────────────────────────────────────────────

/** Alias for `MonoCursor.init()`. */
export function createCursor(options?: MonoCursorOptions): MonoCursor {
  return MonoCursor.init(options)
}

export type { MonoCursorOptions, CursorState } from './types'
export { STYLES } from './styles'

// ─── Browser global ──────────────────────────────────────────────────────────
// The IIFE build exposes `MonoCursor` / `createCursor` for `<script>` users.

const _global: any =
  typeof self !== 'undefined' ? self : typeof globalThis !== 'undefined' ? globalThis : null

if (_global) {
  _global.MonoCursor = MonoCursor
  _global.createCursor = createCursor
}
