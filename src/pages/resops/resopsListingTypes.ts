/** 资源上架申请单（演示） */
export type ResListingApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type ResListingApplication = {
  id: string
  code: string
  resourceId: string
  resourceName: string
  reason: string
  attachmentName?: string
  submitterKey: string
  submitterLabel: string
  submittedAt: string
  status: ResListingApplicationStatus
  auditedBy?: string
  auditedAt?: string
  auditComment?: string
}

export type SubmitListingApplicationPayload = {
  resourceId: string
  resourceName: string
  reason: string
  attachmentName?: string
  submitterKey: string
  submitterLabel: string
}
