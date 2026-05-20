import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

/** 园区运营核心操作弹窗统一宽度（桌面 760px，移动端 90vw） */
export const OPS_MODAL_PANEL = 'max-w-[760px] w-[90vw] sm:w-full'

type StepIndicatorProps = {
  steps: string[]
  current: number
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <ol className="mb-4 flex flex-wrap items-center gap-2 text-[12px]">
      {steps.map((label, i) => {
        const n = i + 1
        const active = n === current
        const done = n < current
        return (
          <li key={label} className="flex items-center gap-2">
            {i > 0 ? <span className="text-divider">→</span> : null}
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 font-semibold',
                active && 'bg-primary text-white',
                done && !active && 'bg-primary/15 text-primary',
                !active && !done && 'bg-page text-muted ring-1 ring-divider',
              )}
            >
              {n}. {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function ModalSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-lg border border-divider bg-page/40 px-4 py-3', className)}>
      <h3 className="mb-2 text-[13px] font-bold text-foreground">{title}</h3>
      {children}
    </section>
  )
}

export function SummaryGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.label} className="flex gap-2">
          <dt className="shrink-0 text-muted">{it.label}：</dt>
          <dd className="font-medium text-foreground">{it.value}</dd>
        </div>
      ))}
    </dl>
  )
}
