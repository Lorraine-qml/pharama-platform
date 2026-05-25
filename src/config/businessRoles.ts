import type { AuthUser } from '../auth/types'

/** 生物芯片孵化平台 · 四类业务角色 */
export type BusinessRoleId = 'incubation-user' | 'service-provider' | 'platform-admin' | 'expert'

export const BUSINESS_ROLE_LABELS: Record<BusinessRoleId, string> = {
  'incubation-user': '入孵用户',
  'service-provider': '服务商',
  'platform-admin': '平台管理员',
  expert: '专家',
}

/** 路由访问前缀（含动态子路径，如 /innovation/project/:id） */
export const BUSINESS_ROLE_PATH_PREFIXES: Record<BusinessRoleId, readonly string[]> = {
  'incubation-user': [
    '/',
    '/innovation/applicant/register',
    '/innovation/ops/workbench',
    '/innovation/ops/pool',
    '/innovation/project',
    '/hatch/archive',
    '/hatch/workbench',
    '/resops/catalog',
    '/resops/my-applications',
    '/resops/usage-orders',
    '/resops/listing-apply',
    '/resops/ai-match',
    '/resops/resource',
  ],
  'service-provider': [
    '/',
    '/resops/provider',
    '/resops/mgmt',
    '/resops/listing-apply',
    '/resops/usage-orders',
    '/resops/catalog',
    '/resops/resource',
  ],
  'platform-admin': [
    '/',
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
  expert: [
    '/',
    '/innovation/ops/workbench',
    '/innovation/ops/pool',
    '/innovation/ops/review',
    '/innovation/expert/review',
    '/innovation/project',
  ],
}

export function resolveBusinessRole(user: AuthUser): BusinessRoleId {
  if (user.role === 'expert') return 'expert'
  if (user.role === 'platform') return 'platform-admin'
  if (user.orgKind === 'service-provider') return 'service-provider'
  return 'incubation-user'
}

/** 登录演示：业务角色 → 推荐的企业形态与系统角色 */
export const BUSINESS_ROLE_LOGIN_PRESETS: Record<
  BusinessRoleId,
  { orgKind: AuthUser['orgKind']; role: AuthUser['role']; hint: string }
> = {
  'incubation-user': {
    orgKind: 'physical',
    role: 'enterprise-admin',
    hint: '入孵注册、候选项目池（仅本账号项目）、入孵运营工作台与资源预约',
  },
  'service-provider': {
    orgKind: 'service-provider',
    role: 'enterprise-admin',
    hint: '资源登记、提供方工作台与使用单查看',
  },
  'platform-admin': {
    orgKind: 'physical',
    role: 'platform',
    hint: '入孵/服务商审核、资源与系统全量管理',
  },
  expert: {
    orgKind: 'physical',
    role: 'expert',
    hint: '入孵企业材料评审、任务中心与项目查阅',
  },
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

export function canViewAllPoolProjects(user: AuthUser): boolean {
  return resolveBusinessRole(user) === 'platform-admin'
}

export function isIncubationPoolUser(user: AuthUser): boolean {
  return resolveBusinessRole(user) === 'incubation-user'
}

export function isExpertUser(user: AuthUser): boolean {
  return resolveBusinessRole(user) === 'expert'
}
