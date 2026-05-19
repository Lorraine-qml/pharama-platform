import { useState } from 'react'
import { cn } from '../../utils/cn'

type Props = {
  /** 含 📌 的标题行 */
  title: string
  /** 说明段落（每条一行展示） */
  lines: string[]
  defaultOpen?: boolean
  className?: string
}

/**
 * 列表页顶部可折叠说明区（背景 #ECF3FF，圆角 8px，内边距约 12px）
 */
export function ModuleIntroCard({ title, lines, defaultOpen = true, className }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section
      className={cn(
        'rounded-lg border border-primary/12 bg-[#ECF3FF] p-3 text-[13px] leading-relaxed text-foreground shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-bold text-foreground">{title}</p>
          {open ? (
            <div className="space-y-1.5 text-[12px] text-muted">
              {lines.map((line, i) => (
                <p key={i} className="text-pretty text-foreground/85">
                  {line}
                </p>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="shrink-0 text-[12px] font-semibold text-primary hover:underline"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '收起' : '展开'}
        </button>
      </div>
    </section>
  )
}
