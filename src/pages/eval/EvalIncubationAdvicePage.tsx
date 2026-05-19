import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import type { ProjectArchive } from '../hatch/hatchTypes'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import { adviceCardsFor } from './evalShared'
import { EvalPageHeader, useEvalProjectId } from './EvalHeader'

function physicalIncubationFilter(a: ProjectArchive) {
  return a.incubationType === '实体' && a.status !== '退出' && a.status !== '毕业'
}

export default function EvalIncubationAdvicePage() {
  const toast = useToast()
  const { archives } = useHatchMgmt()
  const list = archives.filter(physicalIncubationFilter)
  const baseList = list.length ? list : archives
  const { projectId, archive } = useEvalProjectId(baseList)
  const cards = adviceCardsFor(projectId)

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="✨ AI 孵化建议生成"
        lines={[
          '基于画像、评分与风险的演示建议卡片；操作按钮跳转或弹出工作台提示。',
          '生产环境可由 incubation_advisor Skill 生成并支持一键转待办。',
        ]}
      />
      <EvalPageHeader title="AI 孵化建议生成" archives={baseList} filter={list.length ? physicalIncubationFilter : undefined} />

      {!archive ? (
        <p className="text-[13px] text-muted">暂无项目。</p>
      ) : (
        <>
          <p className="text-[13px] text-muted">智能建议（基于项目当前阶段与评分）· {archive.name}</p>
          <div className="space-y-4">
            {cards.map((c) => (
              <section key={c.id} className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
                <h2 className="text-[14px] font-bold text-foreground">{c.title}</h2>
                <ul className="mt-2 space-y-1 text-[13px] text-foreground">
                  {c.body.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.actions.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      className={
                        a.tone === 'primary'
                          ? 'rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground hover:opacity-90'
                          : 'rounded-md border border-divider px-3 py-1.5 text-[12px] font-semibold hover:bg-muted/30'
                      }
                      onClick={() => {
                        if (a.label === '忽略') toast.show('已忽略该建议，将减少同类推荐（演示）', 'success')
                        else if (a.label === '加入重点培育') toast.show('已加入重点培育名单（演示）', 'success')
                        else if (a.label === '预约' || a.label === '预约路演' || a.label === '预约资源') toast.show(`已打开「${a.label}」流转（演示）`, 'success')
                        else toast.show(`「${a.label}」已记录（演示）`, 'success')
                      }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
