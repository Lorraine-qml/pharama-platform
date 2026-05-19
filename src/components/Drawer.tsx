import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

type Props = {
  open: boolean
  title?: string
  width?: 480 | 720
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Drawer({
  open,
  title,
  width = 480,
  onClose,
  children,
  footer,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[1px]"
        aria-label="关闭抽屉"
        onClick={onClose}
      />
      <aside
        className={cn(
          'relative flex h-full flex-col bg-surface shadow-xl transition-transform duration-200 ease-out',
          width === 720 ? 'w-[min(720px,100vw)]' : 'w-[min(480px,100vw)]',
        )}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between border-b border-divider px-6 py-4">
          <h2 className="text-[16px] font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-button)] px-3 py-1 text-[13px] text-muted hover:bg-page"
          >
            关闭
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer ? (
          <footer className="border-t border-divider px-6 py-4">{footer}</footer>
        ) : null}
      </aside>
    </div>
  )
}
