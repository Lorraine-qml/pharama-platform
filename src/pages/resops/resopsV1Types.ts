/** 资源运营 V1 演示数据模型 */

export type ResResourceStatus =
  | 'draft'
  | 'pending_review'
  | 'pending_listing'
  | 'listed'
  | 'delisted'
  | 'maintenance'
  | 'anomaly'
  | 'rejected'

export type ResFeeMode = 'hourly' | 'per_use' | 'per_project' | 'free' | 'negotiate'

export type ResOpenScope = 'all' | 'physical_only' | 'virtual_only' | 'whitelist'

export type ResResourceAuditEvent = {
  id: string
  at: string
  actor: string
  action: string
  label: string
  detail?: string
}

export type ResQualificationFile = {
  id: string
  name: string
}

export type ResApplicationStatus =
  | 'pending_confirm'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'pending_rating'
  | 'completed'
  | 'cancelled'

export type ResUsageOrderStatus =
  | 'pending_confirm'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'pending_rating'
  | 'completed'

export type ResResource = {
  id: string
  name: string
  level1: string
  level2: string
  providerName: string
  status: ResResourceStatus
  location: string
  intro: string
  hours: string
  contactName: string
  phone: string
  capability: string
  feeMode: ResFeeMode
  priceAmount?: number
  priceUnit?: string
  remark?: string
  scope: ResOpenScope
  /** 指定项目方时的说明（演示） */
  scopeWhitelistNote?: string
  rating: number
  reviewCount: number
  availabilityLabel: string
  /** 孪生绑定占位 */
  twinBindNote?: string
  qualificationFiles?: ResQualificationFile[]
  needPlatformReview?: boolean
  limitConcurrency?: boolean
  auditLog?: ResResourceAuditEvent[]
}

export type ResReview = {
  id: string
  at: string
  author: string
  stars: number
  text: string
}

export type ResApplication = {
  id: string
  code: string
  resourceId: string
  resourceName: string
  applicantKey: string
  applicantLabel: string
  slot: string
  status: ResApplicationStatus
  createdAt: string
  /** AI 供需撮合产生的推荐记录 ID（演示） */
  matchId?: string
}

export type ResUsageTimelineEvt = {
  id: string
  at: string
  text: string
}

export type ResUsageOrder = {
  id: string
  code: string
  resourceId: string
  resourceName: string
  providerName: string
  applicantKey: string
  applicantLabel: string
  slot: string
  totalFeeLabel: string
  status: ResUsageOrderStatus
  createdAt: string
  timeline: ResUsageTimelineEvt[]
  resultFiles: { name: string }[]
  applicantReviewStars?: number
  applicantReviewText?: string
}
