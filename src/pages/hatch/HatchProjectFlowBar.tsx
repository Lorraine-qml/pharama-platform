import { useMemo } from 'react'
import { Modal } from '../../components/Modal'
import { cn } from '../../utils/cn'
import type { FlowNodeKey, HatchIncubationType } from './hatchTypes'

const PHYSICAL_KEYS: FlowNodeKey[] = ['decision', 'signing', 'archive', 'space', 'operate', 'graduate']
const VIRTUAL_KEYS: FlowNodeKey[] = ['decision', 'signing', 'archive', 'operate', 'graduate']

const LABELS: Record<FlowNodeKey, string> = {
  decision: '决策通过',
  signing: '签约',
  archive: '档案初始化',
  space: '空间分配',
  operate: '正常运营',
  graduate: '毕业',
}

type Props = {
  incubationType: HatchIncubationType
  current: FlowNodeKey
  onNodeClick?: (key: FlowNodeKey, label: string) => void
}

export function HatchProjectFlowBar({ incubationType, current, onNodeClick }: Props) {
  const keys = useMemo(() => (incubationType === '实体' ? PHYSICAL_KEYS : VIRTUAL_KEYS), [incubationType])
          const currentIdx = keys.indexOf(current) >= 0 ? keys.indexOf(current) : 0

  return (
    <div className="rounded-[var(--radius-card)] border border-divider bg-page px-3 py-4 sm:px-4">
      <div className="flex flex-wrap items-center gap-1 sm:flex-nowrap sm:gap-0">
        {keys.map((key, idx) => {
          const done = currentIdx > idx
          const cur = key === current
          const isSpaceSkipped = key === 'space' && incubationType !== '实体'
          return (
            <div key={key} className="flex min-w-0 flex-1 items-center sm:last:flex-none">
              <button
                type="button"
                disabled={isSpaceSkipped}
                onClick={() => onNodeClick?.(key, LABELS[key])}
                className={cn(
                  'flex w-full min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1 text-center transition-colors sm:px-2',
                  isSpaceSkipped && 'cursor-default opacity-40',
                  !isSpaceSkipped && 'hover:bg-surface',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold sm:h-9 sm:w-9 sm:text-[12px]',
                    isSpaceSkipped && 'border-divider bg-surface text-muted',
                    !isSpaceSkipped && done && 'border-primary bg-primary text-white',
                    !isSpaceSkipped && cur && 'border-primary bg-primary-light text-primary shadow-[0_0_0_4px_rgba(30,109,255,0.2)]',
                    !isSpaceSkipped && !done && !cur && 'border-divider bg-surface text-muted',
                  )}
                >
                  {isSpaceSkipped ? '—' : done ? '✓' : idx + 1}
                </span>
                <span
                  className={cn(
                    'w-full truncate text-[9px] font-medium leading-tight sm:text-[10px]',
                    cur ? 'text-primary' : 'text-muted',
                  )}
                >
                  {LABELS[key]}
                </span>
              </button>
              {idx < keys.length - 1 ? (
                <div
                  className={cn(
                    'mx-0.5 hidden h-0.5 min-w-[4px] flex-1 rounded-full sm:block',
                    currentIdx > idx ? 'bg-primary' : 'bg-divider',
                  )}
                  aria-hidden
                />
              ) : null}
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted sm:hidden">当前节点高亮；虚拟/服务商项目不包含实体空间分配步。</p>
    </div>
  )
}

export function HatchFlowNodeDetailModal({
  open,
  title,
  body,
  onClose,
}: {
  open: boolean
  title: string
  body: string
  onClose: () => void
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      panelClassName="max-w-md"
      footer={
        <button type="button" className="rounded-[var(--radius-button)] bg-primary px-5 py-2 text-[13px] font-semibold text-white" onClick={onClose}>
          关闭
        </button>
      }
    >
      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{body}</p>
    </Modal>
  )
}
