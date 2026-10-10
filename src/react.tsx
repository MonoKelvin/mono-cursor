'use client'

import { useEffect, useRef } from 'react'
import type { MonoCursorOptions } from './types'
import { MonoCursor } from './index'

export interface MonoCursorReactProps extends MonoCursorOptions {
  children?: React.ReactNode
}

export function MonoCursorProvider({
  children,
  color,
  dotSize,
  ringSize,
  ringBorderWidth,
  lerpFactor,
  hideDefaultCursor,
  enableCircle,
  zIndex,
}: MonoCursorReactProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    MonoCursor.init({
      color,
      dotSize,
      ringSize,
      ringBorderWidth,
      lerpFactor,
      hideDefaultCursor,
      enableCircle,
      zIndex,
    })

    return () => {
      MonoCursor.destroy()
      initialized.current = false
    }
  }, [])

  return <>{children}</>
}

export function useMonoCursor(options?: MonoCursorOptions) {
  const ref = useRef<MonoCursor | null>(null)

  useEffect(() => {
    ref.current = MonoCursor.init(options)
    return () => {
      MonoCursor.destroy()
      ref.current = null
    }
  }, [])

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
