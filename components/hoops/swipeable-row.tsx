"use client"

import { useDrag } from "@use-gesture/react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

const DEFAULT_LEFT = 88
const DEFAULT_RIGHT = 88

type SwipeableRowProps = {
  children: ReactNode
  /** Shown when the row is swiped right (positive translate). */
  leftUnderlay: ReactNode
  /** Shown when the row is swiped left (negative translate). */
  rightUnderlay: ReactNode
  leftWidth?: number
  rightWidth?: number
  disabled?: boolean
  /** When set and different from this row’s identity, snap closed. */
  exclusiveOpenId?: string | null
  rowId: string
  onSwipeOpen?: (rowId: string) => void
  className?: string
}

export function SwipeableRow({
  children,
  leftUnderlay,
  rightUnderlay,
  leftWidth = DEFAULT_LEFT,
  rightWidth = DEFAULT_RIGHT,
  disabled = false,
  exclusiveOpenId,
  rowId,
  onSwipeOpen,
  className,
}: SwipeableRowProps) {
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const xRef = useRef(0)
  const startX = useRef(0)

  useEffect(() => {
    xRef.current = x
  }, [x])

  /** Close when no row owns the swipe, or another row opened, or parent cleared after scroll/dialog. */
  useEffect(() => {
    if (exclusiveOpenId === null || exclusiveOpenId !== rowId) {
      setX(0)
    }
  }, [exclusiveOpenId, rowId])

  const clamp = (v: number) => Math.max(-rightWidth, Math.min(leftWidth, v))

  const leftReveal = x > 0 ? Math.min(1, x / leftWidth) : 0
  const rightReveal = x < 0 ? Math.min(1, -x / rightWidth) : 0

  const bind = useDrag(
    ({ movement: [mx], first, last, velocity: [vx] }) => {
      if (disabled) return
      if (first) {
        setDragging(true)
        startX.current = xRef.current
      }
      if (!last) {
        setX(clamp(startX.current + mx))
        return
      }
      setDragging(false)
      const raw = clamp(startX.current + mx)
      let snap = 0
      if (raw <= -rightWidth * 0.35 || (vx < -0.35 && raw < -12)) {
        snap = -rightWidth
      } else if (raw >= leftWidth * 0.35 || (vx > 0.35 && raw > 12)) {
        snap = leftWidth
      }
      setX(snap)
      if (snap !== 0) {
        onSwipeOpen?.(rowId)
      }
    },
    { axis: "x", filterTaps: true }
  )

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className={cn(
          "absolute inset-y-0 left-0 z-0 flex items-stretch",
          !dragging && "transition-opacity duration-200 ease-out"
        )}
        style={{
          width: leftWidth,
          opacity: leftReveal,
          pointerEvents: leftReveal > 0.15 ? "auto" : "none",
        }}
        aria-hidden={leftReveal < 0.5}
      >
        {leftUnderlay}
      </div>
      <div
        className={cn(
          "absolute inset-y-0 right-0 z-0 flex items-stretch",
          !dragging && "transition-opacity duration-200 ease-out"
        )}
        style={{
          width: rightWidth,
          opacity: rightReveal,
          pointerEvents: rightReveal > 0.15 ? "auto" : "none",
        }}
        aria-hidden={rightReveal < 0.5}
      >
        {rightUnderlay}
      </div>
      <div
        {...(disabled ? {} : bind())}
        style={{
          transform: `translateX(${x}px)`,
          touchAction: disabled ? undefined : "pan-y",
        }}
        className={cn(
          "relative z-10 flex w-full min-w-0 min-h-full bg-white border-0 shadow-none",
          !dragging && "transition-transform duration-200 ease-out"
        )}
      >
        {children}
      </div>
    </div>
  )
}
