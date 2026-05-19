import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { EntityTab, ExpertAssignment, ExpertDimScores, SjProject } from './innovationTypes'
import { createInitialSjProjects, sjBaseTimeline } from './innovationMock'

const DEFAULT_AI_REPORT: NonNullable<SjProject['aiReport']> = {
  overall: 86,
  levelLabel: '优秀',
  dims: [
    { key: '产业匹配', value: 92 },
    { key: '技术创新', value: 88 },
    { key: '团队能力', value: 85 },
    { key: '市场潜力', value: 79 },
    { key: '合规风险', value: 85 },
    { key: '资源适配', value: 82 },
  ],
  pros: '技术壁垒较好，团队在同类靶点有经验；与园区细胞治疗赛道高度契合。',
  risks: '部分合规佐证材料尚需更新；伦理审查材料建议补充。',
  suggest: '推荐【实体入孵】，建议尽快完成伦理材料补充并匹配共享实验室。',
}

type RegisterPayload = {
  entityTab: EntityTab
  name: string
  orgFullName: string
  subsidiaryUnit?: string
  legalRepresentative?: string
  creditCode: string
  contact: string
  phone: string
  email: string
  phase: string
  intentLabel: string
  /** 用户上传文件名列表（演示） */
  attachmentFileNames?: string[]
  /** 核心成员人数（用于演示清单勾选） */
  teamCount?: number
  /** 入孵注册向导：赛道 */
  track?: string
  /** 入孵注册向导：前沿技术勾选 */
  frontierTech?: boolean
  /** 注册地址 */
  address?: string
  /** 运营代录入口：节点文案走快捷路径 */
  opsProxy?: boolean
  /** 覆盖默认资料清单（入孵向导按 slot 生成） */
  checklistOverride?: { label: string; ok: boolean }[]
}

export function entityLabel(tab: EntityTab): string {
  switch (tab) {
    case 'enterprise':
      return '企业'
    case 'university':
      return '高校'
    case 'institute':
      return '研究所'
    case 'hospital':
      return '医院'
  }
}

type Ctx = {
  projects: SjProject[]
  getProject: (id: string) => SjProject | undefined
  registerNewProject: (p: RegisterPayload) => string
  /** 补充资料完成后回到待审核 */
  resubmitMaterials: (id: string) => void
  withdrawProject: (id: string) => void
  passMaterialReview: (id: string, comment?: string) => void
  returnMaterialReview: (id: string, reason: string) => void
  finalizeAiEvaluation: (id: string, reportTemplate?: SjProject['aiReport']) => void
  promoteAfterAiConfirm: (id: string) => void
  assignExperts: (id: string, rows: ExpertAssignment[]) => void
  urgeExpert: (id: string, expertId: string) => void
  submitExpertReview: (
    projectId: string,
    expertId: string,
    payload: {
      score: number
      opinion: string
      techStars: number
      teamStars: number
      marketStars: number
      complianceRisk: string
      dimScores?: ExpertDimScores
    },
    mode: 'draft' | 'submit',
  ) => void
  runOpinionAiSummary: (id: string) => void
  submitDecision: (
    id: string,
    choice: NonNullable<SjProject['decisionChoice']>,
    comment: string,
    opts?: { hatchArchiveProjectId?: string | null },
  ) => void
  /** 批量写入 AI 初筛报告（仅 pending_ai 且无报告） */
  batchFinalizeAiEval: (projectIds: string[]) => void
  /** 演示：批量删除项目 */
  batchDeleteProjects: (projectIds: string[]) => void
}

const InnovationDemoCtx = createContext<Ctx | null>(null)

export function InnovationDemoProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<SjProject[]>(() => createInitialSjProjects())

  const patch = useCallback((id: string, fn: (p: SjProject) => SjProject) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? fn(p) : p)))
  }, [])

  const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects])

  const registerNewProject = useCallback((draft: RegisterPayload) => {
    const id = `sj-${Math.random().toString(36).slice(2, 8)}`
    const next: SjProject = {
      id,
      name: draft.name,
      applicantOwned: true,
      track: draft.track?.trim() || '未定赛道',
      submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      entityTypeLabel: entityLabel(draft.entityTab),
      orgFullName: draft.orgFullName,
      subsidiaryUnit: draft.subsidiaryUnit,
      legalRepresentative: draft.legalRepresentative,
      creditCode: draft.creditCode,
      contact: draft.contact,
      phone: draft.phone,
      email: draft.email,
      phase: draft.phase,
      intentLabel: draft.intentLabel,
      stage: 'pending_material_review',
      currentNodePublic: draft.opsProxy ? '运营已建档 · 请前往入孵签约' : '待审核（入孵申请）',
      attachments: (draft.attachmentFileNames?.length
        ? draft.attachmentFileNames.map((name) => ({ name }))
        : [{ name: 'BP.pdf（草稿）' }]),
      checklist:
        draft.checklistOverride ??
        [
          { label: '主体资质证明', ok: false },
          { label: '项目 BP / 研究路线', ok: true },
          { label: '技术资料包', ok: false },
          { label: '核心团队简历', ok: (draft.teamCount ?? 0) > 0 },
        ],
      timeline: sjBaseTimeline('pending_material_review', {}),
      experts: [],
    }
    setProjects((prev) => [next, ...prev])
    return id
  }, [])

  const resubmitMaterials = useCallback(
    (id: string) => {
      patch(id, (p) => ({
        ...p,
        stage: 'pending_material_review',
        currentNodePublic: '待资料审核',
        returnReason: undefined,
        timeline: sjBaseTimeline('pending_material_review', {}),
      }))
    },
    [patch],
  )

  const withdrawProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id))
    },
    [setProjects],
  )

  const passMaterialReview = useCallback(
    (id: string, _comment?: string) => {
      patch(id, (p) =>
        p.stage === 'pending_material_review' || p.stage === 'returned_supplement'
          ? {
              ...p,
              stage: 'pending_ai',
              currentNodePublic: '待 AI 评估',
              timeline: sjBaseTimeline('pending_ai', {}),
              checklist: p.checklist.map((c) => ({ ...c, ok: true })),
              returnReason: undefined,
            }
          : p,
      )
    },
    [patch],
  )

  const returnMaterialReview = useCallback(
    (id: string, reason: string) => {
      patch(id, (p) => ({
        ...p,
        stage: 'returned_supplement',
        currentNodePublic: '待补充资料',
        returnReason: reason,
        timeline: sjBaseTimeline('returned_supplement', { returned: true }),
      }))
    },
    [patch],
  )

  const finalizeAiEvaluation = useCallback(
    (id: string, tmpl?: SjProject['aiReport']) => {
      const base = tmpl ?? DEFAULT_AI_REPORT
      const aiEvaluatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
      patch(id, (p) =>
        p.stage === 'pending_ai'
          ? {
              ...p,
              aiReport: base,
              aiEvaluatedAt,
            }
          : p,
      )
    },
    [patch],
  )

  const batchFinalizeAiEval = useCallback((projectIds: string[]) => {
    const set = new Set(projectIds)
    const aiEvaluatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    setProjects((prev) =>
      prev.map((p) =>
        set.has(p.id) && p.stage === 'pending_ai' && !p.aiReport
          ? { ...p, aiReport: DEFAULT_AI_REPORT, aiEvaluatedAt }
          : p,
      ),
    )
  }, [])

  const batchDeleteProjects = useCallback((projectIds: string[]) => {
    const set = new Set(projectIds)
    setProjects((prev) => prev.filter((p) => !set.has(p.id)))
  }, [])

  const promoteAfterAiConfirm = useCallback(
    (id: string) => {
      patch(id, (p) => {
        if (p.stage !== 'pending_ai' || !p.aiReport) return p
        return {
          ...p,
          stage: 'pending_expert_assign',
          currentNodePublic: '待专家分配',
          timeline: sjBaseTimeline('pending_expert_assign', { aiScore: p.aiReport.overall }),
        }
      })
    },
    [patch],
  )

  const assignExperts = useCallback(
    (id: string, rows: ExpertAssignment[]) => {
      patch(id, (p) => ({
        ...p,
        stage: 'expert_reviewing',
        currentNodePublic: '专家评审中',
        experts: rows,
        timeline: sjBaseTimeline('expert_reviewing', { aiScore: p.aiReport?.overall ?? 86 }),
      }))
    },
    [patch],
  )

  const urgeExpert = useCallback((id: string, expertId: string) => {
    patch(id, (p) => ({
      ...p,
      timeline: [
        ...p.timeline,
        {
          id: `urge-${Date.now()}`,
          title: `催办：${p.experts.find((e) => e.expertId === expertId)?.name ?? expertId}`,
          tone: 'primary' as const,
          subtitle: new Date().toLocaleString('zh-CN'),
          detail: '已向专家发送站内信及邮件提醒（演示）。',
          expandable: false,
        },
      ],
    }))
  }, [patch])

  const submitExpertReview = useCallback(
    (
      projectId: string,
      expertId: string,
      payload: {
        score: number
        opinion: string
        techStars: number
        teamStars: number
        marketStars: number
        complianceRisk: string
        dimScores?: ExpertDimScores
      },
      mode: 'draft' | 'submit',
    ) => {
      patch(projectId, (p) => {
        const starsAvg = Math.round(((payload.techStars + payload.teamStars + payload.marketStars) / 3) * 20)
        const hash = expertId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
        const demoDims: ExpertDimScores =
          payload.dimScores ??
          {
            industry: Math.min(98, 78 + (hash % 15)),
            tech: Math.min(98, 80 + ((hash >> 1) % 14)),
            team: Math.min(98, 76 + ((hash >> 2) % 18)),
            market: Math.min(95, 72 + ((hash >> 3) % 20)),
            compliance: Math.min(96, 74 + ((hash >> 4) % 16)),
          }
        const nextExperts = p.experts.map((e) =>
          e.expertId !== expertId
            ? e
            : mode === 'submit'
              ? {
                  ...e,
                  state: 'done' as const,
                  score: starsAvg || payload.score,
                  opinion: payload.opinion,
                  dimScores: demoDims,
                  submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
                }
              : {
                  ...e,
                  state: 'reviewing' as const,
                  score: starsAvg || payload.score,
                  opinion: payload.opinion,
                  dimScores: demoDims,
                },
        )
        let stage = p.stage
        let current = p.currentNodePublic
        if (mode === 'submit' && p.stage === 'expert_reviewing' && nextExperts.length > 0 && nextExperts.every((x) => x.state === 'done')) {
          stage = 'pending_decision'
          current = '评审完成 · 待运营决策'
        }
        const aiScore = p.aiReport?.overall
        return {
          ...p,
          experts: nextExperts,
          stage,
          currentNodePublic: current,
          timeline: sjBaseTimeline(stage, { aiScore }),
        }
      })
    },
    [patch],
  )

  const runOpinionAiSummary = useCallback(
    (id: string) => {
      patch(id, (p) => ({
        ...p,
        aiReport: p.aiReport
          ? {
              ...p.aiReport,
              opinionConsensus:
                p.aiReport.opinionConsensus ??
                '共识：项目在技术与团队维度整体获得认可；建议推进实体入园并补强合规佐证。',
              opinionConflict:
                p.aiReport.opinionConflict ??
                '分歧：在时间节奏与风险承受度上存在一定差异，已通过决策意见栏统筹。',
            }
          : p.aiReport,
      }))
    },
    [patch],
  )

  const submitDecision = useCallback(
    (id: string, choice: NonNullable<SjProject['decisionChoice']>, comment: string, opts?: { hatchArchiveProjectId?: string | null }) => {
      patch(id, (p) => {
        const stage = choice === 'reject' ? 'decision_reject' : 'decision_pass'
        const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
        let currentNodePublic = p.currentNodePublic
        let incubationArchiveStatus: SjProject['incubationArchiveStatus'] = '—'
        let hatchArchiveProjectId: string | undefined
        if (choice === 'reject') {
          currentNodePublic = '暂不通过 · 已归档'
        } else if (choice === 'physical') {
          currentNodePublic = '决策通过 · 实体入孵'
          incubationArchiveStatus = '待签约'
          hatchArchiveProjectId = opts?.hatchArchiveProjectId ?? undefined
        } else if (choice === 'virtual') {
          currentNodePublic = '决策通过 · 虚拟入孵'
          incubationArchiveStatus = '待签约'
          hatchArchiveProjectId = opts?.hatchArchiveProjectId ?? undefined
        } else if (choice === 'observe') {
          currentNodePublic = '观察培育 · 候选池跟进'
          incubationArchiveStatus = '—'
        }
        return {
          ...p,
          decisionChoice: choice,
          decisionComment: comment,
          stage,
          currentNodePublic,
          decisionAt: now,
          decisionBy: '运营主管-王五',
          incubationArchiveStatus,
          hatchArchiveProjectId,
          timeline: sjBaseTimeline(stage, { aiScore: p.aiReport?.overall }),
        }
      })
    },
    [patch],
  )

  const value = useMemo(
    (): Ctx => ({
      projects,
      getProject,
      registerNewProject,
      resubmitMaterials,
      withdrawProject,
      passMaterialReview,
      returnMaterialReview,
      finalizeAiEvaluation,
      promoteAfterAiConfirm,
      assignExperts,
      urgeExpert,
      submitExpertReview,
      runOpinionAiSummary,
      submitDecision,
      batchFinalizeAiEval,
      batchDeleteProjects,
    }),
    [
      projects,
      getProject,
      registerNewProject,
      resubmitMaterials,
      withdrawProject,
      passMaterialReview,
      returnMaterialReview,
      finalizeAiEvaluation,
      promoteAfterAiConfirm,
      assignExperts,
      urgeExpert,
      submitExpertReview,
      runOpinionAiSummary,
      submitDecision,
      batchFinalizeAiEval,
      batchDeleteProjects,
    ],
  )

  return <InnovationDemoCtx.Provider value={value}>{children}</InnovationDemoCtx.Provider>
}

export function useInnovationDemo() {
  const v = useContext(InnovationDemoCtx)
  if (!v) throw new Error('useInnovationDemo 需在 InnovationDemoProvider 内使用')
  return v
}
