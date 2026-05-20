import type { ChangeRequest, ProjectArchive, SigningContract, SpaceAllocation } from './hatchTypes'
import type { HatchOpsTaskKind, HatchOpsWorkbenchTab, HatchOpsWorkbenchTask } from './hatchTypes'
import { daysUntil } from './hatchSigningWorkbenchModel'
import { EXTRA_SIGNING_WORKBENCH_TASKS } from './hatchSigningWorkbenchSeed'

export type OpsKpi = { todayTodo: number; overdue: number; avgDays: string }

const KIND_ORDER: HatchOpsTaskKind[] = ['sign', 'space', 'change', 'exit', 'renew', 'expire_remind']

export const OPS_KIND_LABEL: Record<HatchOpsTaskKind, string> = {
  sign: '签约',
  space: '空间分配',
  change: '变更审批',
  exit: '毕业/退出',
  renew: '续约',
  expire_remind: '到期提醒',
}

export const OPS_KIND_STYLE: Record<HatchOpsTaskKind, { bg: string; text: string }> = {
  sign: { bg: 'bg-[#1E6DFF]/12', text: 'text-[#1E6DFF]' },
  space: { bg: 'bg-[#00C9A7]/12', text: 'text-[#00C9A7]' },
  change: { bg: 'bg-[#FF8A34]/12', text: 'text-[#FF8A34]' },
  exit: { bg: 'bg-[#A88BFF]/12', text: 'text-[#A88BFF]' },
  renew: { bg: 'bg-[#29B6F6]/12', text: 'text-[#29B6F6]' },
  expire_remind: { bg: 'bg-[#F44336]/12', text: 'text-[#F44336]' },
}

export const EXTRA_OPS_TASKS: HatchOpsWorkbenchTask[] = [
  {
    id: 'ops-space-ai',
    kind: 'space',
    tab: 'todo',
    projectId: 'h-proj-2',
    projectName: 'AI 新药平台',
    timeLabel: '2025-05-17',
    summary: '需求：8 人办公，细胞培养实验',
    statusLabel: '待分配',
  },
  ...EXTRA_SIGNING_WORKBENCH_TASKS.map((t) => ({
    id: t.id,
    kind: 'sign' as const,
    tab: t.tab as HatchOpsWorkbenchTab,
    projectId: t.projectId,
    projectName: t.projectName,
    timeLabel: t.createdAt,
    summary: `合同模板：${t.templateLabel ?? '—'}`,
    statusLabel: t.statusLabel,
    contractId: t.contractId,
    templateLabel: t.templateLabel,
    decisionNote: t.decisionNote,
    overdue: t.overdue,
  })),
]

function templateLabel(c: SigningContract): string {
  return c.templateName ?? (c.incubationType === '实体' ? '实体入孵协议' : c.incubationType === '虚拟' ? '虚拟入孵协议' : '服务商认证协议')
}

export function buildOpsWorkbenchTasks(
  contracts: SigningContract[],
  changes: ChangeRequest[],
  archives: ProjectArchive[],
  allocations: SpaceAllocation[],
): HatchOpsWorkbenchTask[] {
  const tasks: HatchOpsWorkbenchTask[] = []

  for (const c of contracts) {
    if (c.signStatus === '待签署') {
      tasks.push({
        id: `ops-sign-${c.id}`,
        kind: 'sign',
        tab: 'todo',
        projectId: c.projectId,
        projectName: c.projectName,
        timeLabel: c.createdAt ?? '2025-05-19',
        summary: `合同模板：${templateLabel(c)}`,
        statusLabel: '待签署',
        contractId: c.id,
        templateLabel: templateLabel(c),
        overdue: false,
      })
    }
    if (c.signStatus === '续约中') {
      tasks.push({
        id: `ops-sign-ip-${c.id}`,
        kind: 'sign',
        tab: 'in_progress',
        projectId: c.projectId,
        projectName: c.projectName,
        timeLabel: c.createdAt ?? '2025-05-10',
        summary: '续约协议待完成线下签署',
        statusLabel: '签署中',
        contractId: c.id,
      })
    }
    if (c.signStatus === '即将到期') {
      const left = daysUntil(c.termEnd ?? c.contractEnd)
      tasks.push({
        id: `ops-renew-${c.id}`,
        kind: 'renew',
        tab: 'todo',
        projectId: c.projectId,
        projectName: c.projectName,
        timeLabel: c.termEnd ?? c.contractEnd ?? '—',
        summary: left != null ? `合同到期剩余 ${left} 天` : '合同即将到期',
        statusLabel: '待处理',
        contractId: c.id,
        contractEnd: c.termEnd ?? c.contractEnd,
        daysLeft: left,
        overdue: left != null && left < 7,
      })
    }
    if (c.signStatus === '已到期' && !c.expireRemindHandled) {
      tasks.push({
        id: `ops-exp-${c.id}`,
        kind: 'expire_remind',
        tab: 'todo',
        projectId: c.projectId,
        projectName: c.projectName,
        timeLabel: c.contractEnd ?? '—',
        summary: '合同已过期',
        statusLabel: '未提醒',
        contractId: c.id,
        contractEnd: c.contractEnd,
        daysLeft: daysUntil(c.contractEnd),
        remindStatus: '未提醒',
        overdue: true,
      })
    }
    if (c.signStatus === '已生效') {
      const lastRemind = c.remindLogs?.[c.remindLogs.length - 1]
      if (lastRemind?.remindDay === 30) {
        tasks.push({
          id: `ops-exp-done-${c.id}`,
          kind: 'expire_remind',
          tab: 'done',
          projectId: c.projectId,
          projectName: c.projectName,
          timeLabel: lastRemind.remindTime.slice(0, 10),
          summary: '30 天前已自动提醒',
          statusLabel: '已提醒',
          contractId: c.id,
          remindStatus: '30天前已提醒',
        })
      }
    }
  }

  for (const ch of changes) {
    if (ch.status !== '待审批') continue
    if (ch.changeType === '退出/毕业') {
      tasks.push({
        id: `ops-exit-${ch.id}`,
        kind: 'exit',
        tab: 'todo',
        projectId: ch.projectId,
        projectName: ch.projectName,
        timeLabel: '2025-05-15',
        summary: `${ch.exitType === '毕业' ? '毕业' : '退出'}申请（${ch.reason ?? ch.summary}）`,
        statusLabel: '待审批',
        changeId: ch.id,
      })
    } else {
      const detail = ch.detail ?? ch.summary
      tasks.push({
        id: `ops-change-${ch.id}`,
        kind: 'change',
        tab: 'todo',
        projectId: ch.projectId,
        projectName: ch.projectName,
        timeLabel: '2025-05-16',
        summary: `${ch.changeType}：${detail}`,
        statusLabel: '待审批',
        changeId: ch.id,
      })
    }
  }

  const extraProjectIds = new Set(EXTRA_OPS_TASKS.filter((t) => t.kind === 'space').map((t) => t.projectId))
  for (const a of archives) {
    if (extraProjectIds.has(a.id)) continue
    if (a.incubationType !== '实体') continue
    if (a.flowCurrent !== 'space' && a.status !== '待签约') continue
    const hasSpace = allocations.some((s) => s.projectId === a.id)
    if (hasSpace && a.flowCurrent !== 'space') continue
    if (!hasSpace || a.flowCurrent === 'space') {
      tasks.push({
        id: `ops-space-${a.id}`,
        kind: 'space',
        tab: 'todo',
        projectId: a.id,
        projectName: a.name,
        timeLabel: '2025-05-17',
        summary: `需求：${a.resourceDemand.slice(0, 24)}${a.resourceDemand.length > 24 ? '…' : ''}`,
        statusLabel: '待分配',
      })
    }
  }

  return [...EXTRA_OPS_TASKS, ...tasks].sort((a, b) => {
    const ki = KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)
    if (ki !== 0) return ki
    return b.timeLabel.localeCompare(a.timeLabel)
  })
}

export function filterOpsTasks(
  tasks: HatchOpsWorkbenchTask[],
  tab: HatchOpsWorkbenchTab,
  kind: '全部' | HatchOpsTaskKind,
  q: string,
): HatchOpsWorkbenchTask[] {
  return tasks.filter((t) => {
    if (t.tab !== tab) return false
    if (kind !== '全部' && t.kind !== kind) return false
    if (q.trim()) {
      const s = q.trim()
      if (!t.projectName.includes(s) && !t.summary.includes(s) && !t.statusLabel.includes(s)) return false
    }
    return true
  })
}

export function opsWorkbenchKpi(tasks: HatchOpsWorkbenchTask[]): OpsKpi {
  const todo = tasks.filter((t) => t.tab === 'todo')
  return {
    todayTodo: todo.length,
    overdue: todo.filter((t) => t.overdue).length || (todo.length > 0 ? 1 : 0),
    avgDays: '2.3',
  }
}
