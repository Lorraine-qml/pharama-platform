import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { StatusPill } from '../../components/ui/StatusPill'
import { useContractTemplates } from '../../contexts/ContractTemplatesContext'
import { hatchSignPillVariant } from '../../utils/listStatusVariants'
import { cn } from '../../utils/cn'
import { useHatchMgmt } from './HatchMgmtContext'
import { SigningFlowProgressModal } from './SigningFlowProgressModal'
import type { HatchIncubationType, HatchSignStatus, SigningContract } from './hatchTypes'

const INC_TYPES: (HatchIncubationType | '全部')[] = ['全部', '实体', '虚拟', '服务商']
const SIGN_STATUSES: (HatchSignStatus | '全部')[] = ['全部', '待签署', '已生效', '即将到期', '已到期', '已终止', '续约中']

export default function HatchSigningPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { contracts, archives, signContract, renewContract, sendReminder } = useHatchMgmt()
  const location = useLocation()
  const ct = useContractTemplates()
  const isOps = Boolean(user)

  const [fType, setFType] = useState<(typeof INC_TYPES)[number]>('全部')
  const [fStatus, setFStatus] = useState<(typeof SIGN_STATUSES)[number]>('全部')
  const [fExpire, setFExpire] = useState<'全部' | '本月' | '已过期'>('全部')
  const [q, setQ] = useState('')
  const [highlightContractId, setHighlightContractId] = useState<string | null>(null)

  const [signOpen, setSignOpen] = useState<SigningContract | null>(null)
  const [viewOpen, setViewOpen] = useState<SigningContract | null>(null)
  const [renewOpen, setRenewOpen] = useState<SigningContract | null>(null)
  const [flowOpen, setFlowOpen] = useState<SigningContract | null>(null)

  const [signTplId, setSignTplId] = useState('')
  const [signFile, setSignFile] = useState('')

  const [renewEnd, setRenewEnd] = useState('')
  const [renewRent, setRenewRent] = useState('')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (fType !== '全部' && c.incubationType !== fType) return false
      if (fStatus !== '全部' && c.signStatus !== fStatus) return false
      if (q.trim() && !c.projectName.includes(q.trim())) return false
      if (fExpire === '本月' && c.contractEnd) {
        const d = new Date(c.contractEnd)
        const now = new Date()
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false
      }
      if (fExpire === '已过期' && c.contractEnd) {
        if (new Date(c.contractEnd) >= new Date()) return false
      }
      return true
    })
  }, [contracts, fType, fStatus, fExpire, q])

  useEffect(() => {
    const sp = new URLSearchParams(location.search)
    const hc = sp.get('highlightContract')
    const pid = sp.get('projectId')
    if (hc) setHighlightContractId(hc)
    if (pid) {
      const arc = archives.find((a) => a.id === pid)
      const c = contracts.find((x) => x.projectId === pid)
      if (arc?.name) setQ(arc.name)
      else if (c?.projectName) setQ(c.projectName)
    }
    if (hc || pid) {
      setFStatus('待签署')
    }
  }, [location.search, archives, contracts])

  useEffect(() => {
    setPage(1)
  }, [fType, fStatus, fExpire, q])

  useEffect(() => {
    if (!highlightContractId) return
    const t = window.setTimeout(() => {
      document.getElementById(`hatch-sign-row-${highlightContractId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 120)
    return () => window.clearTimeout(t)
  }, [highlightContractId, filtered])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const signTemplateChoices = signOpen ? ct.templatesForSigning(signOpen.incubationType) : []

  function openSign(c: SigningContract) {
    const choices = ct.templatesForSigning(c.incubationType)
    const preferred =
      (c.templateId && choices.some((t) => t.id === c.templateId) ? c.templateId : undefined) ?? choices[0]?.id ?? ''
    setSignTplId(preferred)
    setSignFile('')
    setSignOpen(c)
  }

  function confirmSign() {
    if (!signOpen) return
    if (!signFile.trim()) {
      toast.show('请先选择或填写扫描件文件名', 'warning')
      return
    }
    if (signTemplateChoices.length === 0) {
      toast.show('没有与入孵类型匹配且启用中的模板，请先在「基础数据 → 合同模板管理」维护模板', 'warning')
      return
    }
    if (!signTplId) {
      toast.show('请选择协议模板', 'warning')
      return
    }
    signContract(signOpen.id, signFile.trim())
    setSignOpen(null)
    toast.show('协议状态已更新为「已生效」', 'success')
  }

  function confirmRenew() {
    if (!renewOpen) return
    const rent = Number(renewRent)
    if (!renewEnd.trim() || !Number.isFinite(rent)) {
      toast.show('请填写续约到期日与租金', 'warning')
      return
    }
    renewContract(renewOpen.id, renewEnd.trim(), rent)
    setRenewOpen(null)
    toast.show('已进入续约流程', 'success')
  }

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="📌 入孵签约管理 · 承接策源决策后的协议与续约"
        lines={[
          '承接策源决策结果，线下签署与续约；协议模板在「基础数据 → 合同模板管理」统一维护（字典标签由基础数据管理）。',
          ...(isOps
            ? [
                '合同模板已迁移至「基础数据 → 合同模板管理」，此处仅可选择「启用中」且与入孵类型匹配的模板。',
              ]
            : []),
          '签约状态：待签署 → 已生效 → 即将到期 → 已到期 / 已终止。',
        ]}
      />

      <ListToolbarRow
        left={
          isOps ? (
            <button
              type="button"
              className="rounded-[var(--radius-button)] border border-divider bg-surface px-4 py-2 text-[13px] font-semibold text-foreground hover:border-primary/40"
              onClick={() => toast.show('导出任务已加入队列（演示）', 'info')}
            >
              导出
            </button>
          ) : null
        }
        right={
          <>
            <label className="text-[12px] text-muted">
              入孵类型
              <select value={fType} onChange={(e) => setFType(e.target.value as (typeof INC_TYPES)[number])} className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]">
                {INC_TYPES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="text-[12px] text-muted">
              签约状态
              <select value={fStatus} onChange={(e) => setFStatus(e.target.value as (typeof SIGN_STATUSES)[number])} className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]">
                {SIGN_STATUSES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="text-[12px] text-muted">
              到期时间
              <select value={fExpire} onChange={(e) => setFExpire(e.target.value as typeof fExpire)} className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]">
                <option>全部</option>
                <option>本月</option>
                <option>已过期</option>
              </select>
            </label>
            <label className="min-w-[180px] text-[12px] text-muted">
              项目名称
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索"
                className="mt-1 w-full rounded-md border border-divider px-3 py-2 text-[13px]"
              />
            </label>
          </>
        }
      />

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-divider bg-surface text-[14px] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full border-collapse">
            <thead className="sticky top-0 z-[1] border-b border-divider bg-[#F5F7FA] text-left text-[12px] font-bold text-muted">
              <tr>
                <th className="px-4 py-3">项目名称</th>
                <th className="px-4 py-3">入孵类型</th>
                <th className="px-4 py-3">签约状态</th>
                <th className="px-4 py-3">合同到期日</th>
                <th className="px-4 py-3">租金(元/月)</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => (
                <tr
                  id={`hatch-sign-row-${c.id}`}
                  key={c.id}
                  className={cn(
                    'h-12 border-b border-divider last:border-0 hover:bg-primary-light/15',
                    highlightContractId === c.id && 'bg-primary/8 ring-2 ring-inset ring-primary/30',
                  )}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{c.projectName}</td>
                  <td className="px-4 py-3 text-muted">{c.incubationType}</td>
                  <td className="px-4 py-3">
                    <StatusPill variant={hatchSignPillVariant(c.signStatus)}>{c.signStatus}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.contractEnd ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{c.rentYuanPerMonth ?? '—'}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex flex-wrap justify-end gap-2 text-[13px]">
                      {isOps && c.signStatus === '待签署' ? (
                        <button type="button" className="font-semibold text-primary hover:underline" onClick={() => openSign(c)}>
                          签署
                        </button>
                      ) : null}
                      {isOps && ['已生效', '即将到期', '已到期'].includes(c.signStatus) ? (
                        <button
                          type="button"
                          className="font-semibold text-primary hover:underline"
                          onClick={() => {
                            setRenewEnd('')
                            setRenewRent(String(c.rentYuanPerMonth ?? ''))
                            setRenewOpen(c)
                          }}
                        >
                          续约
                        </button>
                      ) : null}
                      {isOps && ['待签署', '即将到期', '已到期', '续约中'].includes(c.signStatus) ? (
                        <button type="button" className="font-semibold text-muted hover:underline" onClick={() => sendReminder(c.id, c.signStatus === '待签署' ? '催签' : '续约', c.projectName)}>
                          提醒
                        </button>
                      ) : null}
                      {isOps ? (
                        <Link to={`/hatch/archive/${c.projectId}`} className="font-semibold text-primary hover:underline">
                          档案
                        </Link>
                      ) : null}
                      <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setFlowOpen(c)}>
                        流程进度
                      </button>
                      <button type="button" className="font-semibold text-muted hover:underline" onClick={() => setViewOpen(c)}>
                        查看
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ListPaginationBar total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1) }} />
      </div>

      <Modal
        open={signOpen !== null}
        title={signOpen ? `签署协议 · ${signOpen.projectName}` : ''}
        onClose={() => setSignOpen(null)}
        closeOnOverlayClick={false}
        panelClassName="max-w-[600px]"
        footer={
          <>
            <button type="button" className="rounded-[var(--radius-button)] border border-divider px-4 py-2 text-[13px]" onClick={() => setSignOpen(null)}>
              取消
            </button>
            <button type="button" className="rounded-[var(--radius-button)] bg-primary px-5 py-2 text-[13px] font-bold text-white" onClick={confirmSign}>
              确认签署
            </button>
          </>
        }
      >
        {signOpen ? (
          <div className="space-y-4 text-[13px]">
            <label className="flex flex-col gap-2 text-muted">
              协议模板
              {signTemplateChoices.length === 0 ? (
                <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12px] text-foreground">
                  当前入孵类型下没有「启用中」的模板，请先到{' '}
                  <Link to="/basic/contracts" className="font-semibold text-primary underline-offset-2 hover:underline">
                    合同模板管理
                  </Link>{' '}
                  启用或新建模板。
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <select value={signTplId} onChange={(e) => setSignTplId(e.target.value)} className="flex-1 rounded-md border border-divider bg-page px-3 py-2">
                    {signTemplateChoices.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}（{t.applicableType} · {t.version}）
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="rounded-md border border-divider px-3 py-2 text-[12px]"
                    onClick={() => {
                      const t = ct.getById(signTplId)
                      toast.show(t ? `模板预览：${t.name}（演示，变量已替换为假数据）` : '请先选择模板', 'info')
                    }}
                  >
                    预览
                  </button>
                </div>
              )}
            </label>
            <p className="text-muted">
              入孵期限：<span className="text-foreground">{signOpen.termStart ?? '—'} 至 {signOpen.termEnd ?? '—'}</span>
            </p>
            <div className="rounded-md border border-divider bg-page p-3 text-[12px] text-foreground">
              <p className="font-bold text-foreground">费用明细</p>
              <p className="mt-1">租金：{signOpen.rentYuanPerMonth ?? '—'} 元/月 · 物业费：{signOpen.propertyFee ?? 0} 元/月</p>
              <p>AI 服务套餐：{signOpen.aiPackage ?? '—'}</p>
              <p>需求确认：{signOpen.spaceNeed ?? '—'}</p>
            </div>
            <div>
              <p className="mb-2 font-bold text-foreground">线下签署</p>
              <p className="mb-2 text-[12px] text-muted">① 下载协议</p>
              <button type="button" className="rounded-md border border-primary/40 bg-primary-light px-3 py-1.5 text-[12px] font-bold text-primary" onClick={() => toast.show('已生成下载链接（演示）', 'info')}>
                下载 PDF
              </button>
              <p className="mb-2 mt-4 text-[12px] text-muted">② 盖章后上传扫描件文件名（演示）</p>
              <input value={signFile} onChange={(e) => setSignFile(e.target.value)} placeholder="例如 signed_scan.pdf" className="w-full rounded-md border border-divider px-3 py-2" />
            </div>
            <p className="text-[11px] text-muted">确认后状态变为「已生效」，扫描件归档至项目档案附件库（演示逻辑）。电子签章接口预留。</p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={viewOpen !== null}
        title={viewOpen ? `签约详情 · ${viewOpen.projectName}` : ''}
        onClose={() => setViewOpen(null)}
        panelClassName="max-w-lg"
        footer={
          <button type="button" className="rounded-[var(--radius-button)] bg-primary px-5 py-2 text-[13px] font-semibold text-white" onClick={() => setViewOpen(null)}>
            关闭
          </button>
        }
      >
        {viewOpen ? (
          <dl className="grid gap-2 text-[13px]">
            <div className="flex justify-between gap-2"><dt className="text-muted">状态</dt><dd>{viewOpen.signStatus}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted">入孵类型</dt><dd>{viewOpen.incubationType}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted">到期日</dt><dd>{viewOpen.contractEnd ?? '—'}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted">租金</dt><dd>{viewOpen.rentYuanPerMonth ?? '—'}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted">扫描件</dt><dd>{viewOpen.scanFileName ?? '—'}</dd></div>
          </dl>
        ) : null}
      </Modal>

      <Modal
        open={renewOpen !== null}
        title={renewOpen ? `续约 · ${renewOpen.projectName}` : ''}
        onClose={() => setRenewOpen(null)}
        panelClassName="max-w-md"
        footer={
          <>
            <button type="button" className="rounded-md border px-4 py-2 text-[13px]" onClick={() => setRenewOpen(null)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-primary px-5 py-2 text-[13px] font-bold text-white" onClick={confirmRenew}>
              生成新协议
            </button>
          </>
        }
      >
        {renewOpen ? (
          <div className="space-y-3 text-[13px]">
            <p className="text-muted">原协议将标记为已终止，新协议签署后生效（演示）。</p>
            <label className="flex flex-col gap-1 text-muted">
              新合同到期日
              <input type="date" value={renewEnd} onChange={(e) => setRenewEnd(e.target.value)} className="rounded-md border px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1 text-muted">
              租金(元/月)
              <input value={renewRent} onChange={(e) => setRenewRent(e.target.value)} className="rounded-md border px-3 py-2" />
            </label>
          </div>
        ) : null}
      </Modal>

      <SigningFlowProgressModal contract={flowOpen} open={flowOpen != null} onClose={() => setFlowOpen(null)} />
    </div>
  )
}
