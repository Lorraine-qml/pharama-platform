import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

/** 系统管理各子页统一顶栏（主内容区 title 仍为菜单名，此处为副文案与工具区） */
export function SystemPageChrome({
  description,
  actions,
  children,
  className,
}: {
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-5', className)}>
      {(description || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-[var(--radius-panel)] border border-divider/80 bg-gradient-to-r from-primary-light/35 via-surface to-surface px-5 py-4">
          {description ? <p className="max-w-[56rem] text-[13px] leading-relaxed text-muted">{description}</p> : <span />}
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      )}
      {children}
    </div>
  )
}

export function SysTableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-[var(--radius-panel)] border border-divider bg-surface shadow-[var(--shadow-card)]', className)}>
      {children}
    </div>
  )
}
