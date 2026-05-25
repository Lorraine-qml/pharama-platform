import type { AuthUser } from '../../auth/types'
import { canViewAllPoolProjects, isExpertUser, isIncubationPoolUser } from '../../config/businessRoles'
import type { SjProject } from './innovationTypes'

/** 候选项目池：按登录业务角色过滤可见项目 */
export function filterPoolProjectsForUser(projects: SjProject[], user: AuthUser | null): SjProject[] {
  if (!user || canViewAllPoolProjects(user)) return projects
  if (isIncubationPoolUser(user)) return projects.filter((p) => p.applicantOwned)
  if (isExpertUser(user)) {
    return projects.filter((p) =>
      ['pending_expert_assign', 'expert_reviewing', 'review_done', 'pending_decision', 'pending_ai'].includes(p.stage),
    )
  }
  return projects
}

export function canManagePoolProjects(user: AuthUser | null): boolean {
  return Boolean(user && canViewAllPoolProjects(user))
}
