import type { AuthUser } from '../auth/types'

/** 平台仅面向园区运营 / 平台管理员 */
export type BusinessRoleId = 'platform-admin'

export const BUSINESS_ROLE_LABELS: Record<BusinessRoleId, string> = {
  'platform-admin': '平台管理员',
}

/** 路由访问前缀（含动态子路径，如 /innovation/project/:id） */
export const BUSINESS_ROLE_PATH_PREFIXES: Record<BusinessRoleId, readonly string[]> = {
  'platform-admin': [
    '/',
    '/console',
    '/innovation',
    '/hatch',
    '/resops',
    '/eval',
    '/twin',
    '/eco',
    '/basic',
    '/system',
    '/portal/matchmaking',
    '/cockpit',
    '/ai-workflow',
    '/data',
  ],
}

export function resolveBusinessRole(_user: AuthUser): BusinessRoleId {
  return 'platform-admin'
}

export function pathMatchesPrefix(prefix: string, pathname: string): boolean {
  return pathname === prefix || (prefix !== '/' && pathname.startsWith(`${prefix}/`))
}

export function pathnameAllowedForUser(pathname: string, user: AuthUser): boolean {
  const prefixes = BUSINESS_ROLE_PATH_PREFIXES[resolveBusinessRole(user)]
  return prefixes.some((p) => pathMatchesPrefix(p, pathname))
}

/** 侧栏叶子菜单是否对当前角色可见 */
export function isMenuLeafAllowed(leafTo: string, user: AuthUser): boolean {
  return pathnameAllowedForUser(leafTo, user)
}

export function canViewAllPoolProjects(_user: AuthUser): boolean {
  return true
}

export function isIncubationPoolUser(_user: AuthUser): boolean {
  return false
}

export function isExpertUser(_user: AuthUser): boolean {
  return false
}
