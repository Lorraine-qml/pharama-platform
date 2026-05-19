/** 资源看板 V2：演示用静态种子（供需缺口、趋势波动等；生产环境由 AI / 数仓接口替换） */

export const BOARD_LAST_UPDATED = '2025-05-18 18:00'

export type BoardTrendKind = 'device' | 'space' | 'expert' | 'cro'

export const TREND_KIND_LABEL: Record<BoardTrendKind, string> = {
  device: '设备',
  space: '空间',
  expert: '专家',
  cro: 'CRO 及服务',
}

/** X 轴为近 30 天采样点（演示折线，规则版替代实时测算） */
export const UTILIZATION_TREND_SERIES: Record<BoardTrendKind, { day: string; pct: number }[]> = {
  device: [
    { day: '04-19', pct: 71 },
    { day: '04-22', pct: 73 },
    { day: '04-25', pct: 74 },
    { day: '04-28', pct: 76 },
    { day: '05-01', pct: 77 },
    { day: '05-04', pct: 78 },
    { day: '05-07', pct: 79 },
    { day: '05-10', pct: 80 },
    { day: '05-13', pct: 81 },
    { day: '05-16', pct: 82 },
    { day: '05-18', pct: 83 },
  ],
  space: [
    { day: '04-19', pct: 58 },
    { day: '04-22', pct: 59 },
    { day: '04-25', pct: 60 },
    { day: '04-28', pct: 61 },
    { day: '05-01', pct: 62 },
    { day: '05-04', pct: 62 },
    { day: '05-07', pct: 63 },
    { day: '05-10', pct: 64 },
    { day: '05-13', pct: 64 },
    { day: '05-16', pct: 65 },
    { day: '05-18', pct: 65 },
  ],
  expert: [
    { day: '04-19', pct: 66 },
    { day: '04-22', pct: 67 },
    { day: '04-25', pct: 68 },
    { day: '04-28', pct: 69 },
    { day: '05-01', pct: 70 },
    { day: '05-04', pct: 70 },
    { day: '05-07', pct: 71 },
    { day: '05-10', pct: 71 },
    { day: '05-13', pct: 72 },
    { day: '05-16', pct: 72 },
    { day: '05-18', pct: 73 },
  ],
  cro: [
    { day: '04-19', pct: 52 },
    { day: '04-22', pct: 53 },
    { day: '04-25', pct: 54 },
    { day: '04-28', pct: 55 },
    { day: '05-01', pct: 55 },
    { day: '05-04', pct: 56 },
    { day: '05-07', pct: 56 },
    { day: '05-10', pct: 57 },
    { day: '05-13', pct: 57 },
    { day: '05-16', pct: 58 },
    { day: '05-18', pct: 58 },
  ],
}

export type DemandGapRow = {
  id: string
  title: string
  detail: string
  severity: 'high' | 'medium' | 'low'
  /** 近 30 天需求侧命中次数（演示） */
  hits: number
}

export const DEMAND_GAP_ROWS: DemandGapRow[] = [
  {
    id: 'dg-animal-model',
    title: '实验动物模型',
    detail: '项目方需求文本高频出现「转基因小鼠」「PDX」，当前目录无匹配上架资源。',
    severity: 'high',
    hits: 28,
  },
  {
    id: 'dg-scrna-capacity',
    title: '单细胞测序仪',
    detail: '检索与申请量环比 +32%，预约排队均值偏高，存在产能缺口风险。',
    severity: 'medium',
    hits: 19,
  },
  {
    id: 'dg-aav-vector',
    title: 'AAV 载体与动物实验',
    detail: '检索词「AAV9」「尾静脉」与现有设备/动物房标签匹配度低，建议补充打包服务。',
    severity: 'medium',
    hits: 14,
  },
  {
    id: 'dg-glp-tox',
    title: 'GLP 毒理排期',
    detail: '外部 CRO 档期检索集中在 Q3，园区目录内可承接方偏少，存在外溢。',
    severity: 'low',
    hits: 11,
  },
]

export type DemandDetailRow = {
  id: string
  keyword: string
  searchCount: number
  failedMatch: number
  lastAt: string
}

export const DEMAND_DETAIL_ROWS: DemandDetailRow[] = [
  { id: 'd1', keyword: '转基因小鼠', searchCount: 86, failedMatch: 12, lastAt: '2025-05-18 09:20' },
  { id: 'd2', keyword: 'PDX 模型', searchCount: 54, failedMatch: 9, lastAt: '2025-05-18 08:40' },
  { id: 'd3', keyword: '单细胞 上机', searchCount: 41, failedMatch: 6, lastAt: '2025-05-17 16:10' },
  { id: 'd4', keyword: 'AAV 动物实验', searchCount: 33, failedMatch: 7, lastAt: '2025-05-17 11:05' },
]

/** 演示：投诉次数（与资源 id 绑定） */
export const BOARD_COMPLAINT_COUNTS: Record<string, number> = {
  'res-flow': 5,
  'res-seq': 1,
}

export type AiSuggestionSeed = {
  id: string
  text: string
  action: 'delist' | 'procure' | 'scale' | 'partner_warn'
  resourceId?: string
  providerName?: string
}

export const AI_SUGGESTION_SEED: AiSuggestionSeed[] = [
  {
    id: 'sug-delist-pcr',
    text: '建议下架设备：旧款 PCR 仪（近 30 天申请量极低），释放目录位给高需求设备。',
    action: 'delist',
    resourceId: 'res-pcr-old',
  },
  {
    id: 'sug-procure-animal',
    text: '建议引入资源：实验动物模型（近 30 天多次需求匹配失败，可发起采购/合作引入流程）。',
    action: 'procure',
  },
  {
    id: 'sug-scale-flow',
    text: '建议扩容：流式细胞仪预约排队压力高，可考虑增购或引入共享机时。',
    action: 'scale',
    resourceId: 'res-flow',
  },
  {
    id: 'sug-partner-beta',
    text: '外部合作调整：Beta CRO 公司满意度持续偏低，建议暂停推荐并启动履约复盘。',
    action: 'partner_warn',
    providerName: 'Beta CRO公司',
  },
]

/** 看板展示用：在真实评价样本较少时补足排行行数（演示） */
export const EXTERNAL_QUALITY_PAD: { providerName: string; satisfactionPct: number; orders: number }[] = [
  { providerName: 'Gamma CDMO', satisfactionPct: 92.4, orders: 4 },
  { providerName: 'Delta 临床 SMO', satisfactionPct: 88.0, orders: 6 },
  { providerName: 'Epsilon 动物供应商', satisfactionPct: 85.3, orders: 3 },
  { providerName: 'Zeta 制剂中试', satisfactionPct: 81.6, orders: 2 },
]
