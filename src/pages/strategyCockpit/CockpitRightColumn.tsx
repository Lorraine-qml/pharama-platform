import { useState } from 'react'
import {
  ACHIEVEMENT_LEGEND,
  ACHIEVEMENT_TABS,
  ACHIEVEMENT_TREND,
  ACHIEVEMENT_YEARS,
  ACHIEVEMENT_Y_MAX,
  ACHIEVEMENT_Y_MIN,
  ANTIBIOTIC_RESISTANCE,
  CCHPMM_STATS,
  CYP2C19,
  DRUG_CERT_CATEGORIES,
  DRUG_CERT_SERIES,
  DRUG_CERT_X_MAX,
} from './cockpitData'

function SectionIcon() {
  return (
    <svg className="right-col__icon" viewBox="0 0 28 28" aria-hidden>
      <circle cx={14} cy={9} r={5.5} fill="#ff9a2e" />
      <path d="M3 24 Q14 17 25 24" fill="none" stroke="#00a8e8" strokeWidth={1.8} />
      <path d="M5 25 Q14 20 23 25" fill="rgba(0,168,232,0.25)" />
    </svg>
  )
}

function RightSection({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`right-col__section ${className ?? ''}`}>
      <div className="right-col__head">
        <div className="right-col__head-main">
          <SectionIcon />
          <span className="right-col__title">{title}</span>
        </div>
        <div className="right-col__head-line" aria-hidden>
          <span className="right-col__head-line-bar" />
          <span className="right-col__head-line-dots" />
        </div>
      </div>
      <div className="right-col__body">{children}</div>
    </section>
  )
}

function CypDonutChart() {
  const size = 88
  const total = CYP2C19.reduce((s, x) => s + x.value, 0)
  let acc = 0
  const r = size / 2 - 6
  const cx = size / 2
  const cy = size / 2
  const paths = CYP2C19.map((seg) => {
    const start = (acc / total) * 360
    acc += seg.value
    const end = (acc / total) * 360
    const large = end - start > 180 ? 1 : 0
    const sRad = ((start - 90) * Math.PI) / 180
    const eRad = ((end - 90) * Math.PI) / 180
    const x1 = cx + r * Math.cos(sRad)
    const y1 = cy + r * Math.sin(sRad)
    const x2 = cx + r * Math.cos(eRad)
    const y2 = cy + r * Math.sin(eRad)
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: seg.color, label: seg.label }
  })

  return (
    <div className="right-col__cyp-row">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths.map((p) => (
          <path key={p.label} d={p.d} fill={p.color} opacity={0.92} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.5} fill="rgba(3,12,30,0.96)" />
      </svg>
      <div className="right-col__cyp-legend">
        {CYP2C19.map((s) => (
          <div key={s.label} className="right-col__cyp-legend-item">
            <span className="right-col__cyp-legend-dot" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function AntibioticBarChart() {
  const w = 380
  const h = 108
  const padL = 34
  const padB = 28
  const padT = 10
  const chartW = w - padL - 8
  const chartH = h - padB - padT
  const barW = 22
  const gap = (chartW - barW * ANTIBIOTIC_RESISTANCE.length) / (ANTIBIOTIC_RESISTANCE.length - 1)

  return (
    <div className="right-col__ab-chart">
      <div className="right-col__ab-title">
        <span className="right-col__ab-title-icon" aria-hidden />
        抗生素耐药率
      </div>
      <svg className="right-col__chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="abBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.15} />
          </linearGradient>
        </defs>
        {[0, 20, 40, 60, 80, 100].map((pct) => {
          const y = padT + chartH - (pct / 100) * chartH
          return (
            <g key={pct}>
              <line x1={padL} y1={y} x2={w - 4} y2={y} stroke="rgba(0,168,232,0.1)" strokeWidth={1} />
              <text x={padL - 4} y={y + 3} textAnchor="end" fill="rgba(186,230,253,0.45)" fontSize={8}>
                {pct}%
              </text>
            </g>
          )
        })}
        {ANTIBIOTIC_RESISTANCE.map((d, i) => {
          const x = padL + i * (barW + gap)
          const bh = (d.value / 100) * chartH
          const baseY = padT + chartH
          return (
            <g key={d.label}>
              {d.value > 0 ? (
                <rect x={x} y={baseY - bh} width={barW} height={bh} fill="url(#abBarGrad)" rx={1} />
              ) : null}
              <text x={x + barW / 2} y={h - 6} textAnchor="middle" fill="rgba(186,230,253,0.55)" fontSize={7.5}>
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function AchievementChart() {
  const w = 380
  const h = 110
  const padL = 38
  const padB = 24
  const padT = 16
  const chartW = w - padL - 8
  const chartH = h - padB - padT
  const yRange = ACHIEVEMENT_Y_MAX - ACHIEVEMENT_Y_MIN
  const step = chartW / (ACHIEVEMENT_TREND.length - 1)

  const coords = ACHIEVEMENT_TREND.map((v, i) => {
    const x = padL + i * step
    const y = padT + chartH - ((v - ACHIEVEMENT_Y_MIN) / yRange) * chartH
    return { x, y }
  })
  const linePath = coords.map((c) => `${c.x},${c.y}`).join(' L')
  const areaPath = `M${padL},${padT + chartH} L${linePath} L${padL + chartW},${padT + chartH} Z`

  const yTicks = [210, 218, 226, 234, 242, 248]

  return (
    <div className="right-col__ach-chart">
      <div className="right-col__ach-legend">
        <span className="right-col__ach-legend-dot" />
        {ACHIEVEMENT_LEGEND}
      </div>
      <svg className="right-col__chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="achAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff9a2e" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#ff9a2e" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => {
          const y = padT + chartH - ((tick - ACHIEVEMENT_Y_MIN) / yRange) * chartH
          return (
            <g key={tick}>
              <line x1={padL} y1={y} x2={w - 4} y2={y} stroke="rgba(0,168,232,0.1)" strokeWidth={1} />
              <text x={padL - 4} y={y + 3} textAnchor="end" fill="rgba(186,230,253,0.45)" fontSize={8}>
                {tick}
              </text>
            </g>
          )
        })}
        <path d={areaPath} fill="url(#achAreaGrad)" />
        <path d={`M${linePath}`} fill="none" stroke="#ff9a2e" strokeWidth={2} />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={2.5} fill="#ff9a2e" />
        ))}
        {ACHIEVEMENT_YEARS.map((lbl, i) => (
          <text key={lbl} x={padL + i * step} y={h - 4} textAnchor="middle" fill="rgba(186,230,253,0.55)" fontSize={9}>
            {lbl}
          </text>
        ))}
      </svg>
    </div>
  )
}

function DrugCertChart() {
  const w = 380
  const h = 132
  const padL = 108
  const padT = 22
  const padB = 14
  const rowH = 26
  const barH = 5
  const chartW = w - padL - 16
  const scale = chartW / DRUG_CERT_X_MAX

  return (
    <div className="right-col__drug-chart">
      <div className="right-col__drug-legend">
        {DRUG_CERT_SERIES.map((s) => (
          <span key={s.year} className="right-col__drug-legend-item">
            <span className="right-col__drug-legend-sq" style={{ background: s.color }} />
            {s.year}
          </span>
        ))}
      </div>
      <svg className="right-col__chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {[0, 5, 10, 15, 20].map((tick) => {
          const x = padL + tick * scale
          return (
            <g key={tick}>
              <line x1={x} y1={padT - 4} x2={x} y2={h - padB} stroke="rgba(0,168,232,0.08)" strokeWidth={1} />
              <text x={x} y={h - 2} textAnchor="middle" fill="rgba(186,230,253,0.45)" fontSize={8}>
                {tick}
              </text>
            </g>
          )
        })}
        {DRUG_CERT_CATEGORIES.map((cat, ri) => {
          const y = padT + ri * rowH
          return (
            <g key={cat}>
              <text x={padL - 6} y={y + barH - 1} textAnchor="end" fill="rgba(186,230,253,0.6)" fontSize={9}>
                {cat}
              </text>
              {DRUG_CERT_SERIES.map((series, si) => {
                const val = series.values[ri]
                const bw = val * scale
                const by = y + si * (barH + 2)
                return <rect key={series.year} x={padL} y={by} width={bw} height={barH} fill={series.color} rx={1} opacity={0.9} />
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function CockpitRightColumn() {
  const [achieveTab, setAchieveTab] = useState(0)

  return (
    <div className="right-col">
      <div className="right-col__cchpmm">
        <div className="right-col__brand">
          <SectionIcon />
          <span className="right-col__brand-name">ccHpMM</span>
        </div>
        <div className="right-col__brand-line" aria-hidden />

        <div className="right-col__metrics">
          <span className="right-col__metrics-arrow">‹</span>
          {CCHPMM_STATS.map((s) => (
            <div key={s.label} className="right-col__metric">
              <div className="right-col__metric-val">{s.value}</div>
              <div className="right-col__metric-lbl">{s.label}</div>
            </div>
          ))}
          <span className="right-col__metrics-arrow">›</span>
        </div>

        <p className="right-col__cyp-title">CYP2C19基因多态性分布</p>
        <CypDonutChart />
        <AntibioticBarChart />
      </div>

      <RightSection title="成果展示">
        <div className="right-col__tabs">
          {ACHIEVEMENT_TABS.map((t, i) => (
            <button key={t} type="button" className={`right-col__tab ${achieveTab === i ? 'is-active' : ''}`} onClick={() => setAchieveTab(i)}>
              {t}
            </button>
          ))}
        </div>
        <AchievementChart />
      </RightSection>

      <RightSection title="药证产品" className="right-col__section--grow">
        <DrugCertChart />
      </RightSection>
    </div>
  )
}
