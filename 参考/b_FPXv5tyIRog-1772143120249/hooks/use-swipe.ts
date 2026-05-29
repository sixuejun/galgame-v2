import { useRef, useCallback, type RefObject } from "react"
import type { Direction } from "./use-game-2048"

const MIN_SWIPE_DISTANCE = 30

export function useSwipe(
  onSwipe: (dir: Direction) => void,
  elementRef: RefObject<HTMLElement | null>
) {
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const isMouseDown = useRef(false)

  const resolveDirection = useCallback(
    (startX: number, startY: number, endX: number, endY: number) => {
      const dx = endX - startX
      const dy = endY - startY
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      if (Math.max(absDx, absDy) < MIN_SWIPE_DISTANCE) return

      let direction: Direction
      if (absDx > absDy) {
        direction = dx > 0 ? "right" : "left"
      } else {
        direction = dy > 0 ? "down" : "up"
      }
      onSwipe(direction)
    },
    [onSwipe]
  )

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    startPos.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!startPos.current) return
      const touch = e.changedTouches[0]
      resolveDirection(startPos.current.x, startPos.current.y, touch.clientX, touch.clientY)
      startPos.current = null
    },
    [resolveDirection]
  )

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isMouseDown.current = true
    startPos.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
  }, [])

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isMouseDown.current || !startPos.current) return
      const dx = e.clientX - startPos.current.x
      const dy = e.clientY - startPos.current.y
      if (Math.max(Math.abs(dx), Math.abs(dy)) >= MIN_SWIPE_DISTANCE) {
        resolveDirection(startPos.current.x, startPos.current.y, e.clientX, e.clientY)
        isMouseDown.current = false
        startPos.current = null
      }
    },
    [resolveDirection]
  )

  const onMouseUp = useCallback(() => {
    isMouseDown.current = false
    startPos.current = null
  }, [])

  const onMouseLeave = useCallback(() => {
    isMouseDown.current = false
    startPos.current = null
  }, [])

  return {
    onTouchStart,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
  }
}
