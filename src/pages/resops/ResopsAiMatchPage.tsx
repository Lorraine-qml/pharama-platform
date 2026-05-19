import { Link, Navigate } from 'react-router-dom'
import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { demoApplicantForRole } from './resopsV1Labels'
import { Modal } from '../../components/Modal'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { useResopsAiMatch } from './ResopsAiMatchContext'
import { buildComboPlan, matchResourcesRule, parseDemandRule } from './resopsAiMatchEngine'
import type { ComboPlan, MatchHit, ParsedDemand, ResourceKindTag } from './resopsAiMatchTypes'
import { useResopsV1 } from './ResopsV1Context'

const PAGE_SIZE = 9

const PLACEHOLDER = `例：我需要一个能做细胞分析的实验室和流式细胞仪，下周三上午，预算500元

也可尝试：想找 CRO 做毒理外包；需要单细胞测序仪 + 数据分析服务。`

const KIND_FILTER: Array<{ v: ResourceKindTag | 'all'; label: string }> = [
  { v: 'all', label: '全部' },
  { v: 'space', label: '空间' },
  { v: 'device', label: '设备' },
  { v: 'expert', label: '专家' },
  { v: 'tech', label: '技术服务' },
  { v: 'external', label: '外部' },
  { v: 'ai', label: 'AI' },
]

function displayNameForHit(hit: MatchHit, raw: string): string {
  if (hit.resource_id === 'res-academician' && /张教授|教授/.test(raw)) return '张教授（专家咨询·演示映射）'
  return hit.resource_name
}

export default function ResopsAiMatchPage() {
  const { user } = useAuth()
  const toast = useToast()
  const resops = useResopsV1()
  const aiMatch = useResopsAiMatch()

  const [rawText, setRawText] = useState('')
  const [parseOpen, setParseOpen] = useState(false)
  const [draftParsed, setDraftParsed] = useState<ParsedDemand | null>(null)
  const [hits, setHits] = useState<MatchHit[]>([])
  const [page, setPage] = useState(1)
  const [combo, setCombo] = useState<ComboPlan | null>(null)
  const [comboOpen, setComboOpen] = useState(false)
  const [sideOpen, setSideOpen] = useState(false)
  const [histFilter, setHistFilter] = useState<ResourceKindTag | 'all'>('all')
  const [showResults, setShowResults] = useState(false)
  const [lastParsed, setLastParsed] = useState<ParsedDemand | null>(null)

  const applicant = useMemo(() => demoApplicantForRole(user?.role ?? 'member'), [user?.role])

  const filteredHistory = useMemo(() => {
    if (histFilter === 'all') return aiMatch.demandHistory
    return aiMatch.demandHistory.filter((h) => h.types.includes(histFilter))
  }, [aiMatch.demandHistory, histFilter])

  const pagedHits = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return hits.slice(start, start + PAGE_SIZE)
  }, [hits, page])

  const totalPages = Math.max(1, Math.ceil(hits.length / PAGE_SIZE))

  const openParse = useCallback(() => {
    const t = rawText.trim()
    if (!t) {
      toast.show('请先输入需求描述', 'warning')
      return
    }
    const p = parseDemandRule(t)
    setDraftParsed(p)
    setParseOpen(true)
  }, [rawText, toast])

  const confirmMatch = useCallback(() => {
    if (!draftParsed) return
    const list = matchResourcesRule(resops.resources, draftParsed, draftParsed.raw_text)
    setHits(list)
    setPage(1)
    const c = buildComboPlan(draftParsed, list)
    setCombo(c)
    aiMatch.pushDemandSession(draftParsed, list)
    setLastParsed(draftParsed)
    setShowResults(true)
    setParseOpen(false)
    toast.show('已根据解析结果生成匹配（规则版 resource_matcher）', 'success')
  }, [aiMatch, draftParsed, resops.resources, toast])

  const clearAll = useCallback(() => {
    setRawText('')
    setDraftParsed(null)
    setHits([])
    setCombo(null)
    setPage(1)
    setShowResults(false)
    setLastParsed(null)
  }, [])

  const applyOne = useCallback(
    (hit: MatchHit) => {
      const slot = lastParsed?.time_resolved.split('（')[0] ?? '待协商时段'
      const appId = resops.submitApplication({
        resourceId: hit.resource_id,
        applicantKey: applicant.key,
        applicantLabel: applicant.label,
        slot,
        matchId: hit.match_id,
      })
      if (appId) {
        aiMatch.markMatchApplied(hit.match_id, appId)
        toast.show('已发起申请，可在「我的申请」查看', 'success')
      }
    },
    [aiMatch, applicant.key, applicant.label, lastParsed?.time_resolved, resops, toast],
  )

  const submitCombo = useCallback(
    (plan: ComboPlan) => {
      let n = 0
      for (const it of plan.items) {
        const id = resops.submitApplication({
          resourceId: it.resourceId,
          applicantKey: applicant.key,
          applicantLabel: applicant.label,
          slot: plan.slotSummary,
          matchId: `m-combo-${plan.combo_id}-${it.resourceId}`,
        })
        if (id) n += 1
      }
      toast.show(`组合申请已提交 ${n} 条（演示）`, 'success')
      setComboOpen(false)
    },
    [applicant.key, applicant.label, resops, toast],
  )

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="relative space-y-5">
      <ModuleIntroCard
        title="📌 AI 供需撮合 V2（演示）"
        lines={[
          '规则版替代 demand_parser / resource_matcher / match_reason_gen / combo_generator；接入申请单时可写入 matchId 便于撮合效果统计。',
          '左侧历史默认收起，点击 📋 展开；匹配结果默认每页 9 条。',
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-foreground">AI 供需撮合</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/resops/match-analytics"
            className="text-[12px] font-semibold text-primary hover:underline"
          >
            撮合效果跟踪
          </Link>
          <button
            type="button"
            className="rounded-md border border-divider bg-card px-2.5 py-1.5 text-[12px] font-semibold hover:border-primary"
            onClick={() => setSideOpen((v) => !v)}
            aria-expanded={sideOpen}
          >
            {sideOpen ? '收起侧栏' : '📋 历史 / 筛选'}
          </button>
        </div>
      </div>

      <div className={cn('flex flex-col gap-4', sideOpen && 'lg:flex-row lg:items-start')}>
        {sideOpen ? (
          <aside className="order-first w-full shrink-0 rounded-lg border border-divider bg-card shadow-sm lg:order-none lg:max-w-[260px]">
            <div className="flex max-h-[min(60vh,420px)] flex-col gap-3 overflow-y-auto p-4 lg:max-h-[calc(100dvh-140px)]">
              <p className="text-[13px] font-bold text-foreground">历史需求 ({aiMatch.demandHistory.length})</p>
              <div className="flex flex-wrap gap-1">
                {KIND_FILTER.map((f) => (
                  <button
                    key={f.v}
                    type="button"
                    onClick={() => setHistFilter(f.v)}
                    className={cn(
                      'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                      histFilter === f.v ? 'bg-primary text-white' : 'bg-muted/50 text-foreground hover:bg-muted/80',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <ul className="space-y-2 text-[12px]">
                {filteredHistory.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      className="w-full rounded-md border border-divider bg-surface px-2 py-2 text-left hover:border-primary"
                      onClick={() => {
                        setRawText(h.raw)
                        toast.show('已载入历史需求，可再次「AI 智能解析」', 'info')
                      }}
                    >
                      <p className="line-clamp-2 text-foreground">{h.raw}</p>
                      <p className="mt-1 text-[11px] text-muted">{h.at}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        ) : null}

        <div className="min-w-0 flex-1 space-y-5">
        <div className="rounded-lg border border-divider bg-card p-4 shadow-sm">
          <label className="text-[12px] font-semibold text-muted">用自然语言描述您的需求</label>
          <textarea
            className="mt-2 min-h-[120px] w-full resize-y rounded-md border border-divider bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground outline-none focus:border-primary"
            placeholder={PLACEHOLDER}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover"
              onClick={openParse}
            >
              ✨ AI 智能解析
            </button>
            <button
              type="button"
              className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold hover:border-primary"
              onClick={clearAll}
            >
              清空
            </button>
            <button
              type="button"
              className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold hover:border-primary"
              onClick={openParse}
            >
              提交
            </button>
          </div>
        </div>

        {showResults && hits.length > 0 ? (
          <>
            <h2 className="text-[13px] font-bold text-foreground">匹配结果</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pagedHits.map((hit) => (
                <article
                  key={hit.match_id}
                  className="flex flex-col rounded-lg border border-divider bg-card p-4 shadow-sm"
                >
                  <header className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <span className="rounded bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted">
                      {hit.category_label}
                    </span>
                    <span className="text-[12px] font-bold text-primary">匹配度 {hit.score}%</span>
                  </header>
                  <h3 className="text-[15px] font-bold text-foreground">
                    {displayNameForHit(hit, lastParsed?.raw_text ?? rawText)}
                  </h3>
                  <p className="mt-2 text-[12px] text-muted">{hit.price_label}</p>
                  <p className="mt-3 grow text-[12px] leading-relaxed text-foreground/90">推荐理由：{hit.reason}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/resops/resource/${hit.resource_id}`}
                      className="rounded-md border border-divider px-3 py-1.5 text-[12px] font-semibold hover:border-primary"
                    >
                      详情
                    </Link>
                    <button
                      type="button"
                      className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-bold text-white hover:bg-primary-hover"
                      onClick={() => applyOne(hit)}
                    >
                      申请
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-center gap-2 text-[12px]">
                <button
                  type="button"
                  disabled={page <= 1}
                  className="rounded-md border border-divider px-2 py-1 font-semibold disabled:opacity-40"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  上一页
                </button>
                <span className="text-muted">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  className="rounded-md border border-divider px-2 py-1 font-semibold disabled:opacity-40"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  下一页
                </button>
              </div>
            ) : null}

            {combo ? (
              <section className="rounded-lg border border-primary/25 bg-[#f8fbff] p-4">
                <h2 className="text-[13px] font-bold text-foreground">组合方案推荐</h2>
                <p className="mt-1 text-[13px] font-semibold text-foreground">{combo.title}</p>
                <p className="mt-2 text-[12px] text-muted">
                  {combo.items.map((i) => i.name).join(' + ')} · {combo.totalLabel}
                </p>
                <button
                  type="button"
                  className="mt-3 rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover"
                  onClick={() => setComboOpen(true)}
                >
                  一键申请组合
                </button>
              </section>
            ) : null}
          </>
        ) : null}

        {showResults && hits.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-6 text-center">
            <p className="text-[13px] font-semibold text-foreground">暂无匹配资源，请尝试修改需求或联系运营</p>
            <p className="mt-2 text-[12px] text-muted">当前规则仅匹配「已上架」资源；生产环境将合并待准入与外部目录。</p>
            <button
              type="button"
              className="mt-4 rounded-md bg-primary px-4 py-2 text-[12px] font-bold text-white hover:bg-primary-hover"
              onClick={() => toast.show('已记录「发布需求」意向（演示），将由运营回访', 'success')}
            >
              发布需求
            </button>
          </div>
        ) : null}

        {!showResults ? (
          <p className="text-center text-[12px] text-muted">输入需求后点击「AI 智能解析」或「提交」，在弹窗中确认结构化字段后再生成匹配。</p>
        ) : null}
        </div>
      </div>

      <Modal open={parseOpen} onClose={() => setParseOpen(false)} title="AI 解析结果（规则版）" panelClassName="max-w-lg">
        {draftParsed ? (
          <div className="space-y-3 text-[13px]">
            <p>
              <span className="font-semibold text-muted">原始需求：</span>
              <span className="text-foreground">{draftParsed.raw_text}</span>
            </p>
            <div className="rounded-md border border-divider bg-muted/15 p-3 text-[12px] leading-relaxed">
              <p className="font-bold text-foreground">结构化字段</p>
              <ul className="mt-2 space-y-1.5 text-muted">
                <li>
                  <span className="font-semibold text-foreground">资源类型：</span>
                  {draftParsed.resource_types.join('、')}
                </li>
                <li>
                  <span className="font-semibold text-foreground">具体资源：</span>
                  {draftParsed.specific_resource}
                </li>
                <li>
                  <span className="font-semibold text-foreground">时间：</span>
                  {draftParsed.time_label} → {draftParsed.time_resolved}
                </li>
                <li>
                  <span className="font-semibold text-foreground">预算：</span>
                  {draftParsed.budget != null ? `${draftParsed.budget} 元` : '未识别'}
                </li>
                <li>
                  <span className="font-semibold text-foreground">技术条件：</span>
                  {draftParsed.tech_conditions}
                </li>
                <li>
                  <span className="font-semibold text-foreground">合规要求：</span>
                  {draftParsed.compliance}
                </li>
              </ul>
            </div>
            <p className="text-[12px] text-muted">是否确认以上解析？确认后将调用 resource_matcher 生成推荐列表。</p>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold hover:border-primary"
                onClick={() => {
                  setParseOpen(false)
                  toast.show('请直接在输入框中修改需求', 'info')
                }}
              >
                修改
              </button>
              <button
                type="button"
                className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover"
                onClick={confirmMatch}
              >
                确认匹配
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={comboOpen} onClose={() => setComboOpen(false)} title="组合方案详情" panelClassName="max-w-md">
        {combo ? (
          <div className="space-y-3 text-[13px]">
            <p className="font-bold text-primary">{combo.totalLabel}</p>
            <ol className="list-decimal space-y-2 pl-4 text-[12px]">
              {combo.items.map((it) => (
                <li key={it.resourceId}>
                  <span className="font-medium text-foreground">{it.name}</span>
                  <span className="text-muted"> — {it.lineTotalLabel}</span>
                  <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] text-emerald-800">已选时段</span>
                  <p className="text-[11px] text-muted">{it.slot}</p>
                </li>
              ))}
            </ol>
            <p className="text-[12px] text-muted">总时间：{combo.slotSummary}</p>
            <button
              type="button"
              className="w-full rounded-md bg-primary py-2.5 text-[13px] font-bold text-white hover:bg-primary-hover"
              onClick={() => submitCombo(combo)}
            >
              提交组合申请
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
