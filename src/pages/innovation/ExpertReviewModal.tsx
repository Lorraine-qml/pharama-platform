import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { useAuth } from '../../auth/AuthContext'
import { useInnovationDemo } from './InnovationDemoContext'
import {
  COMPLIANCE_RISK_GUIDE,
  dimensionScoringGuide,
  findFormDimension,
  resolveEvalFormForProject,
} from '../basicData/evaluationFormGuide'
import { EvaluationFormCriteriaPanel } from './EvaluationFormCriteriaPanel'
import { fileKindFromName } from './materialReviewCatalog'
import { ModalSection, OPS_MODAL_PANEL } from './innovationModalShared'
import type { SjAttachment, SjProject } from './innovationTypes'
import { DEMO_EXPERT_ZHANG_ID } from './innovationTypes'

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

type Props = {
  project: SjProject | null
  open: boolean
  onClose: () => void
  /** 未指定时：专家账号用张教授；运营账号用首位待评审专家 */
  expertId?: string
  onSubmitted?: () => void
}

function resolveReviewerId(project: SjProject, preferredId: string, isExpertRole: boolean): string | null {
  if (isExpertRole) {
    const mine = project.experts.find((e) => e.expertId === DEMO_EXPERT_ZHANG_ID)
    return mine ? DEMO_EXPERT_ZHANG_ID : null
  }
  if (preferredId && preferredId !== DEMO_EXPERT_ZHANG_ID) {
    const slot = project.experts.find((e) => e.expertId === preferredId)
    if (slot) return preferredId
  }
  const pending = project.experts.find((e) => e.state !== 'done')
  if (pending) return pending.expertId
  const zhang = project.experts.find((e) => e.expertId === DEMO_EXPERT_ZHANG_ID)
  return zhang?.expertId ?? project.experts[0]?.expertId ?? null
}

function starsFromAi(project: SjProject) {
  if (!project.aiReport) {
    return { tech: 4, team: 4, market: 3, risk: '中风险' as const, opinion: '建议在共享实验室阶段重点验证工艺放大窗口。' }
  }
  const d = project.aiReport.dims
  const pick = (k: string) => d.find((x) => x.key.includes(k))?.value ?? 80
  return {
    tech: clamp(Math.round(pick('技术') / 20), 1, 5),
    team: clamp(Math.round(pick('团队') / 20), 1, 5),
    market: clamp(Math.round(pick('市场') / 20), 1, 5),
    risk: pick('合规') < 75 ? ('中风险' as const) : ('低风险' as const),
    opinion: project.aiReport.suggest.slice(0, 120) || '建议在共享实验室阶段重点验证工艺放大窗口。',
  }
}

export function ExpertReviewModal({ project, open, onClose, expertId: expertIdProp, onSubmitted }: Props) {
  const toast = useToast()
  const { user } = useAuth()
  const isExpertRole = user?.role === 'expert'
  const { getProject, submitExpertReview } = useInnovationDemo()
  const live = project ? getProject(project.id) ?? project : null

  const reviewerId = useMemo(() => {
    if (!live) return null
    return resolveReviewerId(live, expertIdProp ?? DEMO_EXPERT_ZHANG_ID, isExpertRole)
  }, [live, expertIdProp, isExpertRole])

  const slot = useMemo(() => live?.experts.find((e) => e.expertId === reviewerId), [live, reviewerId])

  const evalForm = useMemo(
    () => (live ? resolveEvalFormForProject(live.entityTypeLabel) : null),
    [live?.entityTypeLabel],
  )

  const [tech, setTech] = useState(4)
  const [team, setTeam] = useState(4)
  const [market, setMarket] = useState(3)
  const [risk, setRisk] = useState<'低风险' | '中风险' | '高风险'>('低风险')
  const [opinion, setOpinion] = useState('')
  const [previewFile, setPreviewFile] = useState<SjAttachment | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !live) return
    const seed = starsFromAi(live)
    if (slot?.state === 'done' && slot.opinion) {
      setTech(slot.dimScores ? clamp(Math.round((slot.dimScores.tech ?? 80) / 20), 1, 5) : seed.tech)
      setTeam(slot.dimScores ? clamp(Math.round((slot.dimScores.team ?? 80) / 20), 1, 5) : seed.team)
      setMarket(slot.dimScores ? clamp(Math.round((slot.dimScores.market ?? 80) / 20), 1, 5) : seed.market)
      setOpinion(slot.opinion)
    } else {
      setTech(seed.tech)
      setTeam(seed.team)
      setMarket(seed.market)
      setRisk(seed.risk)
      setOpinion(seed.opinion)
    }
    setPreviewFile(null)
  }, [open, live?.id, slot?.expertId, slot?.state])

  const expertName = slot?.name ?? '专家'
  const canSubmit = Boolean(slot && reviewerId && slot.state !== 'done')
  const readOnly = slot?.state === 'done'

  const dimHints = useMemo(() => {
    if (!evalForm) return { tech: '', team: '', market: '' }
    const techDim = findFormDimension(evalForm, '技术')
    const teamDim = findFormDimension(evalForm, '团队')
    const marketDim = findFormDimension(evalForm, '市场')
    return {
      tech: techDim ? dimensionScoringGuide(techDim) : '',
      team: teamDim ? dimensionScoringGuide(teamDim) : '',
      market: marketDim ? dimensionScoringGuide(marketDim) : '',
    }
  }, [evalForm])

  function applyAiPrefill() {
    if (!live) return
    if (!live.aiReport) {
      toast.show('该项目暂无 AI 评估报告可参考', 'warning')
      return
    }
    const seed = starsFromAi(live)
    setTech(seed.tech)
    setTeam(seed.team)
    setMarket(seed.market)
    setRisk(seed.risk)
    setOpinion(seed.opinion)
    toast.show('已参考 AI 评估结果预填（可继续修改，不强制采纳）', 'success')
  }

  function saveDraft() {
    if (!live || !reviewerId) return
    const score = Math.round(((tech + team + market) / 3) * 20)
    submitExpertReview(
      live.id,
      reviewerId,
      { score, opinion, techStars: tech, teamStars: team, marketStars: market, complianceRisk: risk },
      'draft',
    )
    toast.show('已暂存草稿', 'info')
  }

  function submit() {
    if (!live || !reviewerId) return
    const score = Math.round(((tech + team + market) / 3) * 20)
    setSubmitting(true)
    submitExpertReview(
      live.id,
      reviewerId,
      { score, opinion, techStars: tech, teamStars: team, marketStars: market, complianceRisk: risk },
      'submit',
    )
    setSubmitting(false)
    toast.show('评审已提交；全员完成后将生成运营待决策任务', 'success')
    onSubmitted?.()
    onClose()
  }

  return (
    <>
      <Modal
        open={open && live != null}
        title={live ? `项目评审 - ${live.name}（${expertName}）` : ''}
        onClose={onClose}
        closeOnOverlayClick={false}
        panelClassName={OPS_MODAL_PANEL}
        fillHeight
        footer={
          live ? (
            <>
              <Link to={`/innovation/project/${live.id}`} className="me-auto text-[12px] font-semibold text-primary hover:underline" target="_blank" rel="noreferrer">
                项目详情 ↗
              </Link>
              <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={saveDraft} disabled={submitting || !reviewerId || readOnly}>
                暂存
              </button>
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
                onClick={submit}
                disabled={!canSubmit || submitting}
              >
                {submitting ? '提交中…' : '提交评审'}
              </button>
            </>
          ) : null
        }
      >
        {live && !reviewerId ? (
          <p className="text-[13px] text-muted">该项目尚未分配专家，无法在此提交评审。</p>
        ) : null}
        {live && slot ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto text-[13px]">
            {readOnly ? (
              <p className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-[12px] text-muted">该专家已完成评审，表单为只读回顾；其他专家待提交时仍可在任务中心催办。</p>
            ) : null}
            <ModalSection title="项目资料">
              <div className="flex flex-wrap gap-2">
                {live.attachments.map((a) => (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => setPreviewFile(a)}
                    className="rounded-md border border-divider bg-page px-3 py-1.5 text-[12px] font-semibold text-primary hover:border-primary hover:underline"
                  >
                    {a.name}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[12px] text-muted">点击文件名在线预览</p>
            </ModalSection>

            {evalForm ? <EvaluationFormCriteriaPanel form={evalForm} /> : null}

            <ModalSection title="评分维度（1-5 分）">
              <p className="mb-3 text-[12px] text-muted">
                请在评价表规定维度内打分；「综合意见」可自由阐述个人观点，不受维度限制。
                {live.aiReport ? ' 可点击下方按钮参考 AI 同维度评分（可修改）。' : ''}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <StarRow label="技术创新性" hint={dimHints.tech} val={tech} set={setTech} disabled={readOnly} />
                <StarRow label="团队能力" hint={dimHints.team} val={team} set={setTeam} disabled={readOnly} />
                <StarRow label="市场潜力" hint={dimHints.market} val={market} set={setMarket} disabled={readOnly} />
                <label className="flex flex-col gap-2 text-muted">
                  <span className="flex items-center gap-1.5">
                    合规风险
                    <DimensionTip title={COMPLIANCE_RISK_GUIDE} />
                  </span>
                  <select
                    value={risk}
                    disabled={readOnly}
                    onChange={(e) => setRisk(e.target.value as typeof risk)}
                    className="rounded-md border border-divider bg-page px-3 py-2 disabled:opacity-60"
                  >
                    <option value="低风险">低风险</option>
                    <option value="中风险">中风险</option>
                    <option value="高风险">高风险</option>
                  </select>
                </label>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={applyAiPrefill}
                  disabled={readOnly || !live.aiReport}
                  className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  title={live.aiReport ? '将 AI 各维度百分制换算为 1-5 分预填' : '该项目暂无 AI 报告'}
                >
                  ✨ 参考 AI 评估结果（预填）
                </button>
              </div>
            </ModalSection>

            <label className="block font-semibold text-foreground">
              综合意见
              <span className="ml-2 text-[12px] font-normal text-muted">（可自由补充，不受评价表维度限制）</span>
              <textarea
                value={opinion}
                disabled={readOnly}
                onChange={(e) => setOpinion(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-md border border-divider bg-page px-3 py-2 font-normal text-foreground disabled:opacity-60"
              />
            </label>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={previewFile != null}
        title={`预览 · ${previewFile?.name ?? ''}`}
        onClose={() => setPreviewFile(null)}
        panelClassName="max-w-[640px] w-[90vw]"
      >
        {previewFile ? (
          <div className="text-[13px]">
            <p className="font-medium">{previewFile.name}</p>
            <p className="mt-2 text-muted">{fileKindFromName(previewFile.name) === 'pdf' ? 'PDF' : '文件'}在线预览（演示占位）</p>
          </div>
        ) : null}
      </Modal>
    </>
  )
}

function DimensionTip({ title }: { title: string }) {
  return (
    <button
      type="button"
      className="inline-flex size-5 items-center justify-center rounded-full border border-divider bg-surface text-[11px] font-bold text-primary hover:bg-primary/10"
      title={title}
      aria-label="查看评分标准"
    >
      ℹ️
    </button>
  )
}

function starGlyphs(n: number) {
  return Array.from({ length: 5 }, (_, i) => (i < n ? '★' : '☆')).join('')
}

function StarRow({
  label,
  hint,
  val,
  set,
  disabled,
}: {
  label: string
  hint?: string
  val: number
  set: (n: number) => void
  disabled?: boolean
}) {
  return (
    <label className="flex flex-col gap-2 text-muted">
      <span className="flex items-center gap-1.5 text-foreground">
        {label}
        {hint ? <DimensionTip title={hint} /> : null}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={1}
          max={5}
          value={val}
          disabled={disabled}
          onChange={(e) => set(Number(e.target.value))}
          className="flex-1 disabled:opacity-60"
        />
        <span className="w-[4.5rem] shrink-0 text-end text-[12px] text-amber-600" aria-hidden>
          {starGlyphs(val)}
        </span>
        <span className="w-10 shrink-0 tabular-nums text-foreground">{val}/5</span>
      </div>
    </label>
  )
}
