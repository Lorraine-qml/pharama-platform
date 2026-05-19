import type { ResApplication, ResResource, ResUsageOrder } from './resopsV1Types'
import { BOARD_COMPLAINT_COUNTS, EXTERNAL_QUALITY_PAD } from './resopsBoardSeed'

/** 与演示数据对齐的统计窗口 */
export const BOARD_WINDOW_START = '2025-04-18'
export const BOARD_MONTH_PREFIX = '2025-05'

export function isInternalProvider(providerName: string): boolean {
  return (
    providerName === '园区' ||
    providerName.includes('园区公共实验平台') ||
    providerName.includes('产业研究院') ||
    providerName.includes('园区 AI 中台')
  )
}

function applicationsInWindow(apps: ResApplication[]): ResApplication[] {
  return apps.filter((a) => a.createdAt >= BOARD_WINDOW_START)
}

function countDelaysInTimeline(o: ResUsageOrder): number {
  return o.timeline.filter((t) => t.text.includes('延期')).length
}

export type BoardKpi = {
  resourceTotal: number
  internalCount: number
  externalCount: number
  pendingReview: number
  anomalyCount: number
  maintenanceCount: number
  inUseOrders: number
  monthUsageCount: number
  usageRatePct: number
  usageMomDeltaPct: number
}

export function buildBoardKpis(resources: ResResource[], usageOrders: ResUsageOrder[]): BoardKpi {
  const internalCount = resources.filter((r) => isInternalProvider(r.providerName)).length
  const externalCount = Math.max(0, resources.length - internalCount)
  const pendingReview = resources.filter((r) => r.status === 'pending_review').length
  const anomalyCount = resources.filter((r) => r.status === 'anomaly').length
  const maintenanceCount = resources.filter((r) => r.status === 'maintenance').length
  const inUseOrders = usageOrders.filter((o) => o.status === 'in_progress').length
  const monthUsageCount = usageOrders.filter((o) => o.createdAt.startsWith(BOARD_MONTH_PREFIX)).length
  const listed = Math.max(1, resources.filter((r) => r.status === 'listed').length)
  const active = usageOrders.filter(
    (o) => o.createdAt.startsWith(BOARD_MONTH_PREFIX) && (o.status === 'completed' || o.status === 'in_progress'),
  ).length
  const usageRatePct = Math.min(95, Math.round((active / (listed * 4.2)) * 100))
  const usageMomDeltaPct = 5
  return {
    resourceTotal: resources.length,
    internalCount,
    externalCount,
    pendingReview,
    anomalyCount,
    maintenanceCount,
    inUseOrders,
    monthUsageCount,
    usageRatePct,
    usageMomDeltaPct,
  }
}

export type HotResourceRow = {
  resourceId: string
  name: string
  applications: number
  satisfaction: number
}

export function buildHotResources(resources: ResResource[], applications: ResApplication[]): HotResourceRow[] {
  const inWin = applicationsInWindow(applications)
  const map = new Map<string, number>()
  for (const a of inWin) {
    map.set(a.resourceId, (map.get(a.resourceId) ?? 0) + 1)
  }
  const rows: HotResourceRow[] = []
  for (const [resourceId, n] of map) {
    const r = resources.find((x) => x.id === resourceId)
    if (!r) continue
    rows.push({
      resourceId,
      name: r.name,
      applications: n,
      satisfaction: r.reviewCount > 0 ? r.rating : r.rating || 4.2,
    })
  }
  rows.sort((a, b) => b.applications - a.applications)
  return rows.slice(0, 5)
}

export type LowEfficiencyRow = {
  resourceId: string
  name: string
  idleDays: number
}

function idleDaysDemo(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 3)) % 997
  return 60 + (h % 45)
}

export function buildLowEfficiencyResources(
  resources: ResResource[],
  applications: ResApplication[],
): LowEfficiencyRow[] {
  const inWin = applicationsInWindow(applications)
  const map = new Map<string, number>()
  for (const a of inWin) {
    map.set(a.resourceId, (map.get(a.resourceId) ?? 0) + 1)
  }
  const listed = resources.filter((r) => r.status === 'listed')
  const rows: LowEfficiencyRow[] = []
  for (const r of listed) {
    const c = map.get(r.id) ?? 0
    if (c > 0) continue
    rows.push({ resourceId: r.id, name: r.name, idleDays: idleDaysDemo(r.id) })
  }
  rows.sort((a, b) => b.idleDays - a.idleDays)
  return rows.slice(0, 5)
}

export type ExternalQualityRow = {
  providerName: string
  satisfactionPct: number
  orders: number
}

export function buildExternalQuality(usageOrders: ResUsageOrder[]): ExternalQualityRow[] {
  const done = usageOrders.filter(
    (o) =>
      o.status === 'completed' &&
      typeof o.applicantReviewStars === 'number' &&
      !isInternalProvider(o.providerName),
  )
  const agg = new Map<string, { stars: number; n: number }>()
  for (const o of done) {
    const s = o.applicantReviewStars ?? 0
    const cur = agg.get(o.providerName) ?? { stars: 0, n: 0 }
    cur.stars += s
    cur.n += 1
    agg.set(o.providerName, cur)
  }
  const rows: ExternalQualityRow[] = []
  for (const [providerName, cur] of agg) {
    const { stars, n } = cur
    rows.push({
      providerName,
      satisfactionPct: Math.round((stars / (n * 5)) * 1000) / 10,
      orders: n,
    })
  }
  rows.sort((a, b) => b.satisfactionPct - a.satisfactionPct)
  return rows
}

const EXTERNAL_DISPLAY_TARGET = 6

/** 合并真实评价聚合与演示补行，保证排行区行数饱满 */
export function mergeExternalQualityForDisplay(rows: ExternalQualityRow[]): ExternalQualityRow[] {
  const seen = new Set(rows.map((r) => r.providerName))
  const merged: ExternalQualityRow[] = [...rows]
  for (const p of EXTERNAL_QUALITY_PAD) {
    if (merged.length >= EXTERNAL_DISPLAY_TARGET) break
    if (seen.has(p.providerName)) continue
    merged.push({ providerName: p.providerName, satisfactionPct: p.satisfactionPct, orders: p.orders })
    seen.add(p.providerName)
  }
  return merged.slice(0, EXTERNAL_DISPLAY_TARGET)
}

export type BoardAlertRow = {
  id: string
  resourceId: string
  resourceName: string
  summary: string
  at: string
  kind: 'anomaly' | 'maintenance' | 'complaint' | 'delay'
}

export function buildBoardAlerts(resources: ResResource[], usageOrders: ResUsageOrder[]): BoardAlertRow[] {
  const out: BoardAlertRow[] = []
  for (const r of resources) {
    if (r.status === 'anomaly') {
      out.push({
        id: `al-st-${r.id}`,
        resourceId: r.id,
        resourceName: r.name,
        summary: '资源状态为异常，需复核投诉与履约。',
        at: r.auditLog?.[r.auditLog.length - 1]?.at ?? BOARD_MONTH_PREFIX + '-17 11:00',
        kind: 'anomaly',
      })
    }
    if (r.status === 'maintenance') {
      out.push({
        id: `al-mt-${r.id}`,
        resourceId: r.id,
        resourceName: r.name,
        summary: '维护中：暂停对外预约，请关注 SLA。',
        at: r.auditLog?.[r.auditLog.length - 1]?.at ?? BOARD_MONTH_PREFIX + '-16 09:00',
        kind: 'maintenance',
      })
    }
  }
  for (const r of resources) {
    const c = BOARD_COMPLAINT_COUNTS[r.id]
    if (c && c >= 3) {
      out.push({
        id: `al-cp-${r.id}`,
        resourceId: r.id,
        resourceName: r.name,
        summary: `累计投诉 ${c} 次，建议优先回访与质检。`,
        at: BOARD_MONTH_PREFIX + '-18 10:00',
        kind: 'complaint',
      })
    }
  }
  for (const o of usageOrders) {
    const d = countDelaysInTimeline(o)
    if (d >= 2) {
      out.push({
        id: `al-dl-${o.id}`,
        resourceId: o.resourceId,
        resourceName: o.resourceName,
        summary: `交付延期记录 ${d} 次（使用单 ${o.code}）。`,
        at: o.createdAt,
        kind: 'delay',
      })
    }
  }
  out.sort((a, b) => (a.at < b.at ? 1 : -1))
  return out.slice(0, 8)
}
