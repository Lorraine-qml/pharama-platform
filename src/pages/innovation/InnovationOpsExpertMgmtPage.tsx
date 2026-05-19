import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import { useInnovationDemo } from './InnovationDemoContext'

function expertSummary(ex: { name: string; state: string }[]) {
  return ex.map((e) => `${e.name}(${e.state === 'done' ? '已提交' : e.state === 'reviewing' ? '评审中' : '待评审'})`).join('、')
}

export default function InnovationOpsExpertMgmtPage() {
  const toast = useToast()
  const { projects, urgeExpert } = useInnovationDemo()
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    return projects
      .filter(
        (p) =>
          p.stage === 'pending_expert_assign' ||
          p.stage === 'expert_reviewing' ||
          p.stage === 'pending_decision' ||
          p.experts.length > 0,
      )
      .filter((p) => !q.trim() || p.name.includes(q.trim()))
  }, [projects, q])

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide text-primary">科创策源 · 专家评审管理</p>
          <h1 className="mt-1 text-[20px] font-bold text-foreground">专家评审任务</h1>
          <p className="mt-2 max-w-2xl text-[13px] text-muted">专家分配、进度与催办；评分表来自基础数据「评价表管理」。</p>
        </div>
        <Link to="/basic/experts" className="rounded-md border border-divider px-4 py-2 text-[13px] font-semibold hover:border-primary/40">
          打开专家库
        </Link>
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
        <table className="min-w-[880px] w-full text-[13px]">
          <thead className="bg-page text-[12px] font-bold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 text-start">项目名称</th>
              <th className="px-4 py-3 text-start">分配专家</th>
              <th className="px-4 py-3 text-start">评审状态</th>
              <th className="px-4 py-3 text-end">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {rows.map((p) => {
              const done = p.experts.filter((e) => e.state === 'done').length
              const total = p.experts.length
              const statusLabel = total === 0 ? '未分配' : done === total ? '已完成' : `进行中(${done}/${total})`
              return (
                <tr key={p.id} className="hover:bg-page/60">
                  <td className="px-4 py-3 font-semibold">{p.name}</td>
                  <td className="max-w-md px-4 py-3 text-muted">{p.experts.length ? expertSummary(p.experts) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-primary/10 px-2 py-1 text-[12px] font-bold text-primary ring-1 ring-primary/20">{statusLabel}</span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex flex-wrap justify-end gap-2">
                      {p.stage === 'pending_expert_assign' ? (
                        <Link className="font-semibold text-primary hover:underline" to={`/innovation/ops/assign/${p.id}`}>
                          分配专家
                        </Link>
                      ) : null}
                      <Link className="font-semibold text-primary hover:underline" to={`/innovation/project/${p.id}`}>
                        查看
                      </Link>
                      {p.experts.map((e) =>
                        e.state !== 'done' ? (
                          <button
                            key={e.expertId}
                            type="button"
                            aria-label={`向${e.name}催办`}
                            className="text-[12px] font-semibold text-warning hover:underline"
                            onClick={() => {
                              urgeExpert(p.id, e.expertId)
                              toast.show('已发送催办（演示）', 'success')
                            }}
                          >
                            催办
                          </button>
                        ) : null,
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-4 py-10 text-center text-muted">暂无评审任务。</p> : null}
      </div>
    </div>
  )
}
