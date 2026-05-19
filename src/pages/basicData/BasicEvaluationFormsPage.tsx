import { useMemo, useState, type ReactNode } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import type { BasicDataStatus, EvaluationDimension, EvaluationForm, EvaluationIndicator, EvaluationScenario } from './basicDataTypes'
import { useBasicDataDemo } from './BasicDataDemoContext'

const SCENARIOS: EvaluationScenario[] = ['科创策源', '孵化评估', 'AI 撮合', '资源运营', '通用']
const ENTITY_OPTS = ['企业', '高校', '研究所', '医院'] as const
const INCUB_OPTS = ['实体', '虚拟', '服务商'] as const
const KB_OPTIONS = [
  '园区生物医药入孵政策与评分知识库',
  '临床试验伦理知识库',
  '知识产权与成果转化库',
  '— 暂不关联',
] as const

function newDimId() {
  return `dv-${Math.random().toString(36).slice(2, 8)}`
}
function newIndId() {
  return `iv-${Math.random().toString(36).slice(2, 8)}`
}

function applyAiDemoToDimensions(ds: EvaluationDimension[]): EvaluationDimension[] {
  if (ds.length === 0) return ds
  const bump = structuredClone(ds)
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
  return bump
}

export default function BasicEvaluationFormsPage() {
  const toast = useToast()
  const { evalForms, setEvalForms, formulas, setFormulas, patchEvaluationForm, duplicateEvaluationForm } = useBasicDataDemo()

  const [tab, setTab] = useState<'forms' | 'rules'>('forms')
  const [sceneFilter, setSceneFilter] = useState('全部')
  const [statFilter, setStatFilter] = useState<'全部' | BasicDataStatus | '归档'>('全部')
  const [q, setQ] = useState('')

  const [editor, setEditor] = useState<EvaluationForm | null>(null)
  /**  true：首次保存写入列表；false：更新已有记录 */
  const [editorIsNew, setEditorIsNew] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [indModal, setIndModal] = useState<null | { dimId: string; indicator: EvaluationIndicator }>(null)

  const [formulaEditId, setFormulaEditId] = useState<string | null>(null)
  const [feExpr, setFeExpr] = useState('')

  const filtered = useMemo(() => {
    return evalForms.filter((f) => {
      const hit = q.trim() === '' || f.name.includes(q.trim())
      const sc = sceneFilter === '全部' || f.scenario === sceneFilter
      const st = statFilter === '全部' || f.status === statFilter
      return hit && sc && st
    })
  }, [evalForms, q, sceneFilter, statFilter])

  const weightSum = editor ? editor.dimensions.reduce((a, d) => a + d.weightPct, 0) : 0

  function openNewEditor() {
    const id = `ev-new-${Date.now().toString(36)}`
    setEditor({
      id,
      name: '',
      scenario: '科创策源',
      version: 'v1',
      status: '草稿',
      updatedAt: new Date().toISOString().slice(0, 10),
      dimensions: [],
      gradeRuleSummary: '优秀(≥85) 良好(70-84) 一般(55-69) 较弱(40-54) 高风险(<40)',
      reviewTemplateScore: '专家评分表模板',
      reviewTemplateOpinion: '评审意见模板',
      reviewTemplateRisk: '风险提示模板',
      knowledgeBaseLabel: KB_OPTIONS[3],
    })
    setEditorIsNew(true)
    setAdvancedOpen(false)
  }

  function openEditor(f: EvaluationForm) {
    setEditor(structuredClone(f))
    setEditorIsNew(false)
    setAdvancedOpen(false)
  }

  function loadPresetDimensions() {
    if (!editor) return
    const src = evalForms.find((f) => f.id === 'ev1')
    if (!src?.dimensions.length) {
      toast.show('未找到可复用的模板', 'warning')
      return
    }
    setEditor({ ...editor, dimensions: structuredClone(src.dimensions) })
    toast.show('已载入「入孵初筛评价表」五维结构，请检查权重合计为 100%', 'info')
  }

  function persistEditor() {
    if (!editor) return
    const sum = editor.dimensions.reduce((a, d) => a + d.weightPct, 0)
    if (sum !== 100) {
      toast.show(`维度权重之和须为 100%，当前为 ${sum}%`, 'warning')
      return
    }
    if (!editor.name.trim()) {
      toast.show('请填写评价表名称', 'warning')
      return
    }

    if (editorIsNew) {
      const realId = `ev-${Date.now().toString(36)}`
      const { id: _drop, ...rest } = editor
      setEvalForms((prev) => [...prev, { ...rest, id: realId }])
      setEditor(null)
      setEditorIsNew(false)
      setAdvancedOpen(false)
      toast.show('评价表已创建', 'success')
      return
    }

    const { id, version: _ver, updatedAt: _up, ...rest } = editor
    const ok = patchEvaluationForm(id, { ...rest, dimensions: editor.dimensions, bumpVersion: true })
    if (ok) {
      const m = /^v(\d+)$/i.exec(editor.version.trim())
      const nextV = m ? `v${Number(m[1]) + 1}` : 'v2'
      setEditor({ ...editor, version: nextV, updatedAt: new Date().toISOString().slice(0, 10) })
    }
  }

  function toggleSource(src: (typeof ENTITY_OPTS)[number]) {
    if (!editor) return
    const cur = editor.applyEntitySources ?? []
    const has = cur.includes(src)
    const next = has ? cur.filter((x) => x !== src) : [...cur, src]
    setEditor({ ...editor, applyEntitySources: next.length ? next : undefined })
  }

  function toggleInc(inc: (typeof INCUB_OPTS)[number]) {
    if (!editor) return
    const cur = editor.applyIncubationTypes ?? []
    const has = cur.includes(inc)
    const next = has ? cur.filter((x) => x !== inc) : [...cur, inc]
    setEditor({ ...editor, applyIncubationTypes: next.length ? next : undefined })
  }

  function rowActions(f: EvaluationForm) {
    const btns: ReactNode[] = []
    btns.push(
      <button key="e" type="button" className="text-[12px] font-semibold text-primary hover:underline" onClick={() => openEditor(f)}>
        编辑
      </button>,
    )
    if (f.status === '启用中') {
      btns.push(
        <button
          key="d"
          type="button"
          className="text-[12px] font-semibold text-muted hover:underline"
          onClick={() => {
            if (window.confirm('确认停用该评价表？')) setEvalForms((p) => p.map((x) => (x.id === f.id ? { ...x, status: '停用' as const } : x)))
          }}
        >
          停用
        </button>,
        <button key="c" type="button" className="text-[12px] font-semibold text-primary hover:underline" onClick={() => duplicateEvaluationForm(f.id)}>
          复制
        </button>,
      )
    } else if (f.status === '草稿') {
      btns.push(
        <button
          key="del"
          type="button"
          className="text-[12px] font-semibold text-danger hover:underline"
          onClick={() => {
            if (window.confirm('确认删除该草稿？')) setEvalForms((p) => p.filter((x) => x.id !== f.id))
          }}
        >
          删除
        </button>,
      )
    } else if (f.status === '停用') {
      btns.push(
        <button
          key="en"
          type="button"
          className="text-[12px] font-semibold text-success hover:underline"
          onClick={() => setEvalForms((p) => p.map((x) => (x.id === f.id ? { ...x, status: '启用中' as const } : x)))}
        >
          启用
        </button>,
      )
    }
    return <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">{btns}</div>
  }

  return (
    <div className="space-y-4">
      <header className="rounded-[var(--radius-panel)] border border-primary/15 bg-gradient-to-r from-primary-light/35 via-surface to-surface px-5 py-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase text-muted">基础数据 · 7.1</p>
        <h1 className="mt-1 text-[21px] font-bold text-foreground">评价表管理</h1>
        <p className="mt-2 text-[13px] text-muted">配置维度、指标、权重、等级规则与评审模板；支持按主体来源与入孵类型差异化（高级设置）。保存时生成新版本号（演示）。</p>
      </header>

      <div className="flex flex-wrap gap-2 rounded-[var(--radius-panel)] border border-divider bg-surface p-2 shadow-sm">
        {(
          [
            ['forms', '评价表列表'],
            ['rules', '评分规则'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn('rounded-lg px-3 py-2 text-[12px] font-bold', tab === k ? 'bg-primary text-white' : 'text-muted hover:bg-page')}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'forms' ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-bold text-foreground">评价规则配置</h2>
              <p className="mt-1 text-[12px] text-muted">列表仅展示；新增与维度编辑均在弹窗中完成。</p>
            </div>
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-[12px] font-bold text-white hover:bg-primary-hover"
              onClick={openNewEditor}
            >
              ＋ 新建评价表
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <select className="rounded-lg border px-3 py-2 text-[13px]" value={sceneFilter} onChange={(e) => setSceneFilter(e.target.value)}>
              <option>全部</option>
              {SCENARIOS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className="rounded-lg border px-3 py-2 text-[13px]" value={statFilter} onChange={(e) => setStatFilter(e.target.value as typeof statFilter)}>
              <option>全部</option>
              <option>启用中</option>
              <option>草稿</option>
              <option>归档</option>
              <option>停用</option>
            </select>
            <input
              className="min-w-[200px] flex-1 rounded-lg border px-3 py-2 text-[13px]"
              placeholder="🔍 搜索评价表名称"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-[13px]">
              <thead className="border-b border-divider text-[11px] font-bold uppercase text-muted">
                <tr>
                  <th className="py-2.5">评价表名称</th>
                  <th className="py-2.5">适用场景</th>
                  <th className="py-2.5">版本</th>
                  <th className="py-2.5">状态</th>
                  <th className="py-2.5">最后修改</th>
                  <th className="py-2.5 text-end">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 font-semibold text-foreground">{row.name}</td>
                    <td className="py-3 text-muted">{row.scenario}</td>
                    <td className="py-3 font-mono text-[12px]">{row.version}</td>
                    <td className="py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-bold',
                          row.status === '启用中' && 'bg-success/14 text-success ring-1 ring-success/20',
                          row.status === '草稿' && 'bg-warning/14 text-warning ring-1 ring-warning/20',
                          row.status === '停用' && 'bg-page text-muted ring-1 ring-divider',
                          row.status === '归档' && 'bg-primary/10 text-primary',
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted">{row.updatedAt}</td>
                    <td className="py-3 text-end">{rowActions(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[14px] font-bold">评分规则配置</h2>
            <button type="button" className="rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white" onClick={() => toast.show('占位：新增规则向导', 'info')}>
              ＋ 新增规则
            </button>
          </div>
          <table className="mt-4 w-full min-w-[700px] text-left text-[13px]">
            <thead className="border-b border-divider text-[11px] font-bold uppercase text-muted">
              <tr>
                <th className="py-2">规则名称</th>
                <th className="py-2">适用评价表</th>
                <th className="py-2">计算公式</th>
                <th className="py-2 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {formulas.map((f) => (
                <tr key={f.id}>
                  <td className="py-3 font-semibold">{f.name}</td>
                  <td className="py-3">{f.formName}</td>
                  <td className="py-3 font-mono text-[12px] text-muted">{f.expression}</td>
                  <td className="py-3 text-end">
                    <button
                      type="button"
                      className="text-[12px] font-bold text-primary hover:underline"
                      onClick={() => {
                        setFormulaEditId(f.id)
                        setFeExpr(f.expression)
                      }}
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 rounded-lg bg-page px-4 py-3 text-[12px] text-muted">可视化公式占位：拖拽「维度」「指标」「运算符」「常数」拼接。</p>
        </section>
      )}

      <Modal
        open={editor !== null}
        fillHeight
        title={
          editor
            ? editorIsNew
              ? '新建评价表'
              : `编辑评价表：${editor.name || '未命名'}`
            : ''
        }
        onClose={() => {
          setEditor(null)
          setAdvancedOpen(false)
          setEditorIsNew(false)
        }}
        panelClassName="w-full max-w-[min(1440px,calc(100vw-1rem))] p-5 sm:p-8"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-[520px] text-[13px] leading-relaxed text-muted">
              {editorIsNew
                ? '首次保存将写入列表；维度权重之和须为 100%。可先「载入标准五维模板」再微调。'
                : '保存后版本号自动 +1；维度权重之和须为 100%。'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border px-4 py-2.5 text-[13px]"
                onClick={() => {
                  setEditor(null)
                  setAdvancedOpen(false)
                  setEditorIsNew(false)
                }}
              >
                取消
              </button>
              <button type="button" className="rounded-md bg-primary px-5 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-primary-hover" onClick={persistEditor}>
                {editorIsNew ? '保存并创建' : '保存'}
              </button>
            </div>
          </div>
        }
      >
        {editor ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden pe-1 text-[14px] leading-relaxed sm:pe-2">
            <div className="grid gap-4 border-b border-divider pb-5 sm:grid-cols-3">
              <label className="block sm:col-span-1">
                <span className="text-[13px] font-semibold text-foreground">评价表名称</span>
                <input
                  className="mt-2 w-full rounded-md border border-divider px-3 py-2.5 text-[14px] shadow-sm"
                  value={editor.name}
                  onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                  placeholder="例如：入孵初筛评价表"
                />
              </label>
              <label className="block sm:col-span-1">
                <span className="text-[13px] font-semibold text-foreground">适用场景</span>
                <select className="mt-2 w-full rounded-md border border-divider px-3 py-2.5 text-[14px] shadow-sm" value={editor.scenario} onChange={(e) => setEditor({ ...editor, scenario: e.target.value as EvaluationScenario })}>
                  {SCENARIOS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-1">
                <span className="text-[13px] font-semibold text-foreground">状态</span>
                <select
                  className="mt-2 w-full rounded-md border border-divider px-3 py-2.5 text-[14px] shadow-sm"
                  value={editor.status}
                  onChange={(e) => setEditor({ ...editor, status: e.target.value as EvaluationForm['status'] })}
                >
                  {(['启用中', '草稿', '停用', '归档'] as const).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-page/80 px-4 py-4 ring-1 ring-divider">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-muted">当前版本</span>
                  <span className="rounded-md bg-surface px-3 py-1 font-mono text-[13px] font-semibold text-foreground ring-1 ring-divider">{editor.version}</span>
                </div>
                <span className={cn('rounded-md px-3 py-1 text-[13px] font-bold', weightSum === 100 ? 'bg-success/15 text-success' : 'bg-danger/10 text-danger')}>
                  权重合计 {weightSum}%
                </span>
                {editor.dimensions.length === 0 ? (
                  <button type="button" className="text-[13px] font-semibold text-primary underline-offset-2 hover:underline" onClick={loadPresetDimensions}>
                    载入标准五维模板
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={editor.dimensions.length === 0}
                  className="rounded-md border border-primary/40 bg-primary/5 px-4 py-2.5 text-[13px] font-semibold text-primary shadow-sm hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => {
                    setEditor((e) => (e ? { ...e, dimensions: applyAiDemoToDimensions(e.dimensions) } : null))
                    toast.show('✨ weight_suggester：已按行业标杆微调权重（演示）', 'success')
                  }}
                >
                  ✨ AI 推荐权重
                </button>
              </div>
            </div>

            <div className="min-w-0 overflow-x-auto rounded-xl border border-divider shadow-sm">
              <table className="w-full min-w-0 table-fixed text-left text-[14px]">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[18%]" />
                  <col className="w-[52%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead className="border-b border-divider bg-page text-[13px] font-bold text-muted">
                  <tr>
                    <th className="px-3 py-3 sm:px-4">维度名称</th>
                    <th className="px-3 py-3 sm:px-4">权重(%)</th>
                    <th className="px-3 py-3 sm:px-4">指标列表（分数范围）</th>
                    <th className="px-3 py-3 text-end sm:px-4">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {editor.dimensions.map((d) => (
                    <tr key={d.id} className="bg-surface">
                      <td className="px-3 py-4 align-top sm:px-4">
                        <input className="w-full max-w-full rounded-md border border-divider px-2 py-2.5 text-[14px] font-semibold text-foreground shadow-sm sm:px-3" value={d.name} onChange={(e) => setEditor({ ...editor, dimensions: editor.dimensions.map((x) => (x.id === d.id ? { ...x, name: e.target.value } : x)) })} />
                      </td>
                      <td className="px-3 py-4 align-top sm:px-4">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          className="mb-2 block h-2 w-full max-w-full cursor-pointer accent-primary"
                          value={d.weightPct}
                          onChange={(e) =>
                            setEditor({
                              ...editor,
                              dimensions: editor.dimensions.map((x) => (x.id === d.id ? { ...x, weightPct: Number(e.target.value) } : x)),
                            })
                          }
                        />
                        <input
                          type="number"
                          className="w-20 rounded-md border border-divider px-2 py-2 text-[13px] shadow-sm"
                          value={d.weightPct}
                          onChange={(e) =>
                            setEditor({
                              ...editor,
                              dimensions: editor.dimensions.map((x) => (x.id === d.id ? { ...x, weightPct: Math.min(100, Math.max(0, Number(e.target.value))) } : x)),
                            })
                          }
                        />
                      </td>
                      <td className="min-w-0 px-3 py-4 align-top text-[13px] text-muted sm:px-4">
                        <ul className="space-y-2">
                          {d.indicators.map((n) => (
                            <li key={n.id} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-3">
                              <span className="min-w-0 break-words text-foreground">• {n.name}</span>
                              <span className="rounded-md bg-page px-2 py-0.5 font-mono text-[12px] text-muted ring-1 ring-divider">
                                ({n.minScore}-{n.maxScore})
                              </span>
                              <button type="button" className="text-[13px] font-semibold text-primary hover:underline" onClick={() => setIndModal({ dimId: d.id, indicator: { ...n } })}>
                                编辑指标
                              </button>
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className="mt-3 text-[13px] font-semibold text-primary hover:underline"
                          onClick={() =>
                            setIndModal({
                              dimId: d.id,
                              indicator: { id: newIndId(), name: '新指标', minScore: 0, maxScore: 10 },
                            })
                          }
                        >
                          ＋ 添加指标
                        </button>
                      </td>
                      <td className="px-3 py-4 align-top text-end sm:px-4">
                        <button
                          type="button"
                          className="text-[13px] font-semibold text-danger hover:underline"
                          onClick={() => setEditor({ ...editor, dimensions: editor.dimensions.filter((x) => x.id !== d.id) })}
                        >
                          删除维度
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="w-fit rounded-lg border border-dashed border-primary/50 bg-primary/5 px-5 py-2.5 text-[13px] font-bold text-primary hover:bg-primary/10"
              onClick={() =>
                setEditor({
                  ...editor,
                  dimensions: [
                    ...editor.dimensions,
                    {
                      id: newDimId(),
                      name: '新维度',
                      weightPct: 0,
                      indicators: [{ id: newIndId(), name: '新指标', minScore: 0, maxScore: 10 }],
                    },
                  ],
                })
              }
            >
              ＋ 添加维度
            </button>

            <div className="rounded-xl border border-divider bg-page p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="text-[15px] font-bold text-foreground">等级规则</span>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">{editor.gradeRuleSummary}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-md border border-divider bg-surface px-4 py-2 text-[13px] font-semibold text-primary shadow-sm hover:bg-page"
                  onClick={() => {
                    const t = window.prompt('编辑等级规则（一行摘要）', editor.gradeRuleSummary)
                    if (t !== null) setEditor({ ...editor, gradeRuleSummary: t })
                  }}
                >
                  编辑
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-divider bg-surface p-5 shadow-sm">
              <p className="text-[15px] font-bold text-foreground">评审模板</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label className="block text-[13px] font-semibold text-muted">
                  专家评分表模板
                  <input className="mt-2 w-full rounded-md border border-divider px-3 py-2.5 text-[14px] text-foreground shadow-sm" value={editor.reviewTemplateScore ?? ''} onChange={(e) => setEditor({ ...editor, reviewTemplateScore: e.target.value })} />
                </label>
                <label className="block text-[13px] font-semibold text-muted">
                  评审意见模板
                  <input className="mt-2 w-full rounded-md border border-divider px-3 py-2.5 text-[14px] text-foreground shadow-sm" value={editor.reviewTemplateOpinion ?? ''} onChange={(e) => setEditor({ ...editor, reviewTemplateOpinion: e.target.value })} />
                </label>
                <label className="block text-[13px] font-semibold text-muted">
                  风险提示模板
                  <input className="mt-2 w-full rounded-md border border-divider px-3 py-2.5 text-[14px] text-foreground shadow-sm" value={editor.reviewTemplateRisk ?? ''} onChange={(e) => setEditor({ ...editor, reviewTemplateRisk: e.target.value })} />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-divider bg-surface p-5 shadow-sm">
              <label className="block text-[15px] font-bold text-foreground">背景知识库</label>
              <p className="mt-2 text-[13px] text-muted">从知识库模块选择关联（演示下拉）。</p>
              <select
                className="mt-3 w-full max-w-xl rounded-md border border-divider px-3 py-2.5 text-[14px] shadow-sm"
                value={editor.knowledgeBaseLabel ?? KB_OPTIONS[3]}
                onChange={(e) => setEditor({ ...editor, knowledgeBaseLabel: e.target.value })}
              >
                {KB_OPTIONS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-divider bg-surface p-5 shadow-sm">
              <button type="button" className="flex w-full items-center justify-between text-left text-[15px] font-bold text-foreground" onClick={() => setAdvancedOpen((v) => !v)}>
                高级设置（按项目来源 / 入孵类型差异化）
                <span className="text-muted">{advancedOpen ? '▾' : '▸'}</span>
              </button>
              {advancedOpen ? (
                <div className="mt-4 space-y-4 text-[13px]">
                  <p className="text-muted">为空表示不限；勾选后仅对匹配主体/入孵类型应用本权重方案（演示）。</p>
                  <div>
                    <p className="font-semibold text-foreground">项目来源</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {ENTITY_OPTS.map((src) => (
                        <label key={src} className="flex cursor-pointer items-center gap-2">
                          <input type="checkbox" checked={(editor.applyEntitySources ?? []).includes(src)} onChange={() => toggleSource(src)} />
                          {src}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">入孵类型</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {INCUB_OPTS.map((inc) => (
                        <label key={inc} className="flex cursor-pointer items-center gap-2">
                          <input type="checkbox" checked={(editor.applyIncubationTypes ?? []).includes(inc)} onChange={() => toggleInc(inc)} />
                          {inc}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={indModal !== null}
        title="指标"
        onClose={() => setIndModal(null)}
        panelClassName="w-full max-w-[min(560px,96vw)] p-5 sm:p-6"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-md border px-3 py-2 text-[13px]" onClick={() => setIndModal(null)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 text-[13px] font-bold text-white"
              onClick={() => {
                if (!editor || !indModal) return
                const { dimId, indicator } = indModal
                if (!indicator.name.trim()) {
                  toast.show('请填写指标名称', 'warning')
                  return
                }
                setEditor({
                  ...editor,
                  dimensions: editor.dimensions.map((dim) => {
                    if (dim.id !== dimId) return dim
                    const exists = dim.indicators.some((i) => i.id === indicator.id)
                    const nextInds = exists ? dim.indicators.map((i) => (i.id === indicator.id ? { ...indicator } : i)) : [...dim.indicators, indicator]
                    return { ...dim, indicators: nextInds }
                  }),
                })
                setIndModal(null)
              }}
            >
              确定
            </button>
          </div>
        }
      >
        {indModal ? (
          <div className="space-y-4 text-[14px]">
            <label className="block text-[13px] font-semibold text-muted">
              指标名称
              <input className="mt-2 w-full rounded-md border border-divider px-3 py-2.5 text-[14px] text-foreground shadow-sm" value={indModal.indicator.name} onChange={(e) => setIndModal({ ...indModal, indicator: { ...indModal.indicator, name: e.target.value } })} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-[13px] font-semibold text-muted">
                最低分
                <input
                  type="number"
                  className="mt-2 w-full rounded-md border border-divider px-3 py-2.5 text-[14px] shadow-sm"
                  value={indModal.indicator.minScore}
                  onChange={(e) => setIndModal({ ...indModal, indicator: { ...indModal.indicator, minScore: Number(e.target.value) } })}
                />
              </label>
              <label className="text-[13px] font-semibold text-muted">
                最高分
                <input
                  type="number"
                  className="mt-2 w-full rounded-md border border-divider px-3 py-2.5 text-[14px] shadow-sm"
                  value={indModal.indicator.maxScore}
                  onChange={(e) => setIndModal({ ...indModal, indicator: { ...indModal.indicator, maxScore: Number(e.target.value) } })}
                />
              </label>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={formulaEditId !== null}
        title="公式编辑（演示）"
        onClose={() => setFormulaEditId(null)}
        panelClassName="max-w-xl"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-md border px-3 py-2 text-[13px]" onClick={() => setFormulaEditId(null)}>
              关闭
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 text-[13px] font-bold text-white"
              onClick={() => {
                if (!formulaEditId) return
                setFormulas((fs) => fs.map((g) => (g.id === formulaEditId ? { ...g, expression: feExpr } : g)))
                toast.show('表达式已写入（草稿）', 'success')
                setFormulaEditId(null)
              }}
            >
              保存
            </button>
          </div>
        }
      >
        <textarea rows={6} className="w-full rounded-lg border px-3 py-2 font-mono text-[13px]" value={feExpr} onChange={(e) => setFeExpr(e.target.value)} />
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {['维度得分', '+', '-', '*', '/', '( )', '0.35'].map((t) => (
            <button key={t} type="button" className="rounded border px-2 py-1 hover:border-primary" onClick={() => setFeExpr((s) => (s ? `${s} ${t}` : t))}>
              {t}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
