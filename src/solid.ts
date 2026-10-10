import { onMount, onCleanup } from 'solid-js'
import type { MonoCursorOptions } from './types'
import { MonoCursor } from './index'

export function useMonoCursor(options: MonoCursorOptions = {}) {
  onMount(() => {
    MonoCursor.init(options)
  })

  onCleanup(() => {
    MonoCursor.destroy()
  })

  return {
    setColor: MonoCursor.setColor,
    setDotSize: MonoCursor.setDotSize,
    setRingSize: MonoCursor.setRingSize,
    setLerpFactor: MonoCursor.setLerpFactor,
    setState: MonoCursor.setState,
    enable: MonoCursor.enable,
    disable: MonoCursor.disable,
  }
}

export { MonoCursor }
export type { MonoCursorOptions, CursorState } from './types'
