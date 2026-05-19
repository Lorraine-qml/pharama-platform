import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Modal } from '../../../components/Modal'
import { useToast } from '../../../components/ToastProvider'
import { cn } from '../../../utils/cn'
import { useInnovationDemo } from '../InnovationDemoContext'
import { useInnovationInvestmentV2 } from './InnovationInvestmentV2Context'

const TABS = [
  { k: 'config', label: '产业方向配置' },
  { k: 'ingest', label: '线索采集 / 匹配' },
  { k: 'chain', label: '产业链识别' },
  { k: 'hot', label: '高潜力推荐' },
  { k: 'pool', label: '线索池快照' },
] as const

type TabKey = (typeof TABS)[number]['k']

export default function InnovationIndustryTrendsHubPage() {
  const demo = useInnovationDemo()
  const toast = useToast()
  const v = useInnovationInvestmentV2()
  const [tab, setTab] = useState<TabKey>('config')

  const [dirModalOpen, setDirModalOpen] = useState<'add' | { edit: string } | null>(null)
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [dirNameInput, setDirNameInput] = useState('')
  const [dirSubsInput, setDirSubsInput] = useState('')
  const [tagInput, setTagInput] = useState('')

  const [projChain, setProjChain] = useState<string>(() => demo.projects[0]?.id ?? '')
  const chainRows = useMemo(
    () => (projChain ? v.chainByProjectId[projChain] ?? [] : []),
    [v.chainByProjectId, projChain],
  )

  const maxTrend = Math.max(...v.trackTrend.flatMap((t) => t.values))

  function submitDirection() {
    const subs = dirSubsInput
      .split(/[,，；;]/g)
      .map((s) => s.trim())
      .filter(Boolean)
    if (dirModalOpen === 'add') v.addDirection(dirNameInput, subs)
    else if (dirModalOpen && 'edit' in dirModalOpen) v.updateDirection(dirModalOpen.edit, dirNameInput, subs)
    setDirModalOpen(null)
    setDirNameInput('')
    setDirSubsInput('')
  }

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-[var(--radius-panel)] border border-primary/15 bg-gradient-to-r from-primary-light/35 via-surface to-surface px-5 py-4 shadow-sm">
        <div className="pointer-events-none absolute -right-14 -top-16 size-40 rounded-full bg-primary/[0.07] blur-2xl" />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">科创策源 · V2 增强模块</p>
          <h1 className="mt-1 text-[21px] font-bold tracking-tight text-foreground">行业趋势分析与招商线索引擎</h1>
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted">
            左侧完成方向 / 数据源 / AI 信号的编排；右侧「招商触达辅助」承接线索入库、话术与跟进闭环。本节为运营视角的一站式配置与监控。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/innovation/outreach"
              className="rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white shadow-sm hover:bg-primary-hover"
            >
              前往招商线索池与触达
            </Link>
            <button
              type="button"
              onClick={() =>
                toast.show('趋势订阅：已向您的企业微信推送周报摘要（演示）', 'success')
              }
              className="rounded-lg border border-divider px-3 py-2 text-[12px] font-semibold text-foreground hover:border-primary/40"
            >
              订阅周报
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 rounded-[var(--radius-panel)] border border-divider bg-surface p-2 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setTab(t.k)}
            className={cn(
              'rounded-lg px-3 py-2 text-[12px] font-bold motion-safe:transition-colors',
              tab === t.k ? 'bg-primary text-white shadow-[0_2px_12px_-4px_rgb(30_109_255/0.5)]' : 'text-muted hover:bg-page',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'config' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-divider px-5 py-3">
              <h2 className="text-[14px] font-bold text-foreground">产业方向配置</h2>
              <button
                type="button"
                className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-bold text-white hover:bg-primary-hover"
                onClick={() => {
                  setDirNameInput('')
                  setDirSubsInput('')
                  setDirModalOpen('add')
                }}
              >
                + 添加
              </button>
            </div>
            <ul className="space-y-2 px-5 py-4 text-[13px]">
              {v.directions.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-col gap-1 rounded-xl border border-divider bg-page/60 px-3 py-2.5 md:flex-row md:items-start md:justify-between"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-foreground">{d.name}</span>
                    <p className="mt-1 text-muted">子赛道：{d.subTracks.join('、')}</p>
                  </div>
                  <div className="flex shrink-0 gap-2 md:justify-end">
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-[12px] font-semibold text-primary ring-1 ring-primary/30 hover:bg-primary-light/35"
                      onClick={() => {
                        setDirNameInput(d.name)
                        setDirSubsInput(d.subTracks.join('，'))
                        setDirModalOpen({ edit: d.id })
                      }}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-[12px] text-danger ring-1 ring-danger/30 hover:bg-danger/10"
                      onClick={() => {
                        if (window.confirm(`删除方向「${d.name}」？`)) v.removeDirection(d.id)
                      }}
                    >
                      删除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-4">
            <section className="rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-divider px-5 py-3">
                <h2 className="text-[14px] font-bold text-foreground">前沿技术标签</h2>
                <button
                  type="button"
                  className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-bold text-white hover:bg-primary-hover"
                  onClick={() => setTagModalOpen(true)}
                >
                  + 添加
                </button>
              </div>
              <ul className="flex flex-wrap gap-2 px-5 py-4 text-[13px]">
                {v.techTags.map((t) => (
                  <li
                    key={t.id}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary-light/35 px-3 py-1 text-[12px] font-semibold text-primary ring-1 ring-primary/18"
                  >
                    {t.name}
                    <button type="button" className="text-danger hover:underline" onClick={() => v.removeTechTag(t.id)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[var(--radius-panel)] border border-primary/20 bg-gradient-to-br from-primary-light/25 via-surface to-surface px-5 py-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-[13px] font-bold text-foreground">✨ AI 分析 · industry_analyzer</h3>
                  <p className="mt-1 text-[12px] text-muted">基于公开研报、投融资与专利趋势生成增量方向草案。</p>
                </div>
                <button type="button" className="font-bold text-[12px] text-primary hover:underline" onClick={() => v.refreshIndustryAnalyzer()}>
                  刷新建议
                </button>
              </div>
              <ul className="mt-3 space-y-2">
                {v.aiSuggestions.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-divider bg-surface px-3 py-2 text-[13px]"
                  >
                    <div>
                      <span className="font-semibold text-foreground">{s.name}</span>
                      <p className="text-[11px] text-muted">{s.reason}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => v.adoptSuggestion(s.id)}
                      className="shrink-0 rounded-md bg-primary px-3 py-1 text-[11px] font-bold text-white hover:bg-primary-hover"
                    >
                      采纳
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      ) : null}

      {tab === 'ingest' ? (
        <div className="grid gap-4 xl:grid-cols-5">
          <section className="rounded-[var(--radius-panel)] border border-divider bg-surface xl:col-span-2 shadow-sm">
            <div className="border-b border-divider px-5 py-3">
              <h2 className="text-[14px] font-bold text-foreground">目标项目线索采集</h2>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-primary/40 bg-primary text-[12px] font-bold text-white px-3 py-2 hover:bg-primary-hover"
                  onClick={() => toast.show('手动录入占位：请到「线索池」页创建（演示）。', 'info')}
                >
                  手动录入
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-divider px-3 py-2 text-[12px] hover:border-primary/35"
                  onClick={() =>
                    toast.show('API 连接器：占位配置界面，请到集成中心维护密钥（演示）。', 'warning')
                  }
                >
                  配置来源
                </button>
              </div>
            </div>
            <div className="border-b border-divider px-5 py-2 text-[11px] font-bold uppercase text-muted">数据源</div>
            <ul className="space-y-0 divide-y divide-divider px-2 py-1 text-[13px]">
              {v.dataSources.map((ds) => (
                <li key={ds.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                  <label className="flex min-w-[200px] flex-1 cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={ds.enabled}
                      onChange={() => v.toggleDataSource(ds.id)}
                      className="mt-1"
                    />
                    <span>{ds.name}</span>
                  </label>
                  <span className="rounded-md bg-page px-2 py-1 text-[11px] text-muted">同步 {ds.frequencyLabel}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 border-t border-divider px-5 py-3">
              <button
                type="button"
                className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white"
                onClick={() => toast.show('已向同步队列投递任务（演示）', 'success')}
              >
                立即拉取
              </button>
              <button
                type="button"
                className="rounded-md border border-divider px-3 py-2 text-[12px]"
                onClick={() => toast.show('链路测试 OK（演示）', 'success')}
              >
                测试连接
              </button>
            </div>
          </section>

          <section className="rounded-[var(--radius-panel)] border border-divider bg-surface xl:col-span-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-5 py-3">
              <h2 className="text-[14px] font-bold text-foreground">✨ AI 匹配结果 · 线索匹配器</h2>
              <button type="button" className="text-[12px] font-bold text-primary hover:underline" onClick={() => v.runLeadMatcherSkill()}>
                重新评分
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-[12px]">
                <thead className="border-b border-divider bg-page/80 text-[11px] text-muted uppercase">
                  <tr>
                    <th className="px-4 py-2">项目名称</th>
                    <th className="px-4 py-2">来源</th>
                    <th className="px-4 py-2">匹配赛道</th>
                    <th className="px-4 py-2">匹配度</th>
                    <th className="px-4 py-2 text-end">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {v.harvested.map((row) => (
                    <tr key={row.id} className={row.convertedToLeadId ? 'bg-success/10' : undefined}>
                      <td className="px-4 py-2 font-medium text-foreground">{row.projectName}</td>
                      <td className="px-4 py-2 text-muted">{row.sourceLabel}</td>
                      <td className="px-4 py-2 text-primary">{row.matchedTrack}</td>
                      <td className="px-4 py-2 font-mono">{row.matchPct}%</td>
                      <td className="px-4 py-2 text-end">
                        {row.convertedToLeadId ? (
                          <Link
                            className="text-[12px] font-semibold text-primary hover:underline"
                            to={`/innovation/outreach/leads/${row.convertedToLeadId}`}
                          >
                            已转线索 →
                          </Link>
                        ) : (
                          <button type="button" className="text-[12px] font-bold text-primary hover:underline" onClick={() => v.convertHarvestToLead(row)}>
                            转线索
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-divider px-5 py-2 text-[11px] text-muted">今日演示发现 {v.harvested.length} 条 · 数据源开关影响后续批处理节奏。</p>
          </section>
        </div>
      ) : null}

      {tab === 'chain' ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider pb-4">
            <h2 className="text-[14px] font-bold text-foreground">产业链上下游识别</h2>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-divider bg-surface px-3 py-2 text-[13px]"
                value={projChain}
                onChange={(e) => setProjChain(e.target.value)}
              >
                {demo.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const id = projChain || demo.projects[0]?.id
                  if (id) v.runChainAnalyzer(id)
                }}
                className="rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary-hover"
              >
                ✨ 自动分析
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr,minmax(0,1fr)]">
            <div className="rounded-xl border border-dashed border-divider bg-page/80 p-6 text-center">
              <p className="text-[12px] font-bold text-muted uppercase">供应链图谱占位</p>
              <div className="mt-8 flex flex-col items-center gap-4 text-[13px]">
                <div className="flex flex-wrap justify-center gap-3 font-semibold">
                  <span className="rounded-full bg-primary px-4 py-1.5 text-white">上游</span>
                  <span className="text-muted">──▶</span>
                  <span className="rounded-full border border-divider px-4 py-1.5 text-foreground">{demo.projects.find((p) => p.id === projChain)?.name ?? '请选择项目'}</span>
                  <span className="text-muted">──▶</span>
                  <span className="rounded-full bg-foreground/[0.78] px-4 py-1.5 text-white">下游</span>
                </div>
                <p className="max-w-xs text-muted">力导向图谱由 chain_analyzer 输出节点与连线；以下为列表化呈现。</p>
              </div>
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-foreground">推荐清单</h3>
              {!chainRows.length ? (
                <p className="mt-3 text-[13px] text-muted">点击「✨ 自动分析」填充演示上下游企业。</p>
              ) : (
                <table className="mt-3 w-full text-left text-[12px]">
                  <thead className="border-b border-divider text-[11px] text-muted uppercase">
                    <tr>
                      <th className="py-2">方向</th>
                      <th className="py-2">企业</th>
                      <th className="py-2">理由</th>
                      <th className="py-2 text-end">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {chainRows.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2 font-semibold text-primary">{r.direction}</td>
                        <td className="py-2 font-medium text-foreground">{r.company}</td>
                        <td className="py-2 text-muted">{r.reason}</td>
                        <td className="py-2 text-end">
                          {r.convertedToLeadId ? (
                            <span className="text-success font-semibold">已转线索</span>
                          ) : (
                            <button
                              type="button"
                              className="font-bold text-primary hover:underline"
                              onClick={() => {
                                const id = projChain || demo.projects[0]?.id
                                if (!id) return
                                v.convertChainToLead(id, r)
                              }}
                            >
                              添加线索
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'hot' ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-divider px-5 py-3">
            <h2 className="text-[14px] font-bold text-foreground">高潜力项目 AI 推荐 · high_potential_finder</h2>
            <button type="button" className="text-[12px] font-bold text-primary hover:underline" onClick={() => v.runHighPotentialFinder()}>
              刷新推荐
            </button>
          </div>
          <div className="overflow-x-auto px-5 py-4">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="text-[11px] text-muted uppercase">
                <tr>
                  <th className="py-2">项目</th>
                  <th className="py-2">赛道</th>
                  <th className="py-2">综合分</th>
                  <th className="py-2">亮点</th>
                  <th className="py-2 text-end">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {v.highPotential.map((h) => (
                  <tr key={h.id} className={h.convertedToLeadId ? 'bg-primary-light/70' : undefined}>
                    <td className="py-3 font-semibold text-foreground">{h.name}</td>
                    <td className="py-3">{h.track}</td>
                    <td className="py-3 font-mono text-primary">{h.score}</td>
                    <td className="py-3 text-muted">{h.highlight}</td>
                    <td className="py-3 text-end">
                      {h.convertedToLeadId ? (
                        <Link to={`/innovation/outreach/leads/${h.convertedToLeadId}`} className="font-bold text-primary hover:underline">
                          线索详情
                        </Link>
                      ) : (
                        <button type="button" className="font-bold text-primary hover:underline" onClick={() => v.convertPotentialToLead(h)}>
                          转线索
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-divider bg-page/85 px-5 py-3 text-[12px] text-muted">
            推荐依据：<span className="text-foreground">近三月融资活跃度、公开招聘扩编、专利同族增长率等融合信号。</span>{' '}
            <button type="button" className="ms-2 font-semibold text-primary hover:underline" onClick={() => toast.show('正在打开分析报告（演示）…', 'info')}>
              ✨ 查看详细分析报告
            </button>
          </div>
        </section>
      ) : null}

      {tab === 'pool' ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr,minmax(0,1fr)]">
          <section className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[14px] font-bold">招商线索池（快照）</h2>
              <Link to="/innovation/outreach" className="text-[12px] font-bold text-primary hover:underline">
                打开工作台 →
              </Link>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[580px] text-left text-[12px]">
                <thead className="text-[11px] text-muted uppercase">
                  <tr>
                    <th className="py-2">线索</th>
                    <th className="py-2">等级</th>
                    <th className="py-2">来源</th>
                    <th className="py-2">跟进人</th>
                    <th className="py-2">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {v.leads.slice(0, 6).map((l) => (
                    <tr key={l.id}>
                      <td className="py-2">
                        <Link className="font-semibold text-primary hover:underline" to={`/innovation/outreach/leads/${l.id}`}>
                          {l.name}
                        </Link>
                      </td>
                      <td className="py-2">{l.grade || '—'}</td>
                      <td className="py-2 text-muted">{l.source}</td>
                      <td className="py-2">{l.assignee || '—'}</td>
                      <td className="py-2">{l.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 rounded-xl border border-primary/25 bg-gradient-to-r from-primary-light/40 to-transparent p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-bold text-foreground">✨ AI 分级建议 · 线索分级器</p>
                <button type="button" className="rounded-md bg-primary px-4 py-2 text-[11px] font-bold text-white" onClick={() => v.applySuggestedGrading()}>
                  应用建议
                </button>
              </div>
              <p className="mt-2 text-[12px] text-muted">会为尚未标注等级的线索自动生成 S/A/B/C 占位标签。</p>
            </div>
          </section>

          <section className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
            <h2 className="text-[14px] font-bold text-foreground">各赛道线索增长（演示）</h2>
            <div className="mt-6 space-y-6">
              {v.trackTrend.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold">{s.label}</span>
                    <span className="text-muted">近 7 期</span>
                  </div>
                  <div className="mt-2 flex h-24 items-end gap-1">
                    {s.values.map((h, idx) => (
                      <div
                        key={`${s.label}-${idx}`}
                        className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/95 to-primary/40 opacity-95"
                        style={{ height: `${(h / maxTrend) * 100}%`, minHeight: '6px' }}
                        title={`${s.label}: ${h}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <Modal
        open={dirModalOpen !== null}
        title={dirModalOpen === 'add' ? '添加产业方向' : '编辑方向'}
        onClose={() => setDirModalOpen(null)}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-md border border-divider px-3 py-2 text-[13px]" onClick={() => setDirModalOpen(null)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-primary px-3 py-2 text-[13px] font-bold text-white" onClick={submitDirection}>
              保存
            </button>
          </div>
        }
      >
        <label className="block text-[12px] font-bold text-muted">方向名称</label>
        <input
          className="mt-1 w-full rounded-lg border border-divider px-3 py-2 text-[13px]"
          value={dirNameInput}
          onChange={(e) => setDirNameInput(e.target.value)}
        />
        <label className="mt-3 block text-[12px] font-bold text-muted">子赛道（逗号分隔）</label>
        <textarea
          className="mt-1 w-full resize-none rounded-lg border border-divider px-3 py-2 text-[13px]"
          rows={2}
          value={dirSubsInput}
          onChange={(e) => setDirSubsInput(e.target.value)}
        />
      </Modal>

      <Modal
        open={tagModalOpen}
        title="新建技术标签"
        onClose={() => {
          setTagModalOpen(false)
          setTagInput('')
        }}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-md border border-divider px-3 py-2 text-[13px]" onClick={() => setTagModalOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 text-[13px] font-bold text-white"
              onClick={() => {
                v.addTechTag(tagInput)
                setTagModalOpen(false)
                setTagInput('')
              }}
            >
              添加
            </button>
          </div>
        }
      >
        <input className="w-full rounded-lg border border-divider px-3 py-2 text-[13px]" placeholder="标签名" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
      </Modal>
    </div>
  )
}
