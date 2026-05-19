import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { useToast } from '../components/ToastProvider'
import { cn } from '../utils/cn'

const IDENTITIES = ['新项目方', '专家', '合作伙伴'] as const

export default function RegisterPage() {
  const toast = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [identity, setIdentity] = useState<(typeof IDENTITIES)[number]>('新项目方')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const acc = account.trim()
    if (!acc) {
      setError('请输入用户名或邮箱作为账号。')
      return
    }
    if (password.length < 6) {
      setError('密码长度至少 6 位。')
      return
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致。')
      return
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    setSubmitting(false)
    toast.show(`已提交注册申请（演示）：${identity} · ${acc}`, 'success')
    navigate('/login', { replace: false })
  }

  return (
    <AuthSplitLayout
      footer={
        <p>
          © 2025 园区运营平台 ·{' '}
          <Link to="/platform-modules" className="text-primary hover:underline">
            核心模块说明
          </Link>
        </p>
      }
    >
      <div className="rounded-[var(--radius-panel)] border border-divider bg-surface px-8 py-10 shadow-[0_24px_80px_-28px_rgb(30_109_255/0.22)]">
        <h2 className="text-center text-[17px] font-semibold text-foreground">创建账号</h2>
        <p className="mt-2 text-center text-[13px] text-muted">供新项目方、专家、合作伙伴自助注册（演示流程）</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="reg-account" className="block text-[13px] font-medium text-foreground">
              账号
            </label>
            <input
              id="reg-account"
              autoComplete="username"
              value={account}
              onChange={(e) => {
                setAccount(e.target.value)
                setError(null)
              }}
              className="mt-2 w-full rounded-[var(--radius-card)] border border-divider bg-page px-4 py-3 text-[14px] outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-[3px] focus:ring-primary/15"
              placeholder="用户名或邮箱"
            />
          </div>
          <div>
            <label htmlFor="reg-pass" className="block text-[13px] font-medium text-foreground">
              密码
            </label>
            <input
              id="reg-pass"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(null)
              }}
              className="mt-2 w-full rounded-[var(--radius-card)] border border-divider bg-page px-4 py-3 text-[14px] outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-[3px] focus:ring-primary/15"
              placeholder="不少于 6 位"
            />
          </div>
          <div>
            <label htmlFor="reg-confirm" className="block text-[13px] font-medium text-foreground">
              确认密码
            </label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                setError(null)
              }}
              className="mt-2 w-full rounded-[var(--radius-card)] border border-divider bg-page px-4 py-3 text-[14px] outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-[3px] focus:ring-primary/15"
              placeholder="再次输入密码"
            />
          </div>

          <fieldset>
            <legend className="text-[13px] font-medium text-foreground">身份类型</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {IDENTITIES.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setIdentity(id)}
                  className={cn(
                    'rounded-[var(--radius-card)] border px-4 py-2 text-[13px] transition-colors',
                    identity === id
                      ? 'border-primary bg-primary-light font-semibold text-primary'
                      : 'border-divider bg-page text-foreground hover:border-primary/40',
                  )}
                >
                  {id}
                </button>
              ))}
            </div>
          </fieldset>

          {error ? (
            <p className="text-[13px] font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-[var(--radius-card)] bg-primary py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_28px_-10px_rgb(30_109_255/0.65)] transition-[opacity,transform] hover:bg-primary-hover enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? '提交中…' : '提交注册'}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-muted">
          已有账号？
          <Link to="/login" className="ml-1 font-medium text-primary hover:underline">
            返回登录
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  )
}
