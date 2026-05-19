/** 入孵管理演示数据模型（字典标签由基础数据维护，此处为展示引用） */

export type HatchIncubationType = '实体' | '虚拟' | '服务商'

export type HatchSignStatus = '待签署' | '已生效' | '即将到期' | '已到期' | '已终止' | '续约中'

export type HatchProjectStatus = '待审核' | '待签约' | '正常运营' | '暂停' | '毕业' | '退出'

export type FlowNodeKey = 'decision' | 'signing' | 'archive' | 'space' | 'operate' | 'graduate'

export type SigningContract = {
  id: string
  projectId: string
  projectName: string
  incubationType: HatchIncubationType
  signStatus: HatchSignStatus
  contractEnd: string | null
  rentYuanPerMonth: number | null
  propertyFee?: number
  aiPackage?: string
  spaceNeed?: string
  templateId?: string
  termStart?: string
  termEnd?: string
  scanFileName?: string
}

export type PipelineItem = {
  id: string
  productName: string
  indication: string
  stage: string
  milestone?: string
}

export type TeamArchiveRow = {
  id: string
  name: string
  title: string
  bio: string
}

export type FundingRow = {
  id: string
  round: string
  amount: string
  investor: string
  date: string
}

export type EvaluationRow = {
  id: string
  type: string
  score: string
  conclusion: string
  time: string
}

export type MajorEvent = {
  id: string
  time: string
  description: string
}

export type ChangeHistoryRow = {
  id: string
  time: string
  operator: string
  field: string
  from: string
  to: string
}

/** 项目档案 · 空间变更历史（与孪生空间台账联动展示） */
export type SpaceHistoryRow = {
  id: string
  time: string
  opType: '分配' | '扩租' | '退租' | '调整' | '释放'
  roomName: string
  areaM2: number
  operator: string
}

export type ProjectArchive = {
  id: string
  name: string
  entityType: string
  incubationType: HatchIncubationType
  status: HatchProjectStatus
  tags: string[]
  creditCode: string
  address: string
  contact: string
  phone: string
  incubationStart: string | null
  contractEnd: string | null
  flowCurrent: FlowNodeKey
  pipeline: PipelineItem[]
  team: TeamArchiveRow[]
  funding: FundingRow[]
  resourceDemand: string
  resourceSupply: string
  evaluations: EvaluationRow[]
  events: MajorEvent[]
  changeHistory: ChangeHistoryRow[]
  /** 空间分配/扩租等历史（演示数据） */
  spaceHistory?: SpaceHistoryRow[]
}

export type SpaceAllocation = {
  id: string
  projectId: string
  projectName: string
  location: string
  areaM2: number
  assignDate: string
  endDate: string
  status: '正常' | '调整中' | '已释放'
}

export type SpaceUsageLog = {
  id: string
  time: string
  type: string
  areaDelta: string
  reason: string
  operator: string
}

export type ChangeRequest = {
  id: string
  projectId: string
  projectName: string
  changeType: '基础信息变更' | '赛道/阶段变更' | '入孵类型变更' | '空间变更' | '退出/毕业'
  summary: string
  applicant: string
  status: '待审批' | '已通过' | '已驳回'
  detail?: string
  reason?: string
  exitType?: '毕业' | '退出'
}
