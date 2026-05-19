export default function AiWorkflowPage() {
  const nodes: {
    id: string
    label: string
    left: string
    top: string
    highlight?: boolean
  }[] = [
    { id: 'start', label: '开始 · 表单提交触发', left: '8%', top: '4%' },
    { id: 'read', label: '读取企业档案', left: '18%', top: '28%' },
    { id: 'skill', label: '调用企业研判 Skill', left: '46%', top: '28%', highlight: true },
    { id: 'write', label: '写入评估报告', left: '68%', top: '56%' },
    { id: 'end', label: '结束 · 推送通知', left: '74%', top: '82%' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-4">
        <div className="flex gap-2">
          <button type="button" className="rounded-[var(--radius-button)] border border-divider px-4 py-2 text-[13px]">
            保存草稿
          </button>
          <button type="button" className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[13px] font-semibold text-white">
            发布为智能体
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[224px,minmax(0,1fr),280px]">
        <nav className="rounded-[var(--radius-card)] border border-divider bg-surface p-4 text-[13px] shadow-card">
          <strong className="text-foreground">工具箱</strong>
          <ul className="mt-4 space-y-4">
            <li>
              <span className="text-muted">触发</span>
              <div className="mt-2 space-y-1">
                <div className="rounded-[var(--radius-button)] border border-dashed border-divider px-3 py-2 hover:border-primary">
                  定时触发
                </div>
                <div className="rounded-[var(--radius-button)] border border-dashed border-divider px-3 py-2 hover:border-primary">
                  表单提交
                </div>
              </div>
            </li>
            <li>
              <span className="text-muted">动作</span>
              <div className="mt-2 space-y-1">
                <div className="rounded-[var(--radius-button)] border border-dashed border-divider px-3 py-2 hover:border-primary">
                  调用大模型
                </div>
                <div className="rounded-[var(--radius-button)] border border-dashed border-divider px-3 py-2 hover:border-primary">
                  发送通知
                </div>
              </div>
            </li>
            <li>
              <span className="text-muted">Skill库</span>
              <div className="mt-2 space-y-1">
                {['企业研判', 'BP生成', '风险评估'].map((s) => (
                  <div
                    key={s}
                    className="rounded-[var(--radius-button)] bg-primary-light/60 px-3 py-2 text-primary hover:ring-1 hover:ring-primary"
                  >
                    {s}
                  </div>
                ))}
              </div>
            </li>
          </ul>
          <p className="mt-6 text-[11px] leading-relaxed text-muted">拖拽占位：V3 接入低代码画布 & 节点连线编辑器。</p>
        </nav>

        <div className="relative min-h-[420px] overflow-hidden rounded-[var(--radius-panel)] border border-divider bg-page shadow-inner">
          <svg className="absolute inset-0 size-full pointer-events-none" aria-hidden>
            <defs>
              <marker id="arrow-h" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="var(--color-primary)" />
              </marker>
            </defs>
            <polyline
              points="140,140 520,140"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeDasharray="4 4"
              markerEnd="url(#arrow-h)"
            />
            <polyline points="740,208 740,352" fill="none" stroke="var(--color-primary)" strokeWidth="2" markerEnd="url(#arrow-h)" />
            <polyline points="600,352 740,452" fill="none" stroke="var(--color-primary)" strokeWidth="2" markerEnd="url(#arrow-h)" />
          </svg>

          {nodes.map((n) => (
            <div
              key={n.id}
              className={
                'absolute w-[155px] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-card)] border px-4 py-3 text-center text-[12px] font-medium shadow-card ' +
                (n.highlight
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-divider bg-surface text-foreground')
              }
              style={{ left: n.left, top: n.top }}
            >
              {n.label}
            </div>
          ))}
          <button
            type="button"
            className="absolute bottom-4 left-4 text-[11px] text-muted underline-offset-4 hover:text-primary hover:underline"
          >
            添加节点占位
          </button>
        </div>

        <aside className="rounded-[var(--radius-card)] border border-divider bg-surface p-4 text-[13px] shadow-card">
          <strong className="text-foreground">属性配置 · 选中节点</strong>
          <dl className="mt-4 space-y-3 text-[12px]">
            <div>
              <dt className="text-muted">Skill</dt>
              <dd className="mt-1 font-medium text-primary">企业研判</dd>
            </div>
            <div>
              <dt className="text-muted">输入</dt>
              <dd className="mt-1">企业ID：`ent_bhx_001`</dd>
            </div>
            <div>
              <dt className="text-muted">温度</dt>
              <dd className="mt-1">0.42</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
