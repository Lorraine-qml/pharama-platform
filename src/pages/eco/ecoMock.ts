import type { AiAbilityNode, ExternalPartner, KbDocument, KnowledgeBase, VirtualProject } from './ecoTypes'

export const INITIAL_VIRTUAL_PROJECTS: VirtualProject[] = [
  {
    id: 'eco-vp-1',
    name: '类器官芯片',
    domain: '类器官',
    resourceNeed: '共享实验室、细胞培养箱',
    contact: '张三',
    phone: '13800001111',
    email: 'zhang@demo.cn',
    linkedProjectId: null,
    status: '启用',
  },
  {
    id: 'eco-vp-2',
    name: 'AI药物筛选',
    domain: 'AI制药',
    resourceNeed: '计算资源、基因测序',
    contact: '李四',
    phone: '13800002222',
    email: 'li@demo.cn',
    linkedProjectId: 'h-proj-1',
    status: '启用',
  },
  {
    id: 'eco-vp-3',
    name: '合成生物学平台',
    domain: '合成生物',
    resourceNeed: '发酵设备、菌种库',
    contact: '王五',
    phone: '13800003333',
    email: '',
    linkedProjectId: 'h-proj-3',
    status: '启用',
  },
]

export const INITIAL_EXTERNAL_PARTNERS: ExternalPartner[] = [
  {
    id: 'eco-ep-1',
    name: '药明康德',
    orgType: 'CRO',
    contact: '王五',
    phone: '13812341234',
    email: 'wu@wuxi.demo',
    coopStatus: '进行中',
    linkedProjectId: 'h-proj-1',
    remark: '',
  },
  {
    id: 'eco-ep-2',
    name: '复旦附属医院',
    orgType: '医院',
    contact: '赵六',
    phone: '021-12345678',
    email: '',
    coopStatus: '意向中',
    linkedProjectId: null,
    remark: '临床合作洽谈中',
  },
  {
    id: 'eco-ep-3',
    name: '清华大学',
    orgType: '高校',
    contact: '孙七',
    phone: '010-123456',
    email: 'sun@tsinghua.edu.cn',
    coopStatus: '已结束',
    linkedProjectId: 'h-proj-2',
    remark: '联合课题已结题',
  },
]

export const INITIAL_AI_NODES: AiAbilityNode[] = [
  {
    id: 'eco-ai-1',
    name: '项目初筛智能体',
    kind: '智能体',
    description: '自动评估项目入孵可能性，输出评分和报告。',
    status: '在线',
    version: 'v1.0',
    invoke: 'REST API / SDK',
    calls30d: 156,
    successPct: 98,
  },
  {
    id: 'eco-ai-2',
    name: '资源撮合 Skill',
    kind: 'Skill',
    description: '匹配需求与资源',
    status: '在线',
    version: 'v0.9',
    invoke: 'REST API',
    calls30d: 420,
    successPct: 96,
  },
  {
    id: 'eco-ai-3',
    name: '园区知识库',
    kind: '知识库',
    description: '园区制度、政策、资源说明',
    status: '在线',
    version: '—',
    invoke: '检索 API',
    calls30d: 2100,
    successPct: 99,
  },
  {
    id: 'eco-ai-4',
    name: '大模型（GPT-4）',
    kind: '大模型',
    description: '自然语言问答、摘要生成',
    status: '维护中',
    version: 'gpt-4-turbo',
    invoke: 'REST API / SDK',
    calls30d: 89,
    successPct: 94,
  },
]

export const INITIAL_KNOWLEDGE_BASES: KnowledgeBase[] = [
  { id: 'kb-public', name: '园区公共知识库', kind: '公共', projectId: null, description: '制度与办事指南', updatedAt: '2025-05-10' },
  { id: 'kb-industry', name: '生物医药行业标准', kind: '行业', projectId: null, description: '行业规范与标准汇编', updatedAt: '2025-05-09' },
  { id: 'kb-gene', name: '基因治疗项目文档', kind: '私有', projectId: 'h-proj-1', description: '项目过程文档', updatedAt: '2025-05-08' },
  { id: 'kb-ai', name: 'AI新药平台资料', kind: '私有', projectId: 'h-proj-3', description: '平台方案与材料', updatedAt: '2025-05-07' },
]

export const INITIAL_KB_DOCUMENTS: Record<string, KbDocument[]> = {
  'kb-gene': [
    { id: 'd1', kbId: 'kb-gene', name: '实验方案_v1.pdf', ext: 'PDF', sizeLabel: '2.3MB', uploadedAt: '2025-05-10 10:20', uploader: '张三' },
    { id: 'd2', kbId: 'kb-gene', name: '专利证书.pdf', ext: 'PDF', sizeLabel: '1.1MB', uploadedAt: '2025-05-09 15:00', uploader: '李四' },
    { id: 'd3', kbId: 'kb-gene', name: '会议纪要.docx', ext: 'Word', sizeLabel: '0.5MB', uploadedAt: '2025-05-08 09:30', uploader: '张三' },
  ],
  'kb-ai': [
    { id: 'd4', kbId: 'kb-ai', name: '靶点清单.xlsx', ext: 'Excel', sizeLabel: '0.8MB', uploadedAt: '2025-05-07 11:00', uploader: '李华' },
  ],
  'kb-public': [],
  'kb-industry': [],
}
