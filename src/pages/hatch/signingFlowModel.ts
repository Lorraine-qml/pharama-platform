import { defaultSelectedStepKey, type FlowStep, type FlowVisual } from '../../components/flow/flowProgressTypes'
import type { HatchSignStatus, SigningContract, SigningFlowEvent, SigningFlowStepKey } from './hatchTypes'

export type { SigningFlowEvent, SigningFlowStepKey } from './hatchTypes'

const STEP_META: { key: SigningFlowStepKey; label: string; caption: string }[] = [
  { key: 'pending_sign', label: '待签署', caption: '' },
  { key: 'signing', label: '签署中', caption: '' },
  { key: 'active', label: '已生效', caption: '' },
  { key: 'expiring', label: '即将到期', caption: '' },
  { key: 'terminated', label: '已终止', caption: '' },
]

function parseMmDd(iso?: string): string | undefined {
  if (!iso) return undefined
  const m = /(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${m[2]}-${m[3]}` : undefined
}

function currentStepIndex(status: HatchSignStatus): number {
  switch (status) {
    case '待签署':
      return 0
    case '续约中':
      return 2
    case '已生效':
      return 2
    case '即将到期':
      return 3
    case '已到期':
      return 4
    case '已终止':
      return 4
    default:
      return 0
  }
}

function visualForStep(idx: number, currentIdx: number, key: SigningFlowStepKey, status: HatchSignStatus): FlowVisual {
  if (idx < currentIdx) return 'finish'
  if (idx > currentIdx) return 'locked'
  if (key === 'expiring' && status === '即将到期') return 'warn'
  if (key === 'terminated' && (status === '已终止' || status === '已到期')) return status === '已终止' ? 'finish' : 'process'
  return 'process'
}

export function deriveSigningFlowSteps(contract: SigningContract): FlowStep<SigningFlowStepKey>[] {
  const cur = currentStepIndex(contract.signStatus)
  const events = buildSigningFlowEvents(contract)

  return STEP_META.map((meta, idx) => {
    const visual = visualForStep(idx, cur, meta.key, contract.signStatus)
    const evt = events.find((e) => e.stepKey === meta.key && e.completedAt)
    return {
      key: meta.key,
      label: meta.label,
      caption: meta.caption,
      visual,
      dateShort: visual === 'finish' ? parseMmDd(evt?.completedAt) : undefined,
    }
  })
}

export function defaultSigningSelectedKey(steps: FlowStep<SigningFlowStepKey>[]): SigningFlowStepKey {
  return defaultSelectedStepKey(steps)
}

/** 演示：按合同状态合成流转记录（可对接 API） */
export function buildSigningFlowEvents(contract: SigningContract): SigningFlowEvent[] {
  if (contract.flowEvents?.length) return contract.flowEvents

  const end = contract.termEnd ?? contract.contractEnd
  const start = contract.termStart ?? '2025-05-10'

  const base: SigningFlowEvent[] = [
    {
      id: 'sf-1',
      stepKey: 'pending_sign',
      nodeLabel: '待签署',
      status: '已完成',
      completedAt: `${start} 09:00`,
      operator: '系统',
      opinion: '入孵协议已生成，待项目方与园区运营签署。',
    },
  ]

  if (contract.signStatus === '待签署') {
    return base
  }

  base.push({
    id: 'sf-2',
    stepKey: 'signing',
    nodeLabel: '签署中',
    status: '已完成',
    completedAt: `${start} 14:00`,
    operator: '运营-李四',
    opinion: '线下盖章与双方法务复核中。',
  })

  if (['已生效', '即将到期', '已到期', '续约中'].includes(contract.signStatus)) {
    base.push({
      id: 'sf-3',
      stepKey: 'active',
      nodeLabel: '已生效',
      status: '已完成',
      completedAt: contract.signStatus === '即将到期' ? '2024-06-02 11:00' : '2025-05-11 14:30',
      operator: '运营-张三',
      opinion: contract.scanFileName
        ? `协议签署完成，扫描件「${contract.scanFileName}」已归档。`
        : '协议签署完成，扫描件已归档。',
    })
  }

  if (contract.signStatus === '即将到期') {
    base.push({
      id: 'sf-4',
      stepKey: 'expiring',
      nodeLabel: '即将到期',
      status: '警示',
      completedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      operator: '系统',
      opinion: end ? `合同将于 ${end} 到期，请提前 30 天发起续约。` : '合同即将到期，请尽快续约。',
    })
  }

  if (contract.signStatus === '已到期') {
    base.push({
      id: 'sf-5a',
      stepKey: 'expiring',
      nodeLabel: '即将到期',
      status: '已完成',
      completedAt: end ? `${end} 00:00` : '2025-05-01 00:00',
      operator: '系统',
      opinion: '已进入到期提醒窗口。',
    })
    base.push({
      id: 'sf-5b',
      stepKey: 'terminated',
      nodeLabel: '已到期',
      status: '终止',
      completedAt: end ? `${end} 23:59` : '2025-06-01 23:59',
      operator: '系统',
      opinion: '合同到期未续约，状态变更为已到期。',
    })
  }

  if (contract.signStatus === '已终止') {
    base.push({
      id: 'sf-6',
      stepKey: 'terminated',
      nodeLabel: '已终止',
      status: '终止',
      completedAt: '2024-12-20 16:00',
      operator: '运营-王五',
      opinion: '双方协商提前终止，已完成空间释放与结算。',
    })
  }

  if (contract.signStatus === '续约中') {
    base.push({
      id: 'sf-7',
      stepKey: 'expiring',
      nodeLabel: '续约中',
      status: '进行中',
      completedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      operator: '运营-张三',
      opinion: '续约流程已发起，待确认新租期与租金条款。',
    })
  }

  return base
}

export function eventForStep(events: SigningFlowEvent[], key: SigningFlowStepKey): SigningFlowEvent | undefined {
  return events.find((e) => e.stepKey === key)
}

export function daysUntilEnd(end: string | null | undefined): number | null {
  if (!end) return null
  const d = new Date(end)
  if (Number.isNaN(d.getTime())) return null
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}
