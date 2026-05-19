import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import { DEMO_EXPERT_ZHANG_ID } from './innovationTypes'
import { useInnovationDemo } from './InnovationDemoContext'

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

export default function InnovationExpertReviewWorkbenchPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const toast = useToast()
  const { getProject, submitExpertReview } = useInnovationDemo()
  const p = projectId ? getProject(projectId) : undefined
  const slot = useMemo(() => p?.experts.find((e) => e.expertId === DEMO_EXPERT_ZHANG_ID), [p])

  const baseFromAi = useMemo(() => {
    if (!p?.aiReport) return { tech: 4, team: 4, market: 3, risk: '中风险' as const }
    const d = p.aiReport.dims
    const pick = (k: string) => d.find((x) => x.key.includes(k))?.value ?? 80
    return {
      tech: clamp(Math.round(pick('技术') / 20), 1, 5),
      team: clamp(Math.round(pick('团队') / 20), 1, 5),
      market: clamp(Math.round(pick('商业') / 20), 1, 5),
      risk: pick('合规') < 75 ? ('中风险' as const) : ('低风险' as const),
    }
  }, [p?.aiReport])

  const [tech, setTech] = useState(baseFromAi.tech)
  const [team, setTeam] = useState(baseFromAi.team)
  const [market, setMarket] = useState(baseFromAi.market)
  const [risk, setRisk] = useState<'低风险' | '中风险' | '高风险'>(baseFromAi.risk)
  const [opinion, setOpinion] = useState('建议在共享实验室阶段重点验证工艺放大窗口。')

  if (!p || !slot) {
    return (
      <p className="text-[13px] text-muted">
        未找到评审任务或您未被指派在此项目。
        <Link to="/innovation/expert/tasks" className="ms-2 text-primary">
          返回任务列表
        </Link>
      </p>
    )
  }

  const project = p

  function applyAiPrefill() {
    setTech(baseFromAi.tech)
    setTeam(baseFromAi.team)
    setMarket(baseFromAi.market)
    setRisk(baseFromAi.risk)
    if (project.aiReport) {
      setOpinion(project.aiReport.suggest.slice(0, 120))
    }
    toast.show('已根据现有 AI 评估结果预填（可继续修改）', 'success')
  }

  function saveDraft() {
    const score = Math.round(((tech + team + market) / 3) * 20)
    submitExpertReview(
      project.id,
      DEMO_EXPERT_ZHANG_ID,
      { score, opinion, techStars: tech, teamStars: team, marketStars: market, complianceRisk: risk },
      'draft',
    )
    toast.show('已暂存（不改变流程状态）', 'info')
  }

  function submit() {
    const score = Math.round(((tech + team + market) / 3) * 20)
    submitExpertReview(
      project.id,
      DEMO_EXPERT_ZHANG_ID,
      { score, opinion, techStars: tech, teamStars: team, marketStars: market, complianceRisk: risk },
      'submit',
    )
    toast.show('评审已提交 · 若全员完成将通知运营待决策', 'success')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <p className="text-[13px] text-muted">
            <Link to="/innovation/expert/tasks" className="text-primary hover:underline">
              我的任务
            </Link>
            / {project.name}
          </p>
          <h2 className="mt-2 text-[20px] font-bold">项目评审（张教授）</h2>
        </div>
        <Link to={`/innovation/project/${project.id}`} className="text-[13px] text-primary hover:underline">
          项目详情 + 时间线
        </Link>
      </div>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
        <h3 className="text-[14px] font-bold">项目资料</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.attachments.map((a) => (
            <button
              key={a.name}
              type="button"
              onClick={() => toast.show(`在线预览「${a.name}」（演示）`, 'info')}
              className="rounded-md border border-divider bg-page px-3 py-1.5 text-[12px] hover:border-primary hover:text-primary"
            >
              {a.name}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <h3 className="text-[14px] font-bold">评分维度（1–5）</h3>
          <button type="button" onClick={applyAiPrefill} className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-hover">
            ✨ 参考 AI 评估结果（预填）
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <StarRow label="技术创新性" val={tech} set={setTech} />
          <StarRow label="团队能力" val={team} set={setTeam} />
          <StarRow label="市场潜力" val={market} set={setMarket} />
          <label className="flex flex-col gap-2 text-[13px] text-muted">
            合规风险
            <select value={risk} onChange={(e) => setRisk(e.target.value as typeof risk)} className="rounded-md border border-divider px-3 py-2 bg-page">
              <option>低风险</option>
              <option>中风险</option>
              <option>高风险</option>
            </select>
          </label>
        </div>
        <label className="mt-6 block text-[13px] text-muted">
          综合意见
          <textarea value={opinion} onChange={(e) => setOpinion(e.target.value)} rows={5} className="mt-2 w-full rounded-md border border-divider px-3 py-2 text-[13px] text-foreground" />
        </label>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" onClick={saveDraft} className="rounded-md border border-divider px-5 py-2 text-[13px] font-semibold">
          暂存
        </button>
        <button type="button" onClick={submit} disabled={slot.state === 'done'} className="rounded-md bg-primary px-8 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-45">
          提交评审
        </button>
      </div>
    </div>
  )
}

function StarRow({
  label,
  val,
  set,
}: {
  label: string
  val: number
  set: (n: number) => void
}) {
  return (
    <label className="flex flex-col gap-2 text-[13px] text-muted">
      {label}（{val}/5）
      <input type="range" min={1} max={5} step={1} value={val} onChange={(e) => set(Number(e.target.value))} className="w-full accent-primary" />
      <span className="text-warning">{Array.from({ length: 5 }, (_, i) => (i < val ? '★' : '☆')).join('')}</span>
    </label>
  )
}
