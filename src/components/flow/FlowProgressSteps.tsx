import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { connectorToNext, type FlowStep } from './flowProgressTypes'

function stepVerb(st: FlowStep): string {
  return `${st.label}${st.caption}`
}

function statusHint(st: FlowStep): string {
  switch (st.visual) {
    case 'finish':
      return '已完成，点击查看详情'
    case 'process':
      return '进行中，点击查看详情'
    case 'warn':
      return '警示节点，点击查看详情'
    case 'wait':
      return '待处理，点击查看详情'
    case 'locked':
    default:
      return '未到达（演示可预览）'
  }
}

function connectorBg(tone: ReturnType<typeof connectorToNext>): string {
  if (tone === 'done') return 'bg-primary'
  if (tone === 'gradient') return 'bg-gradient-to-r from-primary from-[52%] to-[#E5E9F0] to-[52%]'
  return 'bg-[#E5E9F0]'
}

type Props<TKey extends string> = {
  steps: FlowStep<TKey>[]
  selectedKey: TKey
  onSelectKey: (k: TKey) => void
  /** 弹窗/档案页：任意节点可点 */
  freeNavigate?: boolean
  children?: ReactNode
}

export function FlowProgressSteps<TKey extends string>({
  steps,
  selectedKey,
  onSelectKey,
  freeNavigate = true,
  children,
}: Props<TKey>) {
  const sel = steps.find((s) => s.key === selectedKey) ?? steps[0]

  function onTapStep(st: FlowStep<TKey>) {
    if (!freeNavigate && st.visual === 'locked') return
    onSelectKey(st.key)
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-1 animate-[sj-progress-in_0.55s_ease-out_both]">
        <div className="flex min-w-[min(728px,100%)] gap-0 sm:min-w-[640px]" role="list">
          {steps.map((st, i) => {
            const tone = connectorToNext(st)
            const canAct = freeNavigate || st.visual !== 'locked'
            const nodeStyle = { animationDelay: `${i * 52}ms` } as CSSProperties
            const ringBase = cn(
              'relative z-[1] flex size-10 items-center justify-center rounded-full shadow-sm motion-safe:transition-[transform,box-shadow,background,border-color] motion-safe:duration-300 motion-safe:ease-out',
              st.visual === 'finish' &&
                'bg-primary text-white shadow-[0_4px_13px_-2px_rgb(30_109_255/0.48)] [&_svg]:drop-shadow-[0_1px_1px_rgb(30_109_255/0.55)]',
              st.visual === 'process' && 'bg-primary text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] ring-4 ring-[rgb(236_243_255/1)]',
              st.visual === 'warn' && 'bg-amber-500 text-white ring-4 ring-amber-200',
              st.visual === 'wait' && 'border-[1.5px] border-solid border-[#C0C4CC] bg-surface',
              st.visual === 'locked' && 'border-2 border-[#E5E9F0] bg-[#fafbfc]',
              selectedKey === st.key && canAct && 'ring-[5px] ring-primary/38 motion-safe:shadow-[0_0_0_1px_rgb(236_243_255/1)]',
            )

            const lbl = cn(
              'mt-2 text-[13px] font-semibold tracking-tight motion-safe:transition-colors motion-safe:duration-150',
              (st.visual === 'process' || st.visual === 'warn') && 'font-bold text-primary',
              st.visual === 'warn' && 'text-amber-700',
              st.visual === 'finish' && 'text-[#1F2A3E]',
              st.visual === 'wait' && 'text-[#6B7280]',
              st.visual === 'locked' && 'text-[#C0C4CC]',
              selectedKey === st.key && canAct && 'underline decoration-primary/55 decoration-2 underline-offset-[3px]',
            )

            const captionCls = cn(
              'mt-0.5 text-center text-[11px]',
              st.visual === 'finish' && st.dateShort && 'font-medium text-[#6B7280]',
              !(st.visual === 'finish' && st.dateShort) && 'text-muted',
            )

            return (
              <div key={st.key} role="listitem" className="flex flex-1 items-start gap-1">
                <div className="group relative flex flex-1 flex-col items-center px-1" title={`${stepVerb(st)} – ${statusHint(st)}`}>
                  <button
                    type="button"
                    style={nodeStyle}
                    aria-current={selectedKey === st.key ? 'step' : undefined}
                    aria-label={stepVerb(st)}
                    onClick={() => onTapStep(st)}
                    className={cn(
                      'flex w-full max-w-[108px] flex-col items-center rounded-xl px-1 pb-4 pt-0.5 text-left motion-safe:animate-[sj-progress-in_0.52s_ease-out_both] motion-safe:transition-colors motion-safe:duration-200',
                      canAct
                        ? 'motion-safe:hover:bg-primary-light/45 motion-safe:cursor-pointer motion-safe:focus-visible:outline-none motion-safe:focus-visible:ring-2 motion-safe:focus-visible:ring-primary/55 motion-safe:focus-visible:ring-offset-2 motion-safe:focus-visible:ring-offset-surface'
                        : 'motion-safe:cursor-not-allowed motion-safe:opacity-[0.76]',
                    )}
                  >
                    <span className="relative flex justify-center pt-2">
                      {(st.visual === 'process' || st.visual === 'warn') ? (
                        <span
                          aria-hidden
                          className={cn(
                            'pointer-events-none absolute left-1/2 top-[7px] z-0 size-[34px] -translate-x-1/2 rounded-full motion-safe:animate-[sj-pulse-soft_2.8s_ease-in-out_infinite]',
                            st.visual === 'warn' ? 'bg-amber-400/50' : 'bg-primary/40',
                          )}
                        />
                      ) : null}
                      <span className={ringBase}>
                        {st.visual === 'finish' ? (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2.65" strokeLinecap="round">
                            <path d="M20 7L10 17l-5-5" />
                          </svg>
                        ) : st.visual === 'process' || st.visual === 'warn' ? (
                          <span aria-hidden className="relative z-[2] size-2 rounded-full bg-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.5)]" />
                        ) : st.visual === 'wait' ? (
                          <span aria-hidden className="size-[9px] rounded-full border-[2px] border-[#C0C4CC] bg-transparent" />
                        ) : (
                          <span aria-hidden className="size-[9px] rounded-full border-[2px] border-[#E5E9F0] bg-transparent opacity-95" />
                        )}
                      </span>
                    </span>
                    <span className={lbl}>{st.label}</span>
                    <span className={captionCls}>
                      {st.visual === 'process'
                        ? '进行中'
                        : st.visual === 'warn'
                          ? '警示'
                          : st.visual === 'finish' && st.dateShort
                            ? st.dateShort
                            : st.visual === 'wait'
                              ? '待处理'
                              : st.visual === 'locked'
                                ? '待开始'
                                : st.caption}
                    </span>
                  </button>
                </div>
                {i < steps.length - 1 ? (
                  <div
                    className={cn(
                      'relative top-[calc(0.625rem+20px)] h-[4px] min-h-[4px] min-w-[12px] flex-[1_1_12px] self-start rounded-full motion-safe:transition-[background] motion-safe:duration-300',
                      connectorBg(tone),
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      {children && sel ? (
        <div
          key={String(selectedKey)}
          className="rounded-xl border border-divider bg-page/85 px-4 py-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] motion-safe:animate-[sj-panel-fade_0.38s_ease-out_both]"
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
