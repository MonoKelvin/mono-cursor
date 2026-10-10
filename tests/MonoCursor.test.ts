import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MonoCursor, createCursor } from '../src/index'
import { DEFAULT_OPTIONS } from '../src/constants'

// ── Minimal DOM setup ──────────────────────────────────────────────────────
function setupDOM() {
  document.body.innerHTML = `
    <a id="link" href="#">Link</a>
    <button id="button">Button</button>
    <input id="input" />
    <textarea id="textarea"></textarea>
    <div id="div">Div</div>
    <div id="custom-circle" data-cursor="circle">Custom</div>
    <div id="custom-pointer" data-cursor="pointer">Custom Pointer</div>
    <div id="interactive" data-cursor="interactive">Interactive</div>
  `
}

function cleanupDOM() {
  MonoCursor.destroy()
  document.body.innerHTML = ''
}

// ── Global before/after ────────────────────────────────────────────────────
beforeEach(() => {
  MonoCursor.destroy()
  setupDOM()
})

afterEach(() => {
  cleanupDOM()
})

// ─────────────────────────────────────────────────────────────────────────────
describe('MonoCursor — static singleton API', () => {

  describe('MonoCursor.init()', () => {
    it('should create and return the singleton on first call', () => {
      const cursor = MonoCursor.init({ color: '#ff0000' })
      const inst = MonoCursor.getInstance()
      expect(inst).toBe(cursor)
      expect(document.querySelector('.mc-container')).not.toBeNull()
    })

    it('should apply passed options', () => {
      MonoCursor.init({ color: '#abc123', dotSize: 12 })
      expect(document.documentElement.style.getPropertyValue('--mc-color')).toBe('#abc123')
      expect(document.documentElement.style.getPropertyValue('--mc-dot-size')).toBe('12px')
    })

    it('should not re-create on subsequent calls — return same instance', () => {
      const first = MonoCursor.init()
      const second = MonoCursor.init()
      expect(first).toBe(second)
      const containers = document.querySelectorAll('.mc-container')
      expect(containers.length).toBe(1)
    })

    it('should inject styles on first init', () => {
      MonoCursor.init()
      expect(document.getElementById('mono-cursor-styles')).not.toBeNull()
    })

    it('should return the instance for chaining', () => {
      const result = MonoCursor.init()
      expect(result).toBe(MonoCursor.getInstance())
    })
  })

  describe('MonoCursor.configure()', () => {
    it('should update global options and re-apply CSS', () => {
      MonoCursor.init()
      MonoCursor.configure({ color: '#deadbeef', ringSize: 80 })
      expect(document.documentElement.style.getPropertyValue('--mc-color')).toBe('#deadbeef')
      expect(document.documentElement.style.getPropertyValue('--mc-ring-size')).toBe('80px')
    })

    it('should not re-initialize — only configure', () => {
      MonoCursor.init()
      const before = MonoCursor.getInstance()
      MonoCursor.configure({ dotSize: 16 })
      expect(MonoCursor.getInstance()).toBe(before)
    })
  })

  describe('MonoCursor.enable() / MonoCursor.disable()', () => {
    it('should hide cursor when disabled', () => {
      MonoCursor.init()
      MonoCursor.enable()
      // trigger visibility
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }))
      expect(document.querySelector('.mc-container')?.classList.contains('mc-visible')).toBe(true)

      MonoCursor.disable()
      expect(document.querySelector('.mc-container')?.classList.contains('mc-visible')).toBe(false)
      expect(document.body.classList.contains('mc-active')).toBe(false)
    })

    it('should restore cursor when re-enabled after disable', () => {
      MonoCursor.init()
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }))
      MonoCursor.disable()
      MonoCursor.enable()
      expect(document.querySelector('.mc-container')?.classList.contains('mc-visible')).toBe(true)
    })

    it('should not show cursor on mousemove while disabled', () => {
      MonoCursor.init()
      MonoCursor.disable()
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }))
      expect(document.querySelector('.mc-container')?.classList.contains('mc-visible')).toBe(false)
    })
  })

  describe('MonoCursor.destroy()', () => {
    it('should remove DOM elements and clear instance', () => {
      MonoCursor.init()
      MonoCursor.destroy()
      expect(document.querySelector('.mc-container')).toBeNull()
      expect(MonoCursor.getInstance()).toBeNull()
    })

    it('should be safe to call multiple times', () => {
      MonoCursor.init()
      expect(() => { MonoCursor.destroy(); MonoCursor.destroy() }).not.toThrow()
      expect(MonoCursor.getInstance()).toBeNull()
    })

    it('should remove mc-active and mc-hide-default classes', () => {
      MonoCursor.init({ hideDefaultCursor: true })
      MonoCursor.destroy()
      expect(document.body.classList.contains('mc-active')).toBe(false)
      expect(document.body.classList.contains('mc-hide-default')).toBe(false)
    })
  })

  describe('MonoCursor.setColor()', () => {
    it('should update the color CSS variable', () => {
      MonoCursor.init()
      MonoCursor.setColor('#ff6600')
      expect(document.documentElement.style.getPropertyValue('--mc-color')).toBe('#ff6600')
    })

    it('should be callable before init (no-op, not throw)', () => {
      MonoCursor.destroy()
      expect(() => MonoCursor.setColor('#000')).not.toThrow()
    })
  })

  describe('MonoCursor.setDotSize()', () => {
    it('should update the dot-size CSS variable', () => {
      MonoCursor.init()
      MonoCursor.setDotSize(16)
      expect(document.documentElement.style.getPropertyValue('--mc-dot-size')).toBe('16px')
    })
  })

  describe('MonoCursor.setRingSize()', () => {
    it('should update the ring-size CSS variable', () => {
      MonoCursor.init()
      MonoCursor.setRingSize(70)
      expect(document.documentElement.style.getPropertyValue('--mc-ring-size')).toBe('70px')
    })
  })

  describe('MonoCursor.setLerpFactor()', () => {
    it('should clamp to minimum 0.01', () => {
      MonoCursor.init()
      MonoCursor.setLerpFactor(-5)
      expect((MonoCursor.getInstance() as any)._opts.lerpFactor).toBeCloseTo(0.01)
    })

    it('should clamp to maximum 1', () => {
      MonoCursor.init()
      MonoCursor.setLerpFactor(5)
      expect((MonoCursor.getInstance() as any)._opts.lerpFactor).toBeCloseTo(1)
    })

    it('should accept valid values', () => {
      MonoCursor.init()
      MonoCursor.setLerpFactor(0.5)
      expect((MonoCursor.getInstance() as any)._opts.lerpFactor).toBeCloseTo(0.5)
    })
  })

  describe('MonoCursor.setRingBorderWidth()', () => {
    it('should update the ring-border CSS variable', () => {
      MonoCursor.init()
      MonoCursor.setRingBorderWidth(3)
      expect(document.documentElement.style.getPropertyValue('--mc-ring-border')).toBe('3px')
    })
  })

  describe('MonoCursor.setState()', () => {
    it('should set the container data-state attribute', () => {
      MonoCursor.init()
      MonoCursor.setState('pointer')
      expect(document.querySelector('.mc-container')?.getAttribute('data-state')).toBe('pointer')

      MonoCursor.setState('text')
      expect(document.querySelector('.mc-container')?.getAttribute('data-state')).toBe('text')

      MonoCursor.setState('circle')
      expect(document.querySelector('.mc-container')?.getAttribute('data-state')).toBe('circle')

      MonoCursor.setState('default')
      expect(document.querySelector('.mc-container')?.getAttribute('data-state')).toBe('default')
    })
  })

  describe('MonoCursor.setHideDefaultCursor()', () => {
    it('should add mc-hide-default class when true', () => {
      MonoCursor.init()
      MonoCursor.setHideDefaultCursor(true)
      expect(document.body.classList.contains('mc-hide-default')).toBe(true)
    })

    it('should remove mc-hide-default class when false', () => {
      MonoCursor.init({ hideDefaultCursor: true })
      MonoCursor.setHideDefaultCursor(false)
      expect(document.body.classList.contains('mc-hide-default')).toBe(false)
    })
  })

  describe('MonoCursor.setEnableCircle()', () => {
    it('should add mc-ring-disabled class when false', () => {
      MonoCursor.init()
      MonoCursor.setEnableCircle(false)
      expect(document.querySelector('.mc-container')?.classList.contains('mc-ring-disabled')).toBe(true)
    })

    it('should remove mc-ring-disabled class when true', () => {
      MonoCursor.init({ enableCircle: false })
      MonoCursor.setEnableCircle(true)
      expect(document.querySelector('.mc-container')?.classList.contains('mc-ring-disabled')).toBe(false)
    })
  })

  describe('MonoCursor.create() — alias for init()', () => {
    it('should be an alias for init()', () => {
      const c = MonoCursor.create({ color: '#00ff00' })
      expect(document.documentElement.style.getPropertyValue('--mc-color')).toBe('#00ff00')
      expect(c).toBe(MonoCursor.getInstance())
    })
  })

  describe('MonoCursor.getInstance()', () => {
    it('should return null before init', () => {
      MonoCursor.destroy()
      expect(MonoCursor.getInstance()).toBeNull()
    })

    it('should return the singleton after init', () => {
      const c = MonoCursor.init()
      expect(MonoCursor.getInstance()).toBe(c)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('MonoCursor — instance API (non-singleton use)', () => {
  it('should allow creating multiple independent instances', () => {
    const a = new MonoCursor({ color: '#111' })
    const b = new MonoCursor({ color: '#222' })

    a.init()
    b.init()

    // Both should exist in DOM
    const all = document.querySelectorAll('.mc-container')
    expect(all.length).toBe(2)

    a.destroy()
    b.destroy()
  })

  it('should allow calling instance methods after init', () => {
    const cursor = new MonoCursor({ color: '#aaa' }).init()
    cursor.setColor('#bbb')
    expect(document.documentElement.style.getPropertyValue('--mc-color')).toBe('#bbb')
    cursor.destroy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('createCursor factory', () => {
  it('should init the singleton via the module export', () => {
    setupDOM()
    const cursor = createCursor({ color: '#c0ffee' })
    expect(document.documentElement.style.getPropertyValue('--mc-color')).toBe('#c0ffee')
    expect(cursor).toBe(MonoCursor.getInstance())
    cleanupDOM()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('DEFAULT_OPTIONS', () => {
  it('should have all expected default values', () => {
    expect(DEFAULT_OPTIONS.color).toBe('#6366f1')
    expect(DEFAULT_OPTIONS.dotSize).toBe(8)
    expect(DEFAULT_OPTIONS.ringSize).toBe(40)
    expect(DEFAULT_OPTIONS.ringBorderWidth).toBe(1.5)
    expect(DEFAULT_OPTIONS.lerpFactor).toBe(0.15)
    expect(DEFAULT_OPTIONS.hideDefaultCursor).toBe(true)
    expect(DEFAULT_OPTIONS.enableCircle).toBe(true)
    expect(DEFAULT_OPTIONS.zIndex).toBe(999999)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Cursor type detection', () => {
  it('should detect pointer on <a>', () => {
    MonoCursor.init()
    const type = (MonoCursor.getInstance() as any)._detectCursorType(document.getElementById('link'))
    expect(type).toBe('pointer')
  })

  it('should detect pointer on <button>', () => {
    MonoCursor.init()
    const type = (MonoCursor.getInstance() as any)._detectCursorType(document.getElementById('button'))
    expect(type).toBe('pointer')
  })

  it('should detect text on <input>', () => {
    MonoCursor.init()
    const type = (MonoCursor.getInstance() as any)._detectCursorType(document.getElementById('input'))
    expect(type).toBe('text')
  })

  it('should detect text on <textarea>', () => {
    MonoCursor.init()
    const type = (MonoCursor.getInstance() as any)._detectCursorType(document.getElementById('textarea'))
    expect(type).toBe('text')
  })

  it('should detect circle from data-cursor="circle"', () => {
    MonoCursor.init()
    const type = (MonoCursor.getInstance() as any)._detectCursorType(document.getElementById('custom-circle'))
    expect(type).toBe('circle')
  })

  it('should detect pointer from data-cursor="pointer"', () => {
    MonoCursor.init()
    const type = (MonoCursor.getInstance() as any)._detectCursorType(document.getElementById('custom-pointer'))
    expect(type).toBe('pointer')
  })

  it('should detect pointer from data-cursor="interactive"', () => {
    MonoCursor.init()
    const type = (MonoCursor.getInstance() as any)._detectCursorType(document.getElementById('interactive'))
    expect(type).toBe('pointer')
  })

  it('should return default for plain div', () => {
    MonoCursor.init()
    const type = (MonoCursor.getInstance() as any)._detectCursorType(document.getElementById('div'))
    expect(type).toBe('default')
  })

  it('should detect pointer when nested inside an anchor', () => {
    document.body.innerHTML = `<a href="#"><div id="nested">link</div></a>`
    MonoCursor.init()
    const type = (MonoCursor.getInstance() as any)._detectCursorType(document.getElementById('nested'))
    expect(type).toBe('pointer')
  })

  it('should ignore input type=range (pointer, not text)', () => {
    document.body.innerHTML = `<input type="range" id="range-input">`
    MonoCursor.init()
    const type = (MonoCursor.getInstance() as any)._detectCursorType(document.getElementById('range-input'))
    expect(type).toBe('pointer')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('Mouse / pointer event handling', () => {
  it('should update target on mousemove', () => {
    MonoCursor.init()
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 400 }))
    const inst = MonoCursor.getInstance() as any
    expect(inst._target.x).toBe(300)
    expect(inst._target.y).toBe(400)
  })

  it('should show cursor on first mousemove', () => {
    MonoCursor.init()
    // Cursor starts hidden — first mousemove should show it
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }))
    expect(document.querySelector('.mc-container')?.classList.contains('mc-visible')).toBe(true)
  })

  it('should change state on mouseover of interactive element', () => {
    MonoCursor.init()
    const link = document.getElementById('link')
    // jsdom doesn't set target via constructor — simulate via element.dispatchEvent
    const overEvent = new MouseEvent('mouseover', { bubbles: true })
    Object.defineProperty(overEvent, 'target', { value: link, configurable: true })
    document.dispatchEvent(overEvent)
    expect(document.querySelector('.mc-container')?.getAttribute('data-state')).toBe('pointer')
  })

  it('should hide on document mouseleave', () => {
    MonoCursor.init()
    document.dispatchEvent(new MouseEvent('mouseleave'))
    expect(document.querySelector('.mc-container')?.classList.contains('mc-visible')).toBe(false)
  })

  it('should add mc-pressed on pointerdown', () => {
    MonoCursor.init()
    document.dispatchEvent(new PointerEvent('pointerdown'))
    expect(document.querySelector('.mc-container')?.classList.contains('mc-pressed')).toBe(true)
  })

  it('should remove mc-pressed on pointerup', () => {
    MonoCursor.init()
    document.dispatchEvent(new PointerEvent('pointerdown'))
    document.dispatchEvent(new PointerEvent('pointerup'))
    expect(document.querySelector('.mc-container')?.classList.contains('mc-pressed')).toBe(false)
  })

  it('should reset position on scroll', () => {
    MonoCursor.init()
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }))
    document.dispatchEvent(new MouseEvent('scroll'))
    const inst = MonoCursor.getInstance() as any
    expect(inst._target.x).toBe(-1000)
    expect(inst._target.y).toBe(-1000)
  })
})
