'use client'

import { type ReactNode, useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

type TooltipProps = {
  content: string
  side?: TooltipSide
  shortcut?: string
  children: ReactNode
  delayMs?: number
}

export function Tooltip({ content, side = 'top', shortcut, children, delayMs = 400 }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const tooltipRef = useRef<HTMLSpanElement | null>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const gap = 6

    let top = 0
    let left = 0

    switch (side) {
      case 'top':
        top = rect.top - gap
        left = rect.left + rect.width / 2
        break
      case 'bottom':
        top = rect.bottom + gap
        left = rect.left + rect.width / 2
        break
      case 'left':
        top = rect.top + rect.height / 2
        left = rect.left - gap
        break
      case 'right':
        top = rect.top + rect.height / 2
        left = rect.right + gap
        break
    }

    setPosition({ top, left })
  }, [side])

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      updatePosition()
      setVisible(true)
    }, delayMs)
  }, [delayMs, updatePosition])

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setVisible(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Clamp tooltip to viewport after it renders (mutate DOM directly to avoid cascading re-render)
  useLayoutEffect(() => {
    if (!visible || !tooltipRef.current || !position) return
    const el = tooltipRef.current
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let adjustedLeft = position.left
    let adjustedTop = position.top

    if (side === 'top' || side === 'bottom') {
      const halfWidth = rect.width / 2
      if (adjustedLeft + halfWidth > vw - 8) adjustedLeft = vw - 8 - halfWidth
      if (adjustedLeft - halfWidth < 8) adjustedLeft = 8 + halfWidth
    }
    if (side === 'right' && rect.right > vw - 8) {
      adjustedLeft = vw - 8 - rect.width
    }
    if (side === 'left' && rect.left < 8) {
      adjustedLeft = 8
    }

    if (adjustedTop < 8) adjustedTop = 8
    if (adjustedTop + rect.height > vh - 8) adjustedTop = vh - 8 - rect.height

    if (adjustedLeft !== position.left || adjustedTop !== position.top) {
      el.style.top = `${adjustedTop}px`
      el.style.left = `${adjustedLeft}px`
    }
  }, [visible, position, side])

  const transformOrigin: Record<TooltipSide, string> = {
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)',
    left: 'translate(-100%, -50%)',
    right: 'translate(0, -50%)',
  }

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {visible && position && typeof document !== 'undefined' &&
        createPortal(
          <span
            ref={tooltipRef}
            role="tooltip"
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              transform: transformOrigin[side],
              zIndex: 9999,
            }}
            className="
              pointer-events-none
              whitespace-nowrap
              px-2 py-1
              bg-[var(--surface-3)] border border-[var(--border-strong)]
              rounded-[4px] shadow-lg
              font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-secondary)]
              tracking-[0.01em]
              animate-[tooltipIn_0.12s_ease-out]
              flex items-center gap-2
            "
          >
            {content}
            {shortcut ? (
              <kbd className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--text-muted)] bg-[var(--surface)] px-1 py-0.5 rounded-[3px] border border-[var(--border)]">
                {shortcut}
              </kbd>
            ) : null}
          </span>,
          document.body,
        )}
    </>
  )
}
