/** 演示用科创策源数据模型 */

export type EntityTab = 'enterprise' | 'university' | 'institute' | 'hospital'

export type ApplicantUiStatus = 'pending' | 'in_progress' | 'done' | 'returned'

export type SjStage =
  | 'pending_material_review'
  | 'pending_ai'
  | 'pending_expert_assign'
  | 'expert_reviewing'
  | 'review_done'
  | 'pending_decision'
  | 'decision_pass'
  | 'decision_reject'
  | 'returned_supplement'

/** 专家评审各维度得分（0–100，演示） */
export type ExpertDimScores = {
  industry: number
  tech: number
  team: number
  market: number
  compliance: number
}

/** 项目资料附件（演示可带齐分类/大小/时间） */
export type SjAttachment = {
  name: string
  category?: string
  sizeLabel?: string
  uploadedAt?: string
}

export type ExpertAssignment = {
  expertId: string
  name: string
  field: string
  matchPct?: number
  aiPick?: boolean
  state: 'pending' | 'reviewing' | 'done'
  score?: number
  opinion?: string
  /** 专家评审汇总表用 */
  dimScores?: ExpertDimScores
  deadline: string
  /** 提交时间（演示） */
  submittedAt?: string
}

export type SjTimelineEvt = {
  id: string
  title: string
  tone: 'success' | 'primary' | 'muted' | 'danger'
  subtitle?: string
  detail?: string
  expandable?: boolean
}

export type AiReportDemo = {
  overall: number
  levelLabel: string
  dims: { key: string; value: number }[]
  pros: string
  risks: string
  suggest: string
  opinionConsensus?: string
  opinionConflict?: string
}

export type SjProject = {
  id: string
  name: string
  /** 演示：仅 project 方列表展示 */
  applicantOwned: boolean
  track: string
  submittedAt: string
  entityTypeLabel: string
  orgFullName: string
  /** 院系 / 实验室 / 科室等（非企业主体） */
  subsidiaryUnit?: string
  /** 法定代表人（企业） */
  legalRepresentative?: string
  creditCode: string
  contact: string
  phone: string
  email: string
  /** 注册地址（演示档案） */
  registerAddress?: string
  phase: string
  intentLabel: string
  stage: SjStage
  currentNodePublic: string
  returnReason?: string
  attachments: SjAttachment[]
  checklist: { label: string; ok: boolean }[]
  timeline: SjTimelineEvt[]
  experts: ExpertAssignment[]
  aiReport?: AiReportDemo
  /** AI 报告生成时间（演示） */
  aiEvaluatedAt?: string
  /** 成立时间展示文案 */
  establishedAt?: string
  /** 最后修改（演示） */
  lastModifiedAt?: string
  /** 是否前沿技术 */
  frontierTech?: boolean
  /** 运营决策占位 */
  decisionChoice?: 'physical' | 'virtual' | 'observe' | 'reject'
  decisionComment?: string
  /** 决策记录 Tab */
  decisionAt?: string
  decisionBy?: string
  /** 决策通过后入孵档案占位 */
  incubationArchiveStatus?: '待签约' | '已创建档案' | '—'
  /** 入孵档案跳转（演示项目 ID） */
  hatchArchiveProjectId?: string
}

export const DEMO_EXPERT_ZHANG_ID = 'exp_zhang'

export function applicantStatusFromStage(p: SjProject): ApplicantUiStatus {
  if (p.stage === 'returned_supplement') return 'returned'
  if (
    p.stage === 'pending_material_review' ||
    p.stage === 'pending_ai' ||
    p.stage === 'pending_expert_assign' ||
    p.stage === 'expert_reviewing' ||
    p.stage === 'pending_decision' ||
    p.stage === 'review_done'
  )
    return 'in_progress'
  if (p.stage === 'decision_pass') return 'done'
  if (p.stage === 'decision_reject') return 'done'
  return 'pending'
}

export function applicantStatusTone(s: ApplicantUiStatus): { label: string; className: string } {
  switch (s) {
    case 'pending':
      return { label: '待处理', className: 'bg-warning/14 text-warning ring-1 ring-warning/25' }
    case 'in_progress':
      return { label: '进行中', className: 'bg-primary/12 text-primary ring-1 ring-primary/25' }
    case 'done':
      return { label: '已完成', className: 'bg-success/12 text-success ring-1 ring-success/22' }
    case 'returned':
      return { label: '退回修改', className: 'bg-danger/12 text-danger ring-1 ring-danger/22' }
  }
}

export const EXPERT_CATALOG_DEMO = [
  { expertId: 'exp_zhang', name: '张教授', field: '细胞治疗' },
  { expertId: 'exp_li', name: '李博士', field: '基因编辑' },
  { expertId: 'exp_wang', name: '王主任', field: '肿瘤免疫' },
  { expertId: 'exp_zhao', name: '赵研究员', field: '药理学' },
  { expertId: 'exp_sun', name: '孙教授', field: '临床前毒理' },
] as const
