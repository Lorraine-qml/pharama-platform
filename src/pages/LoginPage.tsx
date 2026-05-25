import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { credentialFor, DEMO_PASSWORD } from '../data/demoAccounts'
import {
  BUSINESS_ROLE_LABELS,
  BUSINESS_ROLE_LOGIN_PRESETS,
  type BusinessRoleId,
} from '../config/businessRoles'
import { ORG_LABELS, ROLE_DESCRIPTIONS, ROLE_LABELS, type OrgKind, type UserRole } from '../auth/types'
import { cn } from '../utils/cn'

const LOGIN_ROLES: UserRole[] = [
  'platform',
  'enterprise-admin',
  'expert',
  'rd',
  'finance',
  'resource-applicant',
  'member',
  'collaborator',
]

const LAST_ACCOUNT_KEY = 'pharma-login-remember-account'

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 11.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM4.5 19.25c0-3.05 3.05-5.5 7.5-5.5s7.5 2.45 7.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 10V7.75A4.25 4.25 0 0 1 12.25 3.5h-.5A4.25 4.25 0 0 1 16 7.75V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | undefined)?.from ?? '/'

  const [orgKind, setOrgKind] = useState<OrgKind>('physical')
  const [role, setRole] = useState<UserRole>('enterprise-admin')
  const [username, setUsername] = useState(
    () => localStorage.getItem(LAST_ACCOUNT_KEY) ?? credentialFor('physical', 'enterprise-admin').username,
  )
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [error, setError] = useState<string | null>(null)
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  function applyCredential(nextOrg: OrgKind, nextRole: UserRole) {
    const c = credentialFor(nextOrg, nextRole)
    setUsername(c.username)
    setPassword(c.password)
    setError(null)
  }

  function selectOrg(id: OrgKind) {
    setOrgKind(id)
    applyCredential(id, role)
  }

  function selectRole(r: UserRole) {
    setRole(r)
    applyCredential(orgKind, r)
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  function applyCurrentCredential() {
    applyCredential(orgKind, role)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const expected = credentialFor(orgKind, role)
    const u = username.trim()
    if (u !== expected.username || password !== expected.password) {
      setError('账号或密码错误，请检查后重试。')
      return
    }
    setSubmitting(true)
    setError(null)
    await new Promise((r) => setTimeout(r, 480))
    try {
      login({ role: expected.role, orgKind: expected.orgKind }, { remember })
      if (remember) localStorage.setItem(LAST_ACCOUNT_KEY, u)
      else localStorage.removeItem(LAST_ACCOUNT_KEY)
      navigate(from && from.startsWith('/') && !from.startsWith('/login') ? from : '/', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  const expectedCred = credentialFor(orgKind, role)

  return (
    <AuthSplitLayout
      footer={
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>© 2025 园区运营平台</span>
          <Link to="/platform-modules" className="text-primary hover:underline">
            核心模块示意图与说明
          </Link>
        </p>
      }
    >
      <div className="rounded-[var(--radius-panel)] border border-divider bg-surface px-8 py-10 shadow-[0_24px_80px_-28px_rgb(30_109_255/0.28)]">
        <h2 className="text-center text-[17px] font-semibold text-foreground">欢迎登录</h2>
        <p className="mt-2 text-center text-[13px] text-muted">仅支持账号（用户名或邮箱）与密码登录</p>
        <p className="mt-3 rounded-lg border border-primary/20 bg-primary-light/50 px-3 py-2 text-center text-[12px] leading-relaxed text-foreground">
          演示环境：登录后侧栏仅展示<strong className="font-semibold">当前业务角色</strong>对应的功能菜单；可在下方切换「入孵用户 / 服务商 / 平台管理员 / 专家」体验不同权限。
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <label htmlFor="login-user" className="w-14 shrink-0 text-[13px] font-medium text-foreground">
              账号
            </label>
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                <UserIcon />
              </span>
              <input
                id="login-user"
                autoComplete="username"
                spellCheck={false}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError(null)
                }}
                className="w-full rounded-[var(--radius-card)] border border-divider bg-page py-3 pe-4 ps-11 text-[14px] text-foreground outline-none ring-primary/0 transition-[box-shadow,border-color] placeholder:text-muted focus:border-primary focus:bg-surface focus:ring-[3px] focus:ring-primary/15"
                placeholder="用户名或邮箱"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <label htmlFor="login-pass" className="w-14 shrink-0 text-[13px] font-medium text-foreground">
              密码
            </label>
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                <LockIcon />
              </span>
              <input
                id="login-pass"
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                className="w-full rounded-[var(--radius-card)] border border-divider bg-page py-3 pe-4 ps-11 text-[14px] text-foreground outline-none ring-primary/0 transition-[box-shadow,border-color] placeholder:text-muted focus:border-primary focus:bg-surface focus:ring-[3px] focus:ring-primary/15"
                placeholder="密码"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-[15px] rounded border-divider text-primary accent-primary focus:ring-primary"
              />
              记住我
            </label>
            <Link to="/forgot-password" className="text-[13px] font-medium text-primary hover:underline">
              忘记密码？
            </Link>
          </div>

          {error ? (
            <p className="text-[13px] font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-[var(--radius-card)] bg-primary py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_28px_-10px_rgb(30_109_255/0.65)] transition-[opacity,transform,background-color] hover:bg-primary-hover enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
          >
            {submitting ? '登录中…' : '登录'}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-muted">
          没有账号？
          <Link to="/register" className="ml-1 font-medium text-primary hover:underline">
            立即注册
          </Link>
        </p>

        <details className="mt-6 rounded-[var(--radius-card)] border border-divider bg-page">
          <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-medium text-foreground outline-none [&::-webkit-details-marker]:hidden">
            <span className="text-muted">▸</span> 演示环境 · 选择登录身份
          </summary>
          <div className="space-y-5 border-t border-divider px-4 py-4">
            <section>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted">业务角色（推荐）</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(Object.keys(BUSINESS_ROLE_LABELS) as BusinessRoleId[]).map((id) => {
                  const preset = BUSINESS_ROLE_LOGIN_PRESETS[id]
                  const sel = orgKind === preset.orgKind && role === preset.role
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setOrgKind(preset.orgKind)
                        setRole(preset.role)
                        applyCredential(preset.orgKind, preset.role)
                      }}
                      className={cn(
                        'rounded-[var(--radius-card)] border px-3 py-2.5 text-left transition-all',
                        sel
                          ? 'border-primary bg-primary-light ring-1 ring-primary/15'
                          : 'border-divider bg-surface hover:border-primary/35',
                      )}
                    >
                      <span className={cn('text-[13px] font-semibold', sel ? 'text-primary' : 'text-foreground')}>
                        {BUSINESS_ROLE_LABELS[id]}
                      </span>
                      <span className="mt-1 block text-[11px] leading-relaxed text-muted">{preset.hint}</span>
                    </button>
                  )
                })}
              </div>
            </section>
            <section>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted">企业形态</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(Object.entries(ORG_LABELS) as [OrgKind, string][]).map(([id, label]) => {
                  const sel = orgKind === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => selectOrg(id)}
                      className={cn(
                        'rounded-[var(--radius-card)] border px-3 py-2.5 text-left text-[13px] transition-all',
                        sel
                          ? 'border-primary bg-primary-light font-semibold text-primary ring-1 ring-primary/15'
                          : 'border-divider bg-surface hover:border-primary/35',
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </section>
            <section>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted">登录角色</h3>
              <div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto pr-1">
                {LOGIN_ROLES.map((r) => {
                  const sel = role === r
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => selectRole(r)}
                      className={cn(
                        'flex w-full flex-col rounded-[var(--radius-card)] border px-4 py-2.5 text-left transition-all',
                        sel
                          ? 'border-primary bg-primary-light ring-1 ring-primary/15'
                          : 'border-divider bg-surface hover:border-primary/35',
                      )}
                    >
                      <span className={cn('text-[13px] font-semibold', sel ? 'text-primary' : 'text-foreground')}>
                        {ROLE_LABELS[r]}
                      </span>
                      <span className="mt-1 text-[11px] leading-relaxed text-muted">{ROLE_DESCRIPTIONS[r]}</span>
                    </button>
                  )
                })}
              </div>
            </section>
            <div className="flex flex-wrap items-center gap-3 border-t border-divider pt-4">
              <button
                type="button"
                onClick={applyCurrentCredential}
                className="rounded-[var(--radius-button)] border border-divider bg-surface px-3 py-2 text-[12px] font-medium hover:border-primary hover:text-primary"
              >
                填入当前演示账号
              </button>
              <span className="text-[11px] text-muted">
                演示口令 <span className="font-mono font-semibold text-primary">{DEMO_PASSWORD}</span>
              </span>
            </div>
            <p className="text-[11px] text-muted">
              当前匹配账号 <span className="font-mono font-medium text-primary">{expectedCred.username}</span>
            </p>
          </div>
        </details>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
          北京生物医药科技发展有限公司 · 演示网关
        </p>
      </div>
    </AuthSplitLayout>
  )
}
