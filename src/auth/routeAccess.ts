import type { AuthUser, UserRole } from './types'
import {
  isMenuLeafAllowed,
  pathnameAllowedForUser,
  resolveBusinessRole,
  type BusinessRoleId,
} from '../config/businessRoles'

const PUBLIC_PATHS = ['/', '/register', '/forgot-password', '/platform-modules'] as const

/** 旧 URL → 重定向目标（用于权限推导） */
const LEGACY_REDIRECT_TARGET: Record<string, string> = {
  '/leads': '/innovation/ops/workbench',
  '/leads/assessment': '/innovation/ai-evaluation',
  '/onboarding/space': '/hatch/physical-space',
  '/onboarding/profile': '/hatch/archive',
  '/resources/demo': '/resops/catalog',
  '/growth': '/eval/growth-tracking',
  '/digital-twin': '/twin/infrastructure',
  '/twin/park-model': '/twin/infrastructure',
  '/twin/spaces': '/twin/infrastructure/spaces',
  '/twin/project-map': '/twin/distribution/projects',
  '/twin/resource-map': '/twin/distribution/resources',
  '/twin/virtual-layer': '/twin/infrastructure',
  '/twin/analytics': '/twin/space-analytics',
  '/admin/roles': '/system/roles',
  '/system/overview': '/system/users',
  '/system/orgs': '/system/users',
  '/system/notices': '/system/settings',
  '/innovation/project-registration': '/innovation/applicant/register',
  '/innovation/project-materials': '/innovation/ops/workbench',
  '/innovation/ai-evaluation': '/innovation/ops/ai-hub',
  '/innovation/expert-review': '/innovation/ops/workbench',
  '/innovation/incubation-decision': '/innovation/ops/workbench',
}

function toAuthUser(userOrRole: AuthUser | UserRole, orgKind?: AuthUser['orgKind']): AuthUser {
  if (typeof userOrRole !== 'string') return userOrRole
  return { role: userOrRole, orgKind: orgKind ?? 'physical', displayName: '' }
}

function pathnameAllowed(pathname: string, user: AuthUser): boolean {
  if ((PUBLIC_PATHS as readonly string[]).includes(pathname)) return true
  const legacyTarget = LEGACY_REDIRECT_TARGET[pathname]
  if (legacyTarget && pathnameAllowedForUser(legacyTarget, user)) return true
  return pathnameAllowedForUser(pathname, user)
}

export function isPathAllowed(pathname: string, userOrRole: AuthUser | UserRole, orgKind?: AuthUser['orgKind']): boolean {
  return pathnameAllowed(pathname, toAuthUser(userOrRole, orgKind))
}

/** 侧边栏叶子 path 是否在当前角色权限内 */
export function isLeafPathAllowed(leafTo: string, user: AuthUser): boolean {
  return isMenuLeafAllowed(leafTo, user)
}

/** 侧边栏可用的路径集合（菜单叶子，用于导航过滤） */
export function allowedPathSet(user: AuthUser): Set<string> {
  const leaves = new Set<string>()
  const check = (path: string) => {
    if (isMenuLeafAllowed(path, user)) leaves.add(path)
  }
  check('/console')
  const allMenuPaths = [
    '/innovation/applicant/register',
    '/innovation/ops/workbench',
    '/innovation/ops/pool',
    '/innovation/ops/ai-hub',
    '/innovation/industry-trends',
    '/innovation/outreach',
    '/hatch/workbench',
    '/hatch/archive',
    '/hatch/physical-space',
    '/resops/board',
    '/resops/catalog',
    '/resops/my-applications',
    '/resops/usage-orders',
    '/resops/provider',
    '/resops/mgmt',
    '/resops/listing-apply',
    '/resops/listing-audit',
    '/resops/ai-match',
    '/resops/match-analytics',
    '/eval/portrait',
    '/eval/growth-tracking',
    '/eval/growth-score',
    '/eval/effectiveness',
    '/eval/risk',
    '/eval/advice',
    '/twin/space-analytics',
    '/twin/infrastructure',
    '/twin/infrastructure/parks',
    '/twin/infrastructure/models',
    '/twin/infrastructure/buildings',
    '/twin/infrastructure/spaces',
    '/twin/distribution/projects',
    '/twin/distribution/resources',
    '/eco/virtual-project',
    '/eco/external-partner',
    '/eco/ai-ability',
    '/eco/knowledge-base',
    '/basic/evaluation-forms',
    '/basic/contracts',
    '/basic/experts',
    '/basic/rosters',
    '/basic/dictionaries',
    '/basic/resource-types',
    '/system/users',
    '/system/roles',
    '/system/workflows',
    '/system/audit',
    '/system/settings',
    '/portal/matchmaking',
    '/cockpit',
    '/cockpit/ai-query',
    '/ai-workflow',
    '/data/assets',
    '/data/quality',
  ]
  allMenuPaths.forEach(check)
  return leaves
}

export function resolveBusinessRoleId(user: AuthUser): BusinessRoleId {
  return resolveBusinessRole(user)
}
