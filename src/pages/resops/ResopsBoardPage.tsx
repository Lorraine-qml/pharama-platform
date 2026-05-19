import { Link, Navigate } from 'react-router-dom'
import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import type { UserRole } from '../../auth/types'
import { Modal } from '../../components/Modal'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import {
  buildBoardAlerts,
  buildBoardKpis,
  buildExternalQuality,
  buildHotResources,
  buildLowEfficiencyResources,
  mergeExternalQualityForDisplay,
} from './resopsBoardAnalytics'
import {
  AI_SUGGESTION_SEED,
  BOARD_LAST_UPDATED,
  DEMAND_DETAIL_ROWS,
  DEMAND_GAP_ROWS,
  TREND_KIND_LABEL,
  UTILIZATION_TREND_SERIES,
  type BoardTrendKind,
} from './resopsBoardSeed'
import { useResopsV1 } from './ResopsV1Context'

function canExecuteBoardActions(role: UserRole | undefined): boolean {
  if (!role) return false
  return role === 'platform' || role === 'enterprise-admin'
}

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function TrendSvg({ points }: { points: { day: string; pct: number }[] }) {
  const w = 400
  const h = 140
  const padL = 36
  const padR = 12
  const padT = 12
  const padB = 28
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const ys = points.map((p) => padT + innerH - (p.pct / 100) * innerH)
  const xs = points.map((_, i) => padL + (points.length === 1 ? innerW / 2 : (innerW * i) / (points.length - 1)))
  const d = points
    .map((_, i) => `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full text-primary" aria-hidden>
      <line x1={padL} y1={padT + innerH} x2={w - padR} y2={padT + innerH} className="stroke-divider" strokeWidth={1} />
      <text x={4} y={padT + 8} className="fill-muted text-[9px]">
        100%
      </text>
      <text x={4} y={padT + innerH} className="fill-muted text-[9px]">
        0%
      </text>
      <path d={d} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={p.day} cx={xs[i]} cy={ys[i]} r={3} className="fill-primary" />
      ))}
      {points.map((p, i) => (
        <text
          key={`${p.day}-x`}
          x={xs[i]}
          y={h - 6}
          textAnchor="middle"
          className="fill-muted text-[8px]"
        >
          {p.day.slice(5)}
        </text>
      ))}
    </svg>
  )
}

export default function ResopsBoardPage() {
  const { user } = useAuth()
  const toast = useToast()
  const ctx = useResopsV1()
  const canExec = canExecuteBoardActions(user?.role)

  const [trendKind, setTrendKind] = useState<BoardTrendKind>('device')
  const [demandOpen, setDemandOpen] = useState(false)
  const [reportBusy, setReportBusy] = useState<string | null>(null)
  const [ignoredSuggestions, setIgnoredSuggestions] = useState<Set<string>>(() => new Set())

  const kpi = useMemo(
    () => buildBoardKpis(ctx.resources, ctx.usageOrders),
    [ctx.resources, ctx.usageOrders],
  )
  const hot = useMemo(
    () => buildHotResources(ctx.resources, ctx.applications),
    [ctx.resources, ctx.applications],
  )
  const lowEff = useMemo(
    () => buildLowEfficiencyResources(ctx.resources, ctx.applications),
    [ctx.resources, ctx.applications],
  )
  const extQ = useMemo(() => buildExternalQuality(ctx.usageOrders), [ctx.usageOrders])
  const extQDisplay = useMemo(() => mergeExternalQualityForDisplay(extQ), [extQ])
  const alerts = useMemo(() => buildBoardAlerts(ctx.resources, ctx.usageOrders), [ctx.resources, ctx.usageOrders])
  const trendPts = UTILIZATION_TREND_SERIES[trendKind]

  const suggestions = useMemo(() => AI_SUGGESTION_SEED.filter((s) => !ignoredSuggestions.has(s.id)), [ignoredSuggestions])

  const exportSnapshot = useCallback(() => {
    const lines = [
      '资源运营看板导出（演示）',
      `导出时间,${new Date().toISOString()}`,
      `资源总数,${kpi.resourceTotal}`,
      `内部,${kpi.internalCount},外部,${kpi.externalCount}`,
      `待审核,${kpi.pendingReview},异常,${kpi.anomalyCount},维护,${kpi.maintenanceCount}`,
      `本月使用单,${kpi.monthUsageCount},使用率%,${kpi.usageRatePct}`,
      '',
      '热门TOP5',
      ...hot.map((h, i) => `${i + 1},${h.name},${h.applications},满意度,${h.satisfaction}`),
      '',
      '低效TOP5',
      ...lowEff.map((h, i) => `${i + 1},${h.name},闲置天,${h.idleDays}`),
    ]
    downloadText(`资源看板快照-${BOARD_LAST_UPDATED.slice(0, 10)}.csv`, '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8')
    toast.show('已导出当前看板 CSV（演示）', 'success')
  }, [hot, kpi, lowEff, toast])

  const runReport = useCallback(
    (busyKey: string, fileStem: string, title: string, rows: string[][]) => {
      setReportBusy(busyKey)
      window.setTimeout(() => {
        const body = [title, `生成时间：${new Date().toLocaleString('zh-CN')}`, '', ...rows.map((r) => r.join(','))]
        downloadText(`${fileStem}-${BOARD_LAST_UPDATED.slice(0, 10)}.csv`, '\ufeff' + body.join('\n'), 'text/csv;charset=utf-8')
        toast.show('报表已生成并下载（演示 CSV，生产环境为 PDF/Excel）', 'success')
        setReportBusy(null)
      }, 700)
    },
    [toast],
  )

  function adoptSuggestion(s: (typeof AI_SUGGESTION_SEED)[number]) {
    if (!canExec) {
      toast.show('当前账号为只读（演示：仅园区运营 / 企业管理员可执行采纳与下架）', 'warning')
      return
    }
    if (s.action === 'delist' && s.resourceId) {
      const r = ctx.resources.find((x) => x.id === s.resourceId)
      if (!r) return
      if (r.status !== 'listed') {
        toast.show('该资源当前非上架状态，无需下架', 'info')
        setIgnoredSuggestions((prev) => new Set(prev).add(s.id))
        return
      }
      ctx.setResourceStatus(s.resourceId, 'delisted')
      toast.show(`已采纳：${r.name} 已下架（演示）`, 'success')
    } else if (s.action === 'procure') {
      toast.show('已记录「采购/合作引入」待办（演示：可对接采购流程）', 'success')
    } else if (s.action === 'scale') {
      toast.show('已记录「扩容评估」待办（演示）', 'success')
    } else if (s.action === 'partner_warn') {
      toast.show(`已记录对「${s.providerName ?? '合作方'}」的履约复盘提醒（演示）`, 'success')
    }
    setIgnoredSuggestions((prev) => new Set(prev).add(s.id))
  }

  function ignoreSuggestion(id: string) {
    setIgnoredSuggestions((prev) => new Set(prev).add(id))
  }

  function delistLowEff(id: string) {
    if (!canExec) {
      toast.show('只读账号无法执行下架', 'warning')
      return
    }
    const r = ctx.resources.find((x) => x.id === id)
    if (!r || r.status !== 'listed') {
      toast.show('资源状态已变更', 'info')
      return
    }
    ctx.setResourceStatus(id, 'delisted')
    toast.show(`${r.name} 已一键下架（演示）`, 'success')
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="space-y-5">
      <ModuleIntroCard
        title="📌 资源运营看板 V2 · 监管与分析（演示）"
        lines={[
          '聚合资源、申请单、使用单与评价数据的监管驾驶舱；供需缺口与 AI 建议当前为规则版占位（对应 demand_gap_analyzer / resource_optimizer）。',
          '权限（演示）：园区运营 / 企业管理员可导出、采纳建议、一键下架；其余角色只读。',
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider pb-3">
        <h1 className="text-lg font-bold text-foreground">资源运营看板</h1>
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <span>最后更新：{BOARD_LAST_UPDATED}</span>
          <button
            type="button"
            className="rounded-md border border-divider bg-card px-3 py-1.5 font-semibold text-foreground hover:border-primary"
            onClick={exportSnapshot}
          >
            导出
          </button>
        </div>
      </div>

      {/* KPI：统一卡片高度，底部信息对齐 */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex min-h-[118px] flex-col rounded-lg border border-divider bg-card p-4 shadow-sm">
          <p className="text-[12px] font-semibold text-muted">资源总数</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{kpi.resourceTotal}</p>
          <p className="mt-2 text-[12px] text-muted">
            内部 {kpi.internalCount} · 外部 {kpi.externalCount}
          </p>
          <Link to="/resops/catalog" className="mt-auto pt-2 text-[12px] font-semibold text-primary hover:underline">
            打开资源目录
          </Link>
        </div>
        <Link
          to="/resops/mgmt?status=pending_review"
          className="flex min-h-[118px] flex-col rounded-lg border border-divider bg-card p-4 shadow-sm transition hover:border-primary"
        >
          <p className="text-[12px] font-semibold text-muted">待审核资源</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{kpi.pendingReview}</p>
          <p className="mt-auto pt-2 text-[12px] text-muted">点击进入资源管理（已筛选待审核）</p>
        </Link>
        <div className="flex min-h-[118px] flex-col rounded-lg border border-divider bg-card p-4 shadow-sm">
          <p className="text-[12px] font-semibold text-muted">异常 / 维护</p>
          <p className="mt-1 text-2xl font-bold text-danger">{kpi.anomalyCount + kpi.maintenanceCount}</p>
          <p className="mt-2 text-[12px] text-muted">
            异常 {kpi.anomalyCount} · 维护 {kpi.maintenanceCount}
          </p>
          <div className="mt-auto flex flex-wrap gap-2 pt-2 text-[12px] font-semibold">
            <Link to="/resops/mgmt?status=anomaly" className="text-primary hover:underline">
              异常列表
            </Link>
            <span className="text-divider">|</span>
            <Link to="/resops/mgmt?status=maintenance" className="text-primary hover:underline">
              维护列表
            </Link>
          </div>
        </div>
        <div className="flex min-h-[118px] flex-col rounded-lg border border-divider bg-card p-4 shadow-sm">
          <p className="text-[12px] font-semibold text-muted">本月总使用次数 / 使用率</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{kpi.monthUsageCount}</p>
          <p className="mt-2 text-[12px] text-muted">
            在途使用单：{kpi.inUseOrders} · 使用率 {kpi.usageRatePct}%{' '}
            <span className="text-emerald-600">↑{kpi.usageMomDeltaPct}%</span>（环比演示）
          </p>
          <Link to="/resops/usage-orders" className="mt-auto pt-2 text-[12px] font-semibold text-primary hover:underline">
            查看使用单
          </Link>
        </div>
      </div>

      {/* 中部：两栏 grid 等高；各栏内部 flex 分配垂直空间 */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:items-stretch">
        <div className="flex min-h-0 flex-col gap-4">
          <section className="rounded-lg border border-divider bg-card p-4 shadow-sm">
            <h2 className="text-[13px] font-bold text-foreground">热门资源 TOP5（申请量）</h2>
            <ul className="mt-3 divide-y divide-divider/70 text-[13px]">
              {hot.map((r, i) => (
                <li key={r.resourceId} className="flex min-h-[44px] items-center gap-2 py-2.5 first:pt-0">
                  <span className="w-5 shrink-0 text-muted">{i + 1}</span>
                  <Link to={`/resops/resource/${r.resourceId}`} className="min-w-0 flex-1 font-semibold text-primary hover:underline">
                    {r.name}
                  </Link>
                  <span className="shrink-0 tabular-nums text-muted">{r.applications} 次</span>
                  <span className="shrink-0 tabular-nums text-amber-700">⭐{r.satisfaction.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-divider bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[13px] font-bold text-foreground">资源利用率趋势（近 30 天）</h2>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(TREND_KIND_LABEL) as BoardTrendKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTrendKind(k)}
                    className={cn(
                      'rounded-md px-2 py-1 text-[11px] font-semibold',
                      trendKind === k ? 'bg-primary text-white' : 'bg-muted/40 text-foreground hover:bg-muted/70',
                    )}
                  >
                    {TREND_KIND_LABEL[k]}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-1 text-[11px] text-muted">Y 轴为演示利用率 %（规则版曲线，非实时数仓）</p>
            <TrendSvg points={trendPts} />
          </section>

          <section className="flex min-h-[220px] flex-1 flex-col rounded-lg border border-divider bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[13px] font-bold text-foreground">资源供需缺口分析（AI / 规则版）</h2>
              <button
                type="button"
                className="text-[12px] font-semibold text-primary hover:underline"
                onClick={() => setDemandOpen(true)}
              >
                查看需求明细
              </button>
            </div>
            <ul className="mt-3 flex flex-1 flex-col justify-between gap-3">
              {DEMAND_GAP_ROWS.map((g) => (
                <li
                  key={g.id}
                  className={cn(
                    'rounded-md border px-3 py-2.5',
                    g.severity === 'high'
                      ? 'border-amber-300 bg-amber-50/80'
                      : g.severity === 'medium'
                        ? 'border-divider bg-muted/25'
                        : 'border-divider/80 bg-muted/10',
                  )}
                >
                  <p className="font-semibold text-foreground">
                    {g.severity === 'high' ? '⚠ ' : g.severity === 'medium' ? '· ' : '○ '}
                    {g.title}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">{g.detail}</p>
                  <p className="mt-1 text-[11px] text-muted">近 30 天相关命中：{g.hits}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <section className="rounded-lg border border-divider bg-card p-4 shadow-sm">
            <h2 className="text-[13px] font-bold text-foreground">低效资源 TOP5（近 30 天零申请 · 已上架）</h2>
            <ul className="mt-3 divide-y divide-divider/70 text-[13px]">
              {lowEff.map((r, i) => (
                <li key={r.resourceId} className="flex min-h-[48px] items-center justify-between gap-2 py-2.5 first:pt-0">
                  <div className="min-w-0 flex-1">
                    <span className="text-muted">{i + 1}. </span>
                    <Link to={`/resops/resource/${r.resourceId}`} className="font-semibold text-primary hover:underline">
                      {r.name}
                    </Link>
                    <p className="text-[12px] text-muted">闲置约 {r.idleDays} 天</p>
                  </div>
                  <button
                    type="button"
                    disabled={!canExec}
                    title={canExec ? '一键下架' : '只读账号不可下架'}
                    className={cn(
                      'shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold',
                      canExec ? 'bg-danger text-white hover:opacity-90' : 'cursor-not-allowed bg-muted text-muted',
                    )}
                    onClick={() => delistLowEff(r.resourceId)}
                  >
                    下架
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex min-h-[240px] flex-1 flex-col rounded-lg border border-divider bg-card p-4 shadow-sm">
            <h2 className="text-[13px] font-bold text-foreground">外部资源质量排行（履约满意度）</h2>
            <p className="mt-1 text-[11px] text-muted">基于已完成使用单评价；不足行由演示补全。</p>
            <div className="mt-3 grid flex-1 grid-rows-[auto_1fr] gap-0 text-[13px]">
              <div className="grid grid-cols-[28px_minmax(0,1fr)_52px_44px] gap-1 border-b border-divider pb-2 text-[11px] font-semibold text-muted">
                <span>#</span>
                <span>提供方</span>
                <span className="text-right">满意率</span>
                <span className="text-right">单数</span>
              </div>
              <ul className="flex min-h-0 flex-1 flex-col justify-between divide-y divide-divider/60">
                {extQDisplay.map((r, i) => (
                  <li
                    key={r.providerName}
                    className="grid min-h-[40px] flex-1 grid-cols-[28px_minmax(0,1fr)_52px_44px] items-center gap-1 py-2 text-[13px]"
                  >
                    <span className="text-muted">{i + 1}</span>
                    <span className="min-w-0 truncate font-medium text-foreground" title={r.providerName}>
                      {r.providerName}
                    </span>
                    <span className="text-right font-semibold tabular-nums text-primary">{r.satisfactionPct}%</span>
                    <span className="text-right tabular-nums text-[12px] text-muted">{r.orders}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-lg border border-divider bg-card p-4 shadow-sm">
            <h2 className="text-[13px] font-bold text-foreground">资源异常预警（最新）</h2>
            <ul className="mt-3 space-y-2.5 text-[13px]">
              {alerts.slice(0, 4).map((a) => (
                <li key={a.id} className="rounded-md border border-divider/80 bg-muted/15 px-3 py-2.5">
                  <p className="font-semibold text-foreground">• {a.resourceName}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">{a.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      to={`/resops/resource/${a.resourceId}`}
                      className="inline-flex rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-white hover:bg-primary-hover"
                    >
                      处理
                    </Link>
                    <Link
                      to="/resops/mgmt"
                      className="inline-flex rounded-md border border-divider px-2.5 py-1 text-[11px] font-semibold hover:border-primary"
                    >
                      资源管理
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* AI 建议：双列卡片，避免单行过长留白 */}
      <section className="rounded-lg border border-primary/25 bg-[#f8fbff] p-4 shadow-sm">
        <h2 className="text-[13px] font-bold text-foreground">✨ AI 资源优化建议（规则版）</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="flex flex-col rounded-md border border-divider bg-card p-3 text-[13px] shadow-sm"
            >
              <p className="min-h-0 flex-1 leading-relaxed text-foreground">{s.text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[11px] font-bold text-white',
                    canExec ? 'bg-primary hover:bg-primary-hover' : 'cursor-not-allowed bg-muted text-muted',
                  )}
                  onClick={() => adoptSuggestion(s)}
                >
                  采纳
                </button>
                <button
                  type="button"
                  className="rounded-md border border-divider px-2.5 py-1 text-[11px] font-semibold hover:border-primary"
                  onClick={() => ignoreSuggestion(s.id)}
                >
                  忽略
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 监管报表 */}
      <section className="rounded-lg border border-divider bg-card p-4 shadow-sm">
        <h2 className="text-[13px] font-bold text-foreground">监管报表</h2>
        <p className="mt-1 text-[12px] text-muted">异步生成（演示 0.7s），下载为 UTF-8 CSV；生产环境对接 PDF/Excel 导出。</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!reportBusy}
            className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover disabled:opacity-50"
            onClick={() =>
              runReport('rpt-month', '资源运营月报', '资源运营月报（演示）', [
                ['指标', '值'],
                ['资源总数', String(kpi.resourceTotal)],
                ['本月使用单', String(kpi.monthUsageCount)],
                ['使用率%', String(kpi.usageRatePct)],
              ])
            }
          >
            {reportBusy === 'rpt-month' ? '生成中…' : '生成资源运营月报'}
          </button>
          <button
            type="button"
            disabled={!!reportBusy}
            className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold hover:border-primary disabled:opacity-50"
            onClick={() =>
              runReport('rpt-ext', '外部资源准入报表', '外部资源准入报表（演示）', [
                ['提供方', '满意度%', '样本单数'],
                ...extQDisplay.map((r) => [r.providerName, String(r.satisfactionPct), String(r.orders)]),
              ])
            }
          >
            {reportBusy === 'rpt-ext' ? '生成中…' : '生成外部资源准入报表'}
          </button>
          <button
            type="button"
            disabled={!!reportBusy}
            className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold hover:border-primary disabled:opacity-50"
            onClick={() =>
              runReport('rpt-alert', '异常投诉报表', '异常投诉报表（演示）', [
                ['资源', '摘要', '时间'],
                ...alerts.map((a) => [a.resourceName, a.summary, a.at]),
              ])
            }
          >
            {reportBusy === 'rpt-alert' ? '生成中…' : '生成异常投诉报表'}
          </button>
        </div>
      </section>

      <Modal
        open={demandOpen}
        onClose={() => setDemandOpen(false)}
        title="需求明细（演示）"
        panelClassName="max-w-2xl"
      >
        <div className="max-h-[60vh] overflow-auto text-[13px]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-divider text-[11px] text-muted">
                <th className="py-2 pr-2">关键词</th>
                <th className="py-2 pr-2">搜索次数</th>
                <th className="py-2 pr-2">匹配失败</th>
                <th className="py-2">最近时间</th>
              </tr>
            </thead>
            <tbody>
              {DEMAND_DETAIL_ROWS.map((d) => (
                <tr key={d.id} className="border-b border-divider/70">
                  <td className="py-2 pr-2 font-medium text-foreground">{d.keyword}</td>
                  <td className="py-2 pr-2">{d.searchCount}</td>
                  <td className="py-2 pr-2">{d.failedMatch}</td>
                  <td className="py-2 text-muted">{d.lastAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  )
}
