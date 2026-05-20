import { Link, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { useHatchMgmt } from './HatchMgmtContext'
import { EXTRA_SIGNING_WORKBENCH_TASKS } from './hatchSigningWorkbenchSeed'
import {
  buildWorkbenchTasks,
  filterWorkbenchTasks,
  workbenchKpi,
  type WorkbenchKpi,
} from './hatchSigningWorkbenchModel'
import type { SigningContract, SigningTaskKind, SigningWorkbenchTab, SigningWorkbenchTask } from './hatchTypes'
import { SignAgreementModal } from './SignAgreementModal'
import { SendContractReminderModal } from './SendContractReminderModal'
import { ContractDetailReadonlyModal } from './ContractDetailReadonlyModal'

const TABS: { key: SigningWorkbenchTab; label: string }[] = [
  { key: 'todo', label: '我的待办' },
  { key: 'in_progress', label: '进行中' },
  { key: 'done', label: '我的已办' },
]

const KIND_FILTERS: { key: '全部' | SigningTaskKind; label: string }[] = [
  { key: '全部', label: '全部' },
  { key: 'sign', label: '签约' },
  { key: 'renew', label: '续约' },
  { key: 'expire_remind', label: '到期提醒' },
]

const KIND_LABEL: Record<SigningTaskKind, string> = {
  sign: '签约',
  renew: '续约',
  expire_remind: '到期提醒',
}

type SignCtx = {
  mode: 'sign' | 'renew'
  task: SigningWorkbenchTask
  contract?: SigningContract
}

type RemindCtx = { task: SigningWorkbenchTask; contract?: SigningContract }

function formatDaysLeft(days: number | null | undefined): string {
  if (days == null) return '—'
  if (days < 0) return '已过期'
  return `${days}天`
}

function taskTimeLabel(task: SigningWorkbenchTask): string {
  if (task.kind === 'sign') return task.createdAt
  return task.contractEnd ?? '—'
}

function taskStatusLabel(task: SigningWorkbenchTask): string {
  if (task.kind === 'expire_remind') return task.remindStatus ?? task.statusLabel
  return task.statusLabel
}

export function HatchSigningWorkbenchPage() {
  const { user } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const isOps = user?.role === 'platform' || user?.role === 'enterprise-admin'
  const {
    contracts,
    confirmWorkbenchSigning,
    startRenewalWorkbench,
    sendExpireContractReminder,
    markExpireReminderHandled,
    dismissedWorkbenchTaskIds,
  } = useHatchMgmt()

  const [tab, setTab] = useState<SigningWorkbenchTab>('todo')
  const [kindFilter, setKindFilter] = useState<'全部' | SigningTaskKind>('全部')
  const [q, setQ] = useState('')
  const [signCtx, setSignCtx] = useState<SignCtx | null>(null)
  const [remindCtx, setRemindCtx] = useState<RemindCtx | null>(null)
  const [viewContract, setViewContract] = useState<SigningContract | null>(null)

  const allTasks = useMemo(() => {
    const extra = EXTRA_SIGNING_WORKBENCH_TASKS.filter((t) => !dismissedWorkbenchTaskIds.includes(t.id))
    return buildWorkbenchTasks(contracts, extra).filter((t) => !dismissedWorkbenchTaskIds.includes(t.id))
  }, [contracts, dismissedWorkbenchTaskIds])

  const filtered = useMemo(() => filterWorkbenchTasks(allTasks, tab, kindFilter, q), [allTasks, tab, kindFilter, q])
  const kpi = useMemo(() => workbenchKpi(allTasks), [allTasks])

  useEffect(() => {
    const pid = new URLSearchParams(location.search).get('projectId')
    if (!pid) return
    const task = allTasks.find((t) => t.projectId === pid && t.kind === 'sign' && t.tab === 'todo')
    if (!task) return
    const c = task.contractId ? contracts.find((x) => x.id === task.contractId) : undefined
    setTab('todo')
    setKindFilter('sign')
    setSignCtx({ mode: 'sign', task, contract: c })
  }, [location.search, allTasks, contracts])

  function contractFor(task: SigningWorkbenchTask) {
    return task.contractId ? contracts.find((c) => c.id === task.contractId) : undefined
  }

  function handleSignConfirm(payload: Parameters<typeof confirmWorkbenchSigning>[1], hasScan: boolean) {
    if (!signCtx) return
    const { task, mode, contract } = signCtx
    if (mode === 'renew' && contract) {
      startRenewalWorkbench(contract.id, payload, hasScan)
    } else {
      confirmWorkbenchSigning(contract?.id ?? task.contractId ?? null, payload, hasScan, task.id)
    }
    setSignCtx(null)
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-bold text-foreground">签约工作台</h1>
        <button
          type="button"
          className="rounded-[var(--radius-button)] border border-divider px-4 py-2 text-[13px] font-semibold hover:border-primary/40"
          onClick={() => toast.show('列表已刷新', 'info')}
        >
          刷新
        </button>
      </div>

      <KpiRow kpi={kpi} />

      <div className="flex flex-wrap gap-2 border-b border-divider pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={cn(
              'rounded-md px-4 py-2 text-[13px] font-semibold',
              tab === t.key ? 'bg-primary text-white' : 'text-muted hover:bg-page',
            )}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="text-muted">任务类型快捷筛选：</span>
        {KIND_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={cn(
              'rounded-full border px-3 py-1',
              kindFilter === f.key ? 'border-primary bg-primary-light font-semibold text-primary' : 'border-divider text-muted',
            )}
            onClick={() => setKindFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索任务或项目名称"
          className="ml-auto min-w-[200px] flex-1 rounded-md border border-divider px-3 py-2 sm:max-w-xs"
        />
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-divider bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full border-collapse text-[13px]">
            <thead className="sticky top-0 z-[1] border-b border-divider bg-[#F5F7FA] text-left text-[12px] font-bold text-muted">
              <tr>
                <th className="px-4 py-3">任务类型</th>
                <th className="px-4 py-3">项目名称</th>
                <th className="px-4 py-3">创建/到期时间</th>
                <th className="px-4 py-3">合同模板</th>
                <th className="px-4 py-3">剩余天数</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">
                    当前 Tab 下暂无任务
                  </td>
                </tr>
              ) : (
                filtered.map((task) => {
                  const c = contractFor(task)
                  const kind = task.kind
                  return (
                    <tr key={task.id} className="border-b border-divider last:border-0 hover:bg-primary-light/10">
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-block rounded px-2 py-0.5 text-[12px] font-semibold',
                            kind === 'sign' && 'bg-primary-light text-primary',
                            kind === 'renew' && 'bg-amber-50 text-amber-800',
                            kind === 'expire_remind' && 'bg-red-50 text-red-700',
                          )}
                        >
                          {KIND_LABEL[kind]}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{task.projectName}</td>
                      <td className="px-4 py-3 text-muted">{taskTimeLabel(task)}</td>
                      <td className="px-4 py-3 text-muted">{kind === 'sign' ? task.templateLabel ?? '—' : '—'}</td>
                      <td className="px-4 py-3 text-muted">
                        {kind === 'sign' ? '—' : formatDaysLeft(task.daysLeft)}
                      </td>
                      <td className="px-4 py-3">{taskStatusLabel(task)}</td>
                      <td className="px-4 py-3 text-end">
                        <TaskActions
                          task={task}
                          contract={c}
                          tab={tab}
                          isOps={isOps}
                          onSign={() => setSignCtx({ mode: 'sign', task, contract: c })}
                          onRenew={() => c && setSignCtx({ mode: 'renew', task, contract: c })}
                          onRemind={() => setRemindCtx({ task, contract: c })}
                          onMarkHandled={() => task.contractId && markExpireReminderHandled(task.contractId)}
                          onViewContract={() => c && setViewContract(c)}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 ? (
          <p className="border-t border-divider px-4 py-2 text-[12px] text-muted">共 {filtered.length} 条</p>
        ) : null}
      </div>

      <SignAgreementModal
        open={signCtx !== null}
        mode={signCtx?.mode ?? 'sign'}
        contract={signCtx?.contract}
        projectId={signCtx?.task?.projectId ?? ''}
        projectName={signCtx?.task?.projectName ?? ''}
        decisionNote={signCtx?.task?.decisionNote}
        onClose={() => setSignCtx(null)}
        onConfirm={handleSignConfirm}
      />

      <SendContractReminderModal
        open={remindCtx !== null}
        projectName={remindCtx?.task.projectName ?? ''}
        contractEnd={remindCtx?.contract?.contractEnd ?? remindCtx?.task.contractEnd}
        onClose={() => setRemindCtx(null)}
        onConfirm={(methods) => {
          const id = remindCtx?.contract?.id ?? remindCtx?.task.contractId
          if (id) sendExpireContractReminder(id, methods)
          setRemindCtx(null)
        }}
      />

      <ContractDetailReadonlyModal contract={viewContract} open={viewContract !== null} onClose={() => setViewContract(null)} />
    </div>
  )
}

function TaskActions({
  task,
  contract,
  tab,
  isOps,
  onSign,
  onRenew,
  onRemind,
  onMarkHandled,
  onViewContract,
}: {
  task: SigningWorkbenchTask
  contract?: SigningContract
  tab: SigningWorkbenchTab
  isOps: boolean
  onSign: () => void
  onRenew: () => void
  onRemind: () => void
  onMarkHandled: () => void
  onViewContract: () => void
}) {
  const kind = task.kind
  const linkClass = 'font-semibold text-primary hover:underline'
  const mutedClass = 'font-semibold text-muted hover:underline'

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {isOps && kind === 'sign' && tab === 'todo' ? (
        <button type="button" className={linkClass} onClick={onSign}>
          立即签署
        </button>
      ) : null}
      {isOps && kind === 'renew' && tab === 'todo' ? (
        <>
          <button type="button" className={linkClass} onClick={onRenew}>
            发起续约
          </button>
          <button type="button" className={mutedClass} onClick={onRemind}>
            发送提醒
          </button>
        </>
      ) : null}
      {isOps && kind === 'expire_remind' && tab !== 'done' ? (
        <>
          <button type="button" className={linkClass} onClick={onRemind}>
            {task.remindStatus?.includes('已提醒') ? '再次提醒' : '发送提醒'}
          </button>
          <button type="button" className={mutedClass} onClick={onMarkHandled}>
            标记已处理
          </button>
        </>
      ) : null}
      {contract ? (
        <button type="button" className={mutedClass} onClick={onViewContract}>
          {kind === 'sign' ? '查看项目' : '查看合同'}
        </button>
      ) : (
        <Link to={`/hatch/archive/${task.projectId}`} className={linkClass}>
          查看项目
        </Link>
      )}
    </div>
  )
}

function KpiRow({ kpi }: { kpi: WorkbenchKpi }) {
  const items = [
    { label: '今日待办', value: kpi.todayTodo },
    { label: '逾期任务', value: kpi.overdue },
    { label: '平均处理时长', value: `${kpi.avgDays}天` },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-[var(--radius-card)] border border-divider bg-surface px-4 py-4 shadow-sm">
          <p className="text-[12px] text-muted">{item.label}</p>
          <p className="mt-1 text-[22px] font-bold text-foreground">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
