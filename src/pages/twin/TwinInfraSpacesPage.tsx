import { Link, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { StatusPill, type StatusPillVariant } from '../../components/ui/StatusPill'
import { cn } from '../../utils/cn'
import { downloadCsv } from '../eco/ecoDownload'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import type { RoomType, SpaceStatus, TwinBuilding, TwinPark, TwinSpace } from './twinInfraTypes'
import { useTwinInfra } from './TwinInfraContext'

const ROOM_TYPES: RoomType[] = ['办公室', '实验室', '会议室', '设备间', '样本库', '工位']
const SPACE_STATUSES: SpaceStatus[] = ['空闲', '占用', '维护', '停用']

type SpaceDraft = Omit<TwinSpace, 'id' | 'updatedAt'>

function emptyDraft(buildingId: string, floor: string): SpaceDraft {
  return {
    name: '',
    code: '',
    buildingId,
    floor,
    roomType: '办公室',
    areaM2: 0,
    capacity: '',
    purpose: '',
    status: '空闲',
    projectId: undefined,
    projectName: undefined,
    occupyStart: undefined,
    occupyEnd: undefined,
    resourceBindings: [],
  }
}

function statusVariant(st: SpaceStatus): StatusPillVariant {
  if (st === '空闲') return 'success'
  if (st === '占用') return 'progress'
  if (st === '维护') return 'pending'
  return 'danger'
}

function generateFloorsPreview(start: number, end: number): string[] {
  const a = Math.min(start, end)
  const b = Math.max(start, end)
  const out: string[] = []
  for (let i = a; i <= b; i++) out.push(`${i}F`)
  return out
}

type CtxMenu = { x: number; y: number; items: { label: string; onClick: () => void }[] }

export default function TwinInfraSpacesPage() {
  const toast = useToast()
  const { archives } = useHatchMgmt()
  const {
    parks,
    buildings,
    spaces,
    buildingById,
    parkById,
    addSpace,
    updateSpace,
    deleteSpace,
    batchUpdateSpaceStatus,
    suggestSpaceCode,
    listFloorsForBuilding,
    registerVirtualFloors,
  } = useTwinInfra()

  const [searchParams, setSearchParams] = useSearchParams()
  const parkFilter = searchParams.get('parkId') ?? '全部'
  const buildingFilter = searchParams.get('buildingId') ?? '全部'
  const floorFilter = searchParams.get('floor') ?? '全部'
  const typeFilter = searchParams.get('roomType') ?? '全部'
  const statusFilter = searchParams.get('status') ?? '全部'
  const highlightSpaceId = searchParams.get('spaceId') ?? ''

  const [q, setQ] = useState('')
  const [treeQuery, setTreeQuery] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setExpanded((prev) => {
      if (Object.keys(prev).length > 0) return prev
      const o: Record<string, boolean> = {}
      for (const p of parks) o[`p:${p.id}`] = true
      for (const b of buildings) o[`b:${b.id}`] = true
      return o
    })
  }, [parks, buildings])
  const [floorPanelOpen, setFloorPanelOpen] = useState(false)
  const [floorBatchBuilding, setFloorBatchBuilding] = useState('')
  const [floorStart, setFloorStart] = useState(1)
  const [floorEnd, setFloorEnd] = useState(5)
  const [floorPreviewOpen, setFloorPreviewOpen] = useState(false)
  const [floorPreviewList, setFloorPreviewList] = useState<string[]>([])

  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null)
  const [batchSpaceCtx, setBatchSpaceCtx] = useState<{ buildingId: string; floor: string } | null>(null)
  const [batchSpaceCount, setBatchSpaceCount] = useState(3)
  const [batchSpacePattern, setBatchSpacePattern] = useState('共享实验室_%d')

  const [importPreview, setImportPreview] = useState<Partial<TwinSpace>[] | null>(null)
  const [importErrors, setImportErrors] = useState<string[]>([])

  const [deleteTarget, setDeleteTarget] = useState<TwinSpace | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)

  const [batchProjectOpen, setBatchProjectOpen] = useState(false)
  const [batchProjectId, setBatchProjectId] = useState('')
  const [batchOccupyStart, setBatchOccupyStart] = useState('')
  const [batchOccupyEnd, setBatchOccupyEnd] = useState('')

  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [batchStatus, setBatchStatus] = useState<SpaceStatus>('空闲')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<SpaceDraft | null>(null)

  const selectableProjects = useMemo(
    () => archives.filter((a) => a.status !== '毕业' && a.status !== '退出'),
    [archives],
  )

  function patchQuery(patch: Record<string, string | null>) {
    const sp = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '全部') sp.delete(k)
      else sp.set(k, v)
    }
    setSearchParams(sp, { replace: true })
  }

  const rows = useMemo(() => {
    return spaces.filter((s) => {
      const b = buildingById(s.buildingId)
      if (parkFilter !== '全部' && b?.parkId !== parkFilter) return false
      if (buildingFilter !== '全部' && s.buildingId !== buildingFilter) return false
      if (floorFilter !== '全部' && s.floor !== floorFilter) return false
      if (typeFilter !== '全部' && s.roomType !== typeFilter) return false
      if (statusFilter !== '全部' && s.status !== statusFilter) return false
      if (q.trim()) {
        const hay = `${s.name}${s.code}${b?.name ?? ''}${s.projectName ?? ''}`
        if (!hay.includes(q.trim())) return false
      }
      return true
    })
  }, [spaces, parkFilter, buildingFilter, floorFilter, typeFilter, statusFilter, q, buildingById])

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [parkFilter, buildingFilter, floorFilter, typeFilter, statusFilter, q])

  useEffect(() => {
    const tq = treeQuery.trim().toLowerCase()
    if (!tq) return
    const next = { ...expanded }
    for (const p of parks) {
      if (p.name.toLowerCase().includes(tq)) next[`p:${p.id}`] = true
    }
    for (const b of buildings) {
      const pk = parkById(b.parkId)
      const hit =
        b.name.toLowerCase().includes(tq) ||
        b.code.toLowerCase().includes(tq) ||
        pk?.name.toLowerCase().includes(tq) ||
        spaces.some((s) => s.buildingId === b.id && (s.name.toLowerCase().includes(tq) || s.floor.toLowerCase().includes(tq)))
      if (hit) {
        next[`p:${b.parkId}`] = true
        next[`b:${b.id}`] = true
      }
    }
    setExpanded((prev) => ({ ...prev, ...next }))
  }, [treeQuery, parks, buildings, spaces, parkById])

  const floorsListForDraft = useMemo(() => {
    if (!draft) return ['1F']
    return listFloorsForBuilding(draft.buildingId)
  }, [draft, listFloorsForBuilding])

  function toggleExpand(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function syncTreeToUrl(parkId: string | null, buildingId: string | null, floor: string | null, spaceId?: string | null) {
    const sp = new URLSearchParams(searchParams)
    const setOrDel = (k: string, v: string | null) => {
      if (v == null || v === '全部') sp.delete(k)
      else sp.set(k, v)
    }
    setOrDel('parkId', parkId)
    setOrDel('buildingId', buildingId)
    setOrDel('floor', floor)
    if (spaceId) sp.set('spaceId', spaceId)
    else sp.delete('spaceId')
    setSearchParams(sp, { replace: true })
  }

  function onSelectPark(p: TwinPark) {
    syncTreeToUrl(p.id, null, null, null)
  }

  function onSelectBuilding(b: TwinBuilding) {
    syncTreeToUrl(b.parkId, b.id, null, null)
  }

  function onSelectFloor(b: TwinBuilding, floor: string) {
    syncTreeToUrl(b.parkId, b.id, floor, null)
  }

  function onSelectSpace(s: TwinSpace) {
    const b = buildingById(s.buildingId)
    if (b) syncTreeToUrl(b.parkId, s.buildingId, s.floor, s.id)
  }

  function openCtxMenu(e: React.MouseEvent, items: CtxMenu['items']) {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY, items })
  }

  useEffect(() => {
    function close() {
      setCtxMenu(null)
    }
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  function openCreate() {
    const b0 = buildings[0]
    if (!b0) {
      toast.show('请先在「单体管理」中创建单体', 'warning')
      return
    }
    const bid =
      buildingFilter !== '全部' && buildings.some((b) => b.id === buildingFilter) ? buildingFilter : b0.id
    const b = buildingById(bid) ?? b0
    const fl = (floorFilter !== '全部' ? floorFilter : null) ?? listFloorsForBuilding(b.id)[0] ?? '1F'
    setEditingId(null)
    setDraft({ ...emptyDraft(b.id, fl), code: suggestSpaceCode(b.id, fl, '房间') })
    setStep(1)
    setModalOpen(true)
  }

  function openEdit(s: TwinSpace) {
    setEditingId(s.id)
    setDraft({
      name: s.name,
      code: s.code,
      buildingId: s.buildingId,
      floor: s.floor,
      roomType: s.roomType,
      areaM2: s.areaM2,
      capacity: s.capacity,
      purpose: s.purpose,
      status: s.status,
      projectId: s.projectId,
      projectName: s.projectName,
      occupyStart: s.occupyStart,
      occupyEnd: s.occupyEnd,
      resourceBindings: [...s.resourceBindings],
    })
    setStep(1)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setDraft(null)
    setEditingId(null)
    setStep(1)
  }

  function nextStep() {
    if (!draft) return
    if (!draft.name.trim() || !draft.code.trim() || !draft.buildingId) {
      toast.show('请填写空间名称、编码并选择所属单体', 'warning')
      return
    }
    setStep(2)
  }

  function saveFinal() {
    if (!draft) return
    const proj = draft.projectId ? selectableProjects.find((a) => a.id === draft.projectId) : undefined
    if (draft.projectId && !proj) {
      toast.show('所选项目不可用（已毕业/退出或未找到），请重新选择或清空', 'warning')
      return
    }
    const payload: SpaceDraft = {
      ...draft,
      projectName: proj?.name ?? draft.projectName,
    }
    if (editingId) {
      const hadProject = spaces.find((x) => x.id === editingId)?.projectId
      const { resourceBindings: _rb, ...rest } = payload
      void _rb
      const patch: Partial<TwinSpace> & { clearProject?: boolean } = { ...rest }
      if (!payload.projectId && hadProject) patch.clearProject = true
      const r = updateSpace(editingId, patch)
      if (!r.ok) {
        toast.show(r.msg ?? '保存失败', 'warning')
        return
      }
      toast.show('空间已更新', 'success')
    } else {
      const r = addSpace(payload)
      if (!r.ok) {
        toast.show(r.msg ?? '保存失败', 'warning')
        return
      }
      toast.show('空间已新增', 'success')
    }
    closeModal()
  }

  function tryDeleteSpace(s: TwinSpace): boolean {
    if (s.projectId || s.resourceBindings.length > 0) {
      toast.show('该空间已关联入孵项目或资源，请先解除关联后再删除', 'warning')
      return false
    }
    deleteSpace(s.id)
    return true
  }

  function remove(s: TwinSpace) {
    if (!tryDeleteSpace(s)) return
    toast.show('已删除空间', 'success')
    setSelected((prev) => {
      const n = new Set(prev)
      n.delete(s.id)
      return n
    })
    setDeleteTarget(null)
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function toggleAllPage() {
    const ids = pagedRows.map((r) => r.id)
    const allOn = ids.length > 0 && ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const n = new Set(prev)
      if (allOn) ids.forEach((id) => n.delete(id))
      else ids.forEach((id) => n.add(id))
      return n
    })
  }

  function applyBatch() {
    if (selected.size === 0) {
      toast.show('请先勾选空间', 'warning')
      return
    }
    batchUpdateSpaceStatus([...selected], batchStatus)
    toast.show(`已批量更新 ${selected.size} 条为「${batchStatus}」`, 'success')
    setSelected(new Set())
  }

  function exportRows() {
    const date = new Date().toISOString().slice(0, 10)
    downloadCsv(
      `空间列表_${date}.csv`,
      ['空间名称', '编码', '所属单体', '楼层', '类型', '面积(㎡)', '状态', '占用项目'],
      rows.map((s) => {
        const b = buildingById(s.buildingId)
        return [s.name, s.code, b?.name ?? '', s.floor, s.roomType, s.areaM2, s.status, s.projectName ?? '']
      }),
    )
    toast.show('已导出当前筛选结果（CSV）', 'success')
  }

  function downloadTemplate() {
    downloadCsv('空间导入模板.csv', ['空间名称', '空间编码', '单体编码', '楼层', '类型', '面积', '状态'], [
      ['示例301', 'ZJ-B-3F-301', 'ZJ-B', '3F', '办公室', '80', '空闲'],
    ])
    toast.show('已下载模板（CSV，可用 Excel 编辑）', 'info')
  }

  const parseImportRows = useCallback(
    (text: string) => {
      const lines = text.trim().split(/\r?\n/).filter(Boolean)
      if (lines.length < 2) return { ok: false as const, msg: '文件为空或缺少表头' }
      const head = lines[0].split(',').map((c) => c.trim())
      const need = ['空间名称', '空间编码', '单体编码', '楼层', '类型', '面积', '状态']
      const miss = need.filter((h) => !head.includes(h))
      if (miss.length) return { ok: false as const, msg: `缺少列：${miss.join('、')}` }
      const idx = (h: string) => head.indexOf(h)
      const out: Partial<TwinSpace>[] = []
      const errs: string[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim())
        const name = cols[idx('空间名称')]
        const code = cols[idx('空间编码')]
        const bcode = cols[idx('单体编码')]
        const floor = cols[idx('楼层')]
        const rt = cols[idx('类型')] as RoomType
        const area = Number(cols[idx('面积')])
        const st = cols[idx('状态')] as SpaceStatus
        const b = buildings.find((x) => x.code === bcode)
        if (!name || !code || !bcode || !floor) {
          errs.push(`第 ${i + 1} 行：必填字段不完整`)
          continue
        }
        if (!b) {
          errs.push(`第 ${i + 1} 行：未找到单体编码 ${bcode}`)
          continue
        }
        if (!ROOM_TYPES.includes(rt)) {
          errs.push(`第 ${i + 1} 行：类型无效 ${rt}`)
          continue
        }
        if (!SPACE_STATUSES.includes(st)) {
          errs.push(`第 ${i + 1} 行：状态无效 ${st}`)
          continue
        }
        out.push({
          name,
          code,
          buildingId: b.id,
          floor,
          roomType: rt,
          areaM2: Number.isFinite(area) ? area : 0,
          capacity: '',
          purpose: '',
          status: st,
          resourceBindings: [],
        })
      }
      return { ok: true as const, rows: out, errs }
    },
    [buildings],
  )

  function confirmImport() {
    if (!importPreview?.length) return
    let okc = 0
    for (const r of importPreview) {
      const res = addSpace({
        name: r.name!,
        code: r.code!,
        buildingId: r.buildingId!,
        floor: r.floor!,
        roomType: r.roomType as RoomType,
        areaM2: r.areaM2 ?? 0,
        capacity: r.capacity ?? '',
        purpose: r.purpose ?? '',
        status: r.status as SpaceStatus,
        projectId: r.projectId,
        projectName: r.projectName,
        occupyStart: r.occupyStart,
        occupyEnd: r.occupyEnd,
        resourceBindings: r.resourceBindings ?? [],
      })
      if (res.ok) okc += 1
    }
    toast.show(`已导入 ${okc} 条空间（演示：编码冲突行已跳过）`, 'success')
    setImportPreview(null)
    setImportErrors([])
  }

  function confirmFloorBatch() {
    if (!floorBatchBuilding) {
      toast.show('请选择单体', 'warning')
      return
    }
    const list = generateFloorsPreview(floorStart, floorEnd)
    registerVirtualFloors(floorBatchBuilding, list)
    toast.show(`已为单体生成 ${list.length} 个楼层节点：${list.join('、')}`, 'success')
    setFloorPreviewOpen(false)
    setExpanded((prev) => ({ ...prev, [`b:${floorBatchBuilding}`]: true, [`p:${buildingById(floorBatchBuilding)?.parkId}`]: true }))
  }

  function confirmBatchCreateSpaces() {
    if (!batchSpaceCtx) return
    const { buildingId, floor } = batchSpaceCtx
    let n = 0
    for (let i = 1; i <= batchSpaceCount; i++) {
      const name = batchSpacePattern.includes('%d') ? batchSpacePattern.replace('%d', String(i)) : `${batchSpacePattern}${i}`
      const code = suggestSpaceCode(buildingId, floor, name.replace(/\s/g, ''))
      const r = addSpace({
        ...emptyDraft(buildingId, floor),
        name,
        code,
        roomType: '实验室',
        areaM2: 40,
        status: '空闲',
      })
      if (r.ok) n += 1
    }
    toast.show(`已批量创建 ${n} 个空间`, 'success')
    setBatchSpaceCtx(null)
  }

  function runBatchDelete() {
    const ids = [...selected]
    let deleted = 0
    let blocked = 0
    for (const id of ids) {
      const s = spaces.find((x) => x.id === id)
      if (!s) continue
      if (tryDeleteSpace(s)) deleted += 1
      else blocked += 1
    }
    toast.show(`删除完成：成功 ${deleted}，跳过 ${blocked}（已关联项目/资源）`, blocked ? 'warning' : 'success')
    setSelected(new Set())
    setBatchDeleteOpen(false)
  }

  function runBatchLinkProject() {
    if (!batchProjectId) {
      toast.show('请选择项目', 'warning')
      return
    }
    const proj = selectableProjects.find((a) => a.id === batchProjectId)
    if (!proj) return
    for (const id of selected) {
      updateSpace(id, {
        projectId: batchProjectId,
        projectName: proj.name,
        occupyStart: batchOccupyStart || undefined,
        occupyEnd: batchOccupyEnd || undefined,
        status: '占用',
      })
    }
    toast.show(`已为 ${selected.size} 个空间关联项目`, 'success')
    setSelected(new Set())
    setBatchProjectOpen(false)
  }

  const treeHit = useCallback(
    (label: string) => {
      const t = treeQuery.trim().toLowerCase()
      if (!t) return false
      return label.toLowerCase().includes(t)
    },
    [treeQuery],
  )

  return (
    <div className="space-y-4 pb-8">
      <ModuleIntroCard
        title="📌 空间管理（树 + 批量）"
        lines={[
          '左侧园区 → 单体 → 楼层 → 空间树与右侧列表、URL 筛选联动；支持批量生成楼层、CSV 模板导入/导出、批量状态与批量关联项目。',
          '删除前若已绑定入孵项目或资源绑定，将阻止删除；虚拟楼层可与空间表楼层合并展示。',
        ]}
      />
      <h1 className="text-lg font-bold text-foreground">空间管理</h1>

      <div className="flex min-h-[560px] flex-col gap-0 rounded-lg border border-divider bg-card shadow-sm lg:flex-row">
        {/* 左侧树 */}
        <aside className="w-full shrink-0 border-divider bg-muted/10 p-3 lg:w-[260px] lg:border-r">
          <input
            className="mb-3 w-full rounded-md border border-divider bg-surface px-2 py-2 text-[12px] outline-none focus:border-primary"
            placeholder="🔍 搜索资产..."
            value={treeQuery}
            onChange={(e) => setTreeQuery(e.target.value)}
          />
          <div className="max-h-[min(72vh,720px)] space-y-1 overflow-y-auto text-[12px]">
            {parks.map((p) => {
              const pKey = `p:${p.id}`
              const bds = buildings.filter((b) => b.parkId === p.id)
              return (
                <div key={p.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-1 rounded-md px-1 py-1 text-left font-semibold hover:bg-muted/40',
                      treeHit(p.name) ? 'ring-1 ring-primary/40' : '',
                      parkFilter === p.id ? 'bg-primary-light/50 text-primary' : 'text-foreground',
                    )}
                    onClick={() => {
                      toggleExpand(pKey)
                      onSelectPark(p)
                    }}
                    onContextMenu={(e) =>
                      openCtxMenu(e, [
                        { label: '展开/收起', onClick: () => toggleExpand(pKey) },
                        { label: '筛选该园区', onClick: () => onSelectPark(p) },
                      ])
                    }
                  >
                    <span className="text-[13px]" aria-hidden>
                      {expanded[pKey] ? '▼' : '▶'}
                    </span>
                    <span aria-hidden>🏢</span>
                    <span className="min-w-0 truncate">{p.name}</span>
                  </button>
                  {expanded[pKey]
                    ? bds.map((b) => {
                        const bKey = `b:${b.id}`
                        const fls = listFloorsForBuilding(b.id)
                        return (
                          <div key={b.id} className="ms-2 border-l border-divider/60 ps-2">
                            <button
                              type="button"
                              className={cn(
                                'mt-0.5 flex w-full items-center gap-1 rounded-md px-1 py-1 text-left hover:bg-muted/40',
                                treeHit(b.name) ? 'ring-1 ring-primary/40' : '',
                                buildingFilter === b.id ? 'bg-primary-light/40 text-primary' : '',
                              )}
                              onClick={() => {
                                toggleExpand(bKey)
                                onSelectBuilding(b)
                              }}
                              onContextMenu={(e) =>
                                openCtxMenu(e, [
                                  { label: '筛选该单体', onClick: () => onSelectBuilding(b) },
                                  {
                                    label: '批量生成楼层',
                                    onClick: () => {
                                      setFloorBatchBuilding(b.id)
                                      setFloorPanelOpen(true)
                                    },
                                  },
                                ])
                              }
                            >
                              <span>{expanded[bKey] ? '▼' : '▶'}</span>
                              <span aria-hidden>🏬</span>
                              <span className="min-w-0 truncate">
                                {b.name}（{b.buildingType}）
                              </span>
                            </button>
                            {expanded[bKey]
                              ? fls.map((fl) => {
                                  const subs = spaces.filter((s) => s.buildingId === b.id && s.floor === fl)
                                  return (
                                    <div key={`${b.id}-${fl}`} className="ms-2 border-l border-divider/40 ps-2">
                                      <button
                                        type="button"
                                        className={cn(
                                          'mt-0.5 flex w-full items-center gap-1 rounded-md px-1 py-1 text-left hover:bg-muted/40',
                                          treeHit(fl) ? 'ring-1 ring-primary/40' : '',
                                          buildingFilter === b.id && floorFilter === fl ? 'bg-primary-light/30 text-primary' : '',
                                        )}
                                        onClick={() => onSelectFloor(b, fl)}
                                        onContextMenu={(e) =>
                                          openCtxMenu(e, [
                                            { label: '筛选该楼层', onClick: () => onSelectFloor(b, fl) },
                                            {
                                              label: '新增空间',
                                              onClick: () => {
                                                setDraft({ ...emptyDraft(b.id, fl), code: suggestSpaceCode(b.id, fl, '房间') })
                                                setEditingId(null)
                                                setStep(1)
                                                setModalOpen(true)
                                              },
                                            },
                                            {
                                              label: '批量新增空间',
                                              onClick: () => {
                                                setBatchSpaceCtx({ buildingId: b.id, floor: fl })
                                              },
                                            },
                                          ])
                                        }
                                      >
                                        <span aria-hidden>📁</span>
                                        <span>{fl}</span>
                                      </button>
                                      <div className="ms-3 space-y-0.5 pb-1">
                                        {subs.map((s) => (
                                          <div key={s.id} className="flex items-start gap-1 py-0.5">
                                            <input
                                              type="checkbox"
                                              className="mt-0.5"
                                              checked={selected.has(s.id)}
                                              onChange={() => toggleRow(s.id)}
                                              aria-label={`选择 ${s.name}`}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <button
                                              type="button"
                                              className={cn(
                                                'flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-muted/50',
                                                highlightSpaceId === s.id ? 'bg-amber-100 text-amber-900' : '',
                                                treeHit(s.name) ? 'ring-1 ring-primary/40' : '',
                                              )}
                                              onClick={() => onSelectSpace(s)}
                                              onContextMenu={(e) =>
                                                openCtxMenu(e, [
                                                  { label: '编辑', onClick: () => openEdit(s) },
                                                  { label: '删除', onClick: () => setDeleteTarget(s) },
                                                  {
                                                    label: '分配项目',
                                                    onClick: () => {
                                                      setSelected(new Set([s.id]))
                                                      setBatchProjectOpen(true)
                                                    },
                                                  },
                                                ])
                                              }
                                            >
                                              <span aria-hidden>📌</span>
                                              <span className="truncate">
                                                {s.name}（{s.status}）
                                              </span>
                                            </button>
                                          </div>
                                        ))}
                                        {subs.length === 0 ? (
                                          <div className="py-1 ps-1 text-[11px] text-muted">（该楼层暂无空间）</div>
                                        ) : null}
                                      </div>
                                    </div>
                                  )
                                })
                              : null}
                          </div>
                        )
                      })
                    : null}
                </div>
              )
            })}
          </div>
        </aside>

        {/* 右侧 */}
        <div className="min-w-0 flex-1 space-y-4 p-4">
          <ListToolbarRow
            left={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover"
                  onClick={openCreate}
                >
                  + 新增空间
                </button>
                <label className="cursor-pointer rounded-md border border-divider px-3 py-2 text-[12px] font-semibold hover:border-primary">
                  导入
                  <input
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const reader = new FileReader()
                      reader.onload = () => {
                        const text = String(reader.result ?? '')
                        const res = parseImportRows(text)
                        if (!res.ok) {
                          toast.show(res.msg, 'warning')
                          return
                        }
                        setImportErrors(res.errs)
                        setImportPreview(res.rows as Partial<TwinSpace>[])
                      }
                      reader.readAsText(f)
                      e.target.value = ''
                    }}
                  />
                </label>
                <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold hover:border-primary" onClick={exportRows}>
                  导出
                </button>
                <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold hover:border-primary" onClick={downloadTemplate}>
                  下载模板
                </button>
                <button
                  type="button"
                  className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold hover:border-primary"
                  onClick={() => {
                    setFloorBatchBuilding(buildingFilter !== '全部' ? buildingFilter : buildings[0]?.id ?? '')
                    setFloorPanelOpen(true)
                  }}
                >
                  批量生成楼层
                </button>
                <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold hover:border-primary" onClick={() => toast.show('批量创建空间：请在树中右键楼层选择「批量新增空间」', 'info')}>
                  批量创建空间
                </button>
              </div>
            }
            right={
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-muted">园区</label>
                  <select
                    className="mt-1 block max-w-[140px] rounded-md border border-divider bg-surface px-2 py-1.5 text-[13px]"
                    value={parkFilter}
                    onChange={(e) => patchQuery({ parkId: e.target.value === '全部' ? null : e.target.value, buildingId: null, floor: null, spaceId: null })}
                  >
                    <option value="全部">全部园区</option>
                    {parks.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted">单体</label>
                  <select
                    className="mt-1 block max-w-[160px] rounded-md border border-divider bg-surface px-2 py-1.5 text-[13px]"
                    value={buildingFilter}
                    onChange={(e) => patchQuery({ buildingId: e.target.value === '全部' ? null : e.target.value, floor: null, spaceId: null })}
                  >
                    <option value="全部">全部单体</option>
                    {buildings
                      .filter((b) => (parkFilter === '全部' ? true : b.parkId === parkFilter))
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted">楼层</label>
                  <select
                    className="mt-1 block rounded-md border border-divider bg-surface px-2 py-1.5 text-[13px]"
                    value={floorFilter}
                    onChange={(e) => patchQuery({ floor: e.target.value === '全部' ? null : e.target.value, spaceId: null })}
                  >
                    <option value="全部">全部楼层</option>
                    {(buildingFilter !== '全部'
                      ? listFloorsForBuilding(buildingFilter)
                      : [...new Set(spaces.map((s) => s.floor))].sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
                    ).map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted">类型</label>
                  <select
                    className="mt-1 block rounded-md border border-divider bg-surface px-2 py-1.5 text-[13px]"
                    value={typeFilter}
                    onChange={(e) => patchQuery({ roomType: e.target.value === '全部' ? null : e.target.value })}
                  >
                    <option value="全部">全部</option>
                    {ROOM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted">状态</label>
                  <select
                    className="mt-1 block rounded-md border border-divider bg-surface px-2 py-1.5 text-[13px]"
                    value={statusFilter}
                    onChange={(e) => patchQuery({ status: e.target.value === '全部' ? null : e.target.value })}
                  >
                    <option value="全部">全部</option>
                    {SPACE_STATUSES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  className="mt-5 rounded-md border border-divider bg-surface px-2 py-1.5 text-[13px] outline-none focus:border-primary sm:min-w-[180px]"
                  placeholder="搜索名称 / 编码 / 项目"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            }
          />

          {floorPanelOpen ? (
            <section className="rounded-lg border border-divider bg-muted/10 p-4">
              <button type="button" className="flex w-full items-center justify-between text-left text-[13px] font-bold text-foreground" onClick={() => setFloorPanelOpen(false)}>
                <span>📐 批量生成楼层</span>
                <span className="text-muted">收起</span>
              </button>
              <div className="mt-3 flex flex-wrap items-end gap-3 text-[13px]">
                <label className="text-[12px] text-muted">
                  单体
                  <select
                    className="mt-1 block min-w-[160px] rounded-md border border-divider bg-surface px-2 py-2"
                    value={floorBatchBuilding}
                    onChange={(e) => setFloorBatchBuilding(e.target.value)}
                  >
                    <option value="">选择单体</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[12px] text-muted">
                  起始楼层
                  <input
                    type="number"
                    min={1}
                    className="mt-1 block w-20 rounded-md border border-divider px-2 py-2 tabular-nums"
                    value={floorStart}
                    onChange={(e) => setFloorStart(Number(e.target.value) || 1)}
                  />
                </label>
                <label className="text-[12px] text-muted">
                  结束楼层
                  <input
                    type="number"
                    min={1}
                    className="mt-1 block w-20 rounded-md border border-divider px-2 py-2 tabular-nums"
                    value={floorEnd}
                    onChange={(e) => setFloorEnd(Number(e.target.value) || 1)}
                  />
                </label>
                <span className="pb-2 text-[12px] text-muted">规则：数字后缀（如 1F,2F）</span>
                <div className="flex flex-wrap gap-2 pb-1">
                  <button
                    type="button"
                    className="rounded-md border border-divider bg-surface px-3 py-2 text-[12px] font-semibold"
                    onClick={() => {
                      setFloorPreviewList(generateFloorsPreview(floorStart, floorEnd))
                      setFloorPreviewOpen(true)
                    }}
                  >
                    生成预览
                  </button>
                  <button type="button" className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white" onClick={confirmFloorBatch}>
                    确认生成
                  </button>
                  <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px]" onClick={() => setFloorPanelOpen(false)}>
                    取消
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {selected.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-[13px]">
              <span className="font-semibold text-foreground">已选 {selected.size} 项</span>
              <select className="rounded-md border border-divider bg-surface px-2 py-1.5 text-[12px]" value={batchStatus} onChange={(e) => setBatchStatus(e.target.value as SpaceStatus)}>
                {SPACE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button type="button" className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-bold text-white hover:bg-primary-hover" onClick={applyBatch}>
                批量修改状态
              </button>
              <button type="button" className="rounded-md border border-divider px-3 py-1.5 text-[12px] font-semibold" onClick={() => setBatchDeleteOpen(true)}>
                批量删除
              </button>
              <button type="button" className="rounded-md border border-divider px-3 py-1.5 text-[12px] font-semibold" onClick={() => setBatchProjectOpen(true)}>
                批量关联项目
              </button>
              <button type="button" className="text-[12px] font-semibold text-muted hover:text-foreground" onClick={() => setSelected(new Set())}>
                清除选择
              </button>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-lg border border-divider bg-surface">
            <table className="w-full min-w-[1080px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-divider bg-muted/30 text-[11px] font-semibold text-muted">
                  <th className="px-2 py-2">
                    <input type="checkbox" aria-label="全选本页" checked={pagedRows.length > 0 && pagedRows.every((r) => selected.has(r.id))} onChange={toggleAllPage} />
                  </th>
                  <th className="px-3 py-2">空间名称</th>
                  <th className="px-3 py-2">编码</th>
                  <th className="px-3 py-2">所属单体</th>
                  <th className="px-3 py-2">楼层</th>
                  <th className="px-3 py-2">类型</th>
                  <th className="px-3 py-2">面积</th>
                  <th className="px-3 py-2">状态</th>
                  <th className="px-3 py-2">占用项目</th>
                  <th className="px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((s) => {
                  const b = buildingById(s.buildingId)
                  return (
                    <tr
                      key={s.id}
                      className={cn('border-b border-divider/60 hover:bg-muted/15', highlightSpaceId === s.id ? 'bg-amber-50' : '')}
                    >
                      <td className="px-2 py-2">
                        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleRow(s.id)} aria-label={`选择 ${s.name}`} />
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" className="font-semibold text-primary hover:underline" onClick={() => openEdit(s)}>
                          {s.name}
                        </button>
                      </td>
                      <td className="px-3 py-2 font-mono text-[12px] text-primary">{s.code}</td>
                      <td className="px-3 py-2 text-muted">{b?.name ?? '—'}</td>
                      <td className="px-3 py-2 tabular-nums text-muted">{s.floor}</td>
                      <td className="px-3 py-2 text-muted">{s.roomType}</td>
                      <td className="px-3 py-2 tabular-nums text-muted">{s.areaM2} ㎡</td>
                      <td className="px-3 py-2">
                        <StatusPill variant={statusVariant(s.status)}>{s.status}</StatusPill>
                      </td>
                      <td className="px-3 py-2">
                        {s.projectId && s.projectName ? (
                          <Link className="font-semibold text-primary hover:underline" to={`/hatch/archive/${encodeURIComponent(s.projectId)}`}>
                            {s.projectName}
                          </Link>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="text-[12px] font-semibold text-primary hover:underline" onClick={() => openEdit(s)}>
                            编辑
                          </button>
                          <button type="button" className="text-[12px] font-semibold text-danger hover:underline" onClick={() => setDeleteTarget(s)}>
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <ListPaginationBar
              total={rows.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(n) => {
                setPageSize(n)
                setPage(1)
              }}
            />
          </div>
        </div>
      </div>

      {ctxMenu ? (
        <div
          className="fixed z-[80] min-w-[160px] rounded-md border border-divider bg-surface py-1 text-[13px] shadow-lg"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {ctxMenu.items.map((it) => (
            <button
              key={it.label}
              type="button"
              className="block w-full px-3 py-2 text-left hover:bg-muted/40"
              onClick={() => {
                it.onClick()
                setCtxMenu(null)
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      ) : null}

      <Modal open={floorPreviewOpen} title="楼层生成预览" onClose={() => setFloorPreviewOpen(false)}>
        <ul className="max-h-64 list-inside list-disc overflow-y-auto text-[13px] text-muted">
          {floorPreviewList.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-muted">确认后将写入左侧树并与「楼层」筛选联动。</p>
      </Modal>

      <Modal
        open={Boolean(batchSpaceCtx)}
        title={batchSpaceCtx ? `批量新增空间 · ${batchSpaceCtx.floor}` : ''}
        onClose={() => setBatchSpaceCtx(null)}
        footer={
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setBatchSpaceCtx(null)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-white" onClick={confirmBatchCreateSpaces}>
              确认创建
            </button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <p className="text-muted">将在 {batchSpaceCtx ? `${buildingById(batchSpaceCtx.buildingId)?.name ?? ''} / ${batchSpaceCtx.floor}` : ''} 下批量创建。</p>
          <label className="block">
            <span className="text-muted">数量</span>
            <input type="number" min={1} max={50} className="mt-1 w-full rounded-md border border-divider px-2 py-2" value={batchSpaceCount} onChange={(e) => setBatchSpaceCount(Number(e.target.value) || 1)} />
          </label>
          <label className="block">
            <span className="text-muted">命名规则（支持 %d）</span>
            <input className="mt-1 w-full rounded-md border border-divider px-2 py-2" value={batchSpacePattern} onChange={(e) => setBatchSpacePattern(e.target.value)} />
          </label>
        </div>
      </Modal>

      <Modal open={Boolean(importPreview)} title="导入预览" onClose={() => setImportPreview(null)} panelClassName="max-w-3xl">
        {importErrors.length ? (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
            {importErrors.slice(0, 6).map((e) => (
              <div key={e}>{e}</div>
            ))}
            {importErrors.length > 6 ? <div>…共 {importErrors.length} 条校验提示</div> : null}
          </div>
        ) : null}
        <div className="max-h-72 overflow-auto rounded-md border border-divider">
          <table className="w-full border-collapse text-[12px]">
            <thead className="bg-muted/30 text-muted">
              <tr>
                <th className="px-2 py-2 text-left">名称</th>
                <th className="px-2 py-2 text-left">编码</th>
                <th className="px-2 py-2 text-left">楼层</th>
                <th className="px-2 py-2 text-left">类型</th>
              </tr>
            </thead>
            <tbody>
              {(importPreview ?? []).map((r, i) => (
                <tr key={i} className="border-t border-divider">
                  <td className="px-2 py-2">{r.name}</td>
                  <td className="px-2 py-2 font-mono">{r.code}</td>
                  <td className="px-2 py-2">{r.floor}</td>
                  <td className="px-2 py-2">{r.roomType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setImportPreview(null)}>
            取消
          </button>
          <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-white" onClick={confirmImport}>
            确认导入
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="确认删除空间"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setDeleteTarget(null)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-rose-600 px-4 py-2 text-[13px] font-bold text-white" onClick={() => deleteTarget && remove(deleteTarget)}>
              删除
            </button>
          </>
        }
      >
        <p className="text-[13px] text-muted">确定删除「{deleteTarget?.name}」吗？若已关联项目或资源将自动拦截。</p>
      </Modal>

      <Modal
        open={batchDeleteOpen}
        title="批量删除"
        onClose={() => setBatchDeleteOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setBatchDeleteOpen(false)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-rose-600 px-4 py-2 text-[13px] font-bold text-white" onClick={runBatchDelete}>
              确认删除
            </button>
          </>
        }
      >
        <p className="text-[13px] text-muted">将尝试删除已选的 {selected.size} 个空间；已关联项目或资源的行会被跳过。</p>
      </Modal>

      <Modal
        open={batchProjectOpen}
        title="批量关联项目"
        onClose={() => setBatchProjectOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setBatchProjectOpen(false)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-white" onClick={runBatchLinkProject}>
              保存
            </button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <label className="block">
            <span className="text-muted">占用项目</span>
            <select className="mt-1 w-full rounded-md border border-divider px-2 py-2" value={batchProjectId} onChange={(e) => setBatchProjectId(e.target.value)}>
              <option value="">请选择</option>
              {selectableProjects.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="text-muted">占用开始</span>
              <input type="date" className="mt-1 w-full rounded-md border border-divider px-2 py-2" value={batchOccupyStart} onChange={(e) => setBatchOccupyStart(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-muted">占用结束</span>
              <input type="date" className="mt-1 w-full rounded-md border border-divider px-2 py-2" value={batchOccupyEnd} onChange={(e) => setBatchOccupyEnd(e.target.value)} />
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? `编辑空间 - Step ${step}/2` : `新增空间 - Step ${step}/2`}
        panelClassName="max-w-lg"
      >
        {draft && step === 1 ? (
          <div className="space-y-3 text-[13px]">
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">空间名称（必填）</span>
              <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5" value={draft.name} onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))} />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <label className="block min-w-0 flex-1">
                <span className="text-[12px] font-semibold text-muted">空间编码（唯一）</span>
                <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5 font-mono" value={draft.code} onChange={(e) => setDraft((d) => (d ? { ...d, code: e.target.value } : d))} />
              </label>
              <button
                type="button"
                className="shrink-0 rounded-md border border-divider px-2 py-1.5 text-[12px] font-semibold hover:border-primary"
                onClick={() =>
                  setDraft((d) =>
                    d ? { ...d, code: suggestSpaceCode(d.buildingId, d.floor, d.name.replace(/室/g, '') || '房间') } : d,
                  )
                }
              >
                生成编码
              </button>
            </div>
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">所属单体</span>
              <select
                className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5"
                value={draft.buildingId}
                onChange={(e) => {
                  const bid = e.target.value
                  const fl = listFloorsForBuilding(bid)[0] ?? '1F'
                  setDraft((d) => (d ? { ...d, buildingId: bid, floor: fl } : d))
                }}
              >
                {buildings.map((b) => {
                  const pk = parks.find((p) => p.id === b.parkId)
                  return (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {pk ? `（${pk.name}）` : ''}
                    </option>
                  )
                })}
              </select>
            </label>
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">所属楼层</span>
              <select className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5" value={draft.floor} onChange={(e) => setDraft((d) => (d ? { ...d, floor: e.target.value } : d))}>
                {floorsListForDraft.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">房间类型</span>
              <select
                className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5"
                value={draft.roomType}
                onChange={(e) => setDraft((d) => (d ? { ...d, roomType: e.target.value as RoomType } : d))}
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="text-[12px] font-semibold text-muted">面积（㎡）</span>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-md border border-divider px-2 py-1.5"
                  value={draft.areaM2 || ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, areaM2: Number(e.target.value) || 0 } : d))}
                />
              </label>
              <label className="block">
                <span className="text-[12px] font-semibold text-muted">容量</span>
                <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5" value={draft.capacity} onChange={(e) => setDraft((d) => (d ? { ...d, capacity: e.target.value } : d))} placeholder="如 12人" />
              </label>
            </div>
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">用途</span>
              <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5" value={draft.purpose} onChange={(e) => setDraft((d) => (d ? { ...d, purpose: e.target.value } : d))} />
            </label>
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">状态</span>
              <select
                className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5"
                value={draft.status}
                onChange={(e) => setDraft((d) => (d ? { ...d, status: e.target.value as SpaceStatus } : d))}
              >
                {SPACE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold" onClick={closeModal}>
                取消
              </button>
              <button type="button" className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover" onClick={nextStep}>
                下一步
              </button>
            </div>
          </div>
        ) : null}

        {draft && step === 2 ? (
          <div className="space-y-3 text-[13px]">
            <p className="text-[12px] text-muted">关联项目为选填；保存时若选择有效项目，系统将空间状态置为「占用」并写入项目展示名。</p>
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">当前占用项目</span>
              <select
                className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5"
                value={draft.projectId ?? ''}
                onChange={(e) => {
                  const id = e.target.value || undefined
                  const name = id ? archives.find((a) => a.id === id)?.name : undefined
                  setDraft((d) => (d ? { ...d, projectId: id, projectName: name } : d))
                }}
              >
                <option value="">（无）</option>
                {selectableProjects.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="text-[12px] font-semibold text-muted">占用开始日期</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-divider px-2 py-1.5"
                  value={draft.occupyStart ?? ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, occupyStart: e.target.value || undefined } : d))}
                />
              </label>
              <label className="block">
                <span className="text-[12px] font-semibold text-muted">占用结束日期</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-divider px-2 py-1.5"
                  value={draft.occupyEnd ?? ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, occupyEnd: e.target.value || undefined } : d))}
                />
              </label>
            </div>
            <div>
              <span className="text-[12px] font-semibold text-muted">关联资源（只读）</span>
              <ul className="mt-2 list-inside list-disc space-y-1 rounded-md border border-divider bg-muted/10 px-3 py-2 text-[12px] text-muted">
                {draft.resourceBindings.length === 0 ? <li>暂无绑定（由资源运营侧绑定后展示）</li> : null}
                {draft.resourceBindings.map((r, i) => (
                  <li key={`${r.name}-${i}`}>
                    {r.name} <span className="text-muted">({r.kind})</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold" onClick={() => setStep(1)}>
                上一步
              </button>
              <button type="button" className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover" onClick={saveFinal}>
                保存
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
