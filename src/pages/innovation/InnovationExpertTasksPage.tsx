import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { DEMO_EXPERT_ZHANG_ID } from './innovationTypes'
import { useInnovationDemo } from './InnovationDemoContext'

export default function InnovationExpertTasksPage() {
  const { projects } = useInnovationDemo()

  const rows = useMemo(() => {
    return projects.flatMap((p) =>
      p.experts
        .filter((e) => e.expertId === DEMO_EXPERT_ZHANG_ID)
        .map((e) => ({
          p,
          e,
          status:
            e.state === 'done' ? ('done' as const) : e.state === 'reviewing' ? ('reviewing' as const) : ('pending' as const),
        })),
    )
  }, [projects])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">专家评审</p>
        <h2 className="mt-2 text-[20px] font-bold text-foreground">我的评审任务</h2>
        <p className="mt-2 text-[13px] text-muted">
          当前演示账号映射为<strong className="text-foreground"> 张教授</strong>的任务列表。
        </p>
      </header>

      <div className="overflow-hidden rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
        <table className="min-w-full text-[13px]">
          <thead className="bg-page text-[11px] font-bold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 text-start">项目名称</th>
              <th className="px-4 py-3 text-start">分配窗口</th>
              <th className="px-4 py-3 text-start">截止时间</th>
              <th className="px-4 py-3 text-start">状态</th>
              <th className="px-4 py-3 text-end">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {rows.map(({ p, e, status }) => (
              <tr key={`${p.id}-${e.expertId}`}>
                <td className="px-4 py-3 font-semibold">{p.name}</td>
                <td className="px-4 py-3 text-muted tabular-nums">{p.submittedAt}</td>
                <td className="px-4 py-3 tabular-nums text-muted">{e.deadline}</td>
                <td className="px-4 py-3">{status === 'done' ? '已完成' : status === 'reviewing' ? '评审中' : '待评审'}</td>
                <td className="px-4 py-3 text-end">
                  <Link
                    className="font-semibold text-primary hover:underline"
                    to={`/innovation/expert/review/${p.id}`}
                  >
                    {status === 'pending' ? '去评审' : '继续评审'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-4 py-10 text-center text-[13px] text-muted">暂无指派给您的评审任务。</p> : null}
      </div>
    </div>
  )
}
