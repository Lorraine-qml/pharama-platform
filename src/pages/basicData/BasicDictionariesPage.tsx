import { useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import type { DictGroupRecord, DictKind, DictTag } from './basicDataTypes'
import { useBasicDataDemo } from './BasicDataDemoContext'

const PROJECT_STATUS_COLORS = ['橙色', '绿色', '红色', '灰色'] as const

function dictKindOf(g: DictGroupRecord): DictKind {
  return g.dictKind ?? 'simple'
}

function colorPillClass(color: string | undefined) {
  switch (color) {
    case '橙色':
      return 'bg-warning/15 text-warning ring-1 ring-warning/25'
    case '绿色':
      return 'bg-success/15 text-success ring-1 ring-success/25'
    case '红色':
      return 'bg-danger/15 text-danger ring-1 ring-danger/25'
    case '灰色':
    default:
      return 'bg-page text-muted ring-1 ring-divider'
  }
}

export default function BasicDictionariesPage() {
  const toast = useToast()
  const { dictGroups, setDictGroups } = useBasicDataDemo()
  const [manage, setManage] = useState<DictGroupRecord | null>(null)
  const [draftEdit, setDraftEdit] = useState<DictTag | null>(null)
  const [tagLabel, setTagLabel] = useState('')
  const [newGroup, setNewGroup] = useState('')

  const manageKind = manage ? dictKindOf(manage) : 'simple'

  const sortedIncubationTags = useMemo(() => {
    if (!manage || dictKindOf(manage) !== 'incubation_type') return []
    return [...manage.tags].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [manage])

  function commitDraftToManage() {
    if (!manage || !draftEdit) return
    const kind = dictKindOf(manage)
    if (kind === 'incubation_type' && draftEdit.isDefault) {
      setManage({
        ...manage,
        tags: manage.tags.map((x) => (x.id === draftEdit.id ? { ...draftEdit } : { ...x, isDefault: false })),
      })
    } else {
      setManage({
        ...manage,
        tags: manage.tags.map((x) => (x.id === draftEdit.id ? { ...draftEdit } : x)),
      })
    }
    setDraftEdit(null)
    toast.show('本行已保存到当前编辑区，请点击底部「保存本分组变更」写入会话', 'info')
  }

  function openManage(g: DictGroupRecord) {
    setDraftEdit(null)
    setManage(structuredClone(g))
  }

  return (
    <div className="space-y-4">
      <header className="rounded-[var(--radius-panel)] border border-primary/15 bg-gradient-to-r from-primary-light/35 via-surface to-surface px-5 py-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase text-muted">基础数据 · 7.5</p>
        <h1 className="mt-1 text-[21px] font-bold text-foreground">字典标签管理</h1>
        <p className="mt-2 text-[13px] text-muted">
          按分组维护下拉项；预置分组含「入孵类型」「项目状态」等结构化字典（标识、展示色、业务规则）。普通分组为简单标签列表。
        </p>
      </header>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[14px] font-bold">字典分组</h2>
          <div className="flex gap-2">
            <input className="rounded-lg border px-3 py-2 text-[13px]" placeholder="新分组英文名" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} />
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-[12px] font-bold text-white"
              onClick={() => {
                if (!newGroup.trim()) {
                  toast.show('请输入分组名称', 'warning')
                  return
                }
                setDictGroups((g) => [
                  ...g,
                  { id: `dg-${Math.random().toString(36).slice(2, 7)}`, name: newGroup.trim(), preset: false, tags: [] },
                ])
                toast.show('分组已创建', 'success')
                setNewGroup('')
              }}
            >
              + 新建字典分组
            </button>
          </div>
        </div>

        <table className="mt-4 w-full min-w-[600px] text-left text-[13px]">
          <thead className="border-b border-divider text-[11px] text-muted uppercase">
            <tr>
              <th className="py-2">字典分组</th>
              <th className="py-2">形态</th>
              <th className="py-2">属性</th>
              <th className="py-2 text-end">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {dictGroups.map((dg) => (
              <tr key={dg.id}>
                <td className="py-3 font-semibold">{dg.name}</td>
                <td className="py-3 text-muted">
                  {dictKindOf(dg) === 'simple' ? '简单标签' : dictKindOf(dg) === 'incubation_type' ? '入孵类型' : '项目状态'}
                </td>
                <td className="py-3 text-muted">{dg.preset ? '系统预置' : '自定义'}</td>
                <td className="py-3 text-end">
                  <button type="button" className="font-semibold text-primary underline" onClick={() => openManage(dg)}>
                    管理标签
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal
        open={manage !== null}
        title={manage ? `${manage.name} · 标签` : ''}
        onClose={() => {
          setManage(null)
          setDraftEdit(null)
          setTagLabel('')
        }}
        footer={
          <div className="flex justify-between gap-2">
            <button type="button" className="rounded-md border px-3 py-2 text-[13px]" onClick={() => toast.show('占位：Excel 批量导入', 'info')}>
              批量导入
            </button>
            <button type="button" className="rounded-md border px-3 py-2 text-[13px]" onClick={() => { setManage(null); setDraftEdit(null) }}>
              关闭
            </button>
          </div>
        }
      >
        {manage && manageKind === 'simple' ? (
          <>
            <ul className="max-h-[320px] space-y-2 overflow-auto text-[13px]">
              {manage.tags.map((t: DictTag) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-divider px-3 py-2">
                  <span className={!t.enabled ? 'text-muted line-through' : undefined}>{t.label}</span>
                  <div className="flex gap-2">
                    <button type="button" className="text-[11px] text-primary" onClick={() => toast.show('拖拽排序占位', 'info')}>
                      拖拽
                    </button>
                    <button
                      type="button"
                      className="text-[11px] text-warning"
                      onClick={() =>
                        setManage({
                          ...manage,
                          tags: manage.tags.map((x) => (x.id === t.id ? { ...x, enabled: !x.enabled } : x)),
                        })
                      }
                    >
                      {t.enabled ? '禁用' : '启用'}
                    </button>
                    <button type="button" className="text-[11px] text-danger" onClick={() => toast.show('占位：校验引用后再删', 'warning')}>
                      删除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <input className="flex-1 rounded border px-2 py-2" placeholder="新标签文本" value={tagLabel} onChange={(e) => setTagLabel(e.target.value)} />
              <button
                type="button"
                className="rounded bg-primary px-3 py-2 text-[12px] font-bold text-white"
                onClick={() => {
                  const label = tagLabel.trim()
                  if (!label || !manage) return
                  setManage({
                    ...manage,
                    tags: [...manage.tags, { id: `tg-${Math.random().toString(36).slice(2, 6)}`, label, enabled: true }],
                  })
                  setTagLabel('')
                }}
              >
                添加标签
              </button>
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-foreground/[0.04] px-3 py-2 text-[13px] font-semibold hover:bg-primary-light"
              onClick={() => {
                if (!manage) return
                setDictGroups((gs) => gs.map((x) => (x.id === manage.id ? structuredClone(manage) : x)))
                toast.show('字典已写入当前会话（演示）', 'success')
              }}
            >
              保存本分组变更
            </button>
          </>
        ) : null}

        {manage && manageKind === 'incubation_type' ? (
          <div className="space-y-3 text-[13px]">
            <p className="text-[12px] text-muted">标识用于接口与前后端对齐；「是否默认」仅允许一条为「是」。</p>
            <div className="max-h-[360px] overflow-auto rounded-lg border border-divider">
              <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
                <thead className="sticky top-0 border-b border-divider bg-page text-[12px] font-bold text-muted">
                  <tr>
                    <th className="px-3 py-2">标识</th>
                    <th className="px-3 py-2">名称</th>
                    <th className="px-3 py-2">排序</th>
                    <th className="px-3 py-2">是否默认</th>
                    <th className="px-3 py-2 text-end">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {sortedIncubationTags.map((t) => {
                    const editing = draftEdit?.id === t.id
                    const row = editing ? draftEdit : t
                    return (
                      <tr key={t.id} className={!t.enabled ? 'opacity-50' : ''}>
                        <td className="px-3 py-2 font-mono text-[12px]">
                          {editing ? (
                            <input
                              className="w-full min-w-[80px] rounded border px-2 py-1 font-mono text-[12px]"
                              value={row.code ?? ''}
                              onChange={(e) => setDraftEdit({ ...row, code: e.target.value })}
                            />
                          ) : (
                            row.code ?? '—'
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editing ? (
                            <input className="w-full rounded border px-2 py-1" value={row.label} onChange={(e) => setDraftEdit({ ...row, label: e.target.value })} />
                          ) : (
                            row.label
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editing ? (
                            <input
                              type="number"
                              className="w-16 rounded border px-2 py-1"
                              value={row.sortOrder ?? ''}
                              onChange={(e) => setDraftEdit({ ...row, sortOrder: Number(e.target.value) || 0 })}
                            />
                          ) : (
                            row.sortOrder ?? '—'
                          )}
                        </td>
                        <td className="px-3 py-2">{editing ? <input type="checkbox" checked={!!row.isDefault} onChange={(e) => setDraftEdit({ ...row, isDefault: e.target.checked })} /> : row.isDefault ? '是' : '否'}</td>
                        <td className="px-3 py-2 text-end">
                          {editing ? (
                            <span className="flex flex-wrap justify-end gap-2">
                              <button type="button" className="text-primary hover:underline" onClick={commitDraftToManage}>
                                保存
                              </button>
                              <button type="button" className="text-muted hover:underline" onClick={() => setDraftEdit(null)}>
                                取消
                              </button>
                            </span>
                          ) : (
                            <span className="flex flex-wrap justify-end gap-2">
                              <button type="button" className="text-primary hover:underline" onClick={() => setDraftEdit({ ...t })}>
                                编辑
                              </button>
                              <button
                                type="button"
                                className="text-[12px] text-muted hover:underline"
                                onClick={() =>
                                  setManage({
                                    ...manage,
                                    tags: manage.tags.map((x) => (x.id === t.id ? { ...x, enabled: !x.enabled } : x)),
                                  })
                                }
                              >
                                {t.enabled ? '禁用' : '启用'}
                              </button>
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="w-full rounded-lg bg-foreground/[0.04] px-3 py-2 text-[13px] font-semibold hover:bg-primary-light"
              onClick={() => {
                if (!manage) return
                setDictGroups((gs) => gs.map((x) => (x.id === manage.id ? structuredClone(manage) : x)))
                toast.show('字典已写入当前会话（演示）', 'success')
              }}
            >
              保存本分组变更
            </button>
          </div>
        ) : null}

        {manage && manageKind === 'project_status' ? (
          <div className="space-y-3 text-[13px]">
            <p className="text-[12px] text-muted">颜色用于前端状态标签样式映射；「可申请资源」控制该状态下项目能否发起资源申请。</p>
            <div className="max-h-[380px] overflow-auto rounded-lg border border-divider">
              <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
                <thead className="sticky top-0 border-b border-divider bg-page text-[12px] font-bold text-muted">
                  <tr>
                    <th className="px-3 py-2">标识</th>
                    <th className="px-3 py-2">名称</th>
                    <th className="px-3 py-2">颜色</th>
                    <th className="px-3 py-2">可申请资源</th>
                    <th className="px-3 py-2 text-end">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {manage.tags.map((t) => {
                    const editing = draftEdit?.id === t.id
                    const row = editing ? draftEdit : t
                    return (
                      <tr key={t.id} className={!t.enabled ? 'opacity-50' : ''}>
                        <td className="px-3 py-2 font-mono text-[12px]">
                          {editing ? (
                            <input
                              className="w-full min-w-[100px] rounded border px-2 py-1 font-mono text-[12px]"
                              value={row.code ?? ''}
                              onChange={(e) => setDraftEdit({ ...row, code: e.target.value })}
                            />
                          ) : (
                            row.code ?? '—'
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editing ? (
                            <input className="w-full rounded border px-2 py-1" value={row.label} onChange={(e) => setDraftEdit({ ...row, label: e.target.value })} />
                          ) : (
                            row.label
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editing ? (
                            <select
                              className="rounded border px-2 py-1"
                              value={row.color ?? '灰色'}
                              onChange={(e) => setDraftEdit({ ...row, color: e.target.value })}
                            >
                              {PROJECT_STATUS_COLORS.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold', colorPillClass(row.color))}>{row.color ?? '—'}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editing ? (
                            <label className="inline-flex items-center gap-2 text-[12px] text-muted">
                              <input type="checkbox" checked={!!row.canRequestResources} onChange={(e) => setDraftEdit({ ...row, canRequestResources: e.target.checked })} />
                              可申请
                            </label>
                          ) : row.canRequestResources ? (
                            '是'
                          ) : (
                            '否'
                          )}
                        </td>
                        <td className="px-3 py-2 text-end">
                          {editing ? (
                            <span className="flex flex-wrap justify-end gap-2">
                              <button type="button" className="text-primary hover:underline" onClick={commitDraftToManage}>
                                保存
                              </button>
                              <button type="button" className="text-muted hover:underline" onClick={() => setDraftEdit(null)}>
                                取消
                              </button>
                            </span>
                          ) : (
                            <span className="flex flex-wrap justify-end gap-2">
                              <button type="button" className="text-primary hover:underline" onClick={() => setDraftEdit({ ...t })}>
                                编辑
                              </button>
                              <button
                                type="button"
                                className="text-[12px] text-muted hover:underline"
                                onClick={() =>
                                  setManage({
                                    ...manage,
                                    tags: manage.tags.map((x) => (x.id === t.id ? { ...x, enabled: !x.enabled } : x)),
                                  })
                                }
                              >
                                {t.enabled ? '禁用' : '启用'}
                              </button>
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="w-full rounded-lg bg-foreground/[0.04] px-3 py-2 text-[13px] font-semibold hover:bg-primary-light"
              onClick={() => {
                if (!manage) return
                setDictGroups((gs) => gs.map((x) => (x.id === manage.id ? structuredClone(manage) : x)))
                toast.show('字典已写入当前会话（演示）', 'success')
              }}
            >
              保存本分组变更
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
