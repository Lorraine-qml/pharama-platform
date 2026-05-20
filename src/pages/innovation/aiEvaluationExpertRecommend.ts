import { EXPERT_CATALOG_DEMO } from './innovationTypes'

export type ExpertRecommendRow = {
  expertId: string
  name: string
  field: string
  matchPct: number
}

/** AI 推荐专家（演示：按赛道微调标签） */
export function aiRecommendedExperts(track: string): ExpertRecommendRow[] {
  const t = track.toLowerCase()
  if (t.includes('mrna') || t.includes('递送')) {
    return [
      { expertId: 'exp_zhang', name: '张教授', field: 'mRNA递送', matchPct: 92 },
      { expertId: 'exp_li', name: '李博士', field: '纳米载体', matchPct: 85 },
      { expertId: 'exp_wang', name: '王主任', field: '药物制剂', matchPct: 78 },
    ]
  }
  return EXPERT_CATALOG_DEMO.slice(0, 3).map((e, i) => ({
    expertId: e.expertId,
    name: e.name,
    field: e.field,
    matchPct: 92 - i * 7,
  }))
}
