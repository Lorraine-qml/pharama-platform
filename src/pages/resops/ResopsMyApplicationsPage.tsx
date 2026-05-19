import { Link, Navigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { StatusPill } from '../../components/ui/StatusPill'
import { resApplicationPillVariant } from '../../utils/listStatusVariants'
import type { ResApplication } from './resopsV1Types'
import { useResopsV1 } from './ResopsV1Context'
import { APPLICATION_STATUS_LABEL } from './resopsV1Labels'

export default function ResopsMyApplicationsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { applications, usageOrders } = useResopsV1()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const rows = useMemo(() => applications, [applications])

  useEffect(() => {
    setPage(1)
  }, [rows.length])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  function detailTo(a: ResApplication) {
    const o = usageOrders.find((x) => x.applicantKey === a.applicantKey && x.resourceId === a.resourceId)
    return o ? `/resops/usage-orders/${o.id}` : '/resops/usage-orders'
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="space-y-5">
      <ModuleIntroCard
        title="📌 我的申请 · 预约与变更跟踪"
        lines={[
          '演示：列表汇总全部演示申请单，不按登录角色过滤；生产环境仅展示本企业/本人数据。',
          '状态：待确认 → 已通过 → 执行中 → 待评价 → 已完成。',
        ]}
      />

      <ListToolbarRow
        left={
          <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px]" onClick={() => toast.show('导出（演示）', 'info')}>
            导出
          </button>
        }
        right={
          <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px]" onClick={() => toast.show('筛选（演示）', 'info')}>
            筛选
          </button>
        }
      />

      <div className="overflow-hidden rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[880px] w-full text-[13px]">
            <thead className="border-b border-divider bg-[#F5F7FA] text-[12px] font-bold text-muted">
              <tr>
                <th className="px-4 py-3 text-start">申请单号</th>
                <th className="px-4 py-3 text-start">资源名称</th>
                <th className="px-4 py-3 text-start">使用时段</th>
                <th className="px-4 py-3 text-start">状态</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {paged.map((a) => (
                <tr key={a.id} className="h-12 hover:bg-primary-light/15">
                  <td className="px-4 py-3 font-mono font-semibold">{a.code}</td>
                  <td className="px-4 py-3">{a.resourceName}</td>
                  <td className="px-4 py-3 tabular-nums text-muted">{a.slot}</td>
                  <td className="px-4 py-3">
                    <StatusPill variant={resApplicationPillVariant(a.status)}>{APPLICATION_STATUS_LABEL[a.status]}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex flex-wrap justify-end gap-2">
                      {a.status === 'pending_confirm' ? (
                        <button type="button" className="font-semibold text-danger hover:underline" onClick={() => toast.show('已取消（演示）', 'warning')}>
                          取消
                        </button>
                      ) : null}
                      <Link className="font-semibold text-primary hover:underline" to={detailTo(a)}>
                        详情
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ListPaginationBar total={rows.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1) }} />
      </div>
      {rows.length === 0 ? <p className="px-4 py-8 text-center text-[13px] text-muted">暂无申请记录。</p> : null}
    </div>
  )
}
