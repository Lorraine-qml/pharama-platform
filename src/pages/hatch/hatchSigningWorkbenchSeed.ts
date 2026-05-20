import type { SigningWorkbenchTask } from './hatchTypes'

/** 决策通过、尚未生成 contract 的签约待办（演示） */
export const EXTRA_SIGNING_WORKBENCH_TASKS: SigningWorkbenchTask[] = [
  {
    id: 'task-sign-cell-pending',
    kind: 'sign',
    tab: 'todo',
    projectId: 'h-proj-3b',
    projectName: '细胞治疗项目',
    createdAt: '2025-05-18',
    statusLabel: '待签署',
    templateLabel: '实体入孵协议',
    decisionNote: '实体入孵，决策通过',
  },
]
