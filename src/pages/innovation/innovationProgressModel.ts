import type { UserRole } from '../../auth/types'
import type { SjProject, SjStage } from './innovationTypes'

export type FlowStepKey = 'register' | 'material' | 'ai' | 'assign' | 'review' | 'decision'

/** UI 四类：已完成 | 进行中 | 待处理(就绪未做) | 未开始 */
export type FlowVisual = 'finish' | 'process' | 'wait' | 'locked'

export type DerivedFlowStep = {
  key: FlowStepKey
  timelineId: string
  label: string
  caption: string
  visual: FlowVisual
  /** 已完成节点展示的短日期 MM-DD */
  dateShort?: string
}

const TL_IDS: Record<FlowStepKey, string> = {
  register: 'tl1',
  material: 'tl_mat',
  ai: 'tl_ai',
  assign: 'tl_as',
  review: 'tl_ex',
  decision: 'tl_dc',
}

function materialPassed(s: SjStage) {
  return s !== 'pending_material_review' && s !== 'returned_supplement'
}

function aiPassed(s: SjStage) {
  return ![
    'pending_material_review',
    'returned_supplement',
    'pending_ai',
  ].includes(s)
}

function assignPassed(s: SjStage) {
  return (
    s === 'expert_reviewing' ||
    s === 'review_done' ||
    s === 'pending_decision' ||
    s === 'decision_pass' ||
    s === 'decision_reject'
  )
}

function reviewPassed(s: SjStage) {
  return (
    s === 'pending_decision' || s === 'decision_pass' || s === 'decision_reject' || s === 'review_done'
  )
}

function decisionPassed(s: SjStage) {
  return s === 'decision_pass' || s === 'decision_reject'
}

function parseMmDdFromSubtitle(sub?: string): string | undefined {
  if (!sub) return undefined
  const m = /\d{4}-(\d{2})-(\d{2})/.exec(sub)
  return m ? `${m[1]}-${m[2]}` : undefined
}

function timelineSubtitle(project: SjProject, timelineId: string): string | undefined {
  return project.timeline.find((e) => e.id === timelineId)?.subtitle
}

function timelineDetail(project: SjProject, timelineId: string): string | undefined {
  return project.timeline.find((e) => e.id === timelineId)?.detail
}

export function deriveFlowSteps(project: SjProject): DerivedFlowStep[] {
  const s = project.stage
  const m = materialPassed(s)
  const aiOk = aiPassed(s)
  const asOk = assignPassed(s)
  const rvOk = reviewPassed(s)
  const dcOk = decisionPassed(s)

  const steps: Omit<DerivedFlowStep, 'visual' | 'dateShort'>[] = [
    {
      key: 'register',
      timelineId: TL_IDS.register,
      label: '注册',
      caption: '提交',
    },
    {
      key: 'material',
      timelineId: TL_IDS.material,
      label: '资料',
      caption: !m ? (s === 'returned_supplement' ? '待补充' : '审核') : '审核',
    },
    {
      key: 'ai',
      timelineId: TL_IDS.ai,
      label: 'AI',
      caption: aiOk ? '评估' : s === 'pending_ai' ? '评估' : '评估',
    },
    {
      key: 'assign',
      timelineId: TL_IDS.assign,
      label: '专家',
      caption: asOk ? '分配' : s === 'pending_expert_assign' ? '分配' : '分配',
    },
    {
      key: 'review',
      timelineId: TL_IDS.review,
      label: '评审',
      caption: rvOk ? '完成' : s === 'expert_reviewing' ? '进行中' : '评审',
    },
    {
      key: 'decision',
      timelineId: TL_IDS.decision,
      label: '决策',
      caption: dcOk ? '已决' : s === 'pending_decision' ? '待决策' : '待定',
    },
  ]

  return steps.map((st) => {
    let visual: FlowVisual = 'locked'
    let dateShort: string | undefined

    switch (st.key) {
      case 'register':
        visual = 'finish'
        dateShort = parseMmDdFromSubtitle(timelineSubtitle(project, st.timelineId))
        break
      case 'material': {
        const done = m
        const active = s === 'pending_material_review' || s === 'returned_supplement'
        if (done) {
          visual = 'finish'
          dateShort = parseMmDdFromSubtitle(timelineSubtitle(project, st.timelineId))
        } else if (active) visual = 'process'
        else visual = 'locked'
        break
      }
      case 'ai': {
        const done = aiOk
        const active = m && s === 'pending_ai'
        if (done) {
          visual = 'finish'
          dateShort = parseMmDdFromSubtitle(timelineSubtitle(project, st.timelineId))
        } else if (active) visual = 'process'
        else if (m && !done) visual = 'wait'
        else visual = 'locked'
        break
      }
      case 'assign': {
        const done = asOk
        const active = aiOk && s === 'pending_expert_assign'
        if (done) {
          visual = 'finish'
          dateShort = parseMmDdFromSubtitle(timelineSubtitle(project, st.timelineId))
        } else if (active) visual = 'process'
        else if (aiOk && !done) visual = 'wait'
        else visual = 'locked'
        break
      }
      case 'review': {
        const done = rvOk
        const active = asOk && s === 'expert_reviewing'
        if (done) {
          visual = 'finish'
          dateShort = parseMmDdFromSubtitle(timelineSubtitle(project, st.timelineId))
        } else if (active) visual = 'process'
        else if (asOk && !done) visual = 'wait'
        else visual = 'locked'
        break
      }
      case 'decision': {
        const done = dcOk
        const active = rvOk && s === 'pending_decision'
        if (done) {
          visual = 'finish'
          dateShort = parseMmDdFromSubtitle(timelineSubtitle(project, st.timelineId))
        } else if (active) visual = 'process'
        else if (rvOk && !done) visual = 'wait'
        else visual = 'locked'
        break
      }
    }

    return { ...st, visual, dateShort }
  })
}

export function defaultSelectedStep(steps: DerivedFlowStep[]): FlowStepKey {
  const proc = steps.find((x) => x.visual === 'process')
  if (proc) return proc.key
  const wait = steps.find((x) => x.visual === 'wait')
  if (wait) return wait.key
  const finish = [...steps].reverse().find((x) => x.visual === 'finish')
  if (finish) return finish.key
  return 'register'
}

/** 连接线：从左侧节点引出的一段 */
export function connectorToNext(fromStep: DerivedFlowStep): 'done' | 'gradient' | 'muted' {
  if (fromStep.visual === 'finish') return 'done'
  if (fromStep.visual === 'process') return 'gradient'
  return 'muted'
}

export function timelineRow(project: SjProject, timelineId: string) {
  return project.timeline.find((e) => e.id === timelineId)
}

export { timelineDetail }

export function stepClickAllowed(
  _role: UserRole,
  step: DerivedFlowStep,
): { allowed: boolean; viewOnly: boolean } {
  void _role
  if (step.visual === 'locked') return { allowed: true, viewOnly: true }
  return { allowed: true, viewOnly: false }
}

/** 项目详情页 Tab，与流程节点联动 */
export type ProjectDetailTab = 'basic' | 'files' | 'ai' | 'experts' | 'decision'

export function flowStepKeyToDetailTab(key: FlowStepKey): ProjectDetailTab {
  const m: Record<FlowStepKey, ProjectDetailTab> = {
    register: 'basic',
    material: 'files',
    ai: 'ai',
    assign: 'experts',
    review: 'experts',
    decision: 'decision',
  }
  return m[key]
}

export function detailTabToFlowKey(tab: ProjectDetailTab, stage: SjStage): FlowStepKey {
  switch (tab) {
    case 'basic':
      return 'register'
    case 'files':
      return 'material'
    case 'ai':
      return 'ai'
    case 'experts':
      return stage === 'pending_expert_assign' ? 'assign' : 'review'
    case 'decision':
      return 'decision'
    default:
      return 'register'
  }
}

export function opsJumpHref(project: SjProject, key: FlowStepKey): string | undefined {
  const id = project.id
  switch (key) {
    case 'material':
      if (
        project.stage === 'pending_material_review' ||
        project.stage === 'returned_supplement'
      )
        return `/innovation/ops/review/${id}`
      return undefined
    case 'ai':
      if (project.stage === 'pending_ai') return `/innovation/ops/ai/${id}`
      return undefined
    case 'assign':
      if (project.stage === 'pending_expert_assign') return `/innovation/ops/assign/${id}`
      return undefined
    case 'review':
      if (project.stage === 'expert_reviewing') return `/innovation/project/${id}#sj-expert-panel`
      return undefined
    case 'decision':
      if (project.stage === 'pending_decision') return `/innovation/ops/decision/${id}`
      return undefined
    default:
      return undefined
  }
}
