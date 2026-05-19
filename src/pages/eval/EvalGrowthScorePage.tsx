import { useMemo, useState } from 'react'
import { RadarChart } from '../../components/RadarChart'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { downloadCsv } from '../eco/ecoDownload'
import type { ProjectArchive } from '../hatch/hatchTypes'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import { EVAL_SCORES, type EvalScoreRow } from './evalShared'

function physicalIncubationFilter(a: ProjectArchive) {
  return a.incubationType === '实体' && a.status !== '退出' && a.status !== '毕业'
}

function scoreFor(id: string): EvalScoreRow {
  return (
    EVAL_SCORES[id] ?? {
      tech: 72,
      commercial: 62,
      financing: 68,
      resource: 58,
      ecosystem: 60,
      total: 64,
      badge: '',
    }
  )
}

function interpret(s: EvalScoreRow): string {
  const bits: string[] = []
  if (s.tech >= 80) bits.push('技术成长突出')
  else if (s.tech < 65) bits.push('技术成长有提升空间')
  if (s.financing >= 85) bits.push('融资进展顺利')
  else if (s.financing < 65) bits.push('融资节奏需关注')
  if (s.commercial < 70) bits.push('商业化推进偏慢，建议加强市场拓展')
  if (s.resource >= 80) bits.push('资源活跃度良好')
  bits.push('以上为基于画像与统计的演示解读')
  return bits.join('；') + '。'
}

function badgeCell(badge: EvalScoreRow['badge']) {
  if (badge === '高潜力') return '🔥 高潜力'
  if (badge === '重点培育') return '⭐ 重点培育'
  return '—'
}

export default function EvalGrowthScorePage() {
  const toast = useToast()
  const { archives } = useHatchMgmt()
  const list = archives.filter(physicalIncubationFilter)
  const baseList = list.length ? list : archives
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeId = selectedId ?? baseList[0]?.id ?? ''

  const rows = useMemo(
    () =>
      baseList.map((a) => {
        const s = scoreFor(a.id)
        return { archive: a, s }
      }),
    [baseList],
  )

  const active = rows.find((r) => r.archive.id === activeId) ?? rows[0]
  const s = active?.s ?? scoreFor('')

  function exportCsv() {
    downloadCsv(
      `AI项目成长评分-${new Date().toISOString().slice(0, 10)}.csv`,
      ['项目名称', '技术成长', '商业化', '融资成长', '资源活跃度', '生态贡献', '综合评分', '潜力标识'],
      rows.map(({ archive, s: sc }) => [
        archive.name,
        sc.tech,
        sc.commercial,
        sc.financing,
        sc.resource,
        sc.ecosystem,
        sc.total,
        sc.badge || '—',
      ]),
    )
    toast.show('已导出评分列表（CSV）', 'success')
  }

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="🎯 AI 项目成长评分"
        lines={[
          '演示维度评分与综合分；点击行或名称查看雷达图与解读。高潜力与重点培育标识供运营筛选。',
          '生产环境可由 growth_score_calc Skill 计算并写回。',
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider pb-4">
        <h1 className="text-lg font-bold text-foreground">AI 项目成长评分</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-divider bg-surface px-3 py-1.5 text-[13px] font-semibold hover:bg-muted/30"
            onClick={() => toast.show('已触发评分刷新（演示）', 'success')}
          >
            刷新
          </button>
          <button
            type="button"
            className="rounded-md border border-divider bg-surface px-3 py-1.5 text-[13px] font-semibold hover:bg-muted/30"
            onClick={exportCsv}
          >
            导出
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-divider">
        <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
          <thead className="border-b border-divider bg-muted/20">
            <tr>
              <th className="px-3 py-2 font-semibold">项目名称</th>
              <th className="px-3 py-2 font-semibold">技术成长</th>
              <th className="px-3 py-2 font-semibold">商业化</th>
              <th className="px-3 py-2 font-semibold">融资成长</th>
              <th className="px-3 py-2 font-semibold">资源活跃度</th>
              <th className="px-3 py-2 font-semibold">综合评分</th>
              <th className="px-3 py-2 font-semibold">潜力标识</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ archive, s: sc }) => {
              const sel = archive.id === activeId
              return (
                <tr
                  key={archive.id}
                  className={`cursor-pointer border-b border-divider/80 ${sel ? 'bg-primary/5' : 'hover:bg-muted/20'}`}
                  onClick={() => setSelectedId(archive.id)}
                >
                  <td className="px-3 py-2">
                    <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setSelectedId(archive.id)}>
                      {archive.name}
                    </button>
                  </td>
                  <td className="px-3 py-2">{sc.tech}</td>
                  <td className="px-3 py-2">{sc.commercial}</td>
                  <td className="px-3 py-2">{sc.financing}</td>
                  <td className="px-3 py-2">{sc.resource}</td>
                  <td className="px-3 py-2 font-semibold">{sc.total}</td>
                  <td className="px-3 py-2">{badgeCell(sc.badge)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {active && (
        <section className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
          <h2 className="mb-4 text-[14px] font-bold text-foreground">{active.archive.name} 评分详情</h2>
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
            <div className="shrink-0 [&_p]:hidden">
              <RadarChart
                size={260}
                axes={[
                  { key: `技术 ${s.tech}`, value: s.tech },
                  { key: `商业化 ${s.commercial}`, value: s.commercial },
                  { key: `融资 ${s.financing}`, value: s.financing },
                  { key: `资源 ${s.resource}`, value: s.resource },
                  { key: `生态 ${s.ecosystem}`, value: s.ecosystem },
                ]}
              />
            </div>
            <div className="max-w-xl flex-1 text-[13px] leading-relaxed text-foreground">
              <p className="font-semibold text-muted">解读</p>
              <p className="mt-2">{interpret(s)}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
