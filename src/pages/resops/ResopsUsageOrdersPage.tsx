import { Link, Navigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { StatusPill } from '../../components/ui/StatusPill'
import { resUsageOrderPillVariant } from '../../utils/listStatusVariants'
import { useResopsV1 } from './ResopsV1Context'
import { USAGE_ORDER_STATUS_LABEL } from './resopsV1Labels'

export default function ResopsUsageOrdersPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { usageOrders, providerNameFilter } = useResopsV1()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const rows = useMemo(() => usageOrders, [usageOrders])

  useEffect(() => {
    setPage(1)
  }, [rows.length])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="space-y-5">
      <ModuleIntroCard
        title="📌 资源使用单 · 执行与评价闭环"
        lines={[
          `演示：展示全部演示使用单（提供方视角文案仍引用「${providerNameFilter}」占位）。生产环境按企业与角色过滤可见数据。`,
          '使用单状态：待确认 → 执行中 → 待评价 → 已完成。',
        ]}
      />

      <ListToolbarRow
        left={
          <button type="button" className="rounded-md border border-divider bg-surface px-3 py-2 text-[13px]" onClick={() => toast.show('导出（演示）', 'info')}>
            导出
          </button>
        }
        right={
          <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px]" onClick={() => toast.show('高级筛选（演示）', 'info')}>
            高级筛选
          </button>
        }
      />

      <div className="overflow-hidden rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-[13px]">
            <thead className="border-b border-divider bg-[#F5F7FA] text-[12px] font-bold text-muted">
              <tr>
                <th className="px-4 py-3 text-start">使用单号</th>
                <th className="px-4 py-3 text-start">资源名称</th>
                <th className="px-4 py-3 text-start">申请方</th>
                <th className="px-4 py-3 text-start">使用时段</th>
                <th className="px-4 py-3 text-start">状态</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {paged.map((o) => (
                <tr key={o.id} className="h-12 hover:bg-primary-light/15">
                  <td className="px-4 py-3 font-mono font-semibold">{o.code}</td>
                  <td className="px-4 py-3">{o.resourceName}</td>
                  <td className="px-4 py-3 text-muted">{o.applicantLabel}</td>
                  <td className="px-4 py-3 tabular-nums text-muted">{o.slot}</td>
                  <td className="px-4 py-3">
                    <StatusPill variant={resUsageOrderPillVariant(o.status)}>{USAGE_ORDER_STATUS_LABEL[o.status]}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link to={`/resops/usage-orders/${o.id}`} className="font-semibold text-primary hover:underline">
                      详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ListPaginationBar total={rows.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1) }} />
      </div>
      {rows.length === 0 ? <p className="px-4 py-8 text-center text-[13px] text-muted">暂无使用单。</p> : null}
    </div>
  )
}
