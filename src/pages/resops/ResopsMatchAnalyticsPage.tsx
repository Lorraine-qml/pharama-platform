import { Link, Navigate } from 'react-router-dom'
import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { useResopsAiMatch } from './ResopsAiMatchContext'

function downloadCsv(name: string, rows: string[][]) {
  const body = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export default function ResopsMatchAnalyticsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { matchRecords } = useResopsAiMatch()

  const [range, setRange] = useState<'week' | 'month' | 'all'>('week')
  const [typeF, setTypeF] = useState<string>('all')

  const filtered = useMemo(() => {
    let xs = [...matchRecords]
    if (range === 'week') xs = xs.filter((r) => r.created_at >= '2025-05-12')
    if (range === 'month') xs = xs.filter((r) => r.created_at >= '2025-05-01')
    if (typeF !== 'all') xs = xs.filter((r) => r.category === typeF)
    return xs.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  }, [matchRecords, range, typeF])

  const kpi = useMemo(() => {
    const total = filtered.length
    const applied = filtered.filter((r) => r.is_applied).length
    const used = filtered.filter((r) => r.is_used).length
    const rated = filtered.filter((r) => r.satisfaction != null)
    const avgSat =
      rated.length > 0 ? Math.round((rated.reduce((s, r) => s + (r.satisfaction ?? 0), 0) / rated.length) * 10) / 10 : 4.6
    return {
      total,
      applyRate: total ? Math.round((applied / total) * 100) : 0,
      useRate: applied ? Math.round((used / applied) * 100) : 0,
      avgSat,
    }
  }, [filtered])

  const byCategory = useMemo(() => {
    const m = new Map<string, { n: number; top: string; applied: number; used: number; good: number }>()
    for (const r of filtered) {
      const cur = m.get(r.category) ?? { n: 0, top: r.resource_name, applied: 0, used: 0, good: 0 }
      cur.n += 1
      if (r.score >= 90) cur.top = r.resource_name
      if (r.is_applied) cur.applied += 1
      if (r.is_used) cur.used += 1
      if ((r.satisfaction ?? 0) >= 4) cur.good += 1
      m.set(r.category, cur)
    }
    return Array.from(m.entries()).map(([category, v]) => ({
      category,
      ...v,
      goodPct: v.used ? Math.round((v.good / v.used) * 100) : 96,
    }))
  }, [filtered])

  const recent = useMemo(() => filtered.slice(0, 20), [filtered])

  const exportReport = useCallback(() => {
    const rows = [
      ['时间', '需求摘要', '推荐资源', '匹配分', '是否申请', '是否使用', '满意度'],
      ...recent.map((r) => [
        r.created_at,
        r.demand_summary,
        r.resource_name,
        String(r.score),
        r.is_applied ? '是' : '否',
        r.is_used ? '是' : '否',
        r.satisfaction != null ? String(r.satisfaction) : '—',
      ]),
    ]
    downloadCsv(`撮合效果-${new Date().toISOString().slice(0, 10)}.csv`, rows)
    toast.show('已导出 CSV（演示）', 'success')
  }, [recent, toast])

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="space-y-5">
      <ModuleIntroCard
        title="📌 撮合效果跟踪（演示）"
        lines={[
          '指标由撮合记录 + 申请单 matchId 关联推导；生产环境对接数仓与真实转化率。',
          '时间范围筛选为演示日期规则，非自然周历严格对齐。',
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-foreground">撮合效果跟踪</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/resops/ai-match" className="text-[12px] font-semibold text-primary hover:underline">
            返回 AI 撮合
          </Link>
          <button
            type="button"
            className="rounded-md border border-divider bg-card px-3 py-1.5 text-[12px] font-semibold hover:border-primary"
            onClick={exportReport}
          >
            导出报表
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-divider bg-card p-4 text-[13px]">
        <div>
          <label className="text-[11px] font-semibold text-muted">时间范围</label>
          <select
            className="mt-1 block rounded-md border border-divider bg-surface px-2 py-1.5 text-[13px]"
            value={range}
            onChange={(e) => setRange(e.target.value as 'week' | 'month' | 'all')}
          >
            <option value="week">本周（演示 ≥05-12）</option>
            <option value="month">本月（演示 ≥05-01）</option>
            <option value="all">全部</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted">资源类型</label>
          <select
            className="mt-1 block rounded-md border border-divider bg-surface px-2 py-1.5 text-[13px]"
            value={typeF}
            onChange={(e) => setTypeF(e.target.value)}
          >
            <option value="all">全部</option>
            <option value="设备">设备</option>
            <option value="空间">空间</option>
            <option value="专家">专家</option>
            <option value="技术服务">技术服务</option>
            <option value="外部合作">外部合作</option>
            <option value="AI 能力">AI 能力</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-divider bg-card p-4 shadow-sm">
          <p className="text-[12px] text-muted">总撮合次数</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{kpi.total}</p>
        </div>
        <div className="rounded-lg border border-divider bg-card p-4 shadow-sm">
          <p className="text-[12px] text-muted">推荐转申请率</p>
          <p className="mt-1 text-2xl font-bold text-primary">{kpi.applyRate}%</p>
        </div>
        <div className="rounded-lg border border-divider bg-card p-4 shadow-sm">
          <p className="text-[12px] text-muted">申请转使用率</p>
          <p className="mt-1 text-2xl font-bold text-primary">{kpi.useRate}%</p>
        </div>
        <div className="rounded-lg border border-divider bg-card p-4 shadow-sm">
          <p className="text-[12px] text-muted">平均满意度</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">⭐{kpi.avgSat}</p>
        </div>
      </div>

      <section className="overflow-x-auto rounded-lg border border-divider bg-card shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-divider bg-muted/30 text-[11px] font-semibold text-muted">
              <th className="px-3 py-2">需求类型</th>
              <th className="px-3 py-2">撮合次数</th>
              <th className="px-3 py-2">推荐资源 TOP</th>
              <th className="px-3 py-2">申请转化</th>
              <th className="px-3 py-2">使用完成</th>
              <th className="px-3 py-2">好评率（演示）</th>
            </tr>
          </thead>
          <tbody>
            {byCategory.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted">
                  暂无数据，请先在「AI 供需撮合」中完成几次匹配
                </td>
              </tr>
            ) : (
              byCategory.map((row) => (
                <tr key={row.category} className="border-b border-divider/70">
                  <td className="px-3 py-2 font-medium">{row.category}</td>
                  <td className="px-3 py-2 tabular-nums">{row.n}</td>
                  <td className="px-3 py-2">{row.top}</td>
                  <td className="px-3 py-2 tabular-nums">{row.applied}</td>
                  <td className="px-3 py-2 tabular-nums">{row.used}</td>
                  <td className="px-3 py-2 tabular-nums">{row.goodPct}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-divider bg-card p-4 shadow-sm">
        <h2 className="text-[13px] font-bold text-foreground">近期撮合记录（最多 20 条）</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-divider text-[11px] font-semibold text-muted">
                <th className="py-2 pr-2">时间</th>
                <th className="py-2 pr-2">需求摘要</th>
                <th className="py-2 pr-2">推荐资源</th>
                <th className="py-2 pr-2">申请</th>
                <th className="py-2 pr-2">使用</th>
                <th className="py-2">满意度</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.match_id} className="border-b border-divider/60">
                  <td className="py-2 pr-2 text-muted">{r.created_at}</td>
                  <td className="max-w-[200px] truncate py-2 pr-2" title={r.demand_summary}>
                    {r.demand_summary}
                  </td>
                  <td className="py-2 pr-2 font-medium">{r.resource_name}</td>
                  <td className="py-2 pr-2">{r.is_applied ? '是' : '否'}</td>
                  <td className="py-2 pr-2">{r.is_used ? '是' : '否'}</td>
                  <td className="py-2">{r.satisfaction != null ? `${r.satisfaction}★` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
