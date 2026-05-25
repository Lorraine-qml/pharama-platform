import type { StatusPillVariant } from '../../components/ui/StatusPill'
import type { SjProject } from './innovationTypes'

/** 候选项目池列表「当前状态」展示（与内部 stage 对齐） */
export function poolStatusLabel(p: SjProject): string {
  switch (p.stage) {
    case 'pending_material_review':
      return '待资料审核'
    case 'returned_supplement':
      return '资料补充'
    case 'pending_ai':
      return p.aiReport ? 'AI评估完成·待确认' : '待评估'
    case 'pending_expert_assign':
      return '待专家分配'
    case 'expert_reviewing':
      return '专家评审中'
    case 'review_done':
      return '评审完成'
    case 'pending_decision':
      return '待决策'
    case 'decision_pass':
      return p.decisionChoice === 'observe' ? '观察培育' : '已转入入孵'
    case 'decision_reject':
      return '暂不通过'
    default:
      return p.currentNodePublic
  }
}

/** 与全局状态胶囊语义对齐（科创策源项目阶段） */
export function poolStagePillVariant(p: SjProject): StatusPillVariant {
  switch (p.stage) {
    case 'pending_material_review':
    case 'pending_ai':
      return p.stage === 'pending_ai' && p.aiReport ? 'progress' : 'pending'
    case 'returned_supplement':
      return 'pending'
    case 'pending_expert_assign':
    case 'expert_reviewing':
    case 'pending_decision':
      return 'progress'
    case 'review_done':
      return 'success'
    case 'decision_pass':
      return p.decisionChoice === 'observe' ? 'pending' : 'success'
    case 'decision_reject':
      return 'danger'
    default:
      return 'muted'
  }
}
