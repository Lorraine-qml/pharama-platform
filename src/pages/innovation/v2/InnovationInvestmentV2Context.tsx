import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useToast } from '../../../components/ToastProvider'
import {
  INITIAL_AI_SUGGESTIONS,
  INITIAL_DATA_SOURCES,
  INITIAL_DIRECTIONS,
  INITIAL_HARVEST,
  INITIAL_HIGH_POTENTIAL,
  INITIAL_LEADS,
  INITIAL_TECH_TAGS,
} from './innovationInvestmentMock'
import type {
  AiHarvestRow,
  ChainRecommendRow,
  HarvestDataSourceId,
  HighPotentialRow,
  IndustryDirection,
  InvestmentLead,
  InvestmentLeadGrade,
  InvestmentLeadStatus,
  TechTag,
} from './innovationInvestmentTypes'

function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

const CHAIN_DEMO: ChainRecommendRow[] = [
  {
    id: 'ch1',
    direction: '上游',
    company: '苏州 XX 培养基',
    reason: '供应该类细胞治疗项目常用无血清培养体系，园区已有多家客户（演示）',
  },
  {
    id: 'ch2',
    direction: '上游',
    company: '杭州 XX 仪器',
    reason: '流式与单细胞分选设备租赁 + 驻场工程师，降低项目 CAPEX（演示）',
  },
  {
    id: 'ch3',
    direction: '下游',
    company: '北京 YY 药企',
    reason: '潜在临床合作方，关注基因编辑体内递送的安全性与 CMC 节奏（演示）',
  },
]

type Ctx = {
  directions: IndustryDirection[]
  techTags: TechTag[]
  aiSuggestions: typeof INITIAL_AI_SUGGESTIONS
  dataSources: typeof INITIAL_DATA_SOURCES
  harvested: AiHarvestRow[]
  highPotential: HighPotentialRow[]
  leads: InvestmentLead[]
  chainByProjectId: Record<string, ChainRecommendRow[]>
  trackTrend: { label: string; values: number[] }[]

  addDirection: (name: string, subTracks: string[]) => void
  updateDirection: (id: string, name: string, subTracks: string[]) => void
  removeDirection: (id: string) => void
  addTechTag: (name: string) => void
  removeTechTag: (id: string) => void
  refreshIndustryAnalyzer: () => void
  adoptSuggestion: (id: string) => void

  toggleDataSource: (id: HarvestDataSourceId) => void
  runLeadMatcherSkill: () => void
  convertHarvestToLead: (row: AiHarvestRow) => void

  runChainAnalyzer: (projectId: string) => void
  getChainRows: (projectId: string) => ChainRecommendRow[]
  convertChainToLead: (projectId: string, row: ChainRecommendRow) => void

  runHighPotentialFinder: () => void
  convertPotentialToLead: (row: HighPotentialRow) => void

  addLead: (draft: Omit<InvestmentLead, 'id' | 'followUps'> & Partial<Pick<InvestmentLead, 'id' | 'followUps'>>) => string
  updateLead: (id: string, patch: Partial<InvestmentLead>) => void
  applySuggestedGrading: () => void

  addFollowUp: (leadId: string, payload: Omit<InvestmentLead['followUps'][number], 'id'>) => void
  triggerTouchCopyGen: (leadId: string) => void
  triggerConversionAnalyzer: (leadId: string) => void
}

const InnovationInvestmentV2Ctx = createContext<Ctx | null>(null)

export function InnovationInvestmentV2Provider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [directions, setDirections] = useState<IndustryDirection[]>(() => [...INITIAL_DIRECTIONS])
  const [techTags, setTechTags] = useState<TechTag[]>(() => [...INITIAL_TECH_TAGS])
  const [aiSuggestions, setAiSuggestions] = useState(() => [...INITIAL_AI_SUGGESTIONS])
  const [dataSources, setDataSources] = useState(() => [...INITIAL_DATA_SOURCES])
  const [harvested, setHarvested] = useState<AiHarvestRow[]>(() => [...INITIAL_HARVEST])
  const [highPotential, setHighPotential] = useState<HighPotentialRow[]>(() => [...INITIAL_HIGH_POTENTIAL])
  const [leads, setLeads] = useState<InvestmentLead[]>(() =>
    INITIAL_LEADS.map((x) => ({ ...x, followUps: [...x.followUps] })),
  )
  const [chainByProjectId, setChainByProjectId] = useState<Record<string, ChainRecommendRow[]>>({})
  const [trackTrend] = useState<{ label: string; values: number[] }[]>([
    { label: '创新药', values: [12, 15, 18, 21, 25, 28, 34] },
    { label: '医疗器械', values: [8, 11, 9, 14, 16, 19, 22] },
    { label: '合成生物', values: [5, 7, 11, 10, 15, 20, 24] },
  ])

  const addDirection = useCallback(
    (name: string, subTracks: string[]) => {
      const trimmed = name.trim()
      if (!trimmed) {
        toast.show('请填写方向名称', 'warning')
        return
      }
      setDirections((prev) => [...prev, { id: rid('dir'), name: trimmed, subTracks }])
      toast.show('产业方向已添加（演示）', 'success')
    },
    [toast],
  )

  const updateDirection = useCallback(
    (id: string, name: string, subTracks: string[]) => {
      setDirections((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name: name.trim() || d.name, subTracks } : d)),
      )
      toast.show('方向已保存', 'success')
    },
    [toast],
  )

  const removeDirection = useCallback(
    (id: string) => {
      setDirections((prev) => prev.filter((d) => d.id !== id))
      toast.show('已删除方向', 'info')
    },
    [toast],
  )

  const addTechTag = useCallback(
    (name: string) => {
      const t = name.trim()
      if (!t) {
        toast.show('请输入标签名称', 'warning')
        return
      }
      setTechTags((prev) => [...prev, { id: rid('tag'), name: t }])
      toast.show('标签已添加', 'success')
    },
    [toast],
  )

  const removeTechTag = useCallback(
    (id: string) => {
      setTechTags((prev) => prev.filter((x) => x.id !== id))
      toast.show('标签已移除', 'info')
    },
    [toast],
  )

  const refreshIndustryAnalyzer = useCallback(() => {
    toast.show('✨ industry_analyzer：已拉取研报 / 融资聚合信号（演示）', 'info')
    setAiSuggestions([
      ...INITIAL_AI_SUGGESTIONS.map((s) => ({ ...s, id: rid('as') })),
      { id: rid('as'), name: '基因治疗 CDMO', reason: '订单 backlog 增长 + 头部扩产（演示）' },
    ])
  }, [toast])

  const adoptSuggestion = useCallback(
    (id: string) => {
      const s = aiSuggestions.find((x) => x.id === id)
      if (!s) return
      setDirections((prev) => [...prev, { id: rid('dir'), name: s.name, subTracks: ['建议子赛道待补充'] }])
      setAiSuggestions((prev) => prev.filter((x) => x.id !== id))
      toast.show(`已采纳「${s.name}」到重点方向`, 'success')
    },
    [aiSuggestions, toast],
  )

  const toggleDataSource = useCallback((sourceId: HarvestDataSourceId) => {
    setDataSources((prev) => prev.map((s) => (s.id === sourceId ? { ...s, enabled: !s.enabled } : s)))
  }, [])

  const runLeadMatcherSkill = useCallback(() => {
    toast.show('✨ 线索匹配器：已按产业方向重算匹配度（演示）', 'success')
    setHarvested((prev) =>
      prev.map((r) => ({
        ...r,
        matchPct: Math.min(97, Math.max(72, Math.round(r.matchPct + (Math.random() * 12 - 4)))),
      })),
    )
  }, [toast])

  const convertHarvestToLead = useCallback(
    (row: AiHarvestRow) => {
      if (row.convertedToLeadId) {
        toast.show('该条目已转过线索', 'info')
        return
      }
      const id = rid('lead')
      const next: InvestmentLead = {
        id,
        name: row.projectName,
        grade: '',
        source: row.sourceLabel === '融资事件' ? '融资事件 API' : row.sourceLabel,
        assignee: '',
        status: '新建',
        lastTouch: new Date().toISOString().slice(5, 10),
        track: row.matchedTrack,
        region: '',
        oneLiner: `由 AI 匹配入库（${row.matchPct}%）；来自 ${row.sourceLabel}。`,
        followUps: [],
      }
      setLeads((p) => [next, ...p])
      setHarvested((p) => p.map((h) => (h.id === row.id ? { ...h, convertedToLeadId: id } : h)))
      toast.show('已转至招商线索池', 'success')
    },
    [toast],
  )

  const runChainAnalyzer = useCallback(
    (projectId: string) => {
      toast.show('✨ chain_analyzer：已生成上下游补链候选（演示）', 'success')
      setChainByProjectId((prev) => ({
        ...prev,
        [projectId]: CHAIN_DEMO.map((c) => ({ ...c, id: rid('ch') })),
      }))
    },
    [toast],
  )

  const getChainRows = useCallback(
    (projectId: string) => chainByProjectId[projectId] ?? [],
    [chainByProjectId],
  )

  const convertChainToLead = useCallback(
    (projectId: string, row: ChainRecommendRow) => {
      if (row.convertedToLeadId) {
        toast.show('已添加线索', 'info')
        return
      }
      const id = rid('lead')
      const lead: InvestmentLead = {
        id,
        name: row.company,
        grade: '',
        source: `产业链_${row.direction}`,
        assignee: '',
        status: '新建',
        lastTouch: new Date().toISOString().slice(5, 10),
        oneLiner: row.reason,
        followUps: [],
      }
      setLeads((p) => [lead, ...p])
      setChainByProjectId((prev) => ({
        ...prev,
        [projectId]:
          prev[projectId]?.map((r) => (r.id === row.id ? { ...r, convertedToLeadId: id } : r)) ?? [],
      }))
      toast.show('已添加至线索池', 'success')
    },
    [toast],
  )

  const runHighPotentialFinder = useCallback(() => {
    toast.show('✨ high_potential_finder：已刷新 Top 项目（演示）', 'success')
    setHighPotential((prev) =>
      prev.map((r) => ({
        ...r,
        score: Math.min(99, Math.max(82, r.score + Math.round(Math.random() * 6 - 3))),
      })),
    )
  }, [toast])

  const convertPotentialToLead = useCallback(
    (row: HighPotentialRow) => {
      if (row.convertedToLeadId) {
        toast.show('已转过线索', 'info')
        return
      }
      const id = rid('lead')
      const lead: InvestmentLead = {
        id,
        name: row.name,
        grade: '',
        source: 'AI 高潜推荐',
        assignee: '',
        status: '新建',
        lastTouch: new Date().toISOString().slice(5, 10),
        track: row.track,
        oneLiner: row.highlight,
        followUps: [],
      }
      setLeads((p) => [lead, ...p])
      setHighPotential((p) => p.map((x) => (x.id === row.id ? { ...x, convertedToLeadId: id } : x)))
      toast.show('已转至线索池', 'success')
    },
    [toast],
  )

  const addLead = useCallback(
    (draft: Omit<InvestmentLead, 'id' | 'followUps'> & Partial<Pick<InvestmentLead, 'id' | 'followUps'>>) => {
      const id = draft.id || rid('lead')
      const next: InvestmentLead = {
        ...draft,
        id,
        followUps: draft.followUps ?? [],
      }
      setLeads((p) => [next, ...p])
      toast.show('线索已创建', 'success')
      return id
    },
    [toast],
  )

  const updateLead = useCallback((id: string, patch: Partial<InvestmentLead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }, [])

  const applySuggestedGrading = useCallback(() => {
    toast.show('✨ 线索分级器：已为未分级线索给出 S/A/B/C 建议（演示）', 'success')
    setLeads((prev) =>
      prev.map((l) => {
        if (l.grade) return l
        if (l.source.includes('AI')) return { ...l, grade: 'S' as InvestmentLeadGrade }
        if (l.source.includes('融资')) return { ...l, grade: 'A' as InvestmentLeadGrade }
        if (l.source.includes('专利')) return { ...l, grade: 'B' as InvestmentLeadGrade }
        return { ...l, grade: 'C' as InvestmentLeadGrade }
      }),
    )
  }, [toast])

  const addFollowUp = useCallback(
    (leadId: string, payload: Omit<InvestmentLead['followUps'][number], 'id'>) => {
      const row = { ...payload, id: rid('fu') }
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                followUps: [row, ...l.followUps],
                lastTouch: payload.at.slice(5),
                status: '跟进中' as InvestmentLeadStatus,
              }
            : l,
        ),
      )
      toast.show('跟进记录已保存', 'success')
    },
    [toast],
  )

  const triggerTouchCopyGen = useCallback(
    (leadId: string) => {
      const l = leads.find((x) => x.id === leadId)
      if (!l) return
      toast.show('✨ touch_copy_gen：已生成沟通材料（演示）', 'info')
      const pack = {
        script: `${l.contact ?? '尊敬的负责人'}您好，我们是 XX 生物医药孵化平台。关注到贵公司在${
          l.track ?? '关键技术'
        }方向的最新进展，园区在共享实验室与专项政策上与贵司赛道高度契合，方便约本周一次线上交流吗？`,
        emailSubject: `邀请入驻 XX 生物医药孵化平台 · ${l.name}`,
        emailBody: `${l.contact ?? '您好'}

随函附上定制化推介材料概要：
- 产业园区赛道资源图谱
- 共享细胞房 / 质量体系辅导
- 首批设备与场地优惠方案（示意）

期待回信。

— 园区招商 ${l.assignee || '系统自动'}`,
        pitchPdfHint: `《${l.name} · 定制化推介概要》占位 PDF（演示，未生成真实文件）`,
        incubationBullets: [
          '推荐入驻类型：实体入孵',
          '推荐空间：B 栋 3 楼共享实验区（示意）',
          '可对接：基因测序、CRISPR 专家会诊、联合申报窗口',
        ],
      }
      updateLead(leadId, { aiCopy: pack })
    },
    [leads, toast, updateLead],
  )

  const triggerConversionAnalyzer = useCallback(
    (leadId: string) => {
      const l = leads.find((x) => x.id === leadId)
      if (!l) return
      toast.show('✨ conversion_analyzer：已评估转化概率（演示）', 'success')
      const pos = l.followUps.some((f) => f.summary.includes('价格') || f.summary.includes('兴趣'))
      const warn = l.followUps.filter((f) => f.summary.includes('未')).length >= 2
      const conversion = {
        prob: pos ? 65 : warn ? 38 : 52,
        levelLabel: pos ? '中等偏高' : warn ? '偏低' : '中等',
        signals: [
          {
            text: pos ? '对方主动询问计价与档期（偏积极）' : '暂未获取特别积极信号',
            tone: pos ? ('pos' as const) : ('neutral' as const),
          },
          {
            text: warn ? '两轮沟通未得到有效邮件回复（需关注）' : '沟通节奏尚可',
            tone: warn ? ('warn' as const) : ('neutral' as const),
          },
        ],
        suggest: warn
          ? '建议改电话破冰，附带「首批共享实验机时赠送」测试反应。'
          : '建议二次会议带上案例客户与补贴政策清单，推进意向确认。',
      }
      updateLead(leadId, { conversion })
    },
    [leads, toast, updateLead],
  )

  const value = useMemo<Ctx>(
    () => ({
      directions,
      techTags,
      aiSuggestions,
      dataSources,
      harvested,
      highPotential,
      leads,
      chainByProjectId,
      trackTrend,
      addDirection,
      updateDirection,
      removeDirection,
      addTechTag,
      removeTechTag,
      refreshIndustryAnalyzer,
      adoptSuggestion,
      toggleDataSource,
      runLeadMatcherSkill,
      convertHarvestToLead,
      runChainAnalyzer,
      getChainRows,
      convertChainToLead,
      runHighPotentialFinder,
      convertPotentialToLead,
      addLead,
      updateLead,
      applySuggestedGrading,
      addFollowUp,
      triggerTouchCopyGen,
      triggerConversionAnalyzer,
    }),
    [
      directions,
      techTags,
      aiSuggestions,
      dataSources,
      harvested,
      highPotential,
      leads,
      chainByProjectId,
      trackTrend,
      addDirection,
      updateDirection,
      removeDirection,
      addTechTag,
      removeTechTag,
      refreshIndustryAnalyzer,
      adoptSuggestion,
      toggleDataSource,
      runLeadMatcherSkill,
      convertHarvestToLead,
      runChainAnalyzer,
      getChainRows,
      convertChainToLead,
      runHighPotentialFinder,
      convertPotentialToLead,
      addLead,
      updateLead,
      applySuggestedGrading,
      addFollowUp,
      triggerTouchCopyGen,
      triggerConversionAnalyzer,
    ],
  )

  return <InnovationInvestmentV2Ctx.Provider value={value}>{children}</InnovationInvestmentV2Ctx.Provider>
}

export function useInnovationInvestmentV2() {
  const v = useContext(InnovationInvestmentV2Ctx)
  if (!v) throw new Error('useInnovationInvestmentV2 must be used under InnovationInvestmentV2Provider')
  return v
}
