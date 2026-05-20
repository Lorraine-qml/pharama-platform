import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { ChangeApprovalModal } from './ChangeApprovalModal'
import { ExitApprovalModal } from './ExitApprovalModal'
import { RenewContractModal } from './RenewContractModal'
import { SendContractReminderModal } from './SendContractReminderModal'
import { SigningProcessModal } from './SigningProcessModal'
import { useHatchMgmt } from './HatchMgmtContext'
import {
  OPS_KIND_LABEL,
  OPS_KIND_STYLE,
  buildOpsWorkbenchTasks,
  filterOpsTasks,
  opsWorkbenchKpi,
} from './hatchOpsWorkbenchModel'
import type { ChangeRequest, HatchOpsTaskKind, HatchOpsWorkbenchTab, HatchOpsWorkbenchTask, SigningContract } from './hatchTypes'

const TABS: { key: HatchOpsWorkbenchTab; label: string }[] = [
  { key: 'todo', label: '我的待办' },
  { key: 'in_progress', label: '进行中' },
  { key: 'done', label: '我的已办' },
]

const KIND_FILTERS: { key: '全部' | HatchOpsTaskKind; label: string }[] = [
  { key: '全部', label: '全部' },
  { key: 'sign', label: '签约' },
  { key: 'space', label: '空间分配' },
  { key: 'change', label: '变更审批' },
  { key: 'exit', label: '毕业/退出' },
  { key: 'renew', label: '续约' },
  { key: 'expire_remind', label: '到期提醒' },
]

export function HatchOpsWorkbenchPage() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const isOps = user?.role === 'platform' || user?.role === 'enterprise-admin'
  const {
    contracts,
    changes,
    archives,
    allocations,
    confirmWorkbenchSigning,
    startRenewalWorkbench,
    sendExpireContractReminder,
    markExpireReminderHandled,
    approveChange,
    rejectChange,
    completeExit,
    dismissedWorkbenchTaskIds,
    dismissWorkbenchTask,
  } = useHatchMgmt()

  const [tab, setTab] = useState<HatchOpsWorkbenchTab>('todo')
  const [kindFilter, setKindFilter] = useState<'全部' | HatchOpsTaskKind>('全部')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [signTask, setSignTask] = useState<HatchOpsWorkbenchTask | null>(null)
  const [signContract, setSignContract] = useState<SigningContract | null>(null)
  const [changeTask, setChangeTask] = useState<ChangeRequest | null>(null)
  const [exitTask, setExitTask] = useState<ChangeRequest | null>(null)
  const [renewContract, setRenewContract] = useState<SigningContract | null>(null)
  const [remindTask, setRemindTask] = useState<HatchOpsWorkbenchTask | null>(null)

  const allTasks = useMemo(() => {
    const built = buildOpsWorkbenchTasks(contracts, changes, archives, allocations)
    return built.filter((t) => !dismissedWorkbenchTaskIds.includes(t.id))
  }, [contracts, changes, archives, allocations, dismissedWorkbenchTaskIds])

  const filtered = useMemo(() => filterOpsTasks(allTasks, tab, kindFilter, q), [allTasks, tab, kindFilter, q])
  const kpi = useMemo(() => opsWorkbenchKpi(allTasks), [allTasks])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  useEffect(() => setPage(1), [tab, kindFilter, q, pageSize])

  useEffect(() => {
    const pid = new URLSearchParams(location.search).get('projectId')
    if (!pid) return
    const task = allTasks.find((t) => t.projectId === pid && t.kind === 'sign' && t.tab === 'todo')
    if (!task) return
    openSign(task)
  }, [location.search, allTasks])

  function contractFor(task: HatchOpsWorkbenchTask | null | undefined) {
    if (!task) return undefined
    return task.contractId ? contracts.find((c) => c.id === task.contractId) : undefined
  }

  function changeFor(task: HatchOpsWorkbenchTask | null | undefined) {
    if (!task) return undefined
    return task.changeId ? changes.find((c) => c.id === task.changeId) : undefined
  }

  function openSign(task: HatchOpsWorkbenchTask) {
    setSignTask(task)
    setSignContract(contractFor(task) ?? null)
  }

  function archiveLink(task: HatchOpsWorkbenchTask, tabHint = 'signing') {
    return `/hatch/archive/${task.projectId}?tab=${tabHint}`
  }

  function handleSignComplete(payload: Parameters<typeof confirmWorkbenchSigning>[1], taskId?: string) {
    confirmWorkbenchSigning(signContract?.id ?? signTask?.contractId ?? null, payload, true, taskId ?? signTask?.id)
    setSignTask(null)
    setSignContract(null)
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-bold text-foreground">入孵运营工作台</h1>
        <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px] font-semibold hover:border-primary/40" onClick={() => toast.show('列表已刷新', 'info')}>
          刷新
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: '今日待办', value: kpi.todayTodo },
          { label: '逾期任务', value: kpi.overdue },
          { label: '平均处理时长', value: `${kpi.avgDays}天` },
        ].map((item) => (
          <div key={item.label} className="rounded-[var(--radius-card)] border border-divider bg-surface px-4 py-4 shadow-sm">
            <p className="text-[12px] text-muted">{item.label}</p>
            <p className="mt-1 text-[22px] font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-divider pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={cn('rounded-md px-4 py-2 text-[13px] font-semibold', tab === t.key ? 'bg-primary text-white' : 'text-muted hover:bg-page')}
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
          <table className="min-w-[1000px] w-full border-collapse text-[13px]">
            <thead className="border-b border-divider bg-[#F5F7FA] text-left text-[12px] font-bold text-muted">
              <tr>
                <th className="w-[100px] px-4 py-3">任务类型</th>
                <th className="w-[180px] px-4 py-3">项目名称</th>
                <th className="w-[120px] px-4 py-3">创建/到期时间</th>
                <th className="min-w-[300px] px-4 py-3">任务摘要</th>
                <th className="w-[80px] px-4 py-3">状态</th>
                <th className="w-[150px] px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    当前 Tab 下暂无任务
                  </td>
                </tr>
              ) : (
                paged.map((task) => {
                  const style = OPS_KIND_STYLE[task.kind]
                  return (
                    <tr key={task.id} className="border-b border-divider hover:bg-primary-light/10">
                      <td className="px-4 py-3">
                        <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold', style.bg, style.text)}>
                          {OPS_KIND_LABEL[task.kind]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={archiveLink(task)} className="font-medium text-primary hover:underline">
                          {task.projectName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">{task.timeLabel}</td>
                      <td className="px-4 py-3 text-muted">{task.summary}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            task.statusLabel.includes('已提醒') ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning',
                            task.statusLabel === '未提醒' && 'bg-muted/30 text-muted',
                          )}
                        >
                          {task.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <TaskOps
                          task={task}
                          tab={tab}
                          isOps={isOps}
                          onSign={() => openSign(task)}
                          onSpace={() => navigate(`/hatch/physical-space?projectId=${encodeURIComponent(task.projectId)}`)}
                          onChange={() => {
                            const ch = changeFor(task)
                            if (ch) setChangeTask(ch)
                          }}
                          onExit={() => {
                            const ch = changeFor(task)
                            if (ch) setExitTask(ch)
                          }}
                          onRenew={() => {
                            const c = contractFor(task)
                            if (c) setRenewContract(c)
                          }}
                          onRemind={() => setRemindTask(task)}
                          onMark={() => task.contractId && markExpireReminderHandled(task.contractId)}
                          archiveLink={archiveLink(task)}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <ListPaginationBar
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(n: number) => {
            setPageSize(n)
            setPage(1)
          }}
        />
      </div>

      <SigningProcessModal
        open={signTask !== null}
        contract={signContract}
        projectId={signTask?.projectId ?? ''}
        projectName={signTask?.projectName ?? ''}
        workbenchTaskId={signTask?.id}
        onClose={() => {
          setSignTask(null)
          setSignContract(null)
        }}
        onComplete={handleSignComplete}
      />

      <ChangeApprovalModal
        change={changeTask}
        open={changeTask !== null}
        onClose={() => setChangeTask(null)}
        onApprove={(opinion, space) => {
          if (changeTask) {
            approveChange(changeTask.id, opinion, space)
            dismissWorkbenchTask(`ops-change-${changeTask.id}`)
          }
          setChangeTask(null)
        }}
        onReject={(opinion) => {
          if (changeTask) {
            rejectChange(changeTask.id, opinion)
            dismissWorkbenchTask(`ops-change-${changeTask.id}`)
          }
          setChangeTask(null)
        }}
      />

      <ExitApprovalModal
        change={exitTask}
        open={exitTask !== null}
        onClose={() => setExitTask(null)}
        onApprove={(opinion) => {
          if (exitTask) {
            completeExit(exitTask.id, opinion)
            dismissWorkbenchTask(`ops-exit-${exitTask.id}`)
          }
          setExitTask(null)
        }}
        onReject={(opinion) => {
          if (exitTask) {
            rejectChange(exitTask.id, opinion)
            dismissWorkbenchTask(`ops-exit-${exitTask.id}`)
          }
          setExitTask(null)
        }}
      />

      <RenewContractModal
        contract={renewContract}
        open={renewContract !== null}
        onClose={() => setRenewContract(null)}
        onConfirm={(payload) => {
          if (renewContract) {
            startRenewalWorkbench(renewContract.id, payload, false)
            dismissWorkbenchTask(`ops-renew-${renewContract.id}`)
          }
          setRenewContract(null)
        }}
      />

      <SendContractReminderModal
        open={remindTask !== null}
        projectName={remindTask?.projectName ?? ''}
        contractEnd={contractFor(remindTask)?.contractEnd ?? remindTask?.contractEnd}
        onClose={() => setRemindTask(null)}
        onConfirm={(methods) => {
          const id = remindTask?.contractId ?? contractFor(remindTask)?.id
          if (id) sendExpireContractReminder(id, methods)
          setRemindTask(null)
        }}
      />
    </div>
  )
}

function TaskOps({
  task,
  tab,
  isOps,
  onSign,
  onSpace,
  onChange,
  onExit,
  onRenew,
  onRemind,
  onMark,
  archiveLink,
}: {
  task: HatchOpsWorkbenchTask
  tab: HatchOpsWorkbenchTab
  isOps: boolean
  onSign: () => void
  onSpace: () => void
  onChange: () => void
  onExit: () => void
  onRenew: () => void
  onRemind: () => void
  onMark: () => void
  archiveLink: string
}) {
  const link = 'font-semibold text-primary hover:underline'
  const muted = 'font-semibold text-muted hover:underline'

  if (!isOps || tab === 'done') {
    return (
      <Link to={archiveLink} className={muted}>
        查看
      </Link>
    )
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {task.kind === 'sign' ? (
        <button type="button" className={link} onClick={onSign}>
          去处理
        </button>
      ) : null}
      {task.kind === 'space' ? (
        <button type="button" className={link} onClick={onSpace}>
          去分配
        </button>
      ) : null}
      {task.kind === 'change' ? (
        <button type="button" className={link} onClick={onChange}>
          去审批
        </button>
      ) : null}
      {task.kind === 'exit' ? (
        <button type="button" className={link} onClick={onExit}>
          去审批
        </button>
      ) : null}
      {task.kind === 'renew' ? (
        <>
          <button type="button" className={link} onClick={onRenew}>
            发起续约
          </button>
          <button type="button" className={muted} onClick={onRemind}>
            提醒
          </button>
        </>
      ) : null}
      {task.kind === 'expire_remind' ? (
        <>
          <button type="button" className={link} onClick={onRemind}>
            {task.remindStatus?.includes('已提醒') ? '再次提醒' : '发送提醒'}
          </button>
          <button type="button" className={muted} onClick={onMark}>
            标记已处理
          </button>
        </>
      ) : null}
      <Link to={archiveLink} className={muted}>
        查看
      </Link>
    </div>
  )
}
