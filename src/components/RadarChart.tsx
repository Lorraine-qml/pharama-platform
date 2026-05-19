import { useMemo } from 'react'
import { cn } from '../utils/cn'

type Axis = { key: string; value: number; max?: number }

type Props = {
  axes: Axis[]
  size?: number
  className?: string
  onAxisClick?: (key: string) => void
}

export function RadarChart({ axes, size = 220, className, onAxisClick }: Props) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.36
  const n = Math.max(axes.length, 1)

  const verts = useMemo(() => {
    return axes.map((a, i) => {
      const angle = (-90 + (360 / n) * i) * (Math.PI / 180)
      const ratio = Math.min(1, a.value / (a.max ?? 100))
      const r = maxR * ratio
      return {
        key: a.key,
        angle,
        gx: cx + maxR * Math.cos(angle),
        gy: cy + maxR * Math.sin(angle),
        vx: cx + r * Math.cos(angle),
        vy: cy + r * Math.sin(angle),
        lx: cx + (maxR + 24) * Math.cos(angle),
        ly: cy + (maxR + 24) * Math.sin(angle),
        value: a.value,
      }
    })
  }, [axes, cx, cy, maxR, n])

  const poly = verts.map((v) => `${v.vx.toFixed(1)},${v.vy.toFixed(1)}`).join(' ')

  return (
    <div className={cn('relative inline-block', className)}>
      <svg width={size} height={size} role="img" aria-label="雷达图">
        {axes.map((_, i) => (
          <line
            key={`g-${axes[i]!.key}`}
            x1={cx}
            y1={cy}
            x2={verts[i]!.gx}
            y2={verts[i]!.gy}
            stroke="var(--color-divider)"
            strokeDasharray="3 5"
          />
        ))}
        <polygon
          fill="rgb(30 109 255 / 0.12)"
          stroke="var(--color-primary)"
          strokeWidth={1.5}
          points={poly}
        />
        {verts.map((v, i) => (
          <g key={v.key}>
            <circle
              cx={v.vx}
              cy={v.vy}
              r={6}
              fill="white"
              stroke="var(--color-primary)"
              strokeWidth={1.5}
              className={onAxisClick ? 'cursor-pointer' : ''}
              onClick={() => onAxisClick?.(axes[i]!.key)}
              onKeyDown={(e) => {
                if (onAxisClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onAxisClick(axes[i]!.key)
                }
              }}
              tabIndex={onAxisClick ? 0 : -1}
              role={onAxisClick ? 'button' : undefined}
              aria-label={`${axes[i]!.key} ${v.value} 分，点击查看依据`}
            />
            <text
              x={v.lx}
              y={v.ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--color-muted)"
              fontSize={10}
            >
              {v.key}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-2 text-center text-[12px] text-muted">点击顶点查看评分依据</p>
    </div>
  )
}
