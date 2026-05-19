import type { HatchIncubationType, ProjectArchive } from '../hatch/hatchTypes'
import type { SjProject } from './innovationTypes'

/** 入孵意向文案 → 签约入孵类型 */
export function hatchIncubationTypeFromSj(p: SjProject, choice: 'physical' | 'virtual' | 'observe' | 'reject'): HatchIncubationType {
  if (choice === 'virtual') return '虚拟'
  if (choice === 'physical') {
    if (p.intentLabel.includes('服务')) return '服务商'
    return '实体'
  }
  return '实体'
}

/** 将科创策源项目与入孵档案做演示级关联（优先统一社会信用代码，其次名称模糊匹配） */
export function resolveHatchArchiveIdForSj(p: SjProject, archives: ProjectArchive[]): string | undefined {
  const byCredit = archives.find((a) => a.creditCode.replace(/\s/g, '') === p.creditCode.replace(/\s/g, ''))
  if (byCredit) return byCredit.id
  const byName = archives.find((a) => a.name === p.name || p.name.includes(a.name) || a.name.includes(p.name))
  if (byName) return byName.id
  const demoMap: Record<string, string> = {
    'sj-101': 'h-proj-1',
    'sj-104': 'h-proj-4',
    'sj-106': 'h-proj-1',
  }
  return demoMap[p.id]
}
