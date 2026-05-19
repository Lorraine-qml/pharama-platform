import type {
  AiDirectionSuggestion,
  AiHarvestRow,
  HarvestSourceConfig,
  HighPotentialRow,
  IndustryDirection,
  InvestmentLead,
  TechTag,
} from './innovationInvestmentTypes'

export const INITIAL_DIRECTIONS: IndustryDirection[] = [
  { id: 'd1', name: '创新药', subTracks: ['细胞治疗', '基因编辑'] },
  { id: 'd2', name: '医疗器械', subTracks: ['AI 影像', '微创器械'] },
  { id: 'd3', name: '合成生物', subTracks: ['底盘细胞构建', '酶工程'] },
]

export const INITIAL_TECH_TAGS: TechTag[] = [
  { id: 't1', name: 'mRNA' },
  { id: 't2', name: '类器官' },
  { id: 't3', name: '脑机接口' },
]

export const INITIAL_AI_SUGGESTIONS: AiDirectionSuggestion[] = [
  { id: 'as1', name: '放射性药物', reason: '近期融资增长约 35%（演示）' },
  { id: 'as2', name: '核酸药物', reason: '专利公开量季度环比上升（演示）' },
]

export const INITIAL_DATA_SOURCES: HarvestSourceConfig[] = [
  { id: 'crunchbase', name: '融资事件 API（Crunchbase）', enabled: true, frequencyLabel: '每日一次' },
  { id: 'patents', name: '专利数据库（PatentsView）', enabled: true, frequencyLabel: '每周一次' },
  { id: 'pubmed', name: '学术论文（PubMed）', enabled: true, frequencyLabel: '每周一次' },
  { id: 'policy', name: '政策名单（高新技术企业公示）', enabled: false, frequencyLabel: '每月一次' },
]

export const INITIAL_HARVEST: AiHarvestRow[] = [
  { id: 'h1', projectName: '南京 XX 生物科技', sourceLabel: '融资事件', matchedTrack: '细胞治疗', matchPct: 92 },
  { id: 'h2', projectName: '上海 YY 医药', sourceLabel: '专利', matchedTrack: 'AI 制药', matchPct: 85 },
  { id: 'h3', projectName: '成都 ZZ 递送', sourceLabel: '论文', matchedTrack: '核酸药物', matchPct: 78 },
]

export const INITIAL_HIGH_POTENTIAL: HighPotentialRow[] = [
  {
    id: 'hp1',
    name: '深圳 XX 基因',
    track: '基因编辑',
    score: 96,
    highlight: '刚完成 B 轮融资，团队来自顶尖院所，体内编辑管线推进快（演示）',
  },
  {
    id: 'hp2',
    name: '杭州 XX 细胞',
    track: '细胞治疗',
    score: 91,
    highlight: '专利布局完善，临床 II 期入组超预期（演示）',
  },
  {
    id: 'hp3',
    name: '武汉 AA 核酸',
    track: '核酸药物',
    score: 88,
    highlight: 'LNP 递送+CMC 成熟度较高（演示）',
  },
]

export const INITIAL_LEADS: InvestmentLead[] = [
  {
    id: 'ld-sz-xx',
    name: '深圳 XX 基因科技有限公司',
    grade: 'S',
    source: 'AI 推荐',
    assignee: '张三',
    status: '已触达',
    lastTouch: '05-12',
    track: '基因编辑',
    region: '深圳',
    contact: '王总 · 联合创始人',
    oneLiner: '体内碱基编辑 + 免疫细胞工程双管线，近期完成 B 轮。',
    followUps: [
      {
        id: 'fu1',
        at: '2025-05-12',
        channel: '电话',
        summary: '对方对共享实验室与细胞房兴趣高，询问了价格档位与计费方式。',
        nextPlan: '05-15 二次电话对齐实验排期',
      },
      {
        id: 'fu2',
        at: '2025-05-10',
        channel: '邮件',
        summary: '已发送定制化推介 PDF，尚未回复正文。',
        nextPlan: '05-13 邮件 gentle reminder',
      },
    ],
  },
  {
    id: 'ld-nj-xx',
    name: '南京 XX 生物科技公司',
    grade: 'A',
    source: '融资事件',
    assignee: '李四',
    status: '跟进中',
    lastTouch: '05-10',
    track: '细胞治疗',
    region: '南京',
    contact: '陈经理 · BD',
    oneLiner: '通用型 CAR-NK，关注临床合作与 GCP 合规支持。',
    followUps: [],
  },
  {
    id: 'ld-sh-yy',
    name: '上海 YY 制药有限公司',
    grade: '',
    source: '专利入库',
    assignee: '',
    status: '新建',
    lastTouch: '—',
    track: 'AI 制药',
    region: '上海',
    contact: '',
    oneLiner: '小分子 + AI 设计平台型企业，尚在触达破冰阶段。',
    followUps: [],
  },
]
