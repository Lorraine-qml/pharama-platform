import { useMemo } from 'react'

type Props = {
  total: number
  page: number
  pageSize: number
  onPageChange: (p: number) => void
  onPageSizeChange?: (n: number) => void
}

const SIZES = [10, 20, 50, 100] as const

export function ListPaginationBar({ total, page, pageSize, onPageChange, onPageSizeChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageClamped = Math.min(Math.max(1, page), totalPages)
  const sliceFrom = total === 0 ? 0 : (pageClamped - 1) * pageSize + 1
  const sliceTo = Math.min(total, pageClamped * pageSize)

  const label = useMemo(() => {
    if (total === 0) return '共 0 条'
    return `共 ${total} 条 · 当前 ${sliceFrom}–${sliceTo} 条`
  }, [total, sliceFrom, sliceTo])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider bg-[#F5F7FA] px-4 py-3 text-[13px] text-muted">
      <span>{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange ? (
          <label className="flex items-center gap-2 text-[12px]">
            每页
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-divider bg-surface px-2 py-1 text-[13px] text-foreground"
            >
              {SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            条
          </label>
        ) : null}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pageClamped <= 1}
            className="rounded-md border border-divider bg-surface px-3 py-1.5 text-[12px] font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => onPageChange(pageClamped - 1)}
          >
            上一页
          </button>
          <span className="tabular-nums text-[12px] text-foreground">
            {pageClamped} / {totalPages}
          </span>
          <button
            type="button"
            disabled={pageClamped >= totalPages}
            className="rounded-md border border-divider bg-surface px-3 py-1.5 text-[12px] font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => onPageChange(pageClamped + 1)}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  )
}
