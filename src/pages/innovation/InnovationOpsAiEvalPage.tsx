import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { RadarChart } from '../../components/RadarChart'
import { useToast } from '../../components/ToastProvider'
import { useInnovationDemo } from './InnovationDemoContext'

export default function InnovationOpsAiEvalPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { getProject, finalizeAiEvaluation, promoteAfterAiConfirm } = useInnovationDemo()
  const pid = projectId ?? ''
  const p = pid ? getProject(pid) : undefined
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [pct, setPct] = useState(0)
  const [msg, setMsg] = useState('等待开始')
  const appliedRef = useRef(false)

  useEffect(() => {
    if (phase !== 'running' || !p) return
    const iv = window.setInterval(() => {
      setPct((prev) => {
        const next = Math.min(prev + 12, 100)
        if (next < 34) setMsg('解析文档 · document_parser …')
        else if (next < 72) setMsg('多维度打分 · project_pre_score …')
        else setMsg('产出报告 · research_report_gen …')
        return next
      })
    }, 230)
    return () => window.clearInterval(iv)
  }, [phase, p])

  useEffect(() => {
    if (!p || phase !== 'running' || pct < 100) return
    if (appliedRef.current) return
    appliedRef.current = true
    finalizeAiEvaluation(p.id)
    setPhase('done')
    toast.show('三步 Skill 链路执行完毕（演示）', 'success')
  }, [pct, phase, finalizeAiEvaluation, p, toast])

  const start = useCallback(() => {
    appliedRef.current = false
    setPhase('running')
    setPct(8)
    setMsg('解析文档 …')
    toast.show('开始调用 document_parser → project_pre_score → research_report_gen', 'info')
  }, [toast])

  if (!p) return <p className="text-muted">未找到项目。</p>

  const runningPanel = phase === 'running'
  const canStartFresh = p.stage === 'pending_ai' && !p.aiReport && phase === 'idle'
  const readonlyPast = Boolean(p.stage !== 'pending_ai' && p.aiReport)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted">
            <Link to="/innovation/ops/workbench" className="text-primary hover:underline">
              任务中心
            </Link>
            {' / '}
            <span className="text-foreground">{p.name}</span>
          </p>
          <p className="mt-1 text-[12px] text-muted">{readonlyPast ? '该项目已完成本环节 · 以下为历史 AI 快照' : null}</p>
        </div>
        <Link to={`/innovation/project/${p.id}`} className="text-[13px] text-primary hover:underline">
          详情页
        </Link>
      </div>

      {canStartFresh ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-sm">
          <h2 className="text-[17px] font-bold">智能评估控制台</h2>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">点击下方按钮将串联 document_parser · project_pre_score · research_report_gen（演示占位）。</p>
          <button type="button" onClick={start} className="mt-6 rounded-md bg-primary px-5 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-primary-hover">
            ✨ 开始智能评估（串联 Skills）
          </button>
        </section>
      ) : null}

      {runningPanel ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-sm">
          <h2 className="text-[17px] font-bold">正在智能评估…</h2>
          <div className="mt-6 h-3 w-full rounded-full bg-page">
            <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] text-muted">
            <span className="tabular-nums">{Math.round(pct)}%</span>
            <span>{msg}</span>
          </div>
        </section>
      ) : null}

      {p.aiReport ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-sm">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-divider pb-4">
            <div>
              <h2 className="text-[18px] font-bold">AI 评估报告 · {p.name}</h2>
              <p className="mt-2 text-[13px] text-muted">
                综合评分：{p.aiReport.overall} 分（{p.aiReport.levelLabel}）
              </p>
            </div>
            <button type="button" onClick={() => toast.show('导出 PDF（演示）', 'info')} className="rounded-md border border-divider px-3 py-2 text-[13px]">
              导出 PDF
            </button>
          </header>
          <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-start">
            <RadarChart axes={p.aiReport.dims.map((d) => ({ key: d.key, value: d.value }))} size={220} />
            <div className="space-y-3 text-[13px] leading-relaxed text-muted">
              <p>
                <span className="font-semibold text-foreground">优势：</span>
                {p.aiReport.pros}
              </p>
              <p>
                <span className="font-semibold text-foreground">风险：</span>
                {p.aiReport.risks}
              </p>
              <p>
                <span className="font-semibold text-foreground">建议：</span>
                {p.aiReport.suggest}
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-divider pt-5">
            <button type="button" onClick={() => toast.show('报告草稿已存档（演示）', 'info')} className="rounded-md border border-divider px-4 py-2 text-[13px]">
              仅保存草稿
            </button>
            <button
              type="button"
              disabled={p.stage !== 'pending_ai'}
              className="rounded-md bg-primary px-5 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
              onClick={() => {
                promoteAfterAiConfirm(p.id)
                toast.show('已进入「待专家分配」', 'success')
                navigate(`/innovation/ops/assign/${p.id}`)
              }}
            >
              确认并进入专家评审
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
