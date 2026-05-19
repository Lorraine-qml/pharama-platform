import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useToast } from '../../../components/ToastProvider'
import { cn } from '../../../utils/cn'
import type { InvestmentLeadGrade, InvestmentLeadStatus } from './innovationInvestmentTypes'
import { useInnovationInvestmentV2 } from './InnovationInvestmentV2Context'

const ASSIGN = ['张三', '李四', '王五']

export default function InnovationOutreachHub() {
  const v = useInnovationInvestmentV2()
  const toast = useToast()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [grade, setGrade] = useState<'全部' | InvestmentLeadGrade | '未分级'>('全部')
  const [status, setStatus] = useState<'全部' | InvestmentLeadStatus>('全部')
  const [source, setSource] = useState('全部')

  const sources = useMemo(() => ['全部', ...new Set(v.leads.map((l) => l.source))], [v.leads])

  const filtered = useMemo(() => {
    return v.leads.filter((l) => {
      const hit =
        q.trim() === '' ||
        l.name.includes(q.trim()) ||
        (l.region?.includes(q.trim()) ?? false) ||
        (l.track?.includes(q.trim()) ?? false)
      const gHit = grade === '全部' || (grade === '未分级' ? !l.grade : l.grade === grade)
      const sHit = status === '全部' || l.status === status
      const srcHit = source === '全部' || l.source === source
      return hit && gHit && sHit && srcHit
    })
  }, [v.leads, grade, q, status, source])

  return (
    <div className="space-y-4">
      <header className="rounded-[var(--radius-panel)] border border-primary/15 bg-gradient-to-r from-primary-light/35 via-surface to-surface px-5 py-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">招商触达辅助 · V2</p>
        <h1 className="mt-1 text-[21px] font-bold text-foreground">线索池与工作台</h1>
        <p className="mt-2 max-w-2xl text-[13px] text-muted">
          左侧维系线索漏斗，右侧完成话术与跟进复盘，与「行业趋势」入库联动。
        </p>
      </header>

      <div className="flex min-h-[520px] flex-col gap-4 lg:flex-row lg:gap-6">
        <aside className="w-full shrink-0 rounded-[var(--radius-panel)] border border-divider bg-surface lg:max-w-[400px]">
          <div className="sticky top-0 z-[1] space-y-4 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-divider px-3 py-1.5 text-[12px] font-semibold hover:border-primary/40"
                onClick={() => toast.show('CSV 占位：请选择文件（演示）', 'info')}
              >
                导入
              </button>
              <button
                type="button"
                className="rounded-lg border border-divider px-3 py-1.5 text-[12px] font-semibold hover:border-primary/40"
                onClick={() => toast.show('已开始导出所选线索 JSON（演示）', 'success')}
              >
                导出
              </button>
              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-bold text-white shadow-sm hover:bg-primary-hover"
                onClick={() => {
                  const name = window.prompt('线索名称')
                  if (!name?.trim()) return
                  const id = v.addLead({
                    name: name.trim(),
                    grade: '',
                    source: '手工新建',
                    assignee: ASSIGN[0],
                    status: '新建',
                    lastTouch: new Date().toISOString().slice(5, 10),
                    followUps: [],
                  })
                  void nav(`/innovation/outreach/leads/${id}`)
                  toast.show('已进入新建线索草稿', 'success')
                }}
              >
                + 新增
              </button>
            </div>
            <div className="space-y-2">
              <input
                placeholder="🔍 搜索名称 / 城市 / 赛道"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-lg border border-divider px-3 py-2 text-[13px]"
              />
              <div className="flex flex-wrap gap-2">
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as typeof grade)}
                  className="grow rounded-lg border px-2 py-1 text-[11px]"
                >
                  <option>全部</option>
                  <option value="未分级">未分级</option>
                  <option value="S">S</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="grow rounded-lg border px-2 py-1 text-[11px]"
                >
                  <option>全部</option>
                  <option>新建</option>
                  <option>跟进中</option>
                  <option>已触达</option>
                  <option>意向确认</option>
                  <option>已转化</option>
                  <option>已流失</option>
                </select>
                <select value={source} onChange={(e) => setSource(e.target.value)} className="min-w-[100px] grow rounded-lg border px-2 py-1 text-[11px]">
                  {sources.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <ul className="-mx-1 max-h-[min(58vh,640px)] space-y-1 overflow-y-auto pr-1 text-[13px]">
              {filtered.map((l) => (
                <li key={l.id}>
                  <NavLink
                    to={`/innovation/outreach/leads/${l.id}`}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-xl border px-3 py-2.5 motion-safe:transition-colors',
                        isActive
                          ? 'border-primary/55 bg-primary-light/85 shadow-[inset_0_0_0_1px_rgb(30_109_255/0.12)]'
                          : 'border-transparent hover:border-divider hover:bg-page',
                      )
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate font-semibold text-foreground">{l.name}</span>
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary ring-1 ring-primary/35">
                        {l.grade || '—'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {l.assignee ? `${l.assignee} · ` : ''}
                      {l.source}
                    </p>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="min-h-[460px] min-w-0 flex-1 rounded-[var(--radius-panel)] border border-divider bg-surface shadow-inner">
          <Outlet />
        </section>
      </div>
    </div>
  )
}
