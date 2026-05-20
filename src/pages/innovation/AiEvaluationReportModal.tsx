import { useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { RadarChart } from '../../components/RadarChart'
import { useToast } from '../../components/ToastProvider'
import { OPS_MODAL_PANEL } from './innovationModalShared'
import { dimBasisText } from './aiEvaluationDimBasis'
import type { SjProject } from './innovationTypes'

type Props = {
  project: SjProject | null
  open: boolean
  onClose: () => void
}

export function AiEvaluationReportModal({ project, open, onClose }: Props) {
  const toast = useToast()
  const [basisKey, setBasisKey] = useState<string | null>(null)
  const report = project?.aiReport

  const highlighted = useMemo(() => {
    if (!basisKey || !report) return null
    return report.dims.find((d) => d.key === basisKey) ?? null
  }, [basisKey, report])

  if (!project || !report) return null

  return (
    <Modal
      open={open}
      title={`AI 评估报告 - ${project.name}`}
      onClose={onClose}
      closeOnOverlayClick={false}
      panelClassName={`${OPS_MODAL_PANEL} max-w-[820px]`}
      fillHeight
      footer={
        <>
          <button
            type="button"
            className="rounded-md border border-divider px-4 py-2 text-[13px] font-semibold hover:border-primary/40"
            onClick={() => toast.show('导出 PDF（演示）', 'info')}
          >
            导出 PDF
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
            onClick={onClose}
          >
            关闭
          </button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto text-[13px]">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-[15px] font-bold text-foreground">
            综合评分：{report.overall} 分
            <span className="ml-2 text-[14px] font-semibold text-primary">（{report.levelLabel}）</span>
          </p>
          {project.aiEvaluatedAt ? (
            <p className="text-[12px] text-muted">评估时间：{project.aiEvaluatedAt}</p>
          ) : null}
        </div>

        <div className="flex flex-col items-center rounded-xl border border-divider bg-page/50 p-4 sm:flex-row sm:items-start sm:gap-6">
          <RadarChart
            axes={report.dims.map((d) => ({ key: d.key, value: d.value }))}
            size={240}
            onAxisClick={setBasisKey}
          />
          {highlighted ? (
            <div className="mt-2 flex-1 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-[12px] text-foreground sm:mt-0">
              <p className="font-semibold">{highlighted.key} · {highlighted.value} 分</p>
              <p className="mt-1 text-muted">{dimBasisText(highlighted.key, highlighted.value)}</p>
            </div>
          ) : (
            <p className="flex-1 text-[12px] text-muted sm:pt-8">点击雷达图顶点查看该维度评分依据</p>
          )}
        </div>

        <div>
          <p className="mb-3 font-bold text-foreground">各维度得分明细</p>
          <ul className="space-y-2.5">
            {report.dims.map((d) => (
              <li key={d.key} className="rounded-lg border border-divider bg-page/40 px-3 py-2">
                <span className="font-semibold text-foreground">{d.key}</span>
                <span className="mx-1 text-muted">·</span>
                <span className="font-semibold tabular-nums text-primary">{d.value} 分</span>
                <span className="text-muted"> — {dimBasisText(d.key, d.value)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-divider bg-page/40 p-3">
            <p className="font-bold text-foreground">优势分析</p>
            <p className="mt-2 leading-relaxed text-muted">{report.pros}</p>
          </div>
          <div className="rounded-lg border border-divider bg-page/40 p-3">
            <p className="font-bold text-foreground">风险提示</p>
            <p className="mt-2 leading-relaxed text-muted">{report.risks}</p>
          </div>
        </div>

        <p className="rounded-lg bg-primary/8 px-4 py-3 leading-relaxed text-foreground ring-1 ring-primary/15">
          <span className="font-bold">AI 建议：</span>
          {report.suggest}
        </p>
      </div>
    </Modal>
  )
}
