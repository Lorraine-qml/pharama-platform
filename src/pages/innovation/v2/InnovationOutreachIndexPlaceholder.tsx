import { Link } from 'react-router-dom'
import { useInnovationInvestmentV2 } from './InnovationInvestmentV2Context'

export default function InnovationOutreachIndexPlaceholder() {
  const v = useInnovationInvestmentV2()
  const first = v.leads[0]

  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-6 px-8 py-14 text-center text-[13px] text-muted">
      <div>
        <p className="text-[22px]" aria-hidden>
          📂
        </p>
        <p className="mt-4 text-[14px] font-semibold text-foreground">请选择左侧线索</p>
        <p className="mt-2 max-w-lg">
          「行业趋势」页的采集 / 匹配 / 上下游 / 高潜推荐均支持
          <strong className="text-primary">一键转线索</strong>。
        </p>
      </div>
      {first ? (
        <Link
          className="rounded-lg bg-primary px-5 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-primary-hover"
          to={`/innovation/outreach/leads/${first.id}`}
        >
          打开最近线索
        </Link>
      ) : (
        <span className="text-[12px]">线索池暂无数据，可先前往趋势页入库。</span>
      )}
      <Link to="/innovation/industry-trends" className="text-[12px] font-semibold text-primary hover:underline">
        转到行业趋势分析
      </Link>
    </div>
  )
}
