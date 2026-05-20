import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from '../../components/Modal'
import { RadarChart } from '../../components/RadarChart'
import { useToast } from '../../components/ToastProvider'
import { aiRecommendedExperts } from './aiEvaluationExpertRecommend'
import { useInnovationDemo } from './InnovationDemoContext'
import { buildMaterialReviewView } from './materialReviewCatalog'
import { ModalSection, OPS_MODAL_PANEL, StepIndicator } from './innovationModalShared'
import type { ExpertAssignment, SjProject } from './innovationTypes'
import { DEMO_EXPERT_ZHANG_ID, EXPERT_CATALOG_DEMO } from './innovationTypes'

type Step = 'confirm' | 'running' | 'result' | 'error'

type Props = {
  project: SjProject | null
  open: boolean
  onClose: () => void
  /** 分配专家成功后 */
  onAssigned?: () => void
}

const MRNA_REPORT: NonNullable<SjProject['aiReport']> = {
  overall: 86,
  levelLabel: '优秀',
  dims: [
    { key: '产业匹配', value: 92 },
    { key: '技术创新', value: 88 },
    { key: '团队能力', value: 85 },
    { key: '市场潜力', value: 79 },
    { key: '合规风险', value: 85 },
    { key: '资源适配', value: 82 },
  ],
  pros: '技术壁垒高，团队在 mRNA 递送与 LNP 制剂方面经验丰富。',
  risks: '合规材料不完整，建议补充伦理审查与毒理摘要。',
  suggest: '推荐实体入孵，建议分配 B 栋 3 楼共享实验室。',
}

export function AiEvaluationWizardModal({ project, open, onClose, onAssigned }: Props) {
  const toast = useToast()
  const { getProject, finalizeAiEvaluation, assignExperts, promoteAfterAiConfirm } = useInnovationDemo()

  const [step, setStep] = useState<Step>('confirm')
  const [pct, setPct] = useState(0)
  const [runMsg, setRunMsg] = useState('等待开始')
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [deadline, setDeadline] = useState('')
  const appliedRef = useRef(false)
  const live = project ? getProject(project.id) ?? project : null
  const report = live?.aiReport

  const materialView = useMemo(() => (live ? buildMaterialReviewView(live) : null), [live])
  const completenessPct = useMemo(() => {
    if (!materialView?.required.length) return 0
    const ok = materialView.required.filter((r) => r.ok).length
    return Math.round((ok / materialView.required.length) * 100)
  }, [materialView])

  const aiRows = useMemo(() => (live ? aiRecommendedExperts(live.track) : []), [live])

  const defaultDeadline = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  }, [])

  useEffect(() => {
    if (!open || !project) return
    const p = getProject(project.id) ?? project
    appliedRef.current = false
    setPct(0)
    setRunMsg('等待开始')
    setDeadline(defaultDeadline)

    if (p.aiReport) {
      setStep('result')
      initPickedFromProject(p)
    } else {
      setStep('confirm')
      setPicked({ [DEMO_EXPERT_ZHANG_ID]: true })
    }
  }, [open, project?.id, defaultDeadline, getProject])

  function initPickedFromProject(p: SjProject) {
    if (p.experts.length > 0) {
      const map: Record<string, boolean> = {}
      p.experts.forEach((e) => {
        map[e.expertId] = true
      })
      setPicked(map)
    } else {
      setPicked({ [DEMO_EXPERT_ZHANG_ID]: true })
    }
  }

  useEffect(() => {
    if (step !== 'running' || !live) return
    const iv = window.setInterval(() => {
      setPct((prev) => {
        const next = Math.min(prev + 10, 100)
        if (next < 35) setRunMsg('解析项目资料 · document_parser …')
        else if (next < 70) setRunMsg('多维度打分 · project_pre_score …')
        else setRunMsg('生成报告 · research_report_gen …')
        return next
      })
    }, 280)
    return () => window.clearInterval(iv)
  }, [step, live])

  useEffect(() => {
    if (step !== 'running' || !live || pct < 100) return
    if (appliedRef.current) return

    appliedRef.current = true
    window.setTimeout(() => {
      const tmpl = live.track.includes('mRNA') || live.name.includes('mRNA') ? MRNA_REPORT : undefined
      finalizeAiEvaluation(live.id, tmpl)
      setStep('result')
      toast.show('AI 评估完成', 'success')
    }, 400)
  }, [pct, step, live, finalizeAiEvaluation, toast])

  const startEval = useCallback(() => {
    appliedRef.current = false
    setStep('running')
    setPct(6)
    setRunMsg('正在连接评估服务…')
  }, [])

  const retryEval = useCallback(() => {
    appliedRef.current = false
    setStep('running')
    setPct(6)
    setRunMsg('正在重试…')
  }, [])

  function simulateEvalFail() {
    setStep('error')
    toast.show('评估失败，请重试', 'warning')
  }

  function handleClose() {
    onClose()
  }

  function openFullReport() {
    if (!live) return
    const url = `/innovation/ops/ai/${live.id}`
    window.open(url, '_blank', 'noopener,noreferrer')
    toast.show('已在新窗口打开完整 AI 报告（演示）', 'info')
  }

  function toggleExpert(id: string) {
    setPicked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function confirmAssign() {
    if (!live) return
    const ids = EXPERT_CATALOG_DEMO.filter((e) => picked[e.expertId]).map((e) => e.expertId)
    if (ids.length === 0) {
      toast.show('请至少选择一位专家', 'warning')
      return
    }
    const dl = deadline || defaultDeadline
    const rows: ExpertAssignment[] = EXPERT_CATALOG_DEMO.filter((e) => picked[e.expertId]).map((e) => {
      const rec = aiRows.find((r) => r.expertId === e.expertId)
      return {
        expertId: e.expertId,
        name: e.name,
        field: rec?.field ?? e.field,
        matchPct: rec?.matchPct,
        aiPick: e.expertId === DEMO_EXPERT_ZHANG_ID,
        state: 'pending',
        deadline: dl,
      }
    })
    if (live.stage === 'pending_ai' && live.aiReport) {
      promoteAfterAiConfirm(live.id)
    }
    assignExperts(live.id, rows)
    toast.show(`评估完成，已为 ${rows.length} 位专家创建评审任务`, 'success')
    onAssigned?.()
    handleClose()
  }

  const stepIndex = step === 'confirm' ? 1 : step === 'running' ? 2 : step === 'result' ? 3 : 2

  const title =
    step === 'confirm'
      ? `AI评估 - ${live?.name ?? ''}`
      : step === 'running'
        ? `AI评估 - ${live?.name ?? ''}`
        : step === 'result'
          ? `AI评估结果 - ${live?.name ?? ''}`
          : `AI评估 - ${live?.name ?? ''}`

  const footer =
    step === 'confirm' ? (
      <>
        <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={handleClose}>
          取消
        </button>
        <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover" onClick={startEval}>
          开始评估
        </button>
      </>
    ) : step === 'running' ? null : step === 'error' ? (
      <>
        <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={handleClose}>
          关闭
        </button>
        <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={retryEval}>
          重试
        </button>
      </>
    ) : step === 'result' ? (
      <>
        <button type="button" className="rounded-md border border-divider px-3 py-2 text-[13px]" onClick={handleClose}>
          暂不处理
        </button>
        <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover" onClick={confirmAssign}>
          确认分配
        </button>
      </>
    ) : null

  return (
    <Modal
      open={open && live != null}
      title={title}
      onClose={handleClose}
      closeOnOverlayClick={false}
      disableClose={step === 'running'}
      panelClassName={OPS_MODAL_PANEL}
      fillHeight={step === 'result'}
      footer={footer}
    >
      {step !== 'error' ? <StepIndicator steps={['确认评估', '执行评估', '结果与分配']} current={stepIndex} /> : null}

      {live && step === 'confirm' ? (
        <div className="space-y-4 text-[13px]">
          <section className="rounded-lg border border-divider bg-page/50 px-4 py-3">
            <h3 className="mb-2 font-bold text-foreground">项目摘要</h3>
            <dl className="grid gap-2 sm:grid-cols-2">
              <Item label="项目名称" value={live.name} />
              <Item label="主体类型" value={live.entityTypeLabel} />
              <Item label="赛道" value={live.track} />
              <Item label="阶段" value={live.phase} />
              <Item label="入孵意向" value={live.intentLabel} />
              <Item
                label="资料完整性"
                value={
                  materialView && materialView.missingRequired.length === 0
                    ? `${completenessPct}%（必传项已齐全）`
                    : `${completenessPct}%（缺 ${materialView?.missingRequired.length ?? 0} 项必传）`
                }
              />
            </dl>
          </section>
          <section className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-muted">
            <h3 className="mb-2 font-bold text-foreground">评估说明</h3>
            <ul className="list-inside list-disc space-y-1">
              <li>将调用大模型对项目资料进行自动解析和评分</li>
              <li>评估维度：产业匹配度、技术创新性、团队能力、市场潜力、合规风险、资源适配等</li>
              <li>评估完成后可立即分配专家进行人工评审</li>
            </ul>
          </section>
        </div>
      ) : null}

      {live && step === 'running' ? (
        <div className="space-y-4 py-4 text-[13px]">
          <p className="text-center text-[15px] font-semibold text-foreground">🤖 AI 正在分析项目资料…</p>
          <div className="h-3 w-full overflow-hidden rounded-full bg-page">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-center tabular-nums text-foreground">{Math.round(pct)}%</p>
          <p className="text-center text-[12px] text-muted">{runMsg}</p>
          <p className="text-center text-[12px] text-muted">预计剩余时间：约 {Math.max(5, Math.round((100 - pct) / 3))} 秒</p>
          <button type="button" className="mx-auto block text-[12px] text-muted underline" onClick={simulateEvalFail}>
            模拟接口失败（演示）
          </button>
        </div>
      ) : null}

      {live && step === 'error' ? (
        <div className="rounded-lg border border-danger/35 bg-danger/8 px-4 py-6 text-center text-[13px]">
          <p className="font-semibold text-danger">评估失败，请重试</p>
          <p className="mt-2 text-muted">AI 服务暂时不可用或请求超时（演示）。点击「重试」将重新发起评估。</p>
        </div>
      ) : null}

      {live && step === 'result' && report ? (
        <div className="space-y-4 text-[13px]">
          <p className="text-[15px] font-bold text-foreground">
            综合评分：<span className="text-primary">{report.overall} 分</span>
            <span className="ms-2 text-[13px] font-semibold text-muted">（{report.levelLabel}）</span>
          </p>
          <div className="rounded-lg border border-divider bg-page/40 p-4">
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
              <RadarChart axes={report.dims.map((d) => ({ key: d.key, value: d.value }))} size={200} />
              <ul className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-muted">
                {report.dims.map((d) => (
                  <li key={d.key}>
                    <span className="font-medium text-foreground">{d.key}</span> {d.value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p>
            <span className="font-semibold text-foreground">优势：</span>
            {report.pros}
          </p>
          <p>
            <span className="font-semibold text-foreground">风险：</span>
            {report.risks}
          </p>
          <p>
            <span className="font-semibold text-foreground">AI建议：</span>
            {report.suggest}
          </p>
          <button type="button" className="text-[12px] font-semibold text-primary hover:underline" onClick={openFullReport}>
            查看完整报告 ↗
          </button>

          <ModalSection title="✨ 推荐专家（基于项目技术关键词）">
            <ul className="space-y-2">
              {aiRows.map((e) => (
                <li key={e.expertId}>
                  <label className="flex cursor-pointer gap-3 rounded-lg border border-divider px-3 py-2 hover:bg-page">
                    <input type="checkbox" checked={!!picked[e.expertId]} onChange={() => toggleExpert(e.expertId)} />
                    <span className="font-semibold">{e.name}</span>
                    <span className="text-muted">
                      （{e.field}，{e.matchPct}%）
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <label className="mt-3 block text-muted">
              截止日期
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 w-full rounded-md border border-divider bg-page px-3 py-2 text-foreground"
              />
            </label>
          </ModalSection>
        </div>
      ) : null}
    </Modal>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-muted">{label}：</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  )
}
