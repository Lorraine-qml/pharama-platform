import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { DemandHistoryItem, MatchHit, MatchRecordRow, ParsedDemand } from './resopsAiMatchTypes'
import { INITIAL_DEMAND_HISTORY, INITIAL_MATCH_RECORDS } from './resopsAiMatchSeed'

type Ctx = {
  demandHistory: DemandHistoryItem[]
  matchRecords: MatchRecordRow[]
  pushDemandSession: (parsed: ParsedDemand, hits: MatchHit[]) => void
  markMatchApplied: (matchId: string, applicationId: string) => void
}

const C = createContext<Ctx | null>(null)

export function ResopsAiMatchProvider({ children }: { children: ReactNode }) {
  const [demandHistory, setDemandHistory] = useState<DemandHistoryItem[]>(INITIAL_DEMAND_HISTORY)
  const [matchRecords, setMatchRecords] = useState<MatchRecordRow[]>(INITIAL_MATCH_RECORDS)

  const pushDemandSession = useCallback((parsed: ParsedDemand, hits: MatchHit[]) => {
    const item: DemandHistoryItem = {
      id: parsed.demand_id,
      raw: parsed.raw_text,
      types: parsed.resource_types,
      at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }
    setDemandHistory((h) => [item, ...h].slice(0, 30))

    const now = item.at
    const rows: MatchRecordRow[] = hits.map((h) => ({
      match_id: h.match_id,
      demand_id: parsed.demand_id,
      resource_id: h.resource_id,
      resource_name: h.resource_name,
      demand_summary: parsed.specific_resource !== '—' ? parsed.specific_resource : parsed.tech_conditions,
      score: h.score,
      category: h.category_label,
      created_at: now,
      is_applied: false,
      is_used: false,
    }))
    setMatchRecords((r) => [...rows, ...r].slice(0, 400))
  }, [])

  const markMatchApplied = useCallback((matchId: string, applicationId: string) => {
    setMatchRecords((prev) =>
      prev.map((x) => (x.match_id === matchId ? { ...x, is_applied: true, applied_application_id: applicationId } : x)),
    )
  }, [])

  const value = useMemo(
    (): Ctx => ({
      demandHistory,
      matchRecords,
      pushDemandSession,
      markMatchApplied,
    }),
    [demandHistory, matchRecords, pushDemandSession, markMatchApplied],
  )

  return <C.Provider value={value}>{children}</C.Provider>
}

export function useResopsAiMatch() {
  const v = useContext(C)
  if (!v) throw new Error('useResopsAiMatch must be used within ResopsAiMatchProvider')
  return v
}
