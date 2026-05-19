import { Link } from 'react-router-dom'
import { useToast } from '../components/ToastProvider'

const funnel = [
  { name: '线索', value: 1200 },
  { name: '注册', value: 420 },
  { name: 'AI初筛', value: 280 },
  { name: '专家评审', value: 96 },
  { name: '入驻', value: 34 },
]

export default function CockpitPage() {
  const max = funnel[0]!.value
  const toast = useToast()

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted">漏斗、资源 KPI、孵化成效卡片（点击查看下钻占位）。</p>
        </div>
        <Link
          to="/cockpit/ai-query"
          className="rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-[14px] font-medium text-white hover:bg-primary-hover"
        >
          打开 AI 问数 →
        </Link>
      </div>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-card">
        <header className="mb-6 flex items-center gap-3">
          <h2 className="text-[16px] font-semibold text-foreground">招商漏斗</h2>
          <span className="text-[11px] text-muted">各环节数量与转化率占位</span>
        </header>
        <div className="space-y-3">
          {funnel.map((s, idx) => {
            const prevValue = funnel[idx === 0 ? 0 : idx - 1]!.value
            const width = `${Math.max((s.value / max) * 100, 12)}%`
            const rateLabel =
              idx === 0 ? '起点' : `${Math.round((s.value / prevValue) * 100)}% 转化`
            return (
              <div key={s.name}>
                <div className="mb-1 flex justify-between text-[12px] text-muted">
                  <span>{s.name}</span>
                  <span>
                    {s.value} · {rateLabel}
                  </span>
                </div>
                <div className="h-9 rounded-[var(--radius-button)] bg-page">
                  <div
                    className="flex h-full items-center justify-end rounded-[var(--radius-button)] bg-primary px-2 text-[12px] font-medium text-white"
                    style={{ width }}
                  >
                    &nbsp;
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { k: '资源总数', v: '186', tone: '' },
          { k: '实验室利用率 TOP1', v: 'A101 · 93%', tone: '' },
          { k: '在途资源单', v: '47', tone: '' },
          { k: '异常工单', v: '3', tone: 'text-warning' },
        ].map((c) => (
          <button
            key={c.k}
            type="button"
            onClick={() => toast.show(`${c.k} 下钻（演示）`, 'info')}
            className="rounded-[var(--radius-card)] border border-divider bg-surface p-5 text-left shadow-card transition hover:border-primary"
          >
            <p className="text-[12px] font-medium uppercase tracking-wide text-muted">{c.k}</p>
            <p className={`mt-3 text-[24px] font-bold ${c.tone || 'text-primary'}`}>{c.v}</p>
          </button>
        ))}
      </section>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-card">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[16px] font-semibold text-foreground">资源使用趋势（演示折线）</h2>
          <button type="button" className="text-[13px] text-primary" onClick={() => toast.show('导出 Excel', 'info')}>
            导出
          </button>
        </header>
        <div className="flex h-[180px] items-end gap-5 border-b border-l border-divider pl-8 pb-0">
          {[72, 90, 64, 88, 100, 78, 112].map((h, i) => (
            <div key={String(i)} className="relative flex flex-1 flex-col items-center">
              <span
                className="inline-block w-7 rounded-t-[var(--radius-button)] bg-primary/90"
                style={{ height: `${h}px` }}
                aria-hidden
              />
              <span className="mt-4 text-[10px] text-muted">W{i + 40}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-card">
        <header className="mb-6">
          <h2 className="text-[16px] font-semibold text-foreground">孵化成效 KPI</h2>
        </header>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiTile label="毕业企业" value="52" />
          <KpiTile label="累计融资额（亿）" value="146" />
          <KpiTile label="专利总数（件）" value="2.3k" />
        </div>
      </section>
    </div>
  )
}

function KpiTile({ label, value }: { label: string; value: string }) {
  const toast = useToast()
  return (
    <button
      type="button"
      className="rounded-[var(--radius-card)] bg-primary-light/40 p-4 text-left hover:ring-1 hover:ring-primary"
      onClick={() => toast.show(`${label} 下钻至名单`, 'success')}
    >
      <span className="text-[13px] text-muted">{label}</span>
      <span className="mt-4 block text-[28px] font-bold text-foreground">{value}</span>
    </button>
  )
}
