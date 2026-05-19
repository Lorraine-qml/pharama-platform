import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import { DEMO_EXPERT_ZHANG_ID, EXPERT_CATALOG_DEMO } from './innovationTypes'
import { useInnovationDemo } from './InnovationDemoContext'

export default function InnovationOpsAssignExpertsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { getProject, assignExperts } = useInnovationDemo()
  const p = projectId ? getProject(projectId) : undefined
  const [picked, setPicked] = useState<Record<string, boolean>>(() =>
    ['exp_zhang', 'exp_li', 'exp_wang'].reduce<Record<string, boolean>>((a, id) => {
      a[id] = true
      return a
    }, {}),
  )

  const aiRows = useMemo(() => EXPERT_CATALOG_DEMO.slice(0, 3).map((e, i) => ({ ...e, matchPct: 92 - i * 7 })), [])

  if (!p) return <p className="text-muted">未找到项目。</p>

  const proj = p

  function toggle(id: string) {
    setPicked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function runMatcher() {
    setPicked((prev) => {
      const n = { ...prev }
      EXPERT_CATALOG_DEMO.slice(1, 3).forEach((e) => {
        n[e.expertId] = true
      })
      return n
    })
    toast.show('已调用 expert_matcher ✨ （演示占位：勾选推荐专家）', 'success')
  }

  function confirm() {
    const ids = EXPERT_CATALOG_DEMO.filter((e) => picked[e.expertId]).map((e) => e.expertId)
    if (ids.length === 0) {
      toast.show('请至少勾选 1 位专家', 'warning')
      return
    }
    if (ids.length > 6) {
      toast.show('建议一次分配不超过 6 位', 'warning')
      return
    }
    const deadline = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    const rows = EXPERT_CATALOG_DEMO.filter((e) => picked[e.expertId]).map((e, idx) => ({
      expertId: e.expertId,
      name: e.name,
      field: e.field,
      matchPct: aiRows.find((r) => r.expertId === e.expertId)?.matchPct ?? 80 + idx,
      aiPick: e.expertId === DEMO_EXPERT_ZHANG_ID,
      state: 'pending' as const,
      deadline,
    }))
    assignExperts(proj.id, rows)
    toast.show(`已为 ${rows.length} 位专家下发评审工单`, 'success')
    navigate(`/innovation/project/${proj.id}`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap justify-between gap-2">
        <h2 className="text-[19px] font-bold">分配专家 · {proj.name}</h2>
        <Link to={`/innovation/project/${proj.id}`} className="text-[13px] text-primary hover:underline">
          详情
        </Link>
      </div>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[14px] font-bold">✨ AI 推荐专家</h3>
          <button type="button" onClick={runMatcher} className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-hover">
            ✨ AI 推荐（expert_matcher）
          </button>
        </div>
        <ul className="mt-4 space-y-3 text-[13px]">
          {aiRows.map((e) => (
            <li key={e.expertId}>
              <label className="flex cursor-pointer gap-3 rounded-lg border border-divider px-3 py-2 hover:bg-primary-light/35">
                <input type="checkbox" checked={!!picked[e.expertId]} onChange={() => toggle(e.expertId)} />
                <span className="font-semibold">{e.name}</span>
                <span className="text-muted">（{e.field}）</span>
                <span className="ms-auto font-mono tabular-nums text-primary">{e.matchPct}%</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
        <h3 className="mb-4 text-[14px] font-bold">专家库 · 可多选（演示 3~5 人为佳）</h3>
        <ul className="max-h-[280px] space-y-2 overflow-auto text-[13px]">
          {EXPERT_CATALOG_DEMO.map((e) => (
            <li key={e.expertId}>
              <label className="flex cursor-pointer gap-2 rounded-lg border border-divider px-3 py-2 hover:bg-page">
                <input type="checkbox" checked={!!picked[e.expertId]} onChange={() => toggle(e.expertId)} />
                {e.name}（{e.field}）
              </label>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" className="rounded-md border px-5 py-2 text-[13px]" onClick={() => navigate(`/innovation/project/${proj.id}`)}>
          跳过（稍后分配）
        </button>
        <button type="button" onClick={confirm} className="rounded-md bg-primary px-6 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover">
          确认分配
        </button>
      </div>
    </div>
  )
}
