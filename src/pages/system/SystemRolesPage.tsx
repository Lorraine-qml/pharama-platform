import { useCallback, useMemo, useState } from 'react'
import { NAV_SECTIONS, flattenSectionChildren, type NavSection } from '../../config/navigation'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { SysTableWrap } from './SystemPageChrome'

type RoleRow = {
  id: string
  title: string
  code: string
  users: number
  created: string
  enabled: boolean
}

const ASSIGN_MENU = NAV_SECTIONS.filter((s) => s.key !== 'system-mgmt')

const DEMO_ROLES: RoleRow[] = [
  { id: 'r1', title: '运营经理', code: 'operation_mgr', users: 12, created: '2025-01-01', enabled: true },
  { id: 'r2', title: '招商专员', code: 'investment', users: 8, created: '2025-01-01', enabled: true },
  { id: 'r3', title: '项目方管理员', code: 'project_admin', users: 45, created: '2025-01-02', enabled: true },
  { id: 'r4', title: '系统管理员', code: 'sys_admin', users: 3, created: '2024-12-20', enabled: true },
]

type OpsKey = 'view' | 'add' | 'edit' | 'del' | 'export'
type DataScope = 'self' | 'dept' | 'all'

export default function SystemRolesPage() {
  const toast = useToast()
  const [roles, setRoles] = useState(DEMO_ROLES)
  const [permOpen, setPermOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null)

  const [leafChecks, setLeafChecks] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {}
    ASSIGN_MENU.forEach((sec) =>
      flattenSectionChildren(sec.children).forEach((c) => {
        m[c.to] = c.to !== '/ai-workflow'
      }),
    )
    return m
  })

  const [ops, setOps] = useState<Record<OpsKey, boolean>>({
    view: true,
    add: true,
    edit: true,
    del: true,
    export: false,
  })
  const [dataScopeRadio, setDataScopeRadio] = useState<DataScope>('dept')

  const toggleLeaf = useCallback((to: string, on: boolean) => {
    setLeafChecks((p) => ({ ...p, [to]: on }))
  }, [])

  const toggleSectionLeaves = useCallback((sec: NavSection, allOn: boolean) => {
    setLeafChecks((prev) => {
      const next = { ...prev }
      flattenSectionChildren(sec.children).forEach((c) => {
        next[c.to] = allOn
      })
      return next
    })
  }, [])

  const sectionFullyOn = useCallback(
    (sec: NavSection) => {
      const leaves = flattenSectionChildren(sec.children)
      return leaves.length > 0 && leaves.every((c) => leafChecks[c.to])
    },
    [leafChecks],
  )

  const sectionPartial = useCallback(
    (sec: NavSection) => {
      const leaves = flattenSectionChildren(sec.children)
      return leaves.some((c) => leafChecks[c.to]) && !sectionFullyOn(sec)
    },
    [leafChecks, sectionFullyOn],
  )

  function openPermissions(r: RoleRow) {
    setEditingRole(r)
    const m: Record<string, boolean> = {}
    ASSIGN_MENU.forEach((sec) =>
      flattenSectionChildren(sec.children).forEach((c) => {
        m[c.to] = !(r.code === 'operation_mgr' && c.to === '/ai-workflow')
      }),
    )
    setLeafChecks(m)
    setOps({
      view: true,
      add: true,
      edit: true,
      del: r.code.includes('mgr') || r.code.includes('sys'),
      export: r.code.includes('sys'),
    })
    setDataScopeRadio('dept')
    setPermOpen(true)
  }

  const menuTreeTitle = useMemo(() => editingRole?.title ?? '角色', [editingRole])

  function deleteRole(r: RoleRow) {
    if (!window.confirm(`确定删除角色【${r.title}】吗？将影响 ${r.users} 名用户映射（演示）。`)) return
    setRoles((prev) => prev.filter((x) => x.id !== r.id))
    toast.show('删除成功（演示）', 'success')
  }

  return (
    <>
      <div className="mb-5 rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider pb-3">
          <h2 className="text-[17px] font-bold text-foreground">角色权限管理</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-[var(--radius-button)] border border-divider px-3 py-2 text-[12px] font-semibold hover:bg-page"
              onClick={() => toast.show('请选择权限模板占位（演示）', 'info')}
            >
              从模板创建
            </button>
            <button
              type="button"
              className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[12px] font-semibold text-white hover:bg-primary-hover"
              onClick={() => toast.show('新增角色占位（演示）', 'info')}
            >
              + 新增角色
            </button>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          菜单树与孵化运营侧边栏对齐；勾选父级自动勾选子菜单。支持操作权限模板与数据范围（演示交互）。
        </p>
      </div>

      <SysTableWrap>
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-divider bg-page text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">角色名称</th>
              <th className="px-4 py-3">角色标识</th>
              <th className="px-4 py-3 tabular-nums">用户数</th>
              <th className="whitespace-nowrap px-4 py-3">创建时间</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3 text-end">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {roles.map((r) => (
              <tr key={r.id} className="hover:bg-page/70">
                <td className="px-4 py-3 font-medium text-foreground">{r.title}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-muted">{r.code}</td>
                <td className="px-4 py-3 tabular-nums text-foreground">{r.users}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{r.created}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                      r.enabled ? 'bg-success/12 text-success' : 'bg-muted/25 text-muted',
                    )}
                  >
                    {r.enabled ? '启用' : '停用'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-end">
                  <button type="button" className="me-3 text-[12px] font-semibold text-primary hover:underline" onClick={() => openPermissions(r)}>
                    权限
                  </button>
                  <button type="button" className="me-3 text-[12px] font-semibold text-foreground hover:underline" onClick={() => toast.show(`编辑 · ${r.title}（演示）`, 'info')}>
                    编辑
                  </button>
                  <button type="button" className="text-[12px] font-semibold text-danger hover:underline" onClick={() => deleteRole(r)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SysTableWrap>

      <Modal
        open={permOpen}
        onClose={() => setPermOpen(false)}
        title={`编辑角色：${menuTreeTitle}`}
        panelClassName="max-w-3xl"
        footer={
          <>
            <button type="button" className="rounded-[var(--radius-button)] border border-divider px-5 py-2 text-[13px]" onClick={() => setPermOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-[var(--radius-button)] bg-primary px-6 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
              onClick={() => {
                toast.show('权限矩阵与安全策略已保存 · 写入审计（演示）', 'success')
                setPermOpen(false)
              }}
            >
              保存
            </button>
          </>
        }
      >
        <div className="max-h-[62vh] space-y-5 overflow-y-auto pr-1 text-[13px]">
          <div>
            <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">菜单权限</h3>
            <p className="mb-2 text-[11px] text-muted">勾选父分组将同步勾选其下二级菜单。</p>
            <div className="space-y-3 rounded-[var(--radius-card)] border border-divider bg-page/50 p-4">
              {ASSIGN_MENU.map((sec) => (
                <div key={sec.key}>
                  <label className="flex cursor-pointer items-center gap-2 font-semibold text-foreground">
                    <SectionCheckbox checked={sectionFullyOn(sec)} indeterminate={sectionPartial(sec)} onChange={(on) => toggleSectionLeaves(sec, on)} />
                    <span aria-hidden className="text-[15px]">
                      {sec.icon}
                    </span>
                    <span>{sec.label}</span>
                  </label>
                  <div className="ms-8 mt-1.5 space-y-1 border-s-2 border-primary/15 ps-3">
                    {flattenSectionChildren(sec.children).map((c) => (
                      <label key={c.to} className="flex cursor-pointer items-center gap-2 py-0.5 text-[12px] text-muted">
                        <input type="checkbox" checked={!!leafChecks[c.to]} onChange={(e) => toggleLeaf(c.to, e.target.checked)} />
                        <span className="text-foreground">{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">操作权限</h3>
            <p className="mb-2 text-[11px] text-muted">演示角色级勾选；正式上线可按菜单逐项覆盖。</p>
            <div className="flex flex-wrap gap-5 rounded-[var(--radius-card)] border border-divider bg-page/40 px-4 py-3 text-[13px]">
              {(
                [
                  ['view', '查看'],
                  ['add', '新增'],
                  ['edit', '编辑'],
                  ['del', '删除'],
                  ['export', '导出'],
                ] as const
              ).map(([k, lab]) => (
                <label key={k} className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={ops[k]} onChange={(e) => setOps((prev) => ({ ...prev, [k]: e.target.checked }))} />
                  <span>{lab}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">数据权限</h3>
            <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-divider bg-page/40 px-4 py-3">
              {(
                [
                  ['self', '仅本人数据'],
                  ['dept', '本部门数据'],
                  ['all', '全部数据'],
                ] as const
              ).map(([id, lab]) => (
                <label key={id} className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="ds" checked={dataScopeRadio === id} onChange={() => setDataScopeRadio(id)} />
                  <span className={dataScopeRadio === id ? 'font-semibold text-primary' : 'text-foreground'}>{lab}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

function SectionCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean
  indeterminate: boolean
  onChange: (on: boolean) => void
}) {
  const refCallback = useCallback((el: HTMLInputElement | null) => {
    if (el) el.indeterminate = indeterminate
  }, [indeterminate])

  return <input ref={refCallback} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
}
