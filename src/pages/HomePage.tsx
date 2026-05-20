import { Link } from 'react-router-dom'
import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { isPathAllowed } from '../auth/routeAccess'
import type { AuthUser } from '../auth/types'
import { ORG_LABELS, ROLE_LABELS } from '../auth/types'
import { Modal } from '../components/Modal'
import { useToast } from '../components/ToastProvider'
import { cn } from '../utils/cn'

type Metrics = {
  incubatingProjects: number
  resourceUsagePct: number
  aiCallsK: number
  todoTotal: number
}

const FUNNEL_STAGES = [
  { label: '线索', value: 1200 },
  { label: '注册', value: 420 },
  { label: 'AI评估', value: 280 },
  { label: '专家评审', value: 96 },
  { label: '入孵', value: 34 },
]

const TREND_POINTS = [42, 48, 45, 52, 58, 61, 67]

function workbenchUserName(user: AuthUser): string {
  if (user.role === 'platform') return '张运营'
  if (user.role === 'expert') return '张教授'
  if (user.role === 'enterprise-admin') return '李企服'
  const org = ORG_LABELS[user.orgKind]
  return org.length >= 2 ? `${org.slice(0, 2)}专员` : '运营专员'
}

/** 统一的卡片外壳：左侧科技蓝强调条 + 标题区底部分隔 */
function CardShell({
  title,
  icon,
  badge,
  children,
  className,
  id,
  bodyClassName,
}: {
  title: string
  icon: string
  badge?: string
  children: ReactNode
  className?: string
  id?: string
  bodyClassName?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        'relative flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-panel)] border border-divider/80 bg-surface shadow-[0_6px_28px_-8px_rgba(31,42,62,0.14)]',
        'before:pointer-events-none before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-full before:bg-primary',
        className,
      )}
    >
      <header className="shrink-0 border-b border-divider/60 bg-gradient-to-r from-primary-light/35 via-surface to-surface px-5 pb-3 pt-4 ps-[18px]">
        <div className="flex flex-wrap items-center gap-2">
          <span aria-hidden className="text-[17px] drop-shadow-sm">
            {icon}
          </span>
          <h2 className="text-[16px] font-bold tracking-tight text-foreground">{title}</h2>
          {badge ? (
            <span className="rounded-[var(--radius-button)] bg-primary px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              {badge}
            </span>
          ) : null}
        </div>
      </header>
      <div className={cn('flex min-h-0 flex-1 flex-col px-5 py-4 ps-[18px]', bodyClassName)}>{children}</div>
    </section>
  )
}

function MiniLineChart({ points }: { points: number[] }) {
  const gid = useId().replace(/:/g, '')
  const w = 320
  const h = 88
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = Math.max(max - min, 1)
  const pad = 8
  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2)
    const y = pad + (1 - (p - min) / span) * (h - pad * 2)
    return `${x},${y}`
  })
  const polyline = coords.join(' ')
  const area = `0,${h} ${polyline} ${w},${h}`
  const gradId = `chartFill-${gid}`

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible text-primary" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(30 109 255)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="rgb(30 109 255)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#${gradId})`} points={area} />
      <polyline fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={polyline} />
    </svg>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const toast = useToast()
  const [metrics, setMetrics] = useState<Metrics>(() => ({
    incubatingProjects: 128,
    resourceUsagePct: 68,
    aiCallsK: 12.3,
    todoTotal: 8,
  }))
  const [lastAutoRefresh, setLastAutoRefresh] = useState(() => new Date())
  const [nlOpen, setNlOpen] = useState(false)
  const [nlQ, setNlQ] = useState('上个月哪个赛道项目最多？')

  const refreshSilent = useCallback(() => {
    setMetrics((m) => ({
      incubatingProjects: m.incubatingProjects + (Math.random() > 0.85 ? 1 : 0),
      resourceUsagePct: Math.min(95, Math.max(52, Math.round(m.resourceUsagePct + (Math.random() * 4 - 2)))),
      aiCallsK: Number((m.aiCallsK + (Math.random() * 0.2 - 0.05)).toFixed(1)),
      todoTotal: Math.max(4, Math.min(20, m.todoTotal + (Math.random() > 0.6 ? -1 : 0))),
    }))
    setLastAutoRefresh(new Date())
  }, [])

  const refreshManual = useCallback(() => {
    refreshSilent()
    toast.show('工作台数据已刷新', 'success')
  }, [refreshSilent, toast])

  useEffect(() => {
    const id = window.setInterval(refreshSilent, 5 * 60 * 1000)
    return () => window.clearInterval(id)
  }, [refreshSilent])

  const greeting = user ? workbenchUserName(user) : ''
  const dateLine = useMemo(
    () =>
      new Intl.DateTimeFormat('zh-CN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date()),
    [],
  )

  const can = (path: string) => user && isPathAllowed(path, user.role)

  if (!user) return null

  const kpiItems: {
    title: string
    value: string
    sub?: string
    to?: string
    onClickAI?: () => void
    highlight?: boolean
  }[] = [
    {
      title: '入孵项目',
      value: String(metrics.incubatingProjects),
      sub: '含实体 + 虚拟',
      to: can('/innovation/ops/workbench') ? '/innovation/ops/workbench' : can('/innovation/ops/pool') ? '/innovation/ops/pool' : undefined,
    },
    {
      title: '资源使用率',
      value: `${metrics.resourceUsagePct}%`,
      sub: '空间 · 设备 · 专家均值',
      to: can('/cockpit') ? '/cockpit' : can('/resops/catalog') ? '/resops/catalog' : undefined,
      onClickAI: () =>
        toast.show('「AI 解读」将分析资源使用率波动原因与腾挪建议（Skill: 资源洞察，演示占位）', 'info'),
      highlight: true,
    },
    {
      title: 'AI 调用次数',
      value: `${metrics.aiCallsK}k`,
      sub: '本月累计',
      to: can('/cockpit/ai-query') ? '/cockpit/ai-query' : undefined,
    },
    {
      title: '待办任务',
      value: String(metrics.todoTotal),
      sub: '各模块聚合',
      to: '#workbench-todo',
    },
  ]

  const todos = [
    { t: '科创策源任务（资料 / AI / 决策）', n: 3, to: '/innovation/ops/workbench', act: '去处理' },
    { t: '待确认资源申请', n: 2, to: '/resops/provider', act: '去处理' },
    {
      t: '待专家评审',
      n: 2,
      to: '/innovation/ops/workbench',
      act: '去评审',
    },
    { t: '合同到期提醒', n: 1, to: '/hatch/workbench', act: '去续约' },
  ]

  const innovEntry = can('/innovation/ops/workbench') ? '/innovation/ops/workbench' : '/innovation/ops/pool'

  const quickEntries: { label: string; to: string; skill?: string }[] = [
    {
      label: '策源工作台',
      to: innovEntry,
      skill: 'project_pre_score',
    },
    { label: '资源发布', to: '/resops/mgmt' },
    { label: '入孵签约', to: '/hatch/workbench' },
    {
      label: '专家评审',
      to: '/innovation/ops/workbench',
      skill: 'AI 推荐',
    },
    { label: '数据看板', to: '/cockpit' },
  ]

  function runAiSkill(name: string, action: () => void) {
    if (!window.confirm(`将调用「${name}」，可能占用项目套餐额度。是否继续？（演示）`)) return
    action()
  }

  const kpiWrap =
    'group relative overflow-hidden rounded-[var(--radius-panel)] border border-divider/70 bg-gradient-to-br from-surface via-surface to-primary-light/25 p-4 shadow-[0_8px_28px_-10px_rgba(30,109,255,0.35)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-12px_rgba(30,109,255,0.4)]'

  return (
    <div className="space-y-6">
      {/* 欢迎 — 更强层级 */}
      <div className="relative overflow-hidden rounded-[var(--radius-panel)] border border-primary/15 bg-gradient-to-r from-primary-light/50 via-surface to-surface px-5 py-5 shadow-[0_8px_32px_-14px_rgba(30,109,255,0.35)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/[0.07] blur-2xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[17px] font-bold tracking-tight text-foreground">
              欢迎回来，{greeting}
              <span className="font-semibold text-primary">！</span>
            </p>
            <p className="mt-2 text-[13px] text-muted">
              <span className="font-medium text-foreground">今日</span> · {dateLine}
            </p>
            <p className="mt-1.5 text-[12px] text-muted">
              空气质量 <span className="font-semibold text-success">优</span>
              <span className="mx-2 text-divider">|</span>
              角色 <span className="font-semibold text-foreground">{ROLE_LABELS[user.role]}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-[var(--radius-button)] bg-surface/90 px-3 py-1.5 text-[11px] text-muted shadow-sm ring-1 ring-divider/60">
              上次刷新 {lastAutoRefresh.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              type="button"
              onClick={refreshManual}
              className="rounded-[var(--radius-button)] bg-primary px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_6px_20px_-6px_rgba(30,109,255,0.65)] transition-[transform,background-color] hover:bg-primary-hover active:scale-[0.98]"
            >
              手动刷新
            </button>
          </div>
        </div>
      </div>

      {/* KPI — 左侧色条 + 悬停上浮 */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiItems.map((k, idx) => {
          const inner = (
            <>
              <span className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-primary opacity-90" />
              <div className="relative ps-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">{k.title}</p>
                  {k.highlight ? (
                    <span className="shrink-0 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning">
                      AI
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-primary/40">0{idx + 1}</span>
                  )}
                </div>
                <p className="mt-2 text-[28px] font-black tabular-nums tracking-tight text-foreground">{k.value}</p>
                {k.sub ? <p className="mt-1 text-[11px] font-medium text-muted">{k.sub}</p> : null}
                {k.title === '资源使用率' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      k.onClickAI?.()
                    }}
                    className="relative z-10 mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    ✨ AI 解读
                  </button>
                ) : null}
              </div>
            </>
          )

          if (k.to?.startsWith('#')) {
            return (
              <a key={k.title} href={k.to} className={cn(kpiWrap, 'block cursor-pointer')}>
                {inner}
              </a>
            )
          }
          if (k.to && can(k.to)) {
            return (
              <Link key={k.title} to={k.to} className={cn(kpiWrap, 'block')}>
                {inner}
              </Link>
            )
          }
          return (
            <div key={k.title} className={kpiWrap}>
              {inner}
            </div>
          )
        })}
      </div>

      {/* 待办 | 快捷入口 — 等高并排 */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <CardShell id="workbench-todo" title="待办任务" icon="📋" badge={`${metrics.todoTotal} 项`} className="min-h-[340px] lg:h-full">
          <ul className="flex flex-1 flex-col justify-between gap-0">
            {todos.map((row, i) => (
              <li
                key={row.t}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-card)] px-3 py-3 transition-colors',
                  i % 2 === 0 ? 'bg-page/80' : 'bg-transparent',
                  'hover:bg-primary-light/40',
                )}
              >
                <span className="text-[13px] font-medium text-foreground">
                  <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {row.n}
                  </span>
                  {row.t}
                </span>
                {can(row.to) ? (
                  <Link
                    to={row.to}
                    className="shrink-0 rounded-[var(--radius-button)] bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-primary-hover"
                  >
                    {row.act}
                  </Link>
                ) : (
                  <span className="text-[11px] font-medium text-muted">无权限</span>
                )}
              </li>
            ))}
          </ul>
        </CardShell>

        <CardShell title="快捷入口" icon="🚀" badge="高频" className="min-h-[340px] lg:h-full">
          <div className="flex flex-1 flex-col justify-between gap-2">
            {quickEntries.map((q) => {
              const ok = can(q.to)
              const rowClass =
                'flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-divider/70 bg-gradient-to-r from-page to-surface px-4 py-3.5 text-[14px] font-bold text-foreground shadow-sm transition-[border-color,box-shadow,transform] hover:border-primary/45 hover:shadow-md hover:-translate-y-px'
              if (!ok) {
                return (
                  <div key={q.label} className={cn(rowClass, 'cursor-not-allowed opacity-45')}>
                    {q.label}
                    <span className="text-[11px] font-medium text-muted">无权限</span>
                  </div>
                )
              }
              return (
                <Link key={q.label} to={q.to} className={rowClass}>
                  <span>{q.label}</span>
                  <span className="flex items-center gap-2">
                    {q.skill ? (
                      <span className="rounded bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {q.skill}
                      </span>
                    ) : null}
                    <span aria-hidden className="text-primary">
                      →
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
          <p className="mt-4 border-t border-divider/60 pt-3 text-[11px] leading-relaxed text-muted">
            AI Skill 需在「AI 能力中台」授权；入口按角色权限自动显示。
          </p>
        </CardShell>
      </div>

      {/* 关键趋势 — 固定最小高度区块 */}
      <CardShell title="关键趋势" icon="📈" className="min-h-[420px]" bodyClassName="flex-1">
        <div className="flex flex-1 flex-col gap-8">
          <div className="rounded-[var(--radius-card)] border border-divider/50 bg-page/40 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[14px] font-bold text-foreground">项目漏斗转化率</span>
              <button
                type="button"
                onClick={() =>
                  toast.show(
                    'AI 分析：瓶颈集中在「专家评审→入孵」，建议缩短 SLA、启用批量预审（演示）',
                    'info',
                  )
                }
                className="rounded-[var(--radius-button)] bg-warning/90 px-3 py-1.5 text-[12px] font-bold text-white shadow-sm hover:bg-warning"
              >
                ✨ AI 分析
              </button>
            </div>
            <div className="space-y-2.5">
              {FUNNEL_STAGES.map((s, i) => {
                const max = FUNNEL_STAGES[0]!.value
                const pct = Math.round((s.value / max) * 100)
                const next = FUNNEL_STAGES[i + 1]
                const rate = next ? Math.round((next.value / s.value) * 100) : null
                return (
                  <div key={s.label}>
                    <div className="mb-1 flex justify-between text-[11px] font-medium text-muted">
                      <span>{s.label}</span>
                      <span className="tabular-nums text-foreground">
                        {s.value}
                        {rate != null ? ` → ${rate}%` : ''}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-surface ring-1 ring-divider/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-[#4d93ff]"
                        style={{ width: `${pct}%`, opacity: 0.55 + i * 0.09 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-auto min-h-[140px] rounded-[var(--radius-card)] border border-divider/50 bg-gradient-to-b from-primary-light/30 to-surface p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[14px] font-bold text-foreground">本周资源使用趋势</span>
              <span className="rounded-[var(--radius-button)] bg-surface px-2 py-1 text-[11px] font-semibold text-muted ring-1 ring-divider">
                近 7 天
              </span>
            </div>
            <MiniLineChart points={TREND_POINTS} />
          </div>
        </div>
      </CardShell>

      {/* AI 快捷助手 — 全宽大色块头 */}
      <section className="overflow-hidden rounded-[var(--radius-panel)] border border-primary/25 shadow-[0_12px_40px_-16px_rgba(30,109,255,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-primary via-[#256bff] to-primary-hover px-5 py-4">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-xl">
              ⚡
            </span>
            <h2 className="text-[17px] font-bold tracking-tight text-white">AI 快捷助手</h2>
          </div>
          <p className="text-[11px] font-medium text-white/85">
            weekly_report_gen · data_query · risk_detector · incubation_advisor
          </p>
        </div>
        <div className="grid gap-3 bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() =>
              runAiSkill('weekly_report_gen · 生成周报', () =>
                toast.show('周报已生成（演示），可预览后下载或邮件发送', 'success'),
              )
            }
            className="rounded-[var(--radius-card)] bg-primary py-3.5 text-center text-[13px] font-bold text-white shadow-[0_8px_24px_-10px_rgba(30,109,255,0.7)] transition-[transform,background-color] hover:bg-primary-hover active:scale-[0.99]"
          >
            ✨ 生成周报
          </button>
          <button
            type="button"
            onClick={() => setNlOpen(true)}
            className="rounded-[var(--radius-card)] border-2 border-primary bg-primary-light py-3.5 text-center text-[13px] font-bold text-primary transition-colors hover:bg-primary-light/70"
          >
            ✨ 智能问答
          </button>
          <button
            type="button"
            onClick={() =>
              runAiSkill('risk_detector · 风险扫描', () =>
                toast.show('全平台风险扫描完成：3 条需关注（演示）', 'warning'),
              )
            }
            className="rounded-[var(--radius-card)] border border-divider bg-page py-3.5 text-center text-[13px] font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-primary-light/30"
          >
            ✨ 风险扫描
          </button>
          <button
            type="button"
            onClick={() =>
              runAiSkill('incubation_advisor · 资源推荐', () =>
                toast.show('已基于您的角色生成 2 条处理建议（演示）', 'info'),
              )
            }
            className="rounded-[var(--radius-card)] border border-divider bg-page py-3.5 text-center text-[13px] font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-primary-light/30"
          >
            ✨ 资源推荐
          </button>
        </div>
      </section>

      <Modal
        open={nlOpen}
        title="智能问答 · data_query"
        onClose={() => setNlOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="rounded-[var(--radius-button)] border border-divider px-4 py-2 text-[13px]"
              onClick={() => setNlOpen(false)}
            >
              取消
            </button>
            <button
              type="button"
              className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-hover"
              onClick={() => {
                if (!nlQ.trim()) return
                runAiSkill('data_query · 智能问答', () => {
                  toast.show(
                    `（演示）已对「${nlQ.slice(0, 40)}${nlQ.length > 40 ? '…' : ''}」生成答复草案`,
                    'success',
                  )
                  setNlOpen(false)
                })
              }}
            >
              提问
            </button>
          </>
        }
      >
        <p className="mb-2 text-[13px] text-muted">用自然语言询问平台运营数据（演示）。</p>
        <textarea
          value={nlQ}
          onChange={(e) => setNlQ(e.target.value)}
          rows={3}
          className="w-full rounded-[var(--radius-card)] border border-divider bg-page px-3 py-2 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          placeholder="例如：上个月哪个赛道项目最多？"
        />
      </Modal>
    </div>
  )
}
