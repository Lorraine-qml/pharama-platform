import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import type { SjAttachment, SjProject } from './innovationTypes'
import { buildMaterialReviewView, fileKindFromName } from './materialReviewCatalog'

const opLink = 'text-[12px] font-semibold text-primary hover:underline'

type Props = {
  project: SjProject | null
  open: boolean
  onClose: () => void
  onSubmit: (outcome: 'pass' | 'return', comment: string) => void
}

export function MaterialReviewModal({ project, open, onClose, onSubmit }: Props) {
  const toast = useToast()
  const [comment, setComment] = useState('')
  const [outcome, setOutcome] = useState<'pass' | 'return'>('pass')
  const [previewFile, setPreviewFile] = useState<SjAttachment | null>(null)

  const view = useMemo(() => (project ? buildMaterialReviewView(project) : null), [project])

  useEffect(() => {
    if (open && project) {
      setComment('')
      setOutcome('pass')
      setPreviewFile(null)
    }
  }, [open, project?.id])

  function handleDownload(file: SjAttachment) {
    toast.show(`已开始下载「${file.name}」（演示）`, 'info')
  }

  function handleSubmit() {
    if (outcome === 'return' && !comment.trim()) {
      toast.show('请填写退回原因', 'warning')
      return
    }
    onSubmit(outcome, comment.trim())
  }

  const archiveUrl = project ? `/innovation/project/${project.id}` : '#'

  return (
    <>
      <Modal
        open={open && project != null}
        title={project ? `资料审核 - ${project.name}` : ''}
        onClose={onClose}
        closeOnOverlayClick={false}
        panelClassName="max-w-[900px] w-[90vw] sm:w-full"
        fillHeight
        footer={
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={onClose}>
              取消
            </button>
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover" onClick={handleSubmit}>
              提交
            </button>
          </>
        }
      >
        {project && view ? (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pe-1 text-[13px]">
            <section className="rounded-lg border border-divider bg-page/50 px-4 py-3">
              <h3 className="mb-3 text-[13px] font-bold text-foreground">项目摘要</h3>
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                <SummaryItem label="项目名称" value={project.name} />
                <SummaryItem label="主体类型" value={project.entityTypeLabel} />
                <SummaryItem label="赛道" value={project.track} />
                <SummaryItem label="阶段" value={project.phase} />
                <SummaryItem label="入孵意向" value={project.intentLabel} />
                <SummaryItem label="提交时间" value={project.submittedAt} />
              </dl>
            </section>

            <section>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[13px] font-bold text-foreground">资料完整性检查</h3>
                {view.missingRequired.length > 0 ? (
                  <span className="rounded-full bg-danger/12 px-2.5 py-0.5 text-[11px] font-bold text-danger ring-1 ring-danger/25">
                    缺失 {view.missingRequired.length} 项必传资料
                  </span>
                ) : (
                  <span className="rounded-full bg-success/12 px-2.5 py-0.5 text-[11px] font-bold text-success">必传项已齐备</span>
                )}
              </div>
              <div className="overflow-x-auto rounded-lg border border-divider">
                <table className="min-w-full border-collapse text-[13px]">
                  <thead className="bg-page text-[11px] font-bold uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-3 py-2.5 text-start">必传项</th>
                      <th className="px-3 py-2.5 text-start">状态</th>
                      <th className="px-3 py-2.5 text-end">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {view.required.map((row) => (
                      <tr key={row.label} className={cn(!row.ok && 'bg-danger/[0.04]')}>
                        <td className={cn('px-3 py-2.5 font-medium', !row.ok && 'text-danger')}>{row.label}</td>
                        <td className="px-3 py-2.5">
                          {row.ok ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <span aria-hidden>✅</span> 已上传
                              {row.attachment ? (
                                <span className="text-[12px] font-normal text-muted">（{row.attachment.name}）</span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-danger">
                              <span aria-hidden>❌</span> 缺失
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-end">
                          {row.attachment ? (
                            <span className="inline-flex gap-3">
                              <button type="button" className={opLink} onClick={() => setPreviewFile(row.attachment!)}>
                                预览
                              </button>
                              <button type="button" className={opLink} onClick={() => handleDownload(row.attachment!)}>
                                下载
                              </button>
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border border-divider bg-page/30 px-4 py-3">
              <h3 className="mb-2 text-[13px] font-bold text-foreground">其他资料（选填）</h3>
              {view.optional.length === 0 ? (
                <p className="text-muted">无其他选填附件</p>
              ) : (
                <ul className="space-y-2">
                  {view.optional.map((a) => (
                    <li key={a.name} className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        <span className="text-muted">{a.category ? `${a.category}：` : '• '}</span>
                        {a.name}
                        {a.sizeLabel ? <span className="ms-1 text-[12px] text-muted">（{a.sizeLabel}）</span> : null}
                      </span>
                      <span className="inline-flex gap-3">
                        <button type="button" className={opLink} onClick={() => setPreviewFile(a)}>
                          预览
                        </button>
                        <button type="button" className={opLink} onClick={() => handleDownload(a)}>
                          下载
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[12px] text-muted">融资资料：无</p>
            </section>

            <section>
              <h3 className="mb-2 text-[13px] font-bold text-foreground">审核意见</h3>
              <label className="block text-muted">
                请填写审核意见（退回时必填）：
                <textarea
                  className="mt-1 w-full rounded-md border border-divider bg-page px-3 py-2 text-foreground"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="例：技术资料缺失，请补充技术路线图和实验数据。"
                />
              </label>
              <fieldset className="mt-4">
                <legend className="sr-only">审核结果</legend>
                <p className="mb-2 font-semibold text-foreground">审核结果：</p>
                <div className="flex flex-wrap gap-6">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="radio" name="mat-outcome" checked={outcome === 'pass'} onChange={() => setOutcome('pass')} />
                    通过
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="radio" name="mat-outcome" checked={outcome === 'return'} onChange={() => setOutcome('return')} />
                    退回修改
                  </label>
                </div>
              </fieldset>
            </section>

            <p className="border-t border-divider pt-3 text-[12px]">
              <a href={archiveUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
                查看完整项目档案 ↗
              </a>
              <span className="text-muted"> · 在新标签页打开候选项目池详情，核心审核请在本弹窗完成</span>
            </p>
          </div>
        ) : null}
      </Modal>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-muted">{label}：</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  )
}

function FilePreviewModal({ file, onClose }: { file: SjAttachment | null; onClose: () => void }) {
  const kind = file ? fileKindFromName(file.name) : 'other'
  const kindLabel =
    kind === 'image' ? '图片' : kind === 'pdf' ? 'PDF 文档' : kind === 'office' ? 'Office 文档' : '文件'

  return (
    <Modal open={file != null} title={`预览 · ${file?.name ?? ''}`} onClose={onClose} panelClassName="max-w-[720px]">
      {file ? (
        <div className="space-y-4 text-[13px]">
          <div
            className={cn(
              'flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed border-divider bg-page px-6 py-10 text-center',
              kind === 'image' && 'border-primary/30 bg-primary/5',
            )}
          >
            {kind === 'image' ? (
              <div className="mb-3 flex h-32 w-48 items-center justify-center rounded-md bg-muted/20 text-[48px] text-muted" aria-hidden>
                🖼
              </div>
            ) : kind === 'pdf' ? (
              <div className="mb-3 text-[48px] text-danger/80" aria-hidden>
                📄
              </div>
            ) : (
              <div className="mb-3 text-[48px] text-primary/80" aria-hidden>
                📎
              </div>
            )}
            <p className="font-semibold text-foreground">{kindLabel}在线预览（演示）</p>
            <p className="mt-2 max-w-md text-muted">
              正式环境将在此嵌入图片/PDF 预览器或 Office Web Viewer；当前为演示占位。
            </p>
            {file.sizeLabel ? <p className="mt-1 text-[12px] text-muted">文件大小 {file.sizeLabel}</p> : null}
            {file.uploadedAt ? <p className="text-[12px] text-muted">上传时间 {file.uploadedAt}</p> : null}
          </div>
          <p className="text-[12px] text-muted">也可在新标签页打开完整档案查看附件列表与水印版本。</p>
        </div>
      ) : null}
    </Modal>
  )
}
