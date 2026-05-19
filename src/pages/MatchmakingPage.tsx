import { Link } from 'react-router-dom'
import { AiBadge } from '../components/AiPanels'
import { useToast } from '../components/ToastProvider'

export default function MatchmakingPage() {
  const toast = useToast()
  const deviceParams = '?resource=facs&purpose=cells'
  const expertParams = '?consult=car-t'

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[14px] text-muted">基于近期「细胞治疗」关注生成推荐卡片；点击带去申请 / 预约预填字段。</p>
      </div>

      <div className="flex flex-wrap gap-3 text-[13px]">
        <Link
          to="/resops/ai-match"
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          进入资源运营 · AI 供需撮合 V2（自然语言 + 组合方案）
        </Link>
      </div>

      <section className="rounded-[var(--radius-card)] border border-primary-light bg-gradient-to-br from-primary-light/80 to-surface px-6 py-5 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[22px]">🤖</span>
          <span className="text-[15px] font-semibold text-foreground">为您推荐（基于细胞治疗关注点）</span>
          <AiBadge compact />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <article className="flex flex-col rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-card">
          <header className="mb-4 flex justify-between gap-4">
            <span className="rounded-[var(--radius-button)] bg-page px-2 py-1 text-[12px] font-medium text-muted">
              设备
            </span>
            <span className="text-[12px] font-semibold text-primary">匹配度 96%</span>
          </header>
          <h2 className="text-[18px] font-semibold text-foreground">流式细胞仪</h2>
          <p className="mt-3 grow text-[13px] leading-relaxed text-muted">
            推荐理由：您近期在临床样本表征任务中重复使用「多色分型」模版，与该设备 SLA 与高维补偿库一致。
          </p>
          <Link
            to={`/resops/resource/res-flow${deviceParams}`}
            state={{ preset: deviceParams }}
            className="mt-6 rounded-[var(--radius-button)] bg-primary px-4 py-2.5 text-center text-[14px] font-medium text-white hover:bg-primary-hover"
            onClick={() => toast.show('表单已预填资源ID与用途', 'success')}
          >
            去申请
          </Link>
        </article>

        <article className="flex flex-col rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-card">
          <header className="mb-4 flex justify-between gap-4">
            <span className="rounded-[var(--radius-button)] bg-page px-2 py-1 text-[12px] font-medium text-muted">
              专家
            </span>
            <span className="text-[12px] font-semibold text-primary">匹配度 89%</span>
          </header>
          <h2 className="text-[18px] font-semibold text-foreground">李教授（CAR-T 专家）</h2>
          <p className="mt-3 grow text-[13px] leading-relaxed text-muted">
            推荐理由：您上传的周报多次提到「体内药效波动」，与其团队在肿瘤微环境模型的最新论文高度相关。
          </p>
          <button
            type="button"
            className="mt-6 rounded-[var(--radius-button)] border border-primary px-4 py-2.5 text-[14px] font-medium text-primary hover:bg-primary-light"
            onClick={() =>
              toast.show(`专家预约占位 · 路由参数 ${expertParams}`, 'info')
            }
          >
            去预约
          </button>
        </article>
      </div>
    </div>
  )
}
