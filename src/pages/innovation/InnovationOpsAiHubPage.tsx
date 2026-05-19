import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { StatusPill } from '../../components/ui/StatusPill'
import { RadarChart } from '../../components/RadarChart'
import { useInnovationDemo } from './InnovationDemoContext'
import { poolStagePillVariant, poolStatusLabel } from './innovationPoolLabels'

export default function InnovationOpsAiHubPage() {
  const toast = useToast()
  const { projects, batchFinalizeAiEval } = useInnovationDemo()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const rows = useMemo(() => {
    return projects.filter((p) => {
      if (!q.trim()) return true
      return p.name.includes(q.trim())
    })
  }, [projects, q])

  useEffect(() => {
    setPage(1)
  }, [q])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  return (
    <div className="space-y-5">
      <ModuleIntroCard
        title="📌 AI 智能评估 · 文档解析与评分报告"
        lines={[
          '串联 document_parser · project_pre_score · research_report_gen（演示）。可在候选项目池勾选批量初筛，或在此按项目进入控制台。',
          '阶段状态：待资料审核 → 待 AI 评估 → 专家评审 → 待决策。',
        ]}
      />

      <ListToolbarRow
        left={null}
        right={
          <>
            <label className="min-w-[220px] flex-1 text-[13px] text-muted">
              项目名称
              <input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 w-full rounded-md border border-divider bg-page px-3 py-2 text-[13px]" placeholder="搜索" />
            </label>
            <Link to="/innovation/ops/pool" className="self-end pb-1 text-[13px] font-semibold text-primary hover:underline">
              候选项目池 →
            </Link>
          </>
        }
      />

      <div className="space-y-4">
        {paged.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider p-5 pb-4">
              <div>
                <h2 className="text-[16px] font-bold text-foreground">{p.name}</h2>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                  状态
                  <StatusPill variant={poolStagePillVariant(p)}>{poolStatusLabel(p)}</StatusPill>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/innovation/ops/ai/${p.id}`} className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover">
                  {p.stage === 'pending_ai' && !p.aiReport ? '触发评估' : '查看报告'}
                </Link>
                <Link to={`/innovation/project/${p.id}?tab=ai`} className="rounded-md border border-divider px-4 py-2 text-[13px] font-semibold hover:border-primary/40">
                  详情
                </Link>
              </div>
            </div>
            {p.aiReport ? (
              <div className="grid gap-6 p-5 md:grid-cols-[240px_1fr] md:items-start">
                <div>
                  <RadarChart axes={p.aiReport.dims.map((d) => ({ key: d.key, value: d.value }))} size={200} />
                  <p className="mt-2 text-center text-[13px] font-semibold text-foreground">
                    {p.aiReport.overall} 分 · {p.aiReport.levelLabel}
                  </p>
                </div>
                <ul className="space-y-2 text-[13px] text-muted">
                  {p.aiReport.dims.map((d) => (
                    <li key={d.key}>
                      <span className="font-semibold text-foreground">{d.key}</span>：{d.value} 分
                    </li>
                  ))}
                  <li className="pt-2 text-foreground">
                    <span className="font-bold">AI 结论：</span>
                    {p.aiReport.suggest}
                  </li>
                </ul>
              </div>
            ) : (
              <p className="p-5 pt-4 text-[13px] text-muted">尚未生成 AI 报告。{p.stage === 'pending_ai' ? '可进入控制台执行 Skills。' : '当前阶段不在 AI 评估队列。'}</p>
            )}
            {p.stage === 'pending_ai' && !p.aiReport ? (
              <div className="border-t border-divider px-5 py-4">
                <button
                  type="button"
                  className="rounded-md border border-primary/40 bg-primary/8 px-4 py-2 text-[13px] font-semibold text-primary"
                  onClick={() => {
                    batchFinalizeAiEval([p.id])
                    toast.show('已写入 AI 初筛报告（演示快捷）', 'success')
                  }}
                >
                  快捷生成报告（演示）
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <ListPaginationBar total={rows.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1) }} />
    </div>
  )
}
