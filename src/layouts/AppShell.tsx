import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom'
import { ToastProvider, useToast } from '../components/ToastProvider'
import { AccountMenu } from '../components/AccountMenu'
import { useAuth } from '../auth/AuthContext'
import { isPathAllowed } from '../auth/routeAccess'
import {
  PLATFORM_OPTIONS,
  accessiblePlatformIds,
  filterNavForPlatform,
  firstAllowedPathInPlatform,
  platformIdForPath,
  platformLabel,
  type PlatformId,
} from '../config/platforms'
import {
  filterNavSections,
  getRouteMeta,
  isNavGroup,
  resolveNavLeaf,
  type NavSection,
} from '../config/navigation'
import { ContractTemplatesProvider } from '../contexts/ContractTemplatesContext'
import { ResourceTypesConfigProvider } from '../contexts/ResourceTypesConfigContext'
import { HatchMgmtProvider } from '../pages/hatch/HatchMgmtContext'
import { ResopsAiMatchProvider } from '../pages/resops/ResopsAiMatchContext'
import { ResopsV1Provider } from '../pages/resops/ResopsV1Context'
import { cn } from '../utils/cn'

/** Arco 风格折叠箭头：收起向右，展开向下 */
function NavChevron({ expanded, className }: { expanded: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className={cn('size-3 shrink-0 text-current transition-transform duration-200 ease-out', expanded ? 'rotate-90' : '', className)}
    >
      <path
        d="M4.25 2.25 8.75 6l-4.5 3.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** 侧栏内可折叠三级分组（NavGroup）的稳定键 */
function navSubGroupCollapsibleKey(sectionKey: string, groupLabel: string) {
  return `${sectionKey}::${groupLabel}`
}

function CollapsedSidebarNav({
  sections,
  activeHit,
  collapsedNavSubGroups,
  onToggleNavSubGroup,
}: {
  sections: NavSection[]
  activeHit: ReturnType<typeof resolveNavLeaf>
  collapsedNavSubGroups: Set<string>
  onToggleNavSubGroup: (sectionKey: string, groupLabel: string) => void
}) {
  const [flyoutKey, setFlyoutKey] = useState<string | null>(null)

  return (
    <ul className="flex flex-col gap-1">
      {sections.map((s) => {
        const open = flyoutKey === s.key
        return (
          <li key={s.key} className="relative flex justify-center">
            <button
              type="button"
              title={s.label}
              aria-expanded={open}
              onClick={() => setFlyoutKey((k) => (k === s.key ? null : s.key))}
              className={cn(
                'flex size-10 items-center justify-center rounded-[var(--radius-card)] text-[18px] transition-colors',
                activeHit?.section.key === s.key
                  ? 'bg-primary-light text-primary ring-1 ring-primary/25'
                  : 'text-[var(--color-nav-item)] hover:bg-[var(--color-nav-sub-active-bg)]/70',
              )}
            >
              <span aria-hidden>{s.icon}</span>
            </button>
            {open ? (
              <div
                className="absolute left-full top-0 z-50 ml-2 min-w-[200px] rounded-[var(--radius-card)] border border-divider bg-surface py-2 shadow-[0_12px_40px_-12px_rgb(31_42_62/0.25)]"
                role="menu"
              >
                <div
                  className={cn(
                    'border-b border-divider px-3 py-2 text-[13px] font-semibold',
                    activeHit?.section.key === s.key ? 'text-primary' : 'text-[var(--color-nav-item)]',
                  )}
                >
                  {s.label}
                </div>
                <ul className="py-1">
                  {s.children.map((item) =>
                    isNavGroup(item) ? (
                      <li key={item.label}>
                        <button
                          type="button"
                          aria-expanded={!collapsedNavSubGroups.has(navSubGroupCollapsibleKey(s.key, item.label))}
                          onClick={() => onToggleNavSubGroup(s.key, item.label)}
                          className={cn(
                            'flex w-full items-center gap-2 border-b border-divider/40 px-3 py-2 text-left text-[12px] font-semibold text-foreground transition-colors hover:bg-muted/30',
                            activeHit?.group?.label === item.label && activeHit.section.key === s.key ? 'text-primary' : '',
                          )}
                        >
                          <NavChevron expanded={!collapsedNavSubGroups.has(navSubGroupCollapsibleKey(s.key, item.label))} />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        </button>
                        {!collapsedNavSubGroups.has(navSubGroupCollapsibleKey(s.key, item.label)) ? (
                          <ul>
                            {item.children.map((leaf) => (
                              <li key={leaf.to}>
                                <NavLink
                                  to={leaf.to}
                                  end={leaf.to === '/' || leaf.to === '/twin/infrastructure'}
                                  onClick={() => setFlyoutKey(null)}
                                  className={cn(
                                    'block px-3 py-2 ps-5 text-[12px] font-normal transition-colors',
                                    activeHit?.leaf.to === leaf.to
                                      ? 'bg-[var(--color-nav-sub-active-bg)] text-primary'
                                      : 'text-[var(--color-nav-item)] hover:bg-[var(--color-nav-sub-active-bg)]/60',
                                  )}
                                >
                                  {leaf.label}
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    ) : (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.to === '/' || item.to === '/twin/infrastructure'}
                          onClick={() => setFlyoutKey(null)}
                          className={cn(
                            'block px-3 py-2 text-[12px] font-normal transition-colors',
                            activeHit?.leaf.to === item.to
                              ? 'bg-[var(--color-nav-sub-active-bg)] text-primary'
                              : 'text-[var(--color-nav-item)] hover:bg-[var(--color-nav-sub-active-bg)]/60',
                          )}
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

const PLATFORM_NAME = '生物医药孵化运营平台'

type NoticeTab = 'todo' | 'system' | 'alert'

export default function AppShell() {
  return (
    <ToastProvider>
      <ContractTemplatesProvider>
        <HatchMgmtProvider>
          <ResourceTypesConfigProvider>
            <ResopsV1Provider>
              <ResopsAiMatchProvider>
                <AppShellInner />
              </ResopsAiMatchProvider>
            </ResopsV1Provider>
          </ResourceTypesConfigProvider>
        </HatchMgmtProvider>
      </ContractTemplatesProvider>
    </ToastProvider>
  )
}

function AppShellInner() {
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [platformMenuOpen, setPlatformMenuOpen] = useState(false)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [noticeTab, setNoticeTab] = useState<NoticeTab>('todo')
  const platformSwitcherRef = useRef<HTMLDivElement>(null)
  const noticeRef = useRef<HTMLDivElement>(null)

  const allFiltered = useMemo(() => (user ? filterNavSections(user.role) : []), [user])
  const activePlatformId = platformIdForPath(location.pathname)
  const sections = useMemo(
    () => filterNavForPlatform(allFiltered, activePlatformId),
    [allFiltered, activePlatformId],
  )
  const meta = useMemo(() => getRouteMeta(location.pathname, sections), [location.pathname, sections])
  const activeHit = useMemo(() => resolveNavLeaf(location.pathname, sections), [location.pathname, sections])

  const accessibleSet = useMemo(
    () => new Set<PlatformId>(user ? accessiblePlatformIds(user.role) : []),
    [user],
  )

  const [collapsedByUser, setCollapsedByUser] = useState<Set<string>>(() => new Set())
  const [collapsedNavSubGroups, setCollapsedNavSubGroups] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (!activeHit?.group) return
    const k = navSubGroupCollapsibleKey(activeHit.section.key, activeHit.group.label)
    setCollapsedNavSubGroups((prev) => {
      if (!prev.has(k)) return prev
      const next = new Set(prev)
      next.delete(k)
      return next
    })
  }, [location.pathname, activeHit?.section.key, activeHit?.group?.label])

  const toggleNavSubGroup = useCallback((sectionKey: string, groupLabel: string) => {
    const k = navSubGroupCollapsibleKey(sectionKey, groupLabel)
    setCollapsedNavSubGroups((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }, [])

  useEffect(() => {
    if (!platformMenuOpen && !noticeOpen) return
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (platformSwitcherRef.current && !platformSwitcherRef.current.contains(t)) setPlatformMenuOpen(false)
      if (noticeRef.current && !noticeRef.current.contains(t)) setNoticeOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [platformMenuOpen, noticeOpen])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isPathAllowed(location.pathname, user.role)) {
    return <Navigate to="/" replace />
  }

  const authUser = user

  function switchPlatform(id: PlatformId) {
    const path = firstAllowedPathInPlatform(authUser.role, id)
    if (!path) {
      toast.show('当前账号无权访问该子平台', 'warning')
      return
    }
    navigate(path)
    setPlatformMenuOpen(false)
  }

  function toggleSection(key: string) {
    setCollapsedByUser((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  /** 含当前页的一级分组可被手动收起；切换路由时默认展开当前分组，避免「激活后永远关不上」 */
  useEffect(() => {
    if (!activeHit) return
    setCollapsedByUser((prev) => {
      if (!prev.has(activeHit.section.key)) return prev
      const next = new Set(prev)
      next.delete(activeHit.section.key)
      return next
    })
  }, [activeHit?.section.key, location.pathname])

  function isSectionOpen(section: NavSection) {
    return !collapsedByUser.has(section.key)
  }

  const asideW = sidebarCollapsed ? 'w-[72px]' : 'w-[248px]'

  const noticeDemo: Record<NoticeTab, { title: string; time: string }[]> = {
    todo: [
      { title: '待审批 · 北海基因实验资源续约申请', time: '今天 09:40' },
      { title: '待跟进 · 线索「瑞康抗体」下周回访', time: '昨天' },
    ],
    system: [
      { title: '系统将于本周日凌晨 02:00 例行维护（演示）', time: '系统消息' },
      { title: '您有一份新的周报摘要生成完毕', time: 'AI中台' },
    ],
    alert: [
      { title: '孪生图层「预警」检测到 2 条设备离线占位', time: '预警 L2' },
      { title: '资源使用率连续 3 日超过阈值（演示）', time: '运营规则' },
    ],
  }

  return (
      <div className="flex min-h-screen bg-page">
        <aside
          className={cn(
            'sticky top-0 flex h-screen shrink-0 flex-col border-r border-divider bg-surface shadow-[var(--shadow-card)] transition-[width] duration-200 ease-out',
            asideW,
          )}
        >
          <div className={cn('border-b border-divider', sidebarCollapsed ? 'px-3 py-4' : 'px-4 py-4')}>
            <div className={cn('flex items-center gap-2', sidebarCollapsed && 'justify-center')}>
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-card)] bg-primary text-[13px] font-bold text-white"
              >
                医
              </span>
              {!sidebarCollapsed ? (
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold leading-snug tracking-tight text-foreground">{PLATFORM_NAME}</div>
                </div>
              ) : null}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
            {sidebarCollapsed ? (
              <CollapsedSidebarNav
                key={`${location.pathname}-${activePlatformId}`}
                sections={sections}
                activeHit={activeHit}
                collapsedNavSubGroups={collapsedNavSubGroups}
                onToggleNavSubGroup={toggleNavSubGroup}
              />
            ) : (
              <ul className="space-y-1">
                {sections.map((s) => {
                  const open = isSectionOpen(s)
                  const sectionActive = activeHit?.section.key === s.key
                  return (
                    <li key={s.key}>
                      <button
                        type="button"
                        onClick={() => toggleSection(s.key)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-[13px] font-semibold transition-colors',
                          sectionActive
                            ? 'text-primary'
                            : 'text-[var(--color-nav-item)] hover:bg-[var(--color-nav-sub-active-bg)]/70',
                        )}
                      >
                        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center text-[16px] leading-none">
                          {s.icon}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{s.label}</span>
                        <NavChevron expanded={open} />
                      </button>
                      {open ? (
                        <ul className="mt-0.5 -mx-2 space-y-px px-2">
                          {s.children.map((item) =>
                            isNavGroup(item) ? (
                              <li key={item.label}>
                                <button
                                  type="button"
                                  aria-expanded={!collapsedNavSubGroups.has(navSubGroupCollapsibleKey(s.key, item.label))}
                                  onClick={() => toggleNavSubGroup(s.key, item.label)}
                                  className={cn(
                                    'flex w-full items-center gap-2 rounded-md py-1.5 ps-8 pe-2 text-left text-[12px] font-semibold text-foreground transition-colors hover:bg-muted/35',
                                    activeHit?.group?.label === item.label && activeHit.section.key === s.key
                                      ? 'text-primary'
                                      : 'text-muted',
                                  )}
                                >
                                  <NavChevron expanded={!collapsedNavSubGroups.has(navSubGroupCollapsibleKey(s.key, item.label))} />
                                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                </button>
                                {!collapsedNavSubGroups.has(navSubGroupCollapsibleKey(s.key, item.label)) ? (
                                  <ul className="space-y-px">
                                    {item.children.map((leaf) => {
                                      const active = activeHit?.leaf.to === leaf.to
                                      return (
                                        <li key={leaf.to}>
                                          <NavLink
                                            to={leaf.to}
                                            end={leaf.to === '/' || leaf.to === '/twin/infrastructure'}
                                            className={cn(
                                              'block rounded-md py-2 ps-12 pe-3 text-[12px] font-normal leading-snug transition-colors',
                                              active
                                                ? 'bg-[var(--color-nav-sub-active-bg)] text-primary'
                                                : 'text-[var(--color-nav-item)] hover:bg-[var(--color-nav-sub-active-bg)]/60',
                                            )}
                                          >
                                            {leaf.label}
                                          </NavLink>
                                        </li>
                                      )
                                    })}
                                  </ul>
                                ) : null}
                              </li>
                            ) : (
                              <li key={item.to}>
                                <NavLink
                                  to={item.to}
                                  end={item.to === '/' || item.to === '/twin/infrastructure'}
                                  className={cn(
                                    'block rounded-md py-2 ps-10 pe-3 text-[12px] font-normal leading-snug transition-colors',
                                    activeHit?.leaf.to === item.to
                                      ? 'bg-[var(--color-nav-sub-active-bg)] text-primary'
                                      : 'text-[var(--color-nav-item)] hover:bg-[var(--color-nav-sub-active-bg)]/60',
                                  )}
                                >
                                  {item.label}
                                </NavLink>
                              </li>
                            ),
                          )}
                        </ul>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </nav>

          <div className="border-t border-divider p-2">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              title={sidebarCollapsed ? '展开菜单' : '收起菜单'}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] py-2 text-[12px] text-muted transition-colors hover:bg-page hover:text-primary"
            >
              <span aria-hidden className="text-[14px]">{sidebarCollapsed ? '»' : '«'}</span>
              {!sidebarCollapsed ? <span>收起侧边栏</span> : null}
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex shrink-0 items-center justify-end gap-4 border-b border-divider bg-surface px-4 py-3 shadow-sm sm:px-6">
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <div className="relative" ref={platformSwitcherRef}>
                <button
                  type="button"
                  aria-expanded={platformMenuOpen}
                  aria-haspopup="listbox"
                  onClick={() => setPlatformMenuOpen((v) => !v)}
                  className={cn(
                    'flex max-w-[min(56vw,260px)] items-center gap-2 rounded-[var(--radius-card)] border border-divider bg-page px-3 py-2 text-[13px] font-semibold text-foreground shadow-sm outline-none transition-[border-color,background-color,box-shadow] hover:border-primary/40 hover:bg-primary-light/40 focus-visible:ring-2 focus-visible:ring-primary/25 sm:max-w-[280px]',
                    platformMenuOpen && 'border-primary/45 bg-primary-light/50 shadow-[0_1px_3px_rgb(30_109_255/0.12)]',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{platformLabel(activePlatformId)}</span>
                  <span aria-hidden className="shrink-0 text-muted" style={{ fontSize: '10px' }}>
                    ▾
                  </span>
                </button>
                {platformMenuOpen ? (
                  <ul
                    role="listbox"
                    className="absolute right-0 top-[calc(100%+6px)] z-50 flex max-w-[min(calc(100vw-2rem),288px)] flex-col items-stretch rounded-[var(--radius-card)] border border-divider bg-surface py-1.5 shadow-[0_12px_40px_-12px_rgb(31_42_62/0.18)] [width:max-content]"
                  >
                    {PLATFORM_OPTIONS.map((p) => {
                      const ok = accessibleSet.has(p.id)
                      const active = p.id === activePlatformId
                      return (
                        <li key={p.id} role="option" aria-selected={active}>
                          <button
                            type="button"
                            disabled={!ok}
                            onClick={() => ok && switchPlatform(p.id)}
                            className={cn(
                              'flex items-center justify-between gap-4 whitespace-nowrap px-3 py-2 text-left text-[13px] transition-colors',
                              active ? 'bg-primary-light font-medium text-primary' : 'text-foreground',
                              ok ? 'cursor-pointer hover:bg-page' : 'cursor-not-allowed opacity-45',
                            )}
                          >
                            {p.label}
                            {!ok ? <span className="shrink-0 text-[11px] text-muted">无权限</span> : null}
                          </button>
                        </li>
                      )
                    })}
                    <li className="border-t border-divider px-3 py-2 text-[11px] leading-snug text-muted">
                      各子平台菜单独立，数据互通
                    </li>
                  </ul>
                ) : null}
              </div>

              <div className="relative" ref={noticeRef}>
                <button
                  type="button"
                  aria-expanded={noticeOpen}
                  onClick={() => setNoticeOpen((v) => !v)}
                  className="relative flex size-10 items-center justify-center rounded-[var(--radius-card)] border border-divider bg-page text-[16px] text-foreground outline-none transition-colors hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/25"
                  title="消息中心"
                >
                  <span aria-hidden>🔔</span>
                  <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-surface" />
                </button>
                {noticeOpen ? (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(100vw-2rem,360px)] overflow-hidden rounded-[var(--radius-card)] border border-divider bg-surface shadow-[0_12px_40px_-12px_rgb(31_42_62/0.2)]">
                    <div className="flex border-b border-divider">
                      {(
                        [
                          ['todo', '待办'],
                          ['system', '系统'],
                          ['alert', '预警'],
                        ] as const
                      ).map(([id, lab]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setNoticeTab(id)}
                          className={cn(
                            'flex-1 px-3 py-3 text-[12px] font-medium transition-colors',
                            noticeTab === id ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-foreground',
                          )}
                        >
                          {lab}
                        </button>
                      ))}
                    </div>
                    <ul className="max-h-[280px] divide-y divide-divider overflow-y-auto py-1">
                      {noticeDemo[noticeTab].map((row, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            className="flex w-full flex-col gap-1 px-4 py-3 text-left text-[13px] transition-colors hover:bg-page"
                            onClick={() => toast.show('查看详情（演示）', 'info')}
                          >
                            <span className="text-foreground">{row.title}</span>
                            <span className="text-[11px] text-muted">{row.time}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                title="帮助文档"
                onClick={() => window.open(`${window.location.origin}/platform-modules`, '_blank', 'noopener,noreferrer')}
                className="flex size-10 items-center justify-center rounded-[var(--radius-card)] border border-divider bg-page text-[18px] outline-none transition-colors hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/25"
              >
                <span aria-hidden>📘</span>
              </button>

              <AccountMenu />
            </div>
          </header>

          <main className="flex-1 px-6 py-6 sm:px-8 sm:py-8">
            <div className="mb-6">
              <nav aria-label="面包屑" className="flex flex-wrap items-center gap-1 text-[13px] text-muted">
                {meta.breadcrumbs.map((crumb, i) => {
                  const last = i === meta.breadcrumbs.length - 1
                  return (
                    <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                      {i > 0 ? <span className="text-divider">/</span> : null}
                      {crumb.to && !last ? (
                        <NavLink to={crumb.to} className="text-muted transition-colors hover:text-primary">
                          {crumb.label}
                        </NavLink>
                      ) : (
                        <span className={last ? 'font-medium text-foreground' : ''}>{crumb.label}</span>
                      )}
                    </span>
                  )
                })}
              </nav>
              <h1 className="mt-3 text-[22px] font-semibold tracking-tight text-foreground">{meta.title}</h1>
            </div>
            <p className="mb-6 rounded-lg border border-primary/20 bg-primary-light/55 px-3 py-2 text-[12px] leading-relaxed text-foreground">
              <span className="font-semibold text-primary">演示说明：</span>
              登录后侧边栏展示全量功能入口，不按角色隐藏；菜单括号内标注生产环境中常见职责划分。各页操作区可能合并多角色视角，实际权限以部署时 RBAC 为准。
            </p>
            <Outlet />
          </main>
        </div>
      </div>
  )
}
