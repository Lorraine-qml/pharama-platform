import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { useInnovationDemo } from './InnovationDemoContext'

export default function InnovationOpsMaterialReviewPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const toast = useToast()
  const { getProject, passMaterialReview, returnMaterialReview } = useInnovationDemo()
  const p = projectId ? getProject(projectId) : undefined
  const [comment, setComment] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (!p) return <p className="text-muted">未找到项目。</p>

  const proj = p

  function onPass() {
    passMaterialReview(proj.id, comment)
    toast.show('已通过资料审核 · 已进入「待 AI 评估」', 'success')
  }

  function onReject() {
    if (!rejectReason.trim()) {
      toast.show('退回原因必填', 'warning')
      return
    }
    returnMaterialReview(proj.id, rejectReason.trim())
    setRejectOpen(false)
    toast.show('已退回项目方修改', 'warning')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted">
            <Link to="/innovation/ops/workbench" className="text-primary hover:underline">
              任务中心
            </Link>
            <span className="mx-2 text-divider">/</span>
            资料审核
          </p>
          <h2 className="mt-2 text-[20px] font-bold text-foreground">审核项目：{proj.name}</h2>
        </div>
        <Link className="text-[13px] text-primary hover:underline" to={`/innovation/project/${proj.id}`}>
          打开统一详情与时间线 →
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
          <h3 className="mb-4 text-[14px] font-bold">附件预览列表</h3>
          <ul className="space-y-3 text-[13px]">
            {proj.attachments.map((f) => (
              <li key={f.name} className="flex justify-between rounded-md border border-divider px-3 py-2">
                <span>{f.name}</span>
                <button type="button" className="font-medium text-primary hover:underline" onClick={() => toast.show(`预览 · ${f.name}（演示）`, 'info')}>
                  点击预览
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h3 className="text-[14px] font-bold">完整性自检</h3>
            <button type="button" onClick={() => toast.show('已调用 document_parser（演示占位）', 'info')} className="rounded-md bg-primary px-3 py-1 text-[11px] font-bold text-white">
              ✨ AI（document_parser）
            </button>
          </div>
          <ul className="space-y-2 text-[13px]">
            {proj.checklist.map((row) => (
              <li key={row.label} className={cn('flex gap-3 rounded-lg border px-3 py-2', row.ok ? 'border-divider bg-page' : 'border-danger/40 bg-danger/[0.04]')}>
                <span aria-hidden>{row.ok ? '✓' : '✗'} </span>
                {row.label}
                {!row.ok ? <span className="ms-auto text-danger">缺失</span> : <span className="ms-auto text-success">齐备</span>}
              </li>
            ))}
          </ul>
          <label className="mt-6 block text-[13px] text-muted">
            审核意见（通过可留备注）
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="mt-2 w-full rounded-md border border-divider px-3 py-2 text-[13px] text-foreground" />
          </label>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={onPass} className="rounded-md bg-primary px-6 py-2 font-semibold text-white hover:bg-primary-hover">
              通过
            </button>
            <button type="button" onClick={() => setRejectOpen(true)} className="rounded-md border border-danger px-6 py-2 font-semibold text-danger hover:bg-danger/10">
              退回修改
            </button>
          </div>
        </section>
      </div>

      <Modal
        open={rejectOpen}
        title="退回原因（必填）"
        onClose={() => setRejectOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-md border px-3 py-2 text-[13px]" onClick={() => setRejectOpen(false)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-danger px-3 py-2 text-[13px] font-semibold text-white hover:opacity-95" onClick={onReject}>
              确定
            </button>
          </>
        }
      >
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={5}
          className="w-full rounded-md border border-divider px-3 py-2 text-[13px]"
          placeholder="请说明需补齐的材料…"
        />
      </Modal>
    </div>
  )
}
