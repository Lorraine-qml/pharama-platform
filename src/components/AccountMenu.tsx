import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { isPathAllowed } from '../auth/routeAccess'
import { ROLE_LABELS, ORG_LABELS } from '../auth/types'
import { useToast } from './ToastProvider'
import { cn } from '../utils/cn'

export function AccountMenu() {
  const toast = useToast()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (!user) return null

  const accountName = ORG_LABELS[user.orgKind]
  const roleLabel = ROLE_LABELS[user.role]
  const initials = roleLabel.replace(/（[^）]*）/g, '').slice(0, 2)

  function exit() {
    logout()
    setOpen(false)
    navigate('/login', { replace: true })
  }

  function profile() {
    if (!user) return
    const profilePath = '/hatch/archive'
    setOpen(false)
    if (isPathAllowed(profilePath, user.role)) navigate(profilePath)
    else toast.show('当前角色暂无「个人资料」入口权限（演示）', 'warning')
  }

  function changePassword() {
    setOpen(false)
    toast.show('修改密码请在正式环境通过预留手机/邮箱验证（演示占位）', 'info')
  }

  function accountManage() {
    if (!user) return
    const p = '/system/users'
    setOpen(false)
    if (isPathAllowed(p, user.role)) navigate(p)
    else toast.show('当前角色暂无「账号管理」权限（演示）', 'warning')
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[min(100vw-10rem,280px)] items-center gap-2.5 rounded-[var(--radius-card)] px-2 py-1.5 text-left outline-none ring-primary transition-colors hover:bg-page focus-visible:ring-2 focus-visible:ring-primary/25"
      >
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white"
        >
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-foreground">{accountName}</span>
          <span className="block truncate text-[12px] text-muted">{roleLabel}</span>
        </span>
        <span aria-hidden className={cn('text-muted transition', open && 'rotate-180')} style={{ fontSize: '10px' }}>
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(100vw-2rem,280px)] rounded-[var(--radius-card)] border border-divider bg-surface py-2 shadow-[var(--shadow-card)]"
        >
          <div className="border-b border-divider px-4 py-3 text-[12px] text-muted">账号菜单</div>
          <button
            role="menuitem"
            type="button"
            className="flex w-full px-4 py-2.5 text-left text-[13px] hover:bg-primary-light hover:text-primary"
            onClick={profile}
          >
            个人资料
          </button>
          <button
            role="menuitem"
            type="button"
            className="flex w-full px-4 py-2.5 text-left text-[13px] hover:bg-primary-light hover:text-primary"
            onClick={changePassword}
          >
            修改密码
          </button>
          <button
            role="menuitem"
            type="button"
            className="flex w-full px-4 py-2.5 text-left text-[13px] hover:bg-primary-light hover:text-primary"
            onClick={accountManage}
          >
            账号管理
          </button>
          <button
            role="menuitem"
            type="button"
            className="flex w-full px-4 py-2.5 text-left text-[13px] text-danger hover:bg-page"
            onClick={exit}
          >
            退出账号
          </button>
        </div>
      ) : null}
    </div>
  )
}
