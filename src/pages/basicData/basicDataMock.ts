import type {
  BlocklistRecord,
  DictGroupRecord,
  EvaluationForm,
  ExpertMatchWeights,
  ExpertRecord,
  PartnerOrg,
  ScoringFormula,
  SourceTypeRecord,
} from './basicDataTypes'

export const INITIAL_EVAL_FORMS: EvaluationForm[] = [
  {
    id: 'ev1',
    name: '入孵初筛评价表',
    scenario: '科创策源',
    version: 'v2',
    status: '启用中',
    updatedAt: '2025-05-10',
    gradeRuleSummary: '优秀(≥85) 良好(70-84) 一般(55-69) 较弱(40-54) 高风险(<40)',
    reviewTemplateScore: '专家评分表模板',
    reviewTemplateOpinion: '评审意见模板',
    reviewTemplateRisk: '风险提示模板',
    knowledgeBaseLabel: '园区生物医药入孵政策与评分知识库',
    applyEntitySources: ['企业', '高校', '研究所', '医院'],
    applyIncubationTypes: ['实体', '虚拟', '服务商'],
    dimensions: [
      {
        id: 'd1',
        name: '产业匹配度',
        weightPct: 30,
        indicators: [
          { id: 'i1', name: '是否重点赛道', minScore: 0, maxScore: 10 },
          { id: 'i2', name: '前沿技术标签匹配', minScore: 0, maxScore: 10 },
          { id: 'i3', name: '产业链契合度', minScore: 0, maxScore: 10 },
        ],
      },
      {
        id: 'd2',
        name: '技术创新性',
        weightPct: 25,
        indicators: [
          { id: 'i4', name: '专利数量', minScore: 0, maxScore: 10 },
          { id: 'i5', name: '技术独特性', minScore: 0, maxScore: 15 },
        ],
      },
      {
        id: 'd3',
        name: '团队能力',
        weightPct: 20,
        indicators: [{ id: 'i6', name: '核心成员背景', minScore: 0, maxScore: 10 }],
      },
      { id: 'd4', name: '市场潜力', weightPct: 15, indicators: [{ id: 'i7', name: '市场规模', minScore: 0, maxScore: 8 }] },
      {
        id: 'd5',
        name: '合规风险',
        weightPct: 10,
        indicators: [
          { id: 'i8', name: '伦理材料完整性', minScore: 0, maxScore: 5 },
          { id: 'i9', name: '生物安全', minScore: 0, maxScore: 5 },
        ],
      },
    ],
  },
  {
    id: 'ev2',
    name: '企业成长评分表',
    scenario: '孵化评估',
    version: 'v1',
    status: '启用中',
    updatedAt: '2025-05-09',
    gradeRuleSummary: '五级制同初筛口径（演示共用）',
    dimensions: [],
  },
  {
    id: 'ev3',
    name: '资源匹配度评分表',
    scenario: 'AI 撮合',
    version: 'v1',
    status: '草稿',
    updatedAt: '2025-05-08',
    dimensions: [],
    gradeRuleSummary: '—',
  },
]

export const INITIAL_FORMULAS: ScoringFormula[] = [
  {
    id: 'f1',
    name: '入孵初筛综合分',
    formId: 'ev1',
    formName: '入孵初筛评价表',
    expression: 'SUM(维度得分 × 维度权重)',
  },
  {
    id: 'f2',
    name: '资源匹配度',
    formId: 'ev3',
    formName: '资源匹配度评分表',
    expression: '0.4×产业契合 + 0.3×可用性 + 0.3×历史评价',
  },
]

export const INITIAL_EXPERTS: ExpertRecord[] = [
  {
    id: 'ex1',
    name: '张教授',
    org: '清华大学',
    fields: ['细胞治疗', '基因编辑'],
    reviewCount: 23,
    avgScore: 88.5,
    status: '启用中',
    phone: '138****1234',
    email: 'zhang@tsinghua.edu.cn',
    intro: '从事细胞治疗研究 15 年（演示文案）',
    stages: ['概念验证', '临床前'],
    reward: '2000 元/次',
  },
  {
    id: 'ex2',
    name: '李博士',
    org: '中科院药物所',
    fields: ['AI制药', '药理学'],
    reviewCount: 15,
    avgScore: 91.2,
    status: '启用中',
  },
  {
    id: 'ex3',
    name: '王主任',
    org: '华山医院',
    fields: ['临床肿瘤', '伦理'],
    reviewCount: 8,
    avgScore: 86,
    status: '停用',
  },
]

export const DEFAULT_MATCH_WEIGHTS: ExpertMatchWeights = {
  techKeyword: 40,
  stageFit: 20,
  historySimilar: 20,
  regionFit: 10,
  loadBalance: 10,
}

export const INITIAL_PARTNERS: PartnerOrg[] = [
  { id: 'p1', name: '药明康德', kind: 'CRO', contact: '张三', phone: '021-6688-xxxx', enabled: true },
  { id: 'p2', name: '复旦大学附属中山医院', kind: '医院', contact: '李四', phone: '021-6404-xxxx', enabled: true },
  { id: 'p3', name: '红杉资本', kind: '投资机构', contact: '王五', phone: '010-6595-xxxx', enabled: false },
]

export const INITIAL_SOURCES: SourceTypeRecord[] = [
  { id: 's1', name: '企业', description: '工商主体企业报送', enabled: true },
  { id: 's2', name: '高校', description: '高校科研成果转化入口', enabled: true },
  { id: 's3', name: '研究所', description: '', enabled: true },
  { id: 's4', name: '医院', description: '', enabled: true },
]

export const INITIAL_BLOCKLIST: BlocklistRecord[] = [
  { id: 'b1', name: '虚构不良主体 A', reason: '屡次虚假材料', since: '2025-03-01', enabled: true },
]

export const INITIAL_DICT_GROUPS: DictGroupRecord[] = [
  {
    id: 'dg1',
    name: '行业方向',
    preset: true,
    tags: [
      { id: 't1', label: '创新药', enabled: true },
      { id: 't2', label: '医疗器械', enabled: true },
      { id: 't3', label: 'IVD', enabled: true },
      { id: 't4', label: '细胞治疗', enabled: true },
      { id: 't5', label: '基因检测', enabled: true },
      { id: 't6', label: 'AI制药', enabled: true },
      { id: 't7', label: '合成生物', enabled: true },
    ],
  },
  {
    id: 'dg2',
    name: '项目阶段',
    preset: true,
    tags: [
      { id: 't11', label: '概念验证', enabled: true },
      { id: 't12', label: '初创', enabled: true },
      { id: 't13', label: '成长期', enabled: true },
      { id: 't14', label: '产业化', enabled: true },
    ],
  },
  {
    id: 'dg3',
    name: '资源类型',
    preset: true,
    tags: [
      { id: 't21', label: '空间', enabled: true },
      { id: 't22', label: '设备', enabled: true },
      { id: 't23', label: '专家', enabled: true },
      { id: 't24', label: 'AI 能力', enabled: true },
    ],
  },
  {
    id: 'dg-inc-type',
    name: '入孵类型',
    preset: true,
    dictKind: 'incubation_type',
    tags: [
      { id: 'it-entity', code: 'entity', label: '实体入孵', enabled: true, sortOrder: 1, isDefault: true },
      { id: 'it-virtual', code: 'virtual', label: '虚拟入孵', enabled: true, sortOrder: 2, isDefault: false },
      { id: 'it-service', code: 'service', label: '服务商', enabled: true, sortOrder: 3, isDefault: false },
    ],
  },
  {
    id: 'dg-proj-status',
    name: '项目状态',
    preset: true,
    dictKind: 'project_status',
    tags: [
      { id: 'ps-pending', code: 'pending_sign', label: '待签约', enabled: true, color: '橙色', canRequestResources: false },
      { id: 'ps-active', code: 'active', label: '正常运营', enabled: true, color: '绿色', canRequestResources: true },
      { id: 'ps-suspended', code: 'suspended', label: '暂停服务', enabled: true, color: '红色', canRequestResources: false },
      { id: 'ps-graduated', code: 'graduated', label: '已毕业', enabled: true, color: '灰色', canRequestResources: false },
      { id: 'ps-exited', code: 'exited', label: '已退出', enabled: true, color: '灰色', canRequestResources: false },
    ],
  },
]
