import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { daysUntil } from './hatchSigningWorkbenchModel'

export type SendContractReminderModalProps = {
  open: boolean
  projectName: string
  contractEnd: string | null | undefined
  onClose: () => void
  onConfirm: (methods: { site: boolean; email: boolean }) => void
}

export function SendContractReminderModal({
  open,
  projectName,
  contractEnd,
  onClose,
  onConfirm,
}: SendContractReminderModalProps) {
  const [site, setSite] = useState(true)
  const [email, setEmail] = useState(true)
  const left = daysUntil(contractEnd)
  const leftLabel = left == null ? '—' : left < 0 ? '已过期' : `剩余 ${left} 天`

  return (
    <Modal
      open={open}
      title="发送合同到期提醒"
      onClose={onClose}
      panelClassName="max-w-md"
      footer={
        <>
          <button type="button" className="rounded-md border px-4 py-2 text-[13px]" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-5 py-2 text-[13px] font-bold text-white"
            onClick={() => onConfirm({ site, email })}
            disabled={!site && !email}
          >
            确认发送
          </button>
        </>
      }
    >
      <div className="space-y-3 text-[13px]">
        <p>
          <span className="text-muted">项目：</span>
          {projectName}
        </p>
        <p>
          <span className="text-muted">合同到期日：</span>
          {contractEnd ?? '—'}（{leftLabel}）
        </p>
        <div>
          <p className="mb-2 text-muted">提醒方式</p>
          <label className="mr-4 inline-flex items-center gap-2">
            <input type="checkbox" checked={site} onChange={(e) => setSite(e.target.checked)} />
            站内信
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />
            邮件
          </label>
        </div>
        <p className="rounded-md border border-divider bg-page p-3 text-[12px] text-muted">
          提醒内容预览：您有一个合同即将到期，请尽快联系园区运营办理续约或确认退出事宜。
        </p>
      </div>
    </Modal>
  )
}
