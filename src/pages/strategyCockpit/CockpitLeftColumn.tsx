import { useState } from 'react'
import {
  GROUPED_BAR_LEGEND,
  GROUPED_BAR_Y_MAX,
  GROUPED_BAR_Y_TICKS,
  HEALTH_DATA_VOLUME,
  HEALTH_LEGEND,
  HEALTH_MONTHS,
  HEALTH_POPULATION,
  HEALTH_Y_MAX,
  HEALTH_Y_TICKS,
  LEFT_DATE_FILTER,
  RESEARCH_GROUPED_BARS,
  RESEARCH_INVENTORY,
  RESEARCH_STATS,
  THIRD_PARTY_GROUPED_BARS,
  THIRD_PARTY_STATS,
} from './cockpitData'

function SectionIcon() {
  return (
    <svg className="left-col__icon" viewBox="0 0 28 28" aria-hidden>
      <circle cx={14} cy={9} r={5.5} fill="#ff9a2e" />
      <path d="M3 24 Q14 17 25 24" fill="none" stroke="#00a8e8" strokeWidth={1.8} />
      <path d="M5 25 Q14 20 23 25" fill="rgba(0,168,232,0.25)" />
    </svg>
  )
}

function LeftDateFilter() {
  return (
    <div className="left-col__filter">
      <span className="left-col__filter-label">日期筛选</span>
      <div className="left-col__filter-controls">
        <span className="left-col__filter-select">
          {LEFT_DATE_FILTER.unit}
          <span className="left-col__filter-caret">▾</span>
        </span>
        <span className="left-col__filter-date">
          {LEFT_DATE_FILTER.value}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 9h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </div>
    </div>
  )
}

function LeftSection({ title, extra, children }: { title: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="left-col__section">
      <div className="left-col__head">
        <div className="left-col__head-row">
          <div className="left-col__head-main">
            <SectionIcon />
            <span className="left-col__title">{title}</span>
          </div>
          {extra}
        </div>
        <div className="left-col__head-line" aria-hidden>
          <span className="left-col__head-line-bar" />
          <span className="left-col__head-line-dots" />
        </div>
      </div>
      <div className="left-col__body">{children}</div>
    </section>
  )
}

function DashStatsRow({ stats }: { stats: readonly { label: string; value: string }[] }) {
  return (
    <div className="left-col__stats">
      {stats.map((s) => (
        <div key={s.label} className="left-col__stat">
          <div className="left-col__stat-val">{s.value}</div>
          <div className="left-col__stat-lbl">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function GroupedBarLegend() {
  return (
    <div className="left-col__chart-legend">
      {GROUPED_BAR_LEGEND.map((item) => (
        <span key={item.label} className="left-col__chart-legend-item">
          <span className="left-col__chart-legend-sq" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

function GroupedBarChart01({
  data,
  compact,
}: {
  data: readonly { label: string; current: number; previous: number }[]
  compact?: boolean
}) {
  const w = compact ? 240 : 380
  const h = compact ? 88 : 100
  const padL = 32
  const padB = 22
  const padT = 8
  const chartW = w - padL - 8
  const chartH = h - padB - padT
  const groupW = chartW / data.length
  const barW = groupW * 0.22

  return (
    <div className="left-col__chart-wrap">
      <GroupedBarLegend />
      <svg className="left-col__chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {GROUPED_BAR_Y_TICKS.map((tick) => {
          const y = padT + chartH - (tick / GROUPED_BAR_Y_MAX) * chartH
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={w - 4} y2={y} stroke="rgba(0,168,232,0.12)" strokeWidth={1} />
              <text x={padL - 4} y={y + 3} textAnchor="end" fill="rgba(186,230,253,0.5)" fontSize={8}>
                {tick}
              </text>
            </g>
          )
        })}
        {data.map((d, i) => {
          const gx = padL + i * groupW + groupW / 2
          const curH = (d.current / GROUPED_BAR_Y_MAX) * chartH
          const prevH = (d.previous / GROUPED_BAR_Y_MAX) * chartH
          const baseY = padT + chartH
          return (
            <g key={d.label}>
              {curH > 0 ? (
                <rect x={gx - barW - 2} y={baseY - curH} width={barW} height={curH} fill="#00a8e8" rx={1} />
              ) : null}
              {prevH > 0 ? (
                <rect x={gx + 2} y={baseY - prevH} width={barW} height={prevH} fill="#ff9a2e" rx={1} />
              ) : null}
              <text x={gx} y={h - 4} textAnchor="middle" fill="rgba(186,230,253,0.55)" fontSize={compact ? 8 : 9}>
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ResearchInventoryBox() {
  return (
    <div className="left-col__inv-box">
      <div className="left-col__inv-row">
        <div className="left-col__inv-unit">{RESEARCH_INVENTORY[0].unit}</div>
        <div className="left-col__inv-lbl">{RESEARCH_INVENTORY[0].label}</div>
      </div>
      <div className="left-col__inv-divider" aria-hidden />
      <div className="left-col__inv-row">
        <div className="left-col__inv-unit">{RESEARCH_INVENTORY[1].unit}</div>
        <div className="left-col__inv-lbl">{RESEARCH_INVENTORY[1].label}</div>
      </div>
    </div>
  )
}

function PublicHealthChart({ mode }: { mode: 'pop' | 'data' }) {
  const points = mode === 'data' ? HEALTH_DATA_VOLUME : HEALTH_POPULATION
  const w = 380
  const h = 118
  const padL = 38
  const padB = 22
  const padT = 14
  const chartW = w - padL - 8
  const chartH = h - padB - padT
  const step = chartW / (points.length - 1)

  const coords = points.map((v, i) => {
    const x = padL + i * step
    const y = padT + chartH - (v / HEALTH_Y_MAX) * chartH
    return { x, y, v }
  })

  const linePath = coords.map((c) => `${c.x},${c.y}`).join(' L')
  const areaPath = `M${padL},${padT + chartH} L${linePath} L${padL + chartW},${padT + chartH} Z`

  return (
    <div className="left-col__health-chart">
      <div className="left-col__health-legend">
        <span className="left-col__health-legend-dot" />
        {HEALTH_LEGEND}
      </div>
      <svg className="left-col__chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="healthAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff9a2e" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#ff9a2e" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {HEALTH_Y_TICKS.map((tick) => {
          const y = padT + chartH - (tick / HEALTH_Y_MAX) * chartH
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={w - 4} y2={y} stroke="rgba(0,168,232,0.1)" strokeWidth={1} />
              <text x={padL - 4} y={y + 3} textAnchor="end" fill="rgba(186,230,253,0.45)" fontSize={8}>
                {tick}
              </text>
            </g>
          )
        })}
        <path d={areaPath} fill="url(#healthAreaGrad)" />
        <path d={`M${linePath}`} fill="none" stroke="#ff9a2e" strokeWidth={2} />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={2.5} fill="#ff9a2e" />
        ))}
        {HEALTH_MONTHS.map((lbl, i) => (
          <text key={lbl} x={padL + i * step} y={h - 4} textAnchor="middle" fill="rgba(186,230,253,0.55)" fontSize={9}>
            {lbl}
          </text>
        ))}
      </svg>
    </div>
  )
}

export function CockpitLeftColumn() {
  const [healthTab, setHealthTab] = useState<'pop' | 'data'>('data')

  return (
    <div className="left-col">
      <LeftDateFilter />

      <LeftSection title="第三方生物样本中心">
        <DashStatsRow stats={THIRD_PARTY_STATS} />
        <GroupedBarChart01 data={THIRD_PARTY_GROUPED_BARS} />
      </LeftSection>

      <LeftSection title="科研生物样本中心">
        <DashStatsRow stats={RESEARCH_STATS} />
        <div className="left-col__research-row">
          <ResearchInventoryBox />
          <GroupedBarChart01 data={RESEARCH_GROUPED_BARS} compact />
        </div>
      </LeftSection>

      <LeftSection
        title="公共健康数据"
        extra={
          <div className="left-col__toggle">
            <button
              type="button"
              className={`left-col__toggle-btn ${healthTab === 'pop' ? 'is-active' : ''}`}
              onClick={() => setHealthTab('pop')}
            >
              按人口
            </button>
            <button
              type="button"
              className={`left-col__toggle-btn ${healthTab === 'data' ? 'is-active' : ''}`}
              onClick={() => setHealthTab('data')}
            >
              按数据
            </button>
          </div>
        }
      >
        <PublicHealthChart mode={healthTab} />
      </LeftSection>
    </div>
  )
}
