import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import { StatusPill } from '../../components/ui/StatusPill'
import { downloadCsv } from '../eco/ecoDownload'
import type { SjProject } from './innovationTypes'
import { useInnovationDemo } from './InnovationDemoContext'
import { poolStagePillVariant, poolStatusLabel } from './innovationPoolLabels'

const ENTITY_FILTERS = ['全部', '企业', '高校', '研究所', '医院'] as const

function entityMatch(filter: string, p: SjProject) {
  if (filter === '全部') return true
  return p.entityTypeLabel.includes(filter)
}

function stageFilterMatch(filter: string, p: SjProject) {
  if (filter === '全部') return true
  return poolStatusLabel(p) === filter
}

function statusFilterOptions(projects: SjProject[]) {
  const labels = new Set<string>()
  projects.forEach((p) => labels.add(poolStatusLabel(p)))
  return ['全部', ...Array.from(labels).sort()]
}

function trackOptions(projects: SjProject[]) {
  const ts = new Set(projects.map((p) => p.track))
  return ['全部', ...Array.from(ts)]
}

export default function InnovationOpsPoolPage() {
  const toast = useToast()
  const { projects, batchDeleteProjects } = useInnovationDemo()
  const [entityF, setEntityF] = useState<string>('全部')
  const [statusF, setStatusF] = useState('全部')
  const [trackF, setTrackF] = useState('全部')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Record<string, boolean>>({})

  const statusOpts = useMemo(() => statusFilterOptions(projects), [projects])
  const trackOpts = useMemo(() => trackOptions(projects), [projects])

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (!entityMatch(entityF, p)) return false
      if (!stageFilterMatch(statusF, p)) return false
      if (trackF !== '全部' && p.track !== trackF) return false
      if (q.trim() && !p.name.includes(q.trim()) && !p.orgFullName.includes(q.trim())) return false
      return true
    })
  }, [projects, entityF, statusF, trackF, q])

  const selectedIds = useMemo(() => Object.keys(sel).filter((id) => sel[id]), [sel])

  function toggle(id: string) {
    setSel((s) => ({ ...s, [id]: !s[id] }))
  }

  function toggleAllPage() {
    const onPage = filtered.map((p) => p.id)
    const allOn = onPage.length > 0 && onPage.every((id) => sel[id])
    const next = { ...sel }
    onPage.forEach((id) => {
      next[id] = !allOn
    })
    setSel(next)
  }

  function runBatchDelete() {
    if (selectedIds.length === 0) return
    if (!window.confirm(`确认删除选中的 ${selectedIds.length} 条项目？（演示数据）`)) return
    batchDeleteProjects(selectedIds)
    toast.show('已删除选中项目', 'warning')
    setSel({})
  }

  function deleteOne(p: SjProject) {
    if (!window.confirm(`确认删除「${p.name}」？（演示数据）`)) return
    batchDeleteProjects([p.id])
    setSel((s) => {
      const next = { ...s }
      delete next[p.id]
      return next
    })
    toast.show('已删除该项目', 'warning')
  }

  function exportFiltered() {
    const rows = filtered.map((p) => [p.name, p.entityTypeLabel, p.track, poolStatusLabel(p), p.submittedAt])
    downloadCsv(`候选项目池-${new Date().toISOString().slice(0, 10)}.csv`, ['项目名称', '主体类型', '赛道', '状态', '提交时间'], rows)
    toast.show('已导出当前筛选结果（CSV）', 'success')
  }

  function exportSelected() {
    if (selectedIds.length === 0) {
      toast.show('请先勾选要导出的项目', 'warning')
      return
    }
    const set = new Set(selectedIds)
    const rows = projects.filter((p) => set.has(p.id)).map((p) => [p.name, p.entityTypeLabel, p.track, poolStatusLabel(p), p.submittedAt])
    downloadCsv(`候选项目池-已选${selectedIds.length}条-${new Date().toISOString().slice(0, 10)}.csv`, ['项目名称', '主体类型', '赛道', '状态', '提交时间'], rows)
    toast.show(`已导出 ${selectedIds.length} 条（CSV）`, 'success')
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide text-primary">科创策源 · 项目档案库</p>
          <h1 className="mt-1 text-[20px] font-bold text-foreground">候选项目池</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
            仅用于项目档案的查询、新增、编辑与删除；资料审核、AI 评估、专家分配与入孵决策请前往「任务中心」集中处理。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/innovation/applicant/register?from=pool"
            className="rounded-[var(--radius-button)] bg-primary px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-primary-hover"
          >
            ＋ 新增项目
          </Link>
          <button
            type="button"
            className="rounded-[var(--radius-button)] border border-divider bg-surface px-4 py-2.5 text-[13px] font-semibold text-foreground hover:border-primary/40"
            onClick={() => toast.show('导入 Excel（演示占位）', 'info')}
          >
            导入
          </button>
          <button
            type="button"
            className="rounded-[var(--radius-button)] border border-divider bg-surface px-4 py-2.5 text-[13px] font-semibold text-foreground hover:border-primary/40"
            onClick={exportFiltered}
          >
            导出
          </button>
          <Link to="/innovation/ops/workbench" className="self-center rounded-[var(--radius-button)] border border-primary/30 bg-primary/8 px-4 py-2.5 text-[13px] font-semibold text-primary hover:bg-primary/12">
            任务中心 →
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-[var(--radius-panel)] border border-divider bg-surface px-4 py-4">
        <span className="w-full text-[12px] font-semibold text-muted sm:w-auto sm:py-2">筛选</span>
        <label className="text-[13px] text-muted">
          来源类型
          <select
            value={entityF}
            onChange={(e) => setEntityF(e.target.value)}
            className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px] text-foreground"
          >
            {ENTITY_FILTERS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="text-[13px] text-muted">
          状态
          <select
            value={statusF}
            onChange={(e) => setStatusF(e.target.value)}
            className="mt-1 block max-w-[200px] rounded-md border border-divider bg-page px-2 py-2 text-[13px] text-foreground"
          >
            {statusOpts.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="text-[13px] text-muted">
          赛道
          <select
            value={trackF}
            onChange={(e) => setTrackF(e.target.value)}
            className="mt-1 block max-w-[180px] rounded-md border border-divider bg-page px-2 py-2 text-[13px] text-foreground"
          >
            {trackOpts.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[200px] flex-1 flex-col text-[13px] text-muted">
          <span className="flex items-center gap-1">
            <span aria-hidden>🔍</span> 项目名称 / 主体
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索…"
            className="mt-1 rounded-md border border-divider bg-page px-3 py-2 text-[13px] text-foreground"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-panel)] border border-divider bg-page px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={exportSelected}
            className="rounded-md border border-divider bg-surface px-4 py-2 text-[13px] font-semibold text-foreground hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            批量导出所选
          </button>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={runBatchDelete}
            className="rounded-md border border-danger/40 bg-danger/8 px-4 py-2 text-[13px] font-semibold text-danger hover:bg-danger/12 disabled:cursor-not-allowed disabled:opacity-40"
          >
            批量删除
          </button>
        </div>
        <p className="text-[13px] text-muted">
          共 <span className="font-bold text-foreground">{filtered.length}</span> 条
          <span className="mx-2 text-divider">|</span>
          已选 {selectedIds.length} 条
        </p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
        <table className="min-w-[960px] w-full border-collapse text-[13px]">
          <thead className="bg-page text-[12px] font-bold uppercase tracking-wide text-muted">
            <tr>
              <th className="w-10 px-3 py-3 text-start">
                <input type="checkbox" checked={filtered.length > 0 && filtered.every((p) => sel[p.id])} onChange={toggleAllPage} />
              </th>
              <th className="px-4 py-3 text-start">项目名称</th>
              <th className="px-4 py-3 text-start">主体类型</th>
              <th className="px-4 py-3 text-start">赛道</th>
              <th className="px-4 py-3 text-start">状态</th>
              <th className="px-4 py-3 text-start">提交时间</th>
              <th className="px-4 py-3 text-end">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-page/60">
                <td className="px-3 py-3">
                  <input type="checkbox" checked={Boolean(sel[p.id])} onChange={() => toggle(p.id)} />
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">{p.name}</td>
                <td className="px-4 py-3 text-muted">{p.entityTypeLabel}</td>
                <td className="px-4 py-3 text-muted">{p.track}</td>
                <td className="px-4 py-3">
                  <StatusPill variant={poolStagePillVariant(p)}>{poolStatusLabel(p)}</StatusPill>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted">{p.submittedAt}</td>
                <td className="px-4 py-3 text-end">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link to={`/innovation/project/${p.id}`} className="text-[12px] font-semibold text-primary hover:underline">
                      查看
                    </Link>
                    <Link to={`/innovation/project/${p.id}?tab=basic`} className="text-[12px] font-semibold text-foreground hover:underline">
                      编辑
                    </Link>
                    <button type="button" className="text-[12px] font-semibold text-danger hover:underline" onClick={() => deleteOne(p)}>
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? <p className="px-4 py-10 text-center text-[13px] text-muted">暂无数据。</p> : null}
      </div>

      <footer className="text-[12px] text-muted">分页占位：1 2 3 …（演示）</footer>
    </div>
  )
}
