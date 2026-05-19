import { useState } from 'react'
import { Modal } from '../components/Modal'

type LayerId = '企业' | '资源' | '预警' | '虚拟层'

const layers: LayerId[] = ['企业', '资源', '预警', '虚拟层']

export default function DigitalTwinPage() {
  const [active, setActive] = useState<LayerId>('企业')
  const [inspectOpen, setInspectOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 rounded-[var(--radius-card)] border border-divider bg-surface p-4 shadow-card">
        <span className="flex items-center pr-4 text-[12px] text-muted">图层</span>
        {layers.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setActive(l)}
            className={
              active === l
                ? 'rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[13px] font-semibold text-white'
                : 'rounded-[var(--radius-button)] border border-divider bg-page px-4 py-2 text-[13px] text-foreground hover:border-primary'
            }
          >
            {l === '企业'
              ? '🏢 '
              : l === '资源'
                ? '🔬 '
                : l === '预警'
                  ? '⚠️ '
                  : '🌐 '}
            {l}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,minmax(220px,280px)]">
        <section
          className="relative min-h-[360px] rounded-[var(--radius-panel)] border border-divider bg-gradient-to-br from-[#dfe8ff] via-page to-surface p-8 shadow-inner"
          role="img"
          aria-label="园区鸟瞰示意"
        >
          <div className="absolute left-12 top-10 flex rotate-[-2deg] flex-col gap-2">
            <div className="text-[12px] font-semibold text-foreground">楼 A</div>
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <span key={`a-${i}`} className="size-6 rounded-[3px] bg-primary/90 shadow-sm" aria-hidden />
              ))}
            </div>
          </div>

          <div className="absolute left-56 top-6 flex rotate-[-1deg] flex-col gap-2">
            <div className="text-[12px] font-semibold text-foreground">楼 B</div>
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <span key={`br-${i}`} className={i === 2 ? 'size-8 rounded bg-primary shadow' : 'size-8 rounded border border-divider bg-surface'} aria-hidden />
              ))}
            </div>
          </div>

          <div className="absolute bottom-24 left-[40%] flex flex-col gap-2">
            <div className="text-[12px] font-semibold text-foreground">楼 C</div>
            <div className="flex gap-2">
              <span className="size-14 rounded-xl bg-muted/80" aria-hidden />
            </div>
          </div>

          {active === '资源' ? (
            <button
              type="button"
              className="absolute left-[52%] top-[42%] flex size-9 items-center justify-center rounded-full bg-warning text-[16px] text-white shadow-lg ring-2 ring-warning/70"
              onClick={() => setInspectOpen(true)}
              aria-label="查看异常设备"
            >
              !
            </button>
          ) : null}

          {active === '虚拟层' ? (
            <>
              <div className="absolute right-28 top-[30%] rounded-full border border-dashed border-primary bg-primary-light/60 px-3 py-1 text-[11px] text-primary">
                AI知识库
              </div>
              <div className="absolute bottom-36 right-[20%] rounded-full border border-dashed border-muted px-3 py-1 text-[11px] text-muted">
                外部合作机构
              </div>
              <svg className="pointer-events-none absolute inset-16 text-primary/35" aria-hidden>
                <line x1="70%" y1="25%" x2="40%" y2="55%" stroke="currentColor" strokeDasharray="4 6" strokeWidth={1.2} />
                <line x1="76%" y1="70%" x2="45%" y2="62%" stroke="currentColor" strokeDasharray="4 6" strokeWidth={1.2} />
              </svg>
            </>
          ) : null}

          <p className="absolute bottom-4 left-4 text-[12px] text-muted">
            （鼠标拖拽 / 缩放为孪生占位，V3接入引擎）
          </p>
          <aside className="absolute right-4 top-24 w-52 rounded-[var(--radius-card)] border border-divider/80 bg-surface/95 p-3 text-[12px] text-muted shadow-card">
            <p className="font-semibold text-foreground">图例</p>
            <div className="mt-3 space-y-2">
              <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" /> ● 重点实验室</span>
              <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-muted" /> 空闲实验区</span>
              <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-warning" /> 异常设备告警</span>
            </div>
          </aside>
        </section>

        <aside className="space-y-3 rounded-[var(--radius-card)] border border-divider bg-surface p-4 shadow-card">
          <h2 className="text-[13px] font-semibold text-foreground">右侧导航占位</h2>
          <p className="text-[12px] text-muted">
            PRD：<strong className="text-foreground">楼B → 楼层列表 → 3F平面图</strong> 递进。
          </p>
          <ol className="list-decimal space-y-2 py-4 pl-4 text-[12px] text-muted">
            <li>楼宇 B · 生命科学塔</li>
            <li>3F · 共享实验室组团</li>
            <li>
              <button type="button" className="text-primary underline">
                打开平面图
              </button>
            </li>
          </ol>
        </aside>
      </div>

      <Modal
        open={inspectOpen}
        title="设备故障 · BD流式 (#B101-02)"
        onClose={() => setInspectOpen(false)}
        footer={
          <button
            type="button"
            className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[13px] text-white"
            onClick={() => setInspectOpen(false)}
          >
            创建运维工单
          </button>
        }
      >
        <p className="text-[14px] leading-relaxed text-muted">
          激光器温度漂移导致补偿矩阵异常。<strong className="text-foreground">处理建议：</strong>切换冗余通道并预热 25
          分钟；已通知维保工程师 ETA 42 min。
        </p>
      </Modal>
    </div>
  )
}
