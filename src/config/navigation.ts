import type { UserRole } from '../auth/types'
import { allowedPathSet } from '../auth/routeAccess'

export type NavLeaf = { to: string; label: string }

/** 二级菜单下的分组标题 + 三级叶子（例如「空间基础管理」下挂多个独立页面） */
export type NavGroup = { label: string; children: NavLeaf[] }

export type NavChild = NavLeaf | NavGroup

export function isNavGroup(c: NavChild): c is NavGroup {
  return 'children' in c && Array.isArray((c as NavGroup).children)
}

/** 将分组展平为叶子路径列表（角色权限树、统计等） */
export function flattenSectionChildren(children: NavChild[]): NavLeaf[] {
  const out: NavLeaf[] = []
  for (const item of children) {
    if (isNavGroup(item)) out.push(...item.children)
    else out.push(item)
  }
  return out
}

export type NavSection = {
  key: string
  label: string
  icon: string
  children: NavChild[]
}

/** 侧边栏二级菜单；部分分组含三级子菜单（NavGroup） */
export const NAV_SECTIONS: NavSection[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: '📊',
    children: [{ to: '/', label: '工作台' }],
  },
  {
    key: 'sci-source',
    label: '科创策源',
    icon: '💡',
    children: [],
  },
  {
    key: 'hatch-mgmt',
    label: '入孵管理',
    icon: '🏛️',
    children: [
      { to: '/hatch/signing', label: '入孵签约管理' },
      { to: '/hatch/archive', label: '入孵项目档案' },
      { to: '/hatch/physical-space', label: '实体空间入孵管理' },
      { to: '/hatch/changes', label: '项目变更管理' },
    ],
  },
  {
    key: 'resource-ops',
    label: '资源运营',
    icon: '🧪',
    children: [],
  },
  {
    key: 'evaluation',
    label: '孵化评估',
    icon: '📈',
    children: [],
  },
  {
    key: 'dt-space',
    label: '数字孪生空间',
    icon: '🗺️',
    children: [
      { to: '/twin/space-analytics', label: '空间运营分析' },
      {
        label: '空间基础管理',
        children: [
          { to: '/twin/infrastructure', label: '空间总览' },
          { to: '/twin/infrastructure/parks', label: '园区管理' },
          { to: '/twin/infrastructure/models', label: '模型管理' },
          { to: '/twin/infrastructure/buildings', label: '单体管理' },
          { to: '/twin/infrastructure/spaces', label: '空间管理' },
        ],
      },
      {
        label: '空间分布',
        children: [
          { to: '/twin/distribution/projects', label: '项目空间分布' },
          { to: '/twin/distribution/resources', label: '资源空间分布' },
        ],
      },
      {
        label: '空间运营',
        children: [{ to: '/hatch/physical-space', label: '实体空间运营' }],
      },
      {
        label: '生态协同',
        children: [
          { to: '/eco/virtual-project', label: '虚拟项目' },
          { to: '/eco/external-partner', label: '外部合作' },
          { to: '/eco/ai-ability', label: 'AI 能力' },
          { to: '/eco/knowledge-base', label: '知识库' },
        ],
      },
    ],
  },
  {
    key: 'basic-data',
    label: '基础数据',
    icon: '🗂️',
    children: [
      { to: '/basic/evaluation-forms', label: '评价表管理' },
      { to: '/basic/contracts', label: '合同模板管理' },
      { to: '/basic/experts', label: '专家库管理' },
      { to: '/basic/rosters', label: '名单管理' },
      { to: '/basic/dictionaries', label: '字典标签管理' },
      { to: '/basic/resource-types', label: '资源类型配置' },
    ],
  },
  {
    key: 'system-mgmt',
    label: '系统管理',
    icon: '🛠️',
    children: [
      { to: '/system/users', label: '用户管理' },
      { to: '/system/roles', label: '角色权限管理' },
      { to: '/system/workflows', label: '流程配置' },
      { to: '/system/audit', label: '日志审计' },
      { to: '/system/settings', label: '系统参数' },
    ],
  },
  {
    key: 'portal-extra',
    label: '撮合服务',
    icon: '🔗',
    children: [{ to: '/portal/matchmaking', label: 'AI 供需撮合' }],
  },
  {
    key: 'ai',
    label: 'AI 能力中台',
    icon: '🤖',
    children: [{ to: '/ai-workflow', label: '智能体流程编排' }],
  },
  {
    key: 'cockpit',
    label: '运营驾驶舱',
    icon: '🛰️',
    children: [
      { to: '/cockpit', label: '看板总览' },
      { to: '/cockpit/ai-query', label: 'AI 问数' },
    ],
  },
  {
    key: 'data-assets',
    label: '数据资产',
    icon: '📂',
    children: [{ to: '/data/assets', label: '资产目录' }],
  },
  {
    key: 'data-quality',
    label: '数据治理',
    icon: '✓',
    children: [{ to: '/data/quality', label: '质量规则' }],
  },
]

/** 科创策源：演示合并全部入口（括号标注原职责角色，生产环境将按 RBAC 拆分） */
export function sciSourceNavLeaves(_role: UserRole): NavLeaf[] {
  void _role
  return [
    { to: '/innovation/ops/workbench', label: '任务中心（园区运营）' },
    { to: '/innovation/ops/pool', label: '候选项目池（园区运营）' },
    { to: '/innovation/ops/ai-hub', label: 'AI 智能评估（园区运营）' },
    { to: '/innovation/ops/expert-mgmt', label: '专家评审管理（园区运营）' },
    { to: '/innovation/ops/decision-hub', label: '入孵决策管理（园区运营）' },
    { to: '/innovation/applicant/projects', label: '我的项目（申报方）' },
    { to: '/innovation/applicant/register', label: '新建项目（申报方）' },
    { to: '/innovation/expert/tasks', label: '我的评审任务（专家）' },
    { to: '/innovation/industry-trends', label: '行业趋势分析（V2 预留）' },
    { to: '/innovation/outreach', label: '招商触达辅助（V2 预留）' },
  ]
}

/** 资源运营：演示合并全部入口 */
export function resOpsNavLeaves(_role: UserRole): NavLeaf[] {
  void _role
  return [
    { to: '/resops/catalog', label: '资源目录' },
    { to: '/resops/my-applications', label: '我的申请（项目方）' },
    { to: '/resops/usage-orders', label: '资源使用单' },
    { to: '/resops/provider', label: '提供方工作台' },
    { to: '/resops/board', label: '资源看板 V2（园区运营）' },
    { to: '/resops/ai-match', label: 'AI 供需撮合 V2（项目方）' },
    { to: '/resops/match-analytics', label: '撮合效果跟踪 V2（园区运营）' },
    { to: '/resops/mgmt', label: '资源管理 V2（园区运营）' },
  ]
}

/** 孵化评估：仅园区运营 / 企业管理员 */
export function evalNavLeaves(role: UserRole): NavLeaf[] {
  if (role !== 'platform' && role !== 'enterprise-admin') return []
  return [
    { to: '/eval/portrait', label: 'AI 项目画像' },
    { to: '/eval/growth-tracking', label: '项目成长跟踪' },
    { to: '/eval/growth-score', label: 'AI 项目成长评分' },
    { to: '/eval/effectiveness', label: 'AI 孵化成效评价' },
    { to: '/eval/risk', label: '风险预警' },
    { to: '/eval/advice', label: 'AI 孵化建议生成' },
  ]
}

function filterNavChild(c: NavChild, allowed: Set<string>): NavChild | null {
  if (isNavGroup(c)) {
    const inner = c.children.filter((leaf) => allowed.has(leaf.to))
    return inner.length ? { ...c, children: inner } : null
  }
  return allowed.has(c.to) ? c : null
}

export function filterNavSections(role: UserRole): NavSection[] {
  const allowed = allowedPathSet(role)
  return NAV_SECTIONS.map((s) => {
    const raw: NavChild[] =
      s.key === 'sci-source'
        ? sciSourceNavLeaves(role)
        : s.key === 'resource-ops'
          ? resOpsNavLeaves(role)
          : s.key === 'evaluation'
            ? evalNavLeaves(role)
            : s.children
    const children = raw.map((c) => filterNavChild(c, allowed)).filter((c): c is NavChild => c != null)
    return { ...s, children }
  }).filter((s) => s.children.length > 0)
}

/** 取过滤后侧边栏中第一个可点击叶子（用于子平台默认落地页） */
export function firstLeafInSections(sections: NavSection[]): NavLeaf | undefined {
  for (const s of sections) {
    for (const item of s.children) {
      if (isNavGroup(item)) {
        const f = item.children[0]
        if (f) return f
      } else {
        return item
      }
    }
  }
  return undefined
}

export type NavResolveHit = { section: NavSection; leaf: NavLeaf; group?: NavGroup }

function navLeafMatchScore(pathname: string, leaf: NavLeaf): number | null {
  const exact = pathname === leaf.to
  const nested = leaf.to !== '/' && pathname.startsWith(`${leaf.to}/`)
  if (!exact && !nested) return null
  return leaf.to.length * 100 + (exact ? 50 : 0)
}

/** 最长前缀匹配当前路由对应的菜单叶子（用于高亮与面包屑） */
export function resolveNavLeaf(pathname: string, sections: NavSection[]): NavResolveHit | null {
  let best: (NavResolveHit & { tie: number }) | null = null
  for (const section of sections) {
    for (const item of section.children) {
      if (isNavGroup(item)) {
        for (const leaf of item.children) {
          const tie = navLeafMatchScore(pathname, leaf)
          if (tie == null) continue
          if (!best || tie > best.tie) best = { section, leaf, group: item, tie }
        }
      } else {
        const tie = navLeafMatchScore(pathname, item)
        if (tie == null) continue
        if (!best || tie > best.tie) best = { section, leaf: item, tie }
      }
    }
  }
  if (!best) return null
  const { tie: _t, ...rest } = best
  void _t
  return rest
}

export function getRouteMeta(pathname: string, sections: NavSection[]) {
  const hit = resolveNavLeaf(pathname, sections)
  if (!hit) {
    return {
      breadcrumbs: [{ label: '首页', to: '/' }] as { label: string; to?: string }[],
      title: '页面',
    }
  }
  const breadcrumbs: { label: string; to?: string }[] = [
    { label: '首页', to: '/' },
    { label: hit.section.label },
    ...(hit.group ? [{ label: hit.group.label }] : []),
    { label: hit.leaf.label },
  ]
  return { breadcrumbs, title: hit.leaf.label }
}
