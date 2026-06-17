import { Link, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import type { UserRole } from '../../auth/types'
import { Modal } from '../../components/Modal'
import { AiEvaluationWizardModal } from './AiEvaluationWizardModal'
import { ExpertAssignModal } from './ExpertAssignModal'
import { ExpertReviewModal } from './ExpertReviewModal'
import { IncubationDecisionModal } from './IncubationDecisionModal'
import { MaterialReviewModal } from './MaterialReviewModal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import type { SjProject } from './innovationTypes'
import { DEMO_EXPERT_ZHANG_ID } from './innovationTypes'
import { useInnovationDemo } from './InnovationDemoContext'
import {
  WORKBENCH_DONE_SEED,
  WORKBENCH_IN_PROGRESS_SEED,
  WORKBENCH_INITIATED_SEED,
  WORKBENCH_TODO_SEED,
  type InProgressRowSeed,
  type InitiatedRowSeed,
  type TaskKind,
  type TodoRowSeed,
} from './innovationWorkbenchSeed'

type TaskTab = 'todo' | 'in_progress' | 'done' | 'initiated'

type TodoRow = {
  id: string
  kind: TaskKind
  typeLabel: string
  projectId: string
  projectName: string
  createdAt: string
  statusLabel: '待处理' | '处理中' | '超时'
  actionLabel: string
  href: string
  /** 同类任务批量处理分组；null 不可批量 */
  batchKey: 'material' | 'ai' | 'assign' | 'decision' | null
}

type DoneRow = {
  id: string
  typeLabel: string
  projectName: string
  projectId: string
  result: string
  at: string
  actor?: string
  detailKind: 'default' | 'report' | 'signing'
}

const PAGE_SIZE = 20

const DEMO_OVERDUE_KPI = 2

const TYPE_FILTER_OPTS = ['全部', '资料审核', 'AI评估', '专家分配', '入孵决策', '项目评审'] as const

const opLinkPrimary = 'shrink-0 text-[12px] font-semibold text-primary hover:underline'
const opLinkMuted = 'shrink-0 text-[12px] font-semibold text-muted hover:text-primary hover:underline'
const opLinkUrge = 'shrink-0 text-[12px] font-semibold text-amber-700 hover:underline dark:text-amber-400'

function parseRoughTime(s: string): number {
  const t = Date.parse(s.replace(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/, '$1T$2'))
  return Number.isNaN(t) ? 0 : t
}

function daysSinceSubmitted(p: SjProject): number {
  const t = parseRoughTime(p.submittedAt)
  if (!t) return 0
  return (Date.now() - t) / (24 * 3600 * 1000)
}

function todoStatus(p: SjProject, kind: TaskKind): '待处理' | '处理中' | '超时' {
  if (daysSinceSubmitted(p) >= 7) return '超时'
  if (kind === 'ai' && p.stage === 'pending_ai' && !p.aiReport) return '处理中'
  return '待处理'
}

function seedTodoToRow(s: TodoRowSeed): TodoRow {
  return { ...s }
}

function seedDoneToRow(s: (typeof WORKBENCH_DONE_SEED)[number]): DoneRow {
  return { ...s }
}

function buildExpertTodoRows(projects: SjProject[]): TodoRow[] {
  const rows: TodoRow[] = []
  for (const p of projects) {
    if (p.stage !== 'expert_reviewing') continue
    const slot = p.experts.find((e) => e.expertId === DEMO_EXPERT_ZHANG_ID && e.state !== 'done')
    if (!slot) continue
    rows.push({
      id: `expert-${p.id}`,
      kind: 'expert',
      typeLabel: '项目评审',
      projectId: p.id,
      projectName: p.name,
      createdAt: p.submittedAt.slice(0, 10),
      statusLabel: todoStatus(p, 'expert'),
      actionLabel: '去评审',
      href: `/innovation/expert/review/${p.id}`,
      batchKey: null,
    })
  }
  return rows
}

function buildTodoRows(projects: SjProject[], role: UserRole): TodoRow[] {
  const isExpert = role === 'expert'
  const isOps = role === 'platform' || role === 'enterprise-admin'

  if (isOps) {
    return WORKBENCH_TODO_SEED.map(seedTodoToRow)
      .filter((row) => {
        const p = projects.find((x) => x.id === row.projectId)
        if (!p) return true
        if (row.kind === 'ai' && p.aiReport) return false
        if (
          row.kind === 'material' &&
          p.stage !== 'pending_material_review' &&
          p.stage !== 'returned_supplement'
        ) {
          return false
        }
        if (row.kind === 'assign' && p.stage !== 'pending_expert_assign') return false
        if (row.kind === 'decision' && p.stage !== 'pending_decision') return false
        return true
      })
      .map((row) => {
        if (row.kind !== 'ai') return row
        const p = projects.find((x) => x.id === row.projectId)
        if (p?.aiReport) {
          return { ...row, actionLabel: '查看结果', href: `/innovation/ops/ai/${row.projectId}` }
        }
        return row
      })
  }
  if (isExpert) {
    return buildExpertTodoRows(projects)
  }

  const rows: TodoRow[] = []
  for (const p of projects) {
      if (p.stage === 'pending_material_review' || p.stage === 'returned_supplement') {
        rows.push({
          id: `material-${p.id}`,
          kind: 'material',
          typeLabel: '资料审核',
          projectId: p.id,
          projectName: p.name,
          createdAt: p.submittedAt.slice(0, 10),
          statusLabel: todoStatus(p, 'material'),
          actionLabel: p.stage === 'returned_supplement' ? '审核' : '审核',
          href: `/innovation/ops/review/${p.id}`,
          batchKey: p.stage === 'pending_material_review' ? 'material' : null,
        })
      }
      if (p.stage === 'pending_ai') {
        rows.push({
          id: `ai-${p.id}`,
          kind: 'ai',
          typeLabel: 'AI评估',
          projectId: p.id,
          projectName: p.name,
          createdAt: p.submittedAt.slice(0, 10),
          statusLabel: todoStatus(p, 'ai'),
          actionLabel: p.aiReport ? '确认结果' : '开始评估',
          href: `/innovation/ops/ai/${p.id}`,
          batchKey: !p.aiReport ? 'ai' : null,
        })
      }
      if (p.stage === 'pending_expert_assign') {
        rows.push({
          id: `assign-${p.id}`,
          kind: 'assign',
          typeLabel: '专家分配',
          projectId: p.id,
          projectName: p.name,
          createdAt: p.submittedAt.slice(0, 10),
          statusLabel: todoStatus(p, 'assign'),
          actionLabel: '分配专家',
          href: `/innovation/ops/assign/${p.id}`,
          batchKey: 'assign',
        })
      }
      if (p.stage === 'pending_decision') {
        rows.push({
          id: `decision-${p.id}`,
          kind: 'decision',
          typeLabel: '入孵决策',
          projectId: p.id,
          projectName: p.name,
          createdAt: p.submittedAt.slice(0, 10),
          statusLabel: todoStatus(p, 'decision'),
          actionLabel: '去决策',
          href: `/innovation/ops/decision/${p.id}`,
          batchKey: 'decision',
        })
      }
    }
  return rows
}

function buildDoneRows(projects: SjProject[], role: UserRole): DoneRow[] {
  const isOps = role === 'platform' || role === 'enterprise-admin'
  if (isOps) {
    return WORKBENCH_DONE_SEED.map(seedDoneToRow)
  }
  const rows: DoneRow[] = []
  for (const p of projects) {
    if (p.stage === 'decision_pass' && p.decisionAt) {
      rows.push({
        id: `${p.id}-dec`,
        typeLabel: '入孵决策',
        projectName: p.name,
        projectId: p.id,
        result: p.decisionChoice === 'physical' ? '通过（实体入孵）' : p.decisionChoice === 'virtual' ? '通过（虚拟入孵）' : '通过',
        at: p.decisionAt,
        actor: p.decisionBy,
        detailKind: 'signing',
      })
    }
    if (p.stage === 'decision_reject' && p.decisionAt) {
      rows.push({
        id: `${p.id}-rej`,
        typeLabel: '入孵决策',
        projectName: p.name,
        projectId: p.id,
        result: '不予通过',
        at: p.decisionAt,
        actor: p.decisionBy,
        detailKind: 'default',
      })
    }
  }
  return rows.sort((a, b) => String(b.at).localeCompare(String(a.at)))
}

function inProgressMatchesFilter(row: InProgressRowSeed, filter: (typeof TYPE_FILTER_OPTS)[number]): boolean {
  if (filter === '全部') return true
  if (filter === '项目评审') return row.typeLabel.includes('评审')
  if (filter === '资料审核') return false
  return row.typeLabel === filter || (filter === '入孵决策' && row.kind === 'decision')
}

function typeLabelMatchesTabFilter(rowTypeLabel: string, filter: (typeof TYPE_FILTER_OPTS)[number]): boolean {
  if (filter === '全部') return true
  if (filter === '项目评审') return rowTypeLabel.includes('评审')
  return rowTypeLabel === filter
}

function kindFromTypeFilter(label: string): TaskKind | null {
  const m: Record<string, TaskKind> = {
    资料审核: 'material',
    AI评估: 'ai',
    专家分配: 'assign',
    入孵决策: 'decision',
    项目评审: 'expert',
  }
  return m[label] ?? null
}

export default function InnovationOpsWorkbenchPage() {
  const toast = useToast()
  const { user } = useAuth()
  const role = user?.role ?? 'member'
  const { projects, passMaterialReview, returnMaterialReview, urgeExpert, batchFinalizeAiEval } = useInnovationDemo()
  const [searchParams, setSearchParams] = useSearchParams()

  const [tab, setTab] = useState<TaskTab>('todo')
  const [q, setQ] = useState('')
  const [typeF, setTypeF] = useState<(typeof TYPE_FILTER_OPTS)[number]>('全部')
  const [page, setPage] = useState(1)
  const [sel, setSel] = useState<Record<string, boolean>>({})

  const [materialModal, setMaterialModal] = useState<SjProject | null>(null)
  const [aiEvalProject, setAiEvalProject] = useState<SjProject | null>(null)
  const [assignProject, setAssignProject] = useState<SjProject | null>(null)
  const [decisionProject, setDecisionProject] = useState<SjProject | null>(null)
  const [reviewProject, setReviewProject] = useState<SjProject | null>(null)
  const [doneDetail, setDoneDetail] = useState<DoneRow | null>(null)

  const isOps = role === 'platform' || role === 'enterprise-admin'

  const todoRows = useMemo(() => buildTodoRows(projects, role), [projects, role])
  const inProgressRows = useMemo(() => {
    if (!isOps) return []
    const seedIds = new Set(WORKBENCH_IN_PROGRESS_SEED.map((r) => r.projectId).filter(Boolean))
    const dynamic: InProgressRowSeed[] = []
    for (const p of projects) {
      if (seedIds.has(p.id)) continue
      if (p.stage === 'expert_reviewing') {
        const done = p.experts.filter((e) => e.state === 'done').length
        const total = p.experts.length
        dynamic.push({
          id: `prog-expert-${p.id}`,
          kind: 'expert',
          typeLabel: '专家评审',
          projectName: p.name,
          projectId: p.id,
          createdAt: p.submittedAt.slice(0, 10),
          progressLabel: total ? `已提交 ${done}/${total} 位专家` : '等待专家提交',
          canUrge: true,
          href: `/innovation/project/${p.id}?tab=experts`,
        })
      } else if (p.stage === 'pending_ai' && p.aiReport) {
        dynamic.push({
          id: `prog-ai-done-${p.id}`,
          kind: 'ai',
          typeLabel: 'AI评估',
          projectName: p.name,
          projectId: p.id,
          createdAt: p.submittedAt.slice(0, 10),
          progressLabel: `评估完成（${p.aiReport.overall}分），待分配专家`,
          canUrge: false,
          href: `/innovation/ops/ai/${p.id}`,
        })
      }
    }
    return [...WORKBENCH_IN_PROGRESS_SEED, ...dynamic]
  }, [isOps, projects])
  const doneRows = useMemo(() => buildDoneRows(projects, role), [projects, role])
  const initiatedRows = useMemo(() => (isOps ? WORKBENCH_INITIATED_SEED : []), [isOps])

  const filteredTodos = useMemo(() => {
    const k = typeF === '全部' ? null : kindFromTypeFilter(typeF)
    return todoRows.filter((r) => {
      if (k && r.kind !== k) return false
      if (q.trim() && !r.projectName.includes(q.trim()) && !r.typeLabel.includes(q.trim())) return false
      return true
    })
  }, [todoRows, typeF, q])

  const filteredDone = useMemo(() => {
    return doneRows.filter((r) => {
      if (!typeLabelMatchesTabFilter(r.typeLabel, typeF)) return false
      if (q.trim() && !r.projectName.includes(q.trim()) && !r.typeLabel.includes(q.trim())) return false
      return true
    })
  }, [doneRows, typeF, q])

  const filteredInProgress = useMemo(() => {
    return inProgressRows.filter((r) => {
      if (!inProgressMatchesFilter(r, typeF)) return false
      if (q.trim() && !r.projectName.includes(q.trim()) && !r.typeLabel.includes(q.trim())) return false
      return true
    })
  }, [inProgressRows, typeF, q])

  const filteredInitiated = useMemo(() => {
    return initiatedRows.filter((r) => {
      if (q.trim() && !r.name.includes(q.trim()) && !r.flowType.includes(q.trim())) return false
      return true
    })
  }, [initiatedRows, q])

  const overdueCount = useMemo(() => {
    if (isOps) return DEMO_OVERDUE_KPI
    return todoRows.filter((r) => r.statusLabel === '超时').length
  }, [isOps, todoRows])

  useEffect(() => {
    setPage(1)
  }, [tab, typeF, q])

  useEffect(() => {
    const reviewId = searchParams.get('review')
    if (!reviewId) return
    const p = projects.find((x) => x.id === reviewId)
    if (p) setReviewProject(p)
    const next = new URLSearchParams(searchParams)
    next.delete('review')
    setSearchParams(next, { replace: true })
  }, [searchParams, projects, setSearchParams])

  const activeTotal =
    tab === 'todo'
      ? filteredTodos.length
      : tab === 'in_progress'
        ? filteredInProgress.length
        : tab === 'done'
          ? filteredDone.length
          : filteredInitiated.length

  const totalPages = Math.max(1, Math.ceil(activeTotal / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const sliceStart = (pageSafe - 1) * PAGE_SIZE

  const pagedTodos = filteredTodos.slice(sliceStart, sliceStart + PAGE_SIZE)
  const pagedInProgress = filteredInProgress.slice(sliceStart, sliceStart + PAGE_SIZE)
  const pagedDone = filteredDone.slice(sliceStart, sliceStart + PAGE_SIZE)
  const pagedInit = filteredInitiated.slice(sliceStart, sliceStart + PAGE_SIZE)

  const selectedRows = useMemo(() => filteredTodos.filter((r) => sel[r.id]), [filteredTodos, sel])

  const batchMaterial =
    selectedRows.length > 0 && selectedRows.every((r) => r.batchKey === 'material' && r.kind === 'material')
  const batchAi =
    selectedRows.length > 0 && selectedRows.every((r) => r.batchKey === 'ai' && r.kind === 'ai') && selectedRows.every((r) => {
      const p = projects.find((x) => x.id === r.projectId)
      return p?.stage === 'pending_ai' && !p.aiReport
    })

  const toggle = useCallback((id: string) => {
    setSel((s) => ({ ...s, [id]: !s[id] }))
  }, [])

  const toggleAllPage = useCallback(() => {
    const selectable = pagedTodos.filter((r) => r.batchKey != null).map((r) => r.id)
    if (selectable.length === 0) return
    const allOn = selectable.every((id) => sel[id])
    const next = { ...sel }
    selectable.forEach((id) => {
      next[id] = !allOn
    })
    setSel(next)
  }, [pagedTodos, sel])

  function openMaterialReview(projectId: string) {
    const p = projects.find((x) => x.id === projectId)
    if (!p) return
    setMaterialModal(p)
  }

  function openAiEvaluation(projectId: string) {
    const p = projects.find((x) => x.id === projectId)
    if (!p) return
    setAiEvalProject(p)
  }

  function openAssignExperts(projectId: string) {
    const p = projects.find((x) => x.id === projectId)
    if (p) setAssignProject(p)
  }

  function openDecision(projectId: string) {
    const p = projects.find((x) => x.id === projectId)
    if (p) setDecisionProject(p)
  }

  function openExpertReview(projectId: string) {
    const p = projects.find((x) => x.id === projectId)
    if (p) setReviewProject(p)
  }

  function openTaskAction(row: TodoRow) {
    switch (row.kind) {
      case 'material':
        openMaterialReview(row.projectId)
        break
      case 'ai':
        openAiEvaluation(row.projectId)
        break
      case 'assign':
        openAssignExperts(row.projectId)
        break
      case 'decision':
        openDecision(row.projectId)
        break
      case 'expert':
        openExpertReview(row.projectId)
        break
    }
  }

  function submitMaterialReview(outcome: 'pass' | 'return', comment: string) {
    if (!materialModal) return
    if (outcome === 'pass') {
      passMaterialReview(materialModal.id, comment)
      toast.show('资料审核通过，已进入 AI 评估阶段；已通知项目方（演示站内信）', 'success')
    } else {
      returnMaterialReview(materialModal.id, comment)
      toast.show('已退回修改，已通知项目方补充资料（演示站内信）', 'warning')
    }
    setMaterialModal(null)
  }

  function runBatchMaterialPass() {
    if (!batchMaterial) return
    const ids = selectedRows.map((r) => r.projectId)
    ids.forEach((id) => passMaterialReview(id))
    toast.show(`已批量通过 ${ids.length} 条资料审核（演示）`, 'success')
    setSel({})
  }

  function runBatchAiTrigger() {
    if (!batchAi) return
    const ids = selectedRows.map((r) => r.projectId)
    if (ids.length === 1) {
      openAiEvaluation(ids[0]!)
      setSel({})
      return
    }
    batchFinalizeAiEval(ids)
    toast.show(`已为 ${ids.length} 个项目生成 AI 初筛报告（演示）`, 'success')
    setSel({})
  }

  function urgeTodo(row: TodoRow) {
    const p = projects.find((x) => x.id === row.projectId)
    if (!p) return
    if (row.kind === 'expert' && p.stage === 'expert_reviewing') {
      const pend = p.experts.filter((e) => e.state !== 'done')
      pend.forEach((e) => urgeExpert(p.id, e.expertId))
      toast.show(`已向 ${pend.length} 位专家发送催办（演示）`, 'success')
      return
    }
    toast.show('已发送催办通知给当前处理人（演示）', 'success')
  }

  function urgeInProgress(row: InProgressRowSeed) {
    if (!row.canUrge || !row.projectId) {
      toast.show('已发送催办通知（演示）', 'success')
      return
    }
    const p = projects.find((x) => x.id === row.projectId)
    if (p?.stage === 'expert_reviewing') {
      const pend = p.experts.filter((e) => e.state !== 'done')
      pend.forEach((e) => urgeExpert(p.id, e.expertId))
      toast.show(`已向 ${pend.length} 位未提交专家发送站内信/邮件催办（演示）`, 'success')
      return
    }
    toast.show('已发送催办通知给当前处理人（演示）', 'success')
  }

  function cancelInitiated(row: InitiatedRowSeed) {
    toast.show(`已取消「${row.name}」申请（演示）`, 'success')
  }

  const showRoleHint = role === 'platform' || role === 'enterprise-admin'

  return (
    <div className="space-y-5">
      <header className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <p className="text-[12px] font-bold uppercase tracking-wide text-primary">科创策源 · 任务中心</p>
        <h1 className="mt-2 text-[20px] font-bold text-foreground">任务中心</h1>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted">
          我的待办、进行中、我的已办、我发起的四个视图覆盖任务全生命周期；支持任务类型筛选、搜索、分页与同类批量处理（演示数据）。
        </p>
        {showRoleHint ? (
          <p className="mt-2 text-[12px] text-muted">平台管理员视角已加载完整测试数据。</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/innovation/ops/pool" className="text-[13px] font-semibold text-primary hover:underline">
            候选项目池 →
          </Link>
          <span className="text-divider">|</span>
          <Link to="/innovation/ops/ai-hub" className="text-[13px] font-semibold text-primary hover:underline">
            AI 智能评估 →
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="今日待办" value={String(todoRows.length)} hint="当前列表待处理合计" />
        <KpiCard label="逾期任务" value={String(overdueCount)} hint="提交超过 7 天仍未关闭节点（演示规则）" danger={overdueCount > 0} />
        <KpiCard label="平均处理时长" value="2.3 天" hint="演示统计占位" />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-panel)] border border-divider bg-surface p-2 shadow-sm">
        {(['todo', 'in_progress', 'done', 'initiated'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setTab(k)
              setSel({})
            }}
            className={cn(
              'rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors',
              tab === k ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-page hover:text-foreground',
            )}
          >
            {k === 'todo'
              ? '我的待办'
              : k === 'in_progress'
                ? '进行中'
                : k === 'done'
                  ? '我的已办'
                  : '我发起的'}
            {k === 'todo'
              ? `（${todoRows.length}）`
              : k === 'in_progress'
                ? `（${inProgressRows.length}）`
                : k === 'done'
                  ? `（${doneRows.length}）`
                  : `（${initiatedRows.length}）`}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--radius-panel)] border border-divider bg-surface px-4 py-3 shadow-sm">
        <p className="mb-2 text-[12px] font-semibold text-muted">任务类型快捷筛选</p>
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTER_OPTS.map((x) => (
            <button
              key={x}
              type="button"
              disabled={tab === 'initiated'}
              onClick={() => setTypeF(x)}
              className={cn(
                'rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
                tab === 'initiated' && 'cursor-not-allowed opacity-40',
                typeF === x ? 'bg-primary text-white' : 'bg-page text-muted ring-1 ring-divider hover:text-foreground',
              )}
            >
              {x}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-muted" aria-hidden>
            🔍
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索任务或项目名称…"
            className="min-w-0 flex-1 rounded-md border border-divider bg-page px-3 py-2 text-[13px] sm:max-w-md"
          />
        </div>
      </div>

      {tab === 'todo' && (batchMaterial || batchAi) ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-[13px]">
          <span className="font-semibold text-foreground">已选 {selectedRows.length} 条同类任务</span>
          {batchMaterial ? (
            <button type="button" className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-hover" onClick={runBatchMaterialPass}>
              批量审核
            </button>
          ) : null}
          {batchAi ? (
            <button type="button" className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-hover" onClick={runBatchAiTrigger}>
              批量触发 AI 评估
            </button>
          ) : null}
          <button type="button" className="text-[12px] text-muted hover:text-foreground" onClick={() => setSel({})}>
            清除选择
          </button>
        </div>
      ) : null}

      {tab === 'todo' ? (
        <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
          <table className="min-w-[920px] w-full border-collapse text-[13px]">
            <thead className="bg-page text-[11px] font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="w-10 px-3 py-3 text-start">
                  <input
                    type="checkbox"
                    disabled={pagedTodos.every((r) => r.batchKey == null)}
                    checked={(() => {
                      const s = pagedTodos.filter((r) => r.batchKey != null)
                      return s.length > 0 && s.every((r) => sel[r.id])
                    })()}
                    onChange={toggleAllPage}
                  />
                </th>
                <th className="px-3 py-3 text-start">任务类型</th>
                <th className="px-3 py-3 text-start">任务名称 / 项目</th>
                <th className="px-3 py-3 text-start">创建时间</th>
                <th className="px-3 py-3 text-start">状态</th>
                <th className="px-3 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {pagedTodos.map((row) => (
                <tr key={row.id} className="hover:bg-page/60">
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={Boolean(sel[row.id])} onChange={() => toggle(row.id)} disabled={row.batchKey == null} />
                  </td>
                  <td className="px-3 py-3 font-medium text-foreground">{row.typeLabel}</td>
                  <td className="px-3 py-3 font-semibold text-foreground">{row.projectName}</td>
                  <td className="px-3 py-3 tabular-nums text-muted">{row.createdAt}</td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-bold',
                        row.statusLabel === '超时' && 'bg-danger/15 text-danger ring-1 ring-danger/25',
                        row.statusLabel === '处理中' && 'bg-primary/12 text-primary ring-1 ring-primary/22',
                        row.statusLabel === '待处理' && 'bg-muted/30 text-muted',
                      )}
                    >
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-end">
                    <div className="inline-flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                      <button type="button" className={opLinkPrimary} onClick={() => openTaskAction(row)}>
                        {row.actionLabel}
                      </button>
                      <Link to={`/innovation/project/${row.projectId}`} className={opLinkMuted}>
                        详情
                      </Link>
                      {row.statusLabel === '超时' ? (
                        <button type="button" className={opLinkUrge} onClick={() => urgeTodo(row)}>
                          催办
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagedTodos.length === 0 ? <p className="px-4 py-10 text-center text-[13px] text-muted">暂无待办</p> : null}
          <PaginationFooter total={filteredTodos.length} page={pageSafe} totalPages={totalPages} onPage={setPage} />
        </div>
      ) : null}

      {tab === 'in_progress' ? (
        <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
          <table className="min-w-[920px] w-full border-collapse text-[13px]">
            <thead className="bg-page text-[11px] font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 text-start">任务类型</th>
                <th className="px-4 py-3 text-start">任务名称 / 项目</th>
                <th className="px-4 py-3 text-start">创建时间</th>
                <th className="px-4 py-3 text-start">当前进度</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {pagedInProgress.map((row) => (
                <tr key={row.id} className="hover:bg-page/60">
                  <td className="px-4 py-3 font-medium text-foreground">{row.typeLabel}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{row.projectName}</td>
                  <td className="px-4 py-3 tabular-nums text-muted">{row.createdAt}</td>
                  <td className="px-4 py-3">
                    {row.progressPct != null ? (
                      <div className="flex min-w-[140px] items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-page">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${row.progressPct}%` }} />
                        </div>
                        <span className="text-[12px] text-muted">{row.progressLabel}</span>
                      </div>
                    ) : (
                      <span className="text-[12px] text-muted">{row.progressLabel}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="inline-flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                      {row.href ? (
                        <Link to={row.href} className={opLinkPrimary}>
                          查看进度
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={opLinkPrimary}
                          onClick={() => toast.show('资源申请详情（演示）', 'info')}
                        >
                          查看
                        </button>
                      )}
                      {row.canUrge ? (
                        <button type="button" className={opLinkUrge} onClick={() => urgeInProgress(row)}>
                          催办
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagedInProgress.length === 0 ? <p className="px-4 py-10 text-center text-[13px] text-muted">暂无进行中任务</p> : null}
          <PaginationFooter total={filteredInProgress.length} page={pageSafe} totalPages={totalPages} onPage={setPage} />
        </div>
      ) : null}

      {tab === 'done' ? (
        <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
          <table className="min-w-[800px] w-full border-collapse text-[13px]">
            <thead className="bg-page text-[11px] font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 text-start">任务类型</th>
                <th className="px-4 py-3 text-start">项目名称</th>
                <th className="px-4 py-3 text-start">处理结果</th>
                <th className="px-4 py-3 text-start">处理时间</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {pagedDone.map((row) => (
                <tr key={row.id} className="hover:bg-page/60">
                  <td className="px-4 py-3">{row.typeLabel}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{row.projectName}</td>
                  <td className="px-4 py-3 text-muted">{row.result}</td>
                  <td className="px-4 py-3 tabular-nums text-muted">{row.at}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="inline-flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                      {row.detailKind === 'report' ? (
                        <Link to={`/innovation/ops/ai/${row.projectId}`} className={opLinkPrimary}>
                          查看报告
                        </Link>
                      ) : row.detailKind === 'signing' ? (
                        <Link to={`/hatch/workbench?projectId=${encodeURIComponent(row.projectId)}`} className={opLinkPrimary}>
                          查看签约
                        </Link>
                      ) : (
                        <button type="button" className={opLinkPrimary} onClick={() => setDoneDetail(row)}>
                          查看详情
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagedDone.length === 0 ? <p className="px-4 py-10 text-center text-[13px] text-muted">暂无已办记录</p> : null}
          <PaginationFooter total={filteredDone.length} page={pageSafe} totalPages={totalPages} onPage={setPage} />
        </div>
      ) : null}

      {tab === 'initiated' ? (
        <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
          <table className="min-w-[880px] w-full border-collapse text-[13px]">
            <thead className="bg-page text-[11px] font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 text-start">流程类型</th>
                <th className="px-4 py-3 text-start">流程名称 / 项目</th>
                <th className="px-4 py-3 text-start">发起时间</th>
                <th className="px-4 py-3 text-start">当前节点</th>
                <th className="px-4 py-3 text-start">状态</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {pagedInit.map((row) => (
                <tr key={row.id} className="hover:bg-page/60">
                  <td className="px-4 py-3 font-medium text-foreground">{row.flowType}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{row.name}</td>
                  <td className="px-4 py-3 tabular-nums text-muted">{row.createdAt}</td>
                  <td className="px-4 py-3 text-muted">{row.currentNode}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-bold',
                        row.statusTone === 'primary' && 'bg-primary/12 text-primary',
                        row.statusTone === 'warning' && 'bg-warning/15 text-warning',
                        row.statusTone === 'muted' && 'bg-muted/30 text-muted',
                      )}
                    >
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="inline-flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                      {row.projectId ? (
                        <Link to={`/innovation/project/${row.projectId}`} className={opLinkPrimary}>
                          查看进度
                        </Link>
                      ) : (
                        <button type="button" className={opLinkPrimary} onClick={() => toast.show('资源申请进度（演示）', 'info')}>
                          查看进度
                        </button>
                      )}
                      {row.canSupplement ? (
                        <button type="button" className="text-[12px] font-semibold text-warning hover:underline" onClick={() => toast.show('请补充资料（演示）', 'info')}>
                          补充资料
                        </button>
                      ) : null}
                      {row.canCancel ? (
                        <button type="button" className={opLinkMuted} onClick={() => cancelInitiated(row)}>
                          取消申请
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagedInit.length === 0 ? <p className="px-4 py-10 text-center text-[13px] text-muted">暂无发起记录</p> : null}
          <PaginationFooter total={filteredInitiated.length} page={pageSafe} totalPages={totalPages} onPage={setPage} />
        </div>
      ) : null}

      <MaterialReviewModal
        project={materialModal}
        open={materialModal != null}
        onClose={() => setMaterialModal(null)}
        onSubmit={submitMaterialReview}
      />

      <AiEvaluationWizardModal
        project={aiEvalProject}
        open={aiEvalProject != null}
        onClose={() => setAiEvalProject(null)}
        onAssigned={() => setAiEvalProject(null)}
      />

      <ExpertAssignModal
        project={assignProject}
        open={assignProject != null}
        onClose={() => setAssignProject(null)}
        onAssigned={() => setAssignProject(null)}
      />

      <IncubationDecisionModal
        project={decisionProject}
        open={decisionProject != null}
        onClose={() => setDecisionProject(null)}
        onSubmitted={() => setDecisionProject(null)}
      />

      <ExpertReviewModal
        project={reviewProject}
        open={reviewProject != null}
        onClose={() => setReviewProject(null)}
        onSubmitted={() => setReviewProject(null)}
      />

      <Modal open={doneDetail != null} title="任务详情" onClose={() => setDoneDetail(null)}>
        {doneDetail ? (
          <dl className="space-y-2 text-[13px]">
            <div>
              <dt className="text-muted">任务类型</dt>
              <dd className="font-semibold">{doneDetail.typeLabel}</dd>
            </div>
            <div>
              <dt className="text-muted">项目</dt>
              <dd className="font-semibold">{doneDetail.projectName}</dd>
            </div>
            <div>
              <dt className="text-muted">处理结果</dt>
              <dd>{doneDetail.result}</dd>
            </div>
            <div>
              <dt className="text-muted">处理时间</dt>
              <dd className="tabular-nums">{doneDetail.at}</dd>
            </div>
            {doneDetail.actor ? (
              <div>
                <dt className="text-muted">处理人</dt>
                <dd>{doneDetail.actor}</dd>
              </div>
            ) : null}
            <Link to={`/innovation/project/${doneDetail.projectId}`} className="inline-block pt-2 text-[12px] font-semibold text-primary hover:underline">
              打开项目档案 →
            </Link>
          </dl>
        ) : null}
      </Modal>
    </div>
  )
}

function KpiCard({ label, value, hint, danger }: { label: string; value: string; hint: string; danger?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-panel)] border px-4 py-3 shadow-sm',
        danger ? 'border-danger/35 bg-danger/8' : 'border-divider bg-surface',
      )}
    >
      <p className="text-[12px] font-semibold text-muted">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold tabular-nums', danger ? 'text-danger' : 'text-foreground')}>{value}</p>
      <p className="mt-1 text-[11px] text-muted">{hint}</p>
    </div>
  )
}

function PaginationFooter({
  total,
  page,
  totalPages,
  onPage,
}: {
  total: number
  page: number
  totalPages: number
  onPage: (n: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider px-4 py-3 text-[13px] text-muted">
      <span>
        共 <span className="font-semibold text-foreground">{total}</span> 条
      </span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} className="rounded border border-divider px-2 py-1 text-[12px] disabled:opacity-40" onClick={() => onPage(page - 1)}>
          上一页
        </button>
        <span className="px-2 text-[12px]">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          className="rounded border border-divider px-2 py-1 text-[12px] disabled:opacity-40"
          onClick={() => onPage(page + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  )
}
