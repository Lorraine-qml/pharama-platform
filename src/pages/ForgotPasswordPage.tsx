import { Link, Navigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { useToast } from '../components/ToastProvider'

export default function ForgotPasswordPage() {
  const toast = useToast()
  const { user } = useAuth()
  const [contact, setContact] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const v = contact.trim()
    if (!v) {
      toast.show('请输入预留邮箱或手机号', 'warning')
      return
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 500))
    setSubmitting(false)
    toast.show('重置链接 / 验证码已发送（演示），请查收预留邮箱或短信', 'success')
  }

  return (
    <AuthSplitLayout
      footer={
        <p>
          © 2025 园区运营平台 ·{' '}
          <Link to="/login" className="text-primary hover:underline">
            返回登录
          </Link>
        </p>
      }
    >
      <div className="rounded-[var(--radius-panel)] border border-divider bg-surface px-8 py-10 shadow-[0_24px_80px_-28px_rgb(30_109_255/0.22)]">
        <h2 className="text-center text-[17px] font-semibold text-foreground">重置密码</h2>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-muted">
          通过预留邮箱或手机号验证身份后设置新密码（正式环境将接入短信 / 邮件服务）。
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="forgot-contact" className="block text-[13px] font-medium text-foreground">
              邮箱或手机号
            </label>
            <input
              id="forgot-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="mt-2 w-full rounded-[var(--radius-card)] border border-divider bg-page px-4 py-3 text-[14px] outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-[3px] focus:ring-primary/15"
              placeholder="请输入注册时预留的邮箱或手机号"
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-[var(--radius-card)] bg-primary py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_28px_-10px_rgb(30_109_255/0.65)] transition-[opacity,transform] hover:bg-primary-hover enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? '发送中…' : '发送重置指引'}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-muted">
          <Link to="/login" className="font-medium text-primary hover:underline">
            返回登录
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  )
}
