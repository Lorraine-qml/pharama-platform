import type { ResApplicationStatus, ResResourceStatus, ResUsageOrderStatus } from './resopsV1Types'
import type { UserRole } from '../../auth/types'
import { DEMO_APPLICANT_KEYS } from './resopsV1Mock'

export function demoApplicantForRole(role: UserRole): { key: string; label: string } {
  if (role === 'resource-applicant') return { key: DEMO_APPLICANT_KEYS.aiDrug, label: 'AI 新药筛选平台' }
  if (role === 'enterprise-admin') return { key: DEMO_APPLICANT_KEYS.gene, label: '基因治疗项目' }
  return { key: DEMO_APPLICANT_KEYS.gene, label: '演示项目方' }
}

export const RESOURCE_STATUS_LABEL: Record<ResResourceStatus, string> = {
  draft: '草稿',
  pending_review: '待审核',
  pending_listing: '已准入',
  listed: '已上架',
  delisted: '已下架',
  maintenance: '维护中',
  anomaly: '异常',
  rejected: '已拒绝',
}

export const APPLICATION_STATUS_LABEL: Record<ResApplicationStatus, string> = {
  pending_confirm: '待确认',
  approved: '已通过',
  rejected: '已驳回',
  in_progress: '执行中',
  pending_rating: '待评价',
  completed: '已完成',
  cancelled: '已取消',
}

export const USAGE_ORDER_STATUS_LABEL: Record<ResUsageOrderStatus, string> = {
  pending_confirm: '待确认',
  approved: '已通过',
  rejected: '已驳回',
  in_progress: '执行中',
  pending_rating: '待评价',
  completed: '已完成',
}

export function feeSummary(feeMode: string, amount?: number, unit?: string, _remark?: string): string {
  if (feeMode === 'free') return '免费'
  if (feeMode === 'negotiate') return '议价'
  if (feeMode === 'per_use') return amount != null ? `${amount}${unit ?? '元/次'}` : '按次'
  if (feeMode === 'per_project') return amount != null ? `${amount}${unit ?? '元/项目'}` : '按项目'
  if (feeMode === 'hourly' && amount != null) return `${amount}${unit ?? '元/小时'}`
  return '—'
}
