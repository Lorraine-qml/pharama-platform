import { useState } from 'react'
import { Drawer } from '../components/Drawer'
import { AiPanel } from '../components/AiPanels'
import { LEADS, type LeadRow } from '../data/mock'
import { useToast } from '../components/ToastProvider'
import { cn } from '../utils/cn'

export default function LeadsPoolPage() {
  const toast = useToast()
  const [aiHighlight, setAiHighlight] = useState(false)
  const [drawerLead, setDrawerLead] = useState<LeadRow | null>(null)
  const [method, setMethod] = useState<'电话' | '邮件' | '拜访'>('电话')
  const [note, setNote] = useState('')
  const [nextAt, setNextAt] = useState('')

  const showAiRow = (row: LeadRow) =>
    aiHighlight && (row.aiRating === 'S' || row.aiRating === 'A')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover"
          onClick={() => toast.show('已打开「新增线索」表单（演示）', 'info')}
        >
          + 新增线索
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-divider bg-surface p-4 shadow-card">
        <span className="text-[13px] text-muted">筛选</span>
        <select className="rounded-[var(--radius-button)] border border-divider bg-surface px-3 py-2 text-[13px]">
          <option>赛道：全部</option>
        </select>
        <select className="rounded-[var(--radius-button)] border border-divider bg-surface px-3 py-2 text-[13px]">
          <option>来源：全部</option>
        </select>
        <select className="rounded-[var(--radius-button)] border border-divider bg-surface px-3 py-2 text-[13px]">
          <option>状态：跟进中</option>
        </select>
        <input
          type="search"
          placeholder="搜索企业/线索"
          className="min-w-[200px] flex-1 rounded-[var(--radius-button)] border border-divider px-3 py-2 text-[13px]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] border border-divider bg-surface px-4 py-3 shadow-card">
        <button
          type="button"
          onClick={() => setAiHighlight((v) => !v)}
          className={cn(
            'inline-flex items-center gap-2 rounded-[var(--radius-button)] px-4 py-2 text-[13px] font-semibold transition-colors',
            aiHighlight ? 'bg-primary-light text-primary' : 'bg-page text-foreground',
          )}
        >
          ⚡ AI高潜力企业推荐
        </button>
        {aiHighlight ? (
          <span className="text-[12px] text-muted">已高亮 S/A 级线索行（#ECF3FF）</span>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-divider bg-surface shadow-card">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead className="border-b border-divider bg-page text-muted">
            <tr>
              <th className="px-4 py-3 font-medium"></th>
              <th className="px-4 py-3 font-medium">企业名称</th>
              <th className="px-4 py-3 font-medium">赛道</th>
              <th className="px-4 py-3 font-medium">来源</th>
              <th className="px-4 py-3 font-medium">AI评级</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">最近跟进</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {LEADS.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-divider',
                  showAiRow(row) && 'bg-primary-light',
                )}
              >
                <td className="px-4 py-3">
                  <input type="checkbox" aria-label={`选择 ${row.name}`} />
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {row.name}
                    {showAiRow(row) ? (
                      <span className="rounded-[var(--radius-button)] bg-primary-light px-2 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-primary/25">
                        ✨AI推荐
                      </span>
                    ) : null}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{row.track}</td>
                <td className="px-4 py-3 text-muted">{row.source}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-primary">{row.aiRating}</span>
                </td>
                <td className="px-4 py-3 text-muted">{row.status}</td>
                <td className="px-4 py-3 text-muted">{row.lastFollow ?? '—'}</td>
                <td className="px-4 py-3">
                  {row.aiRating === 'S' ? (
                    <button
                      type="button"
                      className="rounded-[var(--radius-button)] border border-divider px-3 py-1.5 hover:border-primary hover:text-primary"
                      onClick={() => setDrawerLead(row)}
                    >
                      🤝 快速跟进
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-[var(--radius-button)] border border-divider px-3 py-1.5 hover:border-primary hover:text-primary"
                      onClick={() => toast.show('打开线索详情抽屉（演示）', 'info')}
                    >
                      👁️ 查看详情
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={Boolean(drawerLead)}
        title={`跟进 · ${drawerLead?.name ?? ''}`}
        onClose={() => setDrawerLead(null)}
        footer={
          <button
            type="button"
            className="w-full rounded-[var(--radius-button)] bg-primary py-3 text-[14px] font-medium text-white hover:bg-primary-hover"
            onClick={() => {
              toast.show('跟进记录已保存', 'success')
              setDrawerLead(null)
              setNote('')
              setNextAt('')
            }}
          >
            保存并关闭
          </button>
        }
      >
        <div className="space-y-6">
          <AiPanel title="AI 话术与研判摘要">
            <p className="mb-3">
              建议从<strong>管线里程碑与 GLP 毒理排期</strong>切入；企业近期完成 A
              轮，对共享动物房与合规咨询有显性需求。
            </p>
            <blockquote className="border-l-2 border-primary pl-3 text-muted">
              “我们园区在基因治疗CXO拼图与审评沟通沙盘上，与贵司 II 期规划高度同频…”
            </blockquote>
          </AiPanel>

          <div>
            <h3 className="mb-3 text-[14px] font-semibold text-foreground">跟进表单</h3>
            <label className="mb-4 block">
              <span className="text-[12px] text-muted">跟进方式</span>
              <div className="mt-1 flex gap-3">
                {(['电话', '邮件', '拜访'] as const).map((m) => (
                  <label key={m} className="flex items-center gap-2 text-[13px]">
                    <input
                      type="radio"
                      name="method"
                      checked={method === m}
                      onChange={() => setMethod(m)}
                    />
                    {m}
                  </label>
                ))}
              </div>
            </label>
            <label className="mb-4 block">
              <span className="text-[12px] text-muted">沟通纪要</span>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-card)] border border-divider p-3 text-[13px]"
                placeholder="记录本次沟通要点…"
              />
            </label>
            <label className="block">
              <span className="text-[12px] text-muted">下次跟进时间</span>
              <input
                type="datetime-local"
                value={nextAt}
                onChange={(e) => setNextAt(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-button)] border border-divider px-3 py-2 text-[13px]"
              />
            </label>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
