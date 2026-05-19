/** 基础数据演示域 · 类型（与 docs/basic-data-module-requirements.md 对齐） */

export type BasicDataStatus = '启用中' | '草稿' | '停用'

export type EvaluationScenario = '科创策源' | '孵化评估' | 'AI 撮合' | '资源运营' | '通用'

export type EvaluationDimension = {
  id: string
  name: string
  /** 百分比 整数，维度和应为 100 */
  weightPct: number
  indicators: EvaluationIndicator[]
}

export type EvaluationIndicator = {
  id: string
  name: string
  minScore: number
  maxScore: number
}

export type EvaluationForm = {
  id: string
  name: string
  scenario: EvaluationScenario
  version: string
  status: BasicDataStatus | '归档'
  updatedAt: string
  dimensions: EvaluationDimension[]
  /** 等级一句描述占位 */
  gradeRuleSummary: string
  /** 评审模板（演示占位，可对接模板库） */
  reviewTemplateScore?: string
  reviewTemplateOpinion?: string
  reviewTemplateRisk?: string
  /** 关联知识库说明 */
  knowledgeBaseLabel?: string
  /** 高级：适用主体来源（空表示不限） */
  applyEntitySources?: Array<'企业' | '高校' | '研究所' | '医院'>
  /** 高级：适用入孵类型（空表示不限） */
  applyIncubationTypes?: Array<'实体' | '虚拟' | '服务商'>
}

export type ScoringFormula = {
  id: string
  name: string
  formId: string
  formName: string
  expression: string
}

export type IncubationType = '实体入孵' | '虚拟入孵' | '服务商认证' | '联合孵化'

export type ExpertRecord = {
  id: string
  name: string
  org: string
  fields: string[]
  reviewCount: number
  avgScore: number
  status: Exclude<BasicDataStatus, '草稿'>
  phone?: string
  email?: string
  intro?: string
  stages?: string[]
  reward?: string
}

export type ExpertMatchWeights = {
  techKeyword: number
  stageFit: number
  historySimilar: number
  regionFit: number
  loadBalance: number
}

export type RosterTab = 'partners' | 'sources' | 'blocklist'

export type PartnerOrg = {
  id: string
  name: string
  kind: 'CRO' | '医院' | '高校' | '投资机构' | 'CDMO'
  contact: string
  phone: string
  enabled: boolean
}

export type SourceTypeRecord = {
  id: string
  name: string
  description: string
  enabled: boolean
}

export type BlocklistRecord = {
  id: string
  name: string
  reason: string
  since: string
  enabled: boolean
}

/** 字典分组在管理页的展示形态 */
export type DictKind = 'simple' | 'incubation_type' | 'project_status'

export type DictGroupRecord = {
  id: string
  name: string
  preset: boolean
  tags: DictTag[]
  /** 缺省为 simple：仅 label + 启停 */
  dictKind?: DictKind
}

export type DictTag = {
  id: string
  /** 展示名称 */
  label: string
  enabled: boolean
  /** 业务标识，如 entity、pending_sign */
  code?: string
  /** 入孵类型等：排序号 */
  sortOrder?: number
  /** 入孵类型：是否作为默认选项 */
  isDefault?: boolean
  /** 项目状态等：标签颜色文案（橙色/绿色/红色/灰色），供前端样式映射 */
  color?: string
  /** 项目状态：该状态下项目是否可发起资源申请 */
  canRequestResources?: boolean
}
