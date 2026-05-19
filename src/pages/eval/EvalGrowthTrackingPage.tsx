import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Modal } from '../../components/Modal'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { downloadCsv } from '../eco/ecoDownload'
import type { ProjectArchive } from '../hatch/hatchTypes'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import { EVAL_SCORES, EVAL_TIMELINE_EXTRAS, trackTagsFromDescription } from './evalShared'
import { useEvalProjectId } from './EvalHeader'

function physicalIncubationFilter(a: ProjectArchive) {
  return a.incubationType === '实体' && a.status !== '退出' && a.status !== '毕业'
}

type MergedEv = { time: string; description: string }

/** 与多选筛选、导出列一致 */
function growthEventCategory(desc: string): string {
  if (desc.includes('签约')) return '签约'
  if (desc.includes('融资')) return '融资'
  if (desc.includes('专利')) return '专利'
  if (desc.includes('资源') || desc.includes('预约')) return '资源使用'
  if (desc.includes('研发') || desc.includes('载体') || desc.includes('管线')) return '研发'
  if (desc.includes('AI') || desc.includes('智能体')) return 'AI使用'
  if (desc.includes('大赛') || desc.includes('事件')) return '重大事件'
  return '其他'
}

const TYPE_CHIPS = ['研发', '融资', '专利', '资源使用', 'AI使用', '重大事件', '签约'] as const

const PAGE_SIZE = 8

function mergeTimeline(archive: ProjectArchive): MergedEv[] {
  const fromArchive = archive.events.map((e) => ({ time: e.time, description: e.description }))
  const extras = EVAL_TIMELINE_EXTRAS[archive.id] ?? []
  const map = new Map<string, MergedEv>()
  for (const row of [...fromArchive, ...extras]) {
    const key = `${row.time}\t${row.description}`
    if (!map.has(key)) map.set(key, row)
  }
  return [...map.values()].sort((a, b) => a.time.localeCompare(b.time))
}

function scoreLine(projectId: string): { total: number; badge: string } {
  const s = EVAL_SCORES[projectId]
  if (!s) return { total: 0, badge: '' }
  const badge = s.badge === '高潜力' ? '高潜力' : s.badge === '重点培育' ? '重点培育' : ''
  return { total: s.total, badge }
}

export default function EvalGrowthTrackingPage() {
  const toast = useToast()
  const [sp, setSp] = useSearchParams()
  const { archives } = useHatchMgmt()
  const list = archives.filter(physicalIncubationFilter)
  const baseList = list.length ? list : archives
  const { archive, projectId } = useEvalProjectId(baseList, list.length ? physicalIncubationFilter : undefined)

  const [mode, setMode] = useState<'timeline' | 'list'>('timeline')
  const [year, setYear] = useState('全部')
  /** null = 全部类型 */
  const [typeSet, setTypeSet] = useState<Set<string> | null>(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const [switchOpen, setSwitchOpen] = useState(false)
  const [switchQ, setSwitchQ] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)

  const rows = useMemo(() => (archive ? mergeTimeline(archive) : []), [archive])

  useEffect(() => {
    setPage(1)
  }, [archive?.id])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (year !== '全部' && !r.time.startsWith(year)) return false
      const c = growthEventCategory(r.description)
      if (typeSet != null && typeSet.size > 0 && !typeSet.has(c)) return false
      if (q.trim() && !r.description.includes(q.trim()) && !r.time.includes(q.trim())) return false
      return true
    })
  }, [rows, year, typeSet, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, pageSafe])

  const years = useMemo(() => {
    const ys = new Set<string>()
    for (const r of rows) {
      const y = r.time.slice(0, 4)
      if (y.length === 4) ys.add(y)
    }
    return ['全部', ...[...ys].sort()]
  }, [rows])

  const pipe0 = archive?.pipeline[0]
  const trackLabel = archive?.tags.slice(0, 2).join('、') || '—'
  const stageLabel = pipe0?.stage ?? '—'
  const sc = archive ? scoreLine(archive.id) : { total: 0, badge: '' }

  function exportCsv() {
    if (!archive) return
    downloadCsv(
      `项目成长跟踪-${archive.name}-${new Date().toISOString().slice(0, 10)}.csv`,
      ['日期', '类型', '描述'],
      filtered.map((r) => [r.time, growthEventCategory(r.description), r.description]),
    )
    toast.show('已导出当前筛选时间线（CSV）', 'success')
  }

  function openSwitch() {
    setSwitchQ('')
    setPendingId(projectId)
    setSwitchOpen(true)
  }

  function confirmSwitch() {
    const id = pendingId ?? projectId
    const next = new URLSearchParams(sp)
    next.set('projectId', id)
    setSp(next, { replace: true })
    setSwitchOpen(false)
    setPage(1)
    toast.show('已切换项目', 'success')
  }

  function toggleTypeChip(label: string) {
    setPage(1)
    if (label === '__all__') {
      setTypeSet(null)
      return
    }
    setTypeSet((prev) => {
      const next = new Set(prev ?? [])
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next.size === 0 ? null : next
    })
  }

  const switchList = useMemo(() => {
    const qn = switchQ.trim().toLowerCase()
    return baseList.filter((a) => !qn || a.name.toLowerCase().includes(qn) || a.id.toLowerCase().includes(qn))
  }, [baseList, switchQ])

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="📈 项目成长跟踪"
        lines={[
          '顶部项目信息栏吸顶展示当前项目、标签与快捷操作；支持弹窗切换项目、类型多选筛选与时间线分页。',
          '与入孵档案事件表联动；导出遵循当前筛选条件。',
        ]}
      />

      {!archive ? (
        <p className="text-[13px] text-muted">暂无项目。</p>
      ) : (
        <>
          <div className="sticky top-14 z-30 -mx-6 border-b border-divider bg-surface/95 px-6 py-3 shadow-sm backdrop-blur-sm sm:-mx-8 sm:px-8">
            <div className="rounded-xl border border-primary/25 bg-primary-light/40 px-4 py-3 dark:bg-primary/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12px] font-medium text-muted">当前项目</span>
                    <Link
                      to={`/eval/portrait?projectId=${encodeURIComponent(archive.id)}`}
                      className="truncate text-[18px] font-bold tracking-tight text-primary hover:underline sm:text-[20px]"
                    >
                      {archive.name}
                    </Link>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-foreground sm:text-[13px]">
                    <span>
                      <span className="text-muted">赛道</span>：{trackLabel}
                    </span>
                    <span className="text-divider">|</span>
                    <span>
                      <span className="text-muted">阶段</span>：{stageLabel}
                    </span>
                    <span className="text-divider">|</span>
                    <span>
                      <span className="text-muted">入孵类型</span>：{archive.incubationType}
                    </span>
                    <span className="text-divider">|</span>
                    <span>
                      <span className="text-muted">综合评分</span>：
                      <span className="font-semibold tabular-nums">{sc.total || '—'}</span>
                      {sc.badge ? <span className="ml-1 text-primary">（{sc.badge}）</span> : null}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openSwitch}
                  className="shrink-0 rounded-lg border border-divider bg-surface px-3 py-2 text-[13px] font-semibold shadow-sm hover:border-primary/40 hover:bg-primary-light/30"
                >
                  切换项目 ▾
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/eval/portrait?projectId=${encodeURIComponent(archive.id)}`}
                  className="rounded-md border border-divider bg-surface px-3 py-1.5 text-[12px] font-semibold text-primary hover:bg-muted/30"
                >
                  查看完整画像
                </Link>
                <Link
                  to={`/hatch/archive/${archive.id}`}
                  className="rounded-md border border-divider bg-surface px-3 py-1.5 text-[12px] font-semibold text-foreground hover:bg-muted/30"
                >
                  编辑项目
                </Link>
                <button
                  type="button"
                  onClick={exportCsv}
                  className="rounded-md border border-divider bg-surface px-3 py-1.5 text-[12px] font-semibold hover:bg-muted/30"
                >
                  导出时间线
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[16px] font-bold text-foreground">
              {archive.name}
              <span className="font-normal text-muted"> · 成长时间线</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <label className="flex items-center gap-2">
                <span className="text-muted">年份</span>
                <select
                  className="rounded-md border border-divider bg-surface px-2 py-1.5"
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value)
                    setPage(1)
                  }}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              {mode === 'list' && (
                <label className="flex min-w-[200px] flex-1 items-center gap-2">
                  <span className="shrink-0 text-muted">搜索</span>
                  <input
                    className="min-w-0 flex-1 rounded-md border border-divider bg-surface px-2 py-1.5"
                    placeholder="关键词…"
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value)
                      setPage(1)
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] text-muted">事件类型（多选；不选表示全部）</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setTypeSet(null)
                  setPage(1)
                }}
                className={cn(
                  'rounded-full border px-3 py-1 text-[12px] font-medium transition-colors',
                  typeSet == null ? 'border-primary bg-primary/10 text-primary' : 'border-divider bg-surface text-foreground hover:bg-muted/30',
                )}
              >
                全部
              </button>
              {TYPE_CHIPS.map((lab) => {
                const active = typeSet != null && typeSet.has(lab)
                return (
                  <button
                    key={lab}
                    type="button"
                    onClick={() => toggleTypeChip(lab)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-[12px] font-medium transition-colors',
                      active ? 'border-primary bg-primary/10 text-primary' : 'border-divider bg-surface text-foreground hover:bg-muted/30',
                    )}
                  >
                    {lab}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-md border px-3 py-1.5 text-[13px] font-medium ${mode === 'timeline' ? 'border-primary bg-primary/10 text-primary' : 'border-divider bg-surface text-foreground'}`}
                onClick={() => setMode('timeline')}
              >
                时间线视图
              </button>
              <button
                type="button"
                className={`rounded-md border px-3 py-1.5 text-[13px] font-medium ${mode === 'list' ? 'border-primary bg-primary/10 text-primary' : 'border-divider bg-surface text-foreground'}`}
                onClick={() => setMode('list')}
              >
                列表视图
              </button>
            </div>
          </div>

          {mode === 'timeline' ? (
            <div className="rounded-lg border border-divider bg-surface p-4">
              <ul className="space-y-2">
                {paged.length === 0 ? (
                  <li className="text-[13px] text-muted">当前筛选下无记录。</li>
                ) : (
                  paged.map((r, i) => (
                    <li key={`${r.time}-${i}`} className="flex gap-3 border-b border-divider/80 py-2 text-[13px] last:border-0">
                      <span className="w-[92px] shrink-0 font-mono text-muted">{r.time}</span>
                      <span className="shrink-0">{trackTagsFromDescription(r.description)}</span>
                      <span className="min-w-0 text-foreground">
                        <span className="mr-2 text-[11px] text-muted">[{growthEventCategory(r.description)}]</span>
                        {r.description}
                      </span>
                    </li>
                  ))
                )}
              </ul>
              <PaginationBar total={filtered.length} page={pageSafe} totalPages={totalPages} onPage={setPage} />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-divider">
              <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
                <thead className="border-b border-divider bg-muted/20">
                  <tr>
                    <th className="px-3 py-2 font-semibold">日期</th>
                    <th className="px-3 py-2 font-semibold">类型</th>
                    <th className="px-3 py-2 font-semibold">描述</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r, i) => (
                    <tr key={`${r.time}-${i}`} className="border-b border-divider/80">
                      <td className="px-3 py-2 font-mono text-muted">{r.time}</td>
                      <td className="px-3 py-2">{growthEventCategory(r.description)}</td>
                      <td className="px-3 py-2">{r.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-divider p-3">
                <PaginationBar total={filtered.length} page={pageSafe} totalPages={totalPages} onPage={setPage} />
              </div>
            </div>
          )}

          <section className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
            <h2 className="mb-3 text-[13px] font-bold text-foreground">产品管线跟踪表</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                <thead className="border-b border-divider bg-muted/20">
                  <tr>
                    <th className="px-3 py-2 font-semibold">管线名称</th>
                    <th className="px-3 py-2 font-semibold">阶段</th>
                    <th className="px-3 py-2 font-semibold">关键里程碑</th>
                    <th className="px-3 py-2 font-semibold">计划完成</th>
                    <th className="px-3 py-2 font-semibold">实际完成</th>
                    <th className="px-3 py-2 font-semibold">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {archive.pipeline.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-muted">
                        暂无管线，请在档案中维护。
                      </td>
                    </tr>
                  ) : (
                    archive.pipeline.map((p) => (
                      <tr key={p.id} className="border-b border-divider/80">
                        <td className="px-3 py-2">{p.productName}</td>
                        <td className="px-3 py-2">{p.stage}</td>
                        <td className="px-3 py-2">{p.milestone ?? 'IND 申报（演示）'}</td>
                        <td className="px-3 py-2">2025Q4（演示）</td>
                        <td className="px-3 py-2">—</td>
                        <td className="px-3 py-2">进行中</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Link to={`/hatch/archive/${archive.id}`} className="mt-3 inline-block text-[12px] font-semibold text-primary hover:underline">
              打开档案维护管线 →
            </Link>
          </section>

          <Modal
            open={switchOpen}
            title="切换项目"
            onClose={() => setSwitchOpen(false)}
            footer={
              <>
                <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setSwitchOpen(false)}>
                  取消
                </button>
                <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={confirmSwitch}>
                  确认
                </button>
              </>
            }
          >
            <div className="space-y-3">
              <label className="block text-[13px]">
                <span className="text-muted">搜索项目名称</span>
                <input
                  className="mt-1 w-full rounded-md border border-divider bg-surface px-3 py-2 text-[13px]"
                  placeholder="输入关键词过滤…"
                  value={switchQ}
                  onChange={(e) => setSwitchQ(e.target.value)}
                />
              </label>
              <ul className="max-h-[280px] overflow-y-auto rounded-md border border-divider">
                {switchList.length === 0 ? (
                  <li className="px-3 py-4 text-center text-[13px] text-muted">无匹配项目</li>
                ) : (
                  switchList.map((a) => {
                    const cur = a.id === archive.id
                    const sel = pendingId === a.id
                    return (
                      <li key={a.id} className="border-b border-divider/80 last:border-0">
                        <button
                          type="button"
                          onClick={() => setPendingId(a.id)}
                          className={cn(
                            'flex w-full items-center justify-between px-3 py-2.5 text-left text-[13px] transition-colors',
                            sel ? 'bg-primary/10 font-medium text-primary' : 'hover:bg-muted/30',
                          )}
                        >
                          <span>
                            {a.name}
                            {cur ? <span className="ml-2 text-[12px] text-muted">（当前）</span> : null}
                          </span>
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          </Modal>
        </>
      )}
    </div>
  )
}

function PaginationBar({
  total,
  page,
  totalPages,
  onPage,
}: {
  total: number
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  const nums = useMemo(() => {
    const span = 5
    const half = Math.floor(span / 2)
    let start = Math.max(1, page - half)
    let end = Math.min(totalPages, start + span - 1)
    start = Math.max(1, end - span + 1)
    const out: number[] = []
    for (let i = start; i <= end; i++) out.push(i)
    return out
  }, [page, totalPages])

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-divider pt-3 text-[13px]">
      <span className="text-muted">
        共 <span className="font-semibold text-foreground">{total}</span> 条记录
      </span>
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          className="rounded border border-divider px-2 py-1 text-[12px] font-medium disabled:opacity-40"
          onClick={() => onPage(page - 1)}
        >
          上一页
        </button>
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPage(n)}
            className={cn(
              'min-w-[2rem] rounded border px-2 py-1 text-[12px] font-medium',
              n === page ? 'border-primary bg-primary/10 text-primary' : 'border-divider hover:bg-muted/30',
            )}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          className="rounded border border-divider px-2 py-1 text-[12px] font-medium disabled:opacity-40"
          onClick={() => onPage(page + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  )
}
