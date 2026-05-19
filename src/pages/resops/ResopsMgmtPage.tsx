import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { StatusPill } from '../../components/ui/StatusPill'
import { useResourceTypesConfig } from '../../contexts/ResourceTypesConfigContext'
import { resResourcePillVariant } from '../../utils/listStatusVariants'
import { cn } from '../../utils/cn'
import type { ResFeeMode, ResOpenScope, ResQualificationFile, ResResource, ResResourceStatus } from './resopsV1Types'
import { useResopsV1 } from './ResopsV1Context'
import { RESOURCE_STATUS_LABEL } from './resopsV1Labels'

const STATUS_FILTERS: Array<ResResourceStatus | 'all'> = [
  'all',
  'draft',
  'pending_review',
  'pending_listing',
  'listed',
  'delisted',
  'maintenance',
  'anomaly',
  'rejected',
]

const STEPS = ['基础信息与类型', '能力与资质', '规则与收费'] as const

function ReqMark() {
  return (
    <span className="font-bold text-danger" aria-hidden>
      *
    </span>
  )
}

const OPEN_SCOPE_OPTIONS: { v: ResOpenScope; label: string }[] = [
  { v: 'all', label: '全部项目方' },
  { v: 'physical_only', label: '仅实体项目' },
  { v: 'virtual_only', label: '仅虚拟项目' },
  { v: 'whitelist', label: '指定项目方' },
]

type RegForm = {
  name: string
  level1: string
  level2: string
  intro: string
  providerName: string
  contactName: string
  phone: string
  hours: string
  capability: string
  qualificationFiles: ResQualificationFile[]
  scope: ResOpenScope
  scopeWhitelistNote: string
  feeMode: ResFeeMode
  priceAmount: number
  priceUnit: string
  remark: string
  needPlatformReview: boolean
  limitConcurrency: boolean
}

function emptyReg(defaultProvider: string, level1: string, level2: string): RegForm {
  return {
    name: '',
    level1,
    level2,
    intro: '',
    providerName: defaultProvider,
    contactName: '',
    phone: '',
    hours: '周一至周五 9:00-17:00',
    capability: '',
    qualificationFiles: [],
    scope: 'all',
    scopeWhitelistNote: '',
    feeMode: 'hourly',
    priceAmount: 200,
    priceUnit: '元/小时',
    remark: '',
    needPlatformReview: false,
    limitConcurrency: false,
  }
}

export default function ResopsMgmtPage() {
  const toast = useToast()
  const ctx = useResopsV1()
  const { categoriesForRegister } = useResourceTypesConfig()
  const [searchParams] = useSearchParams()

  const [st, setSt] = useState<ResResourceStatus | 'all'>('all')
  const [type1, setType1] = useState<string>('all')
  const [prov, setProv] = useState<string>('all')
  const [q, setQ] = useState('')

  const [registerOpen, setRegisterOpen] = useState(false)
  const [regStep, setRegStep] = useState(0)
  /** 已通过「下一步」解锁编辑的最高步骤索引：0 仅第一步可编；1 含第二步；2 含第三步 */
  const [regMaxUnlocked, setRegMaxUnlocked] = useState(0)
  const [reg, setReg] = useState<RegForm>(() => emptyReg('', '', ''))

  const [audit, setAudit] = useState<ResResource | null>(null)
  const [auditDecision, setAuditDecision] = useState<'pass' | 'return' | 'reject'>('pass')
  const [auditOpinion, setAuditOpinion] = useState('符合要求，同意准入')
  const [auditReason, setAuditReason] = useState('')

  const [bind, setBind] = useState<ResResource | null>(null)
  const [bindInput, setBindInput] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<ResResource | null>(null)

  const [fakeFileName, setFakeFileName] = useState('')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const first = categoriesForRegister[0]
    const tag0 = first?.tags[0]
    if (!first || !tag0) return
    setReg((r) => (r.level1 ? r : { ...r, level1: first.name, level2: tag0, providerName: ctx.providerNameFilter }))
  }, [categoriesForRegister, ctx.providerNameFilter])

  useEffect(() => {
    const s = searchParams.get('status')
    if (!s) return
    if (STATUS_FILTERS.includes(s as ResResourceStatus | 'all')) setSt(s as ResResourceStatus | 'all')
  }, [searchParams])

  const level1Options = useMemo(() => {
    const xs = new Set(ctx.resources.map((r) => r.level1))
    return ['all', ...Array.from(xs)]
  }, [ctx.resources])

  const providerOptions = useMemo(() => {
    const xs = new Set(ctx.resources.map((r) => r.providerName))
    return ['all', ...Array.from(xs)]
  }, [ctx.resources])

  const rows = useMemo(() => {
    return ctx.resources.filter((r) => {
      if (st !== 'all' && r.status !== st) return false
      if (type1 !== 'all' && r.level1 !== type1) return false
      if (prov !== 'all' && r.providerName !== prov) return false
      if (q.trim() && !r.name.includes(q.trim()) && !r.providerName.includes(q.trim())) return false
      return true
    })
  }, [ctx.resources, st, type1, prov, q])

  useEffect(() => {
    setPage(1)
  }, [st, type1, prov, q])

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  function openRegister() {
    const first = categoriesForRegister[0]
    const tag0 = first?.tags[0] ?? ''
    setReg(emptyReg(ctx.providerNameFilter, first?.name ?? '', tag0))
    setRegStep(0)
    setRegMaxUnlocked(0)
    setRegisterOpen(true)
  }

  function validateStep(s: number): boolean {
    if (s === 0) {
      if (!reg.name.trim()) {
        toast.show('请填写资源名称', 'warning')
        return false
      }
      if (!reg.intro.trim()) {
        toast.show('请填写资源简介', 'warning')
        return false
      }
      if (!reg.providerName.trim()) {
        toast.show('请填写提供方', 'warning')
        return false
      }
      if (!reg.contactName.trim() || !reg.phone.trim()) {
        toast.show('请填写联系人与电话', 'warning')
        return false
      }
      return true
    }
    if (s === 1) {
      if (!reg.capability.trim()) {
        toast.show('请填写能力描述', 'warning')
        return false
      }
      if (reg.scope === 'whitelist' && !reg.scopeWhitelistNote.trim()) {
        toast.show('指定项目方时请填写说明', 'warning')
        return false
      }
      return true
    }
    return true
  }

  function nextStep() {
    if (!validateStep(regStep)) return
    setRegMaxUnlocked((m) => Math.max(m, regStep + 1))
    setRegStep((x) => Math.min(2, x + 1))
  }

  function prevStep() {
    setRegStep((x) => Math.max(0, x - 1))
  }

  function addFakeQualFile() {
    const n = fakeFileName.trim()
    if (!n) {
      toast.show('请输入文件名', 'warning')
      return
    }
    setReg((r) => ({
      ...r,
      qualificationFiles: [...r.qualificationFiles, { id: `qf-${Date.now()}`, name: n }],
    }))
    setFakeFileName('')
  }

  function submitRegister(asDraft: boolean) {
    if (!asDraft && regStep < 2) {
      toast.show('请完成全部步骤后再提交审核', 'warning')
      return
    }
    if (!asDraft) {
      if (!validateStep(0) || !validateStep(1)) return
      if (['hourly', 'per_use', 'per_project'].includes(reg.feeMode) && !(reg.priceAmount > 0)) {
        toast.show('请填写有效价格', 'warning')
        return
      }
    }
    ctx.registerResource({
      name: reg.name,
      level1: reg.level1,
      level2: reg.level2,
      intro: reg.intro,
      providerName: reg.providerName,
      contactName: reg.contactName,
      phone: reg.phone,
      hours: reg.hours,
      capability: reg.capability,
      qualificationFiles: reg.qualificationFiles,
      scope: reg.scope,
      scopeWhitelistNote: reg.scopeWhitelistNote,
      feeMode: reg.feeMode,
      priceAmount: reg.priceAmount,
      priceUnit: reg.priceUnit,
      remark: reg.remark,
      needPlatformReview: reg.needPlatformReview,
      limitConcurrency: reg.limitConcurrency,
      asDraft,
    })
    setRegisterOpen(false)
    toast.show(asDraft ? '已暂存草稿' : '提交成功，请等待平台审核', 'success')
  }

  function openAudit(r: ResResource) {
    setAudit(r)
    setAuditDecision('pass')
    setAuditOpinion('符合要求，同意准入')
    setAuditReason('')
  }

  function submitAudit() {
    if (!audit) return
    if (auditDecision !== 'pass' && !auditReason.trim()) {
      toast.show('退回或拒绝时请填写原因', 'warning')
      return
    }
    ctx.submitResourceAudit(audit.id, {
      decision: auditDecision,
      opinion: auditOpinion.trim(),
      reason: auditReason.trim() || undefined,
    })
    setAudit(null)
    toast.show('审核已提交', 'success')
  }

  const canEditRegStep1 = regMaxUnlocked >= 1
  const canEditRegStep2 = regMaxUnlocked >= 2

  function rowActions(r: ResResource) {
    const detail = (
      <Link to={`/resops/resource/${r.id}`} className="font-semibold text-primary hover:underline">
        详情
      </Link>
    )

    const bindBtn = (
      <button type="button" className="font-semibold text-primary hover:underline" onClick={() => { setBind(r); setBindInput(r.twinBindNote ?? '') }}>
        绑定
      </button>
    )

    switch (r.status) {
      case 'listed':
        return (
          <>
            <button type="button" className="font-semibold text-warning hover:underline" onClick={() => ctx.setResourceStatus(r.id, 'delisted')}>
              下架
            </button>
            <button type="button" className="font-semibold text-foreground hover:underline" onClick={() => toast.show('请在详情页编辑完整信息（演示）', 'info')}>
              编辑
            </button>
            {bindBtn}
            {detail}
          </>
        )
      case 'pending_listing':
        return (
          <>
            <button type="button" className="font-semibold text-primary hover:underline" onClick={() => { ctx.publishResource(r.id); toast.show('已上架', 'success') }}>
              上架
            </button>
            <button type="button" className="font-semibold text-foreground hover:underline" onClick={() => toast.show('请在详情页编辑（演示）', 'info')}>
              编辑
            </button>
            {bindBtn}
            {detail}
          </>
        )
      case 'pending_review':
        return (
          <>
            <button type="button" className="font-semibold text-primary hover:underline" onClick={() => openAudit(r)}>
              审核
            </button>
            <button type="button" className="font-semibold text-foreground hover:underline" onClick={() => toast.show('退回修改前请使用审核弹窗（演示）', 'info')}>
              编辑
            </button>
            <button type="button" className="font-semibold text-danger hover:underline" onClick={() => setDeleteTarget(r)}>
              删除
            </button>
            {detail}
          </>
        )
      case 'draft':
        return (
          <>
            <button type="button" className="font-semibold text-foreground hover:underline" onClick={() => toast.show('继续填写：可重新打开注册向导（演示）', 'info')}>
              编辑
            </button>
            <button type="button" className="font-semibold text-danger hover:underline" onClick={() => setDeleteTarget(r)}>
              删除
            </button>
            {detail}
          </>
        )
      case 'delisted':
        return (
          <>
            <button type="button" className="font-semibold text-primary hover:underline" onClick={() => { ctx.setResourceStatus(r.id, 'listed'); toast.show('已重新上架', 'success') }}>
              上架
            </button>
            <button type="button" className="font-semibold text-foreground hover:underline" onClick={() => toast.show('请在详情页编辑（演示）', 'info')}>
              编辑
            </button>
            {detail}
          </>
        )
      case 'maintenance':
      case 'anomaly':
        return (
          <>
            <button type="button" className="font-semibold text-primary hover:underline" onClick={() => { ctx.setResourceStatus(r.id, 'listed'); toast.show('已恢复正常', 'success') }}>
              恢复
            </button>
            <button type="button" className="font-semibold text-foreground hover:underline" onClick={() => toast.show('请在详情页编辑（演示）', 'info')}>
              编辑
            </button>
            {bindBtn}
            {detail}
          </>
        )
      case 'rejected':
        return <>{detail}</>
      default:
        return detail
    }
  }

  return (
    <div className="space-y-5">
      <ModuleIntroCard
        title="📌 资源管理 · 资源注册、审核、上架全流程"
        lines={[
          '核心流程：资源注册 → 审核 → 上架 → 项目方申请 → 提供方确认 → 生成使用单 → 执行 → 评价。',
          '资源类型在「基础数据 → 资源类型配置」维护；审批与状态维护可在列表快捷入口或资源详情页完成。',
        ]}
      />

      <ListToolbarRow
        left={
          <button type="button" onClick={openRegister} className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-primary-hover">
            + 注册资源
          </button>
        }
        right={
          <>
            <label className="text-[13px] text-muted">
              状态
              <select value={st} onChange={(e) => setSt(e.target.value as typeof st)} className="mt-1 block rounded-md border border-divider bg-page px-3 py-2 text-[13px]">
                {STATUS_FILTERS.map((k) => (
                  <option key={k} value={k}>
                    {k === 'all' ? '全部' : RESOURCE_STATUS_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[13px] text-muted">
              一级类型
              <select value={type1} onChange={(e) => setType1(e.target.value)} className="mt-1 block min-w-[140px] rounded-md border border-divider bg-page px-3 py-2 text-[13px]">
                {level1Options.map((k) => (
                  <option key={k} value={k}>
                    {k === 'all' ? '全部' : k}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[13px] text-muted">
              提供方
              <select value={prov} onChange={(e) => setProv(e.target.value)} className="mt-1 block min-w-[140px] rounded-md border border-divider bg-page px-3 py-2 text-[13px]">
                {providerOptions.map((k) => (
                  <option key={k} value={k}>
                    {k === 'all' ? '全部' : k}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[200px] text-[13px] text-muted">
              搜索名称 / 提供方
              <input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 w-full rounded-md border border-divider bg-page px-3 py-2 text-[13px]" />
            </label>
          </>
        }
      />

      <div className="overflow-hidden rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-[13px]">
            <thead className="border-b border-divider bg-[#F5F7FA] text-[12px] font-bold text-muted">
              <tr>
                <th className="px-3 py-3 text-start">资源名称</th>
                <th className="px-3 py-3 text-start">类型</th>
                <th className="px-3 py-3 text-start">提供方</th>
                <th className="px-3 py-3 text-start">状态</th>
                <th className="px-3 py-3 text-start">位置</th>
                <th className="px-3 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {pagedRows.map((r) => (
                <tr key={r.id} className="h-12 hover:bg-primary-light/15">
                  <td className="px-3 py-3 font-semibold">
                    <Link to={`/resops/resource/${r.id}`} className="text-foreground hover:text-primary hover:underline">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-muted">{r.level2}</td>
                  <td className="px-3 py-3">{r.providerName}</td>
                  <td className="px-3 py-3">
                    <StatusPill variant={resResourcePillVariant(r.status)}>{RESOURCE_STATUS_LABEL[r.status]}</StatusPill>
                  </td>
                  <td className="px-3 py-3 tabular-nums text-muted">{r.location}</td>
                  <td className="px-3 py-3 text-end">
                    <div className="flex flex-wrap justify-end gap-2">{rowActions(r)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ListPaginationBar total={rows.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1) }} />
      </div>

      <Modal open={registerOpen} title={`注册资源 · Step ${regStep + 1}/3`} onClose={() => setRegisterOpen(false)} closeOnOverlayClick={false} panelClassName="max-w-[800px]">
        <div className="border-b border-divider pb-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="注册步骤">
            {STEPS.map((lab, i) => (
              <button
                key={lab}
                type="button"
                role="tab"
                aria-selected={regStep === i}
                onClick={() => setRegStep(i)}
                className={cn(
                  'flex flex-1 min-w-[120px] cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-center text-[12px] font-semibold transition-colors',
                  regStep === i ? 'border-primary bg-primary-light text-primary' : 'border-divider bg-page text-muted hover:border-primary/40 hover:text-foreground',
                )}
              >
                <span className="me-1 tabular-nums text-[11px] opacity-70">{i + 1}</span>
                {lab}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3 text-[13px]">
          {regStep === 0 ? (
            <>
              <label className="block text-muted">
                资源名称
                <ReqMark />
                <input className="mt-1 w-full rounded-md border border-divider px-3 py-2" value={reg.name} onChange={(e) => setReg((x) => ({ ...x, name: e.target.value }))} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-muted">
                  一级类型
                  <ReqMark />
                  <select
                    className="mt-1 w-full rounded-md border border-divider px-3 py-2"
                    value={reg.level1}
                    onChange={(e) => {
                      const level1 = e.target.value
                      const cat = categoriesForRegister.find((c) => c.name === level1)
                      setReg((x) => ({ ...x, level1, level2: cat?.tags[0] ?? '' }))
                    }}
                  >
                    {categoriesForRegister.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-muted">
                  二级类型
                  <ReqMark />
                  <select className="mt-1 w-full rounded-md border border-divider px-3 py-2" value={reg.level2} onChange={(e) => setReg((x) => ({ ...x, level2: e.target.value }))}>
                    {(categoriesForRegister.find((c) => c.name === reg.level1)?.tags ?? []).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-muted">
                资源简介
                <ReqMark />
                <textarea className="mt-1 w-full rounded-md border border-divider px-3 py-2" rows={2} value={reg.intro} onChange={(e) => setReg((x) => ({ ...x, intro: e.target.value }))} />
              </label>
              <label className="block text-muted">
                提供方（可修改）
                <ReqMark />
                <input className="mt-1 w-full rounded-md border border-divider px-3 py-2" value={reg.providerName} onChange={(e) => setReg((x) => ({ ...x, providerName: e.target.value }))} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-muted">
                  联系人
                  <ReqMark />
                  <input className="mt-1 w-full rounded-md border border-divider px-3 py-2" value={reg.contactName} onChange={(e) => setReg((x) => ({ ...x, contactName: e.target.value }))} />
                </label>
                <label className="text-muted">
                  联系电话
                  <ReqMark />
                  <input className="mt-1 w-full rounded-md border border-divider px-3 py-2" value={reg.phone} onChange={(e) => setReg((x) => ({ ...x, phone: e.target.value }))} />
                </label>
              </div>
              <label className="block text-muted">
                开放时间
                <ReqMark />
                <input className="mt-1 w-full rounded-md border border-divider px-3 py-2" value={reg.hours} onChange={(e) => setReg((x) => ({ ...x, hours: e.target.value }))} />
              </label>
              <p className="rounded-md bg-page px-3 py-2 text-[12px] text-muted">提示：资源类型可在【基础数据 → 资源类型配置】中维护。</p>
            </>
          ) : null}

          {regStep === 1 ? (
            <>
              {!canEditRegStep1 ? (
                <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12px] leading-relaxed text-foreground">
                  您可切换 Tab 预览本步字段。填写请先完成「基础信息与类型」并点击「下一步」，通过校验后即可编辑「能力与资质」。
                </p>
              ) : null}
              <fieldset disabled={!canEditRegStep1} className="min-w-0 space-y-3 border-0 p-0 disabled:opacity-75">
                <legend className="sr-only">能力与资质</legend>
                <label className="block text-muted">
                  能力描述（必填）
                  <ReqMark />
                  <textarea className="mt-1 w-full rounded-md border border-divider px-3 py-2" rows={4} value={reg.capability} onChange={(e) => setReg((x) => ({ ...x, capability: e.target.value }))} />
                </label>
                <div>
                  <p className="text-muted">资质材料上传（选填 · 演示）</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      className="min-w-[200px] flex-1 rounded-md border border-divider px-3 py-2"
                      placeholder="输入文件名后添加"
                      value={fakeFileName}
                      onChange={(e) => setFakeFileName(e.target.value)}
                    />
                    <button type="button" className="rounded-md border border-divider px-3 py-2 font-semibold" onClick={addFakeQualFile}>
                      添加文件
                    </button>
                  </div>
                  <ul className="mt-2 space-y-1 text-[12px]">
                    {reg.qualificationFiles.map((f) => (
                      <li key={f.id} className="flex items-center justify-between rounded border border-divider bg-page px-2 py-1">
                        <span>{f.name}</span>
                        <button type="button" className="text-danger hover:underline" onClick={() => setReg((r) => ({ ...r, qualificationFiles: r.qualificationFiles.filter((x) => x.id !== f.id) }))}>
                          删除
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-muted">适用对象</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                    {OPEN_SCOPE_OPTIONS.map((o) => (
                      <label key={o.v} className="flex items-center gap-1">
                        <input type="radio" checked={reg.scope === o.v} onChange={() => setReg((x) => ({ ...x, scope: o.v }))} />
                        {o.label}
                      </label>
                    ))}
                  </div>
                  {reg.scope === 'whitelist' ? (
                    <label className="mt-2 block text-muted">
                      指定项目方说明
                      <ReqMark />
                      <input className="mt-1 w-full rounded-md border border-divider px-3 py-2" value={reg.scopeWhitelistNote} onChange={(e) => setReg((x) => ({ ...x, scopeWhitelistNote: e.target.value }))} />
                    </label>
                  ) : null}
                </div>
              </fieldset>
            </>
          ) : null}

          {regStep === 2 ? (
            <>
              {!canEditRegStep2 ? (
                <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12px] leading-relaxed text-foreground">
                  您可切换 Tab 预览收费与规则。填写请先完成「能力与资质」并点击「下一步」，通过校验后即可编辑本步骤。
                </p>
              ) : null}
              <fieldset disabled={!canEditRegStep2} className="min-w-0 space-y-3 border-0 p-0 disabled:opacity-75">
                <legend className="sr-only">规则与收费</legend>
                <div>
                  <p className="text-muted">
                    收费规则
                    <ReqMark />
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                    {(['hourly', 'per_use', 'per_project', 'free', 'negotiate'] as const).map((m) => (
                      <label key={m} className="flex items-center gap-1">
                        <input type="radio" checked={reg.feeMode === m} onChange={() => setReg((x) => ({ ...x, feeMode: m }))} />
                        {m === 'hourly' ? '按小时' : m === 'per_use' ? '按次' : m === 'per_project' ? '按项目' : m === 'free' ? '免费' : '议价'}
                      </label>
                    ))}
                  </div>
                  {['hourly', 'per_use', 'per_project'].includes(reg.feeMode) ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <label className="text-muted">
                        价格
                        <ReqMark />
                        <input type="number" className="mt-1 w-full rounded-md border border-divider px-3 py-2" value={reg.priceAmount} onChange={(e) => setReg((x) => ({ ...x, priceAmount: Number(e.target.value) }))} />
                      </label>
                      <label className="text-muted">
                        单位
                        <ReqMark />
                        <input className="mt-1 w-full rounded-md border border-divider px-3 py-2" value={reg.priceUnit} onChange={(e) => setReg((x) => ({ ...x, priceUnit: e.target.value }))} />
                      </label>
                    </div>
                  ) : null}
                </div>
                <label className="block text-muted">
                  备注
                  <input className="mt-1 w-full rounded-md border border-divider px-3 py-2" value={reg.remark} onChange={(e) => setReg((x) => ({ ...x, remark: e.target.value }))} />
                </label>
                <label className="flex items-center gap-2 text-[12px] text-muted">
                  <input type="checkbox" checked={reg.needPlatformReview} onChange={(e) => setReg((x) => ({ ...x, needPlatformReview: e.target.checked }))} />
                  需要平台监管审核
                </label>
                <label className="flex items-center gap-2 text-[12px] text-muted">
                  <input type="checkbox" checked={reg.limitConcurrency} onChange={(e) => setReg((x) => ({ ...x, limitConcurrency: e.target.checked }))} />
                  限制并发使用量（预约冲突检测）
                </label>
                <p className="text-[12px] text-muted">提交后资源将进入「待审核」状态，运营审核通过后将处于「已准入」，上架后项目方可见。</p>
              </fieldset>
            </>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-divider pt-4">
          <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setRegisterOpen(false)}>
            取消
          </button>
          <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => submitRegister(true)}>
            暂存
          </button>
          {regStep > 0 ? (
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={prevStep}>
              上一步
            </button>
          ) : null}
          {regStep < 2 ? (
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-white" onClick={nextStep}>
              下一步
            </button>
          ) : (
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-white" onClick={() => submitRegister(false)}>
              提交审核
            </button>
          )}
        </div>
      </Modal>

      <Modal open={Boolean(audit)} title={audit ? `审核资源：${audit.name}` : '审核资源'} onClose={() => setAudit(null)} closeOnOverlayClick={false} panelClassName="max-w-lg">
        {audit ? (
          <div className="space-y-3 text-[13px]">
            <div className="rounded-md bg-page p-3 text-[12px] leading-relaxed text-muted">
              <p>
                <span className="text-foreground font-semibold">名称：</span>
                {audit.name}
              </p>
              <p>
                <span className="text-foreground font-semibold">类型：</span>
                {audit.level1} / {audit.level2}
              </p>
              <p>
                <span className="text-foreground font-semibold">提供方：</span>
                {audit.providerName}{' '}
                <span className="text-foreground font-semibold">联系人：</span>
                {audit.contactName}
              </p>
              <p>
                <span className="text-foreground font-semibold">能力：</span>
                {audit.capability || '—'}
              </p>
              <p>
                <span className="text-foreground font-semibold">资质材料：</span>
                {audit.qualificationFiles?.length ? audit.qualificationFiles.map((f) => f.name).join('、') : '—'}
              </p>
            </div>
            <label className="block text-muted">
              审核意见
              <textarea className="mt-1 w-full rounded-md border border-divider px-3 py-2" rows={2} value={auditOpinion} onChange={(e) => setAuditOpinion(e.target.value)} />
            </label>
            <div>
              <p className="text-muted">审核结果</p>
              <div className="mt-2 flex flex-wrap gap-4 text-[12px]">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={auditDecision === 'pass'} onChange={() => setAuditDecision('pass')} />
                  通过
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={auditDecision === 'return'} onChange={() => setAuditDecision('return')} />
                  退回修改
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={auditDecision === 'reject'} onChange={() => setAuditDecision('reject')} />
                  拒绝
                </label>
              </div>
            </div>
            <label className="block text-muted">
              退回/拒绝原因（退回或拒绝时必填）
              <textarea className="mt-1 w-full rounded-md border border-divider px-3 py-2" rows={2} value={auditReason} onChange={(e) => setAuditReason(e.target.value)} />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded-md border border-divider px-4 py-2" onClick={() => setAudit(null)}>
                取消
              </button>
              <button type="button" className="rounded-md bg-primary px-4 py-2 font-bold text-white" onClick={submitAudit}>
                提交审核
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(bind)} title="孪生空间绑定" onClose={() => setBind(null)} panelClassName="max-w-md">
        <p className="text-[13px] text-muted">在孪生地图中拾取坐标（演示）：填写绑定位置文案即可。</p>
        <textarea className="mt-3 w-full rounded-md border border-divider px-3 py-2 text-[13px]" rows={3} value={bindInput} onChange={(e) => setBindInput(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md border border-divider px-3 py-2 text-[13px]" onClick={() => setBind(null)}>
            取消
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 text-[13px] font-bold text-white"
            onClick={() => {
              if (bind) ctx.updateResource(bind.id, { twinBindNote: bindInput, location: bindInput.slice(0, 16) || bind.location })
              setBind(null)
              toast.show('绑定已保存（演示）', 'success')
            }}
          >
            保存
          </button>
        </div>
      </Modal>

      <Modal open={Boolean(deleteTarget)} title="删除资源" onClose={() => setDeleteTarget(null)} panelClassName="max-w-md">
        {deleteTarget ? (
          <div className="space-y-3 text-[13px]">
            <p>
              确定删除草稿资源 <span className="font-bold">{deleteTarget.name}</span> 吗？此操作不可恢复（演示）。
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded-md border border-divider px-3 py-2" onClick={() => setDeleteTarget(null)}>
                取消
              </button>
              <button
                type="button"
                className="rounded-md bg-danger px-3 py-2 font-bold text-white"
                onClick={() => {
                  if (!deleteTarget) return
                  if (deleteTarget.status === 'draft' || deleteTarget.status === 'pending_review') {
                    const ok = ctx.deleteResource(deleteTarget.id)
                    toast.show(ok ? '已删除' : '删除失败', ok ? 'success' : 'warning')
                  }
                  setDeleteTarget(null)
                }}
              >
                删除
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
