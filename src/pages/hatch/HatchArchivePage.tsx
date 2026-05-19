import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { StatusPill } from '../../components/ui/StatusPill'
import { hatchArchivePillVariant } from '../../utils/listStatusVariants'
import { useHatchMgmt } from './HatchMgmtContext'
import type { HatchIncubationType, HatchProjectStatus } from './hatchTypes'

export default function HatchArchivePage() {
  const { user } = useAuth()
  const toast = useToast()
  const { archives } = useHatchMgmt()
  const isOps = Boolean(user)

  const [fStatus, setFStatus] = useState<HatchProjectStatus | '全部'>('全部')
  const [fInc, setFInc] = useState<HatchIncubationType | '全部'>('全部')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const rows = useMemo(() => {
    return archives.filter((a) => {
      if (fStatus !== '全部' && a.status !== fStatus) return false
      if (fInc !== '全部' && a.incubationType !== fInc) return false
      if (q.trim() && !a.name.includes(q.trim())) return false
      return true
    })
  }, [archives, fStatus, fInc, q])

  useEffect(() => {
    setPage(1)
  }, [fStatus, fInc, q])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="📌 入孵项目档案 · 项目主数据中心"
        lines={[
          '与科创策源资料合并（演示），结构化同步；支持查看、编辑与导入导出。',
          '核心流程：决策通过 → 签约 → 档案初始化 → 空间分配（实体） → 正常运营 → 变更 / 毕业。',
          '状态说明：待签约需签署协议；档案初始化需补充管线、团队、融资等信息；正常运营可申请资源与使用 AI 服务。',
        ]}
      />

      <ListToolbarRow
        left={
          <>
            {isOps ? (
              <Link
                to="/innovation/applicant/register?ops=1"
                className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
              >
                代录入孵申请
              </Link>
            ) : null}
            {isOps ? (
              <button type="button" className="rounded-md border border-divider bg-surface px-3 py-2 text-[13px]" onClick={() => toast.show('导入（演示）', 'info')}>
                导入
              </button>
            ) : null}
            {isOps ? (
              <button type="button" className="rounded-md border border-divider bg-surface px-3 py-2 text-[13px]" onClick={() => toast.show('导出（演示）', 'info')}>
                导出
              </button>
            ) : null}
          </>
        }
        right={
          <>
            <label className="text-[12px] text-muted">
              状态
              <select value={fStatus} onChange={(e) => setFStatus(e.target.value as HatchProjectStatus | '全部')} className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]">
                {(['全部', '待审核', '待签约', '正常运营', '暂停', '毕业', '退出'] as const).map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="text-[12px] text-muted">
              入孵类型
              <select value={fInc} onChange={(e) => setFInc(e.target.value as HatchIncubationType | '全部')} className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]">
                {(['全部', '实体', '虚拟', '服务商'] as const).map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="min-w-[200px] text-[12px] text-muted">
              项目名称
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索" className="mt-1 w-full rounded-md border border-divider px-3 py-2 text-[13px]" />
            </label>
          </>
        }
      />

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-divider bg-surface text-[14px] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse">
            <thead className="sticky top-0 z-[1] border-b border-divider bg-[#F5F7FA] text-left text-[12px] font-bold text-muted">
              <tr>
                <th className="px-4 py-3">项目名称</th>
                <th className="px-4 py-3">主体类型</th>
                <th className="px-4 py-3">入孵类型</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">标签</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((a) => (
                <tr key={a.id} className="h-12 border-b border-divider hover:bg-primary-light/15">
                  <td className="px-4 py-3 font-medium text-foreground">{a.name}</td>
                  <td className="px-4 py-3 text-muted">{a.entityType}</td>
                  <td className="px-4 py-3 text-muted">{a.incubationType}</td>
                  <td className="px-4 py-3">
                    <StatusPill variant={hatchArchivePillVariant(a.status)}>{a.status}</StatusPill>
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-[12px] text-muted">{a.tags.join('，')}</td>
                  <td className="px-4 py-3 text-end">
                    <Link to={`/hatch/archive/${a.id}`} className="font-semibold text-primary hover:underline">
                      查看档案
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ListPaginationBar total={rows.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1) }} />
      </div>
    </div>
  )
}
