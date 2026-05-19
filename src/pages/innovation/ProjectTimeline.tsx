import { cn } from '../../utils/cn'
import type { SjTimelineEvt } from './innovationTypes'

type Props = {
  items: SjTimelineEvt[]
  selectedId?: string | null
  onSelect?: (id: string | null, item: SjTimelineEvt) => void
}

function dotClass(tone: SjTimelineEvt['tone']) {
  switch (tone) {
    case 'success':
      return 'bg-success shadow-[0_0_0_4px_rgb(34_197_94/0.15)]'
    case 'primary':
      return 'bg-primary shadow-[0_0_0_4px_rgb(30_109_255/0.18)]'
    case 'danger':
      return 'bg-danger shadow-[0_0_0_4px_rgb(239_68_68/0.14)]'
    default:
      return 'bg-muted'
  }
}

export function ProjectTimeline({ items, selectedId, onSelect }: Props) {
  return (
    <ol className="relative ms-1 space-y-0 border-s border-divider ps-5">
      {items.map((it) => {
        const sel = selectedId === it.id
        const clickable = Boolean(it.expandable && onSelect)
        const body = (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-semibold text-foreground">{it.title}</span>
              {clickable ? <span className="text-[11px] font-medium text-primary">可展开</span> : null}
            </div>
            {it.subtitle ? <p className="mt-0.5 text-[12px] text-muted">{it.subtitle}</p> : null}
            {sel && it.detail ? (
              <pre className="mt-2 whitespace-pre-wrap rounded-md border border-divider bg-page px-3 py-2 text-[12px] leading-relaxed text-foreground">
                {it.detail}
              </pre>
            ) : null}
          </>
        )
        return (
          <li key={it.id} className="relative pb-6 last:pb-0">
            <span
              aria-hidden
              className={cn('absolute -start-[5px] top-2 size-2.5 rounded-full ring-4 ring-surface', dotClass(it.tone))}
            />
            {clickable ? (
              <button
                type="button"
                onClick={() => onSelect?.(sel ? null : it.id, it)}
                className={cn(
                  'flex w-full flex-col rounded-[var(--radius-card)] px-3 py-2 text-left transition-colors hover:bg-primary-light/40',
                  sel && 'bg-primary-light/60 ring-1 ring-primary/25',
                )}
              >
                {body}
              </button>
            ) : (
              <div className={cn('flex w-full flex-col rounded-[var(--radius-card)] px-3 py-2', sel && 'bg-page')}>{body}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
