import { Link } from 'react-router-dom'
import { useCallback, useMemo, useState } from 'react'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { Modal } from '../../components/Modal'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { downloadCsv } from '../eco/ecoDownload'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import {
  BASE_BUILDING_USAGE,
  FLOORS_BY_BUILDING,
  LAB_APPOINTMENTS_BY_ID,
  LAB_RANK_TOP,
  LAB_TREND_7D,
  PROJECT_SPACE_DEMO,
  ROOM_TYPE_USAGE,
  VACANT_ROOMS,
  type BuildingUsageRow,
  type FloorUsageRow,
  type LabRankRow,
  type LabTrendPoint,
} from './spaceAnalyticsMock'

const BUILDING_DRILL_KEY: Record<string, keyof typeof FLOORS_BY_BUILDING> = {
  'b-b': 'B',
  'b-a': 'A',
  'b-c': 'C',
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function classifyMatch(perCap: number, suggest: number) {
  const r = perCap / suggest
  if (r < 0.8) return { label: '偏小' as const, hint: '可考虑扩租或合并工位' }
  if (r > 1.2) return { label: '偏大' as const, hint: '建议释放部分空间或调整布局' }
  return { label: '正常' as const, hint: '—' }
}

function isAnomaly(perCap: number, suggest: number) {
  return Math.abs(perCap - suggest) / suggest > 0.3
}

function LabTrendSvg({ data }: { data: LabTrendPoint[] }) {
  const w = 320
  const h = 120
  const padX = 12
  const padY = 14
  const ys = data.map((d) => d.ratePct)
  const minY = Math.min(...ys) - 8
  const maxY = Math.max(...ys) + 8
  const span = Math.max(1e-6, maxY - minY)
  const coords = data.map((d, i) => {
    const x = padX + (i / Math.max(1, data.length - 1)) * (w - 2 * padX)
    const y = padY + (1 - (d.ratePct - minY) / span) * (h - 2 * padY)
    return [x, y] as const
  })
  const points = coords.map(([x, y]) => `${x},${y}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full max-w-md" role="img" aria-label="近7天实验室负载折线图">
      <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} className="stroke-divider" strokeWidth={1} />
      <polyline fill="none" stroke="var(--primary)" strokeWidth={2.5} points={points} strokeLinejoin="round" strokeLinecap="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} className="fill-primary" />
      ))}
    </svg>
  )
}

export default function TwinSpaceAnalyticsPage() {
  const toast = useToast()
  const { archives } = useHatchMgmt()
  const [tick, setTick] = useState(0)
  const [vacantPage, setVacantPage] = useState(1)
  const [vacantPageSize, setVacantPageSize] = useState(10)

  const [floorModal, setFloorModal] = useState<{ title: string; rows: FloorUsageRow[] } | null>(null)
  const [labModal, setLabModal] = useState<LabRankRow | null>(null)

  const jitter = useCallback((n: number, amp: number) => n + Math.round((Math.sin(tick * 1.7 + n) + 0.5) * amp), [tick])

  const buildingUsage = useMemo(
    () => BASE_BUILDING_USAGE.map((b) => ({ ...b, ratePct: Math.min(99, Math.max(5, jitter(b.ratePct, 2))) })),
    [jitter],
  )

  const projectOccupancyRows = useMemo(() => {
    return (Object.keys(PROJECT_SPACE_DEMO) as (keyof typeof PROJECT_SPACE_DEMO)[]).map((id) => {
      const d = PROJECT_SPACE_DEMO[id]
      const a = archives.find((x) => x.id === id)
      const name = a?.name ?? id
      const perCap = d.occupiedM2 / d.teamSize
      const m = classifyMatch(perCap, d.suggestPerCapitaM2)
      return {
        id,
        name,
        team: d.teamSize,
        area: d.occupiedM2,
        perCap,
        suggest: d.suggestPerCapitaM2,
        match: m.label,
        advice: m.hint,
      }
    })
  }, [archives])

  const kpis = useMemo(() => {
    const overall = Math.min(95, Math.max(40, jitter(68, 3)))
    const vacant = Math.max(8, jitter(32, 4))
    const labAvg = Math.min(90, Math.max(30, jitter(65, 3)))
    let anomaly = 0
    for (const r of projectOccupancyRows) {
      if (isAnomaly(r.perCap, r.suggest)) anomaly += 1
    }
    return { overall, vacant, labAvg, anomaly }
  }, [jitter, projectOccupancyRows])

  const longVacant = VACANT_ROOMS.filter((v) => v.bucket === 'long').length
  const shortVacant = VACANT_ROOMS.filter((v) => v.bucket === 'short').length

  const vacantPaged = useMemo(() => {
    const start = (vacantPage - 1) * vacantPageSize
    return VACANT_ROOMS.slice(start, start + vacantPageSize)
  }, [vacantPage, vacantPageSize])

  function onExport() {
    const date = new Date().toISOString().slice(0, 10)
    downloadCsv(
      `空间运营_使用率汇总_${date}.csv`,
      ['楼宇', '使用率(%)'],
      buildingUsage.map((b) => [b.name, b.ratePct]),
    )
    downloadCsv(
      `空间运营_空置房间_${date}.csv`,
      ['房间名称', '位置', '面积(㎡)', '空置天数', '类型', '分类'],
      VACANT_ROOMS.map((v) => [v.name, v.location, v.areaM2, v.vacantDays, v.roomType, v.bucket === 'long' ? '长期>90天' : '短期≤90天']),
    )
    downloadCsv(
      `空间运营_实验室负载_${date}.csv`,
      ['日期', '总体预约率(%)'],
      LAB_TREND_7D.map((p) => [p.day, p.ratePct]),
    )
    downloadCsv(
      `空间运营_项目占用_${date}.csv`,
      ['项目ID', '项目名称', '团队人数', '占用总面积(㎡)', '人均(㎡)', '建议人均', '匹配度', '建议'],
      projectOccupancyRows.map((r) => [r.id, r.name, r.team, r.area, r.perCap.toFixed(2), r.suggest, r.match, r.advice]),
    )
    toast.show('已导出 4 份 CSV（演示）。Excel 多 Sheet 导出由后端 V2 提供。', 'success')
  }

  function openBuildingDrill(row: BuildingUsageRow) {
    const k = BUILDING_DRILL_KEY[row.id]
    const rows = k ? FLOORS_BY_BUILDING[k] ?? [] : []
    setFloorModal({ title: `${row.name} · 各楼层使用率`, rows })
  }

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="📐 空间运营分析（决策支持）"
        lines={[
          'V1：基于演示聚合数据的 KPI、图表与下钻表格；刷新模拟 T+1 重算抖动。',
          '权限：仅园区运营（platform）与企业管理员（enterprise-admin）可访问本页与侧栏入口。',
          'V2：AI 预测、孪生地图定位与 Excel 多 Sheet 直连导出。',
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-foreground">空间运营分析</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-md border border-divider bg-surface px-3 py-2 text-[13px]" onClick={onExport}>
            导出报表
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
            onClick={() => {
              setTick((t) => t + 1)
              toast.show('已模拟重新聚合统计数据', 'success')
            }}
          >
            刷新
          </button>
        </div>
      </div>

      {/* KPI */}
      <section id="sec-kpi" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          title="环比：较上月 +5%（演示）"
          onClick={() => scrollToId('sec-usage')}
          className="rounded-lg border border-divider bg-card p-4 text-left shadow-sm transition hover:border-primary"
        >
          <p className="text-[12px] font-semibold text-muted">整体使用率</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{kpis.overall}%</p>
          <p className="mt-1 text-[12px] font-semibold text-emerald-600">↑ 5% 环比（演示）</p>
        </button>
        <button
          type="button"
          onClick={() => scrollToId('sec-vacant')}
          className="rounded-lg border border-divider bg-card p-4 text-left shadow-sm transition hover:border-primary"
        >
          <p className="text-[12px] font-semibold text-muted">空置房间数</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{kpis.vacant} 间</p>
          <p className="mt-1 text-[12px] text-muted">点击下钻空置清单</p>
        </button>
        <button
          type="button"
          onClick={() => scrollToId('sec-lab')}
          className="rounded-lg border border-divider bg-card p-4 text-left shadow-sm transition hover:border-primary"
        >
          <p className="text-[12px] font-semibold text-muted">实验室平均负载</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{kpis.labAvg}%</p>
          <p className="mt-1 text-[12px] text-muted">预约 + 实际使用 / 可用时长</p>
        </button>
        <button
          type="button"
          onClick={() => scrollToId('sec-project')}
          className="rounded-lg border border-divider bg-card p-4 text-left shadow-sm transition hover:border-primary"
        >
          <p className="text-[12px] font-semibold text-muted">项目空间匹配异常数</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{kpis.anomaly}</p>
          <p className="mt-1 text-[12px] text-muted">人均偏离建议值 &gt;30%</p>
        </button>
      </section>

      {/* 上图表 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section id="sec-usage" className="rounded-lg border border-divider bg-card p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-foreground">空间使用率分析</h2>
          <p className="mt-1 text-[12px] text-muted">楼宇排行（点击下钻楼层）；房间类型占比。</p>
          <div className="mt-4 space-y-3">
            <p className="text-[12px] font-semibold text-muted">楼宇使用率排行</p>
            {buildingUsage.map((b) => (
              <div key={b.id} className="flex items-center gap-3 text-[13px]">
                <button
                  type="button"
                  className="w-14 shrink-0 text-left font-semibold text-primary hover:underline"
                  onClick={() => openBuildingDrill(b)}
                >
                  {b.name}
                </button>
                <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/40">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${b.ratePct}%` }} />
                </div>
                <span className="w-10 shrink-0 tabular-nums text-muted">{b.ratePct}%</span>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <p className="text-[12px] font-semibold text-muted">房间类型使用率</p>
            <div className="mt-3 flex flex-wrap gap-4">
              {ROOM_TYPE_USAGE.map((r) => (
                <div key={r.type} className="min-w-[140px] flex-1">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-foreground">{r.type}</span>
                    <span className="tabular-nums text-muted">{r.ratePct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted/40">
                    <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.ratePct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-[12px] text-muted">
            按楼层下钻示例：已支持点击「B 栋」等打开弹窗（V1）；孪生地图高亮为 V2。
          </p>
        </section>

        <section id="sec-lab" className="rounded-lg border border-divider bg-card p-4 shadow-sm">
          <h2 className="text-[14px] font-bold text-foreground">实验室负载趋势（近 7 天）</h2>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
            <LabTrendSvg data={LAB_TREND_7D} />
            <div className="text-[12px] text-muted">
              <p className="font-semibold text-foreground">高峰时段</p>
              <p>10:00–12:00，14:00–16:00</p>
            </div>
          </div>
          <div className="mt-5 border-t border-divider pt-4">
            <p className="text-[12px] font-semibold text-muted">实验室负载排行</p>
            <ol className="mt-2 space-y-2 text-[13px]">
              {LAB_RANK_TOP.map((lab, idx) => (
                <li key={lab.id} className="flex items-center justify-between gap-2">
                  <span className="text-muted">
                    {idx + 1}.{' '}
                    <button type="button" className="font-medium text-primary hover:underline" onClick={() => setLabModal(lab)}>
                      {lab.name}
                    </button>
                  </span>
                  <span className="tabular-nums text-muted">{lab.loadPct}%</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      {/* 空置 */}
      <section id="sec-vacant" className="rounded-lg border border-divider bg-card p-4 shadow-sm">
        <h2 className="text-[14px] font-bold text-foreground">空间空置率分析</h2>
        <div className="mt-2 flex flex-wrap gap-4 text-[13px] text-muted">
          <span>
            长期空置（&gt;90 天）：<strong className="text-foreground">{longVacant}</strong> 间
          </span>
          <span>
            短期空置（≤90 天）：<strong className="text-foreground">{shortVacant}</strong> 间
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-md border border-divider">
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full border-collapse text-[13px]">
              <thead className="border-b border-divider bg-[#F5F7FA] text-left text-[12px] font-bold text-muted">
                <tr>
                  <th className="px-4 py-3">房间名称</th>
                  <th className="px-4 py-3">位置</th>
                  <th className="px-4 py-3">面积</th>
                  <th className="px-4 py-3">空置天数</th>
                  <th className="px-4 py-3">类型</th>
                  <th className="px-4 py-3 text-end">操作</th>
                </tr>
              </thead>
              <tbody>
                {vacantPaged.map((v) => (
                  <tr key={v.id} className="border-b border-divider hover:bg-primary-light/10">
                    <td className="px-4 py-3 font-medium text-foreground">{v.name}</td>
                    <td className="px-4 py-3 text-muted">{v.location}</td>
                    <td className="px-4 py-3 text-muted">{v.areaM2}㎡</td>
                    <td className="px-4 py-3 text-muted">{v.vacantDays}</td>
                    <td className="px-4 py-3 text-muted">{v.roomType}</td>
                    <td className="px-4 py-3 text-end">
                      <Link
                        to={`/innovation/ops/workbench?from=space-analytics&room=${encodeURIComponent(v.name)}&area=${v.areaM2}`}
                        className="text-primary hover:underline"
                      >
                        快速招商
                      </Link>
                      <Link to="/twin/infrastructure/spaces" className="ml-2 text-primary hover:underline">
                        详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ListPaginationBar
            total={VACANT_ROOMS.length}
            page={vacantPage}
            pageSize={vacantPageSize}
            onPageChange={setVacantPage}
            onPageSizeChange={(n) => {
              setVacantPageSize(n)
              setVacantPage(1)
            }}
          />
        </div>
      </section>

      {/* 项目占用 */}
      <section id="sec-project" className="rounded-lg border border-divider bg-card p-4 shadow-sm">
        <h2 className="text-[14px] font-bold text-foreground">项目空间占用分析</h2>
        <div className="mt-4 overflow-x-auto rounded-md border border-divider">
          <table className="min-w-[960px] w-full border-collapse text-[13px]">
            <thead className="border-b border-divider bg-[#F5F7FA] text-left text-[12px] font-bold text-muted">
              <tr>
                <th className="px-4 py-3">项目名称</th>
                <th className="px-4 py-3">团队人数</th>
                <th className="px-4 py-3">占用总面积</th>
                <th className="px-4 py-3">人均面积</th>
                <th className="px-4 py-3">建议人均</th>
                <th className="px-4 py-3">匹配度</th>
                <th className="px-4 py-3">建议</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              {projectOccupancyRows.map((r) => (
                <tr key={r.id} className="border-b border-divider hover:bg-primary-light/10">
                  <td className="px-4 py-3">
                    <Link className="font-medium text-primary hover:underline" to={`/hatch/archive/${r.id}`}>
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{r.team}</td>
                  <td className="px-4 py-3 text-muted">{r.area}㎡</td>
                  <td className="px-4 py-3 text-muted">{r.perCap.toFixed(2)}㎡</td>
                  <td className="px-4 py-3 text-muted">{r.suggest}㎡</td>
                  <td className="px-4 py-3 text-muted">{r.match}</td>
                  <td className="max-w-[220px] px-4 py-3 text-muted">{r.advice}</td>
                  <td className="px-4 py-3 text-end text-[12px]">
                    {r.match === '偏大' ? (
                      <Link to="/hatch/changes" className="text-primary hover:underline">
                        释放空间
                      </Link>
                    ) : null}
                    {r.match === '偏小' ? (
                      <Link to="/hatch/changes" className="ml-2 text-primary hover:underline">
                        扩租申请
                      </Link>
                    ) : null}
                    {r.match === '正常' ? <span className="text-muted">—</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI V2 */}
      <section className="rounded-lg border border-dashed border-primary/30 bg-primary-light/10 p-4">
        <h2 className="text-[14px] font-bold text-foreground">✨ AI 空间优化建议（V2 预留）</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[13px] text-muted">
          <li>预计下季度需增加 2 间细胞房，建议改造 B 栋 3F。</li>
          <li>基因治疗项目可能扩租，建议预留相邻房间。</li>
        </ul>
        <div className="mt-3">
          <Link to="/innovation/industry-trends" className="text-[13px] font-semibold text-primary hover:underline">
            查看详情（占位）
          </Link>
        </div>
      </section>

      <Modal open={Boolean(floorModal)} title={floorModal?.title ?? ''} onClose={() => setFloorModal(null)}>
        <div className="overflow-hidden rounded-md border border-divider">
          <table className="w-full border-collapse text-[13px]">
            <thead className="bg-muted/30 text-left text-[12px] font-bold text-muted">
              <tr>
                <th className="px-3 py-2">楼层</th>
                <th className="px-3 py-2">使用率</th>
              </tr>
            </thead>
            <tbody>
              {(floorModal?.rows ?? []).map((row) => (
                <tr key={row.floor} className="border-t border-divider">
                  <td className="px-3 py-2">{row.floor}</td>
                  <td className="px-3 py-2 tabular-nums">{row.ratePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-muted">V2 支持从楼层进一步下钻到房间列表并与孪生地图联动。</p>
      </Modal>

      <Modal
        open={Boolean(labModal)}
        title={labModal ? `预约明细 · ${labModal.name}` : ''}
        onClose={() => setLabModal(null)}
        panelClassName="max-w-lg"
      >
        <p className="mb-3 text-[12px] text-muted">数据来源：资源使用单中资源类型为「实验室」的记录（演示）。</p>
        <div className="max-h-[320px] overflow-y-auto rounded-md border border-divider">
          <table className="w-full border-collapse text-[12px]">
            <thead className="sticky top-0 bg-[#F5F7FA] text-left font-bold text-muted">
              <tr>
                <th className="px-2 py-2">时段</th>
                <th className="px-2 py-2">项目</th>
                <th className="px-2 py-2">时长(h)</th>
                <th className="px-2 py-2">状态</th>
              </tr>
            </thead>
            <tbody>
              {(labModal ? LAB_APPOINTMENTS_BY_ID[labModal.id] ?? [] : []).map((x, i) => (
                <tr key={i} className="border-t border-divider">
                  <td className="px-2 py-2 text-muted">{x.time}</td>
                  <td className="px-2 py-2">{x.project}</td>
                  <td className="px-2 py-2 tabular-nums">{x.hours}</td>
                  <td className="px-2 py-2 text-muted">{x.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  )
}
