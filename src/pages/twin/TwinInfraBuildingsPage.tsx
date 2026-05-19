import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { StatusPill } from '../../components/ui/StatusPill'
import type { BuildingStatus, BuildingType, TwinBuilding } from './twinInfraTypes'
import { useTwinInfra } from './TwinInfraContext'

const BUILDING_TYPES: BuildingType[] = ['办公楼', '实验楼', '综合楼']

export default function TwinInfraBuildingsPage() {
  const toast = useToast()
  const nav = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { parks, buildings, parkById, spaceCountForBuilding, addBuilding, updateBuilding, deleteBuilding, suggestBuildingCode } =
    useTwinInfra()

  const parkFilter = searchParams.get('parkId') ?? '全部'
  const [st, setSt] = useState<'全部' | BuildingStatus>('全部')
  const [q, setQ] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TwinBuilding | null>(null)
  const [form, setForm] = useState<Omit<TwinBuilding, 'id' | 'updatedAt'> | null>(null)

  function setParkFilter(next: string) {
    const sp = new URLSearchParams(searchParams)
    if (next === '全部') sp.delete('parkId')
    else sp.set('parkId', next)
    setSearchParams(sp, { replace: true })
  }

  const enabledParks = useMemo(() => parks.filter((p) => p.status === '启用'), [parks])

  function parkOptionsForForm(forEdit: TwinBuilding | null) {
    if (!forEdit) return enabledParks
    const cur = parkById(forEdit.parkId)
    if (cur && cur.status === '停用') {
      const rest = enabledParks.filter((p) => p.id !== cur.id)
      return [cur, ...rest]
    }
    return enabledParks
  }

  function openCreate() {
    const defaultPark = enabledParks[0]?.id ?? parks[0]?.id ?? ''
    setEditing(null)
    setForm({
      name: '',
      code: defaultPark ? suggestBuildingCode(defaultPark, '新') : '',
      parkId: defaultPark,
      floors: 1,
      areaM2: 0,
      buildingType: '办公楼',
      status: '启用',
      remark: '',
      facadeFile: undefined,
    })
    setModalOpen(true)
  }

  function openEdit(b: TwinBuilding) {
    setEditing(b)
    setForm({
      name: b.name,
      code: b.code,
      parkId: b.parkId,
      floors: b.floors,
      areaM2: b.areaM2,
      buildingType: b.buildingType,
      status: b.status,
      remark: b.remark,
      facadeFile: b.facadeFile,
    })
    setModalOpen(true)
  }

  function save() {
    if (!form) return
    if (!form.name.trim() || !form.code.trim() || !form.parkId) {
      toast.show('请填写单体名称、编码并选择所属园区', 'warning')
      return
    }
    if (editing) {
      const r = updateBuilding(editing.id, form)
      if (!r.ok) {
        toast.show(r.msg ?? '保存失败', 'warning')
        return
      }
      toast.show('单体已更新', 'success')
    } else {
      const r = addBuilding(form)
      if (!r.ok) {
        toast.show(r.msg ?? '保存失败', 'warning')
        return
      }
      toast.show('单体已新增', 'success')
    }
    setModalOpen(false)
    setForm(null)
  }

  function remove(b: TwinBuilding) {
    const r = deleteBuilding(b.id)
    if (!r.ok) {
      toast.show(r.msg ?? '无法删除', 'warning')
      return
    }
    toast.show('已删除单体', 'success')
  }

  const rows = useMemo(() => {
    return buildings.filter((b) => {
      if (parkFilter !== '全部' && b.parkId !== parkFilter) return false
      if (st !== '全部' && b.status !== st) return false
      const pk = parkById(b.parkId)
      if (q.trim()) {
        const hay = `${b.name}${b.code}${pk?.name ?? ''}`
        if (!hay.includes(q.trim())) return false
      }
      return true
    })
  }, [buildings, parkFilter, st, q, parkById])

  return (
    <div className="space-y-4">
      <ModuleIntroCard
        title="📌 单体管理"
        lines={[
          '单体编码在所属园区内唯一；建议格式为「园区编码-缩写」（可使用「建议编码」按钮）。',
          '「空间管理」跳转至空间列表并自动按该单体筛选；停用园区在新增时下拉中不可选（已有关联单体不受影响）。',
        ]}
      />
      <h1 className="text-lg font-bold text-foreground">单体管理</h1>

      <ListToolbarRow
        left={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover"
              onClick={openCreate}
            >
              + 新增单体
            </button>
            <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold hover:border-primary" onClick={() => toast.show('导入（演示）', 'info')}>
              导入
            </button>
            <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold hover:border-primary" onClick={() => toast.show('导出（演示）', 'info')}>
              导出
            </button>
          </div>
        }
        right={
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="text-[11px] font-semibold text-muted">园区</label>
              <select
                className="mt-1 block rounded-md border border-divider bg-surface px-2 py-1.5 text-[13px]"
                value={parkFilter}
                onChange={(e) => setParkFilter(e.target.value)}
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
              <label className="text-[11px] font-semibold text-muted">状态</label>
              <select
                className="mt-1 block rounded-md border border-divider bg-surface px-2 py-1.5 text-[13px]"
                value={st}
                onChange={(e) => setSt(e.target.value as '全部' | BuildingStatus)}
              >
                <option value="全部">全部</option>
                <option value="启用">启用</option>
                <option value="停用">停用</option>
              </select>
            </div>
            <input
              className="mt-5 rounded-md border border-divider bg-surface px-2 py-1.5 text-[13px] outline-none focus:border-primary sm:min-w-[200px]"
              placeholder="搜索名称 / 编码"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-divider bg-card shadow-sm">
        <table className="w-full min-w-[1020px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-divider bg-muted/30 text-[11px] font-semibold text-muted">
              <th className="px-3 py-2">单体名称</th>
              <th className="px-3 py-2">编码</th>
              <th className="px-3 py-2">所属园区</th>
              <th className="px-3 py-2">楼层数</th>
              <th className="px-3 py-2">建筑面积</th>
              <th className="px-3 py-2">类型</th>
              <th className="px-3 py-2">状态</th>
              <th className="px-3 py-2">空间数</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const pk = parkById(b.parkId)
              return (
                <tr key={b.id} className="border-b border-divider/60 hover:bg-muted/15">
                  <td className="px-3 py-2 font-semibold text-foreground">{b.name}</td>
                  <td className="px-3 py-2 font-mono text-[12px] text-primary">{b.code}</td>
                  <td className="px-3 py-2 text-muted">{pk?.name ?? '—'}</td>
                  <td className="px-3 py-2 tabular-nums text-muted">{b.floors} 层</td>
                  <td className="px-3 py-2 tabular-nums text-muted">{b.areaM2} ㎡</td>
                  <td className="px-3 py-2 text-muted">{b.buildingType}</td>
                  <td className="px-3 py-2">
                    <StatusPill variant={b.status === '启用' ? 'success' : 'muted'}>{b.status}</StatusPill>
                  </td>
                  <td className="px-3 py-2 tabular-nums font-semibold text-foreground">{spaceCountForBuilding(b.id)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="text-[12px] font-semibold text-primary hover:underline" onClick={() => openEdit(b)}>
                        编辑
                      </button>
                      <button type="button" className="text-[12px] font-semibold text-danger hover:underline" onClick={() => remove(b)}>
                        删除
                      </button>
                      <button
                        type="button"
                        className="text-[12px] font-semibold text-primary hover:underline"
                        onClick={() => nav(`/twin/infrastructure/spaces?buildingId=${encodeURIComponent(b.id)}`)}
                      >
                        空间管理
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑单体' : '新增单体'} panelClassName="max-w-lg">
        {form ? (
          <div className="space-y-3 text-[13px]">
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">单体名称（必填）</span>
              <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5" value={form.name} onChange={(e) => setForm((f) => (f ? { ...f, name: e.target.value } : f))} />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <label className="block min-w-0 flex-1">
                <span className="text-[12px] font-semibold text-muted">单体编码（园区内唯一）</span>
                <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5 font-mono" value={form.code} onChange={(e) => setForm((f) => (f ? { ...f, code: e.target.value } : f))} />
              </label>
              <button
                type="button"
                className="shrink-0 rounded-md border border-divider px-2 py-1.5 text-[12px] font-semibold hover:border-primary"
                onClick={() => setForm((f) => (f ? { ...f, code: suggestBuildingCode(f.parkId, f.name || 'X') } : f))}
              >
                建议编码
              </button>
            </div>
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">所属园区</span>
              <select
                className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5"
                value={form.parkId}
                onChange={(e) => setForm((f) => (f ? { ...f, parkId: e.target.value } : f))}
              >
                {parkOptionsForForm(editing).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.status === '停用' ? '（停用）' : ''}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="text-[12px] font-semibold text-muted">楼层数</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-md border border-divider px-2 py-1.5"
                  value={form.floors || ''}
                  onChange={(e) => setForm((f) => (f ? { ...f, floors: Math.max(1, Number(e.target.value) || 1) } : f))}
                />
              </label>
              <label className="block">
                <span className="text-[12px] font-semibold text-muted">建筑面积（㎡）</span>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-md border border-divider px-2 py-1.5"
                  value={form.areaM2 || ''}
                  onChange={(e) => setForm((f) => (f ? { ...f, areaM2: Number(e.target.value) || 0 } : f))}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">建筑类型</span>
              <select
                className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5"
                value={form.buildingType}
                onChange={(e) => setForm((f) => (f ? { ...f, buildingType: e.target.value as BuildingType } : f))}
              >
                {BUILDING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend className="text-[12px] font-semibold text-muted">状态</legend>
              <div className="mt-1 flex gap-4">
                <label className="flex items-center gap-1">
                  <input type="radio" checked={form.status === '启用'} onChange={() => setForm((f) => (f ? { ...f, status: '启用' } : f))} />
                  启用
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" checked={form.status === '停用'} onChange={() => setForm((f) => (f ? { ...f, status: '停用' } : f))} />
                  停用
                </label>
              </div>
            </fieldset>
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">外观图（演示）</span>
              <input
                type="file"
                className="mt-1 w-full text-[12px]"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  setForm((f) => (f ? { ...f, facadeFile: file?.name } : f))
                }}
              />
              {form.facadeFile ? <p className="mt-1 text-[11px] text-muted">已选：{form.facadeFile}</p> : null}
            </label>
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">备注</span>
              <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5" value={form.remark} onChange={(e) => setForm((f) => (f ? { ...f, remark: e.target.value } : f))} />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold" onClick={() => setModalOpen(false)}>
                取消
              </button>
              <button type="button" className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover" onClick={save}>
                保存
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
