import type { AuthUser } from '../auth/types'
import type { NavSection } from './navigation'
import { filterNavSections, firstLeafInSections } from './navigation'

/** 顶部切换的子平台（下拉顺序：驾驶舱首位，默认路由归属孵化运营平台） */
export type PlatformId = 'cockpit' | 'incubation' | 'ai' | 'eagle-data'

export const PLATFORM_OPTIONS: { id: PlatformId; label: string }[] = [
  { id: 'cockpit', label: '运营驾驶舱' },
  { id: 'incubation', label: '孵化运营平台' },
  { id: 'ai', label: 'AI 能力中台' },
  { id: 'eagle-data', label: '禹翼数据中台' },
]

/** 与各子平台对应的侧边栏分组 key（与 navigation.ts 中 NavSection.key 对齐） */
const PLATFORM_SECTION_KEYS: Record<PlatformId, ReadonlySet<string>> = {
  cockpit: new Set(['cockpit']),
  incubation: new Set([
    'dashboard',
    'sci-source',
    'hatch-mgmt',
    'resource-ops',
    'evaluation',
    'dt-space',
    'basic-data',
    'system-mgmt',
    'portal-extra',
  ]),
  ai: new Set(['ai']),
  'eagle-data': new Set(['data-assets', 'data-quality']),
}

export function platformIdForPath(pathname: string): PlatformId {
  if (pathname.startsWith('/cockpit')) return 'cockpit'
  if (pathname === '/ai-workflow' || pathname.startsWith('/ai-workflow/')) return 'ai'
  if (pathname.startsWith('/data/') || pathname.startsWith('/admin/')) return 'eagle-data'
  return 'incubation'
}

export function platformLabel(id: PlatformId): string {
  return PLATFORM_OPTIONS.find((p) => p.id === id)?.label ?? '孵化运营平台'
}

export function filterNavForPlatform(sections: NavSection[], platformId: PlatformId): NavSection[] {
  const keys = PLATFORM_SECTION_KEYS[platformId]
  return sections.filter((s) => keys.has(s.key))
}

export function firstAllowedPathInPlatform(user: AuthUser, platformId: PlatformId): string | null {
  const base = filterNavSections(user)
  const nav = filterNavForPlatform(base, platformId)
  return firstLeafInSections(nav)?.to ?? null
}

export function accessiblePlatformIds(_user: AuthUser): PlatformId[] {
  return PLATFORM_OPTIONS.map((p) => p.id)
}
