import { useEffect, useState } from 'react'
import { Modal } from '../../components/Modal'
import { EXIT_CHECKS } from './ChangeApprovalModal'
import type { ChangeRequest } from './hatchTypes'

export function ExitApprovalModal({
  change,
  open,
  onClose,
  onApprove,
  onReject,
}: {
  change: ChangeRequest | null
  open: boolean
  onClose: () => void
  onApprove: (opinion: string) => void
  onReject: (opinion: string) => void
}) {
  const [opinion, setOpinion] = useState('符合毕业条件，同意毕业')
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(EXIT_CHECKS.map((k) => [k, false])),
  )

  useEffect(() => {
    if (open) {
      setOpinion('符合毕业条件，同意毕业')
      setChecks(Object.fromEntries(EXIT_CHECKS.map((k) => [k, false])))
    }
  }, [open])

  if (!change) return null

  const allChecked = EXIT_CHECKS.every((k) => checks[k])

  return (
    <Modal
      open={open}
      title={`退出审批 - ${change.projectName}`}
      onClose={onClose}
      panelClassName="max-w-lg"
      footer={
        <>
          <button type="button" className="rounded-md border px-4 py-2 text-[13px]" onClick={() => onReject(opinion || '驳回')}>
            驳回
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-5 py-2 text-[13px] font-bold text-white disabled:opacity-40"
            disabled={!allChecked}
            onClick={() => onApprove(opinion)}
          >
            确认完成退出
          </button>
        </>
      }
    >
      <div className="space-y-4 text-[13px]">
        <p>
          退出类型：<span className="font-bold">{change.exitType === '毕业' ? '毕业申请' : '退出申请'}</span>
        </p>
        <p className="text-muted">申请原因：{change.reason ?? change.summary}</p>
        <div>
          <p className="mb-2 font-bold">退出前检查（须全部勾选）</p>
          <ul className="space-y-2">
            {EXIT_CHECKS.map((k) => (
              <li key={k}>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={checks[k]} onChange={() => setChecks((s) => ({ ...s, [k]: !s[k] }))} />
                  {k}
                </label>
              </li>
            ))}
          </ul>
        </div>
        <label className="flex flex-col gap-1 text-muted">
          审批意见
          <textarea value={opinion} onChange={(e) => setOpinion(e.target.value)} rows={2} className="rounded-md border px-3 py-2" />
        </label>
      </div>
    </Modal>
  )
}
