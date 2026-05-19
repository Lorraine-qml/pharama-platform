export const DEFAULT_EVAL_PROJECT_ID = 'h-proj-1'

export type EvalScoreRow = {
  tech: number
  commercial: number
  financing: number
  resource: number
  ecosystem: number
  total: number
  /** 高潜力 / 重点培育 / 空 */
  badge: '高潜力' | '重点培育' | ''
}

export const EVAL_SCORES: Record<string, EvalScoreRow> = {
  'h-proj-1': { tech: 85, commercial: 70, financing: 90, resource: 82, ecosystem: 75, total: 82, badge: '高潜力' },
  'h-proj-2': { tech: 92, commercial: 65, financing: 85, resource: 78, ecosystem: 70, total: 80, badge: '重点培育' },
  'h-proj-3': { tech: 78, commercial: 55, financing: 60, resource: 45, ecosystem: 50, total: 60, badge: '' },
  'h-proj-4': { tech: 80, commercial: 72, financing: 70, resource: 68, ecosystem: 60, total: 72, badge: '' },
}

export function incubationDurationLabel(start: string | null): string {
  if (!start) return '—'
  const t0 = new Date(start).getTime()
  if (Number.isNaN(t0)) return '—'
  const months = Math.max(0, Math.floor((Date.now() - t0) / (30.44 * 24 * 3600 * 1000)))
  return `${months} 个月`
}

export function trackTagsFromDescription(desc: string): string {
  if (desc.includes('签约')) return '📌'
  if (desc.includes('研发') || desc.includes('载体')) return '🔬'
  if (desc.includes('融资')) return '💰'
  if (desc.includes('专利')) return '📄'
  if (desc.includes('资源')) return '🧪'
  if (desc.includes('AI') || desc.includes('智能体')) return '🤖'
  if (desc.includes('大赛') || desc.includes('事件')) return '🏆'
  return '📎'
}

export type TimelineExtra = { time: string; description: string }

/** PRD 演示时间线（与档案 events 合并） */
export const EVAL_TIMELINE_EXTRAS: Record<string, TimelineExtra[]> = {
  'h-proj-1': [
    { time: '2025-05-20', description: '研发里程碑：完成载体构建' },
    { time: '2025-06-01', description: '融资进展：A轮5000万到账' },
    { time: '2025-06-10', description: '专利成果：新提交发明专利1项' },
    { time: '2025-06-15', description: '资源使用：预约共享实验室3次' },
    { time: '2025-07-01', description: 'AI资源使用：调用项目评估智能体' },
    { time: '2025-08-20', description: '重大事件：获创新创业大赛一等奖' },
  ],
}

export type RiskAlertRow = {
  id: string
  type: string
  projectId: string
  projectName: string
  desc: string
  level: '高' | '中' | '低'
}

export const EVAL_RISK_ROWS: RiskAlertRow[] = [
  {
    id: 'r1',
    type: '项目活跃度下降',
    projectId: 'h-proj-3',
    projectName: '细胞治疗项目',
    desc: '连续30天未登录，未使用资源',
    level: '中',
  },
  {
    id: 'r2',
    type: '研发进度停滞',
    projectId: 'h-proj-4',
    projectName: '抗体项目',
    desc: '管线3个月无进展',
    level: '高',
  },
  {
    id: 'r3',
    type: '融资风险',
    projectId: 'h-proj-2',
    projectName: 'AI 新药平台',
    desc: '融资需求发布超6个月未成功',
    level: '高',
  },
  {
    id: 'r4',
    type: '合同到期',
    projectId: 'h-proj-1',
    projectName: '基因治疗项目',
    desc: '空间合同30天后到期',
    level: '低',
  },
  {
    id: 'r5',
    type: '资源使用异常',
    projectId: 'h-proj-3',
    projectName: '细胞治疗项目',
    desc: '连续3次预约未使用',
    level: '中',
  },
]

export type AdviceCard = {
  id: string
  title: string
  body: string[]
  actions: { label: string; tone?: 'primary' }[]
}

export function adviceCardsFor(projectId: string): AdviceCard[] {
  const base = projectId === 'h-proj-1'
  return [
    {
      id: 'adv-expert',
      title: '📌 专家辅导推荐',
      body: base
        ? ['推荐专家：张教授（基因编辑领域）', '理由：项目技术成熟度高，建议对接产业化专家']
        : ['推荐专家：李博士（AI制药）', '理由：算法与数据能力突出，建议补充临床顾问'],
      actions: [{ label: '预约' }, { label: '忽略' }],
    },
    {
      id: 'adv-policy',
      title: '📌 政策申报推荐',
      body: ['可申报政策：上海市高新技术成果转化项目', '截止日期：2025-07-31'],
      actions: [{ label: '查看详情', tone: 'primary' }, { label: '忽略' }],
    },
    {
      id: 'adv-finance',
      title: '📌 融资对接推荐',
      body: ['推荐投资机构：红杉资本、启明创投', '理由：项目已完成A轮，技术领先，符合机构偏好'],
      actions: [{ label: '预约路演', tone: 'primary' }, { label: '忽略' }],
    },
    {
      id: 'adv-res',
      title: '📌 资源推荐',
      body: ['推荐资源：共享实验室B（空闲时段较多）、基因测序仪'],
      actions: [{ label: '预约资源', tone: 'primary' }, { label: '忽略' }],
    },
    {
      id: 'adv-key',
      title: '📌 重点培育建议',
      body: [`该项目综合评分${EVAL_SCORES[projectId]?.total ?? 75}分，建议纳入重点培育名单`],
      actions: [{ label: '加入重点培育', tone: 'primary' }, { label: '忽略' }],
    },
  ]
}
