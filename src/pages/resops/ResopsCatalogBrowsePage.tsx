import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { cn } from '../../utils/cn'
import { useResopsV1 } from './ResopsV1Context'
import { feeSummary } from './resopsV1Labels'
import type { ResResource } from './resopsV1Types'
import { canBookResResource, ResourceBookingModal } from './ResourceBookingModal'

const TYPE_CHIPS = ['全部', '空间', '设备', '专家', '技术服务', 'AI能力'] as const

export default function ResopsCatalogBrowsePage() {
  const toast = useToast()
  const { resources } = useResopsV1()
  const [searchParams, setSearchParams] = useSearchParams()
  const [chip, setChip] = useState<string>('全部')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'default' | 'priceAsc' | 'rating'>('default')
  const [bookingResource, setBookingResource] = useState<ResResource | null>(null)

  const listed = useMemo(() => resources.filter((r) => r.status === 'listed'), [resources])

  useEffect(() => {
    const applyRes = searchParams.get('applyRes')
    if (!applyRes) return
    const r = resources.find((x) => x.id === applyRes)
    if (r && r.status === 'listed') {
      setBookingResource(r)
    }
    const next = new URLSearchParams(searchParams)
    next.delete('applyRes')
    setSearchParams(next, { replace: true })
  }, [searchParams, resources, setSearchParams])

  const filtered = useMemo(() => {
    let xs = listed.filter((r) => {
      if (q.trim() && !(`${r.name}${r.capability}`.includes(q.trim()))) return false
      if (chip === '全部') return true
      if (chip === '空间') return r.level1.includes('空间') || r.level2.includes('实验室') || r.level2.includes('办公室')
      if (chip === '设备') return r.level2 === '设备'
      if (chip === '专家') return r.level2 === '专家'
      if (chip === '技术服务') return r.level2 === '技术服务'
      if (chip === 'AI能力') return r.name.includes('AI')
      return true
    })
    if (sort === 'priceAsc') xs = [...xs].sort((a, b) => (a.priceAmount ?? 1e9) - (b.priceAmount ?? 1e9))
    if (sort === 'rating') xs = [...xs].sort((a, b) => b.rating - a.rating)
    return xs
  }, [listed, q, chip, sort])

  function openBooking(r: ResResource) {
    if (!canBookResResource(r)) {
      toast.show('当前资源不可预约（仅空闲或可预约状态可发起）', 'info')
      return
    }
    setBookingResource(r)
  }

  return (
    <div className="space-y-5">
      <ModuleIntroCard
        title="📌 资源目录 · 已上架资源检索与申请"
        lines={['已上架资源超市：检索、筛选、查看详情并发起预约（演示）。', '核心流程：浏览目录 → 点击预约填写信息 → 生成申请 / 使用单。']}
      />

      <ListToolbarRow
        left={
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <input
              placeholder="搜索资源名称 / 关键词"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="min-w-[200px] flex-1 rounded-md border border-divider bg-page px-3 py-2 text-[13px]"
            />
            <label className="text-[13px] text-muted">
              排序
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="ms-2 rounded-md border border-divider bg-page px-2 py-2">
                <option value="default">默认</option>
                <option value="priceAsc">价格升序</option>
                <option value="rating">评分最高</option>
              </select>
            </label>
          </div>
        }
        right={
          <button type="button" onClick={() => toast.show('高级筛选（演示）', 'info')} className="rounded-md border border-divider px-3 py-2 text-[13px] font-semibold">
            高级筛选
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 rounded-[var(--radius-card)] border border-divider bg-surface p-3 shadow-sm">
        {TYPE_CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChip(c)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-bold ring-1 transition-colors',
              chip === c ? 'bg-primary text-white ring-primary' : 'bg-page text-muted ring-divider hover:text-primary',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((r) => {
          const bookable = canBookResResource(r)
          return (
            <article key={r.id} className="flex flex-col rounded-[var(--radius-panel)] border border-divider bg-surface p-4 shadow-sm">
              <h2 className="text-[16px] font-bold text-foreground">{r.name}</h2>
              <p className="mt-1 text-[12px] text-muted">
                {r.level2} · {r.level1}
              </p>
              <p className="mt-2 text-[13px] text-foreground">
                ⭐{r.rating.toFixed(1)} <span className="text-muted">（{r.reviewCount} 评价）</span>
              </p>
              <p className="mt-2 text-[15px] font-bold text-primary">{feeSummary(r.feeMode, r.priceAmount, r.priceUnit, r.remark)}</p>
              <p className="mt-1 text-[12px] font-medium text-muted">{r.availabilityLabel}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {bookable ? (
                  <button
                    type="button"
                    className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover"
                    onClick={() => openBooking(r)}
                  >
                    预约
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-md border border-divider bg-muted/50 px-3 py-2 text-[12px] font-bold text-muted"
                    title="当前状态不可预约"
                  >
                    预约
                  </button>
                )}
                <Link to={`/resops/resource/${r.id}`} className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold hover:border-primary">
                  详情
                </Link>
              </div>
            </article>
          )
        })}
      </div>
      {filtered.length === 0 ? <p className="text-center text-[13px] text-muted">暂无匹配资源。</p> : null}

      <ResourceBookingModal resource={bookingResource} open={bookingResource != null} onClose={() => setBookingResource(null)} />
    </div>
  )
}
