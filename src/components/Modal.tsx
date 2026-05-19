import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** 弹窗面板宽度等（默认 max-w-lg） */
  panelClassName?: string
  /**
   * 用于全屏/大型编辑器：面板使用 flex 列布局且不再整体滚动，
   * 由子内容自行在内部区域滚动（避免中间画布被压成一条缝）。
   */
  fillHeight?: boolean
  /** 点击遮罩是否关闭；重要表单建议 false */
  closeOnOverlayClick?: boolean
}

export function Modal({ open, title, onClose, children, footer, panelClassName, fillHeight, closeOnOverlayClick = true }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
      <div
        role="presentation"
        className="absolute inset-0 bg-foreground/40"
        aria-hidden
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full max-w-lg rounded-[var(--radius-panel)] bg-surface p-5 shadow-card sm:p-6',
          fillHeight ? 'flex max-h-[calc(100dvh-16px)] flex-col overflow-hidden sm:max-h-[calc(100vh-32px)]' : 'max-h-[min(92vh,900px)] overflow-y-auto',
          panelClassName,
        )}
      >
        <div className="mb-3 flex shrink-0 items-start justify-between gap-4 sm:mb-4">
          <h2 className="text-[17px] font-semibold leading-snug text-foreground sm:text-[18px]">{title}</h2>
          <button
            type="button"
            className="shrink-0 text-muted hover:text-foreground"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className={cn(fillHeight && 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden')}>{children}</div>
        {footer ? (
          <div
            className={cn(
              'flex shrink-0 flex-wrap justify-end gap-3',
              fillHeight ? 'mt-4 border-t border-divider pt-4' : 'mt-6',
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
