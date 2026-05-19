import type { DemandHistoryItem, MatchRecordRow } from './resopsAiMatchTypes'

export const INITIAL_DEMAND_HISTORY: DemandHistoryItem[] = [
  {
    id: 'd-seed-1',
    raw: '我需要一个能做细胞分析的实验室和流式细胞仪，下周三上午，预算500元',
    types: ['space', 'device'],
    at: '2025-05-17 14:20',
  },
  {
    id: 'd-seed-2',
    raw: '想找 CRO 做毒理，预算 30 万以内',
    types: ['external'],
    at: '2025-05-16 09:10',
  },
]

export const INITIAL_MATCH_RECORDS: MatchRecordRow[] = [
  {
    match_id: 'm-seed-1',
    demand_id: 'd-seed-1',
    resource_id: 'res-flow',
    resource_name: '流式细胞仪',
    demand_summary: '细胞分析 + 流式',
    score: 96,
    category: '设备',
    created_at: '2025-05-17 14:22',
    is_applied: true,
    applied_application_id: 'a1',
    is_used: false,
  },
  {
    match_id: 'm-seed-2',
    demand_id: 'd-seed-1',
    resource_id: 'res-lab-a',
    resource_name: '共享实验室 A',
    demand_summary: '细胞分析 + 流式',
    score: 85,
    category: '空间',
    created_at: '2025-05-17 14:22',
    is_applied: true,
    is_used: true,
    applied_order_id: 'u-lab',
    satisfaction: 5,
  },
  {
    match_id: 'm-seed-3',
    demand_id: 'd-seed-2',
    resource_id: 'res-cro-beta',
    resource_name: '毒理毒代一体化服务',
    demand_summary: '毒理 CRO',
    score: 82,
    category: '外部合作',
    created_at: '2025-05-16 09:12',
    is_applied: false,
    is_used: false,
  },
]
