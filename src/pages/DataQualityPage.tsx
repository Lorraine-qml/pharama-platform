export default function DataQualityPage() {
  return (
    <div className="rounded-[var(--radius-panel)] border border-divider bg-surface p-8 shadow-[var(--shadow-card)]">
      <p className="text-[14px] leading-relaxed text-muted">
        <strong className="text-foreground">鹰翼数据中台 · 质量规则（占位）</strong>
        ：配置校验规则、告警阈值与工单派发；与孵化业务指标对齐（演示）。
      </p>
      <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-divider bg-page px-6 py-16 text-center text-[13px] text-muted">
        规则列表 / 运行记录 / 告警占位
      </div>
    </div>
  )
}
