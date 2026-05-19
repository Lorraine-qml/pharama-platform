import { Link, Navigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Modal } from '../../components/Modal'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { StatusPill } from '../../components/ui/StatusPill'
import { resResourcePillVariant } from '../../utils/listStatusVariants'
import { RESOURCE_STATUS_LABEL } from './resopsV1Labels'
import { useResopsV1 } from './ResopsV1Context'

export default function ResopsProviderWorkbenchPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { resources, applications, confirmProvider, providerNameFilter } = useResopsV1()
  const [confirmApp, setConfirmApp] = useState<string | null>(null)
  const [note, setNote] = useState('')

  if (!user) return <Navigate to="/login" replace />
  const myRes = useMemo(() => resources.filter((r) => r.providerName === providerNameFilter || r.providerName === '园区'), [resources])
  const pendingApps = useMemo(
    () => applications.filter((a) => a.status === 'pending_confirm' && myRes.some((r) => r.id === a.resourceId)),
    [applications, myRes],
  )

  const stats = useMemo(() => {
    const nRes = myRes.length
    const pend = pendingApps.length
    return { nRes, pend, income: 12000, rate: 96 }
  }, [myRes, pendingApps])

  return (
    <div className="space-y-5">
      <ModuleIntroCard
        title={`📌 提供方工作台 · ${providerNameFilter}`}
        lines={['管理自有资源、处理申请、上传执行结果与查看评价统计（演示）。', '待处理申请请优先确认时段与资源可用性。']}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { k: '我的资源数', v: String(stats.nRes) },
          { k: '待处理申请', v: String(stats.pend) },
          { k: '本月收入', v: `¥${stats.income.toLocaleString()}` },
          { k: '好评率', v: `${stats.rate}%` },
        ].map((c) => (
          <div key={c.k} className="rounded-[var(--radius-panel)] border border-divider bg-surface p-4 shadow-sm">
            <p className="text-[12px] font-bold text-muted">{c.k}</p>
            <p className="mt-2 text-[22px] font-bold text-foreground">{c.v}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-4 shadow-sm">
        <h2 className="text-[14px] font-bold text-foreground">待处理申请（最近）</h2>
        <ul className="mt-3 space-y-2 text-[13px]">
          {pendingApps.slice(0, 5).map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-divider bg-page/40 px-3 py-2">
              <span>
                <span className="font-mono font-bold">{a.code}</span> {a.applicantLabel} · {a.resourceName} · {a.slot}
              </span>
              <span className="flex gap-2">
                <button type="button" className="rounded-md bg-primary px-2 py-1 text-[12px] font-bold text-white" onClick={() => setConfirmApp(a.id)}>
                  确认
                </button>
                <button type="button" className="rounded-md border border-divider px-2 py-1 text-[12px]" onClick={() => confirmProvider(a.id, false)}>
                  拒绝
                </button>
              </span>
            </li>
          ))}
        </ul>
        {pendingApps.length === 0 ? <p className="mt-2 text-[13px] text-muted">暂无待处理申请。</p> : null}
      </section>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-4 shadow-sm">
        <h2 className="text-[14px] font-bold">我的资源列表</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[800px] w-full text-[13px]">
            <thead className="bg-page text-[12px] font-bold text-muted">
              <tr>
                <th className="px-3 py-2 text-start">资源名称</th>
                <th className="px-3 py-2 text-start">状态</th>
                <th className="px-3 py-2 text-start">今日预约</th>
                <th className="px-3 py-2 text-start">本月使用</th>
                <th className="px-3 py-2 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {myRes.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-semibold">{r.name}</td>
                  <td className="px-3 py-2">
                    <StatusPill variant={resResourcePillVariant(r.status)}>{RESOURCE_STATUS_LABEL[r.status]}</StatusPill>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-muted">{r.id === 'res-flow' ? 2 : 1}</td>
                  <td className="px-3 py-2 tabular-nums text-muted">{r.id === 'res-flow' ? 15 : 8}</td>
                  <td className="px-3 py-2 text-end">
                    <Link to={`/resops/resource/${r.id}`} className="font-semibold text-primary hover:underline">
                      详情
                    </Link>
                    <span className="mx-2 text-divider">|</span>
                    <button type="button" className="font-semibold text-primary hover:underline" onClick={() => toast.show('编辑（演示）', 'info')}>
                      编辑
                    </button>
                    <span className="mx-2 text-divider">|</span>
                    <Link to="/resops/usage-orders" className="font-semibold text-primary hover:underline">
                      查看申请
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-4 shadow-sm">
        <h2 className="text-[14px] font-bold">收入趋势（近 7 天 · 演示）</h2>
        <div className="mt-4 flex h-28 items-end gap-2">
          {[12, 16, 14, 18, 22, 20, 24].map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-md bg-primary/70" style={{ height: `${h * 3}px` }} />
              <span className="text-[10px] text-muted">{i + 1}日</span>
            </div>
          ))}
        </div>
      </section>

      <Modal open={Boolean(confirmApp)} title="确认申请" onClose={() => setConfirmApp(null)} closeOnOverlayClick={false} panelClassName="max-w-md">
        <label className="block text-[13px] text-muted">
          备注
          <textarea className="mt-1 w-full rounded-md border border-divider px-3 py-2" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md border border-divider px-3 py-2 text-[13px]" onClick={() => setConfirmApp(null)}>
            取消
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 text-[13px] font-bold text-white"
            onClick={() => {
              if (confirmApp) confirmProvider(confirmApp, true)
              setConfirmApp(null)
              setNote('')
              toast.show('已确认并生成使用单', 'success')
            }}
          >
            确认
          </button>
        </div>
      </Modal>
    </div>
  )
}
