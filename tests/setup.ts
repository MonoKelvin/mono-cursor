// Mock rAF — queue callbacks but don't auto-invoke (prevents infinite loops in tests)
const pendingCallbacks: Map<number, FrameRequestCallback> = new Map()
let rafCounter = 0

global.requestAnimationFrame = (cb: FrameRequestCallback) => {
  const id = ++rafCounter
  pendingCallbacks.set(id, cb)
  return id
}

global.cancelAnimationFrame = (id: number) => {
  pendingCallbacks.delete(id)
}

// Helper: advance one animation frame (call the oldest pending rAF cb)
export function flushFrame(): void {
  const entries = [...pendingCallbacks.entries()]
  pendingCallbacks.clear()
  for (const [id, cb] of entries) {
    cb(performance.now())
  }
}

// Flush ALL pending frames (drain the queue)
export function flushAllFrames(): void {
  while (pendingCallbacks.size > 0) {
    flushFrame()
  }
}

// Mock getComputedStyle
const mockComputedStyle = {
  getPropertyValue: () => '',
}
Object.defineProperty(global, 'getComputedStyle', {
  value: () => mockComputedStyle,
  writable: true,
})

// Ensure PointerEvent exists (not all jsdom versions have it)
if (typeof (global as any).PointerEvent === 'undefined') {
  ;(global as any).PointerEvent = class PointerEvent extends MouseEvent {
    pointerId: number
    width: number
    height: number
    pressure: number
    tangentialPressure: number
    tiltX: number
    tiltY: number
    twist: number
    pointerType: string
    isPrimary: boolean
    constructor(type: string, init?: any) {
      super(type, init)
      this.pointerId = init?.pointerId ?? 0
      this.width = init?.width ?? 1
      this.height = init?.height ?? 1
      this.pressure = init?.pressure ?? 0
      this.tangentialPressure = init?.tangentialPressure ?? 0
      this.tiltX = init?.tiltX ?? 0
      this.tiltY = init?.tiltY ?? 0
      this.twist = init?.twist ?? 0
      this.pointerType = init?.pointerType ?? 'mouse'
      this.isPrimary = init?.isPrimary ?? true
    }
  }
}
