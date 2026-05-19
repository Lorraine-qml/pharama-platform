import { Link, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useTwinInfra } from './TwinInfraContext'

export default function TwinInfraOverviewPage() {
  const nav = useNavigate()
  const { parks, buildings, stats } = useTwinInfra()

  const recentParks = useMemo(() => [...parks].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 4), [parks])
  const recentBuildings = useMemo(
    () => [...buildings].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 4),
    [buildings],
  )

  const typeEntries = useMemo(() => Object.entries(stats.spaceRoomType), [stats.spaceRoomType])
  const maxType = Math.max(1, ...typeEntries.map(([, n]) => n))

  return (
    <div className="space-y-5">
      <ModuleIntroCard
        title="📌 空间总览（仪表盘）"
        lines={[
          '统计来自园区 / 单体 / 空间台账实时汇总；点击卡片或分布数字可跳转至对应管理列表并带筛选条件。',
          '删除园区、单体前系统会校验下级数据；停用园区在选择新单体所属园区时不可见（已有关联保留）。',
        ]}
      />

      <h1 className="text-lg font-bold text-foreground">空间总览</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => nav('/twin/infrastructure/parks')}
          className="rounded-lg border border-divider bg-card p-4 text-left shadow-sm transition hover:border-primary"
        >
          <p className="text-[12px] font-semibold text-muted">园区总数</p>
          <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">{stats.parkCount}</p>
          <span className="mt-3 inline-block text-[12px] font-bold text-primary">查看详情 →</span>
        </button>
        <button
          type="button"
          onClick={() => nav('/twin/infrastructure/buildings')}
          className="rounded-lg border border-divider bg-card p-4 text-left shadow-sm transition hover:border-primary"
        >
          <p className="text-[12px] font-semibold text-muted">单体总数</p>
          <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">{stats.buildingCount}</p>
          <span className="mt-3 inline-block text-[12px] font-bold text-primary">查看详情 →</span>
        </button>
        <button
          type="button"
          onClick={() => nav('/twin/infrastructure/spaces')}
          className="rounded-lg border border-divider bg-card p-4 text-left shadow-sm transition hover:border-primary"
        >
          <p className="text-[12px] font-semibold text-muted">空间总数</p>
          <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">{stats.spaceCount}</p>
          <span className="mt-3 inline-block text-[12px] font-bold text-primary">查看详情 →</span>
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-divider bg-card p-4 shadow-sm">
          <h2 className="text-[13px] font-bold text-foreground">最近更新的园区</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            {recentParks.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="w-full rounded-md border border-transparent px-2 py-1.5 text-left hover:border-divider hover:bg-muted/20"
                  onClick={() => nav(`/twin/infrastructure/parks`)}
                >
                  <span className="font-semibold text-foreground">{p.name}</span>
                  <span className="text-muted"> ({p.updatedAt})</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-divider bg-card p-4 shadow-sm">
          <h2 className="text-[13px] font-bold text-foreground">最近更新的单体</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            {recentBuildings.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  className="w-full rounded-md border border-transparent px-2 py-1.5 text-left hover:border-divider hover:bg-muted/20"
                  onClick={() => nav(`/twin/infrastructure/buildings?parkId=${encodeURIComponent(b.parkId)}`)}
                >
                  <span className="font-semibold text-foreground">{b.name}</span>
                  <span className="text-muted"> ({b.updatedAt})</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-divider bg-card p-4 shadow-sm">
          <h2 className="text-[13px] font-bold text-foreground">空间状态分布</h2>
          <div className="mt-3 flex flex-wrap gap-3 text-[13px]">
            {(['空闲', '占用', '维护', '停用'] as const).map((st) => (
              <button
                key={st}
                type="button"
                className="rounded-md border border-divider bg-surface px-3 py-2 font-semibold hover:border-primary"
                onClick={() => nav(`/twin/infrastructure/spaces?status=${encodeURIComponent(st)}`)}
              >
                {st} <span className="tabular-nums text-primary">{stats.spaceStatus[st] ?? 0}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-divider bg-card p-4 shadow-sm">
          <h2 className="text-[13px] font-bold text-foreground">空间类型分布</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            {typeEntries.map(([k, n]) => (
              <li key={k} className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-20 shrink-0 text-left font-medium text-foreground hover:text-primary"
                  onClick={() => nav(`/twin/infrastructure/spaces?roomType=${encodeURIComponent(k)}`)}
                >
                  {k}
                </button>
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/40">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(n / maxType) * 100}%` }} />
                </div>
                <button
                  type="button"
                  className="w-8 shrink-0 text-right font-bold tabular-nums text-primary hover:underline"
                  onClick={() => nav(`/twin/infrastructure/spaces?roomType=${encodeURIComponent(k)}`)}
                >
                  {n}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-lg border border-divider bg-card p-4 shadow-sm">
        <h2 className="text-[13px] font-bold text-foreground">实时统计（演示图表）</h2>
        <p className="mt-1 text-[12px] text-muted">按空间状态聚合柱形；生产环境对接时序库与孪生图层刷新频率。</p>
        <div className="mt-4 flex h-40 items-end gap-3 border-b border-divider pb-0 ps-1">
          {(['空闲', '占用', '维护', '停用'] as const).map((st) => {
            const n = stats.spaceStatus[st] ?? 0
            const h = 20 + (stats.spaceCount ? (n / stats.spaceCount) * 120 : 0)
            return (
              <div key={st} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full max-w-[48px] rounded-t-md bg-primary/85" style={{ height: `${h}px` }} title={`${st}: ${n}`} />
                <span className="text-[11px] font-semibold text-muted">{st}</span>
                <span className="text-[12px] font-bold tabular-nums text-foreground">{n}</span>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-[11px] text-muted">
          快捷入口：
          <Link to="/twin/infrastructure/parks" className="ms-1 font-semibold text-primary hover:underline">
            园区管理
          </Link>
          <span className="mx-1 text-divider">|</span>
          <Link to="/twin/infrastructure/spaces" className="font-semibold text-primary hover:underline">
            空间管理
          </Link>
        </p>
      </section>
    </div>
  )
}
