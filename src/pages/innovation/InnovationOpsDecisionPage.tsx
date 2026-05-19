import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMemo, useState, type ReactNode } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { useContractTemplates } from '../../contexts/ContractTemplatesContext'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import { useInnovationDemo } from './InnovationDemoContext'
import { hatchIncubationTypeFromSj, resolveHatchArchiveIdForSj } from './innovationHatchBridge'

type PostSubmit =
  | { kind: 'ok_contract'; contractId: string }
  | { kind: 'ok_no_contract' }
  | { kind: 'warn_no_template'; archiveId: string }
  | { kind: 'warn_contract_failed'; message: string; archiveId?: string }

export default function InnovationOpsDecisionPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { getProject, runOpinionAiSummary, submitDecision } = useInnovationDemo()
  const { archives, appendSigningContract, updateArchive } = useHatchMgmt()
  const ct = useContractTemplates()
  const p = projectId ? getProject(projectId) : undefined

  const [choice, setChoice] = useState<'physical' | 'virtual' | 'observe' | 'reject'>('physical')
  const [comment, setComment] = useState('综合考虑专家意见及 AI 风险提示，本轮推荐实体入孵。')
  const [autoCreateContract, setAutoCreateContract] = useState(true)
  const [postSubmit, setPostSubmit] = useState<PostSubmit | null>(null)

  const archiveId = useMemo(() => (p ? resolveHatchArchiveIdForSj(p, archives) : undefined), [p, archives])

  if (!p) return <p className="text-muted">未找到项目。</p>
  if (p.stage !== 'pending_decision') {
    return (
      <p className="text-[13px] text-muted">
        当前项目不在决策节点。
        <Link to={`/innovation/project/${p.id}`} className="ms-2 text-primary">
          返回详情
        </Link>
      </p>
    )
  }

  const canAutoSign = choice === 'physical' || choice === 'virtual'

  function runSubmit() {
    if (!p) return
    const hid = archiveId
    submitDecision(p.id, choice, comment, { hatchArchiveProjectId: hid ?? null })

    if (!canAutoSign || !autoCreateContract) {
      setPostSubmit({ kind: 'ok_no_contract' })
      return
    }

    if (!hid) {
      setPostSubmit({
        kind: 'warn_contract_failed',
        message: '未匹配到入孵项目档案，无法自动创建签约记录。',
      })
      return
    }

    const incType = hatchIncubationTypeFromSj(p, choice)
    const tpls = ct.templatesForSigning(incType)
    const templateId = tpls[0]?.id
    if (!templateId) {
      setPostSubmit({ kind: 'warn_no_template', archiveId: hid })
      return
    }

    const res = appendSigningContract({
      projectId: hid,
      projectName: p.name,
      incubationType: incType,
      signStatus: '待签署',
      contractEnd: null,
      rentYuanPerMonth: null,
      templateId,
      spaceNeed: p.intentLabel,
    })

    if (!res.ok) {
      if (res.reason === 'duplicate') {
        setPostSubmit({
          kind: 'warn_contract_failed',
          message: '该项目已存在「待签署」签约记录，未重复创建。',
          archiveId: hid,
        })
        return
      }
      setPostSubmit({ kind: 'warn_contract_failed', message: '签约记录参数不完整，请手动创建。', archiveId: hid })
      return
    }

    updateArchive(hid, { status: '待签约', flowCurrent: 'signing' }, '决策通过：自动创建签约待办')
    setPostSubmit({ kind: 'ok_contract', contractId: res.contractId })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="text-[19px] font-bold">入孵决策 · {p.name}</h2>
        <Link to={`/innovation/project/${p.id}`} className="text-[13px] text-primary hover:underline">
          详情
        </Link>
      </div>

      {p.aiReport ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
          <h3 className="text-[14px] font-bold">AI 评估摘要</h3>
          <p className="mt-2 text-[13px] text-muted">
            综合评分：<span className="font-bold text-primary">{p.aiReport.overall} 分</span>（{p.aiReport.levelLabel}）
          </p>
        </section>
      ) : null}

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
        <h3 className="text-[14px] font-bold">专家评审汇总（摘录）</h3>
        <ul className="mt-3 space-y-2 text-[13px] text-muted">
          {p.experts.map((e) => (
            <li key={e.expertId}>
              • {e.name}
              {e.score != null ? ` · ${e.score} 分` : ''}，
              <span className="text-foreground">{e.opinion ?? '（暂未反馈）'}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            runOpinionAiSummary(p.id)
            toast.show('已调用 opinion_summarizer ✨ ，填充共识/分歧（演示）', 'success')
          }}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-[12px] font-semibold text-white hover:bg-primary-hover"
        >
          ✨ AI 汇总（opinion_summarizer）
        </button>
        {p.aiReport?.opinionConsensus ? (
          <div className="mt-4 space-y-2 rounded-lg border border-primary/25 bg-primary-light/30 px-4 py-3 text-[13px]">
            <p>
              <span className="font-semibold">共识：</span>
              {p.aiReport.opinionConsensus}
            </p>
            {p.aiReport.opinionConflict ? (
              <p>
                <span className="font-semibold">分歧：</span>
                {p.aiReport.opinionConflict}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-[12px] text-muted">点击上方按钮模拟生成结构化摘要。</p>
        )}
      </section>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
        <h3 className="mb-4 text-[14px] font-bold">决策选项</h3>
        <div className="grid gap-2 text-[13px]">
          {(
            [
              ['physical', '实体入孵'],
              ['virtual', '虚拟入孵'],
              ['observe', '观察培育'],
              ['reject', '拒绝'],
            ] as const
          ).map(([k, lab]) => (
            <label key={k} className="flex cursor-pointer items-center gap-2 rounded-lg border border-divider px-3 py-2 hover:bg-page">
              <input type="radio" name="dc" checked={choice === k} onChange={() => setChoice(k)} />
              {lab}
            </label>
          ))}
        </div>
        <label className="mt-4 block text-[13px] text-muted">
          决策意见
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className="mt-2 w-full rounded-md border border-divider px-3 py-2 text-[13px] text-foreground" />
        </label>

        <div
          className={cn(
            'mt-4 rounded-lg border border-divider bg-page/80 p-4',
            !canAutoSign ? 'opacity-60' : '',
          )}
        >
          <label className="flex cursor-pointer items-start gap-3 text-[13px]">
            <input
              type="checkbox"
              className="mt-1"
              checked={canAutoSign && autoCreateContract}
              disabled={!canAutoSign}
              onChange={(e) => setAutoCreateContract(e.target.checked)}
            />
            <span>
              <span className="font-semibold text-foreground">自动创建入孵签约记录（生成待签署任务）</span>
              <span className="mt-1 block text-[12px] text-muted">签约模板将根据入孵类型自动匹配启用中的模板；取消勾选适用于暂不签约或走线下流程。</span>
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" className="rounded-md border border-divider px-6 py-2.5 text-[13px] font-semibold text-foreground hover:bg-page" onClick={() => navigate(-1)}>
          取消
        </button>
        <button
          type="button"
          className="rounded-md bg-primary px-8 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover"
          onClick={runSubmit}
        >
          提交决策
        </button>
      </div>

      <ResultModal
        open={postSubmit != null}
        state={postSubmit}
        projectId={p.id}
        onClose={() => setPostSubmit(null)}
        onStay={() => {
          setPostSubmit(null)
          navigate(`/innovation/project/${p.id}`)
        }}
        onGoSigning={(contractId) => {
          setPostSubmit(null)
          const q = new URLSearchParams()
          q.set('highlightContract', contractId)
          if (archiveId) q.set('projectId', archiveId)
          navigate(`/hatch/signing?${q.toString()}`)
        }}
        onManualSign={(aid) => {
          setPostSubmit(null)
          navigate(`/hatch/signing?projectId=${encodeURIComponent(aid)}`)
        }}
      />
    </div>
  )
}

function ResultModal({
  open,
  state,
  projectId,
  onClose,
  onStay,
  onGoSigning,
  onManualSign,
}: {
  open: boolean
  state: PostSubmit | null
  projectId: string
  onClose: () => void
  onStay: () => void
  onGoSigning: (contractId: string) => void
  onManualSign: (archiveId: string) => void
}) {
  if (!open || !state) return null

  const title =
    state.kind === 'ok_contract'
      ? '✓ 决策成功，已自动创建签约待办'
      : state.kind === 'ok_no_contract'
        ? '✓ 决策已提交'
        : '决策成功，但自动创建签约失败'

  let footer: ReactNode = null
  if (state.kind === 'ok_contract') {
    footer = (
      <>
        <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={onStay}>
          留在当前页
        </button>
        <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={() => onGoSigning(state.contractId)}>
          查看签约
        </button>
      </>
    )
  } else if (state.kind === 'ok_no_contract') {
    footer = (
      <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={onStay}>
        返回项目详情
      </button>
    )
  } else if (state.kind === 'warn_no_template') {
    footer = (
      <>
        <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={onClose}>
          忽略
        </button>
        <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={() => onManualSign(state.archiveId)}>
          手动创建签约
        </button>
      </>
    )
  } else if (state.kind === 'warn_contract_failed') {
    footer = (
      <>
        <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={onClose}>
          忽略
        </button>
        {state.archiveId ? (
          <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={() => onManualSign(state.archiveId!)}>
            手动创建签约
          </button>
        ) : (
          <Link to="/hatch/signing" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover" onClick={onClose}>
            打开签约管理
          </Link>
        )}
      </>
    )
  }

  return (
    <Modal open={open} title={title} onClose={onClose} footer={footer}>
      {state.kind === 'ok_contract' ? (
        <p className="text-[13px] text-muted">已写入签约列表（待签署）。您可立即前往入孵签约管理处理，或稍后在菜单中打开。</p>
      ) : null}
      {state.kind === 'ok_no_contract' ? (
        <p className="text-[13px] text-muted">未创建签约记录（选项为观察/拒绝，或您已取消自动创建）。</p>
      ) : null}
      {state.kind === 'warn_no_template' ? (
        <p className="text-[13px] text-muted">未找到与入孵类型匹配且启用中的合同模板，请在「基础数据 → 合同模板管理」维护后手动创建签约。</p>
      ) : null}
      {state.kind === 'warn_contract_failed' ? <p className="text-[13px] text-muted">{state.message}</p> : null}
      <p className="mt-2 text-[12px] text-muted">
        项目链接：
        <Link to={`/innovation/project/${projectId}`} className="text-primary hover:underline">
          打开项目详情
        </Link>
      </p>
    </Modal>
  )
}
