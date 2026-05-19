import type { UserRole } from '../../auth/types'
import type { KnowledgeBaseKind } from './ecoTypes'

const isAdmin = (role: UserRole) => role === 'platform' || role === 'enterprise-admin'

const isProjectParty = (role: UserRole) =>
  role === 'rd' || role === 'finance' || role === 'resource-applicant' || role === 'member' || role === 'collaborator'

/** 虚拟项目：专家无权限；超管/企业运营可写；项目方只读 */
export function ecoVirtualAccess(role: UserRole) {
  if (role === 'expert') return { canView: false, canWrite: false }
  if (isAdmin(role)) return { canView: true, canWrite: true }
  if (isProjectParty(role)) return { canView: true, canWrite: false }
  return { canView: true, canWrite: false }
}

/** 外部合作：与虚拟项目相同矩阵 */
export function ecoPartnerAccess(role: UserRole) {
  return ecoVirtualAccess(role)
}

export function ecoAiAccess(_role: UserRole) {
  return { canView: true }
}

/** 专家仅见公共库；其余角色见全部（列表再按 canManage 控制按钮） */
export function ecoKbVisibleKinds(role: UserRole): KnowledgeBaseKind[] | null {
  if (role === 'expert') return ['公共']
  return null
}

/** 新建/编辑/删除知识库、文档删除等 */
export function ecoKbCanManage(role: UserRole) {
  return isAdmin(role)
}
