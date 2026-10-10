'use client'

import { useEffect, useRef } from 'react'
import type { MonoCursorOptions } from './types'
import { MonoCursor } from './index'

export interface MonoCursorReactProps extends MonoCursorOptions {
  children?: React.ReactNode
}

/** Mounts the global cursor for the lifetime of the component. */
export function MonoCursorProvider({ children, ...options }: MonoCursorReactProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    MonoCursor.init(options)

    return () => {
      MonoCursor.destroy()
      initialized.current = false
    }
    // Options are passed once at mount; use the static setters to change them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}

/** Imperative handle for updating the cursor from anywhere in the tree. */
export function useMonoCursor(options?: MonoCursorOptions) {
  const ref = useRef<MonoCursor | null>(null)

  useEffect(() => {
    ref.current = MonoCursor.init(options)
    return () => {
      MonoCursor.destroy()
      ref.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
