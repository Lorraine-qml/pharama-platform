import { useState } from 'react'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'

const YEARS = ['2025 年', '2024 年']

export default function EvalEffectivenessPage() {
  const toast = useToast()
  const [year, setYear] = useState(YEARS[0])

  function drill(label: string) {
    toast.show(`「${label}」明细下钻（演示）`, 'success')
  }

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="🏅 AI 孵化成效评价"
        lines={[
          '园区级 KPI 与达成率、资源效果、AI 赋能指标及生态趋势（演示数据）。',
          '点击 KPI 卡片可模拟下钻至项目或订单列表。',
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider pb-4">
        <h1 className="text-lg font-bold text-foreground">AI 孵化成效评价</h1>
        <label className="flex items-center gap-2 text-[13px] text-muted">
          <span>时间</span>
          <select className="rounded-md border border-divider bg-surface px-3 py-2 text-foreground" value={year} onChange={(e) => setYear(e.target.value)}>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { k: '在孵项目数', v: '32', sub: year },
          { k: '毕业项目数', v: '5', sub: year },
          { k: '高潜力项目数', v: '6', sub: year },
          { k: '累计融资金额', v: '3.2 亿元', sub: year },
        ].map((c) => (
          <button
            key={c.k}
            type="button"
            className="rounded-lg border border-divider bg-surface p-4 text-left shadow-sm transition hover:border-primary/40 hover:bg-muted/10"
            onClick={() => drill(c.k)}
          >
            <div className="text-[12px] text-muted">{c.sub}</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">{c.v}</div>
            <div className="mt-1 text-[13px] font-medium text-foreground">{c.k}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
          <h2 className="mb-4 text-[13px] font-bold text-foreground">里程碑达成率（按类型）</h2>
          <ul className="space-y-3 text-[13px]">
            <MilestoneBar label="研发里程碑" pct={78} />
            <MilestoneBar label="融资里程碑" pct={65} />
            <MilestoneBar label="注册里程碑" pct={40} />
          </ul>
        </section>
        <section className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
          <h2 className="mb-4 text-[13px] font-bold text-foreground">资源使用效果评价</h2>
          <ul className="space-y-2 text-[13px]">
            <li className="flex justify-between border-b border-divider/60 py-2">
              <span className="text-muted">资源使用满意度</span>
              <span className="font-semibold">4.6 / 5</span>
            </li>
            <li className="flex justify-between border-b border-divider/60 py-2">
              <span className="text-muted">资源预约完成率</span>
              <span className="font-semibold">92%</span>
            </li>
            <li className="flex justify-between py-2">
              <span className="text-muted">资源复用率</span>
              <span className="font-semibold">34%</span>
            </li>
          </ul>
        </section>
      </div>

      <section className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-bold text-foreground">AI 赋能效果评价</h2>
        <ul className="grid gap-2 text-[13px] sm:grid-cols-3">
          <li className="rounded-md border border-divider bg-muted/10 px-3 py-2">AI 评估采纳率：85%</li>
          <li className="rounded-md border border-divider bg-muted/10 px-3 py-2">AI 报告辅助节省时间：平均 2 小时 / 项目</li>
          <li className="rounded-md border border-divider bg-muted/10 px-3 py-2">智能体任务完成率：96%</li>
        </ul>
      </section>

      <section className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
        <h2 className="mb-4 text-[13px] font-bold text-foreground">生态活跃度趋势（近 6 个月）</h2>
        <p className="mb-2 text-[12px] text-muted">跨项目协作次数、资源互用次数（演示折线）</p>
        <svg width="100%" height="200" viewBox="0 0 520 200" preserveAspectRatio="none" className="max-h-[220px] text-primary">
          <line x1="40" y1="20" x2="40" y2="170" stroke="currentColor" strokeOpacity={0.2} />
          <line x1="40" y1="170" x2="500" y2="170" stroke="currentColor" strokeOpacity={0.2} />
          <polyline
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            points="40,140 120,100 200,110 280,70 360,85 440,55 500,60"
          />
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity={0.5}
            points="40,155 120,130 200,145 280,120 360,130 440,100 500,95"
          />
          <text x="44" y="190" className="fill-muted text-[10px]">
            蓝：协作 · 灰：互用
          </text>
        </svg>
      </section>
    </div>
  )
}

function MilestoneBar({ label, pct }: { label: string; pct: number }) {
  return (
    <li>
      <div className="mb-1 flex justify-between">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/40">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </li>
  )
}
