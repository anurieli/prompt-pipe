'use client'

import type { ReactNode } from 'react'

type AnnotationProps = {
  label: string
  value: string | number
  icon?: ReactNode
}

export function Annotation({ label, value, icon }: AnnotationProps) {
  return (
    <span className="inline-flex items-center gap-1 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.02em]">
      {icon ? (
        <span className="text-[var(--text-faint)] flex items-center">{icon}</span>
      ) : null}
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-[var(--text-secondary)]">{String(value)}</span>
    </span>
  )
}
