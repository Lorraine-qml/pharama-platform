import { Modal } from '../../components/Modal'
import { StatusPill } from '../../components/ui/StatusPill'
import { useToast } from '../../components/ToastProvider'
import { hatchSignPillVariant } from '../../utils/listStatusVariants'
import { daysUntil } from './hatchSigningWorkbenchModel'
import type { SigningContract } from './hatchTypes'

const CRM_BASE = 'https://crm.example.com/contract/detail?id='

export function ContractDetailReadonlyModal({
  contract,
  open,
  onClose,
}: {
  contract: SigningContract | null
  open: boolean
  onClose: () => void
}) {
  const toast = useToast()
  if (!contract) return null

  const left = daysUntil(contract.termEnd ?? contract.contractEnd)
  const hasScan = Boolean(contract.scanFileName)

  return (
    <Modal
      open={open}
      title={`合同详情 - ${contract.projectName}`}
      onClose={onClose}
      panelClassName="max-w-[720px]"
      footer={
        <button type="button" className="rounded-[var(--radius-button)] bg-primary px-5 py-2 text-[13px] font-semibold text-white" onClick={onClose}>
          关闭
        </button>
      }
    >
      <div className="space-y-4 text-[13px]">
        <dl className="grid gap-2">
          <div className="flex justify-between gap-2">
            <dt className="text-muted">签约双方</dt>
            <dd className="text-end">甲方：生物医药孵化运营平台；乙方：{contract.projectName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">入孵期限</dt>
            <dd>
              {contract.termStart ?? '—'} 至 {contract.termEnd ?? contract.contractEnd ?? '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">费用</dt>
            <dd className="text-end">
              租金 {contract.rentYuanPerMonth ?? '—'} 元/月，物业费 {contract.propertyFee ?? 0} 元/月
              {contract.techFeeYuanPerMonth ? `，技术服务费 ${contract.techFeeYuanPerMonth} 元/月` : ''}
              {contract.aiPackage ? `，AI 套餐 ${contract.aiPackage}` : ''}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">合同状态</dt>
            <dd>
              <StatusPill variant={hatchSignPillVariant(contract.signStatus)}>{contract.signStatus}</StatusPill>
            </dd>
          </div>
          {left != null && contract.signStatus === '已生效' ? (
            <div className="flex justify-between gap-2">
              <dt className="text-muted">剩余天数</dt>
              <dd>{left} 天</dd>
            </div>
          ) : null}
        </dl>

        <section>
          <p className="mb-2 font-bold">附件</p>
          <ul className="list-inside list-disc space-y-1 text-[12px]">
            {hasScan ? (
              <li>
                盖章扫描件：{contract.scanFileName}{' '}
                <button type="button" className="text-primary hover:underline" onClick={() => toast.show('预览（演示）', 'info')}>
                  预览
                </button>{' '}
                <button type="button" className="text-primary hover:underline" onClick={() => toast.show('开始下载（演示）', 'info')}>
                  下载
                </button>
              </li>
            ) : (
              <li className="text-muted">暂无盖章扫描件</li>
            )}
            <li>
              协议原文：agreement_{contract.templateId ?? 'default'}.pdf{' '}
              <button type="button" className="text-primary hover:underline" onClick={() => toast.show('下载协议原文（演示）', 'info')}>
                下载
              </button>
            </li>
          </ul>
        </section>

        {contract.crmContractId ? (
          <p>
            关联 CRM：{' '}
            <a
              href={`${CRM_BASE}${contract.crmContractId}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              查看 CRM 合同详情
            </a>
          </p>
        ) : null}

        {contract.remindLogs && contract.remindLogs.length > 0 ? (
          <section>
            <p className="mb-2 font-bold">提醒记录</p>
            <ul className="space-y-1 text-[12px] text-muted">
              {contract.remindLogs.map((r) => (
                <li key={r.id}>
                  {r.remindTime.slice(0, 10)} 已发送到期提醒
                  {r.remindDay > 0 ? `（${r.remindDay} 天）` : r.remindDay === -1 ? '（手动）' : ''}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Modal>
  )
}
