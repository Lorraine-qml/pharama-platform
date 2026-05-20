import type { HatchSignStatus, SigningContract, SigningWorkbenchTask, SigningWorkbenchTab } from './hatchTypes'

export type WorkbenchKpi = {
  todayTodo: number
  overdue: number
  avgDays: string
}

export function daysUntil(end: string | null | undefined): number | null {
  if (!end) return null
  const d = new Date(end)
  if (Number.isNaN(d.getTime())) return null
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}

function templateLabel(c: SigningContract): string {
  return c.templateName ?? (c.incubationType === '实体' ? '实体入孵协议' : c.incubationType === '虚拟' ? '虚拟入孵协议' : '服务商认证协议')
}

export function buildWorkbenchTasks(contracts: SigningContract[], extra: SigningWorkbenchTask[]): SigningWorkbenchTask[] {
  const fromContracts: SigningWorkbenchTask[] = []

  for (const c of contracts) {
    if (c.signStatus === '待签署') {
      fromContracts.push({
        id: `wb-sign-${c.id}`,
        kind: 'sign',
        tab: 'todo',
        projectId: c.projectId,
        projectName: c.projectName,
        createdAt: c.createdAt ?? '2025-05-19',
        statusLabel: '待签署',
        contractId: c.id,
        templateLabel: templateLabel(c),
        overdue: isOverdue(c.createdAt ?? ''),
      })
    }
    if (c.signStatus === '即将到期') {
      const left = daysUntil(c.termEnd ?? c.contractEnd)
      fromContracts.push({
        id: `wb-renew-${c.id}`,
        kind: 'renew',
        tab: 'todo',
        projectId: c.projectId,
        projectName: c.projectName,
        createdAt: c.createdAt ?? '2025-05-01',
        statusLabel: '待处理',
        contractId: c.id,
        contractEnd: c.termEnd ?? c.contractEnd,
        daysLeft: left,
        overdue: left != null && left < 7,
      })
    }
    if (c.signStatus === '已到期' && !c.expireRemindHandled) {
      fromContracts.push({
        id: `wb-exp-${c.id}`,
        kind: 'expire_remind',
        tab: 'todo',
        projectId: c.projectId,
        projectName: c.projectName,
        createdAt: c.contractEnd ?? '2024-12-31',
        statusLabel: '未提醒',
        contractId: c.id,
        contractEnd: c.contractEnd,
        daysLeft: daysUntil(c.contractEnd),
        remindStatus: '未提醒',
        overdue: true,
      })
    }
    if (c.signStatus === '续约中') {
      fromContracts.push({
        id: `wb-ip-renew-${c.id}`,
        kind: 'renew',
        tab: 'in_progress',
        projectId: c.projectId,
        projectName: c.projectName,
        createdAt: c.createdAt ?? '2025-05-10',
        statusLabel: '续约中',
        contractId: c.id,
        contractEnd: c.termEnd ?? c.contractEnd,
      })
    }
    if (c.signStatus === '已生效') {
      const left = daysUntil(c.termEnd ?? c.contractEnd)
      const lastRemind = c.remindLogs?.[c.remindLogs.length - 1]
      if (left != null && left > 30 && lastRemind?.remindDay === 30) {
        fromContracts.push({
          id: `wb-exp-sent-${c.id}`,
          kind: 'expire_remind',
          tab: 'done',
          projectId: c.projectId,
          projectName: c.projectName,
          createdAt: lastRemind.remindTime.slice(0, 10),
          statusLabel: '已提醒',
          contractId: c.id,
          contractEnd: c.termEnd ?? c.contractEnd,
          daysLeft: left,
          remindStatus: '30天前已提醒',
        })
      }
    }
  }

  return [...extra, ...fromContracts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function isOverdue(createdAt: string): boolean {
  const t = Date.parse(createdAt)
  if (Number.isNaN(t)) return false
  return Date.now() - t > 5 * 86400000
}

export function filterWorkbenchTasks(
  tasks: SigningWorkbenchTask[],
  tab: SigningWorkbenchTab,
  kindFilter: '全部' | 'sign' | 'renew' | 'expire_remind',
  q: string,
): SigningWorkbenchTask[] {
  return tasks.filter((t) => {
    if (t.tab !== tab) return false
    if (kindFilter !== '全部' && t.kind !== kindFilter) return false
    if (q.trim() && !t.projectName.includes(q.trim()) && !t.statusLabel.includes(q.trim())) return false
    return true
  })
}

export function workbenchKpi(tasks: SigningWorkbenchTask[]): WorkbenchKpi {
  const todo = tasks.filter((t) => t.tab === 'todo')
  return {
    todayTodo: todo.length,
    overdue: todo.filter((t) => t.overdue).length || (todo.length > 0 ? 1 : 0),
    avgDays: '2.3',
  }
}

export function statusForList(status: HatchSignStatus): HatchSignStatus {
  return status
}
