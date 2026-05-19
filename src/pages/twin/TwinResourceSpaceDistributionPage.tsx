import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import type { UserRole } from '../../auth/types'
import { Modal } from '../../components/Modal'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import { useResopsV1 } from '../resops/ResopsV1Context'
import type { ResResource } from '../resops/resopsV1Types'
import { useTwinInfra } from './TwinInfraContext'

type ViewMode = 'list' | 'card'

type ResKind = '实验室' | '设备' | '会议室' | '专家'

type RowStatus = '空闲' | '使用中' | '已预约' | '维护'

type Row = {
  id: string
  name: string
  kind: ResKind
  location: string
  status: RowStatus
  detail: string
  resourceId?: string
  labShare?: '共享' | '专属'
}

type DisplayRow = Row & { source?: ResResource }

const VIEW_STORAGE_KEY = 'pharma-twin-resource-space-view'
const PAGE_SIZE = 9

const KIND_ORDER: ResKind[] = ['会议室', '专家', '设备', '实验室']

const STATUS_PILLS: { label: string; value: '全部' | RowStatus }[] = [
  { label: '全部', value: '全部' },
  { label: '空闲', value: '空闲' },
  { label: '使用中', value: '使用中' },
  { label: '维护', value: '维护' },
]

function readSavedView(): ViewMode | null {
  try {
    const s = localStorage.getItem(VIEW_STORAGE_KEY)
    if (s === 'list' || s === 'card') return s
  } catch {
    /* ignore */
  }
  return null
}

function defaultViewForRole(role: UserRole | undefined): ViewMode {
  return role === 'platform' ? 'list' : 'card'
}

function mapResourceToRow(r: ResResource): Row | null {
  if (r.status !== 'listed') return null
  let kind: ResKind = '设备'
  if (r.level2.includes('实验室') || r.level1.includes('空间')) kind = '实验室'
  else if (r.level2 === '专家') kind = '专家'
  else if (r.level2.includes('会议')) kind = '会议室'

  let status: RowStatus = '空闲'
  const al = (r.availabilityLabel ?? '').toLowerCase()
  if (al.includes('占用') || al.includes('使用中') || al.includes('排队')) status = '使用中'
  else if (al.includes('预约') || al.includes('已约')) status = '已预约'
  else if (al.includes('维护') || al.includes('异常')) status = '维护'
  else if (al.includes('空闲') || al.includes('可预约') || al.includes('空闲中')) status = '空闲'

  const loc = r.twinBindNote?.trim() || (r.location && r.location !== '—' ? `B栋-${r.location}` : '—')
  const labShare: '共享' | '专属' | undefined =
    kind === '实验室' ? (r.level2.includes('共享') ? '共享' : '专属') : undefined

  return {
    id: r.id,
    name: r.name,
    kind,
    location: loc,
    status,
    detail: r.capability.trim(),
    resourceId: r.id,
    labShare,
  }
}

function statusDot(st: RowStatus) {
  if (st === '空闲') return { emoji: '🟢', cls: 'text-[#00A854]' }
  if (st === '使用中') return { emoji: '🔵', cls: 'text-[#1E6DFF]' }
  if (st === '已预约') return { emoji: '🟠', cls: 'text-[#FF8A34]' }
  return { emoji: '🔴', cls: 'text-danger' }
}

function kindEmoji(kind: ResKind, name: string): string {
  if (kind === '会议室') return '🏢'
  if (kind === '专家') return '👩‍🏫'
  if (kind === '实验室') return '🧪'
  if (name.includes('样本库') || name.includes('冷库')) return '❄️'
  if (name.includes('PCR')) return '🔬'
  return '🖥️'
}

function kindTypeLabel(kind: ResKind, labShare?: '共享' | '专属') {
  if (kind === '实验室' && labShare) return `${kind}（${labShare}）`
  return kind
}

function kindHeaderBar(kind: ResKind): string {
  switch (kind) {
    case '会议室':
      return 'bg-amber-500/20 text-amber-950 border-b border-amber-500/35'
    case '专家':
      return 'bg-violet-500/20 text-violet-950 border-b border-violet-500/35'
    case '设备':
      return 'bg-sky-500/18 text-sky-950 border-b border-sky-500/35'
    default:
      return 'bg-emerald-500/18 text-emerald-950 border-b border-emerald-500/35'
  }
}

function cardStatusChrome(st: RowStatus) {
  if (st === '维护') return 'border-muted-foreground/30 bg-muted/20'
  if (st === '使用中') return 'border-[#1E6DFF]/22 bg-[#1E6DFF]/[0.035]'
  if (st === '空闲') return 'border-[#00A854]/18 bg-[#00A854]/[0.03]'
  return 'border-[#FF8A34]/22 bg-[#FF8A34]/[0.04]'
}

function maskPhone(p: string) {
  if (p.length < 7) return p
  return `${p.slice(0, 3)}****${p.slice(-4)}`
}

/** 搜索匹配（不含类型/状态药丸） */
function matchesSearch(r: DisplayRow, q: string) {
  const t = q.trim().toLowerCase()
  if (!t) return true
  const hay = `${r.name} ${r.location} ${r.detail} ${r.kind}`.toLowerCase()
  return hay.includes(t)
}

function cardDetailRows(row: DisplayRow): { label: string; value: string }[] {
  const src = row.source
  if (row.kind === '会议室') {
    const cap = row.detail.match(/(\d+)\s*人/)?.[1]
    const equip = row.detail.replace(/容量[^，。]+[,，]?/u, '').replace(/^容量\d+人[,，]?/u, '').trim() || '投影 / 视频会议'
    return [
      { label: '容量', value: cap ? `${cap} 人` : '—' },
      { label: '设备', value: equip.replace(/。$/, '') },
    ]
  }
  if (row.kind === '专家') {
    const field = row.detail.includes('·') ? row.detail.split('·')[0].trim() : row.detail.split('，')[0]?.trim() ?? '—'
    const sched =
      row.detail.includes('排班') || row.detail.includes('周')
        ? row.detail.match(/排班[:：]?\s*(.+)/)?.[1]?.trim() ?? row.detail
        : src?.hours ?? '预约制'
    return [
      { label: '领域', value: field },
      { label: '排班', value: sched.replace(/。$/, '') },
    ]
  }
  if (row.kind === '实验室') {
    const bsl = row.detail.match(/BSL[-\s]?\d+|生物安全二级/i)?.[0] ?? 'BSL-2（演示）'
    const inst = row.detail.replace(/生物安全[^，。]+[,，]?/iu, '').replace(/BSL[^，。]+[,，]?/iu, '').trim() || '离心、培养箱、显微镜'
    return [
      { label: '等级', value: bsl },
      { label: '仪器', value: inst.replace(/。$/, '') },
    ]
  }
  const purpose = src?.intro?.trim() || row.detail.split(/[，。]/)[0] || '—'
  const spec = src?.capability?.replace(/^[^，。]+[，。]?/u, '').trim() || row.detail
  return [
    { label: '用途', value: purpose },
    { label: '技术指标', value: spec.length > 48 ? `${spec.slice(0, 48)}…` : spec },
  ]
}

function keyAttrSummary(row: DisplayRow): string {
  const xs = cardDetailRows(row)
  return xs.map((x) => `${x.label}:${x.value}`).join('；')
}

function techParamBullets(row: DisplayRow): string[] {
  if (row.source?.capability) {
    return row.source.capability
      .split(/[。；]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6)
  }
  if (row.kind === '会议室') return ['容量与会议设备以现场台账为准（演示）。']
  return [row.detail]
}

function noticeLines(row: DisplayRow): string[] {
  if (row.kind === '实验室') return ['进入前完成安全培训与准入登记（演示）。', '使用后清洁台面并登记仪器机时。']
  if (row.kind === '设备') return ['需提前培训并通过考核（演示）。', '使用时登记样本与面板信息。']
  if (row.kind === '专家') return ['请按排班时段准时到场；改期请提前 24 小时。']
  return ['使用完毕请恢复场地；贵重物品请自行保管。']
}

function demoHistoryLines(row: DisplayRow): string[] {
  const p = row.name.includes('流式') ? '基因治疗项目' : row.name.includes('共享实验室') ? '细胞治疗项目' : '抗体项目'
  return [
    `2025-05-18 14:00–16:00  [${p}]  王丽（已完成）`,
    `2025-05-19 10:00–12:00  [细胞治疗项目]  李明（进行中）`,
  ]
}

export default function TwinResourceSpaceDistributionPage() {
  const toast = useToast()
  const { user } = useAuth()
  const { archives } = useHatchMgmt()
  const { resources } = useResopsV1()
  const { spaces, buildingById } = useTwinInfra()

  const [view, setView] = useState<ViewMode>(() => readSavedView() ?? defaultViewForRole(user?.role))
  const [typeFilter, setTypeFilter] = useState<'全部' | ResKind>('全部')
  const [statusFilter, setStatusFilter] = useState<'全部' | RowStatus>('全部')
  const [searchQ, setSearchQ] = useState('')
  const [page, setPage] = useState(1)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, RowStatus>>({})

  const [detailRow, setDetailRow] = useState<DisplayRow | null>(null)
  const [bookingRow, setBookingRow] = useState<DisplayRow | null>(null)
  const [bookDate, setBookDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [bookStart, setBookStart] = useState('14:00')
  const [bookEnd, setBookEnd] = useState('16:00')
  const [bookPurpose, setBookPurpose] = useState('')
  const [bookTech, setBookTech] = useState(false)
  const [bookTrain, setBookTrain] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view)
    } catch {
      /* ignore */
    }
  }, [view])

  useEffect(() => {
    setPage(1)
  }, [typeFilter, statusFilter, searchQ])

  const defaultProjectName = useMemo(
    () => archives.find((a) => a.name.includes('基因'))?.name ?? archives[0]?.name ?? '基因治疗项目',
    [archives],
  )

  const applicantName = useMemo(() => {
    const raw = user?.displayName ?? ''
    const part = raw.split('·')[0]?.trim()
    return part || '张三（演示）'
  }, [user?.displayName])

  const staticRows: Row[] = useMemo(() => {
    const mtg = spaces.find((s) => s.code === 'ZJ-A-2F-M01')
    const b = mtg ? buildingById(mtg.buildingId) : undefined
    const loc = mtg && b ? `${b.name}-${mtg.floor}-${mtg.name}` : 'A栋-2F-大会议室'
    return [
      {
        id: 'static-meeting-1',
        name: '大会议室',
        kind: '会议室',
        location: loc,
        status: mtg?.status === '维护' ? '维护' : '已预约',
        detail: '容量40人，投影仪、视频会议。',
        resourceId: undefined,
      },
      {
        id: 'static-expert-1',
        name: '张教授咨询室',
        kind: '专家',
        location: 'A栋-1F-辅导室',
        status: '空闲',
        detail: '细胞治疗领域 · 排班：周二/四下午',
        resourceId: 'res-academician',
      },
    ]
  }, [spaces, buildingById])

  const mergedRows: DisplayRow[] = useMemo(() => {
    const fromRes = resources
      .map(mapResourceToRow)
      .filter((x): x is Row => x != null && x.id !== 'res-academician')
      .map((r) => ({ ...r, source: resources.find((x) => x.id === r.resourceId) }))
    const staticDisplay: DisplayRow[] = staticRows.map((r) => ({
      ...r,
      status: statusOverrides[r.resourceId ?? r.id] ?? r.status,
      source: r.resourceId ? resources.find((x) => x.id === r.resourceId) : undefined,
    }))
    const resPart = fromRes.map((r) => ({
      ...r,
      status: statusOverrides[r.id] ?? r.status,
      source: resources.find((x) => x.id === r.resourceId),
    }))
    return [...staticDisplay, ...resPart]
  }, [resources, staticRows, statusOverrides])

  const forTypeCounts = useMemo(
    () => mergedRows.filter((r) => matchesSearch(r, searchQ)).filter((r) => statusFilter === '全部' || r.status === statusFilter),
    [mergedRows, searchQ, statusFilter],
  )

  const forStatusCounts = useMemo(
    () => mergedRows.filter((r) => matchesSearch(r, searchQ)).filter((r) => typeFilter === '全部' || r.kind === typeFilter),
    [mergedRows, searchQ, typeFilter],
  )

  const typePills = useMemo(() => {
    const total = forTypeCounts.length
    const byKind = (k: ResKind) => forTypeCounts.filter((r) => r.kind === k).length
    return [{ key: '全部' as const, label: '全部', count: total }, ...KIND_ORDER.map((k) => ({ key: k, label: k, count: byKind(k) }))]
  }, [forTypeCounts])

  const statusPillsWithCounts = useMemo(() => {
    return STATUS_PILLS.map((p) => ({
      ...p,
      count:
        p.value === '全部'
          ? forStatusCounts.length
          : forStatusCounts.filter((r) => r.status === p.value).length,
    }))
  }, [forStatusCounts])

  const rows = useMemo(() => {
    return mergedRows.filter((r) => {
      if (typeFilter !== '全部' && r.kind !== typeFilter) return false
      if (statusFilter !== '全部' && r.status !== statusFilter) return false
      if (!matchesSearch(r, searchQ)) return false
      return true
    })
  }, [mergedRows, typeFilter, statusFilter, searchQ])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pagedRows = useMemo(() => {
    const safe = Math.min(page, totalPages)
    const start = (safe - 1) * PAGE_SIZE
    return rows.slice(start, start + PAGE_SIZE)
  }, [rows, page, totalPages])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const exportCsv = () => {
    const header = ['类型', '资源名称', '位置', '状态', '关键属性']
    const lines = rows.map((r) =>
      [kindTypeLabel(r.kind, r.labShare), r.name, r.location, r.status, keyAttrSummary(r)]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    )
    const blob = new Blob([`\uFEFF${[header.join(','), ...lines].join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `资源空间分布_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.show('已导出当前筛选结果为 CSV（演示）', 'success')
  }

  const openBooking = (r: DisplayRow) => {
    if (r.status !== '空闲') {
      toast.show('当前资源不可预约（仅空闲可发起演示预约）', 'info')
      return
    }
    setBookingRow(r)
    setBookDate(new Date().toISOString().slice(0, 10))
    setBookStart('14:00')
    setBookEnd('16:00')
    setBookPurpose('')
    setBookTech(false)
    setBookTrain(false)
  }

  const submitBooking = () => {
    if (!bookingRow) return
    if (!bookPurpose.trim()) {
      toast.show('请填写使用用途', 'info')
      return
    }
    const key = bookingRow.resourceId ?? bookingRow.id
    setStatusOverrides((prev) => ({ ...prev, [key]: '已预约' }))
    setBookingRow(null)
    setDetailRow((d) => (d && (d.resourceId ?? d.id) === key ? { ...d, status: '已预约' } : d))
    toast.show('预约成功（演示）：时段已占位，卡片状态已更新为「已预约」', 'success')
  }

  const detailOpenHours = (r: DisplayRow) => r.source?.hours ?? '周一至周五 09:00–18:00（演示）'
  const detailOwner = (r: DisplayRow) => ({
    name: r.source?.contactName ?? (r.kind === '会议室' ? '行政前台' : '李工'),
    phone: r.source?.phone ?? '13812345678',
  })

  const canBook = (r: DisplayRow) => r.status === '空闲'

  const pagination = (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[13px]">
      <button
        type="button"
        className="rounded-md border border-divider px-2 py-1 font-semibold hover:bg-muted/40 disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
      >
        上一页
      </button>
      <span className="tabular-nums text-muted">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        className="rounded-md border border-divider px-2 py-1 font-semibold hover:bg-muted/40 disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
      >
        下一页
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      <ModuleIntroCard
        title="📌 资源空间分布"
        lines={[
          '孪生台账位置与资源运营上架资源对齐；类型 / 状态药丸带计数，可与搜索联动。',
          '「详情」「预约」为弹窗交互（演示）；预约成功后本地状态更新为「已预约」，生产可接冲突校验与 WebSocket。',
        ]}
      />
      <h1 className="text-lg font-bold text-foreground">资源空间分布</h1>

      <div className="space-y-3 rounded-[var(--radius-card)] border border-divider bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-muted">视图</span>
            <div className="flex rounded-lg border border-divider p-0.5 text-[12px] font-semibold">
              <button
                type="button"
                className={cn('rounded-md px-2.5 py-1.5 sm:px-3', view === 'card' ? 'bg-primary text-white' : 'text-muted hover:bg-muted/40')}
                onClick={() => setView('card')}
              >
                {view === 'card' ? '●' : '○'} 卡片视图
              </button>
              <button
                type="button"
                className={cn('rounded-md px-2.5 py-1.5 sm:px-3', view === 'list' ? 'bg-primary text-white' : 'text-muted hover:bg-muted/40')}
                onClick={() => setView('list')}
              >
                {view === 'list' ? '●' : '○'} 列表视图
              </button>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:max-w-xl">
            <button
              type="button"
              disabled={view !== 'list'}
              title={view !== 'list' ? '请切换到列表视图后导出' : undefined}
              className={cn(
                'shrink-0 rounded-md border px-3 py-2 text-[12px] font-semibold',
                view === 'list' ? 'border-divider hover:border-primary' : 'cursor-not-allowed border-divider text-muted opacity-50',
              )}
              onClick={exportCsv}
            >
              导出
            </button>
            <div className="relative min-w-[12rem] max-w-md flex-1">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] opacity-50" aria-hidden>
                🔍
              </span>
              <input
                type="search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="搜索资源…"
                className="w-full rounded-md border border-divider bg-card py-2 pl-8 pr-2 text-[13px] outline-none ring-primary focus:ring-2"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-divider pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-muted">类型</span>
            {typePills.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setTypeFilter(p.key)}
                className={cn(
                  'rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors',
                  typeFilter === p.key ? 'border-primary bg-primary/12 text-primary' : 'border-divider bg-card text-muted hover:border-primary/35',
                )}
              >
                {p.label}（{p.count}）
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-muted">状态</span>
            {statusPillsWithCounts.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setStatusFilter(p.value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors',
                  statusFilter === p.value ? 'border-primary bg-primary/12 text-primary' : 'border-divider bg-card text-muted hover:border-primary/35',
                )}
              >
                {statusFilter === p.value ? '●' : '○'} {p.label}（{p.count}）
              </button>
            ))}
            <span className="text-[11px] text-muted">「已预约」请在「全部」状态下查看，或收窄搜索。</span>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-divider bg-muted/10 px-4 py-6 text-center text-[13px] text-muted">当前筛选条件下暂无资源。</p>
      ) : view === 'card' ? (
        <>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {pagedRows.map((r) => {
              const dot = statusDot(r.status)
              const em = kindEmoji(r.kind, r.name)
              const chrome = cardStatusChrome(r.status)
              const extras = cardDetailRows(r)
              const book = canBook(r)

              return (
                <div key={r.id} className={cn('flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md', chrome)}>
                  <div className={cn('flex items-center gap-2 px-3 py-2 text-[12px] font-bold', kindHeaderBar(r.kind))}>
                    <span className="text-lg leading-none" aria-hidden>
                      {em}
                    </span>
                    <span>{kindTypeLabel(r.kind, r.labShare)}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <button
                      type="button"
                      className="text-left text-[15px] font-bold text-primary hover:underline"
                      onClick={() => setDetailRow(r)}
                    >
                      {r.name}
                    </button>
                    <p className="mt-2 text-[12px] text-foreground/85">
                      <span className="font-semibold text-muted">位置：</span>
                      {r.location}
                    </p>
                    <p className="mt-1 text-[12px]">
                      <span className="font-semibold text-muted">状态：</span>
                      <span className={cn('inline-flex items-center gap-1 font-semibold', dot.cls)}>
                        <span aria-hidden>{dot.emoji}</span>
                        {r.status}
                      </span>
                    </p>
                    <dl className="mt-3 space-y-1.5 text-[12px]">
                      {extras.map((x) => (
                        <div key={x.label} className="flex gap-1">
                          <dt className="shrink-0 font-semibold text-muted">{x.label}</dt>
                          <dd className="min-w-0 text-foreground/90">{x.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-divider/70 pt-3">
                      <button type="button" className="rounded-md border border-divider px-3 py-1.5 text-[12px] font-bold hover:bg-muted/40" onClick={() => setDetailRow(r)}>
                        详情
                      </button>
                      {book ? (
                        <button type="button" className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-bold text-white hover:bg-primary-hover" onClick={() => openBooking(r)}>
                          预约
                        </button>
                      ) : (
                        <button type="button" disabled className="cursor-not-allowed rounded-md border border-divider bg-muted/50 px-3 py-1.5 text-[12px] font-bold text-muted">
                          预约
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {totalPages > 1 ? pagination : null}
        </>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-divider bg-card shadow-sm">
            <table className="w-full min-w-[960px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-divider bg-muted/30 text-[11px] font-semibold text-muted">
                  <th className="px-3 py-2">类型</th>
                  <th className="px-3 py-2">资源名称</th>
                  <th className="px-3 py-2">位置</th>
                  <th className="px-3 py-2">状态</th>
                  <th className="px-3 py-2">关键属性</th>
                  <th className="px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r) => {
                  const dot = statusDot(r.status)
                  const em = kindEmoji(r.kind, r.name)
                  const book = canBook(r)
                  return (
                    <tr key={r.id} className="border-b border-divider/60 hover:bg-muted/10">
                      <td className="px-3 py-2">
                        <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold', kindHeaderBar(r.kind))}>
                          <span aria-hidden>{em}</span>
                          {kindTypeLabel(r.kind, r.labShare)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setDetailRow(r)}>
                          {r.name}
                        </button>
                      </td>
                      <td className="max-w-[200px] px-3 py-2 text-muted" title={r.location}>
                        {r.location}
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn('inline-flex items-center gap-1 font-semibold', dot.cls)}>
                          <span aria-hidden>{dot.emoji}</span>
                          {r.status}
                        </span>
                      </td>
                      <td className="max-w-[280px] px-3 py-2 text-[12px] text-muted" title={keyAttrSummary(r)}>
                        {keyAttrSummary(r)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="text-[12px] font-semibold text-primary hover:underline" onClick={() => setDetailRow(r)}>
                            详情
                          </button>
                          {book ? (
                            <button type="button" className="text-[12px] font-semibold text-primary hover:underline" onClick={() => openBooking(r)}>
                              预约
                            </button>
                          ) : (
                            <span className="text-[12px] font-semibold text-muted">预约</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? pagination : null}
        </>
      )}

      <Modal
        open={detailRow != null}
        title={detailRow ? `资源详情 — ${detailRow.name}` : ''}
        onClose={() => setDetailRow(null)}
        panelClassName="max-w-xl"
        footer={
          detailRow ? (
            <div className="flex w-full flex-wrap gap-2">
              {canBook(detailRow) ? (
                <button
                  type="button"
                  className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover"
                  onClick={() => {
                    const d = detailRow
                    setDetailRow(null)
                    openBooking(d)
                  }}
                >
                  预约此资源
                </button>
              ) : null}
              <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px] font-bold hover:bg-muted/40" onClick={() => toast.show('已加入收藏（演示）', 'info')}>
                收藏
              </button>
              {detailRow.resourceId ? (
                <Link
                  to={`/resops/resource/${encodeURIComponent(detailRow.resourceId)}`}
                  className="rounded-md border border-divider px-3 py-2 text-[12px] font-bold text-primary hover:bg-muted/40"
                >
                  打开台账页
                </Link>
              ) : null}
              <button type="button" className="ms-auto rounded-md border border-divider px-3 py-2 text-[12px] font-bold hover:bg-muted/40" onClick={() => setDetailRow(null)}>
                关闭
              </button>
            </div>
          ) : null
        }
      >
        {detailRow ? (
          <div className="space-y-4 text-[13px]">
            <section>
              <h3 className="text-[12px] font-bold text-muted">基本信息</h3>
              <ul className="mt-2 space-y-1 text-foreground">
                <li>
                  <span className="text-muted">名称：</span>
                  {detailRow.name}
                </li>
                <li>
                  <span className="text-muted">类型：</span>
                  {kindTypeLabel(detailRow.kind, detailRow.labShare)}
                </li>
                <li>
                  <span className="text-muted">位置：</span>
                  {detailRow.location}
                  <button type="button" className="ms-2 text-primary hover:underline" onClick={() => toast.show('孪生地图定位（演示）', 'info')}>
                    地图
                  </button>
                </li>
                <li>
                  <span className="text-muted">状态：</span>
                  <span className={cn('inline-flex items-center gap-1 font-semibold', statusDot(detailRow.status).cls)}>
                    <span aria-hidden>{statusDot(detailRow.status).emoji}</span>
                    {detailRow.status}
                  </span>
                </li>
                <li>
                  <span className="text-muted">负责人：</span>
                  {detailOwner(detailRow).name}（电话 {maskPhone(detailOwner(detailRow).phone)}）
                </li>
              </ul>
            </section>
            <section>
              <h3 className="text-[12px] font-bold text-muted">开放时间与技术参数</h3>
              <p className="mt-1 text-muted">开放时间：{detailOpenHours(detailRow)}</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-[12px] text-foreground/90">
                {techParamBullets(detailRow).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="text-[12px] font-bold text-muted">使用须知</h3>
              <ul className="mt-1 list-inside list-disc space-y-1 text-[12px] text-muted">
                {noticeLines(detailRow).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="text-[12px] font-bold text-muted">最近预约记录</h3>
              <ul className="mt-1 space-y-1 font-mono text-[11px] text-muted">
                {demoHistoryLines(detailRow).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <button type="button" className="mt-2 text-[12px] font-semibold text-primary hover:underline" onClick={() => toast.show('历史预约列表（演示）', 'info')}>
                查看全部历史预约
              </button>
            </section>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={bookingRow != null}
        title="预约资源"
        onClose={() => setBookingRow(null)}
        closeOnOverlayClick={false}
        panelClassName="max-w-lg"
        footer={
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[12px] font-bold hover:bg-muted/40" onClick={() => setBookingRow(null)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-[12px] font-bold text-white hover:bg-primary-hover" onClick={submitBooking}>
              提交预约
            </button>
          </>
        }
      >
        {bookingRow ? (
          <div className="space-y-3 text-[13px]">
            <ul className="space-y-1 rounded-lg border border-divider bg-muted/10 p-3 text-[12px]">
              <li>
                <span className="text-muted">资源名称：</span>
                <span className="font-semibold">{bookingRow.name}</span>
              </li>
              <li>
                <span className="text-muted">资源类型：</span>
                {kindTypeLabel(bookingRow.kind, bookingRow.labShare)}
              </li>
              <li>
                <span className="text-muted">位置：</span>
                {bookingRow.location}
              </li>
              <li>
                <span className="text-muted">开放时间：</span>
                {detailOpenHours(bookingRow)}
              </li>
            </ul>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-[12px]">
                <span className="font-semibold text-muted">预约日期</span>
                <input type="date" className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5" value={bookDate} onChange={(e) => setBookDate(e.target.value)} />
              </label>
              <label className="text-[12px]">
                <span className="font-semibold text-muted">开始时间</span>
                <input type="time" className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5" value={bookStart} onChange={(e) => setBookStart(e.target.value)} />
              </label>
              <label className="text-[12px]">
                <span className="font-semibold text-muted">结束时间</span>
                <input type="time" className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5" value={bookEnd} onChange={(e) => setBookEnd(e.target.value)} />
              </label>
            </div>
            <label className="block text-[12px]">
              <span className="font-semibold text-muted">使用用途</span>
              <textarea
                className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-2 text-[13px]"
                rows={2}
                placeholder="例：细胞表面标记分析实验"
                value={bookPurpose}
                onChange={(e) => setBookPurpose(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-4 text-[12px]">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={bookTech} onChange={(e) => setBookTech(e.target.checked)} />
                需要技术人员协助
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={bookTrain} onChange={(e) => setBookTrain(e.target.checked)} />
                需要培训
              </label>
            </div>
            <ul className="space-y-0.5 text-[12px] text-muted">
              <li>
                <span className="text-muted">预约人：</span>
                {applicantName}
              </li>
              <li>
                <span className="text-muted">所属项目：</span>
                {defaultProjectName}
              </li>
            </ul>
            <p className="rounded-md border border-[#FF8A34]/30 bg-[#FF8A34]/10 px-2 py-1.5 text-[11px] text-[#A65000]">请按时使用；取消需提前 2 小时（演示规则）。</p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
