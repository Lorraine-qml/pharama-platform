import type { SjAttachment, SjProject } from './innovationTypes'

/** 必传资料项定义（与运营审核清单对齐） */
const REQUIRED_DEFS: { label: string; categoryKeys: string[] }[] = [
  { label: '主体资质证明', categoryKeys: ['主体资质'] },
  { label: '商业计划书/研究计划', categoryKeys: ['商业计划书', 'BP', '研究计划'] },
  { label: '技术资料', categoryKeys: ['技术资料'] },
  { label: '团队成员信息', categoryKeys: ['团队'] },
  { label: '资源需求清单', categoryKeys: ['资源需求'] },
]

const OPTIONAL_CATEGORIES = ['知识产权', '融资', '伦理', '合规']

export type RequiredMaterialRow = {
  label: string
  ok: boolean
  attachment?: SjAttachment
}

export type MaterialReviewView = {
  required: RequiredMaterialRow[]
  optional: SjAttachment[]
  missingRequired: string[]
}

function categoryMatches(cat: string | undefined, keys: string[]): boolean {
  if (!cat) return false
  return keys.some((k) => cat.includes(k))
}

function findAttachment(project: SjProject, categoryKeys: string[]): SjAttachment | undefined {
  return project.attachments.find((a) => categoryMatches(a.category, categoryKeys))
}

function checklistOk(project: SjProject, label: string): boolean | undefined {
  const row = project.checklist.find((c) => c.label === label || c.label.includes(label.slice(0, 4)))
  return row?.ok
}

export function buildMaterialReviewView(project: SjProject): MaterialReviewView {
  const required: RequiredMaterialRow[] = REQUIRED_DEFS.map((def) => {
    const attachment = findAttachment(project, def.categoryKeys)
    const fromChecklist = checklistOk(project, def.label)
    const ok = fromChecklist !== undefined ? fromChecklist : Boolean(attachment)
    return { label: def.label, ok, attachment: ok ? attachment : undefined }
  })

  const usedNames = new Set(required.map((r) => r.attachment?.name).filter(Boolean))
  const optional = project.attachments.filter((a) => {
    if (usedNames.has(a.name)) return false
    if (REQUIRED_DEFS.some((d) => categoryMatches(a.category, d.categoryKeys))) return false
    return OPTIONAL_CATEGORIES.some((k) => categoryMatches(a.category, [k])) || !a.category
  })

  const missingRequired = required.filter((r) => !r.ok).map((r) => r.label)

  return { required, optional, missingRequired }
}

export function fileKindFromName(name: string): 'image' | 'pdf' | 'office' | 'other' {
  const lower = name.toLowerCase()
  if (/\.(jpe?g|png|gif|webp|bmp)$/.test(lower)) return 'image'
  if (lower.endsWith('.pdf')) return 'pdf'
  if (/\.(docx?|xlsx?|pptx?)$/.test(lower)) return 'office'
  return 'other'
}
