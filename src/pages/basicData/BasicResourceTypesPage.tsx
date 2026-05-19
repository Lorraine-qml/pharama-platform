import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import {
  type AddTagInput,
  type ResourceCategory,
  type ResourceTag,
  useResourceTypesConfig,
} from '../../contexts/ResourceTypesConfigContext'
import { cn } from '../../utils/cn'
import { useResopsV1 } from '../resops/ResopsV1Context'

function suggestTagCode(name: string): string {
  const raw = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
  if (raw.length >= 2) return raw.slice(0, 48)
  return `tag_${Date.now()}`
}

function countResourcesForTag(resources: { level1: string; level2: string }[], categoryName: string, tagName: string) {
  return resources.filter((r) => r.level1 === categoryName && r.level2 === tagName).length
}

export default function BasicResourceTypesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const resops = useResopsV1()
  const resources = resops.resources

  const {
    categories,
    updateCategory,
    moveCategory,
    addTag,
    updateTag,
    removeTag,
    reorderTags,
    restoreDefaults,
  } = useResourceTypesConfig()

  const canEdit = Boolean(user)
  const isFullAdmin = Boolean(user)
  const readOnly = !canEdit

  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [dragTag, setDragTag] = useState<{ categoryId: string; tagId: string } | null>(null)

  const [catModal, setCatModal] = useState<ResourceCategory | null>(null)
  const [catDraft, setCatDraft] = useState({ name: '', description: '', status: 1 as 0 | 1 })

  const [tagModal, setTagModal] = useState<{ mode: 'add' | 'edit'; category: ResourceCategory; tag?: ResourceTag } | null>(null)
  const [tagDraft, setTagDraft] = useState({
    tagName: '',
    tagCode: '',
    description: '',
    sortOrder: 10,
    status: 1 as 0 | 1,
    tagCodeTouched: false,
  })

  const [deleteConfirm, setDeleteConfirm] = useState<{ category: ResourceCategory; tag: ResourceTag } | null>(null)
  const [restoreConfirm, setRestoreConfirm] = useState(false)
  const [sortModal, setSortModal] = useState(false)

  const toggleRow = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const openEditCategory = (c: ResourceCategory) => {
    setCatModal(c)
    setCatDraft({ name: c.name, description: c.description, status: c.status })
  }

  const saveCategory = () => {
    if (!catModal) return
    if (catModal.isSystem && catDraft.status === 0 && !isFullAdmin) {
      toast.show('系统预置一级分类仅系统管理员可停用', 'warning')
      return
    }
    updateCategory(catModal.id, {
      name: catDraft.name.trim() || catModal.name,
      description: catDraft.description.trim(),
      status: catDraft.status,
    })
    setCatModal(null)
    toast.show('一级分类已保存', 'success')
  }

  const openAddTag = (c: ResourceCategory) => {
    setTagModal({ mode: 'add', category: c })
    setTagDraft({
      tagName: '',
      tagCode: '',
      description: '',
      sortOrder: (c.tags.length + 1) * 10,
      status: 1,
      tagCodeTouched: false,
    })
  }

  const openEditTag = (c: ResourceCategory, t: ResourceTag) => {
    setTagModal({ mode: 'edit', category: c, tag: t })
    setTagDraft({
      tagName: t.tagName,
      tagCode: t.tagCode,
      description: t.description,
      sortOrder: t.sortOrder,
      status: t.status,
      tagCodeTouched: true,
    })
  }

  const saveTag = () => {
    if (!tagModal) return
    if (tagModal.mode === 'add') {
      const input: AddTagInput = {
        tagName: tagDraft.tagName,
        tagCode: tagDraft.tagCode.trim() || suggestTagCode(tagDraft.tagName),
        description: tagDraft.description,
        sortOrder: tagDraft.sortOrder,
        status: tagDraft.status,
      }
      const r = addTag(tagModal.category.id, input)
      if (!r.ok) {
        toast.show(r.reason, 'warning')
        return
      }
      toast.show('已添加二级标签', 'success')
    } else if (tagModal.tag) {
      const r = updateTag(tagModal.category.id, tagModal.tag.id, {
        tagName: tagDraft.tagName,
        tagCode: tagDraft.tagCode.trim(),
        description: tagDraft.description,
        sortOrder: tagDraft.sortOrder,
        status: tagDraft.status,
      })
      if (!r.ok) {
        toast.show(r.reason, 'warning')
        return
      }
      toast.show('标签已保存', 'success')
    }
    setTagModal(null)
  }

  const tryDeleteTag = () => {
    if (!deleteConfirm) return
    const { category, tag } = deleteConfirm
    const n = countResourcesForTag(resources, category.name, tag.tagName)
    const r = removeTag(category.id, tag.id)
    if (!r.ok) {
      toast.show(r.reason, 'warning')
      setDeleteConfirm(null)
      return
    }
    if (n > 0) {
      toast.show(`已删除。曾有 ${n} 条资源使用该标签，历史展示仍保留原「${tag.tagName}」文本。`, 'info')
    } else {
      toast.show('标签已删除', 'success')
    }
    setDeleteConfirm(null)
  }

  const onTagDragStart = (categoryId: string, tagId: string) => {
    if (readOnly) return
    setDragTag({ categoryId, tagId })
  }

  const onTagDrop = (categoryId: string, targetTagId: string) => {
    if (readOnly || !dragTag || dragTag.categoryId !== categoryId) {
      setDragTag(null)
      return
    }
    const cat = categories.find((c) => c.id === categoryId)
    if (!cat) {
      setDragTag(null)
      return
    }
    const ids = [...cat.tags].sort((a, b) => a.sortOrder - b.sortOrder).map((t) => t.id)
    const from = ids.indexOf(dragTag.tagId)
    const to = ids.indexOf(targetTagId)
    if (from < 0 || to < 0 || from === to) {
      setDragTag(null)
      return
    }
    const next = [...ids]
    next.splice(from, 1)
    next.splice(to, 0, dragTag.tagId)
    reorderTags(categoryId, next)
    setDragTag(null)
    toast.show('排序已更新', 'success')
  }

  const usageHint = useMemo(() => {
    if (!deleteConfirm) return 0
    return countResourcesForTag(resources, deleteConfirm.category.name, deleteConfirm.tag.tagName)
  }, [deleteConfirm, resources])

  return (
    <div className="space-y-5">
      <header className="rounded-[var(--radius-panel)] border border-primary/15 bg-gradient-to-r from-primary-light/35 via-surface to-surface px-5 py-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase text-muted">基础数据 · 资源类型</p>
        <h1 className="mt-1 text-[21px] font-bold text-foreground">资源类型配置</h1>
        <p className="mt-2 text-[13px] text-muted">
          此处配置的资源类型将用于资源注册时选择，修改后全局生效。一级分类为系统预置不可删除；二级标签支持增删改与拖拽排序。
        </p>
        {readOnly ? (
          <p className="mt-2 rounded-md bg-page px-3 py-2 text-[12px] text-muted">当前账号为只读权限，仅可查看。</p>
        ) : null}
      </header>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-panel)] border border-divider bg-surface px-4 py-3 shadow-sm">
        <p className="text-[13px] text-muted">说明：停用的一级分类及其二级标签在资源注册下拉中不可见。</p>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit ? (
            <button
              type="button"
              className="rounded-md border border-divider bg-page px-3 py-1.5 text-[12px] font-semibold text-foreground hover:border-primary/40"
              onClick={() => setSortModal(true)}
            >
              一级分类排序
            </button>
          ) : null}
          {isFullAdmin ? (
            <button
              type="button"
              className="rounded-md border border-warning/40 bg-warning/10 px-3 py-1.5 text-[12px] font-bold text-warning hover:bg-warning/15"
              onClick={() => setRestoreConfirm(true)}
            >
              恢复默认
            </button>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-panel)] border border-divider bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-[13px]">
            <thead className="bg-page text-[12px] font-bold text-muted">
              <tr>
                <th className="w-10 px-2 py-2" />
                <th className="px-3 py-2 text-start">一级分类</th>
                <th className="px-3 py-2 text-start">二级标签（可增删改 · 拖拽排序）</th>
                <th className="w-[200px] px-3 py-2 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {categories.map((c) => {
                const expanded = !collapsed.has(c.id)
                const sortedTags = [...c.tags].sort((a, b) => a.sortOrder - b.sortOrder)
                return (
                  <tr key={c.id} className="align-top">
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => toggleRow(c.id)}
                        className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-page"
                        title={expanded ? '折叠' : '展开'}
                      >
                        <span className={cn('inline-block transition-transform', expanded ? 'rotate-90' : '')}>▶</span>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-foreground">{c.name}</div>
                      <div className="mt-1 text-[11px] text-muted">
                        {c.code} · {c.status === 1 ? '启用' : '停用'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {expanded ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {sortedTags.map((t) => (
                            <div
                              key={t.id}
                              draggable={!readOnly}
                              onDragStart={() => onTagDragStart(c.id, t.id)}
                              onDragOver={(e) => {
                                e.preventDefault()
                              }}
                              onDrop={() => onTagDrop(c.id, t.id)}
                              className={cn(
                                'group inline-flex max-w-full cursor-grab items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors active:cursor-grabbing',
                                t.status === 1
                                  ? 'border-primary/25 bg-primary/10 text-primary'
                                  : 'border-divider bg-page text-muted line-through',
                              )}
                            >
                              <button
                                type="button"
                                disabled={readOnly}
                                onClick={() => openEditTag(c, t)}
                                className="min-w-0 truncate text-start hover:underline"
                                title="编辑"
                              >
                                {t.tagName}
                              </button>
                              <span className="hidden text-muted group-hover:inline" aria-hidden>
                                ✎
                              </span>
                              {!readOnly ? (
                                <button
                                  type="button"
                                  className="ms-0.5 rounded-full px-1 text-muted hover:bg-danger/15 hover:text-danger"
                                  title="删除"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteConfirm({ category: c, tag: t })
                                  }}
                                >
                                  ✕
                                </button>
                              ) : null}
                            </div>
                          ))}
                          {!readOnly ? (
                            <button
                              type="button"
                              onClick={() => openAddTag(c)}
                              className="rounded-full border border-dashed border-primary/40 px-2.5 py-1 text-[12px] font-bold text-primary hover:bg-primary-light/40"
                            >
                              + 添加
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-[12px] text-muted">已折叠 · {sortedTags.length} 个标签</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-end">
                      <div className="flex flex-wrap justify-end gap-2">
                        {!readOnly ? (
                          <button type="button" className="font-semibold text-primary hover:underline" onClick={() => openEditCategory(c)}>
                            编辑分类
                          </button>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={Boolean(catModal)} title="编辑一级分类" onClose={() => setCatModal(null)} panelClassName="max-w-md">
        {catModal ? (
          <div className="space-y-3 text-[13px]">
            <label className="block text-muted">
              分类名称
              <input
                className="mt-1 w-full rounded-md border border-divider px-3 py-2"
                value={catDraft.name}
                onChange={(e) => setCatDraft((d) => ({ ...d, name: e.target.value }))}
                disabled={readOnly}
              />
            </label>
            <div>
              <span className="text-muted">分类标识</span>
              <p className="mt-1 rounded-md bg-page px-3 py-2 font-mono text-[12px] text-foreground">{catModal.code}（只读）</p>
            </div>
            <label className="block text-muted">
              描述
              <textarea
                className="mt-1 w-full rounded-md border border-divider px-3 py-2"
                rows={2}
                value={catDraft.description}
                onChange={(e) => setCatDraft((d) => ({ ...d, description: e.target.value }))}
                disabled={readOnly}
              />
            </label>
            <div>
              <p className="text-muted">状态</p>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={catDraft.status === 1}
                    onChange={() => setCatDraft((d) => ({ ...d, status: 1 }))}
                    disabled={readOnly}
                  />
                  启用
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={catDraft.status === 0}
                    onChange={() => setCatDraft((d) => ({ ...d, status: 0 }))}
                    disabled={readOnly}
                  />
                  停用
                </label>
              </div>
              {catModal.isSystem && !isFullAdmin ? (
                <p className="mt-2 text-[11px] text-warning">系统预置分类的停用仅系统管理员可操作。</p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded-md border border-divider px-4 py-2" onClick={() => setCatModal(null)}>
                取消
              </button>
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 font-bold text-white"
                disabled={readOnly}
                onClick={saveCategory}
              >
                保存
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(tagModal)} title={tagModal?.mode === 'add' ? '添加二级标签' : '编辑二级标签'} onClose={() => setTagModal(null)} panelClassName="max-w-md">
        {tagModal ? (
          <div className="space-y-3 text-[13px]">
            <p className="rounded-md bg-page px-3 py-2 text-muted">
              所属一级分类：<span className="font-semibold text-foreground">{tagModal.category.name}</span>
            </p>
            <label className="block text-muted">
              标签名称
              <input
                className="mt-1 w-full rounded-md border border-divider px-3 py-2"
                value={tagDraft.tagName}
                onChange={(e) => {
                  const v = e.target.value
                  setTagDraft((d) => ({
                    ...d,
                    tagName: v,
                    tagCode: tagModal.mode === 'add' && !d.tagCodeTouched ? suggestTagCode(v) : d.tagCode,
                  }))
                }}
                disabled={readOnly}
              />
            </label>
            <label className="block text-muted">
              标签标识（英文小写+下划线，唯一）
              <input
                className="mt-1 w-full rounded-md border border-divider px-3 py-2 font-mono text-[12px]"
                value={tagDraft.tagCode}
                onChange={(e) => setTagDraft((d) => ({ ...d, tagCode: e.target.value, tagCodeTouched: true }))}
                disabled={readOnly || tagModal.tag?.isSystem}
              />
            </label>
            {tagModal.tag?.isSystem ? <p className="text-[11px] text-muted">系统预置标签的标识不可修改。</p> : null}
            <label className="block text-muted">
              描述（可选）
              <input
                className="mt-1 w-full rounded-md border border-divider px-3 py-2"
                value={tagDraft.description}
                onChange={(e) => setTagDraft((d) => ({ ...d, description: e.target.value }))}
                disabled={readOnly}
              />
            </label>
            <label className="block text-muted">
              排序号（数字越小越靠前）
              <input
                type="number"
                className="mt-1 w-full rounded-md border border-divider px-3 py-2"
                value={tagDraft.sortOrder}
                onChange={(e) => setTagDraft((d) => ({ ...d, sortOrder: Number(e.target.value) || 0 }))}
                disabled={readOnly}
              />
            </label>
            <div>
              <p className="text-muted">状态</p>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={tagDraft.status === 1} onChange={() => setTagDraft((d) => ({ ...d, status: 1 }))} disabled={readOnly} />
                  启用
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={tagDraft.status === 0} onChange={() => setTagDraft((d) => ({ ...d, status: 0 }))} disabled={readOnly} />
                  停用
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded-md border border-divider px-4 py-2" onClick={() => setTagModal(null)}>
                取消
              </button>
              <button type="button" className="rounded-md bg-primary px-4 py-2 font-bold text-white" disabled={readOnly} onClick={saveTag}>
                保存
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(deleteConfirm)} title="删除二级标签" onClose={() => setDeleteConfirm(null)} panelClassName="max-w-md">
        {deleteConfirm ? (
          <div className="space-y-3 text-[13px]">
            <p>
              确定删除标签 <span className="font-bold text-foreground">【{deleteConfirm.tag.tagName}】</span> 吗？
            </p>
            <p className="text-muted">
              删除后，已使用该标签的资源将受到影响（保留历史标签文本，但不再可选）。{usageHint > 0 ? `当前有 ${usageHint} 个演示资源正在使用该标签。` : ''}
              是否继续？
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded-md border border-divider px-4 py-2" onClick={() => setDeleteConfirm(null)}>
                取消
              </button>
              <button type="button" className="rounded-md bg-danger px-4 py-2 font-bold text-white" onClick={tryDeleteTag}>
                删除
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={restoreConfirm} title="恢复默认" onClose={() => setRestoreConfirm(false)} panelClassName="max-w-md">
        <p className="text-[13px] text-muted">
          将删除所有自定义二级标签并重置为系统预置分类及标签。此操作不可撤销（演示环境）。是否继续？
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setRestoreConfirm(false)}>
            取消
          </button>
          <button
            type="button"
            className="rounded-md bg-danger px-4 py-2 text-[13px] font-bold text-white"
            onClick={() => {
              restoreDefaults()
              setRestoreConfirm(false)
              toast.show('已恢复系统预置数据', 'success')
            }}
          >
            确认恢复
          </button>
        </div>
      </Modal>

      <Modal open={sortModal} title="一级分类排序" onClose={() => setSortModal(false)} panelClassName="max-w-md">
        <p className="mb-3 text-[12px] text-muted">调整一级分类在列表与下拉中的顺序（按排序号升序）。</p>
        <ul className="divide-y divide-divider rounded-lg border border-divider">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 text-[13px]">
              <span className="font-medium">{c.name}</span>
              <span className="tabular-nums text-muted">{c.sortOrder}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded border border-divider px-2 py-1 text-[12px] hover:bg-page"
                  disabled={readOnly}
                  onClick={() => moveCategory(c.id, 'up')}
                >
                  上移
                </button>
                <button
                  type="button"
                  className="rounded border border-divider px-2 py-1 text-[12px] hover:bg-page"
                  disabled={readOnly}
                  onClick={() => moveCategory(c.id, 'down')}
                >
                  下移
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-white" onClick={() => setSortModal(false)}>
            完成
          </button>
        </div>
      </Modal>
    </div>
  )
}
