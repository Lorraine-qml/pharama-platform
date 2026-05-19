import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { Modal } from '../../components/Modal'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import { downloadCsv } from './ecoDownload'
import { ecoVirtualAccess } from './ecoPermissions'
import type { VirtualProject, VirtualProjectStatus } from './ecoTypes'
import { useEco } from './EcoContext'

const DOMAINS = ['类器官', 'AI制药', '合成生物', '分子诊断', '其他'] as const

const emptyDraft = (): Omit<VirtualProject, 'id'> => ({
  name: '',
  domain: DOMAINS[0],
  resourceNeed: '',
  contact: '',
  phone: '',
  email: '',
  linkedProjectId: null,
  status: '启用',
})

function projectLabel(archives: { id: string; name: string }[], id: string | null) {
  if (!id) return '—'
  const a = archives.find((x) => x.id === id)
  return a ? `${a.name}（${a.id}）` : id
}

export default function EcoVirtualProjectsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const role = user?.role ?? 'member'
  const access = ecoVirtualAccess(role)
  const { archives } = useHatchMgmt()
  const { virtualProjects, addVirtualProject, updateVirtualProject, removeVirtualProject } = useEco()

  const physicalProjects = useMemo(
    () => archives.filter((a) => a.incubationType === '实体'),
    [archives],
  )

  const [fDomain, setFDomain] = useState<string>('全部')
  const [fStatus, setFStatus] = useState<'全部' | VirtualProjectStatus>('全部')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Omit<VirtualProject, 'id'>>(emptyDraft)

  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteRow, setDeleteRow] = useState<VirtualProject | null>(null)

  useEffect(() => {
    setPage(1)
  }, [fDomain, fStatus, q])

  const filtered = useMemo(() => {
    return virtualProjects.filter((r) => {
      if (fDomain !== '全部' && r.domain !== fDomain) return false
      if (fStatus !== '全部' && r.status !== fStatus) return false
      if (q.trim() && !r.name.includes(q.trim())) return false
      return true
    })
  }, [virtualProjects, fDomain, fStatus, q])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  function openAdd() {
    setEditingId(null)
    setDraft(emptyDraft())
    setEditorOpen(true)
  }

  function openEdit(row: VirtualProject) {
    setEditingId(row.id)
    setDraft({
      name: row.name,
      domain: row.domain as (typeof DOMAINS)[number],
      resourceNeed: row.resourceNeed,
      contact: row.contact,
      phone: row.phone,
      email: row.email,
      linkedProjectId: row.linkedProjectId,
      status: row.status,
    })
    setEditorOpen(true)
  }

  function saveEditor() {
    if (!draft.name.trim() || !draft.contact.trim() || !draft.phone.trim()) {
      toast.show('请填写必填项：项目名称、联系人、联系电话', 'warning')
      return
    }
    if (editingId) {
      updateVirtualProject(editingId, draft)
      toast.show('已保存', 'success')
    } else {
      addVirtualProject(draft)
      toast.show('已新增虚拟项目', 'success')
    }
    setEditorOpen(false)
  }

  function exportCsv() {
    downloadCsv(
      `虚拟项目_${new Date().toISOString().slice(0, 10)}.csv`,
      ['项目名称', '所属领域', '资源需求', '联系人', '电话', '邮箱', '状态', '关联实体项目'],
      filtered.map((r) => [
        r.name,
        r.domain,
        r.resourceNeed,
        r.contact,
        r.phone,
        r.email,
        r.status,
        projectLabel(physicalProjects, r.linkedProjectId),
      ]),
    )
    toast.show('已导出 CSV（演示）', 'info')
  }

  const detail = detailId ? virtualProjects.find((r) => r.id === detailId) : null

  if (!access.canView) {
    return (
      <div className="space-y-4 pb-10">
        <ModuleIntroCard
          title="📎 虚拟项目"
          lines={['当前角色（专家）无此模块访问权限。', '需求说明见 docs/eco-synergy/04-virtual-projects-spec.md']}
        />
        <p className="rounded-lg border border-dashed border-divider bg-muted/10 px-4 py-6 text-[13px] text-muted">
          您暂无权限浏览虚拟项目列表。如需演示，请切换为园区运营或企业管理员账号。
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="📎 虚拟项目"
        lines={[
          '管理不占实体空间的虚拟入孵项目；支持领域/状态/名称筛选、关联入孵实体项目、导出与 CRUD。',
          '权限：园区运营 / 企业管理员可维护；项目方只读；专家无权限。',
          '完整需求见 docs/eco-synergy/04-virtual-projects-spec.md',
        ]}
      />

      <h1 className="text-lg font-bold text-foreground">虚拟项目</h1>

      <ListToolbarRow
        left={
          <>
            {access.canWrite ? (
              <button
                type="button"
                className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
                onClick={openAdd}
              >
                + 新增虚拟项目
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
              领域
              <select
                value={fDomain}
                onChange={(e) => setFDomain(e.target.value)}
                className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]"
              >
                <option value="全部">全部</option>
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[12px] text-muted">
              状态
              <select
                value={fStatus}
                onChange={(e) => setFStatus(e.target.value as typeof fStatus)}
                className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]"
              >
                {(['全部', '启用', '停用'] as const).map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[200px] text-[12px] text-muted">
              项目名称
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
                <th className="px-4 py-3">项目名称</th>
                <th className="px-4 py-3">所属领域</th>
                <th className="px-4 py-3">资源需求</th>
                <th className="px-4 py-3">联系人</th>
                <th className="px-4 py-3">关联实体项目</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.id} className="h-12 border-b border-divider hover:bg-primary-light/15">
                  <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-3 text-muted">{r.domain}</td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-muted" title={r.resourceNeed}>
                    {r.resourceNeed}
                  </td>
                  <td className="px-4 py-3 text-muted">{r.contact}</td>
                  <td className="px-4 py-3 text-muted">{projectLabel(physicalProjects, r.linkedProjectId)}</td>
                  <td className="px-4 py-3 text-end text-[13px]">
                    {access.canWrite ? (
                      <button type="button" className="text-primary hover:underline" onClick={() => openEdit(r)}>
                        编辑
                      </button>
                    ) : null}
                    {access.canWrite ? (
                      <button type="button" className="ml-2 text-rose-600 hover:underline" onClick={() => setDeleteRow(r)}>
                        删除
                      </button>
                    ) : null}
                    <button type="button" className="ml-2 text-primary hover:underline" onClick={() => setDetailId(r.id)}>
                      详情
                    </button>
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
        title={editingId ? '编辑虚拟项目' : '新增虚拟项目'}
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
            <span className="text-muted">项目名称（必填）</span>
            <input
              className="mt-1 w-full rounded-md border border-divider px-3 py-2"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-muted">所属领域</span>
            <select
              className="mt-1 w-full rounded-md border border-divider px-3 py-2"
              value={draft.domain}
              onChange={(e) => setDraft((d) => ({ ...d, domain: e.target.value }))}
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-muted">资源需求</span>
            <input
              className="mt-1 w-full rounded-md border border-divider px-3 py-2"
              value={draft.resourceNeed}
              onChange={(e) => setDraft((d) => ({ ...d, resourceNeed: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-muted">联系人（必填）</span>
            <input
              className="mt-1 w-full rounded-md border border-divider px-3 py-2"
              value={draft.contact}
              onChange={(e) => setDraft((d) => ({ ...d, contact: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-muted">联系电话（必填）</span>
            <input
              className="mt-1 w-full rounded-md border border-divider px-3 py-2"
              value={draft.phone}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-muted">电子邮箱（选填）</span>
            <input
              className="mt-1 w-full rounded-md border border-divider px-3 py-2"
              value={draft.email}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-muted">关联实体项目</span>
            <select
              className="mt-1 w-full rounded-md border border-divider px-3 py-2"
              value={draft.linkedProjectId ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, linkedProjectId: e.target.value || null }))}
            >
              <option value="">无</option>
              {physicalProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}（{p.id}）
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="text-muted">状态</span>
            <div className="mt-2 flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={draft.status === '启用'}
                  onChange={() => setDraft((d) => ({ ...d, status: '启用' }))}
                />
                启用
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={draft.status === '停用'}
                  onChange={() => setDraft((d) => ({ ...d, status: '停用' }))}
                />
                停用
              </label>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(detail)}
        title={detail ? `虚拟项目档案 · ${detail.name}` : ''}
        onClose={() => setDetailId(null)}
        panelClassName="max-w-xl"
        footer={
          <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setDetailId(null)}>
            关闭
          </button>
        }
      >
        {detail ? (
          <div className="space-y-4 text-[13px]">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">领域</dt>
                <dd>{detail.domain}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">状态</dt>
                <dd>{detail.status}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">资源需求</dt>
                <dd className="mt-1">{detail.resourceNeed || '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">联系人</dt>
                <dd>{detail.contact}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">电话</dt>
                <dd>{detail.phone}</dd>
              </div>
              <div className="sm:col-span-2 flex justify-between gap-2">
                <dt className="text-muted">邮箱</dt>
                <dd>{detail.email || '—'}</dd>
              </div>
              <div className="sm:col-span-2 flex justify-between gap-2">
                <dt className="text-muted">关联实体项目</dt>
                <dd>{projectLabel(physicalProjects, detail.linkedProjectId)}</dd>
              </div>
            </dl>
            <div>
              <div className="mb-2 font-semibold text-foreground">关联资源使用记录（演示）</div>
              <div className="overflow-hidden rounded-md border border-divider">
                <table className="w-full border-collapse text-[12px]">
                  <thead className="bg-muted/30 text-muted">
                    <tr>
                      <th className="px-2 py-2 text-left">资源</th>
                      <th className="px-2 py-2 text-left">用量</th>
                      <th className="px-2 py-2 text-left">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-divider">
                      <td className="px-2 py-2">共享实验室预约</td>
                      <td className="px-2 py-2">12 h</td>
                      <td className="px-2 py-2">近 30 天</td>
                    </tr>
                    <tr className="border-t border-divider">
                      <td className="px-2 py-2">AI 初筛报告</td>
                      <td className="px-2 py-2">3 次</td>
                      <td className="px-2 py-2">近 30 天</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
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
                if (deleteRow) {
                  removeVirtualProject(deleteRow.id)
                  toast.show('已删除', 'success')
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
          确定删除虚拟项目「{deleteRow?.name}」吗？此操作在演示环境中可恢复为刷新页面。
        </p>
      </Modal>
    </div>
  )
}
