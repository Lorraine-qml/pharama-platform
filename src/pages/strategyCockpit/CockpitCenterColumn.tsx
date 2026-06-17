import { type ReactNode } from 'react'
import {
  CENTER_DATE_FILTER,
  DATA_PRODUCTS,
  HUB_NODES,
  KPI_TOP,
} from './cockpitData'

function SectionIcon() {
  return (
    <svg className="center-col__icon" viewBox="0 0 28 28" aria-hidden>
      <circle cx={14} cy={9} r={5.5} fill="#ff9a2e" />
      <path d="M3 24 Q14 17 25 24" fill="none" stroke="#00a8e8" strokeWidth={1.8} />
      <path d="M5 25 Q14 20 23 25" fill="rgba(0,168,232,0.25)" />
    </svg>
  )
}

function CenterSectionHead({ title, extra }: { title: string; extra?: ReactNode }) {
  return (
    <div className="center-col__head">
      <div className="center-col__head-row">
        <div className="center-col__head-main">
          <SectionIcon />
          <span className="center-col__title">{title}</span>
        </div>
        {extra}
      </div>
      <div className="center-col__head-line" aria-hidden>
        <span className="center-col__head-line-bar" />
        <span className="center-col__head-line-dots" />
      </div>
    </div>
  )
}

function DataProductsDonut() {
  const size = 100
  const total = DATA_PRODUCTS.reduce((s, x) => s + x.value, 0)
  let acc = 0
  const r = size / 2 - 4
  const cx = size / 2
  const cy = size / 2
  const paths = DATA_PRODUCTS.map((seg) => {
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
    <div className="center-col__donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths.map((p) => (
          <path key={p.label} d={p.d} fill={p.color} opacity={0.92} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.48} fill="rgba(3,12,30,0.96)" />
      </svg>
      <div className="center-col__donut-legend">
        {DATA_PRODUCTS.map((s) => (
          <div key={s.label} className="center-col__donut-legend-item">
            <span className="center-col__donut-legend-dot" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function CtbiDiagram() {
  const cx = 200
  const cy = 88

  return (
    <div className="center-col__ctbi">
      <svg viewBox="0 0 400 175" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="ctbiArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="rgba(0,200,255,0.7)" />
          </marker>
        </defs>

        {/* 左侧标注 */}
        <polygon points="28,78 38,68 48,78 38,88" fill="rgba(255,154,46,0.85)" />
        <text x={38} y={74} textAnchor="middle" fill="#fff" fontSize={7}>
          三种人群
        </text>
        <text x={38} y={84} textAnchor="middle" fill="#fff" fontSize={7}>
          三种状态
        </text>

        {/* 右侧标注 */}
        <polygon points="352,78 362,68 372,78 362,88" fill="rgba(255,154,46,0.85)" />
        <text x={362} y={80} textAnchor="middle" fill="#fff" fontSize={8}>
          转化应用
        </text>

        {/* 连接线 */}
        <line x1={48} y1={78} x2={118} y2={78} stroke="rgba(0,180,255,0.35)" strokeWidth={1} strokeDasharray="3 2" />
        <line x1={282} y1={78} x2={352} y2={78} stroke="rgba(0,180,255,0.35)" strokeWidth={1} strokeDasharray="3 2" />

        {/* 菱形框架连线 */}
        <path
          d={`M ${cx} ${cy - 48} L ${cx + 72} ${cy} L ${cx} ${cy + 48} L ${cx - 72} ${cy} Z`}
          fill="none"
          stroke="rgba(0,200,255,0.45)"
          strokeWidth={1.2}
          markerMid="url(#ctbiArrow)"
        />

        {/* 箭头与标签 */}
        <path d={`M ${cx} ${cy - 48} L ${cx + 72} ${cy}`} fill="none" stroke="rgba(0,200,255,0.5)" strokeWidth={1} markerEnd="url(#ctbiArrow)" />
        <text x={cx + 38} y={cy - 28} textAnchor="middle" fill="rgba(186,230,253,0.7)" fontSize={8}>
          数据资源
        </text>

        <path d={`M ${cx + 72} ${cy} L ${cx} ${cy + 48}`} fill="none" stroke="rgba(0,200,255,0.5)" strokeWidth={1} markerEnd="url(#ctbiArrow)" />
        <text x={cx + 38} y={cy + 32} textAnchor="middle" fill="rgba(186,230,253,0.7)" fontSize={8}>
          生物信息分析
        </text>

        <path d={`M ${cx} ${cy + 48} L ${cx - 72} ${cy}`} fill="none" stroke="rgba(0,200,255,0.5)" strokeWidth={1} markerEnd="url(#ctbiArrow)" />
        <text x={cx - 38} y={cy + 32} textAnchor="middle" fill="rgba(186,230,253,0.7)" fontSize={8}>
          人群分层
        </text>

        <path d={`M ${cx - 72} ${cy} L ${cx} ${cy - 48}`} fill="none" stroke="rgba(0,200,255,0.5)" strokeWidth={1} markerEnd="url(#ctbiArrow)" />
        <text x={cx - 38} y={cy - 28} textAnchor="middle" fill="rgba(186,230,253,0.7)" fontSize={8}>
          采集要求
        </text>

        <text x={cx - 98} y={cy + 4} textAnchor="end" fill="rgba(186,230,253,0.55)" fontSize={8}>
          理论基础
        </text>
        <text x={cx + 98} y={cy + 4} textAnchor="start" fill="rgba(186,230,253,0.55)" fontSize={8}>
          目标要求
        </text>

        {/* 中心 PIODS + 结构化框架 */}
        <rect x={cx - 36} y={cy - 14} width={72} height={28} rx={2} fill="rgba(0,50,100,0.55)" stroke="rgba(0,200,255,0.4)" strokeWidth={1} />
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#b8e8ff" fontSize={9}>
          结构化框架
        </text>
        <circle cx={cx} cy={cy} r={14} fill="rgba(255,154,46,0.9)" stroke="rgba(255,180,80,0.6)" strokeWidth={1} />
        <text x={cx} y={cy + 3} textAnchor="middle" fill="#fff" fontSize={7} fontWeight={600}>
          PIODS原则
        </text>

        {/* 四角节点 */}
        {[
          { x: cx, y: cy - 48, lines: ['B', '样本库'] },
          { x: cx - 72, y: cy, lines: ['C', '专病数据库'] },
          { x: cx + 72, y: cy, lines: ['', '数据产品化'] },
          { x: cx, y: cy + 48, lines: ['I', '数据特征'] },
        ].map((n) => (
          <g key={n.lines.join('-')}>
            <circle cx={n.x} cy={n.y} r={22} fill="rgba(0,45,95,0.75)" stroke="rgba(0,200,255,0.5)" strokeWidth={1} />
            {n.lines[0] ? (
              <text x={n.x} y={n.y - 2} textAnchor="middle" fill="#ff9a2e" fontSize={11} fontWeight={700}>
                {n.lines[0]}
              </text>
            ) : null}
            <text x={n.x} y={n.y + (n.lines[0] ? 10 : 4)} textAnchor="middle" fill="#b8e8ff" fontSize={8}>
              {n.lines[1]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function HubVisual() {
  const cx = 260
  const cy = 210
  const radius = 175
  const coreX = 260
  const coreY = 200

  return (
    <div className="center-col__hub-wrap">
      <div className="center-col__hub-grid" aria-hidden />
      <div className="center-col__hub">
        <svg className="center-col__hub-beams" viewBox="0 0 520 420" aria-hidden>
          <defs>
            <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,220,255,0.55)" />
              <stop offset="100%" stopColor="rgba(0,220,255,0)" />
            </linearGradient>
          </defs>
          {HUB_NODES.map((node) => {
            const rad = ((node.angle - 90) * Math.PI) / 180
            const nx = cx + radius * Math.cos(rad)
            const ny = cy + radius * Math.sin(rad)
            return (
              <g key={node.key}>
                <line x1={nx} y1={ny - 20} x2={nx} y2={ny + 8} stroke="url(#beamGrad)" strokeWidth={3} opacity={0.7} />
                <line x1={nx} y1={ny} x2={coreX} y2={coreY + 10} stroke="rgba(0,212,255,0.18)" strokeWidth={1} />
              </g>
            )
          })}
        </svg>
        <div className="center-col__hub-ring center-col__hub-ring--1" />
        <div className="center-col__hub-ring center-col__hub-ring--2" />
        <div className="center-col__hub-ring center-col__hub-ring--3" />
        <div className="center-col__hub-core">
          <div className="center-col__hub-logo">
            <span className="center-col__hub-logo-nc">NCC</span>
            <span className="center-col__hub-logo-bd">
              B
              <svg className="center-col__hub-logo-dna" viewBox="0 0 24 32" aria-hidden>
                <path d="M12 2 C6 8 6 14 12 16 C18 18 18 24 12 30 M12 2 C18 8 18 14 12 16 C6 18 6 24 12 30" fill="none" stroke="#00d4ff" strokeWidth={2} />
                {[6, 12, 18, 24].map((y) => (
                  <line key={y} x1={9} y1={y} x2={15} y2={y} stroke="#ff9a2e" strokeWidth={1.2} />
                ))}
              </svg>
              D
            </span>
            <span className="center-col__hub-logo-tm">™</span>
          </div>
        </div>
        {HUB_NODES.map((node) => {
          const rad = ((node.angle - 90) * Math.PI) / 180
          const x = cx + radius * Math.cos(rad)
          const y = cy + radius * Math.sin(rad)
          return (
            <div key={node.key} className="center-col__hub-node" style={{ left: `${(x / 520) * 100}%`, top: `${(y / 420) * 100}%` }}>
              <div className="center-col__hub-node-pedestal" aria-hidden />
              <div className="center-col__hub-node-ring">{node.key}</div>
              <span className="center-col__hub-node-label">{node.label}</span>
              <span className="center-col__hub-node-label-en">{node.labelEn}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CenterDateFilter() {
  return (
    <div className="center-col__filter">
      <span className="center-col__filter-select">
        {CENTER_DATE_FILTER.unit}
        <span className="center-col__filter-caret">▾</span>
      </span>
      <span className="center-col__filter-date">
        {CENTER_DATE_FILTER.value}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 9h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  )
}

export function CockpitCenterColumn() {
  return (
    <div className="center-col">
      <div className="center-col__kpi-row">
        {KPI_TOP.map((k) => (
          <div key={k.key} className="center-col__kpi-card">
            <div className="center-col__kpi-hex">{k.key}</div>
            <div>
              <div className="center-col__kpi-value">
                {k.value}
                {k.suffix}
                <span className="center-col__kpi-unit">{k.unit}</span>
              </div>
              <div className="center-col__kpi-label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <HubVisual />

      <div className="center-col__bottom">
        <section className="center-col__panel center-col__panel--ctbi">
          <CenterSectionHead title="CTBI" />
          <div className="center-col__panel-body">
            <CtbiDiagram />
          </div>
        </section>

        <section className="center-col__panel center-col__panel--data">
          <CenterSectionHead title="数据产品" extra={<CenterDateFilter />} />
          <div className="center-col__panel-body">
            <DataProductsDonut />
          </div>
        </section>
      </div>
    </div>
  )
}
