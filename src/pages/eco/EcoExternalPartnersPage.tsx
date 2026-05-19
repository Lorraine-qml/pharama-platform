import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { Modal } from '../../components/Modal'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import { downloadCsv } from './ecoDownload'
import { ecoPartnerAccess } from './ecoPermissions'
import type { ExternalPartner, PartnerCoopStatus, PartnerOrgType } from './ecoTypes'
import { useEco } from './EcoContext'

const ORG_TYPES: PartnerOrgType[] = ['CRO', '医院', '高校', '检测机构', '投资机构']
const COOP: PartnerCoopStatus[] = ['进行中', '意向中', '已结束']

const emptyDraft = (): Omit<ExternalPartner, 'id'> => ({
  name: '',
  orgType: 'CRO',
  contact: '',
  phone: '',
  email: '',
  coopStatus: '进行中',
  linkedProjectId: null,
  remark: '',
})

function projectLabel(archives: { id: string; name: string }[], id: string | null) {
  if (!id) return '—'
  const a = archives.find((x) => x.id === id)
  return a ? `${a.name}（${a.id}）` : id
}

function maskPhone(phone: string) {
  const d = phone.replace(/\s/g, '')
  if (d.length < 8) return phone
  return `${d.slice(0, 3)}****${d.slice(-4)}`
}

export default function EcoExternalPartnersPage() {
  const { user } = useAuth()
  const toast = useToast()
  const role = user?.role ?? 'member'
  const access = ecoPartnerAccess(role)
  const { archives } = useHatchMgmt()
  const { partners, addPartner, updatePartner, removePartner } = useEco()

  const physicalProjects = useMemo(
    () => archives.filter((a) => a.incubationType === '实体'),
    [archives],
  )

  const [fType, setFType] = useState<PartnerOrgType | '全部'>('全部')
  const [fCoop, setFCoop] = useState<PartnerCoopStatus | '全部'>('全部')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Omit<ExternalPartner, 'id'>>(emptyDraft)

  const [detailRow, setDetailRow] = useState<ExternalPartner | null>(null)
  const [deleteRow, setDeleteRow] = useState<ExternalPartner | null>(null)

  useEffect(() => {
    setPage(1)
  }, [fType, fCoop, q])

  const filtered = useMemo(() => {
    return partners.filter((r) => {
      if (fType !== '全部' && r.orgType !== fType) return false
      if (fCoop !== '全部' && r.coopStatus !== fCoop) return false
      if (q.trim() && !r.name.includes(q.trim())) return false
      return true
    })
  }, [partners, fType, fCoop, q])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  function openAdd() {
    setEditingId(null)
    setDraft(emptyDraft())
    setEditorOpen(true)
  }

  function openEdit(row: ExternalPartner) {
    setEditingId(row.id)
    setDraft({
      name: row.name,
      orgType: row.orgType,
      contact: row.contact,
      phone: row.phone,
      email: row.email,
      coopStatus: row.coopStatus,
      linkedProjectId: row.linkedProjectId,
      remark: row.remark,
    })
    setEditorOpen(true)
  }

  function saveEditor() {
    if (!draft.name.trim() || !draft.contact.trim() || !draft.phone.trim()) {
      toast.show('请填写必填项：机构名称、联系人、联系电话', 'warning')
      return
    }
    if (editingId) {
      updatePartner(editingId, draft)
      toast.show('已保存', 'success')
    } else {
      addPartner(draft)
      toast.show('已新增机构', 'success')
    }
    setEditorOpen(false)
  }

  function exportCsv() {
    downloadCsv(
      `外部合作_${new Date().toISOString().slice(0, 10)}.csv`,
      ['机构名称', '类型', '联系人', '电话', '邮箱', '合作状态', '关联实体项目', '备注'],
      filtered.map((r) => [
        r.name,
        r.orgType,
        r.contact,
        r.phone,
        r.email,
        r.coopStatus,
        projectLabel(physicalProjects, r.linkedProjectId),
        r.remark,
      ]),
    )
    toast.show('已导出 CSV（演示）', 'info')
  }

  if (!access.canView) {
    return (
      <div className="space-y-4 pb-10">
        <ModuleIntroCard
          title="🤝 外部合作"
          lines={['当前角色（专家）无此模块访问权限。', '需求见 docs/eco-synergy/05-external-partners-spec.md']}
        />
        <p className="rounded-lg border border-dashed border-divider bg-muted/10 px-4 py-6 text-[13px] text-muted">
          您暂无权限浏览外部合作机构列表。如需演示，请切换为园区运营或企业管理员账号。
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="🤝 外部合作"
        lines={[
          '管理 CRO、医院、高校等机构；支持类型/合作状态/名称筛选，关联入孵实体项目。',
          '权限与虚拟项目一致：运营/企业管理员可维护；项目方只读；专家无权限。',
        ]}
      />

      <h1 className="text-lg font-bold text-foreground">外部合作</h1>

      <ListToolbarRow
        left={
          <>
            {access.canWrite ? (
              <button
                type="button"
                className="rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
                onClick={openAdd}
              >
                + 新增机构
              </button>
            ) : null}
            <button type="button" className="rounded-md border border-divider bg-surface px-3 py-2 text-[13px]" onClick={() => toast.show('导入（演示）', 'info')}>
              导入
            </button>
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
                value={fType}
                onChange={(e) => setFType(e.target.value as typeof fType)}
                className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]"
              >
                <option value="全部">全部</option>
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[12px] text-muted">
              合作状态
              <select
                value={fCoop}
                onChange={(e) => setFCoop(e.target.value as typeof fCoop)}
                className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]"
              >
                <option value="全部">全部</option>
                {COOP.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[200px] text-[12px] text-muted">
              机构名称
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
          <table className="min-w-[1000px] w-full border-collapse">
            <thead className="sticky top-0 z-[1] border-b border-divider bg-[#F5F7FA] text-left text-[12px] font-bold text-muted">
              <tr>
                <th className="px-4 py-3">机构名称</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">联系人</th>
                <th className="px-4 py-3">电话</th>
                <th className="px-4 py-3">合作状态</th>
                <th className="px-4 py-3">关联实体项目</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.id} className="h-12 border-b border-divider hover:bg-primary-light/15">
                  <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-3 text-muted">{r.orgType}</td>
                  <td className="px-4 py-3 text-muted">{r.contact}</td>
                  <td className="px-4 py-3 text-muted">{maskPhone(r.phone)}</td>
                  <td className="px-4 py-3 text-muted">{r.coopStatus}</td>
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
                    <button type="button" className="ml-2 text-primary hover:underline" onClick={() => setDetailRow(r)}>
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
        title={editingId ? '编辑外部合作机构' : '新增外部合作机构'}
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
            <span className="text-muted">机构名称（必填）</span>
            <input
              className="mt-1 w-full rounded-md border border-divider px-3 py-2"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-muted">机构类型</span>
            <select
              className="mt-1 w-full rounded-md border border-divider px-3 py-2"
              value={draft.orgType}
              onChange={(e) => setDraft((d) => ({ ...d, orgType: e.target.value as PartnerOrgType }))}
            >
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
            <span className="text-muted">合作状态</span>
            <select
              className="mt-1 w-full rounded-md border border-divider px-3 py-2"
              value={draft.coopStatus}
              onChange={(e) => setDraft((d) => ({ ...d, coopStatus: e.target.value as PartnerCoopStatus }))}
            >
              {COOP.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
          <label className="block">
            <span className="text-muted">备注</span>
            <input
              className="mt-1 w-full rounded-md border border-divider px-3 py-2"
              value={draft.remark}
              onChange={(e) => setDraft((d) => ({ ...d, remark: e.target.value }))}
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={Boolean(detailRow)}
        title={detailRow ? `机构详情 · ${detailRow.name}` : ''}
        onClose={() => setDetailRow(null)}
        panelClassName="max-w-lg"
        footer={
          <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => setDetailRow(null)}>
            关闭
          </button>
        }
      >
        {detailRow ? (
          <dl className="grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">类型</dt>
              <dd>{detailRow.orgType}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">合作状态</dt>
              <dd>{detailRow.coopStatus}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">联系人</dt>
              <dd>{detailRow.contact}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">电话</dt>
              <dd>{detailRow.phone}</dd>
            </div>
            <div className="sm:col-span-2 flex justify-between gap-2">
              <dt className="text-muted">邮箱</dt>
              <dd>{detailRow.email || '—'}</dd>
            </div>
            <div className="sm:col-span-2 flex justify-between gap-2">
              <dt className="text-muted">关联实体项目</dt>
              <dd>{projectLabel(physicalProjects, detailRow.linkedProjectId)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">备注</dt>
              <dd className="mt-1">{detailRow.remark || '—'}</dd>
            </div>
          </dl>
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
                  removePartner(deleteRow.id)
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
        <p className="text-[13px] text-muted">确定删除机构「{deleteRow?.name}」吗？</p>
      </Modal>
    </div>
  )
}
