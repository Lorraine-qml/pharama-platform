export type TaskKind = 'material' | 'ai' | 'assign' | 'expert' | 'decision'

export type TodoRowSeed = {
  id: string
  kind: TaskKind
  typeLabel: string
  projectId: string
  projectName: string
  createdAt: string
  statusLabel: '待处理' | '处理中' | '超时'
  actionLabel: string
  href: string
  batchKey: 'material' | 'ai' | 'assign' | 'decision' | null
}

export type InProgressRowSeed = {
  id: string
  kind: TaskKind | 'resource'
  typeLabel: string
  projectName: string
  projectId?: string
  createdAt: string
  progressLabel: string
  progressPct?: number
  canUrge: boolean
  href?: string
}

export type DoneRowSeed = {
  id: string
  typeLabel: string
  projectName: string
  projectId: string
  result: string
  at: string
  actor?: string
  detailKind: 'default' | 'report' | 'signing'
}

export type InitiatedRowSeed = {
  id: string
  flowType: string
  name: string
  projectId?: string
  createdAt: string
  currentNode: string
  statusLabel: string
  statusTone: 'primary' | 'warning' | 'muted'
  canSupplement: boolean
  canCancel: boolean
}

/** 我的待办 · 园区运营演示（5 条，覆盖 5 类任务） */
export const WORKBENCH_TODO_SEED: TodoRowSeed[] = [
  {
    id: 'todo-mat-gene',
    kind: 'material',
    typeLabel: '资料审核',
    projectId: 'sj-101',
    projectName: '基因治疗项目',
    createdAt: '2025-05-10',
    statusLabel: '超时',
    actionLabel: '审核',
    href: '/innovation/ops/review/sj-101',
    batchKey: 'material',
  },
  {
    id: 'todo-ai-mrna',
    kind: 'ai',
    typeLabel: 'AI评估',
    projectId: 'sj-105',
    projectName: 'mRNA递送载体平台',
    createdAt: '2025-05-09',
    statusLabel: '待处理',
    actionLabel: '开始评估',
    href: '/innovation/ops/ai/sj-105',
    batchKey: 'ai',
  },
  {
    id: 'todo-assign-cell',
    kind: 'assign',
    typeLabel: '专家分配',
    projectId: 'sj-103',
    projectName: '细胞治疗临床转化',
    createdAt: '2025-05-08',
    statusLabel: '待处理',
    actionLabel: '分配专家',
    href: '/innovation/ops/assign/sj-103',
    batchKey: 'assign',
  },
  {
    id: 'todo-decision-ab',
    kind: 'decision',
    typeLabel: '入孵决策',
    projectId: 'sj-104',
    projectName: '抗体药中试项目',
    createdAt: '2025-05-07',
    statusLabel: '待处理',
    actionLabel: '去决策',
    href: '/innovation/ops/decision/sj-104',
    batchKey: 'decision',
  },
  {
    id: 'todo-expert-ai-drug',
    kind: 'expert',
    typeLabel: '项目评审',
    projectId: 'sj-102',
    projectName: 'AI新药筛选平台',
    createdAt: '2025-05-01',
    statusLabel: '待处理',
    actionLabel: '去评审',
    href: '/innovation/expert/review/sj-102',
    batchKey: null,
  },
]

/** 进行中 · 已启动、待他人或系统推进 */
export const WORKBENCH_IN_PROGRESS_SEED: InProgressRowSeed[] = [
  {
    id: 'prog-ai-organoid',
    kind: 'ai',
    typeLabel: 'AI评估',
    projectName: '类器官芯片项目',
    projectId: 'sj-106',
    createdAt: '2025-05-11',
    progressLabel: '评估中（65%）',
    progressPct: 65,
    canUrge: false,
    href: '/innovation/ops/ai/sj-106',
  },
  {
    id: 'prog-expert-gene',
    kind: 'expert',
    typeLabel: '专家评审',
    projectName: '基因治疗项目',
    projectId: 'sj-101',
    createdAt: '2025-05-09',
    progressLabel: '已提交 1/3 位专家',
    canUrge: true,
    href: '/innovation/project/sj-101?tab=experts',
  },
  {
    id: 'prog-res-flow',
    kind: 'resource',
    typeLabel: '资源审批',
    projectName: '流式细胞仪申请',
    createdAt: '2025-05-12',
    progressLabel: '等待平台审核',
    canUrge: false,
  },
  {
    id: 'prog-decision-cell',
    kind: 'decision',
    typeLabel: '入孵决策',
    projectName: '细胞治疗项目',
    projectId: 'sj-103',
    createdAt: '2025-05-06',
    progressLabel: '等待运营决策',
    canUrge: false,
    href: '/innovation/project/sj-103?tab=decision',
  },
]

/** 我的已办 */
export const WORKBENCH_DONE_SEED: DoneRowSeed[] = [
  {
    id: 'done-mat-ab',
    typeLabel: '资料审核',
    projectName: '抗体药项目',
    projectId: 'sj-104',
    result: '通过',
    at: '2025-05-05 14:20',
    actor: '李四（运营初审）',
    detailKind: 'default',
  },
  {
    id: 'done-ai-platform',
    typeLabel: 'AI评估',
    projectName: 'AI新药平台',
    projectId: 'sj-102',
    result: '完成（86分）',
    at: '2025-05-04 09:15',
    actor: '系统',
    detailKind: 'report',
  },
  {
    id: 'done-assign-organoid',
    typeLabel: '专家分配',
    projectName: '类器官芯片',
    projectId: 'sj-106',
    result: '已分配 3 位专家',
    at: '2025-05-03 16:40',
    actor: '王五（运营）',
    detailKind: 'default',
  },
  {
    id: 'done-decision-mrna',
    typeLabel: '入孵决策',
    projectName: 'mRNA载体项目',
    projectId: 'sj-105',
    result: '实体入孵通过',
    at: '2025-05-02 10:30',
    actor: '运营主管',
    detailKind: 'signing',
  },
]

/** 我发起的 */
export const WORKBENCH_INITIATED_SEED: InitiatedRowSeed[] = [
  {
    id: 'init-hatch-gene',
    flowType: '入孵申请',
    name: '基因治疗项目',
    projectId: 'sj-101',
    createdAt: '2025-05-10',
    currentNode: '资料审核',
    statusLabel: '审核中',
    statusTone: 'primary',
    canSupplement: true,
    canCancel: false,
  },
  {
    id: 'init-hatch-cell',
    flowType: '入孵申请',
    name: '细胞治疗项目',
    projectId: 'sj-103',
    createdAt: '2025-04-28',
    currentNode: 'AI评估',
    statusLabel: '评估中',
    statusTone: 'primary',
    canSupplement: false,
    canCancel: false,
  },
  {
    id: 'init-res-flow',
    flowType: '资源申请',
    name: '流式细胞仪',
    createdAt: '2025-05-12',
    currentNode: '等待确认',
    statusLabel: '申请中',
    statusTone: 'warning',
    canSupplement: false,
    canCancel: true,
  },
]
