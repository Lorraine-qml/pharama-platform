import type { OrgKind, UserRole } from '../auth/types'

/** 全平台演示统一口令，便于讲解员记忆 */
export const DEMO_PASSWORD = 'PharmaDemo@2026'

const orgSlug: Record<OrgKind, string> = {
  physical: 'physical',
  virtual: 'virtual',
  'service-provider': 'svc',
  joint: 'joint',
}

const roleSlug: Record<UserRole, string> = {
  platform: 'ops',
  'enterprise-admin': 'admin',
  rd: 'rd',
  finance: 'finance',
  'resource-applicant': 'resapp',
  member: 'member',
  collaborator: 'ext',
  expert: 'expert',
}

/** 与左侧「企业形态 + 角色」一一对应的演示账号（共 28 组），口令均为 {@link DEMO_PASSWORD} */
export function credentialFor(
  orgKind: OrgKind,
  role: UserRole,
): { username: string; password: string; orgKind: OrgKind; role: UserRole } {
  return {
    username: `${orgSlug[orgKind]}_${roleSlug[role]}`,
    password: DEMO_PASSWORD,
    orgKind,
    role,
  }
}
