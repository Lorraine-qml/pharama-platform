export type InvestmentLeadGrade = '' | 'S' | 'A' | 'B' | 'C'

export type InvestmentLeadStatus =
  | '新建'
  | '跟进中'
  | '已触达'
  | '意向确认'
  | '已转化'
  | '已流失'

export type IndustryDirection = {
  id: string
  name: string
  /** 细分赛道 */
  subTracks: string[]
}

export type TechTag = {
  id: string
  name: string
}

export type AiDirectionSuggestion = {
  id: string
  name: string
  reason: string
}

export type HarvestDataSourceId = 'crunchbase' | 'patents' | 'pubmed' | 'policy'

export type HarvestSourceConfig = {
  id: HarvestDataSourceId
  name: string
  enabled: boolean
  frequencyLabel: string
}

export type AiHarvestRow = {
  id: string
  projectName: string
  sourceLabel: string
  matchedTrack: string
  matchPct: number
  /** true 已成功「转线索」 */
  convertedToLeadId?: string
}

export type ChainDirection = '上游' | '下游'

export type ChainRecommendRow = {
  id: string
  direction: ChainDirection
  company: string
  reason: string
  /** 已转线索 */
  convertedToLeadId?: string
}

export type HighPotentialRow = {
  id: string
  name: string
  track: string
  score: number
  highlight: string
  convertedToLeadId?: string
}

export type FollowUpRow = {
  id: string
  at: string
  channel: string
  summary: string
  nextPlan: string
}

export type LeadAiCopyPack = {
  script: string
  emailSubject: string
  emailBody: string
  pitchPdfHint: string
  incubationBullets: string[]
}

export type ConversionInsight = {
  prob: number
  levelLabel: string
  signals: { text: string; tone: 'pos' | 'warn' | 'neutral' }[]
  suggest: string
}

export type InvestmentLead = {
  id: string
  name: string
  grade: InvestmentLeadGrade
  source: string
  assignee: string
  status: InvestmentLeadStatus
  lastTouch: string
  track?: string
  contact?: string
  region?: string
  oneLiner?: string
  followUps: FollowUpRow[]
  aiCopy?: LeadAiCopyPack
  conversion?: ConversionInsight
}
