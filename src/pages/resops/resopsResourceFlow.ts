import type { ResResourceAuditEvent, ResResourceStatus } from './resopsV1Types'

export function newAuditEvent(e: {
  at?: string
  actor: string
  action: string
  label: string
  detail?: string
}): ResResourceAuditEvent {
  return {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: e.at ?? new Date().toISOString().slice(0, 16).replace('T', ' '),
    actor: e.actor,
    action: e.action,
    label: e.label,
    detail: e.detail,
  }
}

/** 详情页流程条主节点（与状态机对齐） */
export const LIFECYCLE_MAIN_STEPS: { key: string; label: string; match: (s: ResResourceStatus) => boolean }[] = [
  { key: 'draft', label: '草稿', match: (s) => s === 'draft' },
  { key: 'pending_review', label: '待审核', match: (s) => s === 'pending_review' },
  { key: 'pending_listing', label: '已准入', match: (s) => s === 'pending_listing' },
  { key: 'listed', label: '已上架', match: (s) => s === 'listed' },
]

export function isRejected(status: ResResourceStatus) {
  return status === 'rejected'
}

/** 主流程当前步索引（0-based），用于高亮；已拒绝时返回 -1 */
export function mainFlowStepIndex(status: ResResourceStatus): number {
  if (status === 'rejected') return -1
  if (status === 'draft') return 0
  if (status === 'pending_review') return 1
  if (status === 'pending_listing') return 2
  if (status === 'listed' || status === 'maintenance' || status === 'anomaly' || status === 'delisted') return 3
  return 0
}

/** 主流程上某步是否已完成（可点击查看日志） */
export function isMainStepCompleted(status: ResResourceStatus, stepIdx: number): boolean {
  const cur = mainFlowStepIndex(status)
  if (cur < 0) return stepIdx < 2
  return stepIdx < cur
}

export function isMainStepCurrent(status: ResResourceStatus, stepIdx: number): boolean {
  return mainFlowStepIndex(status) === stepIdx
}

export function opsStatusSuffix(status: ResResourceStatus): string | null {
  if (status === 'maintenance') return '维护中'
  if (status === 'anomaly') return '异常'
  if (status === 'delisted') return '已下架'
  return null
}
