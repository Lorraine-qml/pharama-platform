import type { StatusPillVariant } from '../components/ui/StatusPill'
import type { HatchSignStatus } from '../pages/hatch/hatchTypes'
import type { HatchProjectStatus } from '../pages/hatch/hatchTypes'
import type { ResApplicationStatus, ResResourceStatus, ResUsageOrderStatus } from '../pages/resops/resopsV1Types'

export function hatchSignPillVariant(status: HatchSignStatus | string): StatusPillVariant {
  switch (status) {
    case '待签署':
    case '已到期':
      return 'pending'
    case '即将到期':
    case '续约中':
      return 'progress'
    case '已生效':
      return 'success'
    case '已终止':
      return 'danger'
    default:
      return 'muted'
  }
}

export function hatchArchivePillVariant(status: HatchProjectStatus | string): StatusPillVariant {
  switch (status) {
    case '待审核':
    case '待签约':
      return 'pending'
    case '正常运营':
      return 'success'
    case '暂停':
    case '毕业':
    case '退出':
      return 'muted'
    default:
      return 'muted'
  }
}

export function resResourcePillVariant(status: ResResourceStatus): StatusPillVariant {
  switch (status) {
    case 'draft':
      return 'muted'
    case 'pending_review':
      return 'pending'
    case 'pending_listing':
      return 'progress'
    case 'listed':
      return 'success'
    case 'delisted':
    case 'rejected':
    case 'anomaly':
      return 'danger'
    case 'maintenance':
      return 'progress'
    default:
      return 'muted'
  }
}

export function resApplicationPillVariant(status: ResApplicationStatus): StatusPillVariant {
  switch (status) {
    case 'pending_confirm':
      return 'pending'
    case 'approved':
    case 'in_progress':
    case 'pending_rating':
      return 'progress'
    case 'completed':
      return 'success'
    case 'rejected':
    case 'cancelled':
      return 'danger'
    default:
      return 'muted'
  }
}

export function resUsageOrderPillVariant(status: ResUsageOrderStatus): StatusPillVariant {
  switch (status) {
    case 'pending_confirm':
      return 'pending'
    case 'approved':
    case 'in_progress':
    case 'pending_rating':
      return 'progress'
    case 'completed':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return 'muted'
  }
}
