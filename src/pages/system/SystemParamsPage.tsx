import { useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'

type ParamRow = { id: string; group: string; label: string; value: string; hint?: string }

const INITIAL: ParamRow[] = [
  { id: 'p1', group: '基础设置', label: '平台名称', value: '生物医药孵化运营平台' },
  { id: 'p2', group: '基础设置', label: '登录超时时间', value: '30 分钟', hint: '与会话策略联动' },
  { id: 'p3', group: '基础设置', label: '密码复杂度', value: '字母+数字，至少 8 位' },
  { id: 'p4', group: '基础设置', label: '日志保留天数', value: '180', hint: '到期自动归档或清理策略' },
  { id: 'p5', group: 'AI 服务', label: '默认大模型', value: 'GPT-4' },
  { id: 'p6', group: 'AI 服务', label: 'AI 调用日限额', value: '1000 次/用户' },
  { id: 'p7', group: 'AI 服务', label: '敏感词过滤', value: '启用' },
  { id: 'p8', group: '通知设置', label: '邮件服务器', value: 'smtp.example.com' },
  { id: 'p9', group: '通知设置', label: '短信网关', value: '阿里云' },
]

export default function SystemParamsPage() {
  const toast = useToast()
  const [rows, setRows] = useState(INITIAL)
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  function startEdit(row: ParamRow) {
    setEditId(row.id)
    setDraft(row.value)
  }

  function save(row: ParamRow) {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, value: draft } : r)))
    toast.show(`${row.label} 已保存为「${draft}」（演示）`, 'success')
    setEditId(null)
  }

  return (
    <div className="rounded-[var(--radius-panel)] border border-divider bg-surface px-6 py-6 shadow-[var(--shadow-card)]">
      <h2 className="border-b border-divider pb-3 text-[17px] font-bold text-foreground">系统参数配置</h2>
      <p className="mt-3 text-[13px] text-muted">
        行内点击「编辑」进入输入态，保存后即时写入配置中心并联机审计（演示交互）。
      </p>

      {(['基础设置', 'AI 服务', '通知设置'] as const).map((g) => (
        <section key={g} className="mt-8">
          <h3 className="mb-4 text-[14px] font-bold text-primary">参数组：{g}</h3>
          <ul className="divide-y divide-divider rounded-[var(--radius-card)] border border-divider bg-page/40">
            {rows
              .filter((r) => r.group === g)
              .map((row) => (
                <li key={row.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <span className="text-[13px] font-semibold text-foreground">{row.label}</span>
                    {row.hint ? <p className="mt-1 text-[11px] text-muted">{row.hint}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {editId === row.id ? (
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="min-w-[200px] flex-1 rounded-[var(--radius-card)] border border-primary px-3 py-2 text-[13px] outline-none"
                      />
                    ) : (
                      <span className="text-[13px] text-muted">{row.value}</span>
                    )}
                    {editId === row.id ? (
                      <>
                        <button type="button" className="rounded-[var(--radius-button)] bg-primary px-4 py-1.5 text-[12px] font-semibold text-white" onClick={() => save(row)}>
                          保存
                        </button>
                        <button type="button" className="text-[12px] text-muted hover:text-foreground" onClick={() => setEditId(null)}>
                          取消
                        </button>
                      </>
                    ) : (
                      <button type="button" className={cn('text-[12px] font-semibold text-primary hover:underline')} onClick={() => startEdit(row)}>
                        编辑
                      </button>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
