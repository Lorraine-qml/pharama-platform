import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState, type ReactNode } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { useContractTemplates } from '../../contexts/ContractTemplatesContext'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import { useInnovationDemo } from './InnovationDemoContext'
import { hatchIncubationTypeFromSj, resolveHatchArchiveIdForSj } from './innovationHatchBridge'

export type DecisionPostSubmit =
  | { kind: 'ok_contract'; contractId: string }
  | { kind: 'ok_no_contract' }
  | { kind: 'warn_no_template'; archiveId: string }
  | { kind: 'warn_contract_failed'; message: string; archiveId?: string }

type Props = {
  projectId: string
  embedded?: boolean
  onCancel: () => void
  onSubmitted?: () => void
  onViewProject?: (projectId: string) => void
}

export function InnovationOpsDecisionPanel({ projectId, embedded, onCancel, onSubmitted, onViewProject }: Props) {
  const navigate = useNavigate()
  const toast = useToast()
  const { getProject, runOpinionAiSummary, submitDecision } = useInnovationDemo()
  const { archives, appendSigningContract, updateArchive } = useHatchMgmt()
  const ct = useContractTemplates()
  const p = getProject(projectId)

  const [choice, setChoice] = useState<'physical' | 'virtual' | 'observe' | 'reject'>('physical')
  const [comment, setComment] = useState('????????? AI ??????????????')
  const [autoCreateContract, setAutoCreateContract] = useState(true)
  const [postSubmit, setPostSubmit] = useState<DecisionPostSubmit | null>(null)

  const archiveId = useMemo(() => (p ? resolveHatchArchiveIdForSj(p, archives) : undefined), [p, archives])

  if (!p) return <p className="text-[13px] text-muted">??????</p>
  if (p.stage !== 'pending_decision') {
    return (
      <p className="text-[13px] text-muted">
        ???????????
        <button type="button" className="ms-2 text-primary hover:underline" onClick={() => onViewProject?.(p.id)}>
          ??????
        </button>
      </p>
    )
  }

  const canAutoSign = choice === 'physical' || choice === 'virtual'

  function runSubmit() {
    const hid = archiveId
    submitDecision(p!.id, choice, comment, { hatchArchiveProjectId: hid ?? null })

    if (!canAutoSign || !autoCreateContract) {
      setPostSubmit({ kind: 'ok_no_contract' })
      return
    }

    if (!hid) {
      setPostSubmit({
        kind: 'warn_contract_failed',
        message: '??????????????????????',
      })
      return
    }

    const incType = hatchIncubationTypeFromSj(p!, choice)
    const tpls = ct.templatesForSigning(incType)
    const templateId = tpls[0]?.id
    if (!templateId) {
      setPostSubmit({ kind: 'warn_no_template', archiveId: hid })
      return
    }

    const res = appendSigningContract({
      projectId: hid,
      projectName: p!.name,
      incubationType: incType,
      signStatus: '???',
      contractEnd: null,
      rentYuanPerMonth: null,
      templateId,
      spaceNeed: p!.intentLabel,
    })

    if (!res.ok) {
      if (res.reason === 'duplicate') {
        setPostSubmit({
          kind: 'warn_contract_failed',
          message: '??????????????????????',
          archiveId: hid,
        })
        return
      }
      setPostSubmit({ kind: 'warn_contract_failed', message: '????????????????', archiveId: hid })
      return
    }

    updateArchive(hid, { status: '???', flowCurrent: 'signing' }, '?????????????')
    setPostSubmit({ kind: 'ok_contract', contractId: res.contractId })
  }

  function handleCancel() {
    if (embedded) onCancel()
    else navigate(-1)
  }

  return (
    <div className="space-y-5 text-[13px]">
      {p.aiReport ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-page/50 p-4">
          <h3 className="text-[14px] font-bold">AI ????</h3>
          <p className="mt-2 text-muted">
            ?????<span className="font-bold text-primary">{p.aiReport.overall} ?</span>?{p.aiReport.levelLabel}?
          </p>
        </section>
      ) : null}

      <section className="rounded-[var(--radius-panel)] border border-divider bg-page/50 p-4">
        <h3 className="text-[14px] font-bold">??????????</h3>
        <ul className="mt-3 space-y-2 text-muted">
          {p.experts.map((e) => (
            <li key={e.expertId}>
              ? {e.name}
              {e.score != null ? ` � ${e.score} ?` : ''}?
              <span className="text-foreground">{e.opinion ?? '??????'}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            runOpinionAiSummary(p.id)
            toast.show('??? opinion_summarizer ? ?????/??????', 'success')
          }}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-[12px] font-semibold text-white hover:bg-primary-hover"
        >
          ? AI ???opinion_summarizer?
        </button>
        {p.aiReport?.opinionConsensus ? (
          <div className="mt-4 space-y-2 rounded-lg border border-primary/25 bg-primary-light/30 px-4 py-3">
            <p>
              <span className="font-semibold">???</span>
              {p.aiReport.opinionConsensus}
            </p>
            {p.aiReport.opinionConflict ? (
              <p>
                <span className="font-semibold">???</span>
                {p.aiReport.opinionConflict}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-[12px] text-muted">????????????????</p>
        )}
      </section>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-page/50 p-4">
        <h3 className="mb-4 text-[14px] font-bold">????</h3>
        <div className="grid gap-2">
          {(
            [
              ['physical', '????'],
              ['virtual', '????'],
              ['observe', '????'],
              ['reject', '??'],
            ] as const
          ).map(([k, lab]) => (
            <label key={k} className="flex cursor-pointer items-center gap-2 rounded-lg border border-divider px-3 py-2 hover:bg-surface">
              <input type="radio" name={`dc-${projectId}`} checked={choice === k} onChange={() => setChoice(k)} />
              {lab}
            </label>
          ))}
        </div>
        <label className="mt-4 block text-muted">
          ????
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className="mt-2 w-full rounded-md border border-divider bg-surface px-3 py-2 text-foreground" />
        </label>

        <div className={cn('mt-4 rounded-lg border border-divider bg-surface/80 p-4', !canAutoSign && 'opacity-60')}>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={canAutoSign && autoCreateContract}
              disabled={!canAutoSign}
              onChange={(e) => setAutoCreateContract(e.target.checked)}
            />
            <span>
              <span className="font-semibold text-foreground">???????????????????</span>
              <span className="mt-1 block text-[12px] text-muted">????????????????????????????????????????</span>
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" className="rounded-md border border-divider px-6 py-2.5 font-semibold text-foreground hover:bg-page" onClick={handleCancel}>
          ??
        </button>
        <button type="button" className="rounded-md bg-primary px-8 py-2.5 font-semibold text-white hover:bg-primary-hover" onClick={runSubmit}>
          ????
        </button>
      </div>

      <DecisionResultModal
        open={postSubmit != null}
        state={postSubmit}
        embedded={embedded}
        onClose={() => setPostSubmit(null)}
        onDone={() => {
          setPostSubmit(null)
          onSubmitted?.()
          if (embedded) onCancel()
        }}
        onViewProject={() => {
          setPostSubmit(null)
          if (onViewProject) onViewProject(p.id)
          else if (embedded) onCancel()
          else navigate(`/innovation/project/${p.id}`)
        }}
        onGoSigning={(contractId) => {
          setPostSubmit(null)
          onSubmitted?.()
          if (embedded) onCancel()
          const q = new URLSearchParams()
          q.set('highlightContract', contractId)
          if (archiveId) q.set('projectId', archiveId)
          navigate(`/hatch/signing?${q.toString()}`)
        }}
        onManualSign={(aid) => {
          setPostSubmit(null)
          onSubmitted?.()
          if (embedded) onCancel()
          navigate(`/hatch/signing?projectId=${encodeURIComponent(aid)}`)
        }}
      />
    </div>
  )
}

function DecisionResultModal({
  open,
  state,
  embedded,
  onClose,
  onDone,
  onViewProject,
  onGoSigning,
  onManualSign,
}: {
  open: boolean
  state: DecisionPostSubmit | null
  embedded?: boolean
  onClose: () => void
  onDone: () => void
  onViewProject: () => void
  onGoSigning: (contractId: string) => void
  onManualSign: (archiveId: string) => void
}) {
  if (!open || !state) return null

  const title =
    state.kind === 'ok_contract'
      ? '? ??????????????'
      : state.kind === 'ok_no_contract'
        ? '? ?????'
        : '??????????????'

  let footer: ReactNode = null
  if (state.kind === 'ok_contract') {
    footer = (
      <>
        <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={onDone}>
          {embedded ? '??' : '?????'}
        </button>
        <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={() => onGoSigning(state.contractId)}>
          ????
        </button>
      </>
    )
  } else if (state.kind === 'ok_no_contract') {
    footer = (
      <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={onDone}>
        ??
      </button>
    )
  } else if (state.kind === 'warn_no_template') {
    footer = (
      <>
        <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={onClose}>
          ??
        </button>
        <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={() => onManualSign(state.archiveId)}>
          ??????
        </button>
      </>
    )
  } else if (state.kind === 'warn_contract_failed') {
    footer = (
      <>
        <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={onClose}>
          ??
        </button>
        {state.archiveId ? (
          <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={() => onManualSign(state.archiveId!)}>
            ??????
          </button>
        ) : (
          <Link to="/hatch/signing" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover" onClick={onClose}>
            ??????
          </Link>
        )}
      </>
    )
  }

  return (
    <Modal open={open} title={title} onClose={onClose} footer={footer}>
      {state.kind === 'ok_contract' ? (
        <p className="text-[13px] text-muted">??????????????????????????????????????</p>
      ) : null}
      {state.kind === 'ok_no_contract' ? (
        <p className="text-[13px] text-muted">?????????????/??????????????</p>
      ) : null}
      {state.kind === 'warn_no_template' ? (
        <p className="text-[13px] text-muted">??????????????????????????? ? ?????????????????</p>
      ) : null}
      {state.kind === 'warn_contract_failed' ? <p className="text-[13px] text-muted">{state.message}</p> : null}
      <p className="mt-2 text-[12px] text-muted">
        ???
        <button type="button" className="text-primary hover:underline" onClick={onViewProject}>
          ??????
        </button>
      </p>
    </Modal>
  )
}
