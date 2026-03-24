'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/shared/button'

type ConfirmModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="
        fixed inset-0
        bg-black/65 backdrop-blur-[8px]
        z-50
        flex items-center justify-center
      "
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="
          bg-[var(--surface)] border border-[var(--border-strong)]
          rounded-[var(--r-lg)]
          w-[400px]
          shadow-[0_24px_80px_rgba(0,0,0,0.6)]
          animate-[modalIn_0.2s_ease]
        "
      >
        {/* Header */}
        <div className="px-[22px] pt-5 pb-3">
          <h3 className="font-[family-name:var(--font-display)] text-lg mb-1.5">
            {title}
          </h3>
          <p className="text-[12.5px] text-[var(--text-secondary)] font-light leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 px-[22px] pb-5 pt-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'accent'}
            size="sm"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
