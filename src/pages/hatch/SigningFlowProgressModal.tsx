import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { FlowProgressSteps } from '../../components/flow/FlowProgressSteps'
import { StatusPill } from '../../components/ui/StatusPill'
import { hatchSignPillVariant } from '../../utils/listStatusVariants'
import { cn } from '../../utils/cn'
import type { SigningContract } from './hatchTypes'
import {
  buildSigningFlowEvents,
  daysUntilEnd,
  defaultSigningSelectedKey,
  deriveSigningFlowSteps,
  eventForStep,
  type SigningFlowEvent,
  type SigningFlowStepKey,
} from './signingFlowModel'

type Props = {
  contract: SigningContract | null
  open: boolean
  onClose: () => void
}

export function SigningFlowProgressModal({ contract, open, onClose }: Props) {
  const steps = useMemo(() => (contract ? deriveSigningFlowSteps(contract) : []), [contract])
  const events = useMemo(() => (contract ? buildSigningFlowEvents(contract) : []), [contract])

  const [selectedKey, setSelectedKey] = useState<SigningFlowStepKey>('pending_sign')
  const [historyOpen, setHistoryOpen] = useState(true)

  useEffect(() => {
    if (!open || !contract) return
    setSelectedKey(defaultSigningSelectedKey(steps))
    setHistoryOpen(true)
  }, [open, contract?.id, steps])

  const selectedEvent = useMemo(
    () => eventForStep(events, selectedKey) ?? events[events.length - 1],
    [events, selectedKey],
  )

  const remainDays = contract ? daysUntilEnd(contract.termEnd ?? contract.contractEnd) : null

  return (
    <Modal
      open={open && contract != null}
      title={contract ? `流程进度 - ${contract.projectName}` : ''}
      onClose={onClose}
      closeOnOverlayClick={false}
      panelClassName="max-w-[700px] w-[90vw]"
      fillHeight
      footer={
        <button
          type="button"
          className="rounded-md bg-primary px-5 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
          onClick={onClose}
        >
          关闭
        </button>
      }
    >
      {contract ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto text-[13px]">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-divider bg-page/60 px-3 py-2.5">
            <span className="text-muted">当前合同状态</span>
            <StatusPill variant={hatchSignPillVariant(contract.signStatus)}>{contract.signStatus}</StatusPill>
            <span className="text-divider">|</span>
            <span>
              <span className="text-muted">合同到期：</span>
              <span className="font-semibold text-foreground">{contract.termEnd ?? contract.contractEnd ?? '—'}</span>
              {remainDays != null && contract.signStatus !== '已终止' ? (
                <span className={cn('ms-2 text-[12px]', remainDays <= 30 ? 'font-semibold text-amber-700' : 'text-muted')}>
                  （剩余 {remainDays} 天）
                </span>
              ) : null}
            </span>
          </div>

          <FlowProgressSteps steps={steps} selectedKey={selectedKey} onSelectKey={setSelectedKey} freeNavigate>
            <NodeDetailPanel event={selectedEvent} stepLabel={steps.find((s) => s.key === selectedKey)?.label} />
          </FlowProgressSteps>

          <div className="rounded-lg border border-divider bg-surface">
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[12px] font-semibold text-foreground"
              onClick={() => setHistoryOpen((v) => !v)}
              aria-expanded={historyOpen}
            >
              历史节点
              <span className="text-muted">{historyOpen ? '收起' : '展开'}</span>
            </button>
            {historyOpen ? (
              <ul className="space-y-2 border-t border-divider px-3 py-2.5 text-[12px] text-muted">
                {events.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className={cn(
                        'w-full rounded-md px-2 py-1.5 text-left hover:bg-page',
                        selectedKey === e.stepKey && 'bg-primary/8 ring-1 ring-primary/20',
                      )}
                      onClick={() => setSelectedKey(e.stepKey)}
                    >
                      <span className="font-semibold text-foreground">{e.nodeLabel}</span>
                      <span className="mx-1">·</span>
                      {e.completedAt}
                      <span className="mx-1">·</span>
                      处理人：{e.operator}
                      {e.opinion ? <span className="mt-0.5 block text-[11px]">{e.opinion}</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

function NodeDetailPanel({ event, stepLabel }: { event?: SigningFlowEvent; stepLabel?: string }) {
  if (!event) {
    return <p className="text-[13px] text-muted">该节点暂无流转记录。</p>
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">节点详情</p>
        <p className="mt-1 text-[15px] font-bold text-foreground">节点：{stepLabel ?? event.nodeLabel}</p>
      </div>
      <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
        <div>
          <dt className="text-muted">状态</dt>
          <dd className="font-semibold text-foreground">{event.status}</dd>
        </div>
        <div>
          <dt className="text-muted">完成时间</dt>
          <dd className="font-semibold tabular-nums text-foreground">{event.completedAt}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted">处理人</dt>
          <dd className="font-semibold text-foreground">{event.operator}</dd>
        </div>
      </dl>
      {event.opinion ? (
        <p className="rounded-lg border border-divider bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground">
          <span className="font-semibold text-muted">意见：</span>
          {event.opinion}
        </p>
      ) : null}
    </div>
  )
}
