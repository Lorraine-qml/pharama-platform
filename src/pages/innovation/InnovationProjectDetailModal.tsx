import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { RadarChart } from '../../components/RadarChart'
import { StatusPill } from '../../components/ui/StatusPill'
import { cn } from '../../utils/cn'
import type { ProjectDetailTab } from './innovationProgressModel'
import { useInnovationDemo } from './InnovationDemoContext'
import { poolStagePillVariant, poolStatusLabel } from './innovationPoolLabels'

const TABS: { key: ProjectDetailTab; label: string }[] = [
  { key: 'basic', label: '基础信息' },
  { key: 'files', label: '资料附件' },
  { key: 'ai', label: 'AI 评估' },
  { key: 'experts', label: '专家评审' },
  { key: 'decision', label: '决策记录' },
]

type Props = {
  projectId: string | null
  initialTab?: ProjectDetailTab
  onClose: () => void
}

export function InnovationProjectDetailModal({ projectId, initialTab = 'basic', onClose }: Props) {
  const { getProject } = useInnovationDemo()
  const p = projectId ? getProject(projectId) : undefined
  const [tab, setTab] = useState<ProjectDetailTab>(initialTab)

  const open = projectId != null && p != null

  return (
    <Modal
      open={open}
      title={p ? `项目档案 — ${p.name}` : ''}
      onClose={onClose}
      panelClassName="max-w-3xl"
      footer={
        <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px] font-bold hover:bg-muted/30" onClick={onClose}>
          关闭
        </button>
      }
    >
      {p ? (
        <div className="max-h-[min(70vh,640px)] space-y-4 overflow-y-auto pr-1 text-[13px]">
          <motion className="flex flex-wrap items-center gap-2">
            <StatusPill variant={poolStagePillVariant(p)}>{poolStatusLabel(p)}</StatusPill>
            <span className="text-muted">赛道：{p.track}</span>
            <span className="text-muted">· 节点：{p.currentNodePublic}</span>
          </motion>

          <motion className="flex flex-wrap gap-1 border-b border-divider pb-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[12px] font-semibold',
                  tab === t.key ? 'bg-primary/12 text-primary ring-1 ring-primary/25' : 'text-muted hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </motion>

          {tab === 'basic' ? (
            <dl className="grid gap-x-4 sm:grid-cols-2">
              {[
                ['项目名称', p.name],
                ['主体类型', p.entityTypeLabel],
                ['主体全称', p.orgFullName],
                ['联系人', p.contact],
                ['联系电话', p.phone],
                ['项目阶段', p.phase],
                ['入孵意向', p.intentLabel],
                ['提交时间', p.submittedAt],
              ].map(([k, v]) => (
                <motion key={k} className="flex justify-between gap-2 border-b border-divider py-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-end font-medium">{v}</dd>
                </motion>
              ))}
            </dl>
          ) : null}

          {tab === 'files' ? (
            <ul className="divide-y divide-divider rounded-md border border-divider">
              {p.attachments.map((a) => (
                <li key={a.name} className="flex justify-between gap-2 px-3 py-2">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-muted">{a.sizeLabel ?? '—'}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {tab === 'ai' ? (
            p.aiReport ? (
              <motion className="space-y-3">
                <p className="font-bold">
                  综合 {p.aiReport.overall} 分（{p.aiReport.levelLabel}）
                </p>
                <RadarChart axes={p.aiReport.dims.map((d) => ({ key: d.key, value: d.value }))} size={180} />
                <p className="text-muted">{p.aiReport.suggest}</p>
              </motion>
            ) : (
              <p className="text-muted">暂无 AI 评估报告。</p>
            )
          ) : null}

          {tab === 'experts' ? (
            <ul className="space-y-2">
              {p.experts.length === 0 ? <li className="text-muted">尚未分配专家。</li> : null}
              {p.experts.map((e) => (
                <li key={e.expertId} className="rounded-md border border-divider px-3 py-2">
                  <span className="font-semibold">{e.name}</span>
                  <span className="ms-2 text-muted">
                    {e.state === 'done' ? '已提交' : e.state === 'reviewing' ? '评审中' : '待评审'}
                    {e.score != null ? ` · ${e.score} 分` : ''}
                  </span>
                  {e.opinion ? <p className="mt-1 text-muted">{e.opinion}</p> : null}
                </li>
              ))}
            </ul>
          ) : null}

          {tab === 'decision' ? (
            p.decisionAt ? (
              <dl className="space-y-2">
                <motion className="flex justify-between">
                  <dt className="text-muted">决策结果</dt>
                  <dd className="font-semibold">{decisionLabel(p.decisionChoice)}</dd>
                </motion>
                <motion className="flex justify-between">
                  <dt className="text-muted">决策时间</dt>
                  <dd>{p.decisionAt}</dd>
                </motion>
                {p.decisionComment ? (
                  <motion>
                    <dt className="text-muted">意见</dt>
                    <dd className="mt-1 rounded-md bg-page px-3 py-2">{p.decisionComment}</dd>
                  </motion>
                ) : null}
              </dl>
            ) : (
              <p className="text-muted">尚未提交入孵决策。</p>
            )
          ) : null}
        </motion>
      ) : null}
    </Modal>
  )
}

function decisionLabel(choice: string | undefined) {
  switch (choice) {
    case 'physical':
      return '实体入孵'
    case 'virtual':
      return '虚拟入孵'
    case 'observe':
      return '观察培育'
    case 'reject':
      return '暂不通过'
    default:
      return '—'
  }
}
