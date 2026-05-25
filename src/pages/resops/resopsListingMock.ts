import { DEMO_APPLICANT_KEYS } from './resopsV1Mock'
import type { ResListingApplication } from './resopsListingTypes'

/** 演示：其他用户提交的上架申请（当前登录用户不可见） */
export const DEMO_LISTING_SUBMITTER_OTHER = 'listing_submitter_other'

export function initialListingApplications(): ResListingApplication[] {
  return [
    {
      id: 'la-001',
      code: 'L2025001',
      resourceId: 'res-ready',
      resourceName: '高通量药物筛选平台',
      reason: '设备已完成验收，申请在资源目录公开展示，便于项目方预约高通量初筛服务。',
      attachmentName: '上架申请说明.pdf',
      submitterKey: `listing_${DEMO_APPLICANT_KEYS.gene}`,
      submitterLabel: '基因治疗项目',
      submittedAt: '2025-05-17 09:20',
      status: 'pending',
    },
    {
      id: 'la-002',
      code: 'L2025002',
      resourceId: 'res-lab-b',
      resourceName: '共享实验室 B',
      reason: '空间资源已通过准入审核，申请上架至资源目录。',
      submitterKey: `listing_${DEMO_APPLICANT_KEYS.aiDrug}`,
      submitterLabel: 'AI 新药筛选平台',
      submittedAt: '2025-05-14 11:00',
      status: 'approved',
      auditedBy: '李运营',
      auditedAt: '2025-05-15 10:30',
      auditComment: '材料齐全，同意上架。',
    },
    {
      id: 'la-003',
      code: 'L2025003',
      resourceId: 'res-ready',
      resourceName: '高通量药物筛选平台',
      reason: '希望尽快上架展示。',
      submitterKey: DEMO_LISTING_SUBMITTER_OTHER,
      submitterLabel: '外部协作方（演示）',
      submittedAt: '2025-05-12 16:00',
      status: 'rejected',
      auditedBy: '李运营',
      auditedAt: '2025-05-13 09:00',
      auditComment: '该资源已有在审申请，请待审核完成后再提交。',
    },
  ]
}
