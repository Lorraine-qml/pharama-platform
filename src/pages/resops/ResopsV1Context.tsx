import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type {
  ResApplication,
  ResApplicationStatus,
  ResFeeMode,
  ResOpenScope,
  ResQualificationFile,
  ResResource,
  ResResourceAuditEvent,
  ResResourceStatus,
  ResUsageOrder,
  ResUsageOrderStatus,
} from './resopsV1Types'
import { initialApplications, initialResources, initialUsageOrders } from './resopsV1Mock'
import { newAuditEvent } from './resopsResourceFlow'

export type RegisterResourcePayload = {
  name: string
  level1: string
  level2: string
  intro: string
  providerName: string
  contactName: string
  phone: string
  hours: string
  capability: string
  qualificationFiles: ResQualificationFile[]
  scope: ResOpenScope
  scopeWhitelistNote?: string
  feeMode: ResFeeMode
  priceAmount?: number
  priceUnit?: string
  remark?: string
  needPlatformReview: boolean
  limitConcurrency: boolean
  /** true：暂存草稿；false：提交审核 → 待审核 */
  asDraft: boolean
}

export type ResourceAuditSubmit = {
  decision: 'pass' | 'return' | 'reject'
  opinion: string
  reason?: string
}

function pushAudit(r: ResResource, evt: ResResourceAuditEvent): ResResource {
  return { ...r, auditLog: [...(r.auditLog ?? []), evt] }
}

type Ctx = {
  resources: ResResource[]
  applications: ResApplication[]
  usageOrders: ResUsageOrder[]
  registerResource: (p: RegisterResourcePayload) => ResResource
  updateResource: (id: string, patch: Partial<ResResource>) => void
  deleteResource: (id: string) => boolean
  publishResource: (id: string) => void
  setResourceStatus: (id: string, status: ResResourceStatus, twinBindNote?: string) => void
  submitResourceAudit: (id: string, input: ResourceAuditSubmit) => void
  submitApplication: (input: {
    resourceId: string
    applicantKey: string
    applicantLabel: string
    slot: string
    matchId?: string
  }) => string | null
  updateApplicationStatus: (id: string, status: ResApplicationStatus) => void
  confirmProvider: (applicationId: string, accept: boolean) => void
  appendUsageTimeline: (orderId: string, text: string) => void
  uploadUsageResult: (orderId: string, fileName: string) => void
  completeUsageByApplicant: (orderId: string, stars: number, text: string) => void
  providerNameFilter: string
}

const ResCtx = createContext<Ctx | null>(null)

const DEMO_OPERATOR = '平台运营（演示）'

export function ResopsV1Provider({ children }: { children: ReactNode }) {
  const [resources, setResources] = useState(initialResources)
  const [applications, setApplications] = useState(initialApplications)
  const [usageOrders, setUsageOrders] = useState(initialUsageOrders)

  const providerNameFilter = '园区公共实验平台'

  const registerResource = useCallback((p: RegisterResourcePayload) => {
    const id = `res-${Date.now()}`
    const status: ResResourceStatus = p.asDraft ? 'draft' : 'pending_review'
    const availabilityLabel = p.asDraft ? '草稿' : '待审核'
    const base: ResResource = {
      id,
      name: p.name,
      level1: p.level1,
      level2: p.level2,
      providerName: p.providerName.trim() || providerNameFilter,
      status,
      location: '—',
      intro: p.intro,
      hours: p.hours,
      contactName: p.contactName,
      phone: p.phone,
      capability: p.capability,
      feeMode: p.feeMode,
      priceAmount: p.priceAmount,
      priceUnit: p.priceUnit,
      remark: p.remark,
      scope: p.scope,
      scopeWhitelistNote: p.scope === 'whitelist' ? p.scopeWhitelistNote?.trim() : undefined,
      rating: 0,
      reviewCount: 0,
      availabilityLabel,
      qualificationFiles: p.qualificationFiles,
      needPlatformReview: p.needPlatformReview,
      limitConcurrency: p.limitConcurrency,
      auditLog: [],
    }
    const evt = newAuditEvent({
      actor: p.contactName || '资源提供方',
      action: p.asDraft ? 'draft_save' : 'submit_review',
      label: p.asDraft ? '暂存草稿' : '提交审核',
      detail: p.asDraft ? '已保存草稿' : '进入待审核',
    })
    const next = pushAudit(base, evt)
    setResources((r) => [...r, next])
    return next
  }, [])

  const updateResource = useCallback((id: string, patch: Partial<ResResource>) => {
    setResources((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }, [])

  const deleteResource = useCallback((id: string) => {
    let ok = false
    setResources((prev) => {
      const t = prev.find((x) => x.id === id)
      if (t && (t.status === 'draft' || t.status === 'pending_review')) ok = true
      return ok ? prev.filter((x) => x.id !== id) : prev
    })
    return ok
  }, [])

  const publishResource = useCallback((id: string) => {
    setResources((prev) =>
      prev.map((x) => {
        if (x.id !== id || x.status !== 'pending_listing') return x
        const evt = newAuditEvent({
          actor: DEMO_OPERATOR,
          action: 'list',
          label: '上架',
          detail: '资源已上架，项目方可见',
        })
        return pushAudit(
          { ...x, status: 'listed', availabilityLabel: '空闲中' },
          evt,
        )
      }),
    )
  }, [])

  const setResourceStatus = useCallback((id: string, status: ResResourceStatus, twinBindNote?: string) => {
    setResources((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x
        let availabilityLabel = x.availabilityLabel
        if (status === 'delisted') availabilityLabel = '已下架'
        if (status === 'maintenance') availabilityLabel = '维护中'
        if (status === 'anomaly') availabilityLabel = '异常标记'
        if (status === 'listed' && (x.status === 'maintenance' || x.status === 'anomaly')) availabilityLabel = '空闲中'
        const evt =
          status !== x.status
            ? newAuditEvent({
                actor: DEMO_OPERATOR,
                action: `status_${status}`,
                label: `状态变更为「${status}」`,
                detail: '',
              })
            : null
        const next = { ...x, status, availabilityLabel, twinBindNote: twinBindNote ?? x.twinBindNote }
        return evt ? pushAudit(next, evt) : next
      }),
    )
  }, [])

  const submitResourceAudit = useCallback((id: string, input: ResourceAuditSubmit) => {
    setResources((prev) =>
      prev.map((x) => {
        if (x.id !== id || x.status !== 'pending_review') return x
        const { decision, opinion, reason } = input
        if (decision === 'pass') {
          const evt = newAuditEvent({
            actor: DEMO_OPERATOR,
            action: 'audit_pass',
            label: '审核通过',
            detail: [opinion, reason].filter(Boolean).join('；') || '准予准入',
          })
          return pushAudit(
            {
              ...x,
              status: 'pending_listing',
              availabilityLabel: '已准入·待上架',
            },
            evt,
          )
        }
        if (decision === 'return') {
          const evt = newAuditEvent({
            actor: DEMO_OPERATOR,
            action: 'audit_return',
            label: '退回修改',
            detail: reason || opinion,
          })
          return pushAudit(
            {
              ...x,
              status: 'draft',
              availabilityLabel: `退回：${reason || opinion || '请修改后重新提交'}`,
            },
            evt,
          )
        }
        const evt = newAuditEvent({
          actor: DEMO_OPERATOR,
          action: 'audit_reject',
          label: '审核拒绝',
          detail: reason || opinion || '—',
        })
        return pushAudit(
          {
            ...x,
            status: 'rejected',
            availabilityLabel: '已拒绝',
          },
          evt,
        )
      }),
    )
  }, [])

  const submitApplication = useCallback(
    (input: { resourceId: string; applicantKey: string; applicantLabel: string; slot: string; matchId?: string }) => {
      const res = resources.find((r) => r.id === input.resourceId)
      if (!res) return null
      const id = `a-${Date.now()}`
      setApplications((prevApps) => {
        const code = `R2025${String(prevApps.length + 1).padStart(3, '0')}`
        const row: ResApplication = {
          id,
          code,
          resourceId: res.id,
          resourceName: res.name,
          applicantKey: input.applicantKey,
          applicantLabel: input.applicantLabel,
          slot: input.slot,
          status: 'pending_confirm',
          createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          matchId: input.matchId,
        }
        return [...prevApps, row]
      })
      return id
    },
    [resources],
  )

  const updateApplicationStatus = useCallback((id: string, status: ResApplicationStatus) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }, [])

  const confirmProvider = useCallback(
    (applicationId: string, accept: boolean) => {
      const app = applications.find((a) => a.id === applicationId)
      if (!app) return
      if (!accept) {
        setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status: 'rejected' as const } : a)))
        return
      }
      const res = resources.find((r) => r.id === app.resourceId)
      setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status: 'approved' as const } : a)))
      if (!res) return
      setUsageOrders((prevOrders) => {
        const code = `U2025${String(prevOrders.length + 1).padStart(3, '0')}`
        const order: ResUsageOrder = {
          id: `u-${Date.now()}`,
          code,
          resourceId: res.id,
          resourceName: res.name,
          providerName: res.providerName,
          applicantKey: app.applicantKey,
          applicantLabel: app.applicantLabel,
          slot: app.slot,
          totalFeeLabel: res.feeMode === 'hourly' && res.priceAmount ? `${res.priceAmount * 2} 元` : '按约定',
          status: 'in_progress',
          createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          timeline: [
            {
              id: `tl-${Date.now()}`,
              at: new Date().toISOString().slice(0, 16).replace('T', ' '),
              text: '提供方已确认 · 使用单已生成',
            },
          ],
          resultFiles: [],
        }
        return [...prevOrders, order]
      })
    },
    [applications, resources],
  )

  const appendUsageTimeline = useCallback((orderId: string, text: string) => {
    const at = new Date().toISOString().slice(0, 16).replace('T', ' ')
    setUsageOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, timeline: [...o.timeline, { id: `tl-${Date.now()}`, at, text }] } : o,
      ),
    )
  }, [])

  const uploadUsageResult = useCallback((orderId: string, fileName: string) => {
    setUsageOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, resultFiles: [...o.resultFiles, { name: fileName }] } : o)),
    )
  }, [])

  const completeUsageByApplicant = useCallback((orderId: string, stars: number, text: string) => {
    setUsageOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'completed' as ResUsageOrderStatus,
              applicantReviewStars: stars,
              applicantReviewText: text,
              timeline: [
                ...o.timeline,
                {
                  id: `tl-${Date.now()}`,
                  at: new Date().toISOString().slice(0, 16).replace('T', ' '),
                  text: '项目方确认完成并评价',
                },
              ],
            }
          : o,
      ),
    )
  }, [])

  const value = useMemo(
    (): Ctx => ({
      resources,
      applications,
      usageOrders,
      registerResource,
      updateResource,
      deleteResource,
      publishResource,
      setResourceStatus,
      submitResourceAudit,
      submitApplication,
      updateApplicationStatus,
      confirmProvider,
      appendUsageTimeline,
      uploadUsageResult,
      completeUsageByApplicant,
      providerNameFilter,
    }),
    [
      resources,
      applications,
      usageOrders,
      registerResource,
      updateResource,
      deleteResource,
      publishResource,
      setResourceStatus,
      submitResourceAudit,
      submitApplication,
      updateApplicationStatus,
      confirmProvider,
      appendUsageTimeline,
      uploadUsageResult,
      completeUsageByApplicant,
    ],
  )

  return <ResCtx.Provider value={value}>{children}</ResCtx.Provider>
}

export function useResopsV1() {
  const v = useContext(ResCtx)
  if (!v) throw new Error('useResopsV1 must be used within ResopsV1Provider')
  return v
}

export { DEMO_APPLICANT_KEYS } from './resopsV1Mock'
