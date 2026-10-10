import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MonoCursor, createCursor, STYLES } from '../src/index'
import { DEFAULT_OPTIONS } from '../src/constants'
import { setMediaMatches, resetMediaMatches } from './setup'

// ── Helpers ────────────────────────────────────────────────────────────────

function setupDOM() {
  document.body.innerHTML = `
    <a id="link" href="#">Link</a>
    <button id="button">Button</button>
    <input id="input" />
    <input id="range" type="range" />
    <textarea id="textarea"></textarea>
    <div id="div">Div</div>
    <div id="editable" contenteditable="true">Editable</div>
    <div id="custom-circle" data-cursor="circle">Circle area</div>
    <div id="custom-text" data-cursor="text">Text area</div>
    <div id="interactive" data-cursor="interactive">Interactive</div>
    <a href="#" id="anchor"><div id="nested">nested</div></a>
  `
}

const container = () => document.querySelector<HTMLElement>('.mc-container')
const state = () => container()?.getAttribute('data-state')

const move = (x = 10, y = 20) =>
  window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }))

const hover = (el: Element) => el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))

const html = () => document.documentElement.classList

beforeEach(() => {
  MonoCursor.destroy()
  // Global options are sticky across instances — normalize them per test.
  MonoCursor.configure(DEFAULT_OPTIONS)
  setupDOM()
})

afterEach(() => {
  MonoCursor.destroy()
  resetMediaMatches()
  document.body.innerHTML = ''
})

// ─────────────────────────────────────────────────────────────────────────────
describe('lifecycle', () => {
  it('mounts a container with the arrow and ring, and injects styles', () => {
    MonoCursor.init()

    expect(container()).not.toBeNull()
    expect(container()?.querySelector('svg.mc-arrow path')).not.toBeNull()
    expect(container()?.querySelector('i.mc-ring')).not.toBeNull()
    expect(document.getElementById('mono-cursor-styles')).not.toBeNull()
  })

  it('does not touch the system cursor until the pointer actually moves', () => {
    MonoCursor.init()
    expect(html().contains('has-mc-cursor')).toBe(false)

    move()
    expect(html().contains('has-mc-cursor')).toBe(true)
  })

  it('reuses the singleton on repeated init calls', () => {
    const first = MonoCursor.init()
    const second = MonoCursor.init()

    expect(second).toBe(first)
    expect(document.querySelectorAll('.mc-container').length).toBe(1)
  })

  it('bails out on coarse pointers and leaves the native cursor alone', () => {
    setMediaMatches({ '(pointer: fine)': false })
    MonoCursor.init()
    move()

    expect(container()).toBeNull()
    expect(html().contains('has-mc-cursor')).toBe(false)
  })

  it('bails out when reduced motion is requested', () => {
    setMediaMatches({ '(prefers-reduced-motion: reduce)': true })
    MonoCursor.init()

    expect(container()).toBeNull()
  })

  it('removes everything on destroy', () => {
    MonoCursor.init()
    move()
    MonoCursor.destroy()

    expect(container()).toBeNull()
    expect(MonoCursor.getInstance()).toBeNull()
    expect(html().contains('has-mc-cursor')).toBe(false)
  })

  it('is safe to destroy twice', () => {
    MonoCursor.init()
    expect(() => {
      MonoCursor.destroy()
      MonoCursor.destroy()
    }).not.toThrow()
  })

  it('only tears down the instance being destroyed', () => {
    const a = new MonoCursor().init()
    const b = new MonoCursor().init()
    expect(document.querySelectorAll('.mc-container').length).toBe(2)

    b.destroy()
    expect(document.querySelectorAll('.mc-container').length).toBe(1)

    a.destroy()
    expect(document.querySelectorAll('.mc-container').length).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('options', () => {
  it('applies every option as a CSS variable', () => {
    MonoCursor.init({
      color: '#ff0000',
      arrowSize: 32,
      ringSize: 48,
      ringBorderWidth: 2,
      zIndex: 42,
    })

    const root = document.documentElement.style
    expect(root.getPropertyValue('--mc-color')).toBe('#ff0000')
    expect(root.getPropertyValue('--mc-arrow-size')).toBe('32px')
    expect(root.getPropertyValue('--mc-ring-size')).toBe('48px')
    expect(root.getPropertyValue('--mc-ring-border')).toBe('2px')
    expect(root.getPropertyValue('--mc-z-index')).toBe('42')
  })

  it('exposes the defaults', () => {
    expect(DEFAULT_OPTIONS).toEqual({
      color: '#6366f1',
      arrowSize: 26,
      ringSize: 22,
      ringBorderWidth: 1.5,
      hideDefaultCursor: true,
      enableCircle: true,
      shadow: true,
      clickEffect: true,
      zIndex: 999999,
    })
  })

  it('merges options through configure()', () => {
    MonoCursor.init()
    const instance = MonoCursor.getInstance()
    MonoCursor.configure({ color: '#00ff00', ringSize: 80 })

    expect(MonoCursor.getInstance()).toBe(instance)
    expect(document.documentElement.style.getPropertyValue('--mc-color')).toBe('#00ff00')
    expect(document.documentElement.style.getPropertyValue('--mc-ring-size')).toBe('80px')
  })

  it('accepts options before init', () => {
    MonoCursor.setRingSize(64)
    MonoCursor.init()
    expect(document.documentElement.style.getPropertyValue('--mc-ring-size')).toBe('64px')
  })

  it('is a no-op (not a crash) before init', () => {
    expect(() => {
      MonoCursor.setColor('#000')
      MonoCursor.setState('pointer')
      MonoCursor.enable()
      MonoCursor.disable()
    }).not.toThrow()
  })

  it('hides the ring instead of the arrow when the circle is disabled', () => {
    MonoCursor.init({ enableCircle: false })
    expect(container()?.classList.contains('mc-ring-off')).toBe(true)

    MonoCursor.setEnableCircle(true)
    expect(container()?.classList.contains('mc-ring-off')).toBe(false)
  })

  it('keeps the shadow on by default and drops it on request', () => {
    MonoCursor.init()
    expect(container()?.classList.contains('mc-shadows-off')).toBe(false)

    MonoCursor.setShadow(false)
    expect(container()?.classList.contains('mc-shadows-off')).toBe(true)

    MonoCursor.setShadow(true)
    expect(container()?.classList.contains('mc-shadows-off')).toBe(false)
  })

  it('can be initialized without a shadow', () => {
    MonoCursor.init({ shadow: false })
    expect(container()?.classList.contains('mc-shadows-off')).toBe(true)
  })

  it('leaves the system cursor alone when hideDefaultCursor is off', () => {
    MonoCursor.init({ hideDefaultCursor: false })
    move()
    expect(html().contains('has-mc-cursor')).toBe(false)
  })

  it('drops the system cursor override when toggled off at runtime', () => {
    MonoCursor.init()
    move()
    expect(html().contains('has-mc-cursor')).toBe(true)

    MonoCursor.setHideDefaultCursor(false)
    expect(html().contains('has-mc-cursor')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('pointer tracking', () => {
  it('writes the pointer position straight onto the transform', () => {
    MonoCursor.init()
    move(300, 400)
    expect(container()?.style.transform).toBe('translate3d(300px, 400px, 0)')
  })

  it('follows pointermove as well, for drags', () => {
    MonoCursor.init()
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 5, clientY: 6 }))
    expect(container()?.style.transform).toBe('translate3d(5px, 6px, 0)')
  })

  it('shows the cursor on first move and keeps it visible', () => {
    MonoCursor.init()
    move()
    expect(container()?.classList.contains('mc-visible')).toBe(true)
  })

  it('never hides again — window blur, leave and scroll are ignored', () => {
    MonoCursor.init()
    move()

    window.dispatchEvent(new MouseEvent('mouseleave'))
    window.dispatchEvent(new MouseEvent('blur'))
    document.dispatchEvent(new MouseEvent('mouseleave'))
    document.dispatchEvent(new MouseEvent('scroll'))
    document.dispatchEvent(new Event('visibilitychange'))

    expect(container()?.classList.contains('mc-visible')).toBe(true)
    expect(html().contains('has-mc-cursor')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('state detection', () => {
  it.each([
    ['link', 'pointer'],
    ['button', 'pointer'],
    ['interactive', 'pointer'],
    ['custom-circle', 'pointer'],
    ['nested', 'pointer'],
    ['input', 'text'],
    ['textarea', 'text'],
    ['editable', 'text'],
    ['custom-text', 'text'],
    ['range', 'pointer'],
    ['div', 'default'],
  ])('maps #%s to the "%s" state', (id, expected) => {
    MonoCursor.init()
    hover(document.getElementById(id)!)
    expect(state()).toBe(expected)
  })

  it('updates the state as the pointer crosses elements', () => {
    MonoCursor.init()

    hover(document.getElementById('link')!)
    expect(state()).toBe('pointer')

    hover(document.getElementById('input')!)
    expect(state()).toBe('text')

    hover(document.getElementById('div')!)
    expect(state()).toBe('default')
  })

  it('keeps an explicit state until the pointer reaches different content', () => {
    MonoCursor.init()
    MonoCursor.setState('pointer')
    expect(state()).toBe('pointer')

    hover(document.getElementById('div')!)
    expect(state()).toBe('default')
  })

  it('ignores non-element targets', () => {
    MonoCursor.init()
    hover(document.getElementById('link')!)
    window.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    expect(state()).toBe('pointer')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('press feedback', () => {
  it('marks the container while the button is down', () => {
    MonoCursor.init()

    window.dispatchEvent(new PointerEvent('pointerdown'))
    expect(container()?.classList.contains('mc-pressed')).toBe(true)

    window.dispatchEvent(new PointerEvent('pointerup'))
    expect(container()?.classList.contains('mc-pressed')).toBe(false)
  })

  it('clears the pressed state on mouseup too', () => {
    MonoCursor.init()
    window.dispatchEvent(new PointerEvent('pointerdown'))
    window.dispatchEvent(new MouseEvent('mouseup'))
    expect(container()?.classList.contains('mc-pressed')).toBe(false)
  })

  it('can be switched off', () => {
    MonoCursor.init({ clickEffect: false })
    window.dispatchEvent(new PointerEvent('pointerdown'))
    expect(container()?.classList.contains('mc-pressed')).toBe(false)
  })

  it('releases the pointer over a scrollbar trough instead of pressing', () => {
    MonoCursor.init()

    // jsdom reports a zero-sized viewport, so any positive clientX is
    // "outside the content box" — i.e. over the scrollbar.
    window.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
    expect(html().contains('scrollbar-active')).toBe(true)
    expect(container()?.classList.contains('mc-pressed')).toBe(false)

    window.dispatchEvent(new PointerEvent('pointerup'))
    expect(html().contains('scrollbar-active')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('devtools', () => {
  it('releases the native pointer when the viewport shrinks past the threshold', () => {
    Object.defineProperty(window, 'outerWidth', { value: 1200, configurable: true })
    Object.defineProperty(window, 'innerWidth', { value: 900, configurable: true })

    MonoCursor.init()
    window.dispatchEvent(new Event('resize'))

    expect(html().contains('devtools-open')).toBe(true)

    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })
    window.dispatchEvent(new Event('resize'))
    expect(html().contains('devtools-open')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('enable / disable', () => {
  it('pauses tracking and hands the native cursor back', () => {
    MonoCursor.init()
    move()
    MonoCursor.disable()

    expect(container()?.classList.contains('mc-visible')).toBe(false)
    expect(html().contains('has-mc-cursor')).toBe(false)
  })

  it('ignores moves while disabled', () => {
    MonoCursor.init()
    MonoCursor.disable()
    move()
    expect(container()?.classList.contains('mc-visible')).toBe(false)
  })

  it('restores the cursor on enable', () => {
    MonoCursor.init()
    move()
    MonoCursor.disable()
    MonoCursor.enable()

    expect(container()?.classList.contains('mc-visible')).toBe(true)
    expect(html().contains('has-mc-cursor')).toBe(true)
  })

  it('stays hidden on enable if it was never shown', () => {
    MonoCursor.init()
    MonoCursor.enable()
    expect(container()?.classList.contains('mc-visible')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('instance API', () => {
  it('supports independent instances', () => {
    const a = new MonoCursor({ color: '#111' })
    const b = new MonoCursor({ color: '#222' })
    a.init()
    b.init()

    expect(document.querySelectorAll('.mc-container').length).toBe(2)

    a.destroy()
    b.destroy()
  })

  it('applies setters on an instance', () => {
    const cursor = new MonoCursor().init()
    cursor.setColor('#abcdef')
    cursor.setArrowSize(40)
    cursor.setState('text')

    expect(document.documentElement.style.getPropertyValue('--mc-color')).toBe('#abcdef')
    expect(document.documentElement.style.getPropertyValue('--mc-arrow-size')).toBe('40px')
    expect(state()).toBe('text')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('createCursor', () => {
  it('is an alias for init', () => {
    const cursor = createCursor({ color: '#c0ffee' })
    expect(cursor).toBe(MonoCursor.getInstance())
    expect(document.documentElement.style.getPropertyValue('--mc-color')).toBe('#c0ffee')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('STYLES', () => {
  it('ships the arrow tip pinning and the system-cursor overrides', () => {
    expect(STYLES).toContain('.mc-arrow')
    expect(STYLES).toContain('paint-order: stroke')
    expect(STYLES).toContain('html.has-mc-cursor *')
    expect(STYLES).toContain('prefers-reduced-motion')
  })
})
