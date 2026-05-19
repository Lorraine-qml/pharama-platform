import type { UserRole } from './types'

const MODULE_PATHS = [
  '/innovation/ops/workbench',
  '/innovation/ops/pool',
  '/innovation/ops/ai-hub',
  '/innovation/ops/expert-mgmt',
  '/innovation/ops/decision-hub',
  '/innovation/ops/projects',
  '/innovation/ops/review',
  '/innovation/ops/ai',
  '/innovation/ops/assign',
  '/innovation/ops/decision',
  '/innovation/applicant/projects',
  '/innovation/applicant/register',
  '/innovation/project',
  '/innovation/expert/tasks',
  '/innovation/expert/review',
  '/innovation/industry-trends',
  '/innovation/outreach',
  /** 旧科创策源 URL，路由层跳转至新工作台 */
  '/innovation/project-registration',
  '/innovation/project-materials',
  '/innovation/ai-evaluation',
  '/innovation/expert-review',
  '/innovation/incubation-decision',
  '/hatch/signing',
  '/hatch/archive',
  '/hatch/identity',
  '/hatch/physical-space',
  '/hatch/changes',
  '/hatch/exit',
  '/hatch/ai-permissions',
  '/resops/board',
  '/resops/ai-match',
  '/resops/match-analytics',
  '/resops/mgmt',
  '/resops/catalog',
  '/resops/resource',
  '/resops/my-applications',
  '/resops/usage-orders',
  '/resops/provider',
  '/eval/portrait',
  '/eval/growth-tracking',
  '/eval/growth-score',
  '/eval/effectiveness',
  '/eval/risk',
  '/eval/advice',
  '/twin/infrastructure',
  '/twin/infrastructure/parks',
  '/twin/infrastructure/models',
  '/twin/infrastructure/buildings',
  '/twin/infrastructure/spaces',
  '/twin/distribution/projects',
  '/twin/distribution/resources',
  '/twin/space-analytics',
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
] as const

/** 兼容旧书签的入口，在路由层重定向到新模块路径 */
const LEGACY_PATHS = [
  '/leads',
  '/leads/assessment',
  '/onboarding/space',
  '/onboarding/profile',
  '/resources/demo',
  '/growth',
  '/digital-twin',
  '/twin/park-model',
  '/twin/spaces',
  '/twin/project-map',
  '/twin/resource-map',
  '/twin/virtual-layer',
  '/twin/analytics',
  '/admin/roles',
  '/system/overview',
  '/system/orgs',
  '/system/notices',
] as const

const PLATFORM_PATHS = [
  '/',
  '/portal/matchmaking',
  '/ai-workflow',
  '/cockpit',
  '/cockpit/ai-query',
  '/data/assets',
  '/data/quality',
  '/system/users',
  '/system/roles',
  '/system/workflows',
  '/system/audit',
  '/system/settings',
] as const

const ALL_PATHS = [...PLATFORM_PATHS, ...MODULE_PATHS, ...LEGACY_PATHS] as const

/** 旧 URL → 重定向目标（用于权限推导：允许旧路径当且仅当用户有权访问新路径） */
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
}

/** 精确路径或以前缀匹配的父路径（pathname 等于 p 或以 p/ 开头） */
function pathMatches(prefix: string, pathname: string): boolean {
  return pathname === prefix || (prefix !== '/' && pathname.startsWith(`${prefix}/`))
}

/**
 * 演示策略：任意登录账号均可访问已注册路由（不按角色裁剪）。
 * 生产环境应恢复为按角色 RBAC 校验。
 */
function pathKnownToApp(pathname: string): boolean {
  if (pathname === '/innovation' || pathname === '/hatch' || pathname === '/resops' || pathname === '/basic' || pathname === '/eco' || pathname.startsWith('/eco/')) return true
  if (ALL_PATHS.some((p) => pathMatches(p, pathname))) return true
  const mapped = LEGACY_REDIRECT_TARGET[pathname]
  return mapped ? ALL_PATHS.some((p) => pathMatches(p, mapped)) : false
}

function isEvalRestrictedPath(pathname: string): boolean {
  if (pathname === '/eval' || pathname.startsWith('/eval/')) return true
  const legacy = LEGACY_REDIRECT_TARGET[pathname]
  return legacy === '/eval' || (typeof legacy === 'string' && legacy.startsWith('/eval/'))
}

export function isPathAllowed(pathname: string, role: UserRole): boolean {
  if (isEvalRestrictedPath(pathname) && role !== 'platform' && role !== 'enterprise-admin') return false
  if (pathname === '/twin/space-analytics' || pathname.startsWith('/twin/space-analytics/')) {
    if (role !== 'platform' && role !== 'enterprise-admin') return false
  }
  return pathKnownToApp(pathname)
}

/** 侧边栏可用的路径集合（含 /） */
export function allowedPathSet(role: UserRole): Set<string> {
  const base = new Set<string>(ALL_PATHS)
  if (role !== 'platform' && role !== 'enterprise-admin') {
    base.delete('/twin/space-analytics')
    for (const p of MODULE_PATHS) {
      if (p.startsWith('/eval/')) base.delete(p)
    }
    base.delete('/growth')
  }
  return base
}
