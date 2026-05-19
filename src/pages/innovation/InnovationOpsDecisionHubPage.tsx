import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useInnovationDemo } from './InnovationDemoContext'

export default function InnovationOpsDecisionHubPage() {
  const { projects } = useInnovationDemo()
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    return projects.filter((p) => p.stage === 'pending_decision' && (!q.trim() || p.name.includes(q.trim())))
  }, [projects, q])

  return (
    <div className="space-y-5">
      <header className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <p className="text-[12px] font-bold uppercase tracking-wide text-primary">科创策源 · 入孵决策管理</p>
        <h1 className="mt-1 text-[20px] font-bold text-foreground">待决策项目</h1>
        <p className="mt-2 max-w-2xl text-[13px] text-muted">汇总 AI 与专家意见，提交实体 / 虚拟 / 观察 / 不予通过决策。</p>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-[var(--radius-panel)] border border-divider bg-surface px-4 py-3">
        <label className="min-w-[200px] flex-1 text-[13px] text-muted">
          搜索项目
          <input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 w-full rounded-md border border-divider bg-page px-3 py-2 text-[13px]" />
        </label>
        <Link to="/innovation/ops/pool" className="text-[13px] font-semibold text-primary hover:underline">
          ← 候选项目池
        </Link>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
        <table className="min-w-[720px] w-full text-[13px]">
          <thead className="bg-page text-[12px] font-bold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 text-start">项目名称</th>
              <th className="px-4 py-3 text-start">AI 综合</th>
              <th className="px-4 py-3 text-start">专家完成度</th>
              <th className="px-4 py-3 text-end">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-page/60">
                <td className="px-4 py-3 font-semibold">{p.name}</td>
                <td className="px-4 py-3 text-muted">{p.aiReport ? `${p.aiReport.overall} 分 · ${p.aiReport.levelLabel}` : '—'}</td>
                <td className="px-4 py-3 text-muted">
                  {p.experts.length ? `${p.experts.filter((e) => e.state === 'done').length}/${p.experts.length} 已提交` : '—'}
                </td>
                <td className="px-4 py-3 text-end">
                  <Link className="font-semibold text-primary hover:underline" to={`/innovation/ops/decision/${p.id}`}>
                    进入决策
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-4 py-10 text-center text-muted">当前无待决策项目。</p> : null}
      </div>
    </div>
  )
}
