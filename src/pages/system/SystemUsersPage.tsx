import { useCallback, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { SysTableWrap } from './SystemPageChrome'

type UserRecord = {
  id: string
  username: string
  displayName: string
  mobile: string
  email: string
  roleLabel: string
  deptLabel: string
  enabled: boolean
  lastLogin: string
}

const ROLES = ['全部', '运营经理', '招商专员', '项目方管理员', '园区运营', '专家', '合作伙伴', '系统管理员']
const STATUSES_FILTER = ['全部', '启用', '停用']
const DEPTS_FILTER = ['全部', '招商部', '孵化器运营', '风控合规', 'XX生物科技', '专家库']

const BASE: UserRecord[] = [
  { id: '1', username: 'zhangsan', displayName: '张三', mobile: '13800138001', email: 'zs@park.cn', roleLabel: '运营经理', deptLabel: '招商部', enabled: true, lastLogin: '2025-05-15 09:20' },
  { id: '2', username: 'lisi', displayName: '李四', mobile: '13900139002', email: 'ls@corp.com', roleLabel: '项目方管理员', deptLabel: 'XX生物科技', enabled: false, lastLogin: '2025-05-14 08:05' },
  { id: '3', username: 'wangwu', displayName: '王五', mobile: '13700137003', email: 'ww@partner.cn', roleLabel: '合作伙伴', deptLabel: '孵化器运营', enabled: true, lastLogin: '2025-05-13 16:41' },
  { id: '4', username: 'zhaolk', displayName: '赵六', mobile: '13600136004', email: 'zlk@park.cn', roleLabel: '园区运营', deptLabel: '孵化器运营', enabled: true, lastLogin: '2025-05-12 11:00' },
]

function buildDemo36(): UserRecord[] {
  const out: UserRecord[] = [...BASE]
  for (let i = 5; i <= 36; i++) {
    out.push({
      id: String(i),
      username: `user_${i}`,
      displayName: `用户${i}`,
      mobile: `1380000${String(i).padStart(4, '0')}`.slice(0, 11),
      email: `u${i}@demo.cn`,
      roleLabel: ROLES[(i % (ROLES.length - 2)) + 2] ?? '招商专员',
      deptLabel: DEPTS_FILTER[(i % (DEPTS_FILTER.length - 1)) + 1] ?? '招商部',
      enabled: i % 7 !== 0,
      lastLogin: `2025-05-${String((i % 28) + 1).padStart(2, '0')} ${String(i % 20).padStart(2, '0')}:10`,
    })
  }
  return out
}

const ALL_ROWS = buildDemo36()

export default function SystemUsersPage() {
  const toast = useToast()
  const [roleFilter, setRoleFilter] = useState('全部')
  const [statusFilter, setStatusFilter] = useState<'全部' | '启用' | '停用'>('全部')
  const [deptFilter, setDeptFilter] = useState('全部')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [rows, setRows] = useState<UserRecord[]>(ALL_ROWS)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UserRecord | null>(null)

  const [form, setForm] = useState({
    username: '',
    displayName: '',
    mobile: '',
    email: '',
    role: '运营经理',
    dept: '招商部',
    enabled: true,
    password: 'Init@2025!',
    remark: '',
  })

  const [accountErr, setAccountErr] = useState('')
  const [mobileErr, setMobileErr] = useState('')
  const [emailErr, setEmailErr] = useState('')

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (roleFilter !== '全部' && r.roleLabel !== roleFilter) return false
      if (statusFilter !== '全部' && (statusFilter === '启用' ? !r.enabled : r.enabled)) return false
      if (deptFilter !== '全部' && r.deptLabel !== deptFilter) return false
      const q = search.trim().toLowerCase()
      if (q && !`${r.username} ${r.displayName} ${r.mobile}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, roleFilter, statusFilter, deptFilter, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageSafe = Math.min(page, pageCount)
  const pageRows = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize)

  const openCreate = () => {
    setEditing(null)
    setForm({
      username: '',
      displayName: '',
      mobile: '',
      email: '',
      role: '运营经理',
      dept: '招商部',
      enabled: true,
      password: `Tmp${Math.random().toString(36).slice(2, 8)}@1`,
      remark: '',
    })
    setAccountErr('')
    setMobileErr('')
    setEmailErr('')
    setModalOpen(true)
  }

  const openEdit = (u: UserRecord) => {
    setEditing(u)
    setForm({
      username: u.username,
      displayName: u.displayName,
      mobile: u.mobile,
      email: u.email,
      role: u.roleLabel,
      dept: u.deptLabel,
      enabled: u.enabled,
      password: '',
      remark: '',
    })
    setAccountErr('')
    setMobileErr('')
    setEmailErr('')
    setModalOpen(true)
  }

  const validateAccount = useCallback((v: string, excludeId?: string) => {
    if (!/^[\da-z_.-]{4,}$/i.test(v)) return '账号需 4 位以上字母数字 ._- '
    const dup = rows.some((x) => x.username === v && x.id !== excludeId)
    return dup ? '账号已占用，异步校验占位' : ''
  }, [rows])

  const validateMobile = (v: string) => {
    if (!v.trim()) return ''
    return /^1\d{10}$/.test(v) ? '' : '手机号格式不正确'
  }

  const validateEmail = (v: string) => {
    if (!v.trim()) return ''
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : '邮箱格式不正确'
  }

  function submitUser() {
    const a = validateAccount(form.username, editing?.id)
    const m = validateMobile(form.mobile)
    const e = validateEmail(form.email)
    setAccountErr(a)
    setMobileErr(m)
    setEmailErr(e)
    if (a || m || e || !form.displayName.trim()) {
      toast.show('请修正表单必填与格式项', 'warning')
      return
    }

    if (editing) {
      setRows((prev) =>
        prev.map((x) =>
          x.id === editing.id
            ? {
                ...x,
                username: form.username,
                displayName: form.displayName.trim(),
                mobile: form.mobile,
                email: form.email.trim(),
                roleLabel: form.role,
                deptLabel: form.dept,
                enabled: form.enabled,
              }
            : x,
        ),
      )
      toast.show('用户信息已保存，激活邮件（演示占位）已加入队列', 'success')
    } else {
      const next: UserRecord = {
        id: String(Number(rows.at(-1)?.id ?? rows.length) + 1),
        username: form.username,
        displayName: form.displayName.trim(),
        mobile: form.mobile,
        email: form.email.trim(),
        roleLabel: form.role,
        deptLabel: form.dept,
        enabled: form.enabled,
        lastLogin: '—',
      }
      setRows((prev) => [...prev, next])
      toast.show(`已发送账号激活通知（含初始密码）至「${next.email || next.mobile}」（演示）`, 'success')
    }
    setModalOpen(false)
  }

  function deleteUser(u: UserRecord) {
    if (!window.confirm(`确定删除用户【${u.displayName}】吗？删除后不可恢复。`)) return
    setRows((prev) => prev.filter((x) => x.id !== u.id))
    setSelected((s) => {
      const n = new Set(s)
      n.delete(u.id)
      return n
    })
    toast.show('删除成功（演示）', 'success')
  }

  function batchDelete() {
    const list = [...selected]
    if (list.length === 0) return
    if (!window.confirm(`确认批量删除所选 ${list.length} 条用户？删除后不可恢复。`)) return
    setRows((prev) => prev.filter((x) => !selected.has(x.id)))
    setSelected(new Set())
    toast.show(`已批量删除 ${list.length} 条记录（演示）`, 'warning')
  }

  function toggleAllPage(checked: boolean) {
    setSelected((s) => {
      const next = new Set(s)
      if (checked) pageRows.forEach((r) => next.add(r.id))
      else pageRows.forEach((r) => next.delete(r.id))
      return next
    })
  }

  function toggleEnable(u: UserRecord) {
    setRows((prev) => prev.map((x) => (x.id === u.id ? { ...x, enabled: !x.enabled } : x)))
    toast.show(`账号「${u.username}」已${u.enabled ? '停用' : '启用'}`, 'success')
  }

  return (
    <>
      <div className="mb-5 rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider pb-3">
          <h2 className="text-[17px] font-bold text-foreground">用户管理</h2>
          <div className="flex flex-wrap gap-2">
            {selected.size > 1 ? (
              <button
                type="button"
                className="rounded-[var(--radius-button)] border border-danger/50 px-3 py-2 text-[12px] font-semibold text-danger hover:bg-danger/5"
                onClick={batchDelete}
              >
                批量删除（{selected.size}）
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-[var(--radius-button)] border border-divider px-3 py-2 text-[12px] font-semibold hover:bg-page"
              onClick={() => toast.show('请先下载导入模板 Excel（演示）', 'info')}
            >
              导入
            </button>
            <button
              type="button"
              className="rounded-[var(--radius-button)] border border-divider px-3 py-2 text-[12px] font-semibold hover:bg-page"
              onClick={() => toast.show('已按筛选条件导出 Excel（演示）', 'success')}
            >
              导出
            </button>
            <button
              type="button"
              className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-primary-hover"
              onClick={openCreate}
            >
              + 新增用户
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3 text-[13px]">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted">角色</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-[var(--radius-card)] border border-divider px-3 py-2 outline-none focus:border-primary"
            >
              {ROLES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted">状态</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-[var(--radius-card)] border border-divider px-3 py-2 outline-none focus:border-primary"
            >
              {STATUSES_FILTER.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted">部门</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-[var(--radius-card)] border border-divider px-3 py-2 outline-none focus:border-primary"
            >
              {DEPTS_FILTER.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 sm:max-w-md">
            <span className="text-[11px] font-semibold text-muted">搜索</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="搜索姓名 / 手机 / 账号"
              className="rounded-[var(--radius-card)] border border-divider px-3 py-2 outline-none focus:border-primary"
            />
          </label>
        </div>
      </div>

      <SysTableWrap>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-[13px]">
            <thead className="border-b border-divider bg-page text-[11px] font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="w-12 px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label="本页全选"
                    checked={pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))}
                    onChange={(e) => toggleAllPage(e.target.checked)}
                  />
                </th>
                <th className="w-14 px-2 py-3">头像</th>
                <th className="px-3 py-3">用户名</th>
                <th className="px-3 py-3">姓名</th>
                <th className="px-3 py-3">角色</th>
                <th className="px-3 py-3">部门</th>
                <th className="px-3 py-3">状态</th>
                <th className="px-3 py-3">最后登录</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {pageRows.map((r) => (
                <tr key={r.id} className="hover:bg-page/80">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={(e) => {
                        setSelected((prev) => {
                          const next = new Set(prev)
                          if (e.target.checked) next.add(r.id)
                          else next.delete(r.id)
                          return next
                        })
                      }}
                    />
                  </td>
                  <td className="px-2 py-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary/12 text-[12px] font-bold text-primary">
                      {r.displayName.slice(0, 1)}
                    </span>
                  </td>
                  <td className="font-mono text-[12px] text-foreground">{r.username}</td>
                  <td className="font-medium text-foreground">{r.displayName}</td>
                  <td className="text-muted">{r.roleLabel}</td>
                  <td className="text-muted">{r.deptLabel}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={r.enabled}
                      onClick={() => toggleEnable(r)}
                      className={cn(
                        'relative h-6 w-11 rounded-full transition-colors',
                        r.enabled ? 'bg-primary' : 'bg-divider',
                      )}
                      title={r.enabled ? '点击停用' : '点击启用'}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]',
                          r.enabled ? 'left-5' : 'left-0.5',
                        )}
                      />
                    </button>
                  </td>
                  <td className="whitespace-nowrap text-muted">{r.lastLogin}</td>
                  <td className="px-4 py-3 text-end whitespace-nowrap">
                    <button type="button" className="me-3 text-[12px] font-semibold text-primary hover:underline" onClick={() => openEdit(r)}>
                      编辑
                    </button>
                    <button type="button" className="text-[12px] font-semibold text-danger hover:underline" onClick={() => deleteUser(r)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider px-4 py-3 text-[12px] text-muted">
          <span>共 {filtered.length} 条</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={pageSafe <= 1}
              className="rounded border border-divider px-2 py-1 disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              &lt;
            </button>
            <span className="tabular-nums text-foreground">
              {pageSafe} / {pageCount}
            </span>
            <button
              type="button"
              disabled={pageSafe >= pageCount}
              className="rounded border border-divider px-2 py-1 disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              &gt;
            </button>
            <label className="ms-2 flex items-center gap-2 whitespace-nowrap">
              每页
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="rounded border border-divider px-2 py-1"
              >
                {[10, 20, 50, 100].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              条
            </label>
          </div>
        </div>
      </SysTableWrap>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `编辑用户：${editing.displayName}` : '新增用户'}
        panelClassName="max-w-xl"
        footer={
          <>
            <button
              type="button"
              className="rounded-[var(--radius-button)] border border-divider px-5 py-2 text-[13px]"
              onClick={() => setModalOpen(false)}
            >
              取消
            </button>
            <button type="button" className="rounded-[var(--radius-button)] bg-primary px-6 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover" onClick={submitUser}>
              确定
            </button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="text-[11px] font-semibold text-muted">账号（必填）</label>
            <input
              disabled={Boolean(editing)}
              value={form.username}
              onChange={(e) => {
                setForm((f) => ({ ...f, username: e.target.value }))
                const err = validateAccount(e.target.value, editing?.id)
                setTimeout(() => setAccountErr(err), 0)
              }}
              className={cn(
                'mt-1 w-full rounded-[var(--radius-card)] border px-3 py-2 outline-none focus:border-primary',
                accountErr ? 'border-danger' : 'border-divider',
              )}
            />
            {accountErr ? <p className="mt-1 text-[11px] text-danger">{accountErr}</p> : (
              <p className="mt-1 text-[11px] text-muted">{editing ? '编辑时锁定账号占位' : '实时异步校验占位'}</p>
            )}
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted">姓名（必填）</label>
            <input
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-card)] border border-divider px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold text-muted">手机号</label>
              <input
                value={form.mobile}
                onBlur={() => setMobileErr(validateMobile(form.mobile))}
                onChange={(e) => {
                  setForm((f) => ({ ...f, mobile: e.target.value }))
                  setMobileErr(validateMobile(e.target.value))
                }}
                className={cn('mt-1 w-full rounded-[var(--radius-card)] border px-3 py-2 outline-none focus:border-primary', mobileErr ? 'border-danger' : 'border-divider')}
              />
              {mobileErr ? <p className="mt-1 text-[11px] text-danger">{mobileErr}</p> : null}
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted">邮箱</label>
              <input
                value={form.email}
                onBlur={() => setEmailErr(validateEmail(form.email))}
                onChange={(e) => {
                  setForm((f) => ({ ...f, email: e.target.value }))
                  setEmailErr(validateEmail(e.target.value))
                }}
                className={cn('mt-1 w-full rounded-[var(--radius-card)] border px-3 py-2 outline-none focus:border-primary', emailErr ? 'border-danger' : 'border-divider')}
              />
              {emailErr ? <p className="mt-1 text-[11px] text-danger">{emailErr}</p> : null}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold text-muted">角色</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="mt-1 w-full rounded-[var(--radius-card)] border border-divider px-3 py-2">
                {ROLES.filter((_, i) => i >= 2).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted">部门</label>
              <select value={form.dept} onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))} className="mt-1 w-full rounded-[var(--radius-card)] border border-divider px-3 py-2">
                {DEPTS_FILTER.filter((d) => d !== '全部').map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input type="radio" checked={form.enabled} onChange={() => setForm((f) => ({ ...f, enabled: true }))} />
              <span className={form.enabled ? 'font-semibold text-foreground' : ''}>● 启用</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={!form.enabled} onChange={() => setForm((f) => ({ ...f, enabled: false }))} />
              <span className={!form.enabled ? 'font-semibold text-foreground' : ''}>○ 停用</span>
            </label>
          </div>
          {!editing ? (
            <div>
              <label className="text-[11px] font-semibold text-muted">初始密码（可随机生成）</label>
              <input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="mt-1 w-full rounded-[var(--radius-card)] border border-divider px-3 py-2 font-mono text-[12px]" />
            </div>
          ) : null}
          <div>
            <label className="text-[11px] font-semibold text-muted">备注</label>
            <input value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} className="mt-1 w-full rounded-[var(--radius-card)] border border-divider px-3 py-2" />
          </div>
        </div>
      </Modal>
    </>
  )
}
