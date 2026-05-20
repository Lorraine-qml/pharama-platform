import { INITIAL_EVAL_FORMS } from './basicDataMock'
import type { EvaluationDimension, EvaluationForm } from './basicDataTypes'

export const INCUBATION_SCREENING_FORM_ID = 'ev1'

export function getIncubationScreeningForm(): EvaluationForm {
  return INITIAL_EVAL_FORMS.find((f) => f.id === INCUBATION_SCREENING_FORM_ID) ?? INITIAL_EVAL_FORMS[0]!
}

export function formDisplayLabel(form: EvaluationForm): string {
  return `${form.name} ${form.version}（园区统一标准）`
}

export function entityTypeToSource(entityTypeLabel: string): '企业' | '高校' | '研究所' | '医院' {
  if (/高校|大学|院系|课题组/.test(entityTypeLabel)) return '高校'
  if (/医院|临床/.test(entityTypeLabel)) return '医院'
  if (/研究所|研究院|院所/.test(entityTypeLabel)) return '研究所'
  return '企业'
}

/** 按主体来源匹配启用中的科创策源评价表（演示：默认入孵初筛表） */
export function resolveEvalFormForProject(entityTypeLabel: string): EvaluationForm {
  const form = getIncubationScreeningForm()
  if (form.status !== '启用中' || form.scenario !== '科创策源') return form
  const src = entityTypeToSource(entityTypeLabel)
  const allowed = form.applyEntitySources
  if (allowed?.length && !allowed.includes(src)) return form
  return form
}

export function findFormDimension(form: EvaluationForm, namePart: string): EvaluationDimension | undefined {
  return form.dimensions.find((d) => d.name.includes(namePart) || namePart.includes(d.name.replace(/度$/, '')))
}

export function dimensionScoringGuide(dim: EvaluationDimension): string {
  const inds = dim.indicators.map((i) => i.name).join('、')
  return `权重 ${dim.weightPct}%：考察${inds || '相关指标'}等。1–5 分对应较弱、一般、良好、优秀、杰出（可与 AI 百分制对照）。`
}

export const COMPLIANCE_RISK_GUIDE =
  '结合伦理批件、毒理/生物安全材料完整性选择档位：低风险=材料齐全可控；中风险=需补充佐证；高风险=存在重大合规缺口。'

export function buildScoringGuideText(form: EvaluationForm): string {
  const lines = [
    `# ${form.name} ${form.version} · 评分指南`,
    `适用场景：${form.scenario}`,
    `等级规则：${form.gradeRuleSummary}`,
    '',
    '## 各维度说明',
    ...form.dimensions.map((d) => `- ${d.name}：${dimensionScoringGuide(d)}`),
    '',
    `## 合规风险（专家定性）`,
    COMPLIANCE_RISK_GUIDE,
    '',
    '## 综合意见',
    '专家可在标准化打分之外，于「综合意见」中自由阐述个人观点与补充建议。',
    '',
    form.knowledgeBaseLabel ? `关联知识库：${form.knowledgeBaseLabel}` : '',
  ]
  return lines.filter(Boolean).join('\n')
}

/** 专家评审弹窗维度 ↔ 评价表维度 ↔ AI 报告 key */
export const EXPERT_REVIEW_DIM_META = [
  { field: 'tech' as const, label: '技术创新性', formKey: '技术创新', aiKey: '技术' },
  { field: 'team' as const, label: '团队能力', formKey: '团队', aiKey: '团队' },
  { field: 'market' as const, label: '市场潜力', formKey: '市场', aiKey: '市场' },
]
