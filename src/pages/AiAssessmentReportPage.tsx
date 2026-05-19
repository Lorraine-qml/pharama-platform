import { useState } from 'react'
import { ASSESSMENT_AXES } from '../data/mock'
import { AiBadge, AiContentToolbar } from '../components/AiPanels'
import { RadarChart } from '../components/RadarChart'
import { Modal } from '../components/Modal'
import { cn } from '../utils/cn'
import { useToast } from '../components/ToastProvider'

export default function AiAssessmentReportPage() {
  const toast = useToast()
  const axes = ASSESSMENT_AXES.map((x) => ({ key: x.key, value: x.score }))
  const [basisKey, setBasisKey] = useState<string | null>(null)
  const [advantageEdited, setAdvantageEdited] = useState(false)
  const [advantageText, setAdvantageText] = useState(
    '团队具备基因治疗端到端管线经验，先导分子临床前数据完整；与园区内 CRO 与中试平台可做 week-level 耦合。',
  )
  const [spaceType, setSpaceType] = useState<'实体' | '虚拟' | '观察'>('实体')

  const basis = ASSESSMENT_AXES.find((a) => a.key === basisKey)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border border-divider bg-surface px-6 py-4 shadow-card">
        <div className="flex flex-wrap gap-6 text-[14px]">
          <div>
            <span className="text-muted">企业：</span>
            <span className="font-semibold text-foreground">北海基因</span>
          </div>
          <div>
            <span className="text-muted">状态：</span>
            <span className="rounded-[var(--radius-button)] bg-primary-light px-2 py-0.5 text-[12px] font-medium text-primary">
              待评估
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-[var(--radius-button)] border border-divider px-4 py-2 text-[13px] hover:bg-page"
            onClick={() => toast.show('触发重新评估任务（演示）', 'warning')}
          >
            重新评估
          </button>
          <button
            type="button"
            className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-hover"
            onClick={() => toast.show('专家评审流程已发起', 'success')}
          >
            发起专家评审
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px,minmax(0,1fr),280px]">
        {/* 左侧资料 */}
        <section className="rounded-[var(--radius-card)] border border-divider bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-foreground">
            📁 <span>企业资料</span>
          </div>
          <ul className="space-y-2 text-[13px] text-muted">
            {['BP.pdf', '专利.pdf', '管线.xls'].map((f) => (
              <li
                key={f}
                className="rounded-[var(--radius-button)] border border-divider px-3 py-2 hover:border-primary hover:text-primary"
              >
                {f}
              </li>
            ))}
          </ul>
        </section>

        {/* 中间 AI报告 */}
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-card">
          <header className="mb-6 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-[13px] text-muted">综合评分</p>
              <p className="text-[28px] font-bold text-primary">
                85 <span className="text-[14px] font-medium text-muted">(优秀)</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AiBadge compact />
              <span className="text-[12px] text-muted">人机协同可编辑段落</span>
            </div>
          </header>

          <div className="flex flex-wrap items-start gap-10">
            <RadarChart axes={axes} onAxisClick={setBasisKey} />
            <div className="max-w-xl flex-1 space-y-4 text-[14px]">
              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-foreground">优势</h3>
                <div
                  className={cn(
                    'rounded-[var(--radius-card)] border p-3',
                    advantageEdited ? 'border-warning bg-warning/10' : 'border-divider bg-page',
                  )}
                >
                  <textarea
                    value={advantageText}
                    onChange={(e) => {
                      setAdvantageText(e.target.value)
                      setAdvantageEdited(true)
                    }}
                    className="min-h-[80px] w-full resize-none bg-transparent text-[14px] text-foreground outline-none"
                  />
                  {advantageEdited ? (
                    <p className="mt-2 text-[11px] text-warning">● 人工修正 · 已记录审计日志（演示）</p>
                  ) : null}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-foreground">风险</h3>
                <p className="rounded-[var(--radius-card)] border border-divider bg-page p-3 text-muted">
                  审评沟通节奏较快，需对齐 GLP/Tox 时间节点；知识产权保护策略待补强。
                </p>
              </div>
              <div className="rounded-[var(--radius-card)] border border-primary-light bg-primary-light/50 p-4">
                <h3 className="mb-2 text-[13px] font-semibold text-foreground">AI 结论</h3>
                <p>
                  建议<strong>实体入驻</strong>
                  ，推荐空间：
                  <span className="font-medium text-primary"> B栋 3楼 共享实验室</span>
                </p>
                <AiContentToolbar
                  onRegenerate={() => toast.show('正在重新生成结论…（演示骨架）', 'info')}
                  onSources={() =>
                    toast.show('引用：专利库、路演BP、企业信用报告（演示）', 'info')
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* 右侧操作 */}
        <section className="rounded-[var(--radius-card)] border border-divider bg-surface p-5 shadow-card">
          <h3 className="mb-4 text-[15px] font-semibold text-foreground">推荐入驻类型</h3>
          <div className="space-y-3 text-[13px]">
            {(['实体', '虚拟', '观察'] as const).map((t, i) => (
              <label
                key={t}
                className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-card)] border border-divider px-4 py-3 hover:border-primary"
              >
                <input
                  type="radio"
                  name="itype"
                  checked={spaceType === t}
                  onChange={() => setSpaceType(t)}
                  aria-label={`${t}入驻`}
                  className="mt-1"
                />
                <span>
                  {['●', '○', '○'][i]} {t}入驻{t === '观察' ? '培育' : ''}
                </span>
              </label>
            ))}
          </div>
          <button
            type="button"
            className="mt-6 w-full rounded-[var(--radius-button)] bg-primary py-3 text-[14px] font-medium text-white hover:bg-primary-hover"
            onClick={() => toast.show('正式报告 PDF 生成中…', 'info')}
          >
            生成正式报告
          </button>
        </section>
      </div>

      <Modal
        open={Boolean(basis)}
        title={basis ? `${basis.key} · 评分依据` : ''}
        onClose={() => setBasisKey(null)}
      >
        {basis ? <p className="text-[14px] leading-relaxed text-foreground">{basis.basis}</p> : null}
      </Modal>
    </div>
  )
}
