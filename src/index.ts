import { DEFAULT_OPTIONS } from './constants'
import { injectStyles } from './styles'
import type { MonoCursorOptions, CursorState, CursorType } from './types'

// ─── Module-level singleton state ────────────────────────────────────────────
let _singletonInstance: MonoCursor | null = null
let _singletonOptions: Required<MonoCursorOptions> = { ...DEFAULT_OPTIONS }

// ─── Module-level helpers ─────────────────────────────────────────────────────
function _destroyInstance(): void {
  _singletonInstance?._destroy()
  _singletonInstance = null
}

export class MonoCursor {
  // ─── Static singleton API ────────────────────────────────────────────────

  /**
   * Global singleton — call once at app startup.
   * Safe to call multiple times; only initializes on the first call.
   */
  static init(options: MonoCursorOptions = {}): MonoCursor {
    if (!_singletonInstance) {
      _singletonOptions = { ...DEFAULT_OPTIONS, ...options }
      _singletonInstance = new MonoCursor(_singletonOptions)._init()
    }
    return _singletonInstance
  }

  /** Replace current global options and re-apply CSS variables */
  static configure(options: MonoCursorOptions): MonoCursor {
    _singletonOptions = { ..._singletonOptions, ...options }
    if (_singletonInstance) {
      _singletonInstance._opts = { ..._singletonOptions }
      _singletonInstance._applyCSS()
    }
    return _singletonInstance!
  }

  /** Enable the global cursor */
  static enable(): void { _singletonInstance?._enable() }

  /** Disable (pause) the global cursor — keeps DOM intact */
  static disable(): void { _singletonInstance?._disable() }

  /** Destroy the global singleton */
  static destroy(): void { _destroyInstance() }

  /** Shortcut: create + init in one call (static factory) */
  static create(options?: MonoCursorOptions): MonoCursor { return MonoCursor.init(options) }

  // ─── Static setters — all proxy to the singleton ───────────────────────

  static setColor(color: string): void { _singletonInstance?._setColor(color) }
  static setDotSize(size: number): void { _singletonInstance?._setDotSize(size) }
  static setRingSize(size: number): void { _singletonInstance?._setRingSize(size) }
  static setRingBorderWidth(width: number): void { _singletonInstance?._setRingBorderWidth(width) }
  static setLerpFactor(factor: number): void { _singletonInstance?._setLerpFactor(factor) }
  static setState(state: CursorState): void { _singletonInstance?._setState(state) }
  static setHideDefaultCursor(hide: boolean): void { _singletonInstance?._setHideDefaultCursor(hide) }
  static setEnableCircle(enable: boolean): void { _singletonInstance?._setEnableCircle(enable) }

  /** Returns the current global instance (may be null if not initialized) */
  static getInstance(): MonoCursor | null { return _singletonInstance }

  /** Reset the singleton — for testing only */
  static _reset(): void { _destroyInstance() }

  // ─── Instance implementation ─────────────────────────────────────────────

  private _container: HTMLElement | null = null
  private _dot: HTMLElement | null = null
  private _ring: HTMLElement | null = null
  private _state: CursorState = 'default'
  private _visible = false
  private _enabled = true
  private _rafId: number | null = null
  private _target = { x: -1000, y: -1000 }
  private _current = { x: -1000, y: -1000 }
  private _listeners = new Map<string, EventListener>()
  private _opts: Required<MonoCursorOptions>

  constructor(options: MonoCursorOptions = {}) {
    this._opts = { ...DEFAULT_OPTIONS, ...options }
  }

  // ─── Internal init (called by static init() / create()) ─────────────────

  private _init(): this {
    if (typeof window === 'undefined' || !document) return this
    if (this._container) return this

    injectStyles()
    this._createElements()
    this._attachListeners()
    this._applyCSS()
    return this
  }

  // ─── Element creation ────────────────────────────────────────────────────

  private _createElements(): void {
    this._container = document.createElement('div')
    this._container.className = 'mc-container'
    this._container.setAttribute('aria-hidden', 'true')

    this._dot = document.createElement('div')
    this._dot.className = 'mc-dot'

    this._ring = document.createElement('div')
    this._ring.className = 'mc-ring'

    this._container.appendChild(this._dot)
    this._container.appendChild(this._ring)
    document.body.appendChild(this._container)
  }

  // ─── Event listeners ─────────────────────────────────────────────────────

  private _attachListeners(): void {
    const onMove = this._onMouseMove.bind(this)
    const onOver = this._onMouseOver.bind(this)
    const onLeave = this._onMouseLeave.bind(this)
    const onDown = this._onPointerDown.bind(this)
    const onUp = this._onPointerUp.bind(this)
    const onScroll = this._onScroll.bind(this)

    this._listeners.set('mousemove', onMove)
    this._listeners.set('mouseover', onOver)
    this._listeners.set('mouseleave', onLeave)
    this._listeners.set('pointerdown', onDown)
    this._listeners.set('pointerup', onUp)
    this._listeners.set('scroll', onScroll)

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('scroll', onScroll, { passive: true })
  }

  private _detachListeners(): void {
    this._listeners.forEach((listener, event) => {
      const opts = event === 'scroll' ? { passive: true } as AddEventListenerOptions : undefined
      document.removeEventListener(event, listener, opts)
    })
    this._listeners.clear()
  }

  // ─── Event handlers ───────────────────────────────────────────────────────

  private _onMouseMove(e: Event): void {
    const ev = e as MouseEvent
    this._target.x = ev.clientX
    this._target.y = ev.clientY
    if (!this._visible && this._enabled) {
      this._show()
    }
  }

  private _onMouseOver(e: Event): void {
    const ev = e as MouseEvent
    const el = ev.target as HTMLElement
    if (!el || el === this._container) return
    const type = this._detectCursorType(el)
    if (type !== this._state) {
      this._setState(type)
    }
  }

  private _onMouseLeave(): void {
    this._hide()
  }

  private _onPointerDown(): void {
    this._container?.classList.add('mc-pressed')
  }

  private _onPointerUp(): void {
    this._container?.classList.remove('mc-pressed')
  }

  private _onScroll(): void {
    this._target = { x: -1000, y: -1000 }
    this._current = { x: -1000, y: -1000 }
    if (this._container) {
      this._container.style.transform = 'translate3d(-1000px, -1000px, 0)'
    }
  }

  // ─── Cursor type detection ───────────────────────────────────────────────

  private _detectCursorType(el: HTMLElement): CursorType {
    if (!el || el.nodeType !== 1 /* Element node */ || el === document.documentElement) return 'default'

    const tag = el.tagName.toLowerCase()
    if (tag === 'input') {
      const type = el.getAttribute('type')?.toLowerCase() ?? 'text'
      // Text-like inputs get "text" cursor, others get pointer
      if (['text', 'email', 'password', 'tel', 'search', 'number', 'date', 'time', 'month', 'week', 'datetime-local'].includes(type)) {
        return 'text'
      }
      return 'pointer'
    }
    if (['a', 'button', 'select', 'label', 'summary', 'option', 'optgroup'].includes(tag)) return 'pointer'
    if (el.hasAttribute('contenteditable')) return 'text'
    if (el.closest('a, button, [role=button], [role=link], [data-cursor=interactive], [data-cursor=link]')) return 'pointer'
    if (el.closest('input:not([type=range]), textarea, [contenteditable=true]')) return 'text'

    const custom = el.dataset.cursor
    if (custom === 'pointer' || custom === 'link' || custom === 'interactive') return 'pointer'
    if (custom === 'text') return 'text'
    if (custom === 'circle') return 'circle'

    return 'default'
  }

  private _setState(type: CursorState): void {
    this._state = type
    if (this._container) {
      this._container.dataset.state = type
    }
  }

  // ─── Visibility ──────────────────────────────────────────────────────────

  private _show(): void {
    if (!this._container) return
    this._visible = true
    this._container.classList.add('mc-visible')
    document.body.classList.add('mc-active')
    this._startLoop()
  }

  private _hide(): void {
    if (!this._container) return
    this._visible = false
    this._container.classList.remove('mc-visible')
    document.body.classList.remove('mc-active')
  }

  private _startLoop(): void {
    if (this._rafId !== null) return
    this._tick()
  }

  private _stopLoop(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
  }

  private _tick = (): void => {
    if (!this._enabled) {
      this._rafId = null
      return
    }
    const lerp = this._opts.lerpFactor
    this._current.x += (this._target.x - this._current.x) * lerp
    this._current.y += (this._target.y - this._current.y) * lerp
    if (this._container) {
      this._container.style.transform = `translate3d(${this._current.x}px, ${this._current.y}px, 0)`
    }
    const nextId = requestAnimationFrame(this._tick)
    this._rafId = nextId
  }

  // ─── CSS variables ───────────────────────────────────────────────────────

  private _applyCSS(): void {
    if (!this._container) return
    const o = this._opts
    const root = document.documentElement

    root.style.setProperty('--mc-color', o.color)
    root.style.setProperty('--mc-dot-size', `${o.dotSize}px`)
    root.style.setProperty('--mc-ring-size', `${o.ringSize}px`)
    root.style.setProperty('--mc-ring-border', `${o.ringBorderWidth}px`)
    root.style.setProperty('--mc-z-index', String(o.zIndex))

    document.body.classList.toggle('mc-hide-default', o.hideDefaultCursor)
    this._container.classList.toggle('mc-ring-disabled', !o.enableCircle)
  }

  // ─── Public API (instance methods — also called by static setters) ────────

  private _setColor(color: string): void {
    this._opts.color = color
    document.documentElement.style.setProperty('--mc-color', color)
  }

  private _setDotSize(size: number): void {
    this._opts.dotSize = size
    document.documentElement.style.setProperty('--mc-dot-size', `${size}px`)
  }

  private _setRingSize(size: number): void {
    this._opts.ringSize = size
    document.documentElement.style.setProperty('--mc-ring-size', `${size}px`)
  }

  private _setRingBorderWidth(width: number): void {
    this._opts.ringBorderWidth = width
    document.documentElement.style.setProperty('--mc-ring-border', `${width}px`)
  }

  private _setLerpFactor(factor: number): void {
    this._opts.lerpFactor = Math.max(0.01, Math.min(1, factor))
  }

  private _setHideDefaultCursor(hide: boolean): void {
    this._opts.hideDefaultCursor = hide
    document.body.classList.toggle('mc-hide-default', hide)
  }

  private _setEnableCircle(enable: boolean): void {
    this._opts.enableCircle = enable
    this._container?.classList.toggle('mc-ring-disabled', !enable)
  }

  /** Enable / resume the cursor */
  private _enable(): void {
    this._enabled = true
    if (this._visible) {
      this._startLoop()
      this._container?.classList.add('mc-visible')
      document.body.classList.add('mc-active')
    }
  }

  /** Disable / pause the cursor — keeps DOM and listeners in place */
  private _disable(): void {
    this._enabled = false
    this._stopLoop()
    this._container?.classList.remove('mc-visible')
    document.body.classList.remove('mc-active')
  }

  /** Fully destroy — removes from DOM, removes listeners */
  _destroy(): void {
    this._stopLoop()
    this._detachListeners()
    if (this._container?.parentNode) {
      this._container.parentNode.removeChild(this._container)
    }
    document.body.classList.remove('mc-active', 'mc-hide-default')
    this._container = null
    this._dot = null
    this._ring = null
    this._visible = false
    this._current = { x: -1000, y: -1000 }
    this._target = { x: -1000, y: -1000 }
  }

  // ─── Public instance API (for non-singleton use) ─────────────────────────

  init(): this { return this._init() }
  destroy(): void { MonoCursor.destroy() }
  enable(): void { this._enable() }
  disable(): void { this._disable() }
  showCursor(): void { this._show() }
  hideCursor(): void { this._hide() }
  setColor(color: string): void { this._setColor(color) }
  setDotSize(size: number): void { this._setDotSize(size) }
  setRingSize(size: number): void { this._setRingSize(size) }
  setRingBorderWidth(width: number): void { this._setRingBorderWidth(width) }
  setState(state: CursorState): void { this._setState(state) }
  setStateManual(state: CursorState): void { this._setState(state) }
  setLerpFactor(factor: number): void { this._setLerpFactor(factor) }
  setHideDefaultCursor(hide: boolean): void { this._setHideDefaultCursor(hide) }
  setEnableCircle(enable: boolean): void { this._setEnableCircle(enable) }
}

// ─── Module-level factory (for ESM `import { createCursor }`) ─────────────

export function createCursor(options?: MonoCursorOptions): MonoCursor {
  return MonoCursor.init(options)
}

// ─── Browser global exposure ───────────────────────────────────────────────
// In IIFE/IIFE-like environments, expose on globalThis so
// `<script src="...index.global.js">` gives you `MonoCursor.init(...)`

var __mono_cursor_global: any
if (typeof self !== 'undefined') __mono_cursor_global = self
else if (typeof window !== 'undefined') __mono_cursor_global = window
else if (typeof globalThis !== 'undefined') __mono_cursor_global = globalThis

if (__mono_cursor_global) {
  __mono_cursor_global.MonoCursor = MonoCursor
  __mono_cursor_global.createCursor = createCursor
}
