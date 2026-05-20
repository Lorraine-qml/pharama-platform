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

export type SigningProcessModalProps = {
  open: boolean
  contract?: SigningContract | null
  projectId: string
  projectName: string
  workbenchTaskId?: string
  onClose: () => void
  onComplete: (payload: SigningConfirmPayload, workbenchTaskId?: string) => void
}

export function SigningProcessModal({
  open,
  contract,
  projectId,
  projectName,
  workbenchTaskId,
  onClose,
  onComplete,
}: SigningProcessModalProps) {
  const toast = useToast()
  const ct = useContractTemplates()
  const [step, setStep] = useState<1 | 2>(1)
  const [incType, setIncType] = useState<HatchIncubationType>('虚拟')
  const [tplId, setTplId] = useState('')
  const [termStart, setTermStart] = useState('2026-06-01')
  const [termEnd, setTermEnd] = useState('2027-05-31')
  const [rent, setRent] = useState('2000')
  const [propertyFee, setPropertyFee] = useState('0')
  const [techFee, setTechFee] = useState('500')
  const [aiPkg, setAiPkg] = useState<string>(AI_PACKAGES[0])
  const [signingCompleted, setSigningCompleted] = useState<'yes' | 'no' | null>(null)
  const [attachments, setAttachments] = useState<string[]>([])
  const [remark, setRemark] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const templates = ct.templatesForSigning(incType)

  useEffect(() => {
    if (!open) return
    setStep(1)
    setIncType(contract?.incubationType ?? '虚拟')
    setTermStart(contract?.termStart ?? '2026-06-01')
    setTermEnd(contract?.termEnd ?? (addOneYear(contract?.termStart ?? '2026-06-01') || '2027-05-31'))
    setRent(String(contract?.rentYuanPerMonth ?? 2000))
    setPropertyFee(String(contract?.propertyFee ?? 0))
    setTechFee(String(contract?.techFeeYuanPerMonth ?? 500))
    setAiPkg(contract?.aiPackage ?? AI_PACKAGES[0])
    setSigningCompleted(null)
    setAttachments(contract?.contractAttachments?.length ? [...contract.contractAttachments] : [])
    setRemark(contract?.contractRemark ?? '')
    setConfirmed(false)
    const choices = ct.templatesForSigning(contract?.incubationType ?? '虚拟')
    setTplId(
      (contract?.templateId && choices.some((t) => t.id === contract.templateId) ? contract.templateId : undefined) ??
        choices[0]?.id ??
        '',
    )
  }, [open, contract, ct])

  useEffect(() => {
    const choices = ct.templatesForSigning(incType)
    if (!choices.some((t) => t.id === tplId)) setTplId(choices[0]?.id ?? '')
  }, [incType, ct, tplId])

  const monthlyTotal = useMemo(() => {
    const r = Number(rent) || 0
    const p = Number(propertyFee) || 0
    const t = Number(techFee) || 0
    const ai = aiPkg.includes('300') ? 300 : aiPkg.includes('1000') ? 1000 : 500
    return r + p + t + ai
  }, [rent, propertyFee, techFee, aiPkg])

  const firstYearTotal = monthlyTotal * 12

  function buildPayload(): SigningConfirmPayload {
    return {
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
      scanFileName: attachments[0],
      contractAttachments: attachments.length ? attachments : undefined,
      contractRemark: remark.trim() || undefined,
    }
  }

  function addAttachments(files: FileList | null) {
    if (!files?.length) return
    setAttachments((prev) => {
      const next = [...prev]
      for (const f of Array.from(files)) {
        if (!next.includes(f.name)) next.push(f.name)
      }
      return next
    })
  }

  function removeAttachment(name: string) {
    setAttachments((prev) => prev.filter((n) => n !== name))
  }

  const canSubmit = signingCompleted === 'yes' && attachments.length > 0 && confirmed

  function nextStep() {
    if (templates.length === 0) {
      toast.show('没有匹配且启用中的合同模板', 'warning')
      return
    }
    if (!tplId || !termStart || !termEnd) {
      toast.show('请完善期限与模板', 'warning')
      return
    }
    setStep(2)
  }

  function submit() {
    if (signingCompleted !== 'yes') {
      toast.show('请先确认已完成线下签署', 'warning')
      return
    }
    if (attachments.length === 0) {
      toast.show('请上传至少一份合同附件', 'warning')
      return
    }
    if (!confirmed) {
      toast.show('请勾选确认复选框', 'warning')
      return
    }
    onComplete(buildPayload(), workbenchTaskId)
  }

  const title = step === 1 ? `签约处理 - ${projectName}（1/2）` : `签约处理 - ${projectName}（2/2）`

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      closeOnOverlayClick={false}
      panelClassName="max-w-[800px]"
      footer={
        step === 1 ? (
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={onClose}>
              取消
            </button>
            <button type="button" className="rounded-md bg-primary px-5 py-2 text-[13px] font-bold text-white" onClick={nextStep}>
              下一步
            </button>
          </>
        ) : (
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setStep(1)}>
              上一步
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-5 py-2 text-[13px] font-bold text-white disabled:opacity-40"
              disabled={!canSubmit}
              onClick={submit}
            >
              确认签署
            </button>
          </>
        )
      }
    >
      {step === 1 ? (
        <div className="max-h-[70vh] space-y-4 overflow-y-auto text-[13px]">
          <section>
            <p className="mb-2 font-bold">合同基本信息</p>
            <p className="text-muted">
              项目名称：<span className="text-foreground">{projectName}</span>
            </p>
            <fieldset className="mt-3">
              <legend className="mb-2 text-muted">入孵类型</legend>
              <div className="flex flex-wrap gap-4">
                {INC_TYPES.map((t) => (
                  <label key={t} className="flex cursor-pointer items-center gap-2">
                    <input type="radio" name="incTypeProc" checked={incType === t} onChange={() => setIncType(t)} />
                    {t}入孵
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="mt-3 flex flex-col gap-2 text-muted">
              合同模板
              {templates.length === 0 ? (
                <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12px]">
                  请先在 <Link to="/basic/contracts" className="text-primary underline">合同模板管理</Link> 维护模板
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <select value={tplId} onChange={(e) => setTplId(e.target.value)} className="flex-1 rounded-md border px-3 py-2">
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="rounded-md border px-3 py-2 text-[12px]" onClick={() => toast.show('模板预览（演示）', 'info')}>
                    预览
                  </button>
                </div>
              )}
            </label>
          </section>
          <section>
            <p className="mb-2 font-bold">期限与费用</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-muted">
                入孵开始日期
                <input type="date" value={termStart} onChange={(e) => { setTermStart(e.target.value); setTermEnd(addOneYear(e.target.value)) }} className="mt-1 w-full rounded-md border px-3 py-2" />
              </label>
              <label className="text-muted">
                入孵结束日期
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
            <p className="mt-2 text-[12px] text-muted">总费用（首年）预览：<span className="font-semibold text-foreground">{firstYearTotal.toLocaleString()} 元</span></p>
          </section>
        </div>
      ) : (
        <div className="max-h-[70vh] space-y-4 overflow-y-auto text-[13px]">
          <section className="rounded-md border bg-page p-3">
            <p className="font-bold">签约信息摘要（只读）</p>
            <p className="mt-2 text-muted">
              入孵类型：{incType} · 期限：{termStart} ~ {termEnd}
            </p>
            <p className="text-muted">月总额：{monthlyTotal} 元/月（租金{rent}+物业{propertyFee}+技术服务{techFee}+AI套餐）</p>
          </section>
          <section>
            <p className="mb-2 font-bold">线下签署操作</p>
            <ol className="list-decimal space-y-2 pl-5 text-[12px] text-muted">
              <li>
                <button type="button" className="rounded border border-primary/40 bg-primary-light px-2 py-0.5 font-bold text-primary" onClick={() => toast.show('PDF 已生成（演示）', 'info')}>
                  下载协议
                </button>
              </li>
              <li>双方盖章（甲方：禹翼；乙方：项目方）</li>
              <li>完成盖章后，在下方确认「是否完成签署」并上传合同附件</li>
            </ol>
          </section>

          <section>
            <p className="mb-2 font-bold">是否完成签署</p>
            <div className="flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="signingCompleted"
                  checked={signingCompleted === 'yes'}
                  onChange={() => setSigningCompleted('yes')}
                />
                是
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="signingCompleted"
                  checked={signingCompleted === 'no'}
                  onChange={() => {
                    setSigningCompleted('no')
                    setConfirmed(false)
                  }}
                />
                否
              </label>
            </div>
            {signingCompleted === 'no' ? (
              <p className="mt-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12px] text-warning">
                应该先与用户协商执行线下操作，待双方完成盖章后再回到本流程上传附件并确认签署。
              </p>
            ) : null}
            {signingCompleted === 'yes' ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="mb-2 font-bold text-foreground">上传合同附件</p>
                  <p className="mb-2 text-[12px] text-muted">支持 PDF、JPG、PNG，可多选上传（演示：仅记录文件名）</p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-primary/40 bg-primary-light px-3 py-2 text-[12px] font-semibold text-primary hover:bg-primary-light/80">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        addAttachments(e.target.files)
                        e.target.value = ''
                      }}
                    />
                    添加附件
                  </label>
                  {attachments.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {attachments.map((name) => (
                        <li key={name} className="flex items-center justify-between gap-2 rounded-md border border-divider bg-page px-3 py-2 text-[12px]">
                          <span className="truncate">{name}</span>
                          <button type="button" className="shrink-0 text-danger hover:underline" onClick={() => removeAttachment(name)}>
                            移除
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[12px] text-muted">尚未添加附件</p>
                  )}
                </div>
                <label className="block text-muted">
                  合同备注（选填）
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    placeholder="请在此处备注合同特殊条款或说明"
                  />
                </label>
                <div className="rounded-md border border-primary/20 bg-primary-light/20 p-3">
                  <label className="flex cursor-pointer items-start gap-2">
                    <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />
                    <span>我确认双方已完成线下盖章，且上传的附件清晰有效</span>
                  </label>
                  <p className="mt-2 text-[11px] text-muted">确认签署后，合同状态将变为「已生效」，并自动同步至 CRM（演示）。</p>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </Modal>
  )
}
