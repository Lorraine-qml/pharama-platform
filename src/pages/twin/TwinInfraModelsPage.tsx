import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { Modal } from '../../components/Modal'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import type { TwinBuilding } from './twinInfraTypes'
import { useTwinInfra } from './TwinInfraContext'

/** 单体孪生模型状态（与 BIM/轻量化转换流程对齐的演示状态机） */
export type BuildingModelPhase = 'none' | 'uploaded' | 'converting' | 'converted' | 'bound'

export type BuildingModelState = {
  phase: BuildingModelPhase
  modelName: string | null
  /** 转换进度 0–100 */
  convertProgress?: number
  /** 为 false 时自动进度条不推进（用于演示「卡在 65%」） */
  convertingAuto?: boolean
}

const DEFAULT_MODELS: Record<string, BuildingModelState> = {
  'bd-a': { phase: 'bound', modelName: 'A栋_土建_v1', convertingAuto: true },
  'bd-b': { phase: 'converting', modelName: 'B栋_机电_v1', convertProgress: 65, convertingAuto: false },
  'bd-c': { phase: 'none', modelName: null },
  'bd-zgc-a': { phase: 'uploaded', modelName: '科研楼_土建_v1', convertingAuto: true },
  'bd-d': { phase: 'bound', modelName: '研发楼_土建_v2', convertingAuto: true },
  'bd-e': { phase: 'converted', modelName: '综合楼E_精装_v1', convertProgress: 100, convertingAuto: true },
}

const STATUS_FILTER = ['全部', '未上传', '已上传未转换', '转换中', '已转换', '已绑定'] as const

function phaseLabel(m: BuildingModelState): string {
  switch (m.phase) {
    case 'none':
      return '未上传'
    case 'uploaded':
      return '已上传未转换'
    case 'converting':
      return `转换中(${m.convertProgress ?? 0}%)`
    case 'converted':
      return '已转换'
    case 'bound':
      return '已绑定'
    default:
      return '—'
  }
}

function phaseMatchesFilter(m: BuildingModelState, f: (typeof STATUS_FILTER)[number]): boolean {
  if (f === '全部') return true
  if (f === '未上传') return m.phase === 'none'
  if (f === '已上传未转换') return m.phase === 'uploaded'
  if (f === '转换中') return m.phase === 'converting'
  if (f === '已转换') return m.phase === 'converted'
  if (f === '已绑定') return m.phase === 'bound'
  return true
}

function ModelStatusCell({ m }: { m: BuildingModelState }) {
  const text = phaseLabel(m)
  const dot =
    m.phase === 'none'
      ? 'bg-slate-300'
      : m.phase === 'uploaded'
        ? 'bg-amber-500'
        : m.phase === 'converting'
          ? 'bg-sky-500'
          : m.phase === 'converted'
            ? 'bg-emerald-500'
            : 'bg-emerald-600'
  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-muted">
      <span className={cn('size-2.5 shrink-0 rounded-full', dot)} aria-hidden />
      <span className="text-foreground">
        {text}
        {m.phase === 'bound' ? <span className="ms-1 text-[11px] font-semibold text-emerald-700">· 孪生</span> : null}
      </span>
    </span>
  )
}

export default function TwinInfraModelsPage() {
  const toast = useToast()
  const { buildings, parkById } = useTwinInfra()
  const inited = useRef(false)
  const [modelsByBuilding, setModelsByBuilding] = useState<Record<string, BuildingModelState>>({})

  const [fName, setFName] = useState('')
  const [fStatus, setFStatus] = useState<(typeof STATUS_FILTER)[number]>('全部')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [helpOpen, setHelpOpen] = useState(false)
  const [detailBuilding, setDetailBuilding] = useState<TwinBuilding | null>(null)
  const [uploadTarget, setUploadTarget] = useState<TwinBuilding | null>(null)
  const [versionTarget, setVersionTarget] = useState<TwinBuilding | null>(null)

  useEffect(() => {
    if (inited.current) return
    inited.current = true
    setModelsByBuilding(() => {
      const next: Record<string, BuildingModelState> = {}
      for (const b of buildings) {
        next[b.id] = DEFAULT_MODELS[b.id] ?? { phase: 'none', modelName: null, convertingAuto: true }
      }
      return next
    })
  }, [buildings])

  useEffect(() => {
    const t = window.setInterval(() => {
      setModelsByBuilding((prev) => {
        let touched = false
        const next = { ...prev }
        for (const [id, m] of Object.entries(next)) {
          if (m.phase !== 'converting' || m.convertingAuto === false) continue
          const p = Math.min(100, (m.convertProgress ?? 0) + 6)
          touched = true
          if (p >= 100) next[id] = { ...m, phase: 'converted', convertProgress: 100, convertingAuto: true }
          else next[id] = { ...m, convertProgress: p }
        }
        return touched ? next : prev
      })
    }, 700)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [fName, fStatus, q])

  const rows = useMemo(() => {
    return buildings
      .map((b) => {
        const model = modelsByBuilding[b.id] ?? { phase: 'none' as const, modelName: null }
        return { b, model }
      })
      .filter(({ b, model }) => {
        if (fName.trim() && !b.name.includes(fName.trim())) return false
        if (!phaseMatchesFilter(model, fStatus)) return false
        if (q.trim()) {
          const needle = q.trim()
          const hay = `${b.name}${b.code}${model.modelName ?? ''}${parkById(b.parkId)?.name ?? ''}`
          if (!hay.includes(needle)) return false
        }
        return true
      })
  }, [buildings, modelsByBuilding, fName, fStatus, q, parkById])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  const patchModel = useCallback((buildingId: string, patch: BuildingModelState) => {
    setModelsByBuilding((prev) => ({ ...prev, [buildingId]: patch }))
  }, [])

  function bumpVersion(name: string) {
    const m = name.match(/^(.*)_v(\d+)$/)
    if (m) return `${m[1]}_v${Number(m[2]) + 1}`
    return `${name}_v2`
  }

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="🧩 模型管理（单体孪生）"
        lines={[
          '按单体维护土建/机电等 BIM 或轻量化模型：上传、转换、绑定到数字孪生空间；支持筛选与分页。',
          '状态「已绑定」表示模型已与孪生底座关联；解绑后保留已转换文件，可重新绑定或上传新版本。',
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-foreground">模型管理</h1>
        <button type="button" className="rounded-md border border-divider bg-surface px-3 py-2 text-[13px]" onClick={() => setHelpOpen(true)}>
          帮助
        </button>
      </div>

      <ListToolbarRow
        left={<span className="text-[12px] font-semibold text-muted">筛选</span>}
        right={
          <>
            <label className="text-[12px] text-muted">
              单体名称
              <input
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                placeholder="输入关键字"
                className="mt-1 block w-[160px] rounded-md border border-divider bg-page px-3 py-2 text-[13px]"
              />
            </label>
            <label className="text-[12px] text-muted">
              模型状态
              <select
                value={fStatus}
                onChange={(e) => setFStatus(e.target.value as (typeof STATUS_FILTER)[number])}
                className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]"
              >
                {STATUS_FILTER.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[200px] text-[12px] text-muted">
              搜索
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="单体 / 编码 / 园区 / 模型名"
                className="mt-1 w-full rounded-md border border-divider px-3 py-2 text-[13px]"
              />
            </label>
          </>
        }
      />

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-divider bg-surface text-[14px] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full border-collapse">
            <thead className="sticky top-0 z-[1] border-b border-divider bg-[#F5F7FA] text-left text-[12px] font-bold text-muted">
              <tr>
                <th className="px-4 py-3">单体名称</th>
                <th className="px-4 py-3">编码</th>
                <th className="px-4 py-3">所属园区</th>
                <th className="px-4 py-3">楼层数</th>
                <th className="px-4 py-3">模型名称</th>
                <th className="px-4 py-3">模型状态</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(({ b, model }) => {
                const park = parkById(b.parkId)
                return (
                  <tr key={b.id} className="h-12 border-b border-divider hover:bg-primary-light/10">
                    <td className="px-4 py-3 font-medium text-foreground">{b.name}</td>
                    <td className="px-4 py-3 text-muted">{b.code}</td>
                    <td className="px-4 py-3 text-muted">{park?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted tabular-nums">{b.floors}</td>
                    <td className="px-4 py-3 text-muted">{model.modelName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <ModelStatusCell m={model} />
                    </td>
                    <td className="px-4 py-3 text-end text-[13px]">
                      {model.phase === 'none' ? (
                        <button type="button" className="text-primary hover:underline" onClick={() => setUploadTarget(b)}>
                          上传模型
                        </button>
                      ) : null}
                      {model.phase === 'uploaded' ? (
                        <>
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => {
                              patchModel(b.id, {
                                ...model,
                                phase: 'converting',
                                convertProgress: 8,
                                convertingAuto: true,
                              })
                              toast.show('已开始转换（演示）', 'info')
                            }}
                          >
                            转换
                          </button>
                          <button
                            type="button"
                            className="ml-2 text-rose-600 hover:underline"
                            onClick={() => {
                              patchModel(b.id, { phase: 'none', modelName: null })
                              toast.show('已删除模型文件（演示）', 'success')
                            }}
                          >
                            删除
                          </button>
                          <button type="button" className="ml-2 text-primary hover:underline" onClick={() => setDetailBuilding(b)}>
                            详情
                          </button>
                        </>
                      ) : null}
                      {model.phase === 'converting' ? (
                        <>
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => {
                              patchModel(b.id, {
                                ...model,
                                phase: 'uploaded',
                                convertProgress: 0,
                                convertingAuto: false,
                              })
                              toast.show('已取消转换', 'warning')
                            }}
                          >
                            取消转换
                          </button>
                          <button type="button" className="ml-2 text-primary hover:underline" onClick={() => setDetailBuilding(b)}>
                            详情
                          </button>
                        </>
                      ) : null}
                      {model.phase === 'converted' ? (
                        <>
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => {
                              patchModel(b.id, { ...model, phase: 'bound' })
                              toast.show('已绑定到孪生底座（演示）', 'success')
                            }}
                          >
                            绑定
                          </button>
                          <button type="button" className="ml-2 text-primary hover:underline" onClick={() => setDetailBuilding(b)}>
                            详情
                          </button>
                        </>
                      ) : null}
                      {model.phase === 'bound' ? (
                        <>
                          <button type="button" className="text-primary hover:underline" onClick={() => setDetailBuilding(b)}>
                            详情
                          </button>
                          <button
                            type="button"
                            className="ml-2 text-primary hover:underline"
                            onClick={() => {
                              patchModel(b.id, { ...model, phase: 'converted', convertProgress: 100, convertingAuto: false })
                              toast.show('已解绑（演示）', 'info')
                            }}
                          >
                            解绑
                          </button>
                          <button type="button" className="ml-2 text-primary hover:underline" onClick={() => setVersionTarget(b)}>
                            上传新版本
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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

      <Modal open={helpOpen} title="模型状态说明" onClose={() => setHelpOpen(false)}>
        <ul className="space-y-2 text-[13px] text-muted">
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-slate-300" />⚪ 未上传（灰色）
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-amber-500" />
            🟡 已上传未转换（橙色）
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-sky-500" />
            🔵 转换中（蓝色，显示进度百分比）
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            🟢 已转换（绿色）
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-600" />
            🟢 已绑定（绿色 + 「已绑定」标识）
          </li>
        </ul>
      </Modal>

      <Modal
        open={Boolean(detailBuilding)}
        title={detailBuilding ? `模型详情 · ${detailBuilding.name}` : ''}
        onClose={() => setDetailBuilding(null)}
        panelClassName="max-w-lg"
      >
        {detailBuilding ? (
          <DetailBody building={detailBuilding} parkName={parkById(detailBuilding.parkId)?.name} model={modelsByBuilding[detailBuilding.id]} />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(uploadTarget)}
        title={uploadTarget ? `上传模型 · ${uploadTarget.name}` : ''}
        onClose={() => setUploadTarget(null)}
        footer={
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setUploadTarget(null)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={() => setUploadTarget(null)}>
              完成
            </button>
          </>
        }
      >
        <p className="mb-3 text-[13px] text-muted">支持 IFC / RVT / GLB 等（演示：选择文件后写入「已上传未转换」状态）。</p>
        <input
          type="file"
          className="block w-full text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-primary-light file:px-3 file:py-2 file:text-[12px] file:font-semibold"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f || !uploadTarget) return
            const base = uploadTarget.name.replace(/栋|座|楼/g, '')
            patchModel(uploadTarget.id, {
              phase: 'uploaded',
              modelName: `${base}_上传_${f.name.slice(0, 24)}`,
              convertingAuto: true,
            })
            toast.show('已记录上传（演示，未实际上传）', 'success')
            setUploadTarget(null)
            e.target.value = ''
          }}
        />
      </Modal>

      <Modal
        open={Boolean(versionTarget)}
        title={versionTarget ? `上传新版本 · ${versionTarget.name}` : ''}
        onClose={() => setVersionTarget(null)}
        footer={
          <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setVersionTarget(null)}>
            关闭
          </button>
        }
      >
        <p className="mb-3 text-[13px] text-muted">上传后将自动提升版本号并回到「已上传未转换」，需重新转换与绑定。</p>
        <input
          type="file"
          className="block w-full text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-primary-light file:px-3 file:py-2 file:text-[12px] file:font-semibold"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f || !versionTarget) return
            const cur = modelsByBuilding[versionTarget.id]
            const nextName = bumpVersion(cur?.modelName ?? `${versionTarget.name}_土建_v1`)
            patchModel(versionTarget.id, {
              phase: 'uploaded',
              modelName: nextName,
              convertProgress: 0,
              convertingAuto: true,
            })
            toast.show(`已登记新版本：${nextName}（演示）`, 'success')
            setVersionTarget(null)
            e.target.value = ''
          }}
        />
      </Modal>
    </div>
  )
}

function DetailBody({ building, parkName, model }: { building: TwinBuilding; parkName?: string; model?: BuildingModelState }) {
  const m = model ?? { phase: 'none' as const, modelName: null }
  return (
    <dl className="grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
      <div className="sm:col-span-2 flex justify-between gap-2">
        <dt className="text-muted">单体</dt>
        <dd className="font-medium text-foreground">{building.name}</dd>
      </div>
      <div className="flex justify-between gap-2">
        <dt className="text-muted">编码</dt>
        <dd>{building.code}</dd>
      </div>
      <div className="flex justify-between gap-2">
        <dt className="text-muted">所属园区</dt>
        <dd>{parkName ?? '—'}</dd>
      </div>
      <div className="flex justify-between gap-2">
        <dt className="text-muted">楼层数</dt>
        <dd className="tabular-nums">{building.floors}</dd>
      </div>
      <div className="flex justify-between gap-2">
        <dt className="text-muted">单体类型</dt>
        <dd>{building.buildingType}</dd>
      </div>
      <div className="sm:col-span-2 border-t border-divider pt-3">
        <dt className="text-muted">模型</dt>
        <dd className="mt-1">
          <ModelStatusCell m={m} />
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-muted">模型文件</dt>
        <dd className="mt-1 text-foreground">{m.modelName ?? '—'}</dd>
      </div>
      <div className="sm:col-span-2 text-[12px] text-muted">
        轻量化任务 ID、上传人、文件大小等字段由后端返回（演示占位）。
      </div>
    </dl>
  )
}
