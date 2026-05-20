import { useEffect, useState } from 'react'
import { Modal } from '../../components/Modal'
import type { ChangeRequest } from './hatchTypes'

const EXIT_CHECKS = ['空间已释放', '门禁权限已关闭', '平台账号已停用', 'AI 服务已停用', '私有知识库已处理', '资源使用单已结清', '费用已结清'] as const

export function ChangeApprovalModal({
  change,
  open,
  onClose,
  onApprove,
  onReject,
}: {
  change: ChangeRequest | null
  open: boolean
  onClose: () => void
  onApprove: (opinion: string, spaceSuggest?: string) => void
  onReject: (opinion: string) => void
}) {
  const [opinion, setOpinion] = useState('')
  const [spaceSuggest, setSpaceSuggest] = useState('B栋302室（80㎡）')

  useEffect(() => {
    if (open) {
      setOpinion(change?.changeType === '入孵类型变更' ? '同意，请尽快完成空间分配' : '同意')
      setSpaceSuggest('B栋302室（80㎡）')
    }
  }, [open, change?.changeType])

  if (!change) return null

  return (
    <Modal
      open={open}
      title={`审批变更申请 - ${change.projectName}`}
      onClose={onClose}
      panelClassName="max-w-lg"
      footer={
        <>
          <button type="button" className="rounded-md border px-4 py-2 text-[13px]" onClick={() => onReject(opinion || '不同意')}>
            驳回
          </button>
          <button type="button" className="rounded-md bg-primary px-5 py-2 text-[13px] font-bold text-white" onClick={() => onApprove(opinion, spaceSuggest)}>
            同意
          </button>
        </>
      }
    >
      <div className="space-y-3 text-[13px]">
        <p>
          项目：<span className="font-semibold">{change.projectName}</span>
        </p>
        <p>
          变更类型：<span className="font-semibold">{change.changeType}</span>
        </p>
        <p className="text-muted">变更详情：{change.detail ?? change.summary}</p>
        {change.reason ? <p className="text-muted">申请理由：{change.reason}</p> : null}
        <div className="rounded-md border border-divider bg-page p-3 text-[12px]">
          <p className="font-bold">影响评估（系统自动生成）</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted">
            {change.changeType === '入孵类型变更' ? (
              <>
                <li>需分配实体空间</li>
                <li>权限模板切换为「实体项目模板」</li>
                <li>合同需重新签署</li>
              </>
            ) : change.changeType === '空间变更' ? (
              <>
                <li>更新空间绑定与费用试算</li>
                <li>孪生地图同步</li>
              </>
            ) : (
              <li>更新档案字段并记录审计日志</li>
            )}
          </ul>
        </div>
        {change.changeType === '入孵类型变更' ? (
          <label className="flex flex-col gap-1 text-muted">
            空间分配建议
            <input value={spaceSuggest} onChange={(e) => setSpaceSuggest(e.target.value)} className="rounded-md border px-3 py-2" />
          </label>
        ) : null}
        <label className="flex flex-col gap-1 text-muted">
          审批意见
          <textarea value={opinion} onChange={(e) => setOpinion(e.target.value)} rows={3} className="rounded-md border px-3 py-2" />
        </label>
      </div>
    </Modal>
  )
}

export { EXIT_CHECKS }
