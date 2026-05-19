import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { useHatchMgmt } from './HatchMgmtContext'
import { HatchFlowNodeDetailModal, HatchProjectFlowBar } from './HatchProjectFlowBar'
import type { ChangeRequest, FlowNodeKey, FundingRow, MajorEvent, PipelineItem, TeamArchiveRow } from './hatchTypes'

const TABS = [
  ['basic', '基本信息'],
  ['pipeline', '产品管线'],
  ['team', '团队档案'],
  ['funding', '融资档案'],
  ['resource', '资源需求/供给'],
  ['eval', '评估记录'],
  ['events', '重大事件'],
  ['space', '空间历史'],
  ['history', '变更历史'],
] as const

export default function HatchArchiveDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  const h = useHatchMgmt()
  const isOps = Boolean(user)

  const proj = useMemo(() => h.archives.find((a) => a.id === projectId), [h.archives, projectId])
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('basic')

  const [flowModal, setFlowModal] = useState<{ title: string; body: string } | null>(null)
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
            <Link to="/hatch/changes" className="rounded-md border border-divider px-3 py-2 text-[13px] hover:border-primary/40">
              变更台账
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

      <div className="flex flex-wrap gap-2 border-b border-divider">
        {TABS.map(([k, lab]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn('rounded-t-md px-3 py-2 text-[13px] font-semibold', tab === k ? 'bg-primary text-white' : 'text-muted hover:bg-page')}
          >
            {lab}
          </button>
        ))}
      </div>

      <section className="rounded-[var(--radius-card)] border border-divider bg-surface p-5 shadow-sm">
        {tab === 'basic' ? (
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

        {tab === 'pipeline' ? (
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
        ) : null}

        {tab === 'team' ? (
          <div className="space-y-3">
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
        ) : null}

        {tab === 'funding' ? (
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
        ) : null}

        {tab === 'resource' ? (
          <div className="space-y-4 text-[13px]">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-bold">资源需求</span>
                {isOps ? (
                  <button type="button" className="text-primary hover:underline" onClick={() => { setResD(proj.resourceDemand); setResS(proj.resourceSupply); setResOpen(true) }}>
                    编辑
                  </button>
                ) : null}
              </div>
              <p className="rounded-md border border-divider bg-page p-3 text-muted">{proj.resourceDemand}</p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-bold">资源供给</span>
              </div>
              <p className="rounded-md border border-divider bg-page p-3 text-muted">{proj.resourceSupply}</p>
            </div>
          </div>
        ) : null}

        {tab === 'eval' ? (
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

        {tab === 'events' ? (
          <div className="space-y-3">
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
        ) : null}

        {tab === 'space' ? (
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
        ) : null}

        {tab === 'history' ? (
          <div>
            <h3 className="mb-3 text-[14px] font-bold">变更历史（只读）</h3>
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
        ) : null}
      </section>

      <HatchFlowNodeDetailModal open={flowModal !== null} title={flowModal?.title ?? ''} body={flowModal?.body ?? ''} onClose={() => setFlowModal(null)} />

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
