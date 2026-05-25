import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { StatusPill } from '../../components/ui/StatusPill'
import { resListingApplicationPillVariant } from '../../utils/listStatusVariants'
import { useResopsV1 } from './ResopsV1Context'
import { LISTING_APPLICATION_STATUS_LABEL } from './resopsV1Labels'
import type { ResListingApplication, ResListingApplicationStatus } from './resopsListingTypes'

const STATUS_FILTERS: Array<'全部' | ResListingApplicationStatus> = ['全部', 'pending', 'approved', 'rejected']

export default function ResopsListingAuditPage() {
  const toast = useToast()
  const { listingApplications, approveListingApplication, rejectListingApplication } = useResopsV1()
  const [statusF, setStatusF] = useState<'全部' | ResListingApplicationStatus>('全部')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detail, setDetail] = useState<ResListingApplication | null>(null)
  const [auditTarget, setAuditTarget] = useState<ResListingApplication | null>(null)
  const [auditComment, setAuditComment] = useState('')

  const filtered = useMemo(() => {
    return listingApplications.filter((a) => {
      if (statusF !== '全部' && a.status !== statusF) return false
      if (q.trim() && !a.resourceName.includes(q.trim()) && !a.submitterLabel.includes(q.trim()) && !a.code.includes(q.trim()))
        return false
      return true
    })
  }, [listingApplications, statusF, q])

  const counts = useMemo(() => {
    const c: Record<ResListingApplicationStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    }
    listingApplications.forEach((a) => {
      c[a.status] += 1
    })
    return c
  }, [listingApplications])

  useEffect(() => {
    setPage(1)
  }, [statusF, q, listingApplications.length])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  function openAudit(a: ResListingApplication) {
    setAuditTarget(a)
    setAuditComment('')
  }

  function closeAudit() {
    setAuditTarget(null)
    setAuditComment('')
  }

  function confirmApprove() {
    if (!auditTarget) return
    if (!window.confirm(`确认通过「${auditTarget.resourceName}」的上架申请？通过后资源将自动上架至目录。`)) return
    approveListingApplication(auditTarget.id, auditComment.trim() || undefined)
    toast.show('已通过，资源已上架（演示）', 'success')
    closeAudit()
  }

  function confirmReject() {
    if (!auditTarget) return
    if (!auditComment.trim()) {
      toast.show('驳回时请填写审核意见', 'warning')
      return
    }
    if (!window.confirm(`确认驳回「${auditTarget.resourceName}」的上架申请？`)) return
    rejectListingApplication(auditTarget.id, auditComment.trim())
    toast.show('已驳回上架申请', 'warning')
    closeAudit()
  }

  return (
    <div className="space-y-5">
      <ModuleIntroCard
        title="📌 资源审核 · 上架申请管理"
        lines={[
          '管理员可查看全部资源上架申请单；待审核记录请点击「审核」进入审核弹窗处理。',
          '状态：待审核 → 已通过（资源自动上架）/ 已驳回。',
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {(['pending', 'approved', 'rejected'] as const).map((s) => (
          <div key={s} className="rounded-[var(--radius-panel)] border border-divider bg-surface px-4 py-3 shadow-sm">
            <p className="text-[12px] text-muted">{LISTING_APPLICATION_STATUS_LABEL[s]}</p>
            <p className="mt-1 text-[22px] font-bold tabular-nums text-foreground">{counts[s]}</p>
          </div>
        ))}
      </div>

      <ListToolbarRow
        left={
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-[13px] text-muted">
              状态
              <select
                value={statusF}
                onChange={(e) => setStatusF(e.target.value as '全部' | ResListingApplicationStatus)}
                className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px] text-foreground"
              >
                {STATUS_FILTERS.map((x) => (
                  <option key={x} value={x}>
                    {x === '全部' ? '全部' : LISTING_APPLICATION_STATUS_LABEL[x]}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[200px] flex-1 text-[13px] text-muted">
              申请单号 / 资源 / 提交人
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索…"
                className="mt-1 w-full rounded-md border border-divider bg-page px-3 py-2 text-[13px]"
              />
            </label>
          </div>
        }
        right={
          <button
            type="button"
            className="rounded-md border border-divider px-3 py-2 text-[12px]"
            onClick={() => toast.show('导出（演示）', 'info')}
          >
            导出
          </button>
        }
      />

      <div className="overflow-hidden rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-[13px]">
            <thead className="border-b border-divider bg-[#F5F7FA] text-[12px] font-bold text-muted">
              <tr>
                <th className="px-4 py-3 text-start">申请单号</th>
                <th className="px-4 py-3 text-start">资源名称</th>
                <th className="px-4 py-3 text-start">提交人</th>
                <th className="px-4 py-3 text-start">提交时间</th>
                <th className="px-4 py-3 text-start">状态</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {paged.map((a) => (
                <tr key={a.id} className="h-12 hover:bg-primary-light/15">
                  <td className="px-4 py-3 font-mono font-semibold">{a.code}</td>
                  <td className="px-4 py-3">{a.resourceName}</td>
                  <td className="px-4 py-3 text-muted">{a.submitterLabel}</td>
                  <td className="px-4 py-3 tabular-nums text-muted">{a.submittedAt}</td>
                  <td className="px-4 py-3">
                    <StatusPill variant={resListingApplicationPillVariant(a.status)}>
                      {LISTING_APPLICATION_STATUS_LABEL[a.status]}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setDetail(a)}>
                        查看详情
                      </button>
                      {a.status === 'pending' ? (
                        <button type="button" className="font-semibold text-foreground hover:underline" onClick={() => openAudit(a)}>
                          审核
                        </button>
                      ) : null}
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
          onPageSizeChange={(n) => {
            setPageSize(n)
            setPage(1)
          }}
        />
        {filtered.length === 0 ? <p className="px-4 py-10 text-center text-[13px] text-muted">暂无申请记录。</p> : null}
      </div>

      <Modal
        open={detail != null}
        title="上架申请详情"
        onClose={() => setDetail(null)}
        panelClassName="max-w-[640px] w-[90vw] sm:w-full"
        footer={
          <button
            type="button"
            className="rounded-md border border-divider px-4 py-2 text-[13px] font-semibold text-foreground"
            onClick={() => setDetail(null)}
          >
            关闭
          </button>
        }
      >
        {detail ? <ApplicationDetailBody app={detail} /> : null}
      </Modal>

      <Modal
        open={auditTarget != null}
        title="审核上架申请"
        onClose={closeAudit}
        panelClassName="max-w-[640px] w-[90vw] sm:w-full"
        footer={
          <>
            <button
              type="button"
              className="rounded-md border border-divider px-4 py-2 text-[13px] font-semibold text-foreground"
              onClick={closeAudit}
            >
              取消
            </button>
            <button
              type="button"
              className="rounded-md border border-danger/40 bg-danger/8 px-4 py-2 text-[13px] font-semibold text-danger"
              onClick={confirmReject}
            >
              驳回
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
              onClick={confirmApprove}
            >
              通过
            </button>
          </>
        }
      >
        {auditTarget ? (
          <div className="space-y-4 text-[13px]">
            <ApplicationDetailBody app={auditTarget} />
            <label className="block">
              <span className="font-semibold text-foreground">审核意见</span>
              <span className="ms-1 text-[12px] text-muted">（驳回时必填）</span>
              <textarea
                value={auditComment}
                onChange={(e) => setAuditComment(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-divider bg-page px-3 py-2 text-foreground"
                placeholder="请填写审核意见；通过时可留空或填写备注…"
              />
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function ApplicationDetailBody({ app }: { app: ResListingApplication }) {
  return (
    <div className="space-y-3 text-[13px]">
      <dl className="grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-muted">申请单号</dt>
          <dd className="font-mono font-semibold">{app.code}</dd>
        </div>
        <div>
          <dt className="text-muted">资源名称</dt>
          <dd className="font-semibold">{app.resourceName}</dd>
        </div>
        <div>
          <dt className="text-muted">提交人</dt>
          <dd>{app.submitterLabel}</dd>
        </div>
        <div>
          <dt className="text-muted">提交时间</dt>
          <dd className="tabular-nums">{app.submittedAt}</dd>
        </div>
        <div>
          <dt className="text-muted">状态</dt>
          <dd>
            <StatusPill variant={resListingApplicationPillVariant(app.status)}>
              {LISTING_APPLICATION_STATUS_LABEL[app.status]}
            </StatusPill>
          </dd>
        </div>
        <div>
          <dt className="text-muted">附件</dt>
          <dd>{app.attachmentName ?? '—'}</dd>
        </div>
      </dl>
      <div>
        <p className="font-semibold text-foreground">申请理由</p>
        <p className="mt-1 leading-relaxed text-muted">{app.reason}</p>
      </div>
    </div>
  )
}
