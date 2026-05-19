import { Link } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import type { UserRole } from '../../auth/types'
import { Modal } from '../../components/Modal'
import { StatusPill } from '../../components/ui/StatusPill'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import type { SjProject } from './innovationTypes'
import { DEMO_EXPERT_ZHANG_ID, applicantStatusFromStage, applicantStatusTone } from './innovationTypes'
import { useInnovationDemo } from './InnovationDemoContext'
import { poolStagePillVariant, poolStatusLabel } from './innovationPoolLabels'

type TaskTab = 'todo' | 'done' | 'initiated'

type TaskKind = 'material' | 'ai' | 'assign' | 'expert' | 'decision'

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
}

const PAGE_SIZE = 8

const TYPE_FILTER_OPTS = ['全部', '资料审核', 'AI评估', '专家分配', '入孵决策', '项目评审'] as const

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

function buildTodoRows(projects: SjProject[], role: UserRole): TodoRow[] {
  const rows: TodoRow[] = []
  const isExpert = role === 'expert'
  const isOps = role === 'platform' || role === 'enterprise-admin'

  if (!isExpert || isOps) {
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
  }

  if (isExpert || isOps) {
    for (const p of projects) {
      if (p.stage !== 'expert_reviewing') continue
      if (isOps) {
        rows.push({
          id: `expert-${p.id}`,
          kind: 'expert',
          typeLabel: '项目评审',
          projectId: p.id,
          projectName: p.name,
          createdAt: p.submittedAt.slice(0, 10),
          statusLabel: todoStatus(p, 'expert'),
          actionLabel: '查看/催办',
          href: `/innovation/project/${p.id}?tab=experts`,
          batchKey: null,
        })
        continue
      }
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
  }

  return rows
}

function buildDoneRows(projects: SjProject[]): DoneRow[] {
  const rows: DoneRow[] = []
  for (const p of projects) {
    if (p.id === 'sj-106' && p.stage === 'decision_pass') {
      rows.push(
        { id: `${p.id}-d1`, typeLabel: '资料审核', projectName: p.name, projectId: p.id, result: '通过', at: '2025-05-10 14:32', actor: '李四（运营初审）' },
        {
          id: `${p.id}-d2`,
          typeLabel: 'AI评估',
          projectName: p.name,
          projectId: p.id,
          result: p.aiReport ? `完成（${p.aiReport.overall}分）` : '完成',
          at: p.aiEvaluatedAt ?? '2025-05-11 09:00',
          actor: '系统',
        },
        { id: `${p.id}-d3`, typeLabel: '专家分配', projectName: p.name, projectId: p.id, result: '已分配 3 人', at: '2025-05-11 10:05', actor: '王五（运营）' },
        { id: `${p.id}-d4`, typeLabel: '专家评审', projectName: p.name, projectId: p.id, result: '已完成', at: '2025-05-15 18:00', actor: '专家组' },
        {
          id: `${p.id}-d5`,
          typeLabel: '入孵决策',
          projectName: p.name,
          projectId: p.id,
          result: '通过（实体入孵）',
          at: p.decisionAt ?? '2025-05-16 10:30',
          actor: p.decisionBy ?? '运营主管',
        },
      )
      continue
    }
    if (p.stage === 'decision_pass' && p.decisionAt) {
      rows.push({
        id: `${p.id}-dec`,
        typeLabel: '入孵决策',
        projectName: p.name,
        projectId: p.id,
        result: p.decisionChoice === 'physical' ? '通过（实体入孵）' : p.decisionChoice === 'virtual' ? '通过（虚拟入孵）' : '通过',
        at: p.decisionAt,
        actor: p.decisionBy,
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
      })
    }
  }
  return rows.sort((a, b) => String(b.at).localeCompare(String(a.at)))
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

  const [tab, setTab] = useState<TaskTab>('todo')
  const [q, setQ] = useState('')
  const [typeF, setTypeF] = useState<(typeof TYPE_FILTER_OPTS)[number]>('全部')
  const [page, setPage] = useState(1)
  const [sel, setSel] = useState<Record<string, boolean>>({})

  const [materialModal, setMaterialModal] = useState<SjProject | null>(null)
  const [matComment, setMatComment] = useState('')
  const [matOutcome, setMatOutcome] = useState<'pass' | 'return'>('pass')
  const [doneDetail, setDoneDetail] = useState<DoneRow | null>(null)

  const todoRows = useMemo(() => buildTodoRows(projects, role), [projects, role])
  const doneRows = useMemo(() => buildDoneRows(projects), [projects])
  const initiatedRows = useMemo(() => projects.filter((p) => p.applicantOwned), [projects])

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

  const filteredInitiated = useMemo(() => {
    return initiatedRows.filter((p) => {
      if (q.trim() && !p.name.includes(q.trim()) && !p.orgFullName.includes(q.trim())) return false
      return true
    })
  }, [initiatedRows, q])

  const overdueCount = useMemo(() => todoRows.filter((r) => r.statusLabel === '超时').length, [todoRows])

  useEffect(() => {
    setPage(1)
  }, [tab, typeF, q])

  const totalPages = Math.max(
    1,
    Math.ceil((tab === 'todo' ? filteredTodos.length : tab === 'done' ? filteredDone.length : filteredInitiated.length) / PAGE_SIZE),
  )
  const pageSafe = Math.min(page, totalPages)
  const sliceStart = (pageSafe - 1) * PAGE_SIZE

  const pagedTodos = filteredTodos.slice(sliceStart, sliceStart + PAGE_SIZE)
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

  function submitMaterialModal() {
    if (!materialModal) return
    if (matOutcome === 'pass') {
      passMaterialReview(materialModal.id, matComment)
      toast.show('已通过资料审核（演示）', 'success')
    } else {
      if (!matComment.trim()) {
        toast.show('退回时请填写审核意见', 'warning')
        return
      }
      returnMaterialReview(materialModal.id, matComment)
      toast.show('已退回补充资料', 'success')
    }
    setMaterialModal(null)
    setMatComment('')
    setMatOutcome('pass')
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
    batchFinalizeAiEval(selectedRows.map((r) => r.projectId))
    toast.show(`已为 ${selectedRows.length} 个项目生成 AI 初筛报告（演示）`, 'success')
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

  const checklistPct = useCallback((p: SjProject) => {
    if (!p.checklist.length) return 0
    const ok = p.checklist.filter((c) => c.ok).length
    return Math.round((ok / p.checklist.length) * 100)
  }, [])

  const showRoleHint = role === 'platform' || role === 'enterprise-admin'

  return (
    <div className="space-y-5">
      <header className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <p className="text-[12px] font-bold uppercase tracking-wide text-primary">科创策源 · 任务中心</p>
        <h1 className="mt-2 text-[20px] font-bold text-foreground">任务中心</h1>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted">
          统一聚合入孵流程中的待办、已办与发起记录：支持类型筛选、搜索、分页、同类任务批量处理与超时催办（演示数据；生产环境对接各业务表与 WebSocket 推送）。
        </p>
        {showRoleHint ? (
          <p className="mt-2 text-[12px] text-muted">当前为园区运营 / 企业管理员视角，展示全量任务类型；专家账号将侧重「项目评审」待办。后续可按 RBAC 裁剪可见任务。</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/innovation/ops/pool" className="text-[13px] font-semibold text-primary hover:underline">
            候选项目池 →
          </Link>
          <span className="text-divider">|</span>
          <Link to="/innovation/expert/tasks" className="text-[13px] font-semibold text-primary hover:underline">
            专家任务台 →
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="今日待办" value={String(todoRows.length)} hint="当前列表待处理合计" />
        <KpiCard label="逾期任务" value={String(overdueCount)} hint="提交超过 7 天仍未关闭节点（演示规则）" danger={overdueCount > 0} />
        <KpiCard label="平均处理时长" value="2.3 天" hint="演示统计占位" />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-panel)] border border-divider bg-surface p-2 shadow-sm">
        {(['todo', 'done', 'initiated'] as const).map((k) => (
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
            {k === 'todo' ? '我的待办' : k === 'done' ? '我的已办' : '我发起的'}
            {k === 'todo' ? `（${todoRows.length}）` : k === 'done' ? `（${doneRows.length}）` : `（${initiatedRows.length}）`}
          </button>
        ))}
        <div className="ms-auto flex min-w-[200px] flex-1 flex-wrap items-center justify-end gap-2 sm:min-w-0">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索任务或项目名称…"
            className="min-w-0 flex-1 rounded-md border border-divider bg-page px-3 py-2 text-[13px] sm:max-w-xs"
          />
          <label className="flex items-center gap-2 text-[13px] text-muted">
            类型
            <select
              value={typeF}
              onChange={(e) => setTypeF(e.target.value as (typeof TYPE_FILTER_OPTS)[number])}
              className="rounded-md border border-divider bg-page px-2 py-2 text-[13px]"
            >
              {TYPE_FILTER_OPTS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {tab === 'todo' && (batchMaterial || batchAi) ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-[13px]">
          <span className="font-semibold text-foreground">已选 {selectedRows.length} 条同类任务</span>
          {batchMaterial ? (
            <button type="button" className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-hover" onClick={runBatchMaterialPass}>
              批量资料审核（通过）
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
                    <div className="flex flex-wrap justify-end gap-2">
                      {row.kind === 'material' ? (
                        <button
                          type="button"
                          className="rounded-md border border-divider px-2 py-1 text-[12px] font-semibold hover:border-primary/40"
                          onClick={() => {
                            const p = projects.find((x) => x.id === row.projectId)
                            if (p) {
                              setMatOutcome('pass')
                              setMatComment('')
                              setMaterialModal(p)
                            }
                          }}
                        >
                          审核
                        </button>
                      ) : null}
                      <Link to={row.href} className="rounded-md bg-primary px-2 py-1 text-[12px] font-semibold text-white hover:bg-primary-hover">
                        {row.actionLabel}
                      </Link>
                      <Link to={`/innovation/project/${row.projectId}`} className="text-[12px] font-semibold text-muted hover:text-primary hover:underline">
                        查看
                      </Link>
                      {row.statusLabel === '超时' ? (
                        <button type="button" className="text-[12px] font-semibold text-amber-700 hover:underline dark:text-amber-400" onClick={() => urgeTodo(row)}>
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
                    <button type="button" className="text-[12px] font-semibold text-primary hover:underline" onClick={() => setDoneDetail(row)}>
                      查看详情
                    </button>
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
          <p className="border-b border-divider bg-page/80 px-4 py-2 text-[12px] text-muted">演示环境：展示所有 `applicantOwned` 申报项目；生产环境仅当前用户发起记录。</p>
          <table className="min-w-[800px] w-full border-collapse text-[13px]">
            <thead className="bg-page text-[11px] font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 text-start">申请项目</th>
                <th className="px-4 py-3 text-start">提交时间</th>
                <th className="px-4 py-3 text-start">当前节点</th>
                <th className="px-4 py-3 text-start">状态</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {pagedInit.map((p) => {
                const u = applicantStatusFromStage(p)
                const badge = applicantStatusTone(u)
                return (
                  <tr key={p.id} className="hover:bg-page/60">
                    <td className="px-4 py-3 font-semibold text-foreground">{p.name}</td>
                    <td className="px-4 py-3 tabular-nums text-muted">{p.submittedAt}</td>
                    <td className="px-4 py-3 text-muted">{p.currentNodePublic}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill variant={poolStagePillVariant(p)}>{poolStatusLabel(p)}</StatusPill>
                        <span className={cn('rounded px-2 py-0.5 text-[10px] font-bold', badge.className)}>{badge.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link to={`/innovation/project/${p.id}`} className="text-[12px] font-semibold text-primary hover:underline">
                          查看进度
                        </Link>
                        {p.stage === 'returned_supplement' ? (
                          <Link to="/innovation/applicant/register" className="text-[12px] font-semibold text-warning hover:underline">
                            补充资料
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {pagedInit.length === 0 ? <p className="px-4 py-10 text-center text-[13px] text-muted">暂无发起记录</p> : null}
          <PaginationFooter total={filteredInitiated.length} page={pageSafe} totalPages={totalPages} onPage={setPage} />
        </div>
      ) : null}

      <Modal
        open={materialModal != null}
        title={materialModal ? `资料审核 · ${materialModal.name}` : ''}
        onClose={() => {
          setMaterialModal(null)
          setMatComment('')
        }}
        footer={
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setMaterialModal(null)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={submitMaterialModal}>
              提交
            </button>
          </>
        }
      >
        {materialModal ? (
          <div className="space-y-4 text-[13px]">
            <p>
              <span className="text-muted">资料完整性：</span>
              <span className="font-bold text-primary">{checklistPct(materialModal)}%</span>（按资料清单勾选演示）
            </p>
            <label className="block">
              <span className="text-muted">审核意见</span>
              <textarea
                className="mt-1 w-full rounded-md border border-divider bg-page px-3 py-2"
                rows={3}
                value={matComment}
                onChange={(e) => setMatComment(e.target.value)}
                placeholder="选填；退回时建议说明补充项"
              />
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" checked={matOutcome === 'pass'} onChange={() => setMatOutcome('pass')} />
                通过
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" checked={matOutcome === 'return'} onChange={() => setMatOutcome('return')} />
                退回
              </label>
            </div>
            <p className="text-[12px] text-muted">提交后同步项目阶段；亦可从「审核」进入完整审核页处理附件预览。</p>
          </div>
        ) : null}
      </Modal>

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
