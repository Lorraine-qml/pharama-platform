import type { ModuleFeatureDef } from '../data/moduleFeatures/types'
import { cn } from '../utils/cn'

function AiBadge({ text }: { text: string }) {
  const trimmed = text.trim()
  if (!trimmed || trimmed === '无') {
    return <span className="text-[12px] text-muted">无</span>
  }
  const isSkill = trimmed.includes('Skill') || trimmed.includes('✅') || trimmed.startsWith('document_') || trimmed.startsWith('project_')
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold leading-snug',
        isSkill || trimmed.startsWith('✅')
          ? 'bg-primary/12 text-primary ring-1 ring-primary/25'
          : 'bg-warning/12 text-warning ring-1 ring-warning/20',
      )}
    >
      {trimmed.replace(/^✅\s*/, '').replace(/^✨\s*/, '✨ ')}
    </span>
  )
}

export function FeatureModulePage({ moduleLabel, pageTitle, pageCode, phase, intro, features }: ModuleFeatureDef) {
  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-[var(--radius-panel)] border border-primary/15 bg-gradient-to-r from-primary-light/40 via-surface to-surface px-5 py-4 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/[0.06] blur-2xl"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {moduleLabel}
              <span className="mx-1.5 text-divider">·</span>
              <span className="tabular-nums text-foreground">{pageCode}</span>
              {phase ? (
                <span className="ms-2 rounded bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning ring-1 ring-warning/25">
                  {phase}
                </span>
              ) : null}
            </p>
            <h1 className="mt-2 text-[22px] font-bold tracking-tight text-foreground">{pageTitle}</h1>
            {intro ? <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted">{intro}</p> : null}
          </div>
          <p className="text-[11px] font-medium text-muted">以下三级能力在页面内分区展示，非子页面</p>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        {features.map((f) => (
          <article
            key={f.name}
            className="relative flex flex-col overflow-hidden rounded-[var(--radius-panel)] border border-divider/80 bg-surface shadow-[0_6px_24px_-10px_rgba(31,42,62,0.12)] before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-full before:bg-primary"
          >
            <div className="border-b border-divider/60 bg-gradient-to-r from-primary-light/25 to-transparent px-5 py-3 ps-[18px]">
              <h2 className="text-[15px] font-bold text-foreground">{f.name}</h2>
            </div>
            <dl className="flex flex-1 flex-col gap-3 px-5 py-4 ps-[18px] text-[13px]">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">功能说明</dt>
                <dd className="mt-1 leading-relaxed text-foreground">{f.desc}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">交互流程</dt>
                <dd className="mt-1 leading-relaxed text-muted">{f.flow}</dd>
              </div>
              <div className="mt-auto border-t border-divider/50 pt-3">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">AI 辅助调用</dt>
                <dd className="mt-2">
                  <AiBadge text={f.ai ?? '无'} />
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
    </div>
  )
}
