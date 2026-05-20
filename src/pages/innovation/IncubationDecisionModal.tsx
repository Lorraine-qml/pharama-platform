import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { useContractTemplates } from '../../contexts/ContractTemplatesContext'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import { useInnovationDemo } from './InnovationDemoContext'
import { hatchIncubationTypeFromSj, resolveHatchArchiveIdForSj } from './innovationHatchBridge'
import { ModalSection, OPS_MODAL_PANEL, SummaryGrid } from './innovationModalShared'
import type { SjProject } from './innovationTypes'

type Props = {
  project: SjProject | null
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
}

export function IncubationDecisionModal({ project, open, onClose, onSubmitted }: Props) {
  const toast = useToast()
  const { getProject, runOpinionAiSummary, submitDecision } = useInnovationDemo()
  const { archives, appendSigningContract, updateArchive } = useHatchMgmt()
  const ct = useContractTemplates()
  const live = project ? getProject(project.id) ?? project : null

  const [choice, setChoice] = useState<'physical' | 'virtual' | 'observe' | 'reject'>('physical')
  const [comment, setComment] = useState('同意专家意见，建议实体入孵，尽快完成毒理整改。')
  const [autoCreateContract, setAutoCreateContract] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState(false)

  const archiveId = useMemo(() => (live ? resolveHatchArchiveIdForSj(live, archives) : undefined), [live, archives])
  const canAutoSign = choice === 'physical' || choice === 'virtual'
  const commentRequired = choice === 'reject' || choice === 'observe'

  useEffect(() => {
    if (!open || !live) return
    setChoice('physical')
    setComment('同意专家意见，建议实体入孵，尽快完成毒理整改。')
    setAutoCreateContract(true)
    setCommentError(false)
    if (!live.aiReport?.opinionConsensus && live.experts.some((e) => e.state === 'done')) {
      runOpinionAiSummary(live.id)
    }
  }, [open, live?.id, runOpinionAiSummary])

  const report = live?.aiReport

  function runSubmit() {
    if (!live) return
    if (commentRequired && !comment.trim()) {
      setCommentError(true)
      toast.show('暂不通过或观察培育时，决策意见必填', 'warning')
      return
    }
    setCommentError(false)
    setSubmitting(true)
    const hid = archiveId
    submitDecision(live.id, choice, comment, { hatchArchiveProjectId: hid ?? null })

    if (canAutoSign && autoCreateContract && hid) {
      const incType = hatchIncubationTypeFromSj(live, choice)
      const tpls = ct.templatesForSigning(incType)
      const templateId = tpls[0]?.id
      if (templateId) {
        const res = appendSigningContract({
          projectId: hid,
          projectName: live.name,
          incubationType: incType,
          signStatus: '待签署',
          contractEnd: null,
          rentYuanPerMonth: null,
          templateId,
          spaceNeed: live.intentLabel,
        })
        if (res.ok) {
          updateArchive(hid, { status: '待签约', flowCurrent: 'signing' }, '决策通过：自动创建签约待办')
          toast.show('决策已提交，并已生成入孵签约待办', 'success')
        } else {
          toast.show('决策已提交；签约记录未重复创建或参数不完整', 'success')
        }
      } else {
        toast.show('决策已提交；未找到可用签约模板', 'success')
      }
    } else {
      toast.show('决策已提交', 'success')
    }
    setSubmitting(false)
    onSubmitted?.()
    onClose()
  }

  return (
    <Modal
      open={open && live != null}
      title={live ? `入孵决策 - ${live.name}` : ''}
      onClose={onClose}
      closeOnOverlayClick={false}
      panelClassName={OPS_MODAL_PANEL}
      fillHeight
      footer={
        live ? (
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={onClose} disabled={submitting}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
              onClick={runSubmit}
              disabled={submitting}
            >
              {submitting ? '提交中…' : '提交决策'}
            </button>
          </>
        ) : null
      }
    >
      {live ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto text-[13px]">
          <ModalSection title="项目摘要">
            <SummaryGrid
              items={[
                { label: '项目', value: live.name },
                { label: '阶段', value: live.phase },
                { label: '赛道', value: live.track },
                { label: '团队规模', value: live.checklist.length ? `资料项 ${live.checklist.length} 类` : '—' },
              ]}
            />
          </ModalSection>

          {report ? (
            <ModalSection title="AI评估摘要">
              <p>
                综合评分 <span className="font-bold text-primary">{report.overall} 分</span>（{report.levelLabel}）
              </p>
            </ModalSection>
          ) : null}

          <ModalSection title="专家评审汇总（摘录）">
            <ul className="space-y-2 text-muted">
              {live.experts.map((e) => (
                <li key={e.expertId}>
                  · {e.name}
                  {e.score != null ? `：${e.score} 分` : ''}，{e.opinion ?? '（暂未反馈）'}
                </li>
              ))}
            </ul>
            {report?.opinionConsensus ? (
              <div className="mt-3 space-y-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-[12px]">
                <p>
                  <span className="font-semibold text-foreground">✨ AI汇总 · 共识：</span>
                  {report.opinionConsensus}
                </p>
                {report.opinionConflict ? (
                  <p>
                    <span className="font-semibold text-foreground">分歧：</span>
                    {report.opinionConflict}
                  </p>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                className="mt-2 text-[12px] font-semibold text-primary hover:underline"
                onClick={() => {
                  runOpinionAiSummary(live.id)
                  toast.show('已生成 AI 汇总（演示）', 'success')
                }}
              >
                ✨ 生成 AI 汇总
              </button>
            )}
          </ModalSection>

          <ModalSection title="决策选项">
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['physical', '实体入孵'],
                  ['virtual', '虚拟入孵'],
                  ['observe', '观察培育'],
                  ['reject', '暂不通过'],
                ] as const
              ).map(([k, lab]) => (
                <label key={k} className="flex cursor-pointer items-center gap-2 rounded-lg border border-divider px-3 py-2 hover:bg-page">
                  <input type="radio" name="decision-choice" checked={choice === k} onChange={() => setChoice(k)} />
                  {lab}
                </label>
              ))}
            </div>
            <label className="mt-4 block text-muted">
              决策意见
              {commentRequired ? <span className="text-danger">（必填）</span> : null}
              <textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value)
                  setCommentError(false)
                }}
                rows={3}
                className={cn(
                  'mt-1 w-full rounded-md border bg-page px-3 py-2 text-foreground',
                  commentError ? 'border-danger ring-1 ring-danger/30' : 'border-divider',
                )}
                placeholder={commentRequired ? '请说明原因…' : '选填备注'}
              />
            </label>
            <label className={cn('mt-3 flex cursor-pointer items-start gap-2', !canAutoSign && 'opacity-50')}>
              <input
                type="checkbox"
                className="mt-1"
                checked={canAutoSign && autoCreateContract}
                disabled={!canAutoSign}
                onChange={(e) => setAutoCreateContract(e.target.checked)}
              />
              <span className="text-[12px]">自动创建入孵签约记录（生成待签署任务）</span>
            </label>
          </ModalSection>
        </div>
      ) : null}
    </Modal>
  )
}
