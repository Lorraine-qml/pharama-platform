import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import type { UserRole } from '../../auth/types'
import { Modal } from '../../components/Modal'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import type { HatchProjectStatus } from '../hatch/hatchTypes'
import { useTwinInfra } from './TwinInfraContext'
import type { TwinSpace } from './twinInfraTypes'

type ViewMode = 'list' | 'card'

type RowStatus =
  | '正常占用'
  | '即将到期'
  | '扩租意向'
  | '扩租处理中'
  | '已扩租'
  | '已处理'
  | '退租中'
  | '虚拟项目'

type ProjectKindFilter = '全部' | '实体' | '虚拟'

type StatusPill = '全部' | '即将到期' | '扩租意向' | '正常'

type SpaceRow = {
  roomCode: string
  areaM2: number
  purposeUse: string
  occupyStart: string
}

type ProjectSpaceRow = {
  projectId: string
  name: string
  rooms: string
  area: number
  status: RowStatus
  endLabel: string
  incubationType: string
  archiveStatus: HatchProjectStatus
  spaceRows: SpaceRow[]
  occupiedSpaces: TwinSpace[]
  /** 虚拟入孵且无占用空间 */
  isVirtualNoSpace: boolean
}

const VIEW_STORAGE_KEY = 'pharma-twin-project-space-view'
const PAGE_SIZE = 9

const STATUS_PILLS: { label: string; value: StatusPill }[] = [
  { label: '全部', value: '全部' },
  { label: '即将到期', value: '即将到期' },
  { label: '扩租意向', value: '扩租意向' },
  { label: '正常', value: '正常' },
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

function parseDay(s?: string | null): number | null {
  if (!s) return null
  const t = Date.parse(s.slice(0, 10))
  return Number.isFinite(t) ? t : null
}

function daysBetween(a: number, b: number) {
  return Math.round((a - b) / (24 * 3600 * 1000))
}

function purposeFromSpace(s: TwinSpace): string {
  if (s.roomType === '实验室') return '实验'
  if (s.roomType === '办公室') return '办公'
  return s.purpose || s.roomType
}

function expansionCleanTags(tags: string[]) {
  return tags.filter(
    (t) =>
      !t.includes('扩租意向') &&
      t !== '已扩租' &&
      !t.includes('扩租处理中') &&
      !t.includes('扩租审批完成') &&
      !t.includes('扩租已处理'),
  )
}

function matchesSearch(r: ProjectSpaceRow, q: string) {
  const t = q.trim()
  if (!t) return true
  return r.name.includes(t)
}

function matchesStatusPill(r: ProjectSpaceRow, pill: StatusPill): boolean {
  if (pill === '全部') return true
  if (pill === '即将到期') return r.status === '即将到期'
  if (pill === '扩租意向') return r.status === '扩租意向'
  return (
    r.status === '正常占用' ||
    r.status === '退租中' ||
    r.status === '已扩租' ||
    r.status === '扩租处理中' ||
    r.status === '已处理'
  )
}

function matchesTypePill(r: ProjectSpaceRow, pill: ProjectKindFilter): boolean {
  if (pill === '全部') return true
  if (pill === '虚拟') return r.isVirtualNoSpace
  return !r.isVirtualNoSpace
}

function deriveRowStatus(
  a: { status: HatchProjectStatus; tags: string[] },
  minEnd: number | null | undefined,
  today: number,
): RowStatus {
  if (a.status === '毕业' || a.status === '退出') return '退租中'
  const tags = a.tags
  if (tags.some((t) => t.includes('已扩租'))) return '已扩租'
  if (tags.some((t) => t.includes('扩租已处理') || t.includes('扩租审批完成'))) return '已处理'
  if (tags.some((t) => t.includes('扩租处理中') || t.includes('扩租审核'))) return '扩租处理中'
  if (tags.some((t) => t.includes('扩租'))) return '扩租意向'
  if (minEnd != null) {
    const d = daysBetween(minEnd, today)
    if (d <= 30) return '即将到期'
  }
  return '正常占用'
}

function statusClass(s: RowStatus) {
  if (s === '即将到期') return 'bg-[#FF8A34]/18 text-[#C65D00] ring-1 ring-[#FF8A34]/35'
  if (s === '扩租意向') return 'bg-[#1E6DFF]/14 text-[#1E4DCC] ring-1 ring-[#1E6DFF]/25'
  if (s === '扩租处理中') return 'bg-[#1E6DFF]/10 text-[#1E4DCC] ring-1 ring-[#1E6DFF]/20'
  if (s === '已扩租') return 'bg-success/12 text-[#008A72] ring-1 ring-success/25'
  if (s === '已处理') return 'bg-muted/50 text-muted-foreground ring-1 ring-divider'
  if (s === '退租中') return 'bg-danger/12 text-danger ring-1 ring-danger/20'
  if (s === '虚拟项目') return 'bg-muted/40 text-muted ring-1 ring-divider'
  return 'bg-success/12 text-[#008A72] ring-1 ring-success/25'
}

function statusSecondaryLabel(s: RowStatus): string | null {
  if (s === '即将到期') return '即将到期'
  if (s === '扩租意向') return '扩租意向'
  if (s === '扩租处理中') return '处理中'
  if (s === '已扩租') return '已扩租'
  if (s === '已处理') return '已处理'
  return null
}

function cardStatusDisplay(s: RowStatus): { emoji: string; text: string } {
  if (s === '即将到期') return { emoji: '🟠', text: '即将到期' }
  if (s === '扩租意向' || s === '扩租处理中') return { emoji: '🔵', text: s === '扩租处理中' ? '扩租处理中' : '扩租意向' }
  if (s === '已扩租') return { emoji: '🟢', text: '已扩租' }
  if (s === '已处理') return { emoji: '✅', text: '已处理' }
  if (s === '虚拟项目') return { emoji: '⚪', text: '虚拟项目' }
  if (s === '退租中') return { emoji: '🔴', text: '退租中' }
  return { emoji: '🟢', text: '正常占用' }
}

function projectEmoji(name: string): string {
  if (name.includes('基因')) return '🧬'
  if (name.includes('AI')) return '🤖'
  if (name.includes('细胞')) return '🔬'
  if (name.includes('抗体')) return '💊'
  return '📁'
}

function domainLabel(name: string, tags: string[]): string {
  if (name.includes('基因')) return '基因治疗'
  if (name.includes('AI')) return 'AI 制药'
  if (name.includes('细胞')) return '细胞治疗'
  if (name.includes('抗体')) return '抗体药物'
  const t = tags.find((x) => !x.includes('扩租') && x !== '高潜力')
  return t ?? '—'
}

function contractNo(projectId: string): string {
  const n = projectId.replace(/\D/g, '').slice(-3).padStart(3, '0')
  return `HT-2024-${n}`
}

function maskPhone(p: string) {
  if (!p || p.length < 7) return p || '—'
  return `${p.slice(0, 3)}****${p.slice(-4)}`
}

function kindHeaderBar(isVirtual: boolean): string {
  return isVirtual ? 'bg-slate-200/80 text-slate-700 border-b border-slate-300/80' : 'bg-[#1e3a5f]/18 text-[#0f2744] border-b border-[#1e3a5f]/30'
}

export default function TwinProjectSpaceDistributionPage() {
  const toast = useToast()
  const { user } = useAuth()
  const { archives, contracts, setArchiveTags } = useHatchMgmt()
  const { spaces, buildingById } = useTwinInfra()

  const isOps = user?.role === 'platform'

  const [view, setView] = useState<ViewMode>(() => readSavedView() ?? defaultViewForRole(user?.role))
  const [typeFilter, setTypeFilter] = useState<ProjectKindFilter>('全部')
  const [statusPill, setStatusPill] = useState<StatusPill>('全部')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const [detailRow, setDetailRow] = useState<ProjectSpaceRow | null>(null)
  const [detailTab, setDetailTab] = useState<'history' | 'contract'>('history')

  const [expandRow, setExpandRow] = useState<ProjectSpaceRow | null>(null)
  const [expandDecision, setExpandDecision] = useState<'approve' | 'reject' | 'hold'>('approve')
  const [expandRoomIds, setExpandRoomIds] = useState<string[]>([])
  const [expandReason, setExpandReason] = useState('')
  const [expandOpinion, setExpandOpinion] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view)
    } catch {
      /* ignore */
    }
  }, [view])

  useEffect(() => {
    setPage(1)
  }, [typeFilter, statusPill, q])

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }, [])

  const mergedRows: ProjectSpaceRow[] = useMemo(() => {
    const occ = spaces.filter((s) => s.status === '占用' && s.projectId)
    const byProj = new Map<string, TwinSpace[]>()
    for (const s of occ) {
      const xs = byProj.get(s.projectId!) ?? []
      xs.push(s)
      byProj.set(s.projectId!, xs)
    }

    const out: ProjectSpaceRow[] = []

    for (const a of archives) {
      const list = byProj.get(a.id) ?? []
      if (a.incubationType === '虚拟' && list.length === 0) {
        out.push({
          projectId: a.id,
          name: a.name,
          rooms: '（无实体空间）',
          area: 0,
          status: '虚拟项目',
          endLabel: '无',
          incubationType: a.incubationType,
          archiveStatus: a.status,
          spaceRows: [],
          occupiedSpaces: [],
          isVirtualNoSpace: true,
        })
        continue
      }
      if (list.length === 0) continue

      const roomLabels = list.map((s) => {
        const b = buildingById(s.buildingId)
        const bn = b?.name ?? '—'
        return `${bn}-${s.floor}-${s.name}`
      })
      const area = list.reduce((n, s) => n + s.areaM2, 0)
      const endDates = list.map((s) => parseDay(s.occupyEnd)).filter((x): x is number => x != null)
      const contractEnd = parseDay(a.contractEnd)
      const minEnd = [...endDates, contractEnd].filter((x): x is number => x != null).sort((x, y) => x - y)[0]
      const endLabel = minEnd ? new Date(minEnd).toISOString().slice(0, 10) : '—'

      const status = deriveRowStatus(a, minEnd, today)

      const spaceRows: SpaceRow[] = list.map((s) => {
        const b = buildingById(s.buildingId)
        return {
          roomCode: b ? `${b.code}-${s.floor}-${s.name}` : s.code,
          areaM2: s.areaM2,
          purposeUse: purposeFromSpace(s),
          occupyStart: (s.occupyStart ?? '—').slice(0, 10),
        }
      })

      out.push({
        projectId: a.id,
        name: a.name,
        rooms: roomLabels.join('，'),
        area,
        status,
        endLabel,
        incubationType: a.incubationType,
        archiveStatus: a.status,
        spaceRows,
        occupiedSpaces: list,
        isVirtualNoSpace: false,
      })
    }

    return out
  }, [archives, spaces, buildingById, today])

  const forTypeCounts = useMemo(
    () => mergedRows.filter((r) => matchesSearch(r, q)).filter((r) => matchesStatusPill(r, statusPill)),
    [mergedRows, q, statusPill],
  )

  const forStatusCounts = useMemo(
    () => mergedRows.filter((r) => matchesSearch(r, q)).filter((r) => matchesTypePill(r, typeFilter)),
    [mergedRows, q, typeFilter],
  )

  const typePills = useMemo(() => {
    const total = forTypeCounts.length
    const ent = forTypeCounts.filter((r) => !r.isVirtualNoSpace).length
    const virt = forTypeCounts.filter((r) => r.isVirtualNoSpace).length
    return [
      { key: '全部' as const, label: '全部', count: total },
      { key: '实体' as const, label: '实体项目', count: ent },
      { key: '虚拟' as const, label: '虚拟项目', count: virt },
    ]
  }, [forTypeCounts])

  const statusPillsWithCounts = useMemo(() => {
    return STATUS_PILLS.map((p) => ({
      ...p,
      count: forStatusCounts.filter((r) => matchesStatusPill(r, p.value)).length,
    }))
  }, [forStatusCounts])

  const rows = useMemo(() => {
    return mergedRows.filter((r) => {
      if (!matchesSearch(r, q)) return false
      if (!matchesTypePill(r, typeFilter)) return false
      if (!matchesStatusPill(r, statusPill)) return false
      return true
    })
  }, [mergedRows, q, typeFilter, statusPill])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pagedRows = useMemo(() => {
    const safe = Math.min(page, totalPages)
    const start = (safe - 1) * PAGE_SIZE
    return rows.slice(start, start + PAGE_SIZE)
  }, [rows, page, totalPages])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const freeSpaceOptions = useMemo(() => spaces.filter((s) => s.status === '空闲' && !s.projectId), [spaces])

  const exportCsv = () => {
    const header = ['类型', '项目名称', '占用房间', '面积(㎡)', '到期日', '状态']
    const lines = rows.map((r) => {
      const typ = r.isVirtualNoSpace ? '虚拟' : '实体'
      const areaStr = r.isVirtualNoSpace ? '—' : String(r.area)
      const endStr = r.isVirtualNoSpace ? '无' : r.endLabel
      return [typ, r.name, r.rooms.replace(/,/g, '；'), areaStr, endStr, r.status].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
    })
    const blob = new Blob([`\uFEFF${[header.join(','), ...lines].join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `项目空间分布_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.show('已导出当前筛选结果为 CSV（演示）', 'success')
  }

  const archiveById = (id: string) => archives.find((x) => x.id === id)
  const contractForProject = (projectId: string) => contracts.find((c) => c.projectId === projectId)

  const openDetail = (r: ProjectSpaceRow) => {
    setDetailTab('history')
    setDetailRow(r)
  }

  const openExpandProcess = (r: ProjectSpaceRow) => {
    setExpandRow(r)
    setExpandDecision('approve')
    setExpandRoomIds(freeSpaceOptions[0]?.id ? [freeSpaceOptions[0].id] : [])
    setExpandReason('')
    setExpandOpinion('')
  }

  const toggleExpandRoom = (id: string) => {
    setExpandRoomIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const submitExpansion = () => {
    if (!expandRow) return
    const a = archiveById(expandRow.projectId)
    if (!a) return

    const baseTags = expansionCleanTags(a.tags)

    if (expandDecision === 'approve') {
      if (expandRoomIds.length === 0) {
        toast.show('请至少选择一间拟分配房间', 'info')
        return
      }
      setArchiveTags(expandRow.projectId, [...baseTags, '已扩租'])
      toast.show('已记录为「已扩租」（演示）：状态将更新为已扩租', 'success')
    } else if (expandDecision === 'reject') {
      if (!expandReason.trim()) {
        toast.show('请填写拒绝原因', 'info')
        return
      }
      setArchiveTags(expandRow.projectId, [...baseTags, '扩租审批完成'])
      toast.show('已拒绝扩租意向，状态更新为「已处理」（演示）', 'success')
    } else {
      if (!expandReason.trim()) {
        toast.show('请填写沟通备注', 'info')
        return
      }
      setArchiveTags(expandRow.projectId, [...baseTags, '扩租处理中'])
      toast.show('已标记为扩租处理中（演示）', 'success')
    }
    setExpandRow(null)
  }

  const detailArchive = detailRow ? archiveById(detailRow.projectId) : undefined
  const detailContract = detailRow ? contractForProject(detailRow.projectId) : undefined

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
        title="📌 项目空间分布"
        lines={[
          '与资源空间分布一致：双行药丸筛选 + 实体/虚拟色条头卡片；虚拟项目无面积与到期日占位。',
          '「查看详情」「处理意向」为弹窗；导出仅在列表视图；已移除面积汇总饼图。',
        ]}
      />
      <h1 className="text-lg font-bold text-foreground">项目空间分布</h1>

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
              onClick={() => exportCsv()}
            >
              导出
            </button>
            <div className="relative min-w-[12rem] max-w-md flex-1">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] opacity-50" aria-hidden>
                🔍
              </span>
              <input
                type="search"
                className="w-full rounded-md border border-divider bg-card py-2 pl-8 pr-2 text-[13px] outline-none ring-primary focus:ring-2"
                placeholder="搜索项目名称…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
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
                onClick={() => setStatusPill(p.value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors',
                  statusPill === p.value ? 'border-primary bg-primary/12 text-primary' : 'border-divider bg-card text-muted hover:border-primary/35',
                )}
              >
                {statusPill === p.value ? '●' : '○'} {p.label}（{p.count}）
              </button>
            ))}
            <span className="text-[11px] text-muted">「虚拟项目」请用类型药丸筛选；退租/已扩租等归入「正常」。</span>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-divider bg-muted/10 px-4 py-6 text-center text-[13px] text-muted">当前筛选条件下暂无项目。</p>
      ) : view === 'list' ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-divider bg-card shadow-sm">
            <table className="w-full min-w-[1000px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-divider bg-muted/30 text-[11px] font-semibold text-muted">
                  <th className="px-3 py-2">类型</th>
                  <th className="px-3 py-2">项目名称</th>
                  <th className="px-3 py-2">占用房间</th>
                  <th className="px-3 py-2">面积</th>
                  <th className="px-3 py-2">到期日</th>
                  <th className="px-3 py-2">状态</th>
                  <th className="px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r) => {
                  const st = cardStatusDisplay(r.status)
                  const showProcess = isOps && r.status === '扩租意向'
                  const showTenantExpand = !isOps && r.status === '扩租意向'
                  return (
                    <tr key={r.projectId} className="border-b border-divider/60 hover:bg-muted/10">
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold',
                            kindHeaderBar(r.isVirtualNoSpace),
                          )}
                        >
                          <span aria-hidden>{r.isVirtualNoSpace ? '🌐' : '🏢'}</span>
                          {r.isVirtualNoSpace ? '虚拟' : '实体'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" className="text-left font-semibold text-primary hover:underline" onClick={() => openDetail(r)}>
                          {r.name}
                        </button>
                      </td>
                      <td className="max-w-[260px] px-3 py-2 text-muted" title={r.rooms}>
                        {r.isVirtualNoSpace ? '（无实体空间）' : r.rooms}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-foreground">{r.isVirtualNoSpace ? '—' : `${r.area}㎡`}</td>
                      <td className="px-3 py-2 tabular-nums text-muted">{r.isVirtualNoSpace ? '无' : r.endLabel}</td>
                      <td className="px-3 py-2">
                        <span className={cn('inline-flex items-center gap-1 font-semibold', st.text === '虚拟项目' ? 'text-muted' : '')}>
                          <span aria-hidden>{st.emoji}</span>
                          {st.text}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="text-[12px] font-semibold text-primary hover:underline" onClick={() => openDetail(r)}>
                            查看详情
                          </button>
                          {showProcess ? (
                            <button type="button" className="text-[12px] font-semibold text-primary hover:underline" onClick={() => openExpandProcess(r)}>
                              处理意向
                            </button>
                          ) : null}
                          {showTenantExpand ? (
                            <button type="button" className="text-[12px] font-semibold text-primary hover:underline" onClick={() => toast.show('扩租申请已打开草稿（演示）', 'info')}>
                              扩租申请
                            </button>
                          ) : null}
                          {isOps && (r.status === '退租中' || r.archiveStatus === '毕业') ? (
                            <button
                              type="button"
                              className="text-[12px] font-semibold text-danger hover:underline"
                              onClick={() => toast.show('释放空间流程（演示）', 'info')}
                            >
                              释放空间
                            </button>
                          ) : null}
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
      ) : (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {pagedRows.map((r) => {
              const st = cardStatusDisplay(r.status)
              const showProcess = isOps && r.status === '扩租意向'
              const showTenantExpand = !isOps && r.status === '扩租意向'
              const chrome =
                r.status === '即将到期'
                  ? 'border-[#FF8A34]/28 bg-[#FF8A34]/[0.04]'
                  : r.status === '扩租意向' || r.status === '扩租处理中'
                    ? 'border-[#1E6DFF]/22 bg-[#1E6DFF]/[0.035]'
                    : r.isVirtualNoSpace
                      ? 'border-divider bg-card'
                      : r.status === '退租中'
                        ? 'border-danger/25 bg-danger/[0.04]'
                        : 'border-divider bg-card'

              return (
                <div
                  key={r.projectId}
                  className={cn('flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md', chrome)}
                >
                  <div className={cn('flex items-center gap-2 px-3 py-2 text-[12px] font-bold', kindHeaderBar(r.isVirtualNoSpace))}>
                    <span className="text-lg leading-none" aria-hidden>
                      {r.isVirtualNoSpace ? '🌐' : '🏢'}
                    </span>
                    <span>{r.isVirtualNoSpace ? '虚拟' : '实体'}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xl leading-none text-muted" aria-hidden>
                        {projectEmoji(r.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <button type="button" className="text-left text-[15px] font-bold text-primary hover:underline" onClick={() => openDetail(r)}>
                          {r.name}
                        </button>
                      </div>
                    </div>

                    {r.isVirtualNoSpace ? (
                      <>
                        <p className="mt-3 text-[12px] text-muted">（无实体空间）</p>
                        <p className="mt-1 text-[12px] font-medium text-muted">虚拟入孵项目</p>
                        <p className="mt-3 text-[12px]">
                          <span className="font-semibold text-muted">状态：</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-muted">
                            <span aria-hidden>{st.emoji}</span>
                            {st.text}
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-3 text-[12px] font-semibold text-muted">占用房间</p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-foreground/90">{r.rooms}</p>
                        <p className="mt-2 text-[12px]">
                          <span className="font-semibold text-muted">面积：</span>
                          <span className="tabular-nums text-foreground">{r.area}㎡</span>
                        </p>
                        <p className="mt-1 text-[12px]">
                          <span className="font-semibold text-muted">到期日：</span>
                          <span className="tabular-nums text-foreground">{r.endLabel}</span>
                        </p>
                        <p className="mt-1 text-[12px]">
                          <span className="font-semibold text-muted">状态：</span>
                          <span className="font-semibold text-foreground">
                            <span aria-hidden>{st.emoji}</span> {st.text}
                          </span>
                        </p>
                      </>
                    )}

                    <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-divider/70 pt-3">
                      <button type="button" className="rounded-md border border-divider px-3 py-1.5 text-[12px] font-bold hover:bg-muted/40" onClick={() => openDetail(r)}>
                        查看详情
                      </button>
                      {showProcess ? (
                        <button type="button" className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-bold text-white hover:bg-primary-hover" onClick={() => openExpandProcess(r)}>
                          处理意向
                        </button>
                      ) : null}
                      {showTenantExpand ? (
                        <button
                          type="button"
                          className="rounded-md border border-primary/40 px-3 py-1.5 text-[12px] font-bold text-primary hover:bg-primary/5"
                          onClick={() => toast.show('扩租申请已打开草稿（演示）', 'info')}
                        >
                          扩租申请
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {totalPages > 1 ? pagination : null}
        </>
      )}

      <Modal
        open={detailRow != null}
        title={detailRow ? `项目详情 — ${detailRow.name}` : ''}
        onClose={() => setDetailRow(null)}
        panelClassName="max-w-2xl"
        closeOnOverlayClick
        footer={
          detailRow && detailArchive ? (
            <div className="flex w-full flex-wrap gap-2">
              {isOps && detailRow.status === '即将到期' ? (
                <button type="button" className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover" onClick={() => toast.show('续租办理（演示）：跳转合同中心', 'info')}>
                  处理续租
                </button>
              ) : null}
              {detailRow.status === '扩租意向' && isOps ? (
                <button
                  type="button"
                  className="rounded-md border border-primary px-3 py-2 text-[12px] font-bold text-primary hover:bg-primary/5"
                  onClick={() => {
                    const d = detailRow
                    setDetailRow(null)
                    openExpandProcess(d)
                  }}
                >
                  处理意向
                </button>
              ) : null}
              <button type="button" className="ms-auto rounded-md border border-divider px-4 py-2 text-[12px] font-bold hover:bg-muted/30" onClick={() => setDetailRow(null)}>
                关闭
              </button>
            </div>
          ) : null
        }
      >
        {detailRow && detailArchive ? (
          <div className="space-y-5 text-[13px]">
            <section>
              <h3 className="text-[12px] font-bold text-muted">基本信息</h3>
              <ul className="mt-2 space-y-1.5 text-foreground">
                <li>
                  <span className="text-muted">项目类型：</span>
                  {detailRow.isVirtualNoSpace ? '虚拟' : '实体'}
                </li>
                <li>
                  <span className="text-muted">所属领域：</span>
                  {domainLabel(detailArchive.name, detailArchive.tags)}
                </li>
                <li>
                  <span className="text-muted">入孵时间：</span>
                  {detailArchive.incubationStart ?? '—'}
                </li>
                <li>
                  <span className="text-muted">合同编号：</span>
                  {contractNo(detailArchive.id)}
                </li>
                <li>
                  <span className="text-muted">项目负责人：</span>
                  {detailArchive.contact}（电话 {maskPhone(detailArchive.phone)}）
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-[12px] font-bold text-muted">空间占用明细</h3>
              {detailRow.spaceRows.length === 0 ? (
                <p className="mt-2 text-muted">无实体空间占用</p>
              ) : (
                <>
                  <div className="mt-2 overflow-x-auto rounded-lg border border-divider">
                    <table className="w-full min-w-[420px] border-collapse text-left text-[12px]">
                      <thead>
                        <tr className="border-b border-divider bg-muted/30 text-[11px] font-semibold text-muted">
                          <th className="px-2 py-1.5">房间号</th>
                          <th className="px-2 py-1.5">面积(㎡)</th>
                          <th className="px-2 py-1.5">用途</th>
                          <th className="px-2 py-1.5">占用起始日</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailRow.spaceRows.map((s) => (
                          <tr key={s.roomCode} className="border-b border-divider/60">
                            <td className="px-2 py-1.5 font-mono text-[11px]">{s.roomCode}</td>
                            <td className="px-2 py-1.5 tabular-nums">{s.areaM2}</td>
                            <td className="px-2 py-1.5">{s.purposeUse}</td>
                            <td className="px-2 py-1.5 tabular-nums text-muted">{s.occupyStart}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!detailRow.isVirtualNoSpace ? (
                    <p className="mt-2 text-muted">
                      总面积：<span className="font-semibold text-foreground">{detailRow.area}㎡</span>
                      {' · '}
                      到期日：
                      <span className="tabular-nums text-foreground">{detailRow.endLabel}</span>
                      {statusSecondaryLabel(detailRow.status) ? (
                        <span className={cn('ms-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold', statusClass(detailRow.status))}>
                          {statusSecondaryLabel(detailRow.status)}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </>
              )}
            </section>

            <div className="flex gap-2 border-b border-divider pb-2">
              <button
                type="button"
                className={cn('rounded-md px-3 py-1 text-[12px] font-bold', detailTab === 'history' ? 'bg-primary text-white' : 'text-muted hover:bg-muted/40')}
                onClick={() => setDetailTab('history')}
              >
                空间历史记录
              </button>
              <button
                type="button"
                className={cn('rounded-md px-3 py-1 text-[12px] font-bold', detailTab === 'contract' ? 'bg-primary text-white' : 'text-muted hover:bg-muted/40')}
                onClick={() => setDetailTab('contract')}
              >
                合同信息
              </button>
            </div>

            {detailTab === 'history' ? (
              <ul className="list-inside list-disc space-y-1.5 text-[12px] text-muted">
                {(detailArchive.spaceHistory ?? []).length ? (
                  detailArchive.spaceHistory!.map((h) => (
                    <li key={h.id}>
                      {h.time} {h.opType} {h.roomName}（{h.areaM2}㎡）— {h.operator}
                    </li>
                  ))
                ) : (
                  <li>暂无记录</li>
                )}
              </ul>
            ) : (
              <ul className="space-y-1.5 text-[12px] text-muted">
                <li>
                  <span className="text-foreground">合同模板：</span>
                  {detailContract?.templateId === 'tpl-1' ? '标准孵化协议' : detailContract?.templateId === 'tpl-2' ? '虚拟孵化协议' : detailContract?.templateId === 'tpl-3' ? '中试场地协议' : '—'}
                </li>
                <li>
                  <span className="text-foreground">续租选项：</span>
                  {detailContract?.termEnd ? '可续租 1 年（演示）' : '—'}
                </li>
                <li>
                  <span className="text-foreground">合同周期：</span>
                  {detailContract?.termStart ?? '—'} ~ {detailContract?.termEnd ?? '—'}
                </li>
              </ul>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={expandRow != null}
        title={expandRow ? `处理扩租意向 — ${expandRow.name}` : ''}
        onClose={() => setExpandRow(null)}
        closeOnOverlayClick={false}
        panelClassName="max-w-lg"
        footer={
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[12px] font-bold hover:bg-muted/40" onClick={() => setExpandRow(null)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-[12px] font-bold text-white hover:bg-primary-hover" onClick={submitExpansion}>
              提交处理
            </button>
          </>
        }
      >
        {expandRow ? (
          <div className="space-y-4 text-[13px]">
            <p className="text-muted">
              当前占用：<span className="font-semibold text-foreground">{expandRow.rooms}</span>（{expandRow.area}㎡）
            </p>
            <p className="text-muted">
              扩租需求：<span className="text-foreground">计划扩租约 200㎡，希望增加 B 栋 4 层整层（演示文案）</span>
            </p>
            <p className="text-muted">
              意向提交时间：<span className="tabular-nums text-foreground">2025-05-10</span>
            </p>
            <p className="text-muted">
              当前状态：<span className="font-semibold text-foreground">待园区运营审核</span>
            </p>
            <div className="space-y-3 rounded-lg border border-divider bg-muted/10 p-3">
              <p className="text-[12px] font-bold text-foreground">审核操作</p>
              <label className="flex cursor-pointer items-start gap-2 text-[12px]">
                <input type="radio" name="expdec" checked={expandDecision === 'approve'} onChange={() => setExpandDecision('approve')} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  批准扩租 → 选择新房间（可多选）
                  <div className="mt-2 max-h-32 space-y-1 overflow-y-auto rounded-md border border-divider bg-surface p-2">
                    {freeSpaceOptions.length === 0 ? (
                      <span className="text-muted">暂无空闲房间</span>
                    ) : (
                      freeSpaceOptions.map((s) => {
                        const b = buildingById(s.buildingId)
                        const label = `${b?.name ?? ''}-${s.floor}-${s.name}（${s.areaM2}㎡）`
                        return (
                          <label key={s.id} className="flex cursor-pointer items-center gap-2 py-0.5">
                            <input type="checkbox" checked={expandRoomIds.includes(s.id)} onChange={() => toggleExpandRoom(s.id)} />
                            <span>{label}</span>
                          </label>
                        )
                      })
                    )}
                  </div>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-[12px]">
                <input type="radio" name="expdec" checked={expandDecision === 'reject'} onChange={() => setExpandDecision('reject')} className="mt-0.5" />
                <span className="flex-1">
                  拒绝扩租 → 填写拒绝原因
                  <textarea
                    className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5 text-[12px]"
                    rows={2}
                    placeholder="原因（必填）"
                    value={expandDecision === 'reject' ? expandReason : ''}
                    onChange={(e) => {
                      setExpandDecision('reject')
                      setExpandReason(e.target.value)
                    }}
                  />
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-[12px]">
                <input type="radio" name="expdec" checked={expandDecision === 'hold'} onChange={() => setExpandDecision('hold')} className="mt-0.5" />
                <span className="flex-1">
                  需进一步沟通 → 填写备注
                  <textarea
                    className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5 text-[12px]"
                    rows={2}
                    placeholder="备注（必填）"
                    value={expandDecision === 'hold' ? expandReason : ''}
                    onChange={(e) => {
                      setExpandDecision('hold')
                      setExpandReason(e.target.value)
                    }}
                  />
                </span>
              </label>
            </div>
            <label className="block text-[12px]">
              <span className="font-semibold text-muted">审批意见（可选）</span>
              <textarea className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5" rows={2} value={expandOpinion} onChange={(e) => setExpandOpinion(e.target.value)} placeholder="录入内部流转意见" />
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
