import { cn } from '../../utils/cn'

/** 全局状态胶囊语义（与设计规范色值对齐） */
export type StatusPillVariant = 'pending' | 'progress' | 'success' | 'danger' | 'muted'

const VARIANT_CLASS: Record<StatusPillVariant, string> = {
  pending: 'text-[#FF8A34] bg-[#FF8A34]/14 ring-1 ring-[#FF8A34]/22',
  progress: 'text-[#1E6DFF] bg-[#1E6DFF]/12 ring-1 ring-[#1E6DFF]/22',
  success: 'text-[#00C9A7] bg-[#00C9A7]/14 ring-1 ring-[#00C9A7]/22',
  danger: 'text-[#F44336] bg-[#F44336]/14 ring-1 ring-[#F44336]/22',
  muted: 'text-[#8E8E8E] bg-[#8E8E8E]/12 ring-1 ring-[#8E8E8E]/20',
}

type Props = {
  children: React.ReactNode
  variant: StatusPillVariant
  className?: string
}

export function StatusPill({ children, variant, className }: Props) {
  return (
    <span className={cn('inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold leading-tight', VARIANT_CLASS[variant], className)}>
      {children}
    </span>
  )
}
