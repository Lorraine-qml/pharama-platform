import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { StatusPill } from '../../components/ui/StatusPill'
import type { ParkStatus, TwinPark } from './twinInfraTypes'
import { useTwinInfra } from './TwinInfraContext'

function emptyPark(): Omit<TwinPark, 'id' | 'updatedAt'> {
  return {
    name: '',
    code: '',
    address: '',
    areaMu: 0,
    contact: '',
    phone: '',
    remark: '',
    status: '启用',
    lng: '',
    lat: '',
    floorPlanFile: undefined,
  }
}

export default function TwinInfraParksPage() {
  const toast = useToast()
  const nav = useNavigate()
  const { parks, buildingCountForPark, addPark, updatePark, deletePark } = useTwinInfra()

  const [st, setSt] = useState<'全部' | ParkStatus>('全部')
  const [q, setQ] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TwinPark | null>(null)
  const [form, setForm] = useState<Omit<TwinPark, 'id' | 'updatedAt'>>(emptyPark())

  const rows = useMemo(() => {
    return parks.filter((p) => {
      if (st !== '全部' && p.status !== st) return false
      if (q.trim() && !`${p.name}${p.code}${p.address}`.includes(q.trim())) return false
      return true
    })
  }, [parks, st, q])

  function openCreate() {
    setEditing(null)
    setForm(emptyPark())
    setModalOpen(true)
  }

  function openEdit(p: TwinPark) {
    setEditing(p)
    setForm({
      name: p.name,
      code: p.code,
      address: p.address,
      areaMu: p.areaMu,
      contact: p.contact,
      phone: p.phone,
      remark: p.remark,
      status: p.status,
      lng: p.lng,
      lat: p.lat,
      floorPlanFile: p.floorPlanFile,
    })
    setModalOpen(true)
  }

  function save() {
    if (!form.name.trim() || !form.code.trim()) {
      toast.show('请填写园区名称与编码（必填）', 'warning')
      return
    }
    if (editing) {
      const r = updatePark(editing.id, form)
      if (!r.ok) {
        toast.show(r.msg ?? '保存失败', 'warning')
        return
      }
      toast.show('园区已更新', 'success')
    } else {
      const r = addPark(form)
      if (!r.ok) {
        toast.show(r.msg ?? '保存失败', 'warning')
        return
      }
      toast.show('园区已新增', 'success')
    }
    setModalOpen(false)
  }

  function remove(p: TwinPark) {
    const r = deletePark(p.id)
    if (!r.ok) {
      toast.show(r.msg ?? '无法删除', 'warning')
      return
    }
    toast.show('已删除园区', 'success')
  }

  return (
    <div className="space-y-4">
      <ModuleIntroCard
        title="📌 园区管理"
        lines={[
          '园区编码全局唯一；支持平面图与经纬度（演示为占位文件名）。停用的园区在「新增单体」所属园区下拉中不可选。',
          '「单体管理」跳转至单体列表并自动按该园区筛选。',
        ]}
      />
      <h1 className="text-lg font-bold text-foreground">园区管理</h1>

      <ListToolbarRow
        left={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover"
              onClick={openCreate}
            >
              + 新增园区
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
              <label className="text-[11px] font-semibold text-muted">状态</label>
              <select
                className="mt-1 block rounded-md border border-divider bg-surface px-2 py-1.5 text-[13px]"
                value={st}
                onChange={(e) => setSt(e.target.value as '全部' | ParkStatus)}
              >
                <option value="全部">全部</option>
                <option value="启用">启用</option>
                <option value="停用">停用</option>
              </select>
            </div>
            <input
              className="mt-5 rounded-md border border-divider bg-surface px-2 py-1.5 text-[13px] outline-none focus:border-primary sm:min-w-[200px]"
              placeholder="搜索名称 / 编码 / 地址"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-divider bg-card shadow-sm">
        <table className="w-full min-w-[960px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-divider bg-muted/30 text-[11px] font-semibold text-muted">
              <th className="px-3 py-2">园区名称</th>
              <th className="px-3 py-2">编码</th>
              <th className="px-3 py-2">地址</th>
              <th className="px-3 py-2">占地面积</th>
              <th className="px-3 py-2">状态</th>
              <th className="px-3 py-2">单体数</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-divider/60 hover:bg-muted/15">
                <td className="px-3 py-2 font-semibold text-foreground">{p.name}</td>
                <td className="px-3 py-2 font-mono text-[12px] text-primary">{p.code}</td>
                <td className="max-w-[220px] truncate px-3 py-2 text-muted" title={p.address}>
                  {p.address}
                </td>
                <td className="px-3 py-2 tabular-nums text-muted">{p.areaMu} 亩</td>
                <td className="px-3 py-2">
                  <StatusPill variant={p.status === '启用' ? 'success' : 'muted'}>{p.status}</StatusPill>
                </td>
                <td className="px-3 py-2 tabular-nums font-semibold text-foreground">{buildingCountForPark(p.id)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="text-[12px] font-semibold text-primary hover:underline" onClick={() => openEdit(p)}>
                      编辑
                    </button>
                    <button type="button" className="text-[12px] font-semibold text-danger hover:underline" onClick={() => remove(p)}>
                      删除
                    </button>
                    <button
                      type="button"
                      className="text-[12px] font-semibold text-primary hover:underline"
                      onClick={() => nav(`/twin/infrastructure/buildings?parkId=${encodeURIComponent(p.id)}`)}
                    >
                      单体管理
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑园区' : '新增园区'} panelClassName="max-w-lg">
        <div className="space-y-3 text-[13px]">
          <label className="block">
            <span className="text-[12px] font-semibold text-muted">园区名称（必填）</span>
            <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-[12px] font-semibold text-muted">园区编码（唯一）</span>
            <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5 font-mono" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-[12px] font-semibold text-muted">地址</span>
            <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-[12px] font-semibold text-muted">占地面积（亩）</span>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-divider px-2 py-1.5"
              value={form.areaMu || ''}
              onChange={(e) => setForm((f) => ({ ...f, areaMu: Number(e.target.value) || 0 }))}
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">联系人</span>
              <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">联系电话</span>
              <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </label>
          </div>
          <label className="block">
            <span className="text-[12px] font-semibold text-muted">备注</span>
            <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5" value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} />
          </label>
          <fieldset>
            <legend className="text-[12px] font-semibold text-muted">状态</legend>
            <div className="mt-1 flex gap-4">
              <label className="flex items-center gap-1">
                <input type="radio" checked={form.status === '启用'} onChange={() => setForm((f) => ({ ...f, status: '启用' }))} />
                启用
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" checked={form.status === '停用'} onChange={() => setForm((f) => ({ ...f, status: '停用' }))} />
                停用
              </label>
            </div>
          </fieldset>
          <label className="block">
            <span className="text-[12px] font-semibold text-muted">平面图（jpg/png，演示）</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              className="mt-1 w-full text-[12px]"
              onChange={(e) => {
                const f = e.target.files?.[0]
                setForm((x) => ({ ...x, floorPlanFile: f?.name }))
              }}
            />
            {form.floorPlanFile ? <p className="mt-1 text-[11px] text-muted">已选：{form.floorPlanFile}</p> : null}
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">经度</span>
              <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5" value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} />
            </label>
            <label className="block">
              <span className="text-[12px] font-semibold text-muted">纬度</span>
              <input className="mt-1 w-full rounded-md border border-divider px-2 py-1.5" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold" onClick={() => setModalOpen(false)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover" onClick={save}>
              保存
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
