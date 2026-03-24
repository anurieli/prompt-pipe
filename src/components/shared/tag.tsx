'use client'

type TagProps = {
  label: string
  onRemove?: () => void
  color?: string
}

const TAG_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  product: { bg: 'var(--blue-muted)', text: 'var(--blue)' },
  research: { bg: 'var(--lavender-muted)', text: 'var(--lavender)' },
  strategy: { bg: 'var(--orange-muted)', text: 'var(--orange)' },
  content: { bg: 'var(--teal-muted)', text: 'var(--teal)' },
}

const DEFAULT_TAG_COLOR = { bg: 'var(--surface-3)', text: 'var(--text-muted)' }

export function Tag({ label, onRemove, color }: TagProps) {
  const resolved = color
    ? { bg: `${color}20`, text: color }
    : TAG_COLOR_MAP[label.toLowerCase()] ?? DEFAULT_TAG_COLOR

  return (
    <span
      className="inline-flex items-center gap-1 font-[family-name:var(--font-mono)] text-[10px] font-medium px-2.5 py-[3px] rounded-[3px] tracking-[0.03em]"
      style={{ backgroundColor: resolved.bg, color: resolved.text }}
    >
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 opacity-60 hover:opacity-100 cursor-pointer leading-none"
          aria-label={`Remove tag ${label}`}
        >
          &times;
        </button>
      ) : null}
    </span>
  )
}
