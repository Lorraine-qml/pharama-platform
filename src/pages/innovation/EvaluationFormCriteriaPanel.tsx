import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'
import {
  COMPLIANCE_RISK_GUIDE,
  dimensionScoringGuide,
  EXPERT_REVIEW_DIM_META,
  findFormDimension,
  formDisplayLabel,
} from '../basicData/evaluationFormGuide'
import type { EvaluationForm } from '../basicData/basicDataTypes'

type Props = {
  form: EvaluationForm
  className?: string
}

export function EvaluationFormCriteriaPanel({ form, className }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[12px] leading-relaxed text-foreground">
          <span className="font-semibold">当前使用评价表：</span>
          {formDisplayLabel(form)}
          <span className="mt-1 block text-[11px] font-normal text-muted">
            评审维度由园区在「评价表管理」统一配置，与 AI 评估共用标准，便于对比校准。
          </span>
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-md border border-primary/30 bg-surface px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/5"
          aria-expanded={open}
        >
          ℹ️ 各维度评分标准{open ? '（收起）' : ''}
        </button>
      </div>

      {open ? (
        <ul className="mt-3 max-h-[220px] space-y-2 overflow-y-auto border-t border-primary/15 pt-3 text-[12px] text-muted">
          {EXPERT_REVIEW_DIM_META.map((m) => {
            const dim = findFormDimension(form, m.formKey)
            return (
              <li key={m.field}>
                <span className="font-semibold text-foreground">{m.label}</span>
                {dim ? ` — ${dimensionScoringGuide(dim)}` : ' — 与评价表「技术创新性」等维度对齐。'}
              </li>
            )
          })}
          <li>
            <span className="font-semibold text-foreground">合规风险</span> — {COMPLIANCE_RISK_GUIDE}
          </li>
          {form.dimensions
            .filter((d) => d.name.includes('产业'))
            .map((d) => (
              <li key={d.id} className="text-[11px]">
                <span className="font-semibold text-foreground">{d.name}</span>（AI 报告含此项，专家可在综合意见中补充）—{' '}
                {dimensionScoringGuide(d)}
              </li>
            ))}
        </ul>
      ) : null}

      <p className="mt-2 text-[11px] text-muted">
        运营可在
        <Link to="/basic/evaluation-forms" className="mx-0.5 font-semibold text-primary hover:underline" target="_blank" rel="noreferrer">
          基础数据 → 评价表管理
        </Link>
        调整维度与权重，并导出评分指南。
      </p>
    </div>
  )
}
