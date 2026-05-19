import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import {
  DEFAULT_MATCH_WEIGHTS,
  INITIAL_BLOCKLIST,
  INITIAL_DICT_GROUPS,
  INITIAL_EVAL_FORMS,
  INITIAL_EXPERTS,
  INITIAL_FORMULAS,
  INITIAL_PARTNERS,
  INITIAL_SOURCES,
} from './basicDataMock'
import type {
  BlocklistRecord,
  DictGroupRecord,
  EvaluationDimension,
  EvaluationForm,
  ExpertMatchWeights,
  ExpertRecord,
  PartnerOrg,
  ScoringFormula,
  SourceTypeRecord,
} from './basicDataTypes'

type Ctx = {
  evalForms: EvaluationForm[]
  setEvalForms: React.Dispatch<React.SetStateAction<EvaluationForm[]>>
  formulas: ScoringFormula[]
  setFormulas: React.Dispatch<React.SetStateAction<ScoringFormula[]>>
  experts: ExpertRecord[]
  setExperts: React.Dispatch<React.SetStateAction<ExpertRecord[]>>
  expertWeights: ExpertMatchWeights
  setExpertWeights: React.Dispatch<React.SetStateAction<ExpertMatchWeights>>
  partners: PartnerOrg[]
  setPartners: React.Dispatch<React.SetStateAction<PartnerOrg[]>>
  sources: SourceTypeRecord[]
  setSources: React.Dispatch<React.SetStateAction<SourceTypeRecord[]>>
  blocklist: BlocklistRecord[]
  setBlocklist: React.Dispatch<React.SetStateAction<BlocklistRecord[]>>
  dictGroups: DictGroupRecord[]
  setDictGroups: React.Dispatch<React.SetStateAction<DictGroupRecord[]>>

  saveEvalFormDims: (id: string, dimensions: EvaluationDimension[]) => boolean
  /** 保存评价表（可选生成新版本号）；含 dimensions 时校验权重和为 100% */
  patchEvaluationForm: (
    id: string,
    patch: Partial<Omit<EvaluationForm, 'id' | 'version' | 'updatedAt'>> & {
      dimensions?: EvaluationDimension[]
      bumpVersion?: boolean
    },
  ) => boolean
  duplicateEvaluationForm: (id: string) => void
  aiSuggestWeights: (formId: string) => void
  optimizeExpertWeights: () => void
}

const BasicDataCtx = createContext<Ctx | null>(null)

export function BasicDataDemoProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [evalForms, setEvalForms] = useState(() => structuredClone(INITIAL_EVAL_FORMS))
  const [formulas, setFormulas] = useState(() => structuredClone(INITIAL_FORMULAS))
  const [experts, setExperts] = useState(() => structuredClone(INITIAL_EXPERTS))
  const [expertWeights, setExpertWeights] = useState(() => ({ ...DEFAULT_MATCH_WEIGHTS }))
  const [partners, setPartners] = useState(() => structuredClone(INITIAL_PARTNERS))
  const [sources, setSources] = useState(() => structuredClone(INITIAL_SOURCES))
  const [blocklist, setBlocklist] = useState(() => structuredClone(INITIAL_BLOCKLIST))
  const [dictGroups, setDictGroups] = useState(() => structuredClone(INITIAL_DICT_GROUPS))

  const saveEvalFormDims = useCallback(
    (id: string, dimensions: EvaluationDimension[]) => {
      const sum = dimensions.reduce((a, d) => a + d.weightPct, 0)
      if (sum !== 100) {
        toast.show(`维度权重之和须为 100%，当前为 ${sum}%`, 'warning')
        return false
      }
      setEvalForms((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, dimensions: structuredClone(dimensions), updatedAt: new Date().toISOString().slice(0, 10) } : f,
        ),
      )
      toast.show('维度与权重已保存', 'success')
      return true
    },
    [toast],
  )

  const patchEvaluationForm = useCallback(
    (
      id: string,
      patch: Partial<Omit<EvaluationForm, 'id' | 'version' | 'updatedAt'>> & {
        dimensions?: EvaluationDimension[]
        bumpVersion?: boolean
      },
    ) => {
      const { bumpVersion = true, dimensions, ...meta } = patch
      if (dimensions !== undefined) {
        const sum = dimensions.reduce((a, d) => a + d.weightPct, 0)
        if (sum !== 100) {
          toast.show(`维度权重之和须为 100%，当前为 ${sum}%`, 'warning')
          return false
        }
      }
      setEvalForms((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f
          const nextDims = dimensions !== undefined ? structuredClone(dimensions) : f.dimensions
          const nextVersion = bumpVersion ? (() => {
            const m = /^v(\d+)$/i.exec(f.version.trim())
            return m ? `v${Number(m[1]) + 1}` : 'v2'
          })() : f.version
          return {
            ...f,
            ...meta,
            dimensions: nextDims,
            version: nextVersion,
            updatedAt: new Date().toISOString().slice(0, 10),
          }
        }),
      )
      toast.show('评价表已保存', 'success')
      return true
    },
    [toast],
  )

  const duplicateEvaluationForm = useCallback((id: string) => {
    setEvalForms((prev) => {
      const src = prev.find((x) => x.id === id)
      if (!src) return prev
      const nid = `ev-${Date.now().toString(36)}`
      const copy: EvaluationForm = {
        ...structuredClone(src),
        id: nid,
        name: `${src.name}（副本）`,
        version: 'v1',
        status: '草稿',
        updatedAt: new Date().toISOString().slice(0, 10),
      }
      return [...prev, copy]
    })
    toast.show('已复制为草稿评价表', 'success')
  }, [toast])

  /** 演示：按比例微调并重算为 100% */
  const aiSuggestWeights = useCallback(
    (formId: string) => {
      toast.show('✨ weight_suggester：根据生物医药孵化器 KPI 标杆，微调产业与技术权重（演示）', 'success')
      setEvalForms((prev) =>
        prev.map((f) => {
          if (f.id !== formId || f.dimensions.length === 0) return f
          const bump = [...f.dimensions]
          const first = bump[0]
          const second = bump[1]
          if (first) first.weightPct = Math.min(45, first.weightPct + 5)
          if (second) second.weightPct = Math.max(15, second.weightPct - 3)
          const rest = bump.slice(2).reduce((a, d) => a + d.weightPct, 0)
          const fs = (first?.weightPct ?? 0) + (second?.weightPct ?? 0) + rest
          let delta = 100 - fs
          let idx = bump.length - 1
          while (delta !== 0 && bump[idx]) {
            const nextVal = bump[idx].weightPct + Math.sign(delta)
            if (nextVal >= 5 && nextVal <= 45) {
              bump[idx].weightPct = nextVal
              delta -= Math.sign(delta)
            }
            idx--
            if (idx < 0) idx = bump.length - 1
          }
          return { ...f, dimensions: bump }
        }),
      )
    },
    [toast],
  )

  const optimizeExpertWeights = useCallback(() => {
    toast.show('✨ 已参照历史满意度优化匹配权重（演示）', 'info')
    setExpertWeights(() => ({
      techKeyword: 42,
      stageFit: 18,
      historySimilar: 22,
      regionFit: 8,
      loadBalance: 10,
    }))
  }, [toast])

  const value = useMemo(
    () => ({
      evalForms,
      setEvalForms,
      formulas,
      setFormulas,
      experts,
      setExperts,
      expertWeights,
      setExpertWeights,
      partners,
      setPartners,
      sources,
      setSources,
      blocklist,
      setBlocklist,
      dictGroups,
      setDictGroups,
      saveEvalFormDims,
      patchEvaluationForm,
      duplicateEvaluationForm,
      aiSuggestWeights,
      optimizeExpertWeights,
    }),
    [
      evalForms,
      formulas,
      experts,
      expertWeights,
      partners,
      sources,
      blocklist,
      dictGroups,
      saveEvalFormDims,
      patchEvaluationForm,
      duplicateEvaluationForm,
      aiSuggestWeights,
      optimizeExpertWeights,
    ],
  )

  return <BasicDataCtx.Provider value={value}>{children}</BasicDataCtx.Provider>
}

export function useBasicDataDemo() {
  const x = useContext(BasicDataCtx)
  if (!x) throw new Error('useBasicDataDemo must be inside BasicDataDemoProvider')
  return x
}
