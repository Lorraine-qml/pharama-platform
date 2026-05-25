import { Navigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Modal } from '../../components/Modal'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { StatusPill } from '../../components/ui/StatusPill'
import { resListingApplicationPillVariant } from '../../utils/listStatusVariants'
import type { ResResource } from './resopsV1Types'
import { useResopsV1 } from './ResopsV1Context'
import { demoListingSubmitterForUser, feeSummary, LISTING_APPLICATION_STATUS_LABEL } from './resopsV1Labels'
import type { ResListingApplication, ResListingApplicationStatus } from './resopsListingTypes'

const STATUS_FILTERS: Array<'全部' | ResListingApplicationStatus> = ['全部', 'pending', 'approved', 'rejected', 'cancelled']

function resourceBlocked(
  resourceId: string,
  listingApplications: { resourceId: string; status: string }[],
): boolean {
  return listingApplications.some(
    (a) => a.resourceId === resourceId && (a.status === 'pending' || a.status === 'approved'),
  )
}

export default function ResopsListingApplyPage() {
  const { user } = useAuth()
  const toast = useToast()
  const { resources, listingApplications, submitListingApplication, withdrawListingApplication } = useResopsV1()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusF, setStatusF] = useState<'全部' | ResListingApplicationStatus>('全部')
  const [q, setQ] = useState('')
  const [selectedResourceId, setSelectedResourceId] = useState('')
  const [applyOpen, setApplyOpen] = useState(false)
  const [applyModalResource, setApplyModalResource] = useState<ResResource | null>(null)
  const [reason, setReason] = useState('')
  const [attachmentName, setAttachmentName] = useState('')
  const [detail, setDetail] = useState<ResListingApplication | null>(null)

  const submitter = user ? demoListingSubmitterForUser(user) : null

  const myApplications = useMemo(() => {
    if (!submitter) return []
    return listingApplications.filter((a) => a.submitterKey === submitter.key)
  }, [listingApplications, submitter])

  const eligibleResources = useMemo(() => {
    return resources.filter((r) => r.status === 'pending_listing' && !resourceBlocked(r.id, listingApplications))
  }, [resources, listingApplications])

  const applyResource = useMemo(
    () => eligibleResources.find((r) => r.id === selectedResourceId) ?? null,
    [eligibleResources, selectedResourceId],
  )

  const filtered = useMemo(() => {
    return myApplications.filter((a) => {
      if (statusF !== '全部' && a.status !== statusF) return false
      if (
        q.trim() &&
        !a.resourceName.includes(q.trim()) &&
        !a.code.includes(q.trim()) &&
        !a.submitterLabel.includes(q.trim())
      )
        return false
      return true
    })
  }, [myApplications, statusF, q])

  useEffect(() => {
    setPage(1)
  }, [filtered.length, statusF, q])

  useEffect(() => {
    if (eligibleResources.length === 0) {
      setSelectedResourceId('')
      return
    }
    if (!eligibleResources.some((r) => r.id === selectedResourceId)) {
      setSelectedResourceId(eligibleResources[0]!.id)
    }
  }, [eligibleResources, selectedResourceId])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  if (!user) return <Navigate to="/login" replace />

  function openApplyModal() {
    if (!applyResource) {
      toast.show('请先选择可申请上架的资源', 'warning')
      return
    }
    setApplyModalResource(applyResource)
    setReason('')
    setAttachmentName('')
    setApplyOpen(true)
  }

  function openResubmit(a: ResListingApplication) {
    const r = resources.find((x) => x.id === a.resourceId)
    if (!r || r.status !== 'pending_listing') {
      toast.show('该资源当前不可再次提交上架申请', 'warning')
      return
    }
    if (resourceBlocked(r.id, listingApplications)) {
      toast.show('该资源已有在审或已通过的上架申请', 'warning')
      return
    }
    setApplyModalResource(r)
    setSelectedResourceId(r.id)
    setReason(a.reason)
    setAttachmentName(a.attachmentName ?? '')
    setApplyOpen(true)
  }

  function withdrawApplication(a: ResListingApplication) {
    if (!submitter) return
    if (!window.confirm(`确认撤销申请单「${a.code}」？撤销后可重新提交。`)) return
    const ok = withdrawListingApplication(a.id, submitter.key)
    if (!ok) {
      toast.show('撤销失败（可能已审核或无权操作）', 'warning')
      return
    }
    toast.show('已撤销上架申请', 'success')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAttachmentName(e.target.files?.[0]?.name ?? '')
  }

  function submitApply() {
    if (!applyModalResource || !submitter) return
    if (!reason.trim()) {
      toast.show('请填写申请理由', 'warning')
      return
    }
    const id = submitListingApplication({
      resourceId: applyModalResource.id,
      resourceName: applyModalResource.name,
      reason: reason.trim(),
      attachmentName: attachmentName || undefined,
      submitterKey: submitter.key,
      submitterLabel: submitter.label,
    })
    if (!id) {
      toast.show('该资源暂不可申请上架（可能已有在审或已通过的上架单）', 'warning')
      return
    }
    toast.show('上架申请已提交', 'success')
    setApplyOpen(false)
    setApplyModalResource(null)
  }

  function closeApplyModal() {
    setApplyOpen(false)
    setApplyModalResource(null)
  }

  const submittedAtPreview = new Date().toISOString().slice(0, 16).replace('T', ' ')

  return (
    <div className="space-y-5">
      <ModuleIntroCard
        title="📌 资源上架 · 提交与跟踪"
        lines={[
          '选择已准入待上架的资源并提交上架申请；下方列表仅展示本人历史申请记录。',
          '审核通过后资源将出现在资源目录，请留意列表中的审核状态。',
        ]}
      />

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <h2 className="text-[15px] font-bold text-foreground">提交上架申请</h2>
        <p className="mt-1 text-[13px] text-muted">从下拉列表选择资源，填写申请信息后提交。</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[280px] flex-1 text-[13px] text-muted">
            选择资源
            <select
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              disabled={eligibleResources.length === 0}
              className="mt-1 block w-full rounded-md border border-divider bg-page px-3 py-2 text-[13px] text-foreground disabled:opacity-50"
            >
              {eligibleResources.length === 0 ? (
                <option value="">暂无可申请上架的资源</option>
              ) : (
                eligibleResources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}（{r.level2} · {r.providerName}）
                  </option>
                ))
              )}
            </select>
          </label>
          <button
            type="button"
            disabled={eligibleResources.length === 0}
            className="rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            onClick={openApplyModal}
          >
            提交上架申请
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-bold text-foreground">我的上架申请</h2>
        <ListToolbarRow
          left={
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-[13px] text-muted">
                审核状态
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
                申请单号 / 资源名称
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="搜索…"
                  className="mt-1 w-full rounded-md border border-divider bg-page px-3 py-2 text-[13px] text-foreground"
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
                  <th className="px-4 py-3 text-start">审核状态</th>
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
                          <button type="button" className="font-semibold text-danger hover:underline" onClick={() => withdrawApplication(a)}>
                            撤销
                          </button>
                        ) : null}
                        {a.status === 'rejected' ? (
                          <button type="button" className="font-semibold text-foreground hover:underline" onClick={() => openResubmit(a)}>
                            再次提交
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
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-muted">暂无上架申请记录。</p>
          ) : null}
        </div>
      </section>

      <Modal
        open={applyOpen && applyModalResource != null}
        title="申请资源上架"
        onClose={closeApplyModal}
        panelClassName="max-w-[640px] w-[90vw] sm:w-full"
        footer={
          <>
            <button
              type="button"
              className="rounded-md border border-divider px-4 py-2 text-[13px] font-semibold text-foreground"
              onClick={closeApplyModal}
            >
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
              onClick={submitApply}
            >
              提交申请
            </button>
          </>
        }
      >
        {applyModalResource ? (
          <div className="space-y-4 text-[13px]">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-muted">资源名称</dt>
                <dd className="font-semibold text-foreground">{applyModalResource.name}</dd>
              </div>
              <div>
                <dt className="text-muted">资源类型</dt>
                <dd className="font-medium text-foreground">
                  {applyModalResource.level2} ·{' '}
                  {feeSummary(applyModalResource.feeMode, applyModalResource.priceAmount, applyModalResource.priceUnit)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">提交人</dt>
                <dd className="font-medium text-foreground">{submitter?.label}</dd>
              </div>
              <div>
                <dt className="text-muted">提交时间</dt>
                <dd className="tabular-nums font-medium text-foreground">{submittedAtPreview}</dd>
              </div>
            </dl>
            <label className="block">
              <span className="font-semibold text-foreground">
                申请理由 <span className="text-danger">*</span>
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="请说明申请上架的目的、展示范围等…"
                className="mt-1 w-full rounded-md border border-divider bg-page px-3 py-2 text-foreground"
              />
            </label>
            <label className="block">
              <span className="font-semibold text-foreground">附件上传</span>
              <input
                type="file"
                className="mt-1 block w-full text-[13px] file:me-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-primary"
                onChange={handleFileChange}
              />
              {attachmentName ? <p className="mt-1 text-[12px] text-muted">已选：{attachmentName}</p> : null}
            </label>
          </div>
        ) : null}
      </Modal>

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
        {detail ? (
          <div className="space-y-3 text-[13px]">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-muted">申请单号</dt>
                <dd className="font-mono font-semibold">{detail.code}</dd>
              </div>
              <div>
                <dt className="text-muted">资源名称</dt>
                <dd className="font-semibold">{detail.resourceName}</dd>
              </div>
              <div>
                <dt className="text-muted">提交人</dt>
                <dd>{detail.submitterLabel}</dd>
              </div>
              <div>
                <dt className="text-muted">提交时间</dt>
                <dd className="tabular-nums">{detail.submittedAt}</dd>
              </div>
              <div>
                <dt className="text-muted">审核状态</dt>
                <dd>
                  <StatusPill variant={resListingApplicationPillVariant(detail.status)}>
                    {LISTING_APPLICATION_STATUS_LABEL[detail.status]}
                  </StatusPill>
                </dd>
              </div>
              <div>
                <dt className="text-muted">附件</dt>
                <dd>{detail.attachmentName ?? '—'}</dd>
              </div>
              {detail.auditedBy ? (
                <>
                  <div>
                    <dt className="text-muted">审核人</dt>
                    <dd>{detail.auditedBy}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">审核时间</dt>
                    <dd className="tabular-nums">{detail.auditedAt ?? '—'}</dd>
                  </div>
                </>
              ) : null}
            </dl>
            <div>
              <p className="font-semibold text-foreground">申请理由</p>
              <p className="mt-1 leading-relaxed text-muted">{detail.reason}</p>
            </div>
            {detail.auditComment ? (
              <div>
                <p className="font-semibold text-foreground">审核意见</p>
                <p className="mt-1 leading-relaxed text-muted">{detail.auditComment}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
