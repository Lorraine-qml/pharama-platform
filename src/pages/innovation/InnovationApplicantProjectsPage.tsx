import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import type { ApplicantUiStatus } from './innovationTypes'
import { applicantStatusFromStage, applicantStatusTone } from './innovationTypes'
import { useInnovationDemo } from './InnovationDemoContext'
import { cn } from '../../utils/cn'

const TRACK_FILTER = ['全部', '精准医疗', 'AI+CRO', '细胞治疗', '大分子药']

export default function InnovationApplicantProjectsPage() {
  const { projects } = useInnovationDemo()
  const mine = useMemo(() => projects.filter((p) => p.applicantOwned), [projects])
  const [stateF, setStateF] = useState('全部')
  const [trackF, setTrackF] = useState('全部')
  const [q, setQ] = useState('')

  const rows = mine.filter((p) => {
    if (trackF !== '全部' && p.track !== trackF) return false
    if (q.trim() && !p.name.includes(q.trim())) return false
    if (stateF === '全部') return true
    const u = applicantStatusFromStage(p)
    const map: Record<string, ApplicantUiStatus | '审核中' | '评审中'> = {
      '待处理': 'pending',
      进行中: 'in_progress',
      已完成: 'done',
      退回修改: 'returned',
      审核中: 'in_progress',
      评审中: 'in_progress',
    }
    const want = map[stateF]
    if (stateF === '审核中') return u === 'in_progress' && (p.stage === 'pending_material_review' || p.stage === 'pending_ai')
    if (stateF === '评审中') return u === 'in_progress' && ['pending_expert_assign', 'expert_reviewing'].includes(p.stage)
    return u === want
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">项目方工作台</p>
          <p className="mt-1 text-[16px] font-bold text-foreground">我的项目</p>
          <p className="mt-1 text-[13px] text-muted">仅展示本单位提交的线索与注册项目（演示）。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/innovation/applicant/register"
            className="rounded-[var(--radius-button)] bg-primary px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-primary-hover"
          >
            ＋ 新建项目
          </Link>
          <Link
            to="/innovation/applicant/register?ops=1"
            className="rounded-[var(--radius-button)] border border-divider bg-surface px-4 py-2.5 text-[13px] font-semibold text-foreground hover:border-primary/40"
          >
            运营代录入孵（原运营角色）
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-[var(--radius-panel)] border border-divider bg-surface px-4 py-3">
        <label className="text-[13px] text-muted">
          状态
          <select
            value={stateF}
            onChange={(e) => setStateF(e.target.value)}
            className="ms-2 rounded-md border border-divider bg-page px-2 py-1 text-[13px] text-foreground"
          >
            {['全部', '待处理', '审核中', '评审中', '进行中', '退回修改', '已完成'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-[13px] text-muted">
          赛道
          <select
            value={trackF}
            onChange={(e) => setTrackF(e.target.value)}
            className="ms-2 rounded-md border border-divider bg-page px-2 py-1 text-[13px]"
          >
            {TRACK_FILTER.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[200px] flex-1 flex-col text-[13px] text-muted">
          搜索项目名称
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="输入关键字…"
            className="mt-1 rounded-md border border-divider bg-page px-3 py-2 text-[13px] text-foreground"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
        <table className="min-w-full border-collapse text-[13px]">
          <thead className="bg-page text-[12px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 text-start">项目名称</th>
              <th className="px-4 py-3 text-start">提交时间</th>
              <th className="px-4 py-3 text-start">当前节点</th>
              <th className="px-4 py-3 text-start">状态</th>
              <th className="px-4 py-3 text-end">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {rows.map((p) => {
              const u = applicantStatusFromStage(p)
              const badge = applicantStatusTone(u)
              return (
                <tr key={p.id} className="hover:bg-page/80">
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted tabular-nums">{p.submittedAt}</td>
                  <td className="px-4 py-3 text-foreground">{p.currentNodePublic}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-md px-2 py-1 text-[11px] font-bold', badge.className)}>{badge.label}</span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link to={`/innovation/project/${p.id}`} className="font-medium text-primary hover:underline">
                      查看详情
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-4 py-10 text-center text-[13px] text-muted">暂无匹配项目。</p> : null}
      </div>
    </div>
  )
}
