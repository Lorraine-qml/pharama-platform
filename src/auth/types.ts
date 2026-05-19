/** PRD：企业权限管理（V1）角色 + 企业形态；外加园区运营方可访问全量后台演示 */
export type UserRole =
  | 'platform'
  | 'enterprise-admin'
  | 'rd'
  | 'finance'
  | 'resource-applicant'
  | 'member'
  | 'collaborator'
  /** 入站评审专家（演示账号，仅限科创策源评审视图） */
  | 'expert'

/** 虚实权限模板：实体 / 虚拟 / 服务商 / 联合孵化 */
export type OrgKind = 'physical' | 'virtual' | 'service-provider' | 'joint'

export type AuthUser = {
  role: UserRole
  orgKind: OrgKind
  displayName: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  platform: '园区运营（全功能）',
  'enterprise-admin': '企业管理员',
  rd: '研发人员',
  finance: '财务人员',
  'resource-applicant': '资源申请人员',
  member: '普通成员',
  collaborator: '外部协作者',
  expert: '入站评审专家',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  platform: '招商、孪生中台、驾驶舱与系统管理等全菜单',
  'enterprise-admin': '成员与权限模板、入驻与资源全链路（企业视角）',
  rd: '设备与专家预约、管线相关档案与成长画像',
  finance: '资源单与报表类数据视图（演示）',
  'resource-applicant': '资源目录、申请与 AI 撮合',
  member: '浏览资源与推荐，无后台配置',
  collaborator: '仅协同可见的撮合与共享入口',
  expert: '科创策源·专家评审待办与在线打分（演示）',
}

export const ORG_LABELS: Record<OrgKind, string> = {
  physical: '实体企业',
  virtual: '虚拟企业',
  'service-provider': '服务商',
  joint: '联合孵化企业',
}
