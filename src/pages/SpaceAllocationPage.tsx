import { useMemo, useState } from 'react'
import { B_BUILDING_FLOOR3 } from '../data/mock'
import { useToast } from '../components/ToastProvider'
import { cn } from '../utils/cn'

type GridCell = {
  id: string
  areaM2: number
  base: 'free' | 'occupied'
}

/** Demo: B303 已标记为「本企业」占位 */
function isMineDemo(c: GridCell) {
  return c.id === '303'
}

export default function SpaceAllocationPage() {
  const toast = useToast()
  const grid = useMemo<GridCell[]>(
    () =>
      B_BUILDING_FLOOR3.map((r) => ({
        id: r.id,
        areaM2: r.areaM2,
        base: r.status === 'occupied' ? 'occupied' : 'free',
      })),
    [],
  )

  const [selectedId, setSelectedId] = useState<string | null>('303')
  const selected = grid.find((c) => c.id === selectedId)

  const cellStyle = (c: GridCell) => {
    if (c.base === 'occupied')
      return {
        cls: 'bg-foreground text-white shadow-inner cursor-default',
        subtitle: '已占用',
      }
    if (isMineDemo(c))
      return { cls: 'bg-primary text-white shadow-md', subtitle: '本企业' }
    if (selectedId === c.id)
      return {
        cls: 'ring-2 ring-primary ring-offset-2 bg-primary-light text-primary font-semibold',
        subtitle: '选中',
      }
    return {
      cls: 'border-2 border-dashed border-divider bg-surface hover:border-primary',
      subtitle: '空闲',
    }
  }

  const freeRooms = grid.filter((c) => c.base === 'free' && !isMineDemo(c))

  return (
    <div className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(260px,320px),minmax(0,1fr)]">
        <aside className="space-y-4 rounded-[var(--radius-card)] border border-divider bg-surface p-5 shadow-card">
          <dl className="space-y-2 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-muted">企业</dt>
              <dd className="font-medium text-foreground">北海基因</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">入驻类型</dt>
              <dd className="font-medium text-foreground">实体</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">分配状态</dt>
              <dd className="font-medium text-foreground">
                <span className="text-muted">孪生预览</span>
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="mb-2 text-[13px] font-semibold text-foreground">可用空间列表</h3>
            <ul className="space-y-1 text-[13px] text-muted">
              {freeRooms.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="w-full rounded-[var(--radius-button)] border border-transparent px-2 py-1.5 text-left hover:bg-page hover:text-primary"
                    onClick={() => setSelectedId(r.id)}
                  >
                    • B{r.id}（{r.areaM2}㎡）
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            disabled={!selectedId || selected?.base !== 'free' || isMineDemo(selected)}
            className={cn(
              'w-full rounded-[var(--radius-button)] py-3 text-[14px] font-medium text-white',
              selectedId && selected?.base === 'free' && selected && !isMineDemo(selected)
                ? 'bg-primary hover:bg-primary-hover'
                : 'cursor-not-allowed bg-divider text-muted',
            )}
            onClick={() => selectedId && toast.show(`确认分配 B${selectedId}，联动门禁 / 计费（演示）`, 'success')}
          >
            {selectedId ? `确认分配 B${selectedId}` : '请先选择空闲房间'}
          </button>

          <p className="text-[12px] leading-relaxed text-muted">
            PRD：点击平面图空闲房与列表联动，展示面积与租金预览；【确认分配】后房间变更为本企业色并触发流程。
          </p>
        </aside>

        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-card">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-[15px] font-semibold text-foreground">平面图 (B栋3层)</div>
            <div className="flex flex-wrap gap-4 text-[12px] text-muted">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block size-4 rounded border-2 border-dashed border-divider bg-surface" />{' '}
                空闲
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block size-4 rounded bg-primary" /> 本企业
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block size-4 rounded bg-foreground" /> 已占用
              </span>
            </div>
          </header>

          <div className="grid max-w-xl grid-cols-3 gap-3">
            {grid.map((c) => {
              const { cls, subtitle } = cellStyle(c)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    if (c.base !== 'occupied') setSelectedId(c.id)
                  }}
                  disabled={c.base === 'occupied'}
                  className={cn(
                    'relative flex aspect-[4/3] flex-col items-center justify-center rounded-[var(--radius-card)] text-[14px] transition-[transform,box-shadow] hover:brightness-[1.02]',
                    cls,
                  )}
                >
                  <span className="font-semibold">{c.id}</span>
                  <span className="mt-1 text-[11px] opacity-90">{subtitle}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-[13px] text-muted">
            <button type="button" className="rounded-[var(--radius-button)] border border-divider px-3 py-1.5">
              缩小
            </button>
            <button type="button" className="rounded-[var(--radius-button)] border border-divider px-3 py-1.5">
              放大
            </button>
            <button type="button" className="rounded-[var(--radius-button)] border border-divider px-3 py-1.5">
              🔍
            </button>
          </div>

          {selected && selected.base === 'free' && !isMineDemo(selected) ? (
            <div className="mt-8 rounded-[var(--radius-card)] border border-divider bg-page p-4 text-[13px]">
              <strong className="text-foreground">B{selected.id}</strong>
              <span className="text-muted"> · 面积 </span>
              <span>{selected.areaM2}㎡</span>
              <span className="mx-2 text-divider">|</span>
              <span className="text-muted">租金预览：</span>
              <span className="font-medium text-foreground">
                {(selected.areaM2 * 120).toLocaleString()} 元/月（演示）
              </span>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
