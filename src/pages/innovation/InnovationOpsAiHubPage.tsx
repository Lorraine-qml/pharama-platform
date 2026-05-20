import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { useToast } from '../../components/ToastProvider'
import { StatusPill } from '../../components/ui/StatusPill'
import { cn } from '../../utils/cn'
import { AiEvaluationReportModal } from './AiEvaluationReportModal'
import { useInnovationDemo } from './InnovationDemoContext'
import { poolStagePillVariant, poolStatusLabel } from './innovationPoolLabels'
import type { SjProject, SjStage } from './innovationTypes'

type EvalFilter = 'all' | 'done' | 'pending' | 'running'
type ScoreFilter = 'all' | 'excellent' | 'good' | 'fair'
type SortKey = 'score_desc' | 'time_desc' | 'name'

const STAGE_FILTER_OPTS: { value: SjStage | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending_material_review', label: '待资料审核' },
  { value: 'pending_ai', label: '待 AI 评估' },
  { value: 'expert_reviewing', label: '专家评审中' },
  { value: 'review_done', label: '评审完成' },
  { value: 'pending_decision', label: '待决策' },
]

const EVAL_FILTER_OPTS: { value: EvalFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'done', label: '已完成评估' },
  { value: 'pending', label: '待评估' },
  { value: 'running', label: '评估中' },
]

const SCORE_FILTER_OPTS: { value: ScoreFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'excellent', label: '优秀（≥85）' },
  { value: 'good', label: '良好（70-84）' },
  { value: 'fair', label: '一般（<70）' },
]

function evalStatusLabel(p: SjProject): string {
  if (p.aiReport) return '已完成评估'
  if (p.stage === 'pending_ai') return '评估中'
  return '待评估'
}

function matchesEvalFilter(p: SjProject, f: EvalFilter): boolean {
  if (f === 'all') return true
  if (f === 'done') return Boolean(p.aiReport)
  if (f === 'running') return p.stage === 'pending_ai' && !p.aiReport
  return !p.aiReport && p.stage !== 'pending_ai'
}

function matchesScoreFilter(p: SjProject, f: ScoreFilter): boolean {
  if (f === 'all' || !p.aiReport) return f === 'all'
  const s = p.aiReport.overall
  if (f === 'excellent') return s >= 85
  if (f === 'good') return s >= 70 && s < 85
  return s < 70
}

function parseEvalTime(s?: string): number {
  if (!s) return 0
  const t = Date.parse(s.replace(' ', 'T'))
  return Number.isNaN(t) ? 0 : t
}

function DimScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2 text-[12px]">
      <span className="truncate text-muted">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-divider/80">
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="tabular-nums font-semibold text-foreground">{value}</span>
    </div>
  )
}

function AiEvalProjectCard({
  project: p,
  onOpenReport,
  onStatusClick,
}: {
  project: SjProject
  onOpenReport: () => void
  onStatusClick: () => void
}) {
  const hasReport = Boolean(p.aiReport)
  const status = poolStatusLabel(p)

  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm transition-shadow',
        hasReport && 'hover:border-primary/30 hover:shadow-md',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-bold text-foreground">{p.name}</h2>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
            <button
              type="button"
              onClick={onStatusClick}
              className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              title="点击筛选同状态项目"
            >
              <StatusPill variant={poolStagePillVariant(p)}>{status}</StatusPill>
            </button>
            <span className="text-muted">{evalStatusLabel(p)}</span>
          </p>
        </div>
        {hasReport && p.aiReport ? (
          <div className="shrink-0 text-end">
            <p className="text-[22px] font-bold leading-none text-primary tabular-nums">{p.aiReport.overall}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-muted">分 · {p.aiReport.levelLabel}</p>
          </div>
        ) : null}
      </div>

      {hasReport && p.aiReport ? (
        <>
          <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 rounded-lg border border-divider bg-page/40 p-3 sm:grid-cols-2">
            {p.aiReport.dims.map((d) => (
              <DimScoreBar key={d.key} label={d.key} value={d.value} />
            ))}
          </div>
          <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-muted">
            <span className="font-semibold text-foreground">AI 结论：</span>
            {p.aiReport.suggest}
          </p>
        </>
      ) : (
        <p className="mt-4 flex-1 rounded-lg border border-dashed border-divider bg-page/50 px-3 py-4 text-[12px] leading-relaxed text-muted">
          尚未生成 AI 报告。
          {p.stage === 'pending_ai' ? ' 可前往任务中心触发评估。' : ' 当前阶段不在 AI 评估队列。'}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-divider pt-4">
        {!hasReport ? (
          <Link
            to={`/innovation/project/${p.id}`}
            className="rounded-md border border-divider px-3 py-1.5 text-[12px] font-semibold hover:border-primary/40"
          >
            查看项目
          </Link>
        ) : null}
        <button
          type="button"
          disabled={!hasReport}
          onClick={onOpenReport}
          className={cn(
            'rounded-md px-4 py-2 text-[12px] font-semibold',
            hasReport
              ? 'bg-primary text-white hover:bg-primary-hover'
              : 'cursor-not-allowed border border-divider bg-page text-muted opacity-60',
          )}
        >
          查看详细报告
        </button>
      </div>
    </article>
  )
}

export default function InnovationOpsAiHubPage() {
  const toast = useToast()
  const { projects } = useInnovationDemo()
  const [q, setQ] = useState('')
  const [stageFilter, setStageFilter] = useState<SjStage | 'all'>('all')
  const [evalFilter, setEvalFilter] = useState<EvalFilter>('all')
  const [trackFilter, setTrackFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('score_desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [reportProject, setReportProject] = useState<SjProject | null>(null)

  const tracks = useMemo(() => {
    const set = new Set(projects.map((p) => p.track))
    return ['all', ...Array.from(set).sort()]
  }, [projects])

  const rows = useMemo(() => {
    let list = [...projects]
    const query = q.trim()
    if (query) list = list.filter((p) => p.name.includes(query))
    if (stageFilter !== 'all') list = list.filter((p) => p.stage === stageFilter)
    if (evalFilter !== 'all') list = list.filter((p) => matchesEvalFilter(p, evalFilter))
    if (trackFilter !== 'all') list = list.filter((p) => p.track === trackFilter)
    if (scoreFilter !== 'all') list = list.filter((p) => matchesScoreFilter(p, scoreFilter))

    list.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'zh-CN')
      if (sortKey === 'time_desc') return parseEvalTime(b.aiEvaluatedAt) - parseEvalTime(a.aiEvaluatedAt)
      const sa = a.aiReport?.overall ?? -1
      const sb = b.aiReport?.overall ?? -1
      return sb - sa
    })
    return list
  }, [projects, q, stageFilter, evalFilter, trackFilter, scoreFilter, sortKey])

  useEffect(() => {
    setPage(1)
  }, [q, stageFilter, evalFilter, trackFilter, scoreFilter, sortKey])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  function refreshList() {
    toast.show('列表已刷新', 'success')
  }

  function exportList() {
    toast.show('导出评估摘要（演示）', 'info')
  }

  const selectCls = 'mt-1 rounded-md border border-divider bg-page px-2 py-1.5 text-[13px] text-foreground'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-foreground">AI 智能评估</h1>
          <p className="mt-1 text-[13px] text-muted">文档解析与多维度评分；卡片展示摘要，详情弹窗查看完整报告与雷达图。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px] font-semibold hover:bg-page" onClick={refreshList}>
            刷新
          </button>
          <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px] font-semibold hover:bg-page" onClick={exportList}>
            导出
          </button>
          <Link to="/innovation/ops/pool" className="rounded-md border border-primary/40 bg-primary/8 px-4 py-2 text-[13px] font-semibold text-primary hover:bg-primary/12">
            候选项目池 →
          </Link>
        </div>
      </div>

      <div className="rounded-[var(--radius-panel)] border border-divider bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-[12px] text-muted">
            项目状态
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as SjStage | 'all')} className={selectCls}>
              {STAGE_FILTER_OPTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[12px] text-muted">
            评估状态
            <select value={evalFilter} onChange={(e) => setEvalFilter(e.target.value as EvalFilter)} className={selectCls}>
              {EVAL_FILTER_OPTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[12px] text-muted">
            赛道
            <select value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)} className={selectCls}>
              {tracks.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? '全部' : t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[12px] text-muted">
            综合评分
            <select value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value as ScoreFilter)} className={selectCls}>
              {SCORE_FILTER_OPTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[12px] text-muted">
            排序
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={selectCls}>
              <option value="score_desc">综合评分（高→低）</option>
              <option value="time_desc">评估时间（新→旧）</option>
              <option value="name">项目名称</option>
            </select>
          </label>
          <label className="min-w-[200px] flex-1 text-[12px] text-muted">
            🔍 项目名称
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="mt-1 w-full rounded-md border border-divider bg-page px-3 py-2 text-[13px] text-foreground"
              placeholder="搜索"
            />
          </label>
        </div>
        <p className="mt-3 text-[12px] text-muted">
          共 {rows.length} 个项目 · 已完成评估 {projects.filter((p) => p.aiReport).length} 个
        </p>
      </div>

      {paged.length === 0 ? (
        <p className="rounded-[var(--radius-panel)] border border-dashed border-divider bg-surface px-6 py-12 text-center text-[13px] text-muted">
          暂无符合筛选条件的项目
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((p) => (
            <AiEvalProjectCard
              key={p.id}
              project={p}
              onOpenReport={() => setReportProject(p)}
              onStatusClick={() => {
                setStageFilter(p.stage)
                toast.show(`已筛选：${poolStatusLabel(p)}`, 'info')
              }}
            />
          ))}
        </div>
      )}

      <ListPaginationBar
        total={rows.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n)
          setPage(1)
        }}
      />

      <AiEvaluationReportModal
        project={reportProject}
        open={reportProject != null}
        onClose={() => setReportProject(null)}
      />
    </div>
  )
}
