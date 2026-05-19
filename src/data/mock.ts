/** PRD 演示用静态数据 */

export type LeadRow = {
  id: string
  name: string
  track: string
  source: string
  aiRating: 'S' | 'A' | 'B' | 'C'
  status: string
  lastFollow?: string
}

export const LEADS: LeadRow[] = [
  {
    id: 'l1',
    name: '北海基因',
    track: '基因治疗',
    source: '融资事件',
    aiRating: 'S',
    status: '跟进中',
    lastFollow: '2025-04-06',
  },
  {
    id: 'l2',
    name: '智药科技',
    track: 'AI制药',
    source: '自主注册',
    aiRating: 'A',
    status: '待触达',
  },
  {
    id: 'l3',
    name: '瑞康生物',
    track: '细胞治疗',
    source: '产业活动',
    aiRating: 'B',
    status: '已归档',
    lastFollow: '2025-03-01',
  },
]

export const ASSESSMENT_AXES = [
  { key: '产业匹配', score: 90, basis: '与园区主导产业标签重合度高，近三年同类企业落地案例 3 家。' },
  { key: '技术创新', score: 88, basis: '专利 12 件（发明 9），独占性关键技术 2 项。' },
  { key: '团队实力', score: 82, basis: '核心团队来自 TOP 院校与药企，CEO 管线推进经验丰富。' },
  { key: '融资健康', score: 80, basis: 'A 轮已完成，资金使用计划与里程碑匹配。' },
  { key: '合规风控', score: 78, basis: '无重大舆情；需关注临床申报节奏。' },
]

export type SpaceStatus = 'free' | 'occupied' | 'pending'

/** B栋3层初始状态（孪生平面图） */
export const B_BUILDING_FLOOR3 = [
  { id: '301', status: 'free' as const, areaM2: 80 },
  { id: '302', status: 'free' as const, areaM2: 95 },
  { id: '303', status: 'free' as const, areaM2: 120 },
  { id: '304', status: 'occupied' as const, areaM2: 100 },
  { id: '305', status: 'free' as const, areaM2: 88 },
  { id: '306', status: 'free' as const, areaM2: 76 },
] as const
