import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

/** 列表页第二行：左侧主操作，右侧筛选/搜索 */
export function ListToolbarRow({ left, right, className }: { left?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-3 rounded-[var(--radius-card)] border border-divider bg-surface p-4 shadow-sm',
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">{left}</div>
      <div className="flex min-w-0 flex-wrap items-end justify-end gap-3">{right}</div>
    </div>
  )
}
