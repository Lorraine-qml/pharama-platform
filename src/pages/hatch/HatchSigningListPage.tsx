import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { StatusPill } from '../../components/ui/StatusPill'
import { useToast } from '../../components/ToastProvider'
import { hatchSignPillVariant } from '../../utils/listStatusVariants'
import { useHatchMgmt } from './HatchMgmtContext'
import type { SigningContract } from './hatchTypes'
import { ContractDetailReadonlyModal } from './ContractDetailReadonlyModal'

const INC_TYPES = ['全部', '实体', '虚拟', '服务商'] as const
const SIGN_STATUSES = ['全部', '待签署', '已生效', '即将到期', '已到期', '已终止', '续约中'] as const

export function HatchSigningListPage() {
  const { user } = useAuth()
  const toast = useToast()
  const isOps = user?.role === 'platform' || user?.role === 'enterprise-admin'
  const { contracts } = useHatchMgmt()

  const [fType, setFType] = useState<(typeof INC_TYPES)[number]>('全部')
  const [fStatus, setFStatus] = useState<(typeof SIGN_STATUSES)[number]>('全部')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [viewOpen, setViewOpen] = useState<SigningContract | null>(null)

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (fType !== '全部' && c.incubationType !== fType) return false
      if (fStatus !== '全部' && c.signStatus !== fStatus) return false
      if (q.trim() && !c.projectName.includes(q.trim())) return false
      return true
    })
  }, [contracts, fType, fStatus, q])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  function downloadScan(c: SigningContract) {
    if (!c.scanFileName) {
      toast.show('暂无扫描件', 'warning')
      return
    }
    toast.show(`开始下载 ${c.scanFileName}（演示）`, 'info')
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-bold text-foreground">签约列表</h1>
        <div className="flex gap-2">
          {isOps ? (
            <button
              type="button"
              className="rounded-[var(--radius-button)] border border-divider bg-surface px-4 py-2 text-[13px] font-semibold hover:border-primary/40"
              onClick={() => toast.show('导出任务已加入队列（演示）', 'info')}
            >
              导出
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-[var(--radius-button)] border border-divider px-4 py-2 text-[13px] font-semibold hover:border-primary/40"
            onClick={() => toast.show('列表已刷新', 'info')}
          >
            刷新
          </button>
        </div>
      </div>

      <p className="text-[13px] text-muted">合同档案查询，仅查看与下载，流程操作请前往「签约工作台」。</p>

      <ListToolbarRow
        left={null}
        right={
          <>
            <label className="text-[12px] text-muted">
              签约状态
              <select
                value={fStatus}
                onChange={(e) => setFStatus(e.target.value as (typeof SIGN_STATUSES)[number])}
                className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]"
              >
                {SIGN_STATUSES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="text-[12px] text-muted">
              入孵类型
              <select
                value={fType}
                onChange={(e) => setFType(e.target.value as (typeof INC_TYPES)[number])}
                className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]"
              >
                {INC_TYPES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="min-w-[180px] text-[12px] text-muted">
              项目名称
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索"
                className="mt-1 w-full rounded-md border border-divider px-3 py-2 text-[13px]"
              />
            </label>
          </>
        }
      />

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-divider bg-surface text-[14px] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full border-collapse">
            <thead className="sticky top-0 z-[1] border-b border-divider bg-[#F5F7FA] text-left text-[12px] font-bold text-muted">
              <tr>
                <th className="px-4 py-3">项目名称</th>
                <th className="px-4 py-3">入孵类型</th>
                <th className="px-4 py-3">签约状态</th>
                <th className="px-4 py-3">合同到期日</th>
                <th className="px-4 py-3">租金(元/月)</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => (
                <tr key={c.id} className="h-12 border-b border-divider last:border-0 hover:bg-primary-light/15">
                  <td className="px-4 py-3 font-medium text-foreground">{c.projectName}</td>
                  <td className="px-4 py-3 text-muted">{c.incubationType}</td>
                  <td className="px-4 py-3">
                    <StatusPill variant={hatchSignPillVariant(c.signStatus)}>{c.signStatus}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.contractEnd ?? c.termEnd ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{c.rentYuanPerMonth ?? '—'}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex flex-wrap justify-end gap-2 text-[13px]">
                      {['已生效', '即将到期'].includes(c.signStatus) ? (
                        <>
                          <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setViewOpen(c)}>
                            查看合同
                          </button>
                          <button type="button" className="font-semibold text-muted hover:underline" onClick={() => downloadScan(c)}>
                            下载扫描件
                          </button>
                        </>
                      ) : (
                        <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setViewOpen(c)}>
                          查看详情
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ListPaginationBar
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(n: number) => {
            setPageSize(n)
            setPage(1)
          }}
        />
      </div>

      <ContractDetailReadonlyModal contract={viewOpen} open={viewOpen !== null} onClose={() => setViewOpen(null)} />
    </div>
  )
}
