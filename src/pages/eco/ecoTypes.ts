/** 生态协同 V1 演示数据模型 */

export type VirtualProjectStatus = '启用' | '停用'

export type VirtualProject = {
  id: string
  name: string
  domain: string
  resourceNeed: string
  contact: string
  phone: string
  email: string
  linkedProjectId: string | null
  status: VirtualProjectStatus
}

export type PartnerOrgType = 'CRO' | '医院' | '高校' | '检测机构' | '投资机构'

export type PartnerCoopStatus = '进行中' | '意向中' | '已结束'

export type ExternalPartner = {
  id: string
  name: string
  orgType: PartnerOrgType
  contact: string
  phone: string
  email: string
  coopStatus: PartnerCoopStatus
  linkedProjectId: string | null
  remark: string
}

export type AiNodeKind = '大模型' | '智能体' | 'Skill' | '知识库'

export type AiNodeStatus = '在线' | '维护中' | '离线'

export type AiAbilityNode = {
  id: string
  name: string
  kind: AiNodeKind
  description: string
  status: AiNodeStatus
  version: string
  invoke: string
  calls30d: number
  successPct: number
}

export type KnowledgeBaseKind = '公共' | '行业' | '私有'

export type KnowledgeBase = {
  id: string
  name: string
  kind: KnowledgeBaseKind
  /** 私有库必选 */
  projectId: string | null
  description: string
  updatedAt: string
}

export type KbDocument = {
  id: string
  kbId: string
  name: string
  ext: string
  sizeLabel: string
  uploadedAt: string
  uploader: string
}
