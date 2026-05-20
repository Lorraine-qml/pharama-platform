import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { useHatchMgmt } from './HatchMgmtContext'
import { HatchFlowNodeDetailModal, HatchProjectFlowBar } from './HatchProjectFlowBar'
import { SigningFlowProgressModal } from './SigningFlowProgressModal'
import type { ChangeRequest, FlowNodeKey, FundingRow, MajorEvent, PipelineItem, TeamArchiveRow } from './hatchTypes'

type RegisterSubTab = 'basic' | 'attachments' | 'team_pipeline' | 'funding_ip' | 'resource_demand'
type IncubationSubTab = 'signing' | 'eval' | 'ai_portrait' | 'resource_usage' | 'space_changes' | 'graduate'
type ArchiveSubTab = RegisterSubTab | IncubationSubTab

const REGISTER_TABS: { key: RegisterSubTab; label: string }[] = [
  { key: 'basic', label: '基本信息' },
  { key: 'attachments', label: '资料附件' },
  { key: 'team_pipeline', label: '团队与管线' },
  { key: 'funding_ip', label: '融资与知识产权' },
  { key: 'resource_demand', label: '资源需求' },
]

const INCUBATION_TABS: { key: IncubationSubTab; label: string }[] = [
  { key: 'signing', label: '签约信息' },
  { key: 'eval', label: '评估记录' },
  { key: 'ai_portrait', label: 'AI项目画像' },
  { key: 'resource_usage', label: '资源使用' },
  { key: 'space_changes', label: '空间与变更' },
  { key: 'graduate', label: '毕业退出' },
]

/** 旧版 13 Tab URL 兼容 */
const LEGACY_TAB_MAP: Record<string, ArchiveSubTab> = {
  pipeline: 'team_pipeline',
  team: 'team_pipeline',
  funding: 'funding_ip',
  resource: 'resource_usage',
  space: 'space_changes',
  history: 'space_changes',
  events: 'space_changes',
}

function resolveSubTab(raw: string | null): ArchiveSubTab {
  if (!raw) return 'basic'
  if (LEGACY_TAB_MAP[raw]) return LEGACY_TAB_MAP[raw]
  const all = [...REGISTER_TABS, ...INCUBATION_TABS].map((t) => t.key)
  if (all.includes(raw as ArchiveSubTab)) return raw as ArchiveSubTab
  return 'basic'
}

export default function HatchArchiveDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const h = useHatchMgmt()
  const isOps = Boolean(user)

  const proj = useMemo(() => h.archives.find((a) => a.id === projectId), [h.archives, projectId])
  const tabFromUrl = searchParams.get('tab')
  const initialSubTab = resolveSubTab(tabFromUrl)
  const [subTab, setSubTab] = useState<ArchiveSubTab>(initialSubTab)
  const [registerOpen, setRegisterOpen] = useState(true)
  const [incubationOpen, setIncubationOpen] = useState(true)

  const [flowModal, setFlowModal] = useState<{ title: string; body: string } | null>(null)
  const [signFlowOpen, setSignFlowOpen] = useState(false)
  const [basicOpen, setBasicOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [pipeModal, setPipeModal] = useState<null | { mode: 'add' } | { mode: 'edit'; row: PipelineItem }>(null)
  const [pipeForm, setPipeForm] = useState({ productName: '', indication: '', stage: '', milestone: '' })
  const [teamModal, setTeamModal] = useState<null | { mode: 'add' } | { mode: 'edit'; row: TeamArchiveRow }>(null)
  const [teamForm, setTeamForm] = useState({ name: '', title: '', bio: '' })
  const [fundModal, setFundModal] = useState<null | { mode: 'add' } | { mode: 'edit'; row: FundingRow }>(null)
  const [fundForm, setFundForm] = useState({ round: '', amount: '', investor: '', date: '' })
  const [resOpen, setResOpen] = useState(false)
  const [resD, setResD] = useState('')
  const [resS, setResS] = useState('')
  const [evalOpen, setEvalOpen] = useState(false)
  const [eventModal, setEventModal] = useState<null | { mode: 'add' } | { mode: 'edit'; row: MajorEvent }>(null)
  const [eventForm, setEventForm] = useState({ time: '', description: '' })
  const [changeOpen, setChangeOpen] = useState(false)
  const [chgType, setChgType] = useState<ChangeRequest['changeType']>('基础信息变更')
  const [chgDetail, setChgDetail] = useState('')
  const [chgReason, setChgReason] = useState('')

  const linkedContract = useMemo(
    () => (proj ? h.contracts.find((c) => c.projectId === proj.id) : undefined),
    [h.contracts, proj],
  )

  if (!proj) {
    return (
      <div className="rounded-lg border border-divider bg-surface p-8 text-muted">
        未找到档案。
        <button type="button" className="ms-3 text-primary hover:underline" onClick={() => navigate('/hatch/archive')}>
          返回列表
        </button>
      </div>
    )
  }

  const archive = proj

  function onFlowNode(_key: FlowNodeKey, label: string) {
    setFlowModal({
      title: `流程节点 · ${label}`,
      body: `节点「${label}」详情占位。\n当前项目：${archive.name}\n入孵类型：${archive.incubationType}\n（演示：后端返回时间戳与操作入口）`,
    })
  }

  function saveBasic() {
    const nameEl = document.getElementById('ab-name') as HTMLInputElement | null
    const cEl = document.getElementById('ab-contact') as HTMLInputElement | null
    const pEl = document.getElementById('ab-phone') as HTMLInputElement | null
    h.updateArchive(
      archive.id,
      {
        name: nameEl?.value.trim() || archive.name,
        contact: cEl?.value.trim() || archive.contact,
        phone: pEl?.value.trim() || archive.phone,
      },
      '基本信息',
    )
    setBasicOpen(false)
    toast.show('已保存', 'success')
  }

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => navigate('/hatch/archive')} className="text-[13px] text-primary hover:underline">
          ← 返回档案列表
        </button>
        {isOps ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-md border border-divider px-3 py-2 text-[13px]" onClick={() => setChangeOpen(true)}>
              申请变更
            </button>
            <Link to="/hatch/workbench" className="rounded-md border border-divider px-3 py-2 text-[13px] hover:border-primary/40">
              运营工作台
            </Link>
          </div>
        ) : (
          <button type="button" className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-white" onClick={() => setChangeOpen(true)}>
            申请变更
          </button>
        )}
      </div>

      <header className="rounded-[var(--radius-card)] border border-divider bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-bold text-foreground">{proj.name}</h1>
            <p className="mt-1 text-[12px] text-muted">
              {proj.entityType} · {proj.incubationType} · {proj.status}
              {!isOps ? ' · 项目方视图（部分只读）' : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {linkedContract ? (
              <button
                type="button"
                className="text-[12px] font-semibold text-primary hover:underline"
                onClick={() => setSignFlowOpen(true)}
              >
                查看签约流程
              </button>
            ) : null}
            {linkedContract ? <span className="text-divider">|</span> : null}
            <Link to="/twin/distribution/projects" className="text-[12px] text-primary hover:underline">
              项目空间分布
            </Link>
            <span className="text-divider">|</span>
            <Link to="/twin/infrastructure/spaces" className="text-[12px] text-primary hover:underline">
              空间台账
            </Link>
          </div>
        </div>
        <div className="mt-5">
          <HatchProjectFlowBar incubationType={proj.incubationType} current={proj.flowCurrent} onNodeClick={onFlowNode} />
        </div>
      </header>

      <ArchiveSectionPanel
        title="注册信息"
        emoji="📝"
        subtitle="项目方申请入孵时填报的静态资料"
        open={registerOpen}
        onToggle={() => setRegisterOpen((v) => !v)}
        tabs={REGISTER_TABS}
        activeTab={subTab}
        onTabSelect={(key) => {
          setSubTab(key)
          setRegisterOpen(true)
        }}
      />

      <ArchiveSectionPanel
        title="入孵信息"
        emoji="🚀"
        subtitle="入孵后由运营产生的动态数据"
        open={incubationOpen}
        onToggle={() => setIncubationOpen((v) => !v)}
        tabs={INCUBATION_TABS}
        activeTab={subTab}
        onTabSelect={(key) => {
          setSubTab(key)
          setIncubationOpen(true)
        }}
      />

      <section className="rounded-[var(--radius-card)] border border-divider bg-surface p-5 shadow-sm">
        {subTab === 'basic' ? (
          <div className="space-y-3 text-[13px]">
            <div className="grid gap-3 sm:grid-cols-2">
              <p>
                <span className="text-muted">项目名称</span> <span className="font-medium">{proj.name}</span>
              </p>
              <p>
                <span className="text-muted">主体类型</span> {proj.entityType}
              </p>
              <p className="sm:col-span-2">
                <span className="text-muted">统一社会信用代码</span> <span className="font-mono">{proj.creditCode}</span>
              </p>
              <p className="sm:col-span-2">
                <span className="text-muted">注册地址</span> {proj.address}
              </p>
              <p>
                <span className="text-muted">联系人</span> {proj.contact}
              </p>
              <p>
                <span className="text-muted">电话</span> {proj.phone}
              </p>
              <p>
                <span className="text-muted">入孵类型</span> {proj.incubationType}
              </p>
              <p>
                <span className="text-muted">当前状态</span> {proj.status}
              </p>
              <p>
                <span className="text-muted">入孵时间</span> {proj.incubationStart ?? '—'}
              </p>
              <p>
                <span className="text-muted">合同到期</span> {proj.contractEnd ?? '—'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted">标签</span>
              {proj.tags.map((t) => (
                <span key={t} className="rounded-full bg-primary-light px-2 py-0.5 text-[12px] text-primary">
                  {t}
                </span>
              ))}
              {isOps ? (
                <button type="button" className="text-[12px] text-primary hover:underline" onClick={() => { setTagInput(proj.tags.join(',')); setTagOpen(true) }}>
                  ＋ 编辑
                </button>
              ) : null}
            </div>
            {isOps ? (
              <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setBasicOpen(true)}>
                编辑基本信息
              </button>
            ) : null}
            <p className="text-[11px] text-muted">入孵类型与状态不可在此直接修改，须通过「项目变更管理」发起申请。</p>
          </div>
        ) : null}

        {subTab === 'attachments' ? (
          <div className="space-y-3 text-[13px]">
            <p className="text-muted">项目方注册时上传的文件（演示）。</p>
            <table className="w-full border-collapse text-[12px]">
              <thead className="border-b bg-page text-left text-muted">
                <tr>
                  <th className="py-2">分类</th>
                  <th className="py-2">文件名</th>
                  <th className="py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">主体资质证明</td>
                  <td>营业执照.jpg</td>
                  <td className="py-2 text-primary">预览 · 下载</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">商业计划书</td>
                  <td>BP.pdf</td>
                  <td className="py-2 text-primary">预览 · 下载</td>
                </tr>
              </tbody>
            </table>
            {isOps ? (
              <button type="button" className="rounded-md border border-primary px-3 py-2 text-[12px] font-semibold text-primary" onClick={() => toast.show('补充上传（演示）', 'info')}>
                补充上传
              </button>
            ) : null}
          </div>
        ) : null}

        {subTab === 'signing' ? (
          <div className="space-y-3 text-[13px]">
            {linkedContract ? (
              <>
                <p>
                  签约状态：<span className="font-semibold text-success">{linkedContract.signStatus}</span>
                </p>
                <p>合同模板：{linkedContract.templateName ?? '—'}</p>
                <p>
                  入孵期限：{linkedContract.termStart ?? '—'} 至 {linkedContract.termEnd ?? linkedContract.contractEnd ?? '—'}
                </p>
                <p>
                  费用：租金 {linkedContract.rentYuanPerMonth ?? '—'} 元/月 · 物业费 {linkedContract.propertyFee ?? 0} 元/月 · AI 套餐{' '}
                  {linkedContract.aiPackage ?? '—'}
                </p>
                {linkedContract.contractAttachments?.length ? (
                  <div>
                    <p className="font-bold">合同附件</p>
                    <ul className="mt-1 list-inside list-disc text-muted">
                      {linkedContract.contractAttachments.map((name) => (
                        <li key={name}>
                          {name}{' '}
                          <button type="button" className="text-primary hover:underline" onClick={() => toast.show('下载（演示）', 'info')}>
                            下载
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : linkedContract.scanFileName ? (
                  <p>
                    合同附件：{linkedContract.scanFileName}{' '}
                    <button type="button" className="text-primary hover:underline" onClick={() => toast.show('下载（演示）', 'info')}>
                      下载
                    </button>
                  </p>
                ) : null}
                {linkedContract.contractRemark ? <p className="text-muted">合同备注：{linkedContract.contractRemark}</p> : null}
                {linkedContract.remindLogs?.length ? (
                  <div>
                    <p className="font-bold">提醒记录</p>
                    <ul className="mt-1 list-inside list-disc text-muted">
                      {linkedContract.remindLogs.map((r) => (
                        <li key={r.id}>{r.remindTime.slice(0, 10)} 已发送到期提醒</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {isOps ? (
                  <Link to="/hatch/workbench" className="inline-block rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white">
                    发起续约
                  </Link>
                ) : null}
              </>
            ) : (
              <p className="text-muted">
                暂无签约信息。
                {isOps ? (
                  <Link to="/hatch/workbench" className="ms-2 font-semibold text-primary hover:underline">
                    去签署
                  </Link>
                ) : null}
              </p>
            )}
          </div>
        ) : null}

        {subTab === 'ai_portrait' ? (
          <p className="text-[13px] text-muted">AI 项目画像（V2 对接演示）：多维度画像、成长评分与孵化建议占位。</p>
        ) : null}

        {subTab === 'graduate' ? (
          <div className="space-y-2 text-[13px]">
            {h.changes
              .filter((c) => c.projectId === archive.id && c.changeType === '退出/毕业')
              .map((c) => (
                <div key={c.id} className="rounded-md border border-divider p-3">
                  <p className="font-semibold">{c.exitType ?? '退出'} · {c.status}</p>
                  <p className="text-muted">{c.reason ?? c.summary}</p>
                </div>
              ))}
            {h.changes.filter((c) => c.projectId === archive.id && c.changeType === '退出/毕业').length === 0 ? (
              <p className="text-muted">暂无毕业/退出申请记录。</p>
            ) : null}
          </div>
        ) : null}

        {subTab === 'team_pipeline' ? (
          <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between">
              <h3 className="text-[14px] font-bold">产品管线</h3>
              {isOps ? (
                <button
                  type="button"
                  className="text-[13px] font-semibold text-primary"
                  onClick={() => {
                    setPipeForm({ productName: '', indication: '', stage: '临床前', milestone: '' })
                    setPipeModal({ mode: 'add' })
                  }}
                >
                  ＋ 添加管线
                </button>
              ) : null}
            </div>
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-page text-left text-[12px] text-muted">
                <tr>
                  <th className="border-b px-3 py-2">产品名称</th>
                  <th className="border-b px-3 py-2">适应症</th>
                  <th className="border-b px-3 py-2">研发阶段</th>
                  <th className="border-b px-3 py-2 text-end">操作</th>
                </tr>
              </thead>
              <tbody>
                {proj.pipeline.map((p) => (
                  <tr key={p.id} className="border-b border-divider">
                    <td className="px-3 py-2">{p.productName}</td>
                    <td className="px-3 py-2 text-muted">{p.indication}</td>
                    <td className="px-3 py-2 text-muted">{p.stage}</td>
                    <td className="px-3 py-2 text-end">
                      {isOps ? (
                        <>
                          <button type="button" className="text-primary hover:underline" onClick={() => { setPipeForm({ ...p, milestone: p.milestone ?? '' }); setPipeModal({ mode: 'edit', row: p }) }}>
                            编辑
                          </button>
                          <button type="button" className="ms-2 text-danger hover:underline" onClick={() => h.removePipeline(proj.id, p.id)}>
                            删除
                          </button>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 border-t border-divider pt-6">
            <div className="flex justify-between">
              <h3 className="text-[14px] font-bold">核心团队</h3>
              {isOps ? (
                <button
                  type="button"
                  className="text-[13px] font-semibold text-primary"
                  onClick={() => {
                    setTeamForm({ name: '', title: '', bio: '' })
                    setTeamModal({ mode: 'add' })
                  }}
                >
                  ＋ 添加成员
                </button>
              ) : null}
            </div>
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-page text-[12px] text-muted">
                <tr>
                  <th className="border-b px-3 py-2">姓名</th>
                  <th className="border-b px-3 py-2">职务</th>
                  <th className="border-b px-3 py-2">简介</th>
                  <th className="border-b px-3 py-2 text-end">操作</th>
                </tr>
              </thead>
              <tbody>
                {proj.team.map((t) => (
                  <tr key={t.id} className="border-b border-divider">
                    <td className="px-3 py-2">{t.name}</td>
                    <td className="px-3 py-2 text-muted">{t.title}</td>
                    <td className="px-3 py-2 text-muted">{t.bio}</td>
                    <td className="px-3 py-2 text-end">
                      {isOps ? (
                        <>
                          <button type="button" className="text-primary hover:underline" onClick={() => { setTeamForm({ ...t }); setTeamModal({ mode: 'edit', row: t }) }}>
                            编辑
                          </button>
                          <button type="button" className="ms-2 text-danger hover:underline" onClick={() => h.removeTeam(proj.id, t.id)}>
                            删除
                          </button>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        ) : null}

        {subTab === 'funding_ip' ? (
          <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between">
              <h3 className="text-[14px] font-bold">融资记录</h3>
              {isOps ? (
                <button
                  type="button"
                  className="text-[13px] font-semibold text-primary"
                  onClick={() => {
                    setFundForm({ round: '', amount: '', investor: '', date: '' })
                    setFundModal({ mode: 'add' })
                  }}
                >
                  ＋ 添加记录
                </button>
              ) : null}
            </div>
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-page text-[12px] text-muted">
                <tr>
                  <th className="border-b px-3 py-2">轮次</th>
                  <th className="border-b px-3 py-2">金额</th>
                  <th className="border-b px-3 py-2">投资机构</th>
                  <th className="border-b px-3 py-2">日期</th>
                  <th className="border-b px-3 py-2 text-end">操作</th>
                </tr>
              </thead>
              <tbody>
                {proj.funding.map((f) => (
                  <tr key={f.id} className="border-b border-divider">
                    <td className="px-3 py-2">{f.round}</td>
                    <td className="px-3 py-2">{f.amount}</td>
                    <td className="px-3 py-2 text-muted">{f.investor}</td>
                    <td className="px-3 py-2 text-muted">{f.date}</td>
                    <td className="px-3 py-2 text-end">
                      {isOps ? (
                        <>
                          <button type="button" className="text-primary hover:underline" onClick={() => { setFundForm({ ...f }); setFundModal({ mode: 'edit', row: f }) }}>
                            编辑
                          </button>
                          <button type="button" className="ms-2 text-danger hover:underline" onClick={() => h.removeFunding(proj.id, f.id)}>
                            删除
                          </button>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 border-t border-divider pt-6">
            <h3 className="text-[14px] font-bold">知识产权</h3>
            <p className="text-[12px] text-muted">注册阶段填报的专利、软著、商标等（演示占位）。</p>
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-page text-[12px] text-muted">
                <tr>
                  <th className="border-b px-3 py-2">类型</th>
                  <th className="border-b px-3 py-2">名称/编号</th>
                  <th className="border-b px-3 py-2">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-divider">
                  <td className="px-3 py-2">发明专利</td>
                  <td className="px-3 py-2 text-muted">基因编辑载体构建方法（申请号 CN2025xxxx）</td>
                  <td className="px-3 py-2 text-muted">实质审查</td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
        ) : null}

        {subTab === 'resource_demand' ? (
          <div className="space-y-4 text-[13px]">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-bold">资源需求（注册填报）</span>
                {isOps ? (
                  <button type="button" className="text-primary hover:underline" onClick={() => { setResD(proj.resourceDemand); setResS(proj.resourceSupply); setResOpen(true) }}>
                    编辑
                  </button>
                ) : null}
              </div>
              <p className="rounded-md border border-divider bg-page p-3 text-muted">{proj.resourceDemand || '—'}</p>
            </div>
          </div>
        ) : null}

        {subTab === 'resource_usage' ? (
          <div className="space-y-4 text-[13px]">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-bold">资源供给与使用</span>
                <Link to="/resops/catalog" className="text-[12px] text-primary hover:underline">
                  前往资源目录预约
                </Link>
              </div>
              <p className="rounded-md border border-divider bg-page p-3 text-muted">{proj.resourceSupply || '—'}</p>
            </div>
            <p className="text-[12px] text-muted">入孵后通过资源运营模块产生的预约、订单与使用记录将在此汇总展示（演示占位）。</p>
          </div>
        ) : null}

        {subTab === 'eval' ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <h3 className="text-[14px] font-bold">评估记录</h3>
              {isOps ? (
                <button type="button" className="text-[13px] font-semibold text-primary" onClick={() => setEvalOpen(true)}>
                  关联评估
                </button>
              ) : null}
            </div>
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-page text-[12px] text-muted">
                <tr>
                  <th className="border-b px-3 py-2">类型</th>
                  <th className="border-b px-3 py-2">得分</th>
                  <th className="border-b px-3 py-2">结论</th>
                  <th className="border-b px-3 py-2">时间</th>
                </tr>
              </thead>
              <tbody>
                {proj.evaluations.map((e) => (
                  <tr key={e.id} className="border-b border-divider">
                    <td className="px-3 py-2">{e.type}</td>
                    <td className="px-3 py-2">{e.score}</td>
                    <td className="px-3 py-2 text-muted">{e.conclusion}</td>
                    <td className="px-3 py-2 text-muted">{e.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {subTab === 'space_changes' ? (
          <div className="space-y-8">
          <div>
            <h3 className="mb-3 text-[14px] font-bold">空间变更记录</h3>
            <p className="mb-3 text-[12px] text-muted">与空间管理、项目空间分布联动；生产环境由审计与孪生台账写入。</p>
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-page text-[12px] text-muted">
                <tr>
                  <th className="border-b px-3 py-2">变更时间</th>
                  <th className="border-b px-3 py-2">操作类型</th>
                  <th className="border-b px-3 py-2">房间名称</th>
                  <th className="border-b px-3 py-2">面积</th>
                  <th className="border-b px-3 py-2">操作人</th>
                </tr>
              </thead>
              <tbody>
                {(proj.spaceHistory ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted">
                      暂无空间变更记录
                    </td>
                  </tr>
                ) : (
                  (proj.spaceHistory ?? []).map((row) => (
                    <tr key={row.id} className="border-b border-divider">
                      <td className="px-3 py-2">{row.time}</td>
                      <td className="px-3 py-2">{row.opType}</td>
                      <td className="px-3 py-2 font-medium text-foreground">{row.roomName}</td>
                      <td className="px-3 py-2 tabular-nums text-muted">{row.areaM2}㎡</td>
                      <td className="px-3 py-2 text-muted">{row.operator}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-divider pt-6">
            <h3 className="mb-3 text-[14px] font-bold">档案变更历史（只读）</h3>
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-page text-[12px] text-muted">
                <tr>
                  <th className="border-b px-3 py-2">时间</th>
                  <th className="border-b px-3 py-2">操作人</th>
                  <th className="border-b px-3 py-2">变更字段</th>
                  <th className="border-b px-3 py-2">原值 → 新值</th>
                </tr>
              </thead>
              <tbody>
                {proj.changeHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted">
                      暂无记录
                    </td>
                  </tr>
                ) : (
                  proj.changeHistory.map((c) => (
                    <tr key={c.id} className="border-b border-divider">
                      <td className="px-3 py-2">{c.time}</td>
                      <td className="px-3 py-2">{c.operator}</td>
                      <td className="px-3 py-2">{c.field}</td>
                      <td className="px-3 py-2 text-muted">
                        {c.from} → {c.to}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 border-t border-divider pt-6">
            <div className="flex justify-between">
              <h3 className="text-[14px] font-bold">重大事件</h3>
              {isOps ? (
                <button
                  type="button"
                  className="text-[13px] font-semibold text-primary"
                  onClick={() => {
                    setEventForm({ time: new Date().toISOString().slice(0, 10), description: '' })
                    setEventModal({ mode: 'add' })
                  }}
                >
                  ＋ 添加事件
                </button>
              ) : null}
            </div>
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-page text-[12px] text-muted">
                <tr>
                  <th className="border-b px-3 py-2">时间</th>
                  <th className="border-b px-3 py-2">事件描述</th>
                  <th className="border-b px-3 py-2 text-end">操作</th>
                </tr>
              </thead>
              <tbody>
                {proj.events.map((ev) => (
                  <tr key={ev.id} className="border-b border-divider">
                    <td className="px-3 py-2">{ev.time}</td>
                    <td className="px-3 py-2 text-muted">{ev.description}</td>
                    <td className="px-3 py-2 text-end">
                      {isOps ? (
                        <button type="button" className="text-primary hover:underline" onClick={() => { setEventForm({ ...ev }); setEventModal({ mode: 'edit', row: ev }) }}>
                          编辑
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        ) : null}
      </section>

      <HatchFlowNodeDetailModal open={flowModal !== null} title={flowModal?.title ?? ''} body={flowModal?.body ?? ''} onClose={() => setFlowModal(null)} />
      <SigningFlowProgressModal contract={linkedContract ?? null} open={signFlowOpen} onClose={() => setSignFlowOpen(false)} />

      <Modal
        open={basicOpen}
        title="编辑基本信息"
        onClose={() => setBasicOpen(false)}
        panelClassName="max-w-md"
        footer={
          <>
            <button type="button" className="rounded-md border px-4 py-2" onClick={() => setBasicOpen(false)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-primary px-5 py-2 font-bold text-white" onClick={saveBasic}>
              保存
            </button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <label className="flex flex-col gap-1 text-muted">
            项目名称
            <input defaultValue={proj.name} id="ab-name" className="rounded-md border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-muted">
            联系人
            <input defaultValue={proj.contact} id="ab-contact" className="rounded-md border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-muted">
            电话
            <input defaultValue={proj.phone} id="ab-phone" className="rounded-md border px-3 py-2" />
          </label>
        </div>
      </Modal>

      <Modal
        open={tagOpen}
        title="编辑标签"
        onClose={() => setTagOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-md border px-4 py-2" onClick={() => setTagOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-5 py-2 font-bold text-white"
              onClick={() => {
                const tags = tagInput
                  .split(/[,，]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                h.setArchiveTags(proj.id, tags)
                setTagOpen(false)
                toast.show('标签已更新', 'success')
              }}
            >
              保存
            </button>
          </>
        }
      >
        <textarea value={tagInput} onChange={(e) => setTagInput(e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2 text-[13px]" placeholder="逗号分隔" />
      </Modal>

      <Modal
        open={pipeModal !== null}
        title={pipeModal?.mode === 'edit' ? '编辑管线' : '添加管线'}
        onClose={() => setPipeModal(null)}
        panelClassName="max-w-md"
        footer={
          <>
            <button type="button" className="rounded-md border px-4 py-2" onClick={() => setPipeModal(null)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-5 py-2 font-bold text-white"
              onClick={() => {
                if (!pipeForm.productName.trim()) {
                  toast.show('请填写产品名称', 'warning')
                  return
                }
                if (pipeModal?.mode === 'edit') h.updatePipeline(proj.id, { ...pipeModal.row, ...pipeForm })
                else h.addPipeline(proj.id, pipeForm)
                setPipeModal(null)
                toast.show('已保存', 'success')
              }}
            >
              确定
            </button>
          </>
        }
      >
        <div className="grid gap-3 text-[13px]">
          <label className="text-muted">
            产品名称
            <input value={pipeForm.productName} onChange={(e) => setPipeForm((f) => ({ ...f, productName: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          <label className="text-muted">
            适应症
            <input value={pipeForm.indication} onChange={(e) => setPipeForm((f) => ({ ...f, indication: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          <label className="text-muted">
            研发阶段
            <select value={pipeForm.stage} onChange={(e) => setPipeForm((f) => ({ ...f, stage: e.target.value }))} className="mt-1 w-full rounded-md border bg-page px-3 py-2">
              {['发现', '临床前', 'IND', '临床Ⅰ期', '临床Ⅱ期'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-muted">
            关键里程碑
            <input value={pipeForm.milestone} onChange={(e) => setPipeForm((f) => ({ ...f, milestone: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
        </div>
      </Modal>

      <Modal
        open={teamModal !== null}
        title={teamModal?.mode === 'edit' ? '编辑成员' : '添加成员'}
        onClose={() => setTeamModal(null)}
        panelClassName="max-w-md"
        footer={
          <>
            <button type="button" className="rounded-md border px-4 py-2" onClick={() => setTeamModal(null)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-5 py-2 font-bold text-white"
              onClick={() => {
                if (!teamForm.name.trim()) {
                  toast.show('请填写姓名', 'warning')
                  return
                }
                if (teamModal?.mode === 'edit') h.updateTeam(proj.id, { ...teamModal.row, ...teamForm })
                else h.addTeam(proj.id, teamForm)
                setTeamModal(null)
                toast.show('已保存', 'success')
              }}
            >
              确定
            </button>
          </>
        }
      >
        <div className="grid gap-3 text-[13px]">
          <label className="text-muted">
            姓名
            <input value={teamForm.name} onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          <label className="text-muted">
            职务
            <input value={teamForm.title} onChange={(e) => setTeamForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          <label className="text-muted">
            简介
            <textarea value={teamForm.bio} onChange={(e) => setTeamForm((f) => ({ ...f, bio: e.target.value }))} rows={3} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
        </div>
      </Modal>

      <Modal
        open={fundModal !== null}
        title={fundModal?.mode === 'edit' ? '编辑融资' : '添加融资'}
        onClose={() => setFundModal(null)}
        panelClassName="max-w-md"
        footer={
          <>
            <button type="button" className="rounded-md border px-4 py-2" onClick={() => setFundModal(null)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-5 py-2 font-bold text-white"
              onClick={() => {
                if (!fundForm.round.trim()) {
                  toast.show('请填写轮次', 'warning')
                  return
                }
                if (fundModal?.mode === 'edit') h.updateFunding(proj.id, { ...fundModal.row, ...fundForm })
                else h.addFunding(proj.id, fundForm)
                setFundModal(null)
                toast.show('已保存', 'success')
              }}
            >
              确定
            </button>
          </>
        }
      >
        <div className="grid gap-3 text-[13px]">
          <label className="text-muted">
            轮次
            <input value={fundForm.round} onChange={(e) => setFundForm((f) => ({ ...f, round: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          <label className="text-muted">
            金额
            <input value={fundForm.amount} onChange={(e) => setFundForm((f) => ({ ...f, amount: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          <label className="text-muted">
            投资机构
            <input value={fundForm.investor} onChange={(e) => setFundForm((f) => ({ ...f, investor: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          <label className="text-muted">
            日期
            <input value={fundForm.date} onChange={(e) => setFundForm((f) => ({ ...f, date: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
        </div>
      </Modal>

      <Modal
        open={resOpen}
        title="编辑资源需求/供给"
        onClose={() => setResOpen(false)}
        panelClassName="max-w-lg"
        footer={
          <>
            <button type="button" className="rounded-md border px-4 py-2" onClick={() => setResOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-5 py-2 font-bold text-white"
              onClick={() => {
                h.setResourceTexts(proj.id, resD, resS)
                setResOpen(false)
                toast.show('已保存', 'success')
              }}
            >
              保存
            </button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <label className="text-muted">
            资源需求
            <textarea value={resD} onChange={(e) => setResD(e.target.value)} rows={3} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          <label className="text-muted">
            资源供给
            <textarea value={resS} onChange={(e) => setResS(e.target.value)} rows={3} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          <p className="text-[11px] text-muted">多选字典项 + 自定义（V1 文本编辑；V2 多选组件）。</p>
        </div>
      </Modal>

      <Modal
        open={evalOpen}
        title="关联评估报告"
        onClose={() => setEvalOpen(false)}
        panelClassName="max-w-md"
        footer={
          <>
            <button type="button" className="rounded-md border px-4 py-2" onClick={() => setEvalOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-5 py-2 font-bold text-white"
              onClick={() => {
                h.addEvaluation(proj.id, { type: '科创策源综合评估', score: '85', conclusion: '已关联（演示）', time: new Date().toISOString().slice(0, 10) })
                setEvalOpen(false)
                toast.show('已关联评估', 'success')
              }}
            >
              确定
            </button>
          </>
        }
      >
        <p className="mb-3 text-[13px] text-muted">从科创策源拉取可关联报告（演示列表）：</p>
        <ul className="space-y-2 text-[13px]">
          <li className="rounded-md border border-divider px-3 py-2">sj-demo · AI 初筛报告 · 2025-05-10</li>
          <li className="rounded-md border border-divider px-3 py-2">sj-demo · 专家评审纪要 · 2025-05-12</li>
        </ul>
      </Modal>

      <Modal
        open={eventModal !== null}
        title={eventModal?.mode === 'edit' ? '编辑事件' : '添加事件'}
        onClose={() => setEventModal(null)}
        panelClassName="max-w-md"
        footer={
          <>
            <button type="button" className="rounded-md border px-4 py-2" onClick={() => setEventModal(null)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-5 py-2 font-bold text-white"
              onClick={() => {
                if (!eventForm.description.trim()) {
                  toast.show('请填写描述', 'warning')
                  return
                }
                if (eventModal?.mode === 'edit') h.updateEvent(proj.id, { ...eventModal.row, ...eventForm })
                else h.addEvent(proj.id, eventForm)
                setEventModal(null)
                toast.show('已保存', 'success')
              }}
            >
              确定
            </button>
          </>
        }
      >
        <div className="grid gap-3 text-[13px]">
          <label className="text-muted">
            时间
            <input type="date" value={eventForm.time} onChange={(e) => setEventForm((f) => ({ ...f, time: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          <label className="text-muted">
            事件描述
            <textarea value={eventForm.description} onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
        </div>
      </Modal>

      <Modal
        open={changeOpen}
        title={`申请变更 · ${proj.name}`}
        onClose={() => setChangeOpen(false)}
        panelClassName="max-w-lg"
        footer={
          <>
            <button type="button" className="rounded-md border px-4 py-2" onClick={() => setChangeOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-5 py-2 font-bold text-white"
              onClick={() => {
                if (!chgReason.trim()) {
                  toast.show('请填写变更原因', 'warning')
                  return
                }
                h.submitChangeRequest({
                  projectId: proj.id,
                  projectName: proj.name,
                  changeType: chgType,
                  summary: chgDetail || chgType,
                  applicant: user?.displayName ?? '当前用户',
                  detail: chgDetail,
                  reason: chgReason,
                  exitType: chgType === '退出/毕业' ? '毕业' : undefined,
                })
                setChangeOpen(false)
                toast.show('已提交审批', 'success')
              }}
            >
              提交申请
            </button>
          </>
        }
      >
        <div className="space-y-4 text-[13px]">
          <div>
            <p className="mb-2 font-semibold text-foreground">变更类型</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(['基础信息变更', '赛道/阶段变更', '入孵类型变更', '空间变更', '退出/毕业'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 rounded-md border border-divider px-3 py-2">
                  <input type="radio" name="chg" checked={chgType === t} onChange={() => setChgType(t)} />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1 text-muted">
            变更详情
            <textarea value={chgDetail} onChange={(e) => setChgDetail(e.target.value)} rows={3} className="rounded-md border px-3 py-2 text-foreground" placeholder={chgType === '入孵类型变更' ? '例：目标类型 实体入孵' : '例：扩租 +30㎡'} />
          </label>
          <label className="flex flex-col gap-1 text-muted">
            变更原因
            <input value={chgReason} onChange={(e) => setChgReason(e.target.value)} className="rounded-md border px-3 py-2" />
          </label>
          <p className="text-[11px] text-muted">附件上传（演示）：后续对接统一附件服务。</p>
        </div>
      </Modal>
    </div>
  )
}

type SectionTabDef<T extends string> = { key: T; label: string }

function ArchiveSectionPanel<T extends string>({
  title,
  emoji,
  subtitle,
  open,
  onToggle,
  tabs,
  activeTab,
  onTabSelect,
}: {
  title: string
  emoji: string
  subtitle: string
  open: boolean
  onToggle: () => void
  tabs: SectionTabDef<T>[]
  activeTab: string
  onTabSelect: (key: T) => void
}) {
  const isActiveSection = tabs.some((t) => t.key === activeTab)
  return (
    <section
      className={cn(
        'rounded-[var(--radius-card)] border border-divider bg-surface shadow-sm',
        isActiveSection && 'ring-1 ring-primary/25',
      )}
    >
      <button type="button" className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left hover:bg-page/40" onClick={onToggle}>
        <span className={cn('text-[10px] text-muted transition-transform', open ? 'rotate-90' : '')} aria-hidden>
          ▶
        </span>
        <span className="text-[16px] font-bold text-foreground">
          {emoji} {title}
        </span>
        <span className="text-[12px] text-muted sm:ms-auto">{subtitle}</span>
      </button>
      {open ? (
        <div className="border-t border-divider px-5 pb-4">
          <div className="flex flex-wrap gap-2 pt-3">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => onTabSelect(t.key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors',
                  activeTab === t.key ? 'bg-primary text-white' : 'bg-page text-muted hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
