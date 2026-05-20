import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Modal } from '../../components/Modal'
import { RadarChart } from '../../components/RadarChart'
import { StatusPill } from '../../components/ui/StatusPill'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import type { ExpertDimScores, SjProject, SjStage } from './innovationTypes'
import { applicantStatusFromStage, applicantStatusTone, DEMO_EXPERT_ZHANG_ID } from './innovationTypes'
import { useInnovationDemo } from './InnovationDemoContext'
import { InnovationProgressSteps } from './InnovationProgressSteps'
import { detailTabToFlowKey, deriveFlowSteps, flowStepKeyToDetailTab } from './innovationProgressModel'
import type { ProjectDetailTab } from './innovationProgressModel'
import { poolStagePillVariant, poolStatusLabel } from './innovationPoolLabels'

const TABS: { key: ProjectDetailTab; label: string }[] = [
  { key: 'basic', label: '基础信息' },
  { key: 'files', label: '资料附件' },
  { key: 'ai', label: 'AI 评估报告' },
  { key: 'experts', label: '专家评审' },
  { key: 'decision', label: '决策记录' },
]

function OpsActionLinks({ id, stage }: { id: string; stage: SjStage }) {
  const base = `/innovation/ops`
  const items: { to: string; label: string; show: boolean; primary?: boolean }[] = [
    { label: '去审核', to: `${base}/review/${id}`, show: stage === 'pending_material_review' || stage === 'returned_supplement', primary: true },
    { label: '触发 AI', to: `${base}/ai/${id}`, show: stage === 'pending_ai', primary: true },
    { label: '分配专家', to: `${base}/assign/${id}`, show: stage === 'pending_expert_assign', primary: true },
    { label: '去决策', to: `${base}/decision/${id}`, show: stage === 'pending_decision', primary: true },
  ]
  return (
    <>
      {items
        .filter((x) => x.show)
        .map((x) => (
          <Link key={x.to} to={x.to} className={cn('rounded-md px-3 py-2 text-[13px] font-semibold', x.primary ? 'bg-primary text-white hover:bg-primary-hover' : 'border border-divider hover:text-primary')}>
            {x.label}
          </Link>
        ))}
    </>
  )
}

function decisionResultLabel(choice: SjProject['decisionChoice'] | undefined) {
  switch (choice) {
    case 'physical':
      return '实体入孵'
    case 'virtual':
      return '虚拟入孵'
    case 'observe':
      return '观察培育'
    case 'reject':
      return '暂不通过'
    default:
      return '—'
  }
}

function dimPick(ai: NonNullable<SjProject['aiReport']>, needle: string) {
  return ai.dims.find((d) => d.key.includes(needle))?.value ?? 80
}

function ExpertArchiveReviewForm({ project }: { project: SjProject }) {
  const toast = useToast()
  const { submitExpertReview } = useInnovationDemo()
  const slot = project.experts.find((e) => e.expertId === DEMO_EXPERT_ZHANG_ID)
  const ai = project.aiReport
  const initDims: ExpertDimScores = ai
    ? {
        industry: dimPick(ai, '产业'),
        tech: dimPick(ai, '技术'),
        team: dimPick(ai, '团队'),
        market: dimPick(ai, '市场'),
        compliance: dimPick(ai, '合规'),
      }
    : { industry: 85, tech: 85, team: 82, market: 78, compliance: 84 }
  const [dims, setDims] = useState<ExpertDimScores>(initDims)
  const [opinion, setOpinion] = useState('技术路线清晰，建议在共享实验平台阶段验证关键工艺参数。')

  if (!slot || slot.state === 'done') return null

  function applyAi() {
    if (!ai) {
      toast.show('暂无 AI 评估可参考', 'warning')
      return
    }
    setDims({
      industry: dimPick(ai, '产业'),
      tech: dimPick(ai, '技术'),
      team: dimPick(ai, '团队'),
      market: dimPick(ai, '市场'),
      compliance: dimPick(ai, '合规'),
    })
    setOpinion(ai.suggest.slice(0, 160))
    toast.show('已参考 AI 评估结果预填', 'success')
  }

  const scoreAvg = Math.round((dims.industry + dims.tech + dims.team + dims.market + dims.compliance) / 5)

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[15px] font-bold text-foreground">评审任务 · {project.name}</h3>
        <p className="mt-1 text-[12px] text-muted">指派专家：{slot.name}</p>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-foreground">项目资料</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {project.attachments.map((a) => (
            <button
              key={a.name}
              type="button"
              className="rounded-md border border-divider bg-page px-3 py-1.5 text-[12px] hover:border-primary hover:text-primary"
              onClick={() => toast.show(`在线预览「${a.name}」（演示）`, 'info')}
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-divider bg-page/40 p-4">
        <p className="text-[13px] font-bold text-foreground">评分表（0–100）</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(
            [
              ['industry', '产业匹配度'],
              ['tech', '技术创新性'],
              ['team', '团队能力'],
              ['market', '市场潜力'],
              ['compliance', '合规风险'],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="block text-[12px] text-muted">
              {label}
              <input
                type="number"
                min={0}
                max={100}
                className="mt-1 w-full rounded-md border border-divider px-3 py-2 text-[13px] font-semibold tabular-nums text-foreground"
                value={dims[k]}
                onChange={(e) => setDims((d) => ({ ...d, [k]: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
              />
            </label>
          ))}
        </div>
        <label className="mt-4 block text-[12px] text-muted">
          综合意见
          <textarea value={opinion} onChange={(e) => setOpinion(e.target.value)} rows={4} className="mt-1 w-full rounded-md border border-divider px-3 py-2 text-[13px] text-foreground" />
        </label>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px] font-semibold" onClick={applyAi}>
            参考 AI 评估结果
          </button>
          <button
            type="button"
            className="rounded-md border border-divider px-4 py-2 text-[13px] font-semibold"
            onClick={() => {
              submitExpertReview(
                project.id,
                DEMO_EXPERT_ZHANG_ID,
                {
                  score: scoreAvg,
                  opinion,
                  techStars: Math.max(1, Math.round(dims.tech / 20)),
                  teamStars: Math.max(1, Math.round(dims.team / 20)),
                  marketStars: Math.max(1, Math.round(dims.market / 20)),
                  complianceRisk: dims.compliance < 75 ? '中风险' : '低风险',
                  dimScores: dims,
                },
                'draft',
              )
              toast.show('已暂存', 'info')
            }}
          >
            暂存
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-5 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
            onClick={() => {
              submitExpertReview(
                project.id,
                DEMO_EXPERT_ZHANG_ID,
                {
                  score: scoreAvg,
                  opinion,
                  techStars: Math.max(1, Math.round(dims.tech / 20)),
                  teamStars: Math.max(1, Math.round(dims.team / 20)),
                  marketStars: Math.max(1, Math.round(dims.market / 20)),
                  complianceRisk: dims.compliance < 75 ? '中风险' : '低风险',
                  dimScores: dims,
                },
                'submit',
              )
              toast.show('评审已提交', 'success')
            }}
          >
            提交评审
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InnovationProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const toast = useToast()
  const { getProject, resubmitMaterials, withdrawProject, urgeExpert, runOpinionAiSummary, finalizeAiEvaluation } = useInnovationDemo()
  const p = projectId ? getProject(projectId) : undefined

  const rawTab = searchParams.get('tab')
  const activeTab: ProjectDetailTab = ['basic', 'files', 'ai', 'experts', 'decision'].includes(rawTab ?? '')
    ? (rawTab as ProjectDetailTab)
    : 'basic'

  function setTab(t: ProjectDetailTab) {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        if (t === 'basic') n.delete('tab')
        else n.set('tab', t)
        return n
      },
      { replace: true },
    )
  }

  const flowSteps = useMemo(() => {
    if (!p) return []
    return deriveFlowSteps(p)
  }, [p])

  const selectedFlowKey = useMemo(() => (p ? detailTabToFlowKey(activeTab, p.stage) : 'register'), [p, activeTab])

  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [supplementOpen, setSupplementOpen] = useState(false)

  const applicantBadge = useMemo(() => (p ? applicantStatusTone(applicantStatusFromStage(p)) : null), [p])

  if (!user) return <Navigate to="/login" replace />
  if (!p) {
    return (
      <div className="rounded-[var(--radius-panel)] border border-divider bg-surface p-8 text-[14px] text-muted">
        未找到该项目。
        <Link to="/innovation/ops/pool" className="ms-3 text-primary">
          返回
        </Link>
      </div>
    )
  }

  const proj = p

  const isApplicantPerspective = Boolean(user) && proj.applicantOwned
  const isOps = Boolean(user)
  const isExpertCtx = Boolean(user)

  function supplement() {
    resubmitMaterials(proj.id)
    toast.show('已重新提交 · 进度回到资料审核队列', 'success')
  }

  const poolLabel = poolStatusLabel(proj)

  const listBackHref = '/innovation/ops/workbench'

  const showExpertInlineForm =
    isExpertCtx && proj.stage === 'expert_reviewing' && proj.experts.some((e) => e.expertId === DEMO_EXPERT_ZHANG_ID && e.state !== 'done')

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-1 text-[12px] text-muted">
        <Link to="/innovation" className="hover:text-primary">
          科创策源
        </Link>
        <span aria-hidden>/</span>
        <Link to="/innovation/ops/workbench" className="hover:text-primary">
          任务中心
        </Link>
        <span aria-hidden>·</span>
        <Link to="/innovation/ops/pool" className="hover:text-primary">
          候选项目池
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-foreground">{proj.name}</span>
      </nav>
      {proj.returnReason ? (
        <div className="rounded-[var(--radius-panel)] border border-danger/35 bg-danger/10 px-4 py-3 text-[13px] text-danger shadow-sm">
          <span className="font-bold">退回原因：</span>
          {proj.returnReason}
        </div>
      ) : null}

      <header className="flex flex-wrap items-start justify-between gap-4 rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[18px] font-bold text-foreground">{proj.name}</h2>
            <StatusPill variant={poolStagePillVariant(proj)}>{poolLabel}</StatusPill>
            {applicantBadge && isApplicantPerspective ? (
              <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-bold', applicantBadge.className)}>{applicantBadge.label}</span>
            ) : null}
          </div>
          <p className="mt-2 text-[13px] text-muted">
            当前节点：<span className="font-semibold text-foreground">{proj.currentNodePublic}</span>
            <span className="mx-2 text-divider">|</span>
            赛道：{proj.track}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={listBackHref} className="rounded-md border border-divider px-3 py-2 text-[13px] font-semibold hover:border-primary hover:text-primary">
            返回任务中心
          </Link>
          {isApplicantPerspective ? (
            <>
              {proj.stage === 'returned_supplement' ? (
                <button
                  type="button"
                  onClick={() => void supplement()}
                  className="rounded-md border border-divider px-3 py-2 text-[13px]"
                >
                  一键演示：已补充
                </button>
              ) : null}
              {['pending_material_review', 'pending_ai', 'returned_supplement'].includes(proj.stage) ? (
                <button type="button" onClick={() => setWithdrawOpen(true)} className="rounded-md border border-divider px-3 py-2 text-[13px]">
                  撤回申请
                </button>
              ) : null}
            </>
          ) : null}
          {isOps ? (
            <div className="flex flex-wrap gap-2">
              <OpsActionLinks id={proj.id} stage={proj.stage} />
              <Link to={`/innovation/ops/ai/${proj.id}`} className="rounded-md border border-primary/35 bg-primary-light/40 px-3 py-2 text-[13px] font-semibold text-primary">
                ✨ AI 智能评估
              </Link>
            </div>
          ) : null}
          {isExpertCtx ? (
            <Link className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-white" to={`/innovation/expert/review/${proj.id}`}>
              跳转我的评分表
            </Link>
          ) : null}
        </div>
      </header>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider pb-4">
          <h3 className="text-[14px] font-bold text-foreground">流程进度</h3>
          <p className="max-w-md text-[12px] text-muted">
            {isApplicantPerspective ? '注册提交 → 资料审核 → AI 评估 → 专家评审 → 入孵决策 → 转入入孵' : null}
            {isOps ? '单击节点查看摘要；下方 Tab 查看各维度详情。' : null}
            {isExpertCtx ? '请在「专家评审」Tab 或上方入口完成打分。' : null}
          </p>
        </div>
        <div className="mt-5">
          <InnovationProgressSteps
            project={proj}
            role={user.role}
            steps={flowSteps}
            selectedKey={selectedFlowKey}
            freeNavigate
            onSelectKey={(k) => setTab(flowStepKeyToDetailTab(k))}
          />
        </div>
      </section>

      <div className="rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
        <div className="flex flex-wrap gap-1 border-b border-divider bg-page/80 px-2 pt-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-t-md px-4 py-2.5 text-[13px] font-semibold transition-colors',
                activeTab === t.key ? 'bg-surface text-primary ring-1 ring-divider' : 'text-muted hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'basic' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[15px] font-bold text-foreground">基础信息</h3>
                {isOps ? (
                  <button
                    type="button"
                    className="text-[13px] font-semibold text-primary hover:underline"
                    onClick={() => toast.show('运营编辑（演示）：非关键字段已解锁；主体类型不可改', 'info')}
                  >
                    编辑基础信息
                  </button>
                ) : null}
              </div>
              <dl className="grid gap-x-6 gap-y-0 text-[13px] sm:grid-cols-2">
                {[
                  ['项目名称', proj.name],
                  ['主体类型', proj.entityTypeLabel],
                  ['主体全称', proj.orgFullName],
                  ['统一社会信用代码', proj.creditCode],
                  ['成立时间', proj.establishedAt ?? '—'],
                  ['注册地址', proj.registerAddress ?? '—'],
                  ['联系人', proj.contact],
                  ['联系电话', proj.phone],
                  ['电子邮箱', proj.email],
                  ['项目赛道', proj.track],
                  ['前沿技术', proj.frontierTech === true ? '是' : proj.frontierTech === false ? '否' : '—'],
                  ['项目阶段', proj.phase],
                  ['入孵意向', proj.intentLabel],
                  ['当前状态', poolLabel],
                  ['注册时间', proj.submittedAt],
                  ['最后修改', proj.lastModifiedAt ?? '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-divider py-2.5">
                    <dt className="shrink-0 text-muted">{k}</dt>
                    <dd className="min-w-0 text-end font-medium text-foreground">{v}</dd>
                  </div>
                ))}
                {proj.subsidiaryUnit ? (
                  <div className="flex justify-between gap-3 border-b border-divider py-2.5 sm:col-span-2">
                    <dt className="text-muted">院系 / 科室</dt>
                    <dd className="text-end text-foreground">{proj.subsidiaryUnit}</dd>
                  </div>
                ) : null}
                {proj.legalRepresentative ? (
                  <div className="flex justify-between gap-3 border-b border-divider py-2.5 sm:col-span-2">
                    <dt className="text-muted">法定代表人</dt>
                    <dd className="text-end text-foreground">{proj.legalRepresentative}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          {activeTab === 'files' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[15px] font-bold text-foreground">资料附件</h3>
                {isOps || (isApplicantPerspective && proj.stage === 'returned_supplement') ? (
                  <button type="button" className="text-[13px] font-semibold text-primary hover:underline" onClick={() => setSupplementOpen(true)}>
                    补充资料
                  </button>
                ) : null}
              </div>
              <div className="overflow-x-auto rounded-lg border border-divider">
                <table className="min-w-[720px] w-full text-[13px]">
                  <thead className="bg-page text-[12px] font-bold text-muted">
                    <tr>
                      <th className="px-4 py-2 text-start">分类</th>
                      <th className="px-4 py-2 text-start">文件名</th>
                      <th className="px-4 py-2 text-start">大小</th>
                      <th className="px-4 py-2 text-start">上传时间</th>
                      <th className="px-4 py-2 text-end">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {proj.attachments.map((a) => (
                      <tr key={a.name}>
                        <td className="px-4 py-2 text-muted">{a.category ?? '项目资料'}</td>
                        <td className="px-4 py-2 font-medium">{a.name}</td>
                        <td className="px-4 py-2 text-muted tabular-nums">{a.sizeLabel ?? '—'}</td>
                        <td className="px-4 py-2 text-muted tabular-nums">{a.uploadedAt ?? proj.submittedAt}</td>
                        <td className="px-4 py-2 text-end">
                          <button
                            type="button"
                            className="me-2 font-semibold text-primary hover:underline"
                            onClick={() => toast.show(`预览 ${a.name}（演示）`, 'info')}
                          >
                            预览
                          </button>
                          {!isExpertCtx ? (
                            <button
                              type="button"
                              className="me-2 font-semibold text-primary hover:underline"
                              onClick={() => toast.show(`下载 ${a.name}（演示）`, 'info')}
                            >
                              下载
                            </button>
                          ) : null}
                          {isOps ? (
                            <button type="button" className="font-semibold text-danger hover:underline" onClick={() => toast.show('删除需二次确认（演示）', 'warning')}>
                              删除
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeTab === 'ai' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-bold text-foreground">AI 评估报告</h3>
                  {proj.aiReport && proj.aiEvaluatedAt ? (
                    <p className="mt-1 text-[12px] text-muted">评估时间：{proj.aiEvaluatedAt}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {proj.aiReport ? (
                    <button type="button" className="rounded-md border border-divider px-3 py-1.5 text-[13px]" onClick={() => toast.show('导出 PDF（演示）', 'info')}>
                      导出 PDF
                    </button>
                  ) : null}
                  {isOps && proj.aiReport ? (
                    <Link to={`/innovation/ops/ai/${proj.id}`} className="rounded-md border border-divider px-3 py-1.5 text-[13px] font-semibold hover:border-primary">
                      重新评估
                    </Link>
                  ) : null}
                </div>
              </div>
              {!proj.aiReport ? (
                <div className="rounded-lg border border-dashed border-divider bg-page/50 px-4 py-6 text-[13px] text-muted">
                  <p>AI 评估尚未开始或暂无报告。</p>
                  {isOps && proj.stage === 'pending_ai' ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
                        onClick={() => {
                          finalizeAiEvaluation(proj.id)
                          toast.show('已生成演示用 AI 报告（可前往工作台确认并推进流程）', 'success')
                        }}
                      >
                        触发 AI 评估
                      </button>
                      <Link to={`/innovation/ops/ai/${proj.id}`} className="rounded-md border border-divider px-4 py-2 text-[13px] font-semibold hover:border-primary">
                        打开评估控制台
                      </Link>
                    </div>
                  ) : isOps ? (
                    <p className="mt-2 text-[12px]">可在「AI 智能评估」工作台查看队列或重新发起。</p>
                  ) : null}
                </div>
              ) : (
                <>
                  <p className="text-[15px] font-semibold text-foreground">
                    综合评分：{proj.aiReport.overall} 分（{proj.aiReport.levelLabel}）
                  </p>
                  <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                    <div className="flex flex-col items-center rounded-xl border border-divider bg-page/60 p-4">
                      <RadarChart axes={proj.aiReport.dims.map((d) => ({ key: d.key, value: d.value }))} size={220} />
                    </div>
                    <div className="space-y-3 text-[13px] leading-relaxed text-muted">
                      <p className="font-bold text-foreground">各维度得分明细</p>
                      <ul className="list-inside list-disc space-y-2">
                        {proj.aiReport.dims.map((d) => (
                          <li key={d.key}>
                            <span className="font-semibold text-foreground">{d.key}</span>：{d.value} 分
                          </li>
                        ))}
                      </ul>
                      <p>
                        <span className="font-bold text-foreground">优势：</span>
                        {proj.aiReport.pros}
                      </p>
                      <p>
                        <span className="font-bold text-foreground">风险：</span>
                        {proj.aiReport.risks}
                      </p>
                      <p className="rounded-lg bg-primary/8 px-3 py-2 text-foreground ring-1 ring-primary/15">
                        <span className="font-bold">AI 结论：</span>
                        {proj.aiReport.suggest}
                      </p>
                    </div>
                  </div>
                  {isOps && proj.stage === 'pending_ai' ? (
                    <div className="flex flex-wrap gap-2 border-t border-divider pt-4">
                      <button
                        type="button"
                        className="rounded-md border border-divider px-4 py-2 text-[13px] font-semibold"
                        onClick={() => {
                          finalizeAiEvaluation(proj.id)
                          toast.show('已重新生成演示报告', 'success')
                        }}
                      >
                        重新评估
                      </button>
                      <Link
                        to={`/innovation/ops/ai/${proj.id}`}
                        className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
                      >
                        确认并进入专家评审
                      </Link>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          {activeTab === 'experts' ? (
            <div className="space-y-6">
              {showExpertInlineForm ? (
                <ExpertArchiveReviewForm key={proj.id} project={proj} />
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-foreground">专家评审</h3>
                    {isOps && proj.stage === 'pending_expert_assign' ? (
                      <Link
                        to={`/innovation/ops/assign/${proj.id}`}
                        className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover"
                      >
                        分配专家
                      </Link>
                    ) : null}
                  </div>
                  {proj.experts.length === 0 ? (
                    <p className="text-[13px] text-muted">尚未分配专家。</p>
                  ) : (
                    <>
                      {isExpertCtx && !showExpertInlineForm ? (
                        <p className="text-[13px] text-muted">您未被指派为本项目的评审专家，以下为只读进度。</p>
                      ) : null}
                      <div className="overflow-x-auto rounded-lg border border-divider">
                        <table className="min-w-[720px] w-full text-[13px]">
                          <thead className="bg-page text-[12px] font-bold text-muted">
                            <tr>
                              <th className="px-3 py-2 text-start">专家姓名</th>
                              <th className="px-3 py-2 text-start">专业领域</th>
                              <th className="px-3 py-2 text-start">状态</th>
                              <th className="px-3 py-2 text-start">评分</th>
                              <th className="px-3 py-2 text-start">提交时间</th>
                              <th className="px-3 py-2 text-end">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-divider">
                            {proj.experts.map((ex) => (
                              <tr key={ex.expertId}>
                                <td className="px-3 py-2 font-semibold">{ex.name}</td>
                                <td className="px-3 py-2 text-muted">{ex.field}</td>
                                <td className="px-3 py-2">
                                  {ex.state === 'done' ? '已提交' : ex.state === 'reviewing' ? '评审中' : '待评审'}
                                </td>
                                <td className="px-3 py-2 tabular-nums">{ex.score != null ? ex.score : '—'}</td>
                                <td className="px-3 py-2 tabular-nums text-muted">{ex.submittedAt ?? '—'}</td>
                                <td className="px-3 py-2 text-end">
                                  {ex.state === 'done' && ex.opinion ? (
                                    <button
                                      type="button"
                                      className="font-semibold text-primary hover:underline"
                                      onClick={() => toast.show(ex.opinion ?? '', 'info')}
                                    >
                                      查看意见
                                    </button>
                                  ) : null}
                                  {isOps && ex.state !== 'done' ? (
                                    <button
                                      type="button"
                                      className="ms-2 rounded bg-page px-2 py-1 text-[12px] ring-1 ring-divider hover:text-primary"
                                      onClick={() => {
                                        urgeExpert(proj.id, ex.expertId)
                                        toast.show('已发送催办（演示）', 'success')
                                      }}
                                    >
                                      催办
                                    </button>
                                  ) : null}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                  {proj.experts.some((e) => e.dimScores) ? (
                    <div>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold text-foreground">专家评审汇总</p>
                        {isOps && proj.stage === 'pending_decision' ? (
                          <div className="flex gap-2">
                            <Link to={`/innovation/ops/decision/${proj.id}`} className="text-[13px] font-bold text-primary hover:underline">
                              发起决策
                            </Link>
                            <Link to={`/innovation/ops/assign/${proj.id}`} className="text-[13px] font-semibold text-muted hover:text-primary">
                              重新分配专家
                            </Link>
                          </div>
                        ) : null}
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-divider">
                        <table className="min-w-[800px] w-full text-[13px]">
                          <thead className="bg-page text-[12px] font-bold text-muted">
                            <tr>
                              <th className="px-3 py-2 text-start">专家</th>
                              <th className="px-3 py-2 text-start">产业匹配</th>
                              <th className="px-3 py-2 text-start">技术创新</th>
                              <th className="px-3 py-2 text-start">团队能力</th>
                              <th className="px-3 py-2 text-start">市场潜力</th>
                              <th className="px-3 py-2 text-start">合规风险</th>
                              <th className="px-3 py-2 text-start">综合意见</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-divider">
                            {proj.experts.map((ex) => (
                              <tr key={ex.expertId}>
                                <td className="px-3 py-2 font-semibold">{ex.name}</td>
                                <td className="px-3 py-2 tabular-nums">{ex.dimScores?.industry ?? '—'}</td>
                                <td className="px-3 py-2 tabular-nums">{ex.dimScores?.tech ?? '—'}</td>
                                <td className="px-3 py-2 tabular-nums">{ex.dimScores?.team ?? '—'}</td>
                                <td className="px-3 py-2 tabular-nums">{ex.dimScores?.market ?? '—'}</td>
                                <td className="px-3 py-2 tabular-nums">{ex.dimScores?.compliance ?? '—'}</td>
                                <td className="max-w-[220px] px-3 py-2 text-muted">{ex.opinion ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[13px] text-muted">专家提交后将在此展示维度得分矩阵。</p>
                  )}
                  {isOps && proj.aiReport && !proj.aiReport.opinionConsensus ? (
                    <button
                      type="button"
                      className="rounded-md border border-primary/40 bg-primary/8 px-4 py-2 text-[13px] font-semibold text-primary"
                      onClick={() => {
                        runOpinionAiSummary(proj.id)
                        toast.show('✨ AI 已汇总专家意见（演示）', 'success')
                      }}
                    >
                      ✨ AI 汇总专家意见
                    </button>
                  ) : null}
                </>
              )}
                </>
              )}
            </div>
          ) : null}

          {activeTab === 'decision' ? (
            <div className="space-y-3">
              <h3 className="text-[15px] font-bold text-foreground">决策记录</h3>
              {!proj.decisionAt ? (
                <p className="text-[13px] text-muted">
                  暂无决策记录。
                  {isOps && proj.stage === 'pending_decision' ? (
                    <>
                      {' '}
                      <Link className="font-semibold text-primary hover:underline" to={`/innovation/ops/decision/${proj.id}`}>
                        进入入孵决策
                      </Link>
                    </>
                  ) : null}
                </p>
              ) : (
                <>
                  <dl className="space-y-2 rounded-lg border border-divider bg-page/50 p-4 text-[13px]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">决策时间</dt>
                      <dd className="text-end font-medium text-foreground">{proj.decisionAt}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">决策人</dt>
                      <dd className="text-end text-foreground">{proj.decisionBy ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">决策结果</dt>
                      <dd className="text-end font-semibold text-foreground">{decisionResultLabel(proj.decisionChoice)}</dd>
                    </div>
                    <div className="flex flex-col gap-1 border-t border-divider pt-2">
                      <dt className="text-muted">决策意见</dt>
                      <dd className="text-foreground">{proj.decisionComment ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-divider pt-2">
                      <dt className="text-muted">转入入孵状态</dt>
                      <dd className="text-end text-foreground">
                        {proj.hatchArchiveProjectId
                          ? `已创建档案，${proj.incubationArchiveStatus ?? '—'}`
                          : (proj.incubationArchiveStatus ?? '—')}
                      </dd>
                    </div>
                  </dl>
                  {proj.hatchArchiveProjectId ? (
                    <Link
                      to={`/hatch/archive/${proj.hatchArchiveProjectId}`}
                      className="mt-3 inline-flex rounded-md border border-primary/35 bg-primary-light/35 px-4 py-2 text-[13px] font-bold text-primary hover:bg-primary-light/55"
                    >
                      查看入孵档案
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <Modal open={supplementOpen} title="补充上传资料" onClose={() => setSupplementOpen(false)} panelClassName="max-w-lg">
        <p className="text-[13px] text-muted">选择文件（演示）：支持 jpg / png / pdf / doc / ppt，单文件 ≤ 20MB。</p>
        <label className="mt-4 block rounded-lg border border-dashed border-divider bg-page px-4 py-8 text-center text-[13px] text-muted">
          <input type="file" className="hidden" onChange={() => toast.show('文件已加入上传队列（演示）', 'success')} />
          拖拽或点击选择文件
        </label>
      </Modal>

      <Modal
        open={withdrawOpen}
        title="撤回申请确认"
        onClose={() => setWithdrawOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-md border border-divider px-3 py-2 text-[13px]" onClick={() => setWithdrawOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-danger px-3 py-2 text-[13px] font-semibold text-white hover:opacity-95"
              onClick={() => {
                withdrawProject(proj.id)
                setWithdrawOpen(false)
                toast.show('本条申请已从草稿列表移除（演示）。', 'warning')
                navigate('/innovation/ops/pool')
              }}
            >
              撤回
            </button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-muted">撤回后草案不进入下一轮；运行中流程实例不受影响（演示文案）。确认撤回？</p>
      </Modal>
    </div>
  )
}
