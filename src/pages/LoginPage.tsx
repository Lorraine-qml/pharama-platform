import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { DEMO_PASSWORD, PLATFORM_ADMIN_CREDENTIAL } from '../data/demoAccounts'

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

  const [username, setUsername] = useState(
    () => localStorage.getItem(LAST_ACCOUNT_KEY) ?? PLATFORM_ADMIN_CREDENTIAL.username,
  )
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [error, setError] = useState<string | null>(null)
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const expected = PLATFORM_ADMIN_CREDENTIAL
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
        <p className="mt-2 text-center text-[13px] text-muted">平台管理员账号登录</p>
        <p className="mt-3 rounded-lg border border-primary/20 bg-primary-light/50 px-3 py-2 text-center text-[12px] leading-relaxed text-foreground">
          本平台仅供<strong className="font-semibold">平台管理员</strong>使用，登录后可访问全部运营功能菜单。
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

        <details className="mt-6 rounded-[var(--radius-card)] border border-divider bg-page">
          <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-medium text-foreground outline-none [&::-webkit-details-marker]:hidden">
            <span className="text-muted">▸</span> 演示环境 · 平台管理员账号
          </summary>
          <div className="space-y-3 border-t border-divider px-4 py-4 text-[12px] text-muted">
            <p>
              演示账号 <span className="font-mono font-medium text-primary">{PLATFORM_ADMIN_CREDENTIAL.username}</span>
            </p>
            <p>
              演示口令 <span className="font-mono font-semibold text-primary">{DEMO_PASSWORD}</span>
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
