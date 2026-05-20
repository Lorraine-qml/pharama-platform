import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useToast } from '../../components/ToastProvider'
import type {
  ChangeRequest,
  ContractRemindLog,
  FlowNodeKey,
  HatchIncubationType,
  PipelineItem,
  ProjectArchive,
  SigningConfirmPayload,
  SigningContract,
  SpaceAllocation,
  SpaceUsageLog,
  TeamArchiveRow,
  FundingRow,
  EvaluationRow,
  MajorEvent,
} from './hatchTypes'
import {
  INITIAL_ARCHIVES,
  INITIAL_CHANGES,
  INITIAL_CONTRACTS,
  INITIAL_SPACE_LOGS,
  INITIAL_SPACES,
} from './hatchMock'

function notifyDemo(toast: ReturnType<typeof useToast>, title: string) {
  toast.show(`${title}（演示：已记入站内信 + 邮件队列）`, 'info')
}

export type CreateIncubationArchivePayload = {
  name: string
  entityTypeLabel: string
  incubationType: HatchIncubationType
  creditCode: string
  address: string
  contact: string
  phone: string
  pipeline: PipelineItem[]
  team: TeamArchiveRow[]
  funding: FundingRow[]
  resourceDemand: string
  tags: string[]
}

type Ctx = {
  contracts: SigningContract[]
  archives: ProjectArchive[]
  allocations: SpaceAllocation[]
  spaceLogs: Record<string, SpaceUsageLog[]>
  changes: ChangeRequest[]
  signContract: (contractId: string, scanFileName: string) => void
  renewContract: (contractId: string, termEnd: string, rent: number) => void
  sendReminder: (contractId: string, kind: '催签' | '续约', projectName: string) => void
  updateArchive: (id: string, patch: Partial<ProjectArchive>, note?: string) => void
  addPipeline: (archiveId: string, row: Omit<PipelineItem, 'id'>) => void
  updatePipeline: (archiveId: string, row: PipelineItem) => void
  removePipeline: (archiveId: string, pid: string) => void
  addTeam: (archiveId: string, row: Omit<TeamArchiveRow, 'id'>) => void
  updateTeam: (archiveId: string, row: TeamArchiveRow) => void
  removeTeam: (archiveId: string, tid: string) => void
  addFunding: (archiveId: string, row: Omit<FundingRow, 'id'>) => void
  updateFunding: (archiveId: string, row: FundingRow) => void
  removeFunding: (archiveId: string, fid: string) => void
  addEvaluation: (archiveId: string, row: Omit<EvaluationRow, 'id'>) => void
  addEvent: (archiveId: string, row: Omit<MajorEvent, 'id'>) => void
  updateEvent: (archiveId: string, row: MajorEvent) => void
  setArchiveTags: (archiveId: string, tags: string[]) => void
  setResourceTexts: (archiveId: string, demand: string, supply: string) => void
  setFlow: (archiveId: string, key: FlowNodeKey) => void
  allocateSpace: (payload: Omit<SpaceAllocation, 'id'> & { handoverNote?: string }) => void
  submitChangeRequest: (row: Omit<ChangeRequest, 'id' | 'status'>) => void
  approveChange: (id: string, opinion: string, spaceSuggest?: string) => void
  rejectChange: (id: string, opinion: string) => void
  completeExit: (id: string, opinion: string) => void
  /** 入孵注册向导提交：新建档案（待审核） */
  createArchiveFromIncubationRegister: (p: CreateIncubationArchivePayload) => string
  /** 策源决策通过等场景：追加一条「待签署」签约记录（演示） */
  appendSigningContract: (row: Omit<SigningContract, 'id'>) => { ok: true; contractId: string } | { ok: false; reason: 'duplicate' | 'bad_payload' }
  /** 工作台：确认签署 / 续约（有扫描件则生效） */
  confirmWorkbenchSigning: (
    contractId: string | null,
    payload: SigningConfirmPayload,
    hasScan: boolean,
    workbenchTaskId?: string,
  ) => string
  /** 工作台：发起续约，原合同终止并生成新待签署记录 */
  startRenewalWorkbench: (oldContractId: string, payload: SigningConfirmPayload, hasScan: boolean) => string
  sendExpireContractReminder: (contractId: string, methods: { site: boolean; email: boolean }) => void
  markExpireReminderHandled: (contractId: string) => void
  dismissedWorkbenchTaskIds: string[]
  dismissWorkbenchTask: (taskId: string) => void
}

const HatchCtx = createContext<Ctx | null>(null)

export function HatchMgmtProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [contracts, setContracts] = useState<SigningContract[]>(() => [...INITIAL_CONTRACTS])
  const [archives, setArchives] = useState<ProjectArchive[]>(() => INITIAL_ARCHIVES.map((a) => ({ ...a })))
  const [allocations, setAllocations] = useState<SpaceAllocation[]>(() => [...INITIAL_SPACES])
  const [spaceLogs, setSpaceLogs] = useState<Record<string, SpaceUsageLog[]>>(() => ({ ...INITIAL_SPACE_LOGS }))
  const [changes, setChanges] = useState<ChangeRequest[]>(() => [...INITIAL_CHANGES])
  const [dismissedWorkbenchTaskIds, setDismissedWorkbenchTaskIds] = useState<string[]>([])

  const dismissWorkbenchTask = useCallback((taskId: string) => {
    setDismissedWorkbenchTaskIds((prev) => (prev.includes(taskId) ? prev : [...prev, taskId]))
  }, [])

  const applySigningPayload = (base: SigningContract, payload: SigningConfirmPayload, tplName?: string): SigningContract => ({
    ...base,
    incubationType: payload.incubationType,
    templateId: payload.templateId,
    templateName: tplName,
    termStart: payload.termStart,
    termEnd: payload.termEnd,
    rentYuanPerMonth: payload.rentYuanPerMonth,
    propertyFee: payload.propertyFee,
    techFeeYuanPerMonth: payload.techFeeYuanPerMonth,
    aiPackage: payload.aiPackage,
    scanFileName: payload.scanFileName ?? payload.contractAttachments?.[0],
    contractAttachments: payload.contractAttachments,
    contractRemark: payload.contractRemark,
    contractEnd: payload.termEnd,
    createdAt: base.createdAt ?? new Date().toISOString().slice(0, 10),
  })

  const signContract = useCallback((contractId: string, scanFileName: string) => {
    let snap: SigningContract | undefined
    setContracts((prev) => {
      const c = prev.find((x) => x.id === contractId)
      if (!c) return prev
      snap = c
      const end = c.termEnd ?? c.contractEnd
      return prev.map((x) =>
        x.id === contractId ? { ...x, signStatus: '已生效', scanFileName, contractEnd: end ?? x.contractEnd } : x,
      )
    })
    if (snap) {
      setArchives((ar) =>
        ar.map((a) =>
          a.id === snap!.projectId
            ? {
                ...a,
                status: '正常运营',
                incubationStart: snap!.termStart ?? a.incubationStart,
                contractEnd: snap!.termEnd ?? snap!.contractEnd ?? a.contractEnd,
                flowCurrent: snap!.incubationType === '实体' ? 'space' : 'operate',
                events: [
                  {
                    id: `ev-${Date.now()}`,
                    time: new Date().toISOString().slice(0, 10),
                    description: '完成入孵协议线下签署',
                  },
                  ...a.events,
                ],
              }
            : a,
        ),
      )
    }
    notifyDemo(toast, '签约完成 · 已通知运营')
  }, [toast])

  const renewContract = useCallback(
    (contractId: string, termEnd: string, rent: number) => {
      setContracts((prev) =>
        prev.map((c) => (c.id === contractId ? { ...c, signStatus: '续约中', termEnd, rentYuanPerMonth: rent } : c)),
      )
      notifyDemo(toast, '续约流程已发起')
    },
    [toast],
  )

  const sendReminder = useCallback((contractId: string, kind: '催签' | '续约', projectName: string) => {
    void contractId
    notifyDemo(toast, `${kind}通知已发送至「${projectName}」`)
  }, [toast])

  const confirmWorkbenchSigning = useCallback(
    (contractId: string | null, payload: SigningConfirmPayload, hasScan: boolean, workbenchTaskId?: string) => {
      let resultId = contractId ?? ''
      if (contractId) {
        setContracts((prev) =>
          prev.map((c) => {
            if (c.id !== contractId) return c
            const next = applySigningPayload(c, payload)
            resultId = c.id
            if (hasScan) {
              return {
                ...next,
                signStatus: '已生效',
                scanFileName: payload.scanFileName,
                crmContractId: c.crmContractId ?? `crm-${Date.now().toString(36)}`,
              }
            }
            return { ...next, signStatus: '待签署' }
          }),
        )
        if (hasScan) {
          signContract(contractId, payload.scanFileName ?? 'signed.pdf')
        } else {
          toast.show('已创建签约记录（待签署）。请线下签署后上传扫描件。', 'warning')
        }
      } else {
        const id = `c-wb-${Date.now().toString(36)}`
        resultId = id
        const row: SigningContract = {
          id,
          projectId: payload.projectId,
          projectName: payload.projectName,
          incubationType: payload.incubationType,
          signStatus: hasScan ? '已生效' : '待签署',
          contractEnd: hasScan ? payload.termEnd : null,
          rentYuanPerMonth: payload.rentYuanPerMonth,
          propertyFee: payload.propertyFee,
          techFeeYuanPerMonth: payload.techFeeYuanPerMonth,
          aiPackage: payload.aiPackage,
          templateId: payload.templateId,
          termStart: payload.termStart,
          termEnd: payload.termEnd,
          scanFileName: payload.scanFileName,
          createdAt: new Date().toISOString().slice(0, 10),
        }
        setContracts((prev) => [row, ...prev])
        if (hasScan) {
          signContract(id, payload.scanFileName ?? 'signed.pdf')
        } else {
          toast.show('已创建签约记录（待签署）。请线下签署后上传扫描件。', 'warning')
          notifyDemo(toast, 'CRM 合同草稿已同步（演示）')
        }
      }
      if (workbenchTaskId) dismissWorkbenchTask(workbenchTaskId)
      if (hasScan && contractId) {
        toast.show('合同已生效，工作台任务已办结', 'success')
        notifyDemo(toast, 'CRM 合同已确认生效（演示）')
      }
      return resultId
    },
    [dismissWorkbenchTask, signContract, toast],
  )

  const startRenewalWorkbench = useCallback(
    (oldContractId: string, payload: SigningConfirmPayload, hasScan: boolean) => {
      const old = contracts.find((c) => c.id === oldContractId)
      if (!old) return ''
      setContracts((prev) =>
        prev.map((c) => (c.id === oldContractId ? { ...c, signStatus: '已终止' as const } : c)),
      )
      const id = `c-renew-${Date.now().toString(36)}`
      const row: SigningContract = {
        id,
        projectId: payload.projectId,
        projectName: payload.projectName,
        incubationType: payload.incubationType,
        signStatus: hasScan ? '已生效' : '待签署',
        contractEnd: payload.termEnd,
        rentYuanPerMonth: payload.rentYuanPerMonth,
        propertyFee: payload.propertyFee,
        techFeeYuanPerMonth: payload.techFeeYuanPerMonth,
        aiPackage: payload.aiPackage,
        templateId: payload.templateId,
        termStart: payload.termStart,
        termEnd: payload.termEnd,
        scanFileName: payload.scanFileName,
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setContracts((prev) => [row, ...prev])
      if (hasScan) {
        signContract(id, payload.scanFileName ?? 'renew_signed.pdf')
        toast.show('续约协议已生效', 'success')
      } else {
        toast.show('续约记录已生成（待签署），请完成线下签署', 'info')
      }
      notifyDemo(toast, '原合同已终止，新续约记录已创建（演示）')
      return id
    },
    [contracts, signContract, toast],
  )

  const sendExpireContractReminder = useCallback(
    (contractId: string, methods: { site: boolean; email: boolean }) => {
      const method = [methods.site && '站内信', methods.email && '邮件'].filter(Boolean).join('+') || '站内信'
      const log: ContractRemindLog = {
        id: `rl-${Date.now()}`,
        contractId,
        remindDay: -1,
        remindTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
        method,
        status: '成功',
      }
      setContracts((prev) =>
        prev.map((c) =>
          c.id === contractId ? { ...c, remindLogs: [...(c.remindLogs ?? []), log] } : c,
        ),
      )
      const c = contracts.find((x) => x.id === contractId)
      notifyDemo(toast, `合同到期提醒已发送至「${c?.projectName ?? contractId}」`)
    },
    [contracts, toast],
  )

  const markExpireReminderHandled = useCallback((contractId: string) => {
    setContracts((prev) =>
      prev.map((c) => (c.id === contractId ? { ...c, expireRemindHandled: true } : c)),
    )
    toast.show('已标记为已处理', 'success')
  }, [toast])

  const updateArchive = useCallback((id: string, patch: Partial<ProjectArchive>, note?: string) => {
    setArchives((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const hist = note
          ? [
              {
                id: `h-${Date.now()}`,
                time: new Date().toISOString().slice(0, 16).replace('T', ' '),
                operator: 'admin',
                field: note,
                from: '—',
                to: '已更新',
              },
              ...a.changeHistory,
            ]
          : a.changeHistory
        return { ...a, ...patch, changeHistory: hist }
      }),
    )
  }, [])

  const mapArchive = useCallback((id: string, fn: (a: ProjectArchive) => ProjectArchive) => {
    setArchives((prev) => prev.map((a) => (a.id === id ? fn(a) : a)))
  }, [])

  const addPipeline = useCallback(
    (archiveId: string, row: Omit<PipelineItem, 'id'>) => {
      mapArchive(archiveId, (a) => ({
        ...a,
        pipeline: [...a.pipeline, { ...row, id: `p-${Date.now()}` }],
      }))
    },
    [mapArchive],
  )
  const updatePipeline = useCallback(
    (archiveId: string, row: PipelineItem) => {
      mapArchive(archiveId, (a) => ({ ...a, pipeline: a.pipeline.map((p) => (p.id === row.id ? row : p)) }))
    },
    [mapArchive],
  )
  const removePipeline = useCallback(
    (archiveId: string, pid: string) => {
      mapArchive(archiveId, (a) => ({ ...a, pipeline: a.pipeline.filter((p) => p.id !== pid) }))
    },
    [mapArchive],
  )

  const addTeam = useCallback(
    (archiveId: string, row: Omit<TeamArchiveRow, 'id'>) => {
      mapArchive(archiveId, (a) => ({
        ...a,
        team: [...a.team, { ...row, id: `t-${Date.now()}` }],
      }))
    },
    [mapArchive],
  )
  const updateTeam = useCallback(
    (archiveId: string, row: TeamArchiveRow) => {
      mapArchive(archiveId, (a) => ({ ...a, team: a.team.map((t) => (t.id === row.id ? row : t)) }))
    },
    [mapArchive],
  )
  const removeTeam = useCallback(
    (archiveId: string, tid: string) => {
      mapArchive(archiveId, (a) => ({ ...a, team: a.team.filter((t) => t.id !== tid) }))
    },
    [mapArchive],
  )

  const addFunding = useCallback(
    (archiveId: string, row: Omit<FundingRow, 'id'>) => {
      mapArchive(archiveId, (a) => ({
        ...a,
        funding: [...a.funding, { ...row, id: `f-${Date.now()}` }],
      }))
    },
    [mapArchive],
  )
  const updateFunding = useCallback(
    (archiveId: string, row: FundingRow) => {
      mapArchive(archiveId, (a) => ({ ...a, funding: a.funding.map((f) => (f.id === row.id ? row : f)) }))
    },
    [mapArchive],
  )
  const removeFunding = useCallback(
    (archiveId: string, fid: string) => {
      mapArchive(archiveId, (a) => ({ ...a, funding: a.funding.filter((f) => f.id !== fid) }))
    },
    [mapArchive],
  )

  const addEvaluation = useCallback(
    (archiveId: string, row: Omit<EvaluationRow, 'id'>) => {
      mapArchive(archiveId, (a) => ({
        ...a,
        evaluations: [{ ...row, id: `evl-${Date.now()}` }, ...a.evaluations],
      }))
    },
    [mapArchive],
  )

  const addEvent = useCallback(
    (archiveId: string, row: Omit<MajorEvent, 'id'>) => {
      mapArchive(archiveId, (a) => ({
        ...a,
        events: [{ ...row, id: `ev-${Date.now()}` }, ...a.events],
      }))
    },
    [mapArchive],
  )
  const updateEvent = useCallback(
    (archiveId: string, row: MajorEvent) => {
      mapArchive(archiveId, (a) => ({ ...a, events: a.events.map((e) => (e.id === row.id ? row : e)) }))
    },
    [mapArchive],
  )

  const setArchiveTags = useCallback(
    (archiveId: string, tags: string[]) => {
      mapArchive(archiveId, (a) => ({ ...a, tags }))
    },
    [mapArchive],
  )

  const setResourceTexts = useCallback(
    (archiveId: string, demand: string, supply: string) => {
      mapArchive(archiveId, (a) => ({ ...a, resourceDemand: demand, resourceSupply: supply }))
    },
    [mapArchive],
  )

  const setFlow = useCallback(
    (archiveId: string, key: FlowNodeKey) => {
      mapArchive(archiveId, (a) => ({ ...a, flowCurrent: key }))
    },
    [mapArchive],
  )

  const allocateSpace = useCallback(
    (payload: Omit<SpaceAllocation, 'id'> & { handoverNote?: string }) => {
      const id = `sp-${Date.now()}`
      const row: SpaceAllocation = {
        id,
        projectId: payload.projectId,
        projectName: payload.projectName,
        location: payload.location,
        areaM2: payload.areaM2,
        assignDate: payload.assignDate,
        endDate: payload.endDate,
        status: payload.status,
      }
      setAllocations((prev) => [...prev, row])
      setSpaceLogs((prev) => ({
        ...prev,
        [id]: [
          {
            id: `sl-${Date.now()}`,
            time: payload.assignDate,
            type: '分配',
            areaDelta: `+${payload.areaM2}㎡`,
            reason: payload.handoverNote || '入孵分配',
            operator: 'admin',
          },
        ],
      }))
      setArchives((prev) =>
        prev.map((a) =>
          a.id === payload.projectId
            ? {
                ...a,
                flowCurrent: 'operate',
                events: [
                  {
                    id: `ev-${Date.now()}`,
                    time: payload.assignDate,
                    description: `空间分配：${payload.location}`,
                  },
                  ...a.events,
                ],
              }
            : a,
        ),
      )
      notifyDemo(toast, '空间分配完成 · 孪生地图已同步（演示）')
    },
    [toast],
  )

  const submitChangeRequest = useCallback(
    (row: Omit<ChangeRequest, 'id' | 'status'>) => {
      setChanges((prev) => [...prev, { ...row, id: `chg-${Date.now()}`, status: '待审批' }])
      notifyDemo(toast, '变更申请已提交 · 已通知运营审批')
    },
    [toast],
  )

  const approveChange = useCallback(
    (id: string, opinion: string, _spaceSuggest?: string) => {
      setChanges((prev) => {
        const ch = prev.find((x) => x.id === id)
        if (ch?.changeType === '入孵类型变更' && ch.detail?.includes('实体')) {
          setArchives((ar) => ar.map((a) => (a.id === ch.projectId ? { ...a, incubationType: '实体' } : a)))
        }
        return prev.map((c) => (c.id === id ? { ...c, status: '已通过' } : c))
      })
      void opinion
      void _spaceSuggest
      notifyDemo(toast, '审批通过 · 已通知项目方')
    },
    [toast],
  )

  const rejectChange = useCallback(
    (id: string, opinion: string) => {
      setChanges((prev) => prev.map((c) => (c.id === id ? { ...c, status: '已驳回' } : c)))
      void opinion
      notifyDemo(toast, '已驳回 · 已邮件通知项目方')
    },
    [toast],
  )

  const completeExit = useCallback(
    (id: string, opinion: string) => {
      setChanges((prev) => {
        const ch = prev.find((x) => x.id === id)
        if (ch) {
          setArchives((ar) =>
            ar.map((a) =>
              a.id === ch.projectId
                ? {
                    ...a,
                    status: ch.exitType === '毕业' ? '毕业' : '退出',
                    flowCurrent: 'graduate',
                    changeHistory: [
                      {
                        id: `h-${Date.now()}`,
                        time: new Date().toISOString().slice(0, 16).replace('T', ' '),
                        operator: 'admin',
                        field: '项目状态',
                        from: a.status,
                        to: ch.exitType === '毕业' ? '毕业' : '退出',
                      },
                      ...a.changeHistory,
                    ],
                  }
                : a,
            ),
          )
        }
        return prev.map((c) => (c.id === id ? { ...c, status: '已通过' } : c))
      })
      void opinion
      notifyDemo(toast, '退出/毕业流程已完成 · 档案已归档（演示）')
    },
    [toast],
  )

  const appendSigningContract = useCallback(
    (row: Omit<SigningContract, 'id'>): { ok: true; contractId: string } | { ok: false; reason: 'duplicate' | 'bad_payload' } => {
      if (!row.projectId?.trim() || !row.projectName?.trim()) {
        return { ok: false, reason: 'bad_payload' }
      }
      if (contracts.some((c) => c.projectId === row.projectId && c.signStatus === '待签署')) {
        return { ok: false, reason: 'duplicate' }
      }
      const contractId = `c-dec-${Date.now().toString(36)}`
      setContracts((prev) => [{ ...row, id: contractId }, ...prev])
      notifyDemo(toast, `已创建签约待办：${row.projectName}`)
      return { ok: true, contractId }
    },
    [contracts, toast],
  )

  const createArchiveFromIncubationRegister = useCallback((p: CreateIncubationArchivePayload) => {
    const id = `h-proj-${Date.now().toString(36)}`
    const today = new Date().toISOString().slice(0, 10)
    const archive: ProjectArchive = {
      id,
      name: p.name,
      entityType: p.entityTypeLabel,
      incubationType: p.incubationType,
      status: '待审核',
      tags: p.tags.length ? p.tags : ['入孵申请'],
      creditCode: p.creditCode,
      address: p.address,
      contact: p.contact,
      phone: p.phone,
      incubationStart: null,
      contractEnd: null,
      flowCurrent: 'signing',
      pipeline: p.pipeline.map((row) => ({ ...row })),
      team: p.team.map((row) => ({ ...row })),
      funding: p.funding.map((row) => ({ ...row })),
      resourceDemand: p.resourceDemand,
      resourceSupply: '',
      evaluations: [],
      events: [
        {
          id: `ev-${Date.now()}`,
          time: today,
          description: '通过入孵注册向导提交，档案待运营审核',
        },
      ],
      changeHistory: [],
    }
    setArchives((prev) => [archive, ...prev])
    notifyDemo(toast, '入孵项目档案已创建')
    return id
  }, [toast])

  const value = useMemo(
    (): Ctx => ({
      contracts,
      archives,
      allocations,
      spaceLogs,
      changes,
      signContract,
      renewContract,
      sendReminder,
      updateArchive,
      addPipeline,
      updatePipeline,
      removePipeline,
      addTeam,
      updateTeam,
      removeTeam,
      addFunding,
      updateFunding,
      removeFunding,
      addEvaluation,
      addEvent,
      updateEvent,
      setArchiveTags,
      setResourceTexts,
      setFlow,
      allocateSpace,
      submitChangeRequest,
      approveChange,
      rejectChange,
      completeExit,
      createArchiveFromIncubationRegister,
      appendSigningContract,
      confirmWorkbenchSigning,
      startRenewalWorkbench,
      sendExpireContractReminder,
      markExpireReminderHandled,
      dismissedWorkbenchTaskIds,
      dismissWorkbenchTask,
    }),
    [
      contracts,
      archives,
      allocations,
      spaceLogs,
      changes,
      signContract,
      renewContract,
      sendReminder,
      updateArchive,
      addPipeline,
      updatePipeline,
      removePipeline,
      addTeam,
      updateTeam,
      removeTeam,
      addFunding,
      updateFunding,
      removeFunding,
      addEvaluation,
      addEvent,
      updateEvent,
      setArchiveTags,
      setResourceTexts,
      setFlow,
      allocateSpace,
      submitChangeRequest,
      approveChange,
      rejectChange,
      completeExit,
      createArchiveFromIncubationRegister,
      appendSigningContract,
      confirmWorkbenchSigning,
      startRenewalWorkbench,
      sendExpireContractReminder,
      markExpireReminderHandled,
      dismissedWorkbenchTaskIds,
      dismissWorkbenchTask,
    ],
  )

  return <HatchCtx.Provider value={value}>{children}</HatchCtx.Provider>
}

export function useHatchMgmt() {
  const v = useContext(HatchCtx)
  if (!v) throw new Error('useHatchMgmt 需在 HatchMgmtProvider 内使用（已挂载于 AppShell）')
  return v
}
