import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { useContractTemplates } from '../../contexts/ContractTemplatesContext'
import { useToast } from '../../components/ToastProvider'
import type { HatchIncubationType, SigningConfirmPayload, SigningContract } from './hatchTypes'

const INC_TYPES: HatchIncubationType[] = ['实体', '虚拟', '服务商']
const AI_PACKAGES = ['轻量版（月费 300 元）', '标准版（1000次/月）', '旗舰版'] as const

function addOneYear(start: string): string {
  const d = new Date(start)
  if (Number.isNaN(d.getTime())) return ''
  d.setFullYear(d.getFullYear() + 1)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export type SignAgreementModalProps = {
  open: boolean
  mode: 'sign' | 'renew'
  contract?: SigningContract | null
  projectId: string
  projectName: string
  decisionNote?: string
  onClose: () => void
  onConfirm: (payload: SigningConfirmPayload, hasScan: boolean) => void
}

export function SignAgreementModal({
  open,
  mode,
  contract,
  projectId,
  projectName,
  decisionNote,
  onClose,
  onConfirm,
}: SignAgreementModalProps) {
  const toast = useToast()
  const ct = useContractTemplates()
  const [incType, setIncType] = useState<HatchIncubationType>(contract?.incubationType ?? '虚拟')
  const [tplId, setTplId] = useState(contract?.templateId ?? '')
  const [termStart, setTermStart] = useState(contract?.termStart ?? '2026-06-01')
  const [termEnd, setTermEnd] = useState(contract?.termEnd ?? '2027-05-31')
  const [rent, setRent] = useState(String(contract?.rentYuanPerMonth ?? 2000))
  const [propertyFee, setPropertyFee] = useState(String(contract?.propertyFee ?? 0))
  const [techFee, setTechFee] = useState(String(contract?.techFeeYuanPerMonth ?? 500))
  const [aiPkg, setAiPkg] = useState(contract?.aiPackage ?? AI_PACKAGES[0])
  const [scanName, setScanName] = useState(contract?.scanFileName ?? '')

  const templates = ct.templatesForSigning(incType)

  useEffect(() => {
    if (!open) return
    setIncType(contract?.incubationType ?? '虚拟')
    setTermStart(contract?.termStart ?? '2026-06-01')
    setTermEnd(contract?.termEnd ?? (addOneYear(contract?.termStart ?? '2026-06-01') || '2027-05-31'))
    setRent(String(contract?.rentYuanPerMonth ?? 2000))
    setPropertyFee(String(contract?.propertyFee ?? 0))
    setTechFee(String(contract?.techFeeYuanPerMonth ?? 500))
    setAiPkg(contract?.aiPackage ?? AI_PACKAGES[0])
    setScanName(contract?.scanFileName ?? '')
    const choices = ct.templatesForSigning(contract?.incubationType ?? '虚拟')
    const preferred =
      (contract?.templateId && choices.some((t) => t.id === contract.templateId) ? contract.templateId : undefined) ??
      choices[0]?.id ??
      ''
    setTplId(preferred)
  }, [open, contract, ct])

  useEffect(() => {
    const choices = ct.templatesForSigning(incType)
    if (!choices.some((t) => t.id === tplId)) {
      setTplId(choices[0]?.id ?? '')
    }
  }, [incType, ct, tplId])

  const firstYearTotal = useMemo(() => {
    const r = Number(rent) || 0
    const p = Number(propertyFee) || 0
    const t = Number(techFee) || 0
    const ai = aiPkg.includes('300') ? 300 : aiPkg.includes('1000') ? 1000 : 500
    return (r + p + t + ai) * 12
  }, [rent, propertyFee, techFee, aiPkg])

  function handleConfirm() {
    if (templates.length === 0) {
      toast.show('没有匹配且启用中的合同模板', 'warning')
      return
    }
    if (!tplId || !termStart || !termEnd) {
      toast.show('请完善期限与模板', 'warning')
      return
    }
    const payload: SigningConfirmPayload = {
      projectId,
      projectName,
      incubationType: incType,
      templateId: tplId,
      termStart,
      termEnd,
      rentYuanPerMonth: Number(rent) || 0,
      propertyFee: Number(propertyFee) || 0,
      techFeeYuanPerMonth: Number(techFee) || 0,
      aiPackage: aiPkg,
      scanFileName: scanName.trim() || undefined,
    }
    onConfirm(payload, Boolean(scanName.trim()))
  }

  const title = mode === 'renew' ? `续约 - ${projectName}` : `签署协议 - ${projectName}`

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      closeOnOverlayClick={false}
      panelClassName="max-w-[800px]"
      footer={
        <>
          <button type="button" className="rounded-[var(--radius-button)] border border-divider px-4 py-2 text-[13px]" onClick={onClose}>
            取消
          </button>
          <button type="button" className="rounded-[var(--radius-button)] bg-primary px-5 py-2 text-[13px] font-bold text-white" onClick={handleConfirm}>
            确认签署
          </button>
        </>
      }
    >
      <div className="max-h-[70vh] space-y-5 overflow-y-auto text-[13px]">
        <section>
          <p className="mb-2 font-bold text-foreground">1. 合同基本信息</p>
          <p className="text-muted">
            项目名称：<span className="text-foreground">{projectName}</span>
            {decisionNote ? <span className="text-muted">（{decisionNote}）</span> : null}
            {mode === 'renew' && contract ? (
              <span className="ml-1 text-muted">· 原合同 {contract.termStart ?? '—'} 至 {contract.termEnd ?? '—'}</span>
            ) : null}
          </p>
          <fieldset className="mt-3">
            <legend className="mb-2 text-muted">入孵类型</legend>
            <div className="flex flex-wrap gap-4">
              {INC_TYPES.map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="incType" checked={incType === t} onChange={() => setIncType(t)} />
                  <span>{t}入孵</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="mt-3 flex flex-col gap-2 text-muted">
            合同模板
            {templates.length === 0 ? (
              <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12px]">
                请先在{' '}
                <Link to="/basic/contracts" className="font-semibold text-primary underline">
                  合同模板管理
                </Link>{' '}
                维护模板
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <select value={tplId} onChange={(e) => setTplId(e.target.value)} className="flex-1 rounded-md border border-divider bg-page px-3 py-2">
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}（{t.version}）
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rounded-md border border-divider px-3 py-2 text-[12px]"
                  onClick={() => {
                    const t = ct.getById(tplId)
                    toast.show(t ? `模板预览：${t.name}（演示）` : '请先选择模板', 'info')
                  }}
                >
                  预览
                </button>
              </div>
            )}
          </label>
        </section>

        <section>
          <p className="mb-2 font-bold text-foreground">2. 期限与费用</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-muted">
              入孵开始日期
              <input
                type="date"
                value={termStart}
                onChange={(e) => {
                  setTermStart(e.target.value)
                  setTermEnd(addOneYear(e.target.value))
                }}
                className="rounded-md border border-divider px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-muted">
              入孵结束日期
              <input type="date" value={termEnd} onChange={(e) => setTermEnd(e.target.value)} className="rounded-md border border-divider px-3 py-2" />
            </label>
          </div>
          <div className="mt-3 grid gap-2 rounded-md border border-divider bg-page p-3 sm:grid-cols-2">
            <label className="text-muted">
              租金（元/月）
              <input value={rent} onChange={(e) => setRent(e.target.value)} className="mt-1 w-full rounded-md border px-2 py-1.5" />
            </label>
            <label className="text-muted">
              物业费（元/月）
              <input value={propertyFee} onChange={(e) => setPropertyFee(e.target.value)} className="mt-1 w-full rounded-md border px-2 py-1.5" />
            </label>
            <label className="text-muted">
              技术服务费（元/月）
              <input value={techFee} onChange={(e) => setTechFee(e.target.value)} className="mt-1 w-full rounded-md border px-2 py-1.5" />
            </label>
            <label className="text-muted">
              AI 服务套餐
              <select value={aiPkg} onChange={(e) => setAiPkg(e.target.value)} className="mt-1 w-full rounded-md border px-2 py-1.5">
                {AI_PACKAGES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-2 text-[12px] text-muted">
            总费用（首年）预览：<span className="font-semibold text-foreground">{firstYearTotal.toLocaleString()} 元</span>
          </p>
        </section>

        <section>
          <p className="mb-2 font-bold text-foreground">3. 线下签署操作</p>
          <ol className="list-decimal space-y-2 pl-5 text-[12px] text-muted">
            <li>
              下载协议{' '}
              <button type="button" className="ml-1 rounded border border-primary/40 bg-primary-light px-2 py-0.5 font-bold text-primary" onClick={() => toast.show('PDF 已生成（演示）', 'info')}>
                下载 PDF
              </button>
            </li>
            <li>双方盖章（甲方：平台；乙方：项目方）</li>
            <li>
              上传双方盖章扫描件
              <input
                type="file"
                accept=".jpg,.jpeg,.pdf"
                className="mt-2 block w-full text-[12px]"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  setScanName(f?.name ?? '')
                }}
              />
              <p className="mt-1 text-foreground">已上传：{scanName || '无'}</p>
            </li>
          </ol>
          <p className="mt-2 text-[11px] text-muted">请确保双方盖章清晰，上传后点击「确认签署」合同生效。</p>
        </section>

        <p className="text-[11px] text-muted">操作说明：确认后将创建签约记录（状态=待签署），并同步 CRM 生成合同草稿（演示）。</p>
      </div>
    </Modal>
  )
}
