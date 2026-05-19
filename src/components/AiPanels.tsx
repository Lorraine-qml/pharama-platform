import type { ReactNode } from 'react'

type Props = {
  compact?: boolean
}

export function AiBadge({ compact }: Props) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[var(--radius-button)] bg-primary-light px-2 py-0.5 text-[12px] font-medium text-primary">
      ✨ {compact ? 'AI' : 'AI生成'}
    </span>
  )
}

type AiToolbarProps = {
  onRegenerate?: () => void
  onSources?: () => void
}

export function AiContentToolbar({ onRegenerate, onSources }: AiToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-3">
      {onRegenerate ? (
        <button
          type="button"
          className="rounded-[var(--radius-button)] bg-page px-3 py-1.5 text-[12px] font-medium text-foreground hover:border hover:border-divider"
          onClick={onRegenerate}
        >
          重新生成
        </button>
      ) : null}
      {onSources ? (
        <button
          type="button"
          className="rounded-[var(--radius-button)] bg-page px-3 py-1.5 text-[12px] font-medium text-foreground hover:border hover:border-divider"
          onClick={onSources}
        >
          引用来源
        </button>
      ) : null}
    </div>
  )
}

export function AiPanel({
  title,
  children,
  onRegenerate,
  onSources,
}: {
  title?: string
  children: ReactNode
  onRegenerate?: () => void
  onSources?: () => void
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-primary-light bg-primary-light/40 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        {title ? <h3 className="text-[14px] font-semibold text-foreground">{title}</h3> : null}
        <AiBadge />
      </div>
      <div className="text-[14px] text-foreground">{children}</div>
      <AiContentToolbar onRegenerate={onRegenerate} onSources={onSources} />
    </section>
  )
}
