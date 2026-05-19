import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import type { EntityTab } from './innovationTypes'
import { entityLabel, useInnovationDemo } from './InnovationDemoContext'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import type { FundingRow, HatchIncubationType, PipelineItem, TeamArchiveRow } from '../hatch/hatchTypes'

const DRAFT_KEY = 'pharma-incubation-register-draft-v1'
const MAX_FILE_BYTES = 20 * 1024 * 1024

const ENTITY_TABS: { key: EntityTab; label: string }[] = [
  { key: 'enterprise', label: '企业' },
  { key: 'university', label: '高校' },
  { key: 'institute', label: '研究所' },
  { key: 'hospital', label: '医院' },
]

const ORG_HINT: Record<EntityTab, string> = {
  enterprise: '请填写营业执照上的企业全称',
  university: '请填写院系或科研平台全称',
  institute: '请填写研究所法人单位或下属实验室全称',
  hospital: '请填写医院及科室全称',
}

const TRACKS = ['细胞治疗', '创新药', '医疗器械', 'AI制药', '合成生物', '基因治疗', '其他'] as const
const PHASES = ['概念验证', '初创', '成长期', '产业化'] as const
const INTENT_OPTS = ['实体入孵', '虚拟入孵', '服务商认证', '联合孵化'] as const
const PIPELINE_STAGES = ['概念验证', '临床前', 'I期临床', 'II期临床', 'III期临床', '上市申请'] as const

const RESOURCE_OPTIONS = [
  { id: 'lab', label: '共享实验室' },
  { id: 'cell', label: '细胞房' },
  { id: 'flow', label: '流式细胞仪' },
  { id: 'pcr', label: 'PCR仪' },
  { id: 'expert', label: '专家咨询（基因编辑方向）' },
  { id: 'fund', label: '启动资金' },
] as const

const SERVICE_OPTIONS = [
  { id: 'test', label: '检测服务' },
  { id: 'crd', label: '研发外包' },
  { id: 'data', label: '数据分析' },
] as const

const STEPS = [
  { title: '主体与基础信息', short: '基础' },
  { title: '资料上传', short: '资料' },
  { title: '团队/管线/融资', short: '多维' },
  { title: '资源需求', short: '需求' },
  { title: '提交确认', short: '确认' },
] as const

type FileSlot = { id: string; name: string; size: number }

type IpRow = { id: string; patentName: string; patentNo: string; grantDate: string }

type WizardDraft = {
  step: number
  entityTab: EntityTab
  projectName: string
  orgFullName: string
  creditCode: string
  estYear: string
  estMonth: string
  address: string
  contact: string
  phone: string
  email: string
  track: string
  frontierTech: boolean
  phase: string
  intent: string
  files: {
    qualification: FileSlot[]
    intro: FileSlot[]
    bp: FileSlot[]
    tech: FileSlot[]
    ipProof: FileSlot[]
    finance: FileSlot[]
  }
  pipeline: PipelineItem[]
  team: TeamArchiveRow[]
  funding: FundingRow[]
  ipRecords: IpRow[]
  resourceSel: Record<string, boolean>
  resourceOther: string
  serviceSel: Record<string, boolean>
  serviceOther: string
  demandNote: string
  pledge: boolean
  detailOpen: boolean
}

function newId() {
  return `w-${Math.random().toString(36).slice(2, 10)}`
}

function emptyDraft(): WizardDraft {
  const rs: Record<string, boolean> = {}
  RESOURCE_OPTIONS.forEach((r) => {
    rs[r.id] = false
  })
  const ss: Record<string, boolean> = {}
  SERVICE_OPTIONS.forEach((s) => {
    ss[s.id] = false
  })
  return {
    step: 0,
    entityTab: 'enterprise',
    projectName: '',
    orgFullName: '',
    creditCode: '',
    estYear: String(new Date().getFullYear() - 3),
    estMonth: '06',
    address: '',
    contact: '',
    phone: '',
    email: '',
    track: '细胞治疗',
    frontierTech: false,
    phase: '概念验证',
    intent: '实体入孵',
    files: { qualification: [], intro: [], bp: [], tech: [], ipProof: [], finance: [] },
    pipeline: [],
    team: [],
    funding: [],
    ipRecords: [],
    resourceSel: rs,
    resourceOther: '',
    serviceSel: ss,
    serviceOther: '',
    demandNote: '',
    pledge: false,
    detailOpen: false,
  }
}

function creditFormatOk(code: string) {
  return /^[0-9A-Z]{18}$/i.test(code.trim())
}

function phoneValid(phone: string) {
  const t = phone.trim()
  if (/^1[3-9]\d{9}$/.test(t)) return true
  if (/^0\d{2,3}-?\d{7,8}(-\d{1,6})?$/.test(t)) return true
  return false
}

function emailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function mapIntentToHatch(intent: string): HatchIncubationType {
  if (intent.includes('虚拟')) return '虚拟'
  if (intent.includes('服务')) return '服务商'
  return '实体'
}

function maskPhone(p: string) {
  const t = p.trim()
  if (/^1\d{10}$/.test(t)) return t.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  return t || '—'
}

function buildResourceDemand(d: WizardDraft): string {
  const parts: string[] = RESOURCE_OPTIONS.filter((r) => d.resourceSel[r.id]).map((r) => r.label)
  if (d.resourceOther.trim()) parts.push(d.resourceOther.trim())
  const svcs: string[] = SERVICE_OPTIONS.filter((s) => d.serviceSel[s.id]).map((s) => s.label)
  if (d.serviceOther.trim()) svcs.push(`服务：${d.serviceOther.trim()}`)
  let s = parts.length ? `空间与设备：${parts.join('、')}` : ''
  if (svcs.length) s += (s ? '；' : '') + svcs.join('、')
  if (d.demandNote.trim()) s += (s ? '。' : '') + d.demandNote.trim()
  return s || '—'
}

function StepRail({
  step,
  step0Complete,
  onPick,
}: {
  step: number
  step0Complete: boolean
  onPick: (idx: number) => void
}) {
  return (
    <div className="rounded-xl border border-divider bg-page px-2 py-3 sm:px-4">
      <p className="mb-2 px-1 text-[12px] text-muted sm:hidden">左右滑动查看全部步骤，点击切换</p>
      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1 sm:mx-0 sm:flex-wrap sm:justify-between sm:overflow-visible sm:pb-0">
        {STEPS.map((meta, idx) => {
          const visited = idx < step
          const active = idx === step
          const peekOnly = !step0Complete && idx >= 1
          return (
            <div key={meta.title} className="flex shrink-0 items-stretch sm:min-w-0 sm:flex-1">
              {idx > 0 ? <div className="mx-0.5 hidden w-px shrink-0 self-stretch bg-divider sm:mx-1 sm:block" aria-hidden /> : null}
              <button
                type="button"
                onClick={() => onPick(idx)}
                title={peekOnly ? '预览本步（需先完成第一步后方可填写）' : `前往：${meta.title}`}
                className={cn(
                  'flex w-[128px] flex-col items-center gap-2 rounded-lg px-2 py-2.5 text-start transition-colors sm:w-auto sm:min-w-0 sm:flex-1 sm:flex-row sm:items-center sm:gap-2 sm:px-3',
                  active && 'bg-primary/10 ring-1 ring-primary/30',
                  !active && visited && 'bg-page',
                  !active && !visited && 'hover:bg-surface',
                  peekOnly && !active && 'opacity-90',
                )}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold',
                    active && 'bg-[#1E6DFF] text-white',
                    !active && visited && step0Complete && 'bg-[#00C9A7] text-white',
                    !active && visited && !step0Complete && 'bg-page text-foreground ring-1 ring-divider',
                    !active && !visited && 'bg-divider text-muted',
                  )}
                >
                  {visited && step0Complete ? '✓' : idx + 1}
                </span>
                <div className="min-w-0 flex-1 text-center sm:text-start">
                  <p className={cn('text-[12px] font-semibold leading-snug sm:text-[13px]', active ? 'text-primary' : 'text-foreground')}>{meta.title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted">
                    {meta.short}
                    {peekOnly ? ' · 预览' : ''}
                  </p>
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Labeled({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[120px_1fr] sm:items-center sm:gap-3">
      <label className="text-[13px] text-muted">
        {required ? <span className="text-[#F44336]">*</span> : null}
        {label}
      </label>
      <div className="min-w-0 flex-1 max-w-full sm:max-w-[min(520px,100%)]">{children}</div>
    </div>
  )
}

export default function IncubationProjectRegisterWizardPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const opsProxy = searchParams.get('ops') === '1'
  const fromPool = searchParams.get('from') === 'pool'

  const { projects, registerNewProject } = useInnovationDemo()
  const { archives, createArchiveFromIncubationRegister } = useHatchMgmt()

  const [draft, setDraft] = useState<WizardDraft>(() => emptyDraft())
  const [missingModal, setMissingModal] = useState<string[] | null>(null)

  const [pipeModal, setPipeModal] = useState<null | Partial<PipelineItem> & { _editId?: string }>(null)
  const [teamModal, setTeamModal] = useState<null | Partial<TeamArchiveRow> & { _editId?: string }>(null)
  const [fundModal, setFundModal] = useState<null | Partial<FundingRow> & { _editId?: string }>(null)
  const [ipModal, setIpModal] = useState<null | Partial<IpRow> & { _editId?: string }>(null)
  const [previewFile, setPreviewFile] = useState<FileSlot | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const p = JSON.parse(raw) as Partial<WizardDraft>
        if (p && typeof p.step === 'number') {
          const base = emptyDraft()
          setDraft({
            ...base,
            ...p,
            files: p.files ?? base.files,
            resourceSel: { ...base.resourceSel, ...p.resourceSel },
            serviceSel: { ...base.serviceSel, ...p.serviceSel },
          })
        }
      }
    } catch {
      /* ignore */
    }
  }, [])

  const persistDraft = useCallback((d: WizardDraft) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    } catch {
      /* ignore */
    }
  }, [])

  const creditDuplicate = useMemo(() => {
    const c = draft.creditCode.trim().toUpperCase().replace(/\s/g, '')
    if (c.length !== 18) return false
    return (
      archives.some((a) => a.creditCode.replace(/\s/g, '').toUpperCase() === c) ||
      projects.some((p) => p.creditCode.replace(/\s/g, '').toUpperCase() === c)
    )
  }, [draft.creditCode, archives, projects])

  const step0Ok = useMemo(() => {
    if (!draft.projectName.trim() || !draft.orgFullName.trim()) return false
    if (!creditFormatOk(draft.creditCode) || creditDuplicate) return false
    if (!draft.estYear || !draft.estMonth) return false
    if (!draft.address.trim() || !draft.contact.trim()) return false
    if (!phoneValid(draft.phone) || !emailValid(draft.email)) return false
    if (!draft.track || !draft.phase || !draft.intent) return false
    return true
  }, [draft, creditDuplicate])

  const peekLocked = !step0Ok && draft.step >= 1

  const pickStep = useCallback((idx: number) => {
    setDraft((d) => ({ ...d, step: idx }))
  }, [])

  const step1Ok = draft.files.qualification.length > 0 && draft.files.bp.length > 0
  const step2Ok = draft.pipeline.length >= 1 && draft.team.length >= 1 && draft.funding.length >= 1
  const step3Ok =
    RESOURCE_OPTIONS.some((r) => draft.resourceSel[r.id]) ||
    draft.resourceOther.trim().length > 0

  const canNext = (s: number) => {
    if (s === 0) return step0Ok
    if (s === 1) return step1Ok
    if (s === 2) return step2Ok
    if (s === 3) return step3Ok
    return true
  }

  const collectSubmitErrors = (): string[] => {
    const errs: string[] = []
    if (!step0Ok) errs.push('步骤一：请完善主体与基础信息（含有效统一社会信用代码）')
    if (!step1Ok) errs.push('步骤二：请上传主体资质与商业计划书/研究计划')
    if (!step2Ok) errs.push('步骤三：产品管线、核心团队、融资记录请至少各填一条')
    if (!step3Ok) errs.push('步骤四：请至少选择一项资源需求或填写「其他」')
    if (!draft.pledge) errs.push('步骤五：请勾选真实性承诺')
    if (creditDuplicate) errs.push('该统一社会信用代码已存在，请直接登录或联系运营')
    return errs
  }

  function stash() {
    persistDraft(draft)
    toast.show('已暂存到本地草稿箱（演示）', 'success')
  }

  function onPickFiles(slot: keyof WizardDraft['files'], list: FileList | null) {
    if (!list?.length) return
    const next: FileSlot[] = []
    for (let i = 0; i < list.length; i++) {
      const f = list[i]
      if (f.size > MAX_FILE_BYTES) {
        toast.show(`「${f.name}」超过 20MB 上限`, 'warning')
        continue
      }
      const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
      const ok = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(ext)
      if (!ok) {
        toast.show(`不支持的格式：${f.name}`, 'warning')
        continue
      }
      next.push({ id: newId(), name: f.name, size: f.size })
      toast.show(`「${f.name}」上传成功，病毒扫描任务已入队（演示）`, 'info')
    }
    if (!next.length) return
    setDraft((d) => ({
      ...d,
      files: { ...d.files, [slot]: slot === 'tech' || slot === 'ipProof' || slot === 'finance' ? [...d.files[slot], ...next] : next },
    }))
  }

  function removeFile(slot: keyof WizardDraft['files'], id: string) {
    setDraft((d) => ({
      ...d,
      files: { ...d.files, [slot]: d.files[slot].filter((x) => x.id !== id) },
    }))
  }

  function submitAll() {
    const errs = collectSubmitErrors()
    if (errs.length) {
      setMissingModal(errs)
      return
    }
    const hatchType = mapIntentToHatch(draft.intent)
    const tags = [draft.track, draft.phase, ...(draft.frontierTech ? (['前沿技术'] as const) : [])].filter(Boolean) as string[]

    let resourceDemand = buildResourceDemand(draft)
    if (draft.ipRecords.length) {
      resourceDemand += `。知识产权：${draft.ipRecords.map((r) => `${r.patentName}（${r.patentNo}）`).join('；')}`
    }

    createArchiveFromIncubationRegister({
      name: draft.projectName.trim(),
      entityTypeLabel: entityLabel(draft.entityTab),
      incubationType: hatchType,
      creditCode: draft.creditCode.trim().toUpperCase(),
      address: draft.address.trim(),
      contact: draft.contact.trim(),
      phone: draft.phone.trim(),
      pipeline: draft.pipeline,
      team: draft.team,
      funding: draft.funding,
      resourceDemand,
      tags,
    })

    const allNames = [
      ...draft.files.qualification,
      ...draft.files.intro,
      ...draft.files.bp,
      ...draft.files.tech,
      ...draft.files.ipProof,
      ...draft.files.finance,
    ].map((f) => f.name)

    registerNewProject({
      entityTab: draft.entityTab,
      name: draft.projectName.trim(),
      orgFullName: draft.orgFullName.trim(),
      creditCode: draft.creditCode.trim().toUpperCase(),
      contact: draft.contact.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      phase: draft.phase,
      intentLabel: draft.intent,
      attachmentFileNames: allNames.length ? allNames : undefined,
      teamCount: draft.team.length,
      track: draft.track,
      frontierTech: draft.frontierTech,
      address: draft.address.trim(),
      opsProxy,
      checklistOverride: [
        { label: '主体资质证明', ok: draft.files.qualification.length > 0 },
        { label: '商业计划书/研究计划', ok: draft.files.bp.length > 0 },
        { label: '技术资料', ok: draft.files.tech.length > 0 },
        { label: '核心团队', ok: draft.team.length > 0 },
      ],
    })

    localStorage.removeItem(DRAFT_KEY)
    toast.show(opsProxy ? '已建档：科创策源记录已创建，可前往入孵签约' : '提交成功：已生成入孵档案（待审核）与策源候选项目', 'success')
    navigate('/innovation/applicant/projects')
  }

  function aiRecommend() {
    setDraft((d) => ({
      ...d,
      resourceSel: { ...d.resourceSel, lab: true, cell: true, flow: true },
    }))
    toast.show('已根据赛道/阶段勾选常用资源（演示 · V2）', 'success')
  }

  function aiBpParse() {
    toast.show('AI 智能解析：将在 V2 从 BP 自动回填管线与团队（演示占位）', 'info')
  }

  function aiScreening() {
    toast.show('AI 初筛评分：综合分 86 · 优秀（演示占位，结果将写入运营侧）', 'success')
  }

  const years = useMemo(() => {
    const y = new Date().getFullYear()
    return Array.from({ length: y - 1989 }, (_, i) => String(y - i))
  }, [])

  return (
    <div className="mx-auto max-w-[min(1180px,calc(100vw-1.5rem))] space-y-5 pb-12">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">科创策源 · 入孵申请</p>
          <h1 className="mt-1 text-[20px] font-bold text-foreground">新建项目（入孵申请）</h1>
          <p className="mt-2 max-w-[720px] text-[13px] text-muted">
            分步填写项目资料、团队、管线、融资与资源需求；提交后生成<strong>入孵项目档案（待审核）</strong>并同步<strong>策源候选项目</strong>。
            {opsProxy ? <span className="ms-1 text-primary">当前为运营代录模式。</span> : null}
          </p>
        </div>
        <div className="text-end text-[12px] text-muted">
          Step {draft.step + 1} / 5
          <div className="mt-1 flex flex-col items-end gap-1">
            {fromPool ? (
              <Link to="/innovation/ops/pool" className="text-primary hover:underline">
                返回候选项目池
              </Link>
            ) : null}
            <Link to="/innovation/applicant/projects" className="text-primary hover:underline">
              返回我的项目
            </Link>
          </div>
        </div>
      </header>

      <StepRail step={draft.step} step0Complete={step0Ok} onPick={pickStep} />

      {peekLocked ? (
        <div className="rounded-lg border border-warning/40 bg-[#FF8A34]/10 px-4 py-3 text-[13px] leading-relaxed text-foreground ring-1 ring-warning/20">
          <span className="font-bold text-[#FF8A34]">预览模式</span>：请先完成「主体与基础信息」全部必填项后，方可编辑本步及后续步骤。当前可查看各步需准备的材料与字段。
        </div>
      ) : (
        <p className="rounded-lg border border-divider bg-page/80 px-4 py-2.5 text-[12px] text-muted">
          提示：可随时点击上方步骤条查看任一步骤；未完成第一步时，第 2–5 步仅支持浏览。
        </p>
      )}

      {draft.step === 0 ? (
        <section className="rounded-xl border border-divider bg-surface p-5 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <div>
              <p className="text-[13px] font-bold text-foreground">主体类型（必选）</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ENTITY_TABS.map((e) => (
                  <button
                    key={e.key}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, entityTab: e.key }))}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors',
                      draft.entityTab === e.key ? 'border-[#1E6DFF] bg-primary/10 text-primary' : 'border-divider bg-page text-foreground hover:border-primary/40',
                    )}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-muted">提示：不同主体需提供不同资质；{ORG_HINT[draft.entityTab]}</p>
            </div>
            <div className="space-y-3">
              <Labeled label="项目名称" required>
                <input
                  className="w-full rounded-md border border-divider px-3 py-2 text-[13px]"
                  value={draft.projectName}
                  onChange={(e) => setDraft((d) => ({ ...d, projectName: e.target.value }))}
                />
              </Labeled>
              <Labeled label="主体全称" required>
                <input
                  className="w-full rounded-md border border-divider px-3 py-2 text-[13px]"
                  placeholder={ORG_HINT[draft.entityTab]}
                  value={draft.orgFullName}
                  onChange={(e) => setDraft((d) => ({ ...d, orgFullName: e.target.value }))}
                />
              </Labeled>
              <Labeled label="统一社会信用代码" required>
                <input
                  className="w-full rounded-md border border-divider px-3 py-2 font-mono text-[13px] uppercase"
                  maxLength={18}
                  value={draft.creditCode}
                  onChange={(e) => setDraft((d) => ({ ...d, creditCode: e.target.value.toUpperCase() }))}
                />
                {draft.creditCode.length > 0 && !creditFormatOk(draft.creditCode) ? (
                  <p className="mt-1 text-[12px] text-[#F44336]">需为 18 位数字或大写字母</p>
                ) : null}
                {creditDuplicate ? <p className="mt-1 text-[12px] text-[#F44336]">该企业已注册，请直接登录或联系运营</p> : null}
              </Labeled>
              <div className="grid gap-3 sm:grid-cols-[120px_1fr] sm:items-end">
                <span className="text-[13px] text-muted">
                  <span className="text-[#F44336]">*</span>成立年月
                </span>
                <div className="flex max-w-full flex-wrap gap-2 sm:max-w-[min(520px,100%)]">
                  <select className="rounded-md border px-2 py-2 text-[13px]" value={draft.estYear} onChange={(e) => setDraft((d) => ({ ...d, estYear: e.target.value }))}>
                    {years.map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>
                  <select className="rounded-md border px-2 py-2 text-[13px]" value={draft.estMonth} onChange={(e) => setDraft((d) => ({ ...d, estMonth: e.target.value }))}>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                      <option key={m} value={m}>
                        {m} 月
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Labeled label="注册地址" required>
                <input className="w-full rounded-md border px-3 py-2 text-[13px]" value={draft.address} onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))} />
              </Labeled>
              <Labeled label="联系人" required>
                <input className="w-full rounded-md border px-3 py-2 text-[13px]" value={draft.contact} onChange={(e) => setDraft((d) => ({ ...d, contact: e.target.value }))} />
              </Labeled>
              <Labeled label="联系电话" required>
                <input className="w-full rounded-md border px-3 py-2 text-[13px]" value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
              </Labeled>
              <Labeled label="电子邮箱" required>
                <input className="w-full rounded-md border px-3 py-2 text-[13px]" value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} />
              </Labeled>
              <Labeled label="项目赛道" required>
                <select className="w-full rounded-md border px-3 py-2 text-[13px]" value={draft.track} onChange={(e) => setDraft((d) => ({ ...d, track: e.target.value }))}>
                  {TRACKS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Labeled>
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted">
                <input type="checkbox" checked={draft.frontierTech} onChange={(e) => setDraft((d) => ({ ...d, frontierTech: e.target.checked }))} />
                前沿技术？
              </label>
              <Labeled label="项目阶段" required>
                <select className="w-full rounded-md border px-3 py-2 text-[13px]" value={draft.phase} onChange={(e) => setDraft((d) => ({ ...d, phase: e.target.value }))}>
                  {PHASES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Labeled>
              <Labeled label="入孵意向" required>
                <select className="w-full rounded-md border px-3 py-2 text-[13px]" value={draft.intent} onChange={(e) => setDraft((d) => ({ ...d, intent: e.target.value }))}>
                  {INTENT_OPTS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Labeled>
            </div>
          </div>
        </section>
      ) : null}

      {draft.step === 1 ? (
        <section className="space-y-4 rounded-xl border border-divider bg-surface p-5 shadow-sm">
          <fieldset disabled={peekLocked} className="m-0 min-w-0 space-y-4 border-0 p-0">
          <p className="text-[13px] font-bold">资料上传</p>
          <p className="text-[12px] text-muted">支持 jpg / png / pdf / doc / docx / ppt / pptx，单个 ≤ 20MB。完成第一步后，必传项未齐时无法进入下一步。</p>
          {(
            [
              ['qualification', '主体资质证明', true],
              ['intro', '项目介绍', false],
              ['bp', '商业计划书/研究计划', true],
              ['tech', '技术资料', false],
              ['ipProof', '知识产权资料', false],
              ['finance', '融资/资金资料', false],
            ] as const
          ).map(([key, label, req]) => (
            <div key={key} className="flex flex-wrap items-center gap-3 border-b border-divider py-3 last:border-0">
              <div className="min-w-[140px] text-[13px]">
                {req ? <span className="text-[#F44336]">*</span> : null}
                {label}
              </div>
              <label className="cursor-pointer rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-[12px] font-semibold text-primary hover:bg-primary/10">
                选择文件
                <input
                  type="file"
                  className="hidden"
                  multiple={key === 'tech' || key === 'ipProof' || key === 'finance'}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => onPickFiles(key, e.target.files)}
                />
              </label>
              <div className="flex flex-1 flex-wrap gap-2 text-[12px] text-muted">
                {draft.files[key].length === 0 ? (
                  <span className={req ? 'text-[#F44336]' : ''}>未上传</span>
                ) : (
                  draft.files[key].map((f) => (
                    <span key={f.id} className="inline-flex items-center gap-1 rounded-full bg-page px-2 py-1 ring-1 ring-divider">
                      {f.name}
                      <button type="button" className="text-primary hover:underline" onClick={() => setPreviewFile(f)}>
                        预览
                      </button>
                      <button type="button" className="text-[#F44336] hover:underline" onClick={() => removeFile(key, f.id)}>
                        删除
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold hover:bg-page" onClick={aiBpParse}>
              ✨ 上传 BP 自动提取（V2）
            </button>
          </div>
          {!step1Ok ? <p className="text-[12px] text-[#F44336]">资料完整性：请补齐必传项（标*）</p> : <p className="text-[12px] text-[#00C9A7]">必传项已满足</p>}
          </fieldset>
        </section>
      ) : null}

      {draft.step === 2 ? (
        <section className="space-y-6 rounded-xl border border-divider bg-surface p-5 shadow-sm">
          <fieldset disabled={peekLocked} className="m-0 min-w-0 space-y-6 border-0 p-0">
          {[
            ['产品管线', 'pipeline', draft.pipeline, () => setPipeModal({ productName: '', indication: '', stage: '临床前', milestone: '' })] as const,
            ['核心团队', 'team', draft.team, () => setTeamModal({ name: '', title: '', bio: '' })] as const,
            ['融资记录', 'funding', draft.funding, () => setFundModal({ round: '', amount: '', investor: '', date: '' })] as const,
          ].map(([title, kind, rows, onAdd]) => (
            <div key={kind}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold">{title}</p>
                <button type="button" className="rounded-md bg-[#1E6DFF] px-3 py-1.5 text-[12px] font-bold text-white hover:opacity-95" onClick={onAdd}>
                  ＋ 添加{kind === 'pipeline' ? '管线' : kind === 'team' ? '成员' : '记录'}
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-divider">
                <table className="min-w-full text-left text-[13px]">
                  <thead className="border-b border-divider bg-page text-[12px] text-muted">
                    {kind === 'pipeline' ? (
                      <tr>
                        <th className="px-3 py-2">产品名称</th>
                        <th className="px-3 py-2">适应症</th>
                        <th className="px-3 py-2">研发阶段</th>
                        <th className="px-3 py-2 text-end">操作</th>
                      </tr>
                    ) : null}
                    {kind === 'team' ? (
                      <tr>
                        <th className="px-3 py-2">姓名</th>
                        <th className="px-3 py-2">职务</th>
                        <th className="px-3 py-2">简介</th>
                        <th className="px-3 py-2 text-end">操作</th>
                      </tr>
                    ) : null}
                    {kind === 'funding' ? (
                      <tr>
                        <th className="px-3 py-2">轮次</th>
                        <th className="px-3 py-2">金额</th>
                        <th className="px-3 py-2">投资机构</th>
                        <th className="px-3 py-2">日期</th>
                        <th className="px-3 py-2 text-end">操作</th>
                      </tr>
                    ) : null}
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {kind === 'pipeline'
                      ? (rows as PipelineItem[]).map((r) => (
                          <tr key={r.id}>
                            <td className="px-3 py-2">{r.productName}</td>
                            <td className="px-3 py-2">{r.indication}</td>
                            <td className="px-3 py-2">{r.stage}</td>
                            <td className="px-3 py-2 text-end">
                              <button type="button" className="text-primary hover:underline" onClick={() => setPipeModal({ ...r, _editId: r.id })}>
                                编辑
                              </button>
                              <button
                                type="button"
                                className="ms-2 text-[#F44336] hover:underline"
                                onClick={() => setDraft((d) => ({ ...d, pipeline: d.pipeline.filter((x) => x.id !== r.id) }))}
                              >
                                删除
                              </button>
                            </td>
                          </tr>
                        ))
                      : null}
                    {kind === 'team'
                      ? (rows as TeamArchiveRow[]).map((r) => (
                          <tr key={r.id}>
                            <td className="px-3 py-2">{r.name}</td>
                            <td className="px-3 py-2">{r.title}</td>
                            <td className="max-w-[240px] truncate px-3 py-2">{r.bio}</td>
                            <td className="px-3 py-2 text-end">
                              <button type="button" className="text-primary hover:underline" onClick={() => setTeamModal({ ...r, _editId: r.id })}>
                                编辑
                              </button>
                              <button
                                type="button"
                                className="ms-2 text-[#F44336] hover:underline"
                                onClick={() => setDraft((d) => ({ ...d, team: d.team.filter((x) => x.id !== r.id) }))}
                              >
                                删除
                              </button>
                            </td>
                          </tr>
                        ))
                      : null}
                    {kind === 'funding'
                      ? (rows as FundingRow[]).map((r) => (
                          <tr key={r.id}>
                            <td className="px-3 py-2">{r.round}</td>
                            <td className="px-3 py-2">{r.amount}</td>
                            <td className="px-3 py-2">{r.investor}</td>
                            <td className="px-3 py-2">{r.date}</td>
                            <td className="px-3 py-2 text-end">
                              <button type="button" className="text-primary hover:underline" onClick={() => setFundModal({ ...r, _editId: r.id })}>
                                编辑
                              </button>
                              <button
                                type="button"
                                className="ms-2 text-[#F44336] hover:underline"
                                onClick={() => setDraft((d) => ({ ...d, funding: d.funding.filter((x) => x.id !== r.id) }))}
                              >
                                删除
                              </button>
                            </td>
                          </tr>
                        ))
                      : null}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-bold">知识产权（非必填）</p>
              <button type="button" className="rounded-md border px-3 py-1.5 text-[12px] font-semibold" onClick={() => setIpModal({ patentName: '', patentNo: '', grantDate: '' })}>
                ＋ 添加
              </button>
            </div>
            <ul className="space-y-1 text-[13px] text-muted">
              {draft.ipRecords.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-divider px-3 py-2">
                  <span>
                    {r.patentName} · {r.patentNo} · {r.grantDate}
                  </span>
                  <span>
                    <button type="button" className="text-primary hover:underline" onClick={() => setIpModal({ ...r, _editId: r.id })}>
                      编辑
                    </button>
                    <button type="button" className="ms-2 text-[#F44336] hover:underline" onClick={() => setDraft((d) => ({ ...d, ipRecords: d.ipRecords.filter((x) => x.id !== r.id) }))}>
                      删除
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {!step2Ok ? <p className="text-[12px] text-[#F44336]">请保证产品管线、核心团队、融资记录至少各 1 条</p> : null}
          </fieldset>
        </section>
      ) : null}

      {draft.step === 3 ? (
        <section className="space-y-5 rounded-xl border border-divider bg-surface p-5 shadow-sm">
          <fieldset disabled={peekLocked} className="m-0 min-w-0 space-y-5 border-0 p-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-bold">资源需求（多选 + 自定义）</p>
            <button type="button" className="rounded-md border border-primary/40 px-3 py-1.5 text-[12px] font-semibold text-primary hover:bg-primary/5" onClick={aiRecommend}>
              ✨ AI 推荐需求
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {RESOURCE_OPTIONS.map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={draft.resourceSel[r.id]}
                  onChange={(e) => setDraft((d) => ({ ...d, resourceSel: { ...d.resourceSel, [r.id]: e.target.checked } }))}
                />
                {r.label}
              </label>
            ))}
          </div>
          <label className="block text-[13px] text-muted">
            其他
            <input className="mt-1 w-full max-w-[320px] rounded-md border px-3 py-2 text-[13px]" value={draft.resourceOther} onChange={(e) => setDraft((d) => ({ ...d, resourceOther: e.target.value }))} />
          </label>
          <p className="text-[13px] font-bold">服务能力（选填）</p>
          <div className="flex flex-wrap gap-3">
            {SERVICE_OPTIONS.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={draft.serviceSel[s.id]}
                  onChange={(e) => setDraft((d) => ({ ...d, serviceSel: { ...d.serviceSel, [s.id]: e.target.checked } }))}
                />
                {s.label}
              </label>
            ))}
          </div>
          <label className="block text-[13px] text-muted">
            服务其他
            <input className="mt-1 w-full max-w-[320px] rounded-md border px-3 py-2 text-[13px]" value={draft.serviceOther} onChange={(e) => setDraft((d) => ({ ...d, serviceOther: e.target.value }))} />
          </label>
          <label className="block text-[13px] text-muted">
            需求说明（可选）
            <textarea className="mt-1 w-full rounded-md border px-3 py-2 text-[13px]" rows={3} value={draft.demandNote} onChange={(e) => setDraft((d) => ({ ...d, demandNote: e.target.value }))} />
          </label>
          {!step3Ok ? <p className="text-[12px] text-[#F44336]">请至少选择一项资源需求或填写「其他」</p> : null}
          </fieldset>
        </section>
      ) : null}

      {draft.step === 4 ? (
        <section className="space-y-4 rounded-xl border border-divider bg-surface p-5 shadow-sm">
          <fieldset disabled={peekLocked} className="m-0 min-w-0 space-y-4 border-0 p-0">
          <p className="text-[13px] font-bold">请核对以下信息</p>
          <div className="rounded-lg border border-divider bg-page p-4 text-[13px] leading-relaxed">
            <p>
              <span className="text-muted">项目名称：</span>
              {draft.projectName || '—'}
            </p>
            <p>
              <span className="text-muted">主体类型：</span>
              {entityLabel(draft.entityTab)}
            </p>
            <p>
              <span className="text-muted">统一社会信用代码：</span>
              {draft.creditCode || '—'}
            </p>
            <p>
              <span className="text-muted">联系人：</span>
              {draft.contact} · <span className="text-muted">电话：</span>
              {maskPhone(draft.phone)}
            </p>
            <p>
              <span className="text-muted">资料：</span>已上传{' '}
              {draft.files.qualification.length +
                draft.files.intro.length +
                draft.files.bp.length +
                draft.files.tech.length +
                draft.files.ipProof.length +
                draft.files.finance.length}{' '}
              个文件
            </p>
            <p>
              <span className="text-muted">团队：</span>
              {draft.team.length} 人 · <span className="text-muted">管线：</span>
              {draft.pipeline.length} 条 · <span className="text-muted">融资：</span>
              {draft.funding.length} 轮
            </p>
            <p>
              <span className="text-muted">资源需求：</span>
              {buildResourceDemand(draft)}
            </p>
            <button type="button" className="mt-2 text-primary hover:underline" onClick={() => setDraft((d) => ({ ...d, detailOpen: !d.detailOpen }))}>
              {draft.detailOpen ? '收起' : '查看'}详情
            </button>
            {draft.detailOpen ? (
              <pre className="mt-2 max-h-[240px] overflow-auto rounded border bg-surface p-2 text-[11px] text-muted">{JSON.stringify(draft, null, 2)}</pre>
            ) : null}
          </div>
          <button type="button" className="rounded-md border px-3 py-2 text-[12px] font-semibold" onClick={aiScreening}>
            ✨ AI 综合评估（可选）
          </button>
          <label className="flex cursor-pointer items-start gap-2 text-[13px]">
            <input type="checkbox" checked={draft.pledge} onChange={(e) => setDraft((d) => ({ ...d, pledge: e.target.checked }))} className="mt-1" />
            <span>
              <span className="text-[#F44336]">*</span>
              本人承诺所填信息真实有效，如有虚假愿承担相应责任。
            </span>
          </label>
          </fieldset>
        </section>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="rounded-lg border border-divider bg-surface px-4 py-2 text-[13px] font-semibold" onClick={stash}>
          暂存
        </button>
        <button
          type="button"
          className="rounded-lg border border-divider px-4 py-2 text-[13px] font-semibold"
          disabled={draft.step === 0}
          onClick={() => setDraft((d) => ({ ...d, step: Math.max(0, d.step - 1) }))}
        >
          上一步
        </button>
        {draft.step < 4 ? (
          <button
            type="button"
            disabled={peekLocked ? false : !canNext(draft.step)}
            className="rounded-lg bg-[#1E6DFF] px-5 py-2 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
            onClick={() => {
              if (peekLocked) {
                setDraft((d) => ({ ...d, step: Math.min(4, d.step + 1) }))
                return
              }
              if (!canNext(draft.step)) {
                toast.show('请先完成本步必填项', 'warning')
                return
              }
              setDraft((d) => ({ ...d, step: d.step + 1 }))
            }}
          >
            下一步
          </button>
        ) : (
          <button type="button" className="rounded-lg bg-[#1E6DFF] px-5 py-2 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45" disabled={peekLocked} title={peekLocked ? '请先完成第一步' : undefined} onClick={submitAll}>
            提交审核
          </button>
        )}
      </div>

      <Modal open={!!pipeModal} title={pipeModal?._editId ? '编辑管线' : '添加管线'} onClose={() => setPipeModal(null)} panelClassName="max-w-[600px]">
        {pipeModal ? (
          <div className="space-y-3 text-[13px]">
            <Labeled label="产品名称" required>
              <input className="w-full rounded-md border px-3 py-2" value={pipeModal.productName ?? ''} onChange={(e) => setPipeModal((m) => (m ? { ...m, productName: e.target.value } : m))} />
            </Labeled>
            <Labeled label="适应症" required>
              <input className="w-full rounded-md border px-3 py-2" value={pipeModal.indication ?? ''} onChange={(e) => setPipeModal((m) => (m ? { ...m, indication: e.target.value } : m))} />
            </Labeled>
            <Labeled label="研发阶段" required>
              <select className="w-full rounded-md border px-3 py-2" value={pipeModal.stage ?? '临床前'} onChange={(e) => setPipeModal((m) => (m ? { ...m, stage: e.target.value } : m))}>
                {PIPELINE_STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Labeled>
            <Labeled label="关键里程碑">
              <input className="w-full rounded-md border px-3 py-2" value={pipeModal.milestone ?? ''} onChange={(e) => setPipeModal((m) => (m ? { ...m, milestone: e.target.value } : m))} />
            </Labeled>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded-md border px-4 py-2" onClick={() => setPipeModal(null)}>
                取消
              </button>
              <button
                type="button"
                className="rounded-md bg-[#1E6DFF] px-4 py-2 font-bold text-white"
                onClick={() => {
                  if (!pipeModal.productName?.trim() || !pipeModal.indication?.trim()) {
                    toast.show('请填写产品名称与适应症', 'warning')
                    return
                  }
                  const row: PipelineItem = {
                    id: pipeModal._editId ?? newId(),
                    productName: pipeModal.productName!.trim(),
                    indication: pipeModal.indication!.trim(),
                    stage: pipeModal.stage || '临床前',
                    milestone: pipeModal.milestone?.trim() || undefined,
                  }
                  setDraft((d) =>
                    pipeModal._editId ? { ...d, pipeline: d.pipeline.map((x) => (x.id === row.id ? row : x)) } : { ...d, pipeline: [...d.pipeline, row] },
                  )
                  setPipeModal(null)
                }}
              >
                确定
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!teamModal} title={teamModal?._editId ? '编辑成员' : '添加成员'} onClose={() => setTeamModal(null)} panelClassName="max-w-[600px]">
        {teamModal ? (
          <div className="space-y-3 text-[13px]">
            <Labeled label="姓名" required>
              <input className="w-full rounded-md border px-3 py-2" value={teamModal.name ?? ''} onChange={(e) => setTeamModal((m) => (m ? { ...m, name: e.target.value } : m))} />
            </Labeled>
            <Labeled label="职务" required>
              <input className="w-full rounded-md border px-3 py-2" value={teamModal.title ?? ''} onChange={(e) => setTeamModal((m) => (m ? { ...m, title: e.target.value } : m))} />
            </Labeled>
            <label className="block text-[13px] text-muted">
              简介
              <textarea className="mt-1 w-full rounded-md border px-3 py-2" rows={3} value={teamModal.bio ?? ''} onChange={(e) => setTeamModal((m) => (m ? { ...m, bio: e.target.value } : m))} />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded-md border px-4 py-2" onClick={() => setTeamModal(null)}>
                取消
              </button>
              <button
                type="button"
                className="rounded-md bg-[#1E6DFF] px-4 py-2 font-bold text-white"
                onClick={() => {
                  if (!teamModal.name?.trim() || !teamModal.title?.trim()) {
                    toast.show('请填写姓名与职务', 'warning')
                    return
                  }
                  const row: TeamArchiveRow = {
                    id: teamModal._editId ?? newId(),
                    name: teamModal.name!.trim(),
                    title: teamModal.title!.trim(),
                    bio: teamModal.bio?.trim() || '—',
                  }
                  setDraft((d) => (teamModal._editId ? { ...d, team: d.team.map((x) => (x.id === row.id ? row : x)) } : { ...d, team: [...d.team, row] }))
                  setTeamModal(null)
                }}
              >
                确定
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!fundModal} title={fundModal?._editId ? '编辑融资' : '添加融资'} onClose={() => setFundModal(null)} panelClassName="max-w-[600px]">
        {fundModal ? (
          <div className="space-y-3 text-[13px]">
            <Labeled label="轮次" required>
              <input className="w-full rounded-md border px-3 py-2" value={fundModal.round ?? ''} onChange={(e) => setFundModal((m) => (m ? { ...m, round: e.target.value } : m))} />
            </Labeled>
            <Labeled label="金额" required>
              <input className="w-full rounded-md border px-3 py-2" value={fundModal.amount ?? ''} onChange={(e) => setFundModal((m) => (m ? { ...m, amount: e.target.value } : m))} />
            </Labeled>
            <Labeled label="投资机构" required>
              <input className="w-full rounded-md border px-3 py-2" value={fundModal.investor ?? ''} onChange={(e) => setFundModal((m) => (m ? { ...m, investor: e.target.value } : m))} />
            </Labeled>
            <Labeled label="日期" required>
              <input type="month" className="w-full rounded-md border px-3 py-2" value={fundModal.date ?? ''} onChange={(e) => setFundModal((m) => (m ? { ...m, date: e.target.value } : m))} />
            </Labeled>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded-md border px-4 py-2" onClick={() => setFundModal(null)}>
                取消
              </button>
              <button
                type="button"
                className="rounded-md bg-[#1E6DFF] px-4 py-2 font-bold text-white"
                onClick={() => {
                  if (!fundModal.round?.trim() || !fundModal.amount?.trim() || !fundModal.investor?.trim() || !fundModal.date?.trim()) {
                    toast.show('请填写完整融资信息', 'warning')
                    return
                  }
                  const row: FundingRow = {
                    id: fundModal._editId ?? newId(),
                    round: fundModal.round!.trim(),
                    amount: fundModal.amount!.trim(),
                    investor: fundModal.investor!.trim(),
                    date: fundModal.date!.trim(),
                  }
                  setDraft((d) => (fundModal._editId ? { ...d, funding: d.funding.map((x) => (x.id === row.id ? row : x)) } : { ...d, funding: [...d.funding, row] }))
                  setFundModal(null)
                }}
              >
                确定
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!ipModal} title={ipModal?._editId ? '编辑知识产权' : '添加知识产权'} onClose={() => setIpModal(null)} panelClassName="max-w-[600px]">
        {ipModal ? (
          <div className="space-y-3 text-[13px]">
            <Labeled label="专利名称" required>
              <input className="w-full rounded-md border px-3 py-2" value={ipModal.patentName ?? ''} onChange={(e) => setIpModal((m) => (m ? { ...m, patentName: e.target.value } : m))} />
            </Labeled>
            <Labeled label="专利号" required>
              <input className="w-full rounded-md border px-3 py-2" value={ipModal.patentNo ?? ''} onChange={(e) => setIpModal((m) => (m ? { ...m, patentNo: e.target.value } : m))} />
            </Labeled>
            <Labeled label="授权日期" required>
              <input type="date" className="w-full rounded-md border px-3 py-2" value={ipModal.grantDate ?? ''} onChange={(e) => setIpModal((m) => (m ? { ...m, grantDate: e.target.value } : m))} />
            </Labeled>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded-md border px-4 py-2" onClick={() => setIpModal(null)}>
                取消
              </button>
              <button
                type="button"
                className="rounded-md bg-[#1E6DFF] px-4 py-2 font-bold text-white"
                onClick={() => {
                  if (!ipModal.patentName?.trim() || !ipModal.patentNo?.trim() || !ipModal.grantDate?.trim()) {
                    toast.show('请填写专利信息', 'warning')
                    return
                  }
                  const row: IpRow = {
                    id: ipModal._editId ?? newId(),
                    patentName: ipModal.patentName!.trim(),
                    patentNo: ipModal.patentNo!.trim(),
                    grantDate: ipModal.grantDate!.trim(),
                  }
                  setDraft((d) => (ipModal._editId ? { ...d, ipRecords: d.ipRecords.map((x) => (x.id === row.id ? row : x)) } : { ...d, ipRecords: [...d.ipRecords, row] }))
                  setIpModal(null)
                }}
              >
                确定
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!previewFile} title="文件预览（演示）" onClose={() => setPreviewFile(null)} panelClassName="max-w-[600px]">
        {previewFile ? (
          <div className="text-[13px]">
            <p className="font-medium">{previewFile.name}</p>
            <p className="mt-2 text-muted">演示环境未打开真实文件流；正式环境将支持图片与 PDF 在线预览。</p>
            <p className="mt-1 text-[12px] text-muted">大小 {(previewFile.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!missingModal?.length}
        title="无法提交"
        onClose={() => setMissingModal(null)}
        footer={
          <button type="button" className="rounded-md bg-[#1E6DFF] px-4 py-2 font-bold text-white" onClick={() => setMissingModal(null)}>
            知道了
          </button>
        }
        panelClassName="max-w-[560px]"
      >
        {missingModal?.length ? (
          <ul className="list-inside list-disc space-y-2 text-[13px] text-[#F44336]">
            {missingModal.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : null}
      </Modal>
    </div>
  )
}
