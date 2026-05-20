import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { aiRecommendedExperts } from './aiEvaluationExpertRecommend'
import { useInnovationDemo } from './InnovationDemoContext'
import { ModalSection, OPS_MODAL_PANEL, SummaryGrid } from './innovationModalShared'
import type { ExpertAssignment, SjProject } from './innovationTypes'
import { EXPERT_CATALOG_DEMO } from './innovationTypes'

type Props = {
  project: SjProject | null
  open: boolean
  onClose: () => void
  onAssigned?: () => void
}

export function ExpertAssignModal({ project, open, onClose, onAssigned }: Props) {
  const toast = useToast()
  const { getProject, assignExperts, promoteAfterAiConfirm } = useInnovationDemo()
  const live = project ? getProject(project.id) ?? project : null

  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [deadline, setDeadline] = useState('')
  const [expertQ, setExpertQ] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const defaultDeadline = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  }, [])

  const aiRows = useMemo(() => (live ? aiRecommendedExperts(live.track) : []), [live])

  useEffect(() => {
    if (!open || !live) return
    setExpertQ('')
    setDeadline(defaultDeadline)
    if (live.experts.length > 0) {
      const map: Record<string, boolean> = {}
      live.experts.forEach((e) => {
        map[e.expertId] = true
      })
      setPicked(map)
    } else {
      const init: Record<string, boolean> = {}
      aiRows.slice(0, 1).forEach((e) => {
        init[e.expertId] = true
      })
      setPicked(init)
    }
  }, [open, live?.id, defaultDeadline, aiRows])

  const filteredCatalog = useMemo(() => {
    const q = expertQ.trim().toLowerCase()
    if (!q) return EXPERT_CATALOG_DEMO
    return EXPERT_CATALOG_DEMO.filter((e) => e.name.toLowerCase().includes(q) || e.field.toLowerCase().includes(q))
  }, [expertQ])

  function toggle(id: string) {
    setPicked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function skip() {
    toast.show('已跳过，可稍后在项目详情中分配专家', 'info')
    onClose()
  }

  function confirm() {
    if (!live) return
    const ids = EXPERT_CATALOG_DEMO.filter((e) => picked[e.expertId]).map((e) => e.expertId)
    if (ids.length === 0) {
      toast.show('请至少选择一位专家', 'warning')
      return
    }
    setSubmitting(true)
    const dl = deadline || defaultDeadline
    if (live.stage === 'pending_ai' && live.aiReport) {
      promoteAfterAiConfirm(live.id)
    }
    const rows: ExpertAssignment[] = EXPERT_CATALOG_DEMO.filter((e) => picked[e.expertId]).map((e) => {
      const rec = aiRows.find((r) => r.expertId === e.expertId)
      const existing = live.experts.find((x) => x.expertId === e.expertId)
      return {
        expertId: e.expertId,
        name: e.name,
        field: rec?.field ?? e.field,
        matchPct: rec?.matchPct ?? existing?.matchPct,
        aiPick: Boolean(rec),
        state: existing?.state ?? 'pending',
        deadline: dl,
        score: existing?.score,
        opinion: existing?.opinion,
      }
    })
    assignExperts(live.id, rows)
    setSubmitting(false)
    toast.show(`已为 ${rows.length} 位专家下发评审任务，项目进入「专家评审中」`, 'success')
    onAssigned?.()
    onClose()
  }

  return (
    <Modal
      open={open && live != null}
      title={live ? `分配专家 - ${live.name}` : ''}
      onClose={onClose}
      closeOnOverlayClick={false}
      panelClassName={OPS_MODAL_PANEL}
      fillHeight
      footer={
        live ? (
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={skip} disabled={submitting}>
              跳过（稍后分配）
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
              onClick={confirm}
              disabled={submitting}
            >
              {submitting ? '提交中…' : '确认分配'}
            </button>
          </>
        ) : null
      }
    >
      {live ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto text-[13px]">
          <ModalSection title="项目信息">
            <SummaryGrid
              items={[
                { label: '项目', value: live.name },
                { label: '赛道', value: live.track },
                { label: '阶段', value: live.phase },
                {
                  label: 'AI评估得分',
                  value: live.aiReport ? `${live.aiReport.overall} 分（${live.aiReport.levelLabel}）` : '暂无',
                },
                {
                  label: '当前已分配',
                  value: live.experts.length ? `${live.experts.length} 人` : '无',
                },
              ]}
            />
          </ModalSection>

          {live.experts.length > 0 ? (
            <ModalSection title="已分配专家">
              <ul className="space-y-1 text-muted">
                {live.experts.map((e) => (
                  <li key={e.expertId}>
                    {e.name}（{e.field}）· {e.state === 'done' ? '已提交' : '待评审'}
                  </li>
                ))}
              </ul>
            </ModalSection>
          ) : null}

          <ModalSection title="✨ AI推荐专家（根据项目技术关键词匹配）">
            <ul className="space-y-2">
              {aiRows.map((e) => (
                <li key={e.expertId}>
                  <label className="flex cursor-pointer gap-3 rounded-lg border border-divider px-3 py-2 hover:bg-page">
                    <input type="checkbox" checked={!!picked[e.expertId]} onChange={() => toggle(e.expertId)} />
                    <span className="font-semibold">{e.name}</span>
                    <span className="text-muted">
                      （{e.field}，{e.matchPct}%）
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </ModalSection>

          <ModalSection title="全部专家库（可搜索）">
            <input
              value={expertQ}
              onChange={(e) => setExpertQ(e.target.value)}
              placeholder="搜索姓名或领域…"
              className="mb-2 w-full rounded-md border border-divider bg-page px-3 py-2"
            />
            <ul className="max-h-[140px] space-y-2 overflow-y-auto">
              {filteredCatalog.map((e) => (
                <li key={e.expertId}>
                  <label className="flex cursor-pointer gap-2 rounded-lg border border-divider px-3 py-2 hover:bg-page">
                    <input type="checkbox" checked={!!picked[e.expertId]} onChange={() => toggle(e.expertId)} />
                    {e.name}（{e.field}）
                  </label>
                </li>
              ))}
            </ul>
          </ModalSection>

          <label className="block text-muted">
            截止日期（建议至少保留 5 个工作日）
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 w-full rounded-md border border-divider bg-page px-3 py-2 text-foreground"
            />
          </label>
        </div>
      ) : null}
    </Modal>
  )
}
