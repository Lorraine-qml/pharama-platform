import { useState } from 'react'
import { useToast } from '../components/ToastProvider'

type Msg =
  | { role: 'user'; text: string }
  | { role: 'ai'; text: string; viz?: 'bar' }

export default function AiQueryPage() {
  const toast = useToast()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'user', text: '上个月AI大模型调用次数最多的企业？' },
    {
      role: 'ai',
      text: '上个月调用次数 TOP3：1. 北海基因(156次)，2. 智药科技(98次)，3. 瑞康生物(71次)。柱状图见图示。',
      viz: 'bar',
    },
    { role: 'user', text: '他们的主要用途？' },
    {
      role: 'ai',
      text: '北海基因主要用于入驻评估重写、申报材料风险校对、周报摘要与自然语言日程对齐等场景。',
    },
  ])

  function send() {
    const trimmed = input.trim()
    if (!trimmed) return
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: trimmed },
      {
        role: 'ai',
        text: `（演示）已对「${trimmed}」执行 NL2SQL 草案与安全审计；可按「追问」继续细化粒度。`,
      },
    ])
    setInput('')
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <p className="text-[13px] text-muted">
          自然语言查询、历史对话追问、柱状图占位；导出 PDF/Excel 走审计链路 （演示）。
        </p>
      </header>

      <section className="flex flex-wrap gap-3 rounded-[var(--radius-card)] border border-primary-light bg-primary-light/30 p-4">
        <span className="text-[20px]" aria-hidden>💬</span>
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          <input
            className="min-w-[200px] flex-1 rounded-[var(--radius-button)] border border-divider px-4 py-2.5 text-[14px]"
            placeholder="输入自然语言查询..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                send()
              }
            }}
          />
          <button
            type="button"
            className="rounded-[var(--radius-button)] bg-primary px-6 py-2.5 text-[14px] font-medium text-white hover:bg-primary-hover"
            onClick={send}
          >
            发送
          </button>
        </div>
      </section>

      <button
        type="button"
        className="self-end rounded-[var(--radius-button)] border border-divider px-4 py-2 text-[12px]"
        onClick={() => toast.show('打开导出向导：PDF / Excel（占位）', 'info')}
      >
        导出当前结果为报表…
      </button>

      <div className="space-y-4 rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-card">
        <h2 className="text-[14px] font-semibold text-foreground">历史对话</h2>
        <div className="space-y-4">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div
                key={`u-${String(i)}`}
                className="ml-auto max-w-[88%] rounded-[var(--radius-card)] bg-page px-4 py-3 text-[14px] text-foreground"
              >
                <span className="mr-2 text-muted">我：</span>
                {m.text}
              </div>
            ) : (
              <div
                key={`a-${String(i)}`}
                className="max-w-[95%] rounded-[var(--radius-card)] border border-primary-light bg-primary-light/35 px-4 py-4 text-[14px] leading-relaxed text-foreground"
              >
                <div className="mb-3 flex justify-between gap-2">
                  <strong className="text-primary">AI</strong>
                  <span className="text-[11px] text-muted">✨ 生成 · 可审计</span>
                </div>
                {m.text}
                {m.viz === 'bar' ? <DemoBarChart /> : null}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}

function DemoBarChart() {
  const data = [
    { n: '北海基因', v: 156 },
    { n: '智药科技', v: 98 },
    { n: '瑞康生物', v: 71 },
  ]
  const max = Math.max(...data.map((d) => d.v))
  return (
    <div className="mt-4 rounded-[var(--radius-card)] border border-divider bg-surface px-5 py-4">
      <p className="mb-5 text-[12px] text-muted">柱状图占位</p>
      <div className="flex h-[160px] items-end justify-around gap-4 border-b border-l border-divider pb-8 pl-2">
        {data.map((d) => (
          <div key={d.n} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="flex w-[36px] items-end rounded-t-[var(--radius-button)] bg-primary"
              style={{ height: `${(d.v / max) * 120}px`, minHeight: '16px' }}
              aria-hidden
            />
            <span className="text-center text-[11px] text-muted">{d.n}</span>
            <span className="text-[12px] font-semibold text-primary">{d.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
