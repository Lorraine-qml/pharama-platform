import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { useHatchMgmt } from './HatchMgmtContext'

const RECOMMEND = [
  { id: 'r1', label: 'B301（80㎡ 办公室 + 30㎡ 共享实验室）', area: 80, rent: 5000, fee: 500 },
  { id: 'r2', label: 'B302（50㎡ 办公室，需共用实验室）', area: 50, rent: 4200, fee: 420 },
]

export default function HatchPhysicalSpacePage() {
  const { user } = useAuth()
  const toast = useToast()
  const h = useHatchMgmt()
  const isOps = Boolean(user)

  const [fQ, setFQ] = useState('')
  const [allocOpen, setAllocOpen] = useState(false)
  const [selRec, setSelRec] = useState(RECOMMEND[0]!.id)
  const [keys, setKeys] = useState('2')
  const [devices, setDevices] = useState('空调、网络接口、实验台')
  const [handDate, setHandDate] = useState('2025-05-12')
  const [handPerson, setHandPerson] = useState('李四')
  const [projPick, setProjPick] = useState('h-proj-1')

  const rows = useMemo(() => {
    return h.allocations.filter((a) => !fQ.trim() || a.projectName.includes(fQ.trim()))
  }, [h.allocations, fQ])

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-foreground">实体空间入孵管理</h1>
          <p className="mt-1 text-[12px] text-muted">空间分配、交接与使用记录 · 孪生联动（演示）</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-md border border-divider px-3 py-2 text-[13px]" onClick={() => toast.show('筛选（演示）', 'info')}>
            筛选
          </button>
          {isOps ? (
            <>
              <button type="button" className="rounded-md border border-divider px-3 py-2 text-[13px]" onClick={() => toast.show('导出（演示）', 'info')}>
                导出
              </button>
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-white"
                onClick={() => setAllocOpen(true)}
              >
                空间分配
              </button>
            </>
          ) : null}
        </div>
      </header>

      <div className="rounded-[var(--radius-card)] border border-divider bg-surface p-4 shadow-sm">
        <input value={fQ} onChange={(e) => setFQ(e.target.value)} placeholder="搜索项目名称" className="w-full max-w-md rounded-md border border-divider px-3 py-2 text-[13px]" />
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-divider bg-surface shadow-sm">
        <table className="min-w-[960px] w-full border-collapse text-[13px]">
          <thead className="border-b border-divider bg-page text-left text-[12px] font-bold text-muted">
            <tr>
              <th className="px-4 py-3">项目名称</th>
              <th className="px-4 py-3">空间位置</th>
              <th className="px-4 py-3">面积</th>
              <th className="px-4 py-3">分配日期</th>
              <th className="px-4 py-3">到期日</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3 text-end">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-divider">
                <td className="px-4 py-3 font-medium">{a.projectName}</td>
                <td className="px-4 py-3 text-muted">{a.location}</td>
                <td className="px-4 py-3">{a.areaM2}㎡</td>
                <td className="px-4 py-3 text-muted">{a.assignDate}</td>
                <td className="px-4 py-3 text-muted">{a.endDate}</td>
                <td className="px-4 py-3">{a.status}</td>
                <td className="px-4 py-3 text-end">
                  <Link to={`/hatch/physical-space/${a.id}`} className="text-primary hover:underline">
                    查看
                  </Link>
                  {isOps ? (
                    <Link to="/hatch/changes" className="ms-3 text-muted hover:underline">
                      变更
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-[var(--radius-card)] border border-dashed border-primary/30 bg-primary-light/20 p-4 text-[12px] text-foreground">
        <span className="font-bold text-primary">孪生联动：</span>
        分配确认后，空间状态同步为「已占用」。
        <Link to="/twin/infrastructure/spaces" className="ms-2 font-semibold text-primary hover:underline">
          打开孪生楼层
        </Link>
      </div>

      <Modal
        open={allocOpen}
        title="空间分配"
        onClose={() => setAllocOpen(false)}
        panelClassName="max-w-[800px]"
        footer={
          <>
            <button type="button" className="rounded-md border px-4 py-2 text-[13px]" onClick={() => setAllocOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-5 py-2 text-[13px] font-bold text-white"
              onClick={() => {
                const p = h.archives.find((x) => x.id === projPick)
                const rec = RECOMMEND.find((r) => r.id === selRec)!
                if (!p) return
                h.allocateSpace({
                  projectId: p.id,
                  projectName: p.name,
                  location: rec.label.split('（')[0]?.trim() ?? 'B301',
                  areaM2: rec.area,
                  assignDate: handDate,
                  endDate: p.contractEnd ?? '2026-12-31',
                  status: '正常',
                  handoverNote: `钥匙${keys}把；设备：${devices}；交接人：${handPerson}`,
                })
                setAllocOpen(false)
                toast.show('已确认分配', 'success')
              }}
            >
              确认分配
            </button>
          </>
        }
      >
        <div className="space-y-4 text-[13px]">
          <label className="flex flex-col gap-1 text-muted">
            选择项目
            <select value={projPick} onChange={(e) => setProjPick(e.target.value)} className="rounded-md border bg-page px-3 py-2">
              {h.archives
                .filter((a) => a.incubationType === '实体')
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </label>
          <p className="text-muted">
            项目需求：<span className="text-foreground">8 人办公，细胞培养实验（演示占位）</span>
          </p>
          <div>
            <p className="mb-2 font-bold">推荐空间（规则引擎 V1）</p>
            <ul className="space-y-2">
              {RECOMMEND.map((r) => (
                <li key={r.id}>
                  <label className="flex cursor-pointer items-start gap-2 rounded-md border border-divider px-3 py-2 hover:border-primary/40">
                    <input type="radio" name="rec" checked={selRec === r.id} onChange={() => setSelRec(r.id)} />
                    <span>{r.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-divider bg-page p-4">
            <p className="mb-2 text-[12px] font-bold text-foreground">孪生平面图（嵌入占位）</p>
            <div className="flex h-36 items-center justify-center rounded-md border border-dashed border-divider bg-surface text-[12px] text-muted">
              显示楼宇平面 · 悬停房间查看面积/租金（演示）
            </div>
            <p className="mt-2 text-[12px] text-muted">
              当前选中：{RECOMMEND.find((r) => r.id === selRec)?.label} — 租金 {RECOMMEND.find((r) => r.id === selRec)?.rent} 元/月，物业费 {RECOMMEND.find((r) => r.id === selRec)?.fee} 元/月
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-muted">
              钥匙数量
              <input value={keys} onChange={(e) => setKeys(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
            </label>
            <label className="text-muted">
              交接人
              <input value={handPerson} onChange={(e) => setHandPerson(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
            </label>
            <label className="text-muted sm:col-span-2">
              设备清单
              <input value={devices} onChange={(e) => setDevices(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
            </label>
            <label className="text-muted">
              交接日期
              <input type="date" value={handDate} onChange={(e) => setHandDate(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export function HatchSpaceDetailPage() {
  const { allocationId } = useParams<{ allocationId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const h = useHatchMgmt()
  const row = h.allocations.find((a) => a.id === allocationId)
  const logs = row ? h.spaceLogs[row.id] ?? [] : []

  if (!row) {
    return (
      <div className="p-8 text-muted">
        未找到记录
        <button type="button" className="ms-3 text-primary" onClick={() => navigate('/hatch/physical-space')}>
          返回
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10">
      <button type="button" onClick={() => navigate('/hatch/physical-space')} className="text-[13px] text-primary hover:underline">
        ← 返回列表
      </button>
      <header className="rounded-lg border border-divider bg-surface p-5 shadow-sm">
        <h1 className="text-[18px] font-bold">{row.projectName}</h1>
        <p className="mt-1 text-[13px] text-muted">
          {row.location} · {row.areaM2}㎡ · {row.status}
        </p>
      </header>
      <section className="rounded-lg border border-divider bg-surface p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-bold">空间使用记录</h2>
          <button type="button" className="text-[13px] text-primary hover:underline" onClick={() => toast.show('导出记录（演示）', 'info')}>
            导出
          </button>
        </div>
        <table className="w-full border-collapse text-[13px]">
          <thead className="bg-page text-[12px] text-muted">
            <tr>
              <th className="border-b px-3 py-2 text-start">时间</th>
              <th className="border-b px-3 py-2 text-start">类型</th>
              <th className="border-b px-3 py-2 text-start">面积变化</th>
              <th className="border-b px-3 py-2 text-start">原因</th>
              <th className="border-b px-3 py-2 text-start">操作人</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-divider">
                <td className="px-3 py-2">{l.time}</td>
                <td className="px-3 py-2">{l.type}</td>
                <td className="px-3 py-2">{l.areaDelta}</td>
                <td className="px-3 py-2 text-muted">{l.reason}</td>
                <td className="px-3 py-2 text-muted">{l.operator}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
