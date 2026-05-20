import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { useContractTemplates } from '../../contexts/ContractTemplatesContext'
import { useToast } from '../../components/ToastProvider'
import type { HatchIncubationType, SigningConfirmPayload, SigningContract } from './hatchTypes'

const AI_PACKAGES = ['轻量版（月费 300 元）', '标准版（1000次/月）', '旗舰版'] as const

function addOneYear(start: string): string {
  const d = new Date(start)
  if (Number.isNaN(d.getTime())) return ''
  d.setFullYear(d.getFullYear() + 1)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function RenewContractModal({
  contract,
  open,
  onClose,
  onConfirm,
}: {
  contract: SigningContract | null
  open: boolean
  onClose: () => void
  onConfirm: (payload: SigningConfirmPayload) => void
}) {
  const toast = useToast()
  const ct = useContractTemplates()
  const [tplId, setTplId] = useState('')
  const [termStart, setTermStart] = useState('')
  const [termEnd, setTermEnd] = useState('')
  const [rent, setRent] = useState('')
  const [propertyFee, setPropertyFee] = useState('')
  const [techFee, setTechFee] = useState('0')
  const [aiPkg, setAiPkg] = useState<string>(AI_PACKAGES[1])

  const incType: HatchIncubationType = contract?.incubationType ?? '实体'
  const templates = ct.templatesForSigning(incType)

  useEffect(() => {
    if (!open || !contract) return
    const start = contract.termEnd ? addOneYear(contract.termEnd) : new Date().toISOString().slice(0, 10)
    setTermStart(start)
    setTermEnd(addOneYear(start))
    setRent(String((contract.rentYuanPerMonth ?? 5000) + 500))
    setPropertyFee(String(contract.propertyFee ?? 500))
    setTechFee(String(contract.techFeeYuanPerMonth ?? 0))
    setAiPkg(contract.aiPackage ?? AI_PACKAGES[1])
    const preferred = templates[0]?.id ?? ''
    setTplId(contract.templateId && templates.some((t) => t.id === contract.templateId) ? contract.templateId : preferred)
  }, [open, contract, templates])

  const firstYearTotal = useMemo(() => {
    const r = Number(rent) || 0
    const p = Number(propertyFee) || 0
    const t = Number(techFee) || 0
    const ai = aiPkg.includes('300') ? 300 : 1000
    return (r + p + t + ai) * 12
  }, [rent, propertyFee, techFee, aiPkg])

  if (!contract) return null

  function submit() {
    if (!contract) return
    if (!tplId || !termStart || !termEnd) {
      toast.show('请完善新合同期限与模板', 'warning')
      return
    }
    onConfirm({
      projectId: contract.projectId,
      projectName: contract.projectName,
      incubationType: incType,
      templateId: tplId,
      termStart,
      termEnd,
      rentYuanPerMonth: Number(rent) || 0,
      propertyFee: Number(propertyFee) || 0,
      techFeeYuanPerMonth: Number(techFee) || 0,
      aiPackage: aiPkg,
    })
  }

  return (
    <Modal
      open={open}
      title={`续约 - ${contract.projectName}`}
      onClose={onClose}
      closeOnOverlayClick={false}
      panelClassName="max-w-[800px]"
      footer={
        <>
          <button type="button" className="rounded-md border px-4 py-2 text-[13px]" onClick={onClose}>
            取消
          </button>
          <button type="button" className="rounded-md bg-primary px-5 py-2 text-[13px] font-bold text-white" onClick={submit}>
            确认续约
          </button>
        </>
      }
    >
      <div className="max-h-[70vh] space-y-4 overflow-y-auto text-[13px]">
        <section className="rounded-md border bg-muted/10 p-3 text-[12px]">
          <p className="font-bold">原合同信息（只读）</p>
          <p className="mt-1">原合同编号：{contract.crmContractId ?? `CT-${contract.id}`}</p>
          <p>原到期日：{contract.termEnd ?? contract.contractEnd ?? '—'}</p>
          <p>
            原租金：{contract.rentYuanPerMonth ?? '—'} 元/月 · 原 AI 套餐：{contract.aiPackage ?? '—'}
          </p>
        </section>
        <section>
          <p className="mb-2 font-bold">新合同信息</p>
          <p className="text-muted">入孵类型：{incType}（不可变更）</p>
          <label className="mt-2 flex flex-col gap-2 text-muted">
            合同模板
            <div className="flex gap-2">
              <select value={tplId} onChange={(e) => setTplId(e.target.value)} className="flex-1 rounded-md border px-3 py-2">
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button type="button" className="rounded-md border px-3 py-2 text-[12px]" onClick={() => toast.show('预览（演示）', 'info')}>
                预览
              </button>
            </div>
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-muted">
              新入孵开始日期
              <input type="date" value={termStart} onChange={(e) => setTermStart(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
            </label>
            <label className="text-muted">
              新入孵结束日期
              <input type="date" value={termEnd} onChange={(e) => setTermEnd(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
            </label>
          </div>
          <div className="mt-3 grid gap-2 rounded-md border bg-page p-3 sm:grid-cols-2">
            <label className="text-muted">租金（元/月）<input value={rent} onChange={(e) => setRent(e.target.value)} className="mt-1 w-full rounded-md border px-2 py-1.5" /></label>
            <label className="text-muted">物业费（元/月）<input value={propertyFee} onChange={(e) => setPropertyFee(e.target.value)} className="mt-1 w-full rounded-md border px-2 py-1.5" /></label>
            <label className="text-muted">技术服务费（元/月）<input value={techFee} onChange={(e) => setTechFee(e.target.value)} className="mt-1 w-full rounded-md border px-2 py-1.5" /></label>
            <label className="text-muted">
              AI 服务套餐
              <select value={aiPkg} onChange={(e) => setAiPkg(e.target.value)} className="mt-1 w-full rounded-md border px-2 py-1.5">
                {AI_PACKAGES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-2 text-[12px]">总费用（首年）预览：{firstYearTotal.toLocaleString()} 元</p>
        </section>
        <p className="text-[11px] text-muted">
          操作说明：确认后，原合同将标记为「已终止」，新合同状态为「待签署」，并生成签约任务。模板维护见{' '}
          <Link to="/basic/contracts" className="text-primary underline">合同模板管理</Link>。
        </p>
      </div>
    </Modal>
  )
}
