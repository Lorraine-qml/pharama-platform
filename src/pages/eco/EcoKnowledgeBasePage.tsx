import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { Modal } from '../../components/Modal'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import { downloadCsv } from './ecoDownload'
import { ecoKbCanManage, ecoKbVisibleKinds } from './ecoPermissions'
import type { KnowledgeBase, KnowledgeBaseKind } from './ecoTypes'
import { useEco } from './EcoContext'

const KINDS: KnowledgeBaseKind[] = ['公共', '行业', '私有']

const emptyDraft = (): Omit<KnowledgeBase, 'id' | 'updatedAt'> => ({
  name: '',
  kind: '公共',
  projectId: null,
  description: '',
})

function projectName(archives: { id: string; name: string }[], id: string | null) {
  if (!id) return '—'
  return archives.find((x) => x.id === id)?.name ?? id
}

export default function EcoKnowledgeBasePage() {
  const { user } = useAuth()
  const toast = useToast()
  const role = user?.role ?? 'member'
  const canManage = ecoKbCanManage(role)
  const visibleKinds = ecoKbVisibleKinds(role)

  const { archives } = useHatchMgmt()
  const physicalProjects = useMemo(
    () => archives.filter((a) => a.incubationType === '实体'),
    [archives],
  )

  const { knowledgeBases, addKnowledgeBase, updateKnowledgeBase, tryRemoveKnowledgeBase, getDocuments } = useEco()

  const [fKind, setFKind] = useState<KnowledgeBaseKind | '全部'>('全部')
  const [fProject, setFProject] = useState<string>('全部')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Omit<KnowledgeBase, 'id' | 'updatedAt'>>(emptyDraft)
  const [filesHint, setFilesHint] = useState('')

  const [deleteRow, setDeleteRow] = useState<KnowledgeBase | null>(null)

  useEffect(() => {
    setPage(1)
  }, [fKind, fProject, q, visibleKinds])

  const rowsWithCount = useMemo(() => {
    return knowledgeBases.map((k) => ({
      ...k,
      docCount: getDocuments(k.id).length,
    }))
  }, [knowledgeBases, getDocuments])

  const filtered = useMemo(() => {
    return rowsWithCount.filter((r) => {
      if (visibleKinds && !visibleKinds.includes(r.kind)) return false
      if (fKind !== '全部' && r.kind !== fKind) return false
      if (fProject !== '全部') {
        if (fProject === '__none__') {
          if (r.projectId) return false
        } else if (r.projectId !== fProject) return false
      }
      if (q.trim() && !r.name.includes(q.trim())) return false
      return true
    })
  }, [rowsWithCount, fKind, fProject, q, visibleKinds])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  function openAdd() {
    setEditingId(null)
    setDraft(emptyDraft())
    setFilesHint('')
    setEditorOpen(true)
  }

  function openEdit(row: KnowledgeBase) {
    setEditingId(row.id)
    setDraft({
      name: row.name,
      kind: row.kind,
      projectId: row.projectId,
      description: row.description,
    })
    setFilesHint('')
    setEditorOpen(true)
  }

  function saveEditor() {
    if (!draft.name.trim()) {
      toast.show('请填写知识库名称', 'warning')
      return
    }
    if (draft.kind === '私有' && !draft.projectId) {
      toast.show('私有库必须选择所属项目', 'warning')
      return
    }
    const payload = {
      ...draft,
      projectId: draft.kind === '私有' ? draft.projectId : null,
    }
    if (editingId) {
      updateKnowledgeBase(editingId, payload)
      toast.show('已保存', 'success')
    } else {
      addKnowledgeBase(payload)
      toast.show('已新建知识库', 'success')
    }
    setEditorOpen(false)
  }

  function exportCsv() {
    downloadCsv(
      `知识库_${new Date().toISOString().slice(0, 10)}.csv`,
      ['知识库名称', '类型', '所属项目', '文档数', '最后更新', '描述'],
      filtered.map((r) => [
        r.name,
        r.kind,
        projectName(physicalProjects, r.projectId),
        r.docCount,
        r.updatedAt,
        r.description,
      ]),
    )
    toast.show('已导出 CSV（演示）', 'info')
  }

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="📚 知识库"
        lines={[
          '管理公共 / 行业 / 私有知识库；私有库需绑定入孵实体项目。文档上传走 OSS 为 V2，此处为前端演示状态。',
          '专家账号仅展示公共库；运营/企业管理员可维护元数据与文档管理入口。',
        ]}
      />

      <h1 className="text-lg font-bold text-foreground">知识库</h1>

      <ListToolbarRow
        left={
          <>
            {canManage ? (
              <button
                type="button"
                className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
                onClick={openAdd}
              >
                + 新建知识库
              </button>
            ) : null}
            {canManage ? (
              <button type="button" className="rounded-md border border-divider bg-surface px-3 py-2 text-[13px]" onClick={() => toast.show('导入（演示）', 'info')}>
                导入
              </button>
            ) : null}
            <button type="button" className="rounded-md border border-divider bg-surface px-3 py-2 text-[13px]" onClick={exportCsv}>
              导出
            </button>
          </>
        }
        right={
          <>
            <label className="text-[12px] text-muted">
              类型
              <select
                value={fKind}
                onChange={(e) => setFKind(e.target.value as typeof fKind)}
                className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]"
              >
                <option value="全部">全部</option>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[12px] text-muted">
              所属项目
              <select
                value={fProject}
                onChange={(e) => setFProject(e.target.value)}
                className="mt-1 block min-w-[140px] rounded-md border border-divider bg-page px-2 py-2 text-[13px]"
              >
                <option value="全部">全部</option>
                <option value="__none__">无（公共/行业）</option>
                {physicalProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[200px] text-[12px] text-muted">
              知识库名称
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索"
                className="mt-1 w-full rounded-md border border-divider px-3 py-2 text-[13px]"
              />
            </label>
          </>
        }
      />

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-divider bg-surface text-[14px] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full border-collapse">
            <thead className="sticky top-0 z-[1] border-b border-divider bg-[#F5F7FA] text-left text-[12px] font-bold text-muted">
              <tr>
                <th className="px-4 py-3">知识库名称</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">所属项目</th>
                <th className="px-4 py-3">文档数</th>
                <th className="px-4 py-3">最后更新</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.id} className="h-12 border-b border-divider hover:bg-primary-light/15">
                  <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-3 text-muted">{r.kind}</td>
                  <td className="px-4 py-3 text-muted">{projectName(physicalProjects, r.projectId)}</td>
                  <td className="px-4 py-3 text-muted">{r.docCount}</td>
                  <td className="px-4 py-3 text-muted">{r.updatedAt}</td>
                  <td className="px-4 py-3 text-end text-[13px]">
                    <button type="button" className="text-primary hover:underline" onClick={() => toast.show(`打开知识库「${r.name}」全文检索（演示）`, 'info')}>
                      访问
                    </button>
                    {canManage ? (
                      <>
                        <Link to={`/eco/knowledge-base/${r.id}/manage`} className="ml-2 text-primary hover:underline">
                          管理
                        </Link>
                        <button type="button" className="ml-2 text-primary hover:underline" onClick={() => openEdit(r)}>
                          编辑
                        </button>
                        <button type="button" className="ml-2 text-rose-600 hover:underline" onClick={() => setDeleteRow(r)}>
                          删除
                        </button>
                      </>
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
        open={editorOpen}
        title={editingId ? '编辑知识库' : '新建知识库'}
        onClose={() => setEditorOpen(false)}
        closeOnOverlayClick={false}
        footer={
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setEditorOpen(false)}>
              取消
            </button>
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={saveEditor}>
              保存
            </button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <label className="block">
            <span className="text-muted">知识库名称（必填）</span>
            <input
              className="mt-1 w-full rounded-md border border-divider px-3 py-2"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </label>
          <div>
            <span className="text-muted">类型</span>
            <div className="mt-2 flex flex-wrap gap-4">
              {KINDS.map((k) => (
                <label key={k} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    checked={draft.kind === k}
                    onChange={() => setDraft((d) => ({ ...d, kind: k, projectId: k === '私有' ? d.projectId : null }))}
                  />
                  {k}
                </label>
              ))}
            </div>
          </div>
          {draft.kind === '私有' ? (
            <label className="block">
              <span className="text-muted">所属项目（私有必选）</span>
              <select
                className="mt-1 w-full rounded-md border border-divider px-3 py-2"
                value={draft.projectId ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, projectId: e.target.value || null }))}
              >
                <option value="">请选择</option>
                {physicalProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}（{p.id}）
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block">
            <span className="text-muted">描述（选填）</span>
            <input
              className="mt-1 w-full rounded-md border border-divider px-3 py-2"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </label>
          <div>
            <span className="text-muted">初始文档（演示）</span>
            <input
              type="file"
              multiple
              className="mt-1 block w-full text-[12px] file:mr-2 file:rounded-md file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
              onChange={(e) => {
                const n = e.target.files?.length ?? 0
                setFilesHint(n ? `已选择 ${n} 个文件（保存后仍为演示，未实际上传）` : '')
              }}
            />
            {filesHint ? <p className="mt-1 text-[12px] text-muted">{filesHint}</p> : null}
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteRow)}
        title="确认删除"
        onClose={() => setDeleteRow(null)}
        footer={
          <>
            <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setDeleteRow(null)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white"
              onClick={() => {
                if (!deleteRow) return
                const res = tryRemoveKnowledgeBase(deleteRow.id)
                if (!res.ok) {
                  toast.show(res.message, 'warning')
                } else {
                  toast.show('已删除知识库', 'success')
                }
                setDeleteRow(null)
              }}
            >
              删除
            </button>
          </>
        }
      >
        <p className="text-[13px] text-muted">
          确定删除知识库「{deleteRow?.name}」吗？若库内仍有文档，系统将阻止删除。
        </p>
      </Modal>
    </div>
  )
}
