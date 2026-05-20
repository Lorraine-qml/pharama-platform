/** 流程进度条通用类型（科创策源 / 入孵签约等复用） */

export type FlowVisual = 'finish' | 'process' | 'wait' | 'locked' | 'warn'

export type FlowStep<TKey extends string = string> = {
  key: TKey
  label: string
  caption: string
  visual: FlowVisual
  /** 已完成节点展示的短日期 MM-DD */
  dateShort?: string
}

export function connectorToNext(st: FlowStep): 'done' | 'gradient' | 'idle' {
  if (st.visual === 'finish') return 'done'
  if (st.visual === 'process' || st.visual === 'warn') return 'gradient'
  return 'idle'
}

export function defaultSelectedStepKey<TKey extends string>(steps: FlowStep<TKey>[]): TKey {
  const proc = steps.find((x) => x.visual === 'process' || x.visual === 'warn')
  if (proc) return proc.key
  const wait = steps.find((x) => x.visual === 'wait')
  if (wait) return wait.key
  const finish = [...steps].reverse().find((x) => x.visual === 'finish')
  if (finish) return finish.key
  return steps[0]!.key
}
