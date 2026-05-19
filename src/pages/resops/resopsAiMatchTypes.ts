/** AI 供需撮合 V2（演示）：结构化需求与匹配结果 */

export type ResourceKindTag = 'space' | 'device' | 'expert' | 'tech' | 'external' | 'ai'

export type ParsedDemand = {
  demand_id: string
  raw_text: string
  resource_types: ResourceKindTag[]
  specific_resource: string
  time_label: string
  time_resolved: string
  budget: number | null
  tech_conditions: string
  compliance: string
}

export type MatchHit = {
  match_id: string
  demand_id: string
  resource_id: string
  resource_name: string
  category_label: string
  kind_tag: ResourceKindTag
  score: number
  price_label: string
  reason: string
}

export type ComboPlan = {
  combo_id: string
  demand_id: string
  title: string
  items: { resourceId: string; name: string; priceLabel: string; slot: string; lineTotalLabel: string }[]
  totalLabel: string
  slotSummary: string
}

export type DemandHistoryItem = {
  id: string
  raw: string
  types: ResourceKindTag[]
  at: string
}

export type MatchRecordRow = {
  match_id: string
  demand_id: string
  resource_id: string
  resource_name: string
  demand_summary: string
  score: number
  category: string
  created_at: string
  is_applied: boolean
  applied_application_id?: string
  is_used: boolean
  applied_order_id?: string
  satisfaction?: number
}
