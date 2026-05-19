import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '../../components/Modal'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { downloadCsv } from '../eco/ecoDownload'
import { EVAL_RISK_ROWS, type RiskAlertRow } from './evalShared'

type Rules = {
  inactiveDays: number
  pipelineStallDays: number
  financingPendingDays: number
  contractWarnDays: number
}

const defaultRules: Rules = {
  inactiveDays: 30,
  pipelineStallDays: 90,
  financingPendingDays: 180,
  contractWarnDays: 30,
}

export default function EvalRiskAlertsPage() {
  const toast = useToast()
  const [rulesOpen, setRulesOpen] = useState(false)
  const [rules, setRules] = useState<Rules>(defaultRules)
  const [draft, setDraft] = useState<Rules>(defaultRules)
  const [level, setLevel] = useState<'全部' | RiskAlertRow['level']>('全部')
  const [typeQ, setTypeQ] = useState('全部')
  const [rows, setRows] = useState<RiskAlertRow[]>(EVAL_RISK_ROWS)
  const [ignoreTarget, setIgnoreTarget] = useState<RiskAlertRow | null>(null)
  const [ignoreReason, setIgnoreReason] = useState('')

  const types = useMemo(() => ['全部', ...new Set(EVAL_RISK_ROWS.map((r) => r.type))], [])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (level !== '全部' && r.level !== level) return false
      if (typeQ !== '全部' && r.type !== typeQ) return false
      return true
    })
  }, [rows, level, typeQ])

  function openRules() {
    setDraft(rules)
    setRulesOpen(true)
  }

  function saveRules() {
    setRules(draft)
    setRulesOpen(false)
    toast.show('预警规则已保存（演示，未持久化）', 'success')
  }

  function exportCsv() {
    downloadCsv(
      `风险预警-${new Date().toISOString().slice(0, 10)}.csv`,
      ['预警类型', '项目名称', '风险描述', '严重程度'],
      filtered.map((r) => [r.type, r.projectName, r.desc, r.level]),
    )
    toast.show('已导出预警列表', 'success')
  }

  function confirmIgnore() {
    if (!ignoreTarget || !ignoreReason.trim()) {
      toast.show('请填写忽略原因', 'warning')
      return
    }
    setRows((prev) => prev.filter((r) => r.id !== ignoreTarget.id))
    setIgnoreTarget(null)
    setIgnoreReason('')
    toast.show('已忽略该预警并记录原因（演示）', 'success')
  }

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="⚠️ 风险预警"
        lines={[
          '演示预警清单与规则抽屉；「查看」跳转项目画像并锚定风险区块。',
          '忽略预警需填写原因；生产环境对接 risk_detector Skill 与持久化。',
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider pb-4">
        <h1 className="text-lg font-bold text-foreground">风险预警</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-md border border-divider bg-surface px-3 py-1.5 text-[13px] font-semibold hover:bg-muted/30" onClick={openRules}>
            规则配置
          </button>
          <button
            type="button"
            className="rounded-md border border-divider bg-surface px-3 py-1.5 text-[13px] font-semibold hover:bg-muted/30"
            onClick={() => toast.show('列表已刷新（演示）', 'success')}
          >
            刷新
          </button>
          <button type="button" className="rounded-md border border-divider bg-surface px-3 py-1.5 text-[13px] font-semibold hover:bg-muted/30" onClick={exportCsv}>
            导出
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[13px]">
        <label className="flex items-center gap-2">
          <span className="text-muted">严重程度</span>
          <select className="rounded-md border border-divider bg-surface px-2 py-1.5" value={level} onChange={(e) => setLevel(e.target.value as typeof level)}>
            {(['全部', '高', '中', '低'] as const).map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-muted">预警类型</span>
          <select className="rounded-md border border-divider bg-surface px-2 py-1.5" value={typeQ} onChange={(e) => setTypeQ(e.target.value)}>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-divider">
        <table className="w-full min-w-[800px] border-collapse text-left text-[13px]">
          <thead className="border-b border-divider bg-muted/20">
            <tr>
              <th className="px-3 py-2 font-semibold">预警类型</th>
              <th className="px-3 py-2 font-semibold">项目名称</th>
              <th className="px-3 py-2 font-semibold">风险描述</th>
              <th className="px-3 py-2 font-semibold">严重程度</th>
              <th className="px-3 py-2 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted">
                  暂无预警记录
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-divider/80">
                  <td className="px-3 py-2">{r.type}</td>
                  <td className="px-3 py-2 font-medium">{r.projectName}</td>
                  <td className="px-3 py-2 text-muted">{r.desc}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        r.level === '高'
                          ? 'text-red-600 dark:text-red-400'
                          : r.level === '中'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-muted'
                      }
                    >
                      {r.level}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/eval/portrait?projectId=${encodeURIComponent(r.projectId)}#risk-portrait`}
                        className="rounded border border-divider px-2 py-1 text-[12px] font-semibold text-primary hover:bg-muted/30"
                      >
                        查看
                      </Link>
                      <button type="button" className="rounded border border-divider px-2 py-1 text-[12px] hover:bg-muted/30" onClick={() => toast.show('辅导工单（演示）', 'success')}>
                        辅导
                      </button>
                      <button type="button" className="rounded border border-divider px-2 py-1 text-[12px] hover:bg-muted/30" onClick={() => toast.show('对接记录（演示）', 'success')}>
                        对接
                      </button>
                      <button type="button" className="rounded border border-divider px-2 py-1 text-[12px] hover:bg-muted/30" onClick={() => setIgnoreTarget(r)}>
                        忽略
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rulesOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <button type="button" className="absolute inset-0 bg-foreground/40" aria-label="关闭" onClick={() => setRulesOpen(false)} />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-divider bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-divider px-4 py-3">
              <h2 className="text-[16px] font-bold">预警规则</h2>
              <button type="button" className="text-muted hover:text-foreground" onClick={() => setRulesOpen(false)}>
                ✕
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4 text-[13px]">
              <RuleNum label="活跃度阈值：连续未登录（天）" value={draft.inactiveDays} onChange={(n) => setDraft((d) => ({ ...d, inactiveDays: n }))} />
              <RuleNum label="研发停滞阈值：管线无进展（天）" value={draft.pipelineStallDays} onChange={(n) => setDraft((d) => ({ ...d, pipelineStallDays: n }))} />
              <RuleNum label="融资风险阈值：融资需求发布后未成功（天）" value={draft.financingPendingDays} onChange={(n) => setDraft((d) => ({ ...d, financingPendingDays: n }))} />
              <RuleNum label="合同到期提前预警（天）" value={draft.contractWarnDays} onChange={(n) => setDraft((d) => ({ ...d, contractWarnDays: n }))} />
            </div>
            <div className="border-t border-divider p-4">
              <button type="button" className="w-full rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground hover:opacity-90" onClick={saveRules}>
                保存
              </button>
            </div>
          </aside>
        </div>
      )}

      <Modal
        open={ignoreTarget != null}
        title="忽略预警"
        onClose={() => {
          setIgnoreTarget(null)
          setIgnoreReason('')
        }}
        footer={
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setIgnoreTarget(null)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground" onClick={confirmIgnore}>
              确认忽略
            </button>
          </>
        }
      >
        <p className="text-[13px] text-muted">请填写忽略原因，系统将记录并减少同类推送（演示）。</p>
        <textarea
          className="mt-3 w-full rounded-md border border-divider bg-surface p-3 text-[13px]"
          rows={4}
          placeholder="原因…"
          value={ignoreReason}
          onChange={(e) => setIgnoreReason(e.target.value)}
        />
      </Modal>

      <p className="text-[12px] text-muted">当前生效阈值（演示）：连续 {rules.inactiveDays} 天未登录 · 管线 {rules.pipelineStallDays} 天无进展 · 融资 pending {rules.financingPendingDays} 天 · 合同提前 {rules.contractWarnDays} 天</p>
    </div>
  )
}

function RuleNum({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <span className="text-muted">{label}</span>
      <input
        type="number"
        min={1}
        className="mt-1 w-full rounded-md border border-divider bg-surface px-3 py-2"
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
      />
    </label>
  )
}
