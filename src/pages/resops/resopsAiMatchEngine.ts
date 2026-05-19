import type { ResResource } from './resopsV1Types'
import { feeSummary } from './resopsV1Labels'
import type { ComboPlan, MatchHit, ParsedDemand, ResourceKindTag } from './resopsAiMatchTypes'

const TYPE_KEYWORDS: { tag: ResourceKindTag; keys: string[] }[] = [
  { tag: 'space', keys: ['实验室', '共享实验室', '空间', '办公室', '会议室', '场地', '工位'] },
  { tag: 'device', keys: ['流式', 'pcr', '测序', '设备', '仪器', '显微镜', '离心'] },
  { tag: 'expert', keys: ['专家', '教授', '咨询', '指导', '评审'] },
  { tag: 'external', keys: ['cro', 'cdmo', '医院', '高校', '外包', '合作方'] },
  { tag: 'ai', keys: ['大模型', '智能体', 'ai', 'skill', '知识库', '算法'] },
  { tag: 'tech', keys: ['检测', '分析', '技术服务', '注册申报', '数据分析'] },
]

function norm(s: string): string {
  return s.trim().toLowerCase()
}

export function kindOfResource(r: ResResource): ResourceKindTag {
  const blob = `${r.name} ${r.level1} ${r.level2} ${r.capability}`
  if (r.level2 === '专家') return 'expert'
  if (r.level2 === 'CRO' || r.level1.includes('产业')) return 'external'
  if (/AI|智能|算法|模型/.test(blob) && r.level2 === '技术服务') return 'ai'
  if (r.level2 === '设备') return 'device'
  if (r.level1.includes('空间') || r.level2.includes('实验室') || r.level2.includes('动物')) return 'space'
  return 'tech'
}

function extractBudget(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:元|块|k|K)/)
  if (!m) return null
  let v = parseFloat(m[1])
  if (/k/i.test(m[0])) v *= 1000
  return Number.isFinite(v) ? v : null
}

function extractTech(text: string): string {
  if (/细胞/.test(text)) return '细胞分析'
  if (/基因|测序/.test(text)) return '基因测序相关'
  if (/药效|毒理/.test(text)) return '药效/毒理'
  return '综合实验需求'
}

/** 规则版 demand_parser（可替换为 demand_parser Skill） */
export function parseDemandRule(raw: string): ParsedDemand {
  const t = raw.trim()
  const n = norm(t)
  const types = new Set<ResourceKindTag>()
  for (const { tag, keys } of TYPE_KEYWORDS) {
    if (keys.some((k) => n.includes(norm(k)))) types.add(tag)
  }
  if (/张|教授|咨询/.test(t)) types.add('expert')
  if (types.size === 0) types.add('device')

  let specific = '—'
  if (/流式/.test(t)) specific = '流式细胞仪'
  else if (/测序/.test(t)) specific = '基因测序服务'
  else if (/实验室|共享/.test(t)) specific = '共享实验室'

  const timeLabel = /下周|明天|周[一二三四五六日]|上午|下午|\d+月/.test(t)
    ? t.match(/下周[^，。\s]+|明天[^，。\s]+|周[一二三四五六日][^，。\s]*[上下]午?/)?.[0] ?? '待补充时段'
    : '待补充时段'

  const timeResolved =
    timeLabel.includes('下周三') ? '2025-05-21 09:00–12:00（演示推算）' : `${timeLabel}（请提交后由运营确认）`

  return {
    demand_id: `d-${Date.now()}`,
    raw_text: t,
    resource_types: Array.from(types),
    specific_resource: specific,
    time_label: timeLabel,
    time_resolved: timeResolved,
    budget: extractBudget(t),
    tech_conditions: extractTech(t),
    compliance: /gmp|glp|伦理|合规/.test(n) ? '需伦理或 GLP 说明（演示）' : '无',
  }
}

function scoreResource(r: ResResource, parsed: ParsedDemand, text: string): number {
  const blob = `${r.name} ${r.intro} ${r.capability} ${r.level1} ${r.level2}`
  let s = 52
  const words = text.replace(/\s+/g, '').split(/[,，.。!！?？]/)
  for (const w of words) {
    if (w.length < 2) continue
    if (blob.includes(w)) s += 6
  }
  const k = kindOfResource(r)
  if (parsed.resource_types.includes(k)) s += 14
  if (parsed.specific_resource !== '—' && r.name.includes(parsed.specific_resource.replace(/仪|服务/g, ''))) s += 12
  if (parsed.budget != null && r.priceAmount != null && r.feeMode === 'hourly' && r.priceAmount * 2 <= parsed.budget) s += 6
  return Math.min(99, Math.max(61, Math.round(s)))
}

function buildReason(r: ResResource, parsed: ParsedDemand): string {
  const k = kindOfResource(r)
  const bits: string[] = []
  if (parsed.tech_conditions) bits.push(`需求侧重「${parsed.tech_conditions}」`)
  if (k === 'device') bits.push(`设备能力与「${r.capability.slice(0, 24)}…」相符`)
  if (k === 'space') bits.push('空间条件与细胞/实验动线匹配')
  if (k === 'expert') bits.push('专家领域覆盖战略与技术路线咨询')
  if (k === 'external') bits.push('外部服务可补充园区目录能力')
  if (k === 'ai') bits.push('与智能化研发辅助场景一致')
  bits.push(`时段建议：${parsed.time_resolved.split('（')[0]}`)
  return bits.slice(0, 3).join('；') + '。'
}

/** 规则版 resource_matcher + match_reason_gen */
export function matchResourcesRule(resources: ResResource[], parsed: ParsedDemand, rawText: string): MatchHit[] {
  const listed = resources.filter((r) => r.status === 'listed')
  const hits: MatchHit[] = listed.map((r, idx) => {
    const score = scoreResource(r, parsed, rawText)
    return {
      match_id: `m-${parsed.demand_id}-${idx}-${r.id}`,
      demand_id: parsed.demand_id,
      resource_id: r.id,
      resource_name: r.name,
      category_label: labelForKind(kindOfResource(r)),
      kind_tag: kindOfResource(r),
      score,
      price_label: feeSummary(r.feeMode, r.priceAmount, r.priceUnit, r.remark),
      reason: buildReason(r, parsed),
    }
  })
  hits.sort((a, b) => b.score - a.score)
  return hits
}

function labelForKind(k: ResourceKindTag): string {
  const map: Record<ResourceKindTag, string> = {
    space: '空间',
    device: '设备',
    expert: '专家',
    tech: '技术服务',
    external: '外部合作',
    ai: 'AI 能力',
  }
  return map[k]
}

/** 规则版 combo_generator：按解析出的多类型各取一条高分命中 */
export function buildComboPlan(parsed: ParsedDemand, hits: MatchHit[]): ComboPlan | null {
  if (parsed.resource_types.length < 2) return null
  const picked: MatchHit[] = []
  for (const tag of parsed.resource_types) {
    const h = hits.find((x) => x.kind_tag === tag)
    if (h && !picked.some((p) => p.resource_id === h.resource_id)) picked.push(h)
  }
  if (picked.length < 2) return null

  const lineTotals = ['约 200 元/半天', '约 400 元/2 小时', '约 200 元/小时']
  const items = picked.slice(0, 3).map((h, i) => ({
    resourceId: h.resource_id,
    name: h.resource_name,
    priceLabel: h.price_label,
    slot: i === 0 ? '下周三 09:00–12:00' : i === 1 ? '下周三 09:00–11:00' : '下周三 11:00–12:00',
    lineTotalLabel: lineTotals[i] ?? '按约定',
  }))

  return {
    combo_id: `c-${parsed.demand_id}`,
    demand_id: parsed.demand_id,
    title: '🧩 实验室 + 设备 + 专家（演示组合）',
    items,
    totalLabel: '约 800 元（演示估算，以合同为准）',
    slotSummary: '下周三 09:00–12:00',
  }
}
