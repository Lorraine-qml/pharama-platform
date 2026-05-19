export default function DataAssetsPage() {
  return (
    <div className="rounded-[var(--radius-panel)] border border-divider bg-surface p-8 shadow-[var(--shadow-card)]">
      <p className="text-[14px] leading-relaxed text-muted">
        <strong className="text-foreground">鹰翼数据中台 · 数据资产目录（占位）</strong>
        ：汇聚主数据、指标与接口资产清单；支持血缘检索与责任人视图（演示数据稍后接入）。
      </p>
      <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-divider bg-page px-6 py-16 text-center text-[13px] text-muted">
        资产分层视图 / 检索 / 导出占位
      </div>
    </div>
  )
}
