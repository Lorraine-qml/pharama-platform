import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { Modal } from '../../components/Modal'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { ecoKbCanManage, ecoKbVisibleKinds } from './ecoPermissions'
import type { KbDocument } from './ecoTypes'
import { useEco } from './EcoContext'

function extFromName(name: string) {
  const i = name.lastIndexOf('.')
  if (i <= 0) return '文件'
  return name.slice(i + 1).toUpperCase()
}

function sizeFromFile(f: File) {
  const mb = f.size / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)}MB`
  return `${(f.size / 1024).toFixed(1)}KB`
}

export default function EcoKnowledgeDocsPage() {
  const { libraryId } = useParams<{ libraryId: string }>()
  const { user } = useAuth()
  const toast = useToast()
  const role = user?.role ?? 'member'
  const canManage = ecoKbCanManage(role)
  const visibleKinds = ecoKbVisibleKinds(role)

  const { knowledgeBases, getDocuments, addKbDocument, removeKbDocument } = useEco()

  const kb = useMemo(() => knowledgeBases.find((k) => k.id === libraryId), [knowledgeBases, libraryId])

  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [deleteDoc, setDeleteDoc] = useState<KbDocument | null>(null)

  const docs = kb ? getDocuments(kb.id) : []

  const filtered = useMemo(() => {
    if (!q.trim()) return docs
    return docs.filter((d) => d.name.includes(q.trim()))
  }, [docs, q])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const expertBlocked =
    role === 'expert' && kb && visibleKinds && !visibleKinds.includes(kb.kind)

  if (!libraryId || !kb) {
    return (
      <div className="space-y-4 pb-10">
        <ModuleIntroCard title="📂 知识库文档" lines={['未找到该知识库，请从列表进入。']} />
        <Link to="/eco/knowledge-base" className="text-[13px] font-semibold text-primary hover:underline">
          ← 返回知识库列表
        </Link>
      </div>
    )
  }

  if (expertBlocked) {
    return (
      <div className="space-y-4 pb-10">
        <ModuleIntroCard title="📂 知识库文档" lines={['当前角色仅能访问公共知识库。']} />
        <p className="rounded-lg border border-dashed border-divider bg-muted/10 px-4 py-6 text-[13px] text-muted">
          您无权管理非公共知识库文档。
        </p>
        <Link to="/eco/knowledge-base" className="text-[13px] font-semibold text-primary hover:underline">
          ← 返回知识库列表
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="📂 知识库文档管理"
        lines={[
          `当前知识库：${kb.name}（${kb.kind}）。预览/下载为演示；实际上传与 OSS 见技术说明文档。`,
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-foreground">知识库管理 — {kb.name}</h1>
        <Link to="/eco/knowledge-base" className="text-[13px] font-semibold text-primary hover:underline">
          ← 返回
        </Link>
      </div>

      <ListToolbarRow
        left={
          canManage ? (
            <>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const list = e.target.files
                    if (!list?.length) return
                    const now = new Date()
                    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
                    const uploader = user?.displayName ?? '当前用户'
                    Array.from(list).forEach((f) => {
                      addKbDocument(kb.id, {
                        name: f.name,
                        ext: extFromName(f.name),
                        sizeLabel: sizeFromFile(f),
                        uploadedAt: ts,
                        uploader,
                      })
                    })
                    toast.show(`已添加 ${list.length} 个文档（演示，未上传 OSS）`, 'success')
                    e.target.value = ''
                  }}
                />
                上传文档
              </label>
            </>
          ) : null
        }
        right={
          <label className="min-w-[220px] text-[12px] text-muted">
            搜索文档
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder="文档名称"
              className="mt-1 w-full rounded-md border border-divider px-3 py-2 text-[13px]"
            />
          </label>
        }
      />

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-divider bg-surface text-[14px] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[880px] w-full border-collapse">
            <thead className="sticky top-0 z-[1] border-b border-divider bg-[#F5F7FA] text-left text-[12px] font-bold text-muted">
              <tr>
                <th className="px-4 py-3">文档名称</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">大小</th>
                <th className="px-4 py-3">上传时间</th>
                <th className="px-4 py-3">上传人</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((d) => (
                <tr key={d.id} className="h-12 border-b border-divider hover:bg-primary-light/15">
                  <td className="px-4 py-3 font-medium text-foreground">{d.name}</td>
                  <td className="px-4 py-3 text-muted">{d.ext}</td>
                  <td className="px-4 py-3 text-muted">{d.sizeLabel}</td>
                  <td className="px-4 py-3 text-muted">{d.uploadedAt}</td>
                  <td className="px-4 py-3 text-muted">{d.uploader}</td>
                  <td className="px-4 py-3 text-end text-[13px]">
                    <button type="button" className="text-primary hover:underline" onClick={() => toast.show('在线预览（演示）', 'info')}>
                      预览
                    </button>
                    <button type="button" className="ml-2 text-primary hover:underline" onClick={() => toast.show('开始下载（演示）', 'info')}>
                      下载
                    </button>
                    {canManage ? (
                      <button type="button" className="ml-2 text-rose-600 hover:underline" onClick={() => setDeleteDoc(d)}>
                        删除
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ListPaginationBar
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n)
            setPage(1)
          }}
        />
      </div>

      <Modal
        open={Boolean(deleteDoc)}
        title="确认删除文档"
        onClose={() => setDeleteDoc(null)}
        footer={
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setDeleteDoc(null)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white"
              onClick={() => {
                if (deleteDoc) {
                  removeKbDocument(kb.id, deleteDoc.id)
                  toast.show('已删除文档', 'success')
                }
                setDeleteDoc(null)
              }}
            >
              删除
            </button>
          </>
        }
      >
        <p className="text-[13px] text-muted">确定删除「{deleteDoc?.name}」吗？</p>
      </Modal>
    </div>
  )
}
