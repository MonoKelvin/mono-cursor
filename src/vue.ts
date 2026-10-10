import { onMounted, onUnmounted } from 'vue'
import type { MonoCursorOptions } from './types'
import { MonoCursor } from './index'

/** Mounts the global cursor for the lifetime of the component. */
export function useMonoCursor(options: MonoCursorOptions = {}) {
  onMounted(() => {
    MonoCursor.init(options)
  })

  onUnmounted(() => {
    MonoCursor.destroy()
  })

  return {
    setColor: MonoCursor.setColor,
    setArrowSize: MonoCursor.setArrowSize,
    setRingSize: MonoCursor.setRingSize,
    setRingBorderWidth: MonoCursor.setRingBorderWidth,
    setEnableCircle: MonoCursor.setEnableCircle,
    setShadow: MonoCursor.setShadow,
    setClickEffect: MonoCursor.setClickEffect,
    setHideDefaultCursor: MonoCursor.setHideDefaultCursor,
    setState: MonoCursor.setState,
    enable: MonoCursor.enable,
    disable: MonoCursor.disable,
  }
}

export { MonoCursor }
export type { MonoCursorOptions, CursorState } from './types'
